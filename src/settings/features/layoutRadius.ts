import { readNum, updateStyle } from '../shared';

export const NAV_RADIUS_KEY = "liquify-nav-radius";
export const MAIN_RADIUS_KEY = "liquify-main-radius";
export const RIGHT_RADIUS_KEY = "liquify-right-radius";
export const LAYOUT_RADIUS_DEFAULTS = { nav: 20, main: 20, right: 20 };

function applyLayoutRadiusCss() {
  const nav = readNum(NAV_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.nav);
  const main = readNum(MAIN_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.main);
  const right = readNum(RIGHT_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.right);
  updateStyle(
    "liquify-layout-radius",
    `:root { --liquify-nav-radius: ${nav}px; --liquify-main-radius: ${main}px; --liquify-right-radius: ${right}px; }`
  );
}

export function setNavRadius(px: number) {
  localStorage.setItem(NAV_RADIUS_KEY, String(px));
  applyLayoutRadiusCss();
}

export function setMainRadius(px: number) {
  localStorage.setItem(MAIN_RADIUS_KEY, String(px));
  applyLayoutRadiusCss();
}

export function setRightRadius(px: number) {
  localStorage.setItem(RIGHT_RADIUS_KEY, String(px));
  applyLayoutRadiusCss();
}

export function ensureLayoutRadiusApplied() {
  applyLayoutRadiusCss();
}
