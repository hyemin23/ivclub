import React, { useState, useEffect } from 'react';
import { Key, Lock, ExternalLink } from 'lucide-react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [checking, setChecking] = useState(true);

  const checkKey = async () => {
    // Access aistudio via type assertion to avoid conflicts with existing types
    const win = window as any;
    if (win.aistudio && win.aistudio.hasSelectedApiKey) {
      const hasKey = await win.aistudio.hasSelectedApiKey();
      if (hasKey) {
        onKeySelected();
      }
      setChecking(false);
    } else {
      // Fallback for environments where aistudio might not be injected immediately
      setChecking(false);
    }
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio && win.aistudio.openSelectKey) {
      try {
        await win.aistudio.openSelectKey();
        // Assume success and proceed, as per guidance to avoid race conditions
        onKeySelected();
      } catch (error) {
        console.error("Failed to select key:", error);
        // Reset checking state if needed or show error
        setChecking(false);
      }
    }
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
        <p>Checking API Key configuration...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-indigo-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">API 키 필요</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          고해상도(2K/4K) 이미지 생성을 위해<br/>
          <strong>Gemini 3 Pro</strong> 모델을 사용합니다.<br/>
          결제 계정이 연결된 API 키 선택이 필요합니다.
        </p>

        <button
          onClick={handleSelectKey}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 group"
        >
          <Key className="w-5 h-5 group-hover:scale-110 transition-transform" />
          API 키 선택하기
        </button>

        <div className="mt-6 pt-6 border-t border-slate-800 text-sm">
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-slate-500 hover:text-indigo-400 transition-colors"
          >
            Google Cloud 결제 문서 확인하기
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};