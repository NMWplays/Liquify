import { readLS, readNum, updateStyle } from '../shared';

export const LYRICS_CARD_SHOW_KEY = 'liquify-lyrics-card';
export const LYRICS_CARD_HEIGHT_MODE_KEY = 'liquify-lyrics-card-height-mode';
export const LYRICS_CARD_HEIGHT_KEY = 'liquify-lyrics-card-height';
export const LYRICS_CARD_HEIGHT_DEFAULT = 440;
export const LYRICS_CARD_HEIGHT_MIN = 150;
export const LYRICS_CARD_HEIGHT_MAX = 1500;

export type LyricsCardHeightMode = 'default' | 'custom' | 'fit';

const CARD = '.npv-lyrics-card';
const SIZED = `${CARD}:is(.npv-lyrics-card--preview, .npv-lyrics-card--expanded)`;
const EXPANDED = `${CARD}.npv-lyrics-card--expanded`;
const FIT_VAR = '--liquify-lyrics-card-fit';
const BOTTOM_GAP = 16;

let fitTimer = 0;
let observer: ResizeObserver | null = null;
let watched: Element | null = null;

function scrollerOf(el: Element): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === 'auto' || overflow === 'scroll') return node;
  }
  return null;
}

function measure(): void {
  const card = document.querySelector(CARD);
  const scroller = card && scrollerOf(card);
  if (!card || !scroller) return;
  const top = card.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  const height = Math.max(LYRICS_CARD_HEIGHT_MIN, Math.floor(scroller.clientHeight - top - BOTTOM_GAP));
  const value = `${height}px`;
  if (document.documentElement.style.getPropertyValue(FIT_VAR) !== value) {
    document.documentElement.style.setProperty(FIT_VAR, value);
  }
  if (watched !== scroller) {
    observer?.disconnect();
    observer = new ResizeObserver(measure);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    watched = scroller;
  }
}

function startFit(): void {
  if (fitTimer) return;
  fitTimer = window.setInterval(measure, 1000);
  window.addEventListener('resize', measure);
  measure();
}

function stopFit(): void {
  if (!fitTimer) return;
  clearInterval(fitTimer);
  fitTimer = 0;
  window.removeEventListener('resize', measure);
  observer?.disconnect();
  observer = null;
  watched = null;
  document.documentElement.style.removeProperty(FIT_VAR);
}

export function getLyricsCardHeightMode(): LyricsCardHeightMode {
  const mode = readLS(LYRICS_CARD_HEIGHT_MODE_KEY, 'fit');
  return mode === 'custom' || mode === 'default' ? mode : 'fit';
}

function apply(): void {
  const show = readLS(LYRICS_CARD_SHOW_KEY, 'on') === 'on';
  const mode = getLyricsCardHeightMode();
  let css = '';
  if (!show) css = `${CARD} { display: none !important; }`;
  else if (mode === 'custom') css = `:root ${SIZED} { max-height: ${readNum(LYRICS_CARD_HEIGHT_KEY, LYRICS_CARD_HEIGHT_DEFAULT)}px; }`;
  else if (mode === 'fit') css = `:root ${EXPANDED} { max-height: var(${FIT_VAR}, ${LYRICS_CARD_HEIGHT_DEFAULT}px); }`;
  updateStyle('liquify-lyrics-card', css);
  if (show && mode === 'fit') startFit();
  else stopFit();
}

export function setLyricsCardShown(on: boolean): void {
  localStorage.setItem(LYRICS_CARD_SHOW_KEY, on ? 'on' : 'off');
  apply();
}

export function setLyricsCardHeightMode(mode: LyricsCardHeightMode): void {
  localStorage.setItem(LYRICS_CARD_HEIGHT_MODE_KEY, mode);
  apply();
}

export function setLyricsCardHeight(px: number): void {
  localStorage.setItem(LYRICS_CARD_HEIGHT_KEY, String(px));
  apply();
}

export function ensureLyricsCardApplied(): void {
  apply();
}
