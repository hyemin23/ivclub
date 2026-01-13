
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
  GenerationConfig
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

const anglePrompts: Record<CameraAngle, string> = {
  'default': 'Original Angle',
  'front': 'FRONT FACING (0°). Model faces directly forward. Symmetrical view. Both ears visible.',
  'left-30': 'LOOKING LEFT (30°). Face and Body turned slightly to the LEFT. LEFT EAR MUST BE VISIBLE. Nose points to the left side of the image.',
  'left-40': 'LOOKING LEFT (45°). Face and Body turned 45 degrees to the LEFT. LEFT EAR CLEARLY VISIBLE. Left side profile.',
  'right-30': 'LOOKING RIGHT (30°). TURN BODY TO THE RIGHT (Viewer-Right). RIGHT shoulder must be FOREGROUND (Closest to camera). Left shoulder BACKGROUND. Chest points strictly to the RIGHT side of image. [NEGATIVE: Do NOT face left. Do NOT face front.]',
  'right-40': 'LOOKING RIGHT (45°). ROTATE BODY TO THE RIGHT (Viewer-Right). Strong diagonal. RIGHT shoulder is closest to viewer. Chest facing the RIGHT edge of canvas. [NEGATIVE: Absolutely NO left turn.]',
  'left-side': 'SIDE PROFILE (LEFT 90°). Full side view facing LEFT. Nose points strictly LEFT. Only Left ear visible.',
  'right-side': 'SIDE PROFILE (RIGHT 90°). Full side view facing RIGHT. Shoulder points to camera. RIGHT shoulder is FOREGROUND. Nose points strictly RIGHT. [NEGATIVE: Do NOT face left.]'
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
  Target Angle: ${anglePrompts[cameraAngle]}

  IF the requested angle is DIFFERENT from the original image:
  - You MUST ROTATE the model and the clothing.
  - You MUST IMAGINE and GENERATE the unseen side of the garment based on the visible side.
  - Do NOT just mirror the image. Realistically rotate the 3D form of the subject.
  - If asking for "Left Side", show the LEFT part of the person (even if original showed Right).

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
    const anglePrompt = anglePrompts[cameraAngle] || anglePrompts['default'];

    let systemPrompt = `
    [NANO BANANA POSE CHANGE]
    
    [PRIORITY ORDER]
    1. TARGET ANGLE (Most Important)
    2. Base Prompt
    
    [CAMERA ANGLE INSTRUCTION - HIGHEST PRIORITY]
    Target Angle: ${anglePrompt}
    ACTION: ROTATE the subject to match this angle. This instruction overrides any conflicting details in the Base Prompt regarding orientation.
    
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
- Target Angle: ${anglePrompt}
${allowRotation ? `- ROTATE the subject to match the Target Angle: ${anglePrompt}` : `- Maintain the original pose and angle exactly.`}
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
    return `data:image/png;base64,${part?.inlineData?.data}`;
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

    const anglePrompt = anglePrompts[targetAngle] || anglePrompts['default'];
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
`;
    } else {
        // CASE 2: Angle View Generation (No Background) -> HEADLESS MODE
        
        const headlessAnglePrompts: Record<CameraAngle, string> = {
            'default': 'Original Angle',
            'front': 'FRONT VIEW (0°). Torso faces directly forward. Shoulders symmetrical. Chest parallel to camera.',
            'left-30': 'ANGLED VIEW (Left 30°). Body turned slightly to the LEFT. Right shoulder is closer to camera. Chest points to left side.',
            'left-40': 'SIDE ANGLE (Left 45°). Body turned 45 degrees to the LEFT. Strong diagonal view of torso. Right shoulder prominent.',
            'right-30': 'ANGLED VIEW (Right 30°). TURN BODY TO THE RIGHT (Viewer-Right). RIGHT shoulder must be FOREGROUND (Closest to camera). Left shoulder BACKGROUND. Chest points strictly to the RIGHT side of image. [NEGATIVE: Do NOT face left. Do NOT face front.]',
            'right-40': 'SIDE ANGLE (Right 45°). ROTATE BODY TO THE RIGHT (Viewer-Right). Strong diagonal. RIGHT shoulder is closest to viewer. Chest facing the RIGHT edge of canvas. [NEGATIVE: Absolutely NO left turn.]',
            'left-side': 'SIDE PROFILE (Left 90°). Full side view of torso facing LEFT. Shoulder points to camera.',
            'right-side': 'SIDE PROFILE (Right 90°). Full side view of torso facing RIGHT. Shoulder points to camera.'
        };

        const currentHeadlessPrompt = headlessAnglePrompts[targetAngle] || headlessAnglePrompts['default'];

        masterPrompt = `[NanoBanana PRO MODE]

Use the uploaded image as the MAIN IMAGE.

Framing & crop (IMPORTANT):
- Reframe the image to a full-body composition with the face completely removed
- Crop the image at the neck so NO part of the face remains visible
- Remove all empty space above the neck
- Rebuild the frame so the body fills the canvas naturally

Canvas & aspect ratio:
- Reset the canvas to the target aspect ratio
- Do NOT preserve the original empty upper space
- The subject must be vertically centered and visually balanced within the frame
- The top edge of the frame must start at the neck area

Preserve the subject:
- Keep the entire body from neck to feet visible
- Do not change pose, body proportions, or posture
- Do not change clothing, fabric, color, or fit
- Do not add or remove accessories

Background & lighting:
- Keep the original background and lighting unchanged
- Maintain natural shadows and ground contact

Restrictions:
- Reframing and cropping only
- No face visible
- No background extension
- No pose or style changes
- No text, logos, or graphic elements

Output:
- Clean, realistic fashion image
- Correctly framed, commercial e-commerce quality

[DIRECTION & ANGLE]
${currentHeadlessPrompt}

${userPrompt ? `[ADDITIONAL INSTRUCTION]\n${userPrompt}` : ''}
`;
    }

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
    if (!part?.inlineData) throw new Error("Auto Fitting generation failed");

    return `data:image/png;base64,${part?.inlineData?.data}`;
  }, 5, 2000, "Auto Fitting", signal);
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
