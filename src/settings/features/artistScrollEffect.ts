import { HEADER_IMAGE, ensureStyleTag, readNum } from '../shared';

const KEYFRAMES = 'liquify-artist-scroll';

export function applyArtistScrollEffect(blur: number, brightness: number) {
  localStorage.setItem("liquify-artist-scroll-blur", String(blur));
  localStorage.setItem("liquify-artist-scroll-brightness", String(brightness));
  const style = ensureStyleTag("liquify-artist-scroll-effect");
  const brightnessVal = (brightness / 100).toFixed(2);
  style.textContent = `
${HEADER_IMAGE} {
  animation-name: ${KEYFRAMES};
}
@keyframes ${KEYFRAMES} {
  0% {
    transform: none;
    filter: blur(0px) brightness(${brightnessVal});
  }
  40%, 100% {
    transform: scale(1.5);
    filter: blur(${blur}px) brightness(${brightnessVal});
  }
}`;
}

export function ensureArtistScrollEffectApplied() {
  const blur = readNum("liquify-artist-scroll-blur", 15);
  const brightness = readNum("liquify-artist-scroll-brightness", 70);
  applyArtistScrollEffect(blur, brightness);
}
