import { readLS, readNum, updateStyle } from '../shared';

export const PROGRESS_BAR_HEIGHT_KEY = "liquify-progress-bar-height";
export const PROGRESS_BAR_HEIGHT_DEFAULT = 6;

export const PROGRESS_BAR_COMPAT_KEY = "liquify-progress-bar-compat";

export function isProgressBarCompat(): boolean {
  return readLS(PROGRESS_BAR_COMPAT_KEY, "off") === "on";
}

function applyCss(px: number) {
  updateStyle(
    "liquify-progress-bar-height",
    isProgressBarCompat()
      ? ""
      : `.progress-bar-root { --progress-bar-height: ${px}px !important; }`
  );
}

export function setProgressBarHeight(px: number) {
  localStorage.setItem(PROGRESS_BAR_HEIGHT_KEY, String(px));
  applyCss(px);
}

export function ensureProgressBarHeightApplied() {
  applyCss(readNum(PROGRESS_BAR_HEIGHT_KEY, PROGRESS_BAR_HEIGHT_DEFAULT));
}

export function setProgressBarCompat(enabled: boolean, reapplyRadius: () => void) {
  localStorage.setItem(PROGRESS_BAR_COMPAT_KEY, enabled ? "on" : "off");
  ensureProgressBarHeightApplied();
  reapplyRadius();
}
