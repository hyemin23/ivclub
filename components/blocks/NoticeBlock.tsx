import React, { useRef } from 'react';


interface NoticeContent {
    imageUrl?: string;
    [key: string]: unknown;
}

interface NoticeBlockProps {
    content: NoticeContent;
    onUpdate: (content: NoticeContent) => void;
    isExporting: boolean;
}

export default function NoticeBlock({ content, onUpdate, isExporting }: NoticeBlockProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 이미지 업로드 핸들러
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            // 부모 컴포넌트에 데이터 업데이트 알림
            onUpdate({ ...content, imageUrl });
        }
    };

    return (
        <div className="w-[640px] mx-auto bg-white">

            {/* 1. 공지사항 이미지 영역 */}
            {content.imageUrl ? (
                <div className="relative group">
                    <img
                        src={content.imageUrl}
                        alt="Notice"
                        className="w-full h-auto block" // 가로 꽉 채우기
                    />

                    {/* [편집 모드일 때만] 이미지 변경 버튼 노출 */}
                    {!isExporting && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}>
                            <span className="text-white font-bold border border-white px-4 py-2 rounded">
                                🔄 공지사항 이미지 변경
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                /* 2. 이미지가 없을 때 (업로드 유도 UI) */
                !isExporting && (
                    <div
                        className="h-40 bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors m-4"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="text-2xl mb-2">📢</span>
                        <span className="text-gray-500 font-medium">배송/교환/반품 공지사항 업로드</span>
                        <span className="text-xs text-gray-400 mt-1">클릭하여 이미지(JPG/PNG)를 추가하세요</span>
                    </div>
                )
            )}

            {/* 숨겨진 파일 인풋 */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
