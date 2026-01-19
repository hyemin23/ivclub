---
description: Zustand + IndexedDB 무한 로딩 문제 해결 가이드
---

# Zustand + IndexedDB Hydration 문제 해결

## 문제 증상
- 브라우저에서 페이지가 무한 로딩 상태로 멈춤
- 서버 로그에 `○ Compiling / ...`만 표시되고 진행되지 않음
- 콘솔에 hydration 관련 에러 발생 가능

## 원인
Zustand의 `persist` 미들웨어와 비동기 스토리지(IndexedDB)를 사용할 때, 
SSR(Server-Side Rendering)과 클라이언트 hydration 사이에 충돌이 발생합니다.

IndexedDB는 비동기이므로 서버에서 렌더링된 HTML과 클라이언트에서 hydration된 
상태가 일치하지 않아 무한 로딩이 발생할 수 있습니다.

## 해결 방법

### 1. store.ts에 skipHydration 옵션 추가
```typescript
export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // ... store 정의
    }),
    {
      name: 'storage-name',
      storage: createJSONStorage(() => storage), // IndexedDB
      skipHydration: true, // ⚠️ 필수! 자동 hydration 비활성화
      partialize: (state) => ({
        // 저장할 상태만 선택
      }),
    }
  )
);
```

### 2. StoreHydration 컴포넌트 사용
`components/StoreHydration.tsx` 파일이 클라이언트 측에서 수동으로 hydration을 처리합니다.

```tsx
// app/layout.tsx에서 children을 StoreHydration으로 감싸기
<AuthProvider>
  <StoreHydration>
    {children}
  </StoreHydration>
</AuthProvider>
```

### 3. 체크리스트
새로운 persist 스토어 추가 시:
- [ ] `skipHydration: true` 옵션 추가했는가?
- [ ] 비동기 스토리지 사용 시 StoreHydration 컴포넌트로 감싸져 있는가?
- [ ] 클라이언트 전용 컴포넌트에 `"use client"` 지시어가 있는가?

## 추가 문제 해결

### 브라우저 캐시 문제
IndexedDB에 손상된 데이터가 있을 경우:
1. Chrome DevTools → Application → IndexedDB
2. 해당 스토리지 삭제
3. 페이지 새로고침

### 개발 서버 문제
```bash
# .next 캐시 삭제 후 재시작
rm -rf .next
npm run dev
```

## 관련 파일
- `/store.ts` - Zustand 스토어 정의
- `/components/StoreHydration.tsx` - Hydration 처리 컴포넌트
- `/app/layout.tsx` - 앱 레이아웃
