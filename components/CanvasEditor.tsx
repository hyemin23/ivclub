"use client";

import React, { useState, useRef, useCallback } from 'react';
import {
    Upload, Image as ImageIcon, Type, LayoutGrid, Table2,
    Sparkles, ChevronRight, Loader2, Settings, Layers,
    GripVertical, Eye, Download, X, Plus, FileUp, Zap,
    MapPin, Scale, Info, Truck, Tag, ZoomIn
} from 'lucide-react';
import { useStore } from '@/store';
import { analyzeProductVision, getDefaultVisionAnalysis } from '@/services/geminiService';
import { SmartPin, VsComparisonItem, VisionAnalysisResult } from '@/types';
import PinBlock from './blocks/PinBlock';
import VsBlock from './blocks/VsBlock';
import DetailZoomBlock from './blocks/DetailZoomBlock';
import FittingVariation from './FittingVariation';

// 블록 타입 정의
type EditorBlockType = 'PIN' | 'VS' | 'TEXT' | 'IMAGE' | 'SIZE' | 'NOTICE' | 'INTRO' | 'ZOOM';

interface EditorBlock {
    id: string;
    type: EditorBlockType;
    data: any;
    order: number;
}
// ... (skip unchanged parts) ...
// 블록 라이브러리 아이템
const blockLibrary = [
    { type: 'PIN' as EditorBlockType, icon: MapPin, label: 'Smart Pin', desc: 'AI 포인트 핀' },
    { type: 'VS' as EditorBlockType, icon: Scale, label: 'VS 비교표', desc: '경쟁사 비교' },
    { type: 'ZOOM' as EditorBlockType, icon: ZoomIn, label: 'Detail Zoom', desc: '디테일 확대' },
    { type: 'IMAGE' as EditorBlockType, icon: ImageIcon, label: '이미지', desc: '상품 사진' },
    { type: 'TEXT' as EditorBlockType, icon: Type, label: '텍스트', desc: '설명 문구' },
    { type: 'SIZE' as EditorBlockType, icon: LayoutGrid, label: '사이즈표', desc: '치수 정보' },
    { type: 'NOTICE' as EditorBlockType, icon: Truck, label: '배송안내', desc: '고정 에셋' },
];
// ... (skip unchanged parts) ...
{
    block.type === 'VS' && (
        <VsBlock
            comparisons={comparisons}
            onComparisonsChange={setComparisons}
            isEditable={selectedBlockId === block.id}
        />
    )
}
{
    block.type === 'ZOOM' && mainImageUrl && (
        <DetailZoomBlock
            imageUrl={mainImageUrl}
            isEditable={selectedBlockId === block.id}
        // data mapping could be added here
        />
    )
}

{/* Placeholder Blocks */ }
// ... (skip unchanged parts) ...
{/* VS 블록 속성 */ }
{
    selectedBlock.type === 'VS' && (
        <div className="space-y-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                비교 항목 ({comparisons.length}개)
            </p>
            <p className="text-gray-500 text-xs">
                캔버스에서 직접 편집하거나 여기서 수정할 수 있습니다.
            </p>
        </div>
    )
}

{/* ZOOM 블록 속성 */ }
{
    selectedBlock.type === 'ZOOM' && (
        <div className="space-y-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                디테일 확대 설정
            </p>
            <p className="text-gray-500 text-xs">
                이미지에서 확대하고 싶은 부분을 드래그하여 설정하세요.
            </p>
        </div>
    )
}

{/* 일반 블록 공통 */ }
{
    !['PIN', 'VS', 'ZOOM'].includes(selectedBlock.type) && (
        <div className="text-center py-10 text-gray-600">


            interface OnboardingModalProps {
                isOpen: boolean;
    onClose: () => void;
    onComplete: (images: File[], analysisResult: VisionAnalysisResult) => void;
}

            /**
             * AI 원클릭 생성 모달 (Onboarding)
             * 에디터 진입 전 사용자가 이미지를 업로드하고 AI 분석을 시작합니다.
             */
            const OnboardingModal: React.FC<OnboardingModalProps> = ({isOpen, onClose, onComplete}) => {
    const [images, setImages] = useState<File[]>([]);
                const [isAnalyzing, setIsAnalyzing] = useState(false);
                const [error, setError] = useState<string | null>(null);
                const fileInputRef = useRef<HTMLInputElement>(null);

                    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 10) {
                            setError('최대 10장까지 업로드 가능합니다.');
                        return;
        }
        setImages(prev => [...prev, ...files]);
                        setError(null);
    };

    const handleRemoveImage = (index: number) => {
                            setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        if (images.length === 0) {
                            setError('상품 사진을 1장 이상 업로드해주세요.');
                        return;
        }

                        setIsAnalyzing(true);
                        setError(null);

                        try {
            // 첫 번째 이미지로 Vision AI 분석
            const reader = new FileReader();
                        const imageBase64 = await new Promise<string>((resolve, reject) => {
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(images[0]);
            });

                            const result = await analyzeProductVision(imageBase64);
                            onComplete(images, result);
        } catch (err: any) {
                                console.error('Vision AI 분석 실패:', err);
                            // 실패 시 기본값 사용
                            const defaultResult = getDefaultVisionAnalysis();
                            onComplete(images, defaultResult);
        } finally {
                                setIsAnalyzing(false);
        }
    };

                            if (!isOpen) return null;

                            return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                                <div className="w-full max-w-2xl bg-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                                    {/* 헤더 */}
                                    <div className="p-8 border-b border-white/5 bg-gradient-to-b from-indigo-500/10 to-transparent">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl 
              flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                                <Sparkles className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-white tracking-tight">AI 원클릭 생성</h2>
                                                <p className="text-gray-400 text-sm mt-1">상품 사진을 올리면 AI가 자동으로 상세페이지를 구성합니다</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 본문 */}
                                    <div className="p-8">
                                        {/* 업로드 영역 */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
              transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5
              ${images.length > 0 ? 'border-white/20 bg-white/[0.02]' : 'border-white/10'}
            `}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />

                                            {images.length === 0 ? (
                                                <div>
                                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <FileUp className="w-8 h-8 text-gray-500" />
                                                    </div>
                                                    <p className="text-white font-bold mb-1">상품 사진을 업로드하세요</p>
                                                    <p className="text-gray-500 text-sm">1~10장 (드래그 또는 클릭)</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-5 gap-3">
                                                    {images.map((file, index) => (
                                                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={`Upload ${index}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveImage(index);
                                                                }}
                                                                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full 
                        flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3 text-white" />
                                                            </button>
                                                            {index === 0 && (
                                                                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-indigo-500 
                        rounded text-[8px] font-bold text-white">
                                                                    대표
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {images.length < 10 && (
                                                        <div className="aspect-square rounded-xl border border-dashed border-white/10 
                    flex items-center justify-center hover:bg-white/5 transition-colors">
                                                            <Plus className="w-6 h-6 text-gray-600" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* 에러 메시지 */}
                                        {error && (
                                            <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
                                        )}

                                        {/* AI 분석 설명 */}
                                        <div className="mt-6 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">AI가 자동 생성하는 항목</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { icon: MapPin, label: 'Smart Pin (포인트 핀)' },
                                                    { icon: Scale, label: 'VS 비교표' },
                                                    { icon: Info, label: '제품 분석 정보' },
                                                    { icon: Layers, label: '상세페이지 블록' },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-gray-400 text-xs">
                                                        <item.icon className="w-4 h-4 text-indigo-400" />
                                                        {item.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 푸터 */}
                                    <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                                        <button
                                            onClick={onClose}
                                            className="px-5 py-2.5 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                        >
                                            건너뛰기
                                        </button>
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={images.length === 0 || isAnalyzing}
                                            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all
              ${images.length > 0 && !isAnalyzing
                                                    ? 'bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/20'
                                                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                                                }
            `}
                                        >
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    AI 분석 중...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-4 h-4" />
                                                    AI 생성 시작
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            );
};

/**
 * CanvasEditor - 3단 에디터 메인 컴포넌트
 * Left: 에셋 & 블록 라이브러리
 * Center: 캔버스 (미리보기)
 * Right: 속성 패널 (Inspector)
 */
const CanvasEditor: React.FC = () => {
    // 상태
    const [showOnboarding, setShowOnboarding] = useState(true);
                            const [uploadedImages, setUploadedImages] = useState<string[]>([]);
                            const [blocks, setBlocks] = useState<EditorBlock[]>([]);
                            const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
                            const [pins, setPins] = useState<SmartPin[]>([]);
                            const [comparisons, setComparisons] = useState<VsComparisonItem[]>([]);
                            const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
                            const [activeTab, setActiveTab] = useState<'blocks' | 'edit'>('blocks');
                            const [showNanoBanana, setShowNanoBanana] = useState(false);

    // Onboarding 완료 핸들러
    const handleOnboardingComplete = useCallback((images: File[], analysisResult: VisionAnalysisResult) => {
        // 이미지 URL 생성
        const imageUrls = images.map(file => URL.createObjectURL(file));
                            setUploadedImages(imageUrls);
                            setMainImageUrl(imageUrls[0] || null);

                            // Vision AI 결과 적용
                            if (analysisResult.data) {
                                setPins(analysisResult.data.smart_pins || []);
                            setComparisons(analysisResult.data.comparison_table || []);
        }

                            // 기본 블록 생성
                            const initialBlocks: EditorBlock[] = [
                            {id: 'block_1', type: 'PIN', data: {imageIndex: 0 }, order: 0 },
                            {id: 'block_2', type: 'VS', data: { }, order: 1 },
                            ];
                            setBlocks(initialBlocks);

                            // 첫 번째 블록 선택 및 에디트 탭으로 전환
                            setSelectedBlockId('block_1');
                            setActiveTab('edit');

                            setShowOnboarding(false);
    }, []);

    // 블록 선택
    const handleSelectBlock = (blockId: string) => {
                                setSelectedBlockId(blockId);
                            setActiveTab('edit');
    };

    // 선택된 블록 데이터
    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

                            // 블록 라이브러리 아이템
                            const blockLibrary = [
                            {type: 'PIN' as EditorBlockType, icon: MapPin, label: 'Smart Pin', desc: 'AI 포인트 핀' },
                            {type: 'VS' as EditorBlockType, icon: Scale, label: 'VS 비교표', desc: '경쟁사 비교' },
                            {type: 'IMAGE' as EditorBlockType, icon: ImageIcon, label: '이미지', desc: '상품 사진' },
                            {type: 'TEXT' as EditorBlockType, icon: Type, label: '텍스트', desc: '설명 문구' },
                            {type: 'SIZE' as EditorBlockType, icon: LayoutGrid, label: '사이즈표', desc: '치수 정보' },
                            {type: 'NOTICE' as EditorBlockType, icon: Truck, label: '배송안내', desc: '고정 에셋' },
                            ];

    // 블록 추가
    const handleAddBlock = (type: EditorBlockType) => {
        const newBlock: EditorBlock = {
                                id: `block_${Date.now()}`,
                            type,
                            data: { },
                            order: blocks.length,
        };
        setBlocks(prev => [...prev, newBlock]);
                            setSelectedBlockId(newBlock.id);
                            setActiveTab('edit');
    };

                            return (
                            <div className="flex h-screen overflow-hidden bg-black text-white">
                                {/* Onboarding Modal */}
                                <OnboardingModal
                                    isOpen={showOnboarding}
                                    onClose={() => setShowOnboarding(false)}
                                    onComplete={handleOnboardingComplete}
                                />

                                {/* ============ LEFT PANEL: Controller (400px) ============ */}
                                <aside className="w-[400px] min-w-[400px] flex flex-col border-r border-white/10 bg-slate-950">

                                    {/* 헤더 */}
                                    <div className="flex items-center justify-between border-b border-white/5 p-5">
                                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Editor Controller</h2>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowNanoBanana(true)}
                                                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                Magic AI
                                            </button>
                                            <button className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-white/5">저장</button>
                                        </div>
                                    </div>

                                    {/* 탭 네비게이션 */}
                                    <div className="flex border-b border-white/5">
                                        <button
                                            onClick={() => setActiveTab('blocks')}
                                            className={`flex-1 py-3 text-sm font-bold transition-colors
                            ${activeTab === 'blocks' ? 'bg-white/5 text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}
                        `}
                                        >
                                            블록 (Blocks)
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('edit')}
                                            className={`flex-1 py-3 text-sm font-bold transition-colors
                            ${activeTab === 'edit' ? 'bg-white/5 text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}
                        `}
                                        >
                                            편집 (Edit)
                                        </button>
                                    </div>

                                    {/* 탭 컨텐츠 영역 */}
                                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">

                                        {/* --- 탭 1: 블록 라이브러리 --- */}
                                        {activeTab === 'blocks' && (
                                            <div className="space-y-6">
                                                {/* 업로드 이미지 섹션 */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">업로드 이미지</span>
                                                        <button className="text-[10px] text-indigo-400 hover:text-indigo-300">+ 추가</button>
                                                    </div>
                                                    {uploadedImages.length > 0 ? (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {uploadedImages.map((url, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all
                                                    ${mainImageUrl === url ? 'border-indigo-500' : 'border-transparent hover:border-white/20'}
                                                `}
                                                                    onClick={() => setMainImageUrl(url)}
                                                                >
                                                                    <img src={url} alt={`Uploaded ${i}`} className="w-full h-full object-cover" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="aspect-video bg-white/[0.02] rounded-xl flex items-center justify-center border border-dashed border-white/10">
                                                            <p className="text-gray-600 text-xs">이미지 없음</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 라이브러리 목록 */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">
                                                        추가할 블록
                                                    </span>
                                                    <div className="space-y-2">
                                                        {blockLibrary.map((item) => (
                                                            <button
                                                                key={item.type}
                                                                onClick={() => handleAddBlock(item.type)}
                                                                className="w-full flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.05] 
                                                rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                                                            >
                                                                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center 
                                                group-hover:bg-indigo-500/20 transition-colors">
                                                                    <item.icon className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-xs font-bold text-white">{item.label}</p>
                                                                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                                                                </div>
                                                                <Plus className="w-4 h-4 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* --- 탭 2: 속성 편집 --- */}
                                        {activeTab === 'edit' && (
                                            <div>
                                                {selectedBlock ? (
                                                    <div className="space-y-6">
                                                        {/* 블록 타입 표시 */}
                                                        <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                                                                EDITING BLOCK
                                                            </p>
                                                            <p className="text-white font-bold text-lg">
                                                                {blockLibrary.find(b => b.type === selectedBlock.type)?.label || selectedBlock.type}
                                                            </p>
                                                        </div>

                                                        {/* PIN 블록 속성 */}
                                                        {selectedBlock.type === 'PIN' && (
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                                            핀 목록 ({pins.length}개)
                                                                        </p>
                                                                        <button
                                                                            onClick={() => {
                                                                                setPins([...pins, { id: `pin_${Date.now()}`, location: { x: 50, y: 50 }, title: '새 포인트', description: '' }]);
                                                                            }}
                                                                            className="text-[10px] text-indigo-400 hover:text-indigo-300"
                                                                        >
                                                                            + 핀 추가
                                                                        </button>
                                                                    </div>

                                                                    <div className="space-y-3">
                                                                        {pins.map((pin, i) => (
                                                                            <div key={pin.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider">PIN #{i + 1}</span>
                                                                                    <button
                                                                                        onClick={() => setPins(pins.filter((_, idx) => idx !== i))}
                                                                                        className="text-gray-600 hover:text-red-400"
                                                                                    >
                                                                                        <X className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                                <input
                                                                                    type="text"
                                                                                    value={pin.title}
                                                                                    onChange={(e) => {
                                                                                        const updated = [...pins];
                                                                                        updated[i] = { ...pin, title: e.target.value };
                                                                                        setPins(updated);
                                                                                    }}
                                                                                    className="w-full bg-transparent text-white text-sm font-bold mb-1 
                                                                    focus:outline-none placeholder-gray-600"
                                                                                    placeholder="제목 입력"
                                                                                />
                                                                                <textarea
                                                                                    value={pin.description}
                                                                                    onChange={(e) => {
                                                                                        const updated = [...pins];
                                                                                        updated[i] = { ...pin, description: e.target.value };
                                                                                        setPins(updated);
                                                                                    }}
                                                                                    className="w-full bg-transparent text-gray-400 text-xs resize-none 
                                                                    focus:outline-none placeholder-gray-700"
                                                                                    placeholder="설명 입력"
                                                                                    rows={2}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* VS 블록 속성 */}
                                                        {selectedBlock.type === 'VS' && (
                                                            <div className="space-y-4">
                                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                                    비교 항목 설정
                                                                </p>
                                                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                                                    <p className="text-gray-400 text-xs leading-relaxed">
                                                                        VS 비교표는 캔버스에서 직접 텍스트를 클릭하여 수정하는 것이 더 편리합니다.
                                                                        <br /><br />
                                                                        항목을 추가하려면 캔버스 하단의 "+" 버튼을 사용하세요.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* 일반 블록 공통 */}
                                                        {!['PIN', 'VS'].includes(selectedBlock.type) && (
                                                            <div className="text-center py-10 text-gray-600">
                                                                <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                                <p className="text-xs">이 블록에 대한<br />추가 설정 옵션이 없습니다.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-64 flex flex-col items-center justify-center text-gray-600">
                                                        <Eye className="w-8 h-8 mb-3 opacity-30" />
                                                        <p className="text-sm font-medium">선택된 블록 없음</p>
                                                        <p className="text-xs mt-1">블록 리스트에서 추가하거나<br />캔버스에서 블록을 선택하세요.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </div>

                                    {/* 하단 액션 */}
                                    <div className="p-4 border-t border-white/5 bg-slate-950 sticky bottom-0 z-10">
                                        <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm 
                        hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10">
                                            <Download className="w-4 h-4" />
                                            상세페이지 내보내기
                                        </button>
                                    </div>
                                </aside>

                                {/* ============ RIGHT PANEL: Canvas (Wide & Infinite) ============ */}
                                <main className="flex-1 overflow-y-auto bg-[#0a0a0a] relative custom-scrollbar">

                                    {/* 캔버스 배경 그리드 효과 */}
                                    <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                                        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                                    </div>

                                    <div className="min-h-full flex flex-col items-center py-12 px-8">

                                        {/* 상단 툴바 */}
                                        <div className="mb-8 flex items-center gap-4 px-6 py-2 bg-slate-900/50 backdrop-blur rounded-full border border-white/5">
                                            <div className="text-xs text-gray-400 font-medium">Canvas Width: <span className="text-white">860px</span></div>
                                            <div className="w-px h-3 bg-white/10"></div>
                                            <div className="text-xs text-indigo-400 font-bold">Infinite Scroll</div>
                                        </div>

                                        {/* 메인 캔버스 영역 */}
                                        <div className="w-[860px] min-h-[1200px] bg-white rounded-md shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
                                            {/* 블록들이 여기에 렌더링됨 */}
                                            {blocks.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-20 border-2 border-dashed border-gray-200 m-4 rounded-xl">
                                                    <Layers className="w-16 h-16 mb-4 text-gray-200" />
                                                    <p className="text-lg font-bold text-gray-400">캔버스가 비어있습니다</p>
                                                    <p className="text-sm text-gray-400 mt-2">왼쪽 패널에서 블록을 추가하여 상세페이지를 구성하세요</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    {blocks.map((block) => (
                                                        <div
                                                            key={block.id}
                                                            onClick={() => handleSelectBlock(block.id)}
                                                            className={`group relative transition-all cursor-pointer
                                            ${selectedBlockId === block.id
                                                                    ? 'z-10 ring-4 ring-indigo-500/50'
                                                                    : 'hover:ring-2 hover:ring-indigo-500/20'
                                                                }
                                        `}
                                                        >
                                                            {/* 블록 렌더링 */}
                                                            {block.type === 'PIN' && mainImageUrl && (
                                                                <PinBlock
                                                                    imageUrl={mainImageUrl}
                                                                    pins={pins}
                                                                    onPinsChange={setPins}
                                                                    isEditable={selectedBlockId === block.id}
                                                                />
                                                            )}
                                                            {block.type === 'VS' && (
                                                                <VsBlock
                                                                    comparisons={comparisons}
                                                                    onComparisonsChange={setComparisons}
                                                                    isEditable={selectedBlockId === block.id}
                                                                />
                                                            )}

                                                            {/* Placeholder Blocks */}
                                                            {block.type === 'IMAGE' && (
                                                                <div className="w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                    {block.data.imageUrl ? (
                                                                        <img src={block.data.imageUrl} className="w-full h-auto" alt="Block Content" />
                                                                    ) : (
                                                                        <div className="aspect-video w-full flex items-center justify-center">
                                                                            <ImageIcon className="w-12 h-12 text-gray-300" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {block.type === 'TEXT' && (
                                                                <div className="w-full p-12 bg-white text-center">
                                                                    <p className="text-2xl font-bold text-gray-800">텍스트 영역입니다</p>
                                                                    <p className="text-gray-500 mt-2">클릭하여 내용을 수정하세요</p>
                                                                </div>
                                                            )}
                                                            {block.type === 'SIZE' && (
                                                                <div className="w-full p-8 bg-gray-50">
                                                                    <div className="w-full h-40 bg-white border border-gray-200 rounded grid place-items-center text-gray-400 font-mono text-sm">
                                                                        [ SIZE TABLE PREVIEW ]
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {block.type === 'NOTICE' && (
                                                                <div className="w-full p-8 bg-gray-900 text-white text-center">
                                                                    <p className="font-bold">배송 및 교환/반품 안내</p>
                                                                </div>
                                                            )}

                                                            {/* Hover Actions (삭제, 이동 등) */}
                                                            {selectedBlockId === block.id && (
                                                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setBlocks(blocks.filter(b => b.id !== block.id));
                                                                        }}
                                                                        className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>


                                    </div>
                                </main>

                                {/* Nano Banana Pro Modal */}
                                {showNanoBanana && (
                                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-10">
                                        <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                                                        <Sparkles className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-black text-white">NanoBanana Pro</h2>
                                                        <p className="text-xs text-gray-400">AI Asset Enhancement Studio</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setShowNanoBanana(false)}
                                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                                >
                                                    <X className="w-5 h-5 text-white" />
                                                </button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                                <FittingVariation
                                                    onImageSelect={(url) => {
                                                        const newBlock: EditorBlock = {
                                                            id: `block_${Date.now()}`,
                                                            type: 'IMAGE',
                                                            data: { imageUrl: url },
                                                            order: blocks.length,
                                                        };
                                                        setBlocks(prev => [...prev, newBlock]);
                                                        setShowNanoBanana(false);
                                                        setActiveTab('edit');
                                                        setUploadedImages(prev => [...prev, url]);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            );
};

                            export default CanvasEditor;
