
import React from 'react';
import { CameraAngle, Resolution, AspectRatio } from '../../types';
import { AVAILABLE_ANGLES } from '../../services/autofit/autofit.types';
import CustomSelect from '../CustomSelect';
import { Maximize2, BoxSelect, X, Eye, Sparkles } from 'lucide-react';

interface AutoFitControlsProps {
    selectedAngles: CameraAngle[];
    setSelectedAngles: React.Dispatch<React.SetStateAction<CameraAngle[]>>;
    prompt: string;
    setPrompt: (val: string) => void;
    resolution: Resolution;
    setResolution: (val: Resolution) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (val: AspectRatio) => void;
    isLoading: boolean;
    productImage: string | null;
    handleGenerate: (isTestMode?: boolean) => void;
    handleStop: () => void;
    handleStopClick: () => void;
}

export const AutoFitControls: React.FC<AutoFitControlsProps> = ({
    selectedAngles, setSelectedAngles,
    prompt, setPrompt,
    resolution, setResolution,
    aspectRatio, setAspectRatio,
    isLoading, productImage,
    handleGenerate, handleStopClick
}) => {
    return (
        <>
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">생성할 앵글 선택 ({selectedAngles.length})</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedAngles(AVAILABLE_ANGLES.map(a => a.angle))}
                            className="text-[9px] font-bold text-slate-400 hover:text-white transition-colors uppercase"
                        >
                            Select All
                        </button>
                        <span className="text-slate-700 text-[9px]">|</span>
                        <button
                            onClick={() => setSelectedAngles([])}
                            className="text-[9px] font-bold text-slate-400 hover:text-white transition-colors uppercase"
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                    {AVAILABLE_ANGLES.map((item) => {
                        const isSelected = selectedAngles.includes(item.angle);
                        return (
                            <button
                                key={item.angle}
                                onClick={() => {
                                    setSelectedAngles(prev =>
                                        prev.includes(item.angle)
                                            ? prev.filter(a => a !== item.angle)
                                            : [...prev, item.angle]
                                    );
                                }}
                                className={`rounded-lg p-2 border transition-all flex flex-col items-center justify-center gap-1 ${isSelected
                                    ? 'bg-green-600 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-500'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full mb-1 ${isSelected ? 'bg-white' : 'bg-slate-600'}`} />
                                <span className={`text-[9px] font-bold block ${isSelected ? 'text-white' : 'text-slate-500'}`}>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">추가 프롬프트 (OPTIONAL)</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="예: 자연광이 들어오는 밝은 스튜디오, 모던한 분위기..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 transition-all resize-none h-24"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <CustomSelect
                        label="해상도"
                        value={resolution}
                        onChange={(val) => setResolution(val as Resolution)}
                        options={[
                            { value: '1K', label: '1K' },
                            { value: '2K', label: '2K' },
                            { value: '4K', label: '4K' }
                        ]}
                        icon={<Maximize2 className="w-4 h-4" />}
                    />
                </div>
                <div className="space-y-2">
                    <CustomSelect
                        label="비율"
                        value={aspectRatio}
                        onChange={(val) => setAspectRatio(val as AspectRatio)}
                        options={[
                            { value: '1:1', label: '1:1' },
                            { value: '9:16', label: '9:16' },
                            { value: '4:3', label: '4:3' },
                            { value: '3:4', label: '3:4' }
                        ]}
                        icon={<BoxSelect className="w-4 h-4" />}
                    />
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                {isLoading ? (
                    <button
                        onClick={handleStopClick}
                        className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-3 animate-pulse"
                    >
                        <X className="w-5 h-5 animate-pulse" />
                        작업 중지 (Stop)
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => handleGenerate(true)} // Pass true for testMode
                            disabled={isLoading || !productImage}
                            className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600"
                        >
                            <Eye className="w-4 h-4" />
                            1장 테스트 (Test Shot)
                        </button>
                        <button
                            onClick={() => handleGenerate(false)}
                            disabled={isLoading || !productImage || selectedAngles.length === 0}
                            className="flex-[2] py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-black font-black text-sm shadow-xl shadow-green-500/20 disabled:opacity-50 transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
                        >
                            <Sparkles className="w-5 h-5" />
                            {selectedAngles.length > 0 ? `${selectedAngles.length}개 앵글 생성 (Generate)` : '앵글을 선택하세요'}
                        </button>
                    </>
                )}
            </div>
        </>
    );
};
