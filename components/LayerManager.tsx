import React from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { GripVertical, Trash2, Layers } from 'lucide-react';

interface SortableItemProps {
  id: string;
  url: string;
  onDelete: (id: string) => void;
}

const SortableItem = ({ id, url, onDelete }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-white/5 hover:border-indigo-500/30 group transition-all"
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab hover:text-indigo-400 text-slate-500 touch-none flex items-center justify-center h-8 w-6"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="w-10 h-10 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-white/10 relative">
        <img src={url} className="w-full h-full object-cover" alt="thumb" />
      </div>
      
      <div className="flex-1 min-w-0">
         <p className="text-[10px] text-slate-400 truncate font-bold">Image Layer</p>
         <p className="text-[8px] text-slate-600 font-mono truncate">#{id.slice(0, 4)}</p>
      </div>

      <button 
        onClick={() => onDelete(id)}
        className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

interface LayerManagerProps {
    onDelete: (id: string) => void;
    className?: string; // Allow external styling
}

export const LayerManager: React.FC<LayerManagerProps> = ({ onDelete, className = '' }) => {
  const store = useStore();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
       const oldIndex = store.lookbookImages.findIndex((item) => item.id === active.id);
       const newIndex = store.lookbookImages.findIndex((item) => item.id === over.id);
       store.reorderLookbookImages(oldIndex, newIndex);
    }
  };

  if (store.lookbookImages.length === 0) return null;

  return (
    <div className={`bg-slate-950/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden w-[280px] max-h-[400px] ${className}`}>
        {/* Header */}
        <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-white/5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">레이어 관리자 ({store.lookbookImages.length})</span>
        </div>

        {/* Scrollable List with DnD */}
        <div className="overflow-y-auto custom-scrollbar p-3 space-y-2">
            <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            >
            <SortableContext 
                items={store.lookbookImages.map(img => img.id)}
                strategy={verticalListSortingStrategy}
            >
                {store.lookbookImages.map((img) => (
                    <SortableItem key={img.id} id={img.id} url={img.url} onDelete={onDelete} />
                ))}
            </SortableContext>
            </DndContext>
        </div>
    </div>
  );
};
