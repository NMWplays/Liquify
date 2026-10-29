export const PLAYING_CLASS = 'liquify-playing';

const PLAY_BUTTON = '[data-testid="control-button-playpause"]';
const PRESS_GRACE_MS = 1500;
const POLL_MS = 1000;

type Listener = (playing: boolean) => void;

const listeners = new Set<Listener>();
const watchedDocuments = new WeakSet<Document>();
let playing = false;
let pressedAt = 0;
let installed = false;

export function onPlayStateChange(listener: Listener): void {
  listeners.add(listener);
  listener(playing);
}

export function watchPlayPresses(doc: Document): void {
  if (watchedDocuments.has(doc)) return;
  watchedDocuments.add(doc);

  doc.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if ((event.target as Element | null)?.closest?.(PLAY_BUTTON)) press();
  }, true);

  doc.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || event.repeat || isTyping(event.target)) return;
    const focused = (event.target as Element | null)?.closest?.('button, a, [role="button"]');
    if (focused && !focused.matches(PLAY_BUTTON)) return;
    press();
  }, true);
}

export function installPlayState(): void {
  if (installed) return;
  installed = true;

  setPlaying(isReportedPlaying());
  SpotiKit.Player?.on?.('playpause', () => {
    pressedAt = 0;
    setPlaying(isReportedPlaying());
  });
  setInterval(() => {
    if (pressedAt && performance.now() - pressedAt < PRESS_GRACE_MS) return;
    pressedAt = 0;
    setPlaying(isReportedPlaying());
  }, POLL_MS);
  watchPlayPresses(document);
}

function press(): void {
  pressedAt = performance.now();
  setPlaying(!playing);
}

function setPlaying(next: boolean): void {
  if (next === playing && document.documentElement.classList.contains(PLAYING_CLASS) === next) return;
  playing = next;
  document.documentElement.classList.toggle(PLAYING_CLASS, next);
  listeners.forEach((listener) => listener(next));
}

function isReportedPlaying(): boolean {
  return Boolean(SpotiKit.Player?.isPlaying);
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}
