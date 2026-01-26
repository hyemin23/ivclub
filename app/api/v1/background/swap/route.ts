import { NextRequest, NextResponse } from 'next/server';
import { BSEPipeline } from '@/services/bse/pipeline';
import { BSEJobRequest, BSEConfig } from '@/services/bse/types';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic Validation
        if (!body.source_image_id || !body.background_ref_id) {
            return NextResponse.json(
                { error: 'Missing required fields: source_image_id, background_ref_id' },
                { status: 400 }
            );
        }

        // Construct Request Object
        const request: BSEJobRequest = {
            job_id: body.job_id || `job_${Date.now()}`,
            source_image_id: body.source_image_id,
            background_ref_id: body.background_ref_id,
            config: body.options || {} // mapped from 'options' in SRS to 'config' in type
        };

        // Initialize Pipeline
        // You can inject standard config overrides here if needed
        const pipeline = new BSEPipeline(request.config);

        // Execute
        const result = await pipeline.process(request);

        // Handle Failures
        if (result.status === 'fail') {
            return NextResponse.json(
                { status: 'error', message: result.warnings[0], metrics: result.metrics },
                { status: 500 }
            );
        }

        // Return Success
        return NextResponse.json({
            status: 'success',
            data: {
                url: result.output.url, // This will be data:image... or URL
                width: result.output.width,
                height: result.output.height
            },
            metrics: result.metrics,
            warnings: result.warnings,
            debug: result.debug_outputs
        });

    } catch (error: any) {
        console.error('[API] Background Swap Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
