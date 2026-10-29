import { FLOATING_PLAYER_KEY, PLAYBAR_BLUR_KEY } from './floatingPlayer';
import { COVER_FLIP_KEY, NPV_COVER_ANIM_KEY } from './coverFlip';
import { HOME_LAYOUT_KEY } from './homeLayout';
import { POPUP_BOUNCE_KEY } from './uiEffects';
import { PROGRESS_BAR_COMPAT_KEY, PROGRESS_BAR_HEIGHT_KEY } from './progressBarHeight';
import { PROGRESS_BAR_RADIUS_KEY } from './progressBarRadius';
import { GLASS_BLUR_KEY, BACKDROP_BLUR_KEY } from './glassBlur';
import { CONNECT_BAR_KEY } from './connectBar';
import { NAV_RADIUS_KEY, MAIN_RADIUS_KEY, RIGHT_RADIUS_KEY } from './layoutRadius';
import { THEMED_LYRICS_KEY, LYRICS_FONT_SIZE_KEY, LYRICS_MARGIN_KEY } from './themedLyrics';
import {
  NSC_SHOW_KEY, NSC_POSITION_KEY, NSC_HEIGHT_KEY, NSC_MAX_WIDTH_KEY, NSC_GAP_KEY,
  NSC_COVER_SIZE_KEY, NSC_HPAD_KEY, NSC_VPAD_KEY, NSC_GAP_PLAYER_KEY,
  NSC_BORDER_RADIUS_KEY, NSC_COVER_BORDER_RADIUS_KEY, NSC_BLUR_KEY, NSC_COVER_FLIP_KEY,
} from './nextSongCard';
import { NPVC_MODE_KEY, NPVC_SHOW_ALWAYS_KEY, NPVC_BLUR_KEY } from './nowPlayingViewCover';
import {
  CCA_ENABLED_KEY, CCA_WIDTH_KEY, CCA_HEIGHT_KEY, CCA_MARGIN_BOTTOM_KEY, CCA_MARGIN_LEFT_KEY,
} from './comfyCoverArt';
import { PLAYBAR_COVER_BORDER_RADIUS_KEY } from './playbarCoverRadius';
import { PLAYER_ICONS_KEY } from './playerControlIcons';
import { KAWARP_KEYS } from './kawarpBackground';
import { BG_ENGINE_KEY, BG_SURFACES } from './backgroundAppearance';
import { SIDEBARS } from './sidebarBlur';
import { LOCAL_FILES_TRANSPARENT_KEY } from './localFilesCard';
import { FONT_BODY_KEY, FONT_HEADING_KEY } from './fonts';
import { VINYL_DETAILS, VINYL_SPEED_KEY, VINYL_SURFACES } from './vinylCoverArt';

const PLAIN_KEYS = [
  'liquify-language',
  'liquify-accent-mode', 'liquify-accent-source', 'liquify-custom-color',
  'liquify-accent-sat-boost', 'liquify-accent-light-boost',
  'liquify-glow-mode', 'liquify-glow-color',
  'liquify-bg-mode', 'liquify-bg-custom-animated', 'liquify-bg-blur', 'liquify-bg-brightness', 'liquify-bg-url',
  'liquify-hires-cover',
  'liquify-artist-bg-mode', 'liquify-artist-bg-url', 'liquify-artist-scroll-blur', 'liquify-artist-scroll-brightness',
  'liquify-player-width', 'liquify-player-custom-width', 'liquify-player-custom-height', 'liquify-player-radius',
  'liquify-playlist-header-mode', 'liquify-action-bar-box-mode',
  'liquify-transparent-player', 'liquify-compact-player',
  'liquify-lyrics-mode',
  'liquify-glass-enabled',
];

export const CONFIG_KEYS: string[] = [
  ...PLAIN_KEYS,
  FLOATING_PLAYER_KEY,
  PLAYBAR_BLUR_KEY,
  COVER_FLIP_KEY,
  NPV_COVER_ANIM_KEY,
  CONNECT_BAR_KEY,
  HOME_LAYOUT_KEY,
  POPUP_BOUNCE_KEY,
  PROGRESS_BAR_HEIGHT_KEY,
  PROGRESS_BAR_RADIUS_KEY,
  PROGRESS_BAR_COMPAT_KEY,
  GLASS_BLUR_KEY,
  BACKDROP_BLUR_KEY,
  NAV_RADIUS_KEY,
  MAIN_RADIUS_KEY,
  RIGHT_RADIUS_KEY,
  THEMED_LYRICS_KEY,
  LYRICS_FONT_SIZE_KEY,
  LYRICS_MARGIN_KEY,
  NSC_SHOW_KEY, NSC_POSITION_KEY, NSC_HEIGHT_KEY, NSC_MAX_WIDTH_KEY, NSC_GAP_KEY,
  NSC_COVER_SIZE_KEY, NSC_HPAD_KEY, NSC_VPAD_KEY, NSC_GAP_PLAYER_KEY,
  NSC_BORDER_RADIUS_KEY, NSC_COVER_BORDER_RADIUS_KEY, NSC_BLUR_KEY, NSC_COVER_FLIP_KEY,
  NPVC_MODE_KEY, NPVC_SHOW_ALWAYS_KEY, NPVC_BLUR_KEY,
  CCA_ENABLED_KEY, CCA_WIDTH_KEY, CCA_HEIGHT_KEY, CCA_MARGIN_BOTTOM_KEY, CCA_MARGIN_LEFT_KEY,
  PLAYBAR_COVER_BORDER_RADIUS_KEY,
  PLAYER_ICONS_KEY,
  ...Object.values(SIDEBARS).flatMap((spec) => [spec.key, spec.amountKey]),
  LOCAL_FILES_TRANSPARENT_KEY,
  FONT_BODY_KEY,
  FONT_HEADING_KEY,
  VINYL_SPEED_KEY,
  ...Object.values(VINYL_SURFACES).map((spec) => spec.key),
  ...Object.values(VINYL_DETAILS).map((spec) => spec.key),
  BG_ENGINE_KEY,
  ...Object.values(KAWARP_KEYS),
  ...Object.values(BG_SURFACES).flatMap((spec) => [spec.blurKey, spec.brightnessKey]),
];

const CONFIG_KEY_SET = new Set(CONFIG_KEYS);

export interface ConfigPayload {
  app: string;
  version: number;
  exportedAt: string;
  settings: Record<string, string>;
}

function collectSettings(): Record<string, string> {
  const settings: Record<string, string> = {};
  for (const key of CONFIG_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) settings[key] = value;
  }
  return settings;
}

export function settingsFingerprint(): string {
  return JSON.stringify(collectSettings());
}

export function exportConfig(): string {
  const payload: ConfigPayload = {
    app: 'Liquify V2',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: collectSettings(),
  };
  return JSON.stringify(payload, null, 2);
}

function looksFlat(obj: any): boolean {
  return CONFIG_KEYS.some((k) => Object.prototype.hasOwnProperty.call(obj, k));
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  applied?: number;
}

export function importConfig(text: string): ImportResult {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Config must be a JSON object.' };
  }

  const settings: Record<string, any> | null =
    parsed.settings && typeof parsed.settings === 'object' && !Array.isArray(parsed.settings)
      ? parsed.settings
      : looksFlat(parsed)
        ? parsed
        : null;

  if (!settings) {
    return { ok: false, error: 'No Liquify settings found in this JSON.' };
  }

  if (!Object.keys(settings).some((k) => CONFIG_KEY_SET.has(k))) {
    return { ok: false, error: 'No Liquify settings found in this JSON.' };
  }

  let applied = 0;
  for (const key of CONFIG_KEYS) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      const value = settings[key];
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, String(value));
        applied++;
      }
    } else {
      localStorage.removeItem(key);
    }
  }

  try { (window as any).liquifyApplyAllSettings?.(); } catch {}
  window.dispatchEvent(new Event('liquifyConfigApplied'));

  return { ok: true, applied };
}
