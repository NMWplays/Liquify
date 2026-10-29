import { readNum, updateStyle } from '../shared';
import { isProgressBarCompat } from './progressBarHeight';

export const PROGRESS_BAR_RADIUS_KEY = "liquify-progress-bar-radius";
export const PROGRESS_BAR_RADIUS_DEFAULT = 10;

function applyCss(px: number) {
  updateStyle(
    "liquify-progress-bar-radius",
    isProgressBarCompat()
      ? ""
      : `.progress-bar-root { --progress-bar-radius: ${px}px !important; }`
  );
}

export function setProgressBarRadius(px: number) {
  localStorage.setItem(PROGRESS_BAR_RADIUS_KEY, String(px));
  applyCss(px);
}

export function ensureProgressBarRadiusApplied() {
  applyCss(readNum(PROGRESS_BAR_RADIUS_KEY, PROGRESS_BAR_RADIUS_DEFAULT));
}
