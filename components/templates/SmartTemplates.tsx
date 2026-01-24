import React from 'react';

// Common Types
interface TemplateProps {
    id: string; // for capture reference
    imageUrl: string;
    copy: {
        main?: string;
        sub?: string;
        title?: string;
        desc?: string;
    };
    mood: string;
    colorHex?: string;
}

// 1. Main Banner (Hero)
export const MainBannerTemplate: React.FC<TemplateProps> = ({ id, imageUrl, copy, mood, colorHex }) => {
    const isDynamic = mood.toLowerCase().includes('dynamic');
    const isMinimal = mood.toLowerCase().includes('minimal');

    return (
        <div
            id={id}
            className="w-[640px] relative overflow-hidden bg-gray-100"
            style={{ aspectRatio: '3/4' }}
        >
            <img src={imageUrl} className={`w-full h-full object-cover ${isDynamic ? 'scale-110' : ''}`} alt="Main" />

            {/* Overlay - Style varies by mood */}
            <div className={`absolute inset-0 flex flex-col justify-end p-8 ${isMinimal
                ? 'bg-gradient-to-t from-black/50 via-transparent to-transparent'
                : 'bg-gradient-to-t from-black/80 via-black/20 to-transparent'
                }`}>
                <h1 className={`text-white whitespace-pre-wrap mb-4 drop-shadow-lg ${isMinimal ? 'text-4xl font-light tracking-widest' : 'text-5xl font-black italic tracking-tighter'
                    }`}>
                    {copy.main}
                </h1>
                <p className={`text-white/90 text-lg font-medium drop-shadow-md ${isMinimal ? 'tracking-wide' : ''}`}>
                    {copy.sub}
                </p>

                {/* Accent Line */}
                <div className="w-12 h-1 bg-white mt-6" style={{ backgroundColor: colorHex || 'white' }} />
            </div>
        </div>
    );
};

// 2. Feature Grid (Functional)
export const FeatureGridTemplate: React.FC<TemplateProps> = ({ id, imageUrl, copy, colorHex }) => {
    return (
        <div id={id} className="w-[640px] bg-white flex flex-col">
            {/* Top Image */}
            <div className="w-full h-[500px] overflow-hidden relative">
                <img src={imageUrl} className="w-full h-full object-cover" alt="Detail" />
                <div className="absolute bottom-0 right-0 bg-white px-6 py-3 rounded-tl-xl font-bold text-xs uppercase tracking-widest border-t border-l border-gray-100">
                    Detail View
                </div>
            </div>

            {/* Bottom Text Area */}
            <div className="p-10 flex flex-col justify-center items-center text-center bg-gray-50">
                <span
                    className="text-xs font-bold uppercase mb-4 px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: colorHex || '#4F46E5' }}
                >
                    Key Feature
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{copy.title}</h2>
                <p className="text-gray-600 leading-relaxed max-w-sm">
                    {copy.desc}
                </p>
            </div>
        </div>
    );
};

// 3. TPO Card (Emotional)
export const TpoCardTemplate: React.FC<TemplateProps> = ({ id, imageUrl, copy, mood }) => {
    return (
        <div id={id} className="w-[640px] p-8" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="bg-white shadow-xl p-4 rotate-1 transform transition-transform hover:rotate-0">
                <div className="w-full aspect-[4/5] overflow-hidden mb-4 bg-gray-200">
                    <img src={imageUrl} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="TPO" />
                </div>

                <div className="text-center pb-2">
                    <h3 className="font-serif text-xl italic text-gray-800 mb-1">&quot;{copy.title}&quot;</h3>
                    <p className="text-xs font-sans text-gray-400 uppercase tracking-widest">{copy.desc}</p>
                </div>
            </div>
        </div>
    );
};
