
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { resizeImage } from '../utils/imageProcessor';
import { generateAutoFitting, parseGeminiError } from '../services/geminiService';
import { Resolution, AspectRatio, CameraAngle, VariationResult } from '../types';
import { ConcurrencySettings } from '../services/autofit/autofit.types';

export const useAutoFit = () => {
    const { autoFitting, setAutoFittingState, updateAutoFittingResult } = useStore();
    const { productImage, bgImage, results, resolution, aspectRatio } = autoFitting;

    // Local UI state
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [prompt, setPrompt] = useState(autoFitting.prompt || ''); // Sync with store if possible, local for now
    const [selectedAngles, setSelectedAngles] = useState<CameraAngle[]>(autoFitting.selectedAngles || ['front', 'left-30', 'right-30', 'left-side', 'right-side']);
    const [isSideProfile, setIsSideProfile] = useState<boolean>(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    // Store Helpers
    const setProductImage = (url: string | null) => setAutoFittingState({ productImage: url });
    const setBgImage = (url: string | null) => setAutoFittingState({ bgImage: url });
    const setResults = (newResults: VariationResult[]) => setAutoFittingState({ results: newResults });
    const setResolution = (res: Resolution) => setAutoFittingState({ resolution: res });
    const setAspectRatio = (ratio: AspectRatio) => setAutoFittingState({ aspectRatio: ratio });

    const processFile = (type: 'product' | 'bg', file: File) => {
        if (file.size > 20 * 1024 * 1024) {
            toast.error("20MB 이하의 이미지를 사용해주세요.");
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast.error("이미지 파일만 업로드 가능합니다.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'product') {
                setProductImage(reader.result as string);
                toast.success('상품 이미지가 로드되었습니다.');
            } else {
                setBgImage(reader.result as string);
                toast.success('배경 이미지가 로드되었습니다.');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleStop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            toast.info("작업이 사용자에 의해 중지되었습니다.");
            setIsLoading(false);
        }
    }, []);

    const getConcurrencySettings = (): ConcurrencySettings => {
        const hour = new Date().getHours();
        const isCongested = hour >= 23 || hour < 9;
        return {
            limit: isCongested ? 1 : 3,
            label: isCongested ? '🐢 혼잡 시간대 (안전 모드)' : '⚡️ 쾌적 시간대 (부스트 모드)',
            color: isCongested ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        };
    };

    const generateSingleAngle = async (id: string, angle: CameraAngle, productImg: string, bgImg: string | null, userPrompt: string, signal?: AbortSignal) => {
        try {
            if (signal?.aborted) return;
            // Pass isSideProfile
            const url = await generateAutoFitting(productImg, bgImg, userPrompt, angle, aspectRatio, resolution, isSideProfile, signal);
            if (!signal?.aborted) {
                updateAutoFittingResult(id, { url, status: 'success' });
            }
        } catch (error: any) {
            if (signal?.aborted || error.message === "작업이 취소되었습니다.") return;

            const parsed = parseGeminiError(error);
            updateAutoFittingResult(id, {
                status: 'error',
                errorType: parsed.type,
                errorMessage: parsed.message
            });
            toast.error(`생성 실패 (${angle}): ${parsed.message}`);
        }
    };

    const handleGenerate = async (isTestMode: boolean = false) => {
        if (!productImage) return;
        setIsLoading(true);
        setProgress(0);
        setProgressText('작업 준비 중...');

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const allAngles = selectedAngles.map(angle => ({ angle, label: angle }));
        const targetAngles = isTestMode ? (allAngles.length > 0 ? [allAngles[0]] : [{ angle: 'front', label: 'front' }]) : allAngles;

        const newResults: VariationResult[] = targetAngles.map((target, i) => ({
            id: `${Date.now()}-${i}`,
            url: '',
            angle: target.angle as CameraAngle,
            status: 'loading' as const
        }));

        setResults(newResults);

        const targetSize = resolution === '1K' ? 1024 : 2048;

        try {
            setProgressText('이미지 최적화 중...');
            const [optimizedProduct, optimizedBg] = await Promise.all([
                resizeImage(productImage, targetSize),
                bgImage ? resizeImage(bgImage, targetSize) : Promise.resolve(null)
            ]);

            if (signal.aborted) return;

            // 🚀 Full Parallel Processing with Hybrid Model
            setProgressText(`⚡️ 5개 앵글 동시 생성 중... (병렬 처리)`);
            console.log('🚀 Starting parallel generation for', newResults.length, 'angles');

            const generatePromises = newResults.map(async (item) => {
                if (signal.aborted) return;

                // No-Downgrade Policy: All Pro Models
                console.log(`📸 [${item.angle}] Generating with PRO model...`);

                try {
                    const url = await generateAutoFitting(
                        optimizedProduct,
                        optimizedBg,
                        prompt,
                        item.angle,
                        aspectRatio,
                        resolution,
                        isSideProfile,
                        signal
                    );
                    if (!signal.aborted) {
                        updateAutoFittingResult(item.id, { url, status: 'success' });
                    }
                } catch (error: any) {
                    if (signal.aborted || error.message === "작업이 취소되었습니다.") return;
                    const parsed = parseGeminiError(error);
                    updateAutoFittingResult(item.id, {
                        status: 'error',
                        errorType: parsed.type,
                        errorMessage: parsed.message
                    });
                    toast.error(`생성 실패 (${item.angle}): ${parsed.message}`);
                }
            });

            // Wait for all to complete
            await Promise.all(generatePromises);
            console.log('✅ All angles completed');

        } catch (err) {
            console.error(err);
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
                setProgress(100);
                setProgressText('완료!');
                setTimeout(() => setProgressText(''), 2000);
                abortControllerRef.current = null;
            }
        }
    };

    const handleDownloadAll = async () => {
        const successResults = results.filter(r => r.status === 'success');
        for (let i = 0; i < successResults.length; i++) {
            const link = document.createElement('a');
            link.href = successResults[i].url;
            link.download = `auto_fit_${successResults[i].angle}_${i}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    };

    return {
        productImage, setProductImage,
        bgImage, setBgImage,
        results,
        resolution, setResolution,
        aspectRatio, setAspectRatio,
        selectedAngles, setSelectedAngles,
        prompt, setPrompt,
        isLoading,
        progress,
        progressText,
        processFile,
        handleGenerate,
        handleStop,
        handleDownloadAll,
        getConcurrencySettings,
        isSideProfile, setIsSideProfile
    };
};
