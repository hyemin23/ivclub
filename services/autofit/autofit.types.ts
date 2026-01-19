import { Resolution, AspectRatio, CameraAngle, VariationResult } from '../../types';

export interface ConcurrencySettings {
    limit: number;
    label: string;
    color: string;
}

export interface AutoFitState {
    productImage: string | null;
    bgImage: string | null;
    results: VariationResult[];
    resolution: Resolution;
    aspectRatio: AspectRatio;
    selectedAngles: CameraAngle[];
    prompt: string;
    isLoading: boolean;
    progress: number;
    progressText: string;
}

export const ANGLE_LABELS: Record<string, string> = {
    'front': '정면 (Front)',
    'left-30': '좌측 30°',
    'right-30': '우측 30°',
    'left-side': '완전 좌측면',
    'right-side': '완전 우측면'
};

export const AVAILABLE_ANGLES: { angle: CameraAngle; label: string }[] = [
    { angle: 'front', label: "정면" },
    { angle: 'left-30', label: "좌측 30°" },
    { angle: 'right-30', label: "우측 30°" },
    { angle: 'left-side', label: "좌측면" },
    { angle: 'right-side', label: "우측면" },
];
