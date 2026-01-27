
import {
    CVFJobRequest, CVFInputData, VariantGroupInput, JobContextV2,
    CVFPoseId, CVFStreamEvent_ItemCompleted, CVFStreamEvent_ItemFailed
} from './types';
import { renderTask } from './renderer';
import { StreamManager } from './stream';
import { calculateNavigatedYaw } from './ycpn';
import crypto from 'crypto';

// SRS v2.3 Pipeline Logic

export class CVFPipeline {

    // Stage 0: Deterministic Seed & Normalize
    static normalizeInput(input: CVFInputData): VariantGroupInput {
        // Drop master_shot_id (MR-0)
        if (!input.variant_group.original_image_id) {
            throw new Error("TARGET_ORIGINAL_MISSING");
        }
        return input.variant_group;
    }

    // Helper: Deterministic Seed
    private static generateJobSeed(jobId: string, groupId: string, pose: string): number {
        const hash = crypto.createHash('sha256').update(`${jobId}-${groupId}-${pose}`).digest('hex');
        return parseInt(hash.substring(0, 8), 16);
    }

    // Stage 1-2: Analysis (Stub)
    // In real system, this does segmentation.
    static async analyzeOriginal(originalId: string) {
        // Return mock masks or analysis data
        return { hasPerson: true, base_yaw: 0 };
    }

    // Execution Core
    static async execute(jobId: string, request: CVFJobRequest) {
        // 1. Context Setup
        let input: VariantGroupInput;
        try {
            input = this.normalizeInput(request.input_data);
        } catch (e: any) {
            StreamManager.emit(jobId, { type: 'JOB_FINISHED', data: { status: 'failed', error: e.message } });
            return;
        }

        const groups = 1 + input.color_references.length; // Original + Colors
        const poses = request.config.pose_angles.length;
        const totalTasks = groups * poses;

        const context: JobContextV2 = {
            jobId,
            jobName: request.job_name,
            normalizedInput: input,
            config: request.config,
            totalTasks,
            completedCount: 0,
            results: {}
        };

        // Emit Started
        this.emitProgress(context, 'NORMALIZATION');

        // 2. Processing (Sequential for safety/stub, Parallel in Prod)

        // A. Process Original Group First
        // "Original Group" means: The base image rendered in the 3 poses.
        // For "Original" group, color is "Original".
        await this.processGroup(context, 'Original', input.original_image_id, null);

        // B. Process Color Groups
        for (const colorRef of input.color_references) {
            // Stage 2: Palette Extraction (Virtual)
            // Stage 3: Color Master Generation (Virtual Paint)
            // Since we use a Single-Pass Generative model in this Agent context (Nano Banana),
            // We combine Recolor + Pose in one step utilizing the prompt constraints of v2.3.
            // "Strict Paint Lock" -> handled by prompt "Keep background, only change color..."
            await this.processGroup(context, colorRef.label, input.original_image_id, colorRef);
        }

        // Finish
        StreamManager.emit(jobId, {
            type: 'JOB_FINISHED',
            data: {
                job_id: jobId,
                status: context.completedCount === totalTasks ? 'success' : 'partial_success',
                total: totalTasks,
                completed: context.completedCount
            }
        });
    }

    private static async processGroup(
        context: JobContextV2,
        groupLabel: string,
        baseImageId: string,
        colorConfig: { label: string, hex_override?: string, image_id?: string } | null
    ) {
        const { config, jobId } = context;

        for (const pose of config.pose_angles) {
            try {
                // Stage 4: Pose Generation
                // MR-2: Right = Left + Mirror
                let effectivePose = pose;
                let mirrorRequired = false;

                if (pose === 'RIGHT_15') {
                    effectivePose = 'LEFT_15'; // Force Left generation
                    mirrorRequired = true; // Flag for UI/Result
                }

                // CRITICAL FIX: Ensure 'pose' variable in loop is used for Result Mapping
                // The 'effectivePose' is only for internal generation.
                // The 'pose' (RIGHT_15) must be passed to the result event.

                // Stage 4 & 5: Render & QA with Retry Policy (SRS 3.3)
                // Retry once if QA fails or Gen fails
                const MAX_RETRIES = 1;
                let attempt = 0;
                let qaScores: { ssim: number; edge_iou: number; delta_e: number; passed: boolean; } | undefined;
                let renderResult = null;
                let isSuccess = false;

                // Render with Deterministic Seed
                const seed = this.generateJobSeed(jobId, groupLabel, effectivePose);

                while (attempt <= MAX_RETRIES && !isSuccess) {
                    // Adjust params for retry (SRS 3.3: Denoise -0.03, etc)
                    const isRetry = attempt > 0;
                    const currentConfig = isRetry ? { ...config, generationConfig: { ...config.generationConfig, temperature: 0.15 } } : config; // Simulate stricter config

                    renderResult = await renderTask({
                        pose: effectivePose,
                        baseImage: baseImageId,
                        colorConfig: colorConfig,
                        options: currentConfig,
                        seed: seed + attempt, // Shift seed on retry? SRS says "Retry use only modified params", but usually seed shift helps escape bad local minima. SRS says "Determinstic". Let's keep seed SAME but change params. OK SRS says "Retry policy... denoise -0.03".
                        // Actually SRS 0.1 says "Retry 시에만 seed 변형 허용". So we CAN shift seed.
                        // I will shift seed for retry.
                        retryMode: isRetry
                    });

                    if (renderResult.status === 'success') {
                        // Mock QA (SRS 3.3)
                        const mockSSIM = 0.80 + (Math.random() * 0.1); // Range 0.80 ~ 0.90
                        const mockIoU = 0.72 + (Math.random() * 0.15); // Range 0.72 ~ 0.87
                        const mockDeltaE = 2.0 + (Math.random() * 5.0); // Range 2.0 ~ 7.0

                        const ssimThreshold = config.qa_thresholds?.ssim_min || 0.82;
                        const iouThreshold = config.qa_thresholds?.edge_iou_min || 0.75;
                        const deltaMax = config.qa_thresholds?.delta_e_max || 8.0;

                        const passed = (mockSSIM >= ssimThreshold) && (mockIoU >= iouThreshold) && (mockDeltaE <= deltaMax);

                        qaScores = { ssim: mockSSIM, edge_iou: mockIoU, delta_e: mockDeltaE, passed };

                        if (passed) {
                            isSuccess = true;
                        } else {
                            console.log(`[QA_FAIL] Attempt ${attempt} - SSIM:${mockSSIM.toFixed(2)} IoU:${mockIoU.toFixed(2)}`);
                            attempt++;
                        }
                    } else {
                        attempt++;
                    }
                }

                if (isSuccess && renderResult) {
                    const estimatedYaw = mirrorRequired ? -(renderResult.relative_yaw || 15) : (renderResult.relative_yaw || -15);
                    // Emit Success
                    StreamManager.emit(jobId, {
                        type: 'ITEM_COMPLETED',
                        data: {
                            group: groupLabel,
                            pose: pose,
                            estimated_yaw_deg: estimatedYaw,
                            thumbnail_url: renderResult.url,
                            original_url: renderResult.url,
                            status: 'success',
                            metadata: {
                                is_mirrored: mirrorRequired
                            },
                            qa_scores: qaScores
                        }
                    });
                } else {
                    // Failed after retries
                    throw new Error(renderResult?.error || "QA_DRIFT_DETECTED");
                }

            } catch (e: any) {
                StreamManager.emit(jobId, {
                    type: 'ITEM_FAILED',
                    data: {
                        group: groupLabel,
                        pose: pose,
                        status: 'failed',
                        error_code: e.message || 'GEN_ERROR',
                        retryable: true
                    }
                });
            } finally {
                context.completedCount++;
                this.emitProgress(context, 'POSE_GENERATION');
                await new Promise(r => setTimeout(r, 600)); // Pace
            }
        }
    }

    private static emitProgress(ctx: JobContextV2, stage: any) {
        StreamManager.emit(ctx.jobId, {
            type: 'JOB_PROGRESS',
            data: {
                job_id: ctx.jobId,
                status: 'running',
                total: ctx.totalTasks,
                completed: ctx.completedCount,
                remaining: ctx.totalTasks - ctx.completedCount,
                progress_percent: Math.floor((ctx.completedCount / ctx.totalTasks) * 100),
                stage
            }
        });
    }
}
