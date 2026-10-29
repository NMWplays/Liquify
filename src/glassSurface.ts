const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

export interface GlassTarget {
  selector: string;
  blur?: number | string;
  before?: boolean;
  brightness?: number;
  distortion?: number;
  chromatic?: boolean;
}

interface Lens {
  distortion: number;
  chromatic: boolean;
}

const DEFAULT_LENS: Lens = { distortion: -80, chromatic: true };
const DEFAULT_FILTER_ID = 'glass-filter--r1-7';
const FILTER_HOST_ID = 'liquify-filter-host';
const STYLE_ID = 'liquify-glass-style';
const PERF_CLASS = 'liquify-perf-no-glass';
const GLASS_STORAGE_KEY = 'liquify-glass-enabled';
const PLAIN_BACKDROP = 'blur(var(--liquify-backdrop-blur, 2rem)) saturate(1.4)';
const BEFORE_LAYER =
  'content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;';

const CHANNELS = [
  { name: 'red', offset: 0, matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { name: 'green', offset: 6, matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { name: 'blue', offset: 10, matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' },
];

let svgFilterSupport: boolean | null = null;

let glassEnabled = readGlassEnabled();

function supportsSVGFilters(): boolean {
  if (svgFilterSupport !== null) return svgFilterSupport;

  const ua = navigator.userAgent;
  const isWebkit = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isFirefox = /Firefox/.test(ua);

  if (isWebkit || isFirefox) {
    svgFilterSupport = false;
  } else {
    const div = document.createElement('div');
    div.style.backdropFilter = 'url(#liquify-probe)';
    svgFilterSupport = div.style.backdropFilter !== '';
  }
  return svgFilterSupport;
}

function readGlassEnabled(): boolean {
  try {
    return localStorage.getItem(GLASS_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function isGlassEnabled(): boolean {
  return glassEnabled;
}

export function setGlassEnabled(enabled: boolean): void {
  glassEnabled = enabled;
  try {
    localStorage.setItem(GLASS_STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
  }
  syncPerfClass();
}

function syncPerfClass(): void {
  document.documentElement.classList.toggle(PERF_CLASS, !glassEnabled || !supportsSVGFilters());
}

export function installGlassDevtools(): void {
  window.liquifyGlass = {
    enable: () => setGlassEnabled(true),
    disable: () => setGlassEnabled(false),
    toggle: () => setGlassEnabled(!glassEnabled),
    get enabled(): boolean {
      return glassEnabled;
    },
  };
}

export function applyGlass(targets: GlassTarget[]): void {
  const lenses = new Map<string, Lens>([[DEFAULT_FILTER_ID, DEFAULT_LENS]]);
  const groups = new Map<string, { before: boolean; glass: string; plain: string; selectors: string[] }>();

  for (const target of targets) {
    const selector = target.selector.includes(',') ? `:is(${target.selector})` : target.selector;
    const before = target.before === true;
    if (!isValidSelector(selector) || (before && selector.includes('::'))) {
      console.warn(`[Liquify] Skipping invalid glass selector: ${target.selector}`);
      continue;
    }

    const lens: Lens = {
      distortion: target.distortion ?? DEFAULT_LENS.distortion,
      chromatic: target.chromatic ?? DEFAULT_LENS.chromatic,
    };
    const filterId = lensFilterId(lens);
    lenses.set(filterId, lens);

    const bright = target.brightness != null ? ` brightness(${target.brightness})` : '';
    const blur =
      typeof target.blur === 'number' ? `${target.blur}px` : (target.blur ?? 'var(--liquify-glass-blur, 2px)');
    const glass = `url(#${filterId}) blur(${blur})${bright}`;
    const key = `${before}|${glass}`;
    let group = groups.get(key);
    if (!group) {
      group = { before, glass, plain: PLAIN_BACKDROP + bright, selectors: [] };
      groups.set(key, group);
    }
    group.selectors.push(before ? `${selector}::before` : selector);
  }

  let glassCss = '';
  let perfCss = '';
  // Keeps the ::before glass above the element's own inset highlights.
  const isolated = [...groups.values()]
    .filter((group) => group.before)
    .flatMap((group) => group.selectors.map((s) => s.slice(0, -'::before'.length)));
  if (isolated.length) glassCss += `${isolated.join(',')}{isolation:isolate;}`;
  for (const group of groups.values()) {
    const layer = group.before ? BEFORE_LAYER : '';
    glassCss += `${group.selectors.join(',')}{${layer}backdrop-filter:${group.glass};}`;
    perfCss += `${group.selectors.map((s) => `html.${PERF_CLASS} ${s}`).join(',')}{backdrop-filter:${group.plain};}`;
  }

  if (supportsSVGFilters()) buildFilterHost(lenses);

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = glassCss + perfCss;
  syncPerfClass();
}

const selectorProbe = document.createDocumentFragment();

function isValidSelector(selector: string): boolean {
  try {
    selectorProbe.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

function lensFilterId(lens: Lens): string {
  if (lens.distortion === DEFAULT_LENS.distortion && lens.chromatic === DEFAULT_LENS.chromatic) {
    return DEFAULT_FILTER_ID;
  }
  return `liquify-lens${lens.distortion}${lens.chromatic ? '' : '-mono'}`.replace(/[^\w-]/g, '_');
}

function svgElement(name: string, attrs: Record<string, string>): SVGElement {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function buildFilterHost(lenses: Map<string, Lens>): void {
  document.getElementById(FILTER_HOST_ID)?.remove();

  const host = svgElement('svg', { id: FILTER_HOST_ID, width: '0', height: '0', 'aria-hidden': 'true' });
  const defs = svgElement('defs', {});
  const map = displacementMap();
  for (const [id, lens] of lenses) defs.appendChild(buildFilter(id, lens, map));
  host.appendChild(defs);
  document.body.appendChild(host);
}

function buildFilter(id: string, lens: Lens, map: string): SVGElement {
  const filter = svgElement('filter', {
    id,
    'color-interpolation-filters': 'sRGB',
    x: '0%',
    y: '0%',
    width: '100%',
    height: '100%',
  });

  const image = svgElement('feImage', {
    x: '0',
    y: '0',
    width: '100%',
    height: '100%',
    preserveAspectRatio: 'none',
    result: 'map',
    href: map,
  });
  image.setAttributeNS(XLINK_NS, 'xlink:href', map);
  filter.appendChild(image);

  const displace = (scale: number, result: string): SVGElement =>
    svgElement('feDisplacementMap', {
      in: 'SourceGraphic',
      in2: 'map',
      scale: String(scale),
      xChannelSelector: 'R',
      yChannelSelector: 'G',
      result,
    });

  if (lens.chromatic) {
    for (const channel of CHANNELS) {
      filter.appendChild(displace(lens.distortion + channel.offset, `disp-${channel.name}`));
      filter.appendChild(
        svgElement('feColorMatrix', {
          in: `disp-${channel.name}`,
          type: 'matrix',
          values: channel.matrix,
          result: channel.name,
        })
      );
    }
    filter.appendChild(svgElement('feBlend', { in: 'red', in2: 'green', mode: 'screen', result: 'rg' }));
    filter.appendChild(svgElement('feBlend', { in: 'rg', in2: 'blue', mode: 'screen', result: 'output' }));
  } else {
    filter.appendChild(displace(lens.distortion, 'output'));
  }

  filter.appendChild(svgElement('feGaussianBlur', { in: 'output', stdDeviation: '0.2' }));
  return filter;
}

function displacementMap(): string {
  const w = 400;
  const h = 200;
  const r = 20;
  const edge = Math.min(w, h) * (0.07 * 0.5);
  const svg =
    `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs>` +
    `<linearGradient id="lq-red" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>` +
    `<linearGradient id="lq-blue" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>` +
    `</defs>` +
    `<rect x="0" y="0" width="${w}" height="${h}" fill="black"></rect>` +
    `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#lq-red)" />` +
    `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#lq-blue)" style="mix-blend-mode: screen" />` +
    `<rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${r}" fill="hsl(0 0% 50% / 0.93)" style="filter:blur(2px)" />` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
