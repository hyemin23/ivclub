"use client";

import React, { useState } from 'react';
import { BoxSelect, Layers, Download } from 'lucide-react';
import { useAutoFit } from '../hooks/useAutoFit';
import { ImageModal } from './ImageModal';
import { ConfirmModal } from './ConfirmModal';
import { AutoFitUploader } from './autofit/AutoFitUploader';
import { AutoFitControls } from './autofit/AutoFitControls';
import { AutoFitResultCard } from './autofit/AutoFitResultCard';
import { getAngleLabel } from '../services/autofit/autofit.config';

const AutoFitting: React.FC = () => {
    const {
        productImage, setProductImage,
        bgImage, setBgImage,
        results,
        resolution, setResolution,
        aspectRatio, setAspectRatio,
        selectedAngles, setSelectedAngles,
        prompt, setPrompt,
        isLoading,
        progressText,
        processFile,
        handleGenerate,
        handleStop,
        handleDownloadAll,
        getConcurrencySettings,
        isSideProfile, setIsSideProfile
    } = useAutoFit();

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const currentStatus = getConcurrencySettings();

    const handleStopClick = () => {
        if (isLoading) setShowStopConfirm(true);
    };

    const confirmStop = () => {
        handleStop();
        setShowStopConfirm(false);
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <BoxSelect className="w-6 h-6 text-green-400" />
                            <h3 className="text-xl font-bold uppercase tracking-tight text-white">자동 피팅 (Auto Fitting)</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full border ${currentStatus.color} flex items-center gap-2`}>
                            <span className="text-[9px] font-bold uppercase tracking-widest">{currentStatus.label}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <AutoFitUploader
                            productImage={productImage}
                            bgImage={bgImage}
                            setProductImage={setProductImage}
                            setBgImage={setBgImage}
                            processFile={processFile}
                            isSideProfile={isSideProfile}
                            setIsSideProfile={setIsSideProfile}
                        />

                        <AutoFitControls
                            selectedAngles={selectedAngles}
                            setSelectedAngles={setSelectedAngles}
                            prompt={prompt}
                            setPrompt={setPrompt}
                            resolution={resolution}
                            setResolution={setResolution}
                            aspectRatio={aspectRatio}
                            setAspectRatio={setAspectRatio}
                            isLoading={isLoading}
                            productImage={productImage}
                            handleGenerate={handleGenerate}
                            handleStop={handleStop}
                            handleStopClick={handleStopClick}
                        />
                    </div>
                </div>
            </div>

            <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 flex flex-col min-h-[700px] relative">
                {isLoading && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold text-gray-200">{progressText}</span>
                    </div>
                )}

                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <Layers className="w-6 h-6 text-green-400" />
                        <h3 className="text-xl font-bold uppercase tracking-tight text-white">Fitting Results</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        {results.some(r => r.status === 'success') && !isLoading && (
                            <button
                                onClick={handleDownloadAll}
                                className="px-3 py-1.5 bg-green-600/10 border border-green-500/20 text-green-400 rounded-lg text-[9px] font-black flex items-center gap-2 uppercase tracking-widest transition-all hover:bg-green-600/20"
                            >
                                <Download className="w-3 h-3" /> 전체 다운로드
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 grid gap-4 grid-cols-1 xl:grid-cols-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden relative overflow-y-auto max-h-[800px]">
                    {results.length > 0 ? (
                        results.map((res, i) => (
                            <AutoFitResultCard
                                key={res.id}
                                res={res}
                                index={i}
                                originalImage={productImage}
                                onSelect={setSelectedImage}
                            />
                        ))
                    ) : (
                        <div className="col-span-2 flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20 h-full">
                            <Layers className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">결과물이 이곳에 생성됩니다.</p>
                            <p className="text-[10px] mt-2 italic">상품과 배경을 업로드하고 실행하세요.</p>
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

export default AutoFitting;
