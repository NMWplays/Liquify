import { FLOOR, SAMPLE_STEP, computeLevels } from './visualizers';

export type SongData = {
  uri: string;
  duration: number;
  step: number;
  bands: Float32Array[];
  segStarts: Float32Array;
  segPitches: Float32Array;
};

export type Playback = { uri: string; pos: number; at: number; playing: boolean };

const player = () => (window as any).SpotiKit?.Player;
const songListeners = new Set<(song: SongData | null) => void>();
const playListeners = new Set<(play: Playback) => void>();

let installed = false;
let song: SongData | null = null;
let loading = '';
let resync = 0;

export function playback(): Playback {
  const p = player();
  return { uri: p?.track?.uri ?? '', pos: Math.max(0, p?.position ?? 0), at: Date.now(), playing: !!p?.isPlaying };
}

function emitPlay(): void {
  const now = playback();
  for (const fn of playListeners) fn(now);
}

async function load(uri: string): Promise<void> {
  if (song?.uri === uri || loading === uri) return;
  song = null;
  for (const fn of songListeners) fn(null);
  if (!uri.startsWith('spotify:track:')) return;
  loading = uri;
  try {
    const a = await (window as any).SpotiKit.Audio.analysis(uri);
    if (loading !== uri || !a?.segments?.length) return;
    const segs = a.segments;
    const end = segs[segs.length - 1];
    const duration = a.track?.duration ?? end.start + end.duration;
    const { levels } = computeLevels(a, duration);
    const segPitches = new Float32Array(segs.length * 12);
    segs.forEach((s: any, i: number) => s.pitches?.forEach((v: number, k: number) => { segPitches[i * 12 + k] = v; }));
    song = {
      uri,
      duration,
      step: SAMPLE_STEP,
      bands: levels.map((band) => Float32Array.from(band, (v) => Math.max(0, (v - FLOOR) / (1 - FLOOR)))),
      segStarts: Float32Array.from(segs, (s: any) => s.start),
      segPitches,
    };
  } catch {
  } finally {
    if (loading === uri) loading = '';
  }
  for (const fn of songListeners) fn(song);
  emitPlay();
}

function install(): void {
  if (installed) return;
  installed = true;
  const p = player();
  p?.on?.('track', () => {
    void load(player()?.track?.uri ?? '');
    emitPlay();
  });
  p?.on?.('playpause', emitPlay);
  p?.on?.('state', emitPlay);
  void load(p?.track?.uri ?? '');
}

function updateResync(): void {
  const wanted = playListeners.size > 0;
  if (wanted && !resync) resync = window.setInterval(emitPlay, 1000);
  if (!wanted && resync) {
    clearInterval(resync);
    resync = 0;
  }
}

export function watchSong(fn: (song: SongData | null) => void): () => void {
  install();
  songListeners.add(fn);
  fn(song);
  return () => songListeners.delete(fn);
}

export function watchPlayback(fn: (play: Playback) => void): () => void {
  install();
  playListeners.add(fn);
  updateResync();
  fn(playback());
  return () => {
    playListeners.delete(fn);
    updateResync();
  };
}
