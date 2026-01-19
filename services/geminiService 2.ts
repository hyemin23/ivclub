
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
  SizeCategory,
  SizeRecord,
  ProductSpecs,
  FabricInfo
} from "../types";
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

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
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

export const generateDetailExtra = async (baseImage: string, refImage: string | null, prompt: string, resolution: Resolution, aspectRatio: AspectRatio): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const parts: any[] = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }];
    if (refImage) parts.push({ inlineData: { data: refImage.split(',')[1], mimeType: 'image/png' } });

    const finalPrompt = prompt || "Clean e-commerce detail cutout view, white background.";
    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio, imageSize: resolution } }
    });
    trackUsage(response);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return `data:image/png;base64,${part?.inlineData?.data}`;
  });
};

export const generateBackgroundChange = async (baseImage: string, bgRefImage: string | null, userPrompt: string, resolution: Resolution, aspectRatio: AspectRatio, faceOptions?: any, signal?: AbortSignal): Promise<string> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const parts: any[] = [{ inlineData: { data: baseImage.split(',')[1] || baseImage, mimeType: 'image/png' } }];
    if (bgRefImage) parts.push({ inlineData: { data: bgRefImage.split(',')[1] || bgRefImage, mimeType: 'image/png' } });

    let finalPrompt = userPrompt;

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
- Add natural ground contact and soft shadows
- Seamless composite with no cutout artifacts

Restrictions:
- Background change only
- No stylization, no cinematic filters
- No text, logos, or graphic elements

Output:
- High-resolution, realistic fashion image
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

    parts.push({ text: finalPrompt });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio, imageSize: resolution } }
    });
    trackUsage(response);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return `data:image/png;base64,${part?.inlineData?.data}`;
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
    return `data:image/png;base64,${part?.inlineData?.data}`;
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
          { text: `Model wearing the product. Pose: ${pose.prompt}. Target: ${analysis.category}. Model Gender: ${analysis.gender || 'Female'}` }
        ]
      },
      config: { imageConfig: { aspectRatio: "9:16", imageSize: resolution } }
    });
    trackUsage(response, true);
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return `data:image/png;base64,${part?.inlineData?.data}`;
  });
};

export const planDetailSections = async (analysis: any, name: string): Promise<any[]> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a plan for a fashion detail page for ${name} (${analysis.category}). Return 5 sections as JSON items: title, logicalSection, keyMessage, visualPrompt.`,
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
      contents: `Create a product detail page plan for ${product.name}. Length: ${length}. Return as JSON array: title, logicalSection, keyMessage, visualPrompt.`,
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
    return `data:image/png;base64,${part?.inlineData?.data}`;
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
    return `data:image/png;base64,${part?.inlineData?.data}`;
  });
};

export const generateAutoFitting = async (
  baseImage: string,
  bgImage: string | null,
  userPrompt: string,
  targetAngle: CameraAngle,
  aspectRatio: AspectRatio,
  resolution: Resolution,
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

    if (bgImage) {
      // CASE 1: Background Replacement + Angle Consistency (Original Logic)
      masterPrompt = `[NanoBanana PRO MODE]

Use the first uploaded image as the MAIN IMAGE (person source).
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
- High-resolution, realistic fashion image
- Correct camera angle if requested

[CAMERA ANGLE INSTRUCTION]
Target Angle: ${anglePositive}
IF the requested angle is DIFFERENT from the original:
- ROTATE the subject to match the angle on the new background.
- Adjust the perspective to match the background.

[NEGATIVE PROMPT]
${angleNegative}
`;
    } else {
      const currentHeadlessPrompt = anglePrompts[targetAngle]?.positive || 'Original Angle';

      masterPrompt = `[NanoBanana PRO MODE - ANGLE VIEW]
    
    Use the first uploaded image as the MAIN IMAGE.
    
    Framing & crop (IMPORTANT):
    - **HEADLESS CROP**: Reframe to a neck-down composition.
    - Crop the image at the neck so NO part of the face remains visible.
    - Remove all empty space above the neck.
    - Rebuild the frame so the body (neck to feet) fills the canvas naturally, cutting off the head.
    
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
    - Keep the original background and lighting unchanged.
    - Maintain natural shadows and ground contact.
    
    Output:
    - Correctly framed (Headless), commercial e-commerce quality.
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

    return `data:image/png;base64,${part?.inlineData?.data}`;

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
    [VIRTUAL TRY-ON MODE]
    
    Image 1: Model (Target Person)
    Image 2: Garment (Reference Product)
    Category: ${category.toUpperCase()}

    TASK:
    - Replace the ${category} on the Model (Image 1) with the Garment from Image 2.
    - Keep the Model's face, hair, pose, skin tone, and background EXACTLY the same.
    - Keep other clothing items unchanged (e.g. if category is 'top', keep pants/shoes).
    
    EXECUTION:
    1. Identify the ${category} area on the Model.
    2. Warp and fit the Garment (Image 2) onto that area.
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

    return `data:image/png;base64,${part?.inlineData?.data}`;
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
  Image 2: Mask Image (Red stroke indicates area to remove)
  
  TASK: Remove the object/text/element covered by the Red/Masked area in Image 1.
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

    return `data:image/png;base64,${part?.inlineData?.data}`;
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
        - "pants", "slacks", "jeans", "skirt" -> "pants" or "skirt" (Use "pants" for generic bottoms like slacks/jeans)
        - "t-shirt", "shirt", "blouse", "jacket", "coat" -> "short_sleeve" or "long_sleeve" (Use "short_sleeve" for tees, "long_sleeve" for others)
        
        Step 2: Map Terms to Keys based on Category
        
        [Common]
        - "총장", "기장", "총길이", "Length" -> "length"
        
        [If Category is Top (short_sleeve/long_sleeve)]
        - "어깨", "어깨너비", "Shoulder" -> "shoulder"
        - "가슴", "가슴단면", "Chest", "Bust" -> "chest"
        - "소매", "소매길이", "팔길이", "Sleeve" -> "sleeve"
        
        [If Category is Bottom (pants/skirt)]
        - "허리", "허리단면", "Waist" -> "waist"
        - "허벅지", "허벅지단면", "Thigh" -> "thigh"
        - "밑위", "Rise" -> "rise"
        - "밑단", "밑단단면", "Hem" -> "hem"
        - "엉덩이", "힙", "Hip" -> "hip"
        
        Step 3: Extract Data
        - "name" key: Size name (S, M, L, Free, 28, 30 etc)
        - Values: Numbers only (remove 'cm'). If range (e.g., 28~30), use average.
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
      model: 'gemini-2.0-flash-exp',
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
    You are a professional 10-year fashion editor.
    Transform the follow raw product information into high-converting marketing copy.

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
      "moodKeywords": ["Dynamic", "Minimal", "Cozy", "Luxury"] (Select 1-2 best moods)
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Fast model preferred
      contents: prompt,
      config: { responseMimeType: "application/json" }
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
    1. Determine the Mood: "Dynamic" (energetic/movement), "Minimal" (clean/simple), "Romantic" (soft/emotional), "Urban" (street/cool).
    2. Extract 3-4 visual tags (e.g., #studio, #outdoors, #close-up).
    3. Extract 1 dominant color hex code from the background or atmosphere.

    Return JSON: { "mood": string, "tags": string[], "colorHex": string }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
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
      model: 'gemini-2.0-flash-exp',
      contents: `Analyze the following fashion product description and extract structured specifications.
      
      Input Description:
      \${description}

      Return JSON with:
      - colors: Array of color names mentioned (e.g. ["Blue", "Black"])
      - sizes: Object where key is size name (S, M, L) and value is short notes (e.g. "95", "Standard Fit")
      - fabric: Object with:
        - thickness: 'Thin' | 'Normal' | 'Thick'
        - sheer: 'None' | 'Low' | 'High'
        - stretch: 'None' | 'Low' | 'High'
        - lining: boolean (true/false)
        - season: Array of seasons (Spring, Summer, Autumn, Winter)
      
      If information is missing, infer reasonable defaults based on context or set to "Normal"/"None".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            sizes: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } },
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

import { SmartPin, VsComparisonItem, VisionAnalysisResult } from '../types';

/**
 * Vision AI 통합 분석 함수
 * 단일 API 호출로 Smart Pin과 VS 비교표를 동시에 생성
 * 
 * @param imageBase64 - 분석할 이미지 (Base64)
 * @param productDescription - 추가 상품 설명 (선택)
 * @returns VisionAnalysisResult - 핀 데이터와 비교표 데이터
 */
export const analyzeProductVision = async (
  imageBase64: string,
  productDescription?: string
): Promise<VisionAnalysisResult> => {
  // @ts-ignore
  useStore.getState().addLog('Vision AI 통합 분석 시작 (Smart Pin + VS)', 'info');

  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const systemPrompt = `
[ROLE]
너는 이커머스 매출을 극대화하는 전문 MD이자 비주얼 디렉터야.

[TASK]
업로드된 상품 이미지를 시각적으로 분석해서 두 가지 작업을 동시에 수행해:

1. **Pin Pointing (Smart Pin 생성)**:
   - 소비자가 매력을 느낄만한 포인트(소재, 핏, 디테일) 2~4곳을 찾아
   - 각 포인트의 이미지 상 대략적 좌표(x, y %)와 함께
   - 매력적인 짧은 제목(title)과 설명(description)을 작성해
   - 좌표는 이미지 좌상단 (0,0) ~ 우하단 (100,100) 기준

2. **Comparison Strategy (VS 비교표 생성)**:
   - 위에서 찾은 장점을 바탕으로
   - 일반적인 저가형 경쟁사 제품이 가질법한 치명적인 단점을 역추론해
   - [카테고리 - 우리 장점(us_item) - 경쟁사 단점(others_item)] 형태로 2~4개 구성
   - 우리 장점에는 "(O)", 경쟁사 단점에는 "(X)" 표시 포함

[ADDITIONAL CONTEXT]
${productDescription || '(추가 설명 없음)'}

[CONSTRAINTS]
- 좌표는 반드시 0~100 사이의 정수(%)로 반환
- 핀 ID는 "pin_1", "pin_2" 형식으로
- 실제 이미지에서 보이는 특징만 분석 (추측 최소화)
- 비교표에서 우리 제품은 이미지 근거, 경쟁사는 합리적 추론
- 반드시 지정된 JSON 포맷으로만 응답할 것
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: 'image/png' } },
          { text: systemPrompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ['success', 'error'] },
            data: {
              type: Type.OBJECT,
              properties: {
                smart_pins: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      location: {
                        type: Type.OBJECT,
                        properties: {
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER }
                        },
                        required: ['x', 'y']
                      },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ['id', 'location', 'title', 'description']
                  }
                },
                comparison_table: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      us_item: { type: Type.STRING },
                      others_item: { type: Type.STRING }
                    },
                    required: ['category', 'us_item', 'others_item']
                  }
                }
              },
              required: ['smart_pins', 'comparison_table']
            }
          },
          required: ['status', 'data']
        }
      }
    });

    trackUsage(response);
    const result = JSON.parse(response.text || '{}') as VisionAnalysisResult;

    // 성공 로깅
    const pinCount = result?.data?.smart_pins?.length || 0;
    const vsCount = result?.data?.comparison_table?.length || 0;
    // @ts-ignore
    useStore.getState().addLog(`Vision 분석 완료: ${pinCount}개 핀, ${vsCount}개 비교 항목`, 'success');

    return result;

  }, 3, 2000, "Vision AI Analysis");
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
