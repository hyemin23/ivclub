
import React, { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';

interface AutoFitUploaderProps {
    productImage: string | null;
    bgImage: string | null;
    setProductImage: (url: string | null) => void;
    setBgImage: (url: string | null) => void;
    processFile: (type: 'product' | 'bg', file: File) => void;
    isSideProfile?: boolean;
    setIsSideProfile?: (v: boolean) => void;
}

export const AutoFitUploader: React.FC<AutoFitUploaderProps> = ({
    productImage, bgImage, setProductImage, setBgImage, processFile, isSideProfile, setIsSideProfile
}) => {
    const [isDraggingProduct, setIsDraggingProduct] = useState(false);
    const [isDraggingBg, setIsDraggingBg] = useState(false);

    const handleDrag = (type: 'product' | 'bg', e: React.DragEvent, status: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'product') setIsDraggingProduct(status);
        else setIsDraggingBg(status);
    };

    const handleDrop = (type: 'product' | 'bg', e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'product') setIsDraggingProduct(false);
        else setIsDraggingBg(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(type, file);
    };

    const handleImageUpload = (type: 'product' | 'bg', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(type, file);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">상품 이미지 (PRODUCT)</label>
                    {setIsSideProfile && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="side-profile-check"
                                checked={isSideProfile}
                                onChange={(e) => setIsSideProfile(e.target.checked)}
                                className="w-3 h-3 accent-blue-500 cursor-pointer"
                            />
                            <label htmlFor="side-profile-check" className="text-[10px] font-bold text-blue-400 cursor-pointer select-none">☑️ 옆모습 (Side Profile)</label>
                        </div>
                    )}
                </div>
                <div
                    onClick={() => document.getElementById('af-product-upload')?.click()}
                    onDragOver={(e) => handleDrag('product', e, true)}
                    onDragLeave={(e) => handleDrag('product', e, false)}
                    onDrop={(e) => handleDrop('product', e)}
                    className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${isDraggingProduct ? 'border-green-500 bg-green-500/10 scale-105' :
                        productImage ? 'border-green-500 bg-green-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                >
                    {productImage ? (
                        <>
                            <img src={productImage} className="w-full h-full object-contain" alt="Product" />
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
                    onDragOver={(e) => handleDrag('bg', e, true)}
                    onDragLeave={(e) => handleDrag('bg', e, false)}
                    onDrop={(e) => handleDrop('bg', e)}
                    className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${isDraggingBg ? 'border-green-500 bg-green-500/10 scale-105' :
                        bgImage ? 'border-green-500 bg-green-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                >
                    {bgImage ? (
                        <>
                            <img src={bgImage} className="w-full h-full object-contain" alt="Background" />
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
    );
};
