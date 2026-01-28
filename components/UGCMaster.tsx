"use client";

import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Download, Zap, FileUp, Smartphone, Users, User, Trash2, AlertCircle, RotateCcw, ShieldAlert, Key } from 'lucide-react';
import LocationGrid from './LocationGrid';
import { LOCATIONS } from '../constants/ugcPresets';
import { GenerationConfig, Quality, GenerationResult, Gender, Mode, GeminiErrorType } from '../types';
import { generateFashionContent, refinePrompt, parseGeminiError } from '../services/geminiService';

interface ExtendedResult extends GenerationResult {
  status: 'loading' | 'success' | 'error';
  errorType?: GeminiErrorType;
  errorMessage?: string;
}

const UGCMaster: React.FC = () => {
  const [config, setConfig] = useState<GenerationConfig>({
    productFeatures: '',
    stylingCoordination: '',
    targetAudience: '',
    locationIds: ['korean_subway_station'],
    quality: '1K',
    gender: 'Male',
    mode: 'Single',
    imageFile: null
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number, total: number } | null>(null);
  const [results, setResults] = useState<ExtendedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefine = async () => {
    if (!config.productFeatures && !config.stylingCoordination && !config.targetAudience) {
      setError("상세 정보를 입력한 후 정제를 시도해주세요.");
      return;
    }
    setIsRefining(true);
    setError(null);
    try {
      const refined = await refinePrompt({
        productFeatures: config.productFeatures,
        stylingCoordination: config.stylingCoordination,
        targetAudience: config.targetAudience
      });
      setConfig(prev => ({
        ...prev,
        productFeatures: refined.productFeatures || prev.productFeatures,
        stylingCoordination: refined.stylingCoordination || prev.stylingCoordination,
        targetAudience: refined.targetAudience || prev.targetAudience
      }));
    } catch (err: unknown) {
      const error = err as Error;
      setError(`프롬프트 정제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsRefining(false);
    }
  };

  const generateSpot = async (locationId: string) => {
    const location = LOCATIONS.find(l => l.id === locationId);
    if (!location) return;

    // Add initial loading state for this spot
    const tempId = `${locationId}-${Date.now()}`;
    setResults(prev => [{
      id: tempId,
      imageUrl: '',
      prompt: location.prompt,
      locationName: location.name,
      status: 'loading'
    }, ...prev]);

    try {
      const res = await generateFashionContent(config, location.prompt);
      setResults(prev => prev.map(r => r.id === tempId ? {
        ...r,
        imageUrl: res.imageUrl,
        status: 'success'
      } : r));
    } catch (err: unknown) {
      const parsed = parseGeminiError(err);
      setResults(prev => prev.map(r => r.id === tempId ? {
        ...r,
        status: 'error',
        errorType: parsed.type,
        errorMessage: parsed.message
      } : r));
    }
  };

  const handleGenerate = async () => {
    if (!config.imageFile) {
      setError("상품 사진을 먼저 업로드해주세요.");
      return;
    }
    if (config.locationIds.length === 0) {
      setError("장소를 하나 이상 선택해주세요.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setResults([]);

    const total = config.locationIds.length;
    for (let i = 0; i < total; i++) {
      setGenerationProgress({ current: i + 1, total });
      await generateSpot(config.locationIds[i]);
    }

    setIsGenerating(false);
    setGenerationProgress(null);
  };

  const handleRetry = async (id: string, locationName: string) => {
    const spot = LOCATIONS.find(l => l.name === locationName);
    if (!spot) return;

    // Reset this specific entry to loading
    setResults(prev => prev.map(r => r.id === id ? { ...r, status: 'loading', errorMessage: undefined } : r));

    try {
      const res = await generateFashionContent(config, spot.prompt);
      setResults(prev => prev.map(r => r.id === id ? {
        ...r,
        imageUrl: res.imageUrl,
        status: 'success'
      } : r));
    } catch (err: unknown) {
      const parsed = parseGeminiError(err);
      setResults(prev => prev.map(r => r.id === id ? {
        ...r,
        status: 'error',
        errorType: parsed.type,
        errorMessage: parsed.message
      } : r));
    }
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${filename}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    const successResults = results.filter(r => r.status === 'success');
    for (let i = 0; i < successResults.length; i++) {
      handleDownload(successResults[i].imageUrl, `ugc-${successResults[i].locationName.toLowerCase().replace(/\s/g, '-')}`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError("파일 용량이 너무 큽니다 (최대 20MB).");
        return;
      }
      setConfig(prev => ({ ...prev, imageFile: file }));
      setError(null);
    }
  };

  const handleToggleLocation = (id: string) => {
    setConfig(prev => {
      const isSelected = prev.locationIds.includes(id);
      const newIds = isSelected
        ? prev.locationIds.filter(lid => lid !== id)
        : [...prev.locationIds, id];
      return { ...prev, locationIds: newIds };
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">바이럴 UGC 생성기</h1>
          <p className="text-gray-500 text-sm">하이엔드 브랜드를 위한 초실사 소셜 패션 콘텐츠 엔진.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            {(['Single', 'Couple'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setConfig(prev => ({ ...prev, mode: m }))}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${config.mode === m ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
              >
                {m === 'Single' ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {m === 'Single' ? '단일 모델' : '커플 모델'}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            {(['1K', '2K', '4K'] as Quality[]).map((q) => (
              <button
                key={q}
                onClick={() => setConfig(prev => ({ ...prev, quality: q }))}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${config.quality === q ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
              >
                {q} 해상도
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-12">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">1</span>
                상품 소스 업로드
              </h2>
              <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">아이폰 4K RAW 소스 주입</span>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative group cursor-pointer aspect-[16/6] rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden ${config.imageFile ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
                }`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              {config.imageFile ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/40 transition-colors z-10">
                  <div className="px-6 py-3 bg-white text-black rounded-full font-black text-xs flex items-center gap-2">
                    <FileUp className="w-4 h-4" /> {config.imageFile.name}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfig(prev => ({ ...prev, imageFile: null })); }}
                    className="absolute top-4 right-4 p-2 bg-black/80 rounded-full hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <FileUp className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">상품 사진을 드래그하여 분석 시작</p>
                </div>
              )}
              {config.imageFile && (
                <img src={URL.createObjectURL(config.imageFile)} className="absolute inset-0 w-full h-full object-cover -z-10 opacity-40 blur-sm" alt="미리보기" />
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">2</span>
                모델 및 스타일링
              </h2>
              <button
                onClick={handleRefine}
                disabled={isRefining}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${isRefining
                  ? 'bg-white/10 border-white/10 text-gray-500'
                  : 'bg-white/5 border-white/10 text-indigo-400 hover:bg-white/10 hover:border-indigo-400'
                  }`}
              >
                {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                프롬프트 정제
              </button>
            </div>

            {config.mode === 'Single' && (
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit mb-4">
                {(['Male', 'Female'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setConfig(prev => ({ ...prev, gender: g }))}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${config.gender === g ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    {g === 'Male' ? '남성 모델' : '여성 모델'}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">의류 상세 특징</label>
                <input
                  type="text"
                  placeholder="예: 헤비 코튼 후드티, 오버핏"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-white transition-colors"
                  value={config.productFeatures}
                  onChange={(e) => setConfig(prev => ({ ...prev, productFeatures: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">타겟 페르소나</label>
                <input
                  type="text"
                  placeholder="예: 20대 대학생, 자연스러운 분위기"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-white transition-colors"
                  value={config.targetAudience}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetAudience: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">스타일링 코디 (OOTD)</label>
              <textarea
                rows={2}
                placeholder="예: 배기 블루 빈티지 데님, 화이트 청키 스니커즈, 스마트폰을 들고 있는 모습"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-white transition-colors resize-none"
                value={config.stylingCoordination}
                onChange={(e) => setConfig(prev => ({ ...prev, stylingCoordination: e.target.value }))}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">3</span>
                하이퍼 리얼 스팟 선택
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-white/40">{config.locationIds.length}개 선택됨</span>
                <button onClick={() => setConfig(prev => ({ ...prev, locationIds: LOCATIONS.map(l => l.id).sort(() => Math.random() - 0.5).slice(0, 3) }))} className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors flex items-center gap-1">🎲 랜덤 셔플</button>
              </div>
            </div>
            <LocationGrid selectedIds={config.locationIds} onToggle={handleToggleLocation} />
          </section>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="sticky top-12 space-y-8">
            {error && (
              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in shake duration-500">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-6 rounded-[2.5rem] font-black text-lg transition-all relative overflow-hidden group shadow-2xl ${isGenerating
                ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-white/20'
                }`}
            >
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    메타데이터 주입 중...
                  </div>
                  {generationProgress && (
                    <div className="mt-2 text-[10px] font-black tracking-widest opacity-50 uppercase">렌더링 진행: {generationProgress.current} / {generationProgress.total}</div>
                  )}
                </div>
              ) : (
                `UGC 생성 시작 (${config.locationIds.length}개 스팟)`
              )}
            </button>

            <div className={`min-h-[500px] rounded-[3rem] glass-panel p-6 flex flex-col relative group transition-all duration-700 bg-black/40 border-white/5 overflow-y-auto custom-scrollbar max-h-[800px]`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-indigo-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">뉴럴 갤러리</span>
                </div>
                {results.some(r => r.status === 'success') && !isGenerating && (
                  <button
                    onClick={handleDownloadAll}
                    className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all"
                  >
                    <Download className="w-3 h-3" /> 일괄 저장
                  </button>
                )}
              </div>

              {isGenerating && results.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-8 px-10 animate-pulse">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center">
                    <Zap className="w-10 h-10 text-indigo-400" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xl font-black tracking-tighter uppercase">필름 그레인 적용 중</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-loose">AI 특유의 매끈함을 제거하고 실제 촬영본의 질감을 구현하고 있습니다.</p>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col gap-6 pb-12">
                  {results.map((res) => (
                    <div key={res.id} className={`w-full aspect-square rounded-[2rem] overflow-hidden relative group/item shadow-2xl border border-white/10 flex flex-col items-center justify-center bg-white/[0.02]`}>
                      {res.status === 'loading' ? (
                        <div className="flex flex-col items-center gap-4 text-indigo-400 animate-pulse">
                          <Loader2 className="w-10 h-10 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">렌더링 중...</span>
                          <span className="text-[8px] text-gray-600">{res.locationName}</span>
                        </div>
                      ) : res.status === 'error' ? (
                        <div className="flex flex-col items-center text-center p-8 space-y-4">
                          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                            {res.errorType === 'safety' ? <ShieldAlert className="w-7 h-7" /> :
                              res.errorType === 'auth' ? <Key className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                          </div>
                          <div>
                            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">{res.errorType} Error</p>
                            <p className="text-gray-500 text-[10px] leading-relaxed max-w-[200px]">{res.errorMessage}</p>
                          </div>
                          <button
                            onClick={() => handleRetry(res.id, res.locationName)}
                            className="px-6 py-2.5 bg-white text-black rounded-full text-[10px] font-black flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                            <RotateCcw className="w-3 h-3" /> 재시도
                          </button>
                        </div>
                      ) : (
                        <>
                          <img src={res.imageUrl} className="w-full h-full object-cover" alt={`UGC ${res.locationName}`} />
                          <div className="absolute top-4 left-4 flex gap-2">
                            <button
                              onClick={() => handleDownload(res.imageUrl, `ugc-${res.locationName.toLowerCase().replace(/\s/g, '-')}`)}
                              className="px-4 py-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-white border border-white/10 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                              <Download className="w-3 h-3" /> {res.locationName} 저장
                            </button>
                          </div>
                          <div className="absolute top-4 right-4 px-3 py-1.5 bg-indigo-600 rounded-full text-[10px] font-black tracking-widest text-white border border-indigo-500/50">
                            RAW {config.quality}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 text-gray-700">
                  <Smartphone className="w-20 h-20 opacity-10" />
                  <div>
                    <p className="font-black text-xl uppercase tracking-widest">갤러리 대기 중</p>
                    <p className="text-[10px] font-bold mt-2 max-w-[200px] mx-auto opacity-40 uppercase leading-relaxed tracking-widest">생성된 초실사 1:1 커머스 스냅이 이곳에 표시됩니다.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UGCMaster;
