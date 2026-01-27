
// SRS v2.3 Definitions (Final Developer Handoff)

// --- Enums ---
export type CVFPoseId = 'FRONT' | 'LEFT_15' | 'RIGHT_15'; // Only these 3 allowed per MR-2
export type CVFJobStatus = 'queued' | 'running' | 'success' | 'partial_success' | 'failed';
export type CVFStage = 'NORMALIZATION' | 'SEGMENTATION' | 'COLOR_EXTRACTION' | 'COLOR_MASTER' | 'POSE_GENERATION' | 'VALIDATION' | 'COMPOSE';

// --- Input Data Model (SRS 1.1) ---
export interface VariantGroupInput {
    original_image_id: string; // The True Base
    color_references: {
        label: string;
        image_id?: string; // Palette Source
        hex_override?: string; // Optional Force Hex
        mode?: 'auto' | 'solid_paint' | 'texture_transfer'; // SRS v2.6
    }[];
}

export interface CVFInputData {
    master_shot_id?: string; // UI only, invalid for generation (MR-0)
    variant_group: VariantGroupInput;
}

// --- Configuration (SRS 4.1) ---
export interface CVFConfig {
    mode: 'VARIANT_GROUP_ONLY'; // v2.3 Scope
    headless: boolean;
    background_lock: boolean;
    recolor_mode: 'paint_only'; // SRS 2.3 Strict
    isolation: boolean; // SRS 4.0 Job Isolation
    pose_angles: CVFPoseId[]; // ["FRONT", "LEFT_15", "RIGHT_15"]
    pose_variation?: {
        enabled: boolean;
        intensity: number; // 0.2~0.4
        arm_allowlist?: string[]; // ["A1...", "A2..."]
        leg_allowlist?: string[];
    };
    output: {
        format: 'png' | 'jpg';
        resolution: '1k' | '2k';
    };
    thumbnails: {
        format: 'webp';
        size: number;
        quality: number;
    };
    qa_thresholds?: {
        ssim_min?: number; // 0.82 (updated from 0.78)
        edge_iou_min?: number; // 0.75 (updated from 0.70)
        delta_e_max?: number; // 8.0
    };
    // SRS v2.6: Texture Transfer Params
    transfer_strength?: number; // 0.0 ~ 1.0 (default 0.95)
    lighting_preservation?: 'low' | 'medium' | 'high'; // default 'high'
    generationConfig?: {
        temperature?: number;
        output_modality?: 'IMAGE' | 'TEXT';
        [key: string]: any;
    };
}

export interface CVFJobRequest {
    job_name: string;
    input_data: CVFInputData;
    config: CVFConfig;
    stream: { enabled: true; type: 'sse' };
    idempotency_key?: string;
}

// --- Results & Events (SRS 3.2) ---

export interface CVFStreamEvent_Progress {
    job_id: string;
    status: CVFJobStatus;
    total: number;
    completed: number;
    remaining: number;
    progress_percent: number;
    stage: CVFStage;
}

export interface CVFStreamEvent_ItemCompleted {
    group: string; // "Original" or Color Label
    pose: CVFPoseId;
    estimated_yaw_deg: number;
    thumbnail_url: string;
    original_url: string;
    status: 'success';
    metadata?: { is_mirrored: boolean };
    qa_scores?: {
        ssim: number;
        edge_iou: number;
        delta_e: number;
        passed: boolean;
    };
}

export interface CVFStreamEvent_ItemFailed {
    group: string;
    pose: CVFPoseId;
    status: 'failed';
    error_code: string;
    retryable: boolean;
}

// Internal Domain Types
export interface JobContextV2 {
    jobId: string;
    jobName: string;
    normalizedInput: VariantGroupInput; // After Stage 0
    config: CVFConfig;
    totalTasks: number;
    completedCount: number;
    results: Record<string, any[]>;
}
