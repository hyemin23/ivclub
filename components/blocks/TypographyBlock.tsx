
import React, { useState } from 'react';
import { AutoTypographyResult } from '@/types';
import { Type, Move, Crown, Hash } from 'lucide-react';

interface TypographyBlockProps {
    imageUrl: string;
    typography: AutoTypographyResult;
    isEditable: boolean;
    onUpdate?: (updates: any) => void;
}

type StyleMode = 'INTRO' | 'FEATURE' | 'LABEL';

const TypographyBlock: React.FC<TypographyBlockProps> = ({ imageUrl, typography, isEditable }) => {
    const [mode, setMode] = useState<StyleMode>('INTRO');

    const renderOverlay = () => {
        switch (mode) {
            case 'INTRO': // A. Intro Poster
                return (
                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                        {/* Gradient Dimmed Layer */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                        <div className="relative z-10 flex gap-4 items-end">
                            {/* Vertical Line Point */}
                            <div className="w-[4px] h-[60px] bg-yellow-400 shrink-0 mb-1" />

                            <div className="text-white">
                                {/* English Title - Bold & Big */}
                                <h2 className="text-4xl font-[900] tracking-tighter uppercase leading-none mb-2 font-['Inter'] drop-shadow-xl"
                                    style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.5)' }}>
                                    {typography.intro_copy.english}
                                </h2>
                                {/* Korean Subtitle - Thin & Clean */}
                                <p className="text-lg font-light text-gray-200 tracking-wide drop-shadow-md opacity-90">
                                    {typography.intro_copy.korean}
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'FEATURE': // B. Feature Point
                return (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative z-10 text-center transform scale-110">
                            {/* Highlight Word - Yellow or Accent */}
                            <div className="text-yellow-300 text-6xl font-[900] tracking-tight mb-2 uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
                                style={{ fontFamily: 'Impact, sans-serif' }}>
                                {typography.feature_point.highlight_word}
                            </div>
                            {/* Full Sentence - White with strong shadow */}
                            <div className="text-white text-2xl font-bold bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm border border-white/20 shadow-xl">
                                {typography.feature_point.full_sentence}
                            </div>
                        </div>
                    </div>
                );

            case 'LABEL': // C. Magazine Label
                return (
                    <div className="absolute inset-0 pointer-events-none p-12">
                        {/* Floating Label Top-Right */}
                        <div className="absolute top-[15%] right-[10%] animate-bounce-slow">
                            <div className="relative bg-white text-black px-5 py-3 rounded-tr-xl rounded-bl-xl rounded-tl-sm rounded-br-sm shadow-[8px_8px_0px_rgba(0,0,0,1)] border-2 border-black transform rotate-2">
                                <div className="absolute -left-3 -top-3 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center border-2 border-black z-20">
                                    <Crown size={16} />
                                </div>
                                <span className="text-xl font-[800] tracking-tight whitespace-nowrap">
                                    {typography.visual_tag}
                                </span>
                                <div className="absolute -bottom-6 right-4 text-black text-4xl transform rotate-[10deg]">
                                    ↗
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={`relative w-full aspect-[3/4] overflow-hidden group bg-gray-900 ${isEditable ? 'ring-2 ring-indigo-500' : ''}`}>

            {/* Background Image */}
            <img
                src={imageUrl}
                alt="Typography Background"
                className="w-full h-full object-cover"
            />

            {/* Typography Overlay */}
            {renderOverlay()}

            {/* Mode Switcher (Visible on Hover/Edit) */}
            {isEditable && (
                <div className="absolute top-4 right-4 flex gap-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-2 rounded-lg backdrop-blur-md">
                    <button
                        onClick={() => setMode('INTRO')}
                        className={`p-2 rounded hover:bg-white/20 ${mode === 'INTRO' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
                        title="Intro Poster"
                    >
                        <Type size={18} />
                    </button>
                    <button
                        onClick={() => setMode('FEATURE')}
                        className={`p-2 rounded hover:bg-white/20 ${mode === 'FEATURE' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
                        title="Feature Point"
                    >
                        <Hash size={18} />
                    </button>
                    <button
                        onClick={() => setMode('LABEL')}
                        className={`p-2 rounded hover:bg-white/20 ${mode === 'LABEL' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
                        title="Magazine Label"
                    >
                        <Crown size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TypographyBlock;
