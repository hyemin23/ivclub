"use client";

import React, { useState, useCallback } from 'react';
import { Sparkles, Upload, Download, Plus, Trash2, Box, Layers, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
    VariationJobConfig,
    VariationResultItem,
    ColorGroup,
    executeVariationBatch
} from '../services/variationFactoryService';
import { Resolution, AspectRatio } from '../types';

export const CommerceVariationFactory: React.FC = () => {
    // --- State ---
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<VariationResultItem[]>([]);
    const [progress, setProgress] = useState(0);

    // Config
    const [useMicroVar, setUseMicroVar] = useState(true);
    const [resolution, setResolution] = useState<Resolution>('2K');
    const [pose15, setPose15] = useState(true); // Default ON

    // --- Inputs ---

    const handleBaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setBaseImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const addColorGroup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const newGroup: ColorGroup = {
                    id: `color-${Date.now()}`,
                    label: file.name.split('.')[0].substring(0, 8), // simple label
                    refImage: reader.result as string
                };
                setColorGroups(prev => [...prev, newGroup]);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const removeColorGroup = (id: string) => {
        setColorGroups(prev => prev.filter(g => g.id !== id));
    };

    // --- Execution ---

    const runFactory = async () => {
        if (!baseImage) {
            toast.error("원본 이미지가 필요합니다.");
            return;
        }

        setIsProcessing(true);
        setResults([]); // Clear previous

        const config: VariationJobConfig = {
            jobId: `job-${Date.now()}`,
            baseImage,
            colorGroups,
            posePack: pose15 ? ['FRONT', 'LEFT_15', 'RIGHT_15'] : ['FRONT'],
            microVariation: useMicroVar,
            resolution,
            aspectRatio: '1:1' // Fixed for thumbnail consistency
        };

        try {
            await executeVariationBatch(config, (updatedResults) => {
                setResults(updatedResults);

                // Calculate Progress
                const total = updatedResults.length;
                const done = updatedResults.filter(r => r.status === 'success' || r.status === 'failed').length;
                setProgress(Math.round((done / total) * 100));
            });
            toast.success("작업이 완료되었습니다!");
        } catch (e) {
            console.error(e);
            toast.error("작업 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Render Helpers ---

    const renderResultCard = (item: VariationResultItem) => {
        const isOriginal = item.groupId === 'original';

        return (
            <div key={item.id} className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-white/5 group">
                {item.status === 'success' && item.url ? (
                    <>
                        <img src={item.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded">
                                {isOriginal ? 'ORIGINAL' : 'VARIANT'} / {item.pose}
                            </span>
                            <button
                                onClick={() => {
                                    try {
                                        // Robust Download Logic for Large Base64
                                        const byteString = atob(item.url!.split(',')[1]);
                                        const mimeString = item.url!.split(',')[0].split(':')[1].split(';')[0];
                                        const ab = new ArrayBuffer(byteString.length);
                                        const ia = new Uint8Array(ab);
                                        for (let i = 0; i < byteString.length; i++) {
                                            ia[i] = byteString.charCodeAt(i);
                                        }
                                        const blob = new Blob([ab], { type: mimeString });
                                        const blobUrl = URL.createObjectURL(blob);

                                        const link = document.createElement('a');
                                        link.href = blobUrl;
                                        link.download = `${item.id}.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(blobUrl);
                                        toast.success("다운로드 시작");
                                    } catch (e) {
                                        console.error("Download failed", e);
                                        toast.error("다운로드 실패");
                                    }
                                }}
                                className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors shadow-lg"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                        {item.status === 'generating' ? (
                            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        ) : item.status === 'failed' ? (
                            <div className="text-red-500 text-xs font-bold">Failed</div>
                        ) : (
                            <Box className="w-6 h-6 opacity-20" />
                        )}
                        <span className="text-[9px] mt-2 font-mono uppercase opacity-50">{item.pose}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                            <Layers className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">
                                Commerce Variation Factory <span className="text-indigo-400">v2.4</span>
                            </h3>
                            <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">
                                Single Source to Multi-Variant Pipeline
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 1. Original Input */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                1. Master Shot (Original)
                            </label>
                        </div>
                        <div
                            onClick={() => document.getElementById('cvf-base-upload')?.click()}
                            className={`aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden ${baseImage ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-white/30 bg-black/40'
                                }`}
                        >
                            {baseImage ? (
                                <img src={baseImage} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                    <span className="text-[10px] text-gray-500 font-bold">Upload Master</span>
                                </div>
                            )}
                            <input id="cvf-base-upload" type="file" className="hidden" accept="image/*" onChange={handleBaseUpload} />
                        </div>
                    </div>

                    {/* 2. Variant Groups (Color) */}
                    <div className="lg:col-span-2 space-y-4 flex flex-col">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                2. Color Variants (Items)
                            </label>
                            {colorGroups.length > 0 && (
                                <button
                                    onClick={() => setColorGroups([])}
                                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" /> Clear All
                                </button>
                            )}
                        </div>

                        <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 flex gap-4 overflow-x-auto min-h-[200px] items-center">
                            {/* Add Button */}
                            <div
                                onClick={() => document.getElementById('cvf-color-upload')?.click()}
                                className="min-w-[140px] h-[200px] rounded-xl border border-white/10 hover:border-white/30 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-wider">Add Color</span>
                                <input id="cvf-color-upload" type="file" className="hidden" accept="image/*" onChange={addColorGroup} />
                            </div>

                            {/* Render Groups */}
                            {colorGroups.map(group => (
                                <div key={group.id} className="min-w-[140px] h-[200px] rounded-xl border border-white/10 bg-slate-900 relative overflow-hidden group">
                                    <img src={group.refImage || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                                        <p className="text-xs font-bold text-white truncate">{group.label}</p>
                                    </div>
                                    <button
                                        onClick={() => removeColorGroup(group.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pose15} onChange={e => setPose15(e.target.checked)} className="rounded bg-white/10 border-white/20" />
                        <span className="text-xs font-bold text-gray-300">Auto Pose Pack (Front/L/R 15°)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={useMicroVar} onChange={e => setUseMicroVar(e.target.checked)} className="rounded bg-white/10 border-white/20" />
                        <span className="text-xs font-bold text-gray-300">Micro-Variation (Hands/Legs)</span>
                    </label>

                    <div className="flex-1" />

                    <button
                        onClick={runFactory}
                        disabled={isProcessing || !baseImage}
                        className="px-8 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Processing ({progress}%)
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Batch
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results Stream */}
            <div className="flex flex-col gap-6">
                {['original', ...colorGroups.map(g => g.id)].map(groupId => {
                    // Filter items for this group
                    const groupItems = results.filter(r => r.groupId === groupId);
                    if (groupItems.length === 0) return null;

                    const isOriginal = groupId === 'original';
                    const groupLabel = isOriginal ? 'Original Master' : colorGroups.find(g => g.id === groupId)?.label || 'Unknown';

                    return (
                        <div key={groupId} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3 pl-2">
                                <div className={`w-2 h-8 rounded-full ${isOriginal ? 'bg-indigo-500' : 'bg-gray-600'}`} />
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">{groupLabel}</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {groupItems.map(renderResultCard)}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
