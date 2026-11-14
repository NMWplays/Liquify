import { onStop } from '../../lifecycle/runtime';
import { readLS, updateStyle } from '../shared';
import { Playback, SongData, playback, watchPlayback, watchSong } from './audioPulse';
import { PLAYBAR_WORKER } from './playbarWorker';

export const PLAYBAR_EQ_KEY = 'liquify-playbar-eq';
const STYLE_ID = 'liquify-playbar-eq-style';
const CANVAS_CLASS = 'liquify-playbar-eq';
const PLAYBAR = '.now-playing-bar-area';
const HEIGHT = 40;

const CSS = `
.${CANVAS_CLASS} {
  position: absolute;
  bottom: 100%;
  z-index: -1;
  height: ${HEIGHT}px;
  pointer-events: none;
  color: var(--liquify-accent, var(--accent-color, #1ed760));
}`;

let canvas: HTMLCanvasElement | null = null;
let host: HTMLElement | null = null;
let worker: Worker | null = null;
let workerUrl = '';
let resize: ResizeObserver | null = null;
let stopSong: (() => void) | null = null;
let stopPlay: (() => void) | null = null;
let timer = 0;
let song: SongData | null = null;
let color = '';

function isEnabled(): boolean {
  return readLS(PLAYBAR_EQ_KEY, 'off') === 'on';
}

function post(message: any): void {
  worker?.postMessage(message);
}

function layout(): void {
  if (!canvas || !host) return;
  const radius = parseFloat(getComputedStyle(host).borderTopLeftRadius) || 0;
  const inset = Math.min(radius, host.clientWidth / 4);
  const width = Math.max(0, host.clientWidth - 2 * inset);
  canvas.style.left = `${inset}px`;
  canvas.style.width = `${width}px`;
  post({ type: 'size', width, height: HEIGHT, dpr: window.devicePixelRatio || 1 });
}

function sendColor(): void {
  if (!canvas) return;
  const next = getComputedStyle(canvas).color;
  if (next === color) return;
  color = next;
  post({ type: 'color', color });
}

function teardown(): void {
  worker?.terminate();
  worker = null;
  resize?.disconnect();
  resize = null;
  canvas?.remove();
  canvas = null;
  host = null;
  color = '';
}

function mount(): void {
  const bar = document.querySelector<HTMLElement>(PLAYBAR);
  if (!bar || (canvas?.isConnected && canvas.parentElement === bar)) return;
  teardown();
  host = bar;
  canvas = document.createElement('canvas');
  canvas.className = CANVAS_CLASS;
  bar.appendChild(canvas);
  if (!workerUrl) workerUrl = URL.createObjectURL(new Blob([PLAYBAR_WORKER], { type: 'text/javascript' }));
  const offscreen = canvas.transferControlToOffscreen();
  worker = new Worker(workerUrl);
  worker.postMessage({ type: 'canvas', canvas: offscreen }, [offscreen]);
  resize = new ResizeObserver(layout);
  resize.observe(bar);
  layout();
  sendColor();
  post({ type: 'song', song });
  post({ type: 'play', play: playback() });
}

function start(): void {
  updateStyle(STYLE_ID, CSS);
  mount();
  if (!stopSong) stopSong = watchSong((next) => {
    song = next;
    post({ type: 'song', song });
  });
  if (!stopPlay) stopPlay = watchPlayback((play: Playback) => post({ type: 'play', play }));
  if (!timer) timer = window.setInterval(() => {
    mount();
    sendColor();
  }, 1000);
}

function stop(): void {
  stopSong?.();
  stopSong = null;
  stopPlay?.();
  stopPlay = null;
  if (timer) clearInterval(timer);
  timer = 0;
  teardown();
  if (workerUrl) URL.revokeObjectURL(workerUrl);
  workerUrl = '';
  updateStyle(STYLE_ID, '');
}

onStop(stop);

export function installPlaybarVisualizer(): void {
  if (isEnabled()) start();
  else stop();
}

export function setPlaybarEq(mode: string): void {
  localStorage.setItem(PLAYBAR_EQ_KEY, mode === 'on' ? 'on' : 'off');
  installPlaybarVisualizer();
}
