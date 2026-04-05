// utils/convertToWebP.ts
// Single image conversion utility — all image processing goes through here.

export type ImagePreset = 'profile' | 'recipe';

interface ConvertOptions {
  preset: ImagePreset;
}

export interface ConvertResult {
  blob: Blob;
  width: number;
  height: number;
}

interface PresetConfig {
  maxDimension: number;
  quality: number;
}

const PRESET_CONFIGS: Record<ImagePreset, PresetConfig> = {
  profile: { maxDimension: 400, quality: 0.80 },
  recipe: { maxDimension: 1200, quality: 0.82 },
};

// Module-level cache — supportsWebP is computed once per session.
let webPSupported: boolean | null = null;

export function supportsWebP(): boolean {
  if (webPSupported !== null) return webPSupported;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  webPSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  return webPSupported;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function calculateDimensions(
  w: number,
  h: number,
  max: number
): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      type,
      quality
    );
  });
}

export async function convertToWebP(
  file: File,
  options: ConvertOptions
): Promise<ConvertResult> {
  const { maxDimension, quality } = PRESET_CONFIGS[options.preset];
  const mimeType = supportsWebP() ? 'image/webp' : 'image/png';
  const objectUrl = URL.createObjectURL(file);
  const canvas = document.createElement('canvas');

  try {
    const img = await loadImage(objectUrl);
    const { width, height } = calculateDimensions(
      img.naturalWidth,
      img.naturalHeight,
      maxDimension
    );
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D canvas context');
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await toBlob(canvas, mimeType, quality);
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
    canvas.width = 0;
    canvas.height = 0;
  }
}
