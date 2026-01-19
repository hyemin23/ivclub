
import React from 'react';
import { ImageIcon, X } from 'lucide-react';

interface FittingUploaderProps {
    baseImage: string | null;
    refImage: string | null;
    setBaseImage: (url: string | null) => void;
    setRefImage: (url: string | null) => void;
    handleImageUpload: (type: 'base' | 'ref', e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FittingUploader: React.FC<FittingUploaderProps> = ({
    baseImage, refImage, setBaseImage, setRefImage, handleImageUpload
}) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">상품/배경 고정 (MAIN)</label>
                <div
                    onClick={() => document.getElementById('fv-base-upload')?.click()}
                    className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${baseImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                >
                    {baseImage ? (
                        <>
                            <img src={baseImage} className="w-full h-full object-contain" />
                            <button onClick={(e) => { e.stopPropagation(); setBaseImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-3 h-3 text-white" /></button>
                        </>
                    ) : (
                        <div className="text-center p-2">
                            <ImageIcon className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase">메인 이미지 업로드</span>
                        </div>
                    )}
                    <input id="fv-base-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('base', e)} />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">포즈 레퍼런스 (POSE ONLY)</label>
                <div
                    onClick={() => document.getElementById('fv-ref-upload')?.click()}
                    className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${refImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                >
                    {refImage ? (
                        <>
                            <img src={refImage} className="w-full h-full object-contain" />
                            <button onClick={(e) => { e.stopPropagation(); setRefImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-3 h-3 text-white" /></button>
                        </>
                    ) : (
                        <div className="text-center p-2">
                            <ImageIcon className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase">포즈 참고 업로드</span>
                        </div>
                    )}
                    <input id="fv-ref-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('ref', e)} />
                </div>
            </div>
        </div>
    );
};
