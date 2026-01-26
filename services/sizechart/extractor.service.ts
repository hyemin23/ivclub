
import { SizeRecord, SizeColumn } from '../types';

export const extractSizeFromText = async (text: string): Promise<SizeRecord[]> => {
    // Mock Implementation
    console.log("Extracting size from text:", text.substring(0, 20) + "...");
    return [
        { id: 's1', name: 'S', length: '70', shoulder: '45', chest: '50' },
        { id: 's2', name: 'M', length: '72', shoulder: '47', chest: '52' },
        { id: 's3', name: 'L', length: '74', shoulder: '49', chest: '54' },
    ];
};

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
