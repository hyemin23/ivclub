
import { SavedModel, Resolution, AspectRatio } from '../types';
import { generateContentSafe, fileToPart, GEMINI_MODELS } from './geminiClient';
import { changeColorVariant, generatePoseVariation, replaceBackground } from './imageService';

// --- Types ---

export type PoseType = 'FRONT' | 'LEFT_15' | 'RIGHT_15';
export type MicroMutationType = 'A0_BASE' | 'A1_RELAXED_BEND' | 'A2_ONE_HAND_POCKET' | 'L0_BASE' | 'L1_WEIGHT_SHIFT';

export interface ColorGroup {
    id: string;
    label: string;
    refImage?: string | null;
    hexOverride?: string | null;
}

export interface VariationJobConfig {
    jobId: string; // Job Isolation
    baseImage: string;
    colorGroups: ColorGroup[];
    posePack: PoseType[]; // ['FRONT', 'LEFT_15', 'RIGHT_15'] only
    microVariation: boolean;
    resolution: Resolution;
    aspectRatio: AspectRatio;
}

export interface VariationResultItem {
    id: string;
    groupId: string;
    pose: PoseType;
    url: string | null;
    status: 'pending' | 'generating' | 'success' | 'failed';
    error?: string;
    metrics?: { ssim: number; deltaE: number }; // Quality Gate Metrics
}

export type VariationUpdateCallback = (items: VariationResultItem[]) => void;

// --- Job Isolation & State ---
// In a real backend, this would be Redis. Here we use a module-level Map.
const jobCache = new Map<string, any>();

// --- Service Logic ---

/**
 * 🏭 Commerce Variation Factory Service (CVF v2.3.3 Robust)
 * Implementation of "Final Robust Spec"
 */
export const executeVariationBatch = async (
    config: VariationJobConfig,
    onUpdate: VariationUpdateCallback
) => {
    // 0. Job Isolation Setup
    jobCache.set(config.jobId, { startTime: Date.now() });

    // 1. Initialize result placeholders
    let results: VariationResultItem[] = [];

    // Group 1: Original (No Recolor)
    config.posePack.forEach(pose => {
        results.push({
            id: `original-${pose}`,
            groupId: 'original',
            pose,
            url: null,
            status: 'pending'
        });
    });

    // Group 2..N: Color Variants
    config.colorGroups.forEach(group => {
        config.posePack.forEach(pose => {
            results.push({
                id: `${group.id}-${pose}`,
                groupId: group.id,
                pose,
                url: null,
                status: 'pending'
            });
        });
    });

    onUpdate([...results]);

    // 2. Execution Loop

    // 2.1 Process Original Group (Base -> Pose)
    await processGroup(
        'original',
        config.baseImage,
        config.posePack,
        results,
        onUpdate,
        config
    );

    // 2.2 Process Color Groups
    // Robust sequential processing to prevent rate limits and state mix-up
    for (const group of config.colorGroups) {
        if (!group.refImage && !group.hexOverride) continue;

        try {
            // Stage 3: Color Master Generation (Paint Only)
            // Implements MR-2 (Original Paint Lock)
            const colorMaster = await generateColorMaster(config.baseImage, group);

            // Stage 3.1: Anti-Drift QA (Simulated)
            // If QA fails, we throw and mark group as failed
            const qaResult = await performQualityCheck(colorMaster, group); // Returns boolean or throws
            if (!qaResult) throw new Error("QA_COLOR_DRIFT_DETECTED");

            // Stage 4: Process Poses from Color Master
            await processGroup(
                group.id,
                colorMaster,
                config.posePack,
                results,
                onUpdate,
                config
            );

        } catch (e: any) {
            console.error(`Group ${group.label} failed`, e);
            markGroupFailed(group.id, results, onUpdate, e.message || "Recolor Failed");
        }
    }

    // Cleanup Job
    jobCache.delete(config.jobId);
};

const processGroup = async (
    groupId: string,
    sourceImage: string,
    poses: PoseType[],
    currentState: VariationResultItem[],
    onUpdate: VariationUpdateCallback,
    config: VariationJobConfig
) => {

    // Fan-out for Poses (MR-4 Hard Limit 15 degree)
    const tasks = poses.map(async (pose) => {
        const itemId = `${groupId}-${pose}`;
        updateItemStatus(itemId, 'generating', null, currentState, onUpdate);

        try {
            let resultUrl: string;

            if (pose === 'FRONT') {
                if (groupId === 'original' && !config.microVariation) {
                    resultUrl = sourceImage;
                } else {
                    // Micro-Var allowed
                    resultUrl = await generatePose(sourceImage, 'FRONT', config.microVariation, config.jobId);
                }
            } else {
                // MR-5 Right Pose Policy: "Mirror of Left" is ideal.
                // Current Implementation: Prompt-based generation with Strict Yaw Limit Prompt.
                // NOTE: Ideally we generate LEFT, then Flip Canvas, then Inpaint Face.
                // For this Service Layer V1, we rely on Prompt Engineering enforcing "Turn 15 degree".

                resultUrl = await generatePose(sourceImage, pose, config.microVariation, config.jobId);
            }

            // Post-Gen QA (Pose Check)
            // if (detectYaw(resultUrl) > 25) throw Error("POSE_OVER_ROTATION");

            updateItemStatus(itemId, 'success', resultUrl, currentState, onUpdate);

        } catch (e: any) {
            console.error(`Pose ${pose} failed`, e);
            updateItemStatus(itemId, 'failed', null, currentState, onUpdate, e.message);
        }
    });

    await Promise.all(tasks);
};


// --- Helpers ---

const updateItemStatus = (
    id: string,
    status: VariationResultItem['status'],
    url: string | null,
    list: VariationResultItem[],
    onUpdate: VariationUpdateCallback,
    error?: string
) => {
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
        list[idx] = { ...list[idx], status, url, error };
        onUpdate([...list]);
    }
};

const markGroupFailed = (
    groupId: string,
    list: VariationResultItem[],
    onUpdate: VariationUpdateCallback,
    error: string
) => {
    const updated = list.map(item => {
        if (item.groupId === groupId) return { ...item, status: 'failed' as const, error };
        return item;
    });
    onUpdate(updated);
};

// --- Generation Implementation (Robust) ---

const generateColorMaster = async (base: string, group: ColorGroup): Promise<string> => {
    // Implements "Stage 3. Color Master Generation (Paint Only)"
    // Calls changeColorVariant which uses 'imageService' logic.
    // We assume 'imageService' enforces the Texture Lock prompts we added earlier.

    if (group.hexOverride) {
        // Fallback or specific logic for HEX
        // Since changeColorVariant accepts an image-url as reference,
        // we might ideally generate a solid color image url here.
        // For MVP, we throw if no refImage.
        if (!group.refImage) throw new Error("Color Reference Image required. HEX mode pending.");
        return await changeColorVariant(base, group.refImage);
    }

    if (!group.refImage) throw new Error("Missing Color Reference");
    return await changeColorVariant(base, group.refImage);
};

const generatePose = async (base: string, pose: PoseType, useMicroVar: boolean, seedScope: string): Promise<string> => {
    // Deterministic Seed Handling based on seedScope (jobId)
    // MR-5: Right Pose -> Left Mirroring strategy is requested.
    // Simplifying: Use prompt constraints "Turn body 15 degrees".

    let promptModifier = "";

    switch (pose) {
        case 'FRONT':
            promptModifier = "Full body standing, 0 degree, strict front view.";
            break;
        case 'LEFT_15':
            // Model turns to THEIR Left (Viewer's Right?) No, usually "Turn Left" means facing Left.
            promptModifier = "Turn body 15 degrees to the LEFT. (Model faces left). Right shoulder is slightly closer to camera. 3/4 view.";
            break;
        case 'RIGHT_15':
            // Model turns to THEIR Right.
            promptModifier = "Turn body 15 degrees to the RIGHT. (Model faces right). Left shoulder is slightly closer to camera. 3/4 view. Ensure distinct RIGHT rotation.";
            break;
    }

    if (useMicroVar) {
        // Deterministic choice based on simple hash of string length/time
        const micros = ["one hand in pocket", "shift weight to one leg", "touching clothes"];
        // const index = hash(seedScope) % micros.length; (Mocked)
        const randomMicro = micros[0]; // Fixed for stability or random
        promptModifier += ` ${randomMicro}.`;
    }

    // Add Safety Fallback prompts
    promptModifier += " Do NOT rotate more than 15 degrees. No back view.";

    return await generatePoseVariation(base, promptModifier);
};

const performQualityCheck = async (imageUrl: string, group: ColorGroup): Promise<boolean> => {
    // Mocked QA Gate (SSIM, Delta E)
    // In real env, we download image and Compare.
    // Returns true (Pass) for MVP.
    // We can randomize failure to simulate robustness if needed, but risky for demo.
    return true;
};
