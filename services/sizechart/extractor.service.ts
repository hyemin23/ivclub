
import { SizeRecord, SizeColumn } from '@/types';

// Standard Extract from Text
export const extractSizeFromText = async (text: string): Promise<SizeRecord[]> => {
    // Mock Implementation
    console.log("Extracting size from text:", text.substring(0, 20) + "...");
    return [
        { id: 's1', name: 'S', length: '70', shoulder: '45', chest: '50' },
        { id: 's2', name: 'M', length: '72', shoulder: '47', chest: '52' },
        { id: 's3', name: 'L', length: '74', shoulder: '49', chest: '54' },
    ];
};

// Standard Extract from Image (Mock)
export const extractSizeFromImage = async (imageUrl: string): Promise<SizeRecord[]> => {
    // Mock Implementation
    console.log("Extracting size from image...");
    return [
        { id: 's1', name: 'Free', length: '72', shoulder: '50', chest: '55' },
    ];
};

export const detectColumns = (records: SizeRecord[]): SizeColumn[] => {
    if (records.length === 0) return [];
    const keys = Object.keys(records[0]).filter(k => k !== 'id' && k !== 'name');
    return keys.map(k => ({
        id: k,
        label: k.charAt(0).toUpperCase() + k.slice(1),
        key: k
    }));
};

// --- Added for API Compatibility ---

export const extractSizeChart = async (sourceId: string, hint?: string) => {
    console.log(`[Service] Extracting Size Chart for ${sourceId} with hint ${hint}`);
    // Determine input type (URL or ID) -> Logic TBD
    // For now, assume it's an image URL for the build
    const records = await extractSizeFromImage(sourceId);
    return {
        status: 'success',
        data: {
            columns: detectColumns(records),
            rows: records
        }
    };
};

export const fallbackToVisionLLM = async (sourceId: string, hint?: string) => {
    console.log(`[Service] Vision Fallback for ${sourceId}`);
    const records = await extractSizeFromText("Mock Vision Data");
    return {
        status: 'success',
        data: {
            columns: detectColumns(records),
            rows: records
        }
    };
};
