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
  EDIT_STABLE: "gemini-2.0-flash-exp-image-generation", // 🛠️ Experimental Image Gen Model for Editing
  LOGIC_REASONING: "gemini-3-pro-preview", // 🧠 Use Pro for Logic/Audit
};

// 🚨 [Corrected] Confirmed Active Models (Jan 2026)
const MODEL_FALLBACK_LIST = [
  "gemini-3-pro-image-preview", // 🏆 1st: Nano Banana Pro
  "gemini-2.0-flash-exp-image-generation", // 🥈 2nd: Experimental Image Gen
  "gemini-2.5-flash-image",    // 🥉 3rd: Nano Banana (Flash)
  "gemini-3-pro-preview",       // 4th: Logic Pro
  "gemini-2.5-pro",             // 5th: Stable Backup
  "gemini-2.5-flash"            // 6th: Speed/Fallback
];

const FALLBACK_STRATEGIES = {
  // Image Editing: Must use Image Specialist first!
  EDIT: MODEL_FALLBACK_LIST,

  // Text/Analysis: Can start with Logic Pro
  TEXT: ["gemini-3-pro-preview", "gemini-2.5-pro", "gemini-2.5-flash"],

  // Image Creation: Explicitly use Image Specialist + Fallbacks
  CREATION: ["gemini-3-pro-image-preview", "gemini-2.0-flash-exp-image-generation", "gemini-2.5-flash-image"],
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
    // 🔁 Retry Loop for Transient Errors (503/429)
    let retryCount = 0;
    const maxRetries = 2; // Try same model up to 3 times total

    while (retryCount <= maxRetries) {
      try {
        console.log(`🤖 Model Attempt: ${modelName} (${options.taskType}) ${retryCount > 0 ? `(Retry ${retryCount})` : ''}`);

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

        // If we get here, it's an empty response but NOT an error throw.
        // We treat it as failure and try next model, no retry needed.
        throw new Error("Empty response from AI (No Text/Image)");

      } catch (error: any) {
        console.warn(`⚠️ ${modelName} Failed. Reason:`, error.message);
        lastError = error;

        const isTransient = error.message.includes('503') || error.message.includes('429') || error.message.includes('overloaded');

        if (isTransient) {
          if (retryCount < maxRetries) {
            console.log(`⏳ Server overloaded (503). Retrying ${modelName} in 1s...`);
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry (reduced from 2s)
            retryCount++;
            continue; // Retry ONLY same model
          } else {
            console.log(`❌ ${modelName} overloaded after ${maxRetries} retries. Moving to next model...`);
          }
        }

        // If not transient (e.g. 400 Bad Request, 404), or max retries exceeded, break inner loop to try next model
        break;
      }
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
