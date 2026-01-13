"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Download, Layout, ZoomIn, Info, Move, Shirt, Image as ImageIcon, Sparkles, Check, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface PlatformConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
  safeZone?: number; // percent from edges
}

const THUMBNAIL_PLATFORMS: PlatformConfig[] = [
  { id: 'own_mall', name: '자사몰', width: 1024, height: 1024, description: '1:1 정방형 (권장)' },
  { id: 'smart_store', name: '스마트스토어', width: 1000, height: 1000, description: '1:1 정방형' },
  { id: 'ably', name: '에이블리', width: 1000, height: 1000, description: '1:1 정방형 (안전구역 체크)' },
  { id: 'hiver', name: '하이버', width: 1000, height: 1000, description: '1:1 정방형' },
  { id: 'lookpin', name: '룩핀', width: 1000, height: 1333, description: '3:4 비율' },
];

const CODI_PLATFORMS: PlatformConfig[] = [
  { id: 'hiver_codi', name: '하이버 코디', width: 1000, height: 1333, description: '3:4 전신' },
  { id: 'lookpin_codi', name: '룩핀 코디', width: 1000, height: 1333, description: '3:4 전신' },
  { id: 'smart_store_codi', name: '스마트스토어 코디', width: 1000, height: 1333, description: '3:4 비율 (모바일 최적화)' },
  { id: '4910', name: '4910', width: 1000, height: 1333, description: '3:4 전신 (AI 추천)' },
];

const ThumbnailGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'thumbnail' | 'codi'>('thumbnail');
  const [masterImage, setMasterImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('thumbnail');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Store crop state for each platform: { scale: 1, x: 0, y: 0 }
  const [cropStates, setCropStates] = useState<Record<string, { scale: number; x: number; y: number }>>({});
  const canvasRefs = useRef<Record<string, HTMLCanvasElement>>({});
  const imgRef = useRef<HTMLImageElement | null>(null);

  const activePlatformsList = activeTab === 'thumbnail' ? THUMBNAIL_PLATFORMS : CODI_PLATFORMS;

  // State for selected platforms (default: all selected)
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);

  // Reset selected platforms when tab changes
  useEffect(() => {
    setSelectedPlatformIds(activePlatformsList.map(p => p.id));
  }, [activeTab]);

  const activePlatforms = activePlatformsList.filter(p => selectedPlatformIds.includes(p.id));

  // Initialize crop states when image loads
  useEffect(() => {
    if (masterImage && imgRef.current) {
      const initialStates: Record<string, any> = {};
      [...THUMBNAIL_PLATFORMS, ...CODI_PLATFORMS].forEach(p => {
        initialStates[p.id] = { scale: 1, x: 50, y: 50 }; // Center default
      });
      setCropStates(initialStates);
    }
  }, [masterImage]);

  // Handle file upload
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setFileName(file.name.split('.')[0]);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setMasterImage(url);
      toast.success('이미지가 성공적으로 로드되었습니다.');
    };
    img.onerror = () => {
      toast.error('이미지를 불러오는데 실패했습니다.');
    };
    img.src = url;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Render previews on canvases
  useEffect(() => {
    if (!masterImage || !imgRef.current) return;

    activePlatforms.forEach(platform => {
      const canvas = canvasRefs.current[platform.id];
      const state = cropStates[platform.id];
      if (canvas && state && imgRef.current) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = imgRef.current;

        // Calculate dimensions to cover the canvas while maintaining aspect ratio
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;

        let renderWidth, renderHeight;

        // "Cover" logic base size
        if (imgRatio > canvasRatio) {
          // Image is wider than canvas
          renderHeight = canvas.height;
          renderWidth = img.width * (canvas.height / img.height);
        } else {
          // Image is taller than canvas
          renderWidth = canvas.width;
          renderHeight = img.height * (canvas.width / img.width);
        }

        // Apply scaling
        const scaledWidth = renderWidth * state.scale;
        const scaledHeight = renderHeight * state.scale;

        // Calculate position based on percentages (0-100)
        // x=50, y=50 means center of image aligns with center of canvas
        const centerX = (canvas.width - scaledWidth) * (state.x / 100);
        const centerY = (canvas.height - scaledHeight) * (state.y / 100);

        ctx.drawImage(img, centerX, centerY, scaledWidth, scaledHeight);
      }
    });
  }, [masterImage, cropStates, activeTab, selectedPlatformIds]);

  const updateCropState = (id: string, updates: Partial<{ scale: number; x: number; y: number }>) => {
    setCropStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const handleDownloadSingle = (platform: PlatformConfig) => {
    const canvas = canvasRefs.current[platform.id];
    if (canvas) {
      canvas.toBlob(blob => {
        if (blob) {
          saveAs(blob, `${fileName}_${platform.name}.png`);
          toast.success(`${platform.name} 저장 완료`);
        }
      });
    }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const promises = activePlatforms.map(platform => {
      return new Promise<void>(resolve => {
        const canvas = canvasRefs.current[platform.id];
        if (canvas) {
          canvas.toBlob(blob => {
            if (blob) zip.file(`${fileName}_${platform.name}.png`, blob);
            resolve();
          });
        } else {
          resolve();
        }
      });
    });

    await Promise.all(promises);
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${fileName}_${activeTab}_set.zip`);
    toast.success('전체 플랫폼 이미지 ZIP 저장 완료');
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatformIds(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleServerProcessing = async () => {
    if (!masterImage) return;
    setIsProcessing(true);
    const toastId = toast.loading('서버에서 고화질 변환 중입니다...');

    try {
      // Convert blob URL to File/Blob
      const response = await fetch(masterImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob);

      const res = await fetch('/api/generate-derivatives', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Processing failed');

      const zipBlob = await res.blob();
      saveAs(zipBlob, `${fileName}_derivatives_hq.zip`);
      toast.success('고화질 변환 완료! 다운로드가 시작됩니다.', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('변환 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-2">
            <Layout className="w-6 h-6 text-indigo-500" />
            Thumbnail & Codi Generator
          </h2>
          <p className="text-gray-500 text-sm">
            {activeTab === 'thumbnail' ? '5대 플랫폼 (자사몰, 스스, 에이블리 등) 썸네일 자동 변환' : '코디/전신 (하이버, 룩핀, 4910 등) 최적화 이미지 생성'}
          </p>
        </div>

        {masterImage && (
          <button
            onClick={handleDownloadAll}
            disabled={activePlatforms.length === 0}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            선택 항목 일괄 다운로드 (ZIP)
          </button>
        )}
      </div>

      {/* Server-Side Processing Option */}
      {masterImage && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleServerProcessing}
            disabled={isProcessing}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Tallest Master 전략으로 고화질 변환 (Server HQ)
              </>
            )}
          </button>
        </div>
      )}

      {/* Tab Selection */}
      <div className="flex gap-4 mb-4 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('thumbnail')}
          className={`pb-3 px-2 flex items-center gap-2 text-sm font-bold transition-all relative ${activeTab === 'thumbnail' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <ImageIcon className="w-4 h-4" />
          기본 썸네일 (대표이미지)
          {activeTab === 'thumbnail' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
        </button>
        <button
          onClick={() => setActiveTab('codi')}
          className={`pb-3 px-2 flex items-center gap-2 text-sm font-bold transition-all relative ${activeTab === 'codi' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Shirt className="w-4 h-4" />
          코디 생성기 (전신/모델컷)
          {activeTab === 'codi' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />}
        </button>
      </div>

      {/* Platform Filter Toggles */}
      <div className="mb-8 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">출력할 플랫폼 선택 (Select Platforms)</label>
        <div className="flex flex-wrap gap-2">
          {activePlatformsList.map(p => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-2 ${selectedPlatformIds.includes(p.id)
                ? activeTab === 'thumbnail'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                  : 'bg-pink-500/20 border-pink-500/50 text-pink-300 ring-1 ring-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                : 'bg-slate-800 border-slate-700 text-gray-500 hover:bg-slate-700 opacity-60 hover:opacity-100'
                }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${selectedPlatformIds.includes(p.id) ? (activeTab === 'thumbnail' ? 'bg-indigo-500 text-white' : 'bg-pink-500 text-white') : 'bg-slate-700 border border-slate-600'}`}>
                {selectedPlatformIds.includes(p.id) && <Check className="w-2.5 h-2.5" />}
              </div>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Master Upload Section */}
      {!masterImage ? (
        <div
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
            : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('master-upload')?.click()}
        >
          <input
            type="file"
            id="master-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors ${activeTab === 'thumbnail' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-pink-500/10 text-pink-400'}`}>
            <Upload className={`w-8 h-8 ${isDragging ? 'animate-bounce' : ''}`} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {isDragging ? '여기에 놓아주세요!' : '원본 이미지 업로드'}
          </h3>
          <p className="text-gray-500 text-sm">
            고해상도 원본을 올리거나 파일 탐색기에서 끌어오세요.<br />
            {activeTab === 'thumbnail' ? '모든 썸네일 규격' : '모든 코디 규격'}으로 자동 변환됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Controls & Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {activePlatforms.map(platform => (
              <div key={platform.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
                {/* Platform Header */}
                <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {platform.name}
                      {platform.id === 'ably' && <span className="text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">Safe Zone</span>}
                      {activeTab === 'codi' && <span className="text-[9px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded">3:4</span>}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{platform.width} x {platform.height} px • {platform.description}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadSingle(platform)}
                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    title="이 규격만 다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {/* Canvas / Preview Area */}
                <div className="relative aspect-square bg-[#1a1a1a] flex items-center justify-center p-4 overflow-hidden group">
                  <div className="relative shadow-2xl" style={{
                    aspectRatio: `${platform.width}/${platform.height}`,
                    width: '100%',
                    maxWidth: platform.width > platform.height ? '100%' : `${(platform.width / platform.height) * 100}%`
                  }}>
                    <canvas
                      ref={el => { if (el) canvasRefs.current[platform.id] = el; }}
                      width={platform.width}
                      height={platform.height}
                      className="w-full h-full object-contain bg-white"
                    />

                    {/* Safe Zone Overlay for Ably */}
                    {platform.id === 'ably' && (
                      <div className="absolute inset-0 pointer-events-none border border-red-500/30">
                        <div className="absolute top-[10%] bottom-[10%] left-[10%] right-[10%] border border-dashed border-red-500/50" />
                        <span className="absolute top-2 left-2 text-[9px] text-red-500/50 font-bold">Safe Zone Protection</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Adjustment Controls */}
                <div className="px-5 py-4 border-t border-slate-800 bg-slate-900 grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Scale</span>
                      <span className="font-mono">{cropStates[platform.id]?.scale?.toFixed(2) || '1.00'}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={cropStates[platform.id]?.scale || 1}
                      onChange={(e) => updateCropState(platform.id, { scale: parseFloat(e.target.value) })}
                      className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer ${activeTab === 'thumbnail' ? 'accent-indigo-500' : 'accent-pink-500'}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Move className="w-3 h-3" /> Position X/Y</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={cropStates[platform.id]?.x || 50}
                        onChange={(e) => updateCropState(platform.id, { x: parseInt(e.target.value) })}
                        className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer ${activeTab === 'thumbnail' ? 'accent-indigo-500' : 'accent-pink-500'}`}
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={cropStates[platform.id]?.y || 50}
                        onChange={(e) => updateCropState(platform.id, { y: parseInt(e.target.value) })}
                        className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer ${activeTab === 'thumbnail' ? 'accent-indigo-500' : 'accent-pink-500'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reset Action */}
          <div className="flex justify-center pb-20">
            <button
              onClick={() => { setMasterImage(null); setFileName('thumbnail'); }}
              className="text-gray-500 text-sm hover:text-white underline decoration-gray-700 underline-offset-4 hover:decoration-white transition-all"
            >
              원본 이미지 교체하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThumbnailGenerator;