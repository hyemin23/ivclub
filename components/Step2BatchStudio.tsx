
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Trash2, Camera, Layers, CheckCircle, Video, Play, Loader2, Download, RefreshCw, AlertCircle, Eye, Maximize2, X } from 'lucide-react';
import { CVFJobRequest, CVFStreamEvent_ItemCompleted, CVFStreamEvent_Progress, CVFStreamEvent_ItemFailed, CVFPoseId } from '../services/pose-factory/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

// --- Client State ---
interface ColorVariant {
    id: string;
    label: string;
    hex?: string;
    imageId?: string; // Palette Source
}

// --- API Client ---
const registerJob = async (payload: CVFJobRequest): Promise<{ job_id: string, stream_url: string }> => {
    const res = await fetch('/api/v1/pose/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Job Registry Failed");
    return res.json();
};

const Step2BatchStudio: React.FC = () => {
    // Inputs (v2.3)
    const [jobName, setJobName] = useState(() => `Job_${Date.now()}`);

    // UI #1: Master Shot (Preview Only)
    const [masterShot, setMasterShot] = useState<string | null>(null);

    // UI #2: Variant Group
    const [originalImage, setOriginalImage] = useState<string | null>(null); // The TRUE Base
    const [colorVariants, setColorVariants] = useState<ColorVariant[]>([
        { id: 'c1', label: 'Navy' },
        { id: 'c2', label: 'Ivory' }
    ]);

    // Config
    const [headless, setHeadless] = useState(true);
    const [bgLock, setBgLock] = useState(true);

    // Execution Schema
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<CVFStreamEvent_Progress | null>(null);
    const [results, setResults] = useState<Record<string, any[]>>({}); // Key: Group Label
    const eventSourceRef = useRef<EventSource | null>(null);

    // Zoom State
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // --- Handlers ---
    const handleUpload = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const r = new FileReader();
            r.onload = (ev) => setter(ev.target?.result as string);
            r.readAsDataURL(file);
        }
    };

    const handleDownloadSingle = (url: string, filename: string) => {
        saveAs(url, filename);
    };

    const connectStream = (url: string) => {
        if (eventSourceRef.current) eventSourceRef.current.close();
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.addEventListener('JOB_PROGRESS', (e: MessageEvent) => {
            setProgress(JSON.parse(e.data));
        });

        es.addEventListener('ITEM_COMPLETED', (e: MessageEvent) => {
            const data: CVFStreamEvent_ItemCompleted = JSON.parse(e.data);
            setResults(prev => {
                const list = prev[data.group] || [];
                // Dedupe logic could be added here
                return { ...prev, [data.group]: [...list, data] };
            });
        });

        es.addEventListener('JOB_FINISHED', () => {
            setIsProcessing(false);
            es.close();
            toast.success("Batch Completed");
        });

        es.onerror = () => {
            setIsProcessing(false);
            es.close();
        };
    };

    const handleStart = async () => {
        if (!originalImage) return alert("Original Base Image is REQUIRED (Section 2)");

        setResults({});
        setProgress(null);
        setIsProcessing(true);

        try {
            // Build v2.3 Payload
            const payload: CVFJobRequest = {
                job_name: jobName,
                input_data: {
                    master_shot_id: masterShot || undefined, // Server ignores this
                    variant_group: {
                        original_image_id: originalImage,
                        color_references: colorVariants.map(c => ({
                            label: c.label,
                            hex_override: c.hex,
                            image_id: c.imageId
                        }))
                    }
                },
                config: {
                    mode: 'VARIANT_GROUP_ONLY',
                    headless,
                    background_lock: bgLock,
                    recolor_mode: 'paint_only', // SRS 2.3 Strict Mode
                    isolation: true, // SRS 4.0 Job Isolation
                    pose_angles: ['FRONT', 'LEFT_15', 'RIGHT_15'], // Micro-Pose
                    pose_angles: ['FRONT', 'LEFT_15', 'RIGHT_15'],
                    pose_variation: {
                        enabled: true,
                        intensity: 0.3,
                        arm_allowlist: ["A1_RELAXED_BEND", "A2_ONE_HAND_POCKET"],
                        leg_allowlist: ["L1_WEIGHT_SHIFT_L", "L3_MICRO_STEP_TOE_OUT"]
                    },
                    qa_thresholds: { ssim_min: 0.82, edge_iou_min: 0.75, delta_e_max: 8.0 }, // v2.3.3 Hardening
                    output: { format: 'png', resolution: '2k' },
                    thumbnails: { format: 'webp', size: 512, quality: 80 }
                },
                stream: { enabled: true, type: 'sse' }
            };

            const { stream_url } = await registerJob(payload);
            connectStream(stream_url);

        } catch (e: any) {
            alert(e.message);
            setIsProcessing(false);
        }
    };

    // Helper to render Result Item
    const renderItem = (item: any) => {
        // UI Mirroring for Right Pose (SRS v2.3 Requirement)
        // Check metadata or pose ID
        // Note: pipeline.ts emits `metadata: { is_mirrored: true }`.
        // Ideally we pass that in `ITEM_COMPLETED` data structure.
        // For now, check Pose ID if metadata missing
        const shouldMirror = item.pose === 'RIGHT_15';

        return (
            <div key={item.pose} className="relative group rounded-xl overflow-hidden bg-black aspect-[3/4] border border-white/10">
                <img
                    src={item.thumbnail_url}
                    className={`w-full h-full object-cover transition-transform ${shouldMirror ? 'scale-x-[-1]' : ''}`} // CSS Flip
                />

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                        onClick={() => setZoomedImage(item.thumbnail_url)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/20"
                        title="Zoom In"
                    >
                        <Maximize2 className="w-5 h-5 shadow-sm" />
                    </button>
                    <button
                        onClick={() => handleDownloadSingle(item.thumbnail_url, `${item.group}_${item.pose}.png`)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/20"
                        title="Download"
                    >
                        <Download className="w-5 h-5 shadow-sm" />
                    </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm">
                    <p className="text-[10px] font-mono text-white flex justify-between items-center">
                        <span>{item.pose}</span>
                        {item.qa_scores && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${item.qa_scores.passed ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                QA: {(item.qa_scores.ssim * 100).toFixed(0)}%
                            </span>
                        )}
                        <span className="text-gray-400">{Math.abs(item.estimated_yaw_deg)}°</span>
                    </p>
                </div>
            </div>
        );
    };

    const handleDownloadAll = async () => {
        const zip = new JSZip();
        // Add Original
        if (results['Original']) {
            results['Original'].forEach(item => {
                const b64 = item.original_url.split(',')[1];
                zip.file(`Original_${item.pose}.png`, b64, { base64: true });
            });
        }
        // Add Variants
        Object.keys(results).filter(k => k !== 'Original').forEach(key => {
            const folder = zip.folder(key);
            results[key].forEach(item => {
                const b64 = item.original_url.split(',')[1];
                folder?.file(`${key}_${item.pose}.png`, b64, { base64: true });
            });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${jobName}_Complete.zip`);
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 relative">
            {/* Zoom Modal */}
            {zoomedImage && (
                <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-8 animate-in fade-in duration-200 backdrop-blur-sm">
                    <button
                        onClick={() => setZoomedImage(null)}
                        className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/10 rounded-full"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={zoomedImage}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
                    />
                </div>
            )}

            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in">

                {/* Header */}
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tidest flex items-center gap-3">
                            <Layers className="w-8 h-8 text-pink-500" />
                            CVF v2.3 <span className="text-xs bg-pink-900 text-pink-200 px-2 py-0.5 rounded mr-2">Strict Mode</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Master Excluded • Paint Recolor • Micro-Pose</p>
                    </div>
                    {progress && (
                        <div className="flex items-center gap-6 bg-slate-900 px-6 py-3 rounded-2xl border border-white/10">
                            <div className="text-right">
                                <div className="text-[10px] uppercase text-slate-500 font-bold">Progress</div>
                                <div className="text-2xl font-black text-green-400 font-mono">{progress.progress_percent}%</div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-right">
                                <div className="text-[10px] uppercase text-slate-500 font-bold">Remaining</div>
                                <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
                                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-pink-500" />}
                                    {progress.remaining}
                                </div>
                            </div>
                        </div>

                    )}

                    {/* Download All Button - Only show when finished or has results */}
                    {!isProcessing && Object.keys(results).length > 0 && (
                        <button onClick={handleDownloadAll} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-xs font-black uppercase text-white transition-colors">
                            <Download className="w-4 h-4" /> Download ZIP
                        </button>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Controls */}
                    <div className="w-full lg:w-[420px] space-y-8 shrink-0 pb-20">
                        {/* 1. Master Shot (Review Only) */}
                        <div className="p-4 rounded-3xl bg-slate-900/50 border border-white/5 space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">1. Master Shot (Review Only)</h2>
                                <Eye className="w-4 h-4 text-slate-500" />
                            </div>
                            <div onClick={() => document.getElementById('master_up')?.click()} className="aspect-[3/4] rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                                {masterShot ? <img src={masterShot} className="w-full h-full object-contain" /> : <div className="text-xs text-slate-500 font-bold text-center">Optional<br />Visual Ref</div>}
                                <input id="master_up" type="file" className="hidden" onChange={handleUpload(setMasterShot)} />
                            </div>
                        </div>

                        {/* 2. Variant Group (Real Input) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-pink-500 rounded-full" />
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">2. Variant Group</h2>
                            </div>

                            {/* Original Base */}
                            <div className="p-4 rounded-2xl bg-indigo-900/10 border border-indigo-500/30 space-y-2">
                                <label className="text-[10px] font-bold text-indigo-300 uppercase">Original Base (Required)</label>
                                <div onClick={() => document.getElementById('ori_up')?.click()} className="aspect-[3/4] bg-slate-900 rounded-xl border border-indigo-500/20 hover:border-indigo-500 cursor-pointer overflow-hidden relative group">
                                    {originalImage ? <img src={originalImage} className="w-full h-full object-contain" /> : <div className="absolute inset-0 flex items-center justify-center text-indigo-400"><Plus className="w-6 h-6" /></div>}
                                    <input id="ori_up" type="file" className="hidden" onChange={handleUpload(setOriginalImage)} />
                                </div>
                            </div>

                            {/* Color Refs */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Color References (Palette)</label>
                                {colorVariants.map((c, i) => (
                                    <div key={c.id} className="flex gap-2 items-center bg-slate-900 p-2 rounded-lg border border-white/5">
                                        <div className="w-10 h-10 rounded bg-slate-800 shrink-0 relative overflow-hidden group cursor-pointer border border-white/10">
                                            {c.imageId && <img src={c.imageId} className="w-full h-full object-cover" />}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload((v) => {
                                                const cw = [...colorVariants]; cw[i].imageId = v; setColorVariants(cw);
                                            })} />
                                        </div>
                                        <input className="bg-transparent text-sm font-bold w-full outline-none" value={c.label} onChange={(e) => {
                                            const cw = [...colorVariants]; cw[i].label = e.target.value; setColorVariants(cw);
                                        }} />
                                    </div>
                                ))}
                                <button onClick={() => setColorVariants([...colorVariants, { id: Date.now().toString(), label: "New" }])} className="w-full py-2 bg-slate-800 rounded-lg text-xs font-bold hover:bg-slate-700">+ Add Color</button>
                            </div>
                        </div>

                        <button onClick={handleStart} disabled={isProcessing} className="w-full py-5 bg-gradient-to-r from-pink-600 to-indigo-600 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                            {isProcessing ? "PROCESSING STREAM..." : "BATCH GENERATE v2.3"}
                        </button>
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1 bg-slate-900/30 border border-white/5 rounded-[32px] p-8 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
                        {Object.keys(results).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                                <Layers className="w-20 h-20 mb-4" />
                                <p className="text-lg font-black uppercase">Ready</p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Map Original First if exists */}
                                {results['Original'] && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-white flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full" /> Original Group</h3>
                                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {results['Original'].map(renderItem)}
                                        </div>
                                    </div>
                                )}
                                {/* Map Other Colors */}
                                {Object.keys(results).filter(k => k !== 'Original').map(key => (
                                    <div key={key} className="space-y-4">
                                        <h3 className="text-xl font-black text-indigo-400 flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full" /> {key} Group</h3>
                                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {results[key].map(renderItem)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};
export default Step2BatchStudio;
