"use client";

import React from 'react';
import { useStore } from '../store';
import { Image, Upload, CheckCircle2, Circle, X, Type } from 'lucide-react';

const BrandAssetManager: React.FC = () => {
  const { brandAssets, toggleBrandAsset, updateBrandAsset, setProductInfo } = useStore();

  // Migration: Ensure 'event' and 'model_info' assets exist
  React.useEffect(() => {
    let newAssets = [...brandAssets];
    let changed = false;

    if (!newAssets.some(a => a.id === 'event')) {
      newAssets = [
        { id: 'event', name: '이벤트/안내사항 (최상단)', imageUrl: null, isEnabled: true, type: 'header' },
        ...newAssets
      ];
      changed = true;
    }

    if (!newAssets.some(a => a.id === 'model_info')) {
      // Find where to insert (e.g., after notice or at end)
      newAssets = [
        ...newAssets,
        {
          id: 'model_info',
          name: '모델 정보 (텍스트 오버레이)',
          imageUrl: null,
          isEnabled: true,
          type: 'model_info',
          textOverlay: {
            content: 'Model: 168cm / 48kg',
            x: 50,
            y: 90,
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 'bold'
          }
        }
      ];
      changed = true;
    }

    if (changed) {
      useStore.setState({ brandAssets: newAssets });
    }
  }, [brandAssets]);

  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!file.type.startsWith('image/') && !validExtensions.includes(ext)) {
        alert('이미지 파일(JPG, PNG, WEBP, GIF)만 업로드 가능합니다.');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        alert('파일 크기는 20MB 이하여야 합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateBrandAsset(id, { imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Image className="w-4 h-4 text-indigo-400" />
        <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">브랜드 고정 에셋 (헤더/푸터)</h3>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        상세페이지의 시작과 끝에 항상 고정되는 브랜드만의 에셋을 관리하세요.
        사이즈 가이드, 세탁 방법, 배송 공지 등을 등록해두면 모든 프로젝트에 자동으로 적용됩니다.
      </p>

      <div className="space-y-3">
        {brandAssets.filter(asset => asset.id !== 'size').map((asset) => (
          <div
            key={asset.id}
            className={`p-4 rounded-2xl border transition-all ${asset.isEnabled ? 'bg-slate-800 border-indigo-500/50' : 'bg-slate-950 border-slate-800 opacity-60'
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => toggleBrandAsset(asset.id)}>
                  {asset.isEnabled ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-700" />
                  )}
                </button>
                <span className="text-sm font-bold text-slate-200">{asset.name}</span>
              </div>

              {/* Image Upload Button (Only if no image) */}
              {!asset.imageUrl && (
                <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                  업로드
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(asset.id, e)} />
                </label>
              )}
            </div>

            {asset.imageUrl ? (
              <div className="relative group/image">
                <div className="aspect-[16/5] bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                  <img src={asset.imageUrl} className="w-full h-full object-cover" alt={asset.name} />
                </div>
                {/* Delete Button Overlay (Fixed) */}
                <button
                  onClick={() => {
                    if (confirm('이 에셋 이미지를 삭제하시겠습니까?')) {
                      updateBrandAsset(asset.id, { imageUrl: null });
                    }
                  }}
                  className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-transform hover:scale-105 z-10"
                  title="이미지 삭제"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="aspect-[16/5] bg-slate-900 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-[10px] text-slate-600 italic">
                이미지가 등록되지 않았습니다
              </div>
            )}

            {/* Model Info Text Controls (Moved inside) */}
            {asset.type === 'model_info' && asset.isEnabled && asset.textOverlay && asset.imageUrl && (
              <div className="mt-4 space-y-4 pt-4 border-t border-slate-700/50 bg-slate-900/50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-200">텍스트 오버레이 설정</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={asset.textOverlay.content}
                    onChange={(e) => updateBrandAsset(asset.id, {
                      textOverlay: { ...asset.textOverlay!, content: e.target.value }
                    })}
                    className="flex-1 bg-slate-800 border-slate-700 rounded px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="텍스트 입력 (예: Model: 168cm)"
                  />
                  <input
                    type="color"
                    value={asset.textOverlay.color}
                    onChange={(e) => updateBrandAsset(asset.id, {
                      textOverlay: { ...asset.textOverlay!, color: e.target.value }
                    })}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>가로 위치</span>
                      <span className="text-indigo-400">{asset.textOverlay.x}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100"
                      value={asset.textOverlay.x}
                      onChange={(e) => updateBrandAsset(asset.id, {
                        textOverlay: { ...asset.textOverlay!, x: Number(e.target.value) }
                      })}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>세로 위치</span>
                      <span className="text-indigo-400">{asset.textOverlay.y}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100"
                      value={asset.textOverlay.y}
                      onChange={(e) => updateBrandAsset(asset.id, {
                        textOverlay: { ...asset.textOverlay!, y: Number(e.target.value) }
                      })}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>글자 크기</span>
                    <span className="text-indigo-400">{asset.textOverlay.fontSize}px</span>
                  </div>
                  <input
                    type="range" min="10" max="100"
                    value={asset.textOverlay.fontSize}
                    onChange={(e) => updateBrandAsset(asset.id, {
                      textOverlay: { ...asset.textOverlay!, fontSize: Number(e.target.value) }
                    })}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandAssetManager;
