import React from 'react';
import { ProductSpecs } from '../../types';

interface TemplateProps {
    id: string;
    imageUrl?: string;
    copy?: any;
    mood?: string;
    colorHex?: string;
    specs?: ProductSpecs;
}

// Section A: Intro (Hooking/Banner)
export const IntroSection: React.FC<TemplateProps> = ({ id, imageUrl, copy, colorHex }) => {
    return (
        <div id={id} className="w-[640px] bg-white relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
            <img src={imageUrl} alt="Intro" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="border-l-4 pl-6" style={{ borderColor: colorHex || '#fff' }}>
                    <h1 className="text-4xl font-extrabold text-white leading-tight mb-2 whitespace-pre-wrap">
                        {copy?.main || "Main Copy Here"}
                    </h1>
                    <p className="text-lg text-gray-200 font-medium">
                        {copy?.sub || "Sub Copy Here"}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Section B: Spec Info (Table)
export const SpecInfoSection: React.FC<TemplateProps> = ({ id, specs }) => {
    if (!specs) return null;

    return (
        <div id={id} className="w-[640px] bg-white p-12 text-gray-900 border-b-8 border-gray-100">
            <h2 className="text-2xl font-bold mb-8 border-b-2 border-black pb-4 inline-block">Product Info</h2>

            <div className="space-y-8">
                {/* 1. Attributes Grid */}
                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl">
                    <div>
                        <span className="text-sm text-gray-400 font-bold block mb-1">COLORS</span>
                        <div className="text-lg font-medium">{specs.colors.join(', ')}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-400 font-bold block mb-1">SIZES</span>
                        <div className="text-lg font-medium">{specs.sizes.map(s => s.name).join(', ')}</div>
                    </div>
                </div>

                {/* 2. Fabric Check */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Fabric Guide</h3>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        {/* Thickness */}
                        <div className="border p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">두께감</div>
                            <div className="font-bold flex justify-center gap-1 text-xs">
                                <span className={specs.fabric.thickness === 'Thin' ? 'text-black' : 'text-gray-300'}>얇음</span>
                                <span className="text-gray-300">/</span>
                                <span className={specs.fabric.thickness === 'Normal' ? 'text-black' : 'text-gray-300'}>보통</span>
                                <span className="text-gray-300">/</span>
                                <span className={specs.fabric.thickness === 'Thick' ? 'text-black' : 'text-gray-300'}>두꺼움</span>
                            </div>
                        </div>
                        {/* Sheer */}
                        <div className="border p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">비침</div>
                            <div className="font-bold flex justify-center gap-1 text-xs">
                                <span className={specs.fabric.sheer === 'None' ? 'text-black' : 'text-gray-300'}>없음</span>
                                <span className="text-gray-300">/</span>
                                <span className={specs.fabric.sheer === 'Low' ? 'text-black' : 'text-gray-300'}>약간</span>
                                <span className="text-gray-300">/</span>
                                <span className={specs.fabric.sheer === 'High' ? 'text-black' : 'text-gray-300'}>있음</span>
                            </div>
                        </div>
                        {/* Stretch */}
                        <div className="border p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">신축성</div>
                            <div className="font-bold flex justify-center gap-1 text-xs">
                                <span className={specs.fabric.stretch === 'None' ? 'text-black' : 'text-gray-300'}>없음</span>
                                <span className="text-gray-300">/</span>
                                <span className={specs.fabric.stretch === 'Low' ? 'text-black' : 'text-gray-300'}>약간</span>
                                <span className="text-gray-300">/</span>
                                <span className={specs.fabric.stretch === 'High' ? 'text-black' : 'text-gray-300'}>신축강함</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="border p-3 rounded-lg flex justify-between items-center px-6">
                            <span className="text-xs text-gray-400">안감</span>
                            <span className="font-bold">{specs.fabric.lining ? '있음' : '없음'}</span>
                        </div>
                        <div className="border p-3 rounded-lg flex justify-between items-center px-6">
                            <span className="text-xs text-gray-400">계절감</span>
                            <span className="font-bold text-xs">{specs.fabric.season.join(', ')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Section C: Visual (Full Width with Caption)
export const VisualSection: React.FC<TemplateProps> = ({ id, imageUrl, copy }) => {
    return (
        <div id={id} className="w-[640px] bg-white text-center">
            <div className="py-16 px-10">
                <p className="text-lg text-gray-800 font-serif italic leading-relaxed whitespace-pre-wrap">
                    "{copy?.desc || "Comfortable fit in your daily life."}"
                </p>
                {copy?.title && (
                    <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                        {copy.title}
                    </p>
                )}
            </div>
            <img src={imageUrl} className="w-full h-auto" alt="Visual" />
        </div>
    );
};

// Section D: Detail Grid (2-Column)
export const DetailGridSection: React.FC<TemplateProps> = ({ id, imageUrl, copy }) => {
    // Assuming imageUrl comes as primary, but typically we want multiple images here.
    // For single placeholder support:
    return (
        <div id={id} className="w-[640px] bg-white p-4">
            <div className="grid grid-cols-2 gap-2">
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
                    <img src={imageUrl} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" alt="Detail 1" />
                    <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                        Detail View
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 text-center">
                        <div>
                            <h3 className="font-bold text-lg mb-2">{copy?.title || "Premium Quality"}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-light">
                                {copy?.desc || "High durability and soft touch fabric."}
                            </p>
                        </div>
                    </div>
                    {/* Placeholder for 2nd image if implemented later, or just color block */}
                    <div className="flex-1 bg-gray-200">
                        {/* If we had a second image, place it here */}
                    </div>
                </div>
            </div>
        </div>
    );
};
