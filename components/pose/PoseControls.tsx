import React from 'react';
import { Camera, Wand2, X } from 'lucide-react';

export interface PoseControlsProps {
    prompt: string;
    setPrompt: (value: string) => void;
    selectedAngles: any[]; // Using any[] to match usage, ideally strictly typed if possible but inferred from context
    toggleAngle: (angle: any) => void;
    resolution: string;
    setResolution: (value: any) => void;
    aspectRatio: any;
    setAspectRatio: (value: any) => void;
    faceMode: any;
    setFaceMode: (value: any) => void;
    gender: any;
    setGender: (value: any) => void;
    isLoading: boolean;
    baseImage: string | null;
    handleGenerate: () => void;
    handleStopClick: () => void;
}

export const PoseControls: React.FC<PoseControlsProps> = ({
    prompt,
    setPrompt,
    selectedAngles,
    toggleAngle,
    resolution,
    setResolution,
    aspectRatio,
    setAspectRatio,
    faceMode,
    setFaceMode,
    gender,
    setGender,
    isLoading,
    baseImage,
    handleGenerate,
    handleStopClick
}) => {
    return (
        <div className="space-y-6">
            {/* 1. Prompt Input */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">프롬프트 (선택)</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="원하는 포즈나 분위기를 설명해주세요..."
                    className="w-full h-24 bg-black border border-white/10 rounded-2xl px-5 py-4 text-xs focus:border-white outline-none transition-all resize-none text-gray-300 placeholder:text-gray-700 font-medium"
                />
            </div>

            {/* 2. Angle Selection */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">카메라 앵글 (다중 선택 가능)</label>
                <div className="grid grid-cols-4 gap-2">
                    {['front', 'left-30', 'right-30', 'back'].map((angle) => (
                        <button
                            key={angle}
                            onClick={() => toggleAngle(angle)}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${selectedAngles.includes(angle)
                                    ? 'bg-white text-black border-white'
                                    : 'bg-black text-gray-500 border-white/10 hover:border-white/30'
                                }`}
                        >
                            {angle.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Settings Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Face Mode */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">페이스 모드</label>
                    <select
                        value={faceMode}
                        onChange={(e) => setFaceMode(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none cursor-pointer"
                    >
                        <option value="ON">ON (얼굴 유지/생성)</option>
                        <option value="OFF">OFF (얼굴 제외/크롭)</option>
                        <option value="HEADLESS">HEADLESS (목 아래만)</option>
                    </select>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">성별</label>
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none cursor-pointer"
                    >
                        <option value="Female">여성</option>
                        <option value="Male">남성</option>
                    </select>
                </div>

                {/* Resolution */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">해상도</label>
                    <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none cursor-pointer"
                    >
                        <option value="1K">1K (기본)</option>
                        <option value="2K">2K (고화질)</option>
                    </select>
                </div>

                {/* Ratio */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">비율</label>
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none cursor-pointer"
                    >
                        <option value="3:4">3:4 (인물)</option>
                        <option value="1:1">1:1 (정방형)</option>
                        <option value="9:16">9:16 (세로형)</option>
                    </select>
                </div>
            </div>

            {/* Action Button */}
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
                    disabled={!baseImage || selectedAngles.length === 0}
                    className="w-full py-6 rounded-[2rem] bg-white hover:bg-gray-200 text-black font-black text-sm shadow-2xl shadow-white/10 disabled:opacity-20 transition-all flex items-center justify-center gap-4 group"
                >
                    <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    포즈 생성 실행 ({selectedAngles.length}개)
                </button>
            )}
        </div>
    );
};
