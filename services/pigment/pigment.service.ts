
import {
    PigmentRequest,
    PigmentResponse,
    StageOutputs,
    DebugMasks,
    PigmentMetrics,
    ValidationMode,
    PoseChangeConfig
} from './pigment.types';
import { generateIdempotencyKey, deriveSeedFromKey } from './pigment.utils';
import {
    SegmentationResult,
    composeCleanupMask,
    composePropMask,
    composeRecolorMask
} from './mask.service';
import { generateContentSafe, fileToPart, GEMINI_MODELS } from '../geminiClient';
import { fileToBase64, urlToBase64 } from '../geminiService';

// --------------------------------------------------------
// 0. Helpers & Mocks
// --------------------------------------------------------

// Mock Segmentation (Placeholder until real model integration)
const mockSegmentation = async (imageBase64: string): Promise<SegmentationResult> => {
    // Ideally call detailed segmentation API here. 
    // For MVP/Structure, we return the base image as "mask" to prevent null errors, 
    // but in reality these should be binary masks.
    return {
        mask_person: imageBase64,
        mask_garment: imageBase64,
        mask_skin: "", // Empty implied
        mask_hand: "",
        mask_hair_face: "",
        mask_bg: imageBase64,
        mask_prop: ""
    };
};

const DUMMY_METRICS: PigmentMetrics = {
    background_shift: 0.0,
    skin_delta_e: 0.0,
    garment_ssim: 1.0
};

// --------------------------------------------------------
// 1. Pipeline Orchestrator
// --------------------------------------------------------

export const runPigmentPipeline = async (request: PigmentRequest): Promise<PigmentResponse> => {
    const warnings: string[] = [];
    const stage_outputs: StageOutputs = {};
    const debug_masks: DebugMasks = {};

    // 1. Idempotency & Seed
    const idempotency_key = generateIdempotencyKey(request);
    const seed = deriveSeedFromKey(idempotency_key);

    console.log(`[PigmentStudio] Starting Run: ${idempotency_key} (Seed: ${seed})`);

    try {
        // 2. Load Source
        let currentImage = request.source_image_data || (await urlToBase64(request.source_image_id));
        if (currentImage.startsWith('data:')) currentImage = currentImage.split(',')[1]; // Ensure raw base64

        // 3. Step 1: Segmentation (Mandatory)
        // In SRS v1.3.9, Segmentation is step 1.
        console.log(`[PigmentStudio] Step 1: Segmentation`);
        const segmentation = await mockSegmentation(`data:image/jpeg;base64,${currentImage}`);
        stage_outputs.preview_segmentation = segmentation.mask_garment; // Just for preview

        // 4. Step 2: Cleanup & Prop Removal (Conditional)
        if (request.pipeline_config.cleanup.enabled || request.pipeline_config.prop_remove.enabled) {
            console.log(`[PigmentStudio] Step 2: Cleanup/Prop`);

            // Calc Masks
            // Using 1024 as generic short edge size for now
            const maskCleanup = await composeCleanupMask(segmentation, 1024);
            const maskProp = await composePropMask(segmentation, 1024);

            debug_masks.mask_cleanup = maskCleanup;
            debug_masks.mask_prop_final = maskProp;

            // TODO: Execute Inpainting with these masks
            // For MVP, we skip actual pixel processing here since masks are mocks
            // stage_outputs.preview_cleanup = ...;
        }

        // 5. Step 3: Pose Change (Optional, Rollback-protected)
        if (request.pipeline_config.pose_change.enabled) {
            console.log(`[PigmentStudio] Step 3: Pose Change`);
            const poseConfig = request.pipeline_config.pose_change;

            try {
                currentImage = await executePoseChange(currentImage, poseConfig, seed);
                stage_outputs.preview_pose = `data:image/jpeg;base64,${currentImage}`;
            } catch (poseError) {
                console.warn("Pose Change Failed. Rolling back.", poseError);
                warnings.push("POSE_CHANGE_FALLBACK_TO_ORIGINAL");
                // Rollback: Keep currentImage as is (from cleanup step)
            }
        }

        // 6. Step 4: Recolor (Core)
        const recolorConfig = request.pipeline_config.recolor;
        console.log(`[PigmentStudio] Step 4: Recolor (${recolorConfig.target_category})`);

        // Calc Recolor Mask
        // Should recalculate segmentation if Pose Changed? 
        // SRS doesn't explicitly mandate re-segmentation, but practically needed.
        // For compliance, we assume we use the (possibly warped) image and "Approximated" masks
        // or re-run segmentation if pose changed successfully.

        const maskRecolor = await composeRecolorMask(segmentation, debug_masks.mask_prop_final || "");
        debug_masks.mask_final_recolor = maskRecolor;

        currentImage = await executeRecolor(currentImage, recolorConfig, maskRecolor, seed);
        stage_outputs.preview_recolor = `data:image/jpeg;base64,${currentImage}`;

        // 7. Validation (Metrics)
        // Implement Delta E check here.
        // if (metrics.skin_delta_e > 3.0 && strict) throw Error("Skin limit");

        return {
            status: warnings.length > 0 ? 'partial_success' : 'success',
            data: {
                final_image_url: `data:image/jpeg;base64,${currentImage}`,
                stage_outputs,
                debug_masks: request.output_options.return_debug_masks ? debug_masks : undefined,
                metrics: DUMMY_METRICS,
                warnings,
                idempotency_key,
                seed
            }
        };

    } catch (e: any) {
        console.error("[PigmentStudio] Fatal Error:", e);
        return {
            status: 'fail',
            data: {
                final_image_url: "",
                warnings: [...warnings, "FATAL_ERROR"],
                idempotency_key,
                seed
            },
            error: e.message
        };
    }
};


// --------------------------------------------------------
// 2. Executors (AI Wrappers)
// --------------------------------------------------------

async function executePoseChange(
    base64Image: string,
    config: PoseChangeConfig,
    seed: number
): Promise<string> {
    // Call Gemini 1.5 Pro / Edit Model
    const prompt = `
    [Pigment Studio] POSE CHANGE
    PRESET: ${config.preset}
    STRICT SAFETY: ${config.strict_safety}
    SEED: ${seed}
    
    Maintain outfit details perfectly. Only change body posture.
    `;

    // For now, reuse existing gen function
    const result = await generateContentSafe(prompt, [fileToPart(`data:image/jpeg;base64,${base64Image}`)], {
        taskType: 'EDIT',
        model: GEMINI_MODELS.EDIT_STABLE
    });

    if (result.inlineData) return result.inlineData.data;
    throw new Error("Pose Change AI returned no data");
}

async function executeRecolor(
    base64Image: string,
    config: any,
    maskBase64: string,
    seed: number
): Promise<string> {
    const prompt = `
    [Pigment Studio] RECOLOR
    TARGET: ${config.target_category}
    COLOR: ${config.color_source.value}
    TEXTURE LOCK: ${config.texture_lock_strength || 0.8}
    SEED: ${seed}
    
    Strictly recolor only the target area. Preserve original texture/lighting (Luminance).
    `;

    const parts = [fileToPart(`data:image/jpeg;base64,${base64Image}`)];
    // If mask is valid base64 (not empty), add it
    // if (maskBase64 && maskBase64.length > 100) parts.push(fileToPart(maskBase64)); 

    const result = await generateContentSafe(prompt, parts, {
        taskType: 'EDIT',
        model: GEMINI_MODELS.EDIT_STABLE
    });

    if (result.inlineData) return result.inlineData.data;
    throw new Error("Recolor AI returned no data");
}
