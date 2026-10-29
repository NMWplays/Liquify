import { clamp } from '../shared';

export type Rgb = [number, number, number];
export type Oklab = [number, number, number];
type Oklch = { l: number; c: number; h: number };

export function parseColor(value: string): Rgb | null {
  const text = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].replace(/./g, '$&$&') : hex[1];
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)) as Rgb;
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

export function toCss([r, g, b]: Rgb): string {
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

export function readableTextOn(color: Rgb): string {
  const luminance = relativeLuminance(color);
  const againstBlack = (luminance + 0.05) / 0.05;
  const againstWhite = 1.05 / (luminance + 0.05);
  return againstBlack >= againstWhite ? '#000' : '#fff';
}

export function harmonize(color: Rgb, saturation: number, lightness: number): Rgb {
  const { l, c, h } = toOklch(color);
  const chroma = c < 0.035 ? c : clamp(c * 1.15, 0.1, 0.2);
  const tone = clamp(0.7 + (l - 0.6) * 0.3, 0.6, 0.8);
  return fromOklch({
    l: clamp(tone * lightness, 0.15, 0.97),
    c: clamp(chroma * saturation, 0, 0.37),
    h,
  });
}

export function toOklab([r, g, b]: Rgb): Oklab {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function fromOklab([l, a, b]: Oklab): Rgb {
  return fromOklch({ l, c: Math.hypot(a, b), h: Math.atan2(b, a) });
}

function toOklch(color: Rgb): Oklch {
  const [l, a, b] = toOklab(color);
  return { l, c: Math.hypot(a, b), h: Math.atan2(b, a) };
}

function fromOklch({ l, c, h }: Oklch): Rgb {
  let low = 0;
  let high = c;
  let linear = oklchToLinear(l, high, h);
  if (!inGamut(linear)) {
    for (let step = 0; step < 16; step++) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinear(l, mid, h))) low = mid;
      else high = mid;
    }
    linear = oklchToLinear(l, low, h);
  }
  return linear.map((channel) => fromLinear(clamp(channel, 0, 1))) as Rgb;
}

function oklchToLinear(lightness: number, chroma: number, hue: number): Rgb {
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inGamut(linear: Rgb): boolean {
  return linear.every((channel) => channel >= -0.0001 && channel <= 1.0001);
}

function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function toLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function fromLinear(value: number): number {
  return 255 * (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055);
}
