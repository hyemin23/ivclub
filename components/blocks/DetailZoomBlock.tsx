"use client";

import React, { useState, useRef } from 'react';
import { Move, Image as ImageIcon } from 'lucide-react';

interface DetailZoomBlockProps {
    imageUrl?: string;
    zoomPoints?: { x: number; y: number; scale: number }[];
    onZoomPointsChange?: (points: { x: number; y: number; scale: number }[]) => void;
    isEditable?: boolean;
    isExporting?: boolean;
}

/**
 * DetailZoomBlock - 이미지 디테일 확대 블록
 * 
 * 상품의 특정 부분을 확대하여 보여주는 블록입니다.
 * 사용자는 확대할 위치를 설정할 수 있습니다.
 */
const DetailZoomBlock: React.FC<DetailZoomBlockProps> = ({
    imageUrl,
    zoomPoints = [{ x: 50, y: 50, scale: 2 }],
    onZoomPointsChange,
    isEditable = false,
    isExporting = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // 줌 포인트 이동 핸들러
    const handleDragStart = () => {
        if (!isEditable) return;
        setIsDragging(true);
    };

    const handleDragMove = (e: React.MouseEvent) => {
        if (!isDragging || !isEditable || !containerRef.current || !onZoomPointsChange) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        onZoomPointsChange([{ ...zoomPoints[0], x, y }]);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    if (!imageUrl) {
        return (
            <div className="w-full aspect-video bg-gray-100 flex flex-col items-center justify-center text-gray-400 rounded-xl border border-dashed border-gray-300">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs">이미지를 선택해주세요</span>
            </div>
        );
    }

    const zoomPoint = zoomPoints[0] || { x: 50, y: 50, scale: 2 };

    return (
        <div className="w-full space-y-4">
            {/* 메인 이미지 영역 */}
            <div
                ref={containerRef}
                className={`relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 group
                    ${isEditable ? 'cursor-crosshair' : ''}
                `}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
            >
                <img
                    src={imageUrl}
                    alt="Detail Base"
                    className="w-full h-full object-cover"
                />

                {/* 줌 포커스 포인트 (편집 모드) */}
                {isEditable && !isExporting && (
                    <div
                        className={`absolute w-12 h-12 border-2 border-white shadow-xl rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-move
                            ${isDragging ? 'scale-110 border-indigo-500' : ''} transition-transform
                        `}
                        style={{ left: `${zoomPoint.x}%`, top: `${zoomPoint.y}%` }}
                        onMouseDown={handleDragStart}
                    >
                        <Move className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                )}

                {/* 줌 렌즈 효과 (뷰 모드) */}
                <div
                    className="absolute w-20 h-20 border-2 border-white/50 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${zoomPoint.x}%`, top: `${zoomPoint.y}%` }}
                />
            </div>

            {/* 확대된 뷰 */}
            <div className="w-full grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-gray-900">Detail View</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        섬세한 디테일을 확인하세요.<br />
                        고해상도 텍스처와 마감을 보여줍니다.
                    </p>
                </div>
                <div className="aspect-square rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-gray-100">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url(${imageUrl})`,
                            backgroundPosition: `${zoomPoint.x}% ${zoomPoint.y}%`,
                            backgroundSize: `${zoomPoint.scale * 100}%`,
                            backgroundRepeat: 'no-repeat'
                        }}
                    />
                    <div className="absolute inset-0 shadow-inner rounded-full pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

export default DetailZoomBlock;
