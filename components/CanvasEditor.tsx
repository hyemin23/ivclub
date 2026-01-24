
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@/store';
import EditorController from './editor/EditorController';
import EditorCanvas from './editor/EditorCanvas';
import { VisionAnalysisResult } from '@/types';
import { PageBlock } from '@/types'; // Ensure correct import logic

// Lazy Loaded Modals
const OnboardingModal = dynamic(() => import('./modals/OnboardingModal'), {
    ssr: false
});
const NanoBananaProModal = dynamic(() => import('./NanoBananaProModal'), {
    ssr: false
});

const CanvasEditor: React.FC = () => {
    const {
        pageBlocks,
        setPageBlocks,

        setComparisons,
        setUploadedImages,
        setMainImageUrl,
        mainImageUrl,
        activeTab,
        setActiveTab
    } = useStore();

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showNanoBanana, setShowNanoBanana] = useState(false);

    // Initial Onboarding Check
    useEffect(() => {
        // If no blocks and no main image, show onboarding
        if (pageBlocks.length === 0 && !mainImageUrl) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setShowOnboarding(true);
        }
    }, [pageBlocks.length, mainImageUrl]);

    const handleOnboardingComplete = (images: File[], result: VisionAnalysisResult) => {
        setShowOnboarding(false);

        // 1. Update Images
        const imageUrls = images.map(file => URL.createObjectURL(file));
        setUploadedImages(imageUrls);
        if (imageUrls.length > 0) {
            setMainImageUrl(imageUrls[0]);
        }

        // 2. Update Vision Data
        // 2. Update Vision Data
        if (result && result.data) {
            setComparisons(result.data.comparison_table || []);
        }

        // 3. Generate Initial Blocks based on Template
        // We create a standard set of blocks for the "Vision AI Details Page"
        const initialBlocks: PageBlock[] = [
            {
                id: `block_pin_${Date.now()}`,
                type: 'PIN',
                dataId: '',
                isVisible: true,
                order: 0,
                content: {},
                // @ts-ignore
                data: {}
            },
            {
                id: `block_vs_${Date.now() + 1}`,
                type: 'VS',
                dataId: '',
                isVisible: true,
                order: 1,
                content: {},
                // @ts-ignore
                data: {}
            },
            {
                id: `block_zoom_${Date.now() + 2}`,
                type: 'ZOOM',
                dataId: '',
                isVisible: true,
                order: 2,
                content: {},
                // @ts-ignore
                data: { zoomPoints: [{ x: 50, y: 50, scale: 2 }] }
            }
        ];

        setPageBlocks(initialBlocks);
        setActiveTab('blocks');
    };

    return (
        <div className="flex h-[calc(100vh-64px)] md:h-screen w-full bg-[#111] text-white overflow-hidden">
            {/* Left Panel: Controller */}
            <EditorController
                onOpenNanoBanana={() => setShowNanoBanana(true)}
            />

            {/* Right Panel: Canvas */}
            <EditorCanvas />

            {/* Modals */}
            <OnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                onComplete={handleOnboardingComplete}
            />

            <NanoBananaProModal
                isOpen={showNanoBanana}
                onClose={() => setShowNanoBanana(false)}
                sourceImage={mainImageUrl}
                onComplete={(enhancedUrl) => {
                    // Update main image logic if needed
                    // Typically we might replace the current image or add it to gallery
                    // For now, let's just update mainImageUrl
                    setMainImageUrl(enhancedUrl);
                }}
            />
        </div>
    );
};

export default CanvasEditor;
