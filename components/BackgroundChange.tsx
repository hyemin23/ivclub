"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Download, ImageIcon, RefreshCw, X, Monitor, Layers, Wallpaper, UserCircle, Share2, UserPlus, Trash2, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { replaceBackground, generateBackgroundVariations, generatePoseVariation, applyBenchmarkStyle } from '../services/imageService';
import { Resolution, AspectRatio, FaceMode, Gender, SavedModel, BenchmarkAnalysisResult } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BenchmarkUploader } from './BenchmarkUploader';
import { ImageModal } from './ImageModal';
import { ConfirmModal } from './ConfirmModal';
import { useStore, BackgroundHistoryItem } from '../store';



const BackgroundChange: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [bgRefImage, setBgRefImage] = useState<string | null>(null);

  // Benchmark State
  const [benchmarkAnalysis, setBenchmarkAnalysis] = useState<BenchmarkAnalysisResult | null>(null);

  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageCount, setImageCount] = useState<number>(1);
  const [ambientMatch, setAmbientMatch] = useState(true); // Default ON
  const [ambientStrength, setAmbientStrength] = useState(50);

  interface ResultItem {
    id: string;
    url: string | null;
    status: 'loading' | 'success' | 'error';
  }

  const [resultImages, setResultImages] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [statusMessage, setStatusMessage] = useState(''); // New state for hybrid service messages
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Store for History
  // Store for History & Saved Models
  const {
    backgroundHistory, addToBackgroundHistory, clearBackgroundHistory,
    savedModels, activeModelId, setActiveModelId // Keep hooks for now to avoid breaking heavy refactor, but unused UI
  } = useStore();

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


  const [stylePreset, setStylePreset] = useState<'CUSTOM' | 'MZ_CAFE'>('CUSTOM');
  const [activeTab, setActiveTab] = useState<'STUDIO' | 'HOTPLACE' | 'CUSTOM' | 'BENCHMARK'>('STUDIO');
  const [isWideFit, setIsWideFit] = useState(false);
  const [category, setCategory] = useState<'TOP' | 'BOTTOM' | 'SET'>('SET');
  const [isStyleReference, setIsStyleReference] = useState(true); // Default ON




  const handleImageUpdate = (newUrl: string) => {
    // 1. Update currently displayed image
    setSelectedImage(newUrl);

    // 2. Update Result Images List
    setResultImages(prev => prev.map(img =>
      img.url === selectedImage ? { ...img, url: newUrl } : img
    ));

    // 3. Add to History
    const newHistoryItem: BackgroundHistoryItem = {
      id: Date.now().toString(),
      url: newUrl,
      timestamp: Date.now()
    };
    useStore.getState().addToBackgroundHistory(newUrl); // The store method actually takes a string currently!
  };

  const handleGenerate = async () => {
    if (!baseImage) return;
    setIsLoading(true);

    // For theme modes, always generate 4 variations
    const useVariations = activeTab === 'STUDIO' || activeTab === 'HOTPLACE';
    const effectiveCount = useVariations ? 4 : imageCount;

    // Initialize placeholders
    const placeholders: ResultItem[] = Array(effectiveCount).fill(null).map((_, i) => ({
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
      if (useVariations) {
        // Use new 4-variation parallel generation
        const themeKey = activeTab === 'STUDIO' ? 'BASIC_STUDIO' : 'MZ_CAFE';
        setProgressText(`${themeKey === 'BASIC_STUDIO' ? '스튜디오' : '핫플'} 4가지 시안 동시 생성 중... ⚡️`);

        const results = await generateBackgroundVariations(
          baseImage,
          themeKey as 'MZ_CAFE' | 'BASIC_STUDIO',
          resolution,
          aspectRatio,
          { category, isWideFit },
          signal,
          (msg: string) => setStatusMessage(msg),
          { ambientMatch, ambientStrength, modelPersona: activeModelId ? savedModels.find(m => m.id === activeModelId) : undefined, styleReference: isStyleReference }
        );

        // Update result images
        if (!signal.aborted) {
          setResultImages(results.map((r, i) => ({
            id: `result-${i}`,
            url: r.url,
            status: r.url ? 'success' : 'error'
          })));

          // Add successful ones to history
          results.forEach(r => {
            if (r.url) addToBackgroundHistory(r.url);
          });
        }
      } else {
        // Original single/custom mode logic
        let completed = 0;

        const promises = Array(effectiveCount).fill(null).map(async (_, index) => {
          if (signal.aborted) return;
          try {
            if (index === 0) setProgressText(`배경 합성 생성 중... (0/${effectiveCount})`);

            const effectiveBgRef = activeTab === 'CUSTOM' ? bgRefImage : null;

            const url = await replaceBackground(
              baseImage,
              effectiveBgRef,
              prompt,
              {
                resolution,
                aspectRatio,
                faceOptions: { preset: 'CUSTOM', category, isWideFit },
                ambientMatch,
                ambientStrength,
                modelPersona: activeModelId ? savedModels.find(m => m.id === activeModelId) : undefined,
                styleReference: isStyleReference
              }
            );

            if (!signal.aborted && url) {
              setResultImages(prev => prev.map((item, i) =>
                i === index ? { ...item, url, status: 'success' } : item
              ));
              addToBackgroundHistory(url);
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
              const percent = Math.round((completed / effectiveCount) * 100);
              setProgress(percent);
              setProgressText(`생성 진행 중... ${percent}%`);
            }
          }
        });

        await Promise.all(promises);
      }

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

  // Benchmark Application Handler
  const handleBenchmarkApply = async () => {
    if (!baseImage || !benchmarkAnalysis) return;
    setIsLoading(true);

    // Initialize placeholders
    const placeholders: ResultItem[] = Array(imageCount).fill(null).map((_, i) => ({
      id: `benchmark-${i}`, url: null, status: 'loading'
    }));
    setResultImages(placeholders);
    setProgress(0);
    setProgressText('벤치마킹 스타일 적용 중...');

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let completed = 0;
      const promises = Array(imageCount).fill(null).map(async (_, index) => {
        if (signal.aborted) return;
        try {
          if (index === 0) setProgressText(`Vibe Transfer 진행 중... (0/${imageCount})`);

          const url = await applyBenchmarkStyle(
            baseImage,
            benchmarkAnalysis,
            resolution,
            aspectRatio
          );

          if (!signal.aborted && url) {
            setResultImages(prev => prev.map((item, i) =>
              i === index ? { ...item, url, status: 'success' } : item
            ));
            addToBackgroundHistory(url);
          }
        } catch (err: any) {
          console.error("Benchmark Failed:", err);
          if (!signal.aborted) {
            setResultImages(prev => prev.map((item, i) =>
              i === index ? { ...item, status: 'error' } : item
            ));
          }
        } finally {
          if (!signal.aborted) {
            completed++;
            setProgress(Math.round((completed / imageCount) * 100));
          }
        }
      });

      await Promise.all(promises);

    } catch (error: any) {
      console.error(error);
      toast.error("벤치마킹 생성 중 오류가 발생했습니다.");
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
    const zip = new JSZip();
    let count = 0;

    for (let i = 0; i < resultImages.length; i++) {
      const img = resultImages[i];
      if (img.url) {
        try {
          // Fetch the image data to blob
          const response = await fetch(img.url);
          const blob = await response.blob();
          zip.file(`background_${i + 1}.png`, blob);
          count++;
        } catch (e) {
          console.error("Failed to add image to zip", e);
        }
      }
    }

    if (count === 0) {
      toast.error("다운로드할 이미지가 없습니다.");
      return;
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `nano_backgrounds_${Date.now()}.zip`);
      toast.success(`${count}장의 이미지를 압축하여 저장했습니다.`);
    } catch (e) {
      toast.error("압축 저장 중 오류가 발생했습니다.");
    }
  };

  const handlePoseVariation = async (targetUrl: string, index: number) => {
    if (!targetUrl) return;

    // Update status to loading
    setResultImages(prev => prev.map((img, i) =>
      i === index ? { ...img, status: 'loading' } : img
    ));

    try {
      toast.info("배경을 유지하며 포즈를 변경합니다...");
      const newUrl = await generatePoseVariation(targetUrl);

      setResultImages(prev => prev.map((img, i) =>
        i === index ? { ...img, url: newUrl, status: 'success' } : img
      ));

      if (newUrl) addToBackgroundHistory(newUrl);
      toast.success("포즈 변경이 완료되었습니다!");
    } catch (error) {
      console.error(error);
      toast.error("포즈 변경에 실패했습니다.");
      setResultImages(prev => prev.map((img, i) =>
        i === index ? { ...img, status: 'success' } : img // Revert status to success so image shows again
      ));
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




          {/* Tab Navigation */}
          <div className="flex p-1 bg-black rounded-xl border border-white/10 mb-6">
            <button
              onClick={() => setActiveTab('STUDIO')}
              className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'STUDIO'
                ? 'bg-white text-black shadow-lg shadow-white/5'
                : 'text-gray-500 hover:text-white'
                }`}
            >
              🏢 스튜디오
            </button>
            <button
              onClick={() => setActiveTab('HOTPLACE')}
              className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'HOTPLACE'
                ? 'bg-white text-black shadow-lg shadow-white/5'
                : 'text-gray-500 hover:text-white'
                }`}
            >
              ☕️ 핫플 (야외)
            </button>
            <button
              onClick={() => setActiveTab('CUSTOM')}
              className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'CUSTOM'
                ? 'bg-white text-black shadow-lg shadow-white/5'
                : 'text-gray-500 hover:text-white'
                }`}
            >
              📂 내 이미지
            </button>
            <button
              onClick={() => setActiveTab('BENCHMARK')}
              className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'BENCHMARK'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'text-indigo-400 hover:text-indigo-300'
                }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>벤치마킹</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[160px]">
            {activeTab === 'STUDIO' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Basic Studio Mode</h4>
                      <p className="text-[10px] text-gray-400">상품에 집중하는 깔끔한 이커머스 표준 배경 (호리존)</p>
                    </div>
                  </div>

                  {/* Wide Fit Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isWideFit ? 'bg-indigo-500 border-indigo-500' : 'border-white/30 group-hover:border-white'
                        }`}>
                        {isWideFit && <Sparkles className="w-3 h-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isWideFit}
                        onChange={(e) => setIsWideFit(e.target.checked)}
                      />
                      <span className={`text-xs font-bold transition-colors ${isWideFit ? 'text-indigo-400' : 'text-gray-400 group-hover:text-white'}`}>
                        와이드핏 전용 (Wide Fit Optimization)
                      </span>
                    </label>
                    <p className="text-[10px] text-gray-500 pl-8 pt-1">
                      * 체크 시 바지 통이 줄어들지 않고 넓은 실루엣이 유지됩니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'HOTPLACE' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                <div className="h-full rounded-[2rem] border border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h4 className="text-indigo-300 font-bold mb-2">MZ 핫플 (성수/연남)</h4>
                  <p className="text-[10px] text-indigo-400/60 leading-relaxed max-w-[200px]">
                    트렌디하고 현대적인 서울 골목길 배경을 자동으로 합성합니다.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'CUSTOM' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* Dual Upload UI */}
                <div className="flex gap-4 items-center">

                  {/* Left: Product (Source) */}
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">나의 상품 (Source)</label>
                    <div
                      onClick={() => document.getElementById('bgc-base-upload-dual')?.click()}
                      className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${baseImage ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-white/30 bg-black'
                        }`}
                    >
                      {baseImage ? (
                        <>
                          <img src={baseImage} className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-[9px] font-bold uppercase bg-black/80 text-white px-2 py-1 rounded-full border border-white/20">Change</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-2 opacity-40">
                          <ImageIcon className="w-6 h-6 mx-auto mb-2" />
                          <span className="text-[9px] font-black uppercase tracking-widest">상품</span>
                        </div>
                      )}
                      <input id="bgc-base-upload-dual" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('base', e)} />
                    </div>
                  </div>

                  {/* Arrow Logic */}
                  <div className="pt-6 text-gray-600 flex flex-col items-center justify-center gap-1">
                    <ArrowRight className="w-5 h-5 animate-pulse" />
                  </div>

                  {/* Right: Reference (Target) */}
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">참고 배경 (Ref)</label>
                    <div
                      onClick={() => document.getElementById('bgc-bg-upload')?.click()}
                      className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${bgRefImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
                        }`}
                    >
                      {bgRefImage ? (
                        <>
                          <img src={bgRefImage} className="w-full h-full object-contain" />
                          <button onClick={(e) => { e.stopPropagation(); setBgRefImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-3 h-3 text-white" /></button>
                        </>
                      ) : (
                        <div className="text-center p-2 opacity-20">
                          <Wallpaper className="w-6 h-6 mx-auto mb-2" />
                          <span className="text-[9px] font-black uppercase tracking-widest">배경</span>
                        </div>
                      )}
                      <input id="bgc-bg-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('bg', e)} />
                    </div>
                  </div>
                </div>

                {/* Style Reference Toggle */}
                <div className="pt-2 px-1">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${isStyleReference ? 'bg-indigo-500 border-indigo-500' : 'border-white/30 group-hover:border-white'}`}>
                      {isStyleReference && <Sparkles className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isStyleReference} onChange={e => setIsStyleReference(e.target.checked)} />
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold transition-colors ${isStyleReference ? 'text-indigo-400' : 'text-gray-400 group-hover:text-white'}`}>
                        스타일 흡수 (Vibe Copy)
                      </span>
                      <span className="text-[10px] text-gray-500 leading-tight pt-1">
                        업로드한 이미지의 <b>배경 조명과 분위기</b>만 추출하여 합성합니다. (인물 제외)
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'BENCHMARK' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
                  <h4 className="text-xs font-black text-indigo-300 flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4" /> High-CTR Vibe Copy
                  </h4>
                  <p className="text-[10px] text-indigo-200/60 leading-relaxed">
                    경쟁사의 '잘 팔리는 썸네일'을 분석하고, 그 <b className="text-white">조명과 분위기</b>를 그대로 훔쳐옵니다.
                  </p>
                </div>

                <BenchmarkUploader
                  onAnalysisComplete={setBenchmarkAnalysis}
                  onApplyStyle={handleBenchmarkApply}
                  isGenerating={isLoading}
                />
              </div>
            )}

          </div>

          {/* Category Selection for Smart Framing */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">카테고리 (스마트 프레이밍)</label>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {(['TOP', 'BOTTOM', 'SET'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${category === cat
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {cat === 'TOP' && '🧥 상의 (Top)'}
                  {cat === 'BOTTOM' && '👖 하의 (Bottom)'}
                  {cat === 'SET' && '👔 전신 (Set)'}
                </button>
              ))}
            </div>
          </div>

          {activeTab !== 'CUSTOM' && (
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
            </div>
          )}



          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">추가 안내 (선택)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="비워둘 경우 AI가 가장 어울리는 배경(한남동/성수동 감성)을 추천합니다..."
              className="w-full h-24 bg-black border border-white/10 rounded-2xl px-5 py-4 text-xs focus:border-white outline-none transition-all resize-none text-gray-300 placeholder:text-gray-700 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4 col-span-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">비율 (Composition)</label>
              <div className="flex gap-2">
                {[
                  { id: '1:1', label: '1:1 정방형', desc: '기본/썸네일' },
                  { id: '3:4', label: '3:4 인물형', desc: '인스타/피드' },
                  { id: '9:16', label: '9:16 세로형', desc: '릴스/스토리' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAspectRatio(opt.id as AspectRatio)}
                    className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${aspectRatio === opt.id
                      ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                      : 'bg-black border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/30'
                      }`}
                  >
                    <span className="text-xs font-black">{opt.label}</span>
                    <span className={`text-[9px] mt-0.5 ${aspectRatio === opt.id ? 'text-gray-600' : 'text-gray-600'}`}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Light Matching Option */}
            <div className="space-y-3 col-span-2 bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ambientMatch"
                    checked={ambientMatch}
                    onChange={(e) => setAmbientMatch(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-800 accent-blue-500"
                  />
                  <label htmlFor="ambientMatch" className="text-xs font-bold text-gray-200 cursor-pointer select-none">
                    배경 조명/그림자 일체화 (Ambient Match)
                  </label>
                </div>
                {ambientMatch && (
                  <span className="text-[10px] font-mono text-blue-400">
                    {ambientStrength}%
                  </span>
                )}
              </div>

              {ambientMatch && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300 pt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={ambientStrength}
                    onChange={(e) => setAmbientStrength(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-medium">
                    <span>약하게 (Subtle)</span>
                    <span>중간 (Moderate)</span>
                    <span>강하게 (Strong)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 col-span-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">해상도</label>
              <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none cursor-pointer">
                <option value="1K">1K</option><option value="2K">2K</option><option value="4K">4K</option>
              </select>
            </div>

            {activeTab === 'CUSTOM' ? (
              <div className="space-y-3 col-span-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">생성 수</label>
                <select value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none cursor-pointer">
                  <option value={1}>1</option><option value={2}>2</option><option value={4}>4</option>
                </select>
              </div>
            ) : (
              <div className="space-y-3 col-span-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">시안 수</label>
                <div className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-black text-blue-400 flex items-center justify-center">
                  4개 동시 생성 ⚡️
                </div>
              </div>
            )}
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
      </div >

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

        {/* Result Grid - 2x2 for theme modes (4 results), dynamic for others */}
        <div className={`flex-1 grid gap-4 ${resultImages.length === 4 ? 'grid-cols-2' : resultImages.length === 1 ? 'grid-cols-1 max-w-[400px]' : 'grid-cols-2 lg:grid-cols-3'} bg-black/40 border border-white/5 rounded-[2rem] p-6 overflow-hidden relative content-start`}>
          {isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-gray-200">{statusMessage || progressText}</span>
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

                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => item.url && handlePoseVariation(item.url, i)}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-bold text-white transition-all flex items-center justify-center gap-2 group"
                      >
                        <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                        포즈 변경 (Pose Var.)
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => {
                        if (item.url) {
                          const link = document.createElement('a');
                          link.href = item.url;
                          link.download = `background_result_${i + 1}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-gray-300 transition-colors flex items-center justify-center gap-2">
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

        {/* History Film Strip */}
        {backgroundHistory.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">최근 생성 이미지 (History)</label>
              <button
                onClick={clearBackgroundHistory}
                className="text-[9px] text-gray-500 hover:text-red-400 transition-colors"
              >
                전체 삭제
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {backgroundHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedImage(item.url)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-white/40 transition-all"
                >
                  <img src={item.url} alt="History" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onUpdate={handleImageUpdate}
      />

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
    </div >
  );
};

export default BackgroundChange;
