/**
 * Color Space Utility Functions
 * Focused on RGB <-> CIELAB conversions for Split Harmonization
 */

export interface Lab {
    l: number;
    a: number;
    b: number;
}

export interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * RGB to CIELAB Conversion
 * Assumes sRGB input [0, 255]
 * Output L [0, 100], a [-128, 127], b [-128, 127]
 */
export function rgbToLab(r: number, g: number, b: number): Lab {
    let R = r / 255;
    let G = g / 255;
    let B = b / 255;

    R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
    G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
    B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

    let X = R * 0.4124 + G * 0.3576 + B * 0.1805;
    let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    let Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

    // D65 Reference
    X = X / 0.95047;
    Y = Y / 1.00000;
    Z = Z / 1.08883;

    X = X > 0.008856 ? Math.pow(X, 1 / 3) : (7.787 * X) + (16 / 116);
    Y = Y > 0.008856 ? Math.pow(Y, 1 / 3) : (7.787 * Y) + (16 / 116);
    Z = Z > 0.008856 ? Math.pow(Z, 1 / 3) : (7.787 * Z) + (16 / 116);

    return {
        l: (116 * Y) - 16,
        a: 500 * (X - Y),
        b: 200 * (Y - Z)
    };
}

/**
 * CIELAB to RGB Conversion
 * Output [0, 255]
 */
export function labToRgb(l: number, a: number, b: number): RGB {
    let Y = (l + 16) / 116;
    let X = a / 500 + Y;
    let Z = Y - b / 200;

    const pow3 = (v: number) => {
        return Math.pow(v, 3) > 0.008856 ? Math.pow(v, 3) : (v - 16 / 116) / 7.787;
    }

    X = 0.95047 * pow3(X);
    Y = 1.00000 * pow3(Y);
    Z = 1.08883 * pow3(Z);

    let R = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
    let G = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
    let B = X * 0.0557 + Y * -0.2040 + Z * 1.0570;

    const toRGB = (n: number) => {
        n = n > 0.0031308 ? 1.055 * Math.pow(n, 1 / 2.4) - 0.055 : 12.92 * n;
        return Math.min(Math.max(Math.round(n * 255), 0), 255);
    };

    return {
        r: toRGB(R),
        g: toRGB(G),
        b: toRGB(B)
    };
}

/**
 * Calculate stats (Mean, Std) from a set of pixels
 */
export function calculateStats(pixels: Lab[]) {
    if (pixels.length === 0) return { meanL: 0, stdL: 0, meanA: 0, meanB: 0 };

    const sum = pixels.reduce((acc, p) => ({
        l: acc.l + p.l,
        a: acc.a + p.a,
        b: acc.b + p.b
    }), { l: 0, a: 0, b: 0 });

    const mean = {
        l: sum.l / pixels.length,
        a: sum.a / pixels.length,
        b: sum.b / pixels.length
    };

    const sqSum = pixels.reduce((acc, p) => ({
        l: acc.l + Math.pow(p.l - mean.l, 2),
        a: acc.a + Math.pow(p.a - mean.a, 2),
        b: acc.b + Math.pow(p.b - mean.b, 2)
    }), { l: 0, a: 0, b: 0 });

    return {
        meanL: mean.l,
        stdL: Math.sqrt(sqSum.l / pixels.length),
        meanA: mean.a,
        meanB: mean.b,
        stdA: Math.sqrt(sqSum.a / pixels.length),
        stdB: Math.sqrt(sqSum.b / pixels.length)
    };
}
