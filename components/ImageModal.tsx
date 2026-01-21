"use client";

import React, { useEffect, useState, useRef } from 'react';
import { X, Download, Share2, Wand2, Undo2, Eraser, Brush, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { magicEraser } from '../services/imageService';

interface ImageModalProps {
  image: string | null;
  onClose: () => void;
  onUpdate?: (newImageUrl: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface DrawPath {
  points: Point[];
  size: number;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [prompt, setPrompt] = useState("");

  // Canvas & Drawing State
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reset state when image changes
  useEffect(() => {
    setPaths([]);
    setIsEditing(false);
    setPrompt("");
  }, [image]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') handleUndo();
    };
    if (image) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [image, onClose, isGenerating, paths]); // Added deps for undo shortcut

  // Synchronize Canvas Size with Image
  useEffect(() => {
    if (!isEditing || !imgRef.current || !canvasRef.current) return;

    const syncCanvas = () => {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas) return;

      const rect = img.getBoundingClientRect();

      // Set visual size matches the displayed image exactly
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Set internal resolution to match natural image size (for accurate masking)
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        redrawCanvas(); // Redraw if resized
      }
    };

    syncCanvas();
    window.addEventListener('resize', syncCanvas);
    return () => window.removeEventListener('resize', syncCanvas);
  }, [isEditing, image]);

  // Redraw Canvas (Visual Feedback - Red Mask)
  useEffect(() => {
    if (isEditing) redrawCanvas();
  }, [paths, currentPath, isEditing]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing paths
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; // Translucent Red for Visibility

    [...paths, { points: currentPath, size: brushSize }].forEach(path => {
      if (path.points.length < 1) return;
      ctx.lineWidth = path.size;
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      path.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  };

  // Drawing Handlers
  const getCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return null;

    const rect = canvas.getBoundingClientRect(); // Visual rect
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    // Map screen coords to natural image coords
    const x = (clientX - rect.left) * (img.naturalWidth / rect.width);
    const y = (clientY - rect.top) * (img.naturalHeight / rect.height);
    return { x, y };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditing) return;
    // e.preventDefault(); // Prevent scroll on touch?
    const p = getCoords(e);
    if (p) {
      setIsDrawing(true);
      setCurrentPath([p]);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditing || !isDrawing) return;
    const p = getCoords(e);
    if (p) {
      setCurrentPath(prev => [...prev, p]);
    }
  };

  const handleEnd = () => {
    if (!isEditing || !isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 0) {
      setPaths(prev => [...prev, { points: currentPath, size: brushSize }]);
      setCurrentPath([]);
    }
  };

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (confirm("마스크를 모두 지우시겠습니까?")) {
      setPaths([]);
    }
  };

  // Mask Generation & API Call
  const handleGenerate = async () => {
    if (paths.length === 0) {
      toast.error("수정할 영역을 칠해주세요!");
      return;
    }
    if (!image) return;

    try {
      setIsGenerating(true);

      // 1. Generate Binary Mask (Black BG, White FG)
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = imgRef.current!.naturalWidth;
      maskCanvas.height = imgRef.current!.naturalHeight;
      const ctx = maskCanvas.getContext('2d')!;

      // Fill Black (Unmasked)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

      // Draw White Paths (Masked)
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'white';

      paths.forEach(path => {
        ctx.lineWidth = path.size;
        ctx.beginPath();
        if (path.points.length > 0) {
          ctx.moveTo(path.points[0].x, path.points[0].y);
          path.points.forEach(p => ctx.lineTo(p.x, p.y));
        }
        ctx.stroke();
      });

      const maskDataUrl = maskCanvas.toDataURL('image/png');

      // 2. Call API
      const resultUrl = await magicEraser(image, maskDataUrl, prompt);

      // 3. Update Image
      if (onUpdate) {
        onUpdate(resultUrl);
        toast.success("수정이 완료되었습니다!");
        setIsEditing(false); // Make sure to exit edit mode or reset paths?
        setPaths([]); // Clear mask after success
      } else {
        toast.error("이미지 업데이트 함수가 연결되지 않았습니다.");
      }

    } catch (e: any) {
      toast.error(`수정 실패: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };


  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 backdrop-blur-3xl"
      onClick={!isGenerating ? onClose : undefined}
    >
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 z-[200] bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm cursor-wait">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <div className="text-white font-bold text-lg animate-pulse">Magic Eraser 작동 중... ✨</div>
          <div className="text-white/70 text-sm mt-2">잠시만 기다려주세요</div>
        </div>
      )}

      {/* Top Right Controls (Close / Previous Actions) */}
      {!isEditing && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center transition-all hover:rotate-90 hover:scale-110 z-50 group"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute top-6 left-6 md:top-10 md:left-10 flex gap-3 z-50" onClick={(e) => e.stopPropagation()}>
            <a
              href={image}
              download="image.png"
              className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 backdrop-blur-md border border-white/10"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText(image); toast.success('복사완료'); }}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 backdrop-blur-md border border-white/10"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Edit Mode Toggle */}
            {onUpdate && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-auto px-4 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg border border-white/10"
              >
                <Wand2 className="w-4 h-4" />
                <span className="text-sm font-bold">Magic Eraser</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Main Image Container */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          ref={imgRef}
          src={image}
          alt="Zoomed"
          className={`max-w-[90vw] max-h-[85vh] object-contain shadow-2xl rounded-lg select-none transition-all ${isEditing ? 'cursor-crosshair' : ''}`}
          draggable={false}
        />

        {/* Canvas Overlay */}
        {isEditing && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 touch-none cursor-crosshair"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        )}
      </div>

      {/* Edit Toolbar (Bottom) */}
      {isEditing && (
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-2xl z-[60] animate-in slide-in-from-bottom-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Brush Size */}
          <div className="flex flex-col gap-1 w-32">
            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
              <span>Brush Size</span>
              <span>{brushSize}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="w-px h-8 bg-white/10" />

          {/* Actions */}
          <button onClick={handleUndo} className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white" title="Undo">
            <Undo2 className="w-5 h-5" />
          </button>
          <button onClick={handleClear} className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white" title="Clear Mask">
            <Eraser className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-white/10" />

          {/* Prompt Input (Optional) */}
          <input
            type="text"
            placeholder="(Optional) Change to..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white w-40 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          {/* Generate & Cancel */}
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-2"
          >
            <Wand2 className="w-3 h-3" />
            수정하기
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
};
