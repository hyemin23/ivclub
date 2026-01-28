"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Palette, Sparkles, Undo, Download, Loader2, ArrowRight, ImagePlus, X, Shirt, RefreshCw } from 'lucide-react';
import { generateColorChangeFromReference, generateProductReplacement } from '../services/geminiService';

type Mode = 'color-change' | 'product-replace';

const ClothingColorChanger: React.FC = () => {
    const [mode, setMode] = useState<Mode>('color-change');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // 클립보드 붙여넣기 핸들러
    const handlePaste = useCallback((e: ClipboardEvent, target: 'original' | 'reference') => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const result = e.target?.result as string;
                        if (target === 'original') {
                            setOriginalImage(result);
                        } else {
                            setReferenceImage(result);
                        }
                    };
                    reader.readAsDataURL(blob);
                }
                break;
            }
        }
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'original' | 'reference') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (target === 'original') {
                setOriginalImage(result);
            } else {
                setReferenceImage(result);
            }
        };
        reader.readAsDataURL(file);
        setResultImage(null);
    };

    const handleDrop = (e: React.DragEvent, target: 'original' | 'reference') => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (target === 'original') {
                setOriginalImage(result);
            } else {
                setReferenceImage(result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!originalImage || !referenceImage || isGenerating) return;

        try {
            setIsGenerating(true);
            let generatedUrl: string;

            if (mode === 'color-change') {
                generatedUrl = await generateColorChangeFromReference(
                    originalImage,
                    referenceImage,
                    customPrompt || undefined
                );
            } else {
                generatedUrl = await generateProductReplacement(
                    originalImage,
                    referenceImage,
                    customPrompt || undefined
                );
            }

            setResultImage(generatedUrl);
        } catch (e) {
            console.error(e);
            alert('생성 중 오류가 발생했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    const clearAll = () => {
        setOriginalImage(null);
        setReferenceImage(null);
        setResultImage(null);
        setCustomPrompt('');
    };

    return (
        <div className="flex flex-col gap-6" ref={containerRef}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    <div>
                        <h3 className="text-sm font-bold text-white">AI 상품 에디터</h3>
                        <p className="text-[10px] text-slate-400">색상 변경 또는 상품 교체를 선택하세요.</p>
                    </div>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 w-fit">
                <button
                    onClick={() => setMode('color-change')}
                    className={`px-4 py-2.5 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all ${mode === 'color-change'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Palette className="w-3.5 h-3.5" />
                    색상 변경
                </button>
                <button
                    onClick={() => setMode('product-replace')}
                    className={`px-4 py-2.5 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all ${mode === 'product-replace'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    상품 교체
                </button>
            </div>

            {/* Mode Description */}
            <div className={`p-3 rounded-xl border text-[10px] ${mode === 'color-change'
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                }`}>
                {mode === 'color-change' ? (
                    <p>💜 <strong>색상 변경</strong>: 원본 이미지의 상품 색상을 참조 이미지의 색상으로 변경합니다. 디자인과 형태는 유지됩니다.</p>
                ) : (
                    <p>🧡 <strong>상품 교체</strong>: 원본 이미지의 상품을 참조 이미지의 상품으로 완전히 교체합니다. 모델 포즈와 배경은 유지됩니다.</p>
                )}
            </div>

            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Image Upload */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. 원본 이미지</span>
                        <span className="text-[9px] text-slate-500">
                            {mode === 'color-change' ? '(색상을 변경할 이미지)' : '(모델/배경 기준)'}
                        </span>
                    </div>
                    <div
                        className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-700 hover:border-purple-500 transition-colors min-h-[250px] flex items-center justify-center"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, 'original')}
                        onPaste={(e) => handlePaste(e.nativeEvent as unknown as ClipboardEvent, 'original')}
                    >
                        {originalImage ? (
                            <>
                                <img src={originalImage} className="max-w-full max-h-[250px] object-contain" alt="Original" />
                                <button
                                    onClick={() => setOriginalImage(null)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <ImagePlus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                <p className="text-xs text-slate-500 mb-3">원본 상품 이미지</p>
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-purple-400 cursor-pointer transition-colors">
                                    <Upload className="w-3.5 h-3.5" />
                                    업로드
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'original')} />
                                </label>
                                <p className="text-[9px] text-slate-600 mt-2">드래그앤드롭 또는 붙여넣기</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reference Image Upload */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. 참조 상품</span>
                        <span className="text-[9px] text-slate-500">
                            {mode === 'color-change' ? '(이 색상으로 변경)' : '(이 상품으로 교체)'}
                        </span>
                    </div>
                    <div
                        className={`relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-700 transition-colors min-h-[250px] flex items-center justify-center ${mode === 'color-change' ? 'hover:border-pink-500' : 'hover:border-orange-500'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, 'reference')}
                    >
                        {referenceImage ? (
                            <>
                                <img src={referenceImage} className="max-w-full max-h-[250px] object-contain" alt="Reference" />
                                <button
                                    onClick={() => setReferenceImage(null)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                {mode === 'color-change' ? (
                                    <Palette className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                ) : (
                                    <Shirt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                )}
                                <p className="text-xs text-slate-500 mb-3">
                                    {mode === 'color-change' ? '참조 색상 이미지' : '교체할 상품 이미지'}
                                </p>
                                <label className={`inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors ${mode === 'color-change' ? 'text-pink-400' : 'text-orange-400'
                                    }`}>
                                    <Upload className="w-3.5 h-3.5" />
                                    업로드
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'reference')} />
                                </label>
                                <p className="text-[9px] text-slate-600 mt-2">드래그앤드롭 또는 붙여넣기</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Prompt Input */}
            {(originalImage || referenceImage) && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. 추가 지시사항</span>
                        <span className="text-[9px] text-slate-500">(선택사항)</span>
                    </div>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder={mode === 'color-change'
                            ? "예: 색상을 조금 더 밝게, 채도를 높게, 파스텔톤으로..."
                            : "예: 상의만 교체, 핏을 더 루즈하게, 소매 길이 유지..."
                        }
                        className="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                </div>
            )}

            {/* Action Buttons */}
            {(originalImage || referenceImage) && (
                <div className="flex gap-3">
                    <button
                        onClick={clearAll}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                        <Undo className="w-3.5 h-3.5" />
                        초기화
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!originalImage || !referenceImage || isGenerating}
                        className={`flex-1 py-3 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'color-change'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400'
                                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                AI 처리 중...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                {mode === 'color-change' ? '색상 변경 실행' : '상품 교체 실행'}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Result Section */}
            {resultImage && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">결과</span>
                        <button
                            onClick={() => {
                                const a = document.createElement('a');
                                a.href = resultImage;
                                a.download = `${mode}-result.png`;
                                a.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            다운로드
                        </button>
                    </div>
                    <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-4 flex items-center justify-center">
                        <img src={resultImage} className="max-w-full max-h-[400px] object-contain rounded-xl" alt="Result" />
                    </div>
                </div>
            )}

            {/* Helper Text */}
            {!originalImage && !referenceImage && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mt-4">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">💡 사용 방법</h4>
                    <ul className="text-[10px] text-slate-500 space-y-1">
                        <li>1. 상단에서 <span className="text-purple-400">색상 변경</span> 또는 <span className="text-orange-400">상품 교체</span> 모드를 선택하세요</li>
                        <li>2. <span className="text-purple-400">원본 이미지</span>와 <span className="text-pink-400">참조 상품</span>을 업로드하세요</li>
                        <li>3. AI가 자동으로 색상 변경 또는 상품 교체를 수행합니다</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ClothingColorChanger;
