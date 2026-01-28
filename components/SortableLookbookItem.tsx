import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import DownloadableSection from './DownloadableSection';
// import { useStore } from '../store';

import { LookbookImage } from '../types';

interface SortableLookbookItemProps {
    img: LookbookImage;
    idx: number;
    isExporting: boolean;
    appState: {
        name: string;
        lookbookImages: LookbookImage[];
        moveLookbookImage: (id: string, direction: 'up' | 'down') => void;
    };
    onDelete: (id: string) => void;
}

export const SortableLookbookItem = ({
    img,
    idx,
    isExporting,
    appState,
    onDelete
}: SortableLookbookItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: img.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const
    };

    return (
        <div ref={setNodeRef} style={style}>
            <DownloadableSection fileName={`lookbook_${idx + 1}_${appState.name}`}>
                <div className="relative group">
                    <img src={img.url} className="w-full block" alt={`Detail ${idx}`} />
                    {!isExporting && (
                        <div className="absolute top-4 left-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            {/* Drag Handle */}
                            <button
                                {...attributes}
                                {...listeners}
                                className="p-2 bg-white/90 shadow-lg text-slate-700 hover:text-indigo-600 rounded-lg h-[34px] flex items-center justify-center cursor-grab active:cursor-grabbing border border-slate-200"
                            >
                                <GripVertical className="w-4 h-4" />
                            </button>

                            {/* Existing Controls */}
                            <button
                                onClick={() => appState.moveLookbookImage(img.id, 'up')}
                                disabled={idx === 0}
                                className="p-2 bg-white/90 shadow-lg text-slate-700 hover:text-indigo-600 rounded-lg disabled:opacity-50 hover:scale-110 transition-all border border-slate-200"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => appState.moveLookbookImage(img.id, 'down')}
                                disabled={idx === appState.lookbookImages.length - 1}
                                className="p-2 bg-white/90 shadow-lg text-slate-700 hover:text-indigo-600 rounded-lg disabled:opacity-50 hover:scale-110 transition-all border border-slate-200"
                            >
                                <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(img.id)}
                                className="p-2 bg-red-500 shadow-lg text-white hover:bg-red-600 rounded-lg hover:scale-110 transition-all border border-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="h-12 bg-white" />
            </DownloadableSection>
        </div>
    );
};
