import { readLS, readNum, updateStyle } from '../shared';
import { refreshMiniPlayer } from './miniPlayer';
import { PLAYING_CLASS, installPlayState } from './playState';
import { PLAYBAR_COVER_BUTTON, PLAYBAR_COVER_SLOT } from './playbarCoverRadius';

const STYLE_ID = 'liquify-vinyl-style';
const NPV_COVER_SLOT = '.npv-cover-art-slot';
const CINEMA_COVER = '.cinema-artwork';
const CINEMA_COVER_INNER = '.tilt-artwork-inner';
const NPV_ARM_HOST = '.npv-cover-art-section';
const CINEMA_ARM_HOST = '.tilt-artwork';

export const VINYL_SPEED_KEY = 'liquify-vinyl-speed';
export const VINYL_SPEED_DEFAULT = 12;

export const VINYL_SURFACES = {
  npv: { key: 'liquify-vinyl-npv' },
  playbar: { key: 'liquify-vinyl-playbar' },
  cinema: { key: 'liquify-vinyl-cinema' },
  miniPlayer: { key: 'liquify-vinyl-mini-player' },
} as const;

export type VinylSurface = keyof typeof VINYL_SURFACES;

export function isVinylOn(surface: VinylSurface): boolean {
  return readLS(VINYL_SURFACES[surface].key, 'off') === 'on';
}

export const VINYL_DETAILS = {
  grooves: { key: 'liquify-vinyl-grooves', fallback: 'on' },
  label: { key: 'liquify-vinyl-label', fallback: 'on' },
  tonearm: { key: 'liquify-vinyl-tonearm', fallback: 'off' },
} as const;

export type VinylDetail = keyof typeof VINYL_DETAILS;

export function isVinylDetailOn(detail: VinylDetail): boolean {
  const spec = VINYL_DETAILS[detail];
  return readLS(spec.key, spec.fallback) === 'on';
}

export function discFurniture(disc: string): string {
  const grooves = isVinylDetailOn('grooves');
  const centre = isVinylDetailOn('label');
  const layers = [grooves && `${disc}::before`, centre && `${disc}::after`].filter(Boolean);
  if (!layers.length) return '';
  return `
${layers.join(',\n')} {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
}
${grooves ? `
${disc}::before {
  background: repeating-radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.055) 0 1px,
    rgba(0, 0, 0, 0.14) 1px 3px
  );
  opacity: 0.5;${centre ? `
  mask-image: radial-gradient(circle at 50% 50%, transparent 0 22%, black 26%);
  -webkit-mask-image: radial-gradient(circle at 50% 50%, transparent 0 22%, black 26%);` : ''}
}` : ''}
${centre ? `
${disc}::after {
  background:
    radial-gradient(circle at 50% 50%, #06080b 0 6.5%, transparent 6.6%),
    radial-gradient(circle at 50% 50%, var(--liquify-accent, var(--accent-color, #1ed760)) 0 17%, transparent 17.1%);
}` : ''}`;
}

const TONEARM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
<linearGradient id="alu" x1="0" x2="1"><stop offset="0" stop-color="#5b5e64"/><stop offset=".22" stop-color="#c9cbd0"/><stop offset=".42" stop-color="#ffffff"/><stop offset=".62" stop-color="#b4b6bc"/><stop offset="1" stop-color="#4f5258"/></linearGradient>
<linearGradient id="gph" x1="0" x2="1"><stop offset="0" stop-color="#101114"/><stop offset=".35" stop-color="#4a4c53"/><stop offset=".55" stop-color="#2a2b31"/><stop offset="1" stop-color="#0c0d0f"/></linearGradient>
<linearGradient id="disc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f7f9"/><stop offset=".5" stop-color="#9a9da3"/><stop offset="1" stop-color="#e2e3e7"/></linearGradient>
<radialGradient id="base" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#34363c"/><stop offset="1" stop-color="#0e0f12"/></radialGradient>
</defs>
<circle cx="86" cy="14" r="10" fill="url(#base)" stroke="rgba(255,255,255,.16)" stroke-width=".5"/>
<circle cx="86" cy="14" r="7.6" fill="none" stroke="rgba(255,255,255,.08)" stroke-width=".5"/>
<g transform="rotate(13.1 86 14)">
<rect x="82.3" y="1.6" width="7.4" height="8" rx="1.3" fill="url(#gph)"/>
<rect x="82.3" y="4.2" width="7.4" height=".45" fill="rgba(255,255,255,.22)"/>
<rect x="82.3" y="6.6" width="7.4" height=".45" fill="rgba(255,255,255,.22)"/>
<rect x="84.9" y="8.8" width="2.2" height="4" fill="url(#alu)"/>
<path d="M84.6 15.5h2.8l-.5 47.2h-1.8z" fill="url(#alu)"/>
<g transform="rotate(16 86 62)">
<path d="M84.1 61.4h3.8l.5 9.4h-4.8z" fill="url(#alu)"/>
<rect x="88.1" y="63.2" width="4.4" height="1.1" rx=".55" fill="url(#alu)"/>
<rect x="84" y="69.4" width="4" height="3.6" rx=".7" fill="url(#gph)"/>
<rect x="84.4" y="69.7" width="3.2" height=".35" fill="rgba(255,255,255,.18)"/>
<rect x="85.6" y="72.9" width=".8" height="1" rx=".2" fill="#c8a24a"/>
</g>
</g>
<circle cx="86" cy="14" r="5.6" fill="url(#disc)"/>
<circle cx="86" cy="14" r="5.6" fill="none" stroke="rgba(0,0,0,.35)" stroke-width=".4"/>
<circle cx="86" cy="14" r="2.6" fill="url(#gph)"/>
<circle cx="85.2" cy="13.2" r=".7" fill="rgba(255,255,255,.55)"/>
</svg>`;

function tonearmCss(host: string, layer: '::before' | '::after' = '::after'): string {
  return `
${host} { position: relative; }
${host}${layer} {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  background: url("data:image/svg+xml,${encodeURIComponent(TONEARM_SVG)}") center / 100% 100% no-repeat;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.4)) drop-shadow(2px 5px 6px rgba(0, 0, 0, 0.35));
  transform-origin: 86% 14%;
  rotate: -28deg;
  transition: rotate 0.9s cubic-bezier(0.45, 0.05, 0.25, 1);
}
${host}:is(html.${PLAYING_CLASS} *)${layer} {
  rotate: 0deg;
  animation: liquify-tonearm-ride 3.4s ease-in-out 0.9s infinite;
}`;
}

// The picture spins inside a round clip, never the disc: a turning square flickers scrollbars.
function vinylCss(disc: string, art: string): string {
  return `
${disc} {
  border-radius: 50% !important;
  overflow: hidden !important;
  position: relative;
}
${art} {
  border-radius: 50% !important;
  animation: liquify-vinyl-spin var(--liquify-vinyl-spin, 12s) linear infinite;
  animation-play-state: paused;
}
/* Appended rather than put in front: the art selector may start with :root,
   which has no ancestor for html.${PLAYING_CLASS} to be. */
${art}:is(html.${PLAYING_CLASS} *) { animation-play-state: running; }
${discFurniture(disc)}`;
}

function buildCss(): string {
  const parts: string[] = [];
  const tonearm = isVinylDetailOn('tonearm');

  if (isVinylOn('npv')) {
    const slot = `${NPV_COVER_SLOT}:not(:has(#cs-track))`;
    parts.push(vinylCss(slot, `${slot} img`));
    parts.push(`
#cs-track .cs-slot { border-radius: 50% !important; }
#cs-track .cs-face {
  border-radius: 50% !important;
  animation: liquify-vinyl-spin var(--liquify-vinyl-spin, 12s) linear infinite;
  animation-play-state: paused;
}
html.${PLAYING_CLASS} #cs-track .cs-face { animation-play-state: running; }
${discFurniture('#cs-track .cs-face')}`);
    if (tonearm) parts.push(tonearmCss(NPV_ARM_HOST));
  }

  if (isVinylOn('playbar')) {
    const slot = `:root ${PLAYBAR_COVER_SLOT}`;
    parts.push(vinylCss(
      `${slot} ${PLAYBAR_COVER_BUTTON}`,
      `${slot} ${PLAYBAR_COVER_BUTTON} img`,
    ));
    parts.push(`
${slot} {
  border-radius: 50% !important;
  background: transparent !important;
}`);
    if (tonearm) parts.push(`${slot} { overflow: visible !important; }`, tonearmCss(slot, '::before'));
  }

  if (isVinylOn('cinema')) {
    parts.push(vinylCss(
      `${CINEMA_COVER} ${CINEMA_COVER_INNER}`,
      `${CINEMA_COVER} ${CINEMA_COVER_INNER} img`,
    ));
    if (tonearm) parts.push(tonearmCss(`${CINEMA_COVER} ${CINEMA_ARM_HOST}`));
  }

  if (parts.length === 0) return '';

  const seconds = Math.max(1, readNum(VINYL_SPEED_KEY, VINYL_SPEED_DEFAULT));
  return `:root { --liquify-vinyl-spin: ${seconds}s; }
${parts.join('\n')}

@keyframes liquify-vinyl-spin { to { transform: rotate(360deg); } }
@keyframes liquify-tonearm-ride { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(0.7deg); } }

@media (prefers-reduced-motion: reduce) {
  html.${PLAYING_CLASS} :is([class*="cover-art"], ${NPV_COVER_SLOT} img, ${CINEMA_COVER} img, ${PLAYBAR_COVER_BUTTON} img, .cs-face) { animation: none !important; }
  :is(${NPV_ARM_HOST}, ${CINEMA_ARM_HOST})::after,
  ${PLAYBAR_COVER_SLOT}::before { animation: none !important; transition: none !important; }
}`;
}

function applyCss(): void {
  updateStyle(STYLE_ID, buildCss());
  refreshMiniPlayer();
}

export function setVinyl(surface: VinylSurface, mode: string): void {
  localStorage.setItem(VINYL_SURFACES[surface].key, mode === 'on' ? 'on' : 'off');
  applyCss();
}

export function setVinylDetail(detail: VinylDetail, on: boolean): void {
  localStorage.setItem(VINYL_DETAILS[detail].key, on ? 'on' : 'off');
  applyCss();
}

export function setVinylSpeed(seconds: number): void {
  localStorage.setItem(VINYL_SPEED_KEY, String(seconds));
  applyCss();
}

export function resetVinyl(): void {
  for (const surface of Object.keys(VINYL_SURFACES) as VinylSurface[]) {
    localStorage.setItem(VINYL_SURFACES[surface].key, 'off');
  }
  for (const spec of Object.values(VINYL_DETAILS)) localStorage.setItem(spec.key, spec.fallback);
  localStorage.setItem(VINYL_SPEED_KEY, String(VINYL_SPEED_DEFAULT));
  applyCss();
}

export function ensureVinylApplied(): void {
  installPlayState();
  applyCss();
}
