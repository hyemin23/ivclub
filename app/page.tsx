"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Factory, UserRoundPen, Zap, Settings, User, Rocket, Smartphone, Users, Menu, X, LayoutGrid, PanelLeftClose, PanelLeftOpen, Lock, Palette, Video, Layers, Eraser } from 'lucide-react';
import { useStore } from '@/store';
import { SidebarGroup } from '@/components/SidebarGroup';
import FloatingLogViewer from '@/components/FloatingLogViewer';
import { ApiKeySelector } from '@/components/ApiKeySelector';

// Dynamic Imports with Loading States
const AdminKeyManager = dynamic(() => import('@/components/AdminKeyManager').then(mod => mod.AdminKeyManager), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading Admin...</div>,
  ssr: false
});
const FitBuilder = dynamic(() => import('@/components/FitBuilder'), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading Builder...</div>,
  ssr: false
});

const UGCMaster = dynamic(() => import('@/components/UGCMaster'), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading UGC Master...</div>,
  ssr: false
});
const FactoryOnePage = dynamic(() => import('@/components/FactoryOnePage'), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading Factory...</div>,
  ssr: false
});
const ThumbnailGenerator = dynamic(() => import('@/components/ThumbnailGenerator'), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading Generator...</div>,
  ssr: false
});
const CreditShop = dynamic(() => import('@/components/CreditShop').then(mod => mod.CreditShop), { ssr: false });
const UsageMonitor = dynamic(() => import('@/components/UsageMonitor').then(mod => mod.UsageMonitor), { ssr: false });
const CanvasEditor = dynamic(() => import('@/components/CanvasEditor'), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading Canvas Editor...</div>,
  ssr: false
});
const VideoStudio = dynamic(() => import('@/components/VideoStudio').then(mod => mod.VideoStudio), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading Video Studio...</div>,
  ssr: false
});
const ColorVariation = dynamic(() => import('@/components/ColorVariation').then(mod => mod.ColorVariation), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading Color Studio...</div>,
  ssr: false
});
const BatchStudio = dynamic(() => import('@/components/Step2BatchStudio'), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading Batch Studio...</div>,
  ssr: false
});
const HtmlCleaner = dynamic(() => import('@/components/HtmlCleaner'), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading HTML Cleaner...</div>,
  ssr: false
});
const BackgroundSwapStudio = dynamic(() => import('@/components/BackgroundSwapStudio'), {
  loading: () => <div className="p-12 text-center text-gray-500">Loading BSE v1.2...</div>,
  ssr: false
});

// const AutoFitting = () => <div className="p-10 border border-dashed border-gray-700 rounded-xl text-center text-gray-400">AutoFitting Disabled</div>;
// const UGCMaster = () => <div className="p-10 border border-dashed border-gray-700 rounded-xl text-center text-gray-400">UGCMaster Disabled</div>;
// const FactoryOnePage = () => <div className="p-10 border border-dashed border-gray-700 rounded-xl text-center text-gray-400">FactoryOnePage Disabled</div>;
// const ThumbnailGenerator = () => <div className="p-10 border border-dashed border-gray-700 rounded-xl text-center text-gray-400">ThumbnailGenerator Disabled</div>;

const Page: React.FC = () => {
  const [hasKey, setHasKey] = useState(
    process.env.NODE_ENV === 'development' || !!process.env.NEXT_PUBLIC_GEMINI_API_KEY
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 기본값: 닫힘
  const { step, brandName, appView, setAppView } = useStore();

  if (!hasKey) {
    return <ApiKeySelector onKeySelected={() => setHasKey(true)} />;
  }

  // Grouped Navigation Structure
  const navigationGroups = [
    {
      title: "AI 빌더",
      items: [
        {
          id: 'fit-builder',
          name: '스마트 빌더',
          icon: <UserRoundPen className="w-5 h-5" />,
          description: '정밀 이미지 편집',
          view: 'fit-builder' as const
        },

        {
          id: 'color-variation',
          name: 'AI 컬러 변경',
          icon: <Palette className="w-5 h-5" />,
          description: '질감 보존 색상 변경',
          view: 'color-variation' as const
        },
        {
          id: 'thumbnail-generator',
          name: '썸네일 & 코디',
          icon: <LayoutGrid className="w-5 h-5" />,
          description: '다채널 이미지 최적화',
          view: 'thumbnail-generator' as const
        },
        {
          id: 'factory',
          name: '상페 AI 팩토리',
          icon: <Factory className="w-5 h-5" />,
          description: '대량 상페 자동 생성',
          view: 'factory' as const
        },
        {
          id: 'batch-studio',
          name: '대량 생성 스튜디오',
          icon: <Layers className="w-5 h-5" />,
          description: '20+ Lookbook Factory',
          view: 'batch-studio' as const
        },
        {
          id: 'background-swap',
          name: '배경 스왑 엔진',
          icon: <Layers className="w-5 h-5 text-indigo-400" />,
          description: 'BSE v1.2 (Strict)',
          view: 'background-swap' as const
        },
        {
          id: 'canvas-editor',
          name: '캔버스 에디터',
          icon: <Palette className="w-5 h-5" />,
          description: 'Vision AI 상세페이지',
          view: 'canvas-editor' as const
        },
        {
          id: 'video-studio',
          name: 'AI Video Studio',
          icon: <Video className="w-5 h-5" />, // Ensure Video icon is imported from lucide-react in line 5
          description: '숏폼 영상 생성',
          view: 'video-studio' as const
        },
      ]
    },
    {
      title: "광고 AI",
      items: [
        {
          id: 'ugc-master',
          name: 'UGC 마스터',
          icon: <Smartphone className="w-5 h-5" />,
          description: '소셜 실사 생성기',
          view: 'ugc-master' as const
        },
      ]
    },
    {
      title: "시스템",
      items: [
        {
          id: 'html-cleaner',
          name: 'HTML 클리너',
          icon: <Eraser className="w-5 h-5 text-indigo-400" />,
          description: '스마트스토어 태그 정리',
          view: 'html-cleaner' as const
        },
        {
          id: 'settings',
          name: '시스템 설정',
          icon: <Settings className="w-5 h-5" />,
          description: '환경 설정 및 API',
          view: 'settings' as const
        },
        {
          id: 'admin',
          name: '관리자 보안',
          icon: <Lock className="w-5 h-5 text-red-500" />,
          description: 'API 키 / 권한 관리',
          view: 'admin' as const
        },
      ].filter(item => {
        // Hide Admin menu in development mode as requested
        if (process.env.NODE_ENV === 'development' && item.id === 'admin') {
          return false;
        }
        return true;
      })
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col md:flex-row">

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-black tracking-tighter uppercase">NANOBANANA</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 네비게이션 (Responsive Drawer & Collapsible PC) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-[100dvh] bg-slate-950/90 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isSidebarOpen ? 'md:w-72' : 'md:w-20'}
      `}>
        {/* Toggle Button for PC */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex absolute -right-3 top-8 bg-slate-800 border border-slate-700 text-gray-400 hover:text-white rounded-full p-1.5 shadow-lg z-50 transition-colors"
          title={isSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-3 h-3" /> : <PanelLeftOpen className="w-3 h-3" />}
        </button>

        <div className={`flex-1 overflow-y-auto ${isSidebarOpen ? 'p-8 pb-4' : 'p-4 pb-4 items-center'}`}>
          <div
            className={`flex items-center gap-3 mb-10 group cursor-pointer ${!isSidebarOpen && 'justify-center'}`}
            onClick={() => { setAppView('ugc-master'); setIsMobileMenuOpen(false); }}
            title="홈으로 이동"
          >
            <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/20 group-hover:scale-110 transition-transform flex-shrink-0`}>
              <span className="text-xl">🚀</span>
            </div>
            {isSidebarOpen && (
              <div className="animate-in fade-in duration-300">
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">버티컬 끝판왕</h1>
                <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] mt-1 uppercase">버티컬 전문 엔진</p>
              </div>
            )}
          </div>

          <nav className="space-y-4">
            {navigationGroups.map((group, groupIndex) => (
              <SidebarGroup
                key={groupIndex}
                group={group}
                isSidebarOpen={isSidebarOpen}
                appView={appView}
                setAppView={(view) => {
                  setAppView(view);
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
          </nav>
        </div>

        <div className={`mt-auto border-t border-white/5 ${isSidebarOpen ? 'p-8' : 'p-4'}`}>
          {isSidebarOpen ? (
            <>
              <div className="mt-6 mb-8 animate-in fade-in duration-300">
                <CreditShop />
                <UsageMonitor />
              </div>
              <div className="p-4 bg-white/5 rounded-2xl space-y-3 animate-in fade-in duration-300">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">현재 플랜</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase">ENTERPRISE RAW</p>
                  <span className="text-[9px] bg-green-500 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">활성화됨</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Mini Usage Indicator */}
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="System Active" />
            </div>
          )}
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 min-h-screen pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 md:px-12 md:py-12 animate-in fade-in duration-700">
          <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6 md:pb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">프로 렌더링 모드</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase text-white">
                {appView === 'ugc-master' && 'UGC 마스터'}
                {appView === 'factory' && '상페 AI 팩토리'}
                {appView === 'fit-builder' && '스마트 빌더'}

                {appView === 'color-variation' && 'AI PIGMENT STUDIO'}
                {appView === 'thumbnail-generator' && '썸네일 & 코디 생성기'}
                {appView === 'settings' && '시스템 설정'}
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-2 max-w-2xl">
                {appView === 'ugc-master' && '아이폰 4K RAW 결과물과 동일한 질감의 소셜 전용 실사 패션 콘텐츠를 생성합니다.'}
                {appView === 'factory' && '지능형 분석과 일괄 생성을 통해 커머스에 최적화된 룩북을 제작합니다.'}
                {appView === 'fit-builder' && '포즈 변경, 배경 합성, 디테일 컷 추출 등 정교한 개별 편집 기능을 제공합니다.'}

                {appView === 'thumbnail-generator' && '자사몰/오픈마켓 썸네일과 쇼핑 앱 전용 코디(전신) 이미지를 규격에 맞춰 생성합니다.'}
                {appView === 'settings' && '시스템 구성 및 API 상태를 관리합니다.'}
                {appView === 'color-variation' && '원단 질감과 조명을 완벽하게 보존하며 오직 색상만 변경합니다. (Texture Lock Engine)'}
                {appView === 'batch-studio' && '단 한 장의 사진으로 20장 이상의 컬러/포즈 베리에이션 룩북을 일괄 생산합니다. (Matrix Engine)'}
                {appView === 'html-cleaner' && '복잡한 에디터 HTML을 깔끔한 스마트스토어 전용 레이아웃으로 변환합니다.'}
                {appView === 'background-swap' && '픽셀 단위로 원본을 보존하며 배경만 교체합니다. (Split Harmonization Engine)'}
              </p>
            </div>

            <div className="flex gap-2">
              <div className="px-3 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2 md:gap-3">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Gemini 3 Pro</span>
              </div>
              <button
                onClick={() => {
                  if (confirm('새 프로젝트를 시작하시겠습니까? 현재 작업 내용은 초기화되지만 브랜드 에셋은 유지됩니다.')) {
                    useStore.getState().resetAll();
                  }
                }}
                className="px-3 py-2 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-colors"
              >
                + New
              </button>
            </div>
          </div>


          <div className="content-container">
            {appView === 'ugc-master' && <UGCMaster />}
            {appView === 'factory' && <FactoryOnePage />}
            {appView === 'fit-builder' && <FitBuilder />}

            {appView === 'thumbnail-generator' && <ThumbnailGenerator />}
            {appView === 'admin' && <AdminKeyManager />}
            {appView === 'canvas-editor' && <CanvasEditor />}
            {appView === 'video-studio' && <VideoStudio />}

            {appView === 'color-variation' && <ColorVariation />}
            {appView === 'batch-studio' && <BatchStudio />}
            {appView === 'html-cleaner' && <HtmlCleaner />}
            {appView === 'background-swap' && <BackgroundSwapStudio />}
            {appView === 'settings' && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">

                <div className="glass-panel p-10 rounded-[3rem] space-y-8">
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
        <FloatingLogViewer />
      </main >
    </div >
  );
};

export default Page;
