
import { NextRequest, NextResponse } from 'next/server';
import { StreamManager } from '@/services/pose-factory/stream';
import { CVFPipeline } from '@/services/pose-factory/pipeline';
import { CVFJobRequest } from '@/services/pose-factory/types';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await context.params;

    // @ts-ignore
    const jobRequest = global._CVF_JOB_STORE?.[jobId] as CVFJobRequest;

    if (!jobRequest) {
        return NextResponse.json({ error: "Job Not Found" }, { status: 404 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            console.log(`[CVF-Stream] Connected: ${jobId}`);
            StreamManager.register(jobId, controller);
            try {
                // Execute Pipeline v2.3
                await CVFPipeline.execute(jobId, jobRequest);
            } catch (e) {
                console.error("Pipeline Error", e);
            } finally {
                StreamManager.unregister(jobId, controller);
                // @ts-ignore
                delete global._CVF_JOB_STORE[jobId];
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
