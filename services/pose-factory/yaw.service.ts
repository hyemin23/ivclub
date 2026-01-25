
import { generateContentSafe, GEMINI_MODELS } from '../geminiClient';
import { fileToPart } from '../geminiClient';

// SRS 2. FR-P0-3 Yaw Calibration

export interface BaseYawEstimation {
    base_yaw_deg: number;
    confidence: number;
    source: 'keypoints' | 'heuristic' | 'manual' | 'ai_estimation';
}

/**
 * Estimates the base yaw of a mannequin/model in the input image.
 * Uses Gemini Vision logic since we lack a rigorous Keypoint model in this env.
 */
export const estimateBaseYaw = async (imageBase64: string): Promise<BaseYawEstimation> => {
    try {
        const prompt = `
        Analyze the rotation angle (yaw) of the person/mannequin in this image.
        Center (Front) is 0 degrees.
        Left turn is negative (e.g., -30).
        Right turn is positive (e.g., +30).
        
        Estimate the angle in degrees.
        Return JSON: { "angle": number, "confidence": number (0.0-1.0) }
        `;

        // Use Logic/Vision model (Gemini 1.5 Pro/Flash)
        const response = await generateContentSafe(prompt, [{ inlineData: { data: imageBase64, mimeType: "image/jpeg" } }], {
            model: "gemini-1.5-flash", // Fast estimation
            taskType: 'TEXT',
            config: { responseMimeType: "application/json" }
        });

        const json = JSON.parse(response.text || "{}");
        const angle = typeof json.angle === 'number' ? json.angle : 0;
        const confidence = typeof json.confidence === 'number' ? json.confidence : 0.5;

        return {
            base_yaw_deg: angle,
            confidence: confidence,
            source: 'ai_estimation'
        };

    } catch (e) {
        console.warn("Yaw estimation failed, defaulting to 0", e);
        return { base_yaw_deg: 0, confidence: 0, source: 'manual' }; // Default fallback
    }
};

/**
 * Calculates the relative yaw needed to achieve the target yaw.
 * Formula: relative = target - base
 */
export const calculateRelativeYaw = (baseYaw: number, targetYaw: number, clampDeg: number = 65): { relative_yaw: number, is_clamped: boolean } => {
    let relative = targetYaw - baseYaw;
    let clamped = false;

    // SRS Clamp Rule
    if (Math.abs(relative) > clampDeg) {
        relative = Math.sign(relative) * clampDeg;
        clamped = true;
    }

    return { relative_yaw: relative, is_clamped: clamped };
};
