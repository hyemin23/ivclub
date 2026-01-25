
export type Orientation = 'horizontal' | 'vertical' | 'unknown';
export type UnitSystem = 'cm' | 'inch' | 'mixed' | 'unknown';
export type HeaderType = 'measure' | 'size' | 'meta';
export type SizeType = 'alpha' | 'numeric' | 'kr_women' | 'free' | 'unknown';

export interface Confidence {
    grid: number;
    headers: number;
    values: number;
    transpose: number;
    unit: number;
    overall: number;
}

export interface Header {
    key: string;            // normalized key (e.g. 'waist_width')
    label: string;          // original text (e.g. '허리단면')
    standard_key: string;   // standardized key
    header_type: HeaderType;
    unit: UnitSystem;       // inferred unit for this column
    conf: number;
}

export interface CellValue {
    val: number | string | null; // numeric preferred, string if complex
    unit: UnitSystem;
    range: { min: number; max: number } | null;
    tolerance: { min: number; max: number } | null;
    recommendation: string | null;  // e.g. "30~32"
    note: string | null;            // e.g. "banded"
    raw: string;                    // original text: "28(30~32)"
    conf: number;
}

export interface Row {
    row_id: string;
    size_val: string;       // Primary size key: "M", "28", "Free"
    size_type: SizeType;
    cells: Record<string, CellValue>; // Keyed by Header.standard_key (e.g. 'waist_width')
    row_conf: number;
}

export interface Note {
    raw: string;
    type: 'tolerance_note' | 'model_spec' | 'washing' | 'unknown';
}

export interface Table {
    table_id: string;
    source_image_id: string;
    orientation: Orientation;
    is_transposed: boolean;
    units_default: UnitSystem;
    headers: Header[];
    rows: Row[];
    notes: Note[];
    confidence: Confidence;
    needs_review: boolean;
    review_reasons: string[];
}

export interface SizeChartResponse {
    tables: Table[];
    status: 'success' | 'partial_success' | 'fail';
    error?: string;
}

// Internal Types for Processing
export interface ROI {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Grid {
    rows: number;
    cols: number;
    cells: {
        r: number;
        c: number;
        text: string;
        bbox?: ROI;
    }[];
}
