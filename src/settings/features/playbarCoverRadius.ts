import { readLS, readNum, updateStyle } from '../shared';

export const PLAYBAR_COVER_BORDER_RADIUS_KEY = "liquify-playbar-cover-border-radius";
export const PLAYBAR_COVER_DEFAULTS = { borderRadius: 12 };
const LEGACY_PLAYBAR_COVER_DEFAULT_RADIUS = 8;

export const PLAYBAR_COVER_SLOT = '.now-playing-widget-v2-cover';
export const PLAYBAR_COVER_BUTTON = '.now-playing-cover-art-button';

export function applyPlaybarCoverBorderRadius(px: number) {
  const css = `
    ${PLAYBAR_COVER_SLOT},
    ${PLAYBAR_COVER_SLOT} ${PLAYBAR_COVER_BUTTON} { border-radius: ${px}px !important; }
  `;
  updateStyle("liquify-playbar-cover-radius", css);
  localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, String(px));
}

export function ensurePlaybarCoverBorderRadiusApplied() {
  const comfyEnabled = readLS("liquify-comfy-cover-enabled", "show");
  let saved = readNum(PLAYBAR_COVER_BORDER_RADIUS_KEY, comfyEnabled === "show" ? 20 : PLAYBAR_COVER_DEFAULTS.borderRadius);
  if (comfyEnabled === "hide" && saved === LEGACY_PLAYBAR_COVER_DEFAULT_RADIUS) {
    saved = PLAYBAR_COVER_DEFAULTS.borderRadius;
    localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, String(saved));
  }
  applyPlaybarCoverBorderRadius(saved);
}
