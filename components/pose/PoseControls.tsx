
import React from 'react';
import { CameraAngle, Resolution, AspectRatio, FaceMode, Gender } from '../../types';
import { POSE_ANGLES, RESOLUTION_OPTIONS, ASPECT_RATIO_OPTIONS, FACE_MODE_OPTIONS, GENDER_OPTIONS } from '../../services/pose/pose.config';
import CustomSelect from '../CustomSelect';
import { Monitor, Maximize2, UserCircle, User, AlertCircle, RotateCcw, CornerUpLeft, CornerUpRight, MoveLeft, MoveRight, X, Sparkles } from 'lucide-react';

interface PoseControlsProps {
    prompt: string;
    setPrompt: (val: string) => void;
    selectedAngles: CameraAngle[];
    toggleAngle: (angle: CameraAngle) => void;
    resolution: Resolution;
    setResolution: (val: Resolution) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (val: AspectRatio) => void;
    faceMode: FaceMode;
    setFaceMode: (val: FaceMode) => void;
    gender: Gender;
    setGender: (val: Gender) => void;
    isLoading: boolean;
    baseImage: string | null;
    handleGenerate: () => void;
    handleStopClick: () => void;
}

const AngleIcon = ({ angle }: { angle: string }) => {
    switch (angle) {
        case 'default': return <RotateCcw className="w-4 h-4" />;
        case 'front': return <Maximize2 className="w-4 h-4" />;
        case 'left-30': return <CornerUpLeft className="w-4 h-4" />;
        case 'left-40': return <CornerUpLeft className="w-4 h-4 rotate-12" />;
        case 'right-30': return <CornerUpRight className="w-4 h-4" />;
        case 'right-40': return <CornerUpRight className="w-4 h-4 -rotate-12" />;
        case 'left-side': return <MoveLeft className="w-4 h-4" />;
        case 'right-side': return <MoveRight className="w-4 h-4" />;
        default: return <Maximize2 className="w-4 h-4" />;
    }
}

export const PoseControls: React.FC<PoseControlsProps> = ({
    prompt, setPrompt, selectedAngles, toggleAngle,
    resolution, setResolution, aspectRatio, setAspectRatio,
    faceMode, setFaceMode, gender, setGender,
    isLoading, baseImage, handleGenerate, handleStopClick
}) => {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">카메라 앵글 조절</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {POSE_ANGLES.map((angle) => (
                        <button
                            key={angle.id}
                            onClick={() => toggleAngle(angle.id as CameraAngle)}
                            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${selectedAngles.includes(angle.id as CameraAngle) ? 'bg-white text-black border-white shadow-xl' : 'bg-black border-white/10 text-gray-600 hover:border-white/30'
                                }`}
                        >
                            <AngleIcon angle={angle.id} />
                            <span className="text-[9px] font-black uppercase">{angle.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">추가 프롬프트 (선택)</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="특별한 포즈나 설정을 직접 입력하세요..."
                    className="w-full h-24 bg-black border border-white/10 rounded-2xl px-5 py-4 text-xs focus:border-white outline-none transition-all resize-none text-gray-300 font-medium"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <CustomSelect
                    label="해상도"
                    value={resolution}
                    onChange={(val) => setResolution(val as Resolution)}
                    options={RESOLUTION_OPTIONS}
                    icon={<Monitor className="w-4 h-4" />}
                />
                <CustomSelect
                    label="비율"
                    value={aspectRatio}
                    onChange={(val) => setAspectRatio(val as AspectRatio)}
                    options={ASPECT_RATIO_OPTIONS}
                    icon={<Maximize2 className="w-4 h-4" />}
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <CustomSelect
                    label="얼굴 보정 (Face)"
                    value={faceMode}
                    onChange={(val) => setFaceMode(val as FaceMode)}
                    options={FACE_MODE_OPTIONS}
                    icon={<UserCircle className="w-4 h-4" />}
                />
                <CustomSelect
                    label="모델 성별"
                    value={gender}
                    onChange={(val) => setGender(val as Gender)}
                    options={GENDER_OPTIONS}
                    icon={<User className="w-4 h-4" />}
                    disabled={faceMode === 'HEADLESS' || faceMode === 'OFF'}
                />
            </div>

            {faceMode === 'HEADLESS' && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl animate-in fade-in">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-indigo-300 mb-1">헤드리스 모드 (Headless Mode)</p>
                            <p className="text-[10px] text-indigo-200/70 leading-relaxed">
                                얼굴을 자동으로 제거하고 목 아래 부분만 크롭합니다.<br />
                                포즈 변경이나 배경 변경 없이, 오직 얼굴만 제거된 상품 중심 이미지가 생성됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <button
                    onClick={handleStopClick}
                    className="w-full py-6 rounded-[2rem] bg-red-500 hover:bg-red-600 text-white font-black text-sm shadow-2xl shadow-red-500/20 transition-all flex items-center justify-center gap-4 group animate-pulse"
                >
                    <X className="w-6 h-6 animate-pulse" />
                    작업 중지 (Stop)
                </button>
            ) : (
                <button
                    onClick={handleGenerate}
                    disabled={!baseImage}
                    className="w-full py-6 rounded-[2rem] bg-white hover:bg-gray-200 text-black font-black text-sm shadow-2xl shadow-white/10 disabled:opacity-20 transition-all flex items-center justify-center gap-4 group"
                >
                    <Sparkles className="w-6 h-6" />
                    포즈 렌더링 실행 (선택 {selectedAngles.length}개)
                </button>
            )}
        </div>
    );
};
