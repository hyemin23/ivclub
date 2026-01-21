import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseGeminiState<T> {
  loading: boolean;
  data: T | null;
  error: Error | null;
}

export function useGemini<T, Args extends any[]>(
  apiFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<UseGeminiState<T>>({
    loading: false,
    data: null,
    error: null,
  });

  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // Toast ID for loading state (optional, can be used to update toast)
    const toastId = toast.loading("AI가 작업을 시작했습니다...");

    try {
      const result = await apiFunction(...args);
      setState({ loading: false, data: result, error: null });
      
      toast.dismiss(toastId);
      
      // Check for 'usedModel' in result if accessible (requires T to overlap with GeminiResponse-like structure)
      // Since T is generic, we do a loose check or just Generic Success.
      // @ts-ignore
      if (result?.usedModel?.includes('flash')) {
        toast.info("⚡️ 빠른 모드(Flash)로 완료되었습니다.", { description: "결과를 확인해주세요." });
      // @ts-ignore
      } else if (result?.usedModel?.includes('1.5-pro')) {
        toast.success("🎨 고화질 모드(Pro) 생성 완료!", { description: "1.5 Pro 모델이 사용되었습니다." });
      } else {
        toast.success("작업이 완료되었습니다!");
      }

      return result;
    } catch (err: any) {
      console.error("Gemini Hook Error:", err);
      setState({ loading: false, data: null, error: err });
      
      toast.dismiss(toastId);
      toast.error("작업 실패", { description: err.message || "알 수 없는 오류가 발생했습니다." });
      
      return null;
    }
  }, [apiFunction]);

  return { ...state, execute, reset: () => setState({ loading: false, data: null, error: null }) };
}
