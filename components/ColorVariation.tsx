"use client";

import React, { useState } from 'react';
import { Palette, ImageIcon, ArrowRight, X, Download, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { useGemini } from '../hooks/useGemini';
import { changeColorVariant } from '../services/imageService';

export const ColorVariation: React.FC = () => {
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [colorRefImage, setColorRefImage] = useState<string | null>(null);
    
    // New Hook Integration
    const { execute, loading, data: resultUrl } = useGemini(changeColorVariant);
    const { addToBackgroundHistory } = useStore();

    const handleImageUpload = (type: 'base' | 'color', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'base') setBaseImage(reader.result as string);
                else if (type === 'color') setColorRefImage(reader.result as string);
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!baseImage || !colorRefImage) {
            toast.error("상품 이미지와 참고 색상 이미지를 모두 업로드해주세요.");
            return;
        }

        const url = await execute(baseImage, colorRefImage);
        if (url) {
            addToBackgroundHistory(url);
        }
    };

    const handleDownload = () => {
        if (!resultUrl) return;
        const link = document.createElement('a');
        link.href = resultUrl;
        link.download = `color_variation_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="mb-12 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Palette className="w-5 h-5 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">PIGMENT STUDIO</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase text-white mb-2">
                        AI 컬러 베리에이션
                    </h2>
                    <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
                        원단 스와치나 무드보드의 색감을 추출하여 상품에 입혀보세요.<br />
                        AI가 <b>질감과 빛, 주름</b>을 완벽하게 보존하며 오직 <b>색상</b>만 변경합니다.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Left: Input Area */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-8">

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
                        {/* 1. Source Image */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">STEP 1. 원본 상품 (Source)</label>
                                <span className="text-[9px] text-gray-600 font-bold bg-white/5 px-2 py-1 rounded">누끼컷/착용컷 모두 가능</span>
                            </div>
                            <div
                                onClick={() => document.getElementById('cv-base-upload')?.click()}
                                className={`relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group ${baseImage ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/10 hover:border-white/30 bg-black/40'}`}
                            >
                                {baseImage ? (
                                    <>
                                        <img src={baseImage} className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20">이미지 변경</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-3" />
                                        <span className="text-xs font-bold">클릭하여 상품 업로드</span>
                                    </div>
                                )}
                                <input id="cv-base-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('base', e)} />
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center -my-4 relative z-10">
                            <div className="bg-slate-900 border border-white/10 rounded-full p-2 text-indigo-400 shadow-xl">
                                <ArrowRight className="w-5 h-5 animate-pulse" />
                            </div>
                        </div>

                        {/* 2. Color Ref */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">STEP 2. 참고 색상 (Color Ref)</label>
                                <span className="text-[9px] text-indigo-400/60 font-bold bg-indigo-500/5 px-2 py-1 rounded">스와치/팬톤/직물사진</span>
                            </div>
                            <div
                                onClick={() => document.getElementById('cv-ref-upload')?.click()}
                                className={`relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group ${colorRefImage ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10'}`}
                            >
                                {colorRefImage ? (
                                    <>
                                        <img src={colorRefImage} className="w-full h-full object-contain" />
                                        <button onClick={(e) => { e.stopPropagation(); setColorRefImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors">
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Palette className="w-8 h-8 mx-auto mb-3 text-indigo-400 opacity-80" />
                                        <span className="text-xs font-bold text-indigo-300">클릭하여 색상/질감 참조 이미지 업로드</span>
                                    </div>
                                )}
                                <input id="cv-ref-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('color', e)} />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !baseImage || !colorRefImage}
                            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${loading
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : (!baseImage || !colorRefImage)
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-white text-black hover:bg-indigo-50 hover:scale-[1.02] shadow-xl shadow-white/5'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RotateCcw className="w-4 h-4 animate-spin" />
                                    색상 분석 및 적용 중... 🎨
                                </span>
                            ) : (
                                '색상 변환 시작 (Generate)'
                            )}
                        </button>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-4">
                        <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-indigo-300">Tip: 텍스처(Texture) 100% 보존 모드</h4>
                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                이 모드는 상품의 <b>원단 질감, 주름, 단추, 박음질</b>을 변경하지 않고 보존합니다.
                                단순히 색상만 덮어씌우는 것보다 훨씬 자연스러운 결과를 얻을 수 있습니다.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Right: Result Area */}
                <div className="lg:col-span-12 xl:col-span-7">
                    <div className="h-full bg-black rounded-3xl border border-white/10 p-2 flex items-center justify-center min-h-[500px]">
                        {resultUrl ? (
                            <div className="relative w-full h-full rounded-2xl overflow-hidden group">
                                <img src={resultUrl} className="w-full h-full object-contain bg-neutral-900/50" />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={handleDownload} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-200">
                                        <Download className="w-4 h-4" /> 저장
                                    </button>
                                </div>
                            </div>
                        ) : loading ? (
                            <div className="text-center space-y-4">
                                <div className="relative w-20 h-20 mx-auto">
                                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-sm font-bold text-indigo-400 animate-pulse">AI가 열심히 작업 중입니다...</p>
                            </div>
                        ) : (
                            <div className="text-center opacity-30">
                                <Palette className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">결과 미리보기</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ColorVariation;
