import React from 'react';
import { Zap, Clock, Info } from 'lucide-react';

export const ServerStatusIndicator: React.FC = () => {
    const getStatus = () => {
        const hour = new Date().getHours();
        // Assume congested 11 PM to 9 AM based on previous logic
        const isCongested = hour >= 23 || hour < 9;
        return {
            label: isCongested ? '🐢 혼잡 시간대 (안전 모드)' : '⚡️ 쾌적 시간대 (부스트 모드)',
            description: isCongested 
                ? '사용자가 많아 생성 속도가 조절됩니다.' 
                : '대기열 없이 최대 속도로 생성됩니다.',
            colorClass: isCongested 
                ? 'text-orange-300 bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]' 
                : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]'
        };
    };

    const status = getStatus();

    return (
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 animate-in fade-in duration-700 ${status.colorClass}`}>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">SYSTEM STATUS</span>
                <span className="text-xs font-bold flex items-center gap-1.5">
                    {status.label}
                </span>
            </div>
        </div>
    );
};
