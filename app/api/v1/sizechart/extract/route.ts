
import { NextRequest, NextResponse } from 'next/server';
import { extractSizeChart } from '@/services/sizechart/extractor.service';

export const maxDuration = 60; // 60s timeout for AI

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Input Validation
        if (!body.source_image_id && !body.source_image_data) {
            return NextResponse.json(
                { status: 'fail', error: 'Missing source_image_id' },
                { status: 400 }
            );
        }

        const sourceId = body.source_image_id || body.source_image_data;
        const hint = body.category_hint;

        // Execute Pipeline
        const result = await extractSizeChart(sourceId, hint);

        if (result.status === 'fail') {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("[API/SizeChart] Error:", error);
        return NextResponse.json(
            { status: 'fail', error: error.message },
            { status: 500 }
        );
    }
}
