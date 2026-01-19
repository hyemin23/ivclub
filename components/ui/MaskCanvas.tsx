
import React, { useRef, useEffect, useState } from 'react';
import { Brush, Eraser, Undo, RefreshCw } from 'lucide-react';

interface MaskCanvasProps {
    imageSrc: string;
    onMaskChange: (maskDataUrl: string | null) => void;
    className?: string;
}

export const MaskCanvas: React.FC<MaskCanvasProps> = ({ imageSrc, onMaskChange, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const [mode, setMode] = useState<'brush' | 'eraser'>('brush');
    const [hasDrawn, setHasDrawn] = useState(false);

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = imageSrc;
        img.crossOrigin = "anonymous";

        img.onload = () => {
            // Fit canvas to container while maintaining aspect ratio
            const { width, height } = container.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;

            // Draw background image (scaled to fit)
            // Actually, we want to draw the mask separate from the image? 
            // No, for UI we overlay. The "Mask" export must be black/white.
            // So we track the mask in a separate offscreen canvas or just derive it?
            // Better strategy: 
            // 1. Display Image as <img> or background.
            // 2. Canvas is transparent on top.
            // 3. User draws semi-transparent purple.
            // 4. When exporting, we create a temporary canvas, draw black bg, draw white strokes matching the visible strokes.
            // To achieve 4, we need to store stroke paths or just draw on a "mask-only" canvas that is displayed with opacity?
            // Let's rely on extracting the layer.

            // Simpler: The displayed canvas IS the mask. 
            // We clear it.
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };
    }, [imageSrc]);

    // Handle Resize
    useEffect(() => {
        // Optional: Handle window resize to reset canvas pixels
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = mode === 'brush' ? 'rgba(168, 85, 247, 0.7)' : 'rgba(0,0,0,1)'; // Purple (Display)
        if (mode === 'eraser') ctx.globalCompositeOperation = 'destination-out';
        else ctx.globalCompositeOperation = 'source-over';

        // Draw a single dot
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault(); // Prevent scrolling on touch
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.closePath();
        exportMask();
    };

    const exportMask = () => {
        if (!canvasRef.current) return;

        // Create an offscreen canvas to generate the actual Binary Mask (Black/White)
        const offCanvas = document.createElement('canvas');
        offCanvas.width = canvasRef.current.width;
        offCanvas.height = canvasRef.current.height;
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) return;

        // Fill Black
        offCtx.fillStyle = '#000000';
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

        // Draw the visible strokes as White
        // Since we can't easily iterate strokes from the pixel data of the UI canvas (which is purple transparent),
        // We basically need to use the UI canvas as a source, but "threshold" the alpha?
        // Or just draw the UI canvas on top of black using a composite operation that turns color to white?
        // Let's try: draw UI canvas. Use globalCompositeOperation?

        offCtx.drawImage(canvasRef.current, 0, 0);

        // Now iterate pixels and turn any non-black pixel to white?
        // That's heavy. 
        // Optimization: Since the UI canvas is transparent everywhere except strokes, 
        // We can just rely on non-transparent pixels.
        // Use `globalCompositeOperation = 'source-in'` with white fill?
        // Better: 
        // 1. Fill Black.
        // 2. Draw the Image (Canvas) on top. 
        // 3. Scan pixels: If alpha > 0, make it White.

        const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // If pixel has color (from the purple stroke), make it White (255,255,255)
            // The background was black (0,0,0,255). 
            // The stroke was (168, 85, 247, 0.7).
            // So R, G, B will be mixed.
            // If we see any non-blackness that matches the brush?
            // Actually simpler: 
            // The "offCtx" has a black background. We drew the purple strokes on it.
            // So any pixel that is NOT pure black is part of the mask.
            if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
                data[i + 3] = 255; // Full opacity
            }
        }
        offCtx.putImageData(imageData, 0, 0);

        onMaskChange(offCanvas.toDataURL('image/png'));
    };

    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        setHasDrawn(false);
        onMaskChange(null);
    };

    return (
        <div className={`relative w-full h-full group ${className}`} ref={containerRef}>
            {/* Background Image */}
            <img src={imageSrc} className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" alt="target" />

            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />

            {/* Floating Toolbar (Visible on Hover/Active) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-white/20 p-2 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={() => setMode('brush')}
                    className={`p-2 rounded-full transition-colors ${mode === 'brush' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="브러쉬"
                >
                    <Brush className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setMode('eraser')}
                    className={`p-2 rounded-full transition-colors ${mode === 'eraser' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="지우개"
                >
                    <Eraser className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <input
                    type="range"
                    min="5"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-16 accent-indigo-500"
                    title="브러쉬 크기"
                />
                <div className="w-px h-4 bg-white/20 mx-1" />
                <button
                    onClick={clearCanvas}
                    className="p-2 rounded-full text-red-400 hover:bg-white/10 transition-colors"
                    title="초기화"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/20">
                    <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-bold animate-pulse">
                        👆 교체할 영역을 색칠해주세요
                    </div>
                </div>
            )}
        </div>
    );
};
