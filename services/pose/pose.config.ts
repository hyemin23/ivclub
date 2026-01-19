import { CameraAngle } from '../../types';

export const POSE_ANGLES = [
    { id: 'default', label: '리셋' },
    { id: 'front', label: '정면' },
    { id: 'left-30', label: '좌측 30°' },
    { id: 'left-40', label: '좌측 40°' },
    { id: 'right-30', label: '우측 30°' },
    { id: 'right-40', label: '우측 40°' },
    { id: 'left-side', label: '좌측면' },
    { id: 'right-side', label: '우측면' },
] as const;

export const RESOLUTION_OPTIONS = [
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' }
];

export const ASPECT_RATIO_OPTIONS = [
    { value: '1:1', label: '1:1' },
    { value: '9:16', label: '9:16' },
    { value: '4:3', label: '4:3' }
];

export const FACE_MODE_OPTIONS = [
    { value: 'HEADLESS', label: '얼굴 제거/크롭 (Headless) [기본]' },
    { value: 'OFF', label: '선택 안함 (원본 유지)' },
    { value: 'ON', label: '얼굴 교체 (Face Swap)' }
];

export const GENDER_OPTIONS = [
    { value: 'UNSPECIFIED', label: '선택 안함' },
    { value: 'Female', label: '여성 (Female)' },
    { value: 'Male', label: '남성 (Male)' }
];
