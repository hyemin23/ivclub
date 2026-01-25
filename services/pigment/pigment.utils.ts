
import { PipelineConfig, PigmentRequest } from './pigment.types';

/**
 * SRS 1.3: Idempotency Key Generation
 * hash(source_image_id + pipeline_config_normalized + model_version + app_version)
 */
export const generateIdempotencyKey = (request: PigmentRequest, appVersion: string = '1.3.9', modelVersion: string = 'gemini-1.5-pro'): string => {
    // 1. Normalize Config (Sort keys to ensure consistency)
    const normalizedConfig = JSON.stringify(sortObjectKeys(request.pipeline_config));

    // 2. Construct Raw String
    const rawString = `${request.source_image_id}|${normalizedConfig}|${modelVersion}|${appVersion}|${request.seed_offset || 0}`;

    // 3. Simple Hash (DJB2 or similar for client-side usage, or standard SHA/MD5 if critical)
    // Using a simple tailored hash for performance
    return simpleHash(rawString);
};

/**
 * SRS 1.3: Seed Policy
 * seed = hash32(idempotency_key)
 */
export const deriveSeedFromKey = (idempotencyKey: string): number => {
    let hash = 0;
    for (let i = 0; i < idempotencyKey.length; i++) {
        const char = idempotencyKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

// Start validation helpers
export const calculateDeltaE = (rgb1: [number, number, number], rgb2: [number, number, number]): number => {
    // Basic Euclidean distance for MVP, ideally CIELAB
    const r = rgb1[0] - rgb2[0];
    const g = rgb1[1] - rgb2[1];
    const b = rgb1[2] - rgb2[2];
    return Math.sqrt(r * r + g * g + b * b);
};

// Helper to sort object keys recursively for consistent JSON stringify
function sortObjectKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }

    return Object.keys(obj)
        .sort()
        .reduce((result: any, key) => {
            result[key] = sortObjectKeys(obj[key]);
            return result;
        }, {});
}

// Simple Hash Implementation (DJB2 variant)
function simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    // Convert to hex string
    return (hash >>> 0).toString(16);
}
