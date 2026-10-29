export type Option = { value: string; label: string };
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function readLS(key: string, fallback: string): string {
  const value = localStorage.getItem(key);
  return value === null || value === '' ? fallback : value;
}

export function readNum(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  const parsed = raw === null ? NaN : parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function ensureStyleTag(id: string): HTMLStyleElement {
  let style = document.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    document.head.appendChild(style);
  }
  return style;
}

export function updateStyle(id: string, css: string): void {
  const style = ensureStyleTag(id);
  if (style.textContent !== css) style.textContent = css;
}

export const HEADER_IMAGE = '.main-view-container .entity-background-image';

export const ARTIST_HEADER_IMAGE =
  '.main-view-container:has([data-testid="artist-page"]) .entity-background-image';

export const CANVAS_CONTAINER_SEL = '.npv-canvas-container';

export function hasMountedCanvasMedia(el: Element | null): boolean {
  if (!el) return false;
  if (el.querySelector('video')) return true;
  const img = el.querySelector('img');
  return !!img && !!img.getAttribute('src');
}

export function getOsName(): string {
  return ((window as any).SpotiKit?.Platform?.operatingSystem || navigator.platform || '')
    .toString()
    .toLowerCase();
}

export function isUnixLikeOS(): boolean {
  const os = getOsName();
  return (
    os.includes('linux') ||
    os.includes('mac') ||
    os.includes('darwin') ||
    os.includes('osx') ||
    os.includes('macos')
  );
}
