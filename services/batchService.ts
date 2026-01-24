import { fileToPart, generateContentSafe, GEMINI_MODELS } from './geminiClient';
import { BatchPose, BatchColorVariant, BatchProductCategory, BatchResolution } from '../types';

export const getPosesForCategory = (category: BatchProductCategory): BatchPose[] => {
    // SEATED 포즈 제거됨 - 어색한 결과물 발생으로 인해 삭제
    const basePoses: BatchPose[] = ['FRONT_FULL', 'SIDE_LEFT', 'SIDE_RIGHT', 'WALKING'];

    let cropPoses: BatchPose[] = [];
    if (category === 'TOP') {
        cropPoses = ['CROP_COLLAR', 'CROP_TEXTURE', 'CROP_POCKET'];
    } else if (category === 'BOTTOM') {
        cropPoses = ['CROP_TEXTURE', 'CROP_POCKET'];
    } else { // ONEPIECE
        cropPoses = ['CROP_COLLAR', 'CROP_TEXTURE'];
    }

    return [...basePoses, ...cropPoses];
};



// 📸 Pose Definitions (Prompt Modifiers)
// SEATED 포즈 제거됨 - 어색한 결과물로 인해 삭제
// 📸 Pose Definitions (Prompt Modifiers)
// WAIST, HEM removed. ADDED SIDE_LEFT, SIDE_RIGHT, HAND_GESTURE.
// STRICT RULES: HEADLESS (Neck-down), SHARP BACKGROUND (No blur).
export const BATCH_POSE_PROMPTS: Record<BatchPose, string> = {
    // Full Body (Dynamic Angles)
    'FRONT_FULL': "Camera: Eye-level. Pose: Standing straight, minimal movement. FRAME: NECK-DOWN ONLY (HEADLESS). Background: SHARP FOCUS (No blur).",
    'SIDE_LEFT': "Camera: Side angle (Left profile). Pose: Showing left side detail. FRAME: NECK-DOWN ONLY (HEADLESS). Background: SHARP FOCUS (No blur).",
    'SIDE_RIGHT': "Camera: Side angle (Right profile). Pose: Showing right side detail. FRAME: NECK-DOWN ONLY (HEADLESS). Background: SHARP FOCUS (No blur).",
    'WALKING': "Camera: Tracking shot. Pose: Walking motion with fabric flow. FRAME: NECK-DOWN ONLY (HEADLESS). Background: SHARP FOCUS (No blur).",
    'HAND_GESTURE': "Camera: Eye-level. Pose: Hand slightly touching garment or pocket interaction. FRAME: NECK-DOWN ONLY (HEADLESS). Background: SHARP FOCUS (No blur).",

    // Crops (Detail Focus)
    'CROP_TEXTURE': "Camera: Extreme Macro. Focus: Fabric weave/grain. Background: SHARP FOCUS.",
    'CROP_COLLAR': "Camera: Shoulder level. Focus: Neckline/Collar/Shoulders. Background: SHARP FOCUS.",
    'CROP_POCKET': "Camera: Close-up. Focus: Pocket details/Stitching. Background: SHARP FOCUS."
};

// 🏙️ Background Themes (High CTR / Vertical Commerce)
export const BATCH_BACKGROUNDS = {
    'INSTA_CAFE': "Background: A trendy minimalist cafe in Seoul (Seongsu-dong vibe). Soft natural sunlight coming from large windows, white walls, concrete floor. Aesthetic: Instagrammable, Emotional.",
    'CLEAN_STUDIO': "Background: High-end fashion studio. Cyclorama wall (soft off-white). Lighting: Softbox diffused lighting. Aesthetic: Clean, Product-focused, Minimal noise.",
    'URBAN_STREET': "Background: Clean upscale city street (Omotesando/Hannam-dong style). Soft pavement, modern architecture in background. Lighting: Golden hour natural sun. Aesthetic: Street fashion, Daily look.",
    'LUXURY_HOTEL': "Background: Luxury boutique hotel lobby or corridor. Warm ambient lighting, marble textures, velvet details. Aesthetic: Premium, High-end."
};

/**
 * 🕵️‍♂️ Feature Audit Function (Anti-Hallucination)
 * Analyzes the product to find missing features (e.g., "No pockets", "No belt")
 * ensuring the AI doesn't invent them.
 */
export const auditProductFeatures = async (image: string): Promise<string> => {
    const prompt = `
    Analyze this fashion product image STRICTLY.
    Identify features that are ABSENT or SPECIFIC constraints that must be preserved.
    
    Output a comma-separated list of "Constraints".
    Examples:
    - If pants have no back pockets: "NO BACK POCKETS"
    - If waist is elastic with no belt loops: "ELASTIC WAIST, NO BELT LOOPS"
    - If skirt is mini length: "MINI LENGTH, ABOVE KNEES"
    - If shirt has specific logo: "KEEP LOGO AT CHEST"
    
    Focus on structural details that AI often hallucinates (Pockets, Belts, Buttons, Length).
    Return ONLY the list.
    `;

    try {
        const inputs = [fileToPart(image)];
        const result = await generateContentSafe(prompt, inputs, {
            model: GEMINI_MODELS.LOGIC_REASONING, // Use reasoning model for accurate detection
            taskType: 'TEXT'
        });

        const constraints = result.text || "";
        console.log("Product Feature Audit:", constraints);
        return constraints;
    } catch (e) {
        console.error("Audit Failed:", e);
        return ""; // Fail gracefully
    }
}

/**
 * 🌈 Smart Vibe Synthesis (Multi-Reference Background)
 * Analyze multiple reference images to extract a unified "Vibe Description".
 */
export const synthesizeVibe = async (images: string[]): Promise<string> => {
    const prompt = `
    Analyze these reference images collectively.
    Extract the common "Vibe", "Lighting", "Architectural Style", and "Color Palette".
    
    GOAL: Create a unified background description optimized for **Fashion Product Photography**.
    
    CRITICAL INSTRUCTIONS:
    1. **Optimize for Product**: The background must be clean, spacious, and not distract from the foreground product.
    2. **Lighting**: Describe a soft, high-quality studio or natural lighting setup that matches the references (e.g. "Warm Golden Hour with Soft Shadows").
    3. **Composition**: Ensure the description implies a wide, open space suitable for a full-body model.
    
    Output a concise but descriptive paragraph starting with "Background:".
    Example: "Background: A modern minimalist concrete loft with large industrial windows. Soft diffused afternoon sunlight creating geometric shadows..."
    `;

    try {
        // Prepare inputs (max 4 images)
        const inputs = images.slice(0, 4).map(img => fileToPart(img));

        const result = await generateContentSafe(prompt, inputs, {
            model: GEMINI_MODELS.LOGIC_REASONING, // Use logic model for synthesis
            taskType: 'TEXT' // We want text output
        });

        const vibe = result.text || "";
        console.log("Synthesized Vibe:", vibe);
        return vibe;
    } catch (e) {
        console.error("Vibe Synthesis Failed:", e);
        throw new Error("Failed to synthesize vibe from images.");
    }
};

/**
 * 🏭 Generator Function
 */
export const generateBatchItem = async (
    baseImage: string,
    pose: BatchPose,
    color: BatchColorVariant,
    safetyMode: boolean = false,
    backgroundTheme: keyof typeof BATCH_BACKGROUNDS = 'INSTA_CAFE',
    vibeReferenceImage?: string | null,
    resolution: BatchResolution = '1K',
    featureConstraints: string = "",
    synthesizedVibe?: string, // ✨ New Param: Multi-Ref Vibe
    userPrompt: string = "" // 🆕 User Custom Prompt
): Promise<{ imageUrl: string; usedModel: string }> => {

    const posePrompt = BATCH_POSE_PROMPTS[pose];
    const isCrop = pose.startsWith('CROP_'); // Check if it's a detail shot

    // Background Logic Priority:
    // 1. CROP (Detail Shot) -> Force Simple Background (Ignore Vibe/Theme)
    // 2. Synthesized Vibe -> Custom AI Vibe
    // 3. Single Ref Vibe -> Match Ref Image
    // 4. Preset Theme -> Standard Theme

    let bgPrompt = "";

    if (isCrop) {
        // ✂️ DETAIL SHOT: Nullify background to maximize product resolution
        bgPrompt = "Background: SOLID SOFT GREY or WHITE. Studio Lighting. NO DISTRACTIONS. FOCUS ONLY ON PRODUCT DETAIL.";
    } else if (synthesizedVibe) {
        // ✨ MULTI-REF VIBE
        bgPrompt = `**CUSTOM VIBE (OPTIMIZED)**: ${synthesizedVibe}`;
    } else if (vibeReferenceImage) {
        // 🖼️ SINGLE REF VIBE
        bgPrompt = `**CUSTOM REFERENCE BACKGROUND**: Match the style, lighting, and mood of the provided "Atmosphere/Vibe Reference" image.`;
    } else {
        // 🎨 PRESET THEME
        bgPrompt = BATCH_BACKGROUNDS[backgroundTheme];
    }

    // Resolution Prompt Logic
    let resolutionPrompt = "";
    if (resolution === '2K') {
        resolutionPrompt = "QUALITY: 2K High Resolution. Sharp details, refined textures. Anti-aliased.";
    } else if (resolution === '4K') {
        resolutionPrompt = "QUALITY: 4K Ultra High Resolution. Hyper-realistic texture, razor-sharp focus, commercial fashion photography, 8k details. NO BLUR. NO NOISE.";
    }

    // Build Input Parts
    const inputs = [fileToPart(baseImage)];

    // Color Logic - 🚨 CRITICAL: Color MUST come from Master Shot ONLY
    let colorPrompt = "";
    if (color.baseImage) {
        inputs.push(fileToPart(color.baseImage));
        colorPrompt = `**CRITICAL COLOR REFERENCE**: Apply the EXACT color and fabric texture from the second input image (Color Reference) to the outfit. Target Name: ${color.name}.`;
    } else if (color.name !== 'Original' && color.name !== '오리지널') {
        colorPrompt = `CHANGE OUTFIT COLOR TO: ${color.name} (Hex: ${color.hex}). Keep original details.`;
    } else {
        // 🚨 ORIGINAL COLOR - ABSOLUTE PRESERVATION
        colorPrompt = `**ABSOLUTE COLOR PRESERVATION**: 
        - The clothing color MUST be EXACTLY as shown in the Master Shot (Image 1).
        - Do NOT change, lighten, darken, or alter the color in any way.
        - If the pants are BLACK in the Master Shot, they MUST remain BLACK.
        - IGNORE any clothing colors visible in the Background Reference image.`;
    }

    // Add Vibe Ref Image Input ONLY if we aren't using a synthesized text description 
    // OR if we want to use the first image as a strong visual anchor + text.
    // For Multi-Ref, we usually rely on the *Text Description* synthesized from all of them, 
    // rather than passing 4 images to the generation call (context limit/confusion).
    // So if synthesizedVibe is present, we rely on the Prompt.
    // If vibeReferenceImage (single) is present and NO synthesis, we pass the image.
    if (vibeReferenceImage && !synthesizedVibe) {
        inputs.push(fileToPart(vibeReferenceImage));
    }

    // Safety Logic (Headless)
    let safetyPrompt = "";
    if (safetyMode) {
        // Enforce headless for full body shots and gestures
        if (['FRONT_FULL', 'SIDE_LEFT', 'SIDE_RIGHT', 'WALKING', 'HAND_GESTURE'].includes(pose)) {
            safetyPrompt = `
            **SAFETY VIOLATION CHECK**:
            - You MUST crop the face out. Output should be NECK-DOWN only.
            - DO NOT GENERATE A FACE. Frame the shot to cut off above the chin.
            - **BACKGROUND RULE**: BACKGROUND MUST BE SHARP. DO NOT BLUR THE BACKGROUND.
            - **DEPTH OF FIELD**: INFINITE DEPTH OF FIELD. EVERYTHING IN FOCUS.
            `;
        }
    }

    const fullPrompt = `
YOUR TASK: Edit the MASTER SHOT image to change ONLY the background.

=== PRIMARY DIRECTIVE ===
PRESERVE the person and their COMPLETE OUTFIT from the Master Shot image EXACTLY as they appear.
ONLY CHANGE the background environment behind them.

=== INPUT IMAGES ===
• IMAGE 1 (Master Shot): The person wearing the outfit. THIS IS YOUR PRIMARY SOURCE.
  → Keep their exact clothing (color, texture, fit, style)
  → Keep their body proportions and pose
  → Keep all garment details (buttons, pockets, seams, patterns)

${(!synthesizedVibe && vibeReferenceImage) ? `• BACKGROUND REFERENCE: Use this ONLY for background style inspiration.
  → Copy the architecture, lighting, and mood
  → DO NOT copy any clothing or outfit from this image
  → The person in this reference is wearing DIFFERENT clothes - IGNORE their outfit completely` : ""}

=== WHAT TO CHANGE ===
Background Environment: ${bgPrompt}
Camera/Pose Guidance: ${posePrompt}
4. Do NOT take any clothing inspiration from the background reference

${resolutionPrompt}

OUTPUT: Image only. No text.
    `;

    // Use Nano Banana Pro for best image quality
    const result = await generateContentSafe(fullPrompt, inputs, {
        taskType: 'EDIT', // Use EDIT to preserve identity/background
        model: GEMINI_MODELS.IMAGE_GEN // 🏆 Switch to Nano Banana Pro for 4K Quality
    });

    if (result.inlineData) {
        // 🆕 모델 이름 매핑 (사용자 친화적 이름)
        const modelDisplayName: Record<string, string> = {
            'gemini-3-pro-image-preview': 'Nano Banana Pro',
            'gemini-2.0-flash-exp-image-generation': 'Flash Exp',
            'gemini-2.5-flash-image': 'Nano Flash',
            'gemini-3-pro-preview': 'Logic Pro',
            'gemini-2.5-pro': 'Stable Pro',
            'gemini-2.5-flash': 'Flash'
        };

        const friendlyName = modelDisplayName[result.usedModel] || result.usedModel;

        return {
            imageUrl: `data:${result.inlineData.mimeType}; base64, ${result.inlineData.data} `,
            usedModel: friendlyName
        };
    }

    // Log the text response for debugging
    if (result.text) {
        console.error("Batch Service Text Response (Validation Fail):", result.text);
    }

    throw new Error(`No image generated by batch service.AI Response: ${result.text?.slice(0, 100) || 'Empty'} `);
};

// 색상 옵션 - '오리지널'은 마스터 샷의 원본 색상을 유지함
export const MOCK_COLORS: BatchColorVariant[] = [
    { id: 'c1', name: '오리지널', hex: 'MASTER_SHOT' }, // 마스터 샷 원본 색상 유지
    { id: 'c2', name: '블랙', hex: '#000000' },
    { id: 'c3', name: '차콜', hex: '#36454F' },
    { id: 'c4', name: '네이비', hex: '#000080' },
    { id: 'c5', name: '베이지', hex: '#F5F5DC' }
];

// SEATED, WAIST, HEM 포즈 제거됨
export const ALL_POSES: BatchPose[] = [
    'FRONT_FULL', 'SIDE_LEFT', 'SIDE_RIGHT', 'WALKING', 'HAND_GESTURE',
    'CROP_TEXTURE', 'CROP_COLLAR', 'CROP_POCKET'
];
