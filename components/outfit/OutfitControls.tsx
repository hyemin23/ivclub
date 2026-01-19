import React from 'react';
import { RefreshCw, Sparkles, Paintbrush, Monitor, Zap } from 'lucide-react'; // Added Monitor, Zap

interface OutfitControlsProps {
    handleGenerate: () => void;
    isLoading: boolean;
    disabled: boolean;
    ratio: string;
    setRatio: (r: string) => void;
    quality: string;
    setQuality: (q: string) => void;
}

export const OutfitControls: React.FC<OutfitControlsProps> = ({
    handleGenerate, isLoading, disabled, ratio, setRatio, quality, setQuality
}) => {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {/* 1. 비율 선택 */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Monitor className="w-3 h-3 text-indigo-400" /> 화면 비율 (ASPECT RATIO)
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                        {['1:1', '3:4', '9:16', '4:3', '16:9'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRatio(r)}
                                className={`flex flex-col items-center py-2 rounded-lg border transition-all ${ratio === r
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                            >
                                <span className="text-[10px] font-bold">{r}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. 화질 선택 */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-400" /> 품질 설정 (QUALITY)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setQuality('STANDARD')}
                            className={`text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${quality === 'STANDARD'
                                ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="flex items-center gap-2 text-xs font-bold text-white">
                                <Zap className="w-3 h-3 text-yellow-400" /> 일반 (STANDARD)
                            </div>
                            <div className="text-[10px] text-slate-400">빠름 / 테스트 권장</div>
                        </button>
                        <button
                            onClick={() => setQuality('HIGH')}
                            className={`text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${quality === 'HIGH'
                                ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="flex items-center gap-2 text-xs font-bold text-white">
                                <Sparkles className="w-3 h-3 text-indigo-400" /> 초고화질 (HIGH-RES)
                            </div>
                            <div className="text-[10px] text-slate-400">1.5x 업스케일 / 느림</div>
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={disabled}
                className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
            >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Paintbrush className="w-5 h-5" />}
                {isLoading ? '고화질 변환 중... (최대 30초)' : '칠한 영역 교체하기 (Generate Fill)'}
            </button>
        </div>
    );
};
