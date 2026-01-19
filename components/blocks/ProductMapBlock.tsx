"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Image as ImageIcon, Crosshair, Wand2, Loader2 } from 'lucide-react';
import { SmartPin } from '@/types';

interface ProductMapBlockProps {
    imageUrl?: string;
    pins?: SmartPin[];
    lines?: { x: number, y: number, label: string }[];
    isEditable?: boolean;
    isExporting?: boolean;
    onUpdate?: (updates: any) => void;
}

const ProductMapBlock: React.FC<ProductMapBlockProps> = ({
    imageUrl,
    pins = [],
    isEditable = false,
    isExporting = false,
    onUpdate
}) => {
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [bgRemoved, setBgRemoved] = useState(false);

    // Mock "Remove BG" effect
    const handleRemoveBg = () => {
        setIsRemovingBg(true);
        setTimeout(() => {
            setIsRemovingBg(false);
            setBgRemoved(true);
        }, 2000);
    };

    // Derived lines from pins or props
    const mapPins = pins.length > 0 ? pins : [
        { id: '1', location: { x: 30, y: 30 }, title: 'Tech Point 1', description: '' },
        { id: '2', location: { x: 70, y: 60 }, title: 'Tech Point 2', description: '' }
    ];

    if (!imageUrl && !isExporting) {
        return (
            <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center border border-dashed border-gray-300 text-gray-400">
                <div className="text-center">
                    <Crosshair className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">이미지를 업로드하세요</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full relative py-20 px-10 bg-gray-50 rounded-xl overflow-hidden group">
            {/* Background Grid Decoration */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            {/* Remove BG Control */}
            {isEditable && !isExporting && !bgRemoved && (
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={handleRemoveBg}
                        disabled={isRemovingBg}
                        className="px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50"
                    >
                        {isRemovingBg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3 text-indigo-500" />}
                        {isRemovingBg ? '배경 제거 중...' : '배경 제거 (Simulate)'}
                    </button>
                </div>
            )}

            {/* Central Product Image */}
            <div className="relative z-10 flex justify-center items-center h-[500px]">
                {/* Image Container - In real app, this would be the BG removed PNG */}
                <div className={`relative h-full transition-all duration-500 ${bgRemoved ? 'drop-shadow-2xl scale-105' : ''}`}>
                    <img
                        src={imageUrl}
                        alt="Tech Detail"
                        className={`h-full object-contain ${bgRemoved ? 'mix-blend-normal' : 'mix-blend-normal'}`} // Mix blend doesn't fake bg remove well on complex images, simple scale is safely used here
                        style={bgRemoved ? { filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))' } : {}}
                    />
                </div>
            </div>

            {/* Pointer Lines & Labels */}
            {bgRemoved && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {mapPins.map((pin, i) => {
                        const isLeft = pin.location.x < 50;
                        // Calculate SVG line path
                        // Center of the image area is roughly 50% 50% of parent? No, we need precise mapping.
                        // For this mockup, we map pin% to absolute positions.

                        return (
                            <div key={i} className="absolute w-full h-full inset-0">
                                {/* SVG Line */}
                                <svg className="absolute inset-0 w-full h-full overflow-visible">
                                    <line
                                        x1={`${pin.location.x}%`}
                                        y1={`${pin.location.y}%`}
                                        x2={isLeft ? '10%' : '90%'}
                                        y2={`${pin.location.y}%`}
                                        stroke="black"
                                        strokeWidth="1"
                                        opacity="0.2"
                                    />
                                    <circle cx={`${pin.location.x}%`} cy={`${pin.location.y}%`} r="3" fill="black" />
                                </svg>

                                {/* Label Box */}
                                <div
                                    className={`absolute top-0 flex flex-col justify-center pointer-events-auto
                                        ${isLeft ? 'left-[5%] text-right items-end' : 'right-[5%] text-left items-start'}
                                    `}
                                    style={{ top: `calc(${pin.location.y}% - 20px)` }}
                                >
                                    <div className="bg-white px-3 py-2 border border-black/10 shadow-lg rounded-none">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">POINT {i + 1}</p>
                                        <p className="text-sm font-bold text-gray-900">{pin.title}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!bgRemoved && (
                <div className="absolute bottom-10 left-0 right-0 text-center z-10">
                    <p className="text-xs font-medium text-gray-400">배경 제거 후 디테일 라인이 표시됩니다</p>
                </div>
            )}
        </div>
    );
};

export default ProductMapBlock;
