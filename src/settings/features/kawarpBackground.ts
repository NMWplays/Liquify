import { WorkerKawarp, canUseWorkerKawarp } from '../../kawarp/workerKawarp';
import { clamp, readNum } from '../shared';
import { readBackgroundAppearance } from './backgroundAppearance';
import { onStop } from '../../lifecycle/runtime';

export const KAWARP_KEYS = {
  warp: 'liquify-kawarp-warp',
  speed: 'liquify-kawarp-speed',
  saturation: 'liquify-kawarp-saturation',
  scale: 'liquify-kawarp-scale',
  contrast: 'liquify-kawarp-contrast',
} as const;

export type KawarpKey = keyof typeof KAWARP_KEYS;

export const KAWARP_DEFAULTS: Record<KawarpKey, number> = {
  warp: 50,
  speed: 100,
  saturation: 150,
  scale: 100,
  contrast: 100,
};

export const KAWARP_RANGES: Record<KawarpKey, { min: number; max: number }> = {
  warp: { min: 0, max: 100 },
  speed: { min: 0, max: 400 },
  saturation: { min: 0, max: 500 },
  scale: { min: 10, max: 400 },
  contrast: { min: 0, max: 300 },
};

const CROSSFADE_MS = 600;
const MAX_KAWARP_PX = 1280;
const MAX_DPR = 1.5;
const RESIZE_SETTLE_MS = 160;
const VIDEO_FPS = 30;

function read(key: KawarpKey): number {
  const range = KAWARP_RANGES[key];
  return clamp(readNum(KAWARP_KEYS[key], KAWARP_DEFAULTS[key]), range.min, range.max);
}

function kawarpOptions() {
  return {
    warpIntensity: read('warp') / 100,
    blurPasses: Math.max(
      1,
      Math.round((clamp(readBackgroundAppearance('kawarp', 'blur'), 0, 100) / 100) * 40),
    ),
    animationSpeed: read('speed') / 100,
    transitionDuration: 0,
    saturation: read('saturation') / 100,
    scale: clamp(read('scale') / 100, 0.01, 4),
  };
}

export function applyKawarpAppearance(): void {
  const style = document.documentElement.style;
  const value = `${read('contrast')}%`;
  if (style.getPropertyValue('--liquify-kawarp-contrast') !== value) {
    style.setProperty('--liquify-kawarp-contrast', value);
  }
}

export function setKawarpValue(key: KawarpKey, value: number): void {
  localStorage.setItem(KAWARP_KEYS[key], String(value));
  applyKawarpAppearance();
  window.dispatchEvent(new Event('liquifyBackgroundChange'));
}

export function resetKawarpDefaults(): void {
  for (const key of Object.keys(KAWARP_KEYS) as KawarpKey[]) {
    localStorage.setItem(KAWARP_KEYS[key], String(KAWARP_DEFAULTS[key]));
  }
  applyKawarpAppearance();
}

export class KawarpBackdrop {
  readonly el: HTMLElement;

  private layers: Array<{ canvas: HTMLCanvasElement; renderer: WorkerKawarp }> = [];
  private useA = true;
  private swapTimer = 0;
  private resizeTimer = 0;
  private resizeObserver: ResizeObserver | null = null;
  private token = 0;
  private lastUrl = '';
  private lastOptions = '';
  private active = false;
  private failed = false;
  private failedUrls = new Set<string>();
  private live = new Set<WorkerKawarp>();
  private video: HTMLVideoElement | null = null;
  private videoFrame = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'liquify-kawarp-bg';
    this.el.setAttribute('aria-hidden', 'true');
    document.addEventListener('visibilitychange', () => {
      this.syncLoop();
      this.syncVideo();
    });
    onStop(() => this.dispose());
  }

  private dispose(): void {
    this.stopVideo();
    this.token++;
    window.clearTimeout(this.swapTimer);
    window.clearTimeout(this.resizeTimer);
    this.live.clear();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    for (const layer of this.layers) layer.renderer.dispose();
    this.layers = [];
  }

  canRender(url: string | null): boolean {
    return !this.failed && !!url && !this.failedUrls.has(url);
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    this.el.classList.toggle('active', active);
    this.syncLoop();
    this.syncVideo();
  }

  applyOptions(): void {
    const options = kawarpOptions();
    if (this.layers.length === 0) return;
    const next = JSON.stringify(options);
    if (next === this.lastOptions) return;
    this.lastOptions = next;
    for (const layer of this.layers) layer.renderer.setOptions(options);
  }

  show(url: string, video = false): void {
    if (!this.ensureLayers()) return;
    this.applyOptions();
    const key = video ? 'video:' + url : url;
    if (key === this.lastUrl) return;
    this.lastUrl = key;
    void this.swap(url, video);
  }

  private syncVideo(): void {
    const video = this.video;
    if (!video) return;
    if (this.active && !document.hidden) void video.play().catch(() => {});
    else video.pause();
  }

  private stopVideo(): void {
    const video = this.video;
    this.video = null;
    if (!video) return;
    if (this.videoFrame) video.cancelVideoFrameCallback(this.videoFrame);
    this.videoFrame = 0;
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  private feedVideo(video: HTMLVideoElement, renderer: WorkerKawarp): void {
    let last = 0;
    const step = (now: number) => {
      if (this.video !== video) return;
      this.videoFrame = video.requestVideoFrameCallback(step);
      if (now - last < 1000 / VIDEO_FPS - 4) return;
      last = now;
      void renderer.load(video, true).catch(() => {});
    };
    this.videoFrame = video.requestVideoFrameCallback(step);
  }

  private syncLoop(): void {
    const playing = this.active && !document.hidden;
    for (const layer of this.layers) layer.renderer.play(playing && this.live.has(layer.renderer));
  }

  private ensureLayers(): boolean {
    if (this.failed) return false;
    if (this.layers.length === 2) return true;

    const fail = (error?: unknown) => {
      if (this.failed) return;
      console.warn('[Liquify] Kawarp unavailable, falling back to the static background.', error);
      this.failed = true;
      for (const layer of this.layers) layer.renderer.dispose();
      this.layers = [];
      this.el.replaceChildren();
      window.dispatchEvent(new Event('liquifyBackgroundChange'));
    };

    if (!canUseWorkerKawarp()) {
      fail();
      return false;
    }
    try {
      this.layers = [0, 1].map(() => {
        const canvas = document.createElement('canvas');
        canvas.className = 'liquify-kawarp-canvas';
        this.el.appendChild(canvas);
        return { canvas, renderer: new WorkerKawarp(canvas, kawarpOptions(), 'liquify-background', fail) };
      });
    } catch (error) {
      fail(error);
      return false;
    }

    for (const layer of this.layers) this.sizeCanvas(layer);
    this.observeResize();
    this.lastOptions = JSON.stringify(kawarpOptions());
    return true;
  }

  private async swap(url: string, video = false): Promise<void> {
    const token = ++this.token;
    this.stopVideo();

    let source: HTMLImageElement | HTMLVideoElement;
    try {
      source = video ? await openVideo(url) : await decodeImage(url);
    } catch {
      this.failedUrls.add(url);
      if (token === this.token) this.lastUrl = '';
      window.dispatchEvent(new Event('liquifyBackgroundChange'));
      return;
    }
    const release = () => {
      if (!(source instanceof HTMLVideoElement)) return;
      source.pause();
      source.removeAttribute('src');
      source.load();
    };
    if (token !== this.token || this.layers.length < 2) {
      release();
      return;
    }

    const incoming = this.useA ? this.layers[0] : this.layers[1];
    const outgoing = this.useA ? this.layers[1] : this.layers[0];

    this.sizeCanvas(incoming);
    try {
      await incoming.renderer.load(source);
    } catch {
      release();
      this.failedUrls.add(url);
      if (token === this.token) this.lastUrl = '';
      window.dispatchEvent(new Event('liquifyBackgroundChange'));
      return;
    }
    if (token !== this.token) {
      release();
      return;
    }
    if (source instanceof HTMLVideoElement) {
      this.video = source;
      this.feedVideo(source, incoming.renderer);
      this.syncVideo();
    }
    this.live.add(incoming.renderer);
    this.syncLoop();
    await nextFrame();
    if (token !== this.token) return;

    incoming.canvas.classList.add('active', 'is-front');
    outgoing.canvas.classList.remove('is-front');
    this.useA = !this.useA;

    window.clearTimeout(this.swapTimer);
    this.swapTimer = window.setTimeout(() => {
      if (token !== this.token) return;
      outgoing.canvas.classList.remove('active');
      this.live.delete(outgoing.renderer);
      this.syncLoop();
    }, CROSSFADE_MS + 80);
  }

  private observeResize(): void {
    if (this.resizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        for (const layer of this.layers) this.sizeCanvas(layer);
      }, RESIZE_SETTLE_MS);
    });
    this.resizeObserver.observe(this.el);
  }

  private sizeCanvas(layer: { canvas: HTMLCanvasElement; renderer: WorkerKawarp }): void {
    const width = this.el.clientWidth;
    const height = this.el.clientHeight;
    if (width < 2 || height < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const longest = Math.max(width, height) * dpr;
    const factor = longest > MAX_KAWARP_PX ? (MAX_KAWARP_PX / longest) * dpr : dpr;
    layer.renderer.setSize(Math.round(width * factor), Math.round(height * factor));
  }
}

function decodeImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  return image.decode().then(() => image);
}

function openVideo(url: string): Promise<HTMLVideoElement> {
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  return new Promise<void>((resolve, reject) => {
    video.addEventListener('loadeddata', () => resolve(), { once: true });
    video.addEventListener('error', () => reject(video.error), { once: true });
  }).then(() => video);
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
