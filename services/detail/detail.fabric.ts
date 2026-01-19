import { StaticCanvas, Rect, Text, Textbox, Shadow, Image as FabricImage } from 'fabric';
import { getIconRuleSet, getIconSvgUrl } from './detail.rules';

/**
 * 3. 최종 합성 함수 (Layout Composer) - Color & Background Fix
 * - Background: Solid White (#FFFFFF) - NO Transparency
 * - Text Color: Dark Grey / Black
 */
export const renderHighEndBlock = async (imageUrl: string, userKeyword: string): Promise<string> => {
    const BASE_SIZE = 1024;

    // A. 캔버스 초기화 (배경색 명시적 지정)
    const canvasEl = document.createElement('canvas'); // Create element explicitly
    canvasEl.width = BASE_SIZE;
    canvasEl.height = BASE_SIZE;

    // Use StaticCanvas from named import
    const canvas = new StaticCanvas(canvasEl, {
        width: BASE_SIZE,
        height: BASE_SIZE,
        backgroundColor: '#FFFFFF' // ✅ 배경색 흰색 고정
    });

    // B. 안전장치: 흰색 사각형을 맨 밑에 한 번 더 깝니다.
    const bgRect = new Rect({
        width: BASE_SIZE,
        height: BASE_SIZE,
        fill: '#FFFFFF',
        selectable: false
    });
    canvas.add(bgRect);

    // C. 데이터 가져오기
    const uspData = getIconRuleSet(userKeyword) || [];

    // D. 레이아웃 계산
    const centerX = BASE_SIZE / 2;
    const topSectionHeight = BASE_SIZE * 0.6; // 상단 60%
    const topImageCenterY = topSectionHeight / 2;

    const imgMargin = BASE_SIZE * 0.03;
    const imgWidth = BASE_SIZE - (imgMargin * 2);
    const imgHeight = topSectionHeight - (imgMargin * 2);
    const borderRadius = BASE_SIZE * 0.025;

    // E. 이미지 로드 & 배치
    // Bypass type checking for v7 static method
    const img = await (FabricImage as any).fromURL(imageUrl, { crossOrigin: 'anonymous' });
    const scale = Math.max(imgWidth / img.width!, imgHeight / img.height!);

    img.set({
        scaleX: scale, scaleY: scale,
        left: centerX, top: topImageCenterY,
        originX: 'center', originY: 'center',
        clipPath: new Rect({
            width: imgWidth, height: imgHeight,
            left: centerX, top: topImageCenterY,
            originX: 'center', originY: 'center',
            rx: borderRadius, ry: borderRadius,
            absolutePositioned: true
        })
    });

    // 그림자: 흰 배경이므로 더 진하고 선명하게 조정
    img.set({
        shadow: new Shadow({ color: 'rgba(0,0,0,0.2)', blur: 30, offsetY: 15 })
    });
    canvas.add(img);

    // F. 이미지 위 중앙 텍스트 (COTTON 100%) - 이건 흰색 유지
    const mainText = new Text("COTTON 100%", {
        fontFamily: 'serif',
        fontSize: BASE_SIZE * 0.07,
        fill: '#FFFFFF',
        left: centerX, top: topImageCenterY,
        originX: 'center', originY: 'center',
        shadow: new Shadow({ color: "rgba(0,0,0,0.5)", blur: 15 })
    });
    canvas.add(mainText);

    // G. 하단 아이콘 & 텍스트 배치
    const startY = topSectionHeight + (BASE_SIZE * 0.05);
    const colWidth = BASE_SIZE / 4;

    for (let i = 0; i < uspData.length; i++) {
        const item = uspData[i];
        const iconCenterX = (colWidth * i) + (colWidth / 2);

        // 1. 아이콘
        const iconUrl = getIconSvgUrl(item.icon);
        const iconImg = await (FabricImage as any).fromURL(iconUrl);
        // Relative Icon Size
        const iconSize = BASE_SIZE * 0.06;
        const iconScale = iconSize / 64;

        iconImg.set({
            left: iconCenterX,
            top: startY,
            originX: 'center',
            originY: 'top',
            scaleX: iconScale,
            scaleY: iconScale
        });
        canvas.add(iconImg);

        // 2. 제목 (Bold) - 진한 회색 (#333)
        const titleText = new Text(item.title, {
            fontFamily: 'sans-serif', fontWeight: 'bold',
            fontSize: BASE_SIZE * 0.022,
            fill: '#333333',
            left: iconCenterX, top: startY + (BASE_SIZE * 0.08),
            originX: 'center'
        });
        canvas.add(titleText);

        // 3. 설명 (Regular) - 연한 회색 (#666)
        const descText = new Textbox(item.desc, {
            fontFamily: 'sans-serif',
            fontSize: BASE_SIZE * 0.017,
            fill: '#666666',
            left: iconCenterX, top: startY + (BASE_SIZE * 0.12),
            originX: 'center',
            width: colWidth * 0.85, textAlign: 'center', splitByGrapheme: true,
        });
        canvas.add(descText);
    }

    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: 'png', quality: 1.0, multiplier: 1 });
    canvas.dispose();
    return dataUrl;
};
