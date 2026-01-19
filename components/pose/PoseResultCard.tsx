
import React from 'react';
import { Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface PoseResultCardProps {
    url: string;
    index: number;
    baseImage: string | null;
    onSelect: (url: string) => void;
}

export const PoseResultCard: React.FC<PoseResultCardProps> = ({
    url, index, baseImage, onSelect
}) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl transition-all hover:border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-0.5">COMPLETED</p>
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">생성된 포즈 #{index + 1}</h4>
                </div>
                <div className="text-[9px] text-gray-500 font-mono">
                    {new Date().toLocaleTimeString()}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Original Image */}
                <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">ORIGINAL</p>
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-white/5 relative group cursor-zoom-in" onClick={() => baseImage && onSelect(baseImage)}>
                        {baseImage && <img src={baseImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Original" />}
                    </div>
                </div>

                {/* Generated Image */}
                <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-purple-500 uppercase tracking-widest ml-1">GENERATED</p>
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-purple-500/20 relative group cursor-zoom-in shadow-lg shadow-purple-900/10" onClick={() => onSelect(url)}>
                        <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Generated" />
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-500 text-white text-[8px] font-black uppercase rounded tracking-wider">New</div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <a
                    href={url}
                    download={`pose_${index + 1}.png`}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Download className="w-3 h-3" />
                    저장
                </a>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(url);
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
