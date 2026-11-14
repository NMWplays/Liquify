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
  const ease = "0.4s cubic-bezier(0.2, 0.8, 0.2, 1)";
  const css = themed
    ? `:root ${ACTIVE_LINE} { font-size: ${size}%; }\n` +
      `:root ${LINES_ROOT} ${ACTIVE_LINE} { transform-origin: center; animation: liquify-lyric-grow ${ease}; }\n` +
      `:root ${LINES_ROOT} ${LINE}--past:has(+ ${ACTIVE_LINE}) { transform-origin: center; animation: liquify-lyric-shrink ${ease}; }\n` +
      `@keyframes liquify-lyric-grow { from { transform: scale(${(100 / size).toFixed(3)}); } to { transform: none; } }\n` +
      `@keyframes liquify-lyric-shrink { from { transform: scale(${(size / 100).toFixed(3)}); } to { transform: none; } }\n` +
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
