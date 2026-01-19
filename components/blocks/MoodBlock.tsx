"use client";

import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Type, Palette } from 'lucide-react';

interface MoodBlockProps {
    imageUrl?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    description2?: string;
    isEditable?: boolean;
    isExporting?: boolean;
    onUpdate?: (updates: any) => void;
}

const MoodBlock: React.FC<MoodBlockProps> = ({
    imageUrl,
    title = "Premium Cotton",
    subtitle = "Soft Touch & Comfort",
    description = "부드러운 터치감의 완성",
    description2 = "기분 좋은 착용감을 선사합니다.",
    isEditable = false,
    isExporting = false,
    onUpdate
}) => {
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
    const [textColor, setTextColor] = useState<'white' | 'black'>('white');

    const handleUpdate = (updates: any) => {
        if (onUpdate) onUpdate(updates);
    };

    if (!imageUrl && !isExporting) {
        return (
            <div className="w-full aspect-[3/4] bg-gray-900 rounded-xl flex items-center justify-center border border-dashed border-white/10 text-gray-500">
                <div className="text-center">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">이미지를 업로드하세요</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-black group">
            {/* Background Image */}
            <img
                src={imageUrl}
                alt="Mood"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Dimmed Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-b ${textColor === 'white' ? 'from-black/20 via-transparent to-black/60' : 'from-white/20 via-transparent to-white/60'
                }`} />

            {/* Text Content */}
            <div className={`absolute inset-0 p-10 flex flex-col justify-end ${textAlign === 'center' ? 'items-center text-center' :
                    textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'
                }`}>
                {/* Editable Controls Overlay (Only when editable) */}
                {isEditable && !isExporting && (
                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                        <button
                            onClick={(e) => { e.stopPropagation(); setTextColor(prev => prev === 'white' ? 'black' : 'white'); }}
                            className="p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors"
                        >
                            <Palette className="w-4 h-4 text-white" />
                        </button>
                    </div>
                )}

                <div className={`${textColor === 'white' ? 'text-white' : 'text-gray-900'} max-w-lg transition-colors duration-300`}>
                    {isEditable ? (
                        <div className="space-y-2">
                            <input
                                value={subtitle}
                                onChange={(e) => handleUpdate({ subtitle: e.target.value })}
                                className="w-full bg-transparent font-serif italic text-lg opacity-80 focus:outline-none text-center"
                                placeholder="Subtitle"
                            />
                            <input
                                value={title}
                                onChange={(e) => handleUpdate({ title: e.target.value })}
                                className="w-full bg-transparent font-serif text-5xl font-black uppercase tracking-tighter focus:outline-none text-center leading-none mb-4"
                                placeholder="TITLE"
                            />
                            <textarea
                                value={description}
                                onChange={(e) => handleUpdate({ description: e.target.value })}
                                className="w-full bg-transparent text-sm font-medium opacity-90 focus:outline-none resize-none text-center h-6"
                                placeholder="Description Line 1"
                            />
                            <textarea
                                value={description2}
                                onChange={(e) => handleUpdate({ description2: e.target.value })}
                                className="w-full bg-transparent text-sm opacity-70 focus:outline-none resize-none text-center h-6"
                                placeholder="Description Line 2"
                            />
                        </div>
                    ) : (
                        <>
                            <p className="font-serif italic text-lg opacity-80 mb-2">{subtitle}</p>
                            <h2 className="font-serif text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                                {title}
                            </h2>
                            <div className="space-y-1">
                                <p className="text-sm font-bold opacity-90">{description}</p>
                                <p className="text-xs opacity-70">{description2}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MoodBlock;
