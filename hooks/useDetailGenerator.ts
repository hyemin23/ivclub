import { useState, useCallback, useEffect } from 'react';
import { Resolution, AspectRatio } from '../types';
import { STYLE_PRESETS } from '../services/detail/detail.constants';
import { renderHighEndBlock } from '../services/detail/detail.fabric';
import { generateDetailExtra, extractFabricUSPs, analyzeFabric, generateIconSpecs, generateDynamicCopy } from '../services/geminiService';
import { renderSpecToSvg } from '../services/dsig/dsig.renderer';
import { getIconRuleSet } from '../services/detail/detail.rules'; // Fallback

export const useDetailGenerator = () => {
    const [baseImages, setBaseImages] = useState<string[]>([]);
    const [baseImage, setBaseImage] = useState<string | null>(null); // Main/First Image for Preview
    const [refImages, setRefImages] = useState<string[]>([]); // Changed to Array
    const [refImage, setRefImage] = useState<string | null>(null); // Main/First for Preview
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

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeImage = async (imageInput: string) => {
        if (!imageInput) return;
        setIsAnalyzing(true);
        try {
            console.log("Starting Fabric Analysis...");
            const analysis = await analyzeFabric(imageInput);

            // 1. Auto-fill Fabric Text
            if (analysis.material && analysis.material.length > 0) {
                // Formatting: "Cotton 100%" style if possible, but Gemini returns keywords.
                // We'll join them comfortably.
                setFabricText(analysis.material.join(', '));
            }

            // 2. Auto-fill USP Keywords
            const keywords = [
                ...(analysis.features || []),
                ...(analysis.quality || [])
            ];
            // Filter duplicates and empty strings
            const uniqueKeywords = Array.from(new Set(keywords)).filter(Boolean);

            if (uniqueKeywords.length > 0) {
                setUspKeywords(uniqueKeywords.slice(0, 5).join(', '));
            }

        } catch (e) {
            console.error("Auto Analysis Failed:", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

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
                        if (!baseImage) {
                            setBaseImage(result);
                            setBaseImages([result]);
                            analyzeImage(result);
                        }
                        else if (refImages.length === 0) {
                            setRefImage(result);
                            setRefImages([result]);
                        }
                        else {
                            setBaseImage(result);
                            setBaseImages([result]);
                            analyzeImage(result);
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    }, [baseImage, refImage, refImages]); // Updated Dep

    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    const handleImageUpload = (type: 'base' | 'ref', e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (type === 'base') {
            // Batch Upload Logic
            const readers = files.map(file => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readers).then(results => {
                setBaseImages(results);
                setBaseImage(results[0]); // Set first as main
                analyzeImage(results[0]); // Trigger Analysis
                e.target.value = '';
            });
        } else {
            // Ref Image (Batch)
            const readers = files.map(file => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readers).then(results => {
                setRefImages(results);
                setRefImage(results[0]);
                e.target.value = '';
            });
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
                    refImages.length > 0 ? refImages : null, // Pass Array
                    prompt,
                    '1024x1024' as Resolution,
                    '1:1',
                    { imageStrength: 0.25 }
                );

                // [Phase 3] DSIG v2.0 Pipeline
                let finalUspData = [];
                try {
                    // 1. Vision Analysis
                    // If we already have auto-filled text, use it? 
                    // Or re-analyze? 
                    // Current logic: analyzeFabric again inside render pipeline.
                    // Optimizations: We could reuse valid inputs if present.
                    // For now, let's keep the pipeline robust by re-analyzing or using inputs.

                    // Actually, if user modified the Inputs, we should use them!
                    // But generateIconSpecs needs "intents".
                    // Let's rely on standard pipeline for now, or improve it later.
                    // Standard pipeline:

                    const analysis = await analyzeFabric(baseImage);

                    // 2. Determine Intents (Top 4 keywords)
                    // If user provided Keywords, use them as intents!
                    let intents: string[] = [];
                    if (uspKeywords && uspKeywords.trim().length > 0) {
                        intents = uspKeywords.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
                    } else {
                        intents = [...analysis.material, ...analysis.features, ...analysis.quality].slice(0, 4);
                    }

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

                const finalUrl = await renderHighEndBlock(aiGeneratedUrl, finalUspData, fabricText);
                setResultImages([finalUrl]);
            } else {
                // Batch Generation Logic
                // If multiple base images exist, generate for EACH base image.
                // If only 1 base image, generate 'imageCount' variations of it.

                let promises: Promise<string>[];

                if (baseImages.length > 1) {
                    // Batch Mode: 1 Result per Base Image
                    // Stagger usage to prevent rate limiting
                    promises = baseImages.map(async (img, idx) => {
                        console.log(`[Batch] Starting image ${idx + 1}/${baseImages.length}`);
                        await new Promise(resolve => setTimeout(resolve, idx * 1000)); // 1s delay
                        return generateDetailExtra(
                            img,
                            refImages.length > 0 ? refImages : null,
                            prompt,
                            resolution,
                            aspectRatio
                        );
                    });
                } else {
                    // Single Mode: N Results for 1 Base Image
                    promises = Array.from({ length: imageCount }, () =>
                        generateDetailExtra(
                            baseImage!,
                            refImages.length > 0 ? refImages : null,
                            prompt,
                            resolution,
                            aspectRatio
                        )
                    );
                }

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
        baseImages, setBaseImages,
        refImage, setRefImage,
        refImages, setRefImages, // New Export
        prompt, setPrompt,
        selectedStyle, setSelectedStyle,
        resolution, setResolution,
        aspectRatio, setAspectRatio,
        imageCount, setImageCount,
        resultImages, setResultImages,
        isLoading, setIsLoading,
        isAnalyzing, // NEW
        selectedImage, setSelectedImage,
        fabricText, setFabricText,
        uspKeywords, setUspKeywords,
        handleImageUpload,
        handleStyleSelect,
        handleGenerate,
        handleDownloadAll
    };
};
