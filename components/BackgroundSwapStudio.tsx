"use client";

import React, { useState } from 'react';
import { Upload, ArrowRight, Zap, Layers, Download, Maximize2, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BSEConfig, BSEResult, DEFAULT_BSE_CONFIG } from '../services/bse/types';

// Mock API Call
const swapBackground = async (payload: { source_image_id: string; background_ref_id: string; options: BSEConfig }): Promise<BSEResult['output'] & { metrics: any; warnings: any[] }> => {
    // In real app, IDs would be resolved relative to uploaded files. 
    // Here we pass the Data URLs directly as "IDs" but the API expects a resolvable string.
    // Since our API currently uses 'loadImage' which checks for http/path, passing Data URL might fail if too long or not handled.
    // However, for this demo UI, let's assume we send the Base64 Data URL as the ID (our pipeline supports it if we modify it slightly, or we just trust the mock).

    // NOTE: The server size limit might be an issue for full Base64. 
    // Ideally we upload first. For now, we will send to our new API.

    const res = await fetch('/api/v1/background/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Swap Failed");
    }
    const json = await res.json();
    return { ...json.data, metrics: json.metrics, warnings: json.warnings, debug: json.debug };
};

const BackgroundSwapStudio: React.FC = () => {
    // Inputs
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [bgRefImage, setBgRefImage] = useState<string | null>(null);

    // Config State
    const [config, setConfig] = useState<BSEConfig>(DEFAULT_BSE_CONFIG);
    const [advancedOpen, setAdvancedOpen] = useState(false);

    // Execution State
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<(BSEResult['output'] & { metrics: any; warnings: any[] }) | null>(null);

    // Handlers
    const handleUpload = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const r = new FileReader();
            r.onload = (ev) => setter(ev.target?.result as string);
            r.readAsDataURL(file);
        }
    };

    const handleSwap = async () => {
        if (!sourceImage || !bgRefImage) {
            toast.error("원본 이미지와 배경 이미지를 모두 업로드해주세요.");
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            // NOTE: Sending huge base64 strings to API might hit PayloadTooLarge.
            // In prod, use multipart/form-data or presigned URLs. 
            // Here we risk it for the prototype.
            const output = await swapBackground({
                source_image_id: sourceImage,
                background_ref_id: bgRefImage,
                options: config
            });
            setResult(output);
            toast.success("배경 교체 완료!");
        } catch (e: any) {
            console.error(e);
            toast.error(`실패: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 animate-in fade-in">
            <div className="max-w-6xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Layers className="w-8 h-8 text-indigo-500" />
                        Background Swap Engine <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">v1.2</span>
                    </h1>
                    <p className="text-slate-500 text-sm">Strict Pixel Preservation • Split Harmonization • Zero Drift</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT: Inputs & Config */}
                    <div className="lg:col-span-5 space-y-8">

                        {/* 1. Input Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">1. Inputs</h3>

                            <div className="flex items-center gap-4">
                                {/* Source */}
                                <div className="flex-1 space-y-2">
                                    <div onClick={() => document.getElementById('bse_src')?.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${sourceImage ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                                        {sourceImage ? <img src={sourceImage} className="w-full h-full object-contain" /> : <Upload className="w-6 h-6 text-white/30" />}
                                        <input id="bse_src" type="file" className="hidden" accept="image/*" onChange={handleUpload(setSourceImage)} />
                                    </div>
                                    <p className="text-[10px] text-center font-bold text-slate-500 uppercase">Source (Subject)</p>
                                </div>

                                <ArrowRight className="w-6 h-6 text-white/20" />

                                {/* BG Ref */}
                                <div className="flex-1 space-y-2">
                                    <div onClick={() => document.getElementById('bse_bg')?.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${bgRefImage ? 'border-pink-500/50 bg-pink-500/5' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                                        {bgRefImage ? <img src={bgRefImage} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-white/30" />}
                                        <input id="bse_bg" type="file" className="hidden" accept="image/*" onChange={handleUpload(setBgRefImage)} />
                                    </div>
                                    <p className="text-[10px] text-center font-bold text-slate-500 uppercase">Reference BG</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Controls */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">2. Settings</h3>
                                <button onClick={() => setAdvancedOpen(!advancedOpen)} className="text-[10px] text-indigo-400 font-bold hover:underline">
                                    {advancedOpen ? 'Close Advanced' : 'Show Advanced'}
                                </button>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white">Commercial Strict Mode</span>
                                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-black border border-green-500/30">ACTIVE</span>
                                </div>

                                {advancedOpen && (
                                    <div className="pt-4 border-t border-white/10 space-y-4 animate-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                                <span>Harmonize Strength</span>
                                                <span>{(config.harmonize.weights.skin_hair.chrominance * 100).toFixed(0)}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100"
                                                value={config.harmonize.weights.skin_hair.chrominance * 100}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    harmonize: { ...config.harmonize, weights: { ...config.harmonize.weights, skin_hair: { ...config.harmonize.weights.skin_hair, chrominance: Number(e.target.value) / 100 } } }
                                                })}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                                <span>Contact Shadow</span>
                                                <span>{(config.shadow.strength * 100).toFixed(0)}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100"
                                                value={config.shadow.strength * 100}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    shadow: { ...config.shadow, strength: Number(e.target.value) / 100 }
                                                })}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 pt-2">
                                            <input
                                                type="checkbox"
                                                checked={config.harmonize.spill_fix.enabled}
                                                onChange={(e) => setConfig({ ...config, harmonize: { ...config.harmonize, spill_fix: { ...config.harmonize.spill_fix, enabled: e.target.checked } } })}
                                                className="w-4 h-4 rounded border-white/30 bg-white/10 text-indigo-500"
                                            />
                                            <span className="text-xs text-slate-300">Auto Spill Prevention (Anti-Yellow)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action */}
                        <button
                            onClick={handleSwap}
                            disabled={isProcessing || !sourceImage || !bgRefImage}
                            className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black shadow-xl shadow-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <Zap className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-white" />}
                            {isProcessing ? 'PROCESSING PIXELS...' : 'EXECUTE BACKGROUND SWAP'}
                        </button>
                    </div>

                    {/* RIGHT: Preview & Metrics */}
                    <div className="lg:col-span-7 h-full flex flex-col">
                        <div className="flex-1 bg-black/40 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group">

                            {result ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img src={result.url} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />

                                    {/* Metrics Overlay */}
                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                        <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex flex-col items-center justify-center gap-0.5 ${result.metrics.ref_bg_fidelity >= 0.92 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                                            <span className="text-[9px] font-black uppercase text-white/60">Ref Fidelity</span>
                                            <span className={`text-xs font-black ${result.metrics.ref_bg_fidelity >= 0.92 ? 'text-green-400' : 'text-red-400'}`}>{(result.metrics.ref_bg_fidelity * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex flex-col items-center justify-center gap-0.5 ${result.metrics.src_bg_leakage <= 0.35 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                                            <span className="text-[9px] font-black uppercase text-white/60">Src Leakage</span>
                                            <span className={`text-xs font-black ${result.metrics.src_bg_leakage <= 0.35 ? 'text-green-400' : 'text-red-400'}`}>{(result.metrics.src_bg_leakage * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    {/* Warnings */}
                                    {result.warnings.length > 0 && (
                                        <div className="absolute top-4 left-4 bg-yellow-500/20 border border-yellow-500/40 backdrop-blur-md px-4 py-3 rounded-xl max-w-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                                <h4 className="text-xs font-black text-yellow-400 uppercase">Warning</h4>
                                            </div>
                                            <ul className="list-disc pl-4 text-[10px] text-yellow-200/80 space-y-0.5">
                                                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={result.url} download={`bse_result_${Date.now()}.png`} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg">
                                            <Download className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center opacity-30 space-y-4">
                                    <Layers className="w-24 h-24 mx-auto" />
                                    <p className="text-xl font-black uppercase tracking-widest">Ready to Process</p>
                                    <p className="text-sm">Upload Source & Background to Begin</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackgroundSwapStudio;
