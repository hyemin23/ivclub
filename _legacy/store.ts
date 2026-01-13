
import { create } from 'zustand';
import { ProductState, LookbookImage, ProductAnalysis, SizeData, DetailSection, Resolution, BrandAsset, AppView } from './types';

interface AppStore extends ProductState {
  setStep: (step: 1 | 2 | 3) => void;
  setAppView: (view: AppView) => void;
  setResolution: (res: Resolution) => void;
  setProductInfo: (info: Partial<ProductState>) => void;
  setAnalysis: (analysis: ProductAnalysis) => void;
  setSizeData: (data: Partial<SizeData>) => void;
  setSections: (sections: DetailSection[]) => void;
  addLookbookImage: (img: LookbookImage) => void;
  updateLookbookImage: (id: string, updates: Partial<LookbookImage>) => void;
  removeLookbookImage: (id: string) => void;
  toggleBrandAsset: (id: string) => void;
  updateBrandAsset: (id: string, imageUrl: string) => void;
  clearLookbook: () => void;
  resetAll: () => void;
}

const initialState: ProductState = {
  brandName: 'NEW BRAND',
  name: '',
  analysis: null,
  sizeData: {},
  mainImageUrl: null,
  techSketchUrl: null,
  lookbookImages: [],
  sections: [],
  resolution: '2K',
  step: 1,
  appView: 'factory',
  brandAssets: [
    { id: 'intro', name: '브랜드 인트로', imageUrl: null, isEnabled: true, type: 'header' },
    { id: 'size', name: '사이즈 가이드', imageUrl: null, isEnabled: true, type: 'size' },
    { id: 'notice', name: '배송/공지사항', imageUrl: null, isEnabled: true, type: 'notice' },
  ],
};

export const useStore = create<AppStore>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setAppView: (appView) => set({ appView }),
  setResolution: (resolution) => set({ resolution }),
  setProductInfo: (info) => set((state) => ({ ...state, ...info })),
  setAnalysis: (analysis) => set({ analysis }),
  setSizeData: (data) => set((state) => ({ sizeData: { ...state.sizeData, ...data } })),
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
  updateBrandAsset: (id, imageUrl) => set((state) => ({
    brandAssets: state.brandAssets.map((a) => a.id === id ? { ...a, imageUrl } : a)
  })),
  clearLookbook: () => set({ lookbookImages: [] }),
  resetAll: () => set({ ...initialState }),
}));
