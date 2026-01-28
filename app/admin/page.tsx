"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Lock, Key, Check, ShieldCheck, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
    const store = useStore();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Check session storage for auth persistence
        if (sessionStorage.getItem('admin_auth') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '4848') {
            setIsAuthenticated(true);
            sessionStorage.setItem('admin_auth', 'true');
            toast.success("Admin Access Granted");
        } else {
            toast.error("Invalid Password");
        }
    };

    const handleKeySelect = (keyId: string) => {
        store.setActiveKeyId(keyId);
        toast.success(`Switched to ${keyId}`);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_auth');
    };

    if (!isClient) return null;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="w-full max-w-sm bg-slate-900 p-8 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-widest">Admin Access</h1>
                        <p className="text-slate-500 text-sm">Protected Area</p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:border-indigo-500 transition-colors"
                            placeholder="PASSCODE"
                            autoFocus
                        />
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors">
                            UNLOCK
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                            System Admin
                        </h1>
                        <p className="text-slate-500 mt-2">Configuration & API Management</p>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold hover:bg-red-500/20 hover:text-red-400 transition-colors">
                        LOGOUT
                    </button>
                </div>

                {/* API Key Manager */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Key className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-xl font-bold uppercase tracking-wider">API Key Management</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {store.apiKeys.map((k) => {
                            const isActive = k.id === store.activeKeyId;
                            // Mask Key: "AIza...55kX"
                            const maskedKey = k.key ? `${k.key.substring(0, 8)}...${k.key.substring(k.key.length - 6)}` : 'NOT SET';

                            return (
                                <div
                                    key={k.id}
                                    onClick={() => handleKeySelect(k.id)}
                                    className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer group ${isActive
                                        ? 'bg-indigo-900/20 border-indigo-500 shadow-2xl shadow-indigo-500/10'
                                        : 'bg-slate-900 border-transparent hover:border-slate-700'
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute top-4 right-4 text-indigo-400">
                                            <Check className="w-6 h-6 border-2 border-indigo-400 rounded-full p-1" />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                            <span className="font-black text-lg">{k.id.split('_')[1]}</span>
                                        </div>

                                        <div>
                                            <h3 className={`font-bold text-sm uppercase mb-1 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                                {k.label}
                                            </h3>
                                            <code className="text-[10px] bg-black/50 px-2 py-1 rounded text-slate-500 font-mono block w-fit">
                                                {maskedKey}
                                            </code>
                                        </div>

                                        <div className="mt-2 pt-4 border-t border-white/5 flex justify-between items-center">
                                            <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-green-400' : 'text-slate-600'}`}>
                                                {isActive ? 'ACTIVE NODE' : 'STANDBY'}
                                            </span>
                                            {isActive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-xs font-medium flex items-start gap-3 mt-4">
                        <RefreshCcw className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>
                            Changes to the Active API Key are applied immediately to all new requests.
                            Running jobs are not affected. If a key hits 429 Quota limits, switch to a Standby key manually.
                        </p>
                    </div>
                </section>

                {/* System Stats (Optional) */}
                <section className="space-y-6 pt-12 border-t border-white/10 opacity-50">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">System Metrics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                            <div className="text-slate-500 text-[10px] uppercase font-bold">Total Requests</div>
                            <div className="text-2xl font-mono text-white">{store.usage.totalRequests}</div>
                        </div>
                        {/* <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                            <div className="text-slate-500 text-[10px] uppercase font-bold">Credits Used</div>
                            <div className="text-2xl font-mono text-white">N/A</div>
                        </div> */}
                    </div>
                </section>
            </div>
        </div>
    );
}
