
import { Resolution, AspectRatio, FaceMode, Gender, CameraAngle } from '../../types';

export interface PoseState {
    baseImage: string | null;
    refImage: string | null;
    faceRefImage: string | null;
    prompt: string;
    selectedAngles: CameraAngle[];
    resolution: Resolution;
    aspectRatio: AspectRatio;
    faceMode: FaceMode;
    gender: Gender;
    resultImages: string[];
    isLoading: boolean;
    progress: number;
    progressText: string;
}

export type PoseAngle = {
    id: CameraAngle;
    label: string;
    icon?: React.ReactNode;
}
