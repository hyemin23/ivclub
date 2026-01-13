
import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Sparkles, Download, ImageIcon, RefreshCw, X, Maximize2, Monitor, Clipboard, Layers, Eye, UserCircle, User, Video, Minimize2, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useStore } from '../store';
import { generatePoseChange } from '../services/geminiService';
import { Resolution, AspectRatio, FaceMode, Gender, CameraAngle } from '../types';

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
      className="relative w-full h-full overflow-hidden cursor-zoom-in rounded-3xl"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <img 
        src={src} 
        alt={alt}
        className="w-full h-full object-contain transition-transform duration-500 ease-out"
        style={{
          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          transform: isHovered ? 'scale(2)' : 'scale(1)'
        }}
      />
    </div>
  );
};

const PoseChange: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [faceRefImage, setFaceRefImage] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('default');
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

  const handleGenerate = async () => {
    if (!baseImage) return;
    setIsLoading(true);
    setResultImages([]);
    
    try {
      const faceOptions = { faceMode, gender, faceRefImage };
      const finalPrompt = prompt || "Natural fashion model pose, standing, clean minimalist background.";
      const tasks = Array.from({ length: imageCount }).map(() => 
        generatePoseChange(baseImage, refImage, finalPrompt, resolution, aspectRatio, faceOptions, cameraAngle)
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
      link.download = `pose_${i + 1}.png`;
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
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">포즈 변경</h3>
                <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">DYNAMIC RE-POSING</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">원본 이미지 (필수)</label>
              <div 
                onClick={() => document.getElementById('pc-base-upload')?.click()}
                className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
                  baseImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
                }`}
              >
                {baseImage ? (
                  <img src={baseImage} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center p-2 opacity-40">
                    <ImageIcon className="w-8 h-8 mx-auto mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">상품 업로드</span>
                  </div>
                )}
                <input id="pc-base-upload" type="file" className="hidden" onChange={(e) => handleImageUpload('base', e)} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">참고 포즈 (선택)</label>
              <div 
                onClick={() => document.getElementById('pc-ref-upload')?.click()}
                className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
                  refImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
                }`}
              >
                {refImage ? (
                  <>
                    <img src={refImage} className="w-full h-full object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); setRefImage(null); }} className="absolute top-4 right-4 p-2 bg-black/80 rounded-full hover:bg-red-500 transition-colors z-10"><X className="w-4 h-4 text-white" /></button>
                  </>
                ) : (
                  <div className="text-center p-2 opacity-20">
                    <Sparkles className="w-8 h-8 mx-auto mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">포즈 업로드</span>
                  </div>
                )}
                <input id="pc-ref-upload" type="file" className="hidden" onChange={(e) => handleImageUpload('ref', e)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">카메라 앵글 조절</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { id: 'default', label: '리셋', icon: <RotateCcw className="w-4 h-4" /> },
                { id: 'front', label: '정면', icon: <Maximize2 className="w-4 h-4" /> },
                { id: 'side', label: '측면', icon: <Minimize2 className="w-4 h-4 rotate-45" /> },
                { id: 'low', label: '로우', icon: <ArrowUp className="w-4 h-4" /> },
                { id: 'high', label: '하이', icon: <ArrowDown className="w-4 h-4" /> },
                { id: 'full-side', label: '프로필', icon: <Minimize2 className="w-4 h-4" /> }
              ].map((angle) => (
                <button
                  key={angle.id}
                  onClick={() => setCameraAngle(angle.id as CameraAngle)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${
                    cameraAngle === angle.id ? 'bg-white text-black border-white shadow-xl' : 'bg-black border-white/10 text-gray-600 hover:border-white/30'
                  }`}
                >
                  {angle.icon}
                  <span className="text-[9px] font-black uppercase">{angle.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">추가 프롬프트 (선택)</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="특별한 포즈나 설정을 직접 입력하세요..."
              className="w-full h-24 bg-black border border-white/10 rounded-2xl px-5 py-4 text-xs focus:border-white outline-none transition-all resize-none text-gray-300 font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
             <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">해상도</label>
              <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none">
                <option value="1K">1K</option><option value="2K">2K</option><option value="4K">4K</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">비율</label>
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none">
                <option value="1:1">1:1</option><option value="9:16">9:16</option><option value="4:3">4:3</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">생성 수</label>
              <select value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black focus:border-white outline-none appearance-none">
                <option value={1}>1</option><option value={2}>2</option><option value={4}>4</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading || !baseImage}
            className="w-full py-6 rounded-[2rem] bg-white hover:bg-gray-200 text-black font-black text-sm shadow-2xl shadow-white/10 disabled:opacity-20 transition-all flex items-center justify-center gap-4 group"
          >
            {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            포즈 렌더링 실행 ({imageCount})
          </button>
        </div>
      </div>

      <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 flex flex-col min-h-[700px]">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <Monitor className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter">라이브 모니터</h3>
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

        <div className={`flex-1 grid gap-6 ${resultImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} bg-black/40 border border-white/5 rounded-[2rem] p-6 relative`}>
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-gray-500 bg-black/80 z-10 backdrop-blur-md rounded-[2rem]">
              <div className="w-16 h-16 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-[0.4em] animate-pulse">Computing Re-pose...</p>
            </div>
          ) : resultImages.length > 0 ? (
            resultImages.map((url, i) => (
              <div key={i} className="relative group rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/40 transition-all">
                <ZoomImage src={url} onClick={() => setSelectedImage(url)} />
                <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all z-20">
                  <button onClick={() => setSelectedImage(url)} className="p-3 bg-white text-black rounded-2xl shadow-xl hover:scale-110 transition-transform"><Eye className="w-5 h-5" /></button>
                  <a href={url} download={`pose_${i}.png`} className="p-3 bg-white/10 border border-white/20 rounded-2xl text-white hover:scale-110 transition-transform"><Download className="w-5 h-5" /></a>
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
          <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-500 rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default PoseChange;
