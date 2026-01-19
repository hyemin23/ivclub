
import React from 'react';
import { ImageIcon, X } from 'lucide-react';
import { MaskCanvas } from '@/components/ui/MaskCanvas';

interface OutfitUploaderProps {
    baseImage: string | null;
    refImage: string | null;
    setBaseImage: (url: string | null) => void;
    setRefImage: (url: string | null) => void;
    setMaskImage: (url: string | null) => void; // Added for Magic Paint
    handleImageUpload: (type: 'base' | 'ref', e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const OutfitUploader: React.FC<OutfitUploaderProps> = ({
    baseImage, refImage, setBaseImage, setRefImage, setMaskImage, handleImageUpload
}) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">모델 원본 (색칠하여 영역지정)</label>
                <div
                    className={`relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center ${baseImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                >
                    {baseImage ? (
                        <>
                            <MaskCanvas
                                imageSrc={baseImage}
                                onMaskChange={setMaskImage}
                                className="w-full h-full"
                            />
                            <button onClick={(e) => { e.stopPropagation(); setBaseImage(null); setMaskImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-20"><X className="w-3 h-3 text-white" /></button>
                        </>
                    ) : (
                        <div
                            onClick={() => document.getElementById('outfit-base-upload')?.click()}
                            className="text-center p-2 w-full h-full flex flex-col items-center justify-center cursor-pointer"
                        >
                            <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase">모델 사진 업로드</span>
                        </div>
                    )}
                    <input id="outfit-base-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('base', e)} />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">교체할 의류 (REFERENCE)</label>
                <div
                    onClick={() => document.getElementById('outfit-ref-upload')?.click()}
                    className={`relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${refImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                >
                    {refImage ? (
                        <>
                            <img src={refImage} className="w-full h-full object-contain" />
                            <button onClick={(e) => { e.stopPropagation(); setRefImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-3 h-3 text-white" /></button>
                        </>
                    ) : (
                        <div className="text-center p-2">
                            <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase">의류 사진 업로드</span>
                        </div>
                    )}
                    <input id="outfit-ref-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('ref', e)} />
                </div>
            </div>
        </div>
    );
};
