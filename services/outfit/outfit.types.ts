
import { GeminiErrorType } from '../geminiService';

export type MaskArea = 'Top' | 'Bottom' | 'Outer';

export interface OutfitState {
    baseImage: string | null;
    refImage: string | null;
    maskArea: MaskArea;
    resultImage: string | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    errorType?: GeminiErrorType;
    errorMessage?: string;
}
