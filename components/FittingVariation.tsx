"use client";

import React from 'react';
import { Sparkles, Clipboard, Monitor, Download } from 'lucide-react';
import { useFittingVariation } from '../hooks/useFittingVariation';
import { FittingUploader } from './fitting/FittingUploader';
import { FittingControls } from './fitting/FittingControls';
import { FittingResultGrid } from './fitting/FittingResultGrid';

interface FittingVariationProps {
  onImageSelect?: (imageUrl: string) => void;
}

const FittingVariation: React.FC<FittingVariationProps> = ({ onImageSelect }) => {
  const {
    baseImage, setBaseImage,
    refImage, setRefImage,
    faceRefImage, setFaceRefImage,
    prompt, setPrompt,
    viewMode, setViewMode,
    cameraAngle, setCameraAngle,
    resolution, setResolution,
    aspectRatio, setAspectRatio,
    imageCount, setImageCount,
    faceMode, setFaceMode,
    gender, setGender,
    results,
    isLoading,
    handleImageUpload,
    handleGenerate,
    handleRetry,
    handleDownloadAll,
  } = useFittingVariation();

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <FittingUploader
              baseImage={baseImage}
              refImage={refImage}
              setBaseImage={setBaseImage}
              setRefImage={setRefImage}
              handleImageUpload={handleImageUpload}
            />

            <FittingControls
              prompt={prompt}
              setPrompt={setPrompt}
              viewMode={viewMode}
              setViewMode={setViewMode}
              cameraAngle={cameraAngle}
              setCameraAngle={setCameraAngle}
              resolution={resolution}
              setResolution={setResolution}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              imageCount={imageCount}
              setImageCount={setImageCount}
              faceMode={faceMode}
              setFaceMode={setFaceMode}
              gender={gender}
              setGender={setGender}
              isLoading={isLoading}
              baseImage={baseImage}
              handleGenerate={handleGenerate}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-bold uppercase tracking-tight text-white">피팅 베리에이션 결과</h3>
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

        <FittingResultGrid
          results={results}
          onImageSelect={onImageSelect}
          handleRetry={handleRetry}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default FittingVariation;
