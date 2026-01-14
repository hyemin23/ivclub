import React from 'react';
import SizeGuideSystem from '../SizeGuideSystem';

interface SizeBlockProps {
    content: any;
    isExporting: boolean;
}

export default function SizeBlock({ content, isExporting }: SizeBlockProps) {
    // The content prop might contain category info, but SizeGuideSystem primarily interacts with the store.
    // We pass readOnly based on isExporting.
    return (
        <div className="py-24 px-6 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2 justify-center mb-12">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-black">SIZE GUIDE</h2>
            </div>
            <SizeGuideSystem readOnly={isExporting} />
        </div>
    );
}
