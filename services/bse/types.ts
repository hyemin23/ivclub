
export interface BSEJobRequest {
    job_id?: string;
    source_image_id: string; // Original image (Person + Garment)
    background_ref_id: string; // Reference Background
    config: BSEConfig;
}

export interface BSEConfig {
    ref_cleanup: {
        enabled: boolean;
    };
    geometry_match: {
        enabled: boolean;
        mode: 'auto' | 'manual';
        manual_params?: {
            scale: number;
            translate_y: number;
        };
    };
    harmonize: {
        enabled: boolean;
        strength?: number; // Added to match usage
        profile?: 'commerce_strict' | 'creative';
        weights: {
            garment: {
                luminance: number;
                chrominance: number;
            };
            skin_hair: {
                luminance: number;
                chrominance: number;
            };
            others?: {
                luminance: number;
                chrominance: number;
            };
        };
        spill_fix: {
            enabled: boolean;
            strength: number;
        };
    };
    shadow: {
        enabled: boolean;
        strength: number;
    };
    micro_inpaint: {
        enabled: boolean;
        denoise: number;
    };
    output: {
        format: 'png' | 'jpg' | 'webp';
        quality?: number;
        thumbnail?: {
            format: 'webp';
            width: number;
            quality: number;
        };
    };
    debug?: {
        return_stage_outputs: boolean;
    };
}

export interface BSEStageOutputs {
    mask_subject?: string;      // Base64 or URL
    ref_bg_clean?: string;
    composite_out0?: string;    // Pre-harm
    harmonized_out1?: string;   // Post-harm
}

export interface BSEMetrics {
    ref_bg_fidelity: number;   // SSIM(final_bg, ref_bg) >= 0.92
    src_bg_leakage: number;    // SSIM(final_bg, src_bg) <= 0.35 (Low = Good)
    garment_delta_e: number;   // <= 3.0
    skin_delta_e: number;      // <= 6.0
}

export type BSEErrorCode =
    | 'REF_BG_MISSING'
    | 'CACHE_KEY_INCOMPLETE'
    | 'MASK_SUBJECT_TOO_LARGE'
    | 'MASK_SUBJECT_TOO_SMALL'
    | 'REF_CLEANUP_FAILED'
    | 'BG_NOT_APPLIED'
    | 'COMPOSITE_NOT_APPLIED'
    | 'WARN_GARMENT_DRIFT';

export interface BSEResult {
    job_id: string;
    status: 'success' | 'fail' | 'partial_success';
    output: {
        url: string;
        width: number;
        height: number;
    };
    metrics: BSEMetrics;
    warnings: string[];
    stage_outputs?: BSEStageOutputs;
    error?: {
        code: BSEErrorCode;
        message: string;
    };
    // Legacy debug outputs for compatibility if needed, but stage_outputs covers it
    debug_outputs?: any;
}

export const DEFAULT_BSE_CONFIG: BSEConfig = {
    ref_cleanup: { enabled: true },
    geometry_match: { enabled: true, mode: 'auto' },
    harmonize: {
        enabled: true,
        strength: 0.6,
        profile: 'commerce_strict',
        weights: {
            garment: { luminance: 0.5, chrominance: 0.0 }, // Strict Lock
            skin_hair: { luminance: 0.7, chrominance: 0.7 }
        },
        spill_fix: { enabled: true, strength: 0.35 }
    },
    shadow: { enabled: true, strength: 0.35 },
    micro_inpaint: { enabled: true, denoise: 0.06 },
    output: {
        format: 'png',
        thumbnail: { format: 'webp', width: 512, quality: 80 }
    },
    debug: { return_stage_outputs: true }
};
