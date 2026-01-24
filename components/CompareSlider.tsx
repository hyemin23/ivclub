import React, { useState, useRef, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface CompareSliderProps {
    before: string; // Original (Background/Model)
    after: string;  // Generated (Result)
    isHovering?: boolean;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({ before, after }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        setSliderPosition(percentage);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        setSliderPosition(percentage);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden cursor-col-resize select-none group"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* After Image (Background Layer) - Full View */}
            <img
                src={after}
                alt="After"
                className="absolute inset-0 w-full h-full object-contain"
            />

            {/* Before Image (Foreground Layer) - Clipped */}
            <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
            >
                <img
                    src={before}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-contain max-w-none"
                    style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }} // eslint-disable-line
                />
            </div>

            {/* Slider Handle Line */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                style={{ left: `${sliderPosition}%` }}
            >
                {/* Handle Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <MoveHorizontal className="w-4 h-4 text-slate-900" />
                </div>
            </div>

            {/* Labels */}
            <div className={`absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                BEFORE
            </div>
            <div className={`absolute top-4 right-4 bg-indigo-600/80 text-white text-xs font-bold px-2 py-1 rounded transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                AFTER
            </div>
        </div>
    );
};
