
import React from 'react';
import { CameraAngle, Resolution, AspectRatio, ViewMode, FaceMode, Gender } from '../../types';
import { ANGLE_OPTIONS } from '../../services/fitting/fitting.config';
import { Video, UserCircle, User, UserSquare, Sparkles, RefreshCw, RotateCcw, Maximize2, CornerUpLeft, CornerUpRight, MoveLeft, MoveRight, ArrowDown } from 'lucide-react';

interface FittingControlsProps {
    prompt: string;
    setPrompt: (val: string) => void;
    viewMode: ViewMode;
    setViewMode: (val: ViewMode) => void;
    cameraAngle: CameraAngle;
    setCameraAngle: (val: CameraAngle) => void;
    resolution: Resolution;
    setResolution: (val: Resolution) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (val: AspectRatio) => void;
    imageCount: number;
    setImageCount: (val: number) => void;
    faceMode: FaceMode;
    setFaceMode: (val: FaceMode) => void;
    gender: Gender;
    setGender: (val: Gender) => void;
    isLoading: boolean;
    baseImage: string | null;
    handleGenerate: () => void;
}

const AngleIcon = ({ angle }: { angle: string }) => {
    switch (angle) {
        case 'default': return <RotateCcw className="w-3 h-3" />;
        case 'front': return <Maximize2 className="w-3 h-3" />;
        case 'left-30': return <CornerUpLeft className="w-3 h-3" />;
        case 'left-40': return <CornerUpLeft className="w-3 h-3 rotate-12" />;
        case 'right-30': return <CornerUpRight className="w-3 h-3" />;
        case 'right-40': return <CornerUpRight className="w-3 h-3 -rotate-12" />;
        case 'left-side': return <MoveLeft className="w-3 h-3" />;
        case 'right-side': return <MoveRight className="w-3 h-3" />;
        case 'back': return <ArrowDown className="w-3 h-3" />;
        default: return <RotateCcw className="w-3 h-3" />;
    }
}

export const FittingControls: React.FC<FittingControlsProps> = ({
    prompt, setPrompt, viewMode, setViewMode, cameraAngle, setCameraAngle,
    resolution, setResolution, aspectRatio, setAspectRatio, imageCount, setImageCount,
    faceMode, setFaceMode, gender, setGender, isLoading, baseImage, handleGenerate
}) => {
    return (
        <>
            <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Video className="w-3 h-3 text-indigo-400" /> 8방향 정밀 카메라 앵글
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {ANGLE_OPTIONS.map((angle) => (
                        <button
                            key={angle.id}
                            onClick={() => setCameraAngle(angle.id as CameraAngle)}
                            className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${cameraAngle === angle.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                }`}
                        >
                            <AngleIcon angle={angle.id} />
                            <span className="text-[9px] font-bold whitespace-nowrap">{angle.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">프레이밍 (FRAMING)</label>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setViewMode('top')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${viewMode === 'top' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                            }`}
                    >
                        <UserCircle className="w-5 h-5" />
                        <span className="text-[11px] font-bold">상반신컷</span>
                    </button>
                    <button
                        onClick={() => setViewMode('full')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${viewMode === 'full' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[11px] font-bold">전신컷</span>
                    </button>
                    <button
                        onClick={() => setViewMode('bottom')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${viewMode === 'bottom' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                            }`}
                    >
                        <UserSquare className="w-5 h-5" />
                        <span className="text-[11px] font-bold">하반신컷</span>
                    </button>
                </div>
            </div>

            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">모델 얼굴 노출</span>
                    </div>
                    <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setFaceMode('OFF')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${faceMode === 'OFF' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500'}`}
                        >
                            OFF
                        </button>
                        <button
                            onClick={() => setFaceMode('ON')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${faceMode === 'ON' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}
                        >
                            ON
                        </button>
                    </div>
                </div>

                {faceMode === 'ON' && (
                    <div className="grid grid-cols-2 gap-3 animate-in zoom-in-95">
                        <button
                            onClick={() => setGender('Male')}
                            className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${gender === 'Male' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                        >
                            남성 모델
                        </button>
                        <button
                            onClick={() => setGender('Female')}
                            className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${gender === 'Female' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                        >
                            여성 모델
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">추가 자유 프롬프트 (OPTIONAL)</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="나머지 규칙은 NanoBanana PRO가 준수합니다. 특별히 강조하고 싶은 내용만 입력하세요."
                    className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[11px] focus:border-indigo-400 outline-none transition-all resize-none text-slate-300"
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">해상도</label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-[11px] focus:border-indigo-400 outline-none">
                        <option value="1K">1K</option><option value="2K">2K</option><option value="4K">4K</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">비율</label>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-[11px] focus:border-indigo-400 outline-none">
                        <option value="1:1">1:1</option><option value="9:16">9:16</option><option value="4:3">4:3</option><option value="3:4">3:4</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">생성 수</label>
                    <select value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-[11px] focus:border-indigo-400 outline-none">
                        <option value={1}>1</option><option value={2}>2</option><option value={4}>4</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading || !baseImage}
                className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
            >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                NanoBanana PRO 베리에이션 실행 ({imageCount}장)
            </button>
        </>
    );
};
