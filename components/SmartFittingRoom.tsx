import React, { useState, useRef } from 'react';
import { Upload, X, ArrowRight, Sparkles, Shirt, User, Loader2, Layers, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { generateVirtualTryOn } from '../services/geminiService'; // We will create this next
import CustomSelect from './CustomSelect';

const SmartFittingRoom: React.FC = () => {
    const { addLookbookImage } = useStore();

    // State
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [targetImage, setTargetImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [category, setCategory] = useState<'top' | 'bottom' | 'outer'>('top');

    // Drag & Drop State
    const [isDraggingSource, setIsDraggingSource] = useState(false);
    const [isDraggingTarget, setIsDraggingTarget] = useState(false);

    // Helpers
    const handleFile = (file: File, type: 'source' | 'target') => {
        if (!file.type.startsWith('image/')) {
            toast.error('이미지 파일만 가능합니다.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            if (type === 'source') setSourceImage(e.target?.result as string);
            else setTargetImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent, type: 'source' | 'target') => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'source') setIsDraggingSource(false);
        else setIsDraggingTarget(false);

        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file, type);
    };

    const handleGenerate = async () => {
        if (!sourceImage || !targetImage) {
            toast.error('모델 원본과 상품 이미지를 모두 업로드해주세요.');
            return;
        }

        setIsGenerating(true);
        try {
            // Updated service call to match usage
            const resultUrl = await generateVirtualTryOn(sourceImage, targetImage, category);
            setResultImage(resultUrl);
            toast.success('피팅 이미지가 생성되었습니다!');

            // Auto-save to gallery
            addLookbookImage({
                id: Date.now().toString(),
                url: resultUrl,
                prompt: `Virtual Try-On: ${category}`,
                ratio: '1:1', // Default
                createdAt: Date.now()
            });

        } catch (error) {
            console.error(error);
            toast.error('생성에 실패했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full min-h-[600px] bg-slate-50 rounded-3xl p-8 flex flex-col gap-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Shirt className="w-6 h-6 text-indigo-600" />
                        AI Smart Fitting Room
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1 ml-8">
                        모델의 옷을 자연스럽게 갈아입히세요. (Beta)
                    </p>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Input Section */}
                <div className="space-y-6">
                    {/* Source Image (Model) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-3 h-3" /> Source Model
                        </label>
                        <div
                            className={`aspect-[3/4] rounded-2xl border-2 border-dashed bg-white transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer relative group
                                ${isDraggingSource ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingSource(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDraggingSource(false); }}
                            onDrop={(e) => handleDrop(e, 'source')}
                            onClick={() => document.getElementById('source-upload')?.click()}
                        >
                            {sourceImage ? (
                                <>
                                    <img src={sourceImage} className="w-full h-full object-cover" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSourceImage(null); }}
                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <span className="text-xs font-bold text-slate-400">모델 사진 업로드</span>
                                </div>
                            )}
                            <input id="source-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'source')} />
                        </div>
                    </div>

                    {/* Target Image (Product) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Shirt className="w-3 h-3" /> Target Product
                        </label>
                        <div
                            className={`aspect-square rounded-2xl border-2 border-dashed bg-white transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer relative group
                                ${isDraggingTarget ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingTarget(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDraggingTarget(false); }}
                            onDrop={(e) => handleDrop(e, 'target')}
                            onClick={() => document.getElementById('target-upload')?.click()}
                        >
                            {targetImage ? (
                                <>
                                    <img src={targetImage} className="w-full h-full object-contain p-2" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setTargetImage(null); }}
                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <span className="text-xs font-bold text-slate-400">새 옷 사진 업로드</span>
                                </div>
                            )}
                            <input id="target-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'target')} />
                        </div>
                    </div>
                </div>

                {/* 2. Controls Section (Middle) */}
                <div className="flex flex-col justify-center space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                            <div className="flex p-1 bg-slate-100 rounded-xl">
                                {['top', 'bottom', 'outer'].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setCategory(c as any)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all
                                            ${category === c ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="text-center">
                            <ArrowRight className="w-6 h-6 text-slate-300 mx-auto rotate-90 lg:rotate-0" />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !sourceImage || !targetImage}
                            className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg
                                ${isGenerating || !sourceImage || !targetImage
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-200 hover:scale-[1.02]'}`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Start Fitting
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                            * 약 15~30초가 소요됩니다.<br />
                            * 원본 모델의 포즈와 배경은 유지됩니다.
                        </p>
                    </div>
                </div>

                {/* 3. Result Section */}
                <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 overflow-hidden relative">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 uppercase">Fit Result</h3>
                        {resultImage && (
                            <button className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                                <Layers className="w-3 h-3" /> Compare
                            </button>
                        )}
                    </div>

                    <div className="flex-1 bg-slate-50 relative flex items-center justify-center">
                        {resultImage ? (
                            <img src={resultImage} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-8 opacity-30">
                                <Shirt className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                <p className="text-xs font-bold text-slate-400">결과물이 여기에 표시됩니다</p>
                            </div>
                        )}
                    </div>

                    {resultImage && (
                        <div className="p-4 border-t border-slate-50 flex gap-2">
                            <a
                                href={resultImage}
                                download={`fitting_${Date.now()}.png`}
                                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                            >
                                <Download className="w-3 h-3" /> Save Image
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartFittingRoom;
