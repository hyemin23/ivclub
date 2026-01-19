
import { useState } from 'react';
import { MaskArea } from '../services/outfit/outfit.types';
import { generateOutfitSwap, parseGeminiError } from '../services/geminiService';
import { toast } from 'sonner';

export const useOutfitSwap = () => {
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [refImage, setRefImage] = useState<string | null>(null);
    const [maskImage, setMaskImage] = useState<string | null>(null); // New Mask State
    const [maskArea, setMaskArea] = useState<MaskArea>('Top'); // Logical fallback
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [ratio, setRatio] = useState<string>('1:1');
    const [quality, setQuality] = useState<string>('STANDARD');

    const handleImageUpload = (type: 'base' | 'ref', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) {
                toast.error("파일 용량이 너무 큽니다. 20MB 이하의 이미지를 사용해주세요.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'base') {
                    setBaseImage(reader.result as string);
                    setMaskImage(null); // Reset mask on new image
                }
                else setRefImage(reader.result as string);
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!baseImage || !refImage) {
            toast.error("모델 이미지와 의류 이미지를 모두 업로드해주세요.");
            return;
        }

        if (!maskImage) {
            toast.error("교체할 영역(바지 등)을 브러쉬로 칠해주세요.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);

        try {
            // Pass maskImage, ratio, and quality
            const result = await generateOutfitSwap(baseImage, refImage, maskImage, ratio, quality);
            setResultImage(result);
            toast.success("의상 교체가 완료되었습니다.");
        } catch (err: any) {
            const parsed = parseGeminiError(err);
            setError(parsed.message);
            toast.error(parsed.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (resultImage) {
            const link = document.createElement('a');
            link.href = resultImage;
            link.download = `magic_paint_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return {
        baseImage, setBaseImage,
        refImage, setRefImage,
        maskImage, setMaskImage,
        maskArea, setMaskArea,
        ratio, setRatio, // Export Ratio
        quality, setQuality, // Export Quality
        resultImage,
        isLoading,
        error,
        handleImageUpload,
        handleGenerate,
        handleDownload
    };
};
