
import { useState, useCallback, useEffect } from 'react';
import { generateFittingVariation, parseGeminiError } from '../services/geminiService';
import { Resolution, AspectRatio, ViewMode, FaceMode, Gender, CameraAngle } from '../types';
import { VariationResult } from '../services/fitting/fitting.types';

export const useFittingVariation = () => {
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [refImage, setRefImage] = useState<string | null>(null);
    const [faceRefImage, setFaceRefImage] = useState<string | null>(null);

    const [prompt, setPrompt] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('full');
    const [cameraAngle, setCameraAngle] = useState<CameraAngle>('default');
    const [resolution, setResolution] = useState<Resolution>('2K');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imageCount, setImageCount] = useState<number>(1);

    const [faceMode, setFaceMode] = useState<FaceMode>('OFF');
    const [gender, setGender] = useState<Gender>('Female');

    const [results, setResults] = useState<VariationResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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
            if (file.size > 20 * 1024 * 1024) {
                alert("파일 용량이 너무 큽니다. 20MB 이하의 이미지를 사용해주세요.");
                return;
            }
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

    const generateSingleResult = async (id: string) => {
        try {
            const faceOptions = { faceMode, gender, faceRefImage };
            const url = await generateFittingVariation(baseImage!, refImage, prompt, viewMode, resolution, aspectRatio, faceOptions, cameraAngle);
            setResults(prev => prev.map(r => r.id === id ? { ...r, url, status: 'success' } : r));
        } catch (error) {
            const parsed = parseGeminiError(error);
            setResults(prev => prev.map(r => r.id === id ? {
                ...r,
                status: 'error',
                errorType: parsed.type,
                errorMessage: parsed.message
            } : r));
        }
    };

    const handleGenerate = async () => {
        if (!baseImage) return;
        setIsLoading(true);

        const newResults: VariationResult[] = Array.from({ length: imageCount }).map((_, i) => ({
            id: `${Date.now()}-${i}`,
            url: '',
            status: 'loading'
        }));

        setResults(newResults);

        for (const res of newResults) {
            await generateSingleResult(res.id);
        }

        setIsLoading(false);
    };

    const handleRetry = async (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, status: 'loading', errorMessage: undefined } : r));
        await generateSingleResult(id);
    };

    const handleDownloadAll = async () => {
        const successResults = results.filter(r => r.status === 'success');
        for (let i = 0; i < successResults.length; i++) {
            const link = document.createElement('a');
            link.href = successResults[i].url;
            link.download = `variation_${i + 1}.png`;
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
        viewMode, setViewMode,
        cameraAngle, setCameraAngle,
        resolution, setResolution,
        aspectRatio, setAspectRatio,
        imageCount, setImageCount,
        faceMode, setFaceMode,
        gender, setGender,
        results,
        isLoading,
        handleImageUpload,
        handleGenerate,
        handleRetry,
        handleDownloadAll,
    };
};
