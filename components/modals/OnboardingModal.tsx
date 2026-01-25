import React, { useState, useRef } from 'react';
import { Sparkles, FileUp, X, Plus, Loader2, Zap, MapPin, Scale, Info, Layers } from 'lucide-react';
import { analyzeProductVision, getDefaultVisionAnalysis } from '@/services/geminiService';
import { VisionAnalysisResult } from '@/types';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (images: File[], analysisResult: VisionAnalysisResult) => void;
}

/**
 * AI 원클릭 생성 모달 (Onboarding)
 * 에디터 진입 전 사용자가 이미지를 업로드하고 AI 분석을 시작합니다.
 */
const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onComplete }) => {
    const [images, setImages] = useState<File[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 10) {
            setError('최대 10장까지 업로드 가능합니다.');
            return;
        }
        setImages(prev => [...prev, ...files]);
        setError(null);
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        if (images.length === 0) {
            setError('상품 사진을 1장 이상 업로드해주세요.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            // 첫 번째 이미지로 Vision AI 분석
            const reader = new FileReader();
            const imageBase64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(images[0]);
            });

            const result = await analyzeProductVision(imageBase64, "New Product");
            onComplete(images, result);
        } catch (err: any) {
            console.error('Vision AI 분석 실패:', err);
            // 실패 시 기본값 사용
            const defaultResult = getDefaultVisionAnalysis();
            onComplete(images, defaultResult);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* 헤더 */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-indigo-500/10 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl 
              flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">AI 원클릭 생성</h2>
                            <p className="text-gray-400 text-sm mt-1">상품 사진을 올리면 AI가 자동으로 상세페이지를 구성합니다</p>
                        </div>
                    </div>
                </div>

                {/* 본문 */}
                <div className="p-8">
                    {/* 업로드 영역 */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
              transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5
              ${images.length > 0 ? 'border-white/20 bg-white/[0.02]' : 'border-white/10'}
            `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {images.length === 0 ? (
                            <div>
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FileUp className="w-8 h-8 text-gray-500" />
                                </div>
                                <p className="text-white font-bold mb-1">상품 사진을 업로드하세요</p>
                                <p className="text-gray-500 text-sm">1~10장 (드래그 또는 클릭)</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-3">
                                {images.map((file, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Upload ${index}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveImage(index);
                                            }}
                                            className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full 
                        flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-indigo-500 
                        rounded text-[8px] font-bold text-white">
                                                대표
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {images.length < 10 && (
                                    <div className="aspect-square rounded-xl border border-dashed border-white/10 
                    flex items-center justify-center hover:bg-white/5 transition-colors">
                                        <Plus className="w-6 h-6 text-gray-600" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                        <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
                    )}

                    {/* AI 분석 설명 */}
                    <div className="mt-6 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">AI가 자동 생성하는 항목</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: MapPin, label: 'Smart Pin (포인트 핀)' },
                                { icon: Scale, label: 'VS 비교표' },
                                { icon: Info, label: '제품 분석 정보' },
                                { icon: Layers, label: '상세페이지 블록' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-gray-400 text-xs">
                                    <item.icon className="w-4 h-4 text-indigo-400" />
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        건너뛰기
                    </button>
                    <button
                        onClick={handleAnalyze}
                        disabled={images.length === 0 || isAnalyzing}
                        className={`
              flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all
              ${images.length > 0 && !isAnalyzing
                                ? 'bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/20'
                                : 'bg-white/10 text-gray-500 cursor-not-allowed'
                            }
            `}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                AI 분석 중...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                AI 생성 시작
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
