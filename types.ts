
export type Resolution = '1K' | '2K' | '4K';
export type Quality = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '9:16' | '4:3';
export type ProductCategory = '상의' | '하의' | '아우터' | '셋업' | '잡화';
export type MaterialType = '코튼' | '데님' | '나일론' | '울' | '니트' | '기모' | '린넨' | '혼방';
export type ViewMode = 'full' | 'top' | 'bottom';
export type PageLength = '5' | '7' | '9' | 'auto';
export type AppView = 'ugc-master' | 'factory' | 'fit-builder' | 'auto-fitting' | 'settings' | 'brand_identity' | 'social_strategy' | 'thumbnail-generator' | 'admin';
export type FitSubMode = 'pose-change' | 'detail-extra' | 'fitting-variation' | 'virtual-try-on' | 'face-swap' | 'background-change';

export type FaceMode = 'ON' | 'OFF' | 'HEADLESS';
export type Gender = 'Male' | 'Female' | 'UNSPECIFIED';
export type Mode = 'Single' | 'Couple';
export type CameraAngle = 'default' | 'front' | 'left-30' | 'left-40' | 'right-30' | 'right-40' | 'left-side' | 'right-side' | 'back';

export type GeminiErrorType = 'safety' | 'quota' | 'auth' | 'invalid' | 'unknown';

export interface VariationResult {
  id: string;
  url: string;
  angle: CameraAngle;
  status: 'loading' | 'success' | 'error';
  errorType?: GeminiErrorType;
  errorMessage?: string;
}

export interface AutoFittingState {
  productImage: string | null;
  bgImage: string | null;
  results: VariationResult[];
  resolution: Resolution;
  aspectRatio: AspectRatio;
}

export type SizeCategory = 'short_sleeve' | 'long_sleeve' | 'pants' | 'skirt';

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

export interface SizeColumn {
  id: string; // "length", "shoulder", etc.
  label: string; // "총장", "어깨너비" (Editable)
  key: string; // data key
}

export interface SizeRecord {
  id: string;
  name: string; // "S", "M", "L", "FREE"
  [key: string]: string; // Dynamic dimensions
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

export interface DetailImageSegment extends DetailSection { }

export interface ProductAnalysis {
  category: ProductCategory;
  fit: string;
  material: string;
  materialType: MaterialType;
  season: string[];
  keyPoints: string[];
  gender?: Gender;
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
  type: 'header' | 'footer' | 'size' | 'notice' | 'model_info';
  textOverlay?: {
    content: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    color: string;
    fontSize: number;
    fontWeight: string;
  };
}

export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  generatedImages: number;
}

export interface ProductState {
  credits: number;
  brandName: string;
  name: string;
  analysis: ProductAnalysis | null;
  sizeTable: SizeRecord[];
  sizeColumns: SizeColumn[];
  mainImageUrl: null | string;
  techSketchUrl: null | string;
  lookbookImages: LookbookImage[];
  sections: DetailSection[];
  resolution: Resolution;
  sizeCategory: SizeCategory; // New field
  step: 1 | 2 | 3;
  appView: AppView;
  brandAssets: BrandAsset[];
  usage: UsageStats;
  apiKeys: { id: string; label: string; key: string }[];
  activeKeyId: string | null;
  autoFitting: AutoFittingState;
}

