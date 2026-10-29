import { readNum } from '../shared';
import { discFurniture, isVinylOn, VINYL_SPEED_DEFAULT, VINYL_SPEED_KEY } from './vinylCoverArt';
import { PLAYING_CLASS, onPlayStateChange, watchPlayPresses } from './playState';

const STYLE_ID = 'liquify-mini-player-style';
const INSTALLED_KEY = 'liquifyMiniPlayerInstalled';

const RADIUS = 20;

const COVER_SELECTORS = [
  '[data-testid="document-pip-cover-art-animation-container"] img',
  '.E6aAqvl6gGgGLteK',
];

const cover = (prefix = ''): string => COVER_SELECTORS.map((s) => prefix + s).join(', ');

const DISC = '[data-testid="document-pip-cover-art-animation-container"] > div';

function miniPlayerCss(): string {
  if (!isVinylOn('miniPlayer')) {
    return `${cover()} { border-radius: ${RADIUS}px !important; }`;
  }

  const spin = Math.max(1, readNum(VINYL_SPEED_KEY, VINYL_SPEED_DEFAULT));
  return `
${cover()} {
  border-radius: 50% !important;
  animation: liquify-vinyl-spin ${spin}s linear infinite;
  animation-play-state: paused;
}
${cover(`html.${PLAYING_CLASS} `)} { animation-play-state: running; }

${discFurniture(DISC)}

${DISC}::before,
${DISC}::after {
  inset: auto;
  top: 50%;
  left: 50%;
  height: 100%;
  width: auto;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
}

@keyframes liquify-vinyl-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  ${cover()} { animation: none !important; }
}`;
}

function pipWindow(): Window | null {
  return (window as any).documentPictureInPicture?.window ?? null;
}

function applyToWindow(win: Window): void {
  const doc = win.document;
  if (!doc?.head) return;

  let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.id = STYLE_ID;
    doc.head.appendChild(style);
  }
  const css = miniPlayerCss();
  if (style.textContent !== css) style.textContent = css;

  const root = getComputedStyle(document.documentElement);
  for (const name of ['--liquify-accent', '--accent-color']) {
    const value = root.getPropertyValue(name).trim();
    if (value) doc.documentElement.style.setProperty(name, value);
  }

  doc.documentElement.classList.toggle(
    PLAYING_CLASS,
    document.documentElement.classList.contains(PLAYING_CLASS),
  );
  watchPlayPresses(doc);
}

export function refreshMiniPlayer(): void {
  const win = pipWindow();
  if (win) applyToWindow(win);
}

export function installMiniPlayer(): void {
  const anyWin = window as any;
  if (anyWin[INSTALLED_KEY]) {
    refreshMiniPlayer();
    return;
  }
  const pip = anyWin.documentPictureInPicture;
  if (!pip?.addEventListener) return;
  anyWin[INSTALLED_KEY] = true;

  onPlayStateChange((playing) => {
    pipWindow()?.document.documentElement.classList.toggle(PLAYING_CLASS, playing);
  });

  pip.addEventListener('enter', (event: any) => {
    const win: Window | null = event.window ?? pipWindow();
    if (!win) return;
    applyToWindow(win);
    const tick = win.setInterval(() => {
      if (!pipWindow()) {
        win.clearInterval(tick);
        return;
      }
      applyToWindow(win);
    }, 1000);
  });

  refreshMiniPlayer();
}
