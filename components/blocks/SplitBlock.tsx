"use client";

import React, { useState } from 'react';
import { Columns, Image as ImageIcon, Plus } from 'lucide-react';

interface SplitBlockProps {
    imageLeft?: string;
    imageRight?: string;
    labelLeft?: string;
    labelRight?: string;
    isEditable?: boolean;
    isExporting?: boolean;
    onUpdate?: (updates: any) => void;
}

const SplitBlock: React.FC<SplitBlockProps> = ({
    imageLeft,
    imageRight,
    labelLeft = "BLACK",
    labelRight = "GRAY",
    isEditable = false,
    isExporting = false,
    onUpdate
}) => {
    // For demo, if images are missing, show placeholders
    // In real app, we would have an upload handler

    return (
        <div className="w-full grid grid-cols-2 gap-[1px] bg-white">
            {/* Left Column */}
            <div className="relative aspect-[3/4] bg-gray-100 group overflow-hidden">
                {imageLeft ? (
                    <img src={imageLeft} alt="Left" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8" />
                    </div>
                )}

                {/* Label Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center">
                    {isEditable ? (
                        <input
                            value={labelLeft}
                            onChange={(e) => onUpdate && onUpdate({ labelLeft: e.target.value })}
                            className="bg-transparent text-white font-black text-xl text-center uppercase focus:outline-none drop-shadow-lg"
                        />
                    ) : (
                        <span className="text-white font-black text-xl uppercase tracking-widest drop-shadow-lg">{labelLeft}</span>
                    )}
                    <div className="w-8 h-0.5 bg-white mt-2" />
                </div>
            </div>

            {/* Right Column */}
            <div className="relative aspect-[3/4] bg-gray-100 group overflow-hidden">
                {imageRight ? (
                    <img src={imageRight} alt="Right" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {isEditable && (
                            <button className="flex flex-col items-center gap-2 hover:text-indigo-500 transition-colors">
                                <Plus className="w-8 h-8" />
                                <span className="text-xs font-bold">이미지 추가</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Label Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center">
                    {isEditable ? (
                        <input
                            value={labelRight}
                            onChange={(e) => onUpdate && onUpdate({ labelRight: e.target.value })}
                            className="bg-transparent text-white font-black text-xl text-center uppercase focus:outline-none drop-shadow-lg"
                        />
                    ) : (
                        <span className="text-white font-black text-xl uppercase tracking-widest drop-shadow-lg">{labelRight}</span>
                    )}
                    <div className="w-8 h-0.5 bg-white mt-2" />
                </div>
            </div>
        </div>
    );
};

export default SplitBlock;
