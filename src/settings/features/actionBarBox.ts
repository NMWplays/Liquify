import { updateStyle } from '../shared';

const STYLE_ID = "liquify-action-bar-box-style";

const ACTION_BAR = ".action-bar";

function updateActionBarBoxCss(show: boolean) {
  const css = show
    ? ""
    : `${ACTION_BAR} { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }`;
  updateStyle(STYLE_ID, css);
}

export function applyActionBarBox(mode: string) {
  const m = mode === "show" ? "show" : "hide";
  localStorage.setItem("liquify-action-bar-box-mode", m);
  updateActionBarBoxCss(m === "show");
}

export function applySavedActionBarBox() {
  const saved = localStorage.getItem("liquify-action-bar-box-mode") || "show";
  updateActionBarBoxCss(saved === "show");
}
