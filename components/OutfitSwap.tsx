"use client";

import React from 'react';
import { Shirt } from 'lucide-react';
import { useOutfitSwap } from '../hooks/useOutfitSwap';
import { OutfitUploader } from './outfit/OutfitUploader';
import { OutfitControls } from './outfit/OutfitControls';
import { OutfitResult } from './outfit/OutfitResult';

const OutfitSwap: React.FC = () => {
    const {
        baseImage, setBaseImage,
        refImage, setRefImage,
        maskImage, setMaskImage,
        ratio, setRatio, // Added Ratio
        quality, setQuality, // Added Quality
        maskArea, setMaskArea,
        resultImage,
        isLoading,
        error,
        handleImageUpload,
        handleGenerate,
        handleDownload
    } = useOutfitSwap();

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Shirt className="w-6 h-6 text-indigo-400" />
                        <h3 className="text-xl font-bold uppercase tracking-tight text-white">🎨 부분 교체 / 매직 페인트 (MAGIC PAINT) <span className="text-[10px] bg-indigo-600 px-2 py-1 rounded ml-2">PRO MODE</span></h3>
                    </div>

                    <div className="space-y-8">
                        <OutfitUploader
                            baseImage={baseImage}
                            refImage={refImage}
                            setBaseImage={setBaseImage}
                            setRefImage={setRefImage}
                            setMaskImage={setMaskImage}
                            handleImageUpload={handleImageUpload}
                        />

                        <OutfitControls
                            handleGenerate={handleGenerate}
                            isLoading={isLoading}
                            disabled={isLoading || !baseImage || !refImage || !maskImage}
                            ratio={ratio}
                            setRatio={setRatio}
                            quality={quality}
                            setQuality={setQuality}
                        />
                    </div>
                </div>
            </div>

            <OutfitResult
                resultImage={resultImage}
                baseImage={baseImage}
                isLoading={isLoading}
                error={error}
                handleDownload={handleDownload}
            />
        </div>
    );
};

export default OutfitSwap;
