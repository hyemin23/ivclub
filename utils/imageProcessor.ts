
export const resizeImage = (base64Str: string, maxWidthHeight: number = 2048): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > height) {
                if (width > maxWidthHeight) {
                    height = Math.round((height * maxWidthHeight) / width);
                    width = maxWidthHeight;
                }
            } else {
                if (height > maxWidthHeight) {
                    width = Math.round((width * maxWidthHeight) / height);
                    height = maxWidthHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            // Return as base64 with moderate compression (0.85) to further reduce size without visible quality loss for AI input
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => {
            // If loading fails, return original
            resolve(base64Str);
        };
    });
};
