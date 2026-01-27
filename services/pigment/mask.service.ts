
/**
 * Pigment Studio Mask Engineering Service
 * Implements SRS 2.3: Mathematical Composition
 * REFACRORED: Uses 'sharp' for Server-Side execution (Node.js) instead of DOM Canvas.
 */

import sharp from 'sharp';

export interface SegmentationResult {
    mask_person: string; // Base64 Data URI
    mask_garment: string;
    mask_skin: string;
    mask_hand: string;
    mask_hair_face: string;
    mask_prop?: string;
    mask_bg: string;
}

// --------------------------------------------------------
// 0. Sharp Helpers
// --------------------------------------------------------

const base64ToBuffer = (base64: string): Buffer => {
    const data = base64.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(data, 'base64');
};

const bufferToBase64 = async (buffer: Buffer): Promise<string> => {
    const b64 = buffer.toString('base64');
    return `data:image/png;base64,${b64}`; // Always PNG for masks
};

const ensurePngBuffer = async (input: string | Buffer): Promise<Buffer> => {
    const buf = typeof input === 'string' ? base64ToBuffer(input) : input;
    // ensure uniform format if needed, but sharp handles inputs well.
    return buf;
};

// --------------------------------------------------------
// 1. Primitive Operations (Dilate, Erode, Boolean)
// --------------------------------------------------------

/**
 * Applies Dilation (Expansion) to a mask
 * Using Sharp: Blur + Threshold (Approximation of Dilation)
 * @param maskDataURI 
 * @param radius 
 */
export const dilateMask = async (maskDataURI: string, radius: number): Promise<string> => {
    if (!maskDataURI) return "";
    if (radius <= 0) return maskDataURI;

    try {
        const inputBuffer = base64ToBuffer(maskDataURI);

        // Dilation via Blur + Threshold
        // Blurring spreads the white pixels. Thresholding lower captures that spread.
        // Sigma for blur: roughly radius / 2 for similar visual spread
        const sigma = Math.max(0.3, radius / 2);

        const processed = await sharp(inputBuffer)
            .blur(sigma)
            .threshold(50) // Capture the spread (expand)
            .toBuffer();

        return await bufferToBase64(processed);
    } catch (e) {
        console.error("Mask Dilation Failed", e);
        return maskDataURI; // Fallback
    }
};

/**
 * Boolean Subtract: A - B
 * Sharp: Composite A with B using 'dest-out' (Removes B from A)
 */
export const subtractMask = async (maskA: string, maskB: string): Promise<string> => {
    if (!maskA) return "";
    if (!maskB) return maskA;

    try {
        const bufferA = base64ToBuffer(maskA);
        const bufferB = base64ToBuffer(maskB);

        // Ensure resizing B to A? Assuming same dimensions from pipeline.
        // If not, might crash. Pipeline should guarantee same dim.

        const processed = await sharp(bufferA)
            .composite([{
                input: bufferB,
                blend: 'dest-out'
            }])
            .png()
            .toBuffer();

        return await bufferToBase64(processed);
    } catch (e) {
        console.error("Mask Subtract Failed", e);
        return maskA; // Fallback
    }
};

/**
 * Boolean Intersect: A AND B
 * Sharp: Composite A with B using 'dest-in' (Keeps only overlap)
 * Or 'in' blend mode.
 */
export const intersectMask = async (maskA: string, maskB: string): Promise<string> => {
    if (!maskA || !maskB) return "";

    try {
        const bufferA = base64ToBuffer(maskA);
        const bufferB = base64ToBuffer(maskB);

        const processed = await sharp(bufferA)
            .composite([{
                input: bufferB,
                blend: 'dest-in'
            }])
            .png()
            .toBuffer();

        return await bufferToBase64(processed);
    } catch (e) {
        console.error("Mask Intersect Failed", e);
        return ""; // Safe fallback being empty
    }
};


// --------------------------------------------------------
// 2. SRS Formulas
// --------------------------------------------------------

/**
 * Formula (A): M_cleanup = M_bg - dilate(M_person, margin)
 */
export const composeCleanupMask = async (seg: SegmentationResult, imageShortEdge: number): Promise<string> => {
    const marginPx = Math.round(Math.max(5, imageShortEdge * 0.006));

    // 1. Dilate M_person
    const dilatedPerson = await dilateMask(seg.mask_person, marginPx);

    // 2. Subtract from M_bg
    return await subtractMask(seg.mask_bg, dilatedPerson);
};

/**
 * Formula (B): M_prop_final = M_prop AND dilate(M_hand, radius)
 * *Only strictly remove props near hands if configured*
 */
export const composePropMask = async (seg: SegmentationResult, imageShortEdge: number): Promise<string> => {
    if (!seg.mask_prop) return ""; // Empty mask

    const handRadius = Math.round(Math.max(20, imageShortEdge * 0.02));

    // 1. Dilate Hand
    const dilatedHand = await dilateMask(seg.mask_hand, handRadius);

    // 2. Intersect with Prop
    return await intersectMask(seg.mask_prop, dilatedHand);
};

/**
 * Formula (C): M_recolor = M_garment_target - M_skin - M_prop_final - M_hair_face
 */
export const composeRecolorMask = async (
    seg: SegmentationResult,
    propFinalMask: string
): Promise<string> => {
    // 1. Start with Target
    let current = seg.mask_garment;

    // 2. Subtract Skin
    current = await subtractMask(current, seg.mask_skin);

    // 3. Subtract Prop Final
    if (propFinalMask) {
        current = await subtractMask(current, propFinalMask);
    }

    // 4. Subtract Hair/Face (Safety)
    current = await subtractMask(current, seg.mask_hair_face);

    return current;
};
