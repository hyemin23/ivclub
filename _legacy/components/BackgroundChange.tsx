
import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Download, ImageIcon, RefreshCw, X, Monitor, Clipboard, Layers, Eye, Wallpaper, UserCircle } from 'lucide-react';
import { generateBackgroundChange } from '../services/geminiService';
import { Resolution, AspectRatio, FaceMode, Gender } from '../types';

const ZoomImage = ({ src, onClick }: { src: string, onClick?: () => void }) => {
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
      className="relative w-full h-full overflow-hidden cursor-zoom-in rounded-3xl"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <img 
        src={src} 
        className="w-full h-full object-contain transition-transform duration-500 ease-out"
        style={{
          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          transform: isHovered ? 'scale(2)' : 'scale(1)'
        }}
      />
    </div>
  );
};

const BackgroundChange: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [bgRefImage, setBgRefImage] = useState<string | null>(null);
  const [faceRefImage, setFaceRefImage] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageCount, setImageCount] = useState<number>(1);
  
  const [faceMode, setFaceMode] = useState<FaceMode>('OFF');
  const [gender, setGender] = useState<Gender>('Female');

  const [resultImages, setResultImages] = useState<string[]>([]);
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

  const handleImageUpload = (type: 'base' | 'bg' | 'face', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'base') setBaseImage(reader.result as string);
        else if (type === 'bg') setBgRefImage(reader.result as string);
        else if (type === 'face') setFaceRefImage(reader.result as string);
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!baseImage) return;
    setIsLoading(true);
    setResultImages([]);
    
    try {
      const faceOptions = { faceMode, gender, faceRefImage };
      const tasks = Array.from({ length: imageCount }).map(() => 
        generateBackgroundChange(baseImage, bgRefImage, prompt, resolution, aspectRatio, faceOptions)
      );
      const results = await Promise.all(tasks);
      setResultImages(results);
    } catch (error) {
      console.error(error);
      alert("이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < resultImages.length; i++) {
      const link = document.createElement('a');
      link.href = resultImages[i];
      link.download = `background_${i + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
                  baseImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
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
                className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
                  bgRefImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
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

          {/* Face Selection - Styled as Pro Options */}
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCircle className="w-5 h-5 text-gray-400" />
                <span className="text-[11px] font-black uppercase tracking-widest">얼굴 데이터 지능</span>
              </div>
              <div className="flex p-1 bg-black rounded-xl border border-white/10">
                <button onClick={() => setFaceMode('OFF')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${faceMode === 'OFF' ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}>Off</button>
                <button onClick={() => setFaceMode('ON')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${faceMode === 'ON' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500'}`}>On</button>
              </div>
            </div>

            {faceMode === 'ON' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setGender('Male')} className={`py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${gender === 'Male' ? 'bg-white text-black' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}>Male</button>
                  <button onClick={() => setGender('Female')} className={`py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${gender === 'Female' ? 'bg-white text-black' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}>Female</button>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">아이덴티티 참고 (선택)</label>
                  <div onClick={() => document.getElementById('bgc-face-upload')?.click()} className={`relative aspect-[3/1] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${faceRefImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'}`}>
                    {faceRefImage ? (
                      <img src={faceRefImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center gap-3 opacity-20">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">참고 얼굴 업로드</span>
                      </div>
                    )}
                    <input id="bgc-face-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('face', e)} />
                  </div>
                </div>
              </div>
            )}
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

          <button 
            onClick={handleGenerate}
            disabled={isLoading || !baseImage}
            className="w-full py-6 rounded-[2rem] bg-white hover:bg-gray-200 text-black font-black text-sm shadow-2xl shadow-white/10 disabled:opacity-20 transition-all flex items-center justify-center gap-4 group"
          >
            {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
            배경 합성 실행 ({imageCount})
          </button>
        </div>
      </div>

      <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 flex flex-col min-h-[700px]">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <Monitor className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter">갤러리</h3>
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

        <div className={`flex-1 grid gap-6 ${resultImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} bg-black/40 border border-white/5 rounded-[2rem] p-6 overflow-hidden relative`}>
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-gray-500 bg-black/80 z-10 backdrop-blur-md">
              <div className="w-16 h-16 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.4em] animate-pulse">Computing Environment</p>
                <p className="text-[9px] text-gray-600 mt-2 font-bold">Integrating high-res textures...</p>
              </div>
            </div>
          ) : resultImages.length > 0 ? (
            resultImages.map((url, i) => (
              <div key={i} className="relative group rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/40 transition-all">
                <ZoomImage src={url} onClick={() => setSelectedImage(url)} />
                <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                  <button onClick={() => setSelectedImage(url)} className="p-3 bg-white text-black rounded-2xl shadow-xl hover:scale-110 transition-transform"><Eye className="w-5 h-5" /></button>
                  <a href={url} download={`result_${i}.png`} className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:scale-110 transition-transform"><Download className="w-5 h-5" /></a>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-10 h-full">
              <Layers className="w-24 h-24 mx-auto mb-8" />
              <p className="text-sm font-black uppercase tracking-[0.5em]">결과물 대기 중</p>
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500 backdrop-blur-3xl" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-10 right-10 p-5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10" onClick={() => setSelectedImage(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(255,255,255,0.1)] animate-in zoom-in-95 duration-500 rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default BackgroundChange;
