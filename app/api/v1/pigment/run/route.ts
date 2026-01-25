
import { NextRequest, NextResponse } from 'next/server';
import { runPigmentPipeline } from '@/services/pigment/pigment.service';
import { PigmentRequest } from '@/services/pigment/pigment.types';

export const maxDuration = 60; // Set timeout to 60s for Vercel/Next functions

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic Validation
        if (!body.source_image_id && !body.source_image_data) {
            return NextResponse.json(
                { status: 'fail', error: 'Missing source_image_id or data' },
                { status: 400 }
            );
        }

        const request: PigmentRequest = body;

        // Execute Pipeline
        const result = await runPigmentPipeline(request);

        // Determine Status Code based on result
        if (result.status === 'fail') {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("[API/Pigment] Error:", error);
        return NextResponse.json(
            {
                status: 'fail',
                error: error.message || 'Internal Server Error'
            },
            { status: 500 }
        );
    }
}
