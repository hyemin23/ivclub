"use client";

import React, { useState } from 'react';
import { RefreshCw, Monitor, Download, Layers } from 'lucide-react';
import { usePoseChange } from '../hooks/usePoseChange';
import { ImageModal } from './ImageModal';
import { ConfirmModal } from './ConfirmModal';
import { ServerStatusIndicator } from './ServerStatusIndicator';
import { PoseUploader } from './pose/PoseUploader';
import { PoseControls } from './pose/PoseControls';
import { PoseResultCard } from './pose/PoseResultCard';

const PoseChange: React.FC = () => {
  const {
    baseImage, setBaseImage,
    refImage, setRefImage,
    faceRefImage, setFaceRefImage,
    prompt, setPrompt,
    selectedAngles, toggleAngle,
    resolution, setResolution,
    aspectRatio, setAspectRatio,
    faceMode, setFaceMode,
    gender, setGender,
    resultImages,
    isLoading,
    progress,
    progressText,
    handleImageUpload,
    handleGenerate,
    handleStop,
    handleDownloadAll,
  } = usePoseChange();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const handleStopClick = () => {
    if (isLoading) setShowStopConfirm(true);
  };

  const confirmStop = () => {
    handleStop();
    setShowStopConfirm(false);
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

          <PoseUploader
            baseImage={baseImage}
            refImage={refImage}
            faceRefImage={faceRefImage}
            faceMode={faceMode}
            setBaseImage={setBaseImage}
            setRefImage={setRefImage}
            handleImageUpload={handleImageUpload}
          />

          <PoseControls
            prompt={prompt}
            setPrompt={setPrompt}
            selectedAngles={selectedAngles}
            toggleAngle={toggleAngle}
            resolution={resolution}
            setResolution={setResolution}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            faceMode={faceMode}
            setFaceMode={setFaceMode}
            gender={gender}
            setGender={setGender}
            isLoading={isLoading}
            baseImage={baseImage}
            handleGenerate={handleGenerate}
            handleStopClick={handleStopClick}
          />
        </div>
      </div>

      <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 flex flex-col min-h-[700px] relative">
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
