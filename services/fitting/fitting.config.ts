
import React from 'react';
import { RotateCcw, Maximize2, CornerUpLeft, CornerUpRight, MoveLeft, MoveRight, ArrowDown } from 'lucide-react';

export const ANGLE_OPTIONS = [
    { id: 'default', label: '원본 유지' },
    { id: 'front', label: '정면(0°)' },
    { id: 'left-30', label: '좌측 측면(30°)' },
    { id: 'left-40', label: '좌측 측면(40°)' },
    { id: 'right-30', label: '우측 측면(30°)' },
    { id: 'right-40', label: '우측 측면(40°)' },
    { id: 'left-side', label: '완전 좌측(90°)' },
    { id: 'right-side', label: '완전 우측(90°)' },
    { id: 'back', label: '후면(180°)' },
] as const;

export const RESOLUTION_OPTIONS = ['1K', '2K', '4K'] as const;
export const ASPECT_RATIO_OPTIONS = ['1:1', '9:16', '4:3', '3:4'] as const;
export const IMAGE_COUNT_OPTIONS = [1, 2, 4] as const;
