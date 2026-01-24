"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Upload, Zap, Download, Layers, CheckCircle2, AlertCircle, Loader2, Play, RotateCcw, X, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BatchColorVariant, BatchPose, BatchMatrixItem, BatchProductCategory, BatchResolution } from '../types';
import { generateBatchItem, MOCK_COLORS, ALL_POSES, BATCH_BACKGROUNDS, getPosesForCategory } from '../services/batchService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const POSE_LABELS: Record<string, string> = {
    'FRONT_FULL': '정면 (전신)',
    'SIDE_LEFT': '측면 (좌측)',
    'SIDE_RIGHT': '측면 (우측)',
    'WALKING': '워킹 (동적)',
    'HAND_GESTURE': '손 연출 (디테일)',
    'CROP_TEXTURE': '텍스처 상세',
    'CROP_COLLAR': '넥라인/카라 컷',
    'CROP_POCKET': '포켓 상세'
};

const THEME_LABELS: Record<string, string> = {
    'INSTA_CAFE': '인스타 감성 카페',
    'CLEAN_STUDIO': '클린 스튜디오',
    'URBAN_STREET': '도심 스트릿',
    'LUXURY_HOTEL': '럭셔리 호텔'
};

const CATEGORY_LABELS: Record<string, string> = {
    'TOP': '상의',
    'BOTTOM': '하의',
    'ONEPIECE': '원피스'
};

const Step2BatchStudio: React.FC = () => {
    const [masterImage, setMasterImage] = useState<string | null>(null);
    const [selectedColors, setSelectedColors] = useState<BatchColorVariant[]>([{ id: 'c1', name: '오리지널', hex: '#ffffff' }]); // Fixed to Original only
    const [matrix, setMatrix] = useState<BatchMatrixItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [safetyMode, setSafetyMode] = useState(true);
    const [backgroundTheme, setBackgroundTheme] = useState<keyof typeof BATCH_BACKGROUNDS>('INSTA_CAFE');
    const [productCategory, setProductCategory] = useState<BatchProductCategory>('TOP');
    const [vibeImage, setVibeImage] = useState<string | null>(null); // Legacy Single (Can serve as "Primary")
    const [resolution, setResolution] = useState<BatchResolution>('1K'); // Restored missing state
    const [vibeImages, setVibeImages] = useState<string[]>([]); // ✨ Multi-Reference
    const [synthesizedVibe, setSynthesizedVibe] = useState<string>(""); // Result Prompt
    const [userPrompt, setUserPrompt] = useState<string>(""); // 🆕 사용자 정의 추가 프롬프트
    const [isSynthesizing, setIsSynthesizing] = useState(false); // Loading State
    const [currentModel, setCurrentModel] = useState<string>('대기중'); // 🆕 현재 사용 중인 모델 추적
    const abortControllerRef = useRef<AbortController | null>(null);

    // Feature Audit State
    const [auditFeatures, setAuditFeatures] = useState<string>("");
    const [isAuditing, setIsAuditing] = useState(false);

    // Run Audit
    const runAudit = async (img: string) => {
        setIsAuditing(true);
        try {
            const { auditProductFeatures } = await import('../services/batchService');
            const result = await auditProductFeatures(img);
            setAuditFeatures(result);
            if (result) toast.success("상품 특징 분석 완료! 🕵️‍♂️");
        } catch (e) {
            console.error(e);
        } finally {
            setIsAuditing(false);
        }
    };

    const [previewItem, setPreviewItem] = useState<BatchMatrixItem | null>(null);

    // Reset Logic
    const handleReset = () => {
        setMatrix([]);
        toast.info("대기열이 초기화되었습니다");
    };

    // Keyboard Event Listener (ESC to Close)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPreviewItem(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Batch Generation Logic (Accumulative)
    const handleGenerateAll = async () => {
        if (!masterImage) return;

        // 1. Prepare New Items (Append to Matrix)
        // We only add items that don't exist yet for the current config (Color + Pose + Theme + Resolution)
        // Actually, user wants "Accumulate", so we force add new items for the selected colors with CURRENT settings.

        const activePoses = getPosesForCategory(productCategory);
        const newItems: BatchMatrixItem[] = [];

        selectedColors.forEach(color => {
            activePoses.forEach(pose => {
                // Unique ID includes config to allow accumulation
                const timestamp = Date.now();
                const uniqueId = `${color.id}-${pose}-${backgroundTheme}-${resolution}-${timestamp}`;

                newItems.push({
                    id: uniqueId,
                    colorId: color.id,
                    pose,
                    status: 'pending',
                    backgroundTheme, // Snapshot
                    resolution       // Snapshot
                });
            });
        });

        // Update Matrix with NEW items
        const currentMatrix = [...matrix, ...newItems];
        setMatrix(currentMatrix);

        setIsGenerating(true);
        abortControllerRef.current = new AbortController();

        // Process PENDING items 
        // (We process ALL pending items in the matrix, including ones we just added)
        const itemsToProcess = currentMatrix.filter(m => m.status === 'pending' || m.status === 'failed');

        const updateStatus = (id: string, status: BatchMatrixItem['status'], url?: string, error?: string) => {
            setMatrix(prev => prev.map(item =>
                item.id === id ? { ...item, status, imageUrl: url, error } : item
            ));
        };

        // Concurrency - 동시 처리 개수 (4개로 증가하여 속도 개선)
        const CONCURRENCY = 4;

        try {
            for (let i = 0; i < itemsToProcess.length; i += CONCURRENCY) {
                if (abortControllerRef.current.signal.aborted) break;

                const chunk = itemsToProcess.slice(i, i + CONCURRENCY);

                await Promise.all(chunk.map(async (item) => {
                    updateStatus(item.id, 'generating');
                    try {
                        const color = MOCK_COLORS.find(c => c.id === item.colorId) || selectedColors.find(c => c.id === item.colorId)!;
                        const res = item.resolution || resolution;

                        // Fix: Define theme
                        const theme = (item.backgroundTheme as keyof typeof BATCH_BACKGROUNDS) || backgroundTheme;

                        // Pass vibeImage (legacy) or synthesizedVibe
                        // If we have synthesizedVibe, we pass it.
                        // If we have single vibeImage (legacy), we pass it as before.

                        const result = await generateBatchItem(
                            masterImage!,
                            item.pose,
                            color,
                            safetyMode,
                            theme,
                            vibeImage, // Still pass single image as fallback/compat
                            res,
                            auditFeatures,
                            synthesizedVibe, // ✨ Pass the synthesized prompt
                            userPrompt // 🆕 Pass user custom prompt
                        );

                        // 🆕 모델 이름 실시간 업데이트
                        setCurrentModel(result.usedModel);
                        updateStatus(item.id, 'success', result.imageUrl);
                    } catch (err: any) {
                        console.error(`Batch Item Failed (${item.id}):`, err);
                        updateStatus(item.id, 'failed', undefined, err.message);
                    }
                }));
            }
            toast.success("배치 작업 완료! 🏭");
        } catch (e) {
            console.error("Batch Error:", e);
            toast.error("배치 작업이 중단되었습니다.");
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    // Upload Logic for Master Image
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                setMasterImage(res);
                runAudit(res); // Auto-run audit on upload
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload Logic for Vibe Image
    const handleVibeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setVibeImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload Logic for Color Reference Image
    const handleColorImageUpload = (colorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setSelectedColors(prev => prev.map(c =>
                    c.id === colorId ? { ...c, baseImage: base64 } : c
                ));
            };
            reader.readAsDataURL(file);
        }
    };



    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            toast.info("배치 처리가 중단되었습니다.");
            setIsGenerating(false);
        }
    };

    // Download Logic
    const handleDownloadAll = async () => {
        const completedItems = matrix.filter(m => m.status === 'success' && m.imageUrl);
        if (completedItems.length === 0) return;

        const zip = new JSZip();
        completedItems.forEach(item => {
            const colorName = selectedColors.find(c => c.id === item.colorId)?.name || 'Color';
            const filename = `[${colorName}]_${item.pose}.png`;
            const base64 = item.imageUrl!.split(',')[1];
            zip.file(filename, base64, { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `Lookbook_Batch_${Date.now()}.zip`);
    };

    // Single Item Generation (Preview)
    const handleGenerateSingle = async (item: BatchMatrixItem) => {
        if (!masterImage || isGenerating) return;

        // Update status to generating
        setMatrix(prev => prev.map(m => m.id === item.id ? { ...m, status: 'generating', error: undefined } : m));

        try {
            const color = selectedColors.find(c => c.id === item.colorId)!;
            const result = await generateBatchItem(
                masterImage,
                item.pose,
                color,
                safetyMode,
                backgroundTheme, // Use state directly
                vibeImage,
                resolution,  // Use state directly 
                auditFeatures,
                synthesizedVibe,
                userPrompt
            );

            // 🆕 모델 이름 실시간 업데이트
            setCurrentModel(result.usedModel);
            setMatrix(prev => prev.map(m => m.id === item.id ? { ...m, status: 'success', imageUrl: result.imageUrl } : m));
            toast.success(`생성 완료: ${color.name} - ${POSE_LABELS[item.pose] || item.pose}`);
        } catch (err: any) {
            console.error(`Single Gen Failed (${item.id}):`, err);
            setMatrix(prev => prev.map(m => m.id === item.id ? { ...m, status: 'failed', error: err.message } : m));
            toast.error(`실패: ${err.message}`);
        }
    };

    // --- Render Helpers ---
    const renderCell = (color: BatchColorVariant, pose: BatchPose) => {
        const item = matrix.find(m => m.colorId === color.id && m.pose === pose);

        // Auto-create item object if not in matrix yet (for initial render before full init)
        const currentItem = item || {
            id: `${color.id}-${pose}`,
            colorId: color.id,
            pose,
            status: 'pending' as const
        };

        const isPending = currentItem.status === 'pending';
        const isGeneratingItem = currentItem.status === 'generating';
        const isFailed = currentItem.status === 'failed';
        const isSuccess = currentItem.status === 'success';

        return (
            <div
                className="w-full aspect-[3/4] relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50 cursor-pointer"
                onClick={() => isSuccess && currentItem.imageUrl && setPreviewItem(currentItem)}
            >

                {/* Image Layer */}
                {isSuccess && currentItem.imageUrl ? (
                    <img src={currentItem.imageUrl} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-30 text-slate-500">
                        <span className="text-[9px] font-mono">{POSE_LABELS[pose] || pose}</span>
                    </div>
                )}

                {/* Loading Overlay */}
                {isGeneratingItem && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center gap-2 animate-pulse">
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        <span className="text-[9px] font-bold text-indigo-400">생성중...</span>
                    </div>
                )}

                {/* Hover Actions / Pending State */}
                {!isGeneratingItem && (
                    <div
                        className={`absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 z-20 ${isPending ? 'group-hover:bg-black/40' : 'bg-black/60'} cursor-zoom-in`}
                        onClick={() => isSuccess && currentItem.imageUrl && setPreviewItem(currentItem)}
                    >

                        {/* Buttons Container - Stop Propagation here */}
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Download Button (Only if success) */}
                            {isSuccess && (
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = currentItem.imageUrl!;
                                        link.download = `[${color.name}]_${POSE_LABELS[pose] || pose}.png`;
                                        link.click();
                                    }}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-green-500 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Error Message */}
                        {isFailed && (
                            <div className="text-center px-1">
                                <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                                <span className="text-[8px] text-red-300 block leading-tight">{currentItem.error?.slice(0, 30)}...</span>
                                <button
                                    onClick={() => handleGenerateSingle(currentItem)}
                                    className="mt-2 px-2 py-1 bg-red-500/80 hover:bg-red-500 rounded text-[9px] text-white font-bold"
                                >
                                    재시도
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[8px] text-white font-mono z-20 pointer-events-none">
                    {POSE_LABELS[pose] || pose}
                </div>
            </div>
        );
    };

    const activePoses = getPosesForCategory(productCategory);
    // Combined poses for vertical grid flow
    const allActivePoses = activePoses;

    return (
        <div className="max-w-[1700px] mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Layers className="w-8 h-8 text-indigo-500" />
                        Batch Studio <span className="text-slate-600 text-lg font-medium">| 룩북 팩토리</span>
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">
                        마스터 샷 하나로 20개 이상의 다양한 컬러/포즈 변형을 자동 생성합니다.
                    </p>
                </div>
                <div className="flex gap-3">
                    {matrix.length > 0 && (
                        <button onClick={handleReset} className="px-4 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl flex items-center gap-2 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                            <RotateCcw className="w-4 h-4" /> 대기열 초기화
                        </button>
                    )}
                    {matrix.length > 0 && matrix.some(m => m.status === 'success') && (
                        <button onClick={handleDownloadAll} className="px-6 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-slate-200 transition-colors">
                            <Download className="w-4 h-4" /> 전체 다운로드 (ZIP)
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-8 items-start h-[calc(100vh-200px)]">
                {/* Left: Configuration - Sticky */}
                <div className="w-[340px] shrink-0 space-y-6 overflow-y-auto h-full pr-2 custom-scrollbar">

                    {/* Master Upload */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">1. 마스터 샷 (원본)</label>
                            <div className="flex items-center gap-2">
                                {/* Category Selector */}
                                <div className="flex p-0.5 bg-slate-800 rounded-lg">
                                    {(['TOP', 'BOTTOM', 'ONEPIECE'] as const).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setProductCategory(cat)}
                                            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${productCategory === cat ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {CATEGORY_LABELS[cat] || cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => document.getElementById('batch-master-upload')?.click()}
                            className={`aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${masterImage ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-900'}`}
                        >
                            {masterImage ? (
                                <div className="relative w-full h-full group">
                                    <img src={masterImage} className={`w-full h-full object-contain ${safetyMode ? 'blur-sm grayscale opacity-50' : ''}`} />
                                    {safetyMode && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                            <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                                            <span className="text-xs font-bold text-white">IP 안심 모드<br />얼굴 자동 크롭됨</span>
                                        </div>
                                    )}
                                    {/* Audit Badge */}
                                    {!safetyMode && auditFeatures && (
                                        <div className="absolute top-2 left-2 right-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                                <span className="text-[9px] font-bold text-green-400 uppercase">특징 분석됨</span>
                                            </div>
                                            <p className="text-[9px] text-white leading-tight line-clamp-2">{auditFeatures}</p>
                                        </div>
                                    )}
                                    {isAuditing && (
                                        <div className="absolute top-2 right-2">
                                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center p-6 opacity-50">
                                    <Upload className="w-10 h-10 mx-auto mb-4 text-slate-400" />
                                    <p className="text-xs font-bold text-slate-300">마스터 이미지 업로드</p>
                                    <p className="text-[10px] text-slate-500 mt-2">얼굴 자동 크롭 지원</p>
                                </div>
                            )}
                            <input id="batch-master-upload" type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                        </div>

                        {/* Safety Toggle (Moved below) */}
                        <div className="flex items-center justify-end gap-2 mt-2">
                            <span className="text-[9px] font-bold text-slate-500">안심 모드 (SAFE MODE)</span>
                            <button
                                onClick={() => setSafetyMode(!safetyMode)}
                                className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${safetyMode ? 'bg-indigo-500' : 'bg-slate-700'}`}
                            >
                                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${safetyMode ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Background Theme Selector */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">2. 배경 테마</label>

                        {/* Vibe Image Upload Area (Only if Vibe Image is active) */}
                        {vibeImage && (
                            <div className="relative w-full h-24 rounded-xl overflow-hidden border border-indigo-500 mb-2 group">
                                <img src={vibeImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">커스텀 분위기 적용됨</span>
                                </div>
                                <button
                                    onClick={() => setVibeImage(null)} // Clear vibe
                                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(BATCH_BACKGROUNDS) as Array<keyof typeof BATCH_BACKGROUNDS>).map(theme => (
                                <button
                                    key={theme}
                                    onClick={() => {
                                        setBackgroundTheme(theme);
                                        setVibeImage(null); // Clear custom vibe when theme selected
                                    }}
                                    className={`p-3 rounded-xl border text-left transition-all ${backgroundTheme === theme && !vibeImage
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-70">테마</div>
                                    <div className="text-xs font-bold">{THEME_LABELS[theme] || theme}</div>
                                </button>
                            ))}

                            {/* Custom Vibe Button */}
                            <button
                                onClick={() => document.getElementById('vibe-upload')?.click()}
                                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${vibeImage
                                    ? 'bg-indigo-900/50 border-indigo-400 text-indigo-200'
                                    : 'bg-slate-900 border-dashed border-slate-700 text-slate-500 hover:border-indigo-500 hover:text-indigo-400'
                                    }`}
                            >
                                <div className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-70">커스텀</div>
                                <div className="text-xs font-bold flex items-center gap-1">
                                    <Upload className="w-3 h-3" /> 분위기 업로드
                                </div>
                                <input id="vibe-upload" type="file" className="hidden" accept="image/*" onChange={handleVibeUpload} />
                            </button>
                        </div>
                    </div>

                    {/* 🆕 사용자 추가 요구사항 (Custom Prompt) */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            추가 요청사항 (Optional)
                        </h3>
                        <div className="space-y-2">
                            <textarea
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                placeholder="예: 상의 색상을 네이비로 변경해줘. / 배경을 조금 더 어둡게 해줘."
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 min-h-[80px]"
                            />
                            <p className="text-[10px] text-gray-500">* AI에게 전달될 추가 지시사항을 자유롭게 입력하세요.</p>
                        </div>
                    </div>

                    {/* 2. Color Selection (Removed/Locked) */}
                    {/* Resolution Selector */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">3. 해상도 (Resolution)</label>
                        <div className="flex p-0.5 bg-slate-800 rounded-lg">
                            {(['1K', '2K', '4K'] as const).map(res => (
                                <button
                                    key={res}
                                    onClick={() => setResolution(res)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${resolution === res ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {res}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Config REMOVED */}


                    {/* Action */}
                    <button
                        onClick={isGenerating ? handleStop : handleGenerateAll}
                        disabled={!masterImage}
                        className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all ${isGenerating
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> 작업 중단 (STOP)
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5 fill-white" /> {matrix.length > 0 ? '추가 및 생성 시작' : '배치 작업 시작'}
                            </>
                        )}
                    </button>

                    {/* Model Indicator - 실시간 모델 표시 */}
                    <div className="text-center text-[10px] text-slate-500 mt-2 space-y-0.5">
                        <div className="flex items-center justify-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
                            <span>Model: <span className={`font-bold ${isGenerating ? 'text-yellow-400' : 'text-indigo-400'}`}>{currentModel}</span></span>
                        </div>
                        <div className="text-slate-600">동시 생성: 4개 | {isGenerating ? '작업중...' : '대기중'}</div>
                    </div>

                </div>

                {/* Right: Matrix Board (Vertical Scroll & Responsive Grid) */}
                <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-[2rem] p-8 h-full overflow-y-auto custom-scrollbar">
                    {selectedColors.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                            <Layers className="w-16 h-16 mb-4" />
                            <p>컬러를 선택하여 매트릭스를 생성하세요</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {selectedColors.map(color => (
                                <div key={color.id} className="space-y-6">
                                    {/* Color Header */}
                                    <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md py-3 flex items-center gap-4 border-b border-slate-800">
                                        <div className="relative w-10 h-10 rounded-full border border-slate-600 overflow-hidden shadow-lg">
                                            {color.baseImage ? (
                                                <img src={color.baseImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full" style={{ backgroundColor: color.hex }} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{color.name} 시리즈</h3>
                                            {color.baseImage && <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950/50 px-2 py-0.5 rounded-full">이미지 복제 활성화됨</span>}
                                        </div>
                                    </div>

                                    {/* Responsive Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {allActivePoses.map(pose => (
                                            <div key={pose}>
                                                {renderCell(color, pose)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Lightbox / Preview Modal */}
            {previewItem && previewItem.imageUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setPreviewItem(null)}>

                    <button
                        onClick={() => setPreviewItem(null)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
                        <img
                            src={previewItem.imageUrl!}
                            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-slate-700 object-contain"
                            alt="Preview"
                        />

                        <div className="flex items-center gap-4">
                            <span className="text-white font-mono text-sm bg-black/50 px-4 py-2 rounded-full border border-white/10">
                                {selectedColors.find(c => c.id === previewItem.colorId)?.name} — {POSE_LABELS[previewItem.pose] || previewItem.pose}
                            </span>

                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = previewItem.imageUrl!;
                                    const cName = selectedColors.find(c => c.id === previewItem.colorId)?.name || 'Color';
                                    link.download = `[${cName}]_${previewItem.pose}.png`;
                                    link.click();
                                }}
                                className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Download Original
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Step2BatchStudio;
