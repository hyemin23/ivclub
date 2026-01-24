
import React, { useRef } from 'react';
import { useStore } from '@/store';
import { blockLibrary, EditorBlockType } from './constants';
import { Plus, X, Download, Sparkles, Settings, Eye, MapPin, Scale, Image as ImageIcon, Type, LayoutGrid, Truck, Wand2 } from 'lucide-react';
import { SmartPin, VsComparisonItem } from '@/types';
import { analyzeProductCopy, analyzeProductVision } from '@/services/geminiService';
import { DesignKeyword } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface EditorControllerProps {
    onOpenNanoBanana: () => void;
}

const EditorController: React.FC<EditorControllerProps> = ({ onOpenNanoBanana }) => {
    const {
        activeTab,
        setActiveTab,
        uploadedImages,
        setUploadedImages,
        mainImageUrl,
        setMainImageUrl,
        pageBlocks,
        addPageBlock,
        removePageBlock,
        selectedBlockId,
        setSelectedBlockId,
        comparisons,
        setComparisons,
        copyAnalysis,
        setCopyAnalysis,
        designKeywords,
        setDesignKeywords,
        productNameInput,
        setProductNameInput,
        smartPins,
        setSmartPins
    } = useStore();

    const [isAnalyzingVision, setIsAnalyzingVision] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const handleMagicVision = async () => {
        setErrorMessage(null); // Clear previous errors

        if (!mainImageUrl) {
            setErrorMessage('배경으로 사용할 이미지를 먼저 업로드해주세요.');
            return;
        }
        if (!productNameInput.trim()) {
            setErrorMessage('정확한 분석을 위해 상품명을 입력해주세요. (예: 와이드 데님 팬츠)');
            return;
        }

        setIsAnalyzingVision(true);
        try {
            const result = await analyzeProductVision(mainImageUrl, productNameInput);

            if (result.status === 'success') {
                setDesignKeywords(result.data.design_keywords || []);
                setComparisons(result.data.comparison_table || []);

                // Add DESIGN Block automatically
                addPageBlock({
                    id: `block_${Date.now()}`,
                    type: 'DESIGN',
                    isVisible: true,
                    order: pageBlocks.length,
                    data: {
                        keywords: result.data.design_keywords || []
                    }
                });

                // Add TYPOGRAPHY Block automatically if data exists
                if (result.data.auto_typography) {
                    addPageBlock({
                        id: `block_type_${Date.now()}`,
                        type: 'TYPOGRAPHY',
                        isVisible: true,
                        order: pageBlocks.length + 1,
                        data: {
                            typography: result.data.auto_typography
                        }
                    });
                }
                setActiveTab('edit');
            }
        } catch (e: any) {
            console.error("상세 에러:", e);
            const errorMessage = e.message || "알 수 없는 오류";
            const fullMsg = `분석 실패! 원인: ${errorMessage}`;

            // UI 표시
            setErrorMessage(fullMsg);

            // 사용자 요청에 따라 Alert 창으로도 표시
            alert(fullMsg);
        } finally {
            setIsAnalyzingVision(false);
        }
    };

    const [copyInput, setCopyInput] = React.useState('');
    const [isAnalyzingCopy, setIsAnalyzingCopy] = React.useState(false);

    const handleAnalyzeCopy = async () => {
        if (!mainImageUrl || !copyInput.trim()) return;
        setIsAnalyzingCopy(true);
        try {
            const result = await analyzeProductCopy(mainImageUrl, copyInput);
            setCopyAnalysis(result);
        } catch (e) {
            console.error(e);
            alert('분석 중 오류가 발생했습니다.');
        } finally {
            setIsAnalyzingCopy(false);
        }
    };

    const handleApplyCopy = (option: any) => {
        addPageBlock({
            id: `block_${Date.now()}`,
            type: 'MOOD', // Applying as MOOD block for now as it has text fields
            dataId: '',
            isVisible: true,
            content: {},
            // @ts-ignore
            order: pageBlocks.length,
            // @ts-ignore
            data: {
                title: option.title,
                subtitle: option.type,
                description: option.description,
                description2: ''
            }
        });
        setActiveTab('edit');
    };

    // const [isVideoModalOpen, setIsVideoModalOpen] = React.useState(false); // REMOVED

    const fileInputRef = useRef<HTMLInputElement>(null);



    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newUrls: string[] = [];

        for (const file of files) {
            try {
                // 1. Upload to Supabase Storage
                // Use a unique path: timestamp_filename
                // Sanitize filename to avoid issues with korean/spaces if needed, but Supabase handles utf8 well generally.
                // Keeping it simple for now or using uuid
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { data, error } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file);

                if (error) {
                    console.error('Supabase Upload Error:', error);
                    toast.error(`이미지 업로드 실패: ${error.message}`);
                    continue;
                }

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

                if (publicUrl) {
                    newUrls.push(publicUrl);
                }

            } catch (err) {
                console.error('Upload handling error:', err);
                toast.error('이미지 업로드 중 오류가 발생했습니다.');
            }
        }

        if (newUrls.length > 0) {
            setUploadedImages([...uploadedImages, ...newUrls]);
            // If no main image OR current main image is invalid (blob or base64), set to the new one
            if ((!mainImageUrl || mainImageUrl.startsWith('blob:') || mainImageUrl.startsWith('data:')) && newUrls.length > 0) {
                setMainImageUrl(newUrls[0]);
            }
            toast.success(`${newUrls.length}장의 이미지가 업로드되었습니다.`);
        }
    };

    const handleClearImages = () => {
        setUploadedImages([]);
        setMainImageUrl('');
        setDesignKeywords([]);
        setComparisons([]);
        setErrorMessage(null);
    };

    const handleResetAll = async () => {
        if (!confirm('모든 데이터(이미지, 블록, 설정)를 초기화하시겠습니까?')) return;

        // Clear all store state
        handleClearImages();

        // Clear IndexedDB
        if (typeof window !== 'undefined' && 'indexedDB' in window) {
            try {
                await indexedDB.deleteDatabase('keyval-store');
                alert('데이터가 초기화되었습니다. 페이지를 새로고침합니다.');
                window.location.reload();
            } catch (e) {
                console.error('IndexedDB 삭제 실패:', e);
                alert('일부 데이터 삭제에 실패했습니다. 브라우저 설정에서 수동으로 삭제해 주세요.');
            }
        }
    };

    const handleAddBlock = (type: EditorBlockType) => {
        let defaultData = {};

        switch (type) {
            case 'MOOD':
                defaultData = {
                    title: 'PREMIUM COTTON',
                    subtitle: 'Soft Touch & Comfort',
                    description: '부드러운 터치감의 완성',
                    description2: '기분 좋은 착용감을 선사합니다.'
                };
                break;
            case 'SPLIT':
                defaultData = {
                    labelLeft: 'BLACK',
                    labelRight: 'GRAY'
                };
                break;
            case 'ZOOM':
                defaultData = {
                    zoomPoints: [{ x: 50, y: 50, scale: 2 }]
                };
                break;
            default:
                defaultData = {};
        }

        addPageBlock({
            id: `block_${Date.now()}`,
            type: type as any,
            dataId: '',
            isVisible: true,
            content: {},
            // @ts-ignore
            order: pageBlocks.length,
            // @ts-ignore
            data: defaultData
        });
        setActiveTab('edit');
    };

    const selectedBlock = pageBlocks.find(b => b.id === selectedBlockId);

    return (
        <aside className="w-[400px] min-w-[400px] flex flex-col border-r border-white/10 bg-slate-950">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-5">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Editor Controller</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleMagicVision}
                        disabled={isAnalyzingVision}
                        className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        <Sparkles className={`w-3 h-3 ${isAnalyzingVision ? 'animate-spin' : ''}`} />
                        {isAnalyzingVision ? 'Analyzing...' : 'Magic AI'}
                    </button>
                    {/* REMOVED AI Video Button */}
                    <button className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-white/5">저장</button>
                </div>
            </div>

            {/* REMOVED VideoGenerationModal */}

            {/* Tabs */}
            <div className="flex border-b border-white/5">
                <button
                    onClick={() => setActiveTab('blocks')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors
                        ${activeTab === 'blocks' ? 'bg-white/5 text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}
                    `}
                >
                    블록 (Blocks)
                </button>
                <button
                    onClick={() => setActiveTab('edit')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors
                        ${activeTab === 'edit' ? 'bg-white/5 text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}
                    `}
                >
                    편집 (Edit)
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {activeTab === 'blocks' && (
                    <div className="space-y-6">
                        {/* Product Info Section */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">상품명 (AI 분석용)</label>
                            <input
                                type="text"
                                value={productNameInput}
                                onChange={(e) => setProductNameInput(e.target.value)}
                                placeholder="예: 와이드 데님 팬츠"
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-gray-600"
                            />
                        </div>

                        {/* Error Message Display */}
                        {errorMessage && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 font-medium animate-in slide-in-from-top-1">
                                {errorMessage}
                            </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-2">
                            {uploadedImages.length > 0 && (
                                <button
                                    onClick={handleClearImages}
                                    className="w-full py-2 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors"
                                >
                                    🗑️ 이미지 초기화
                                </button>
                            )}
                            <button
                                onClick={handleResetAll}
                                className="w-full py-2 text-xs text-orange-400 hover:text-orange-300 border border-orange-500/20 hover:border-orange-500/40 rounded bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
                            >
                                ⚠️ 전체 데이터 초기화 (IndexedDB)
                            </button>
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">업로드 이미지</span>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-300"
                                    >
                                        + 추가
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                                {uploadedImages.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {uploadedImages.map((url, i) => (
                                            <div
                                                key={i}
                                                className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all
                                                ${mainImageUrl === url ? 'border-indigo-500' : 'border-transparent hover:border-white/20'}
                                            `}
                                                onClick={() => setMainImageUrl(url)}
                                            >
                                                <img src={url} alt={`Uploaded ${i}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-white/[0.02] rounded-xl flex items-center justify-center border border-dashed border-white/10">
                                        <p className="text-gray-600 text-xs">이미지 없음</p>
                                    </div>
                                )}
                            </div>

                            {/* AI Copywriting Section */}
                            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <Wand2 className="w-3 h-3 text-indigo-400" />
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                        AI 상품 분석 & 카피라이팅
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <textarea
                                        value={copyInput}
                                        onChange={(e) => setCopyInput(e.target.value)}
                                        placeholder="상품 특징을 간단히 입력하세요 (예: 오버핏 니트, 캐시미어 혼방)"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none h-20"
                                    />
                                    <button
                                        onClick={handleAnalyzeCopy}
                                        disabled={!mainImageUrl || !copyInput.trim() || isAnalyzingCopy}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isAnalyzingCopy ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                분석 중...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-3 h-3" />
                                                분석 및 추천 받기
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Analysis Result */}
                                {copyAnalysis && (
                                    <div className="mt-4 space-y-4 pt-4 border-t border-white/10">
                                        {/* Keywords */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {copyAnalysis.product_analysis.detected_color.map((c, i) => (
                                                <span key={`c-${i}`} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-gray-300">
                                                    {c}
                                                </span>
                                            ))}
                                            {copyAnalysis.product_analysis.style_keywords.map((k, i) => (
                                                <span key={`k-${i}`} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-gray-300">
                                                    {k}
                                                </span>
                                            ))}
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] text-indigo-300">
                                                {copyAnalysis.product_analysis.fabric_guess}
                                            </span>
                                        </div>

                                        {/* Recommended Copy Options */}
                                        <div className="space-y-2">
                                            {copyAnalysis.copy_options.map((option, i) => (
                                                <div key={i} className="group relative p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer" onClick={() => handleApplyCopy(option)}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded 
                                                        ${option.type === 'Emotional' ? 'bg-pink-500/20 text-pink-300' :
                                                                option.type === 'Functional' ? 'bg-blue-500/20 text-blue-300' :
                                                                    'bg-amber-500/20 text-amber-300'}`}>
                                                            {option.type}
                                                        </span>
                                                        <Plus className="w-3 h-3 text-gray-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                                                    </div>
                                                    <p className="text-xs font-bold text-white mb-1 line-clamp-1">{option.title}</p>
                                                    <p className="text-[10px] text-gray-400 line-clamp-2">{option.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Block Library */}
                            <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">
                                    추가할 블록
                                </span>
                                <div className="space-y-2">
                                    {blockLibrary.map((item) => (
                                        <button
                                            key={item.type}
                                            onClick={() => handleAddBlock(item.type)}
                                            className="w-full flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.05] 
                                            rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                                        >
                                            <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center 
                                            group-hover:bg-indigo-500/20 transition-colors">
                                                <item.icon className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-white">{item.label}</p>
                                                <p className="text-[10px] text-gray-500">{item.desc}</p>
                                            </div>
                                            <Plus className="w-4 h-4 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'edit' && (
                    <div>
                        {selectedBlock ? (
                            <div className="space-y-6">
                                {/* Type Label */}
                                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                                        EDITING BLOCK
                                    </p>
                                    <p className="text-white font-bold text-lg">
                                        {blockLibrary.find(b => b.type === selectedBlock.type)?.label || selectedBlock.type}
                                    </p>
                                </div>

                                {/* PIN Properties */}
                                {selectedBlock.type === 'PIN' /* @ts-ignore */ && (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                    핀 목록 ({smartPins.length}개)
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        const newPin: SmartPin = {
                                                            id: `pin_${Date.now()}`,
                                                            location: { x: 50, y: 50 },
                                                            title: '새 포인트',
                                                            description: ''
                                                        };
                                                        setSmartPins([...smartPins, newPin]);
                                                    }}
                                                    className="text-[10px] text-indigo-400 hover:text-indigo-300"
                                                >
                                                    + 핀 추가
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {smartPins.map((pin, i) => (
                                                    <div key={pin.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] text-gray-500 block uppercase tracking-wider">PIN #{i + 1}</span>
                                                            <button
                                                                onClick={() => setSmartPins(smartPins.filter((_, idx) => idx !== i))}
                                                                className="text-gray-600 hover:text-red-400"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={pin.title}
                                                            onChange={(e) => {
                                                                const updated = [...smartPins];
                                                                updated[i] = { ...pin, title: e.target.value };
                                                                setSmartPins(updated);
                                                            }}
                                                            className="w-full bg-transparent text-white text-sm font-bold mb-1 
                                                                focus:outline-none placeholder-gray-600"
                                                            placeholder="제목 입력"
                                                        />
                                                        <textarea
                                                            value={pin.description}
                                                            onChange={(e) => {
                                                                const updated = [...smartPins];
                                                                updated[i] = { ...pin, description: e.target.value };
                                                                setSmartPins(updated);
                                                            }}
                                                            className="w-full bg-transparent text-gray-400 text-xs resize-none 
                                                                focus:outline-none placeholder-gray-700"
                                                            placeholder="설명 입력"
                                                            rows={2}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VS Properties */}
                                {selectedBlock.type === 'VS' /* @ts-ignore */ && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            비교 항목 설정
                                        </p>
                                        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                            <p className="text-gray-400 text-xs leading-relaxed">
                                                VS 비교표는 캔버스에서 직접 텍스트를 클릭하여 수정하거나,
                                                아래에서 항목을 관리할 수 있습니다.
                                            </p>
                                        </div>
                                        {/* Simple list editor for VS could go here */}
                                    </div>
                                )}

                                {/* Fallback */}
                                {!['PIN', 'VS'].includes(selectedBlock.type as any) && (
                                    <div className="text-center py-10 text-gray-600">
                                        <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">이 블록에 대한<br />추가 설정 옵션이 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-600">
                                <Eye className="w-8 h-8 mb-3 opacity-30" />
                                <p className="text-sm font-medium">선택된 블록 없음</p>
                                <p className="text-xs mt-1">블록 리스트에서 추가하거나<br />캔버스에서 블록을 선택하세요.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950 sticky bottom-0 z-10">
                <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm 
                    hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10">
                    <Download className="w-4 h-4" />
                    상세페이지 내보내기
                </button>
            </div>
        </aside>
    );
};

export default EditorController;
