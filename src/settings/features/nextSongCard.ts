import { readLS, readNum, sleep, updateStyle } from '../shared';
import { getPlayerElement } from './player';

export const NSC_SHOW_KEY = "liquify-nsc-show";
export const NSC_POSITION_KEY = "liquify-nsc-position";
export const NSC_HEIGHT_KEY = "liquify-nsc-height";
export const NSC_MAX_WIDTH_KEY = "liquify-nsc-max-width";
export const NSC_GAP_KEY = "liquify-nsc-gap";
export const NSC_COVER_SIZE_KEY = "liquify-nsc-cover-size";
export const NSC_HPAD_KEY = "liquify-nsc-hpad";
export const NSC_VPAD_KEY = "liquify-nsc-vpad";
export const NSC_GAP_PLAYER_KEY = "liquify-nsc-gap-player";
export const NSC_BORDER_RADIUS_KEY = "liquify-nsc-border-radius";
export const NSC_COVER_BORDER_RADIUS_KEY = "liquify-nsc-cover-border-radius";
export const NSC_BLUR_KEY = "liquify-nsc-blur";
export const NSC_COVER_FLIP_KEY = "liquify-nsc-cover-flip";

export function isNscCoverFlipOn(): boolean {
  return readLS(NSC_COVER_FLIP_KEY, "on") === "on";
}

export const NSC_DEFAULTS = {
  show: "show",
  position: "left",
  height: 80,
  maxWidth: 256,
  gap: 10,
  coverSize: 55,
  hPad: 10,
  vPad: 8,
  gapToPlayer: 7,
  borderRadius: 20,
  coverBorderRadius: 13,
  blur: 5,
};

export function getNscValues() {
  return {
    show: readLS(NSC_SHOW_KEY, NSC_DEFAULTS.show),
    position: readLS(NSC_POSITION_KEY, NSC_DEFAULTS.position),
    height: readNum(NSC_HEIGHT_KEY, NSC_DEFAULTS.height),
    maxWidth: readNum(NSC_MAX_WIDTH_KEY, NSC_DEFAULTS.maxWidth),
    gap: readNum(NSC_GAP_KEY, NSC_DEFAULTS.gap),
    coverSize: readNum(NSC_COVER_SIZE_KEY, NSC_DEFAULTS.coverSize),
    hPad: readNum(NSC_HPAD_KEY, NSC_DEFAULTS.hPad),
    vPad: readNum(NSC_VPAD_KEY, NSC_DEFAULTS.vPad),
    gapToPlayer: readNum(NSC_GAP_PLAYER_KEY, NSC_DEFAULTS.gapToPlayer),
    borderRadius: readNum(NSC_BORDER_RADIUS_KEY, NSC_DEFAULTS.borderRadius),
    coverBorderRadius: readNum(NSC_COVER_BORDER_RADIUS_KEY, NSC_DEFAULTS.coverBorderRadius),
    blur: readNum(NSC_BLUR_KEY, NSC_DEFAULTS.blur),
  };
}

export function applyNextSongCardStyle() {
  const v = getNscValues();
  if (v.show === "hide") {
    updateStyle("liquify-next-song-card-style", "#liquify-next-song-card { display: none !important; }");
    return;
  }

  const css = `
    #liquify-next-song-card {
      --glass-filter: url(#glass-filter--r1-7);
      position: fixed;
      z-index: 999;
      height: ${v.height}px;
      max-width: ${v.maxWidth}px;
      padding: ${v.vPad}px ${v.hPad}px;
      display: flex;
      align-items: center;
      gap: ${v.gap}px;
      border-radius: ${v.borderRadius}px;
      --liquify-nsc-blur: ${v.blur}px;
      background-color: transparent;
      box-shadow: var(--liquify-shadow);
      color: #fff;
      pointer-events: auto;
      overflow: hidden;
      isolation: isolate;
      transition: opacity 0.3s ease, transform 0.3s ease, width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      box-sizing: border-box;
    }
    #liquify-next-song-card.nsc-hidden {
      opacity: 0;
      transform: translateY(6px);
      pointer-events: none;
    }
    #liquify-next-song-card.nsc-cinema-hidden {
      opacity: 0;
      pointer-events: none;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      box-shadow: none !important;
    }
    #liquify-next-song-card.nsc-unplaced {
      opacity: 0;
      pointer-events: none;
    }
    #liquify-next-song-card.nsc-watchfeed-hidden {
      opacity: 0;
      pointer-events: none;
    }
    #liquify-next-song-card .nsc-cover-frame {
      position: relative;
      width: ${v.coverSize}px;
      height: ${v.coverSize}px;
      border-radius: ${v.coverBorderRadius}px;
      overflow: hidden;
      flex-shrink: 0;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    #liquify-next-song-card .nsc-cover-frame:hover {
      transform: scale(1.08);
    }
    #liquify-next-song-card .nsc-cover-frame::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: var(--liquify-shadow);
      pointer-events: none;
    }
    #liquify-next-song-card .nsc-cover {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
    }
    #liquify-next-song-card .nsc-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      min-width: 0;
      gap: 1px;
    }
    #liquify-next-song-card .nsc-marquee {
      overflow: hidden;
      white-space: nowrap;
      position: relative;
      line-height: 0.5;
    }
    #liquify-next-song-card .nsc-marquee.nsc-scrolling {
      mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
    }
    #liquify-next-song-card .nsc-marquee-inner {
      display: inline-block;
      white-space: nowrap;
    }
    #liquify-next-song-card .nsc-marquee.nsc-scrolling .nsc-marquee-inner {
    }
    #liquify-next-song-card .nsc-title-link,
    #liquify-next-song-card .nsc-artist-link {
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }
    #liquify-next-song-card .nsc-title-link:hover,
    #liquify-next-song-card .nsc-artist-link:hover {
      text-decoration: underline;
    }
    #liquify-next-song-card .nsc-title {
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      line-height: 1.3;
      color: var(--text-base, #fff);
    }
    #liquify-next-song-card .nsc-artist {
      font-size: 11px;
      font-weight: 400;
      opacity: 0.7;
      white-space: nowrap;
      line-height: 1.3;
      color: var(--text-subdued, rgba(255,255,255,0.7));
    }
  `;
  updateStyle("liquify-next-song-card-style", css);
}

export function installNextSongCard() {
  applyNextSongCardStyle();

  let card: HTMLElement | null = null;
  let lastUri = "";

  const PLAYABLE_URI = /^spotify:(track|episode|local):/;

  function isPlayableEntry(track: any): boolean {
    const uri = track?.uri;
    if (typeof uri !== "string" || !PLAYABLE_URI.test(uri)) return false;
    return !!String(track?.metadata?.title || "").trim();
  }

  function getNextTrack() {
    try {
      const queue = SpotiKit.Platform?.PlayerAPI?._queue;
      const nextTracks = (queue?._queue || queue?._state)?.nextTracks;
      if (!nextTracks || nextTracks.length === 0) return null;
      for (const entry of nextTracks) {
        const t = entry?.contextTrack || entry;
        if (isPlayableEntry(t)) return t;
      }
      return null;
    } catch {
      return null;
    }
  }

  function extractImageUrl(track: any): string {
    try {
      const meta = track.metadata || {};
      if (meta.image_url) return meta.image_url;
      if (meta.image_xlarge_url) return meta.image_xlarge_url;
      if (meta.image_large_url) return meta.image_large_url;
      if (meta.image_small_url) return meta.image_small_url;

      const artUri = meta.artist_uri || "";
      const albumImages = meta["image_url"] || "";
      if (albumImages && albumImages.startsWith("spotify:image:")) {
        const id = albumImages.replace("spotify:image:", "");
        return `https://i.scdn.co/image/${id}`;
      }
    } catch {}
    return "";
  }

  function resolveSpotifyImage(url: string): string {
    if (!url) return "";
    if (url.startsWith("spotify:image:")) {
      const id = url.replace("spotify:image:", "");
      return `https://i.scdn.co/image/${id}`;
    }
    return url;
  }

  function openUri(uri: string) {
    const parts = uri.split(":");
    if (parts.length >= 3) SpotiKit.Navigation?.go(`/${parts[1]}/${parts.slice(2).join(":")}`);
  }

  function ensureCard() {
    if (!card || !card.isConnected) {
      card = document.createElement("div");
      card.id = "liquify-next-song-card";
      card.className = "nsc-hidden";
      card.innerHTML = `
        <div class="nsc-cover-frame"><img class="nsc-cover" src="" alt="" data-uri="" /></div>
        <div class="nsc-info">
          <div class="nsc-marquee nsc-title-wrap">
            <span class="nsc-marquee-inner"><a class="nsc-title nsc-title-link" href="#"></a></span>
          </div>
          <div class="nsc-marquee nsc-artist-wrap">
            <span class="nsc-marquee-inner"><a class="nsc-artist nsc-artist-link" href="#"></a></span>
          </div>
        </div>
      `;
      card.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("nsc-cover")) {
          e.preventDefault();
          openUri(target.getAttribute("data-uri") || "");
          return;
        }
        const link = target.closest("a[data-uri]") as HTMLAnchorElement | null;
        if (!link) return;
        e.preventDefault();
        openUri(link.getAttribute("data-uri") || "");
      });
      document.body.appendChild(card);
    }
    return card;
  }

  function resetMarquee(wrap: HTMLElement) {
    const inner = wrap.querySelector(".nsc-marquee-inner") as HTMLElement | null;
    if (!inner) return;
    wrap.classList.remove("nsc-scrolling");
    if ((inner as any)._nscAnim) {
      try { (inner as any)._nscAnim.cancel(); } catch {}
      (inner as any)._nscAnim = null;
    }
    inner.style.transform = "";
    while (inner.childElementCount > 1) inner.removeChild(inner.lastChild!);
  }

  function setupMarquee(wrap: HTMLElement) {
    const inner = wrap.querySelector(".nsc-marquee-inner") as HTMLElement | null;
    if (!inner) return;
    const textEl = inner.firstElementChild as HTMLElement | null;
    if (!textEl) return;
    resetMarquee(wrap);

    const origOverflow = wrap.style.overflow;
    wrap.style.overflow = "visible";
    const textWidth = inner.scrollWidth;
    const containerWidth = wrap.offsetWidth;
    wrap.style.overflow = origOverflow || "";

    if (textWidth > containerWidth && containerWidth > 0) {
      const gap = 48;

      const clone = textEl.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-uri");
      clone.style.pointerEvents = "none";
      clone.style.marginLeft = gap + "px";
      inner.appendChild(clone);

      const scrollDist = textWidth + gap;
      const duration = Math.max(5000, (scrollDist / 20) * 1000);

      wrap.classList.add("nsc-scrolling");

      const anim = inner.animate(
        [
          { transform: "translateX(0)" },
          { transform: `translateX(-${scrollDist}px)` }
        ],
        {
          duration,
          iterations: Infinity,
          easing: "linear"
        }
      );
      (inner as any)._nscAnim = anim;
    } else {
      wrap.classList.remove("nsc-scrolling");
    }
  }

  function repositionCard() {
    if (!card || !card.isConnected) return;
    const player = getPlayerElement();
    const rect = player?.getBoundingClientRect();
    const unplaced = !rect || rect.width === 0;
    card.classList.toggle("nsc-unplaced", unplaced);
    if (unplaced) return;
    const v = getNscValues();
    const cardHeight = card.offsetHeight || v.height;

    const top = `${rect.top - cardHeight - v.gapToPlayer}px`;
    // Anchored at the edge it sits against, so a width change grows away from it.
    const right = v.position === "right";
    const left = right ? "auto" : `${rect.left}px`;
    const rightEdge = right ? `${document.documentElement.clientWidth - rect.right}px` : "auto";
    if (card.style.top !== top) card.style.top = top;
    if (card.style.left !== left) card.style.left = left;
    if (card.style.right !== rightEdge) card.style.right = rightEdge;
  }

  const WIDTH_MS = 400;
  let marqueeTimer = 0;

  function fitWidth(el: HTMLElement, wraps: HTMLElement[]) {
    wraps.forEach(resetMarquee);
    const from = el.getBoundingClientRect().width;
    el.style.width = "";
    const to = el.getBoundingClientRect().width;
    const animate = from > 0 && Math.abs(from - to) > 0.5;
    if (animate) {
      el.style.width = `${from}px`;
      void el.offsetWidth;
    }
    el.style.width = `${to}px`;
    window.clearTimeout(marqueeTimer);
    marqueeTimer = window.setTimeout(() => wraps.forEach(setupMarquee), animate ? WIDTH_MS + 20 : 0);
  }

  function updateCard() {
    const v = getNscValues();
    if (v.show === "hide") {
      if (card) card.classList.toggle("nsc-hidden", true);
      return;
    }

    const next = getNextTrack();
    if (!next) {
      if (card) card.classList.toggle("nsc-hidden", true);
      lastUri = "";
      return;
    }

    const uri = next.uri || "";
    const meta = next.metadata || {};
    const title = meta.title || "";
    const albumUri = meta.album_uri || "";

    const allArtists: { name: string; uri: string }[] = [];
    if (meta.artist_name) {
      allArtists.push({ name: meta.artist_name, uri: meta.artist_uri || "" });
    }
    for (let i = 1; ; i++) {
      const name = meta[`artist_name:${i}`];
      if (!name) break;
      allArtists.push({ name, uri: meta[`artist_uri:${i}`] || "" });
    }
    const artistUri = allArtists[0]?.uri || "";
    const imageRaw = meta.image_url || meta.image_xlarge_url || meta.image_large_url || meta.image_small_url || "";
    const image = resolveSpotifyImage(imageRaw);

    const el = ensureCard();
    if (!el) return;

    const coverEl = el.querySelector(".nsc-cover") as HTMLImageElement | null;
    const titleLink = el.querySelector(".nsc-title-link") as HTMLAnchorElement | null;
    const artistInner = el.querySelector(".nsc-artist-wrap .nsc-marquee-inner") as HTMLElement | null;
    const titleWrap = el.querySelector(".nsc-title-wrap") as HTMLElement | null;
    const artistWrap = el.querySelector(".nsc-artist-wrap") as HTMLElement | null;

    if (coverEl) {
      const frame = coverEl.parentElement as HTMLElement;
      if (image) {
        if (coverEl.getAttribute("src") !== image) coverEl.src = image;
        if (frame.style.display) frame.style.display = "";
      } else if (frame.style.display !== "none") {
        frame.style.display = "none";
      }
      const dataUri = albumUri || uri;
      if (dataUri && coverEl.getAttribute("data-uri") !== dataUri) coverEl.setAttribute("data-uri", dataUri);
    }

    if (uri !== lastUri) {
      if (titleLink) {
        titleLink.textContent = title;
        if (uri) {
          titleLink.setAttribute("data-uri", uri);
        } else {
          titleLink.removeAttribute("data-uri");
        }
      }
      if (artistInner) {
        artistInner.innerHTML = "";
        const artistContainer = document.createElement("span");
        artistContainer.className = "nsc-artist nsc-artist-container";
        allArtists.forEach((a, idx) => {
          if (idx > 0) {
            const sep = document.createTextNode(", ");
            artistContainer.appendChild(sep);
          }
          const link = document.createElement("a");
          link.className = "nsc-artist nsc-artist-link";
          link.textContent = a.name;
          link.href = "#";
          if (a.uri) link.setAttribute("data-uri", a.uri);
          artistContainer.appendChild(link);
        });
        artistInner.appendChild(artistContainer);
      }
    }

    el.classList.toggle("nsc-hidden", false);
    repositionCard();

    if (uri !== lastUri) {
      lastUri = uri;
      fitWidth(el, [titleWrap, artistWrap].filter(Boolean) as HTMLElement[]);
      repositionCard();
    }
  }

  setInterval(() => {
    try {
      updateCard();
    } catch {}
  }, 1000);

  window.addEventListener("resize", repositionCard);
  document.addEventListener("scroll", repositionCard, true);

  const observePlayer = async () => {
    while (!getPlayerElement()) await sleep(300);
    const player = getPlayerElement();
    if (player) {
      const ro = new ResizeObserver(repositionCard);
      ro.observe(player);
    }
  };
  observePlayer();

  const waitForPlayer = async () => {
    while (typeof SpotiKit.Player?.on !== "function") await sleep(300);
    SpotiKit.Player.on("track", () => {
      setTimeout(updateCard, 300);
    });
    setTimeout(updateCard, 500);
  };
  waitForPlayer();

  window.addEventListener("liquifyNscUpdate", () => {
    applyNextSongCardStyle();
    lastUri = "";
    updateCard();
  });

  const PLAYER_BAR_FADE = ".now-playing-bar-fade";
  const PLAYER_BAR_HIDDEN = "now-playing-bar--hidden-in-cinema";
  let barObserver: MutationObserver | null = null;
  let lastBar: Element | null = null;

  function watchPlayerBar() {
    const el = document.querySelector(PLAYER_BAR_FADE);
    if (el === lastBar) return;
    lastBar = el;
    barObserver?.disconnect();
    barObserver = null;
    const apply = () => card?.classList.toggle("nsc-cinema-hidden", !!el?.classList.contains(PLAYER_BAR_HIDDEN));
    if (el) {
      barObserver = new MutationObserver(apply);
      barObserver.observe(el, { attributes: true, attributeFilter: ["class"] });
    }
    apply();
  }

  setInterval(watchPlayerBar, 1000);

  function watchFeed() {
    if (!card) return;
    card.classList.toggle(
      "nsc-watchfeed-hidden",
      !!document.querySelector(".watch-feed-overlay")
    );
  }

  setInterval(watchFeed, 1000);
}

