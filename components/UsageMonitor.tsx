"use client";
import React, { useState } from 'react';
import { useStore } from '@/store';
import { Activity, CheckCircle, XCircle, Zap, Cpu, ChevronUp, ChevronDown } from 'lucide-react';

export const UsageMonitor = () => {
    const { usage } = useStore();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            {/* Popup Panel (Absolute positioned upwards) */}
            {isOpen && (
                <div className="absolute bottom-full left-0 w-full mb-3 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50">
                     <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3 h-3 text-indigo-400" />
                            Session Real-time
                        </p>
                         <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full text-gray-400 hover:text-white transition-colors">
                            <ChevronDown className="w-3 h-3" />
                         </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-black/40 rounded-xl p-3 border border-white/5 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                            <div className="flex items-center gap-1.5 mb-2 relative z-10">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider">Success</span>
                            </div>
                            <p className="text-xl font-black text-white leading-none tracking-tight relative z-10">{usage.successfulRequests}</p>
                        </div>
                        <div className="bg-black/40 rounded-xl p-3 border border-white/5 relative overflow-hidden group">
                             <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                            <div className="flex items-center gap-1.5 mb-2 relative z-10">
                                <XCircle className="w-3 h-3 text-red-500" />
                                <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Failed</span>
                            </div>
                            <p className="text-xl font-black text-white leading-none tracking-tight relative z-10">{usage.failedRequests}</p>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[9px] text-gray-500">
                            <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Token Usage</span>
                            <span className="font-mono text-indigo-300 font-bold">{usage.totalTokens.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden flex">
                            <div
                                className="bg-blue-500 h-full transition-all duration-500"
                                style={{ width: `${usage.totalTokens > 0 ? (usage.inputTokens / usage.totalTokens) * 100 : 0}%` }}
                            />
                            <div
                                className="bg-indigo-500 h-full transition-all duration-500"
                                style={{ width: `${usage.totalTokens > 0 ? (usage.outputTokens / usage.totalTokens) * 100 : 0}%` }}
                            />
                        </div>

                         <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                Est. Cost
                            </span>
                             <p className="text-xs font-black text-white text-right">
                                ${((usage.inputTokens / 1_000_000) * 3.50 + (usage.outputTokens / 1_000_000) * 10.50 + (usage.generatedImages * 0.04)).toFixed(4)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Minimized Trigger Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 rounded-xl border transition-all duration-300 flex items-center justify-between group
                    ${isOpen ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}
                `}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isOpen ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-gray-400 group-hover:text-white'}`}>
                        <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">System Status</p>
                        <div className="flex items-center gap-1.5">
                             <div className={`w-1.5 h-1.5 rounded-full ${usage.totalRequests > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                             <span className="text-[9px] font-mono text-gray-500 group-hover:text-gray-300">
                                {usage.totalRequests > 0 ? 'Processing' : 'Idle'}
                             </span>
                        </div>
                    </div>
                </div>
                <ChevronUp className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
        </div>
    );
};
