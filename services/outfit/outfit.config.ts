
import React from 'react';
import { Shirt, Footprints, Briefcase } from 'lucide-react';
import { MaskArea } from './outfit.types';

export const MASK_OPTIONS: { id: MaskArea; label: string; icon: React.ElementType }[] = [
    { id: 'Top', label: '상의 (Top)', icon: Shirt },
    { id: 'Bottom', label: '하의 (Bottom)', icon: Footprints },
    { id: 'Outer', label: '아우터 (Outer)', icon: Briefcase },
];
