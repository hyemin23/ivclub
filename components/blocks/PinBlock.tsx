"use client";

import React, { useState, useRef, useCallback } from 'react';
import { MapPin, GripVertical, X, Plus, Sparkles } from 'lucide-react';
import { SmartPin } from '@/types';

interface PinBlockProps {
    imageUrl: string;
    pins: SmartPin[];
    onPinsChange: (pins: SmartPin[]) => void;
    isEditable?: boolean;
    isExporting?: boolean;
}

/**
 * PinBlock - 드래그 가능한 Smart Pin 컴포넌트
 * 
 * Vision AI가 생성한 핀을 이미지 위에 표시하고,
 * 사용자가 드래그하여 위치를 미세 조정할 수 있습니다.
 */
const PinBlock: React.FC<PinBlockProps> = ({
    imageUrl,
    pins,
    onPinsChange,
    isEditable = true,
    isExporting = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activePin, setActivePin] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredPin, setHoveredPin] = useState<string | null>(null);

    // 드래그 시작
    const handleDragStart = useCallback((pinId: string, e: React.MouseEvent | React.TouchEvent) => {
        if (!isEditable) return;
        e.preventDefault();
        setActivePin(pinId);
        setIsDragging(true);
    }, [isEditable]);

    // 드래그 중
    const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !activePin || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        // 마우스 또는 터치 좌표 추출
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // 상대 좌표 계산 (0-100%)
        const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

        // 핀 위치 업데이트
        const updatedPins = pins.map(pin =>
            pin.id === activePin
                ? { ...pin, location: { x: Math.round(x), y: Math.round(y) } }
                : pin
        );
        onPinsChange(updatedPins);
    }, [isDragging, activePin, pins, onPinsChange]);

    // 드래그 종료
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setActivePin(null);
    }, []);

    // 핀 삭제
    const handleRemovePin = useCallback((pinId: string) => {
        onPinsChange(pins.filter(pin => pin.id !== pinId));
    }, [pins, onPinsChange]);

    // 핀 추가 (클릭 위치)
    const handleAddPin = useCallback((e: React.MouseEvent) => {
        if (!isEditable || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

        const newPin: SmartPin = {
            id: `pin_${Date.now()}`,
            location: { x, y },
            title: '새 포인트',
            description: '클릭하여 설명을 수정하세요'
        };

        onPinsChange([...pins, newPin]);
    }, [isEditable, pins, onPinsChange]);

    return (
        <div className="relative w-full">
            {/* 헤더 (편집 모드) */}
            {isEditable && !isExporting && (
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Smart Pin</h3>
                            <p className="text-[10px] text-gray-500">핀을 드래그하여 위치 조정</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                            {pins.length}개 핀
                        </span>
                    </div>
                </div>
            )}

            {/* 이미지 + 핀 컨테이너 */}
            <div
                ref={containerRef}
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-900 ${isEditable ? 'cursor-crosshair' : ''
                    }`}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onDoubleClick={isEditable ? handleAddPin : undefined}
            >
                {/* 배경 이미지 */}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Product"
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <div className="text-center">
                            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">이미지를 업로드하세요</p>
                        </div>
                    </div>
                )}

                {/* 핀 렌더링 */}
                {pins.map((pin) => (
                    <div
                        key={pin.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 
              ${isDragging && activePin === pin.id ? 'scale-110' : ''}
              ${isEditable ? 'cursor-grab active:cursor-grabbing' : ''}
              transition-transform duration-150
            `}
                        style={{
                            left: `${pin.location.x}%`,
                            top: `${pin.location.y}%`,
                        }}
                        onMouseDown={(e) => handleDragStart(pin.id, e)}
                        onTouchStart={(e) => handleDragStart(pin.id, e)}
                        onMouseEnter={() => setHoveredPin(pin.id)}
                        onMouseLeave={() => setHoveredPin(null)}
                    >
                        {/* 핀 마커 */}
                        <div className={`
              relative group
              ${hoveredPin === pin.id || activePin === pin.id ? 'z-20' : 'z-10'}
            `}>
                            {/* 핀 아이콘 */}
                            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                bg-white shadow-lg shadow-black/30
                border-2 border-indigo-500
                ${isEditable ? 'group-hover:scale-110' : ''}
                transition-all duration-200
              `}>
                                <MapPin className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                            </div>

                            {/* 핀 정보 툴팁 */}
                            <div className={`
                absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                min-w-[160px] max-w-[200px]
                bg-black/90 backdrop-blur-md rounded-xl
                p-3 shadow-2xl border border-white/10
                transition-all duration-200
                ${hoveredPin === pin.id || activePin === pin.id
                                    ? 'opacity-100 visible translate-y-0'
                                    : 'opacity-0 invisible translate-y-2'
                                }
              `}>
                                <p className="font-bold text-white text-xs mb-1">{pin.title}</p>
                                <p className="text-gray-400 text-[10px] leading-relaxed">{pin.description}</p>

                                {/* 삭제 버튼 (편집 모드) */}
                                {isEditable && !isExporting && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePin(pin.id);
                                        }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full 
                      flex items-center justify-center hover:bg-red-400 transition-colors"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                )}
                            </div>

                            {/* 연결선 */}
                            <div className="absolute left-1/2 bottom-full h-2 w-px bg-indigo-500/50" />
                        </div>
                    </div>
                ))}

                {/* 편집 힌트 오버레이 */}
                {isEditable && !isExporting && pins.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="text-center text-white">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
                            <p className="text-sm font-bold">AI 분석 필요</p>
                            <p className="text-xs text-gray-300 mt-1">또는 더블클릭으로 핀 추가</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 편집 툴바 */}
            {isEditable && !isExporting && pins.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={() => {
                            const newPin: SmartPin = {
                                id: `pin_${Date.now()}`,
                                location: { x: 50, y: 50 },
                                title: '새 포인트',
                                description: '설명을 입력하세요'
                            };
                            onPinsChange([...pins, newPin]);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 
              rounded-lg text-xs font-medium text-gray-300 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        핀 추가
                    </button>
                </div>
            )}
        </div>
    );
};

export default PinBlock;
