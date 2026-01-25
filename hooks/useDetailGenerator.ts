import { useState, useCallback, useEffect } from 'react';
import { Resolution, AspectRatio } from '../types';
import { STYLE_PRESETS } from '../services/detail/detail.constants';
import { renderHighEndBlock } from '../services/detail/detail.fabric';
import { generateDetailExtra, extractFabricUSPs, analyzeFabric, generateIconSpecs, generateDynamicCopy } from '../services/geminiService';
import { renderSpecToSvg } from '../services/dsig/dsig.renderer';
import { getIconRuleSet } from '../services/detail/detail.rules'; // Fallback

export const useDetailGenerator = () => {
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [refImage, setRefImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState(STYLE_PRESETS[0].prompt);
    const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0].id);
    const [resolution, setResolution] = useState<Resolution>('2K');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imageCount, setImageCount] = useState<number>(1);
    const [resultImages, setResultImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [fabricText, setFabricText] = useState('');
    const [uspKeywords, setUspKeywords] = useState('');

    const handleStyleSelect = (styleId: string) => {
        setSelectedStyle(styleId);
        const preset = STYLE_PRESETS.find(s => s.id === styleId);
        if (preset) {
            setPrompt(preset.prompt);
        }
    };

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

    const handleImageUpload = (type: 'base' | 'ref', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) {
                alert("파일 용량이 너무 큽니다. 20MB 이하의 이미지를 사용해주세요.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'base') setBaseImage(reader.result as string);
                else setRefImage(reader.result as string);
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!baseImage) return;
        setIsLoading(true);
        setResultImages([]);

        try {
            if (selectedStyle === 'rose-cut') {
                const aiGeneratedUrl = await generateDetailExtra(
                    baseImage,
                    refImage,
                    prompt,
                    '1024x1024' as Resolution,
                    '1:1',
                    { imageStrength: 0.25 }
                );

                // [Phase 3] DSIG v2.0 Pipeline
                let finalUspData = [];
                try {
                    // 1. Vision Analysis
                    const analysis = await analyzeFabric(baseImage);

                    // 2. Determine Intents (Top 4 keywords)
                    const intents = [...analysis.material, ...analysis.features, ...analysis.quality].slice(0, 4);
                    if (intents.length === 0) intents.push("Quality", "Material", "Fit", "Detail"); // Fallback intents

                    // 3. Generate Icon Specs & Copy in Parallel
                    const [specs, copyData] = await Promise.all([
                        generateIconSpecs(intents, ["minimalist", "thin-stroke", "round-cap"]),
                        generateDynamicCopy(analysis, intents, Date.now())
                    ]);

                    // 4. Merge & Render
                    finalUspData = specs.map((spec, idx) => {
                        const copy = copyData[idx] || { title: intents[idx] || "Detail", desc: "Premium Quality" };
                        const svgString = renderSpecToSvg(spec);
                        const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
                        return {
                            icon: svgDataUri,
                            title: copy.title,
                            desc: copy.desc
                        };
                    });

                } catch (e) {
                    console.error("DSIG Pipeline failed, attempting legacy fallback", e);
                    try {
                        finalUspData = await extractFabricUSPs(baseImage);
                    } catch (err2) {
                        console.error("Legacy fallback failed", err2);
                        finalUspData = getIconRuleSet(uspKeywords);
                    }
                }

                // Final Fallback
                if (!finalUspData || finalUspData.length === 0) {
                    finalUspData = getIconRuleSet(uspKeywords);
                }

                const finalUrl = await renderHighEndBlock(aiGeneratedUrl, finalUspData, fabricText || "COTTON 100%");
                setResultImages([finalUrl]);
            } else {
                const promises = Array.from({ length: imageCount }, () =>
                    generateDetailExtra(baseImage, refImage, prompt, resolution, aspectRatio)
                );

                const results = await Promise.allSettled(promises);
                const successfulImages = results
                    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
                    .map(r => r.value);

                setResultImages(successfulImages);

                if (successfulImages.length === 0) {
                    throw new Error("모든 이미지 생성에 실패했습니다.");
                }
            }
        } catch (error) {
            console.error(error);
            alert("이미지 생성 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadAll = async () => {
        for (let i = 0; i < resultImages.length; i++) {
            const link = document.createElement('a');
            link.href = resultImages[i];
            link.download = `detail_${i + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    };

    return {
        baseImage, setBaseImage,
        refImage, setRefImage,
        prompt, setPrompt,
        selectedStyle, setSelectedStyle,
        resolution, setResolution,
        aspectRatio, setAspectRatio,
        imageCount, setImageCount,
        resultImages, setResultImages,
        isLoading, setIsLoading,
        selectedImage, setSelectedImage,
        fabricText, setFabricText,
        uspKeywords, setUspKeywords,
        handleImageUpload,
        handleStyleSelect,
        handleGenerate,
        handleDownloadAll
    };
};
