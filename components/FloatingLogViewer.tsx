"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, ChevronDown, ChevronUp, Trash2, Activity, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore, LogEntry } from '../store';

const FloatingLogViewer: React.FC = () => {
  const { logs, clearLogs } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new logs arrive if keeping latest at top
  // or scroll to bottom if chronological. 
  // Store adds new logs to the BEGINNING array (unshift), so top is latest.
  
  const getIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'error': return <AlertCircle className="w-3 h-3 text-red-400" />;
      case 'warning': return <AlertCircle className="w-3 h-3 text-orange-400" />;
      default: return <Info className="w-3 h-3 text-blue-400" />;
    }
  };

  const getFormatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] flex flex-col items-end transition-all duration-300 ${isOpen ? 'w-80' : 'w-auto'}`}>
      
      {/* Expanded Panel */}
      {isOpen && (
        <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-300 mb-2">
          
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">System Logs</span>
            </div>
            <button 
              onClick={clearLogs} 
              className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
              title="Clear Logs"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Log List */}
          <div ref={scrollRef} className="h-64 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                <Terminal className="w-8 h-8 mb-2" />
                <span className="text-[10px] uppercase tracking-widest">No logs recorded</span>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="group flex flex-col gap-1 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                  <div className="flex items-center gap-2">
                    {getIcon(log.type)}
                    <span className="text-[10px] font-mono text-slate-500">{getFormatTime(log.timestamp)}</span>
                  </div>
                  <p className={`text-[11px] font-medium leading-relaxed pl-5 ${
                    log.type === 'error' ? 'text-red-300' : 
                    log.type === 'success' ? 'text-green-300' : 
                    log.type === 'warning' ? 'text-orange-300' : 'text-slate-300'
                  }`}>
                    {log.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center shadow-2xl border transition-all hover:scale-110 active:scale-95 ${
          isOpen 
            ? 'px-4 py-3 rounded-full bg-slate-800 text-white border-slate-700 w-full justify-between gap-3' 
            : 'w-12 h-12 rounded-full bg-black text-green-400 border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
        }`}
      >
        {isOpen ? (
          <>
             <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Close</span>
            </div>
          </>
        ) : (
          <div className="relative">
             <Terminal className="w-5 h-5" />
             {logs.length > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full animate-in zoom-in border border-black">
                  {logs.length > 99 ? '99+' : logs.length}
                </span>
             )}
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingLogViewer;
