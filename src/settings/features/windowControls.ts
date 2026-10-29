import { readLS } from '../shared';

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
