"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Eraser, Sparkles, Undo, Download, Loader2, Brush } from 'lucide-react';
import { magicEraser } from '../services/imageService';

const MagicEraser: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Load image into canvas for display reference size
    useEffect(() => {
        if (image && canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = image;
            img.onload = () => {
                // Resize canvas to match display size while maintaining aspect ratio
                // For simplicity, we limit max width to container width
                const maxWidth = containerRef.current?.clientWidth || 500;
                const scale = maxWidth / img.width;
                const width = maxWidth;
                const height = img.height * scale;

                canvas.width = width;
                canvas.height = height;

                // We don't draw the image on the canvas itself (it's the mask layer)
                // We show the image via <img> tag behind the canvas
                ctx?.clearRect(0, 0, width, height);
            };
        }
    }, [image]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        ctx?.beginPath(); // Reset path
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Semi-transparent red

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setImage(e.target?.result as string);
        reader.readAsDataURL(file);
        setResultImage(null);
    };

    const clearMask = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleErase = async () => {
        if (!image || isGenerating) return;

        // 1. Get Mask Data URL
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create a temporary canvas to generate the pure black/white mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return;

        // Fill black (background)
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        // Draw the red stokes from original canvas as White
        // We can't simply copy, we need to redraw or use image processing.
        // Simplest way: Since we only drew on the 'canvasRef', we can use it as source
        // effectively, non-transparent pixels = white.

        maskCtx.drawImage(canvas, 0, 0);
        // Use composite operation to turn non-transparent pixels to white?
        // Actually, let's just use the current canvas as the 'mask hint' directly if Gemini accepts color overlay.
        // But for robust "mask", usually B/W is best.
        // Let's iterate pixels to convert Red to White, Transparent to Black.
        const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        // Note: currently maskCtx has black background + copy of Red strokes.
        // The Red strokes (rgba(255,0,0,0.5)) blended with black.
        // Let's just trust Gemini to understand "The red area is the mask".
        // It's safer to send the Red Overlay Image.

        const maskDataUrl = canvas.toDataURL('image/png');

        try {
            setIsGenerating(true);
            const generatedUrl = await magicEraser(image, maskDataUrl);
            setResultImage(generatedUrl);
        } catch (e) {
            console.error(e);
            alert('생성 중 오류가 발생했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-6" ref={containerRef}>
            <div className="flex items-center gap-2 mb-4">
                <Eraser className="w-5 h-5 text-indigo-400" />
                <div>
                    <h3 className="text-sm font-bold text-white">AI 매직 이레이저</h3>
                    <p className="text-[10px] text-slate-400">사진 속 불필요한 글자나 사물을 지워보세요.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Editor Area */}
                <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 min-h-[300px] flex items-center justify-center group">
                        {image ? (
                            <>
                                <img src={image} className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" alt="Original" />
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    className="relative z-10 cursor-crosshair touch-none"
                                />
                            </>
                        ) : (
                            <div className="text-center p-8">
                                <Eraser className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                <p className="text-xs text-slate-500 mb-4">지우고 싶은 이미지를 업로드하세요</p>
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-indigo-400 cursor-pointer transition-colors">
                                    <Upload className="w-3.5 h-3.5" />
                                    이미지 선택
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                            </div>
                        )}
                    </div>

                    {image && (
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                    <Brush className="w-3.5 h-3.5" />
                                    브러쉬 크기
                                </span>
                                <span className="text-xs text-indigo-400">{brushSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="5" max="50"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                            />

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={clearMask}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Undo className="w-3.5 h-3.5" />
                                    초기화
                                </button>
                                <button
                                    onClick={handleErase}
                                    disabled={isGenerating}
                                    className="flex-[2] py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    AI 지우개 실행
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Result Area */}
                <div className="flex flex-col h-full">
                    <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                        {resultImage ? (
                            <img src={resultImage} className="max-w-full max-h-full object-contain" alt="Result" />
                        ) : (
                            <div className="text-center text-slate-600">
                                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <span className="text-xs opacity-50">결과가 여기에 표시됩니다</span>
                            </div>
                        )}
                    </div>
                    {resultImage && (
                        <button
                            onClick={() => {
                                const a = document.createElement('a');
                                a.href = resultImage;
                                a.download = 'magic-eraser-result.png';
                                a.click();
                            }}
                            className="mt-4 w-full py-3 bg-white text-black hover:bg-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            이미지 다운로드
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MagicEraser;
