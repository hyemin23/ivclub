
import { CellValue, Header, UnitSystem } from './types';

// --------------------------------------------------------
// 1. Regex Patterns (Step F)
// --------------------------------------------------------
const RE_NUMBER = /[\d\.]+/;
const RE_RANGE = /(\d+[\.]?\d*)\s*[~-]\s*(\d+[\.]?\d*)/; // 10-12 or 10~12
const RE_PAREN_CONTENT = /\(([^)]+)\)|\[([^\]]+)\]/; // (content) or [content]
const RE_TOLERANCE_KEYWORDS = ['오차', 'error', '±', 'plusminus'];
const RE_REC_KEYWORDS = ['추천', '권장', 'recom', 'fit', '착용'];

// --------------------------------------------------------
// 2. Header Normalization Dictionary (Step G)
// --------------------------------------------------------
const HEADER_MAP: Record<string, string> = {
    '총장': 'total_length', '기장': 'total_length', 'length': 'total_length',
    '어깨': 'shoulder_width', 'shoulder': 'shoulder_width',
    '가슴': 'chest_width', 'chest': 'chest_width', 'bust': 'chest_width', '단면': 'chest_width', // context dependent usually
    '허리': 'waist_width', 'waist': 'waist_width',
    '힙': 'hip_width', 'hip': 'hip_width', '엉덩이': 'hip_width',
    '허벅지': 'thigh_width', 'thigh': 'thigh_width',
    '밑위': 'rise_length', 'rise': 'rise_length', 'front_rise': 'rise_length',
    '밑단': 'hem_width', 'hem': 'hem_width',
    '소매': 'sleeve_length', 'sleeve': 'sleeve_length', 'arm': 'sleeve_length',
    '암홀': 'armhole_width', 'armhole': 'armhole_width'
};

/**
 * Step F: Advanced Value Parsing
 * Decomposes raw text into structured CellValue
 */
export const parseCellText = (raw: string, headerUnit: UnitSystem = 'unknown'): CellValue => {
    const cleanRaw = raw.trim();
    if (!cleanRaw) return createEmptyCell(raw);

    const result: CellValue = {
        val: null,
        unit: headerUnit, // Inherit from header first, override if found
        range: null,
        tolerance: null,
        recommendation: null,
        note: null,
        raw: cleanRaw,
        conf: 0.8 // Default base confidence
    };

    // 1. Extract Parentheses Content (Note/Rec)
    let mainText = cleanRaw;
    const parenMatch = mainText.match(RE_PAREN_CONTENT);
    if (parenMatch) {
        const content = parenMatch[1] || parenMatch[2];
        mainText = mainText.replace(parenMatch[0], '').trim(); // Remove from main parsing

        // Classify content
        if (RE_REC_KEYWORDS.some(k => content.includes(k))) {
            result.recommendation = content;
        } else if (RE_TOLERANCE_KEYWORDS.some(k => content.includes(k))) {
            // Parse tolerance range if possible, else store as note
            result.note = content; // Simplified for now
        } else {
            result.note = content;
        }
    }

    // 2. Parse Main Value (Range vs Single)
    const rangeMatch = mainText.match(RE_RANGE);
    if (rangeMatch) {
        // It's a range "30~32"
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        result.range = { min, max };
        result.val = (min + max) / 2; // Avg as logical val
    } else {
        // Single value "28"
        const numMatch = mainText.match(RE_NUMBER);
        if (numMatch) {
            result.val = parseFloat(numMatch[0]);
        } else {
            // Non-numeric value (e.g. "Free", "S")
            result.val = mainText; // keep string
        }
    }

    // 3. Unit Inference per cell (if mixed)
    if (mainText.includes('cm')) result.unit = 'cm';
    if (mainText.includes('"') || mainText.includes('in')) result.unit = 'inch';

    return result;
};

export const normalizeHeader = (label: string): string => {
    const clean = label.replace(/\(.*\)/, '').replace(/\s+/g, '').toLowerCase(); // remove (cm) etc
    for (const [key, std] of Object.entries(HEADER_MAP)) {
        if (clean.includes(key)) return std;
    }
    return stripSpecial(clean); // fallback to cleaned label
};

const stripSpecial = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');

const createEmptyCell = (raw: string): CellValue => ({
    val: null, unit: 'unknown', range: null, tolerance: null, recommendation: null, note: null, raw, conf: 0.0
});
