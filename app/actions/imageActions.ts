'use server';

import sharp from 'sharp';

/**
 * Server Action: Smart Background Removal for Color Analysis
 * Runs on the server (Node.js) where sharp is available.
 */
export async function preprocessImageForAnalysis(imageInput: string): Promise<string> {
    try {
        let buffer: Buffer;

        if (imageInput.startsWith('data:')) {
            const base64Data = imageInput.split(',')[1];
            if (!base64Data) return imageInput;
            buffer = Buffer.from(base64Data, 'base64');
        } else if (imageInput.startsWith('http')) {
            const res = await fetch(imageInput);
            buffer = Buffer.from(await res.arrayBuffer());
        } else {
            // Unknown or local path, return as is (client can't do much with sharp)
            return imageInput;
        }

        const image = sharp(buffer);
        const { dominant } = await image.stats();

        // Heuristic: If dominant color is very bright (White/Light Gray)
        // Adjust threshold as needed (240 is quite strict, maybe 230)
        const isBrightBg = (dominant.r > 230 && dominant.g > 230 && dominant.b > 230);

        if (isBrightBg) {
            console.log("Detecting Nukki Shot (White BG). Removing background for analysis (Server Side)...");

            // SRS v2.5/2.6: Strict White Removal for Color Accuracy
            // Convert white (and near-white) pixels to transparent
            // Logic: If r>240 and g>240 and b>240, set alpha=0

            const { width, height } = await image.metadata();
            const rawBuffer = await image.ensureAlpha().raw().toBuffer();
            const data = new Uint8ClampedArray(rawBuffer);

            // Manual pixel iteration for precise control
            // (Sharp's threshold isn't granular enough for "almost white" preservation vs removal)
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Tolerance: 240~255 is considered "Background White"
                if (r > 240 && g > 240 && b > 240) {
                    data[i + 3] = 0; // Set Alpha to 0
                }
            }

            const output = await sharp(data, {
                raw: {
                    width: width || 100, // Fallback safety
                    height: height || 100,
                    channels: 4
                }
            })
                .trim() // Also trim extra space
                .png()
                .toBuffer();

            return `data:image/png;base64,${output.toString('base64')}`;
        }

        return imageInput;
    } catch (e) {
        console.warn("Server Preprocess failed, using original:", e);
        return imageInput;
    }
}
