
import React from 'react';

// --- Types ---
interface TemplateProps {
    id: string;
    imageUrl?: string;
    copy?: {
        main?: string;
        sub?: string;
    };
    mood?: string;
    color?: string;
}

// --- 1. Main Banner Template ---
export const MainBannerTemplate: React.FC<TemplateProps> = ({ imageUrl, copy, color }) => {
    return (
        <div className="w-full h-[600px] relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gray-200">
                {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" />}
            </div>
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 text-center p-8 border-2 border-white/50 m-8">
                <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-widest">{copy?.main || 'MAIN HEADLINE'}</h1>
                <p className="text-xl text-white font-light tracking-wide">{copy?.sub || 'Subheadline text goes here'}</p>
            </div>
        </div>
    );
};

// --- 2. Feature Grid Template ---
export const FeatureGridTemplate: React.FC<TemplateProps> = ({ imageUrl, copy, color }) => {
    return (
        <div className="w-full py-12 px-6 flex flex-col items-center bg-white">
            <h2 className="text-2xl font-bold mb-8 text-gray-800 uppercase tracking-widest">Key Features</h2>
            <div className="grid grid-cols-2 gap-4 w-full">
                 <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" />}
                 </div>
                 <div className="flex flex-col justify-center p-4">
                     <h3 className="text-lg font-bold mb-2">{copy?.main || 'Feature Point'}</h3>
                     <p className="text-sm text-gray-600 leading-relaxed">{copy?.sub || 'Detailed description of the feature.'}</p>
                 </div>
            </div>
        </div>
    );
};

// --- 3. TPO Card Template ---
export const TpoCardTemplate: React.FC<TemplateProps> = ({ imageUrl, copy, color }) => {
    return (
        <div className="w-full p-8 bg-gray-50">
            <div className="bg-white shadow-xl p-6 rounded-sm">
                <div className="aspect-[4/3] bg-gray-200 mb-6 relative">
                     {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" />}
                     <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-bold uppercase">Recommend</div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-center">{copy?.main || 'Best for...'}</h3>
                 <p className="text-sm text-gray-500 text-center">{copy?.sub || 'Perfect for daily wear and office look.'}</p>
            </div>
        </div>
    );
};
