import { ARTIST_HEADER_IMAGE, updateStyle } from '../shared';
import { ensureArtistLibraryApplied, getArtistLibraryUrl, getLibraryUrl } from './backgroundLibrary';

export function applySavedBackground() {
  const mode = localStorage.getItem("liquify-bg-mode");
  const image = getLibraryUrl();
  const bgUrl = localStorage.getItem("liquify-bg-url");
  const root = document.querySelector(".app-layout") as HTMLElement | null;
  if (!root) return;
  if (mode === "custom" && image) root.style.setProperty("--image_url", `url("${image}")`);
  else if (mode === "url" && bgUrl) root.style.setProperty("--image_url", `url("${bgUrl}")`);
}

export function updateBackground() {
  const mode = localStorage.getItem("liquify-bg-mode") || "dynamic";
  const image = getLibraryUrl();
  const bgUrl = localStorage.getItem("liquify-bg-url");
  const root = document.querySelector(".app-layout") as HTMLElement | null;

  if (root) {
    if (mode === "custom" && image) {
      root.style.setProperty("--image_url", `url("${image}")`);
    } else if (mode === "url" && bgUrl) {
      root.style.setProperty("--image_url", `url("${bgUrl}")`);
    }
  }

  window.dispatchEvent(new Event("liquifyBackgroundChange"));
}

const ARTIST_BG_STYLE_ID = "liquify-artist-bg-style";

export function installArtistBackgroundController() {
  const STORAGE_KEY_MODE = "liquify-artist-bg-mode";
  const STORAGE_KEY_URL = "liquify-artist-bg-url";

  const getSavedMode = () => localStorage.getItem(STORAGE_KEY_MODE) || "theme";
  const setSavedMode = (mode: string) => localStorage.setItem(STORAGE_KEY_MODE, mode);

  function applyMode(mode: string) {
    const image =
      mode === "custom" ? getArtistLibraryUrl() :
      mode === "url" ? localStorage.getItem(STORAGE_KEY_URL) :
      null;

    let css = "";
    if (mode === "none") css = `${ARTIST_HEADER_IMAGE} { opacity: 0 !important; }`;
    else if (image) {
      css = `${ARTIST_HEADER_IMAGE} { background-image: url(${JSON.stringify(image)}) !important; background-position: center center !important; }`;
    }
    updateStyle(ARTIST_BG_STYLE_ID, css);
  }

  function applySavedModeIfArtist() {
    applyMode(getSavedMode());
  }

  window.addEventListener("liquifyArtistBackgroundChange", applySavedModeIfArtist);
  ensureArtistLibraryApplied();
  applySavedModeIfArtist();

  return {
    applyMode,
    applySavedModeIfArtist,
    setMode: (mode: string) => {
      setSavedMode(mode);
      applySavedModeIfArtist();
    }
  };
}
