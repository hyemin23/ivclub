
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { CVFJobRequest } from '@/services/pose-factory/types';

declare global {
    var _CVF_JOB_STORE: Record<string, CVFJobRequest>;
}
if (!global._CVF_JOB_STORE) global._CVF_JOB_STORE = {};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request: CVFJobRequest = body;

        // Basic Validation (SRS v2.3)
        if (!request.input_data?.variant_group?.original_image_id) {
            return NextResponse.json({ error: "Missing Original Image (Variant Group)" }, { status: 400 });
        }

        const jobId = uuidv4();
        global._CVF_JOB_STORE[jobId] = request;

        console.log(`[CVF-API] Job Registered: ${jobId}`);

        return NextResponse.json({
            job_id: jobId,
            stream_url: `/api/v1/pose/batch-generate/${jobId}/stream`
        });

    } catch (e: any) {
        return NextResponse.json({ status: 'failed', error: e.message }, { status: 500 });
    }
}
