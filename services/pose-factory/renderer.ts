
import { CVFConfig, CVFPoseId } from './types';
import { generateContentSafe } from '../geminiClient';

// SRS v2.3 Renderer
// Handles "Prompt Construction" for Recolor + Micro-Pulse

// SRS v2.3 Renderer
// Handles "Prompt Construction" for Recolor + Micro-Pulse

interface RenderInput {
    pose: CVFPoseId;
    baseImage: string;
    colorConfig: {
        label: string;
        hex_override?: string;
        image_id?: string;
        mode?: 'auto' | 'solid_paint' | 'texture_transfer';
    } | null;
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
    const inputParts: any[] = [
        { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/jpeg' } }
    ];

    // A. Pose instruction (Micro-Pose only)
    if (pose === 'FRONT') {
        prompt += "Keep the pose facing front (0 degrees). ";
    } else if (pose === 'LEFT_15') {
        prompt += "Micro-rotate the body slightly to the LEFT (approx 15 degrees). ";
    } else {
        prompt += "Micro-rotate body 15 degrees. ";
    }

    // B. Color/Recolor Instruction (Dual Path)
    if (colorConfig) {
        const mode = colorConfig.mode || 'solid_paint'; // Default to Solid
        const colorName = colorConfig.label;

        if (mode === 'texture_transfer' && colorConfig.image_id) {
            // [Path B: Texture Transfer]
            console.log(`[Renderer] Texture Transfer Mode for ${colorName}`);

            // Add Reference Image Part
            // Assuming image_id is a Data URI or URL that geminiClient handles or we need to fetch.
            // For now, let's assume image_id IS the data (Data URI) or accessible path. 
            // The pipeline 'normalizeInput' drops master_id, but variant inputs are passed.
            // 'input.variant_group.color_references' has 'image_id'.
            // In 'pipeline.ts', 'loadImage' handled paths. But here we are in 'renderTask'.
            // Should prompt contain the reference image? Yes.

            // We need to ensure logic to load this image if it's a URL.
            // Since this is a synchronous-looking async function and 'pipeline.ts' loaded buffers, 
            // ideally 'pipeline.ts' should have passed the BUFFER or DATA URI of the color ref.
            // But 'RenderInput' takes 'image_id' string.
            // We will assume 'image_id' is a Base64 string for this implementation context 
            // (since we used 'imageActions' to preprocess it to base64).

            const refImagePart = { inlineData: { data: colorConfig.image_id.split(',')[1], mimeType: 'image/png' } };
            inputParts.push(refImagePart);

            prompt += `[TEXTURE TRANSFER TASK]\n`;
            prompt += `Target: Apply the pattern, material, and texture from the "Reference Image" onto the garment of the model in the "Base Image".\n`;
            prompt += `Instructions:\n`;
            prompt += `1. **Texture Lock:** Transfer the knit/check/pattern details exactly from the Reference Image.\n`;
            prompt += `2. **Geometry Lock:** Do NOT change the shape of the garment. Keep all original folds, wrinkles, and shadows of the Base Image.\n`;
            prompt += `3. **Lighting Lock:** The lighting on the new texture must match the original Base Image.\n`;
        } else {
            // [Path A: Solid Paint]
            const hex = colorConfig.hex_override ? `(Hex: ${colorConfig.hex_override})` : "";
            prompt += `Change the outfit color to ${colorName} ${hex}. `;
            prompt += "**CRITICAL: Keep the background and face/hair exactly the same. Only change the garment color.** ";
        }
    } else {
        // Original Mode
        prompt += "Keep the original outfit color and texture exactly as is. ";
    }

    prompt += "Strictly maintain the original background pixel-for-pixel. Do NOT regenerate the background. ";
    prompt += "Output must be high quality, photorealistic.";

    try {
        const response = await generateContentSafe(prompt, inputParts, {
            taskType: 'CREATION',
            model: 'models/gemini-1.5-pro-002', // Use Stable Pro
            config: {
                generationConfig: {
                    temperature: input.retryMode ? 0.1 : 0.2, // Lowered for fidelity on retry
                    ...options.generationConfig // Merge extra config like transfer_strength if API supports
                    // Note: 'transfer_strength' is a logical concept here, controlled by prompt intensity
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
