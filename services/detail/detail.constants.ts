export const STYLE_PRESETS = [
    {
        id: 'single-flat',
        name: '단일 누끼컷',
        prompt: `[NanoBanana PRO MODE]
Analyze the uploaded product image carefully.
Create a clean flat cutout product image showing ONLY the main product itself.
The background must be pure white (#FFFFFF).
Maintain the exact colors, textures, materials, and silhouettes of the product.
No model, no mannequin, no shadows.
Professional e-commerce catalog look.`
    },
    {
        id: 'collage-detail',
        name: '디테일 콜라주',
        prompt: `[NanoBanana PRO MODE]
Create a sophisticated collage showing multiple close-up detail views of the product.
Focus on stitching, fabric texture, buttons, and unique design elements.
Maintain high color accuracy.
Arrange the views in a clean, modern grid or balanced composition.
High-end fashion editorial style.`
    },
    {
        id: 'lifestyle-context',
        name: '라이프스타일 배경',
        prompt: `[NanoBanana PRO MODE]
Place the product in a minimalist high-end lifestyle setting.
Soft natural shadows, professional studio lighting.
The background should be clean but have depth (e.g., stone, wood, or modern architecture).
Focus on the product as the center of attention.
Maintain realistic proportions and textures.`
    },
    {
        id: 'collage-4-private',
        name: '프라이빗 4분할 (보안)',
        prompt: `[NanoBanana PRO MODE - PRIVATE 4-GRID COLLAGE]
Create a strict 2x2 grid layout (4 panels) showing distinct close-up shots of the product.
The 4 panels must be arranged in a square 2x2 formation.

[CONTENT]
- Panel 1: Fabric texture extreme close-up
- Panel 2: Stitching or button detail
- Panel 3: Key design feature
- Panel 4: Another angle or material detail

[SECURITY & PRIVACY - CRITICAL]
REMOVE all brand labels, tags, logos, and text.
If a tag is visible, it must be BLANK or BLURRED.
Clean fabric texture without writing.
Do NOT include any legible text.

[NEGATIVE PROMPT]
text, brand name, logo, writing, letters on tag, 6 panel, 3x2 grid, too many shots, asymmetrical layout, watermark.`
    },
    {
        id: 'rose-cut',
        name: '🌹 장미컷 디테일',
        prompt: `[NanoBanana PRO MODE]
**SQUARE 1:1 ASPECT RATIO. WHITE BACKGROUND. HIGH-KEY FASHION PHOTOGRAPHY.**
Extreme macro close-up of the fabric texture.
The fabric is artfully twisted into a soft **SPIRAL SWIRL shape**.
Focus strictly on the weave, softness, and tactile quality.
Bright, clean, airy atmosphere.
**NEGATIVE:** dark, low light, gray background, entire pants shape, buttons, zippers, folded clothes, shadows, distorted aspect ratio.`
    }
];
