import React, { useState } from 'react';
import { useStore } from '../store';
import { Shield, Key, Eye, EyeOff, Check, X, Plus, Trash2, Power } from 'lucide-react';
import { toast } from 'sonner';

export const AdminKeyManager: React.FC = () => {
    const { apiKeys, activeKeyId, setApiKeys, setActiveKeyId } = useStore();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [newKey, setNewKey] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [showKey, setShowKey] = useState<string | null>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple hardcoded password for now
        if (password === '4848') {
            setIsAuthenticated(true);
            toast.success("관리자 모드로 접속되었습니다.");
        } else {
            toast.error("비밀번호가 올바르지 않습니다.");
        }
    };

    const handleAddKey = () => {
        if (!newKey.startsWith('AIza')) {
            toast.error("유효하지 않은 키 형식입니다 (AIza...)");
            return;
        }
        if (!newLabel) {
            toast.error("식별할 별칭을 입력해주세요.");
            return;
        }

        const id = `key_${Date.now()}`;
        setApiKeys([...apiKeys, { id, label: newLabel, key: newKey }]);
        setNewKey('');
        setNewLabel('');
        toast.success("새 API 키가 등록되었습니다.");
    };

    const handleDeleteKey = (id: string) => {
        if (apiKeys.length <= 1) {
            toast.error("최소 1개의 키는 유지해야 합니다.");
            return;
        }
        if (id === activeKeyId) {
            toast.error("현재 사용 중인 키는 삭제할 수 없습니다.");
            return;
        }
        if (confirm("정말로 이 키를 삭제하시겠습니까?")) {
            setApiKeys(apiKeys.filter(k => k.id !== id));
            toast.success("키가 삭제되었습니다.");
        }
    };

    const handleActivate = (id: string) => {
        setActiveKeyId(id);
        toast.success("활성 키가 변경되었습니다.");
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center p-10 min-h-[500px]">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20">
                    <Shield className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">관리자 접근 제어</h2>
                <p className="text-gray-500 text-sm mb-6">API 키 관리는 승인된 관리자만 가능합니다.</p>

                <form onSubmit={handleLogin} className="flex gap-2">
                    <input
                        type="password"
                        placeholder="관리자 인증코드"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl focus:border-red-500 outline-none w-48"
                    />
                    <button type="submit" className="bg-white text-black font-bold px-4 py-2 rounded-xl hover:bg-gray-200">
                        잠금 해제
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Shield className="w-8 h-8 text-red-500" />
                        API Key Vault
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">서비스 운영에 사용될 Google Gemini API 키를 관리합니다.</p>
                </div>
                <button onClick={() => setIsAuthenticated(false)} className="text-xs text-gray-500 hover:text-white underline">
                    로그아웃
                </button>
            </div>

            <div className="grid gap-4">
                {apiKeys.map((item) => (
                    <div
                        key={item.id}
                        className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${activeKeyId === item.id
                            ? 'bg-green-500/5 border-green-500/30 shadow-lg shadow-green-500/10'
                            : 'bg-slate-900/50 border-white/5 hover:bg-slate-900'
                            }`}
                    >
                        <div className="flex items-center gap-6">
                            <div
                                onClick={() => handleActivate(item.id)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${activeKeyId === item.id ? 'bg-green-500 text-black' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                    }`}
                            >
                                <Power className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className={`font-bold text-lg ${activeKeyId === item.id ? 'text-green-400' : 'text-gray-300'}`}>
                                        {item.label}
                                    </h3>
                                    {activeKeyId === item.id && (
                                        <span className="text-[10px] font-black bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 group">
                                    {showKey === item.id ? (
                                        <span>{item.key}</span>
                                    ) : (
                                        <span>•••••••••••••••••••••••••••••••••{item.key.slice(-4)}</span>
                                    )}
                                    <button
                                        onClick={() => setShowKey(showKey === item.id ? null : item.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {showKey === item.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {activeKeyId !== item.id && (
                            <button
                                onClick={() => handleDeleteKey(item.id)}
                                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mt-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-500" />
                    새 키 등록
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="키 별칭 (예: 팀장님 계정)"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="AIza..."
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                        />
                        <button
                            onClick={handleAddKey}
                            disabled={!newKey || !newLabel}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            등록
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
