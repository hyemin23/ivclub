import React from 'react';
import DownloadableSection from './DownloadableSection';
import { useStore } from '../store';

// Helper to ensure clean export
const ExportableContent = ({ store }: { store: any }) => {
    return (
        <div className="flex flex-col bg-white w-[800px]">
            {/* Fixed width 800px ensures consistent export quality */}

            {/* 0. Event/Notice */}
            {store.brandAssets.find((a: any) => a.id === 'event')?.isEnabled && store.brandAssets.find((a: any) => a.id === 'event')?.imageUrl && (
                <DownloadableSection fileName={`event_${store.name}`}>
                    <img src={store.brandAssets.find((a: any) => a.id === 'event')?.imageUrl || ""} className="w-full block" alt="Event" />
                    <div className="h-4 bg-white" />
                </DownloadableSection>
            )}

            {/* 1. Brand Intro */}
            {store.brandAssets.find((a: any) => a.id === 'intro')?.isEnabled && store.brandAssets.find((a: any) => a.id === 'intro')?.imageUrl && (
                <DownloadableSection fileName={`intro_${store.name}`}>
                    <img src={store.brandAssets.find((a: any) => a.id === 'intro')?.imageUrl || ""} className="w-full block" alt="Intro" />
                    <div className="h-12 bg-white" />
                </DownloadableSection>
            )}

            {/* 2. Lookbook Images */}
            {store.lookbookImages.filter((img: any) => img.url).map((img: any, idx: number) => (
                <DownloadableSection key={img.id} fileName={`lookbook_${idx + 1}_${store.name}`}>
                    <img src={img.url} className="w-full block" alt={`Detail ${idx}`} />
                    <div className="h-12 bg-white" />
                </DownloadableSection>
            ))}

            {/* 3. Sections */}
            {store.sections.map((section: any, idx: number) => (
                <DownloadableSection key={section.id || idx} fileName={`section_${idx + 1}_${store.name}`}>
                    <div className="py-24 px-10 text-center bg-white">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em] block mb-6">{section.title}</span>
                        <h2 className="text-xl font-black mb-0 leading-relaxed whitespace-pre-wrap text-slate-900">{section.keyMessage}</h2>
                        <div className="h-12" />
                    </div>
                </DownloadableSection>
            ))}

            {/* 4. Size Guide (Placeholder) */}
            <DownloadableSection fileName={`sizeguide_${store.name}`}>
                <div className="py-20 text-center bg-white">
                    <h2 className="text-lg font-bold">SIZE GUIDE</h2>
                    <p className="text-gray-400 text-sm mt-2">({store.sizeCategory})</p>
                </div>
                <div className="h-12 bg-white" />
            </DownloadableSection>

            {/* 5. Washing */}
            {store.brandAssets.find((a: any) => a.id === 'washing')?.isEnabled && store.brandAssets.find((a: any) => a.id === 'washing')?.imageUrl && (
                <DownloadableSection fileName={`washing_${store.name}`}>
                    <img src={store.brandAssets.find((a: any) => a.id === 'washing')?.imageUrl || ""} className="w-full block" alt="Washing" />
                    <div className="h-12 bg-white" />
                </DownloadableSection>
            )}

            {/* 6. Model Info */}
            {(() => {
                const asset = store.brandAssets.find((a: any) => a.id === 'model_info');
                if (asset?.isEnabled && asset.imageUrl) {
                    return (
                        <DownloadableSection fileName={`model_${store.name}`}>
                            <div className="relative w-full">
                                <img src={asset.imageUrl} className="w-full block" alt="Model Info" />
                                <div style={{
                                    position: 'absolute',
                                    left: `${asset.textOverlay?.x}%`,
                                    top: `${asset.textOverlay?.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    color: asset.textOverlay?.color,
                                    fontSize: `${asset.textOverlay?.fontSize}px`,
                                    fontWeight: asset.textOverlay?.fontWeight as any,
                                    textAlign: 'center',
                                    width: '100%'
                                }}>
                                    {asset.textOverlay?.content}
                                </div>
                            </div>
                            <div className="h-12 bg-white" />
                        </DownloadableSection>
                    );
                }
                return null;
            })()}

            {/* 7. Notice */}
            {store.brandAssets.find((a: any) => a.id === 'notice')?.isEnabled && store.brandAssets.find((a: any) => a.id === 'notice')?.imageUrl && (
                <DownloadableSection fileName={`notice_${store.name}`}>
                    <img src={store.brandAssets.find((a: any) => a.id === 'notice')?.imageUrl || ""} className="w-full block" alt="Notice" />
                </DownloadableSection>
            )}
        </div>
    );
};

export default ExportableContent;
