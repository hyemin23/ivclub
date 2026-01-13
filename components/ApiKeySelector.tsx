"use client";
import React, { useState } from 'react';
import { Key, Lock, ExternalLink } from 'lucide-react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!inputKey.startsWith('AIza')) {
      setError('유효하지 않은 API 키 형식입니다. AIza로 시작하는 키를 입력해주세요.');
      return;
    }
    localStorage.setItem('gemini_api_key', inputKey);
    onKeySelected();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-indigo-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">API 키 설정</h1>
        <p className="text-slate-400 mb-8 leading-relaxed text-sm">
          팀원 개별 API 키를 사용하여 서비스를 이용할 수 있습니다.<br />
          입력한 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="AIza..."
            value={inputKey}
            onChange={(e) => {
              setInputKey(e.target.value);
              setError('');
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
          />
          {error && <p className="text-red-400 text-xs text-left">{error}</p>}

          <button
            onClick={handleSave}
            disabled={!inputKey}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 group"
          >
            <Key className="w-5 h-5" />
            시작하기
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800 text-sm">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-slate-500 hover:text-indigo-400 transition-colors"
          >
            Google AI Studio에서 키 발급받기
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};