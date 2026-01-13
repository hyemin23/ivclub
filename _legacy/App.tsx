
import React, { useState } from 'react';
import { Factory, UserRoundPen, Zap, Settings, User, Rocket, Palette, TrendingUp, Smartphone, Users } from 'lucide-react';
import { ApiKeySelector } from './components/ApiKeySelector';
import Step1Input from './components/Step1Input';
import Step2BatchStudio from './components/Step2BatchStudio';
import Step3PreviewExport from './components/Step3PreviewExport';
import FitBuilder from './components/FitBuilder';
import UGCMaster from './components/UGCMaster';
import { useStore } from './store';
import { AppView } from './types';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const { step, brandName, appView, setAppView } = useStore();

  if (!hasKey) {
    return <ApiKeySelector onKeySelected={() => setHasKey(true)} />;
  }

  const navigationItems = [
    { 
      id: 'ugc-master', 
      name: 'UGC 마스터', 
      icon: <Smartphone className="w-5 h-5" />, 
      description: '소셜 실사 생성기',
      view: 'ugc-master' as const 
    },
    { 
      id: 'factory', 
      name: '상페 팩토리', 
      icon: <Factory className="w-5 h-5" />, 
      description: '대량 상페 자동 생성',
      view: 'factory' as const 
    },
    { 
      id: 'fit-builder', 
      name: '스마트 빌더', 
      icon: <UserRoundPen className="w-5 h-5" />, 
      description: '정밀 이미지 편집',
      view: 'fit-builder' as const 
    },
    { 
      id: 'brand_identity', 
      name: '브랜드 AI', 
      icon: <Palette className="w-5 h-5" />, 
      description: '아이덴티티 시스템', 
      locked: true,
      view: 'brand_identity' as const 
    },
    { 
      id: 'social_strategy', 
      name: '소셜 파일럿', 
      icon: <TrendingUp className="w-5 h-5" />, 
      description: '콘텐츠 엔진', 
      locked: true,
      view: 'social_strategy' as const 
    },
    { 
      id: 'settings', 
      name: '시스템 설정', 
      icon: <Settings className="w-5 h-5" />, 
      description: '환경 설정 및 API',
      view: 'settings' as const 
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col md:flex-row">
      {/* 사이드바 네비게이션 */}
      <aside className="w-full md:w-72 md:h-screen sticky top-0 md:border-r border-white/10 glass-panel z-50 flex flex-col bg-slate-950/50 backdrop-blur-2xl">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => { setAppView('ugc-master'); }}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/20 group-hover:scale-110 transition-transform">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">버티컬 끝판왕</h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] mt-1 uppercase">버티컬 전문 엔진</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.locked && setAppView(item.view as AppView)}
                className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                  appView === item.id 
                    ? 'bg-white text-black shadow-xl shadow-white/10 scale-[1.02]' 
                    : item.locked 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <div className={`${appView === item.id ? 'text-black' : 'text-gray-500 group-hover:text-white'}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">{item.name}</p>
                  <p className={`text-[9px] ${appView === item.id ? 'text-black/60' : 'text-gray-500'}`}>{item.description}</p>
                </div>
                {item.locked && (
                  <span className="ml-auto text-[8px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-white/40">잠김</span>
                )}
                {appView === item.id && !item.locked && (
                  <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <div className="p-4 bg-white/5 rounded-2xl space-y-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">현재 플랜</p>
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase">ENTERPRISE RAW</p>
              <span className="text-[9px] bg-green-500 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">활성화됨</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 min-h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-6 py-12 md:px-12 animate-in fade-in duration-700">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">프로 렌더링 모드</span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter uppercase text-white">
                {appView === 'ugc-master' && 'UGC 마스터'}
                {appView === 'factory' && '룩북 팩토리'}
                {appView === 'fit-builder' && '스마트 빌더'}
                {appView === 'settings' && '시스템 설정'}
              </h2>
              <p className="text-gray-500 text-sm mt-2 max-w-2xl">
                {appView === 'ugc-master' && '아이폰 4K RAW 결과물과 동일한 질감의 소셜 전용 실사 패션 콘텐츠를 생성합니다.'}
                {appView === 'factory' && '지능형 분석과 일괄 생성을 통해 커머스에 최적화된 룩북을 제작합니다.'}
                {appView === 'fit-builder' && '포즈 변경, 배경 합성, 디테일 컷 추출 등 정교한 개별 편집 기능을 제공합니다.'}
                {appView === 'settings' && '시스템 구성 및 API 상태를 관리합니다.'}
              </p>
            </div>
            
            <div className="flex gap-2">
               <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                 <div className="w-2 h-2 bg-green-500 rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gemini 3 Pro 가동 중</span>
               </div>
            </div>
          </div>

          <div className="content-container">
            {appView === 'ugc-master' && <UGCMaster />}
            {appView === 'factory' && (
              <>
                {step === 1 && <Step1Input />}
                {step === 2 && <Step2BatchStudio />}
                {step === 3 && <Step3PreviewExport />}
              </>
            )}
            {appView === 'fit-builder' && <FitBuilder />}
            {appView === 'settings' && (
              <div className="max-w-2xl glass-panel p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-bottom-4">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">활성 렌더링 키</p>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                    <p className="font-mono text-xs text-gray-400 tracking-tighter">••••••••••••••••••••••••••••••••••••••••</p>
                    <span className="text-[10px] font-black text-green-500 uppercase">보안 유지됨</span>
                  </div>
                </div>
                <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                  <p className="text-xs text-indigo-300 leading-relaxed font-medium">귀하의 계정은 현재 고우선순위 렌더링 작업을 위해 글로벌 마스터 키를 사용 중입니다. 모든 모드에서 Gemini 3 Pro가 활성화되어 있습니다.</p>
                </div>
              </div>
            )}
          </div>

          <footer className="mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500">
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">© 2024 CREATOR PRO AI Labs. All Rights Reserved.</p>
            <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest">
                <a href="#" className="hover:text-white transition-colors">문서 확인</a>
                <a href="#" className="hover:text-white transition-colors">API 상태</a>
                <a href="#" className="hover:text-white transition-colors">법적 고지</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
