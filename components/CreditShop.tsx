'use client';

import { useState } from 'react';
import { useStore } from '../store';
import { PaymentModal } from './PaymentModal';
import { LoginModal } from './LoginModal';
import { CreditCard, Package } from 'lucide-react';

export const CreditShop: React.FC = () => {
    const { credits, user } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState(0);
    const [orderName, setOrderName] = useState('');

    const openPayment = (amount: number, name: string) => {
        if (!user) {
            setIsLoginModalOpen(true);
            return;
        }
        setSelectedAmount(amount);
        setOrderName(name);
        setIsModalOpen(true);
    };

    return (
        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-400">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Credits</span>
                </div>
                {user ? (
                    <div className="text-right">
                        <div className="text-xl font-black text-green-400">
                            {credits?.toLocaleString() || 0} P
                        </div>
                        <div className="text-[9px] text-gray-500 truncate max-w-[100px]">{user.email}</div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded transition-colors"
                    >
                        로그인 필요
                    </button>
                )}
            </div>

            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => openPayment(5000, '5,000 포인트 충전')}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-green-500 hover:bg-slate-800 transition-all group"
                    >
                        <span className="text-xs text-gray-500 group-hover:text-green-400 font-bold">STARTER</span>
                        <span className="text-sm font-white font-bold">5,000원</span>
                    </button>
                    <button
                        onClick={() => openPayment(10000, '10,000 포인트 충전')}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-green-500 hover:bg-slate-800 transition-all group"
                    >
                        <span className="text-xs text-green-600 group-hover:text-green-400 font-bold">BEST</span>
                        <span className="text-sm font-white font-bold">10,000원</span>
                    </button>
                </div>
                <button
                    onClick={() => openPayment(30000, '30,000 포인트 충전')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-slate-800 transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-600 group-hover:text-purple-400" />
                        <span className="text-xs text-gray-500 group-hover:text-white font-bold">ENTERPRISE</span>
                    </div>
                    <span className="text-sm font-white font-bold">30,000원</span>
                </button>
            </div>

            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                amount={selectedAmount}
                orderName={orderName}
            />

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </div>
    );
};
