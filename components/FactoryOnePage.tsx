"use client";

import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import {
    Upload, Sparkles, RefreshCw, FileCode, FileDown,
    Layout, Type, Image as ImageIcon, Shirt, Globe,
    Loader2, Maximize2, X, Menu, Trash2, ArrowUp, ArrowDown, Plus
} from 'lucide-react';
import SizeGuideSystem from './SizeGuideSystem';
import BrandAssetManager from './BrandAssetManager';
import DownloadableSection from './DownloadableSection';
import { ConfirmModal } from './ConfirmModal';

import { LayerManager } from './LayerManager';

import { SortableLookbookItem } from './SortableLookbookItem';
import ExportableContent from './ExportableContent'; // Added
import {
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
    analyzeProduct,
    planDetailSections,
    generateFactoryPose,
    FACTORY_POSES
} from '../services/geminiService';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const FactoryOnePage: React.FC = () => {
    const store = useStore();
    const exportRef = useRef<HTMLDivElement>(null);

    // Local state for sidebar inputs (mirroring store for immediate editing)
    const [activeTab, setActiveTab] = useState<'content' | 'design' | 'export'>('content');
    const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor'); // New mobile view state
    const [isGeneraring, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [htmlCopied, setHtmlCopied] = useState(false);
    
    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'alert' as 'confirm' | 'alert',
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: false
    });

    const showAlert = (title: string, message: string) => {
        setModal({ ...modal, isOpen: true, type: 'alert', title, message, onConfirm: () => {}, isDestructive: false });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
        setModal({ ...modal, isOpen: true, type: 'confirm', title, message, onConfirm, isDestructive });
    };

    // --- DnD Logic ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over) {
            const oldIndex = store.lookbookImages.findIndex((item) => item.id === active.id);
            const newIndex = store.lookbookImages.findIndex((item) => item.id === over.id);
            store.reorderLookbookImages(oldIndex, newIndex);
        }
    };

    // --- Handlers ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'sketch') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!file.type.startsWith('image/') && !validExtensions.includes(ext)) {
            alert('이미지 파일(JPG, PNG, WEBP, GIF)만 업로드 가능합니다.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result as string;
            if (type === 'main') store.setProductInfo({ mainImageUrl: url });
            if (type === 'sketch') store.setProductInfo({ techSketchUrl: url });
        };
        reader.readAsDataURL(file);
    };

    const handleMultiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        let count = 0;
        Array.from(files).forEach(file => {
             const reader = new FileReader();
             reader.onload = (e) => {
                 const url = e.target?.result as string;
                 store.addLookbookImage({
                     id: uuidv4(),
                     url,
                     pose: 'uploaded',
                     isGenerating: false
                 });
                 count++;
                 if (count === files.length) {
                     showAlert("업로드 완료", `${files.length}장의 이미지가 프리뷰에 추가되었습니다.\n아래 리스트에서 순서를 변경할 수 있습니다.`);
                 }
             };
             reader.readAsDataURL(file);
        });
    };

    const handleGenerateAll = async () => {
        if (!store.mainImageUrl) return alert('메인 상품 이미지를 먼저 업로드해주세요.');
        setIsGenerating(true);

        try {
            // 1. Analyze Product
            const analysis = await analyzeProduct(store.mainImageUrl, store.name || 'Fashion Item');
            store.setAnalysis(analysis);

            // 2. Plan Sections
            const sections = await planDetailSections(analysis, store.name || 'Fashion Item');
            // Ensure sections have unique IDs and required fields
            const formattedSections = sections.map((s: any) => ({
                id: uuidv4(),
                title: s.title,
                logicalSection: s.logicalSection || 'details',
                keyMessage: s.keyMessage,
                visualPrompt: s.visualPrompt || ''
            }));
            store.setSections(formattedSections);

            // 3. Generate Images (if lookbook is empty)
            if (store.lookbookImages.length === 0) {
                // Generate 3 variations
                const posesToGenerate = [FACTORY_POSES[0], FACTORY_POSES[1], FACTORY_POSES[4]]; // Front, Side, Detail

                for (const pose of posesToGenerate) {
                    const url = await generateFactoryPose(store.mainImageUrl, pose, analysis, '2K');
                    store.addLookbookImage({
                        id: uuidv4(),
                        url,
                        pose: pose.name,
                        isGenerating: false
                    });
                }
            }
        } catch (e) {
            console.error(e);
            alert('생성 중 오류가 발생했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportImage = async () => {
        setIsExporting(true);
        // Wait for Overlay to layout and images to load
        await new Promise(resolve => setTimeout(resolve, 3000)); 

        if (!exportRef.current) {
            console.error("Export ref is missing after wait!");
            showAlert('오류', '내보내기 대상을 찾을 수 없습니다.');
            setIsExporting(false);
            return;
        }

        try {
            console.log("Starting export...");
            const dataUrl = await toPng(exportRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                skipFonts: true,
                pixelRatio: 2,
                width: 800
            });
            console.log("Export success");

            const link = document.createElement('a');
            link.download = `[DETAIL]_${store.name || 'PROJECT'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (e: any) {
            console.error("Export failed:", e);
            showAlert('오류 발생', `이미지 저장 중 오류가 발생했습니다.\n${e?.message || '알 수 없는 오류'}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportSplit = async () => {
        setIsExporting(true);
        // Wait for Overlay and images
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (!exportRef.current) {
             showAlert('오류', '내보내기 대상을 찾을 수 없습니다.');
             setIsExporting(false);
             return;
        }

        try {
            console.log("Starting split export...");
            const dataUrl = await toPng(exportRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                skipFonts: true,
                pixelRatio: 2
            });

            // ... standard slice logic ...
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context failed');

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const splitHeight = 2500 * 2;
            const totalChunks = Math.ceil(canvas.height / splitHeight);
            const zip = new JSZip();

            for (let i = 0; i < totalChunks; i++) {
                const chunkCanvas = document.createElement('canvas');
                chunkCanvas.width = canvas.width;
                const currentHeight = Math.min(splitHeight, canvas.height - i * splitHeight);
                chunkCanvas.height = currentHeight;

                const chunkCtx = chunkCanvas.getContext('2d');
                chunkCtx?.drawImage(
                    canvas,
                    0, i * splitHeight, canvas.width, currentHeight,
                    0, 0, canvas.width, currentHeight
                );

                const chunkData = chunkCanvas.toDataURL('image/jpeg', 0.9);
                const base64Data = chunkData.replace(/^data:image\/(png|jpeg);base64,/, "");
                zip.file(`detail_${i + 1}.jpg`, base64Data, { base64: true });
            }

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `[SPLIT]_${store.name || 'PROJECT'}.zip`;
            link.click();

        } catch (e: any) {
            console.error("Split Export failed:", e);
            showAlert('오류 발생', `분할 저장 중 오류가 발생했습니다.\n${e?.message}`);
        } finally {
            setIsExporting(false);
        }
    };



    const handleCopyHtml = () => {
        // Generate simple HTML structure
        const html = `
<!-- 
  NOTE: This HTML assumes images are hosted. 
  Please upload your images to a server and replace the 'src' attributes.
-->
<div style="max-width: 860px; margin: 0 auto; text-align: center; background: #fff;">
  
  <!-- Event/Notice Asset -->
  ${store.brandAssets.find(a => a.id === 'event')?.imageUrl ? `<img src="REPLACE_WITH_EVENT_URL" style="width:100%; display:block;" alt="Event" /><br/><br/>` : ''}

  <!-- Event/Notice Asset -->
  ${store.brandAssets.find(a => a.id === 'event')?.imageUrl ? `<img src="REPLACE_WITH_EVENT_URL" style="width:100%; display:block;" alt="Event" /><br/><br/>` : ''}

  <!-- Intro Brand Asset -->
  ${store.brandAssets.find(a => a.id === 'intro')?.imageUrl ? `<img src="REPLACE_WITH_INTRO_URL" style="width:100%; display:block;" alt="Intro" /><br/><br/>` : ''}

  <!-- Lookbook Images -->
  ${store.lookbookImages.map((img, i) => `
  <img src="REPLACE_WITH_IMAGE_${i + 1}_URL" style="width:100%; display:block;" alt="Lookbook ${i + 1}" />
  <br/><br/>
  `).join('')}

  <!-- Sections text -->
  ${store.sections.map(s => `
  <div style="padding: 60px 20px;">
    <h3 style="color: #6366f1; font-size: 14px; letter-spacing: 0.2em; margin-bottom: 20px;">${s.title}</h3>
    <p style="font-size: 18px; line-height: 1.6; font-weight: bold;">${s.keyMessage}</p>
  </div>
  `).join('')}

  <!-- Size Guide (Placeholder) -->
  <div style="padding: 40px 0;">
    <h2>SIZE GUIDE</h2>
    <!-- Insert Table HTML Here if needed -->
  </div>
  <br/><br/>

  <!-- Washing -->
  <img src="REPLACE_WITH_WASHING_URL" style="width:100%; display:block;" alt="Washing" />
  <br/><br/>

  <!-- Model Info -->
  ${(() => {
                const asset = store.brandAssets.find(a => a.id === 'model_info');
                if (asset?.isEnabled && asset.imageUrl) {
                    return `
      <div style="position: relative; width: 100%;">
        <img src="REPLACE_WITH_MODEL_INFO_URL" style="width:100%; display:block;" alt="Model Info" />
        <div style="
            position: absolute; 
            left: ${asset.textOverlay?.x}%; 
            top: ${asset.textOverlay?.y}%; 
            transform: translate(-50%, -50%); 
            color: ${asset.textOverlay?.color}; 
            font-size: ${asset.textOverlay?.fontSize}px; 
            font-weight: ${asset.textOverlay?.fontWeight};
            text-align: center;
            width: 100%;
        ">
            ${asset.textOverlay?.content}
        </div>
      </div>
      <br/><br/>
      `;
                }
                return '';
            })()}

  <!-- Notice -->
  <img src="REPLACE_WITH_NOTICE_URL" style="width:100%; display:block;" alt="Notice" />
</div>
    `;

        navigator.clipboard.writeText(html);
        setHtmlCopied(true);
        setTimeout(() => setHtmlCopied(false), 2000);
        showAlert('복사 완료', 'HTML 코드가 복사되었습니다.\n\n[중요] 이미지 파일은 별도 서버에 업로드 후 src 경로를 수정해서 사용하세요.');
    };


    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-screen lg:h-[calc(100vh-100px)] relative">

            {/* Mobile View Toggle (Sticky Top) */}
            <div className="lg:hidden sticky top-0 z-30 flex bg-slate-950/95 backdrop-blur-md border-b border-white/10 shrink-0">
                <button
                    onClick={() => setMobileView('editor')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${mobileView === 'editor' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 border-b-2 border-transparent'
                        }`}
                >
                    EDITOR
                </button>
                <button
                    onClick={() => setMobileView('preview')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${mobileView === 'preview' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 border-b-2 border-transparent'
                        }`}
                >
                    PREVIEW
                </button>
            </div>

            {/* --- Sidebar Builder Console --- */}
            <div className={`
                lg:w-[400px] flex flex-col gap-4 bg-slate-900 lg:border border-slate-800 lg:rounded-3xl p-6 lg:overflow-y-auto custom-scrollbar
                ${mobileView === 'preview' ? 'hidden lg:flex' : 'flex h-full w-full'}
            `}>
                <div className="flex items-center gap-2 mb-4">
                    <Layout className="w-5 h-5 text-indigo-400" />
                    <h2 className="font-bold text-lg">One-Page Builder</h2>
                </div>

                {/* Console Tabs */}
                <div className="flex p-1 bg-slate-950 rounded-xl mb-4">
                    {['content', 'design', 'export'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t as any)}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {activeTab === 'content' && (
                    <div className="h-full flex flex-col">
                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-dashed border-indigo-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-indigo-500/60 hover:bg-indigo-500/20 transition-all cursor-pointer relative flex-1 min-h-[300px]">
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                onChange={handleMultiUpload} 
                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                            />
                            <div className="w-20 h-20 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6 group-hover:scale-110 transition-transform">
                                <Plus className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">이미지 추가하기</h3>
                            <p className="text-sm text-indigo-200 font-medium mb-8 max-w-[200px] leading-relaxed">
                                갖고 계신 상품 이미지를<br/>여기로 끌어다 놓으세요
                            </p>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                JPG · PNG · WEBP
                            </div>
                        </div>



                        <div className="mt-4 p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                             <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                    <Layout className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white mb-1">편집 가이드</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        위 리스트에서 항목을 드래그하여 순서를 변경하거나, 우측 미리보기에서 직접 편집할 수 있습니다.
                                    </p>
                                </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'design' && (
                    <div className="space-y-6">
                        {/* Brand Assets Manager (Embedded) */}
                        <div className="p-4 bg-slate-950 rounded-xl border border-white/5">
                            <BrandAssetManager />
                        </div>

                        <div className="p-4 bg-slate-950 rounded-xl">
                            <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase">사이즈 가이드 타입</h3>
                            <div className="relative">
                                <select
                                    value={store.sizeCategory}
                                    onChange={(e) => store.setSizeCategory(e.target.value as any)}
                                    className="w-full appearance-none bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
                                >
                                    {[
                                        { id: 'short_sleeve', label: '반팔' },
                                        { id: 'long_sleeve', label: '긴팔' },
                                        { id: 'pants', label: '바지' },
                                        { id: 'skirt', label: '스커트' }
                                    ].map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-3 leading-relaxed">
                                * 선택한 카테고리에 맞는 도식화와 측정 항목으로 상세페이지가 자동 구성됩니다.
                            </p>
                        </div>


                    </div>
                )}

                {activeTab === 'export' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportImage}
                                disabled={isExporting}
                                className="flex-1 py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                통이미지
                            </button>
                            <button
                                onClick={handleExportSplit}
                                disabled={isExporting}
                                className="flex-1 py-4 bg-indigo-500 text-white hover:bg-indigo-400 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
                                분할 다운 (ZIP)
                            </button>
                        </div>

                        <button
                            onClick={handleCopyHtml}
                            className="w-full py-4 bg-slate-800 text-indigo-400 hover:bg-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 border border-indigo-500/30"
                        >
                            {htmlCopied ? <span className="text-green-400">복사 완료!</span> : (
                                <>
                                    <FileCode className="w-4 h-4" />
                                    HTML 코드 복사
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* --- Main Preview Area --- */}
            <div className={`
                flex-1 bg-slate-950/50 lg:rounded-[48px] lg:border border-white/5 lg:overflow-hidden justify-center lg:p-8 lg:overflow-y-auto custom-scrollbar
                ${mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}
            `}>
                {/* Live Preview Container */ }
                <div className="relative w-full lg:max-w-[500px] bg-white text-slate-950 lg:shadow-2xl min-h-screen lg:min-h-[800px]">
                    {/* Floating Layer Console (Desktop Only) */}
                    <div className="absolute top-4 right-[-300px] hidden xl:block">
                        <LayerManager 
                            onDelete={(id) => showConfirm('이미지 삭제', '이 이미지를 삭제하시겠습니까?', () => store.removeLookbookImage(id), true)}
                        />
                    </div>
                    {/* Floating Layer Console (Tablet/Small Desktop - Inside) */}
                    <div className="fixed bottom-8 right-8 z-50 xl:hidden">
                        <LayerManager 
                             className="shadow-3xl border-slate-700"
                             onDelete={(id) => showConfirm('이미지 삭제', '이 이미지를 삭제하시겠습니까?', () => store.removeLookbookImage(id), true)}
                        />
                    </div>

                    <div className="flex flex-col bg-white">

                        {/* 0. Event/Notice (Top Fixed) */}
                        {store.brandAssets.find(a => a.id === 'event')?.isEnabled && store.brandAssets.find(a => a.id === 'event')?.imageUrl && (
                            <DownloadableSection fileName={`event_${store.name}`}>
                                <img src={store.brandAssets.find(a => a.id === 'event')?.imageUrl!} className="w-full" alt="Event" />
                                <div className="h-4 bg-white" />
                            </DownloadableSection>
                        )}

                        {/* 1. Brand Intro */}
                        {store.brandAssets.find(a => a.id === 'intro')?.isEnabled && store.brandAssets.find(a => a.id === 'intro')?.imageUrl && (
                            <DownloadableSection fileName={`intro_${store.name}`}>
                                <img src={store.brandAssets.find(a => a.id === 'intro')?.imageUrl!} className="w-full" alt="Intro" />
                                <div className="h-12 bg-white" />
                            </DownloadableSection>
                        )}

                        {/* 2. Lookbook Images (Sortable) */}
                        {/* 2. Lookbook Images (Sortable / Static) */}
                        <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext 
                                items={store.lookbookImages.map(img => img.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {store.lookbookImages.filter(img => img.url).map((img, idx) => (
                                    <SortableLookbookItem 
                                        key={img.id}
                                        img={img}
                                        idx={idx}
                                        isExporting={isExporting}
                                        store={store}
                                        onDelete={(id) => showConfirm('이미지 삭제', '이 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', () => store.removeLookbookImage(id), true)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {/* 3. Sections */}
                        {store.sections.map((section, idx) => (
                            <DownloadableSection key={section.id || idx} fileName={`section_${idx + 1}_${store.name}`}>
                                <div className="relative group">
                                    <div className="py-24 px-10 text-center bg-white">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em] block mb-6">{section.title}</span>
                                        <h2 className="text-xl font-black mb-0 leading-relaxed whitespace-pre-wrap">{section.keyMessage}</h2>
                                        <div className="h-12" />
                                    </div>
                                    {!isExporting && (
                                        <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                             <button 
                                                onClick={() => store.moveSection(section.id, 'up')}
                                                disabled={idx === 0}
                                                className="p-2 bg-white/90 shadow-lg text-slate-700 hover:text-indigo-600 rounded-lg disabled:opacity-50 hover:scale-110 transition-all border border-slate-200"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => store.moveSection(section.id, 'down')}
                                                disabled={idx === store.sections.length - 1}
                                                className="p-2 bg-white/90 shadow-lg text-slate-700 hover:text-indigo-600 rounded-lg disabled:opacity-50 hover:scale-110 transition-all border border-slate-200"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    showConfirm('섹션 삭제', '이 섹션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', () => {
                                                        store.removeSection(section.id);
                                                    }, true);
                                                }}
                                                className="p-2 bg-red-500 shadow-lg text-white hover:bg-red-600 rounded-lg hover:scale-110 transition-all border border-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </DownloadableSection>
                        ))}

                        {/* 3.1 Model Info Asset (New) */}
                        {store.brandAssets.find(a => a.id === 'model_info')?.isEnabled && store.brandAssets.find(a => a.id === 'model_info')?.imageUrl && (
                            <DownloadableSection fileName={`model_info_${store.name}`}>
                                <div className="relative w-full">
                                    <img src={store.brandAssets.find(a => a.id === 'model_info')?.imageUrl!} className="w-full block" alt="Model Info" />
                                    {(() => {
                                        const asset = store.brandAssets.find(a => a.id === 'model_info');
                                        if (asset?.textOverlay) {
                                            return (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${asset.textOverlay.x}%`,
                                                        top: `${asset.textOverlay.y}%`,
                                                        transform: 'translate(-50%, -50%)',
                                                        color: asset.textOverlay.color,
                                                        fontSize: `${asset.textOverlay.fontSize}px`,
                                                        fontWeight: asset.textOverlay.fontWeight,
                                                        whiteSpace: 'pre-wrap',
                                                        textAlign: 'center',
                                                        width: '100%'
                                                    }}
                                                >
                                                    {asset.textOverlay.content}
                                                </div>
                                            )
                                        }
                                        return null;
                                    })()}
                                </div>
                            </DownloadableSection>
                        )}

                        {/* 4. Size Guide System */}
                        <DownloadableSection fileName={`sizeguide_${store.name}`}>
                            <div className="py-24 px-6 bg-white border-t border-slate-100">
                                <div className="flex items-center gap-2 justify-center mb-12">
                                    <Shirt className="w-4 h-4 text-slate-300" />
                                    <h2 className="text-sm font-black uppercase tracking-[0.3em]">SIZE GUIDE</h2>
                                </div>

                                <SizeGuideSystem />
                            </div>
                        </DownloadableSection>

                        <div className="h-12 bg-white" />

                        {/* 5. Washing & Notice (Fixed) */}
                        <DownloadableSection fileName={`washing_${store.name}`}>
                            <img src="/세탁.png" className="w-full" alt="Washing" />
                            <div className="h-12 bg-white" />
                        </DownloadableSection>

                        <DownloadableSection fileName={`notice_${store.name}`}>
                            <img src="/notice.png" className="w-full" alt="Notice" />
                        </DownloadableSection>

                    </div>
                    
                    {/* Overlay Export Container (Visible only during export) */}
                    {isExporting && (
                        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex items-start justify-center overflow-y-auto py-10">
                            <div className="flex flex-col items-center">
                                <h2 className="text-white text-xl font-bold mb-4 animate-pulse">고화질 이미지 생성 중... (잠시만 기다려주세요)</h2>
                                <div ref={exportRef} className="bg-white shadow-2xl w-[800px]">
                                    <ExportableContent store={store} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <ConfirmModal 
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                isDestructive={modal.isDestructive}
            />

        </div >
    );
};

export default FactoryOnePage;
