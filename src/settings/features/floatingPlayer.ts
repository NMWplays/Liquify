import { updateStyle } from '../shared';
import { PLAYER_BAR } from './player';

const STYLE_ID = "liquify-floating-player-style";
export const FLOATING_PLAYER_KEY = "liquify-floating-player";
export const PLAYBAR_BLUR_KEY = "liquify-playbar-blur";

export const PLAYBAR_BLUR_DEFAULT = 5;

export function readPlaybarBlur(): number {
  const px = parseFloat(localStorage.getItem(PLAYBAR_BLUR_KEY) || "");
  return Number.isFinite(px) ? px : PLAYBAR_BLUR_DEFAULT;
}

function updateFloatingPlayerCss(on: boolean) {
  const blur = readPlaybarBlur();
  const css = on
    ? [
        `${PLAYER_BAR} { position: absolute; bottom: 0px; justify-self: center; z-index: var(--now-playing-bar-grid-area-z-index, 6); }`,
        // Spotify's scroll child is 100% tall and the pages overflow it, so the pages get the padding.
        ".your-library-list," +
          ".panel-section-content, .queue-panel-tab-panel," +
          ".home-page, .home-page-shelf--full-page, .shelves-page, .search-page, .search-tracks-page," +
          ".search-artists-page, .search-podcasts-page, .genre-page, .country-hub-section-page," +
          ".playlist-page, .liked-songs-page, .album-page, .artist-page, .label-albums-page," +
          ".track-page, .show-page, .episode-page, .your-episodes-page, .podcast-chart-page," +
          ".more-like-this-episodes--full-page, .author-page, .concert-page, .concerts-page," +
          ".artist-concerts-page, .venue-page, .profile-page, .recently-played-page, .recents-page," +
          ".taste-profile-page, .whats-new-page, .settings-page," +
          ".main-landmark > div > .entity-header ~ .contentSpacing:last-child { padding-bottom: 7rem !important; }",
        ":root .cinema-container.cinema-container--ambient-mode { margin-bottom: calc(0px - var(--bottom-bar-height) - var(--panel-gap)); }",
        'span.encore-inverted-light-set[class*="button-primary__inner"][class*="legacy-button--medium"] { margin-bottom: 7rem !important; }',
      ]
        .concat([`${PLAYER_BAR} { --liquify-playbar-blur: ${blur}px; }`])
        .join("\n")
    : "";
  updateStyle(STYLE_ID, css);
}

export function applyFloatingPlayer(mode: string) {
  const m = mode === "on" ? "on" : "off";
  localStorage.setItem(FLOATING_PLAYER_KEY, m);
  updateFloatingPlayerCss(m === "on");
}

export function setPlaybarBlur(px: number | null) {
  if (px === null) localStorage.removeItem(PLAYBAR_BLUR_KEY);
  else localStorage.setItem(PLAYBAR_BLUR_KEY, String(px));
  applySavedFloatingPlayer();
}

export function applySavedFloatingPlayer() {
  updateFloatingPlayerCss((localStorage.getItem(FLOATING_PLAYER_KEY) || "off") === "on");
}
