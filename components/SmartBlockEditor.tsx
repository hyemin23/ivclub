'use client';

import React, { useState, useRef } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import html2canvas from 'html2canvas';

// 각 블록 컴포넌트 임포트
import NoticeBlock from './blocks/NoticeBlock';
import SizeBlock from './blocks/SizeBlock';
import OneClickWizard from './OneClickWizard';
import { Wand2 } from 'lucide-react';
// import IntroBlock from './blocks/IntroBlock'; (없으면 주석)
// import ProductBlock from './blocks/ProductBlock'; (없으면 주석)

// 타입 정의
type BlockType = 'NOTICE_TOP' | 'INTRO' | 'PRODUCT' | 'SIZE' | 'NOTICE_BOTTOM' | 'DETAIL';

interface PageBlock {
    id: string;
    type: BlockType;
    content: any;
    isVisible: boolean;
}

export default function SmartBlockEditor() {
    // 1. 초기 블록 상태 정의 (순서대로 배치)
    const [blocks, setBlocks] = useState<PageBlock[]>([
        { id: 'block-1', type: 'NOTICE_TOP', content: { imageUrl: null }, isVisible: true }, // 상단 배너
        { id: 'block-2', type: 'INTRO', content: { text: '브랜드 인트로' }, isVisible: true },
        { id: 'block-3', type: 'SIZE', content: { category: 'bottom', rows: [] }, isVisible: true },
        { id: 'block-4', type: 'NOTICE_BOTTOM', content: { imageUrl: null }, isVisible: true }, // 하단 공지
    ]);

    const [isExporting, setIsExporting] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // --- [핵심 기능 1] 사이드바에서 업로드 시 특정 블록 업데이트 ---
    const handleSidebarUpload = (type: BlockType, file: File) => {
        if (!file) return;
        const imageUrl = URL.createObjectURL(file);

        setBlocks((prev) =>
            prev.map((block) =>
                block.type === type
                    ? { ...block, content: { ...block.content, imageUrl } } // 해당 타입 찾아서 이미지 교체
                    : block
            )
        );
    };

    const handleAddBlockFromWizard = (type: any, imageUrl: string) => {
        console.log("SmartBlockEditor received block:", type, imageUrl.substring(0, 50) + "...");
        const newBlock: PageBlock = {
            id: `ai-block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            content: { imageUrl },
            isVisible: true
        };

        // SIZE 블록 위에 삽입 (Size 앞에)
        setBlocks(prev => {
            const sizeIndex = prev.findIndex(b => b.type === 'SIZE');
            if (sizeIndex !== -1) {
                const newArr = [...prev];
                newArr.splice(sizeIndex, 0, newBlock);
                return newArr;
            }
            return [...prev, newBlock];
        });
    };

    // --- [핵심 기능 2] 드래그 앤 드롭 순서 변경 ---
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // --- [핵심 기능 3] 이미지 저장 (Export) ---
    const handleExport = async () => {
        if (!canvasRef.current) return;
        setIsExporting(true);
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(canvasRef.current!, {
                    scale: 2,
                    useCORS: true,
                    width: 640,
                    windowWidth: 640,
                    backgroundColor: '#ffffff'
                } as any);
                const link = document.createElement('a');
                link.download = `detail_page_${Date.now()}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
            } catch (err) {
                console.error(err);
                alert('저장 실패');
            } finally {
                setIsExporting(false);
            }
        }, 100);
    };

    return (
        <div className="flex h-screen w-full bg-gray-900 overflow-hidden">
            {/* Wizard Overlay */}
            <OneClickWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onAddBlock={handleAddBlockFromWizard}
            />

            {/* --------------------------------------------------------- */}
            {/* [LEFT] 디자인 사이드바 (고정 너비 320px) */}
            {/* --------------------------------------------------------- */}
            <div className="w-[360px] flex-shrink-0 bg-[#111827] text-white p-6 border-r border-gray-700 overflow-y-auto custom-scrollbar z-10">

                {/* Magic Button */}
                <button
                    onClick={() => setIsWizardOpen(true)}
                    className="w-full mb-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-bold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 border border-white/10"
                >
                    <Wand2 className="w-5 h-5 text-yellow-300 animate-pulse" />
                    AI 원클릭 상세페이지 생성
                </button>

                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    🎨 브랜드 고정 에셋
                </h2>

                {/* 1. 상단 이벤트 배너 업로드 */}
                <div className="mb-6 p-4 border border-gray-700 rounded-xl bg-gray-800/50">
                    <label className="block text-sm font-bold mb-2 text-blue-400">✅ 이벤트/안내사항 (최상단)</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        onChange={(e) => e.target.files?.[0] && handleSidebarUpload('NOTICE_TOP', e.target.files[0])}
                    />
                    <p className="text-[10px] text-gray-500 mt-2">* 상단에 고정될 배너 이미지를 등록하세요.</p>
                </div>

                {/* 2. 하단 공지사항 업로드 */}
                <div className="mb-6 p-4 border border-gray-700 rounded-xl bg-gray-800/50">
                    <label className="block text-sm font-bold mb-2 text-blue-400">✅ 배송/공지사항 (최하단)</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        onChange={(e) => e.target.files?.[0] && handleSidebarUpload('NOTICE_BOTTOM', e.target.files[0])}
                    />
                    <p className="text-[10px] text-gray-500 mt-2">* 상세페이지 끝에 붙을 배송안내 이미지입니다.</p>
                </div>

                {/* 저장 버튼 (사이드바 하단 배치) */}
                <button
                    onClick={handleExport}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                >
                    ✨ 이미지로 저장하기
                </button>
            </div>


            {/* --------------------------------------------------------- */}
            {/* [RIGHT] 미리보기 캔버스 영역 (나머지 공간 채움) */}
            {/* --------------------------------------------------------- */}
            <div className="flex-1 bg-gray-100 flex justify-center overflow-y-auto p-10 relative">

                {/* 실제 캔버스 (가로 640px 고정) */}
                <div
                    id="final-canvas"
                    ref={canvasRef}
                    className="w-[640px] bg-white shadow-2xl min-h-[1000px] flex flex-col"
                >
                    {/* 상단 헤더 (디자인적 요소) */}
                    <div className="h-2 w-full bg-blue-500"></div>

                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                            {blocks.map((block) => {
                                // 각 블록 렌더링
                                if (!block.isVisible) return null;

                                // 1. 공지사항 (상단/하단 공통 NoticeBlock 사용)
                                if (block.type === 'NOTICE_TOP' || block.type === 'NOTICE_BOTTOM') {
                                    return (
                                        <NoticeBlock
                                            key={block.id}
                                            content={block.content}
                                            isExporting={isExporting}
                                            // 캔버스 내부에서도 수정 가능하게 하려면 아래 연결
                                            onUpdate={(newContent: any) => {
                                                setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, content: newContent } : b))
                                            }}
                                        />
                                    );
                                }

                                // 2. 사이즈 블록
                                if (block.type === 'SIZE') {
                                    return <SizeBlock key={block.id} content={block.content} isExporting={isExporting} />;
                                }

                                // 3. 기타 이미지형 블록 (INTRO, PRODUCT, DETAIL 등)
                                if (['INTRO', 'PRODUCT', 'DETAIL'].includes(block.type)) {
                                    return (
                                        <NoticeBlock
                                            key={block.id}
                                            content={block.content}
                                            isExporting={isExporting}
                                            onUpdate={(newContent: any) => {
                                                setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, content: newContent } : b))
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <div key={block.id} className="p-4 border-b text-center text-gray-400">
                                        {block.type} BLOCK (Placeholder)
                                    </div>
                                );
                            })}
                        </SortableContext>
                    </DndContext>

                    {/* 하단 푸터 (디자인적 요소) */}
                    <div className="mt-auto h-4 w-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                        Designed by Asterisk AI
                    </div>
                </div>

            </div>
        </div>
    );
}
