import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Download, ImageIcon, RefreshCw, X, Eye, Layers, Upload, BoxSelect, Maximize2, CornerUpLeft, CornerUpRight, MoveLeft, MoveRight, ArrowDown, RotateCcw, SplitSquareHorizontal, ZoomIn, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateAutoFitting, parseGeminiError, GeminiErrorType } from '../services/geminiService';
import { resizeImage } from '../utils/imageProcessor';
import { Resolution, AspectRatio, CameraAngle, VariationResult } from '../types';
import { useStore } from '../store';
import CustomSelect from './CustomSelect';
import { ImageModal } from './ImageModal';
import { ConfirmModal } from './ConfirmModal';



const ZoomImage = ({ src, onClick, alt }: { src: string, onClick?: () => void, alt?: string }) => {
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y });
    };

    return (
        <div
            className="relative w-full h-full overflow-hidden cursor-zoom-in group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-contain transition-transform duration-300 ease-out"
                style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: isHovered ? 'scale(2.2)' : 'scale(1)'
                }}
            />
        </div>
    );
};

const ResultCard = ({
    res,
    index,
    originalImage,
    onSelect,
    getAngleLabel
}: {
    res: VariationResult,
    index: number,
    originalImage: string | null,
    onSelect: (url: string) => void,
    getAngleLabel: (angle: CameraAngle) => string
}) => {
    
    if (res.status === 'loading') {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] animate-pulse">
                <RefreshCw className="w-8 h-8 text-green-500 animate-spin mb-4" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{getAngleLabel(res.angle)} 생성 중...</p>
            </div>
        );
    }

    if (res.status === 'error') {
        return (
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
                <X className="w-8 h-8 text-red-500 mb-4" />
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">생성 실패</p>
            </div>
        );
    }

    // Success State - Side by Side Comparison
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl transition-all hover:border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <div>
                     <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-0.5">COMPLETED</p>
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">피팅컷 #{index + 1} - {getAngleLabel(res.angle)}</h4>
                </div>
                 <div className="text-[9px] text-gray-500 font-mono">
                    {new Date().toLocaleTimeString()}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Original Image */}
                <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">ORIGINAL</p>
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-white/5 relative group cursor-zoom-in" onClick={() => originalImage && onSelect(originalImage)}>
                        {originalImage && <img src={originalImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Original" />}
                    </div>
                </div>

                {/* Generated Image */}
                <div className="space-y-1.5">
                     <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest ml-1">GENERATED</p>
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-green-500/20 relative group cursor-zoom-in shadow-lg shadow-green-900/10" onClick={() => onSelect(res.url)}>
                        <img src={res.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Generated" />
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-green-500 text-black text-[8px] font-black uppercase rounded tracking-wider">New</div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-bold text-white border border-white/10">
                            {getAngleLabel(res.angle)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <a 
                    href={res.url} 
                    download={`auto_fit_${res.angle}_${index}.png`}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Download className="w-3 h-3" />
                    저장
                </a>
                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(res.url);
                        toast.success('이미지 주소가 복사되었습니다.');
                    }}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/5"
                >
                    <Share2 className="w-3 h-3" />
                    공유
                </button>
            </div>
        </div>
    );
};

const AutoFitting: React.FC = () => {
    const { autoFitting, setAutoFittingState, updateAutoFittingResult } = useStore();
    const { productImage, bgImage, results, resolution, aspectRatio } = autoFitting;

    // Local UI state (drag, loading) - No need to persist
    const [isLoading, setIsLoading] = useState(false);
    const [isDraggingProduct, setIsDraggingProduct] = useState(false);
    const [isDraggingBg, setIsDraggingBg] = useState(false);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const handleStopClick = useCallback(() => {
        if (!isLoading) return;
        setShowStopConfirm(true);
    }, [isLoading]);

    const confirmStop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            toast.info("작업이 사용자에 의해 중지되었습니다.");
            setIsLoading(false);
        }
        setShowStopConfirm(false);
    }, []);

    // Helper setters to match previous API
    const setProductImage = (url: string | null) => setAutoFittingState({ productImage: url });
    const setBgImage = (url: string | null) => setAutoFittingState({ bgImage: url });
    const setResults = (newResults: VariationResult[] | ((prev: VariationResult[]) => VariationResult[])) => {
        if (typeof newResults === 'function') {
            setAutoFittingState({ results: newResults(results) });
        } else {
            setAutoFittingState({ results: newResults });
        }
    };
    const setResolution = (res: Resolution) => setAutoFittingState({ resolution: res });
    const setAspectRatio = (ratio: AspectRatio) => setAutoFittingState({ aspectRatio: ratio });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const processFile = (type: 'product' | 'bg', file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            toast.error("10MB 이하의 이미지를 사용해주세요.");
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast.error("이미지 파일만 업로드 가능합니다.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'product') {
                setProductImage(reader.result as string);
                toast.success('상품 이미지가 로드되었습니다.');
            } else {
                setBgImage(reader.result as string);
                toast.success('배경 이미지가 로드되었습니다.');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleImageUpload = (type: 'product' | 'bg', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(type, file);
            e.target.value = '';
        }
    };

    const handleDragOver = (type: 'product' | 'bg', e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'product') setIsDraggingProduct(true);
        else setIsDraggingBg(true);
    };

    const handleDragLeave = (type: 'product' | 'bg', e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'product') setIsDraggingProduct(false);
        else setIsDraggingBg(false);
    };

    const handleDrop = (type: 'product' | 'bg', e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'product') setIsDraggingProduct(false);
        else setIsDraggingBg(false);

        const file = e.dataTransfer.files?.[0];
        if (file) processFile(type, file);
    };

    const generateSingleAngle = async (id: string, angle: CameraAngle, productImg: string, bgImg: string | null, userPrompt: string, signal?: AbortSignal) => {
        try {
            if (signal?.aborted) return;
            const url = await generateAutoFitting(productImg, bgImg, userPrompt, angle, aspectRatio, resolution, signal);
            if (!signal?.aborted) {
               updateAutoFittingResult(id, { url, status: 'success' });
            }
        } catch (error: any) {
            if (signal?.aborted || error.message === "작업이 취소되었습니다.") return;
            
            const parsed = parseGeminiError(error);
            updateAutoFittingResult(id, {
                status: 'error',
                errorType: parsed.type,
                errorMessage: parsed.message
            });
            toast.error(`생성 실패 (${angle}): ${parsed.message}`);
        }
    };

    const getConcurrencySettings = () => {
        const hour = new Date().getHours();
        const isCongested = hour >= 23 || hour < 9;
        return {
            limit: isCongested ? 1 : 3,
            label: isCongested ? '🐢 혼잡 시간대 (안전 모드)' : '⚡️ 쾌적 시간대 (부스트 모드)',
            color: isCongested ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        };
    };

    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [prompt, setPrompt] = useState('');
    const [selectedAngles, setSelectedAngles] = useState<CameraAngle[]>(['front', 'left-30', 'right-30', 'left-side', 'right-side']);

    const handleGenerate = async (isTestMode: boolean = false) => {
        if (!productImage) return; // Only product image is strictly required now
        setIsLoading(true);
        setProgress(0);
        setProgressText('작업 준비 중...');

        const settings = getConcurrencySettings();
        console.log(`[AutoFitting] Mode: ${settings.label}, Limit: ${settings.limit}`);

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const allAngles: { angle: CameraAngle, label: string }[] = selectedAngles.map(angle => ({ angle, label: angle }));
        
        // If Test Mode, use the first selected angle, or default to front if none selected (though button is disabled if 0)
        const targetAngles = isTestMode ? (allAngles.length > 0 ? [allAngles[0]] : [{ angle: 'front', label: 'front' }]) : allAngles;

        const newResults: VariationResult[] = targetAngles.map((target, i) => ({
            id: `${Date.now()}-${i}`,
            url: '',
            angle: target.angle,
            status: 'loading'
        }));

        setResults(newResults);

        const targetSize = resolution === '1K' ? 1024 : 2048;

        try {
            setProgressText('이미지 최적화 중...');
            const [optimizedProduct, optimizedBg] = await Promise.all([
                resizeImage(productImage, targetSize),
                bgImage ? resizeImage(bgImage, targetSize) : Promise.resolve(null)
            ]);

            if (signal.aborted) return;

            const CONCURRENCY_LIMIT = settings.limit;
            const queue = [...newResults];
            let completed = 0;
            const total = newResults.length;

            const processItem = async (item: VariationResult) => {
                if (signal.aborted) return;
                await generateSingleAngle(item.id, item.angle, optimizedProduct, optimizedBg, prompt, signal);
            };

            const executePool = async () => {
                const executing: Promise<void>[] = [];
                for (const item of newResults) {
                    if (signal.aborted) break;
                    
                    setProgressText(`자동 피팅 생성 중... (${completed + 1}/${total})`);
                    const p = processItem(item).finally(() => {
                        if (!signal.aborted) {
                            completed++;
                            const percent = Math.round((completed / total) * 100);
                            setProgress(percent);
                            setProgressText(`생성 진행 중... ${percent}%`);
                        }
                    });
                    
                    const e = p.then(() => {
                        executing.splice(executing.indexOf(e), 1);
                    });
                    executing.push(e);

                    if (executing.length >= CONCURRENCY_LIMIT) {
                        try {
                             await Promise.race(executing);
                        } catch (e) { /* ignore race errors if cancelled */ }
                    }
                }
                await Promise.all(executing);
            };

            await executePool();
        } catch (err) {
            console.error(err);
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
                setProgress(0);
                setProgressText('');
                abortControllerRef.current = null;
            }
        }
    };

    const handleDownloadAll = async () => {
        const successResults = results.filter(r => r.status === 'success');
        for (let i = 0; i < successResults.length; i++) {
            const link = document.createElement('a');
            link.href = successResults[i].url;
            link.download = `auto_fit_${successResults[i].angle}_${i}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    };

    const getAngleLabel = (angle: CameraAngle) => {
        const map: Record<string, string> = {
            'front': '정면 (Front)',
            'left-30': '좌측 30°',
            'right-30': '우측 30°',
            'left-side': '완전 좌측면',
            'right-side': '완전 우측면'
        };
        return map[angle] || angle;
    };

    const currentStatus = getConcurrencySettings();

    return (
        <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <BoxSelect className="w-6 h-6 text-green-400" />
                            <h3 className="text-xl font-bold uppercase tracking-tight text-white">자동 피팅 (Auto Fitting)</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full border ${currentStatus.color} flex items-center gap-2`}>
                            <span className="text-[9px] font-bold uppercase tracking-widest">{currentStatus.label}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">상품 이미지 (PRODUCT)</label>
                            <div
                                onClick={() => document.getElementById('af-product-upload')?.click()}
                                onDragOver={(e) => handleDragOver('product', e)}
                                onDragLeave={(e) => handleDragLeave('product', e)}
                                onDrop={(e) => handleDrop('product', e)}
                                className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${isDraggingProduct ? 'border-green-500 bg-green-500/10 scale-105' :
                                    productImage ? 'border-green-500 bg-green-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                                    }`}
                            >
                                {productImage ? (
                                    <>
                                        <img src={productImage} className="w-full h-full object-contain" />
                                        <button onClick={(e) => { e.stopPropagation(); setProductImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-3 h-3 text-white" /></button>
                                    </>
                                ) : (
                                    <div className="text-center p-2">
                                        <ImageIcon className={`w-6 h-6 text-slate-700 mx-auto mb-2 ${isDraggingProduct ? 'animate-bounce text-green-500' : ''}`} />
                                        <span className={`text-[9px] font-bold uppercase ${isDraggingProduct ? 'text-green-500' : 'text-slate-500'}`}>
                                            {isDraggingProduct ? '여기에 놓아주세요' : '상품 업로드'}
                                        </span>
                                    </div>
                                )}
                                <input id="af-product-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('product', e)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">배경 이미지 (BACKGROUND)</label>
                            <div
                                onClick={() => document.getElementById('af-bg-upload')?.click()}
                                onDragOver={(e) => handleDragOver('bg', e)}
                                onDragLeave={(e) => handleDragLeave('bg', e)}
                                onDrop={(e) => handleDrop('bg', e)}
                                className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${isDraggingBg ? 'border-green-500 bg-green-500/10 scale-105' :
                                    bgImage ? 'border-green-500 bg-green-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                                    }`}
                            >
                                {bgImage ? (
                                    <>
                                        <img src={bgImage} className="w-full h-full object-contain" />
                                        <button onClick={(e) => { e.stopPropagation(); setBgImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-3 h-3 text-white" /></button>
                                    </>
                                ) : (
                                    <div className="text-center p-2">
                                        <ImageIcon className={`w-6 h-6 text-slate-700 mx-auto mb-2 ${isDraggingBg ? 'animate-bounce text-green-500' : ''}`} />
                                        <span className={`text-[9px] font-bold uppercase ${isDraggingBg ? 'text-green-500' : 'text-slate-500'}`}>
                                            {isDraggingBg ? '여기에 놓아주세요' : '배경 업로드'}
                                        </span>
                                    </div>
                                )}
                                <input id="af-bg-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('bg', e)} />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">생성할 앵글 선택 ({selectedAngles.length})</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedAngles(['front', 'left-30', 'right-30', 'left-side', 'right-side'])}
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
                            {[
                                { angle: 'front' as const, icon: null, label: "정면" },
                                { angle: 'left-30' as const, icon: null, label: "좌측 30°" },
                                { angle: 'right-30' as const, icon: null, label: "우측 30°" },
                                { angle: 'left-side' as const, icon: null, label: "좌측면" },
                                { angle: 'right-side' as const, icon: null, label: "우측면" },
                            ].map((item) => {
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
                                        className={`rounded-lg p-2 border transition-all flex flex-col items-center justify-center gap-1 ${
                                            isSelected 
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
                                    { value: '4:3', label: '4:3' }
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
                </div>

                <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 flex flex-col min-h-[700px] relative">
            
            {isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                 <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                 <span className="text-xs font-bold text-gray-200">{progressText}</span>
            </div>
            )}

            <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <Layers className="w-6 h-6 text-green-400" />
                            <h3 className="text-xl font-bold uppercase tracking-tight text-white">Fitting Results</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            {results.some(r => r.status === 'success') && !isLoading && (
                                <button
                                    onClick={handleDownloadAll}
                                    className="px-3 py-1.5 bg-green-600/10 border border-green-500/20 text-green-400 rounded-lg text-[9px] font-black flex items-center gap-2 uppercase tracking-widest transition-all hover:bg-green-600/20"
                                >
                                    <Download className="w-3 h-3" /> 전체 다운로드
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 grid gap-4 grid-cols-1 xl:grid-cols-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden relative overflow-y-auto max-h-[800px]">
                        {results.length > 0 ? (
                            results.map((res, i) => (
                                <ResultCard
                                    key={res.id}
                                    res={res}
                                    index={i}
                                    originalImage={productImage}
                                    onSelect={setSelectedImage}
                                    getAngleLabel={getAngleLabel}
                                />
                            ))
                        ) : (
                            <div className="col-span-2 flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20 h-full">
                                <Layers className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">결과물이 이곳에 생성됩니다.</p>
                                <p className="text-[10px] mt-2 italic">상품과 배경을 업로드하고 실행하세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
            
            <ConfirmModal 
                isOpen={showStopConfirm}
                onClose={() => setShowStopConfirm(false)}
                onConfirm={confirmStop}
                title="작업을 중지하시겠습니까?"
                message="현재 진행 중인 작업이 중단되며, 이미 차감된 비용은 환불되지 않습니다."
                confirmText="네, 중지합니다"
                cancelText="계속 진행"
                isDestructive={true}
            />
        </div>
    );
};

export default AutoFitting;
