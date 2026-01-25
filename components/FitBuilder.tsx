"use client";

import React, { useState } from 'react';
import { Layers, RefreshCw, UserCheck, Zap, PlusSquare, ImagePlus, Wallpaper, Eraser, Shirt, Ruler } from 'lucide-react';
import SizeGuideSystem from './SizeGuideSystem';
import PoseChange from './PoseChange';
import DetailExtra from './DetailExtra';
import FittingVariation from './FittingVariation';
import BackgroundChange from './BackgroundChange';

import dynamic from 'next/dynamic';

const SmartFittingRoom = dynamic(() => import('./SmartFittingRoom'), {
  loading: () => <div className="p-12 text-center text-gray-400">피팅룸 로딩중...</div>,
  ssr: false
});
import { FitSubMode } from '../types';

const FitBuilder: React.FC = () => {
  const [subMode, setSubMode] = useState<FitSubMode>('pose-change');

  const modes = [
    { id: 'pose-change', name: '포즈 변경', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'fitting-variation', name: '피팅 베리에이션', icon: <ImagePlus className="w-4 h-4" /> },
    { id: 'detail-extra', name: '디테일 컷 추출', icon: <PlusSquare className="w-4 h-4" /> },

    { id: 'background-change', name: '배경 교체', icon: <Wallpaper className="w-4 h-4" /> },
    { id: 'virtual-try-on', name: '스마트 피팅 (Beta)', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'size-extract', name: '사이즈 추출 (Auto)', icon: <Ruler className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-12">
      {/* 서브 네비게이션 */}
      <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSubMode(mode.id as FitSubMode)}
            className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${subMode === mode.id
              ? 'bg-white text-black shadow-lg'
              : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
          >
            {mode.icon}
            {mode.name}
          </button>
        ))}
      </div>

      {/* 기능별 콘텐츠 */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
        {subMode === 'pose-change' && <PoseChange />}
        {subMode === 'fitting-variation' && <FittingVariation />}
        {subMode === 'background-change' && <BackgroundChange />}
        {subMode === 'detail-extra' && <DetailExtra />}

        {subMode === 'virtual-try-on' && <SmartFittingRoom />}
        {subMode === 'size-extract' && (
          <div className="bg-white rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">사이즈 가이드 (Auto Extract)</h3>
            <SizeGuideSystem />
          </div>
        )}
      </div>
    </div>
  );
};

export default FitBuilder;
