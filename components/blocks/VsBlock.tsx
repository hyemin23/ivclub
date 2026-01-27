
import React from 'react';
import { Check, X } from 'lucide-react';
import { VsComparisonItem } from '@/types'; // Use global type

interface VsBlockProps {
    // Legacy support (optional)
    content?: {
        title?: string;
        items?: { label: string; good: boolean }[]; // Keep legacy struct if needed or deprecate
    };
    // Proper Props from Store/EditorCanvas
    comparisons?: VsComparisonItem[];
    onComparisonsChange?: (items: VsComparisonItem[]) => void;
    isEditable?: boolean;
}

const VsBlock: React.FC<VsBlockProps> = ({ content, comparisons, onComparisonsChange, isEditable }) => {
    const title = content?.title || "Why Choose Us?";

    // Normalize data for display
    // If 'comparisons' is provided (V2), use it. Else fallback to content.items (Legacy V1)
    const hasComparisons = comparisons && comparisons.length > 0;

    return (
        <div className="w-full py-10 px-6 bg-white border-b-8 border-gray-100">
            <h2 className="text-2xl font-black text-center mb-8 uppercase tracking-tighter">{title}</h2>
            <div className="flex gap-4">
                {/* UP - Our Product */}
                <div className="flex-1 bg-blue-50 border-2 border-blue-500 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-br-lg">Ours</div>
                    <div className="mt-6 space-y-3">
                        {hasComparisons ? (
                            comparisons?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-xs text-blue-600 mr-1">[{item.category}]</span>
                                        {item.us_item}
                                    </div>
                                </div>
                            ))
                        ) : (
                            content?.items?.filter(i => i.good).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    {item.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* DOWN - Others */}
                <div className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl p-4 relative overflow-hidden opacity-70">
                    <div className="absolute top-0 left-0 bg-gray-400 text-white px-3 py-1 text-xs font-bold rounded-br-lg">Others</div>
                    <div className="mt-6 space-y-3">
                        {hasComparisons ? (
                            comparisons?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                        <X className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-400 mr-1">[{item.category}]</span>
                                        {item.others_item}
                                    </div>
                                </div>
                            ))
                        ) : (
                            content?.items?.filter(i => !i.good).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                        <X className="w-3 h-3 text-white" />
                                    </div>
                                    {item.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VsBlock;
