import { CANVAS_CONTAINER_SEL, hasMountedCanvasMedia, readLS, readNum, sleep, updateStyle } from '../shared';

export const NPVC_MODE_KEY = "liquify-npv-cover-mode";
export const NPVC_SHOW_ALWAYS_KEY = "liquify-npv-cover-show-always";
export const NPVC_BLUR_KEY = "liquify-npv-cover-blur";
export const NPVC_DEFAULTS = {
  mode: "outsideTrackInfo",
  showAlways: "no",
  blur: 7,
};

export function installNowPlayingViewCover() {
  const TITLE_ROW = ".npv-track-header";
  const TITLE_BOX = ".npv-track-text";
  const COVER_SLOT = ".npv-canvas-frame";
  const CANVAS_VIDEO = ".npv-canvas-container video";
  const COVER_CLASS = "liquify-npv-cover";
  const STYLE_ID = "liquify-npv-cover-style";

  function getMode(): string {
    return readLS(NPVC_MODE_KEY, NPVC_DEFAULTS.mode);
  }

  function getShowAlways(): boolean {
    return readLS(NPVC_SHOW_ALWAYS_KEY, NPVC_DEFAULTS.showAlways) === "yes";
  }

  function getBlur(): number {
    return readNum(NPVC_BLUR_KEY, NPVC_DEFAULTS.blur);
  }

  function isCanvasPlaying(): boolean {
    return hasMountedCanvasMedia(document.querySelector(CANVAS_CONTAINER_SEL));
  }

  function coverUrl(): string {
    const meta = SpotiKit.Player?.track?.metadata || {};
    const raw = meta.image_xlarge_url || meta.image_large_url || meta.image_url || meta.image_small_url || "";
    return raw.startsWith("spotify:image:") ? `https://i.scdn.co/image/${raw.slice(14)}` : raw;
  }

  const LEAVE_MS = 320;
  const ROOM_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
  const ROOM_MS = 460;

  function removeCover() {
    const covers = document.querySelectorAll(`.${COVER_CLASS}:not(.is-leaving)`);
    if (covers.length === 0) return;
    covers.forEach((el) => el.classList.add("is-leaving"));
    setTimeout(() => {
      covers.forEach((el) => el.remove());
      if (!document.querySelector(`.${COVER_CLASS}`)) updateStyle(STYLE_ID, "");
    }, LEAVE_MS);
  }

  function placeCover(parent: Element | null, mode: string) {
    if (!parent) return;
    const src = coverUrl();
    let cover = parent.querySelector(`:scope > .${COVER_CLASS}:not(.is-leaving)`) as HTMLElement | null;
    document.querySelectorAll(`.${COVER_CLASS}`).forEach((el) => { if (el !== cover) el.remove(); });
    if (!cover) {
      cover = document.createElement("div");
      cover.className = COVER_CLASS;
      const img = document.createElement("img");
      img.draggable = false;
      img.alt = "";
      cover.append(img);
      parent.prepend(cover);
    }
    if (cover.dataset.mode !== mode) cover.dataset.mode = mode;
    const img = cover.querySelector("img") as HTMLImageElement;
    if (src && img.src !== src) img.src = src;
  }

  const BASE_CSS = `
.${COVER_CLASS} {
  position: relative;
  overflow: hidden;
  animation: liquify-npv-cover-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.${COVER_CLASS} > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}
.${COVER_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: var(--liquify-shadow);
  pointer-events: none;
}
.${COVER_CLASS}.is-leaving {
  animation: liquify-npv-cover-out ${LEAVE_MS}ms ease-in both;
}
@keyframes liquify-npv-cover-in {
  from { opacity: 0; transform: scale(0.8); }
}
@keyframes liquify-npv-cover-out {
  to { opacity: 0; transform: scale(0.85); }
}
@keyframes liquify-npv-cover-room-in {
  from { width: 0; margin-right: 0; }
}
@keyframes liquify-npv-cover-room-out {
  to { width: 0; margin-right: 0; }
}
@keyframes liquify-npv-cover-columns-in {
  from { grid-template-columns: 0px minmax(0, 1fr); column-gap: 0px; }
}
@keyframes liquify-npv-cover-columns-out {
  to { grid-template-columns: 0px minmax(0, 1fr); column-gap: 0px; }
}`;

  function css(mode: string): string {
    if (mode === "trackInfo") {
      return `${BASE_CSS}
${TITLE_BOX}:has(> .${COVER_CLASS}) {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  column-gap: 12px;
  align-items: center;
  animation: liquify-npv-cover-columns-in ${ROOM_MS}ms ${ROOM_EASING} both;
}
${TITLE_BOX}:has(> .${COVER_CLASS}.is-leaving) {
  animation: liquify-npv-cover-columns-out ${LEAVE_MS}ms ${ROOM_EASING} both;
}
${TITLE_BOX} > .${COVER_CLASS} {
  grid-row: 1 / span 2;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
}
${TITLE_BOX}:has(> .${COVER_CLASS}) > :not(.${COVER_CLASS}) { grid-column: 2; }`;
    }
    if (mode === "outsideTrackInfo") {
      return `${BASE_CSS}
${TITLE_ROW} > .${COVER_CLASS} {
  flex: none;
  align-self: center;
  width: 70px;
  aspect-ratio: 1;
  margin-right: 12px;
  border-radius: 14px;
  animation:
    liquify-npv-cover-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both,
    liquify-npv-cover-room-in ${ROOM_MS}ms ${ROOM_EASING} both;
}
${TITLE_ROW} > .${COVER_CLASS}.is-leaving {
  animation:
    liquify-npv-cover-out ${LEAVE_MS}ms ease-in both,
    liquify-npv-cover-room-out ${LEAVE_MS}ms ${ROOM_EASING} both;
}`;
    }
    return `${BASE_CSS}
${COVER_SLOT} > .${COVER_CLASS} {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: 20px;
}
${CANVAS_VIDEO} { filter: blur(${getBlur()}px); }`;
  }

  function apply() {
    const mode = getMode();
    if (mode === "off") { removeCover(); return; }

    const canvas = isCanvasPlaying();
    if (!canvas && (mode === "overCanvas" || !getShowAlways())) { removeCover(); return; }

    const parent =
      mode === "trackInfo" ? document.querySelector(TITLE_BOX) :
      mode === "outsideTrackInfo" ? document.querySelector(TITLE_ROW) :
      document.querySelector(COVER_SLOT);
    placeCover(parent, mode);
    updateStyle(STYLE_ID, css(mode));
  }

  (async () => {
    while (typeof SpotiKit.Player?.on !== "function") await sleep(300);
    SpotiKit.Player.on("track", () => {
      setTimeout(apply, 400);
      setTimeout(apply, 1000);
    });
  })();

  setInterval(apply, 1500);

  window.addEventListener("liquifyNpvcUpdate", () => {
    removeCover();
    setTimeout(apply, 100);
  });

  apply();
}
