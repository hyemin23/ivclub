"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Download, ImageIcon, RefreshCw, X, Maximize2, Monitor,
  Clipboard, Layers, Eye, CheckSquare, Square, Feather, ShieldCheck,
  Wind, Maximize, CheckCircle, Sun, Droplet, Star, Heart, Zap, Camera,
  Smartphone, Watch, Box, Tag, ShoppingBag, Truck, CreditCard
} from 'lucide-react';
import { generateDetailExtra, generateProductUSPs, USPBlock } from '../services/geminiService';
import { renderToStaticMarkup } from 'react-dom/server';
import * as fabric from 'fabric';
import { Resolution, AspectRatio } from '../types';

// Client-side USP Rule System
const getIconRuleSet = (inputKeyword: string) => {
  // Default Set
  const defaultSet = [
    { icon: "layers", title: "고급 원단", desc: "밀도 높은 조직으로 탄탄한 착용감" },
    { icon: "check-circle", title: "뛰어난 마감", desc: "깔끔한 봉제와 정돈된 실루엣" },
    { icon: "heart", title: "부드러운 터치", desc: "피부에 닿는 감촉이 편안합니다" },
    { icon: "maximize", title: "안정적인 핏", desc: "단독 또는 레이어드로 활용도 높음" }
  ];

  // Denim Set
  const denimSet = [
    { icon: "layers", title: "프리미엄 데님", desc: "밀도 높은 코튼의 탄탄한 조직감" },
    { icon: "check-circle", title: "이중 스티치", desc: "견고한 봉제로 내구성을 높였습니다" },
    { icon: "droplet", title: "샌드 워싱", desc: "자연스러운 컬러감과 부드러운 터치" },
    { icon: "maximize", title: "트렌디한 핏", desc: "여유로운 실루엣으로 활동성 보장" }
  ];

  // Summer/Linen Set
  const summerSet = [
    { icon: "wind", title: "우수한 통기성", desc: "바람이 잘 통하는 쾌적한 쿨링 소재" },
    { icon: "check-circle", title: "꼼꼼한 마감", desc: "얇은 원단도 튼튼하게 마감했습니다" },
    { icon: "sun", title: "산뜻한 촉감", desc: "몸에 달라붙지 않는 시원한 터치감" },
    { icon: "feather", title: "가벼운 무게", desc: "하루 종일 입어도 피로감 없는 경량감" }
  ];

  const key = (inputKeyword || "").toLowerCase();
  if (key.includes("데님") || key.includes("청") || key.includes("진")) return denimSet;
  if (key.includes("여름") || key.includes("린넨") || key.includes("쿨")) return summerSet;

  return defaultSet;
};

// Icon Helper
const getIconSvgUrl = (iconName: string): string => {
  const icons: any = {
    feather: Feather, 'shield-check': ShieldCheck, wind: Wind, maximize: Maximize,
    'check-circle': CheckCircle, sun: Sun, droplet: Droplet, star: Star, heart: Heart,
    zap: Zap, camera: Camera, smartphone: Smartphone, watch: Watch, layers: Layers,
    box: Box, tag: Tag, 'shopping-bag': ShoppingBag, truck: Truck, 'credit-card': CreditCard
  };
  const IconComponent = icons[iconName] || CheckCircle;
  const svgString = renderToStaticMarkup(<IconComponent size={64} color="#333" />);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};

const STYLE_PRESETS = [
  {
    id: 'single-flat',
    name: '단일 누끼컷',
    prompt: `[NanoBanana PRO MODE]
Analyze the uploaded product image carefully.
Create a clean flat cutout product image showing ONLY the main product itself.
The background must be pure white (#FFFFFF).
Maintain the exact colors, textures, materials, and silhouettes of the product.
No model, no mannequin, no shadows.
Professional e-commerce catalog look.`
  },
  {
    id: 'collage-detail',
    name: '디테일 콜라주',
    prompt: `[NanoBanana PRO MODE]
Create a sophisticated collage showing multiple close-up detail views of the product.
Focus on stitching, fabric texture, buttons, and unique design elements.
Maintain high color accuracy.
Arrange the views in a clean, modern grid or balanced composition.
High-end fashion editorial style.`
  },
  {
    id: 'lifestyle-context',
    name: '라이프스타일 배경',
    prompt: `[NanoBanana PRO MODE]
Place the product in a minimalist high-end lifestyle setting.
Soft natural shadows, professional studio lighting.
The background should be clean but have depth (e.g., stone, wood, or modern architecture).
Focus on the product as the center of attention.
Maintain realistic proportions and textures.`
  },
  {
    id: 'collage-4-private',
    name: '프라이빗 4분할 (보안)',
    prompt: `[NanoBanana PRO MODE - PRIVATE 4-GRID COLLAGE]
Create a strict 2x2 grid layout (4 panels) showing distinct close-up shots of the product.
The 4 panels must be arranged in a square 2x2 formation.

[CONTENT]
- Panel 1: Fabric texture extreme close-up
- Panel 2: Stitching or button detail
- Panel 3: Key design feature
- Panel 4: Another angle or material detail

[SECURITY & PRIVACY - CRITICAL]
REMOVE all brand labels, tags, logos, and text.
If a tag is visible, it must be BLANK or BLURRED.
Clean fabric texture without writing.
Do NOT include any legible text.

[NEGATIVE PROMPT]
text, brand name, logo, writing, letters on tag, 6 panel, 3x2 grid, too many shots, asymmetrical layout, watermark.`
  },
  {
    id: 'rose-cut',
    name: '🌹 장미컷 디테일',
    prompt: `[NanoBanana PRO MODE]
**SQUARE 1:1 ASPECT RATIO. WHITE BACKGROUND. HIGH-KEY FASHION PHOTOGRAPHY.**
Extreme macro close-up of the fabric texture.
The fabric is artfully twisted into a soft **SPIRAL SWIRL shape**.
Focus strictly on the weave, softness, and tactile quality.
Bright, clean, airy atmosphere.
**NEGATIVE:** dark, low light, gray background, entire pants shape, buttons, zippers, folded clothes, shadows, distorted aspect ratio.`
  }
];

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

const DetailExtra: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(STYLE_PRESETS[0].prompt);
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0].id);
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageCount, setImageCount] = useState<number>(1);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fabricText, setFabricText] = useState('');
  const [uspKeywords, setUspKeywords] = useState('');

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

  const handleImageUpload = (type: 'base' | 'ref', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("파일 용량이 너무 큽니다. 20MB 이하의 이미지를 사용해주세요.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'base') setBaseImage(reader.result as string);
        else setRefImage(reader.result as string);
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    const preset = STYLE_PRESETS.find(s => s.id === styleId);
    if (preset) {
      setPrompt(preset.prompt);
    }
  };

  /**
   * 3. 최종 합성 함수 (Layout Composer) - Color & Background Fix
   * - Background: Solid White (#FFFFFF) - NO Transparency
   * - Text Color: Dark Grey / Black
   */
  const renderHighEndBlock = async (imageUrl: string, userKeyword: string) => {
    const BASE_SIZE = 1024;

    // A. 캔버스 초기화 (배경색 명시적 지정)
    const canvasEl = document.createElement('canvas');
    canvasEl.width = BASE_SIZE;
    canvasEl.height = BASE_SIZE;

    const canvas = new fabric.StaticCanvas(canvasEl, {
      width: BASE_SIZE,
      height: BASE_SIZE,
      backgroundColor: '#FFFFFF' // ✅ 배경색 흰색 고정 (투명 방지)
    });

    // B. 안전장치: 흰색 사각형을 맨 밑에 한 번 더 깝니다.
    const bgRect = new fabric.Rect({
      width: BASE_SIZE,
      height: BASE_SIZE,
      fill: '#FFFFFF',
      selectable: false
    });
    canvas.add(bgRect);

    // C. 데이터 가져오기
    const uspData = getIconRuleSet(userKeyword) || [];

    // D. 레이아웃 계산
    const centerX = BASE_SIZE / 2;
    const topSectionHeight = BASE_SIZE * 0.6; // 상단 60%
    const topImageCenterY = topSectionHeight / 2;

    const imgMargin = BASE_SIZE * 0.03;
    const imgWidth = BASE_SIZE - (imgMargin * 2);
    const imgHeight = topSectionHeight - (imgMargin * 2);
    const borderRadius = BASE_SIZE * 0.025;

    // E. 이미지 로드 & 배치
    const img = await fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' });
    const scale = Math.max(imgWidth / img.width!, imgHeight / img.height!);

    img.set({
      scaleX: scale, scaleY: scale,
      left: centerX, top: topImageCenterY,
      originX: 'center', originY: 'center',
      clipPath: new fabric.Rect({
        width: imgWidth, height: imgHeight,
        left: centerX, top: topImageCenterY,
        originX: 'center', originY: 'center',
        rx: borderRadius, ry: borderRadius,
        absolutePositioned: true
      })
    });

    // 그림자: 흰 배경이므로 더 진하고 선명하게 조정
    img.set({
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.2)', blur: 30, offsetY: 15 })
    });
    canvas.add(img);

    // F. 이미지 위 중앙 텍스트 (COTTON 100%) - 이건 흰색 유지 (이미지 위니까)
    const mainText = new fabric.Text("COTTON 100%", {
      fontFamily: 'serif',
      fontSize: BASE_SIZE * 0.07,
      fill: '#FFFFFF', // ✅ 이미지 위 글씨는 흰색 유지
      left: centerX, top: topImageCenterY,
      originX: 'center', originY: 'center',
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.5)", blur: 15 })
    });
    canvas.add(mainText);

    // G. 하단 아이콘 & 텍스트 배치 (흰 배경 위니까 검은 글씨로!)
    const startY = topSectionHeight + (BASE_SIZE * 0.05);
    const colWidth = BASE_SIZE / 4;

    for (let i = 0; i < uspData.length; i++) {
      const item = uspData[i];
      const iconCenterX = (colWidth * i) + (colWidth / 2);

      // 1. 아이콘
      const iconUrl = getIconSvgUrl(item.icon);
      const iconImg = await fabric.Image.fromURL(iconUrl);
      // Relative Icon Size
      const iconSize = BASE_SIZE * 0.06;
      const iconScale = iconSize / 64;

      iconImg.set({
        left: iconCenterX,
        top: startY,
        originX: 'center',
        originY: 'top',
        scaleX: iconScale,
        scaleY: iconScale
      });
      canvas.add(iconImg);

      // 2. 제목 (Bold) - ✅ 색상 변경: 흰색 -> 진한 회색 (#333)
      const titleText = new fabric.Text(item.title, {
        fontFamily: 'sans-serif', fontWeight: 'bold',
        fontSize: BASE_SIZE * 0.022,
        fill: '#333333', // Dark Grey
        left: iconCenterX, top: startY + (BASE_SIZE * 0.08),
        originX: 'center'
      });
      canvas.add(titleText);

      // 3. 설명 (Regular) - ✅ 색상 변경: 흰색 -> 연한 회색 (#666)
      const descText = new fabric.Textbox(item.desc, {
        fontFamily: 'sans-serif',
        fontSize: BASE_SIZE * 0.017,
        fill: '#666666', // Medium Grey
        left: iconCenterX, top: startY + (BASE_SIZE * 0.12),
        originX: 'center',
        width: colWidth * 0.85, textAlign: 'center', splitByGrapheme: true,
        fontFamily: 'sans-serif',
      });
      canvas.add(descText);
    }

    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: 'png', quality: 1.0 });
    canvas.dispose();
    return dataUrl;
  };

  const handleGenerate = async () => {
    if (!baseImage) return;
    setIsLoading(true);
    setResultImages([]);

    try {
      if (selectedStyle === 'rose-cut') {
        // 1. Generate Rose Cut Image with Strength 0.25 and 1024 Resolution
        const aiGeneratedUrl = await generateDetailExtra(
          baseImage,
          refImage,
          prompt,
          '1024x1024' as Resolution, // Force High Res
          '1:1', // Force Square
          { imageStrength: 0.25 } // Force low adherence
        );

        // 2. Generate Result (Client-side Rule System)
        const finalUrl = await renderHighEndBlock(aiGeneratedUrl, uspKeywords);

        setResultImages([finalUrl]);
        setIsLoading(false);
      } else {
        // Existing AI Logic
        for (let i = 0; i < imageCount; i++) {
          try {
            const url = await generateDetailExtra(baseImage, refImage, prompt, resolution, aspectRatio);
            setResultImages(prev => [...prev, url]);
          } catch (err) {
            console.error(`Image ${i + 1} failed`, err);
          }
        }
      }
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
      link.download = `detail_${i + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-indigo-400" />
              <h3 className="text-xl font-bold uppercase tracking-tight">Detail Extra</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Clipboard className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Ctrl+V 붙여넣기 활성</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">상품 원본 사진 (필수)</label>
                <div
                  onClick={() => document.getElementById('de-base-upload')?.click()}
                  className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${baseImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
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
                      <span className="text-[9px] text-slate-500 font-bold uppercase">업로드 또는 붙여넣기</span>
                    </div>
                  )}
                  <input id="de-base-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('base', e)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">참고 디테일컷 (선택)</label>
                <div
                  onClick={() => document.getElementById('de-ref-upload')?.click()}
                  className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${refImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
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
                      <span className="text-[9px] text-slate-500 font-bold uppercase">업로드 또는 붙여넣기</span>
                    </div>
                  )}
                  <input id="de-ref-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('ref', e)} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">스타일 프리셋</label>
              <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${selectedStyle === style.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                  >
                    {selectedStyle === style.id ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedStyle === 'rose-cut' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">원단 텍스트 입력</label>
                  <input
                    type="text"
                    value={fabricText}
                    onChange={(e) => setFabricText(e.target.value)}
                    placeholder="예: COTTON 100%"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[11px] focus:border-indigo-400 outline-none transition-all text-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">제품 특징 키워드 (선택사항)</label>
                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md font-bold">AI AUTO</span>
                  </div>
                  <input
                    type="text"
                    value={uspKeywords}
                    onChange={(e) => setUspKeywords(e.target.value)}
                    placeholder="예: 스판끼 좋음, YKK 지퍼 (비워두면 AI가 자동 분석)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[11px] focus:border-indigo-400 outline-none transition-all text-slate-300 placeholder:text-slate-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">프롬프트</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">해상도</label>
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                  {(['2K', '4K'] as Resolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${resolution === res ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">비율</label>
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                  {(['1:1', '3:4', '9:16'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${aspectRatio === ratio ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">생성 개수 ({imageCount}장)</label>
              <input
                type="range"
                min="1"
                max="4"
                value={imageCount}
                onChange={(e) => setImageCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !baseImage}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/25 ${isLoading || !baseImage
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500'
                }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating High-End Assets...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Detail Extraction
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold uppercase tracking-tight">Generated Assets</h3>
            {resultImages.length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:bg-slate-900 transition-all flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                Download All
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {resultImages.map((img, idx) => (
              <div
                key={idx}
                className="group relative aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedImage(img)}
              >
                <ZoomImage src={img} alt={`Generated ${idx}`} onClick={() => setSelectedImage(img)} />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = img;
                      link.download = `detail_${idx + 1}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-indigo-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(img)}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-indigo-600 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {resultImages.length === 0 && (
              <div className="col-span-2 aspect-[2/1] bg-slate-950/50 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600">
                <Layers className="w-16 h-16 mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">결과물이 이곳에 표시됩니다.</p>
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
    </div>
  );
};

export default DetailExtra;
