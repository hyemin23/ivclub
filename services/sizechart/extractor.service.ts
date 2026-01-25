
import { SizeChartResponse, Table, Header, Row, CellValue, UnitSystem } from './types';
import { parseCellText, normalizeHeader } from './parser.utils';
import { generateContentSafe, fileToPart, GEMINI_MODELS } from '../geminiClient';
import { urlToBase64 } from '../geminiService';

// --------------------------------------------------------
// 1. Types for AI Raw Output (Step B stub)
// --------------------------------------------------------
interface RawGridRow {
    cells: string[];
}
interface RawGridData {
    headers: string[];
    rows: RawGridRow[];
    unit_hint?: string;
    notes?: string[];
}

// --------------------------------------------------------
// 2. Pipeline Orchestrator
// --------------------------------------------------------

export const extractSizeChart = async (sourceImageId: string, categoryHint?: string): Promise<SizeChartResponse> => {
    try {
        console.log(`[SizeChart] Starting extraction for ${sourceImageId}`);
        const base64 = await urlToBase64(sourceImageId);

        // Step A & B: Hybrid AI Grid Extraction
        // We ask AI to "cleanly read the table structure" as JSON
        const rawGrid = await extractGridStructure(base64, categoryHint);

        // Step E & F & G: Parsing & Structuring
        const table = structureToTable(rawGrid, sourceImageId);

        return {
            tables: [table],
            status: 'success'
        };

    } catch (error: any) {
        console.error("[SizeChart] Extraction Failed:", error);
        return {
            tables: [],
            status: 'fail',
            error: error.message
        };
    }
};

// --------------------------------------------------------
// 3. Hybrid AI Engine (Step A/B)
// --------------------------------------------------------
const extractGridStructure = async (base64Image: string, hint?: string): Promise<RawGridData> => {
    const prompt = `
    [Auto Size Chart Extractor v2.2]
    TASK: Extract the Size Chart from this image into strict JSON.
    HINT: ${hint || 'Fashion Product'}

    RULES:
    1. Detect the main table grid.
    2. **HANDLE LINEAR TEXT**: If the image contains text like "free 어깨63 가슴63", separate them into Headeres and Values.
       - "어깨63" -> Header: "어깨", Value: "63"
       - "free" or "S/M" at start -> Size Name.
    3. Extract the header row (first row).
    4. Extract body rows.
    5. Detect any global unit (cm/inch) if mentioned outside.
    6. Return JSON: { "headers": ["Size", "Length", ...], "rows": [{"cells": ["M", "70", ...]}], "unit_hint": "cm", "notes": [".."] }
    `;

    const response = await generateContentSafe(prompt, [fileToPart(`data:image/jpeg;base64,${base64Image}`)], {
        taskType: 'TEXT',
        model: GEMINI_MODELS.LOGIC_REASONING, // Use smarter model for grid
        config: { responseMimeType: "application/json" }
    });

    if (response.text) return JSON.parse(response.text) as RawGridData;
    throw new Error("AI failed to extract grid structure");
};

// --------------------------------------------------------
// 4. Structuring Logic (Step E/F/G)
// --------------------------------------------------------
const structureToTable = (raw: RawGridData, imgId: string): Table => {
    // 1. Process Headers
    const headers: Header[] = raw.headers.map(h => {
        const stdKey = normalizeHeader(h);
        return {
            key: stdKey,
            label: h,
            standard_key: stdKey,
            header_type: isSizeKey(stdKey) ? 'size' : 'measure',
            unit: detectHeaderUnit(h, raw.unit_hint),
            conf: 0.9 // AI structural confidence
        };
    });

    // 2. Process Rows
    const rows: Row[] = raw.rows.map((r, idx) => {
        const cells: Record<string, CellValue> = {};
        let sizeKey = `row_${idx}`; // Default
        let sizeType: any = 'unknown';

        r.cells.forEach((cellText, cIdx) => {
            if (cIdx >= headers.length) return; // Ignore extra cells
            const header = headers[cIdx];

            // Parse Value (Step F)
            const parsedCell = parseCellText(cellText, header.unit);
            cells[header.standard_key] = parsedCell;

            // Determine Row Size Key (usually first col)
            if (cIdx === 0) {
                sizeKey = parsedCell.raw; // e.g. "M" or "28"
                sizeType = detectSizeType(parsedCell.raw);
            }
        });

        return {
            row_id: `row_${idx}`,
            size_val: sizeKey,
            size_type: sizeType,
            cells,
            row_conf: 0.85
        };
    });

    return {
        table_id: `tbl_${Date.now()}`,
        source_image_id: imgId,
        orientation: 'horizontal', // Default assumption
        is_transposed: false,
        units_default: (raw.unit_hint as UnitSystem) || 'cm',
        headers,
        rows,
        notes: raw.notes?.map(n => ({ raw: n, type: 'unknown' })) || [],
        confidence: { grid: 0.9, headers: 0.9, values: 0.85, transpose: 1.0, unit: 0.8, overall: 0.88 },
        needs_review: false,
        review_reasons: []
    };
};

// Helpers
const isSizeKey = (key: string) => ['size', 'kor_size', 'eu_size'].includes(key);
const detectHeaderUnit = (header: string, globalHint?: string): UnitSystem => {
    if (header.includes('cm')) return 'cm';
    if (header.includes('in')) return 'inch';
    if (globalHint === 'inch') return 'inch';
    return 'cm'; // Default
};
const detectSizeType = (val: string) => {
    if (['S', 'M', 'L', 'XL'].some(k => val.toUpperCase().includes(k))) return 'alpha';
    if (/\d+/.test(val)) return 'numeric';
    return 'unknown';
};

export const fallbackToVisionLLM = async (imgId: string): Promise<SizeChartResponse> => {
    // Phase 4 Stub
    return { tables: [], status: 'fail', error: 'Fallback not implemented' };
};
