
import { NextRequest, NextResponse } from 'next/server';
import { fallbackToVisionLLM } from '@/services/sizechart/extractor.service';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const sourceId = body.source_image_id;

        if (!sourceId) {
            return NextResponse.json({ status: 'fail', error: 'No image' }, { status: 400 });
        }

        const result = await fallbackToVisionLLM(sourceId);
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ status: 'fail', error: error.message }, { status: 500 });
    }
}
