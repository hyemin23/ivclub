"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Download, ImageIcon, RefreshCw, X, Monitor, Layers, Wallpaper, UserCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateBackgroundChange } from '../services/geminiService';
import { Resolution, AspectRatio, FaceMode, Gender } from '../types';
import { ImageModal } from './ImageModal';
import { ConfirmModal } from './ConfirmModal';



const BackgroundChange: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [bgRefImage, setBgRefImage] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageCount, setImageCount] = useState<number>(1);

  interface ResultItem {
    id: string;
    url: string | null;
    status: 'loading' | 'success' | 'error';
  }

  const [resultImages, setResultImages] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleStopClick = useCallback(() => {
    if (!isLoading) return;
    setShowStopConfirm(true);
  }, [isLoading]);

  const confirmStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      toast.info("작업이 사용자에 의해 중지되었습니다.");
      setIsLoading(false);
    }
    setShowStopConfirm(false);
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            if (!baseImage) setBaseImage(result);
            else if (!bgRefImage) setBgRefImage(result);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  }, [baseImage, bgRefImage]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleImageUpload = (type: 'base' | 'bg', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'base') setBaseImage(reader.result as string);
        else if (type === 'bg') setBgRefImage(reader.result as string);
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!baseImage) return;
    setIsLoading(true);

    // Initialize placeholders
    const placeholders: ResultItem[] = Array(imageCount).fill(null).map((_, i) => ({
      id: `pending-${i}`,
      url: null,
      status: 'loading'
    }));
    setResultImages(placeholders);

    setProgress(0);
    setProgressText('작업 준비 중...');

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let completed = 0;

      const promises = Array(imageCount).fill(null).map(async (_, index) => {
        if (signal.aborted) return;
        try {
          if (index === 0) setProgressText(`배경 합성 생성 중... (0/${imageCount})`);

          const url = await generateBackgroundChange(baseImage, bgRefImage, prompt, resolution, aspectRatio, undefined, signal);

          if (!signal.aborted && url) {
            setResultImages(prev => prev.map((item, i) =>
              i === index ? { ...item, url, status: 'success' } : item
            ));
          }
          return url;
        } catch (err: any) {
          if (signal.aborted || err.message === "작업이 취소되었습니다.") {
            return null;
          }
          console.error(`Image ${index + 1} failed`, err);

          if (!signal.aborted) {
            setResultImages(prev => prev.map((item, i) =>
              i === index ? { ...item, status: 'error' } : item
            ));
          }
          return null;
        } finally {
          if (!signal.aborted) {
            completed++;
            const percent = Math.round((completed / imageCount) * 100);
            setProgress(percent);
            setProgressText(`생성 진행 중... ${percent}%`);
          }
        }
      });

      await Promise.all(promises);

    } catch (error: any) {
      if (signal.aborted || error.message === "작업이 취소되었습니다.") {
        // Handled
      } else {
        console.error(error);
        toast.error("이미지 생성 중 오류가 발생했습니다.");
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        setProgress(0);
        setProgressText('');
        abortControllerRef.current = null;
      }
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < resultImages.length; i++) {
      const link = document.createElement('a');
      link.href = resultImages[i].url || '';
      link.download = `background_${i + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="space-y-8">
        <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <Wallpaper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">배경 교체</h3>
                <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">ENVIRONMENT REPLACEMENT</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">원본 이미지 (필수)</label>
              <div
                onClick={() => document.getElementById('bgc-base-upload')?.click()}
                className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${baseImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
                  }`}
              >
                {baseImage ? (
                  <>
                    <img src={baseImage} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[10px] font-black uppercase bg-black px-4 py-2 rounded-full border border-white/20">이미지 변경</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2 opacity-40">
                    <ImageIcon className="w-8 h-8 mx-auto mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">상품 업로드</span>
                  </div>
                )}
                <input id="bgc-base-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('base', e)} />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">참고 배경 (선택)</label>
              <div
                onClick={() => document.getElementById('bgc-bg-upload')?.click()}
                className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${bgRefImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
                  }`}
              >
                {bgRefImage ? (
                  <>
                    <img src={bgRefImage} className="w-full h-full object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); setBgRefImage(null); }} className="absolute top-4 right-4 p-2 bg-black/80 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-4 h-4 text-white" /></button>
                  </>
                ) : (
                  <div className="text-center p-2 opacity-20">
                    <Wallpaper className="w-8 h-8 mx-auto mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">배경 업로드</span>
                  </div>
                )}
                <input id="bgc-bg-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('bg', e)} />
              </div>
            </div>
          </div>



          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">추가 안내 (선택)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="비워둘 경우 AI가 가장 어울리는 배경(한남동/성수동 감성)을 추천합니다..."
              className="w-full h-24 bg-black border border-white/10 rounded-2xl px-5 py-4 text-xs focus:border-white outline-none transition-all resize-none text-gray-300 placeholder:text-gray-700 font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">해상도</label>
              <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none cursor-pointer">
                <option value="1K">1K</option><option value="2K">2K</option><option value="4K">4K</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">비율</label>
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none cursor-pointer">
                <option value="1:1">1:1</option><option value="9:16">9:16</option><option value="4:3">4:3</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">생성 수</label>
              <select value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none cursor-pointer">
                <option value={1}>1</option><option value={2}>2</option><option value={4}>4</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <button
              onClick={handleStopClick}
              className="w-full py-6 rounded-[2rem] bg-red-500 hover:bg-red-600 text-white font-black text-sm shadow-2xl shadow-red-500/20 transition-all flex items-center justify-center gap-4 group animate-pulse"
            >
              <X className="w-6 h-6 animate-pulse" />
              작업 중지 (Stop)
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!baseImage}
              className="w-full py-6 rounded-[2rem] bg-white hover:bg-gray-200 text-black font-black text-sm shadow-2xl shadow-white/10 disabled:opacity-20 transition-all flex items-center justify-center gap-4 group"
            >
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              배경 합성 실행 ({imageCount})
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 flex flex-col min-h-[700px]">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <Monitor className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter">배경 합성 결과</h3>
          </div>
          {resultImages.length > 0 && !isLoading && (
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all uppercase tracking-widest"
            >
              <Download className="w-3 h-3" /> 일괄 저장
            </button>
          )}
        </div>

        <div className={`flex-1 grid gap-4 ${resultImages.length === 1 ? 'grid-cols-1 max-w-[400px]' : 'grid-cols-2 lg:grid-cols-3'} bg-black/40 border border-white/5 rounded-[2rem] p-6 overflow-hidden relative content-start`}>
          {isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-gray-200">{progressText}</span>
            </div>
          )}

          {resultImages.length > 0 ? (
            resultImages.map((item, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl transition-all hover:border-slate-700 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : item.status === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {item.status === 'loading' ? 'GENERATING...' : item.status === 'error' ? 'FAILED' : `RESULT ${i + 1}`}
                    </span>
                  </div>
                </div>

                {item.status === 'loading' ? (
                  <div className="aspect-[3/4] rounded-lg bg-white/5 animate-pulse flex flex-col items-center justify-center gap-2 border border-white/5">
                    <Wallpaper className="w-8 h-8 text-white/20 animate-spin-slow" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Integration...</p>
                  </div>
                ) : item.status === 'success' && item.url ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Original Image */}
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">ORIGINAL</p>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-white/5 relative group cursor-zoom-in" onClick={() => baseImage && setSelectedImage(baseImage)}>
                          {baseImage && <img src={baseImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Original" />}
                        </div>
                      </div>

                      {/* Generated Image */}
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest ml-1">GENERATED</p>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-blue-500/20 relative group cursor-zoom-in shadow-lg shadow-blue-900/10" onClick={() => item.url && setSelectedImage(item.url)}>
                          <img src={item.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Generated" />
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-black uppercase rounded tracking-wider">New</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => window.open(item.url || '', '_blank')} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-gray-300 transition-colors flex items-center justify-center gap-2">
                        <Download className="w-3 h-3" /> 저장
                      </button>
                      <button onClick={() => {
                        navigator.clipboard.writeText(item.url || '');
                        toast.success('링크가 복사되었습니다');
                      }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-300 transition-colors">
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="aspect-[3/4] rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <div className="text-center text-red-400">
                      <X className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-[10px] font-bold">Failed</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                <Wallpaper className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Ready to Gen</p>
            </div>
          )}
        </div>
      </div>

      <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />

      <ConfirmModal
        isOpen={showStopConfirm}
        onClose={() => setShowStopConfirm(false)}
        onConfirm={confirmStop}
        title="작업을 중지하시겠습니까?"
        message="현재 진행 중인 작업이 중단되며, 이미 차감된 비용은 환불되지 않습니다."
        confirmText="네, 중지합니다"
        cancelText="계속 진행"
        isDestructive={true}
      />
    </div>
  );
};

export default BackgroundChange;
