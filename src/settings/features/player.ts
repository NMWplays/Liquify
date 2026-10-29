import { updateStyle } from '../shared';

export const PLAYER_WIDTH_MODE_KEY = "liquify-player-width";
export const PLAYER_CUSTOM_W_KEY = "liquify-player-custom-width";
export const PLAYER_CUSTOM_H_KEY = "liquify-player-custom-height";
const PLAYER_RADIUS_KEY = "liquify-player-radius";

export const DEFAULT_CUSTOM_WIDTH = 80;
export const DEFAULT_CUSTOM_HEIGHT = 88;
const DEFAULT_RADIUS = 30;

export const PLAYER_BAR = ".now-playing-bar-area";

const STYLE_ID = "liquify-player-style";

export function getPlayerElement() {
  return document.querySelector(PLAYER_BAR) as HTMLElement | null;
}

function applyPlayerCss() {
  const mode = localStorage.getItem(PLAYER_WIDTH_MODE_KEY) || "theme";
  const radius = parseInt(localStorage.getItem(PLAYER_RADIUS_KEY) || String(DEFAULT_RADIUS), 10);

  let size: string;
  if (mode === "default") {
    size = "width: 100%; margin: 0 auto 5px;";
  } else if (mode === "custom") {
    const w = parseFloat(localStorage.getItem(PLAYER_CUSTOM_W_KEY) || String(DEFAULT_CUSTOM_WIDTH));
    const h = parseInt(localStorage.getItem(PLAYER_CUSTOM_H_KEY) || String(DEFAULT_CUSTOM_HEIGHT), 10);
    size = `width: ${Number.isFinite(w) ? w : DEFAULT_CUSTOM_WIDTH}%; height: ${Number.isFinite(h) ? h : DEFAULT_CUSTOM_HEIGHT}px; margin: 0 auto 5px;`;
  } else {
    size = "width: 65%; margin: 0 auto 5px;";
  }

  updateStyle(
    STYLE_ID,
    `:root ${PLAYER_BAR} { ${size} border-radius: ${Number.isFinite(radius) ? radius : DEFAULT_RADIUS}px; ` +
      "display: flex; flex-direction: column; justify-content: center; " +
      "transition: width 0.45s cubic-bezier(0.32, 0.72, 0, 1), height 0.45s cubic-bezier(0.32, 0.72, 0, 1), margin 0.45s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.3s ease; }"
  );
}

export function applyPlayerWidth(mode: string) {
  localStorage.setItem(PLAYER_WIDTH_MODE_KEY, mode);
  applyPlayerCss();
}

export function applySavedPlayerWidth() {
  applyPlayerCss();
}

export function applyPlayerRadius(px: number) {
  localStorage.setItem(PLAYER_RADIUS_KEY, String(px));
  applyPlayerCss();
}

export function ensurePlayerApplied() {
  applyPlayerCss();
}
