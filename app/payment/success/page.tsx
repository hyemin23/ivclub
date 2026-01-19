'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/store';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addCredits } = useStore(); // Hypothetical store action
    const [isProcessing, setIsProcessing] = useState(true);

    const paymentKey = searchParams?.get('paymentKey');
    const orderId = searchParams?.get('orderId');
    const amount = searchParams?.get('amount');

    useEffect(() => {
        if (!paymentKey || !orderId || !amount) {
            return;
        }

        // In a real app, verify this payment on the server passing these params
        // For MVP/Demo, we assume client-side success and update store

        // Simulate API call
        setTimeout(() => {
            // TODO: Call backend verification API here
            // await fetch('/api/confirm-payment', { method: 'POST', body: ... })

            // Client-side credit update (for demo only)
            // addCredits(Number(amount)); 

            setIsProcessing(false);
        }, 1000);

    }, [paymentKey, orderId, amount, addCredits]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-green-500">결제가 완료되었습니다!</h1>

                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-left space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-400">주문번호</span>
                        <span className="font-mono">{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">결제금액</span>
                        <span className="font-bold text-xl">{Number(amount).toLocaleString()}원</span>
                    </div>
                </div>

                <p className="text-gray-500 text-sm">
                    {isProcessing ? '결제 정보를 확인하고 있습니다...' : '크레딧이 충전되었습니다.'}
                </p>

                <button
                    onClick={() => router.push('/')}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    서비스로 돌아가기
                </button>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
