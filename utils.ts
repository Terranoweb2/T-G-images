
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Return only the base64 part, without the data URL prefix
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as Base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const applyMirror = (base64Image: string, mimeType: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = `data:${mimeType};base64,${base64Image}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject('Could not get canvas context');
            }
            // Flip the context horizontally
            ctx.translate(img.width, 0);
            ctx.scale(-1, 1);
            // Draw the image
            ctx.drawImage(img, 0, 0);
            // Get the mirrored image as a data URL and extract base64
            resolve(canvas.toDataURL(mimeType).split(',')[1]);
        };
        img.onerror = (error) => reject(error);
    });
};
