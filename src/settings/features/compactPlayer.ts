import { updateStyle } from '../shared';
import { PLAYER_BAR } from './player';
import { PLAYBAR_COVER_SLOT } from './playbarCoverRadius';

const STYLE_ID = "liquify-compact-player-style";

function updateCss(enabled: boolean) {
  const css = enabled
    ? [
        `${PLAYER_BAR} { height: 65px !important; border-radius: 20px !important; }`,
        ".now-playing-bar, .now-playing-bar-row { height: 50px !important; }",
        ".now-playing-bar-center { width: 60% !important; }",
        '[data-testid="player-controls"] { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 0px !important; margin-left: 15px !important; }',
        ".player-controls-buttons { width: fit-content !important; margin-bottom: 0px !important; }",
        '[data-testid="player-controls"] .playback-bar { flex: 1 1 auto; min-width: 0; }',
        ".now-playing-quality-wrapper { display: none !important; }",
        `:root ${PLAYBAR_COVER_SLOT} { width: 42px; height: 42px; }`,
        `:root ${PLAYBAR_COVER_SLOT} :is(div, button, img, video) { width: 100% !important; height: 100% !important; }`,
      ].join("\n")
    : "";
  updateStyle(STYLE_ID, css);
}

export function applyCompactPlayer(mode: string) {
  const m = mode === "on" ? "on" : "off";
  localStorage.setItem("liquify-compact-player", m);
  updateCss(m === "on");
}

export function applySavedCompactPlayer() {
  updateCss((localStorage.getItem("liquify-compact-player") || "off") === "on");
}
