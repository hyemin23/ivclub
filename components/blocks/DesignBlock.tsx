
import React from 'react';
import { FabricLayer } from '../editor/FabricLayer';
import { DesignKeyword } from '@/types';

interface DesignBlockProps {
    imageUrl: string;
    keywords: DesignKeyword[];
    isEditable: boolean;
    onUpdate?: (updates: any) => void;
}

const DesignBlock: React.FC<DesignBlockProps> = ({ imageUrl, keywords, isEditable, onUpdate }) => {

    const handleSave = (dataUrl: string) => {
        // If we want to save the "burned" image back to the block data
        if (onUpdate) {
            // onUpdate({ burnedImage: dataUrl }); 
            // implementation detail: standard blocks might not have 'burnedImage' field yet.
            // For now, simple save to download is enough as per MVP.
        }
    };

    return (
        <div className={`relative w-full aspect-[3/4] overflow-hidden ${isEditable ? 'ring-2 ring-indigo-500' : ''}`}>
            {/* If we have a 'burned' image, show it? Or always show Fabric? 
                 Always show Fabric for editability. 
                 But for high perf in read-only, we might want a static image.
                 For now, Fabric is fine.
             */}
            <FabricLayer
                width={860} // Fixed width for standard blocks
                height={1146} // 3:4 aspect ratio approx
                imageUrl={imageUrl}
                keywords={keywords}
                onSave={handleSave}
            />

            {!isEditable && (
                <div className="absolute inset-0 bg-transparent z-10" /> // Overlay to prevent interaction when not editable
            )}
        </div>
    );
};

export default DesignBlock;
