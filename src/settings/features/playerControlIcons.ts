import { updateStyle } from '../shared';

export const PLAYER_ICONS_KEY = 'liquify-player-icons';

const STYLE_ID = 'liquify-player-control-icons-style';
const ICON = 'liquify-player-icon';
const PLAYING = 'is-playing';
const SKIPPING = 'is-skipping';
const OBSERVER_KEY = 'liquifyPlayerControlIconsObserver';
const PRESS_KEY = 'liquifyPlayerControlIconsPress';

const control = (id: string): string => `button[data-testid="control-button-${id}"]`;
const PLAY = control('playpause');
const BACK = control('skip-back');
const FORWARD = control('skip-forward');
const PLAYBAR = '.now-playing-bar';
const SHUFFLE = `${PLAYBAR} button[aria-label*="Shuffle"]`;
const REPEAT = `${PLAYBAR} ${control('repeat')}`;
const TRANSPORT_BUTTONS = [PLAY, BACK, FORWARD];
const TRANSPORT = TRANSPORT_BUTTONS.join(', ');
const SKIPS = `${BACK}, ${FORWARD}`;

const eachTransport = (suffix: string): string =>
  TRANSPORT_BUTTONS.map((selector) => selector + suffix).join(', ');

const SKIP_ROW = `<g class="${ICON}__nudge"><g class="${ICON}__row" fill="currentColor" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path class="${ICON}__in" d="M-6.4 5.6 1.6 12 -6.4 18.4Z"/><path d="M3.2 5.6 11.2 12 3.2 18.4Z"/><path class="${ICON}__out" d="M12.8 5.6 20.8 12 12.8 18.4Z"/></g></g>`;

const svg = (body: string): string =>
  `<svg class="${ICON}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;

const PLAY_SHAPE =
  `<g fill="currentColor" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">` +
  `<path class="${ICON}__a" d="M9.4 6.6 L13.5 9.3 L13.5 14.7 L9.4 17.4 Z"/>` +
  `<path class="${ICON}__b" d="M13.5 9.3 L17.6 12 L17.6 12 L13.5 14.7 Z"/></g>`;

const CONTROLS: Array<[selector: string, markup: string]> = [
  [PLAY, svg(PLAY_SHAPE)],
  [FORWARD, svg(SKIP_ROW)],
  [BACK, svg(`<g transform="translate(24 0) scale(-1 1)">${SKIP_ROW}</g>`)],
];

const SCALE_PLAY_BUTTON = `${PLAY} span[class*="button-icon-only--small"] {
  transform: scale(1.45) !important;
  transform-origin: center !important;
}`;

const BARE_PLAY_BUTTON = `${PLAY},
${PLAY}:hover,
${PLAY}:active,
${PLAY} [class*="button-primary__inner"],
${PLAY}:hover [class*="button-primary__inner"],
${PLAY}:active [class*="button-primary__inner"] {
  background: transparent !important;
  box-shadow: none !important;
}
${PLAY} [class*="button-primary__inner"]::after { display: none !important; }`;

const ACTIVE_TINT = '.encore-internal-color-text-bright-accent';
const ACCENT_COLOR = 'var(--liquify-accent, var(--accent-color, #1ed760))';

function tintedControls(color: string): string {
  const targets = [SHUFFLE, REPEAT];
  const scoped = (suffix: string, state = '') => targets.map((t) => t + state + suffix).join(', ');
  const off = (suffix: string) => scoped(suffix, `:not(${ACTIVE_TINT})`);
  const on = (suffix: string) => scoped(suffix, ACTIVE_TINT);
  return `${off('')}, ${off(' *')} {
  color: ${color} !important;
}
${on('')}, ${on(' *')} {
  color: ${ACCENT_COLOR} !important;
}
${scoped(' svg')}, ${scoped(' path')} {
  fill: currentColor !important;
}`;
}

function getPlayerControlIconCss(): string {
  return `
${TRANSPORT} {
  position: relative !important;
  transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1) !important;
}
${eachTransport(':active')} { transform: scale(var(--liquify-player-press-scale, 0.9)) !important; }
${eachTransport(` svg:not(.${ICON})`)} { visibility: hidden !important; }

.${ICON} {
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: var(--liquify-player-icon-size, 26px) !important;
  height: var(--liquify-player-icon-size, 26px) !important;
  color: var(--liquify-player-icon-color, #fff) !important;
  overflow: hidden;
  pointer-events: none;
}

${BARE_PLAY_BUTTON}

${PLAY} .${ICON} { --liquify-player-icon-size: 36px; }

.${ICON}__a, .${ICON}__b { transition: d 0.46s cubic-bezier(0.32, 1.35, 0.46, 1); }
.${ICON}__a { d: path("M9.4 6.6 L13.5 9.3 L13.5 14.7 L9.4 17.4 Z"); }
.${ICON}__b { d: path("M13.5 9.3 L17.6 12 L17.6 12 L13.5 14.7 Z"); }
.${ICON}.${PLAYING} .${ICON}__a { d: path("M7.8 6 L9.3 6 L9.3 18 L7.8 18 Z"); }
.${ICON}.${PLAYING} .${ICON}__b { d: path("M14.7 6 L16.2 6 L16.2 18 L14.7 18 Z"); }

.${ICON}__nudge { transform-box: view-box; transform-origin: 0 0; transform: translateX(1.1px); }
.${ICON}__row { transform-box: view-box; transform-origin: 0 0; }
.${ICON}__in { opacity: 0; }

.${SKIPPING} .${ICON}__row { animation: liquifySkipFlow 0.52s cubic-bezier(0.3, 1.75, 0.44, 1) both; }
.${SKIPPING} .${ICON}__in { animation: liquifySkipIn 0.52s cubic-bezier(0.32, 0.72, 0.22, 1) both; }
.${SKIPPING} .${ICON}__out { animation: liquifySkipOut 0.52s cubic-bezier(0.32, 0.72, 0.22, 1) both; }

@keyframes liquifySkipFlow { from { transform: translateX(0); } to { transform: translateX(9.6px); } }
@keyframes liquifySkipIn { 0% { opacity: 0; } 45%, 100% { opacity: 1; } }
@keyframes liquifySkipOut { 0% { opacity: 1; } 55%, 100% { opacity: 0; } }

${tintedControls('#fff')}

${SHUFFLE}[aria-checked]:not([aria-checked="false"]),
${SHUFFLE}[aria-checked]:not([aria-checked="false"]) *,
${REPEAT}[aria-checked]:not([aria-checked="false"]),
${REPEAT}[aria-checked]:not([aria-checked="false"]) * {
  color: ${ACCENT_COLOR} !important;
}

${SCALE_PLAY_BUTTON}

@media (prefers-reduced-motion: reduce) {
  ${TRANSPORT}, .${ICON}__a, .${ICON}__b { transition: none !important; }
  .${SKIPPING} .${ICON}__row,
  .${SKIPPING} .${ICON}__in,
  .${SKIPPING} .${ICON}__out { animation: none !important; }
}
`;
}

function getPlayerControlIconsDisabledCss(): string {
  return `
${SCALE_PLAY_BUTTON}

${BARE_PLAY_BUTTON}

${eachTransport('')},
${eachTransport(' *')} {
  color: #fff !important;
}
${eachTransport(' svg')}, ${eachTransport(' path')} { fill: currentColor !important; }

[class*="-legacy-button"]:hover { color: #fff !important; }
`;
}

function isPlayerControlIconsEnabled(): boolean {
  return (localStorage.getItem(PLAYER_ICONS_KEY) || 'on') === 'on';
}

function removeIcons(): void {
  document.querySelectorAll(`.${ICON}`).forEach((icon) => icon.remove());
}

function ensureIcon(button: Element, markup: string): Element {
  let icon = button.querySelector(`.${ICON}`);
  if (!icon) {
    const holder = document.createElement('div');
    holder.innerHTML = markup;
    icon = holder.firstElementChild as Element;
    button.appendChild(icon);
  }
  return icon;
}

function isPlaying(button: Element): boolean {
  const label = (button.getAttribute('aria-label') || '').toLowerCase();
  return /paus/.test(label) || Boolean(SpotiKit.Player?.isPlaying);
}

const PRESS_GRACE_MS = 500;
const RECONCILE_MS = 650;

function setPlayingState(icon: Element, playing: boolean): void {
  const el = icon as HTMLElement;
  const pressedAt = Number(el.dataset.liquifyPressed || 0);
  if (pressedAt) {
    if (icon.classList.contains(PLAYING) !== playing && performance.now() - pressedAt < PRESS_GRACE_MS) {
      return;
    }
    delete el.dataset.liquifyPressed;
  }
  icon.classList.toggle(PLAYING, playing);
}

function applyPlayerControlIcons(): void {
  if (!isPlayerControlIconsEnabled()) {
    removeIcons();
    return;
  }

  for (const [selector, markup] of CONTROLS) {
    const button = document.querySelector(selector);
    if (!button) continue;
    const icon = ensureIcon(button, markup);
    if (selector === PLAY) setPlayingState(icon, isPlaying(button));
  }
}

function installPressFeedback(win: any): void {
  if (win[PRESS_KEY]) return;
  win[PRESS_KEY] = true;

  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as Element | null;

    const playIcon = target?.closest?.(PLAY)?.querySelector(`.${ICON}`);
    if (playIcon) {
      playIcon.classList.toggle(PLAYING);
      (playIcon as HTMLElement).dataset.liquifyPressed = String(performance.now());
      window.setTimeout(applyPlayerControlIcons, RECONCILE_MS);
    }

    const icon = target?.closest?.(SKIPS)?.querySelector(`.${ICON}`);
    if (!icon) return;
    icon.classList.remove(SKIPPING);
    void icon.getBoundingClientRect();
    icon.classList.add(SKIPPING);
  }, true);

  document.addEventListener('animationend', (event) => {
    if (event.animationName !== 'liquifySkipFlow') return;
    (event.target as Element).closest?.(`.${ICON}`)?.classList.remove(SKIPPING);
  }, true);
}

export function installPlayerControlIcons(): void {
  const win = window as any;

  if (!isPlayerControlIconsEnabled()) {
    win[OBSERVER_KEY]?.disconnect?.();
    win[OBSERVER_KEY] = undefined;
    updateStyle(STYLE_ID, getPlayerControlIconsDisabledCss());
    removeIcons();
    return;
  }

  updateStyle(STYLE_ID, getPlayerControlIconCss());
  applyPlayerControlIcons();
  installPressFeedback(win);

  if (win[OBSERVER_KEY]) return;

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyPlayerControlIcons();
    });
  });
  win[OBSERVER_KEY] = observer;
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['aria-label'],
    childList: true,
    subtree: true,
  });

  SpotiKit.Player?.on?.('playpause', applyPlayerControlIcons);
  SpotiKit.Player?.on?.('track', applyPlayerControlIcons);
}

export function setPlayerControlIcons(mode: string): void {
  const m = mode === 'on' ? 'on' : 'off';
  localStorage.setItem(PLAYER_ICONS_KEY, m);
  installPlayerControlIcons();
}
