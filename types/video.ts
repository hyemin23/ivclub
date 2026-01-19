
export type VideoStatus = 'preview_pending' | 'preview_done' | 'final_processing' | 'completed' | 'failed';

export interface VeoConfig {
    duration: number; // seconds
    mode: 'fast';
    resolution: '1080p';
    fps: 24;
    seed: number | null; // null for random (preview), specific number for final
}

export interface VideoGenerationLog {
    id: string; // request_id
    createdAt: number;
    status: VideoStatus;

    // Inputs
    imageUrls: string[];
    motionPrompt?: string;
    refVideoUrl?: string; // Video-to-Video source

    // Config
    config: VeoConfig;

    // Outputs
    previewUrl?: string; // 4s result
    finalUrl?: string; // Extended result

    // Persistence for Consistency
    usedSeed?: number; // The actual seed used (returned from API or generated)
}
