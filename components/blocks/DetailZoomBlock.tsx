
import React from 'react';
import { ZoomIn } from 'lucide-react';

interface DetailZoomBlockProps {
    // Legacy
    content?: {
        imageUrl?: string;
        text?: string;
        zoomPoint?: { x: number; y: number };
    };
    // New Props
    imageUrl?: string;
    zoomPoints?: any[]; // Use specific type if known, e.g. { x: number, y: number, label?: string }[]
    onZoomPointsChange?: (points: any[]) => void;
    isEditable?: boolean;
}

const DetailZoomBlock: React.FC<DetailZoomBlockProps> = ({ content, imageUrl, zoomPoints, onZoomPointsChange, isEditable }) => {
    // Priority: Prop > Content
    const displayImage = imageUrl || content?.imageUrl;
    const displayText = content?.text;

    return (
        <div className="w-full relative">
            {displayImage ? (
                <div className="relative group overflow-hidden">
                    <img src={displayImage} className="w-full h-auto block" />

                    {/* Mock Zoom Effect UI */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-white">
                        <ZoomIn className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Detail View</span>
                    </div>

                    {displayText && (
                        <div className="bg-white p-6 text-center">
                            <p className="text-sm font-medium text-gray-700 leading-relaxed">{displayText}</p>
                        </div>
                    )}

                    {/* Render Zoom Points if available (Mock visual) */}
                    {zoomPoints && zoomPoints.map((p, idx) => (
                        <div key={idx} className="absolute w-10 h-10 border-2 border-white rounded-full shadow-lg" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
                    ))}
                </div>
            ) : (
                <div className="w-full py-12 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                    <ZoomIn className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">Zoom Content Placeholder</span>
                </div>
            )}
        </div>
    );
};

export default DetailZoomBlock;
