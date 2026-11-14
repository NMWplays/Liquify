import { readLS } from '../shared';

const VISIBLE_CLASS = 'liquify-wc-visible';
let watched: Element | null = null;
let observer: MutationObserver | null = null;

function syncVisible(): void {
  const controls = document.querySelector('.spotikit-window-controls');
  if (controls !== watched) {
    observer?.disconnect();
    watched = controls;
    if (controls) {
      observer = new MutationObserver(syncVisible);
      observer.observe(controls, { attributes: true, attributeFilter: ['hidden'] });
    }
  }
  const visible = !!controls && !(controls as HTMLElement).hidden;
  document.documentElement.classList.toggle(VISIBLE_CLASS, visible);
}

export function installWindowControlsWatch(): void {
  syncVisible();
  window.setInterval(syncVisible, 1000);
}

export const WINDOW_CONTROLS_KEY = 'liquify-window-controls';
const WINDOWS_CLASS = 'liquify-windows-controls';

export function applyWindowControls(style: string): void {
  const windows = style === 'windows';
  localStorage.setItem(WINDOW_CONTROLS_KEY, windows ? 'windows' : 'macos');
  document.documentElement.classList.toggle(WINDOWS_CLASS, windows);
}

export function ensureWindowControlsApplied(): void {
  applyWindowControls(readLS(WINDOW_CONTROLS_KEY, 'macos'));
}
