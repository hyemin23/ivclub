
const MAX_RETRIES_PER_MODEL = 3;

/**
 * Generic Hybrid Waterfall Executer
 * 
 * @param primaryModel - First model to try (e.g. 'gemini-1.5-pro')
 * @param secondaryModel - Fallback model (e.g. 'gemini-1.5-flash')
 * @param payload - The data to send (prompt, images, etc.)
 * @param apiCall - Function that executes the API call: (model, payload) => Promise<Result>
 * @param onStatusUpdate - Optional callback for UI updates
 */
export async function smartGenerateImage<T>(
    primaryModel: string,
    secondaryModel: string,
    payload: any,
    apiCall: (model: string, payload: any) => Promise<T>,
    onStatusUpdate?: (message: string) => void
): Promise<T> {

    // Phase 1: Primary Model (Pro)
    try {
        console.log(`💎 Attempting High-Quality (${primaryModel}) Model...`);
        onStatusUpdate?.("AI가 고화질 썸네일을 렌더링 중입니다... (품질 최우선 💎)");
        return await tryGenerateWithModel(primaryModel, payload, apiCall, 1, onStatusUpdate);
    } catch (error: any) {
        const isOverloaded = error.status === 503 || error.code === 503 || error.message?.includes("503") || error.message?.includes("overloaded");

        if (!isOverloaded) throw error; // Critical error (e.g. safety, invalid request)

        console.warn(`🚨 ${primaryModel} overloaded. Switching to ${secondaryModel}...`);
    }

    // Phase 2: Secondary Model (Flash/Fallback)
    try {
        console.log(`⚡ Attempting Fast (${secondaryModel}) Model...`);
        onStatusUpdate?.("대기가 길어지네요! 쾌속 모드(Fast Mode)로 전환하여 빠르게 처리합니다! ⚡️");
        return await tryGenerateWithModel(secondaryModel, payload, apiCall, 1, onStatusUpdate);
    } catch (error: any) {
        console.error("❌ All models failed.");
        onStatusUpdate?.("서버가 매우 혼잡합니다. 잠시 후 다시 시도해주세요. (503)");
        throw new Error("SERVER_BUSY");
    }
}

async function tryGenerateWithModel<T>(
    modelName: string,
    payload: any,
    apiCall: (model: string, payload: any) => Promise<T>,
    attempt: number = 1,
    onStatusUpdate?: (message: string) => void
): Promise<T> {
    try {
        return await apiCall(modelName, payload);
    } catch (error: any) {
        const isOverloaded = error.status === 503 || error.code === 503 || error.message?.includes("503") || error.message?.includes("overloaded");

        if (isOverloaded && attempt <= MAX_RETRIES_PER_MODEL) {
            const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
            console.warn(`⚠️ [${modelName}] Busy. Retrying in ${delay}ms... (Attempt ${attempt}/${MAX_RETRIES_PER_MODEL})`);

            if (attempt > 1) {
                onStatusUpdate?.(`주문이 많아 대기열에 진입했습니다... 잠시만 기다려주세요! ⏳ (${attempt}/${MAX_RETRIES_PER_MODEL})`);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            return tryGenerateWithModel(modelName, payload, apiCall, attempt + 1, onStatusUpdate);
        }
        throw error;
    }
}
