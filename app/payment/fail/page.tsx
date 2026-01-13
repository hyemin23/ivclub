'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export default function PaymentFailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const code = searchParams.get('code');
    const message = searchParams.get('message');

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-red-500">결제에 실패했습니다</h1>

                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center">
                    <p className="text-gray-400 mb-2">에러 코드: {code}</p>
                    <p className="font-medium text-lg">{message}</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/')}
                        className="flex-1 bg-slate-800 text-gray-300 font-bold py-4 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                        홈으로
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        </div>
    );
}
