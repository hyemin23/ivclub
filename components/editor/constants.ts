
import { MapPin, Scale, ZoomIn, Image as ImageIcon, Type, LayoutGrid, Truck, Palette, Crosshair, Columns } from 'lucide-react';

// 블록 타입 정의
export type EditorBlockType = 'PIN' | 'VS' | 'TEXT' | 'IMAGE' | 'SIZE' | 'NOTICE' | 'INTRO' | 'ZOOM' | 'MOOD' | 'MAP' | 'SPLIT';

export const blockLibrary = [
    // Vibe Blocks (Premium)
    { type: 'MOOD' as EditorBlockType, icon: Palette, label: 'Mood Overlay', desc: '감성 매거진 스타일' },
    { type: 'MAP' as EditorBlockType, icon: Crosshair, label: 'Product Map', desc: '테크니컬 지시선' },
    { type: 'SPLIT' as EditorBlockType, icon: Columns, label: 'Color Split', desc: '2분할 비교' },

    // Standard Blocks
    { type: 'PIN' as EditorBlockType, icon: MapPin, label: 'Smart Pin', desc: 'AI 포인트 핀' },
    { type: 'VS' as EditorBlockType, icon: Scale, label: 'VS 비교표', desc: '경쟁사 비교' },
    { type: 'ZOOM' as EditorBlockType, icon: ZoomIn, label: 'Detail Zoom', desc: '디테일 확대' },
    { type: 'IMAGE' as EditorBlockType, icon: ImageIcon, label: '이미지', desc: '상품 사진' },
    { type: 'TEXT' as EditorBlockType, icon: Type, label: '텍스트', desc: '설명 문구' },
    { type: 'SIZE' as EditorBlockType, icon: LayoutGrid, label: '사이즈표', desc: '치수 정보' },
    { type: 'NOTICE' as EditorBlockType, icon: Truck, label: '배송안내', desc: '고정 에셋' },
];
