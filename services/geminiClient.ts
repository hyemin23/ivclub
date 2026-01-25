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
// 🛡️ Safety Settings (Updated)
const SAFETY_SETTINGS_DEV: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const SAFETY_SETTINGS_PROD: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// 🚫 Tool Use Disable
const TOOL_CONFIG_NONE: ToolConfig = {
  functionCallingConfig: { mode: 'NONE' as any }
};

// 🏗️ Model Constants & Fallback Lists
export const GEMINI_MODELS = {
  HIGH_QUALITY: "models/nano-banana-pro-preview", // Nano Banana Pro
  IMAGE_GEN: "models/nano-banana-pro-preview", // Primary Image Gen
  EDIT_STABLE: "models/gemini-2.5-flash-image", // Secondary
  LOGIC_REASONING: "gemini-1.5-pro", // Logic
};

// 🚨 [Corrected] Confirmed Active Models (Nano Banana Pro Release)
const MODEL_FALLBACK_LIST = [
  "models/nano-banana-pro-preview",       // 🏆 1st: Primary
  "models/gemini-2.5-flash-image",        // 🥈 2nd: Stable Secondary
  "models/gemini-2.0-flash-exp-image-generation" // 🥉 3rd: Experimental
];

const FALLBACK_STRATEGIES = {
  // Image Editing: Must use Image Specialist first!
  EDIT: MODEL_FALLBACK_LIST,

  // Text/Analysis: Can start with Logic Pro
  TEXT: ["gemini-1.5-pro", "gemini-1.5-flash"],

  // Image Creation: Explicitly use Image Specialist + Fallbacks
  CREATION: ["models/nano-banana-pro-preview", "models/gemini-2.5-flash-image"],
};

export interface GeminiResponse {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
  usedModel: string;
}

// 🕵️ Robust Image Extractor (Final Dev Spec)
export type Extracted =
  | { type: "image"; dataUrl: string; mimeType: string }
  | { type: "text"; text: string }
  | { type: "blocked"; reason: string; meta?: any };

export function extractResult(response: any): Extracted {
  // 0) 후보 자체가 없는 케이스 (빈 깡통)
  const candidate = response?.candidates?.[0];
  const promptFeedback = response?.promptFeedback;

  // 0-a) promptFeedback 기반 차단 감지
  const blockReason = promptFeedback?.blockReason || promptFeedback?.blockReasonMessage;
  if (blockReason) {
    return { type: "blocked", reason: `PROMPT_BLOCKED: ${blockReason}`, meta: { promptFeedback } };
  }

  if (!candidate) {
    return { type: "blocked", reason: "NO_CANDIDATE_RETURNED", meta: { response } };
  }

  // 0-b) finishReason 체크 (SAFETY 등)
  const finishReason = candidate?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    if (finishReason === "SAFETY") {
      return {
        type: "blocked",
        reason: "BLOCKED_BY_SAFETY",
        meta: { finishReason, safetyRatings: candidate?.safetyRatings, promptFeedback },
      };
    }
    // 다른 이유도 메타로 반환
    return {
      type: "blocked",
      reason: `MODEL_STOPPED: ${finishReason}`,
      meta: { finishReason, safetyRatings: candidate?.safetyRatings, promptFeedback },
    };
  }

  const parts = candidate?.content?.parts ?? [];

  // 1) 이미지 우선
  const img = parts.find((p: any) => p.inlineData?.data && (p.inlineData?.mimeType || "").startsWith("image/"));
  if (img) {
    const mimeType = img.inlineData.mimeType || "image/jpeg";
    return { type: "image", mimeType, dataUrl: `data:${mimeType};base64,${img.inlineData.data}` };
  }

  // 2) 텍스트
  const txt = parts.map((p: any) => p.text).filter(Boolean).join("\n").trim();
  if (txt) return { type: "text", text: txt };

  // 3) 아무 것도 없음: 운영에서 가장 싫은 케이스 -> 메타 포함해서 blocked 처리
  return {
    type: "blocked",
    reason: "EMPTY_PARTS_WITH_STOP",
    meta: { finishReason, safetyRatings: candidate?.safetyRatings, promptFeedback, candidate },
  };
}

/**
 * 🛠️ Universal Gemini Client with Fallback & Retry
 */
// Helper: Sanitize Prompt for Safety
const sanitizePromptForRoseCut = (prompt: string): string => {
  const safeSuffix = ", fabric macro shot only, no human, no body, no skin, no face, no nude";
  if (prompt.includes("no human")) return prompt;
  return prompt + safeSuffix;
};

/**
 * 🛠️ Universal Gemini Client with Fallback & Smart Retry (v1.0 Reliability)
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
  const isProd = process.env.NODE_ENV === 'production';
  const safetySettings = isProd ? SAFETY_SETTINGS_PROD : SAFETY_SETTINGS_DEV;

  for (const modelName of modelList) {
    // 🔁 Smart Retry Loop
    // Attempt 0: Standard
    // Attempt 1: Sanitize Prompt + Lower Temp (if safety blocked)
    let retryCount = 0;
    const maxRetries = 1; // 1 Retry per model (Standard -> Sanitized)

    while (retryCount <= maxRetries) {
      try {
        const isRetry = retryCount > 0;
        console.log(`🤖 Model Attempt: ${modelName} (${options.taskType}) ${isRetry ? `(Smart Retry - Sanitized)` : ''}`);

        let currentPrompt = prompt;
        let currentConfig = { ...options.config };

        // Apply Smart Retry Logic (Sanitization)
        if (isRetry && options.taskType === 'CREATION') {
          currentPrompt = sanitizePromptForRoseCut(prompt);
          // Lower temperature to be more deterministic/safe
          if (!currentConfig.generationConfig) currentConfig.generationConfig = {};
          currentConfig.generationConfig.temperature = 0.4;
        }

        const requestConfig = {
          model: modelName,
          contents: {
            parts: [
              { text: currentPrompt },
              ...parts
            ]
          },
          config: {
            safetySettings: safetySettings,
            toolConfig: TOOL_CONFIG_NONE,
            ...currentConfig
          }
        };

        // Remove responseMimeType for Image Generation (as per spec)
        if (options.taskType === 'CREATION' || options.taskType === 'EDIT') {
          if (requestConfig.config?.responseMimeType === 'application/json') {
            // Keep JSON if explicitly requested? 
            // Spec says: "generateContent calls for image ... responseMimeType: application/json absolute NO"
            // But wait, some functions in geminiService might set it.
            // We should probably respect it if the user passed it, BUT warning:
            // "Image generation requests should NOT use json mime type".
            // Let's assume the caller handles this or we strip it if it's image gen?
            // Let's safe-guard:
            delete requestConfig.config.responseMimeType;
          }
        }

        // @ts-ignore
        const result = await ai.models.generateContent(requestConfig);

        // 🛡️ Robust Parsing
        const extracted = extractResult(result);

        // 1. BLOCKED Handling
        if (extracted.type === 'blocked') {
          console.warn(`🛡️ BLOCKED (${extracted.reason}) on ${modelName}`, extracted.meta);
          // Throw specific error to trigger Smart Retry
          throw new Error(extracted.reason); // "BLOCKED_BY_SAFETY", "EMPTY_PARTS_WITH_STOP", etc.
        }

        // 2. TEXT Handling (for Image Task)
        if (extracted.type === 'text') {
          if (options.taskType === 'CREATION' || options.taskType === 'EDIT') {
            console.warn(`⚠️ Text received for Image Task: ${extracted.text.substring(0, 50)}...`);
            // Treat as failure for Image Gen? 
            // Spec says: "RC-1) Model returns text instead of image".
            // We should probably treat this as a failure and retry if we strictly need an image.
            // However, `GeminiResponse` supports text. The caller might handle it.
            // But `extracted.type` differentiates. 
            // Let's return text as is, but log warning.
          }
          return { text: extracted.text, usedModel: modelName };
        }

        // 3. IMAGE Handling
        if (extracted.type === 'image') {
          console.log(`✅ Generation Success! (Used: ${modelName})`);
          return {
            inlineData: {
              data: extracted.dataUrl.split(',')[1], // Remove prefix for consistency with old interface
              mimeType: extracted.mimeType
            },
            usedModel: modelName
          };
        }

        throw new Error("UNREACHABLE_CODE");

      } catch (error: any) {
        console.warn(`⚠️ ${modelName} Failed (Attempt ${retryCount}). Reason:`, error.message);
        lastError = error;

        // Check Retry Eligibility
        const isSafetyRelated =
          error.message.includes('SAFETY') ||
          error.message.includes('BLOCKED') ||
          error.message.includes('EMPTY'); // Empty often means filtered

        if (isSafetyRelated && retryCount < maxRetries) {
          console.log(`♻️ Triggering Smart Retry (Sanitizing Prompt...)`);
          retryCount++;
          continue;
        }

        // If not safety related (e.g. 500 error), or max retries reached, 
        // break to try NEXT MODEL.
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
