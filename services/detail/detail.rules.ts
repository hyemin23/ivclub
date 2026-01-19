import {
    Layers, CheckCircle, Heart, Maximize,
    Wind, Sun, Feather, Droplet, Star, Zap, Camera,
    Smartphone, Watch, Box, Tag, ShoppingBag, Truck, CreditCard,
    ShieldCheck
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

// Client-side USP Rule System
export const getIconRuleSet = (inputKeyword: string) => {
    // Default Set
    const defaultSet = [
        { icon: "layers", title: "고급 원단", desc: "밀도 높은 조직으로 탄탄한 착용감" },
        { icon: "check-circle", title: "뛰어난 마감", desc: "깔끔한 봉제와 정돈된 실루엣" },
        { icon: "heart", title: "부드러운 터치", desc: "피부에 닿는 감촉이 편안합니다" },
        { icon: "maximize", title: "안정적인 핏", desc: "단독 또는 레이어드로 활용도 높음" }
    ];

    // Denim Set
    const denimSet = [
        { icon: "layers", title: "프리미엄 데님", desc: "밀도 높은 코튼의 탄탄한 조직감" },
        { icon: "check-circle", title: "이중 스티치", desc: "견고한 봉제로 내구성을 높였습니다" },
        { icon: "droplet", title: "샌드 워싱", desc: "자연스러운 컬러감과 부드러운 터치" },
        { icon: "maximize", title: "트렌디한 핏", desc: "여유로운 실루엣으로 활동성 보장" }
    ];

    // Summer/Linen Set
    const summerSet = [
        { icon: "wind", title: "우수한 통기성", desc: "바람이 잘 통하는 쾌적한 쿨링 소재" },
        { icon: "check-circle", title: "꼼꼼한 마감", desc: "얇은 원단도 튼튼하게 마감했습니다" },
        { icon: "sun", title: "산뜻한 촉감", desc: "몸에 달라붙지 않는 시원한 터치감" },
        { icon: "feather", title: "가벼운 무게", desc: "하루 종일 입어도 피로감 없는 경량감" }
    ];

    const key = (inputKeyword || "").toLowerCase();
    if (key.includes("데님") || key.includes("청") || key.includes("진")) return denimSet;
    if (key.includes("여름") || key.includes("린넨") || key.includes("쿨")) return summerSet;

    return defaultSet;
};

// Icon Helper
export const getIconSvgUrl = (iconName: string): string => {
    const icons: any = {
        feather: Feather, 'shield-check': ShieldCheck, wind: Wind, maximize: Maximize,
        'check-circle': CheckCircle, sun: Sun, droplet: Droplet, star: Star, heart: Heart,
        zap: Zap, camera: Camera, smartphone: Smartphone, watch: Watch, layers: Layers,
        box: Box, tag: Tag, 'shopping-bag': ShoppingBag, truck: Truck, 'credit-card': CreditCard
    };
    const IconComponent = icons[iconName] || CheckCircle;
    const svgString = renderToStaticMarkup(React.createElement(IconComponent, { size: 64, color: "#333" }));
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};
