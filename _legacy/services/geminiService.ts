
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ProductCategory, 
  ProductAnalysis, 
  DetailSection, 
  Resolution, 
  SizeData, 
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

export type GeminiErrorType = 'safety' | 'quota' | 'auth' | 'invalid' | 'unknown';

export interface GeminiErrorResponse {
  message: string;
  type: GeminiErrorType;
}

const getApiKey = () => {
  return (typeof process !== 'undefined' && process.env?.API_KEY) || '';
};

export const parseGeminiError = (error: any): GeminiErrorResponse => {
  const msg = error?.message || String(error);
  console.error("Gemini API Error Detail:", error);

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
  
  return { 
    message: msg || "알 수 없는 오류가 발생했습니다.", 
    type: 'unknown' 
  };
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

export const refinePrompt = async (data: { productFeatures: string, stylingCoordination: string, targetAudience: string }) => {
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
  return JSON.parse(response.text || '{}');
};

export const generateFashionContent = async (config: GenerationConfig, locationPrompt: string): Promise<{imageUrl: string, prompt: string}> => {
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

  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error("Image generation failed");

  return {
    imageUrl: `data:image/png;base64,${part.inlineData.data}`,
    prompt: finalPrompt
  };
};

export const generateFittingVariation = async (
  baseImage: string, 
  refImage: string | null, 
  userPrompt: string, 
  viewMode: ViewMode, 
  resolution: Resolution, 
  aspectRatio: AspectRatio, 
  faceOptions?: any, 
  cameraAngle: CameraAngle = 'default'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const parts: any[] = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }];
  
  if (refImage) {
    parts.push({ inlineData: { data: refImage.split(',')[1], mimeType: 'image/png' } });
  }

  const anglePrompts: Record<CameraAngle, string> = {
    'default': 'Original Angle',
    'front': '0° (Strict Front Facing)',
    'left-30': 'Left 30–45° (Natural Quarter View)',
    'right-30': 'Right 30–45° (Natural Quarter View)',
    'left-90': 'Left 90° (Full Profile)',
    'right-90': 'Right 90° (Full Profile)',
    'left-135': 'Left 120–150° (Back Diagonal)',
    'right-135': 'Right 120–150° (Back Diagonal)',
    'back': '180° (Full Back View)'
  };

  const framingPrompts: Record<ViewMode, string> = {
    'full': 'Full body shot from head to toe.',
    'top': 'Upper body shot, waist up focus.',
    'bottom': 'Lower body shot, waist down focus.'
  };

  let masterPrompt = `[NanoBanana PRO MODE]

Use the first uploaded image as the MAIN IMAGE.
Use the second uploaded image as a POSE REFERENCE ONLY.

Preserve the main image EXACTLY as it is:
- Background, environment, and setting
- Lighting, shadows, and color tone
- Camera angle, framing, and perspective (UNLESS overridden below)
- Clothing, materials, colors, and textures
- Body proportions, face, hair, and accessories

From the reference image, extract ONLY the body pose and posture.
Apply the pose naturally to the main image subject.

CRITICAL RULE:
Do NOT use the reference image’s background, lighting, colors, or environment in any way.
The reference image is for pose guidance only.

Pose adjustment rules:
- Match overall body orientation and posture
- Keep the pose realistic and wearable
- Make smooth, natural transitions
- Avoid extreme or exaggerated movements

Restrictions:
- Do NOT change the background
- Do NOT change clothing or styling
- Do NOT add or remove accessories

[USER OVERRIDES & OPTIONAL SPECIFICATIONS]
- Target Camera Angle: ${anglePrompts[cameraAngle]}
- Target Framing: ${framingPrompts[viewMode]}
${userPrompt ? `- Additional Instructions: ${userPrompt}` : ''}
${faceOptions?.faceMode === 'ON' ? `- Identity Integrity: Maintain the ${faceOptions.gender} model's facial features clearly.` : ''}

Output:
- Same background as the original image
- Same lighting and mood
- Only the pose and viewpoint are adjusted according to overrides
- High-resolution, realistic fashion image
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

  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error("Fitting Variation generation failed");

  return `data:image/png;base64,${part.inlineData.data}`;
};

export const analyzeProduct = async (image: string, userDescription: string): Promise<ProductAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: image.split(',')[1], mimeType: 'image/png' } },
        { text: `Analyze fashion product and return JSON: category, fit, materialType, season, keyPoints.` }
      ]
    },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};

export const generatePoseChange = async (baseImage: string, refImage: string | null, prompt: string, resolution: Resolution, aspectRatio: AspectRatio, faceOptions?: any, cameraAngle: CameraAngle = 'default'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const parts: any[] = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }];
  if (refImage) parts.push({ inlineData: { data: refImage.split(',')[1], mimeType: 'image/png' } });
  
  const finalPrompt = prompt || "Natural professional model standing pose, clean minimalist setting.";
  parts.push({ text: `${finalPrompt}\nAspect Ratio: ${aspectRatio}` });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: { imageConfig: { aspectRatio, imageSize: resolution } }
  });
  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  return `data:image/png;base64,${part?.inlineData?.data}`;
};

export const generateDetailExtra = async (baseImage: string, refImage: string | null, prompt: string, resolution: Resolution, aspectRatio: AspectRatio): Promise<string> => {
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
  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  return `data:image/png;base64,${part?.inlineData?.data}`;
};

export const generateBackgroundChange = async (baseImage: string, bgRefImage: string | null, userPrompt: string, resolution: Resolution, aspectRatio: AspectRatio, faceOptions?: any): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const parts: any[] = [{ inlineData: { data: baseImage.split(',')[1] || baseImage, mimeType: 'image/png' } }];
    if (bgRefImage) parts.push({ inlineData: { data: bgRefImage.split(',')[1] || bgRefImage, mimeType: 'image/png' } });
    
    parts.push({ text: userPrompt });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio, imageSize: resolution } }
    });
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    return `data:image/png;base64,${part?.inlineData?.data}`;
};

export const generateTechSketch = async (category: string, name: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: `Technical flat sketch of a ${category} named ${name}, minimalist white background, black lines.`,
    config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
  });
  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  return `data:image/png;base64,${part?.inlineData?.data}`;
};

export const generateFactoryPose = async (baseImage: string, pose: any, analysis: any, resolution: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } },
        { text: `Model wearing the product. Pose: ${pose.prompt}. Target: ${analysis.category}.` }
      ]
    },
    config: { imageConfig: { aspectRatio: "9:16", imageSize: resolution } }
  });
  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  return `data:image/png;base64,${part?.inlineData?.data}`;
};

export const planDetailSections = async (analysis: any, name: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a plan for a fashion detail page for ${name} (${analysis.category}). Return 5 sections as JSON items: title, logicalSection, keyMessage, visualPrompt.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '[]');
};

export const planDetailPage = async (product: ProductInfo, length: PageLength): Promise<DetailImageSegment[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a product detail page plan for ${product.name}. Length: ${length}. Return as JSON array: title, logicalSection, keyMessage, visualPrompt.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '[]');
};

export const generateSectionImage = async (segment: DetailImageSegment, baseImages: File[], resolution: Resolution): Promise<string> => {
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
  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  return `data:image/png;base64,${part?.inlineData?.data}`;
};

export const generateLookbookImage = async (base64: string, description: string, analysis: any, resolution: any): Promise<string> => {
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
  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  return `data:image/png;base64,${part?.inlineData?.data}`;
};

export const generateImages = async (prompt: string, baseImages: File[], resolution: Resolution, layoutMode: string, viewMode: ViewMode, count: number): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const imageParts = await Promise.all(baseImages.map(async f => ({
    inlineData: { data: (await fileToBase64(f)).split(',')[1], mimeType: f.type }
  })));
  
  const tasks = Array.from({ length: count }).map(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: `${prompt}. View: ${viewMode}. Layout: ${layoutMode}` }
        ]
      },
      config: { imageConfig: { aspectRatio: "1:1", imageSize: resolution } }
    });
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    return `data:image/png;base64,${part?.inlineData?.data}`;
  });

  return Promise.all(tasks);
};
