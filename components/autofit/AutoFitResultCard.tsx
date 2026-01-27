
import React from 'react';
import { Download, Share2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { VariationResult, CameraAngle } from '../../types';
import { getAngleLabel } from '../../services/autofit/autofit.config';

interface ResultCardProps {
    res: VariationResult;
    index: number;
    originalImage: string | null;
    onSelect: (url: string) => void;
}

export const AutoFitResultCard: React.FC<ResultCardProps> = ({
    res,
    index,
    originalImage,
    onSelect
}) => {
    if (res.status === 'loading') {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] animate-pulse">
                <RefreshCw className="w-8 h-8 text-green-500 animate-spin mb-4" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{getAngleLabel(res.angle)} 생성 중...</p>
            </div>
        );
    }

    if (res.status === 'error') {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
                <X className="w-8 h-8 text-red-500 mb-4" />
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">생성 실패</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl transition-all hover:border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-0.5">COMPLETED</p>
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">피팅컷 #{index + 1} - {getAngleLabel(res.angle)}</h4>
                </div>
                <div className="text-[9px] text-gray-500 font-mono">
                    {new Date().toLocaleTimeString()}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Original Image */}
                <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">ORIGINAL</p>
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-white/5 relative group cursor-zoom-in" onClick={() => originalImage && onSelect(originalImage)}>
                        {originalImage && <img src={originalImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Original" />}
                    </div>
                </div>

                {/* Generated Image */}
                <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest ml-1">GENERATED</p>
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-green-500/20 relative group cursor-zoom-in shadow-lg shadow-green-900/10" onClick={() => onSelect(res.url)}>
                        <img src={res.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Generated" />
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-green-500 text-black text-[8px] font-black uppercase rounded tracking-wider">New</div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-bold text-white border border-white/10">
                            {getAngleLabel(res.angle)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <a
                    href={res.url}
                    download={`auto_fit_${res.angle}_${index}.png`}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Download className="w-3 h-3" />
                    저장
                </a>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(res.url);
                        toast.success('이미지 주소가 복사되었습니다.');
                    }}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/5"
                >
                    <Share2 className="w-3 h-3" />
                    공유
                </button>
            </div>
        </div>
    );
};
