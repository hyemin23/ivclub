
export type Resolution = '1K' | '2K' | '4K';
export type Quality = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '9:16' | '4:3';
export type ProductCategory = '상의' | '하의' | '아우터' | '셋업' | '잡화';
export type MaterialType = '코튼' | '데님' | '나일론' | '울' | '니트' | '기모' | '린넨' | '혼방';
export type ViewMode = 'full' | 'top' | 'bottom';
export type PageLength = '5' | '7' | '9' | 'auto';
export type AppView = 'ugc-master' | 'factory' | 'fit-builder' | 'settings' | 'brand_identity' | 'social_strategy';
export type FitSubMode = 'pose-change' | 'detail-extra' | 'fitting-variation' | 'virtual-try-on' | 'face-swap' | 'background-change';

export type FaceMode = 'ON' | 'OFF';
export type Gender = 'Male' | 'Female';
export type Mode = 'Single' | 'Couple';
export type CameraAngle = 'default' | 'front' | 'left-30' | 'right-30' | 'left-90' | 'right-90' | 'left-135' | 'right-135' | 'back';

export interface GenerationConfig {
  productFeatures: string;
  stylingCoordination: string;
  targetAudience: string;
  locationIds: string[];
  quality: Quality;
  gender: Gender;
  mode: Mode;
  imageFile: File | null;
}

export interface GenerationResult {
  id: string;
  imageUrl: string;
  prompt: string;
  locationName: string;
}

export interface LocationOption {
  id: string;
  name: string;
  category: string;
  prompt: string;
  icon: string;
}

export interface SizeData {
  shoulder?: string;
  chest?: string;
  sleeve?: string;
  waist?: string;
  hip?: string;
  thigh?: string;
  rise?: string;
  hem?: string;
  length?: string;
}

export interface LookbookImage {
  id: string;
  url: string;
  pose: string;
  isGenerating: boolean;
}

export interface DetailSection {
  id: string;
  title: string;
  logicalSection: string;
  keyMessage: string;
  visualPrompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface DetailImageSegment extends DetailSection {}

export interface ProductAnalysis {
  category: ProductCategory;
  fit: string;
  material: string;
  materialType: MaterialType;
  season: string[];
  keyPoints: string[];
}

export interface ProductInfo {
  name: string;
  originalPrice: string;
  salePrice: string;
  category: string;
  merchantInfo: string;
  features: string;
  targetGender: string[];
  targetAge: string[];
}

export interface BrandAsset {
  id: string;
  name: string;
  imageUrl: string | null;
  isEnabled: boolean;
  type: 'header' | 'footer' | 'size' | 'notice';
}

export interface ProductState {
  brandName: string;
  name: string;
  analysis: ProductAnalysis | null;
  sizeData: SizeData;
  mainImageUrl: null | string;
  techSketchUrl: null | string;
  lookbookImages: LookbookImage[];
  sections: DetailSection[];
  resolution: Resolution;
  step: 1 | 2 | 3;
  brandAssets: BrandAsset[];
  appView: AppView;
}
