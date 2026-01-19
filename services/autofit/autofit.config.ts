import { CameraAngle } from '../../types';

export const getAngleLabel = (angle: CameraAngle) => {
    const map: Record<string, string> = {
        'front': '정면 (Front)',
        'left-30': '좌측 30°',
        'right-30': '우측 30°',
        'left-side': '완전 좌측면',
        'right-side': '완전 우측면'
    };
    return map[angle] || angle;
};
