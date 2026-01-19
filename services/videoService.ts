
import { VideoGenerationLog, VideoStatus, VeoConfig } from '../types/video';
import { useStore } from '../store';

/**
 * Mock Service for Google Vertex AI (Veo)
 * Phase 1: Placeholder implementation to establish data flow.
 */

const MOCK_PREVIEW_URL = "https://cdn.pixabay.com/video/2024/02/09/199958-911694865_tiny.mp4"; // Placeholder (Fashion walk)
const MOCK_FINAL_URL = "https://cdn.pixabay.com/video/2024/02/09/199958-911694865_tiny.mp4"; // Same placeholder for now

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generatePreviewVideo = async (
    imageUrls: string[],
    motionPrompt: string,
    motionSourceVideo?: string
): Promise<VideoGenerationLog> => {
    // @ts-ignore
    useStore.getState().addLog('Veo AI Preview Generation Started', 'info');

    await delay(2000); // Simulate API latency

    const newLog: VideoGenerationLog = {
        id: `req_${Date.now()}`,
        createdAt: Date.now(),
        status: 'preview_done',
        imageUrls,
        motionPrompt,
        refVideoUrl: motionSourceVideo,
        config: {
            duration: 4,
            mode: 'fast',
            resolution: '1080p',
            fps: 24,
            seed: Math.floor(Math.random() * 10000000) // Random seed for preview
        },
        usedSeed: Math.floor(Math.random() * 10000000),
        previewUrl: MOCK_PREVIEW_URL
    };

    // @ts-ignore
    useStore.getState().addVideoLog(newLog);
    // @ts-ignore
    useStore.getState().setActiveVideoLogId(newLog.id);
    // @ts-ignore
    useStore.getState().addLog('Veo AI Preview Ready', 'success');

    return newLog;
};

export const generateFinalVideo = async (
    logId: string,
    targetDuration: number
): Promise<VideoGenerationLog> => {
    // @ts-ignore
    const state = useStore.getState();
    const log = state.videoLogs.find(l => l.id === logId);

    if (!log) throw new Error("Log not found");

    // @ts-ignore
    useStore.getState().addLog(`Veo AI Final Generation Started (Duration: ${targetDuration}s)`, 'info');

    await delay(3000); // Simulate processing

    const updatedLog: VideoGenerationLog = {
        ...log,
        status: 'completed',
        config: {
            ...log.config,
            duration: targetDuration,
            seed: log.usedSeed || log.config.seed // Fix seed for consistency
        },
        finalUrl: MOCK_FINAL_URL
    };

    // @ts-ignore
    useStore.getState().updateVideoLog(logId, updatedLog);
    // @ts-ignore
    useStore.getState().addLog('Veo AI Final Video Completed', 'success');

    return updatedLog;
};
