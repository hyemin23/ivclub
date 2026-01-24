
import { GeminiErrorType } from '../../types';

export interface VariationResult {
    id: string;
    url: string;
    status: 'loading' | 'success' | 'error';
    errorType?: GeminiErrorType;
    errorMessage?: string;
}
