"use client";

import React, { useState } from 'react';
import { Upload, Sparkles, Zap, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { analyzeBenchmarkImage } from '../services/imageService';
import { BenchmarkAnalysisResult } from '../types';
import { toast } from 'sonner';

interface BenchmarkUploaderProps {
  onAnalysisComplete: (result: BenchmarkAnalysisResult) => void;
  onApplyStyle: () => void;
  isGenerating: boolean;
}

export const BenchmarkUploader: React.FC<BenchmarkUploaderProps> = ({
  onAnalysisComplete,
  onApplyStyle,
  isGenerating
}) => {
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BenchmarkAnalysisResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefImage(reader.result as string);
        setAnalysis(null); // Reset analysis on new image
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!refImage) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeBenchmarkImage(refImage);
      setAnalysis(result);
      onAnalysisComplete(result);
      toast.success("Vibe Analysis Complete! 🎨");
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze image vibe.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Split View: Reference Upload + Analysis Card */}
      <div className="flex gap-6">
        {/* Left: Reference Uploader */}
        <div className="flex-1 space-y-3">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
            벤치마킹할 썸네일 (Reference)
          </label>
          <div
            onClick={() => document.getElementById('benchmark-upload')?.click()}
            className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
              refImage 
                ? 'border-indigo-500/50 bg-indigo-500/5' 
                : 'border-white/10 hover:border-white/30 bg-black'
            }`}
          >
            {refImage ? (
              <>
                <img src={refImage} className="w-full h-full object-contain p-2" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setRefImage(null); setAnalysis(null); }}
                  className="absolute top-3 right-3 p-1.5 bg-black/80 rounded-full hover:bg-red-500 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <div className="text-center p-4 opacity-40">
                <Upload className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest block">Click to Upload</span>
                <span className="text-[9px] text-gray-500 mt-1 block">경쟁사 썸네일 / 인스타그램 사진</span>
              </div>
            )}
            <input 
              id="benchmark-upload" 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
        </div>

        {/* Right: Analysis Result / Placeholder */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
          {!analysis ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-10 h-10 text-indigo-400 animate-spin-slow mb-4" />
                  <p className="text-xs font-bold animate-pulse">Analyzing Vibe...</p>
                  <p className="text-[10px] text-gray-500 mt-1">조명, 구도, 분위기 추출 중</p>
                </>
              ) : (
                <>
                  <Zap className="w-10 h-10 text-gray-600 mb-4" />
                  <p className="text-xs font-bold text-gray-500">No Vibe Detected</p>
                  <p className="text-[9px] text-gray-600 mt-1 max-w-[150px]">
                    이미지를 업로드하고 분석을 시작하세요.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">Vibe Extracted</span>
              </div>
              
              {/* Lighting */}
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-bold uppercase">Lighting</label>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 rounded-md bg-yellow-500/20 border border-yellow-500/30 text-[10px] text-yellow-200 font-medium">
                    {analysis.lighting?.type || 'Unknown'}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-white/10 border border-white/10 text-[10px] text-gray-300">
                    {analysis.lighting?.direction || 'General'}
                  </span>
                </div>
              </div>

              {/* Environment */}
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-bold uppercase">Location</label>
                <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                  <p className="text-[10px] text-indigo-200 line-clamp-2 leading-relaxed">
                    "{analysis.environment?.location || 'Unspecified Location'}"
                  </p>
                </div>
              </div>

               {/* Keywords */}
               <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-bold uppercase">Keywords</label>
                <div className="flex flex-wrap gap-1.5">
                  {(analysis.vibe_keywords || []).slice(0, 4).map((kw, i) => (
                    <span key={i} className="text-[9px] text-gray-400 border-b border-gray-700 pb-0.5">#{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analyze Button (Overlay) */}
          {refImage && !analysis && !isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <button
                onClick={handleAnalyze}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold text-xs shadow-xl shadow-indigo-500/30 transition-all flex items-center gap-2 transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                Analyze Vibe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Apply Button */}
      {analysis && (
        <button
          onClick={onApplyStyle}
          disabled={isGenerating}
          className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-2xl shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3 group"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Applying Vibe...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Apply Vibe to My Product</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      )}
    </div>
  );
};
