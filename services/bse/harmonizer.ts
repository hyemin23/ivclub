import { BSEConfig } from './types';
import { rgbToLab, labToRgb, calculateStats, Lab } from './utils/color';

// Placeholder for pixel buffer access
type PixelData = Uint8ClampedArray;

interface MaskData {
    garment: boolean[]; // Boolean mask array
    skin: boolean[];
    background: boolean[];
}

/**
 * Stage E: Split Harmonization Logic
 * 
 * Transfers illumination (Luminance) from Background -> Subject
 * Strictly limits Color (Chrominance) transfer based on config.
 */
export class SplitHarmonizer {

    static harmonize(
        sourcePixels: PixelData,
        width: number,
        height: number,
        masks: MaskData,
        bgStats: { meanL: number, meanA: number, meanB: number },
        config: BSEConfig['harmonize']
    ): PixelData {
        if (!config.enabled) return sourcePixels;

        const output = new Uint8ClampedArray(sourcePixels.length);
        const len = width * height;

        for (let i = 0; i < len; i++) {
            const isGarment = masks.garment[i];
            const isSkin = masks.skin[i];

            // If background pixel (not subject), just copy or skip (handled by composition)
            // Here we assume sourcePixels is the extracted subject (alpha premultiplied or just RGB)
            // For simplicity, let's assume we process everything that is NOT background mask
            // But typically this runs on the 'comp0' subject area.

            if (!isGarment && !isSkin) {
                // Copy as is for now (shoes, accessories)
                output[i * 4] = sourcePixels[i * 4];
                output[i * 4 + 1] = sourcePixels[i * 4 + 1];
                output[i * 4 + 2] = sourcePixels[i * 4 + 2];
                output[i * 4 + 3] = sourcePixels[i * 4 + 3];
                continue;
            }

            const r = sourcePixels[i * 4];
            const g = sourcePixels[i * 4 + 1];
            const b = sourcePixels[i * 4 + 2];
            const a = sourcePixels[i * 4 + 3];

            if (a === 0) continue; // Skip transparent

            // Convert to Lab
            const lab = rgbToLab(r, g, b);

            // Determine Weights
            let wL = 0.8;
            let wC = 0.2;

            if (isGarment) {
                wL = config.weights.garment.luminance;
                wC = config.weights.garment.chrominance; // CRITICAL: Should be small (~0.05)
            } else if (isSkin) {
                wL = config.weights.skin_hair.luminance;
                wC = config.weights.skin_hair.chrominance;
            }

            // 1. Luminance Transfer (Mean Shift)
            // L_new = L_old + (L_bg_mean - L_old_mean) * wL ? 
            // Simplified: Move L towards L_bg_mean
            // Since we don't have source mean here efficiently without pre-pass, 
            // let's assume valid 'lighting match' simply pulls mean towards BG.
            // A better approach is Histogram Matching, but here we do simple Mean alignment logic:
            // Target L = Source L * (1-wL) + (Source L scaled to BG) * wL

            // Let's implement a simpler "Tint" logic for L:
            // We want the brightness to match the BG ambient.
            // If BG is dark, darken subject.
            const lDiff = bgStats.meanL - 50; // shift from mid-gray? 
            // or just: L' = L + (bgStats.meanL - L) * wL * 0.5 (dampened)

            const newL = lab.l + (bgStats.meanL - lab.l) * wL * 0.5;

            // 2. Chrominance Transfer (Tint)
            // Pull (a, b) towards BG (a, b)
            let newA = lab.a + (bgStats.meanA - lab.a) * wC;
            let newB = lab.b + (bgStats.meanB - lab.b) * wC;

            // 3. Garment Lock Clamp (Strict Rule)
            if (isGarment) {
                const deltaA = newA - lab.a;
                const deltaB = newB - lab.b;
                const maxDelta = 4.0; // Hard limit for drift

                if (Math.abs(deltaA) > maxDelta) newA = lab.a + Math.sign(deltaA) * maxDelta;
                if (Math.abs(deltaB) > maxDelta) newB = lab.b + Math.sign(deltaB) * maxDelta;
            }

            // Convert back
            const newRgb = labToRgb(newL, newA, newB);

            output[i * 4] = newRgb.r;
            output[i * 4 + 1] = newRgb.g;
            output[i * 4 + 2] = newRgb.b;
            output[i * 4 + 3] = a;
        }

        return output;
    }

    /**
     * Extract Background Statistics (L, a, b Mean) from Reference Image
     * Ignores pixels that are masked out (if mask provided) or transparent
     */
    static extractBackgroundStats(
        pixels: Uint8ClampedArray,
        width: number,
        height: number,
        mask?: boolean[] // True = Foreground (Ignore), False = Background (Include)
    ): { meanL: number, meanA: number, meanB: number } {
        const samples: Lab[] = [];
        const step = 4; // Downsample for speed (take every 4th pixel)

        for (let i = 0; i < width * height; i += step) {
            if (mask && mask[i]) continue; // Skip foreground

            const r = pixels[i * 4];
            const g = pixels[i * 4 + 1];
            const b = pixels[i * 4 + 2];
            const a = pixels[i * 4 + 3];

            if (a < 10) continue; // Skip transparent

            samples.push(rgbToLab(r, g, b));
        }

        const stats = calculateStats(samples);
        return {
            meanL: stats.meanL,
            meanA: stats.meanA,
            meanB: stats.meanB
        };
    }
}
