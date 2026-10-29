import { readLS } from '../shared';
import { PLAYBAR_COVER_SLOT } from './playbarCoverRadius';
import { isNscCoverFlipOn } from './nextSongCard';

export const COVER_FLIP_KEY = 'liquify-cover-flip';
export const NPV_COVER_ANIM_KEY = 'liquify-npv-cover-anim';
export type NpvCoverAnim = 'swipe' | 'flip' | 'off';

const NPV_COVER_SLOT = '.npv-cover-art-slot';

const OUT_MS = 180;
const IN_MS = 520;
const LOAD_WAIT_MS = 400;
const OVERLAY_CLASS = 'liquify-cover-flip-old';

export function isCoverFlipOn(): boolean {
  return readLS(COVER_FLIP_KEY, 'on') === 'on';
}

export function setCoverFlip(on: boolean): void {
  localStorage.setItem(COVER_FLIP_KEY, on ? 'on' : 'off');
}

export function getNpvCoverAnim(): NpvCoverAnim {
  const mode = readLS(NPV_COVER_ANIM_KEY, 'swipe');
  return mode === 'flip' || mode === 'off' ? mode : 'swipe';
}

export function setNpvCoverAnim(mode: NpvCoverAnim): void {
  localStorage.setItem(NPV_COVER_ANIM_KEY, mode);
}

const srcOf = (img: HTMLImageElement | null): string => img?.currentSrc || img?.src || '';

const ALBUM_ART = /^ab67616d[0-9a-f]{8}([0-9a-f]{24})$/i;
const ART_SIZES = ['ab67616d00004851', 'ab67616d000011eb', 'ab67616d00001e02', 'ab67616d0000b273'];
const PRELOAD_KEEP = 8;
const preloaded = new Map<string, HTMLImageElement[]>();

function imageIdOf(item: any): string {
  const ctx = item?.contextTrack || item;
  const meta = ctx?.metadata || {};
  const candidates = [
    meta.image_xlarge_url, meta.image_large_url, meta.image_url, meta.image_small_url,
    item?.image, ctx?.album?.images?.[0]?.url, item?.album?.images?.[0]?.url,
  ];
  for (const c of candidates) {
    const m = typeof c === 'string' && c.match(/(?:spotify:image:|\/image\/)([0-9a-f]{40})/i);
    if (m) return m[1].toLowerCase();
  }
  return '';
}

function preload(item: any): void {
  const id = imageIdOf(item);
  if (!id || preloaded.has(id)) return;
  const art = id.match(ALBUM_ART);
  const urls = art
    ? ART_SIZES.map((code) => `https://i.scdn.co/image/${code}${art[1]}`)
    : [`https://i.scdn.co/image/${id}`];
  preloaded.set(id, urls.map((url) => Object.assign(new Image(), { decoding: 'async', src: url })));
  if (preloaded.size > PRELOAD_KEEP) preloaded.delete(preloaded.keys().next().value as string);
}

function preloadNeighbours(): void {
  try {
    const queue = (window as any).SpotiKit?.Queue;
    preload(queue?.next?.[0]);
    preload(queue?.next?.[1]);
    const previous = queue?.previous;
    preload(previous?.[previous.length - 1]);
  } catch {}
}

const uriOf = (item: any): string => {
  const ctx = item?.contextTrack || item;
  return ctx?.uri || item?.uri || '';
};

function flipper(slotSelector: string, enabled: () => boolean) {
  let lastSrc = '';
  let running: Animation[] = [];
  let overlay: HTMLImageElement | null = null;
  let token = 0;

  const image = (): HTMLImageElement | null =>
    document.querySelector(`${slotSelector} img:not(.${OVERLAY_CLASS})`);

  const stop = (): void => {
    for (const a of running) a.cancel();
    running = [];
    overlay?.remove();
    overlay = null;
  };

  const remember = (): void => {
    lastSrc = srcOf(image()) || lastSrc;
  };

  const turnIn = (slot: HTMLElement, turn: (deg: number) => string, dir: number, mine: number): void => {
    const start = performance.now();
    const ready = (): boolean => {
      const img = image();
      return !!img && srcOf(img) !== lastSrc && img.complete && img.naturalWidth > 0;
    };
    const go = (): void => {
      if (mine !== token) return;
      if (!ready() && performance.now() - start < LOAD_WAIT_MS) {
        requestAnimationFrame(go);
        return;
      }
      overlay?.remove();
      overlay = null;
      const anim = slot.animate(
        [
          { transform: turn(-90 * dir), easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
          { transform: turn(9 * dir), offset: 0.6, easing: 'ease-in-out' },
          { transform: turn(-2.5 * dir), offset: 0.83, easing: 'ease-in-out' },
          { transform: turn(0) },
        ],
        { duration: IN_MS },
      );
      for (const a of running) a.cancel();
      running = [anim];
      anim.onfinish = () => {
        if (mine !== token) return;
        running = [];
        remember();
      };
    };
    go();
  };

  return {
    rememberIfIdle(): void {
      if (!running.length && !overlay) remember();
    },
    flip(dir: number): void {
      stop();
      const mine = ++token;
      const slot = document.querySelector(slotSelector) as HTMLElement | null;
      if (!slot || !enabled() || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        remember();
        return;
      }
      const depth = Math.round(Math.max(520, slot.offsetWidth * 5.5));
      const turn = (deg: number): string => `perspective(${depth}px) rotateY(${deg}deg)`;

      // Spotify may swap the picture before the track event, so the old one is laid on top.
      if (lastSrc) {
        overlay = document.createElement('img');
        overlay.className = OVERLAY_CLASS;
        overlay.src = lastSrc;
        overlay.alt = '';
        Object.assign(overlay.style, {
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 'inherit',
          pointerEvents: 'none',
        });
        slot.appendChild(overlay);
      }

      const away = slot.animate(
        [{ transform: turn(0) }, { transform: turn(90 * dir) }],
        { duration: OUT_MS, easing: 'cubic-bezier(0.55, 0, 0.8, 0.4)', fill: 'forwards' },
      );
      running = [away];
      away.onfinish = () => {
        if (mine === token) turnIn(slot, turn, dir, mine);
      };
    },
  };
}

export function installCoverFlip(): void {
  const player = (window as any).SpotiKit?.Player;
  if (!player?.on) return;

  const covers = [
    flipper(PLAYBAR_COVER_SLOT, isCoverFlipOn),
    flipper(NPV_COVER_SLOT, () => getNpvCoverAnim() === 'flip'),
    flipper('#liquify-next-song-card .nsc-cover-frame', isNscCoverFlipOn),
  ];
  let lastUri = uriOf(player.track);

  setInterval(() => { covers.forEach((c) => c.rememberIfIdle()); preloadNeighbours(); }, 2000);
  covers.forEach((c) => c.rememberIfIdle());
  preloadNeighbours();

  let backAt = 0;
  const markBack = (): void => { backAt = Date.now(); };
  document.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement | null)?.closest?.('[data-testid="control-button-skip-back"]')) markBack();
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'ArrowLeft') markBack();
  }, true);
  if (typeof player.previous === 'function') {
    const previous = player.previous;
    player.previous = (...args: any[]) => { markBack(); return previous.apply(player, args); };
  }

  player.on('track', () => {
    const uri = uriOf(player.track);
    if (!uri || uri === lastUri) return;
    const back = Date.now() - backAt < 1500;
    backAt = 0;
    lastUri = uri;
    covers.forEach((c) => c.flip(back ? -1 : 1));
    setTimeout(preloadNeighbours, 600);
  });
}
