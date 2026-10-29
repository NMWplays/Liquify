import { readNum, updateStyle } from '../shared';

export const GLASS_BLUR_KEY = "liquify-glass-blur";
export const BACKDROP_BLUR_KEY = "liquify-backdrop-blur";
export const GLASS_BLUR_DEFAULT = 2;
export const BACKDROP_BLUR_DEFAULT = 32;

function applyCss() {
  const glass = readNum(GLASS_BLUR_KEY, GLASS_BLUR_DEFAULT);
  const backdrop = readNum(BACKDROP_BLUR_KEY, BACKDROP_BLUR_DEFAULT);
  updateStyle(
    "liquify-glass-blur",
    `:root {` +
      ` --liquify-glass-blur: ${glass}px !important;` +
      ` --liquify-backdrop-blur: ${backdrop}px !important;` +
      ` }`
  );
}

export function setGlassBlur(px: number) {
  localStorage.setItem(GLASS_BLUR_KEY, String(px));
  applyCss();
}

export function setBackdropBlur(px: number) {
  localStorage.setItem(BACKDROP_BLUR_KEY, String(px));
  applyCss();
}

export function ensureGlassBlurApplied() {
  applyCss();
}
