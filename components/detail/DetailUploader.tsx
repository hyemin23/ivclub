import React from 'react';
import { ImageIcon, X } from 'lucide-react';

interface DetailUploaderProps {
    baseImage: string | null;
    baseImages?: string[]; // New Prop
    refImage: string | null;
    refImages?: string[]; // New Prop
    setBaseImage: (image: string | null) => void;
    setBaseImages?: (images: string[]) => void;
    setRefImage: (image: string | null) => void;
    setRefImages?: (images: string[]) => void; // New Prop
    handleImageUpload: (type: 'base' | 'ref', e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DetailUploader: React.FC<DetailUploaderProps> = ({
    baseImage,
    baseImages = [],
    refImage,
    refImages = [],
    setBaseImage,
    setBaseImages,
    setRefImage,
    setRefImages,
    handleImageUpload
}) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">상품 원본 사진 (필수)</label>
                <div
                    onClick={() => document.getElementById('de-base-upload')?.click()}
                    className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${baseImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                >
                    {baseImage ? (
                        <>
                            {baseImages && baseImages.length > 1 ? (
                                <div className="grid grid-cols-2 gap-1 w-full h-full p-2 bg-black/40">
                                    {baseImages.slice(0, 4).map((img, i) => (
                                        <img key={i} src={img} className="w-full h-full object-cover rounded-lg" alt={`Base ${i}`} />
                                    ))}
                                    {baseImages.length > 4 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                            <span className="text-white font-bold">+{baseImages.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <img src={baseImage} className="w-full h-full object-contain" alt="Base" />
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setBaseImage(null);
                                    if (setBaseImages) setBaseImages([]);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-10"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                            {baseImages && baseImages.length > 1 && (
                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-indigo-600 rounded text-[9px] font-bold text-white">
                                    {baseImages.length}장 선택됨
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center p-2">
                            <ImageIcon className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase">업로드 (다중 선택 가능)</span>
                        </div>
                    )}
                    <input id="de-base-upload" type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload('base', e)} />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">참고 디테일컷 (선택)</label>
                <div
                    onClick={() => document.getElementById('de-ref-upload')?.click()}
                    className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${refImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                >
                    {refImage ? (
                        <>
                            {refImages && refImages.length > 1 ? (
                                <div className="grid grid-cols-2 gap-1 w-full h-full p-2 bg-black/40">
                                    {refImages.slice(0, 4).map((img, i) => (
                                        <img key={i} src={img} className="w-full h-full object-cover rounded-lg" alt={`Ref ${i}`} />
                                    ))}
                                    {refImages.length > 4 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                            <span className="text-white font-bold">+{refImages.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <img src={refImage} className="w-full h-full object-contain" alt="Reference" />
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRefImage(null);
                                    if (setRefImages) setRefImages([]);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-10"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                            {refImages && refImages.length > 1 && (
                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-indigo-600 rounded text-[9px] font-bold text-white">
                                    {refImages.length}장 선택됨
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center p-2">
                            <ImageIcon className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase">업로드 (다중 선택 가능)</span>
                        </div>
                    )}
                    <input id="de-ref-upload" type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload('ref', e)} />
                </div>
            </div>
        </div>
    );
};
