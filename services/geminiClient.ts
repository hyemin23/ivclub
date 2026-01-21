import { GoogleGenAI, HarmCategory, HarmBlockThreshold, SafetySetting, ToolConfig } from "@google/genai";
import { useStore } from "../store";

// Helper to get API Key (Shared logic)
const getApiKey = () => {
  const state = useStore.getState();
  const activeKeyId = state.activeKeyId;
  const foundKey = state.apiKeys?.find(k => k.id === activeKeyId);
  if (foundKey) return foundKey.key;
  // Fallback to env or localStorage
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY) return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (typeof window !== 'undefined') return localStorage.getItem('gemini_api_key') || '';
  return '';
};

// 🛡️ Safety Settings
const SAFETY_SETTINGS_BLOCK_NONE: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// 🚫 Tool Use Disable
const TOOL_CONFIG_NONE: ToolConfig = {
  functionCallingConfig: { mode: 'NONE' as any }
};

// 🏗️ Model Constants & Fallback Lists
export const GEMINI_MODELS = {
  HIGH_QUALITY: "gemini-3-pro-preview",
  IMAGE_GEN: "gemini-3-pro-image-preview",
  EDIT_STABLE: "gemini-3-pro-image-preview", // 💡 Updated to Image Specialist
};

// 🚨 [Corrected] Confirmed Active Models (Jan 2026)
const MODEL_FALLBACK_LIST = [
  "gemini-3-pro-image-preview", // 🏆 1st: Image Specialist (Nano Banana Pro)
  "gemini-3-pro-preview",       // 🥈 2nd: General Logic Pro
  "gemini-2.5-pro",             // 🥉 3rd: Stable Backup
  "gemini-2.5-flash"            // ⚡️ 4th: Speed/Fallback
];

const FALLBACK_STRATEGIES = {
  // Image Editing: Must use Image Specialist first!
  EDIT: MODEL_FALLBACK_LIST, 

  // Text/Analysis: Can start with Logic Pro
  TEXT: ["gemini-3-pro-preview", "gemini-2.5-pro", "gemini-2.5-flash"],

  // Image Creation: Explicitly use Image Specialist
  CREATION: ["gemini-3-pro-image-preview"],
};

export interface GeminiResponse {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
  usedModel: string;
}

/**
 * 🛠️ Universal Gemini Client with Fallback & Retry
 */
export async function generateContentSafe(
  prompt: string,
  parts: any[] = [],
  options: { 
    taskType?: 'CREATION' | 'EDIT' | 'TEXT', 
    model?: string, // Override model
    config?: any 
  } = { taskType: 'TEXT' }
): Promise<GeminiResponse> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Determine Model List
  let modelList = FALLBACK_STRATEGIES[options.taskType || 'TEXT'];
  
  // If specific model requested, try it first
  if (options.model) {
     modelList = [options.model, ...modelList.filter(m => m !== options.model)];
  }

  // Deduplicate
  modelList = Array.from(new Set(modelList));

  let lastError: any = null;

  for (const modelName of modelList) {
    try {
      console.log(`🤖 Model Attempt: ${modelName} (${options.taskType})`);

      const requestConfig = {
        model: modelName,
        contents: {
          parts: [
            { text: prompt },
            ...parts
          ]
        },
        config: {
          safetySettings: SAFETY_SETTINGS_BLOCK_NONE,
          toolConfig: TOOL_CONFIG_NONE,
          ...(options.config || {})
        }
      };

      // @ts-ignore
      const result = await ai.models.generateContent(requestConfig);
      
      // Handle Image Response (inlineData)
      const imagePart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (imagePart?.inlineData?.data) {
        console.log(`✅ Generation Success! (Used: ${modelName})`);
        return {
          inlineData: {
            data: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType || 'image/png'
          },
          usedModel: modelName
        };
      }

      // Handle Text Response
      const textPart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
      if (textPart?.text) {
        console.log(`✅ Generation Success! (Used: ${modelName})`);
        return {
          text: textPart.text,
          usedModel: modelName
        };
      }

      throw new Error("Empty response from AI (No Text/Image)");

    } catch (error: any) {
      console.warn(`⚠️ ${modelName} Failed. Reason:`, error.message);
      lastError = error;
      
      const isTransient = error.message.includes('503') || error.message.includes('429') || error.message.includes('overloaded');
      
      if (isTransient) {
        console.log("⏳ Transient error, waiting 1s...");
        await new Promise(r => setTimeout(r, 1000));
        // Note: For transient errors, we might want to retry SAME model, but for now we proceed to fallback
        // To strictly follow user's loop, we proceed.
      }
      
      // If 404 (Not Found), immediately try next model
    }
  }

  throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown'}`);
}

// 📂 Helper: Base64 File to Part
export const fileToPart = (base64: string, mimeType: string = 'image/png') => ({
  inlineData: { 
    data: base64.includes(',') ? base64.split(',')[1] : base64, 
    mimeType 
  }
});
