"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Sparkles, Download, ImageIcon, RefreshCw, X, Maximize2, Monitor, Clipboard, Layers, Eye, UserCircle, User, Video, Minimize2, ArrowUp, ArrowDown, RotateCcw, CornerUpLeft, CornerUpRight, MoveLeft, MoveRight, Share2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { generatePoseChange, parseGeminiError } from '../services/geminiService';
import { Resolution, AspectRatio, FaceMode, Gender, CameraAngle } from '../types';
import { resizeImage } from '../utils/imageProcessor';
import CustomSelect from './CustomSelect';
import { ServerStatusIndicator } from './ServerStatusIndicator';
import { ImageModal } from './ImageModal';
import { ConfirmModal } from './ConfirmModal';


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

const PoseResultCard = ({
  url,
  index,
  baseImage,
  onSelect
}: {
  url: string,
  index: number,
  baseImage: string | null,
  onSelect: (url: string) => void
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl transition-all hover:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-0.5">COMPLETED</p>
          <h4 className="text-xs font-bold text-white uppercase tracking-tight">생성된 포즈 #{index + 1}</h4>
        </div>
        <div className="text-[9px] text-gray-500 font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Original Image */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">ORIGINAL</p>
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-white/5 relative group cursor-zoom-in" onClick={() => baseImage && onSelect(baseImage)}>
            {baseImage && <img src={baseImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Original" />}
          </div>
        </div>

        {/* Generated Image */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-purple-500 uppercase tracking-widest ml-1">GENERATED</p>
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-purple-500/20 relative group cursor-zoom-in shadow-lg shadow-purple-900/10" onClick={() => onSelect(url)}>
            <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Generated" />
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-500 text-white text-[8px] font-black uppercase rounded tracking-wider">New</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={url}
          download={`pose_${index + 1}.png`}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-3 h-3" />
          저장
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(url);
            toast.success('이미지 주소가 복사되었습니다.');
          }}
          className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/5"
        >
          <Share2 className="w-3 h-3" />
          공유
        </button>
      </div>
    </div>
  );
};

const PoseChange: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [faceRefImage, setFaceRefImage] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [selectedAngles, setSelectedAngles] = useState<CameraAngle[]>(['default']);
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  const [faceMode, setFaceMode] = useState<FaceMode>('HEADLESS');
  const [gender, setGender] = useState<Gender>('UNSPECIFIED');

  const [resultImages, setResultImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const toggleAngle = (angle: CameraAngle) => {
    if (angle === 'default') {
      setSelectedAngles(['default']);
      return;
    }

    setSelectedAngles(prev => {
      const newAngles = prev.filter(a => a !== 'default');
      if (newAngles.includes(angle)) {
        const filtered = newAngles.filter(a => a !== angle);
        return filtered.length === 0 ? ['default'] : filtered;
      } else {
        return [...newAngles, angle];
      }
    });
  };

  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const handleGenerate = async () => {
    if (!baseImage) return;
    setIsLoading(true);
    setResultImages([]);
    setProgress(0);
    setProgressText('작업 준비 중...');

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const faceOptions = { faceMode, gender, faceRefImage };
      const basePrompt = prompt || "Natural fashion model pose, standing, clean minimalist background.";
      
      setProgressText('이미지 최적화 중...');
      // OPTIMIZE IMAGES BEFORE SENDING
      const targetSize = resolution === '1K' ? 1024 : 1536; 
      const optimizedBase = await resizeImage(baseImage, targetSize);
      const optimizedRef = refImage ? await resizeImage(refImage, targetSize) : null;
      
      let optimizedFace = null;
      if (faceRefImage) {
        optimizedFace = await resizeImage(faceRefImage, 1024); 
      }

      const optimizedFaceOptions = { ...faceOptions, faceRefImage: optimizedFace };

      const total = selectedAngles.length;
      let completed = 0;

      const promises = selectedAngles.map(async (angle) => {
         try {
            if (signal.aborted) return null;
            setProgressText(`포즈 생성 중... (${completed + 1}/${total})`);
            
            const url = await generatePoseChange(optimizedBase, optimizedRef, basePrompt, resolution, aspectRatio, optimizedFaceOptions, angle, signal);
            
            if (!signal.aborted && url) {
               setResultImages(prev => [...prev, url]);
            }
            
            return url;
         } catch (err: any) {
            if (signal.aborted || err.message === "작업이 취소되었습니다.") {
                return null;
            }
            console.error(`Generation failed for angle ${angle}`, err);
            return null;
         } finally {
            if (!signal.aborted) {
               completed++;
               const percent = Math.round((completed / total) * 100);
               setProgress(percent);
               setProgressText(`생성 진행 중... ${percent}%`);
            }
         }
      });

      const results = await Promise.all(promises);
      if (signal.aborted) return; // Stop if aborted

      const successfulResults = results.filter((url): url is string => url !== null);
      
      if (successfulResults.length === 0) {
          toast.error("이미지 생성에 실패했거나 취소되었습니다.");
      } else {
          toast.success(`${successfulResults.length}장의 이미지가 생성되었습니다.`);
      }

    } catch (error: any) {
       if (signal.aborted || error.message === "작업이 취소되었습니다.") {
           return; // Already handled in handleStop
       }
       const parsed = parseGeminiError(error);
       toast.error(parsed.message);
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
      link.href = resultImages[i];
      link.download = `pose_${i + 1}.png`;
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
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">포즈 변경</h3>
                <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">DYNAMIC RE-POSING</p>
              </div>
            </div>
            <ServerStatusIndicator />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">원본 이미지 (필수)</label>
              <div
                onClick={() => document.getElementById('pc-base-upload')?.click()}
                className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${baseImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
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
                className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${refImage ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-black'
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
                { id: 'left-30', label: '좌측 30°', icon: <CornerUpLeft className="w-4 h-4" /> },
                { id: 'left-40', label: '좌측 40°', icon: <CornerUpLeft className="w-4 h-4 rotate-12" /> },
                { id: 'right-30', label: '우측 30°', icon: <CornerUpRight className="w-4 h-4" /> },
                { id: 'right-40', label: '우측 40°', icon: <CornerUpRight className="w-4 h-4 -rotate-12" /> },
                { id: 'left-side', label: '좌측면', icon: <MoveLeft className="w-4 h-4" /> },
                { id: 'right-side', label: '우측면', icon: <MoveRight className="w-4 h-4" /> },
              ].map((angle) => (
                <button
                  key={angle.id}
                  onClick={() => toggleAngle(angle.id as CameraAngle)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${selectedAngles.includes(angle.id as CameraAngle) ? 'bg-white text-black border-white shadow-xl' : 'bg-black border-white/10 text-gray-600 hover:border-white/30'
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

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <CustomSelect
                label="해상도"
                value={resolution}
                onChange={(val) => setResolution(val as Resolution)}
                options={[
                  { value: '1K', label: '1K' },
                  { value: '2K', label: '2K' },
                  { value: '4K', label: '4K' }
                ]}
                icon={<Monitor className="w-4 h-4" />}
              />
            </div>
            <div className="space-y-3">
              <CustomSelect
                label="비율"
                value={aspectRatio}
                onChange={(val) => setAspectRatio(val as AspectRatio)}
                options={[
                  { value: '1:1', label: '1:1' },
                  { value: '9:16', label: '9:16' },
                  { value: '4:3', label: '4:3' }
                ]}
                icon={<Maximize2 className="w-4 h-4" />}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-3">
               <CustomSelect
                 label="얼굴 보정 (Face)"
                 value={faceMode}
                 onChange={(val) => setFaceMode(val as FaceMode)}
                 options={[
                   { value: 'HEADLESS', label: '얼굴 제거/크롭 (Headless) [기본]' },
                   { value: 'OFF', label: '선택 안함 (원본 유지)' },
                   { value: 'ON', label: '얼굴 교체 (Face Swap)' }
                 ]}
                 icon={<UserCircle className="w-4 h-4" />}
               />
             </div>
             <div className="space-y-3">
                <CustomSelect
                  label="모델 성별"
                  value={gender}
                  onChange={(val) => setGender(val as Gender)}
                  options={[
                    { value: 'UNSPECIFIED', label: '선택 안함' },
                    { value: 'Female', label: '여성 (Female)' },
                    { value: 'Male', label: '남성 (Male)' }
                  ]}
                  icon={<User className="w-4 h-4" />}
                  // Disable gender if Face Mode is OFF or HEADLESS
                  disabled={faceMode === 'HEADLESS' || faceMode === 'OFF'}
                />
             </div>
          </div>
          
          {faceMode === 'ON' && (
             <div className="space-y-3 animate-in fade-in slide-in-from-top-2 p-6 bg-white/5 rounded-2xl border border-white/10">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">얼굴 참조 이미지 (Face Reference)</label>
               {/* Simplified Face Ref UI here if needed, or reuse handleImageUpload logic */}
               <div onClick={() => document.getElementById('pc-face-upload')?.click()} className="cursor-pointer flex items-center gap-4 bg-black p-4 rounded-xl border border-white/10 hover:border-white/30 transition-all">
                  {faceRefImage ? (
                    <img src={faceRefImage} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><UserCircle className="w-5 h-5 text-gray-500" /></div>
                  )}
                  <div className="flex-1">
                     <p className="text-xs font-bold text-gray-300">{faceRefImage ? "참조 이미지 설정됨" : "얼굴 사진 업로드"}</p>
                     <p className="text-[9px] text-gray-600">ID 보존을 위해 얼굴이 선명한 사진을 사용하세요</p>
                  </div>
                  <input id="pc-face-upload" type="file" className="hidden" onChange={(e) => handleImageUpload('face', e)} />
               </div>
             </div>
          )}

          {faceMode === 'HEADLESS' && (
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl animate-in fade-in">
                  <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                          <p className="text-xs font-bold text-indigo-300 mb-1">헤드리스 모드 (Headless Mode)</p>
                          <p className="text-[10px] text-indigo-200/70 leading-relaxed">
                              얼굴을 자동으로 제거하고 목 아래 부분만 크롭합니다.<br/>
                              포즈 변경이나 배경 변경 없이, 오직 얼굴만 제거된 상품 중심 이미지가 생성됩니다.
                          </p>
                      </div>
                  </div>
              </div>
          )}


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
               <Sparkles className="w-6 h-6" />
               포즈 렌더링 실행 (선택 {selectedAngles.length}개)
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 flex flex-col min-h-[700px] relative">
         {/* Layout Header... */}
         
         {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-gray-500 bg-black/80 z-20 backdrop-blur-md rounded-[2.5rem]">
                 <div className="w-64 space-y-3">
                     <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                     </div>
                     <p className="text-center text-xs text-blue-400 font-bold animate-pulse">
                        {progressText}
                     </p>
                 </div>
                 <p className="text-[10px] text-gray-600 font-medium">10-20초 정도 소요됩니다</p>
            </div>
          )}

      {/* START: Header Section */}
      <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <Monitor className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter">포즈 변경 결과</h3>
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

        <div className={`flex-1 grid gap-4 ${resultImages.length === 1 ? 'grid-cols-1 max-w-[400px]' : 'grid-cols-2 lg:grid-cols-3'} bg-black/40 border border-white/5 rounded-[2rem] p-6 relative content-start`}>
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-gray-500 bg-black/80 z-10 backdrop-blur-md rounded-[2rem]">
              <div className="w-16 h-16 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-[0.4em] animate-pulse">Computing Re-pose...</p>
            </div>
          ) : resultImages.length > 0 ? (
            resultImages.map((url, i) => (
              <PoseResultCard
                key={i}
                url={url}
                index={i}
                baseImage={baseImage}
                onSelect={setSelectedImage}
              />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-10 h-full">
              <Layers className="w-24 h-24 mx-auto mb-8" />
              <p className="text-sm font-black uppercase tracking-[0.5em]">결과물 대기 중</p>
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

export default PoseChange;
