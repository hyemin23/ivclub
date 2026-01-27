"use client";

import React, { useState } from 'react';
import { VsComparisonItem } from '@/types';
import { Check, X, Sparkles, AlertTriangle, Play } from 'lucide-react';

interface VsBlockProps {
    comparisons: VsComparisonItem[];
    onComparisonsChange?: (comparisons: VsComparisonItem[]) => void;
    isEditable?: boolean;
    isExporting?: boolean;
    variant?: 'default' | 'natural';
}

const VsBlock: React.FC<VsBlockProps> = ({
    comparisons,
    onComparisonsChange,
    isEditable = false,
    isExporting = false,
    variant = 'natural' // Force new default
}) => {
    // Mock images for demonstration (Good vs Bad)
    const badImage = "https://images.unsplash.com/photo-1517260739337-6799d2eb9ce0?w=500&q=80&grayscale=true"; // Grayscale, blurry
    const goodImage = "https://images.unsplash.com/photo-1550920405-b016d97c7b8e?w=500&q=80"; // Vibrant, clear

    const handleTextChange = (index: number, field: keyof VsComparisonItem, value: string) => {
        if (!onComparisonsChange) return;
        const updated = comparisons.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        onComparisonsChange(updated);
    };

    return (
        <div className="w-full">
            {/* Header (Optional) */}
            {isEditable && !isExporting && (
                <div className="mb-4">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Natural Comparison</span>
                </div>
            )}

            {/* Visual Contrast Container */}
            <div className="grid grid-cols-2 gap-4">
                {/* BAD Side */}
                <div className="relative aspect-[4/5] bg-gray-200 rounded-2xl overflow-hidden group border border-gray-300">
                    <div className="absolute inset-0 bg-cover bg-center grayscale blur-[1px] opacity-70"
                        style={{ backgroundImage: `url(${badImage})` }}
                    />
                    <div className="absolute inset-0 bg-black/10" />

                    {/* Badge */}
                    <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <X className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] font-bold text-white uppercase">Others</span>
                    </div>

                    {/* Content List */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900/90 to-transparent">
                        <div className="space-y-3">
                            {comparisons.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-red-200">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
                                    {isEditable ? (
                                        <input
                                            value={item.others_item}
                                            onChange={(e) => handleTextChange(i, 'others_item', e.target.value)}
                                            className="bg-transparent text-sm w-full focus:outline-none border-b border-white/20 pb-1"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium leading-tight">{item.others_item.replace('(X)', '')}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* GOOD Side */}
                <div className="relative aspect-[4/5] bg-indigo-900 rounded-2xl overflow-hidden group shadow-2xl shadow-indigo-500/20 border border-indigo-500/30">
                    <div className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${goodImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-transparent to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-indigo-500 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-indigo-500/50 animate-pulse">
                        <Check className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white uppercase">Nano Banana</span>
                    </div>

                    {/* Play Icon (Effect) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                        <Play className="w-6 h-6 text-white fill-white ml-1 opacity-90" />
                    </div>

                    {/* Content List */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="space-y-4">
                            {comparisons.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 shadow-lg shadow-green-500/30">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        {isEditable ? (
                                            <input
                                                value={item.us_item}
                                                onChange={(e) => handleTextChange(i, 'us_item', e.target.value)}
                                                className="bg-transparent text-white text-lg font-bold w-full focus:outline-none border-b border-indigo-400 pb-1"
                                            />
                                        ) : (
                                            <p className="text-white text-lg font-bold leading-tight drop-shadow-md">
                                                {item.us_item.replace('(O)', '')}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-indigo-200 mt-1 uppercase font-bold tracking-wider">{item.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VsBlock;
