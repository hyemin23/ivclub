
import React, { useState, useEffect, useCallback } from 'react';
// Added missing Loader2 import
import { Sparkles, Download, ImageIcon, RefreshCw, X, Maximize2, Monitor, Clipboard, Layers, Eye, User, UserSquare, UserCircle, Video, Minimize2, ArrowDown, ArrowUp, RotateCcw, MoveLeft, MoveRight, CornerUpLeft, CornerUpRight, AlertCircle, ShieldAlert, Key, Loader2 } from 'lucide-react';
import { generateFittingVariation, parseGeminiError, GeminiErrorType } from '../services/geminiService';
import { Resolution, AspectRatio, ViewMode, FaceMode, Gender, CameraAngle } from '../types';

interface VariationResult {
  id: string;
  url: string;
  status: 'loading' | 'success' | 'error';
  errorType?: GeminiErrorType;
  errorMessage?: string;
}

const ZoomImage = ({ src, onClick, alt }: { src: string, onClick?: () => void, alt?: string }) => {
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden cursor-zoom-in"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <img 
        src={src} 
        alt={alt}
        className="w-full h-full object-contain transition-transform duration-300 ease-out"
        style={{
          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          transform: isHovered ? 'scale(2.2)' : 'scale(1)'
        }}
      />
    </div>
  );
};

const FittingVariation: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [faceRefImage, setFaceRefImage] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('default');
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageCount, setImageCount] = useState<number>(1);
  
  const [faceMode, setFaceMode] = useState<FaceMode>('OFF');
  const [gender, setGender] = useState<Gender>('Female');

  const [results, setResults] = useState<VariationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
            else if (!refImage) setRefImage(result);
            else setBaseImage(result);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  }, [baseImage, refImage]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleImageUpload = (type: 'base' | 'ref' | 'face', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 용량이 너무 큽니다. 10MB 이하의 이미지를 사용해주세요.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'base') setBaseImage(reader.result as string);
        else if (type === 'ref') setRefImage(reader.result as string);
        else if (type === 'face') setFaceRefImage(reader.result as string);
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSingleResult = async (id: string) => {
    try {
      const faceOptions = { faceMode, gender, faceRefImage };
      const url = await generateFittingVariation(baseImage!, refImage, prompt, viewMode, resolution, aspectRatio, faceOptions, cameraAngle);
      setResults(prev => prev.map(r => r.id === id ? { ...r, url, status: 'success' } : r));
    } catch (error) {
      const parsed = parseGeminiError(error);
      setResults(prev => prev.map(r => r.id === id ? { 
        ...r, 
        status: 'error', 
        errorType: parsed.type, 
        errorMessage: parsed.message 
      } : r));
    }
  };

  const handleGenerate = async () => {
    if (!baseImage) return;
    setIsLoading(true);
    
    const newResults: VariationResult[] = Array.from({ length: imageCount }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      url: '',
      status: 'loading'
    }));
    
    setResults(newResults);
    
    // Sequential generation to avoid hitting concurrent limits and manage individual states better
    for (const res of newResults) {
      await generateSingleResult(res.id);
    }
    
    setIsLoading(false);
  };

  const handleRetry = async (id: string) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, status: 'loading', errorMessage: undefined } : r));
    await generateSingleResult(id);
  };

  const handleDownloadAll = async () => {
    const successResults = results.filter(r => r.status === 'success');
    for (let i = 0; i < successResults.length; i++) {
      const link = document.createElement('a');
      link.href = successResults[i].url;
      link.download = `variation_${i + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const angleOptions = [
    { id: 'default', label: '원본 유지', icon: <RotateCcw className="w-3 h-3" /> },
    { id: 'front', label: '정면(0°)', icon: <Maximize2 className="w-3 h-3" /> },
    { id: 'left-30', label: '좌측 측면(30-45°)', icon: <CornerUpLeft className="w-3 h-3" /> },
    { id: 'right-30', label: '우측 측면(30-45°)', icon: <CornerUpRight className="w-3 h-3" /> },
    { id: 'left-90', label: '완전 좌측(90°)', icon: <MoveLeft className="w-3 h-3" /> },
    { id: 'right-90', label: '완전 우측(90°)', icon: <MoveRight className="w-3 h-3" /> },
    { id: 'left-135', label: '좌측 후면(120-150°)', icon: <MoveLeft className="w-3 h-3 rotate-[135deg]" /> },
    { id: 'right-135', label: '우측 후면(120-150°)', icon: <MoveRight className="w-3 h-3 rotate-[-135deg]" /> },
    { id: 'back', label: '후면(180°)', icon: <ArrowDown className="w-3 h-3" /> },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <h3 className="text-xl font-bold uppercase tracking-tight text-white">피팅 베리에이션 <span className="text-[10px] bg-indigo-600 px-2 py-1 rounded ml-2">PRO MODE</span></h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Clipboard className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Ctrl+V 붙여넣기 활성</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">상품/배경 고정 (MAIN)</label>
                <div 
                  onClick={() => document.getElementById('fv-base-upload')?.click()}
                  className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
                    baseImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                  }`}
                >
                  {baseImage ? (
                    <>
                      <img src={baseImage} className="w-full h-full object-contain" />
                      <button onClick={(e) => { e.stopPropagation(); setBaseImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-3 h-3 text-white" /></button>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <ImageIcon className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                      <span className="text-[9px] text-slate-500 font-bold uppercase">메인 이미지 업로드</span>
                    </div>
                  )}
                  <input id="fv-base-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('base', e)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">포즈 레퍼런스 (POSE ONLY)</label>
                <div 
                  onClick={() => document.getElementById('fv-ref-upload')?.click()}
                  className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
                    refImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                  }`}
                >
                  {refImage ? (
                    <>
                      <img src={refImage} className="w-full h-full object-contain" />
                      <button onClick={(e) => { e.stopPropagation(); setRefImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-3 h-3 text-white" /></button>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <ImageIcon className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                      <span className="text-[9px] text-slate-500 font-bold uppercase">포즈 참고 업로드</span>
                    </div>
                  )}
                  <input id="fv-ref-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('ref', e)} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Video className="w-3 h-3 text-indigo-400" /> 8방향 정밀 카메라 앵글
              </label>
              <div className="grid grid-cols-3 gap-2">
                {angleOptions.map((angle) => (
                  <button
                    key={angle.id}
                    onClick={() => setCameraAngle(angle.id as CameraAngle)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                      cameraAngle === angle.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {angle.icon}
                    <span className="text-[9px] font-bold whitespace-nowrap">{angle.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">프레이밍 (FRAMING)</label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setViewMode('top')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    viewMode === 'top' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="text-[11px] font-bold">상반신컷</span>
                </button>
                <button 
                  onClick={() => setViewMode('full')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    viewMode === 'full' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-[11px] font-bold">전신컷</span>
                </button>
                <button 
                  onClick={() => setViewMode('bottom')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    viewMode === 'bottom' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <UserSquare className="w-5 h-5" />
                  <span className="text-[11px] font-bold">하반신컷</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">모델 얼굴 노출</span>
                </div>
                <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setFaceMode('OFF')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${faceMode === 'OFF' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500'}`}
                  >
                    OFF
                  </button>
                  <button 
                    onClick={() => setFaceMode('ON')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${faceMode === 'ON' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}
                  >
                    ON
                  </button>
                </div>
              </div>

              {faceMode === 'ON' && (
                <div className="grid grid-cols-2 gap-3 animate-in zoom-in-95">
                  <button 
                    onClick={() => setGender('Male')}
                    className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${gender === 'Male' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    남성 모델
                  </button>
                  <button 
                    onClick={() => setGender('Female')}
                    className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${gender === 'Female' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    여성 모델
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">추가 자유 프롬프트 (OPTIONAL)</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="나머지 규칙은 NanoBanana PRO가 준수합니다. 특별히 강조하고 싶은 내용만 입력하세요."
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[11px] focus:border-indigo-400 outline-none transition-all resize-none text-slate-300"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">해상도</label>
                <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-[11px] focus:border-indigo-400 outline-none">
                  <option value="1K">1K</option><option value="2K">2K</option><option value="4K">4K</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">비율</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-[11px] focus:border-indigo-400 outline-none">
                  <option value="1:1">1:1</option><option value="9:16">9:16</option><option value="4:3">4:3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">생성 수</label>
                <select value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-[11px] focus:border-indigo-400 outline-none">
                  <option value={1}>1</option><option value={2}>2</option><option value={4}>4</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading || !baseImage}
              className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              NanoBanana PRO 베리에이션 실행 ({imageCount}장)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-bold uppercase tracking-tight text-white">Variation Results</h3>
          </div>
          <div className="flex items-center gap-4">
            {results.some(r => r.status === 'success') && !isLoading && (
              <button 
                onClick={handleDownloadAll}
                className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[9px] font-black flex items-center gap-2 uppercase tracking-widest transition-all"
              >
                <Download className="w-3 h-3" /> 일괄 저장
              </button>
            )}
          </div>
        </div>

        <div className={`flex-1 grid gap-4 ${results.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden relative overflow-y-auto max-h-[800px]`}>
          {results.length > 0 ? (
            results.map((res, i) => (
              <div key={res.id} className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500 transition-all min-h-[250px] flex items-center justify-center">
                {res.status === 'loading' ? (
                  <div className="flex flex-col items-center gap-4 text-indigo-400 animate-pulse">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Processing...</span>
                  </div>
                ) : res.status === 'error' ? (
                  <div className="flex flex-col items-center text-center p-4 space-y-3">
                    <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                      {res.errorType === 'safety' ? <ShieldAlert className="w-6 h-6" /> : 
                       res.errorType === 'auth' ? <Key className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-red-400 text-[9px] font-black uppercase tracking-widest">{res.errorType} Error</p>
                      <p className="text-gray-500 text-[9px] leading-tight max-w-[120px]">{res.errorMessage}</p>
                    </div>
                    <button 
                      onClick={() => handleRetry(res.id)}
                      className="px-4 py-1.5 bg-white text-black rounded-full text-[9px] font-black flex items-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> 재시도
                    </button>
                  </div>
                ) : (
                  <>
                    <ZoomImage src={res.url} onClick={() => setSelectedImage(res.url)} />
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={() => setSelectedImage(res.url)} className="p-2 bg-indigo-600 rounded-lg text-white hover:scale-110 transition-transform"><Eye className="w-4 h-4" /></button>
                      <a href={res.url} download={`fitting_variation_${i}.png`} className="p-2 bg-slate-800 rounded-lg text-white hover:scale-110 transition-transform"><Download className="w-4 h-4" /></a>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20 h-full">
              <Layers className="w-16 h-16 mx-auto mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">결과물이 이곳에 표시됩니다.</p>
              <p className="text-[10px] mt-2 italic">Main 이미지와 Pose 이미지를 선택하세요.</p>
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10" onClick={() => setSelectedImage(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default FittingVariation;
