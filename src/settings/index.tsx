import { startLiquifyOnboarding } from './components/Onboarding';
import { applyGlowAccent, refreshAccent, resetGlowAccentToDefault } from './features/accent';
import { ensureArtistScrollEffectApplied } from './features/artistScrollEffect';
import { applySavedBackground, installArtistBackgroundController } from './features/background';
import { ensureLibraryApplied } from './features/backgroundLibrary';
import { ensureBackgroundAppearanceApplied } from './features/backgroundAppearance';
import { applyComfyCoverArt, installSharpPlaybarCover } from './features/comfyCoverArt';
import { installCoverSwipe } from './features/coverSwipe';
import { installCoverFlip } from './features/coverFlip';
import { installMiniPlayer } from './features/miniPlayer';
import { installLyricsTranslator } from './features/lyricsTranslator';
import { installNextSongCard } from './features/nextSongCard';
import { installNowPlayingViewCover } from './features/nowPlayingViewCover';
import { applySavedActionBarBox } from './features/actionBarBox';
import { ensureGlassBlurApplied } from './features/glassBlur';
import { ensureSidebarBlurApplied } from './features/sidebarBlur';
import { ensureFontsApplied } from './features/fonts';
import { ensureVinylApplied } from './features/vinylCoverArt';
import { ensureLocalFilesTransparentApplied } from './features/localFilesCard';
import { applySavedHomeLayout } from './features/homeLayout';
import { applySavedCompactPlayer } from './features/compactPlayer';
import { ensureLayoutRadiusApplied } from './features/layoutRadius';
import { applySavedPlaylistHeader } from './features/playlistHeader';
import { installPlayerControlIcons } from './features/playerControlIcons';
import { ensurePlaybarCoverBorderRadiusApplied } from './features/playbarCoverRadius';
import { ensurePlayerApplied } from './features/player';
import { ensureProgressBarHeightApplied } from './features/progressBarHeight';
import { ensureProgressBarRadiusApplied } from './features/progressBarRadius';
import { installShareButtonTransition } from './features/shareButtonTransition';
import { ensureThemedLyricsApplied } from './features/themedLyrics';
import { ensureWindowControlsApplied } from './features/windowControls';
import { applySavedTransparentPlayer } from './features/transparentPlayer';
import { applySavedFloatingPlayer } from './features/floatingPlayer';
import { applySavedConnectBar } from './features/connectBar';
import { ensurePopupBounceApplied } from './features/uiEffects';
import { installHomeScreenVisualizer, installPlaylistIndicatorVisualizer } from './features/visualizers';
import { initLiquifyGearInjection } from './gear';
import { setGlassEnabled } from '../glassSurface';
import { getTranslation } from './i18n/translations';
import { openSettingsModal } from './modal';
import { awaitReact, awaitPlayer } from './runtime/reactRuntime';

function applySavedGlowSettings(): void {
  const mode = localStorage.getItem('liquify-glow-mode') || 'default';
  const color = localStorage.getItem('liquify-glow-color') || '#1DB954';

  if (mode === 'custom') applyGlowAccent(color);
  else resetGlowAccentToDefault();
}

function applySavedLayoutSettings(): void {
  ensureLibraryApplied();
  applySavedBackground();
  ensurePlayerApplied();
  ensureWindowControlsApplied();
  ensureBackgroundAppearanceApplied();
  ensureArtistScrollEffectApplied();
  applySavedPlaylistHeader();
  applySavedActionBarBox();
  applySavedTransparentPlayer();
  applySavedFloatingPlayer();
  applySavedConnectBar();
  applySavedCompactPlayer();
  ensureProgressBarHeightApplied();
  ensureProgressBarRadiusApplied();
  ensureLayoutRadiusApplied();
  ensureThemedLyricsApplied();
  ensureGlassBlurApplied();
  ensureSidebarBlurApplied();
  ensureFontsApplied();
  ensureVinylApplied();
  ensureLocalFilesTransparentApplied();
  applySavedHomeLayout();
  applyComfyCoverArt(false);
  ensurePlaybarCoverBorderRadiusApplied();
  ensurePopupBounceApplied();
}

function applyAllSavedSettings(artistCtrl: any): void {
  applySavedGlowSettings();
  refreshAccent();
  applySavedLayoutSettings();
  installPlayerControlIcons();
  setGlassEnabled(localStorage.getItem('liquify-glass-enabled') !== 'off');
  try { artistCtrl?.setMode?.(localStorage.getItem('liquify-artist-bg-mode') || 'theme'); } catch {}
  for (const ev of [
    'liquifyNscUpdate',
    'liquifyNpvcUpdate',
    'liquifyLyricsModeChange',
    'liquifyBackgroundChange',
    'liquifyPlaybarCoverRadiusChange',
  ]) {
    window.dispatchEvent(new Event(ev));
  }
}

function registerSettingsModal(artistCtrl: any): void {
  (window as any).showLiquifySettingsMenu = () => {
    try {
      openSettingsModal(artistCtrl);
    } catch (e) {
      console.error('Liquify settings open failed', e);
    }
  };
}

function installFeatureControllers(): void {
  const installers = [
    installLyricsTranslator,
    installPlaylistIndicatorVisualizer,
    installHomeScreenVisualizer,
    installNextSongCard,
    installNowPlayingViewCover,
    installCoverSwipe,
    installCoverFlip,
    installSharpPlaybarCover,
    installMiniPlayer,
    installPlayerControlIcons,
    installShareButtonTransition,
  ];
  for (const install of installers) {
    try {
      install();
    } catch (e) {
      console.error('Liquify: ' + install.name + ' failed to start', e);
    }
  }
}

export async function startLiquifySettings(): Promise<void> {
  const anyWin: any = window as any;
  if (anyWin.liquifyStandaloneTsInitialized) return;
  anyWin.liquifyStandaloneTsInitialized = true;

  await awaitReact();

  applySavedGlowSettings();
  applySavedLayoutSettings();

  const artistCtrl = installArtistBackgroundController();
  registerSettingsModal(artistCtrl);
  (window as any).liquifyApplyAllSettings = () => applyAllSavedSettings(artistCtrl);
  initLiquifyGearInjection(getTranslation());
  startLiquifyOnboarding();

  await awaitPlayer();
  installFeatureControllers();
}
