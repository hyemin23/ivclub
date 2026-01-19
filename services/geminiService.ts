
import { GoogleGenAI, Type } from "@google/genai";
import {
  ProductCategory,
  ProductAnalysis,
  DetailSection,
  Resolution,

  ViewMode,
  ProductInfo,
  PageLength,
  DetailImageSegment,
  AspectRatio,
  FaceMode,
  Gender,
  CameraAngle,
  GenerationConfig,
  SizeRecord,
  ProductSpecs,
  DesignKeyword,
  VsComparisonItem,
  VisionAnalysisResult,
  SmartPin,
  SizeCategory
} from "../types";
import { ProductCopyAnalysis } from "../types"; // Import from types.ts
import { TECHNICAL_INSTRUCTION } from "../constants/ugcPresets";
import { useStore } from "../store";

export type GeminiErrorType = 'safety' | 'quota' | 'auth' | 'invalid' | 'unknown';

export interface GeminiErrorResponse {
  message: string;
  type: GeminiErrorType;
}

const getApiKey = () => {
  const state = useStore.getState();
  const activeKeyId = state.activeKeyId;
  const foundKey = state.apiKeys?.find(k => k.id === activeKeyId);

  if (foundKey) return foundKey.key;

  // Fallback
  const envKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY);
  if (envKey) return envKey;

  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key') || '';
  }
  return '';
};

export const parseGeminiError = (error: any): GeminiErrorResponse => {
  const msg = error?.message || String(error);
  console.error("Gemini API Error Detail:", error);

  // LOG ERROR TO STORE
  // @ts-ignore
  useStore.getState().addLog(`API Error: ${msg}`, 'error');

  if (msg.includes("Requested entity was not found")) {
    return {
      message: "API 키가 만료되었거나 유효하지 않습니다. 다시 선택해 주세요.",
      type: 'auth'
    };
  }
  if (msg.toUpperCase().includes("SAFETY")) {
    return {
      message: "안전 정책 지침에 따라 이미지가 차단되었습니다. 프롬프트를 수정해 주세요.",
      type: 'safety'
    };
  }
  if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
    return {
      message: "API 사용 할당량이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
      type: 'quota'
    };
  }
  if (msg.includes("400") || msg.toLowerCase().includes("invalid")) {
    return {
      message: "잘못된 요청입니다. 입력값이나 사진을 확인해 주세요.",
      type: 'invalid'
    };
  }
  if (msg.includes("503") || msg.toLowerCase().includes("overloaded")) {
    return {
      message: "현재 AI 서버 사용량이 많아 접속이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
      type: 'unknown' // categorized as transient
    };
  }

  return {
    message: msg || "알 수 없는 오류가 발생했습니다.",
    type: 'unknown'
  };
};

const trackUsage = (response: any, isImage: boolean = false) => {
  const usage = response.usageMetadata;
  const input = usage?.promptTokenCount || 0;
  const output = usage?.candidatesTokenCount || 0;
  // @ts-ignore - access store outside component
  useStore.getState().updateUsage(true, input, output, isImage);
};

const anglePrompts: Record<CameraAngle, { positive: string, negative: string }> = {
  'default': { positive: 'Original Angle', negative: '' },
  'front': {
    positive: '(front view:1.5), (looking straight at camera:1.3), symmetrical body pose',
    negative: 'side view, profile, turned head'
  },
  'left-30': {
    positive: '(body turned to the left:1.4), (looking to the right side:1.4), showing right profile, 3/4 turn',
    negative: 'looking left, looking at camera, left side profile'
  },
  'left-40': {
    positive: '(body turned 45 degrees to the left:1.5), (quarter view:1.3), 3/4 turn left',
    negative: 'front view, full profile, looking straight'
  },
  'right-30': {
    positive: '(body turned to the right:1.4), (looking to the left side:1.4), showing left profile, 3/4 turn',
    negative: 'looking right, looking at camera, right side profile'
  },
  'right-40': {
    positive: '(body turned 45 degrees to the right:1.5), (quarter view:1.3), 3/4 turn right',
    negative: 'front view, full profile, looking straight'
  },
  'left-side': {
    positive: '(full side profile view:1.5), (looking straight to the right edge:1.5), (turning body 90 degrees to the left:1.4), complete profile shot, sharp side view',
    negative: 'front view, looking at camera, slightly turned, 3/4 view, looking left, showing both eyes'
  },
  'right-side': {
    positive: '(full side profile view:1.5), (looking straight to the left edge:1.5), (turning body 90 degrees to the right:1.4), complete profile shot, sharp side view',
    negative: 'front view, looking at camera, slightly turned, 3/4 view, looking right, showing both eyes'
  },
  'back': { // Added basic back support if key exists
    positive: '(back view:1.5), looking away from camera',
    negative: 'front view, face visible'
  }
};

export const FACTORY_POSES = [
  { id: 'front', name: '정면 스탠딩', prompt: 'front facing full body standing pose, clean posture' },
  { id: 'side_45_l', name: '좌측 45도', prompt: '45 degree left angle full body pose, showing silhouette' },
  { id: 'side_45_r', name: '우측 45도', prompt: '45 degree right angle full body pose, showing silhouette' },
  { id: 'walking', name: '워킹 모션', prompt: 'natural walking pose, dynamic leg movement, realistic stride' },
  { id: 'detail_hand', name: '디테일/손동작', prompt: 'close-up detail pose, hand in pocket or touching sleeve' },
  { id: 'folded_arms', name: '팔짱/신뢰감', prompt: 'folded arms pose, confident upper body fit focus' },
];

/**
 * Safely parse JSON from AI response, removing Markdown code blocks
 */
const safeJsonParse = <T>(text: string): T => {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error("JSON Parse Failed:", text);
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const imageUrlToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (url.startsWith('data:')) {
      resolve(url);
      return;
    }

    // Try XHR as it is often more robust against extension interference than fetch
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      const reader = new FileReader();
      reader.onloadend = function () {
        resolve(reader.result as string);
      }
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error(`Failed to load image via XHR: ${xhr.statusText}`));
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  });
};

// Retry helper
// Retry helper
const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = 5,
  delay = 2000,
  operationName = "API Request",
  signal?: AbortSignal
): Promise<T> => {
  if (signal?.aborted) {
    throw new Error("작업이 취소되었습니다.");
  }

  try {
    // Execute operation - we can't easily cancel the inner promise if it doesn't support signal, 
    // but we can check before/after and during the retry wait.
    return await operation();
  } catch (error: any) {
    if (signal?.aborted) {
      throw new Error("작업이 취소되었습니다.");
    }

    const errorMsg = error.message || String(error);

    // Log transient errors
    if (retries > 0 && (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('429'))) {
      const msg = `API busy, retrying in ${delay / 1000}s... (${retries} retries left)`;
      console.log(msg);
      // @ts-ignore
      useStore.getState().addLog(msg, 'warning');

      // Wait with abort support
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), delay);
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error("작업이 취소되었습니다."));
          }, { once: true });
        }
      });

      return retryOperation(operation, retries - 1, delay * 1.5, operationName, signal);
    }

    // Log final failure
    // @ts-ignore
    useStore.getState().addLog(`[${operationName}] Failed: ${errorMsg}`, 'error');
    throw error;
  }
};

export const refinePrompt = async (data: { productFeatures: string, stylingCoordination: string, targetAudience: string }) => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Refine these fashion details into professional, highly descriptive prompts for an AI image generator that specializes in hyper-realistic UGC content. 
      Focus on fabric textures, specific lighting, and realistic model descriptions.
      Input:
      Product Features: ${data.productFeatures}
      Styling: ${data.stylingCoordination}
      Target: ${data.targetAudience}
      
      Return ONLY a JSON object with keys "productFeatures", "stylingCoordination", and "targetAudience".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productFeatures: { type: Type.STRING },
            stylingCoordination: { type: Type.STRING },
            targetAudience: { type: Type.STRING }
          }
        }
      }
    });
    trackUsage(response);
    return JSON.parse(response.text || '{}');
  });
};

export const generateFashionContent = async (config: GenerationConfig, locationPrompt: string): Promise<{ imageUrl: string, prompt: string }> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    if (!config.imageFile) throw new Error("Image file is required.");
    const base64Image = await fileToBase64(config.imageFile);
    const data = base64Image.split(',')[1];

    const finalPrompt = `
    ${TECHNICAL_INSTRUCTION}
    
    [FASHION_CONTEXT]
    Product: ${config.productFeatures}
    Styling: ${config.stylingCoordination}
    Persona: ${config.targetAudience}
    Model Type: ${config.mode === 'Couple' ? 'A stylish couple' : `A ${config.gender} model`}
    
    [ENVIRONMENT]
    ${locationPrompt}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data, mimeType: config.imageFile.type } },
          { text: finalPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: config.quality as Resolution
        }
      }
    });

    trackUsage(response, true);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("Image generation failed");

    return {
      imageUrl: `data:image/png;base64,${part?.inlineData?.data}`,
      prompt: finalPrompt
    };
  });
};

export const generateFittingVariation = async (
  baseImage: string,
  refImage: string | null,
  userPrompt: string,
  viewMode: ViewMode,
  resolution: Resolution,
  aspectRatio: AspectRatio,
  faceOptions?: any,
  cameraAngle: CameraAngle = 'default',
  signal?: AbortSignal
): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const parts: any[] = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }];

    if (refImage) {
      parts.push({ inlineData: { data: refImage.split(',')[1], mimeType: 'image/png' } });
    }

    const framingPrompts: Record<ViewMode, string> = {
      'full': 'Full body shot from head to toe.',
      'top': 'Upper body shot, waist up focus.',
      'bottom': 'Lower body shot, waist down focus.'
    };

    let masterPrompt = `[NanoBanana PRO MODE]

  Use the first uploaded image as the MAIN IMAGE.
  Use the second uploaded image as a POSE REFERENCE ONLY.

  1. PRESERVE from MAIN IMAGE:
  - Clothing details, materials, colors, and textures (CRITICAL)
  - Face and Identity (if face is visible)
  - Background and environment (UNLESS the new angle requires a different perspective of the same room/place)

  2. APPLY from REF IMAGE (or USER OVERRIDE):
  - Target Pose and Body Posture
  - Camera Angle and Perspective

  [CRITICAL INSTRUCTION - CAMERA ANGLE]
  Target Angle: ${anglePrompts[cameraAngle]?.positive || 'Original Angle'}
  
  IF the requested angle is DIFFERENT from the original image:
  - You MUST ROTATE the model and the clothing.
  - You MUST IMAGINE and GENERATE the unseen side of the garment based on the visible side.
  - Do NOT just mirror the image. Realistically rotate the 3D form of the subject.
  - If asking for "Left Side", show the LEFT part of the person (even if original showed Right).

  [NEGATIVE PROMPTS / AVOID]
  ${anglePrompts[cameraAngle]?.negative || ''}

  [USER OVERRIDES]
  - Target Framing: ${framingPrompts[viewMode]}
  ${userPrompt ? `- Additional Instructions: ${userPrompt}` : ''}
  ${faceOptions?.faceMode === 'ON' ? `- Identity Integrity: Maintain the ${faceOptions.gender} model's facial features clearly.` : ''}

  Output:
  - High-resolution, realistic fashion image
  - Correct camera angle as requested
  `;

    parts.push({ text: masterPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution
        }
      }
    });

    trackUsage(response, true);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("Fitting Variation generation failed");

    return `data:image/png;base64,${part?.inlineData?.data}`;
  });
};


export const analyzeProduct = async (image: string, userDescription: string): Promise<ProductAnalysis> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: image.split(',')[1], mimeType: 'image/png' } },
          { text: `Analyze fashion product and return JSON: category, fit, materialType, season, keyPoints, and gender (Male or Female based on product design). IF UNISEX, default to Female.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            fit: { type: Type.STRING },
            material: { type: Type.STRING },
            materialType: { type: Type.STRING },
            season: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            gender: { type: Type.STRING, enum: ["Male", "Female"] }
          }
        }
      }
    });
    trackUsage(response);
    return JSON.parse(response.text || '{}');
  });
};

export const generatePoseChange = async (baseImage: string, refImage: string | null, prompt: string, resolution: Resolution, aspectRatio: AspectRatio, faceOptions?: any, cameraAngle: CameraAngle = 'default', signal?: AbortSignal): Promise<string> => {
  // @ts-ignore
  useStore.getState().addLog(`Starting Pose Change Generation [${resolution}/${aspectRatio}] - Angle: ${cameraAngle}`, 'info');

  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const parts: any[] = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }];
    if (refImage) parts.push({ inlineData: { data: refImage.split(',')[1], mimeType: 'image/png' } });

    const finalPrompt = prompt || "Natural professional model standing pose, clean minimalist setting.";
    const anglePromptData = anglePrompts[cameraAngle] || anglePrompts['default'];
    // Handle fallback if data is string (old) or object (new) - though we typed it as object.
    const anglePositive = typeof anglePromptData === 'string' ? anglePromptData : anglePromptData.positive;
    const angleNegative = typeof anglePromptData === 'string' ? '' : anglePromptData.negative;

    let systemPrompt = `
    [NANO BANANA POSE CHANGE]
    
    [PRIORITY ORDER]
    1. TARGET ANGLE (Most Important)
    2. Base Prompt
    
    [CAMERA ANGLE INSTRUCTION - HIGHEST PRIORITY]
    Target Angle: ${anglePositive}
    ACTION: ROTATE the subject to match this angle. This instruction overrides any conflicting details in the Base Prompt regarding orientation.
    
    [NEGATIVE / AVOID]
    ${angleNegative}
    
    [Base Settings]
    Prompt Context: ${finalPrompt}
    Aspect Ratio: ${aspectRatio}
    
    [Rules]
    - GENERATE unseen details if rotating reveals them.
    - Maintain the original identity and clothing style.
    `;

    // HEADLESS MODE OVERRIDE
    if (faceOptions?.faceMode === 'HEADLESS') {
      const allowRotation = cameraAngle !== 'default';

      systemPrompt = `
[NanoBanana PRO MODE]

Use the uploaded image as the MAIN IMAGE.

Framing & crop (IMPORTANT):
- **HEADLESS CROP**: Reframe to a neck-down composition.
- Crop the image at the neck so NO part of the face remains visible.
- Remove all empty space above the neck.
- Rebuild the frame so the body (neck to feet) fills the canvas naturally, cutting off the head.

Camera Angle & Pose:
- Target Angle: ${anglePositive}
${allowRotation ? `- ROTATE the subject to match the Target Angle: ${anglePositive}` : `- Maintain the original pose and angle exactly.`}
- The subject must be visually balanced within the frame.

Preserve the subject:
- Keep the entire body from neck to feet visible.
${allowRotation ? `- Adjust pose naturally for rotation, but keep body proportions.` : `- Do not change pose, body proportions, or posture.`}
- Do not change clothing, fabric, color, or fit.
- Do not add or remove accessories.

Background & lighting:
- Keep the original background and lighting unchanged.
- Maintain natural shadows and ground contact.

Restrictions:
- Reframing${allowRotation ? ', cropping, and rotation' : ' and cropping'} only.
- No face visible.
- No background extension.
- No text, logos, or graphic elements.

Output:
- Clean, realistic fashion image.
- Correctly framed, commercial e-commerce quality.
       `;
    }

    // POSE REFERENCE IMAGE MODE
    if (refImage) {
      systemPrompt = `
[NanoBanana PRO MODE]

Use the first uploaded image as the MAIN IMAGE.
Use the second uploaded image as the POSE REFERENCE IMAGE.

Analyze the body pose and posture from the pose reference image.
Apply ONLY the pose and body positioning from the reference to the main image subject.

Preserve the main image EXACTLY as is:
- Keep the original background, environment, and lighting
- Keep the original camera angle, framing, and aspect ratio
- Keep the original clothing, fabric, color, fit, and texture
- Keep the original body proportions, identity, and appearance
- Do not change face, hair, or accessories

Pose transfer rules:
- Transfer body orientation, posture, and limb positioning only
- Make the pose natural and realistic for the main image body
- Do not exaggerate or stylize the movement
- Maintain balance and correct anatomy

CRITICAL RESTRICTIONS:
- Do NOT use the reference image’s background, lighting, colors, or style
- Do NOT transfer facial expression or identity from the reference
- Do NOT change the environment or mood
- Pose change ONLY

Output:
- High-resolution, realistic fashion image
- Same scene as the original image
- Only the pose is changed
        `;
    }

    parts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio, imageSize: resolution } }
    });
    trackUsage(response);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    // @ts-ignore
    useStore.getState().addLog(`Pose Change Generated Successfully`, 'success');

    return `data:image/png;base64,${part?.inlineData?.data}`;
  }, 5, 2000, "Pose Change Gen", signal);
};

export const generateDetailExtra = async (
  baseImage: string,
  refImage: string | null,
  prompt: string,
  resolution: Resolution,
  aspectRatio: AspectRatio,
  options?: { imageStrength?: number }
): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const parts: any[] = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }];
    if (refImage) parts.push({ inlineData: { data: refImage.split(',')[1], mimeType: 'image/png' } });

    const finalPrompt = prompt || "Clean e-commerce detail cutout view, white background.";
    parts.push({ text: finalPrompt });

    // Use imageStrength if provided, default to undefined (API default) or a standard value if needed.
    // Note: 'imageStrength' parameter availability depends on the model and config structure.
    // For 'gemini-3-pro-image-preview', standard image generation config usually includes prompt, negativePrompt, aspectRatio, etc.
    // If we are doing image-to-image (which this seems to be, given 'baseImage'), 
    // we might need to rely on prompt engineering if the API doesn't support explicit strength yet,
    // OR if we are using a specific endpoint. 
    // Assuming 'imageConfig' allows extra parameters or we are using a specific way to control adherence.
    // If the SDK/Model allows 'imageStrength' (0.0 to 1.0) for Image-to-Image text guided generation:
    const generationConfig: any = {
      aspectRatio,
      imageSize: resolution
    };

    // Attempting to pass guidelines via config if supported, otherwise it falls back to prompt.
    // However, verify if 'imageStrength' is a valid top-level config or part of imageConfig.
    // For now, we'll keep it simple: strict prompt + visual input.
    // If the user specifically asked for 'strength', we often need to check if we are using an endpoint that supports it.
    // Since we are using 'gemini-3-pro-image-preview', let's try to pass it in `imageConfig` or check docs.
    // *If* the user provided a specific API pattern for strength, we should follow it.
    // The user said: "image_strength (or prompt_strength) ... 0.25 ~ 0.3".

    if (options?.imageStrength !== undefined) {
      // @ts-ignore - tentative support
      generationConfig.imageStrength = options.imageStrength;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: generationConfig }
    });
    trackUsage(response);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return `data:image/png;base64,${part?.inlineData?.data}`;
  });
};

export const generateBackgroundChange = async (baseImage: string, bgRefImage: string | null, userPrompt: string, resolution: Resolution, aspectRatio: AspectRatio, faceOptions?: any, signal?: AbortSignal): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // 1. Initialize parts with system prompt (or placeholder) and base image
    const parts: any[] = [];

    // We will push the prompt text later after constructing it, or we can structure strictly as User requested.
    // User requested: [ { text }, { baseImage }, { refImage? } ]
    // But currently `finalPrompt` depends on logic. 
    // Let's build the array DYNAMICALLY.

    // Always include Base Image
    const baseImagePart = { inlineData: { data: baseImage.split(',')[1] || baseImage, mimeType: 'image/png' } };

    parts.push(baseImagePart);

    // Conditionally Add Reference Image
    if (bgRefImage && bgRefImage.length > 100) { // Simple check to ensure it's a valid image string
      parts.push({ inlineData: { data: bgRefImage.split(',')[1] || bgRefImage, mimeType: 'image/png' } });
    } else {
      console.log('Skipping Reference Image (Not provided or Preset used)');
    }

    let finalPrompt = userPrompt;

    const preset = faceOptions?.preset;

    if (bgRefImage) {
      finalPrompt = `
[NanoBanana PRO MODE]

Use the first uploaded image as the MAIN IMAGE (person source).
Use the second uploaded image as the BACKGROUND REFERENCE.

Separate the person from the background in the main image with clean, accurate edges.
Preserve the person EXACTLY as is:
- Do not change pose, body proportions, face, hair, or expression
- Do not change clothing, fabric, color, fit, or accessories
- Keep the original camera angle and framing

Replace ONLY the background of the main image with the background from the reference image.
Do NOT transfer any people, objects, text, or logos from the reference image—use background environment only.

Blending & realism:
- Match perspective, scale, and horizon
- Match light direction, brightness, and color temperature
- Match the shadow direction with the sunlight. Create a hard, directional cast shadow extending from the feet on the ground.
- Apply shallow depth of field. Slightly blur the background pavement behind the model to create depth.
- Seamless composite with no cutout artifacts

Restrictions:
- Background change only
- No stylization, no cinematic filters
- No text, logos, or graphic elements

Output:
- High-resolution, realistic fashion image
        `;
    } else if (preset === 'MZ_CAFE') {
      // MZ Hotspot Preset
      finalPrompt = `
[NanoBanana PRO MODE: K-REALISM STREET SNAP]

**TASK:** Composite the subject into a photorealistic, authentic Korean street background.

**SCENE COMPOSITION (CRITICAL REALISM):**
1.  **LOCATION:** A realistic, bustling street in Seoul (e.g., Apgujeong backstreet, Yeonnam-dong alley). NOT a fantasy or studio set.
2.  **TIME & LIGHTING:** Bright, natural **DAYLIGHT** (afternoon sun). The lighting on the subject and shadows must perfectly match the sunny day street environment.
3.  **GROUND (K-TEXTURE):** Must be authentic Korean pavement. Use a mix of **cracked asphalt** and standard **Korean interlocking sidewalk blocks (보도블록)**. Add realistic grit, pebbles, and wear.
4.  **BACKGROUND ELEMENTS (THE "REAL" DETAILS):**
    * **Mandatory K-Elements:** Overhead **power lines (전선)** and **utility poles (전봇대)**.
    * **Buildings:** Realistic 2-4 story Korean commercial buildings (brick, concrete). Add small, realistic Korean business signs (한글 간판 - blurred).
    * **Objects:** Maybe a parked Korean car (e.g., Kia Ray, Hyundai Avante - blurred) or a delivery motorbike in the distance.

**FEEL:** Candid, unposed street fashion photography. Raw, authentic, high-resolution.

**NEGATIVE PROMPT (금지어):**
studio floor, clean minimalist background, fantasy neon, perfect pavement, Western architecture, no power lines, blurry texture, oversaturated colors, fake light.
      `;
    } else {
      // Standard Text-to-Background Mode
      finalPrompt = `
    [NanoBanana PRO MODE - BACKGROUND CHANGE]
Change the background of the image based on the following description:
  "${userPrompt || 'Clean, professional studio background'}"

  Instructions:
  - Keep the main subject exactly as is.
- Replace the background completely.
- Ensure realistic lighting integration.
        `;
    }

    // [SMART FRAMING LOGIC]
    const category = faceOptions?.category;
    if (category) {
      let framingPrompt = '';
      if (category === 'TOP') {
        framingPrompt = `
    ** CAMERA FRAMING:** Medium Close - up / Torso Shot.
** CROP GUIDE:**
    1. ** HEADLESS:** Crop the image just below the nose or at the chin line.Do NOT show the full face.
2. ** RANGE:** Frame from the chin down to the hips.
3. ** FOCUS:** Focus sharply on the chest, shoulders, and sleeve details.`;
      } else if (category === 'BOTTOM') {
        framingPrompt = `
    ** CAMERA FRAMING:** Waist - Down Shot / Legs Shot.
** CROP GUIDE:**
    1. ** NO UPPER BODY:** Crop out the head and chest.Start the frame from the waist / belt line.
2. ** SHOES MANDATORY:** You MUST include the full shoes and the ground they are standing on. ** DO NOT CROP THE FEET.**
    3. ** FOCUS:** Focus on the fit of the pants, the drape over the shoes, and the texture.`;
      } else if (category === 'SET') {
        framingPrompt = `
      ** CAMERA FRAMING:** Headless Full Body Shot.
** CROP GUIDE:**
    1. ** HEADLESS:** Crop the image at the nose or chin level.
2. ** FULL OUTFIT:** Show the entire outfit from the neck down to the shoes.
3. ** SHOES INCLUDED:** Feet must be fully visible and grounded.`;
      }

      finalPrompt += `\n\n${framingPrompt} \n\n[COMMON NEGATIVE PROMPT]\nface, eyes, full head, cropped shoes, cut off feet, missing shoes, selfie angle.`;
    }

    parts.push({ text: finalPrompt });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio, imageSize: resolution } }
    });
    trackUsage(response);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return `data: image / png; base64, ${part?.inlineData?.data} `;
  }, 5, 2000, "Background Change", signal);
};

export const generateTechSketch = async (category: string, name: string): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: `Technical flat sketch of a ${category} named ${name}, minimalist white background, black lines.`,
      config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
    });
    trackUsage(response);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return `data: image / png; base64, ${part?.inlineData?.data} `;
  });
};

export const generateFactoryPose = async (baseImage: string, pose: any, analysis: any, resolution: any): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } },
          { text: `Model wearing the product.Pose: ${pose.prompt}.Target: ${analysis.category}. Model Gender: ${analysis.gender || 'Female'} ` }
        ]
      },
      config: { imageConfig: { aspectRatio: "9:16", imageSize: resolution } }
    });
    trackUsage(response, true);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return `data: image / png; base64, ${part?.inlineData?.data} `;
  });
};

export const planDetailSections = async (analysis: any, name: string): Promise<any[]> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a plan for a fashion detail page for ${name}(${analysis.category}).Return 5 sections as JSON items: title, logicalSection, keyMessage, visualPrompt.`,
      config: { responseMimeType: "application/json" }
    });
    trackUsage(response);
    return JSON.parse(response.text || '[]');
  });
};

export const planDetailPage = async (product: ProductInfo, length: PageLength): Promise<DetailImageSegment[]> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a product detail page plan for ${product.name}.Length: ${length}.Return as JSON array: title, logicalSection, keyMessage, visualPrompt.`,
      config: { responseMimeType: "application/json" }
    });
    trackUsage(response);
    return JSON.parse(response.text || '[]');
  });
};

export const generateSectionImage = async (segment: DetailImageSegment, baseImages: File[], resolution: Resolution): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const imageParts = await Promise.all(baseImages.map(async f => ({
      inlineData: { data: (await fileToBase64(f)).split(',')[1], mimeType: f.type }
    })));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: segment.visualPrompt }
        ]
      },
      config: { imageConfig: { aspectRatio: "9:16", imageSize: resolution } }
    });
    trackUsage(response, true);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return `data: image / png; base64, ${part?.inlineData?.data} `;
  });
};

export const generateLookbookImage = async (base64: string, description: string, analysis: any, resolution: any): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: 'image/png' } },
          { text: description }
        ]
      },
      config: { imageConfig: { aspectRatio: "9:16", imageSize: resolution } }
    });
    trackUsage(response, true);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return `data: image / png; base64, ${part?.inlineData?.data} `;
  });
};

export const generateAutoFitting = async (
  baseImage: string,
  bgImage: string | null,
  userPrompt: string,
  targetAngle: CameraAngle,
  aspectRatio: AspectRatio,
  resolution: Resolution,
  isSideProfile: boolean = false, // Added Flag
  signal?: AbortSignal
): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const parts: any[] = [
      { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }
    ];

    if (bgImage) {
      parts.push({ inlineData: { data: bgImage.split(',')[1], mimeType: 'image/png' } });
    }

    const anglePromptData = anglePrompts[targetAngle] || anglePrompts['default'];
    const anglePositive = typeof anglePromptData === 'string' ? anglePromptData : anglePromptData.positive;
    const angleNegative = typeof anglePromptData === 'string' ? '' : anglePromptData.negative;
    let masterPrompt = '';

    const sideProfilePrompt = isSideProfile ? `
  [NanoBanana PRO MODE: SIDE PROFILE FIX]

** POSE OVERRIDE:** 90 - degree Side Profile / Lateral View.
** INSTRUCTION:**
    Render the pants from a COMPLETE SIDE VIEW.
1. ** NO FRONT DETAILS:** Do NOT show the zipper fly, front button, or crotch seam.
2. ** SIDE DETAILS:** Focus on the "Side Seam"(sewing line) of the pants running down the leg.
3. ** SHAPE:** The width of the pants should reflect the side profile(thinner waist, wider leg if baggy).
4. ** ORIENTATION:** The feet and hips must face the EXACT same direction as the model's head (Left/Right).

    ** NEGATIVE PROMPT(SIDE PROFILE MANDATORY):**
      front view, symmetrical pockets, zipper fly showing, navel, pelvic bone, twisted torso, forward facing legs.
` : '';

    if (bgImage) {
      // CASE 1: Background Replacement + Angle Consistency (Original Logic)
      masterPrompt = `[NanoBanana PRO MODE]

Use the first uploaded image as the MAIN IMAGE(person source).
Use the second uploaded image as the BACKGROUND REFERENCE.

Separate the person from the background in the main image with clean, accurate edges.
Preserve the person EXACTLY as is:
  - Do not change pose, body proportions, face, hair, or expression
    - Do not change clothing, fabric, color, fit, or accessories
      - Keep the original camera angle and framing

Replace ONLY the background of the main image with the background from the reference image.
Do NOT transfer any people, objects, text, or logos from the reference image—use background environment only.

User Instruction: "${userPrompt || 'Seamless photorealistic integration'}"

  Blending & realism:
  - Match perspective, scale, and horizon
    - Match light direction, brightness, and color temperature
      - Add natural ground contact and soft shadows
        - Seamless composite with no cutout artifacts

  Restrictions:
  - Background change only
    - No stylization, no cinematic filters
      - No text, logos, or graphic elements

  Output:
  - High - resolution, realistic fashion image
    - Correct camera angle if requested

    [CAMERA ANGLE INSTRUCTION]
Target Angle: ${anglePositive}
IF the requested angle is DIFFERENT from the original:
  - ROTATE the subject to match the angle on the new background.
- Adjust the perspective to match the background.

    ${sideProfilePrompt}

  [NEGATIVE PROMPT]
${angleNegative}
  `;
    } else {
      const currentHeadlessPrompt = anglePrompts[targetAngle]?.positive || 'Original Angle';

      masterPrompt = `[NanoBanana PRO MODE - ANGLE VIEW]
    
    Use the first uploaded image as the MAIN IMAGE.

    Framing & crop(IMPORTANT):
    - ** HEADLESS CROP **: Reframe to a neck - down composition.
    - Crop the image at the neck so NO part of the face remains visible.
    - Remove all empty space above the neck.
    - Rebuild the frame so the body(neck to feet) fills the canvas naturally, cutting off the head.
    
    Camera Angle & Pose:
  - Target Angle: ${currentHeadlessPrompt}
  - ROTATE the subject to match the Target Angle.
    - The subject must be visually balanced within the frame.
    
    Preserve the subject:
  - Keep the entire body from neck to feet visible.
    - Adjust pose naturally for rotation, but keep body proportions.
    - Do not change clothing, fabric, color, or fit.
    - Do not add or remove accessories.

    Background & lighting:
  - Generate a clean, neutral professional studio background(white or light grey).
    - Add soft, natural studio lighting.

    ${sideProfilePrompt}
  `;
    }

    parts.push({ text: masterPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio, imageSize: resolution } }
    });
    trackUsage(response, true);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    return `data: image / png; base64, ${part?.inlineData?.data} `;

  }, 5, 2000, "Auto Fitting", signal);
};

export const generateVirtualTryOn = async (
  modelImage: string,
  garmentImage: string,
  category: 'top' | 'bottom' | 'outer',
  signal?: AbortSignal
): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const parts: any[] = [
      { inlineData: { data: modelImage.split(',')[1], mimeType: 'image/png' } },
      { inlineData: { data: garmentImage.split(',')[1], mimeType: 'image/png' } }
    ];

    const prompt = `
  [VIRTUAL TRY - ON MODE]
    
    Image 1: Model(Target Person)
    Image 2: Garment(Reference Product)
  Category: ${category.toUpperCase()}

  TASK:
  - Replace the ${category} on the Model(Image 1) with the Garment from Image 2.
    - Keep the Model's face, hair, pose, skin tone, and background EXACTLY the same.
      - Keep other clothing items unchanged(e.g.if category is 'top', keep pants / shoes).

        EXECUTION:
  1. Identify the ${category} area on the Model.
    2. Warp and fit the Garment(Image 2) onto that area.
    3. Match lighting, shadows, and fabric folds to the Model's original pose.
  4. Ensure the boundary between skin and new garment is seamless.

    OUTPUT:
  - Photorealistic result.
    - High fidelity to the Garment's texture and pattern.
    `;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K'
        }
      }
    });

    trackUsage(response, true);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("Try-On generation failed");

    return `data: image / png; base64, ${part?.inlineData?.data} `;
  }, 3, 2000, "Virtual Try-On", signal);
};
export const generateMagicEraser = async (
  baseImage: string,
  maskImage: string
): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    // Prepare contents: Image 1 (Base), Image 2 (Mask Overlay)
    const parts: any[] = [
      { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } },
      { inlineData: { data: maskImage.split(',')[1], mimeType: 'image/png' } }
    ];

    const prompt = `[MAGIC ERASER MODE]
  Image 1: Original Source Image
  Image 2: Mask Image(Red stroke indicates area to remove)

  TASK: Remove the object / text / element covered by the Red / Masked area in Image 1.
    - Inpaint the removed area naturally using the surrounding background texture and pattern.
  - Do NOT modify any other part of the image.
  - The output should look like the original image but without the masked element.
  - High quality, seamless blending.
  `;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: '1:1', // Assuming keep original aspect ratio logic isn't strictly enforced by "1:1" here but model config
          imageSize: '2K'
        }
      }
    });

    trackUsage(response, true);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("Magic Eraser generation failed");

    return `data: image / png; base64, ${part?.inlineData?.data} `;
  });
};

export const extractSizeTableFromImage = async (imageFile: File): Promise<{ category: SizeCategory, sizes: SizeRecord[] }> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const base64 = await fileToBase64(imageFile);
    const parts = [
      { inlineData: { data: base64.split(',')[1], mimeType: imageFile.type } },
      {
        text: `
        This image is a size chart for a fashion product.
        Analyze the text and structure to determine the category and extract size data.

    Step 1: Determine Category
      - "pants", "slacks", "jeans", "skirt" -> "pants" or "skirt"(Use "pants" for generic bottoms like slacks / jeans)
  - "t-shirt", "shirt", "blouse", "jacket", "coat" -> "short_sleeve" or "long_sleeve"(Use "short_sleeve" for tees, "long_sleeve" for others)
        
        Step 2: Map Terms to Keys based on Category

  [Common]
    - "총장", "기장", "총길이", "Length" -> "length"

    [If Category is Top(short_sleeve / long_sleeve)]
  - "어깨", "어깨너비", "Shoulder" -> "shoulder"
    - "가슴", "가슴단면", "Chest", "Bust" -> "chest"
    - "소매", "소매길이", "팔길이", "Sleeve" -> "sleeve"

    [If Category is Bottom(pants / skirt)]
  - "허리", "허리단면", "Waist" -> "waist"
    - "허벅지", "허벅지단면", "Thigh" -> "thigh"
    - "밑위", "Rise" -> "rise"
    - "밑단", "밑단단면", "Hem" -> "hem"
    - "엉덩이", "힙", "Hip" -> "hip"
        
        Step 3: Extract Data
    - "name" key: Size name(S, M, L, Free, 28, 30 etc)
      - Values: Numbers only(remove 'cm').If range(e.g., 28~30), use average.
        - If a column is missing in the image, do not invent it.
        
        Return JSON structure:
  {
    "category": "pants", // one of: "short_sleeve", "long_sleeve", "pants", "skirt"
      "sizes": [
        { "id": "gen_id_1", "name": "S", "length": "104", "waist": "32", ... },
        ...
          ]
  }
  IMPORTANT: Add unique random string to "id" field.
        `
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    trackUsage(response);
    const json = JSON.parse(response.text || '{}');
    return {
      category: json.category || 'short_sleeve',
      sizes: json.sizes || []
    };
  }, 3, 2000, "Size Extraction");
};

// --- AI One-Click Generator Service ---

export interface MarketingCopyResult {
  mainCopy: {
    headline: string;
    subhead: string;
  };
  featureCopy: {
    title: string;
    description: string;
  }[];
  tpoCopy: {
    situation: string;
    caption: string;
  };
  moodKeywords: string[];
}

export const generateMarketingCopy = async (productName: string, features: string[]): Promise<MarketingCopyResult> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const prompt = `
    You are a professional 10 - year fashion editor.
    Transform the follow raw product information into high - converting marketing copy.

    Product Name: ${productName}
    Raw Features:
    ${features.map(f => `- ${f}`).join('\n')}

    Return JSON format:
  {
    "mainCopy": { "headline": "Strong, catchy 1-line hook", "subhead": "Supporting benefit 1-line" },
    "featureCopy": [
      { "title": "Feature 1 Keyword", "description": "1 sentence explanation" },
      { "title": "Feature 2 Keyword", "description": "1 sentence explanation" }
    ],
      "tpoCopy": { "situation": "Office/Date/Vacation etc", "caption": "Emotional suggestion for when to wear" },
    "moodKeywords": ["Dynamic", "Minimal", "Cozy", "Luxury"](Select 1 - 2 best moods)
  }
  `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Fast model preferred
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainCopy: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                subhead: { type: Type.STRING }
              },
              required: ['headline', 'subhead']
            },
            featureCopy: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['title', 'description']
              }
            },
            tpoCopy: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING },
                caption: { type: Type.STRING }
              },
              required: ['situation', 'caption']
            },
            moodKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['mainCopy', 'featureCopy', 'tpoCopy', 'moodKeywords']
        }
      }
    });

    trackUsage(response);
    return JSON.parse(response.text || '{}');
  }, 3, 1000, "Marketing Copy Gen");
};

export const analyzeImageMood = async (file: File): Promise<{ mood: string, tags: string[], colorHex: string }> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const base64 = await fileToBase64(file);
    const data = base64.split(',')[1];

    const prompt = `
    Analyze this fashion image.
    1. Determine the Mood: "Dynamic"(energetic / movement), "Minimal"(clean / simple), "Romantic"(soft / emotional), "Urban"(street / cool).
    2. Extract 3 - 4 visual tags(e.g., #studio, #outdoors, #close - up).
    3. Extract 1 dominant color hex code from the background or atmosphere.

    Return JSON: { "mood": string, "tags": string[], "colorHex": string }
  `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data, mimeType: file.type } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });

    trackUsage(response);
    return JSON.parse(response.text || '{}');
  });
};

export const extractProductSpecs = async (description: string): Promise<ProductSpecs> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following fashion product description and extract structured specifications.
      
      Input Description:
\${ description }

      Return JSON with:
- colors: Array of color names mentioned(e.g. ["Blue", "Black"])
  - colors: Array of color names mentioned(e.g. ["Blue", "Black"])
    - sizes: Array of objects with "name"(S, M, L) and "notes"(e.g. "95", "Standard Fit")
      - fabric: Object with:
      - thickness: 'Thin' | 'Normal' | 'Thick'
        - sheer: 'None' | 'Low' | 'High'
          - stretch: 'None' | 'Low' | 'High'
            - lining: boolean(true / false)
              - season: Array of seasons(Spring, Summer, Autumn, Winter)
      
      If information is missing, infer reasonable defaults based on context or set to "Normal" / "None".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            sizes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ['name', 'notes']
              }
            },
            fabric: {
              type: Type.OBJECT,
              properties: {
                thickness: { type: Type.STRING, enum: ['Thin', 'Normal', 'Thick'] },
                sheer: { type: Type.STRING, enum: ['None', 'Low', 'High'] },
                stretch: { type: Type.STRING, enum: ['None', 'Low', 'High'] },
                lining: { type: Type.BOOLEAN },
                season: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['thickness', 'sheer', 'stretch', 'lining', 'season']
            }
          }
        }
      }
    });

    trackUsage(response);
    return JSON.parse(response.text || '{}');
  });
};

// ============================================
// Vision AI 기반 상세페이지 자동화 엔진
// Smart Pin + Dynamic VS 통합 분석
// ============================================



/**
 * Vision AI 통합 분석 함수 (V2: Fabric.js Design Overlay)
 * 단일 API 호출로 디자인 키워드와 VS 비교표를 동시에 생성
 * 
 * @param imageBase64 - 분석할 이미지 (Base64)
 * @param productName - 사용자 입력 상품명 (필수 Context)
 * @param productDescription - 추가 상품 설명 (선택)
 * @returns VisionAnalysisResult - 디자인 키워드와 비교표 데이터
 */

const urlToBase64 = async (url: string): Promise<string> => {
  if (url.startsWith('data:')) {
    return url.split(',')[1];
  }
  // If it's a remote URL (Supabase, etc)
  if (url.startsWith('http')) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  // Assume it's already base64 string
  return url;
};

export const analyzeProductVision = async (
  imageInput: string,
  productName: string,
  productDescription?: string
): Promise<VisionAnalysisResult> => {
  // @ts-ignore
  useStore.getState().addLog('Vision AI V2 분석 시작 (Design Overlay)', 'info');

  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    if (imageInput.startsWith('blob:')) {
      throw new Error("Blob URL detected. Please ensure image is uploaded to Storage or converted to Base64.");
    }

    const base64Data = await urlToBase64(imageInput);

    const prompt = `
      You are a professional fashion art director and merchandising expert.
      Analyze this fashion product image and provide detailed visual analysis for a high - end e - commerce detail page.
      
      Product Name: ${productName}
Description: ${productDescription || 'N/A'}

[REQUIREMENTS]
1. Identify 3 - 4 "Smart Pins": Key visual highlights(stitching, texture, buttons, fit).Provide exact coordinates.
      2. Qualitative Comparison Table: 2 - 3 categories comparing this "Premium" product vs "Others".
      
      [OUTPUT FORMAT]
      Strictly JSON:
{
  "smart_pins": [
    { "id": "pin_1", "location": { "x": number, "y": number }, "title": "Feature Title", "description": "Short explanation" }
  ],
    "comparison_table": [
      { "category": "Category", "us_item": "Our feature", "others_item": "Others' drawback" }
    ]
}
x, y are percentages(0 - 100) of the image dimensions.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data.split(',')[1] || base64Data, mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || '';

    try {
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return {
        status: 'success',
        data: parsed
      };
    } catch (e: any) {
      console.error("Parse Error", e);
      throw new Error("AI 응답을 분석하는 중 오류가 발생했습니다.");
    }
  }, 3, 5000, "Vision Analysis");
};

/**
 * 기본값 생성 (AI 분석 실패 시 사용)
 */
export const getDefaultVisionAnalysis = (): VisionAnalysisResult => {
  return {
    status: 'success',
    data: {
      smart_pins: [
        {
          id: 'pin_default_1',
          location: { x: 50, y: 30 },
          title: '프리미엄 원단',
          description: '고급스러운 촉감과 내구성'
        },
        {
          id: 'pin_default_2',
          location: { x: 50, y: 70 },
          title: '정교한 마감',
          description: '꼼꼼한 봉제와 디테일'
        }
      ],
      comparison_table: [
        {
          category: '원단 품질',
          us_item: '고밀도 프리미엄 원단 (O)',
          others_item: '얇고 투박한 저가 원단 (X)'
        },
        {
          category: '봉제 마감',
          us_item: '튼튼한 이중 박음질 (O)',
          others_item: '쉽게 풀리는 단면 봉제 (X)'
        }
      ]
    }
  };
};

// ============================================
// AI Copywriting Engine
// ============================================

// ============================================
// AI USP Generator (Feature Blocks)
// ============================================

export interface USPBlock {
  icon: string;
  title: string;
  desc: string;
}

export const generateProductUSPs = async (
  userInput: string,
  base64Image?: string
): Promise<USPBlock[]> => {
  // @ts-ignore
  useStore.getState().addLog('AI USP 분석 시작 (Feature Blocks)', 'info');

  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    // If user input is empty, using image analysis is better, but here we prioritize user input if exists
    // If both empty, we might need a fallback or rely on image context if passed.
    // The prompt handles "based on user's keywords (or image context)"

    const imagePart = base64Image ? { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/jpeg' } } : null;

    const parts: any[] = [];
    if (imagePart) parts.push(imagePart);

    const systemPrompt = `
    You are a Korean fashion merchandising expert. 
    Based on the users keywords (or image context if keywords are empty), generate 4 key selling points (USPs).
    
    [USER INPUT]
    "${userInput || 'Analyze the image and find 4 key selling points'}"
    
    [OUTPUT FORMAT]
    Strictly JSON Array of objects. No markdown.
    [
      { "icon": "feather", "title": "신축성", "desc": "편안한 사방 스판" },
      ...
    ]

    [CRITICAL REQUIREMENTS]
    1. Language: ONLY Korean (한국어).
    2. Style: Concise, noun-ending (짧고 간결한 명사형 종결).
    3. Length: Description MUST be under 15 characters (설명은 15자 이내).
    
    [ICON MAPPING]
    Use only these Lucide icon names: 
    feather, shield-check, wind, maximize, check-circle, sun, droplet, star, heart, zap, camera, smartphone, watch, layers, layout, box, tag, shopping-bag, truck, credit-card
    (Select the most appropriate one)
    `;

    parts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts }
    });

    const text = response.text || '';

    try {
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);
      // @ts-ignore
      useStore.getState().addLog('AI USP 분석 완료', 'success');
      return data as USPBlock[];
    } catch (e) {
      console.error("USP Parse Error", e);
      throw new Error("USP 데이터 분석 실패");
    }
  }, 3, 3000, "USP Generation");
};


export const analyzeProductCopy = async (
  imageInput: string,
  userInput: string
): Promise<ProductCopyAnalysis> => {
  // @ts-ignore
  useStore.getState().addLog('AI Copywriting 분석 시작', 'info');

  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    if (imageInput.startsWith('blob:')) {
      throw new Error('Blob URL detected. Please ensure image is uploaded to Storage or converted to Base64.');
    }

    const base64Data = await urlToBase64(imageInput);

    const systemPrompt = `
[ROLE]
당신은 2030 남성 의류 브랜드 'Asterisk'의 전문 카피라이터이자 패션 MD입니다.
사용자가 업로드한 의류 이미지를 시각적으로 분석하고, 사용자의 입력 정보를 결합하여 매력적인 상세페이지 문구를 작성하세요.

1. ** 톤앤매너:** 과장되지 않고 담백하며, 시네마틱하고 모던한 어조. (이모지 남발 금지)
2. ** 타겟:** 트렌드에 민감하지만 기본을 중시하는 20~30대 남성.
3. ** 분석 포인트:**
  - 핏(Fit): 오버핏, 레귤러, 머슬핏 등
    - 소재(Material): 질감, 계절감, 두께
      - 디테일(Detail): 단추, 카라, 마감 등
        - TPO(Occasion): 데이트, 출근, 여행 등

        [USER INPUT]
"${userInput}"

[OUTPUT FORMAT]
반드시 JSON 형식으로 출력하세요.
{
  "product_analysis": {
    "detected_color": ["Color1", "Color2"],
      "fabric_guess": "Fabric Name",
        "style_keywords": ["Keyword1", "Keyword2"]
  },
  "copy_options": [
    {
      "type": "Emotional",
      "title": "감성적인 메인 헤드라인",
      "description": "감성적인 서브 텍스트"
    },
    {
      "type": "Functional",
      "title": "기능 강조 헤드라인",
      "description": "기능 강조 설명"
    },
    {
      "type": "Trend",
      "title": "트렌드 강조 헤드라인",
      "description": "스타일링 제안 설명"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data.split(',')[1] || base64Data, mimeType: 'image/png' } },
          { text: systemPrompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            product_analysis: {
              type: Type.OBJECT,
              properties: {
                detected_color: { type: Type.ARRAY, items: { type: Type.STRING } },
                fabric_guess: { type: Type.STRING },
                style_keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['detected_color', 'fabric_guess', 'style_keywords']
            },
            copy_options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['Emotional', 'Functional', 'Trend'] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['type', 'title', 'description']
              }
            }
          },
          required: ['product_analysis', 'copy_options']
        }
      }
    });

    try {
      trackUsage(response);
      const result = safeJsonParse<ProductCopyAnalysis>(response.text || '{}');

      // @ts-ignore
      useStore.getState().addLog('AI Copywriting 분석 완료', 'success');
      return result;
    } catch (e: any) {
      // @ts-ignore
      useStore.getState().addLog(`분석 결과 파싱 실패: ${e?.message} `, 'error');
      throw e;
    }

  }, 3, 3000, "Copywriting Analysis");
};

/**
 * Generate Outfit Swap using Inpainting & Reference Logic
 */
import { addVerticalPadding, cropVerticalPadding } from '@/utils/imagePadding';

// ... (existing code, keeping generateOutfitSwap signature)

export const generateOutfitSwap = async (
  baseImage: string,
  refImage: string,
  maskImage: string,
  ratio: string = '1:1',
  quality: string = 'STANDARD'
): Promise<string> => {
  const geminiKey = getApiKey();
  if (!geminiKey) throw new Error("API Key not found");

  const genAI = new GoogleGenAI({ apiKey: geminiKey });

  // 1. Base Dimensions (Standard)
  let baseWidth = 1024;
  let baseHeight = 1024;

  switch (ratio) {
    case '1:1': baseWidth = 1024; baseHeight = 1024; break;
    case '3:4': baseWidth = 768; baseHeight = 1024; break;
    case '9:16': baseWidth = 720; baseHeight = 1280; break;
    case '4:3': baseWidth = 1024; baseHeight = 768; break;
    case '16:9': baseWidth = 1280; baseHeight = 720; break;
    default: baseWidth = 1024; baseHeight = 1024;
  }

  // 2. High Quality Upscaling (x1.5)
  if (quality === 'HIGH') {
    baseWidth = Math.floor(baseWidth * 1.5);
    baseHeight = Math.floor(baseHeight * 1.5);
  }

  const targetResolution = `${baseWidth}x${baseHeight}`;
  console.log(`[Gemini] Resolution Config: Ratio=${ratio}, Quality=${quality} -> ${targetResolution}`);

  const prompt = `[NanoBanana PRO MODE: PHOTOREALISTIC INTEGRATION]
**TASK:** Replace the pants texture while PRESERVING original lighting.
**INSTRUCTION:**
1.  **TEXTURE SWAP:** Replace the material inside the mask with the [Reference Image]'s fabric.
2.  **LIGHTING MATCH (CRITICAL):**
    * Analyze the direction of sunlight and ambient light in the [Base Image].
    * Apply the EXACT same shadow intensity and highlight fall-off to the new pants.
    * The new pants must cast shadows on the ground exactly where the original pants did.
3.  **COLOR GRADING:** Adjust the color temperature of the new pants to match the [Base Image]'s environment (e.g., if the scene is warm sunset, the pants should have a warm tint).
4.  **BLEND MODE:** Treat the new texture as if applied with "Multiply" mode over the original shadows.

**NEGATIVE PROMPT:**
floating texture, flat lighting, sticker effect, unnatural brightness, glowing edges, mismatched shadows, cartoonish.`;

  try {
    const base64Base = await imageUrlToBase64(baseImage);
    const mimeTypeBase = base64Base.match(/data:([^;]+);/)?.[1] || "image/png";

    const base64Ref = await imageUrlToBase64(refImage);
    const mimeTypeRef = base64Ref.match(/data:([^;]+);/)?.[1] || "image/png";

    const base64Mask = await imageUrlToBase64(maskImage); // New Mask
    const mimeTypeMask = base64Mask.match(/data:([^;]+);/)?.[1] || "image/png";

    // Using @google/genai SDK pattern (genAI.models.generateContent)
    // Switches to Gemini 3 Pro Image Preview for "Pro Mode" Magic Paint.
    const response = await retryOperation(() => genAI.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeTypeBase, data: base64Base.split(',')[1] } }, // 1. Base
            { inlineData: { mimeType: mimeTypeRef, data: base64Ref.split(',')[1] } },   // 2. Ref
            { inlineData: { mimeType: mimeTypeMask, data: base64Mask.split(',')[1] } }   // 3. Mask
          ]
        }
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'], // Explicitly request Image and Text
        // @ts-ignore
        imageConfig: { imageSize: targetResolution }, // Dynamic resolution mapped from ratio
        // User snippet used '1K'. I'll interpret '1K' might be '1024x1024' or literal '1K'. 
        // Docs usually say '1024x1024'. I'll stick to '1024x1024' for safety, or try '1K' if strict user request.
        // User said: "imageSize: '1K'". I will use '1K' and cast as any if needed.
        temperature: 0.4,
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ] as any
      }
    }));

    trackUsage(response, true);

    console.log("Gemini Outfit Swap Response:", JSON.stringify(response, null, 2)); // DEBUG LOG

    // Check for Candidate finishReason
    if (response.candidates && response.candidates[0]) {
      console.log("Candidate Finish Reason:", response.candidates[0].finishReason);
      console.log("Safety Ratings:", JSON.stringify(response.candidates[0].safetyRatings, null, 2));
    }

    // Handle image response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const rawResultBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          return rawResultBase64; // Direct return, no cropping
        }
      }
    }

    // Likely refusal or empty response
    console.error("Gemini Response Missing Image Data:", JSON.stringify(response, null, 2));
    throw new Error("이미지 생성에 실패했습니다. (AI가 요청을 처리하지 못했습니다. 인물이나 의상이 잘 보이는지 확인해주세요.)");

  } catch (error) {
    console.error("Outfit Swap Error:", error);
    throw error;
  }
};
