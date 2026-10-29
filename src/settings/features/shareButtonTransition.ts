import { updateStyle } from '../shared';

const SHARE_BUTTON = '.npv-hover-share-button';

// theme.css's !important bounce on .e-legacy-button would otherwise drop Spotify's fade.
export function installShareButtonTransition(): void {
  updateStyle(
    'liquify-share-button-transition',
    `:root ${SHARE_BUTTON} { transition: opacity 0.3s ease-out, width 0.3s ease-out, transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1) !important; }`,
  );
}
