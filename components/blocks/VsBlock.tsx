"use client";

import React from 'react';
import { Check, X, Zap, Shield, Sparkles, Trophy } from 'lucide-react';
import { VsComparisonItem } from '@/types';

interface VsBlockProps {
    comparisons: VsComparisonItem[];
    onComparisonsChange?: (comparisons: VsComparisonItem[]) => void;
    isEditable?: boolean;
    isExporting?: boolean;
    variant?: 'default' | 'compact' | 'premium';
}

/**
 * VsBlock - 동적 경쟁사 비교표 컴포넌트
 * 
 * Vision AI가 역추론으로 생성한 Us vs Others 비교 데이터를
 * 시각적으로 매력적인 비교표로 렌더링합니다.
 */
const VsBlock: React.FC<VsBlockProps> = ({
    comparisons,
    onComparisonsChange,
    isEditable = false,
    isExporting = false,
    variant = 'default'
}) => {

    // 편집 가능한 텍스트 핸들러
    const handleTextChange = (index: number, field: keyof VsComparisonItem, value: string) => {
        if (!onComparisonsChange) return;
        const updated = comparisons.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        onComparisonsChange(updated);
    };

    // 항목 삭제
    const handleRemove = (index: number) => {
        if (!onComparisonsChange) return;
        onComparisonsChange(comparisons.filter((_, i) => i !== index));
    };

    // 항목 추가
    const handleAdd = () => {
        if (!onComparisonsChange) return;
        onComparisonsChange([
            ...comparisons,
            {
                category: '새 카테고리',
                us_item: '우리 제품 장점 (O)',
                others_item: '경쟁사 단점 (X)'
            }
        ]);
    };

    if (comparisons.length === 0) {
        return (
            <div className="p-8 bg-white/[0.02] rounded-2xl border border-dashed border-white/10 text-center">
                <Shield className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500 text-sm">비교 데이터가 없습니다</p>
                {isEditable && (
                    <button
                        onClick={handleAdd}
                        className="mt-3 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold
              hover:bg-indigo-500/30 transition-colors"
                    >
                        + 비교 항목 추가
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* 헤더 */}
            {!isExporting && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl 
              flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white tracking-tight">VS 비교분석</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Dynamic Comparison</p>
                        </div>
                    </div>
                    {isEditable && (
                        <button
                            onClick={handleAdd}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg 
                text-xs font-medium text-gray-400 transition-colors"
                        >
                            + 추가
                        </button>
                    )}
                </div>
            )}

            {/* 비교표 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 
        border border-white/10 shadow-2xl">

                {/* 테이블 헤더 */}
                <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
                    <div className="p-4 text-center">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">비교 항목</span>
                    </div>
                    <div className="p-4 text-center border-x border-white/5 bg-emerald-500/5">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">우리 제품</span>
                        </div>
                    </div>
                    <div className="p-4 text-center bg-red-500/5">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center">
                                <X className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">일반 제품</span>
                        </div>
                    </div>
                </div>

                {/* 비교 행들 */}
                <div className="divide-y divide-white/5">
                    {comparisons.map((item, index) => (
                        <div
                            key={index}
                            className={`grid grid-cols-3 group transition-colors ${isEditable ? 'hover:bg-white/[0.02]' : ''
                                }`}
                        >
                            {/* 카테고리 */}
                            <div className="p-4 flex items-center justify-center">
                                {isEditable ? (
                                    <input
                                        type="text"
                                        value={item.category}
                                        onChange={(e) => handleTextChange(index, 'category', e.target.value)}
                                        className="w-full text-center bg-transparent text-gray-300 text-sm font-bold 
                      focus:outline-none focus:bg-white/5 rounded px-2 py-1"
                                    />
                                ) : (
                                    <span className="text-gray-300 text-sm font-bold text-center">{item.category}</span>
                                )}
                            </div>

                            {/* 우리 제품 (장점) */}
                            <div className="p-4 border-x border-white/5 bg-emerald-500/[0.03] relative">
                                <div className="flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    {isEditable ? (
                                        <textarea
                                            value={item.us_item}
                                            onChange={(e) => handleTextChange(index, 'us_item', e.target.value)}
                                            className="w-full bg-transparent text-emerald-300 text-xs leading-relaxed 
                        focus:outline-none focus:bg-white/5 rounded px-1 py-0.5 resize-none"
                                            rows={2}
                                        />
                                    ) : (
                                        <span className="text-emerald-300 text-xs leading-relaxed">{item.us_item}</span>
                                    )}
                                </div>
                            </div>

                            {/* 경쟁사 제품 (단점) */}
                            <div className="p-4 bg-red-500/[0.03] relative">
                                <div className="flex items-start gap-2">
                                    <Zap className="w-4 h-4 text-red-400/60 flex-shrink-0 mt-0.5" />
                                    {isEditable ? (
                                        <textarea
                                            value={item.others_item}
                                            onChange={(e) => handleTextChange(index, 'others_item', e.target.value)}
                                            className="w-full bg-transparent text-red-300/80 text-xs leading-relaxed 
                        focus:outline-none focus:bg-white/5 rounded px-1 py-0.5 resize-none"
                                            rows={2}
                                        />
                                    ) : (
                                        <span className="text-red-300/80 text-xs leading-relaxed">{item.others_item}</span>
                                    )}
                                </div>

                                {/* 삭제 버튼 */}
                                {isEditable && !isExporting && (
                                    <button
                                        onClick={() => handleRemove(index)}
                                        className="absolute top-2 right-2 w-5 h-5 bg-red-500/20 rounded-full 
                      flex items-center justify-center opacity-0 group-hover:opacity-100 
                      hover:bg-red-500/40 transition-all"
                                    >
                                        <X className="w-3 h-3 text-red-400" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 하단 강조 배너 */}
                <div className="p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 
          border-t border-white/10">
                    <p className="text-center text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                        ✨ AI 기반 품질 비교 분석 ✨
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VsBlock;
