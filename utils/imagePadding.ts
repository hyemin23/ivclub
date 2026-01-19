/**
 * Adds vertical padding to an image (Top Padding).
 * Concept: Extend canvas height -> Place original image at the BOTTOM.
 * This implies the padding is added to the TOP.
 * 
 * @param base64Str - Original Image Base64
 * @param paddingRatio - Ratio of padding to add relative to height (e.g., 0.5 for 50% more height)
 * @returns Promise<string> - Padded Image Base64
 */
export const addVerticalPadding = async (base64Str: string, paddingRatio: number = 0.5): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      const newHeight = originalHeight * (1 + paddingRatio);
      
      canvas.width = originalWidth;
      canvas.height = newHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Fill with white background (or transparent? User suggested White implies empty space)
      // Usually white is safer for "empty studio", but let's stick to white or clear.
      // User said: "Empty space (white background)".
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image at the BOTTOM
      // y = newHeight - originalHeight
      ctx.drawImage(img, 0, newHeight - originalHeight);

      // Return as base64
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (e) => reject(e);
  });
};

/**
 * Crops the padding back to original dimensions.
 * Assumption: The interesting part is at the BOTTOM.
 * 
 * @param base64Str - Padded Result Image Base64
 * @param originalWidth - Original Width to restore
 * @param originalHeight - Original Height to restore
 * @returns Promise<string> - Cropped Image Base64
 */
export const cropVerticalPadding = async (base64Str: string, originalWidth: number, originalHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // The image we have is TALLER. The content we want is at the BOTTOM.
      // Source Y start = img.height - originalHeight
      const sourceY = img.height - originalHeight;

      ctx.drawImage(
        img, 
        0, sourceY, originalWidth, originalHeight, // Source
        0, 0, originalWidth, originalHeight        // Destination
      );

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (e) => reject(e);
  });
};
