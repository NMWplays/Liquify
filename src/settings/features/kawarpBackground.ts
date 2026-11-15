import { Kawarp } from '@kawarp/core';
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
const TARGET_FPS = 60;
const MAX_KAWARP_PX = 1280;
const MAX_DPR = 1.5;
const RESIZE_SETTLE_MS = 160;
const MAX_FRAME_STEP_MS = 250;
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

  private layers: Array<{ canvas: HTMLCanvasElement; renderer: Kawarp }> = [];
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

  private live = new Set<Kawarp>();
  private rafId = 0;
  private lastFrame = 0;
  private clock = 0;
  private speed = 1;
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
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.live.clear();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    for (const layer of this.layers) releaseKawarp(layer.canvas, layer.renderer);
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
    this.speed = options.animationSpeed;
    if (this.layers.length === 0) return;
    const next = JSON.stringify(options);
    if (next === this.lastOptions) return;
    this.lastOptions = next;
    for (const layer of this.layers) layer.renderer.setOptions(options);
  }

  show(url: string, video = false): void {
    if (!this.ensureLayers()) return;
    this.applyOptions();
    const key = video ? `video:${url}` : url;
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

  private feedVideo(video: HTMLVideoElement, renderer: Kawarp): void {
    let last = 0;
    const step = (now: number) => {
      if (this.video !== video) return;
      this.videoFrame = video.requestVideoFrameCallback(step);
      if (now - last < 1000 / VIDEO_FPS - 4) return;
      last = now;
      try {
        renderer.loadImageElement(video);
      } catch {
      }
    };
    this.videoFrame = video.requestVideoFrameCallback(step);
  }

private syncLoop(): void {
    const wanted = this.active && this.live.size > 0 && !document.hidden;
    if (wanted && !this.rafId) {
      this.lastFrame = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    } else if (!wanted && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const elapsed = now - this.lastFrame;
    if (elapsed < 1000 / TARGET_FPS - 4) return;
    this.lastFrame = now;
    this.clock += (Math.min(elapsed, MAX_FRAME_STEP_MS) / 1000) * this.speed;
    for (const renderer of this.live) {
      try {
        renderer.renderFrame(this.clock);
      } catch {
      }
    }
  };

private ensureLayers(): boolean {
    if (this.failed) return false;
    if (this.layers.length === 2) return true;

    try {
      this.layers = [0, 1].map(() => {
        const canvas = document.createElement('canvas');
        canvas.className = 'liquify-kawarp-canvas';
        this.el.appendChild(canvas);
        return { canvas, renderer: new Kawarp(canvas, kawarpOptions()) };
      });
    } catch (error) {
      console.warn('[Liquify] Kawarp unavailable, falling back to the static background.', error);
      this.failed = true;
      this.el.replaceChildren();
      this.layers = [];
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
    if (token !== this.token || this.layers.length < 2) {
      if (source instanceof HTMLVideoElement) {
        source.pause();
        source.removeAttribute('src');
        source.load();
      }
      return;
    }

    const incoming = this.useA ? this.layers[0] : this.layers[1];
    const outgoing = this.useA ? this.layers[1] : this.layers[0];

    this.sizeCanvas(incoming);
    incoming.renderer.loadImageElement(source);
    if (source instanceof HTMLVideoElement) {
      this.video = source;
      this.feedVideo(source, incoming.renderer);
      this.syncVideo();
    }
    this.live.add(incoming.renderer);
    this.syncLoop();
    try {
      incoming.renderer.renderFrame(this.clock);
    } catch {
    }
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

  private sizeCanvas(layer: { canvas: HTMLCanvasElement; renderer: Kawarp }): void {
    const width = this.el.clientWidth;
    const height = this.el.clientHeight;
    if (width < 2 || height < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const longest = Math.max(width, height) * dpr;
    const factor = longest > MAX_KAWARP_PX ? (MAX_KAWARP_PX / longest) * dpr : dpr;
    const target = { width: Math.round(width * factor), height: Math.round(height * factor) };

    if (layer.canvas.width === target.width && layer.canvas.height === target.height) return;
    layer.canvas.width = target.width;
    layer.canvas.height = target.height;
    layer.renderer.resize();
    try {
      layer.renderer.renderFrame(this.clock);
    } catch {
    }
  }
}

function releaseKawarp(canvas: HTMLCanvasElement, renderer: Kawarp): void {
  try {
    renderer.stop();
    renderer.dispose();
  } catch {
  }
  canvas.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext();
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
