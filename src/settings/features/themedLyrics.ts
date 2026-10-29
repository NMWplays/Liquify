import { readLS, readNum, updateStyle } from '../shared';

export const THEMED_LYRICS_KEY = "liquify-themed-lyrics";
export const LYRICS_FONT_SIZE_KEY = "liquify-lyrics-font-size-pct";
export const LYRICS_FONT_SIZE_DEFAULT = 130;
export const LYRICS_MARGIN_KEY = "liquify-lyrics-margin";
export const LYRICS_MARGIN_DEFAULT = 56;

const LINE = ".lyrics-line";
const ACTIVE_LINE = `${LINE}.lyrics-line--active`;
const EMPTY_LINE = ".lyrics-line--empty";
const LINES_ROOT = ".lyrics-view-lines";

function applyCss() {
  const themed = readLS(THEMED_LYRICS_KEY, "on") === "on";
  const size = readNum(LYRICS_FONT_SIZE_KEY, LYRICS_FONT_SIZE_DEFAULT);
  const margin = readNum(LYRICS_MARGIN_KEY, LYRICS_MARGIN_DEFAULT);
  // Animated, not transitioned: Spotify remounts the lines. Page only, the sidebar card lagged.
  const ease = "0.4s cubic-bezier(0.2, 0.8, 0.2, 1)";
  const css = themed
    ? `:root ${ACTIVE_LINE} { font-size: ${size}%; }\n` +
      `:root ${LINES_ROOT} ${ACTIVE_LINE} { animation: liquify-lyric-grow ${ease}; }\n` +
      `:root ${LINES_ROOT} ${LINE}--past:has(+ ${ACTIVE_LINE}) { animation: liquify-lyric-shrink ${ease}; }\n` +
      `@keyframes liquify-lyric-grow { from { font-size: 100%; } to { font-size: ${size}%; } }\n` +
      `@keyframes liquify-lyric-shrink { from { font-size: ${size}%; } to { font-size: 100%; } }\n` +
      `${LINES_ROOT} ${LINE}:not(${EMPTY_LINE}) { margin-bottom: ${margin}px; }`
    : "";
  updateStyle("liquify-themed-lyrics", css);
}

export function setThemedLyrics(on: boolean) {
  localStorage.setItem(THEMED_LYRICS_KEY, on ? "on" : "off");
  applyCss();
}

export function setLyricsFontSize(pct: number) {
  localStorage.setItem(LYRICS_FONT_SIZE_KEY, String(pct));
  applyCss();
}

export function setLyricsMargin(px: number) {
  localStorage.setItem(LYRICS_MARGIN_KEY, String(px));
  applyCss();
}

export function ensureThemedLyricsApplied() {
  applyCss();
}
