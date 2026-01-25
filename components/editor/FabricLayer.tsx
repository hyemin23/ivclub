
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric'; // v6 or v5
import { useStore } from '@/store';
import { DesignKeyword } from '@/types';
import { Download, RefreshCw, Type, Save } from 'lucide-react';

interface FabricLayerProps {
    width: number;
    height: number;
    imageUrl?: string;
    keywords?: DesignKeyword[];
    onSave?: (dataUrl: string) => void;
}

export const FabricLayer: React.FC<FabricLayerProps> = ({ width, height, imageUrl, keywords, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<any>(null); // Use any to avoid v5/v6 type conflicts temporarily
    const { mainImageUrl, designKeywords } = useStore();

    const targetImage = imageUrl || mainImageUrl;
    const targetKeywords = keywords || designKeywords;

    // Helper to add styled text
    const addStyledText = useCallback((canvas: any, dk: DesignKeyword) => {
        const x = (dk.x || 0.5) * width;
        const y = (dk.y || 0.5) * height;

        // Common Text Options
        const textOpts = {
            fontFamily: 'Pretendard, sans-serif',
            fontSize: 24,
            fontWeight: 'bold',
            fill: '#ffffff',
            originX: 'center' as const,
            originY: 'center' as const
        };

        if (dk.style === 'badge') {
            // Rect + Text
            const text = new fabric.Text(dk.keyword, { ...textOpts, fontSize: 16 });
            const rect = new fabric.Rect({
                width: text.width! + 24,
                height: text.height! + 12,
                fill: '#4f46e5', // Indigo 600
                rx: 20,
                ry: 20,
                originX: 'center',
                originY: 'center'
            });
            const group = new fabric.Group([rect, text], {
                left: x,
                top: y,
                selectable: true
            });
            canvas.add(group);
        } else if (dk.style === 'speech_bubble') {
            // Simple Bubble (Circle + Text)
            const text = new fabric.Text(dk.keyword, { ...textOpts, fill: '#000', fontSize: 14 });
            const circle = new fabric.Circle({
                radius: Math.max(text.width!, text.height!) / 1.5 + 10,
                fill: '#ffffff',
                stroke: '#000',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center'
            });
            const group = new fabric.Group([circle, text], {
                left: x,
                top: y,
                selectable: true
            });
            canvas.add(group);
        } else if (dk.style === 'arrow_text') {
            // Text with generic arrow emoji for now (simplest)
            const text = new fabric.Text(`← ${dk.keyword}`, {
                ...textOpts,
                fill: '#ef4444', // Red 500
                shadow: new fabric.Shadow({ color: 'white', blur: 2 })
            });
            canvas.add(text.set({ left: x, top: y }));
        } else {
            // Simple Text
            const text = new fabric.Text(dk.keyword, {
                ...textOpts,
                shadow: new fabric.Shadow({ color: 'black', blur: 4, offsetX: 2, offsetY: 2 })
            });
            canvas.add(text.set({ left: x, top: y }));
        }
    }, [width, height]);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || !targetImage) return;

        // Dispose previous canvas if exists
        if (fabricCanvas) {
            fabricCanvas.dispose();
        }

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: width,
            height: height,
            backgroundColor: '#f3f4f6'
        });

        // Load Background Image
        // Load Background Image
        fabric.Image.fromURL(targetImage, { crossOrigin: 'anonymous' }).then((img: any) => {
            if (!img) return;

            // Scale image to cover canvas (Contain logic)
            const scale = Math.min(width / img.width!, height / img.height!);
            img.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                left: width / 2,
                top: height / 2,
                selectable: false, // Background shouldn't move
                evented: false
            });

            canvas.add(img);
            (canvas as any).sendObjectToBack(img);
        });

        setFabricCanvas(canvas);

        return () => {
            // Cleanup handled by ref change
            // canvas.dispose(); 
            // Note: React 18 strict mode + fabric dispose can be tricky.
        };
    }, [targetImage, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

    // Add Design Keywords
    useEffect(() => {
        if (!fabricCanvas || !targetKeywords || targetKeywords.length === 0) return;

        // Remove existing text objects (keep images/bg)
        fabricCanvas.getObjects().forEach((obj: any) => {
            if (obj.type === 'text' || obj.type === 'group' || obj.type === 'i-text') {
                // fabricCanvas.remove(obj);
                // Careful not to remove background image we added as object
            }
        });

        // Actually, for "Auto Layout", we might want to clear and re-add.
        // But if user edited, we don't want to overwrite.
        // Let's only add if canvas is "empty" of design elements?
        // For V0, just add them.

        targetKeywords.forEach((dk: DesignKeyword) => {
            // Check if already added? No simple ID check in Fabric unless we set it.
            addStyledText(fabricCanvas, dk);
        });

        fabricCanvas.renderAll();
    }, [fabricCanvas, targetKeywords, addStyledText]);



    const handleDownload = () => {
        if (!fabricCanvas) return;
        const dataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });
        if (onSave) onSave(dataUrl);

        // Auto download
        const link = document.createElement('a');
        link.download = 'vision-edit.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAddText = () => {
        if (!fabricCanvas) return;
        const text = new fabric.IText('New Text', {
            left: width / 2,
            top: height / 2,
            fontFamily: 'Pretendard',
            fill: '#ffffff',
            fontSize: 30,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeWidth: 1
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
    };

    return (
        <div className="relative w-full h-full flex flex-col">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-xl">
                <button onClick={handleAddText} className="p-2 hover:bg-white/20 rounded-full text-white" title="Add Text">
                    <Type className="w-5 h-5" />
                </button>
                <button onClick={() => designKeywords.length > 0 && setFabricCanvas(fabricCanvas)} className="p-2 hover:bg-white/20 rounded-full text-white" title="Reset Layout">
                    <RefreshCw className="w-5 h-5" />
                </button>
                <button onClick={handleDownload} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg" title="Save & Download">
                    <Download className="w-5 h-5" />
                </button>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 overflow-hidden relative bg-gray-900 rounded-xl border border-white/10 shadow-inner flex items-center justify-center">
                <canvas ref={canvasRef} />
            </div>

            <p className="text-center text-xs text-gray-500 mt-2">
                Objects are draggable and editable. Double click text to edit.
            </p>
        </div>
    );
};
