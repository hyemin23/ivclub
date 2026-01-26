"use client";

import React from 'react';
import { Layers, Clipboard } from 'lucide-react';
import { useDetailGenerator } from '../hooks/useDetailGenerator';
import { DetailUploader } from './detail/DetailUploader';
import { DetailControls } from './detail/DetailControls';
import { DetailResults } from './detail/DetailResults';

const DetailExtra: React.FC = () => {
  const {
    baseImage, setBaseImage,
    baseImages, setBaseImages,
    refImage, setRefImage,
    refImages, setRefImages, // New Hook Return
    prompt, setPrompt,
    selectedStyle, handleStyleSelect,
    resolution, setResolution,
    aspectRatio, setAspectRatio,
    imageCount, setImageCount,
    resultImages,
    isLoading,
    selectedImage, setSelectedImage,
    fabricText, setFabricText,
    uspKeywords, setUspKeywords,
    handleImageUpload,
    handleGenerate,
    handleDownloadAll
  } = useDetailGenerator();

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        {/* Header */}
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
            {/* 1. Upload Area */}
            <DetailUploader
              baseImage={baseImage}
              baseImages={baseImages}
              refImage={refImage}
              setBaseImage={setBaseImage}
              setBaseImages={setBaseImages}
              refImages={refImages}
              setRefImage={setRefImage}
              setRefImages={setRefImages}
              handleImageUpload={handleImageUpload}
            />

            {/* 2. Controls Area */}
            <DetailControls
              selectedStyle={selectedStyle}
              handleStyleSelect={handleStyleSelect}
              prompt={prompt}
              setPrompt={setPrompt}
              resolution={resolution}
              setResolution={setResolution}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              imageCount={imageCount}
              setImageCount={setImageCount}
              fabricText={fabricText}
              setFabricText={setFabricText}
              uspKeywords={uspKeywords}
              setUspKeywords={setUspKeywords}
              isLoading={isLoading}
              baseImage={baseImage}
              handleGenerate={handleGenerate}
            />
          </div>
        </div>

        {/* 3. Results Area */}
        <DetailResults
          resultImages={resultImages}
          handleDownloadAll={handleDownloadAll}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
        />
      </div>
    </div>
  );
};

export default DetailExtra;
