import { sleep } from '../shared';

const STYLE_ID = 'liquify-visualizer-style';
const PLAYLIST_EQ = 'img.track-list-row-playing-icon';
const HOME_EQ = 'img.home-shortcut-equalizer-image';
const HOME_SHORTCUT = '.home-shortcut';
const BAR_COLOR = 'var(--liquify-accent, var(--accent-color, #1ed760))';

const player = () => (window as any).SpotiKit?.Player;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.liquify-eq-part {
  position: absolute;
  left: 0;
  width: 100%;
  background: currentColor;
}
.liquify-eq-part--middle { transform-origin: 50% 50%; }
[role="row"]:hover [data-liquify-visualizer-wrapper],
[role="row"]:focus-within [data-liquify-visualizer-wrapper],
${HOME_SHORTCUT}:hover [data-liquify-home-visualizer] {
  display: none;
}
[data-liquify-visualizer-wrapper] ~ ${PLAYLIST_EQ} {
  visibility: hidden;
}`;
  document.head.appendChild(style);
}

const BAR_TIMINGS = [
  { duration: 0.56, delay: -0.42 },
  { duration: 0.70, delay: -0.16 },
  { duration: 0.50, delay: -0.55 },
  { duration: 0.78, delay: -0.30 },
  { duration: 0.61, delay: -0.62 },
];
const BAR_COUNT = BAR_TIMINGS.length;
const BAR_WIDTH = 4;
const BAR_PITCH = 6;
const BAR_RADIUS = BAR_WIDTH / 2;
const BARS_WIDTH = BAR_PITCH * (BAR_COUNT - 1) + BAR_WIDTH;

function pieceFrames(levels: number[], fullH: number, offsets?: number[]): Keyframe[][] {
  const span = Math.max(1, fullH - 2 * BAR_RADIUS);
  const middle: Keyframe[] = [];
  const top: Keyframe[] = [];
  const bottom: Keyframe[] = [];
  levels.forEach((level, i) => {
    const height = Math.max(2 * BAR_RADIUS, level * fullH);
    const reach = height / 2 - BAR_RADIUS;
    const at = offsets ? { offset: offsets[i] } : {};
    middle.push({ transform: `scaleY(${((height - 2 * BAR_RADIUS) / span).toFixed(3)})`, ...at });
    top.push({ transform: `translateY(${(-reach).toFixed(2)}px)`, ...at });
    bottom.push({ transform: `translateY(${reach.toFixed(2)}px)`, ...at });
  });
  return [middle, top, bottom];
}

type Pulse = { start: number; confidence?: number };
type Segment = {
  start: number;
  duration: number;
  loudness_start: number;
  loudness_max: number;
  loudness_max_time: number;
  pitches: number[];
  timbre?: number[];
};

const FLOOR = 0.22;
const EXPAND = 1.5;
const ATTACK = 30;
const RELEASE = 9;
const AGC_DECAY = 0.62;
const AGC_FLOOR = 0.06;

function lastStartingBefore<T extends { start: number }>(list: T[], t: number): number {
  let lo = 0, hi = list.length - 1;
  if (hi < 0 || list[0].start > t) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (list[mid].start <= t) lo = mid; else hi = mid - 1;
  }
  return lo;
}

function spread(values: number[], low = 0.05, high = 0.95): [number, number] {
  const sorted = [...values].sort((x, y) => x - y);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))] ?? 0;
  const lo = at(low);
  const hi = at(high);
  return [lo, hi > lo ? hi : lo + 1];
}

const unit = (v: number, [lo, hi]: [number, number]): number => Math.min(1, Math.max(0, (v - lo) / (hi - lo)));

function pulse(list: Pulse[], t: number, decay: number): number {
  const i = lastStartingBefore(list, t);
  if (i < 0) return 0;
  return Math.exp(-(t - list[i].start) / decay) * (0.5 + 0.5 * (list[i].confidence ?? 0.5));
}

function loudnessAt(segments: Segment[], i: number, t: number): number {
  const s = segments[i];
  const peakAt = s.start + s.loudness_max_time;
  if (t < peakAt) {
    const f = s.loudness_max_time > 0 ? (t - s.start) / s.loudness_max_time : 1;
    return s.loudness_start + (s.loudness_max - s.loudness_start) * f;
  }
  const next = segments[i + 1];
  const end = s.start + s.duration;
  const to = next ? next.loudness_start : s.loudness_max - 20;
  const f = end > peakAt ? Math.min(1, (t - peakAt) / (end - peakAt)) : 1;
  return s.loudness_max + (to - s.loudness_max) * f;
}

// Rythora's five frequency bands, estimated from Spotify's audio analysis.
function computeLevels(a: any, durationSec: number): { levels: number[][]; offsets: number[] } {
  const segments: Segment[] = a.segments;
  const beats: Pulse[] = a.beats ?? [];
  const downbeats: Pulse[] = a.bars ?? [];
  const tatums: Pulse[] = a.tatums ?? [];

  const louds = segments.map((s) => s.loudness_max);
  const hi = Math.max(...louds);
  const loudRange: [number, number] = [Math.max(Math.min(...louds), hi - 30), hi];
  const brightRange = spread(segments.map((s) => s.timbre?.[1] ?? 0));
  const noiseRange = spread(segments.map((s) => s.timbre?.[2] ?? 0));
  const attackRange = spread(segments.map((s) => s.timbre?.[3] ?? 0));

  const steps = Math.max(1, Math.ceil(durationSec / SAMPLE_STEP));
  const raw: number[][] = Array.from({ length: BAR_COUNT }, () => []);
  for (let n = 0; n <= steps; n++) {
    const t = Math.min(durationSec, n * SAMPLE_STEP);
    const i = lastStartingBefore(segments, t);
    if (i < 0) {
      raw.forEach((band) => band.push(0));
      continue;
    }
    const s = segments[i];
    const loud = unit(loudnessAt(segments, i, t), loudRange);
    const bright = unit(s.timbre?.[1] ?? 0, brightRange);
    const noise = unit(s.timbre?.[2] ?? 0, noiseRange);
    const onset = Math.exp(-(t - s.start) / 0.08) * unit(s.timbre?.[3] ?? 0, attackRange);
    const tonal = Math.max(0, ...s.pitches);
    const beat = pulse(beats, t, 0.11);
    const downbeat = pulse(downbeats, t, 0.16);
    const tatum = pulse(tatums, t, 0.06);

    raw[0].push(loud * (0.5 + 0.5 * (1 - bright) + 0.45 * beat + 0.2 * downbeat));
    raw[1].push(loud * (0.55 + 0.45 * tonal + 0.2 * beat));
    raw[2].push(loud * (0.35 + 0.65 * tonal + 0.25 * onset));
    raw[3].push(loud * (0.25 + 0.75 * bright + 0.4 * onset));
    raw[4].push(loud * (0.1 + 0.55 * bright + 0.35 * noise + 0.45 * tatum));
  }

  const ranges = raw.map((band) => spread(band, 0.25, 0.97));
  const decay = Math.pow(AGC_DECAY, SAMPLE_STEP);
  const up = 1 - Math.exp(-ATTACK * SAMPLE_STEP);
  const down = 1 - Math.exp(-RELEASE * SAMPLE_STEP);
  const envelope = new Array(BAR_COUNT).fill(0);
  const levels: number[][] = raw.map(() => []);
  const offsets: number[] = [];
  let agc = AGC_FLOOR;
  for (let n = 0; n <= steps; n++) {
    const values = raw.map((band, k) => unit(band[n], ranges[k]));
    agc = Math.max(agc * decay, ...values, AGC_FLOOR);
    for (let k = 0; k < BAR_COUNT; k++) {
      const target = Math.pow(Math.min(1, values[k] / agc), EXPAND);
      envelope[k] += (target - envelope[k]) * (target > envelope[k] ? up : down);
      levels[k].push(FLOOR + Math.min(1, Math.max(0, envelope[k])) * (1 - FLOOR));
    }
    offsets.push(Math.min(durationSec, n * SAMPLE_STEP) / durationSec);
  }
  return { levels, offsets };
}

const SAMPLE_STEP = 0.06;
const RESYNC_MS = 1000;
const MAX_DRIFT_MS = 120;

const LiveEq = (() => {
  const wrappers = new Set<HTMLElement>();
  const animations = new Map<HTMLElement, { live: boolean; anims: Animation[] }>();
  let analysisUri = '';
  let loading = '';
  let levels: number[][] | null = null;
  let offsets: number[] = [];
  let durationMs = 0;
  let framesCache = new Map<string, Keyframe[][]>();
  let resyncTimer = 0;

  async function load(uri: string): Promise<void> {
    if (uri === analysisUri) { refresh(); return; }
    if (uri === loading) return;
    analysisUri = '';
    levels = null;
    framesCache = new Map();
    if (!uri.startsWith('spotify:track:')) { refresh(); return; }
    loading = uri;
    try {
      const a = await (window as any).SpotiKit.Audio.analysis(uri);
      if (loading !== uri) return;
      if (a?.segments?.length) {
        const last = a.segments[a.segments.length - 1];
        const durationSec = a.track?.duration ?? last.start + last.duration;
        ({ levels, offsets } = computeLevels(a, durationSec));
        durationMs = durationSec * 1000;
        analysisUri = uri;
      }
    } catch (e) {
      console.warn('[Liquify] audio analysis unavailable', e);
    } finally {
      if (loading === uri) loading = '';
      refresh();
    }
  }

  function liveFrames(k: number, fullH: number): Keyframe[][] {
    const key = `${k}|${fullH}`;
    let frames = framesCache.get(key);
    if (!frames) {
      frames = pieceFrames(levels![k], fullH, offsets);
      framesCache.set(key, frames);
    }
    return frames;
  }

  function cancel(w: HTMLElement): void {
    animations.get(w)?.anims.forEach((anim) => anim.cancel());
    animations.delete(w);
  }

  function animate(w: HTMLElement, live: boolean): void {
    if (animations.get(w)?.live === live) return;
    cancel(w);
    const anims: Animation[] = [];
    (Array.from(w.children).slice(0, BAR_COUNT) as HTMLElement[]).forEach((bar, k) => {
      const fullH = Number(bar.dataset.fullH) || 16;
      const pieces = Array.from(bar.children) as HTMLElement[];
      if (live) {
        const frames = liveFrames(k, fullH);
        pieces.forEach((piece, i) => anims.push(piece.animate(frames[i], { duration: durationMs, fill: 'both' })));
      } else {
        const frames = pieceFrames([2 * BAR_RADIUS / fullH, 1], fullH);
        const timing = BAR_TIMINGS[k];
        pieces.forEach((piece, i) => anims.push(piece.animate(frames[i], {
          duration: timing.duration * 1000,
          delay: timing.delay * 1000,
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out',
        })));
      }
    });
    animations.set(w, { live, anims });
  }

  function sync(): void {
    const pos = Math.min(durationMs, Math.max(0, player()?.position ?? 0));
    const playing = !!player()?.isPlaying;
    for (const { live, anims } of animations.values()) {
      if (!live) continue;
      for (const anim of anims) {
        if (Math.abs(Number(anim.currentTime ?? 0) - pos) > MAX_DRIFT_MS) anim.currentTime = pos;
        if (playing && anim.playState !== 'running') anim.play();
        else if (!playing && anim.playState === 'running') anim.pause();
      }
    }
  }

  function refresh(): void {
    const live = !!levels && analysisUri === player()?.track?.uri;
    for (const w of [...wrappers]) {
      if (!w.isConnected) { wrappers.delete(w); cancel(w); continue; }
      animate(w, live);
    }
    if (live && animations.size) sync();

    const wanted = live && wrappers.size > 0;
    if (wanted && !resyncTimer) resyncTimer = window.setInterval(() => {
      for (const w of [...wrappers]) if (!w.isConnected) { wrappers.delete(w); cancel(w); }
      if (wrappers.size === 0) { clearInterval(resyncTimer); resyncTimer = 0; return; }
      sync();
    }, RESYNC_MS);
    if (!wanted && resyncTimer) { clearInterval(resyncTimer); resyncTimer = 0; }
  }

  return {
    install(): void {
      const loadCurrent = () => {
        for (const w of wrappers) cancel(w);
        void load(player()?.track?.uri ?? '');
      };
      player().on('track', loadCurrent);
      player().on('playpause', refresh);
      loadCurrent();
    },
    add(wrapper: HTMLElement): void {
      wrappers.add(wrapper);
      refresh();
    },
  };
})();

let liveEqInstalled = false;
function ensureLiveEq(): void {
  if (liveEqInstalled) return;
  liveEqInstalled = true;
  LiveEq.install();
}

// Only the middle scales and the caps slide, so the ends stay round.
function createBar(className: string, index: number, fullH: number, rectHeight: number): HTMLDivElement {
  const bar = document.createElement('div');
  bar.classList.add(className);
  bar.style.position = 'absolute';
  bar.style.left = (index * BAR_PITCH) + 'px';
  bar.style.width = BAR_WIDTH + 'px';
  bar.style.height = fullH + 'px';
  bar.style.top = (rectHeight / 2 - fullH / 2) + 'px';
  bar.dataset.fullH = String(fullH);

  const centre = fullH / 2;
  const piece = (kind: string, top: number, height: number, radius: string): HTMLSpanElement => {
    const el = document.createElement('span');
    el.className = `liquify-eq-part liquify-eq-part--${kind}`;
    el.style.top = top + 'px';
    el.style.height = height + 'px';
    el.style.borderRadius = radius;
    return el;
  };
  const r = BAR_RADIUS;
  bar.append(
    piece('middle', r, fullH - 2 * r, '0'),
    piece('top', centre - r, r + 1, `${r}px ${r}px 0 0`),
    piece('bottom', centre - 1, r + 1, `0 0 ${r}px ${r}px`),
  );
  return bar;
}

export function installPlaylistIndicatorVisualizer() {
  (async function () {
    while (!player()?.on) await sleep(300);
    ensureStyle();
    ensureLiveEq();

    let lastSvg: HTMLElement | null = null;
    let lastIndicator: Element | null = null;

    function removeBars() {
      if (lastSvg) {
        try {
          lastSvg.remove();
        } catch {}
      }
      lastSvg = null;
      lastIndicator = null;
    }

    function createBars(indicator: Element) {
      removeBars();
      if (!indicator || !(indicator as any).parentNode) return;
      const parent = (indicator as any).parentNode as HTMLElement;
      const cellHeight = parent.offsetHeight || 20;
      const rectHeight = Math.max(20, cellHeight * 1.4);

      const wrapper = document.createElement("div");
      wrapper.style.position = "absolute";
      wrapper.style.left = "-6px";
      wrapper.style.top = (cellHeight - rectHeight) / 2 + "px";
      wrapper.style.width = BARS_WIDTH + "px";
      wrapper.style.height = rectHeight + "px";
      wrapper.style.overflow = "hidden";
      wrapper.style.pointerEvents = "none";
      wrapper.style.color = BAR_COLOR;
      wrapper.dataset.liquifyVisualizerWrapper = "1";

      const fullH = Math.max(8, rectHeight * 0.8);
      for (let i = 0; i < BAR_COUNT; i++) wrapper.appendChild(createBar("custom-playing-bar", i, fullH, rectHeight));

      parent.insertBefore(wrapper, indicator);
      lastSvg = wrapper;
      lastIndicator = indicator;
      LiveEq.add(wrapper);
    }

    async function updateIndicator() {
      const indicator = document.querySelector(`${PLAYLIST_EQ}, [data-playing-indicator]`);

      if (!indicator || !(indicator as any).parentNode) {
        removeBars();
        return false;
      }

      const isPlaying = !!player()?.isPlaying;

      if (!isPlaying) {
        removeBars();
        return true;
      }

      if (indicator !== lastIndicator || !lastSvg?.isConnected) createBars(indicator);
      return true;
    }

    player().on("track", () => {
      removeBars();
      void updateIndicator();
    });

    setInterval(() => void updateIndicator(), 100);
  })();
}

export function installHomeScreenVisualizer() {
  (async function () {
    while (!player()?.on) await sleep(300);
    ensureStyle();
    const homeSvgs = new Map<Element, { wrapper: HTMLElement }>();
    let wasPlaying = !!player()?.isPlaying;

    function createHomeVisualizer(img: HTMLImageElement) {
      if (homeSvgs.has(img)) return;

      const parent = img.parentNode as HTMLElement | null;
      if (!parent) return;

      const measuredW = img.offsetWidth || parent.offsetWidth || 0;
      const measuredH = img.offsetHeight || parent.offsetHeight || 0;
      const imgWidth = measuredW >= 16 ? measuredW : 24;
      const imgHeight = measuredH >= 16 ? measuredH : 24;

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.width = Math.max(BARS_WIDTH, imgWidth) + "px";
      wrapper.style.height = imgHeight + "px";
      wrapper.style.overflow = "hidden";
      wrapper.style.pointerEvents = "none";
      wrapper.style.color = BAR_COLOR;
      wrapper.style.flex = "0 0 auto";
      wrapper.dataset.liquifyHomeVisualizer = "1";

      const fullH = Math.max(8, imgHeight * 0.8);
      for (let i = 0; i < BAR_COUNT; i++) wrapper.appendChild(createBar("home-visualizer-bar", i, fullH, imgHeight));

      parent.insertBefore(wrapper, img);
      img.style.visibility = "hidden";
      img.style.width = "0px";
      img.style.height = "0px";
      img.style.margin = "0";
      img.style.padding = "0";

      homeSvgs.set(img, { wrapper });
      ensureLiveEq();
      LiveEq.add(wrapper);
    }

    function updateHomeScreenVisualizer() {
      for (const [img, data] of homeSvgs) {
        if (!data.wrapper.isConnected) homeSvgs.delete(img);
      }
      document.querySelectorAll(HOME_EQ).forEach((img) => {
        const im = img as HTMLImageElement;
        if (!homeSvgs.has(im)) createHomeVisualizer(im);
      });
    }

    let queued = false;
    const homeObserver = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        updateHomeScreenVisualizer();
      });
    });
    homeObserver.observe(document.body, { childList: true, subtree: true });

    updateHomeScreenVisualizer();

    player().on("playpause", () => {
      const isPlaying = !!player()?.isPlaying;

      if (wasPlaying && !isPlaying) {
        for (const [, data] of homeSvgs.entries()) {
          try {
            data.wrapper?.remove();
          } catch {}
        }
        homeSvgs.clear();
      }

      if (!wasPlaying && isPlaying) {
        updateHomeScreenVisualizer();
      }

      wasPlaying = isPlaying;
    });
  })();
}
