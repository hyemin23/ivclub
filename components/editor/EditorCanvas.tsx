"use client";

import React, { useRef } from 'react';
import { useStore } from '@/store';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
// import PinBlock from '@/components/blocks/PinBlock'; // REMOVED
import VsBlock from '@/components/blocks/VsBlock';
import DetailZoomBlock from '@/components/blocks/DetailZoomBlock';
import MoodBlock from '@/components/blocks/MoodBlock';
import ProductMapBlock from '@/components/blocks/ProductMapBlock';
import SplitBlock from '@/components/blocks/SplitBlock';

import DesignBlock from '@/components/blocks/DesignBlock';
import TypographyBlock from '@/components/blocks/TypographyBlock';
import { Trash2, GripVertical } from 'lucide-react';
// import { EditorBlockType } from './constants'; // Not strictly needed if we switch string types

const EditorCanvas: React.FC = () => {
    const {
        pageBlocks,
        updatePageBlock,
        removePageBlock,
        reorderPageBlocks,
        selectedBlockId,
        setSelectedBlockId,
        setActiveTab,

        // smartPins, // REMOVED
        // setSmartPins, // REMOVED
        comparisons,
        setComparisons,
        designKeywords, // ADDED
        mainImageUrl,
        uploadedImages
    } = useStore();

    const canvasRef = useRef<HTMLDivElement>(null);

    // Block Render Logic
    const renderBlockContent = (block: any) => {
        const isSelected = selectedBlockId === block.id;

        switch (block.type) {
            /* REMOVED PIN BLOCK CASE
            case 'PIN':
                return (
                    <PinBlock
                        imageUrl={mainImageUrl || ''}
                        pins={[]}
                        onPinsChange={() => {}}
                        isEditable={isSelected}
                    />
                );
            */
            case 'VS':
                return (
                    <VsBlock
                        comparisons={comparisons}
                        onComparisonsChange={setComparisons}
                        isEditable={isSelected}
                    />
                );
            case 'ZOOM':
                return (
                    <DetailZoomBlock
                        imageUrl={mainImageUrl || ''}
                        zoomPoints={block.data?.zoomPoints}
                        onZoomPointsChange={(points) => updatePageBlock(block.id, { data: { ...block.data, zoomPoints: points } })}
                        isEditable={isSelected}
                    />
                );
            case 'MOOD':
                return (
                    <MoodBlock
                        imageUrl={mainImageUrl || ''}
                        title={block.data?.title}
                        subtitle={block.data?.subtitle}
                        description={block.data?.description}
                        description2={block.data?.description2}
                        isEditable={isSelected}
                        onUpdate={(updates) => updatePageBlock(block.id, { data: { ...block.data, ...updates } })}
                    />
                );
            case 'MAP':
                return (
                    <ProductMapBlock
                        imageUrl={mainImageUrl || ''}
                        pins={[]} // REMOVED smartPins usage
                        isEditable={isSelected}
                        onUpdate={(updates) => updatePageBlock(block.id, { data: { ...block.data, ...updates } })}
                    />
                );
            case 'SPLIT':
                return (
                    <SplitBlock
                        imageLeft={uploadedImages[0] || mainImageUrl || ''}
                        imageRight={uploadedImages[1] || ''} // Try to use 2nd uploaded image
                        labelLeft={block.data?.labelLeft}
                        labelRight={block.data?.labelRight}
                        isEditable={isSelected}
                        onUpdate={(updates) => updatePageBlock(block.id, { data: { ...block.data, ...updates } })}
                    />
                );
            case 'DESIGN':
                return (
                    <DesignBlock
                        imageUrl={mainImageUrl || ''}
                        keywords={block.data?.keywords || designKeywords} // Use block data if saved, else current store
                        onUpdate={(updates) => updatePageBlock(block.id, { data: { ...block.data, ...updates } })}
                    />
                );
            case 'TYPOGRAPHY':
                return (
                    <TypographyBlock
                        imageUrl={mainImageUrl || ''}
                        typography={block.data?.typography}
                        isEditable={isSelected}
                        onUpdate={(updates) => updatePageBlock(block.id, { data: { ...block.data, ...updates } })}
                    />
                );
            default:
                return (
                    <div className="p-8 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-500 bg-white/[0.02]">
                        Unknown Block Type: {block.type}
                    </div>
                );
        }
    };

    return (
        <div className="flex-1 bg-[#111] overflow-y-auto relative h-[calc(100vh-64px)] md:h-screen">
            {/* Canvas Container */}
            <div className="min-h-[200vh] py-20 flex flex-col items-center">

                {/* Mobile/Canvas Frame */}
                <div
                    ref={canvasRef}
                    className="w-[860px] min-h-[1000px] bg-black shadow-2xl shadow-black border border-white/10 relative"
                    onClick={() => {
                        // Deselect if clicking background?
                        // setSelectedBlockId(null);
                        // setActiveTab('blocks');
                    }}
                >
                    {pageBlocks.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                            <div className="text-center">
                                <p className="text-lg font-bold mb-2">캔버스가 비어있습니다</p>
                                <p className="text-sm">왼쪽 패널에서 필요한 블록을 추가하세요</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 p-8">
                        {pageBlocks.map((block, index) => (
                            <div
                                key={block.id}
                                className={`relative group transition-all duration-200
                                    ${selectedBlockId === block.id
                                        ? 'ring-2 ring-indigo-500 rounded-xl z-20 shadow-xl shadow-indigo-500/10'
                                        : 'hover:ring-1 hover:ring-white/20 rounded-xl'
                                    }
                                `}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBlockId(block.id);
                                    setActiveTab('edit');
                                }}
                            >
                                {/* Block Controls (Visible on Hover/Select) */}
                                {(selectedBlockId === block.id || true) && ( // Always show on hover via css group
                                    <div className={`absolute -right-12 top-0 flex flex-col gap-2 
                                        opacity-0 group-hover:opacity-100 transition-opacity
                                        ${selectedBlockId === block.id ? 'opacity-100' : ''}
                                    `}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removePageBlock(block.id);
                                            }}
                                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                            title="블록 삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="p-2 bg-white/5 text-gray-400 rounded-lg cursor-grab active:cursor-grabbing">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}

                                {/* Block Content */}
                                {renderBlockContent(block)}
                            </div>
                        ))}
                    </div>

                </div>

                <div className="mt-10 text-gray-600 font-mono text-xs mb-20">
                    END OF CANVAS
                </div>
            </div>
        </div>
    );
};

export default EditorCanvas;
