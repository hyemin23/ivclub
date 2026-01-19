
import React from 'react';
import { ImageIcon, Sparkles, X, UserCircle } from 'lucide-react';
import { FaceMode } from '../../types';

interface PoseUploaderProps {
    baseImage: string | null;
    refImage: string | null;
    faceRefImage: string | null;
    faceMode: FaceMode;
    setBaseImage: (url: string | null) => void;
    setRefImage: (url: string | null) => void;
    handleImageUpload: (type: 'base' | 'ref' | 'face', e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PoseUploader: React.FC<PoseUploaderProps> = ({
    baseImage, refImage, faceRefImage, faceMode, setBaseImage, setRefImage, handleImageUpload
}) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">원본 이미지 (필수)</label>
                    <div
                        onClick={() => document.getElementById('pc-base-upload')?.click()}
                        className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${baseImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
                            }`}
                    >
                        {baseImage ? (
                            <img src={baseImage} className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center p-2 opacity-40">
                                <ImageIcon className="w-8 h-8 mx-auto mb-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">상품 업로드</span>
                            </div>
                        )}
                        <input id="pc-base-upload" type="file" className="hidden" onChange={(e) => handleImageUpload('base', e)} />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">참고 포즈 (선택)</label>
                    <div
                        onClick={() => document.getElementById('pc-ref-upload')?.click()}
                        className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${refImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
                            }`}
                    >
                        {refImage ? (
                            <>
                                <img src={refImage} className="w-full h-full object-contain" />
                                <button onClick={(e) => { e.stopPropagation(); setRefImage(null); }} className="absolute top-4 right-4 p-2 bg-black/80 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-4 h-4 text-white" /></button>
                            </>
                        ) : (
                            <div className="text-center p-2 opacity-20">
                                <Sparkles className="w-8 h-8 mx-auto mb-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">포즈 업로드</span>
                            </div>
                        )}
                        <input id="pc-ref-upload" type="file" className="hidden" onChange={(e) => handleImageUpload('ref', e)} />
                    </div>
                </div>
            </div>

            {faceMode === 'ON' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 p-6 bg-white/5 rounded-2xl border border-white/10">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">얼굴 참조 이미지 (Face Reference)</label>
                    <div onClick={() => document.getElementById('pc-face-upload')?.click()} className="cursor-pointer flex items-center gap-4 bg-black p-4 rounded-xl border border-white/10 hover:border-white/30 transition-all">
                        {faceRefImage ? (
                            <img src={faceRefImage} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><UserCircle className="w-5 h-5 text-gray-500" /></div>
                        )}
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-300">{faceRefImage ? "참조 이미지 설정됨" : "얼굴 사진 업로드"}</p>
                            <p className="text-[9px] text-gray-600">ID 보존을 위해 얼굴이 선명한 사진을 사용하세요</p>
                        </div>
                        <input id="pc-face-upload" type="file" className="hidden" onChange={(e) => handleImageUpload('face', e)} />
                    </div>
                </div>
            )}
        </div>
    );
};
