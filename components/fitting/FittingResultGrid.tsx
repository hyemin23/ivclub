
import React, { useState } from 'react';
import { Layers, Loader2, ShieldAlert, Key, AlertCircle, RotateCcw, Eye, Download, X } from 'lucide-react';
import { VariationResult } from '../../services/fitting/fitting.types';

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
            className="relative w-full h-full overflow-hidden cursor-zoom-in"
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

interface FittingResultGridProps {
    results: VariationResult[];
    onImageSelect?: (imageUrl: string) => void;
    handleRetry: (id: string) => void;
    isLoading: boolean;
}

export const FittingResultGrid: React.FC<FittingResultGridProps> = ({
    results, onImageSelect, handleRetry, isLoading
}) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <>
            <div className={`flex-1 grid gap-4 ${results.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden relative overflow-y-auto max-h-[800px]`}>
                {results.length > 0 ? (
                    results.map((res, i) => (
                        <div key={res.id} className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500 transition-all min-h-[250px] flex items-center justify-center">
                            {res.status === 'loading' ? (
                                <div className="flex flex-col items-center gap-4 text-indigo-400 animate-pulse">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Processing...</span>
                                </div>
                            ) : res.status === 'error' ? (
                                <div className="flex flex-col items-center text-center p-4 space-y-3">
                                    <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                                        {res.errorType === 'safety' ? <ShieldAlert className="w-6 h-6" /> :
                                            res.errorType === 'auth' ? <Key className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-red-400 text-[9px] font-black uppercase tracking-widest">{res.errorType} Error</p>
                                        <p className="text-gray-500 text-[9px] leading-tight max-w-[120px]">{res.errorMessage}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRetry(res.id)}
                                        className="px-4 py-1.5 bg-white text-black rounded-full text-[9px] font-black flex items-center gap-2 hover:bg-gray-100 transition-colors"
                                    >
                                        <RotateCcw className="w-2.5 h-2.5" /> 재시도
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <ZoomImage src={res.url} onClick={() => setSelectedImage(res.url)} />
                                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <button onClick={() => setSelectedImage(res.url)} className="p-2 bg-indigo-600 rounded-lg text-white hover:scale-110 transition-transform"><Eye className="w-4 h-4" /></button>

                                        {onImageSelect && (
                                            <button
                                                onClick={() => onImageSelect(res.url)}
                                                className="p-2 bg-emerald-600 rounded-lg text-white hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20"
                                                title="캔버스에 추가"
                                            >
                                                <Layers className="w-4 h-4" />
                                            </button>
                                        )}

                                        <a href={res.url} download={`fitting_variation_${i}.png`} className="p-2 bg-slate-800 rounded-lg text-white hover:scale-110 transition-transform"><Download className="w-4 h-4" /></a>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20 h-full">
                        <Layers className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">결과물이 이곳에 표시됩니다.</p>
                        <p className="text-[10px] mt-2 italic">Main 이미지와 Pose 이미지를 선택하세요.</p>
                    </div>
                )}
            </div>

            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10" onClick={() => setSelectedImage(null)}>
                        <X className="w-6 h-6" />
                    </button>
                    <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </>
    );
};
