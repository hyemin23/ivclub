
import React, { useState, useEffect } from 'react';
import { X, Video, Sparkles, Upload, Play, Check, RefreshCw, Wand2, ArrowRight } from 'lucide-react';
import { useStore } from '@/store';
import { generatePreviewVideo, generateFinalVideo } from '@/services/videoService';

interface VideoGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ isOpen, onClose }) => {
    const { mainImageUrl, activeVideoLogId, videoLogs, setActiveVideoLogId } = useStore();
    const [step, setStep] = useState<'settings' | 'preview' | 'final'>('settings');
    const [motionPrompt, setMotionPrompt] = useState('Cinematic fashion film, model walking confidently');
    const [duration, setDuration] = useState(15);
    const [isProcessing, setIsProcessing] = useState(false);

    // Get current log
    const currentLog = activeVideoLogId ? videoLogs.find(l => l.id === activeVideoLogId) : null;

    useEffect(() => {
        if (isOpen && !activeVideoLogId) {
            setStep('settings');
        }
    }, [isOpen, activeVideoLogId]);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[800px] h-[600px] bg-[#1a1b1e] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#1a1b1e]">
                    <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-indigo-400" />
                        <span className="font-bold text-white">AI Short-form Studio</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">FAST MODE</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Preview / Player */}
                    <div className="w-[360px] bg-black relative flex items-center justify-center border-r border-white/10">
                        {step === 'settings' && mainImageUrl && (
                            <img src={mainImageUrl} alt="Source" className="w-full h-full object-cover opacity-50" />
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

                    {/* Right Panel: Controls */}
                    <div className="flex-1 bg-[#1a1b1e] p-6 flex flex-col">
                        {/* Status Bar */}
                        <div className="flex items-center gap-2 mb-8">
                            <div className={`flex items-center gap-2 ${step === 'settings' ? 'text-white' : 'text-gray-600'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'settings' ? 'bg-indigo-500' : 'bg-white/10'}`}>1</div>
                                <span className="text-sm font-bold">Settings</span>
                            </div>
                            <div className="w-8 h-[1px] bg-white/10" />
                            <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-white' : 'text-gray-600'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'preview' ? 'bg-indigo-500' : 'bg-white/10'}`}>2</div>
                                <span className="text-sm font-bold">Preview</span>
                            </div>
                            <div className="w-8 h-[1px] bg-white/10" />
                            <div className={`flex items-center gap-2 ${step === 'final' ? 'text-white' : 'text-gray-600'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'final' ? 'bg-indigo-500' : 'bg-white/10'}`}>3</div>
                                <span className="text-sm font-bold">Download</span>
                            </div>
                        </div>

                        {step === 'settings' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Motion Prompt</label>
                                    <textarea
                                        value={motionPrompt}
                                        onChange={(e) => setMotionPrompt(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none h-32"
                                        placeholder="Describe how the model should move..."
                                    />
                                </div>

                                <button
                                    onClick={handlePreview}
                                    disabled={!mainImageUrl}
                                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Generate 4s Preview
                                </button>
                                <p className="text-xs text-center text-gray-500">Low cost generation (1 credit)</p>
                            </div>
                        )}

                        {step === 'preview' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                    <h3 className="text-indigo-400 font-bold mb-1">Preview Ready!</h3>
                                    <p className="text-xs text-gray-400">Review the motion and consistency. If you like it, extend it to full length.</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                        Final Duration: <span className="text-white">{duration}s</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="30"
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        className="w-full accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                        <span>5s</span>
                                        <span>30s (Max)</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Try Again
                                    </button>
                                    <button
                                        onClick={handleFinalize}
                                        className="py-3 px-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        Create Final
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'final' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                        <Check className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Generation Complete!</h3>
                                    <p className="text-sm text-gray-400">Your video is ready for download.</p>
                                </div>

                                <button className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Download MP4
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="w-full py-4 bg-transparent text-gray-500 font-bold rounded-xl hover:text-white transition-colors"
                                >
                                    Create New Video
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
