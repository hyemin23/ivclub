import React from 'react';
import { RefreshCw, Sparkles, CheckSquare, Square } from 'lucide-react';
import { STYLE_PRESETS } from '../../services/detail/detail.constants';
import { Resolution, AspectRatio } from '../../types';

interface DetailControlsProps {
    selectedStyle: string;
    handleStyleSelect: (id: string) => void;
    prompt: string;
    setPrompt: (val: string) => void;
    resolution: Resolution;
    setResolution: (val: Resolution) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (val: AspectRatio) => void;
    imageCount: number;
    setImageCount: (val: number) => void;
    fabricText: string;
    setFabricText: (val: string) => void;
    uspKeywords: string;
    setUspKeywords: (val: string) => void;
    isLoading: boolean;
    baseImage: string | null;
    handleGenerate: () => void;
}

export const DetailControls: React.FC<DetailControlsProps> = ({
    selectedStyle, handleStyleSelect,
    prompt, setPrompt,
    resolution, setResolution,
    aspectRatio, setAspectRatio,
    imageCount, setImageCount,
    fabricText, setFabricText,
    uspKeywords, setUspKeywords,
    isLoading, baseImage, handleGenerate
}) => {
    return (
        <div className="space-y-6">
            {/* Style Presets */}
            <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">스타일 프리셋</label>
                <div className="flex flex-wrap gap-2">
                    {STYLE_PRESETS.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => handleStyleSelect(style.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${selectedStyle === style.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                }`}
                        >
                            {selectedStyle === style.id ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                            {style.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rose Cut Extra Inputs */}
            {selectedStyle === 'rose-cut' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">원단 텍스트 입력</label>
                        <input
                            type="text"
                            value={fabricText}
                            onChange={(e) => setFabricText(e.target.value)}
                            placeholder="예: COTTON 100%"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[11px] focus:border-indigo-400 outline-none transition-all text-slate-300"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">제품 특징 키워드 (선택사항)</label>
                            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md font-bold">AI AUTO</span>
                        </div>
                        <input
                            type="text"
                            value={uspKeywords}
                            onChange={(e) => setUspKeywords(e.target.value)}
                            placeholder="예: 스판끼 좋음, YKK 지퍼 (비워두면 AI가 자동 분석)"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[11px] focus:border-indigo-400 outline-none transition-all text-slate-300 placeholder:text-slate-600"
                        />
                    </div>
                </div>
            )}

            {/* Prompt Editor */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">프롬프트</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none"
                />
            </div>

            {/* Resolution & Ratio */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">해상도</label>
                    <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                        {(['2K', '4K'] as Resolution[]).map((res) => (
                            <button
                                key={res}
                                onClick={() => setResolution(res)}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${resolution === res ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {res}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">비율</label>
                    <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                        {(['1:1', '3:4', '9:16'] as AspectRatio[]).map((ratio) => (
                            <button
                                key={ratio}
                                onClick={() => setAspectRatio(ratio)}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${aspectRatio === ratio ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Count */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">생성 개수 ({imageCount}장)</label>
                <input
                    type="range"
                    min="1"
                    max="4"
                    value={imageCount}
                    onChange={(e) => setImageCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>

            {/* Generate Button */}
            <div className="mt-8">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !baseImage}
                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/25 ${isLoading || !baseImage
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500'
                        }`}
                >
                    {isLoading ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generating High-End Assets...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Detail Extraction
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
