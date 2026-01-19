"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/store';

/**
 * StoreHydration - Zustand + IndexedDB Hydration 처리 컴포넌트
 * 
 * ⚠️ 이 컴포넌트는 삭제하지 마세요!
 * 
 * 역할:
 * - 비동기 IndexedDB 스토리지와 SSR 간의 hydration 충돌 방지
 * - 클라이언트 측에서 수동으로 store hydration 처리
 * - hydration 완료 전까지 로딩 UI 표시
 * 
 * 사용법:
 * - layout.tsx에서 children을 이 컴포넌트로 감싸기
 * - store.ts의 persist 옵션에 반드시 `skipHydration: true` 설정 필요
 * 
 * 이 컴포넌트 없이 IndexedDB persist를 사용하면 무한 로딩 발생!
 * 
 * @see /zustand-hydration-fix 워크플로우
 * @see store.ts - skipHydration 옵션
 */
export function StoreHydration({ children }: { children: React.ReactNode }) {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Manually trigger hydration after the component mounts (client-side only)
        const unsubscribe = useStore.persist.onFinishHydration(() => {
            setIsHydrated(true);
        });

        // Start hydration
        useStore.persist.rehydrate();

        return () => {
            unsubscribe();
        };
    }, []);

    // Show loading state while hydrating
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                    <p className="text-white/50 text-sm font-medium">로딩 중...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
