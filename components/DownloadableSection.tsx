import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { domToPng } from 'modern-screenshot';

interface DownloadableSectionProps {
    children: React.ReactNode;
    fileName: string;
    className?: string; // Wrapper class
}

const DownloadableSection: React.FC<DownloadableSectionProps> = ({ children, fileName, className = '' }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering parent click events if any
        if (!contentRef.current) return;

        setIsDownloading(true);
        try {
            const dataUrl = await domToPng(contentRef.current, {
                scale: 2,
                backgroundColor: '#ffffff'
            });
            
            const link = document.createElement('a');
            link.download = `${fileName}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Section download failed:', err);
            alert('다운로드 중 오류가 발생했습니다.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div
            className={`relative group ${className}`}
        >
            {/* Capture Target */}
            <div ref={contentRef}>
                {children}
            </div>

            {/* Download Button Overlay - Visible on Group Hover */}
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg border border-slate-200"
                title="이 섹션만 다운로드"
            >
                {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                ) : (
                    <Download className="w-4 h-4 text-slate-600 hover:text-indigo-600" />
                )}
            </button>

            {/* Outline on Hover to indicate downloadable area */}
            <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/30 pointer-events-none transition-colors duration-200" />
        </div>
    );
};

export default DownloadableSection;
