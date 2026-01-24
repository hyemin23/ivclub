"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { AppView } from '@/types';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  view: AppView;
}

interface SidebarGroupProps {
  group: {
    title: string;
    items: NavigationItem[];
  };
  isSidebarOpen: boolean;
  appView: AppView;
  setAppView: (view: AppView) => void;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({ group, isSidebarOpen, appView, setAppView }) => {
  // Check if this group contains the active view
  const isActiveGroup = group.items.some(item => item.id === appView);

  // State for accordion: default expands if active
  const [isExpanded, setIsExpanded] = useState(isActiveGroup);

  // Update expansion when appView changes (auto-expand logic)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (isActiveGroup && !isExpanded) setIsExpanded(true);
  }, [appView, isActiveGroup]);

  return (
    <div className="space-y-2">
      {isSidebarOpen && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between pl-4 pr-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors group/header"
        >
          <span>{group.title}</span>
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover/header:text-gray-400" />
          </div>
        </button>
      )}

      {(!isSidebarOpen || isExpanded) && (
        <div className={`space-y-1 ${isSidebarOpen ? 'animate-in slide-in-from-top-2 duration-200' : ''}`}>
          {group.items.map((item) => (
            <button
              key={item.id}
              onClick={() => setAppView(item.view)}
              className={`w-full group relative flex items-center p-3 rounded-xl transition-all ${isSidebarOpen ? 'gap-4 text-left pl-6' : 'justify-center'
                } ${appView === item.id
                  ? 'bg-white text-black shadow-xl shadow-white/10 scale-[1.02] z-10'
                  : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              title={!isSidebarOpen ? item.name : undefined}
            >
              <div className={`flex-shrink-0 ${appView === item.id ? 'text-black' : 'text-gray-500 group-hover:text-white'}`}>
                {item.icon}
              </div>
              {isSidebarOpen && (
                <div className="animate-in fade-in duration-300 overflow-hidden whitespace-nowrap">
                  <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-0.5">{item.name}</p>
                  <p className={`text-[9px] ${appView === item.id ? 'text-black/60' : 'text-gray-500'}`}>{item.description}</p>
                </div>
              )}
              {appView === item.id && isSidebarOpen && (
                <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full animate-pulse flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
