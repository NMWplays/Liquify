export const PLAYBAR_WORKER = `
const BAR_WIDTH = 5;
const BAR_GAP = 3;
const MIN_BAR = 3;
const ATTACK = 0.035;
const RELEASE = 0.14;
const raf = self.requestAnimationFrame ? (fn) => self.requestAnimationFrame(fn) : (fn) => setTimeout(() => fn(performance.now()), 16);

let canvas = null;
let ctx = null;
let width = 0;
let height = 40;
let dpr = 1;
let color = "#ffffff";
let song = null;
let play = { uri: "", pos: 0, at: 0, playing: false };
let shown = new Float32Array(0);
let weights = new Float32Array(0);
let frame = 0;
let last = 0;
const bands = new Float32Array(5);

function resize() {
  if (!canvas) return;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.max(0, Math.floor((width + BAR_GAP) / (BAR_WIDTH + BAR_GAP)));
  if (count !== shown.length) {
    shown = new Float32Array(count);
    weights = new Float32Array(count);
    for (let i = 0; i < count; i++) weights[i] = 0.82 + 0.18 * Math.abs(Math.sin(i * 12.9898));
  }
}

function sample(t) {
  const x = t / song.step;
  const n = Math.floor(x);
  const f = x - n;
  for (let k = 0; k < 5; k++) {
    const band = song.bands[k];
    const a = band[Math.min(n, band.length - 1)] || 0;
    const b = band[Math.min(n + 1, band.length - 1)] || a;
    bands[k] = a + (b - a) * f;
  }
  const starts = song.segStarts;
  let lo = 0;
  let hi = starts.length - 1;
  if (hi < 0 || starts[0] > t) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo * 12;
}

function tick(now) {
  frame = 0;
  if (!ctx) return;
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 1 / 60);
  last = now;
  const live = !!song && play.playing && play.uri === song.uri;
  let pitch = -1;
  if (live) {
    const t = Math.min(song.duration, Math.max(0, (play.pos + Date.now() - play.at) / 1000));
    pitch = sample(t);
  }
  const up = 1 - Math.exp(-dt / ATTACK);
  const down = 1 - Math.exp(-dt / RELEASE);
  const count = shown.length;
  let moving = false;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    let goal = 0;
    if (live) {
      const x = count > 1 ? Math.abs(i / (count - 1) - 0.5) * 2 : 0;
      const pos = x * 4;
      const k = Math.floor(pos);
      const f = pos - k;
      const a = bands[k];
      const b = bands[Math.min(k + 1, 4)];
      const tone = pitch >= 0 ? song.segPitches[pitch + ((i * 7) % 12)] : 0;
      goal = Math.min(1, (a + (b - a) * f) * (0.7 + 0.3 * tone) * weights[i]);
    }
    shown[i] += (goal - shown[i]) * (goal > shown[i] ? up : down);
    if (shown[i] > 0.005) moving = true;
    const h = MIN_BAR + shown[i] * (height - MIN_BAR);
    ctx.roundRect(i * (BAR_WIDTH + BAR_GAP), height - h, BAR_WIDTH, h, BAR_WIDTH / 2);
  }
  ctx.fill();
  if (live || moving) frame = raf(tick);
  else last = 0;
}

self.onmessage = (event) => {
  const m = event.data;
  if (m.type === "canvas") {
    canvas = m.canvas;
    ctx = canvas.getContext("2d");
  } else if (m.type === "size") {
    width = m.width;
    height = m.height;
    dpr = m.dpr;
    resize();
  } else if (m.type === "color") color = m.color;
  else if (m.type === "song") song = m.song;
  else if (m.type === "play") play = m.play;
  if (!frame && ctx) frame = raf(tick);
};
`;
