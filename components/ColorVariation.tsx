"use client";

import React, { useState } from 'react';
import { Palette, ImageIcon, ArrowRight, X, Download, RotateCcw, AlertCircle, Layers, Wand2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { PigmentRequest, PigmentResponse, PosePreset } from '../services/pigment/pigment.types';

export const ColorVariation: React.FC = () => {
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [colorRefImage, setColorRefImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    // Advanced Options State
    const [isCleanupEnabled, setIsCleanupEnabled] = useState(false);
    const [isPoseEnabled, setIsPoseEnabled] = useState(false);
    const [posePreset, setPosePreset] = useState<PosePreset>('micro_walk');
    const [showDebugMasks, setShowDebugMasks] = useState(false);
    const [debugData, setDebugData] = useState<PigmentResponse['data'] | null>(null);

    const { addToBackgroundHistory } = useStore();

    const handleImageUpload = (type: 'base' | 'color', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'base') setBaseImage(reader.result as string);
                else if (type === 'color') setColorRefImage(reader.result as string);
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!baseImage || !colorRefImage) {
            toast.error("상품 이미지와 참고 색상 이미지를 모두 업로드해주세요.");
            return;
        }

        setLoading(true);
        setResultUrl(null);
        setDebugData(null);

        try {
            // Construct Request Payload aligned with PigmentRequest interface
            const payload: PigmentRequest = {
                source_image_id: "direct_upload", // Placeholder for logic
                source_image_data: baseImage,
                pipeline_config: {
                    validation_mode: 'strict',
                    cleanup: {
                        enabled: isCleanupEnabled,
                        mode: 'auto',
                        targets: ['text', 'clutter']
                    },
                    prop_remove: {
                        enabled: isCleanupEnabled, // Simplify UI: "Clean" does both for now
                        targets: ['cup', 'phone'],
                        hand_restore: true
                    },
                    pose_change: {
                        enabled: isPoseEnabled,
                        preset: posePreset,
                        strict_safety: true
                    },
                    recolor: {
                        target_category: 'all', // Auto-detect in future
                        color_source: {
                            type: 'image',
                            value: colorRefImage
                        },
                        texture_lock_strength: 0.8
                    }
                },
                output_options: {
                    resolution: '2k',
                    format: 'png',
                    return_stage_outputs: true,
                    return_debug_masks: true
                }
            };

            const res = await fetch('/api/v1/pigment/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Generation Failed');
            }

            const response: PigmentResponse = await res.json();

            if (response.status === 'fail') {
                throw new Error(response.error || 'Pipeline Failed');
            }

            if (response.status === 'partial_success') {
                toast.warning('일부 단계가 실패하여 원본으로 대체되었습니다.', {
                    description: response.data.warnings.join(', ')
                });
            }

            setResultUrl(response.data.final_image_url);
            setDebugData(response.data);
            addToBackgroundHistory(response.data.final_image_url);

            toast.success("생성 완료! (Pigment Studio v1.3.9)");

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "이미지 생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!resultUrl) return;
        const link = document.createElement('a');
        link.href = resultUrl;
        link.download = `pigment_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="mb-12 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Palette className="w-5 h-5 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">PIGMENT STUDIO v1.3.9</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase text-white mb-2">
                        AI 컬러 베리에이션 +
                    </h2>
                    <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
                        원단 스와치나 무드보드의 색감을 추출하여 상품에 입혀보세요.<br />
                        <b>마스크 안전장치</b>와 <b>정밀 파이프라인</b>으로 색상 오염 없는 완벽한 결과를 보장합니다.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Left: Input Area */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-8">

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
                        {/* 1. Source Image */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">STEP 1. 원본 상품 (Source)</label>
                                <span className="text-[9px] text-gray-600 font-bold bg-white/5 px-2 py-1 rounded">누끼컷/착용컷 모두 가능</span>
                            </div>
                            <div
                                onClick={() => document.getElementById('cv-base-upload')?.click()}
                                className={`relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group ${baseImage ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/10 hover:border-white/30 bg-black/40'}`}
                            >
                                {baseImage ? (
                                    <>
                                        <img src={baseImage} className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20">이미지 변경</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-3" />
                                        <span className="text-xs font-bold">클릭하여 상품 업로드</span>
                                    </div>
                                )}
                                <input id="cv-base-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('base', e)} />
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center -my-4 relative z-10">
                            <div className="bg-slate-900 border border-white/10 rounded-full p-2 text-indigo-400 shadow-xl">
                                <ArrowRight className="w-5 h-5 animate-pulse" />
                            </div>
                        </div>

                        {/* 2. Color Ref */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">STEP 2. 참고 색상 (Color Ref)</label>
                                <span className="text-[9px] text-indigo-400/60 font-bold bg-indigo-500/5 px-2 py-1 rounded">스와치/팬톤/직물사진</span>
                            </div>
                            <div
                                onClick={() => document.getElementById('cv-ref-upload')?.click()}
                                className={`relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group ${colorRefImage ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10'}`}
                            >
                                {colorRefImage ? (
                                    <>
                                        <img src={colorRefImage} className="w-full h-full object-contain" />
                                        <button onClick={(e) => { e.stopPropagation(); setColorRefImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors">
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Palette className="w-8 h-8 mx-auto mb-3 text-indigo-400 opacity-80" />
                                        <span className="text-xs font-bold text-indigo-300">클릭하여 색상/질감 참조 이미지 업로드</span>
                                    </div>
                                )}
                                <input id="cv-ref-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('color', e)} />
                            </div>
                        </div>

                        {/* Advanced Controls */}
                        <div className="space-y-4 bg-white/5 rounded-xl p-4 border border-white/5">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">파이프라인 설정 (Advanced)</h4>

                            {/* Cleanup Switch */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-gray-300" />
                                    <span className="text-xs font-bold text-gray-300">배경 정리 & 소품 제거</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isCleanupEnabled} onChange={(e) => setIsCleanupEnabled(e.target.checked)} />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>

                            {/* Pose Switch */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-300" />
                                    <span className="text-xs font-bold text-gray-300">포즈 변경 (Preset)</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isPoseEnabled} onChange={(e) => setIsPoseEnabled(e.target.checked)} />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>

                            {isPoseEnabled && (
                                <div className="mt-2 pl-6">
                                    <select
                                        className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white uppercase"
                                        value={posePreset}
                                        onChange={(e) => setPosePreset(e.target.value as PosePreset)}
                                    >
                                        <option value="neutral">Neutral (기본)</option>
                                        <option value="micro_walk">Micro Walk (가벼운 걷기)</option>
                                        <option value="hands_pocket">Hands in Pocket (주머니)</option>
                                        <option value="arms_crossed_relaxed">Arms Crossed (팔짱)</option>
                                    </select>
                                </div>
                            )}

                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !baseImage || !colorRefImage}
                            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${loading
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : (!baseImage || !colorRefImage)
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-white text-black hover:bg-indigo-50 hover:scale-[1.02] shadow-xl shadow-white/5'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RotateCcw className="w-4 h-4 animate-spin" />
                                    Pigment Pipeline 실행 중...
                                </span>
                            ) : (
                                '색상 변환 시작 (Generate)'
                            )}
                        </button>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-4">
                        <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-indigo-300">Tip: Texture Lock Engine v2.0</h4>
                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                3-Point Sampling 기술로 상품의 <b>원단 질감, 주름, 단추</b>를 완벽히 식별하여 보존합니다.
                                색상 변경 시 배경이 왜곡되는 문제를 원천 차단했습니다.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Right: Result Area */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                    <div className="h-full bg-black rounded-3xl border border-white/10 p-2 flex flex-col items-center justify-center min-h-[600px]">
                        {resultUrl ? (
                            <div className="relative w-full h-full rounded-2xl overflow-hidden group flex-1">
                                <img src={resultUrl} className="w-full h-full object-contain bg-neutral-900/50" />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={handleDownload} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-200">
                                        <Download className="w-4 h-4" /> 저장
                                    </button>
                                </div>
                            </div>
                        ) : loading ? (
                            <div className="text-center space-y-4">
                                <div className="relative w-20 h-20 mx-auto">
                                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-sm font-bold text-indigo-400 animate-pulse">Running Pigment Pipeline...</p>
                            </div>
                        ) : (
                            <div className="text-center opacity-30">
                                <Palette className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">결과 미리보기</p>
                            </div>
                        )}

                        {/* Debug Toggle */}
                        {debugData && (
                            <div className="w-full mt-4 p-4 border-t border-white/5">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="text-xs font-bold text-gray-500 uppercase">Debug Outputs</h5>
                                    <button
                                        className="text-[10px] text-indigo-400 underline"
                                        onClick={() => setShowDebugMasks(!showDebugMasks)}
                                    >
                                        {showDebugMasks ? 'Hide Masks' : 'Show Masks'}
                                    </button>
                                </div>

                                {showDebugMasks && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {debugData.debug_masks?.mask_cleanup && (
                                            <div className="space-y-1">
                                                <p className="text-[8px] text-center text-gray-500">M_Cleanup</p>
                                                <img src={debugData.debug_masks.mask_cleanup} className="w-full rounded border border-white/10" />
                                            </div>
                                        )}
                                        {debugData.debug_masks?.mask_prop_final && (
                                            <div className="space-y-1">
                                                <p className="text-[8px] text-center text-gray-500">M_Prop</p>
                                                <img src={debugData.debug_masks.mask_prop_final} className="w-full rounded border border-white/10" />
                                            </div>
                                        )}
                                        {debugData.debug_masks?.mask_final_recolor && (
                                            <div className="space-y-1">
                                                <p className="text-[8px] text-center text-gray-500">M_Recolor</p>
                                                <img src={debugData.debug_masks.mask_final_recolor} className="w-full rounded border border-white/10" />
                                            </div>
                                        )}
                                        {debugData.stage_outputs?.preview_pose && (
                                            <div className="space-y-1">
                                                <p className="text-[8px] text-center text-gray-500">Pose Preview</p>
                                                <img src={debugData.stage_outputs.preview_pose} className="w-full rounded border border-white/10" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default ColorVariation;
