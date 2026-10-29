import { installGlassDevtools, applyGlass, GlassTarget } from './glassSurface';
import { startBackground } from './background';
import { startPopupBounce } from './popupBounce';
import { startLiquifySettings } from './settings';

const GLASS_TARGETS: GlassTarget[] = [
  { selector: '.now-playing-bar-area', blur: 'var(--liquify-playbar-blur, var(--liquify-glass-blur, 2px))' },
  { selector: '.home-shortcut' },
  { selector: '.global-nav-bar .global-nav-home-button' },
  { selector: '.global-nav-search-form .global-nav-search-input' },
  { selector: '.global-nav-bar-history-buttons button[data-mp-button]' },
  { selector: '.user-widget-button' },
  { selector: '.global-nav-bar .global-nav-icon-button' },
  { selector: 'html:not(.liquify-windows-controls) .spotikit-window-controls' },
  { selector: '.search-dropdown-panel', blur: 5 },
  { selector: '.npv-lyrics-card.npv-lyrics-card--colored' },
  { selector: '.npv-section' },
  { selector: '.npv-artist-bio-card' },
  { selector: '.panel-section-header' },
  { selector: '.npv-track-text' },
  { selector: 'dialog' },
  { selector: '.entity-header' },
  { selector: '.action-bar' },
  { selector: '.track-list-row.track-list-row--selected' },
  { selector: '.carousel-chevron-button' },
  { selector: 'button.e-legacy-button.e-legacy-button-tertiary.e-overflow-wrap-anywhere.encore-text-body-small-bold.e-legacy-button--small.e-button-tertiary--small.e-button--trailing.e-button-tertiary--condensed.e-button-tertiary--text-subdued.encore-internal-color-text-subdued' },
  { selector: '.playlist-search-expand-button' },
  { selector: '.your-library-create-button' },
  { selector: '.library-expand-button' },
  { selector: '.e-legacy-box--tinted' },
  { selector: '.top-bar-background' },
  { selector: '.track-list-header' },
  { selector: '.artist-about-modal-close' },
  { selector: '.artist-gallery-nav-button' },
  { selector: '.queue-jam-promo' },
  { selector: '.panel-scroll-header' },
  { selector: '.devices-current-device' },
  { selector: '.audio-panel-get-started' },
  { selector: '.audio-panel-quality-card' },
  { selector: '.os-scrollbar-handle ' },
  { selector: '.whats-new-notice' },
  { selector: '.whats-new-row' },
  { selector: '.whats-new-release-row' },
  { selector: '.search-filter-bar' },
  { selector: '.search-result-row.search-result-row--container' },
  { selector: '.home-chips-background' },
  { selector: '.playlist-edit-details-modal' },
  { selector: '.mix-transition-row-chip' },
  { selector: '.playlist-edit-details-photo-menu-button' },
  { selector: '.tooltip' },
  { selector: '.artist-popular-tracks' },
  { selector: '.concert-item' },
  { selector: '.artist-about-card' },
  { selector: '.feed-card-preview-button' },
  { selector: '.media-switch-button' },
  { selector: '.settings-section' },
  { selector: '.feed-card-transcript.feed-card-transcript--overlay .feed-card-transcript-line' },
  { selector: '.cinema-container', blur: 10 },
  { selector: '.cinema-header-button' },
  { selector: '.npv-placeholder-section' },
  { selector: '.artist-side-column' },
  { selector: '.artist-pick-comment-badge' },
  { selector: '.e-legacy-box.e-legacy-box--naked.e-legacy-box--interactive.e-legacy-box--padding-block-start-custom.e-legacy-box--padding-block-end-custom.e-legacy-box--hover-custom.e-legacy-box--min-size.e-legacy-list-row.e-legacy-list-row--wide.e-legacy-list-row--has-leading.e-legacy-list-row--has-body-footer.e-legacy-list-row--custom-gap' },
  { selector: '.episode-transcript-card' },
  { selector: '.episode-tabs-bar' },
  { selector: '.npv-chapters-section' },
  { selector: '.npv-lyrics-section.npv-podcast-about' },
  { selector: '.npv-video-controls-top button' },
  { selector: '.artist-find-nearby-card' },
  { selector: '.concert-location-dialog' },
  { selector: '.confirm-dialog' },
  { selector: '.discography-sticky-header' },
  { selector: '.liquifySettingsPanel', blur: 5, brightness: 0.8},
  { selector: '.liquifySelectMenu', brightness: 0.8 },
  { selector: '.liquifySectionNavScrollBtn' },
  { selector: '#liquify-next-song-card', blur: 'var(--liquify-nsc-blur, 5px)' },
  { selector: '.context-menu', blur: 5, brightness: 0.8, before: true },
  { selector: '.library-create-menu', blur: 5, brightness: 0.8, before: true },
  { selector: '.curation-sheet-menu', blur: 5, brightness: 0.8, before: true },
  { selector: '.settings-lossless-confirm-dialog' },
  { selector: '.home-page-content > section' },
  { selector: '.shelf' },
  { selector: '.related-videos-section' },
  { selector: '.e-legacy-box--elevated' }
];

function start(): void {
  installGlassDevtools();
  applyGlass(GLASS_TARGETS);
  startBackground();
  startPopupBounce();
  startLiquifySettings();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}