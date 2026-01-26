
import { CVFConfig, CVFPoseId } from './types';
import { generateContentSafe } from '../geminiClient';

// SRS v2.3 Renderer
// Handles "Prompt Construction" for Recolor + Micro-Pulse

interface RenderInput {
    pose: CVFPoseId;
    baseImage: string;
    colorConfig: { label: string, hex_override?: string, image_id?: string } | null;
    options: CVFConfig;
    seed?: number; // Job Isolation Seed
    retryMode?: boolean; // SRS 3.3 Retry
}

interface RenderResult {
    status: 'success' | 'failed';
    url: string;
    error?: string;
    relative_yaw?: number;
}

export const renderTask = async (input: RenderInput): Promise<RenderResult> => {
    const { pose, baseImage, colorConfig, options } = input;

    // 1. Construct Prompt
    let prompt = "";

    // A. Pose instruction (Micro-Pose only)
    if (pose === 'FRONT') {
        prompt += "Keep the pose facing front (0 degrees). ";
    } else if (pose === 'LEFT_15') {
        prompt += "Micro-rotate the body slightly to the LEFT (approx 15 degrees). ";
    } else {
        // Should not happen if Pipeline enforces Left-For-Right, but safe fallback
        prompt += "Micro-rotate body 15 degrees. ";
    }

    // B. Color/Recolor Instruction
    if (colorConfig) {
        // Recolor Mode
        const colorName = colorConfig.label;
        const hex = colorConfig.hex_override ? `(Hex: ${colorConfig.hex_override})` : "";
        prompt += `Change the outfit color to ${colorName} ${hex}. `;
        prompt += "**CRITICAL: Keep the background and face/hair exactly the same. Only change the garment color.** ";
    } else {
        // Original Mode
        prompt += "Keep the original outfit color and texture exactly as is. ";
    }

    prompt += "Strictly maintain the original background pixel-for-pixel. Do NOT regenerate the background. ";
    prompt += "ZERO-DRIFT MODE: Ensure the garment texture and pattern remains exactly identical, only shifting the hue/tone. ";
    prompt += "Output must be high quality, photorealistic.";

    try {
        const response = await generateContentSafe(prompt, [
            { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/jpeg' } }
        ], {
            taskType: 'CREATION',
            model: 'models/gemini-1.5-pro-002', // Use Stable Pro
            config: {
                generationConfig: {
                    temperature: input.retryMode ? 0.1 : 0.2 // Lowered for fidelity on retry
                    // seed: input.seed // Gemini API might not support direct seed in this client wrapper yet, but logic is ready
                }
            }
        });

        if (response.inlineData) {
            return {
                status: 'success',
                url: `data:${response.inlineData.mimeType};base64,${response.inlineData.data}`,
                relative_yaw: pose === 'FRONT' ? 0 : 15
            };
        } else {
            throw new Error("No image generated");
        }
    } catch (e: any) {
        return { status: 'failed', url: '', error: e.message };
    }
};
