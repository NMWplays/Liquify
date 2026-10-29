import { clamp } from '../shared';
import { Oklab, Rgb, fromOklab, parseColor, toOklab } from './color';

type Bucket = { weight: number; l: number; a: number; b: number };

const SAMPLE_SIZE = 40;
const HUE_BUCKETS = 30;
const MIN_ALPHA = 128;
const MIN_VIVID_SHARE = 0.001;
const PALETTE_KEYS = ['raw', 'light', 'dark'];

export async function sampleImageColor(url: string): Promise<Rgb | null> {
  const bitmap = await loadBitmap(url);
  const pixels = bitmap ? readPixels(bitmap) : null;
  return pixels ? dominantColor(pixels) : null;
}

export async function paletteColor(trackUri: string | null | undefined): Promise<Rgb | null> {
  if (!trackUri) return null;
  try {
    const palette: any = await SpotiKit.Colors?.extract?.(trackUri);
    for (const key of PALETTE_KEYS) {
      const color = typeof palette?.[key] === 'string' ? parseColor(palette[key]) : null;
      if (color) return color;
    }
  } catch {}
  return null;
}

async function loadBitmap(url: string): Promise<ImageBitmap | null> {
  const options: ImageBitmapOptions = {
    resizeWidth: SAMPLE_SIZE,
    resizeHeight: SAMPLE_SIZE,
    resizeQuality: 'medium',
  };
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (response.ok) return await createImageBitmap(await response.blob(), options);
  } catch {}
  const image = await loadImage(url);
  if (!image) return null;
  try {
    return await createImageBitmap(image, options);
  } catch {
    return null;
  }
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function readPixels(bitmap: ImageBitmap): Uint8ClampedArray | null {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  try {
    return context.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    return null;
  }
}

function dominantColor(pixels: Uint8ClampedArray): Rgb {
  const hues = Array.from({ length: HUE_BUCKETS }, emptyBucket);
  const overall = emptyBucket();

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < MIN_ALPHA) continue;
    const lab = toOklab([pixels[i], pixels[i + 1], pixels[i + 2]]);
    addTo(overall, 1, lab);

    const chroma = Math.hypot(lab[1], lab[2]);
    const weight = chroma * chroma * toneWeight(lab[0]);
    if (weight > 0) addTo(hues[hueIndex(lab)], weight, lab);
  }

  const vivid = strongestHue(hues);
  const isVivid = vivid.weight > overall.weight * MIN_VIVID_SHARE;
  return fromOklab(meanOf(isVivid ? vivid : overall));
}

function strongestHue(hues: Bucket[]): Bucket {
  let strongest = emptyBucket();
  for (let index = 0; index < HUE_BUCKETS; index++) {
    const neighbourhood = [-1, 0, 1]
      .map((offset) => hues[(index + offset + HUE_BUCKETS) % HUE_BUCKETS])
      .reduce(merge, emptyBucket());
    if (neighbourhood.weight > strongest.weight) strongest = neighbourhood;
  }
  return strongest;
}

function toneWeight(lightness: number): number {
  return clamp(1 - Math.abs(lightness - 0.65) / 0.45, 0, 1);
}

function hueIndex([, a, b]: Oklab): number {
  const turn = (Math.atan2(b, a) / (2 * Math.PI) + 1) % 1;
  return Math.min(HUE_BUCKETS - 1, Math.floor(turn * HUE_BUCKETS));
}

function emptyBucket(): Bucket {
  return { weight: 0, l: 0, a: 0, b: 0 };
}

function addTo(bucket: Bucket, weight: number, [l, a, b]: Oklab): void {
  bucket.weight += weight;
  bucket.l += l * weight;
  bucket.a += a * weight;
  bucket.b += b * weight;
}

function merge(total: Bucket, bucket: Bucket): Bucket {
  return {
    weight: total.weight + bucket.weight,
    l: total.l + bucket.l,
    a: total.a + bucket.a,
    b: total.b + bucket.b,
  };
}

function meanOf(bucket: Bucket): Oklab {
  const weight = bucket.weight || 1;
  return [bucket.l / weight, bucket.a / weight, bucket.b / weight];
}
