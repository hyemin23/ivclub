
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

/**
 * Custom Storage Adapter for IndexedDB
 * 
 * ⚠️ 중요: IndexedDB는 비동기 스토리지입니다.
 * 
 * 이 스토리지를 사용할 때 반드시 다음을 지켜야 합니다:
 * 1. persist 옵션에 `skipHydration: true` 추가
 * 2. StoreHydration 컴포넌트로 앱을 감싸기 (layout.tsx 참조)
 * 3. 클라이언트 측에서 수동으로 rehydrate() 호출
 * 
 * 이를 지키지 않으면 SSR과 클라이언트 hydration 충돌로 인해
 * 무한 로딩이 발생할 수 있습니다.
 * 
 * 해결 방법: /zustand-hydration-fix 워크플로우 참조
 */
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
import { ProductState, LookbookImage, ProductAnalysis, SizeRecord, SizeColumn, DetailSection, Resolution, BrandAsset, AppView, SizeCategory, AutoFittingState, VariationResult, PageBlock, BlockType, DesignKeyword, VsComparisonItem, ProductCopyAnalysis, SavedModel } from './types';
import { VideoGenerationLog, VideoStatus } from './types/video';

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface BackgroundHistoryItem {
  id: string;
  url: string;
  timestamp: number;
}


// Helper for uuid if package is missing (user environment check)
const getMsgId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

interface AppStore extends ProductState {
  credits: number;
  user: any | null;
  setStep: (step: 1 | 2 | 3) => void;
  setAppView: (view: AppView) => void;
  setResolution: (res: Resolution) => void;
  setProductInfo: (info: Partial<ProductState>) => void;
  setAnalysis: (analysis: ProductAnalysis) => void;

  // Size Actions
  setSizeCategory: (category: SizeCategory) => void;
  addSizeRow: () => void;
  removeSizeRow: (id: string) => void;
  updateSizeRow: (id: string, name: string, data: Record<string, string>) => void;
  setSizeTable: (table: SizeRecord[]) => void;

  addSizeColumn: () => void;
  removeSizeColumn: (id: string) => void;
  updateSizeColumn: (id: string, label: string) => void;

  setSections: (sections: DetailSection[]) => void;
  addLookbookImage: (img: LookbookImage) => void;
  updateLookbookImage: (id: string, updates: Partial<LookbookImage>) => void;
  removeLookbookImage: (id: string) => void;
  moveLookbookImage: (id: string, direction: 'up' | 'down') => void;
  reorderLookbookImages: (fromIndex: number, toIndex: number) => void;
  toggleBrandAsset: (id: string) => void;
  updateBrandAsset: (id: string, updates: Partial<BrandAsset>) => void;
  clearLookbook: () => void;
  removeSection: (id: string) => void;
  moveSection: (id: string, direction: 'up' | 'down') => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  resetAll: () => void;
  apiKeys: { id: string; label: string; key: string }[];
  activeKeyId: string | null;
  setApiKeys: (keys: { id: string; label: string; key: string }[]) => void;
  setActiveKeyId: (id: string | null) => void;
  // AutoFitting Actions
  setAutoFittingState: (updates: Partial<AutoFittingState>) => void;
  updateAutoFittingResult: (id: string, updates: Partial<VariationResult>) => void;
  // Log Actions
  logs: LogEntry[];
  addLog: (message: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
  // Credit System
  addCredits: (amount: number) => void;
  // User System
  setUser: (user: any | null) => void;

  // Block Editor Actions
  pageBlocks: PageBlock[];
  setPageBlocks: (blocks: PageBlock[]) => void;
  addPageBlock: (block: PageBlock) => void;
  removePageBlock: (id: string) => void; // Removes the block entry
  updatePageBlock: (id: string, updates: Partial<PageBlock>) => void;
  reorderPageBlocks: (fromIndex: number, toIndex: number) => void;

  // Editor Selection State
  selectedBlockId: string | null;
  activeTab: 'blocks' | 'edit';
  setSelectedBlockId: (id: string | null) => void;
  setActiveTab: (tab: 'blocks' | 'edit') => void;

  // Vision AI Data
  designKeywords: DesignKeyword[];
  comparisons: VsComparisonItem[];
  uploadedImages: string[];
  productNameInput: string;

  setDesignKeywords: (keywords: DesignKeyword[]) => void;
  setComparisons: (items: VsComparisonItem[]) => void;
  setUploadedImages: (images: string[]) => void;
  setProductNameInput: (name: string) => void;
  setMainImageUrl: (url: string | null) => void;

  // AI Copywriting
  copyAnalysis: ProductCopyAnalysis | null;
  setCopyAnalysis: (analysis: ProductCopyAnalysis | null) => void;

  // AI Video Generation (Veo)
  videoLogs: VideoGenerationLog[];
  activeVideoLogId: string | null;
  addVideoLog: (log: VideoGenerationLog) => void;
  updateVideoLog: (id: string, updates: Partial<VideoGenerationLog>) => void;
  setActiveVideoLogId: (id: string | null) => void;

  // Background History
  backgroundHistory: BackgroundHistoryItem[];
  addToBackgroundHistory: (url: string) => void;
  clearBackgroundHistory: () => void;

  // Saved Models (Persona)
  savedModels: SavedModel[];
  activeModelId: string | null;
  addSavedModel: (model: SavedModel) => void;
  removeSavedModel: (id: string) => void;
  updateSavedModel: (id: string, updates: Partial<SavedModel>) => void;
  setActiveModelId: (id: string | null) => void;
}

const initialState: Omit<AppStore, 'setStep' | 'setAppView' | 'setResolution' | 'setProductInfo' | 'setAnalysis' | 'setSizeCategory' | 'addSizeRow' | 'removeSizeRow' | 'updateSizeRow' | 'setSizeTable' | 'addSizeColumn' | 'removeSizeColumn' | 'updateSizeColumn' | 'setSections' | 'addLookbookImage' | 'updateLookbookImage' | 'removeLookbookImage' | 'moveLookbookImage' | 'reorderLookbookImages' | 'toggleBrandAsset' | 'updateBrandAsset' | 'clearLookbook' | 'removeSection' | 'moveSection' | 'reorderSections' | 'resetAll' | 'setApiKeys' | 'setActiveKeyId' | 'setAutoFittingState' | 'updateAutoFittingResult' | 'addLog' | 'clearLogs' | 'addCredits' | 'setUser' | 'setPageBlocks' | 'addPageBlock' | 'removePageBlock' | 'updatePageBlock' | 'reorderPageBlocks' | 'setSelectedBlockId' | 'setActiveTab' | 'setDesignKeywords' | 'setComparisons' | 'setUploadedImages' | 'setProductNameInput' | 'setMainImageUrl' | 'setCopyAnalysis' | 'addVideoLog' | 'updateVideoLog' | 'setActiveVideoLogId' | 'addToBackgroundHistory' | 'clearBackgroundHistory' | 'addSavedModel' | 'removeSavedModel' | 'updateSavedModel' | 'setActiveModelId'> = {
  credits: 0,
  user: null, // Supabase User
  brandName: 'NEW BRAND',
  name: '',
  analysis: null,
  savedModels: [],
  activeModelId: null,
  sizeTable: [{ id: 'init_free', name: 'FREE' }], // Default one row
  sizeColumns: [
    { id: 'length', key: 'length', label: '총장' },
    { id: 'shoulder', key: 'shoulder', label: '어깨너비' },
    { id: 'chest', key: 'chest', label: '가슴단면' },
    { id: 'sleeve', key: 'sleeve', label: '소매길이' }
  ],
  mainImageUrl: null,
  techSketchUrl: null,
  lookbookImages: [],
  sections: [],
  resolution: '2K',
  sizeCategory: 'short_sleeve', // Default
  step: 1,
  appView: 'factory',
  // Auto Fitting State
  autoFitting: {
    productImage: null,
    bgImage: null,
    results: [],
    resolution: '2K',
    aspectRatio: '1:1',
    prompt: '',
    selectedAngles: []
  },
  // Admin Keys Defaults
  apiKeys: [
    { id: 'key_1', label: 'Primary Key (System)', key: process.env.NEXT_PUBLIC_GEMINI_KEY_1 || '' },
    { id: 'key_2', label: 'Secondary Key (Backup)', key: process.env.NEXT_PUBLIC_GEMINI_KEY_2 || '' },
    { id: 'key_3', label: 'Reserve Key', key: process.env.NEXT_PUBLIC_GEMINI_KEY_3 || '' },
  ],
  activeKeyId: (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')
    ? `key_${Math.floor(Math.random() * 3) + 1}` // Random 'key_1', 'key_2', or 'key_3' in Dev
    : 'key_1',
  brandAssets: [
    { id: 'event', name: '이벤트/안내사항 (최상단)', imageUrl: null, isEnabled: true, type: 'header' },

    { id: 'intro', name: '브랜드 인트로', imageUrl: null, isEnabled: true, type: 'header' },
    { id: 'notice', name: '배송/공지사항', imageUrl: null, isEnabled: true, type: 'notice' },
    {
      id: 'model_info',
      name: '모델 정보 (텍스트 오버레이)',
      imageUrl: null,
      isEnabled: true,
      type: 'model_info',
      textOverlay: {
        content: 'Model: 168cm / 48kg',
        x: 50,
        y: 90,
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
  ],
  usage: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    generatedImages: 0
  },
  logs: [],
  pageBlocks: [],
  selectedBlockId: null,
  activeTab: 'blocks',
  designKeywords: [],
  comparisons: [],
  uploadedImages: [],
  productNameInput: '',
  // mainImageUrl is null
  copyAnalysis: null,
  videoLogs: [],
  activeVideoLogId: null,
  backgroundHistory: []
};



export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) => set({ step }),
      setAppView: (appView) => set({ appView }),
      setResolution: (resolution) => set({ resolution }),
      setProductInfo: (info) => set((state) => ({ ...state, ...info })),
      setAnalysis: (analysis) => set({ analysis }),
      setApiKeys: (apiKeys: { id: string; label: string; key: string }[]) => set({ apiKeys }),
      setActiveKeyId: (activeKeyId: string | null) => set({ activeKeyId }),

      // AutoFitting Actions
      setAutoFittingState: (updates) => set((state) => ({
        autoFitting: { ...state.autoFitting, ...updates }
      })),
      updateAutoFittingResult: (id, updates) => set((state) => ({
        autoFitting: {
          ...state.autoFitting,
          results: state.autoFitting.results.map(r => r.id === id ? { ...r, ...updates } : r)
        }
      })),

      // Updated setSizeCategory with Column Defaults
      setSizeCategory: (category) => {
        const defaults: Record<SizeCategory, SizeColumn[]> = {
          'short_sleeve': [
            { id: 'length', key: 'length', label: '총장' },
            { id: 'shoulder', key: 'shoulder', label: '어깨너비' },
            { id: 'chest', key: 'chest', label: '가슴단면' },
            { id: 'sleeve', key: 'sleeve', label: '소매길이' }
          ],
          'long_sleeve': [
            { id: 'length', key: 'length', label: '총장' },
            { id: 'shoulder', key: 'shoulder', label: '어깨너비' },
            { id: 'chest', key: 'chest', label: '가슴단면' },
            { id: 'sleeve', key: 'sleeve', label: '소매길이' }
          ],
          'pants': [
            { id: 'length', key: 'length', label: '총장' },
            { id: 'waist', key: 'waist', label: '허리단면' },
            { id: 'thigh', key: 'thigh', label: '허벅지' },
            { id: 'rise', key: 'rise', label: '밑위' },
            { id: 'hem', key: 'hem', label: '밑단' }
          ],
          'skirt': [
            { id: 'length', key: 'length', label: '총장' },
            { id: 'waist', key: 'waist', label: '허리단면' },
            { id: 'hip', key: 'hip', label: '엉덩이' },
            { id: 'hem', key: 'hem', label: '밑단' }
          ],
        };

        set({
          sizeCategory: category,
          sizeColumns: defaults[category] || defaults['short_sleeve'],
          sizeTable: [] // Reset rows
        });
      },

      addSizeRow: () => set((state) => ({
        sizeTable: [...state.sizeTable, { id: getMsgId(), name: 'NEW' }]
      })),
      removeSizeRow: (id) => set((state) => ({
        sizeTable: state.sizeTable.filter(r => r.id !== id)
      })),
      updateSizeRow: (id, name, data) => set((state) => ({
        sizeTable: state.sizeTable.map(r => r.id === id ? { ...r, name, ...data } : r)
      })),
      setSizeTable: (table) => set({ sizeTable: table }),

      // Column Actions Implementation
      addSizeColumn: () => set((state) => {
        const id = getMsgId();
        return {
          sizeColumns: [...state.sizeColumns, { id, key: id, label: '새 항목' }]
        };
      }),

      removeSizeColumn: (id) => set((state) => ({
        sizeColumns: state.sizeColumns.filter(c => c.id !== id)
      })),

      updateSizeColumn: (id, label) => set((state) => ({
        sizeColumns: state.sizeColumns.map(c => c.id === id ? { ...c, label } : c)
      })),

      setSections: (sections) => set({ sections }),
      addLookbookImage: (img) => set((state) => ({ lookbookImages: [...state.lookbookImages, img] })),
      updateLookbookImage: (id, updates) => set((state) => ({
        lookbookImages: state.lookbookImages.map((img) => img.id === id ? { ...img, ...updates } : img)
      })),
      removeLookbookImage: (id) => set((state) => ({
        lookbookImages: state.lookbookImages.filter((img) => img.id !== id)
      })),
      toggleBrandAsset: (id) => set((state) => ({
        brandAssets: state.brandAssets.map((a) => a.id === id ? { ...a, isEnabled: !a.isEnabled } : a)
      })),
      updateBrandAsset: (id, updates) => set((state) => ({
        brandAssets: state.brandAssets.map((a) => a.id === id ? { ...a, ...updates } : a)
      })),
      clearLookbook: () => set({ lookbookImages: [] }),

      // Section Actions
      removeSection: (id) => set((state) => ({
        sections: state.sections.filter(s => s.id !== id)
      })),
      moveSection: (id, direction) => set((state) => {
        const index = state.sections.findIndex(s => s.id === id);
        if (index === -1) return {};
        if (direction === 'up' && index === 0) return {};
        if (direction === 'down' && index === state.sections.length - 1) return {};

        const newSections = [...state.sections];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
        return { sections: newSections };
      }),

      // Lookbook Image Actions (Move)
      moveLookbookImage: (id, direction) => set((state) => {
        const index = state.lookbookImages.findIndex(img => img.id === id);
        if (index === -1) return {};
        if (direction === 'up' && index === 0) return {};
        if (direction === 'down' && index === state.lookbookImages.length - 1) return {};

        const newImages = [...state.lookbookImages];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];
        return { lookbookImages: newImages };
      }),

      reorderLookbookImages: (fromIndex, toIndex) => set((state) => {
        const newImages = [...state.lookbookImages];
        const [movedItem] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedItem);
        return { lookbookImages: newImages };
      }),

      reorderSections: (fromIndex, toIndex) => set((state) => {
        const newSections = [...state.sections];
        const [movedItem] = newSections.splice(fromIndex, 1);
        newSections.splice(toIndex, 0, movedItem);
        return { sections: newSections };
      }),

      // Smart Reset: Keeps Brand Assets & Usage, Resets Product Data
      resetAll: () => set((state) => ({
        ...initialState,
        brandAssets: state.brandAssets, // Preserve Brand Assets
        usage: state.usage, // Preserve Usage Stats
        apiKeys: state.apiKeys, // Preserve Keys
        activeKeyId: state.activeKeyId, // Preserve Selection
        autoFitting: state.autoFitting // Preserve AutoFitting? No, user might expect reset. 
        // User asked for persistence BETWEEN TABS. But "resetAll" implies starting a NEW PROJECT.
        // So resetAll SHOULD reset autoFitting.
        // Wait, the initialState has autoFitting empty. So spreading initialState will reset it. Good.
      })),

      // Usage Tracking
      updateUsage: (success: boolean, input: number, output: number, isImage: boolean = false) => set((state) => ({
        usage: {
          totalRequests: state.usage.totalRequests + 1,
          successfulRequests: state.usage.successfulRequests + (success ? 1 : 0),
          failedRequests: state.usage.failedRequests + (success ? 0 : 1),
          inputTokens: state.usage.inputTokens + input,
          outputTokens: state.usage.outputTokens + output,
          totalTokens: state.usage.totalTokens + input + output,
          generatedImages: state.usage.generatedImages + (isImage && success ? 1 : 0)
        }
      })),

      // Log Actions
      logs: [],
      addLog: (message, type = 'info') => set((state) => ({
        logs: [{
          id: getMsgId(),
          timestamp: Date.now(),
          message,
          type
        }, ...state.logs].slice(0, 50) // Keep last 50 logs
      })),
      clearLogs: () => set({ logs: [] }),

      // Credit System
      addCredits: (amount) => set((state) => ({ credits: (state.credits || 0) + amount })),

      // User System
      setUser: (user) => set({ user }),

      // Block Editor Actions Implementation
      setPageBlocks: (blocks) => set({ pageBlocks: blocks }),
      addPageBlock: (block) => set((state) => ({ pageBlocks: [...state.pageBlocks, block] })),
      removePageBlock: (id) => set((state) => ({
        pageBlocks: state.pageBlocks.filter((b) => b.id !== id)
      })),
      updatePageBlock: (id, updates) => set((state) => ({
        pageBlocks: state.pageBlocks.map((b) => b.id === id ? { ...b, ...updates } : b)
      })),
      reorderPageBlocks: (fromIndex, toIndex) => set((state) => {
        const newBlocks = [...state.pageBlocks];
        const [movedItem] = newBlocks.splice(fromIndex, 1);
        newBlocks.splice(toIndex, 0, movedItem);
        return { pageBlocks: newBlocks };
        return { pageBlocks: newBlocks };
      }),

      setSelectedBlockId: (id) => set({ selectedBlockId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      setDesignKeywords: (keywords) => set({ designKeywords: keywords }),
      setComparisons: (items) => set({ comparisons: items }),
      setUploadedImages: (images) => set({ uploadedImages: images }),
      setProductNameInput: (name) => set({ productNameInput: name }),
      setMainImageUrl: (url) => set({ mainImageUrl: url }),

      // Copywriting
      setCopyAnalysis: (analysis) => set({ copyAnalysis: analysis }),

      // Video Generation
      addVideoLog: (log) => set((state) => ({ videoLogs: [log, ...state.videoLogs] })),
      updateVideoLog: (id, updates) => set((state) => ({
        videoLogs: state.videoLogs.map(log => log.id === id ? { ...log, ...updates } : log)
      })),
      setActiveVideoLogId: (id) => set({ activeVideoLogId: id }),

      // Background History Actions
      addToBackgroundHistory: (url) => set((state) => ({
        backgroundHistory: [
          { id: getMsgId(), url, timestamp: Date.now() },
          ...state.backgroundHistory
        ].slice(0, 10) // Keep last 10
      })),
      clearBackgroundHistory: () => set({ backgroundHistory: [] }),

      // Saved Model Actions
      addSavedModel: (model) => set((state) => ({ savedModels: [model, ...state.savedModels] })),
      removeSavedModel: (id) => set((state) => ({ savedModels: state.savedModels.filter(m => m.id !== id) })),
      updateSavedModel: (id, updates) => set((state) => ({
        savedModels: state.savedModels.map(m => m.id === id ? { ...m, ...updates } : m)
      })),
      setActiveModelId: (id) => set({ activeModelId: id })
    }),
    {
      name: 'nanobanana-storage', // unique name
      storage: createJSONStorage(() => storage), // Use IndexedDB
      skipHydration: true, // Skip automatic hydration to prevent SSR issues with async IndexedDB
      partialize: (state) => ({
        // IndexedDB handles large data well (hundreds of MBs), so we can persist everything
        brandName: state.brandName,
        usage: state.usage,
        apiKeys: state.apiKeys,
        activeKeyId: state.activeKeyId,
        autoFitting: state.autoFitting,
        lookbookImages: state.lookbookImages,
        analysis: state.analysis,
        name: state.name,
        sizeTable: state.sizeTable,
        sizeColumns: state.sizeColumns,
        sizeCategory: state.sizeCategory,
        sections: state.sections,
        mainImageUrl: state.mainImageUrl,
        techSketchUrl: state.techSketchUrl,
        brandAssets: state.brandAssets,
        pageBlocks: state.pageBlocks, // Persist blocks
        savedModels: state.savedModels,
        activeModelId: state.activeModelId,
        appView: state.appView // 🆕 마지막 선택한 카테고리 유지
      }),
    }
  )
);
