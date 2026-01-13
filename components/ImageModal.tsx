"use client";

import React, { useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageModalProps {
  image: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (image) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 backdrop-blur-3xl"
      onClick={onClose}
    >
      {/* Close Button - Intuitive Red Design */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center transition-all hover:rotate-90 hover:scale-110 z-50 group"
      >
        <X className="w-6 h-6" />
        <span className="sr-only">닫기</span>
      </button>

      {/* Action Buttons (Download/Share) */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 flex gap-3 z-50" onClick={(e) => e.stopPropagation()}>
         <a 
            href={image} 
            download="image.png"
            className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 backdrop-blur-md border border-white/10"
            title="다운로드"
         >
            <Download className="w-5 h-5" />
         </a>
         <button 
           onClick={() => {
              navigator.clipboard.writeText(image);
              toast.success('이미지 주소가 복사되었습니다.');
           }}
           className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 backdrop-blur-md border border-white/10"
           title="복사하기"
         >
            <Share2 className="w-5 h-5" />
         </button>
      </div>

      <img 
        src={image} 
        alt="Zoomed View"
        className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 rounded-lg select-none"
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
};
