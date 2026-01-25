
export type Resolution = '1K' | '2K' | '4K';
export type Quality = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '9:16' | '4:3' | '3:4';
export type ProductCategory = '상의' | '하의' | '아우터' | '셋업' | '잡화';
export type MaterialType = '코튼' | '데님' | '나일론' | '울' | '니트' | '기모' | '린넨' | '혼방';
export type ViewMode = 'full' | 'top' | 'bottom';
export type PageLength = '5' | '7' | '9' | 'auto';
export type AppView = 'ugc-master' | 'factory' | 'fit-builder' | 'auto-fitting' | 'settings' | 'brand_identity' | 'social_strategy' | 'thumbnail-generator' | 'admin' | 'canvas-editor' | 'video-studio' | 'color-variation' | 'batch-studio';
export type FitSubMode = 'pose-change' | 'detail-extra' | 'fitting-variation' | 'virtual-try-on' | 'face-swap' | 'background-change' | 'outfit-swap' | 'size-extract' | 'commerce-factory';

export type FaceMode = 'ON' | 'OFF' | 'HEADLESS';
export type Gender = 'Male' | 'Female' | 'UNSPECIFIED';

export type Mode = 'Single' | 'Couple';
export type CameraAngle = 'default' | 'front' | 'left-30' | 'left-40' | 'right-30' | 'right-40' | 'left-side' | 'right-side' | 'back';


export type ToneManner = 'emotional' | 'functional' | 'trend' | 'witty' | 'polite' | string;

export interface USPBlock {
  title: string;
  description: string;
  icon?: string;
}

export interface FaceOptions {
  faceMode: FaceMode;
  gender: Gender;
  faceRefImage: string | null;
}

export interface SavedModel {
  id: string;
  name: string;
  description: string;
  gender: Gender;
  previewUrl: string;
  faceRefImage?: string;
  seed?: number;
  createdAt: number;
}

export type BlockType = 'NOTICE' | 'INTRO' | 'PRODUCT' | 'DETAIL' | 'SIZE' | 'MODEL_INFO' | 'WASHING' | 'EVENT' | 'DESIGN' | 'TYPOGRAPHY' | 'PIN' | 'VS' | 'ZOOM' | 'MOOD' | 'SPLIT' | 'MAP';

export interface PageBlock {
  id: string;
  type: BlockType;
  dataId?: string; // Reference to store data item
  content?: any; // For inline data (e.g. NoticeBlock image)
  data?: any; // For generic block data
  isVisible: boolean;
  order: number;
}

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
  prompt: string;
  results: VariationResult[];
  resolution: Resolution;
  aspectRatio: AspectRatio;
  selectedAngles: CameraAngle[];
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

export interface DesignKeyword {
  keyword: string;
  style: 'badge' | 'simple_text' | 'speech_bubble' | 'arrow_text';
  // Position hints (optional, 0-1 scale)
  x?: number;
  y?: number;
}

export interface LookbookImage {
  id: string;
  url: string;
  pose?: string;
  isGenerating?: boolean;
  prompt?: string;
  ratio?: string;
  createdAt?: number;
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
  materialType?: MaterialType;
  season: string[];
  keyPoints: string[];
  features?: string[];
  color?: string;
  style?: string;
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


export interface FabricInfo {
  thickness: 'Thin' | 'Normal' | 'Thick';
  sheer: 'None' | 'Low' | 'High';
  stretch: 'None' | 'Low' | 'High';
  lining: boolean;
  season: string[];
}

export interface ProductSpecs {
  colors: string[];
  sizes: { name: string; notes: string }[]; // Changed to array for better schema compliance
  fabric: FabricInfo;
  modelInfo?: string;
}

export interface ProductState {
  credits: number;
  user: any | null; // Supabase User
  brandName: string;
  name: string;
  analysis: ProductAnalysis | null;
  specs?: ProductSpecs; // New field for Standard Template
  sizeTable: SizeRecord[];
  sizeColumns: SizeColumn[];
  mainImageUrl: null | string;
  techSketchUrl: null | string;
  lookbookImages: LookbookImage[];
  sections: DetailSection[];
  resolution: Resolution;
  sizeCategory: SizeCategory;
  step: 1 | 2 | 3;
  appView: AppView;
  brandAssets: BrandAsset[];
  usage: UsageStats;
  apiKeys: { id: string; label: string; key: string }[];
  activeKeyId: string | null;
  autoFitting: AutoFittingState;
  pageBlocks: PageBlock[];
}

// ============================================
// Vision AI 기반 상세페이지 자동화 엔진 타입 (V2: Fabric.js Design Overlay)
// ============================================

/**
 * Design Keyword - 이미지 위에 배치할 디자인 요소
 * Vision AI가 식별한 제품 특징 키워드와 스타일 제안
 */
// DesignKeyword is already defined above

/**
 * VS 비교 항목 - 우리 제품 vs 경쟁사 비교
 * Vision AI가 장점을 기반으로 역추론한 비교 데이터 (Legacy Support or Keep)
 */
export interface VsComparisonItem {
  category: string;    // 비교 카테고리 (예: "원단 퀄리티")
  us_item: string;     // 우리 제품 장점 (예: "밀도 높은 고중량 원단 (O)")
  others_item: string; // 경쟁사 단점 (예: "흐물거리고 얇은 저가 원단 (X)")
}

/**
 * Vision AI 통합 분석 결과 (V2)
 */

export interface SmartPin {
  id: string;
  location: { x: number; y: number };
  title: string;
  description: string;
}

/**
 * Vision AI 통합 분석 결과 (V2)
 */
export interface VisionAnalysisResult {
  status: 'success' | 'error';
  data: {
    smart_pins: SmartPin[];
    design_keywords?: DesignKeyword[];
    comparison_table?: VsComparisonItem[];
    auto_typography?: AutoTypographyResult;
  };
  error?: string;
}

/**
 * Vision 분석 상태 (Store용)
 */
export interface VisionAnalysisState {
  isAnalyzing: boolean;
  keywords: DesignKeyword[];
  comparisons: VsComparisonItem[];
  sourceImageUrl: string | null;
  error: string | null;
  lastAnalyzedAt: number | null;
}

// ============================================
// AI Copywriting Types
// ============================================

export interface CopyOption {
  type: 'Emotional' | 'Functional' | 'Trend';
  title: string;
  description: string;
}

export interface ProductCopyAnalysis {
  product_analysis: {
    detected_color: string[];
    fabric_guess: string;
    style_keywords: string[];
  };
  copy_options: CopyOption[];
}

// ============================================
// AI Auto-Typography Types
// ============================================

export interface AutoTypographyResult {
  intro_copy: {
    english: string;
    korean: string;
  };
  feature_point: {
    highlight_word: string;
    full_sentence: string;
  };
  visual_tag: string;
}


// ============================================
// Benchmark (Vibe-Copy) Type
// ============================================

export interface BenchmarkAnalysisResult {
  lighting: {
    type: 'Natural' | 'Studio' | 'Flash' | 'Neon' | 'Mixed';
    direction: string;
    quality: string;
  };
  environment: {
    location: string;
    props: string[];
    surface: string;
  };
  vibe_keywords: string[];
  color_grading: string;
  composition: string;
}

// ============================================
// Batch Studio (Lookbook Factory) Types
// ============================================

// SEATED, WAIST, HEM 제거됨 - 요청사항 반영
export type BatchPose =
  | 'FRONT_FULL' | 'SIDE_LEFT' | 'SIDE_RIGHT' | 'WALKING' | 'HAND_GESTURE'
  | 'CROP_TEXTURE' | 'CROP_COLLAR' | 'CROP_POCKET';

export interface BatchColorVariant {
  id: string;
  name: string; // e.g. "Black", "Melange Grey"
  hex: string;  // e.g. "#000000"
  baseImage?: string; // Optional: specific image for this color
}

export interface BatchMatrixItem {
  id: string;
  colorId: string;
  pose: BatchPose;
  status: 'pending' | 'generating' | 'success' | 'failed';
  imageUrl?: string;
  error?: string;
  backgroundTheme?: string; // Store theme snapshot
  resolution?: BatchResolution; // Store resolution snapshot
}

export interface BatchJobConfig {
  colors: BatchColorVariant[];
  poses: BatchPose[]; // usually all 10
  safetyMode?: boolean; // Auto-crop face for competitor images
  productCategory?: 'TOP' | 'BOTTOM' | 'ONEPIECE';
}

export type BatchProductCategory = 'TOP' | 'BOTTOM' | 'ONEPIECE';
export type BatchResolution = '1K' | '2K' | '4K';
