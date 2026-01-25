
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
    pose_angles: CVFPoseId[]; // ["FRONT", "LEFT_15", "RIGHT_15"]
    output: {
        format: 'png' | 'jpg';
        resolution: '1k' | '2k';
    };
    thumbnails: {
        format: 'webp';
        size: number;
        quality: number;
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
