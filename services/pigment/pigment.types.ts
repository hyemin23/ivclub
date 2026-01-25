
export type ValidationMode = 'strict' | 'relaxed';
export type CleanupTarget = 'text' | 'clutter' | 'outlet' | 'shadow_artifact' | 'watermark' | 'stain' | 'dust';
export type PropRemoveTarget = 'cup' | 'phone' | 'bag' | 'cigarette' | 'earbuds' | 'keys';
export type PosePreset = 'neutral' | 'micro_walk' | 'hands_pocket' | 'arms_crossed_relaxed';
export type RecolorTargetCategory = 'top' | 'bottom' | 'outer' | 'onepiece' | 'all';

export interface CleanupConfig {
    enabled: boolean;
    mode: 'auto' | 'manual';
    targets: CleanupTarget[];
}

export interface PropRemoveConfig {
    enabled: boolean;
    targets: PropRemoveTarget[];
    hand_restore: boolean;
}

export interface PoseChangeConfig {
    enabled: boolean;
    preset: PosePreset;
    strict_safety: boolean;
}

export interface RecolorConfig {
    target_category: RecolorTargetCategory;
    color_source: {
        type: 'hex' | 'image';
        value: string; // Hex code or Image URL
    };
    texture_lock_strength?: number; // 0.0 - 1.0, default 0.8
}

export interface PipelineConfig {
    validation_mode: ValidationMode;
    cleanup: CleanupConfig;
    prop_remove: PropRemoveConfig;
    pose_change: PoseChangeConfig;
    recolor: RecolorConfig;
}

export interface PigmentOutputOptions {
    resolution: '1k' | '2k' | '4k';
    format: 'png' | 'webp';
    return_stage_outputs: boolean;
    return_debug_masks: boolean;
}

export interface PigmentRequest {
    source_image_id: string; // or base64 data URI for direct processing
    source_image_data?: string; // Optional direct data
    pipeline_config: PipelineConfig;
    output_options: PigmentOutputOptions;
    seed_offset?: number; // For "Regenerate"
}

export interface StageOutputs {
    preview_segmentation?: string;
    preview_cleanup?: string;
    preview_pose?: string;
    preview_recolor?: string;
}

export interface DebugMasks {
    mask_cleanup?: string;
    mask_prop_final?: string;
    mask_final_recolor?: string;
    mask_skin_protected?: string;
}

export interface PigmentMetrics {
    background_shift: number; // Percentage
    skin_delta_e: number;
    garment_ssim?: number;
}

export type PigmentStatus = 'success' | 'partial_success' | 'fail';

export interface PigmentResponse {
    status: PigmentStatus;
    data: {
        final_image_url: string;
        stage_outputs?: StageOutputs;
        debug_masks?: DebugMasks;
        metrics?: PigmentMetrics;
        warnings: string[];
        idempotency_key: string;
        seed: number;
    };
    error?: string;
}
