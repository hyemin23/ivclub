export const IMAGE_SPECS = {
    // [Target 1] 4910 (사공일공) - 1MB 제한 주의
    PLATFORM_4910: {
        targetWidth: 640,
        targetHeight: 768,
        ratio: 5 / 6,
        format: "jpg",
        quality: 85, // 용량 1MB 방어용 압축률
        maxSizeBytes: 1024 * 1024,
    },

    // [Target 2] 하이버 (Hiver) & 룩핀 (Lookpin) 코디용
    // 룩핀(720x840)은 하이버(1080x1260)를 리사이징하여 사용 가능하므로 고화질인 하이버 기준 통합
    PLATFORM_VERTICAL_HD: {
        targetWidth: 1080,
        targetHeight: 1260,
        ratio: 6 / 7,
        format: "jpg",
        quality: 95, // 감성샷 고화질 유지
    },

    // [Target 3] 룩핀 썸네일 (권장사이즈)
    PLATFORM_LOOKPIN_THUMB: {
        targetWidth: 720,
        targetHeight: 840,
        ratio: 6 / 7,
        format: "jpg",
        quality: 90,
    },

    // [Target 4] 스마트스토어 & 하이버 썸네일 (정사각형)
    PLATFORM_SQUARE: {
        targetWidth: 1000,
        targetHeight: 1000,
        ratio: 1,
        format: "jpg",
        quality: 90,
    },
} as const;
