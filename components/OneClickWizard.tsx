import React, { useState, useRef } from 'react';
import { X, Sparkles, Wand2, Loader2, CheckCircle, Plus } from 'lucide-react';
import html2canvas from 'html2canvas';

// Services
import { generateMarketingCopy, analyzeImageMood, extractProductSpecs } from '../services/geminiService';

// Templates
import { MainBannerTemplate, FeatureGridTemplate, TpoCardTemplate } from './templates/SmartTemplates';
import { IntroSection, SpecInfoSection, VisualSection, DetailGridSection } from './templates/StandardTemplates';

interface OneClickWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onAddBlock: (type: 'NOTICE_TOP' | 'INTRO' | 'PRODUCT' | 'SIZE' | 'NOTICE_BOTTOM' | 'DETAIL', imageUrl: string) => void;
}

type WizardStep = 'INPUT' | 'PROCESSING' | 'RESULT';

export default function OneClickWizard({ isOpen, onClose, onAddBlock }: OneClickWizardProps) {
    const [step, setStep] = useState<WizardStep>('INPUT');
    const [loadingMsg, setLoadingMsg] = useState('');

    // Input State
    const [productName, setProductName] = useState('');
    const [features, setFeatures] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    // Result Data State
    const [marketingData, setMarketingData] = useState<any>(null);
    const [moodData, setMoodData] = useState<any>(null);
    const [specData, setSpecData] = useState<any>(null);
    const [generatedPreviews, setGeneratedPreviews] = useState<any[]>([]);

    // Refs for capture
    const templateRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files).slice(0, 5)); // Increased to 5 files
        }
    };

    const runGenerator = async () => {
        if (!productName || !features || files.length === 0) {
            alert('모든 정보를 입력해주세요.');
            return;
        }

        setStep('PROCESSING');
        try {
            // 1. Text Analysis (Copy)
            setLoadingMsg('AI가 팔리는 카피를 작성 중입니다...');
            const featureList = features.split('\n').filter(f => f.trim());
            const copyResult = await generateMarketingCopy(productName, featureList);
            setMarketingData(copyResult);

            // 2. Spec Extraction (New)
            setLoadingMsg('상세 스펙 정보를 추출하고 있습니다...');
            const specResult = await extractProductSpecs(features);
            setSpecData(specResult);

            // 3. Image Analysis (Analyze the first image for mood)
            setLoadingMsg('AI가 상품 사진의 분위기를 분석 중입니다...');
            const moodResult = await analyzeImageMood(files[0]);
            setMoodData(moodResult);

            // 4. Prepare Previews (Combine Data)
            setLoadingMsg('표준 상세페이지 템플릿을 생성하고 있습니다...');

            const imageUrls = await Promise.all(files.map(f => new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(f);
            })));

            const previews = [
                // Section A: Intro (Standard)
                {
                    id: 'std_intro',
                    type: 'INTRO',
                    template: 'STD_INTRO',
                    imageUrl: imageUrls[0],
                    copy: { main: copyResult.mainCopy.headline, sub: copyResult.mainCopy.subhead },
                    mood: moodResult.mood,
                    color: moodResult.colorHex
                },
                // Section B: Info (Standard Spec Table)
                {
                    id: 'std_info',
                    type: 'PRODUCT', // Mapping generic PRODUCT type to Info Table
                    template: 'STD_INFO',
                    specs: specResult,
                    color: moodResult.colorHex
                },
                // Section C: Visual (Full Width)
                {
                    id: 'std_visual',
                    type: 'DETAIL',
                    template: 'STD_VISUAL',
                    imageUrl: imageUrls[1] || imageUrls[0],
                    copy: { title: "STYLE VISUAL", desc: copyResult.tpoCopy.situation },
                    mood: moodResult.mood,
                    color: moodResult.colorHex
                },
                // Section D: Detail Grid
                {
                    id: 'std_detail',
                    type: 'DETAIL',
                    template: 'STD_DETAIL',
                    imageUrl: imageUrls[2] || imageUrls[0],
                    copy: { title: "DETAIL POINT", desc: copyResult.featureCopy[0]?.description },
                    mood: moodResult.mood,
                    color: moodResult.colorHex
                }
            ];

            setGeneratedPreviews(previews);
            setStep('RESULT');

        } catch (error) {
            console.error(error);
            alert('생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            setStep('INPUT');
        }
    };

    const handleAddBlock = async (preview: any) => {
        console.log("Attempting to add block:", preview.id);
        const element = templateRefs.current[preview.id];
        if (!element) {
            console.error("Template ref not found for:", preview.id);
            return;
        }

        try {
            console.log("Capturing element with html2canvas...");
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: true
            } as any);

            const blobUrl = canvas.toDataURL('image/jpeg', 0.9);
            console.log("Capture success");

            onAddBlock(preview.type, blobUrl);
            alert('블록이 에디터에 추가되었습니다!');
        } catch (err) {
            console.error("Capture failed:", err);
            alert(`블록 캡처 실패: ${err}`);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-[900px] h-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">AI One-Click Creator</h2>
                            <p className="text-xs text-indigo-100 opacity-80">표준 상세페이지 템플릿 (HakShop Style) 생성</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">

                    {/* STEP 1: INPUT */}
                    {step === 'INPUT' && (
                        <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">상품명</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="예: 마약 스판 슬랙스"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>

                            {/* Features */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">상품 스펙 및 특징 (AI가 자동 분석합니다)</label>
                                <textarea
                                    value={features}
                                    onChange={(e) => setFeatures(e.target.value)}
                                    placeholder="예:\n- 색상: 블랙, 네이비\n- 사이즈: S, M, L (정사이즈)\n- 두께감 보통, 신축성 좋음, 비침 없음\n- 구김이 잘 가지 않는 링클프리 소재"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none text-gray-900 leading-relaxed"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">상품 사진 (3장 이상 권장)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors bg-white">
                                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" id="wizard-upload" />
                                    <label htmlFor="wizard-upload" className="cursor-pointer block">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Wand2 className="w-8 h-8" />
                                        </div>
                                        <p className="text-gray-600 font-medium">클릭하여 사진 업로드</p>
                                        <p className="text-xs text-gray-400 mt-1">{files.length > 0 ? `${files.length}개 파일 선택됨` : 'JPG, PNG formats'}</p>
                                    </label>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={runGenerator}
                                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                AI 상세페이지 생성 시작 (표준 템플릿)
                            </button>
                        </div>
                    )}

                    {/* STEP 2: PROCESSING */}
                    {step === 'PROCESSING' && (
                        <div className="h-full flex flex-col items-center justify-center space-y-6">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">{loadingMsg}</h3>
                                <p className="text-gray-500 text-sm">표준 템플릿(인트로, 스펙, 비주얼, 디테일)을 생성하고 있습니다.</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESULTS (PREVIEW & ADD) */}
                    {step === 'RESULT' && (
                        <div className="grid grid-cols-2 gap-8">
                            {generatedPreviews.map((preview, idx) => (
                                <div key={idx} className="space-y-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-600">{preview.template} BLOCK</span>
                                            <button
                                                onClick={() => handleAddBlock(preview)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                                            >
                                                <Plus className="w-3 h-3" />
                                                에디터에 추가
                                            </button>
                                        </div>

                                        {/* Captured Area */}
                                        <div className="border border-gray-100 rounded shadow-inner overflow-hidden flex justify-center bg-gray-50">
                                            <div ref={(el) => { if (el) templateRefs.current[preview.id] = el; }} className="transform scale-[0.5] origin-top h-[600px] w-[640px]">

                                                {/* ---- NEW STANDARD TEMPLATES ---- */}
                                                {preview.template === 'STD_INTRO' && (
                                                    <IntroSection
                                                        id={`tpl_${preview.id}`}
                                                        imageUrl={preview.imageUrl}
                                                        copy={preview.copy}
                                                        colorHex={preview.color}
                                                    />
                                                )}
                                                {preview.template === 'STD_INFO' && (
                                                    <SpecInfoSection
                                                        id={`tpl_${preview.id}`}
                                                        specs={preview.specs}
                                                    />
                                                )}
                                                {preview.template === 'STD_VISUAL' && (
                                                    <VisualSection
                                                        id={`tpl_${preview.id}`}
                                                        imageUrl={preview.imageUrl}
                                                        copy={preview.copy}
                                                    />
                                                )}
                                                {preview.template === 'STD_DETAIL' && (
                                                    <DetailGridSection
                                                        id={`tpl_${preview.id}`}
                                                        imageUrl={preview.imageUrl}
                                                        copy={preview.copy}
                                                    />
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="col-span-2 text-center pt-8 pb-4">
                                <button onClick={onClose} className="text-gray-400 underline hover:text-gray-600 text-sm">
                                    닫기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
