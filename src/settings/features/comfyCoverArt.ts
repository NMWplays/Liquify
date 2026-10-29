import { readLS, readNum, updateStyle } from '../shared';
import { PLAYBAR_COVER_BORDER_RADIUS_KEY, PLAYBAR_COVER_SLOT, applyPlaybarCoverBorderRadius } from './playbarCoverRadius';

export const CCA_ENABLED_KEY = "liquify-comfy-cover-enabled";
export const CCA_WIDTH_KEY = "liquify-comfy-cover-width";
export const CCA_HEIGHT_KEY = "liquify-comfy-cover-height";
export const CCA_MARGIN_BOTTOM_KEY = "liquify-comfy-cover-mb";
export const CCA_MARGIN_LEFT_KEY = "liquify-comfy-cover-ml";

export const CCA_DEFAULTS = {
  enabled: "show",
  width: 90,
  height: 90,
  marginBottom: 35,
  marginLeft: 0,
};

const SMALL_COVER = /\/image\/ab67616d0000(?:4851|11eb)/i;
const COVER_300 = '/image/ab67616d00001e02';
const COVER_640 = '/image/ab67616d0000b273';

function sharpenPlaybarCover(): void {
  const img = document.querySelector(`${PLAYBAR_COVER_SLOT} img`) as HTMLImageElement | null;
  if (!img || !SMALL_COVER.test(img.src)) return;
  const needed = img.getBoundingClientRect().width * devicePixelRatio;
  img.src = img.src.replace(SMALL_COVER, needed > 300 ? COVER_640 : COVER_300);
}

export function installSharpPlaybarCover(): void {
  (window as any).SpotiKit?.Player?.on?.('track', () => {
    for (const delay of [0, 120, 400, 1000]) setTimeout(sharpenPlaybarCover, delay);
  });
  setInterval(sharpenPlaybarCover, 2000);
  sharpenPlaybarCover();
}

export function applyComfyCoverArt(setDefaultRadius = true) {
  const enabled = readLS(CCA_ENABLED_KEY, CCA_DEFAULTS.enabled);
  if (enabled === "hide") {
    updateStyle("liquify-comfy-cover-art", "");
    if (setDefaultRadius) {
      localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, "12");
      applyPlaybarCoverBorderRadius(12);
      window.dispatchEvent(new Event("liquifyPlaybarCoverRadiusChange"));
    }
    return;
  }
  if (setDefaultRadius) {
    localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, "20");
    applyPlaybarCoverBorderRadius(20);
    window.dispatchEvent(new Event("liquifyPlaybarCoverRadiusChange"));
  }
  const w = readNum(CCA_WIDTH_KEY, CCA_DEFAULTS.width);
  const h = readNum(CCA_HEIGHT_KEY, CCA_DEFAULTS.height);
  const mb = readNum(CCA_MARGIN_BOTTOM_KEY, CCA_DEFAULTS.marginBottom);
  const ml = readNum(CCA_MARGIN_LEFT_KEY, CCA_DEFAULTS.marginLeft);
  // Lifted by an offset, not a margin: a margin pushed the widget out of the window.
  const css = `
    ${PLAYBAR_COVER_SLOT} {
      width: ${w}px !important;
      height: ${h}px !important;
      flex-shrink: 0;
      position: relative;
      top: ${-mb / 2}px;
      margin-left: ${ml}px !important;
    }
    ${PLAYBAR_COVER_SLOT} :is(div, button, img, video) {
      width: 100% !important;
      height: 100% !important;
      max-width: none;
      max-height: none;
    }
    ${PLAYBAR_COVER_SLOT} :is(img, video) {
      object-fit: cover;
    }
  `;
  updateStyle("liquify-comfy-cover-art", css);
}
