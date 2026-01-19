
import { GeminiErrorType } from '../geminiService';

export interface VariationResult {
    id: string;
    url: string;
    status: 'loading' | 'success' | 'error';
    errorType?: GeminiErrorType;
    errorMessage?: string;
}
