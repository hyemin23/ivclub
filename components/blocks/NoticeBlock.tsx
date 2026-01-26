
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload } from 'lucide-react';

interface NoticeBlockProps {
    content: {
        imageUrl?: string | null;
        text?: string;
    };
    isExporting: boolean;
    onUpdate?: (newContent: any) => void;
}

const NoticeBlock: React.FC<NoticeBlockProps> = ({ content, isExporting, onUpdate }) => {
    // dnd-kit hooks
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: `notice-${Math.random()}` }); // Note: Ideally ID should be passed in props for sorting to work perfectly

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpdate) {
            const imageUrl = URL.createObjectURL(file);
            onUpdate({ ...content, imageUrl });
        }
    };

    // If exporting, render clean image without controls
    if (isExporting) {
        if (!content.imageUrl) return null; // Don't render empty blocks on export
        return (
            <div className="w-full">
                <img src={content.imageUrl} alt="Notice" className="w-full h-auto block" />
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-full relative group min-h-[100px] bg-white border-b border-gray-100 hover:border-blue-500 transition-colors"
        >
            {/* Drag Handle Overlay */}
            <div
                {...attributes}
                {...listeners}
                className="absolute inset-0 z-10 cursor-move opacity-0 group-hover:opacity-100 bg-blue-500/5 transition-opacity"
            />

            {content.imageUrl ? (
                <div className="relative">
                    <img src={content.imageUrl} alt="Notice" className="w-full h-auto block" />

                    {/* Control for changing image */}
                    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="p-2 bg-black/50 hover:bg-black/70 rounded-full cursor-pointer text-white flex items-center justify-center">
                            <Upload className="w-4 h-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                        </label>
                    </div>
                </div>
            ) : (
                <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 m-4 rounded-xl">
                    <p className="text-gray-400 text-sm font-bold mb-2">이미지 없음</p>
                    <label className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-50 z-20">
                        이미지 업로드
                        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    </label>
                </div>
            )}
        </div>
    );
};

export default NoticeBlock;
