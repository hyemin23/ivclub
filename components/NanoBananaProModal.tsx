import React, { useState } from 'react';
import { X, Sparkles, Wand2, Loader2, Download } from 'lucide-react';

interface NanoBananaProModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceImage: string | null;
    onComplete?: (enhancedUrl: string) => void;
}

const NanoBananaProModal: React.FC<NanoBananaProModalProps> = ({
    isOpen,
    onClose,
    sourceImage,
    onComplete
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [enhancedImage, setEnhancedImage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleEnhance = async () => {
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            // In a real app, this would be the enhanced image URL from API
            setEnhancedImage(sourceImage);
        }, 3000);
    };

    const handleApply = () => {
        if (enhancedImage && onComplete) {
            onComplete(enhancedImage);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white italic tracking-tighter">NANO BANANA PRO</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Premium Asset Enhancer</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>

                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] pointer-events-none" />
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="grid grid-cols-2 gap-8">
                        {/* Source */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Original Asset</span>
                            </div>
                            <div className="aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative">
                                {sourceImage ? (
                                    <img src={sourceImage} alt="Original" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
                                )}
                            </div>
                        </div>

                        {/* Result */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enhanced Asset</span>
                                {enhancedImage && (
                                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase">Upscaled 4K</span>
                                )}
                            </div>
                            <div className="aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
                                {isProcessing ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm absolute inset-0 z-10">
                                        <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-3" />
                                        <p className="text-xs font-bold text-orange-400 animate-pulse">Enhancing Details...</p>
                                    </div>
                                ) : enhancedImage ? (
                                    <img src={enhancedImage} alt="Enhanced" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 m-1 rounded-xl">
                                        <Wand2 className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-xs">Ready to Enhance</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        취소
                    </button>
                    {!enhancedImage ? (
                        <button
                            onClick={handleEnhance}
                            disabled={!sourceImage || isProcessing}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-xs font-bold 
                                hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
                        >
                            <Sparkles className="w-3 h-3" />
                            AI 화질 개선 시작
                        </button>
                    ) : (
                        <button
                            onClick={handleApply}
                            className="px-6 py-3 bg-white text-black rounded-xl text-xs font-bold 
                                hover:bg-gray-200 transition-all shadow-lg shadow-white/10 flex items-center gap-2"
                        >
                            <Download className="w-3 h-3" />
                            개선된 이미지 적용
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NanoBananaProModal;
