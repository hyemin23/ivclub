
import {
    CVFJobRequest, CVFInputData, VariantGroupInput, JobContextV2,
    CVFPoseId, CVFStreamEvent_ItemCompleted, CVFStreamEvent_ItemFailed
} from './types';
import { renderTask } from './renderer'; // Will update renderer next
import { StreamManager } from './stream'; // Reuse existing stream manager logic
import { calculateNavigatedYaw } from './ycpn';

// SRS v2.3 Pipeline Logic

export class CVFPipeline {

    // Stage 0: Normalize (MR-0)
    static normalizeInput(input: CVFInputData): VariantGroupInput {
        // Drop master_shot_id (MR-0)
        // Ensure Original is present
        if (!input.variant_group.original_image_id) {
            throw new Error("TARGET_ORIGINAL_MISSING");
        }
        return input.variant_group;
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

                // Render
                const result = await renderTask({
                    pose: effectivePose,
                    baseImage: baseImageId,
                    colorConfig: colorConfig, // Pass color info if exists
                    options: config
                });

                if (result.status === 'success') {
                    // Stage 5: Validator (Stub)
                    // Check yaw, etc. 
                    const estimatedYaw = mirrorRequired ? -(result.relative_yaw || 15) : (result.relative_yaw || -15);

                    // Emit Success
                    StreamManager.emit(jobId, {
                        type: 'ITEM_COMPLETED',
                        data: {
                            group: groupLabel,
                            pose: pose, // Emit the ORIGINAL requested pose ID
                            estimated_yaw_deg: estimatedYaw,
                            thumbnail_url: result.url, // In v2.3 this might be the Left image. UI flips it.
                            original_url: result.url,
                            status: 'success',
                            metadata: {
                                is_mirrored: mirrorRequired // Hint for UI
                            }
                        }
                    });
                } else {
                    throw new Error(result.error);
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
