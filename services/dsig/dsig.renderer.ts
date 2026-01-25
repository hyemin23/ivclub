import { IconSpec, DsigShape } from './dsig.types';

/**
 * DSIG (Dynamic Spec Icon Generator) v2.0 Renderer
 * Converts validated JSON Specs into safe SVG strings.
 */

// Constants from SRS
const MAX_PATH_COUNT = 8;
const MAX_PATH_LENGTH = 800;
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_GRID_SIZE = 24;

/**
 * Fallback Icon (Simple Check Circle) used when validation fails
 */
const FALLBACK_ICON_SPEC: IconSpec = {
    icon_id: "fallback_error",
    shapes: [
        { type: "circle", cx: 12, cy: 12, r: 10 },
        { type: "path", d: "M9 12l2 2 4-4" }
    ]
};

/**
 * Validates the IconSpec against security and complexity constraints.
 */
const validateSpec = (spec: IconSpec): boolean => {
    if (!spec || !Array.isArray(spec.shapes)) return false;

    // Complexity Check
    if (spec.shapes.length > MAX_PATH_COUNT) {
        console.warn(`[DSIG] Validation Failed: Too many shapes (${spec.shapes.length} > ${MAX_PATH_COUNT})`);
        return false;
    }

    // Security & Data Check
    for (const shape of spec.shapes) {
        // Path Length check to prevent memory exhaustion / DoS
        if (shape.type === 'path' && shape.d.length > MAX_PATH_LENGTH) {
            console.warn(`[DSIG] Validation Failed: Path too long (${shape.d.length})`);
            return false;
        }

        // Anti-XSS: Ensure no suspicious strings in attributes (basic check)
        const allValues = Object.values(shape).join('');
        if (allValues.includes('<script') || allValues.includes('javascript:') || allValues.includes('data:')) {
            console.warn(`[DSIG] Security Alert: Suspicious content detected in shape`);
            return false;
        }
    }

    return true;
};

/**
 * Renders a single shape object to an SVG string.
 */
const renderShape = (shape: DsigShape): string => {
    const props = [
        `fill="${shape.fill || 'none'}"`,
        `stroke="${shape.stroke || 'currentColor'}"`,
        `stroke-width="${shape.strokeWidth || DEFAULT_STROKE_WIDTH}"`,
        `stroke-linecap="round"`,
        `stroke-linejoin="round"`
    ];

    if (shape.opacity) props.push(`opacity="${shape.opacity}"`);

    switch (shape.type) {
        case 'path':
            return `<path d="${shape.d}" ${props.join(' ')} />`;
        case 'circle':
            return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" ${props.join(' ')} />`;
        case 'rect':
            return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${shape.rx || 0}" ry="${shape.ry || 0}" ${props.join(' ')} />`;
        case 'line':
            return `<line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" ${props.join(' ')} />`;
        case 'polyline':
            return `<polyline points="${shape.points}" ${props.join(' ')} />`;
        default:
            return '';
    }
};

/**
 * Main Renderer Function
 * @param specOrNull The IconSpec JSON or null
 * @returns A safe SVG string
 */
export const renderSpecToSvg = (specOrNull: IconSpec | null): string => {
    const spec = (specOrNull && validateSpec(specOrNull)) ? specOrNull : FALLBACK_ICON_SPEC;

    const shapesHtml = spec.shapes.map(renderShape).join('');

    // Standard Lucide-compatible SVG container
    return `
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="${DEFAULT_GRID_SIZE}" 
            height="${DEFAULT_GRID_SIZE}" 
            viewBox="${spec.viewBox || '0 0 24 24'}" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="${DEFAULT_STROKE_WIDTH}" 
            stroke-linecap="round" 
            stroke-linejoin="round"
        >
            ${shapesHtml}
        </svg>
    `.trim();
};
