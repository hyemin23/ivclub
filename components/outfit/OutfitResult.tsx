import React, { useState } from 'react';
import { Download, Monitor, AlertCircle, Loader2, X, ZoomIn } from 'lucide-react';

interface OutfitResultProps {
    resultImage: string | null;
    baseImage: string | null;
    isLoading: boolean;
    error: string | null;
    handleDownload: () => void;
}

export const OutfitResult: React.FC<OutfitResultProps> = ({
    resultImage, baseImage, isLoading, error, handleDownload
}) => {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    return (
        <>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Monitor className="w-6 h-6 text-indigo-400" />
                        <h3 className="text-xl font-bold uppercase tracking-tight text-white">가상 피팅 결과</h3>
                    </div>
                    {resultImage && !isLoading && (
                        <button
                            onClick={handleDownload}
                            className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[9px] font-black flex items-center gap-2 uppercase tracking-widest transition-all"
                        >
                            <Download className="w-3 h-3" /> 결과 저장
                        </button>
                    )}
                </div>

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden relative flex items-center justify-center">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-indigo-400 animate-pulse">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                            <span className="text-sm font-bold uppercase tracking-widest">AI가 의상을 교체하고 있습니다...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center text-center p-8 space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                            <p className="text-red-400 font-bold">{error}</p>
                        </div>
                    ) : resultImage ? (
                        <div className="relative w-full h-full flex gap-4">
                            {/* Comparison View */}
                            <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-800">
                                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-white z-10">BEFORE</div>
                                {baseImage && <img src={baseImage} alt="Base" className="w-full h-full object-contain opacity-50 grayscale" />}
                            </div>
                            <div
                                className="flex-[1.5] relative rounded-xl overflow-hidden border border-indigo-500/50 shadow-lg shadow-indigo-500/10 group cursor-zoom-in"
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                <div className="absolute top-2 left-2 bg-indigo-600 px-2 py-1 rounded text-[10px] font-bold text-white z-10 shadow-lg flex items-center gap-1">
                                    AFTER <ZoomIn className="w-3 h-3 ml-1 opacity-70" />
                                </div>
                                <img
                                    src={resultImage}
                                    alt="Result"
                                    className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-110"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center opacity-20">
                            <Monitor className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">결과물이 이곳에 표시됩니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && resultImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={resultImage}
                        alt="Full Screen"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                    />
                </div>
            )}
        </>
    );
};
