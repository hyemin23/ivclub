import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';
import { IMAGE_SPECS } from '@/config/image-specs';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate Input (Optional but good: check if it's 3:4 roughly)
        const metadata = await sharp(buffer).metadata();

        // We assume input is roughly 3:4. User said 1200x1600.
        // If we want to be strict, we could check aspect ratio.
        // For now, prompt logic assumes we just execute the crop instructions.

        // NOTE: User's logic assumes input width is 1200. 
        // If input is larger/smaller, we should scale the crop coordinates proportionally 
        // OR resize input to 1200 width first to match the logic exactly.
        // Let's resize to 1200 width (maintain aspect) first to be safe and match the logic:
        // "Input: 1200x1600 (3:4) Buffer"

        const baseSharp = sharp(buffer);
        const standardBase = await baseSharp.resize({ width: 1200 }).toBuffer();
        const master = sharp(standardBase);

        const zip = new JSZip();

        // 1. [4910] To 5:6
        // Logic: Crop height to 1440 (width 1200) -> Resize to 640x768
        // Crop center vertically? Or top? Usually top or center. 
        // User Guide: "4910 코디... 5:6" 
        // "Input: 1200x1600... Crop height to 1440... Resize to 640x768"
        // 1600 -> 1440 means cutting 160px. Let's assume Center crop unless specified.
        // Typically fashion favors specific crops, but Center is safest default.
        const img4910 = await master.clone()
            .extract({ left: 0, top: (1600 - 1440) / 2, width: 1200, height: 1440 })
            .resize(IMAGE_SPECS.PLATFORM_4910.targetWidth, IMAGE_SPECS.PLATFORM_4910.targetHeight)
            .jpeg({ quality: IMAGE_SPECS.PLATFORM_4910.quality }) // 85
            .toBuffer();
        zip.file('4910_codi.jpg', img4910);

        // 2. [Vertical HD] Hiver/Lookpin Codi To 6:7
        // Logic: Crop height to 1400 (width 1200) -> Resize to 1080x1260
        const imgVerticalHD = await master.clone()
            .extract({ left: 0, top: (1600 - 1400) / 2, width: 1200, height: 1400 })
            .resize(IMAGE_SPECS.PLATFORM_VERTICAL_HD.targetWidth, IMAGE_SPECS.PLATFORM_VERTICAL_HD.targetHeight)
            .jpeg({ quality: IMAGE_SPECS.PLATFORM_VERTICAL_HD.quality }) // 95
            .toBuffer();
        zip.file('niver_lookpin_codi.jpg', imgVerticalHD);

        // 3. [Lookpin Thumb] To 6:7 (Same ratio as above, just smaller)
        // We can just resize the Vertical HD result or process from master.
        // Processing from master ensures best quality.
        const imgLookpinThumb = await master.clone()
            .extract({ left: 0, top: (1600 - 1400) / 2, width: 1200, height: 1400 })
            .resize(IMAGE_SPECS.PLATFORM_LOOKPIN_THUMB.targetWidth, IMAGE_SPECS.PLATFORM_LOOKPIN_THUMB.targetHeight)
            .jpeg({ quality: IMAGE_SPECS.PLATFORM_LOOKPIN_THUMB.quality }) // 90
            .toBuffer();
        zip.file('lookpin_thumb.jpg', imgLookpinThumb);

        // 4. [Square] SmartStore/Hiver Thumb To 1:1
        // Logic: Crop height to 1200 (width 1200) (Center) -> Resize to 1000x1000
        const imgSquare = await master.clone()
            .extract({ left: 0, top: (1600 - 1200) / 2, width: 1200, height: 1200 })
            .resize(IMAGE_SPECS.PLATFORM_SQUARE.targetWidth, IMAGE_SPECS.PLATFORM_SQUARE.targetHeight)
            .jpeg({ quality: IMAGE_SPECS.PLATFORM_SQUARE.quality }) // 90
            .toBuffer();
        zip.file('smartstore_hiver_thumb.jpg', imgSquare);

        const archive = await zip.generateAsync({ type: 'blob' });
        const arrayBufferZip = await archive.arrayBuffer();

        return new NextResponse(arrayBufferZip, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename=derivatives.zip',
            },
        });

    } catch (error) {
        console.error('Error processing image:', error);
        return NextResponse.json({ error: 'Image processing failed' }, { status: 500 });
    }
}
