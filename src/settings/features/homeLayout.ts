import { updateStyle } from '../shared';

const STYLE_ID = "liquify-home-layout-style";
export const HOME_LAYOUT_KEY = "liquify-home-layout";

const HOME_SECTIONS = ".home-page-content > section, .shelf";

function updateHomeLayoutCss(on: boolean) {
  const css = on
    ? `:is(${HOME_SECTIONS}) { padding: 16px; margin-bottom: 16px; box-shadow: var(--liquify-shadow); border-radius: 20px; }` +
      `:is(${HOME_SECTIONS}) .component-shelf-carousel { --shelf-carousel-margin-start-mul: 0; --shelf-carousel-margin-end-mul: 0; }` +
      ".contentSpacing > .grid-container:has(+ .shelf) { margin-bottom: 16px; }"
    : `:is(${HOME_SECTIONS}) { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`;
  updateStyle(STYLE_ID, css);
}

export function applyHomeLayout(mode: string) {
  const m = mode === "on" ? "on" : "off";
  localStorage.setItem(HOME_LAYOUT_KEY, m);
  updateHomeLayoutCss(m === "on");
}

export function applySavedHomeLayout() {
  const saved = localStorage.getItem(HOME_LAYOUT_KEY) || "on";
  updateHomeLayoutCss(saved === "on");
}
