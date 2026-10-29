import { updateStyle } from '../shared';

const STYLE_ID = "liquify-playlist-header-style";

const HEADER = ".entity-header";

function updatePlaylistHeaderCss(show: boolean) {
  const css = show
    ? ""
    : `${HEADER} { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }`;
  updateStyle(STYLE_ID, css);
}

export function applyPlaylistHeader(mode: string) {
  const m = mode === "show" ? "show" : "hide";
  localStorage.setItem("liquify-playlist-header-mode", m);
  updatePlaylistHeaderCss(m === "show");
}

export function applySavedPlaylistHeader() {
  const saved = localStorage.getItem("liquify-playlist-header-mode") || "show";
  updatePlaylistHeaderCss(saved === "show");
}