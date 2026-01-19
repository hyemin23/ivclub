import React from 'react';
import { Download, Maximize2, Layers, X } from 'lucide-react';
import { ZoomImage } from './ZoomImage';

interface DetailResultsProps {
    resultImages: string[];
    handleDownloadAll: () => void;
    selectedImage: string | null;
    setSelectedImage: (img: string | null) => void;
}

export const DetailResults: React.FC<DetailResultsProps> = ({
    resultImages,
    handleDownloadAll,
    selectedImage,
    setSelectedImage
}) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold uppercase tracking-tight">Generated Assets</h3>
                {resultImages.length > 0 && (
                    <button
                        onClick={handleDownloadAll}
                        className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:bg-slate-900 transition-all flex items-center gap-2"
                    >
                        <Download className="w-3 h-3" />
                        Download All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {resultImages.map((img, idx) => (
                    <div
                        key={idx}
                        className="group relative aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer"
                        onClick={() => setSelectedImage(img)}
                    >
                        <ZoomImage src={img} alt={`Generated ${idx}`} onClick={() => setSelectedImage(img)} />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const link = document.createElement('a');
                                    link.href = img;
                                    link.download = `detail_${idx + 1}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-indigo-600 transition-colors"
                                title="Download"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(img);
                                }}
                                className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-indigo-600 transition-colors"
                                title="Maximize"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {resultImages.length === 0 && (
                    <div className="col-span-2 aspect-[2/1] bg-slate-950/50 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600">
                        <Layers className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">결과물이 이곳에 표시됩니다.</p>
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
        </div>
    );
};
