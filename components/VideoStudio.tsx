
import React, { useState, useEffect, useRef } from 'react';
import { X, Video, Sparkles, Upload, Play, Check, RefreshCw, Wand2, ArrowRight } from 'lucide-react';
import { useStore } from '@/store';
import { generatePreviewVideo, generateFinalVideo } from '@/services/videoService';

export const VideoStudio: React.FC = () => {
    const { mainImageUrl, activeVideoLogId, videoLogs, setActiveVideoLogId, setUploadedImages, uploadedImages, setMainImageUrl } = useStore();
    const [step, setStep] = useState<'settings' | 'preview' | 'final'>('settings');
    const [motionPrompt, setMotionPrompt] = useState('Cinematic fashion film, model walking confidently');
    const [duration, setDuration] = useState(15);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get current log
    const currentLog = activeVideoLogId ? videoLogs.find(l => l.id === activeVideoLogId) : null;

    useEffect(() => {
        if (!activeVideoLogId) {
            setStep('settings');
        }
    }, [activeVideoLogId]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newUrls = files.map(file => URL.createObjectURL(file));
        setUploadedImages([...uploadedImages, ...newUrls]);

        // If no main image, set the first one
        if (newUrls.length > 0) {
            setMainImageUrl(newUrls[0]);
        }
    };

    const handlePreview = async () => {
        if (!mainImageUrl) return;
        setIsProcessing(true);
        try {
            await generatePreviewVideo([mainImageUrl], motionPrompt);
            setStep('preview');
        } catch (e) {
            alert('Failed to generate preview');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinalize = async () => {
        if (!activeVideoLogId) return;
        setIsProcessing(true);
        try {
            await generateFinalVideo(activeVideoLogId, duration);
            setStep('final');
        } catch (e) {
            alert('Failed to generate final video');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setActiveVideoLogId(null);
        setStep('settings');
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#111] text-white overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#1a1b1e]">
                <div className="flex items-center gap-3">
                    <Video className="w-6 h-6 text-indigo-400" />
                    <div>
                        <h1 className="font-bold text-lg">AI Short-form Studio</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Powered by Google Veo</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">FAST MODE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Preview / Player */}
                <div className="flex-1 bg-black relative flex items-center justify-center p-10">
                    <div className="relative w-full h-full max-w-[400px] max-h-[711px] aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        {!mainImageUrl && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 gap-4">
                                <Upload className="w-12 h-12 opacity-50" />
                                <p>Upload an image to start</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-indigo-600 rounded-lg text-white text-sm font-bold hover:bg-indigo-500 transition-colors"
                                >
                                    Select Image
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        )}

                        {step === 'settings' && mainImageUrl && (
                            <img src={mainImageUrl} alt="Source" className="w-full h-full object-cover" />
                        )}
                        {(step === 'preview' || step === 'final') && currentLog?.previewUrl && (
                            <div className="relative w-full h-full">
                                <video
                                    src={step === 'final' && currentLog.finalUrl ? currentLog.finalUrl : currentLog.previewUrl}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    controls
                                />
                                {step === 'preview' && (
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur rounded text-xs font-bold text-white border border-white/20">
                                        PREVIEW (4s)
                                    </div>
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-white font-bold animate-pulse">Running Veo AI...</p>
                                <p className="text-xs text-gray-400 mt-2">Generating Motion Latents</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Controls */}
                <div className="w-[400px] bg-[#1a1b1e] border-l border-white/10 p-8 flex flex-col">
                    {/* Status Bar */}
                    <div className="flex items-center gap-2 mb-10">
                        <div className={`flex items-center gap-2 ${step === 'settings' ? 'text-white' : 'text-gray-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'settings' ? 'bg-indigo-500' : 'bg-white/10'}`}>1</div>
                            <span className="text-sm font-bold">Settings</span>
                        </div>
                        <div className="w-8 h-[1px] bg-white/10" />
                        <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-white' : 'text-gray-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'preview' ? 'bg-indigo-500' : 'bg-white/10'}`}>2</div>
                            <span className="text-sm font-bold">Preview</span>
                        </div>
                        <div className="w-8 h-[1px] bg-white/10" />
                        <div className={`flex items-center gap-2 ${step === 'final' ? 'text-white' : 'text-gray-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'final' ? 'bg-indigo-500' : 'bg-white/10'}`}>3</div>
                            <span className="text-sm font-bold">Export</span>
                        </div>
                    </div>

                    {step === 'settings' && (
                        <div className="space-y-8 animate-in slide-in-from-right duration-300">
                            {/* Image Selected Info */}
                            {mainImageUrl && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden">
                                        <img src={mainImageUrl} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">Target Image</p>
                                        <button onClick={() => fileInputRef.current?.click()} className="text-xs text-indigo-400 hover:text-indigo-300">Change Image</button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Motion Prompt</label>
                                <textarea
                                    value={motionPrompt}
                                    onChange={(e) => setMotionPrompt(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none h-40"
                                    placeholder="Describe how the model should move (e.g., 'Model turns around and smiles', 'Wind blowing through hair')..."
                                />
                            </div>

                            <button
                                onClick={handlePreview}
                                disabled={!mainImageUrl}
                                className="w-full py-5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-white/10"
                            >
                                <Sparkles className="w-5 h-5" />
                                Generate 4s Preview
                            </button>
                            <p className="text-xs text-center text-gray-500">Fast Mode • 1 Credit per generation</p>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-8 animate-in slide-in-from-right duration-300">
                            <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                <h3 className="text-xl text-indigo-400 font-bold mb-2">Preview Ready!</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">Check if the motion looks natural. The seed is now locked, so the final video will extend this exact movement.</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block flex justify-between">
                                    Final Duration <span className="text-white text-lg">{duration}s</span>
                                </label>
                                <input
                                    type="range"
                                    min="5"
                                    max="30"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-gray-600 mt-2 font-mono">
                                    <span>05s</span>
                                    <span>30s (Max)</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button
                                    onClick={handleReset}
                                    className="py-4 px-6 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Discard
                                </button>
                                <button
                                    onClick={handleFinalize}
                                    className="py-4 px-6 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    Generate Final
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'final' && (
                        <div className="space-y-8 animate-in slide-in-from-right duration-300 pt-10">
                            <div className="flex flex-col items-center justify-center py-10 text-center bg-green-500/5 rounded-3xl border border-green-500/20">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                    <Check className="w-10 h-10 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">It's Ready!</h3>
                                <p className="text-gray-400">Video generation completed successfully.</p>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-white/5">
                                    <Upload className="w-5 h-5" />
                                    Download MP4
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="w-full py-4 text-gray-500 font-bold rounded-xl hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Create Another Video
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
