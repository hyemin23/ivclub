
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { generatePoseChange, parseGeminiError } from '../services/geminiService';
import { Resolution, AspectRatio, FaceMode, Gender, CameraAngle } from '../types';
import { resizeImage } from '../utils/imageProcessor';

export const usePoseChange = () => {
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [refImage, setRefImage] = useState<string | null>(null);
    const [faceRefImage, setFaceRefImage] = useState<string | null>(null);

    const [prompt, setPrompt] = useState('');
    const [selectedAngles, setSelectedAngles] = useState<CameraAngle[]>(['default']);
    const [resolution, setResolution] = useState<Resolution>('2K');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [faceMode, setFaceMode] = useState<FaceMode>('HEADLESS');
    const [gender, setGender] = useState<Gender>('UNSPECIFIED');

    const [resultImages, setResultImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');

    const abortControllerRef = useRef<AbortController | null>(null);

    const handlePaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        if (!baseImage) setBaseImage(result);
                        else if (!refImage) setRefImage(result);
                        else setBaseImage(result);
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    }, [baseImage, refImage]);

    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    const handleImageUpload = (type: 'base' | 'ref' | 'face', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'base') setBaseImage(reader.result as string);
                else if (type === 'ref') setRefImage(reader.result as string);
                else if (type === 'face') setFaceRefImage(reader.result as string);
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleAngle = (angle: CameraAngle) => {
        if (angle === 'default') {
            setSelectedAngles(['default']);
            return;
        }

        setSelectedAngles(prev => {
            const newAngles = prev.filter(a => a !== 'default');
            if (newAngles.includes(angle)) {
                const filtered = newAngles.filter(a => a !== angle);
                return filtered.length === 0 ? ['default'] : filtered;
            } else {
                return [...newAngles, angle];
            }
        });
    };

    const handleStop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            toast.info("작업이 사용자에 의해 중지되었습니다.");
            setIsLoading(false);
        }
    }, []);

    const handleGenerate = async () => {
        if (!baseImage) return;
        setIsLoading(true);
        setResultImages([]);
        setProgress(0);
        setProgressText('작업 준비 중...');

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const faceOptions = { faceMode, gender, faceRefImage };
            const defaultPrompt = "Natural fashion model pose, standing, clean minimalist background.";
            const basePrompt = prompt ? `${defaultPrompt}, ${prompt}` : defaultPrompt;

            setProgressText('이미지 최적화 중...');
            const targetSize = resolution === '1K' ? 1024 : 1536;
            const optimizedBase = await resizeImage(baseImage, targetSize);
            const optimizedRef = refImage ? await resizeImage(refImage, targetSize) : null;

            let optimizedFace = null;
            if (faceRefImage) {
                optimizedFace = await resizeImage(faceRefImage, 1024);
            }
            const optimizedFaceOptions = { ...faceOptions, faceRefImage: optimizedFace };

            const total = selectedAngles.length;
            let completed = 0;

            const promises = selectedAngles.map(async (angle) => {
                try {
                    if (signal.aborted) return null;
                    setProgressText(`포즈 생성 중... (${completed + 1}/${total})`);

                    const url = await generatePoseChange(optimizedBase, optimizedRef, basePrompt, resolution, aspectRatio, optimizedFaceOptions, angle, signal);

                    if (!signal.aborted && url) {
                        setResultImages(prev => [...prev, url]);
                    }

                    return url;
                } catch (err: any) {
                    if (signal.aborted || err.message === "작업이 취소되었습니다.") {
                        return null;
                    }
                    console.error(`Generation failed for angle ${angle}`, err);
                    return null;
                } finally {
                    if (!signal.aborted) {
                        completed++;
                        const percent = Math.round((completed / total) * 100);
                        setProgress(percent);
                        setProgressText(`생성 진행 중... ${percent}%`);
                    }
                }
            });

            const results = await Promise.all(promises);
            if (signal.aborted) return;

            const successfulResults = results.filter((url): url is string => url !== null);

            if (successfulResults.length === 0) {
                toast.error("이미지 생성에 실패했거나 취소되었습니다.");
            } else {
                toast.success(`${successfulResults.length}장의 이미지가 생성되었습니다.`);
            }

        } catch (error: any) {
            if (signal.aborted || error.message === "작업이 취소되었습니다.") {
                return;
            }
            const parsed = parseGeminiError(error);
            toast.error(parsed.message);
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
                setProgress(0);
                setProgressText('');
                abortControllerRef.current = null;
            }
        }
    };

    const handleDownloadAll = async () => {
        for (let i = 0; i < resultImages.length; i++) {
            const link = document.createElement('a');
            link.href = resultImages[i];
            link.download = `pose_${i + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    };

    return {
        baseImage, setBaseImage,
        refImage, setRefImage,
        faceRefImage, setFaceRefImage,
        prompt, setPrompt,
        selectedAngles, setSelectedAngles,
        resolution, setResolution,
        aspectRatio, setAspectRatio,
        faceMode, setFaceMode,
        gender, setGender,
        resultImages,
        isLoading,
        progress,
        progressText,
        toggleAngle,
        handleImageUpload,
        handleGenerate,
        handleStop,
        handleDownloadAll,
    };
};
