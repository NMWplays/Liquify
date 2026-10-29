import { React, ReactDOM } from '../runtime/reactRuntime';
import { getAvailableLanguages, getEffectiveLanguage, getLanguageMode, getTranslation, setLanguage } from '../i18n/translations';
import { readLS, readNum } from '../shared';
import { LIQUIFY_DISCORD_URL, LIQUIFY_GITHUB_URL } from '../links';
import { BackgroundLibrary, ButtonTooltip, ColorPicker, getDiscordIcon, getGithubIcon, HelpTip, openExternalLink, Section, SubSection, Select, Stepper, Toggle, FontPicker, ensureSettingsUiStyle } from './settingsStyles';
import {
  applyGlowAccent,
  resetAccent,
  resetGlowAccentToDefault,
  selectAccentMode,
  selectAccentSource,
  selectCustomAccent,
  setAccentLightness,
  setAccentSaturation,
} from '../features/accent';
import { applyArtistScrollEffect } from '../features/artistScrollEffect';
import { updateBackground } from '../features/background';
import { getArtistLibraryUrl, getLibraryUrl } from '../features/backgroundLibrary';
import type { LibraryTarget } from '../features/backgroundLibrary';
import {
  BG_BLUR_RANGE, getBgEngine, isHiResCoverOn, readAllBackgroundAppearance, resetBackgroundAppearance,
  setBackgroundAppearance, setBgEngine, setHiResCover, type BgEngine, type BgField, type BgSurface,
} from '../features/backgroundAppearance';
import { KAWARP_DEFAULTS, KAWARP_KEYS, KAWARP_RANGES, resetKawarpDefaults, setKawarpValue, type KawarpKey } from '../features/kawarpBackground';
import { CCA_DEFAULTS, CCA_ENABLED_KEY, CCA_HEIGHT_KEY, CCA_MARGIN_BOTTOM_KEY, CCA_MARGIN_LEFT_KEY, CCA_WIDTH_KEY, applyComfyCoverArt } from '../features/comfyCoverArt';
import { DEFAULT_CUSTOM_HEIGHT, DEFAULT_CUSTOM_WIDTH, applyPlayerRadius, applyPlayerWidth } from '../features/player';
import { isGlassEnabled, setGlassEnabled } from '../../glassSurface';
import { applyActionBarBox } from '../features/actionBarBox';
import { applyCompactPlayer } from '../features/compactPlayer';
import { PLAYER_ICONS_KEY, setPlayerControlIcons } from '../features/playerControlIcons';
import { BACKDROP_BLUR_DEFAULT, BACKDROP_BLUR_KEY, GLASS_BLUR_DEFAULT, GLASS_BLUR_KEY, setBackdropBlur, setGlassBlur } from '../features/glassBlur';
import { LAYOUT_RADIUS_DEFAULTS, MAIN_RADIUS_KEY, NAV_RADIUS_KEY, RIGHT_RADIUS_KEY, setMainRadius, setNavRadius, setRightRadius } from '../features/layoutRadius';
import {
  SIDEBAR_BLUR_DEFAULT, SIDEBARS, isSidebarBlurOn, readSidebarBlurAmount, resetSidebarBlur,
  setSidebarBlur, setSidebarBlurAmount, type SidebarSide,
} from '../features/sidebarBlur';
import { LOCAL_FILES_TRANSPARENT_KEY, setLocalFilesTransparent } from '../features/localFilesCard';
import { FONT_BODY_KEY, FONT_DEFAULT, FONT_HEADING_KEY, resetFonts, setFont } from '../features/fonts';
import {
  VINYL_SPEED_DEFAULT, VINYL_SPEED_KEY, VINYL_SURFACES, isVinylOn, resetVinyl,
  setVinyl, setVinylSpeed, type VinylSurface,
  VINYL_DETAILS, isVinylDetailOn, setVinylDetail, type VinylDetail,
} from '../features/vinylCoverArt';
import { applyPlaylistHeader } from '../features/playlistHeader';
import {
  PROGRESS_BAR_COMPAT_KEY, PROGRESS_BAR_HEIGHT_DEFAULT, PROGRESS_BAR_HEIGHT_KEY,
  setProgressBarCompat, setProgressBarHeight,
} from '../features/progressBarHeight';
import {
  ensureProgressBarRadiusApplied, PROGRESS_BAR_RADIUS_DEFAULT, PROGRESS_BAR_RADIUS_KEY, setProgressBarRadius,
} from '../features/progressBarRadius';
import { LYRICS_FONT_SIZE_DEFAULT, LYRICS_FONT_SIZE_KEY, LYRICS_MARGIN_DEFAULT, LYRICS_MARGIN_KEY, THEMED_LYRICS_KEY, setLyricsFontSize, setLyricsMargin, setThemedLyrics } from '../features/themedLyrics';
import { applyTransparentPlayer } from '../features/transparentPlayer';
import { WINDOW_CONTROLS_KEY, applyWindowControls } from '../features/windowControls';
import { NSC_BLUR_KEY, NSC_COVER_FLIP_KEY, isNscCoverFlipOn, NSC_BORDER_RADIUS_KEY, NSC_COVER_BORDER_RADIUS_KEY, NSC_COVER_SIZE_KEY, NSC_DEFAULTS, NSC_GAP_KEY, NSC_GAP_PLAYER_KEY, NSC_HEIGHT_KEY, NSC_HPAD_KEY, NSC_MAX_WIDTH_KEY, NSC_POSITION_KEY, NSC_SHOW_KEY, NSC_VPAD_KEY } from '../features/nextSongCard';
import { NPVC_BLUR_KEY, NPVC_DEFAULTS, NPVC_MODE_KEY, NPVC_SHOW_ALWAYS_KEY } from '../features/nowPlayingViewCover';
import { PLAYBAR_COVER_BORDER_RADIUS_KEY, PLAYBAR_COVER_DEFAULTS, applyPlaybarCoverBorderRadius } from '../features/playbarCoverRadius';
import { POPUP_BOUNCE_KEY, applyPopupBounce } from '../features/uiEffects';
import { HOME_LAYOUT_KEY, applyHomeLayout } from '../features/homeLayout';
import { FLOATING_PLAYER_KEY, PLAYBAR_BLUR_DEFAULT, applyFloatingPlayer, readPlaybarBlur, setPlaybarBlur } from '../features/floatingPlayer';
import { getNpvCoverAnim, isCoverFlipOn, setCoverFlip, setNpvCoverAnim, type NpvCoverAnim } from '../features/coverFlip';
import { CONNECT_BAR_KEY, applyConnectBar } from '../features/connectBar';
import { exportConfig, importConfig, settingsFingerprint } from '../features/config';

export function SettingsContent(props: { onClose: () => void; artistCtrl: any }) {
    const [lyricsMode, setLyricsMode] = React.useState(readLS("liquify-lyrics-mode", "romanization"));
  const [themedLyrics, setThemedLyricsState] = React.useState(readLS(THEMED_LYRICS_KEY, "on"));
  const [lyricsFontSize, setLyricsFontSizeState] = React.useState(readNum(LYRICS_FONT_SIZE_KEY, LYRICS_FONT_SIZE_DEFAULT));
  const [lyricsMargin, setLyricsMarginState] = React.useState(readNum(LYRICS_MARGIN_KEY, LYRICS_MARGIN_DEFAULT));
    const applyLyricsMode = (mode: string) => {
      setLyricsMode(mode);
      localStorage.setItem("liquify-lyrics-mode", mode);
      window.dispatchEvent(new Event("liquifyLyricsModeChange"));
    };
  const t = getTranslation();
  const [languageMode, setLanguageModeState] = React.useState(getLanguageMode());
  const languageCode = getEffectiveLanguage();
  const tips = t.tooltips || {};
  const sub = t.subSections || {};
  const [searchQuery, setSearchQuery] = React.useState("");
  const bodyRef = React.useRef(null as any);
  const sectionNavRef = React.useRef(null as any);
  const [sectionNavScroll, setSectionNavScroll] = React.useState({ left: false, right: false });
  const [sectionNavControls, setSectionNavControls] = React.useState(null as null | { top: number; left: number; right: number });
  const [sectionNavControlsReady, setSectionNavControlsReady] = React.useState(false);
  const useLayout = (React as any).useLayoutEffect || React.useEffect;

  const jumpToSection = (id: string) => {
    const target = document.getElementById("liquify-sec-" + id);
    const body = target?.closest(".liquifySettingsBody") as HTMLElement | null;
    if (!target || !body) return;
    const top = body.scrollTop + target.getBoundingClientRect().top - body.getBoundingClientRect().top;
    body.scrollTo({ top, behavior: "smooth" });
  };

  const updateSectionNavScroll = () => {
    const nav = sectionNavRef.current as HTMLElement | null;
    if (!nav) return;
    const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
    const left = nav.scrollLeft > 1;
    const right = nav.scrollLeft < maxScroll - 1;
    const rect = nav.getBoundingClientRect();
    const nextControls = {
      top: Math.round(rect.top + 10),
      left: Math.round(rect.left + 12),
      right: Math.round(window.innerWidth - rect.right + 12)
    };
    setSectionNavScroll((current: { left: boolean; right: boolean }) => (
      current.left === left && current.right === right ? current : { left, right }
    ));
    setSectionNavControls((current: null | { top: number; left: number; right: number }) => (
      current && current.top === nextControls.top && current.left === nextControls.left && current.right === nextControls.right
        ? current
        : nextControls
    ));
  };

  const scrollSectionNav = (direction: -1 | 1) => {
    const nav = sectionNavRef.current as HTMLElement | null;
    if (!nav) return;
    nav.scrollBy({ left: direction * Math.max(120, nav.clientWidth * 0.72), behavior: "smooth" });
  };

  useLayout(() => {
    const nav = sectionNavRef.current as HTMLElement | null;
    if (!nav) return;
    let raf = 0;
    let readyTimer = 0;
    const startedAt = performance.now();
    const overlay = nav.closest?.("#liquify-settings-react-overlay") as HTMLElement | null;
    const panel = nav.closest?.(".liquifySettingsPanel") as HTMLElement | null;
    const isClosing = () => !!overlay?.classList.contains("overlay-closing");
    const trackOpeningPosition = () => {
      if (isClosing()) return;
      updateSectionNavScroll();
      if (performance.now() - startedAt < 650) {
        raf = requestAnimationFrame(trackOpeningPosition);
      }
    };
    const showControlsAfterIntro = () => {
      if (isClosing()) return;
      updateSectionNavScroll();
      requestAnimationFrame(() => {
        if (!isClosing()) {
          updateSectionNavScroll();
          setSectionNavControlsReady(true);
        }
      });
    };
    const onPanelTransitionEnd = (e: any) => {
      if (e.target === panel && e.propertyName === "transform") showControlsAfterIntro();
    };
    setSectionNavControlsReady(false);
    updateSectionNavScroll();
    raf = requestAnimationFrame(trackOpeningPosition);
    panel?.addEventListener("transitionend", onPanelTransitionEnd);
    readyTimer = window.setTimeout(showControlsAfterIntro, 430);
    nav.addEventListener("scroll", updateSectionNavScroll, { passive: true });
    window.addEventListener("resize", updateSectionNavScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(readyTimer);
      panel?.removeEventListener("transitionend", onPanelTransitionEnd);
      nav.removeEventListener("scroll", updateSectionNavScroll);
      window.removeEventListener("resize", updateSectionNavScroll);
    };
  }, []);

  React.useEffect(() => {
    updateSectionNavScroll();
  });

  React.useEffect(() => {
    const body = bodyRef.current as HTMLElement | null;
    if (!body) return;
    const q = searchQuery.trim().toLowerCase();
    body.querySelectorAll<HTMLElement>(".liquifySection").forEach((section) => {
      const title = (section.querySelector(".liquifySectionTitle")?.textContent || "").toLowerCase();
      const sectionMatches = q !== "" && title.includes(q);
      let anyVisible = false;
      section.querySelectorAll<HTMLElement>(".liquifyRow").forEach((row) => {
        const label = (row.querySelector(".liquifyLabel")?.textContent || "").toLowerCase();
        const matches = q === "" || sectionMatches || label.includes(q);
        row.style.display = matches ? "" : "none";
        if (matches) anyVisible = true;
      });
      section.querySelectorAll<HTMLElement>(".liquifySubSection").forEach((sub) => {
        const subVisible = Array.from(sub.querySelectorAll<HTMLElement>(".liquifyRow")).some(
          (r) => r.style.display !== "none"
        );
        sub.style.display = q === "" || sectionMatches || subVisible ? "" : "none";
      });
      section.style.display = q === "" || sectionMatches || anyVisible ? "" : "none";
    });
  });

  const titles = t.sections || {
    accent: "Colors",
    background: "Background",
    artist: "Artist",
    ui: "UI",
    player: "Player",
    nextSongCard: "Next Song Card",
    canvasCoverArt: "Canvas Cover Art",
    playlist: "Playlist",
    lyrics: "Lyrics",
    transparent: "Window Controls",
    config: "Config"
  };

  const sectionNavScrollControls =
    sectionNavControlsReady && sectionNavControls && ReactDOM?.createPortal ? (
      <>
        {sectionNavScroll.left &&
          ReactDOM.createPortal(
            <div
              role="button"
              tabIndex={0}
              className="liquifySectionNavScrollBtn isLeft"
              aria-label={t.aria?.scrollSectionsLeft || "Scroll sections left"}
              style={{ top: `${sectionNavControls.top}px`, left: `${sectionNavControls.left}px` }}
              onClick={() => scrollSectionNav(-1)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter" || e.key === " ") scrollSectionNav(-1);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
            </div>,
            document.body
          )}
        {sectionNavScroll.right &&
          ReactDOM.createPortal(
            <div
              role="button"
              tabIndex={0}
              className="liquifySectionNavScrollBtn isRight"
              aria-label={t.aria?.scrollSectionsRight || "Scroll sections right"}
              style={{ top: `${sectionNavControls.top}px`, right: `${sectionNavControls.right}px` }}
              onClick={() => scrollSectionNav(1)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter" || e.key === " ") scrollSectionNav(1);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </div>,
            document.body
          )}
      </>
    ) : null;

  const [accentMode, setAccentMode] = React.useState(readLS("liquify-accent-mode", "dynamic"));
  const [accentSource, setAccentSource] = React.useState(readLS("liquify-accent-source", "background"));
  const [accentColor, setAccentColor] = React.useState(readLS("liquify-custom-color", "#1DB954"));
  const [accentSatBoost, setAccentSatBoost] = React.useState(readNum("liquify-accent-sat-boost", 17));
  const [accentLightBoost, setAccentLightBoost] = React.useState(readNum("liquify-accent-light-boost", 11));

  const [glowMode, setGlowMode] = React.useState(readLS("liquify-glow-mode", "default"));
  const [glowColor, setGlowColor] = React.useState(readLS("liquify-glow-color", "#1DB954"));

  const [bgMode, setBgMode] = React.useState(readLS("liquify-bg-mode", "dynamic"));
  const [bgCustomAnimated, setBgCustomAnimated] = React.useState(readLS("liquify-bg-custom-animated", "off"));
  const [hiResCover, setHiResCoverState] = React.useState(() => isHiResCoverOn());
  const [kawarp, setKawarpState] = React.useState(() => {
    const initial = {} as Record<KawarpKey, number>;
    for (const key of Object.keys(KAWARP_KEYS) as KawarpKey[]) {
      initial[key] = readNum(KAWARP_KEYS[key], KAWARP_DEFAULTS[key]);
    }
    return initial;
  });
  const applyKawarp = (key: KawarpKey, value: number) => {
    setKawarpState((prev: Record<KawarpKey, number>) => ({ ...prev, [key]: value }));
    setKawarpValue(key, value);
  };
  const animatedActive =
    bgMode === "animated" ||
    (bgCustomAnimated === "on" && (bgMode === "custom" || bgMode === "url" || bgMode === "playlist"));
  const [bgAppearance, setBgAppearance] = React.useState(readAllBackgroundAppearance);
  const [bgEngine, setBgEngineState] = React.useState(getBgEngine());
  const bgSurface: BgSurface = !animatedActive ? "static" : bgEngine === "tiles" ? "tiles" : "kawarp";
  const [sidebarBlur, setSidebarBlurState] = React.useState(() => {
    const initial = {} as Record<SidebarSide, { on: boolean; amount: number }>;
    for (const side of Object.keys(SIDEBARS) as SidebarSide[]) {
      initial[side] = { on: isSidebarBlurOn(side), amount: readSidebarBlurAmount(side) };
    }
    return initial;
  });
  const applySidebarBlur = (side: SidebarSide, patch: { on?: boolean; amount?: number }) => {
    setSidebarBlurState((prev: Record<SidebarSide, { on: boolean; amount: number }>) => ({
      ...prev,
      [side]: { ...prev[side], ...patch },
    }));
    if (patch.on !== undefined) setSidebarBlur(side, patch.on ? "on" : "off");
    if (patch.amount !== undefined) setSidebarBlurAmount(side, patch.amount);
  };
  const [localFilesTransparent, setLocalFilesTransparentState] = React.useState(readLS(LOCAL_FILES_TRANSPARENT_KEY, "off"));

  const [vinyl, setVinylState] = React.useState(() => {
    const initial = {} as Record<VinylSurface, boolean>;
    for (const surface of Object.keys(VINYL_SURFACES) as VinylSurface[]) initial[surface] = isVinylOn(surface);
    return initial;
  });
  const [vinylSpeed, setVinylSpeedState] = React.useState(readNum(VINYL_SPEED_KEY, VINYL_SPEED_DEFAULT));
  const [vinylDetails, setVinylDetailsState] = React.useState(() => {
    const initial = {} as Record<VinylDetail, boolean>;
    for (const detail of Object.keys(VINYL_DETAILS) as VinylDetail[]) initial[detail] = isVinylDetailOn(detail);
    return initial;
  });
  const applyVinylDetail = (detail: VinylDetail, on: boolean) => {
    setVinylDetailsState((prev: Record<VinylDetail, boolean>) => ({ ...prev, [detail]: on }));
    setVinylDetail(detail, on);
  };
  const [bodyFont, setBodyFontState] = React.useState(readLS(FONT_BODY_KEY, FONT_DEFAULT));
  const [headingFont, setHeadingFontState] = React.useState(readLS(FONT_HEADING_KEY, FONT_DEFAULT));
  const applyVinyl = (surface: VinylSurface, on: boolean) => {
    setVinylState((prev: Record<VinylSurface, boolean>) => ({ ...prev, [surface]: on }));
    setVinyl(surface, on ? "on" : "off");
  };

  const [artistBgMode, setArtistBgMode] = React.useState(readLS("liquify-artist-bg-mode", "theme"));

  const [playerWidthMode, setPlayerWidthMode] = React.useState(readLS("liquify-player-width", "default"));
  const [playerCustomW, setPlayerCustomW] = React.useState(readNum("liquify-player-custom-width", DEFAULT_CUSTOM_WIDTH));
  const [playerCustomH, setPlayerCustomH] = React.useState(readNum("liquify-player-custom-height", DEFAULT_CUSTOM_HEIGHT));

  const [playlistHeader, setPlaylistHeader] = React.useState(readLS("liquify-playlist-header-mode", "show"));
  const [actionBarBox, setActionBarBox] = React.useState(readLS("liquify-action-bar-box-mode", "show"));
  const [transparentPlayer, setTransparentPlayer] = React.useState(readLS("liquify-transparent-player", "off"));
  const [floatingPlayer, setFloatingPlayer] = React.useState(readLS(FLOATING_PLAYER_KEY, "off"));
  const [playbarBlur, setPlaybarBlurState] = React.useState(readPlaybarBlur());
  const [coverFlip, setCoverFlipState] = React.useState(isCoverFlipOn());
  const [npvCoverAnim, setNpvCoverAnimState] = React.useState(getNpvCoverAnim());
  const [connectBar, setConnectBar] = React.useState(readLS(CONNECT_BAR_KEY, "show"));
  const [compactPlayer, setCompactPlayer] = React.useState(readLS("liquify-compact-player", "off"));
  const [playerIcons, setPlayerIcons] = React.useState(readLS(PLAYER_ICONS_KEY, "on"));
  const [progressBarHeight, setProgressBarHeightState] = React.useState(readNum(PROGRESS_BAR_HEIGHT_KEY, PROGRESS_BAR_HEIGHT_DEFAULT));
  const [progressBarRadius, setProgressBarRadiusState] = React.useState(readNum(PROGRESS_BAR_RADIUS_KEY, PROGRESS_BAR_RADIUS_DEFAULT));
  const [progressBarCompat, setProgressBarCompatState] = React.useState(readLS(PROGRESS_BAR_COMPAT_KEY, "off") === "on");

  const [playerRadius, setPlayerRadiusState] = React.useState(readNum("liquify-player-radius", 30));

  const [bgUrl, setBgUrl] = React.useState(readLS("liquify-bg-url", ""));
  const [artistBgUrl, setArtistBgUrl] = React.useState(readLS("liquify-artist-bg-url", ""));

  const [artistScrollBlur, setArtistScrollBlur] = React.useState(readNum("liquify-artist-scroll-blur", 15));
  const [artistScrollBrightness, setArtistScrollBrightness] = React.useState(readNum("liquify-artist-scroll-brightness", 70));
  const [windowControls, setWindowControls] = React.useState(readLS(WINDOW_CONTROLS_KEY, "macos"));

  const [nscShow, setNscShow] = React.useState(readLS(NSC_SHOW_KEY, NSC_DEFAULTS.show));
  const [nscPosition, setNscPosition] = React.useState(readLS(NSC_POSITION_KEY, NSC_DEFAULTS.position));
  const [nscHeight, setNscHeight] = React.useState(readNum(NSC_HEIGHT_KEY, NSC_DEFAULTS.height));
  const [nscMaxWidth, setNscMaxWidth] = React.useState(readNum(NSC_MAX_WIDTH_KEY, NSC_DEFAULTS.maxWidth));
  const [nscGap, setNscGap] = React.useState(readNum(NSC_GAP_KEY, NSC_DEFAULTS.gap));
  const [nscCoverSize, setNscCoverSize] = React.useState(readNum(NSC_COVER_SIZE_KEY, NSC_DEFAULTS.coverSize));
  const [nscHPad, setNscHPad] = React.useState(readNum(NSC_HPAD_KEY, NSC_DEFAULTS.hPad));
  const [nscVPad, setNscVPad] = React.useState(readNum(NSC_VPAD_KEY, NSC_DEFAULTS.vPad));
  const [nscGapToPlayer, setNscGapToPlayer] = React.useState(readNum(NSC_GAP_PLAYER_KEY, NSC_DEFAULTS.gapToPlayer));
  const [nscBorderRadius, setNscBorderRadius] = React.useState(readNum(NSC_BORDER_RADIUS_KEY, NSC_DEFAULTS.borderRadius));
  const [nscCoverBorderRadius, setNscCoverBorderRadius] = React.useState(readNum(NSC_COVER_BORDER_RADIUS_KEY, NSC_DEFAULTS.coverBorderRadius));
  const [nscBlur, setNscBlur] = React.useState(readNum(NSC_BLUR_KEY, NSC_DEFAULTS.blur));
  const [nscCoverFlip, setNscCoverFlip] = React.useState(isNscCoverFlipOn());

  const fireNscUpdate = () => window.dispatchEvent(new Event("liquifyNscUpdate"));

  const [playbarCoverRadius, setPlaybarCoverRadius] = React.useState(readNum(PLAYBAR_COVER_BORDER_RADIUS_KEY, PLAYBAR_COVER_DEFAULTS.borderRadius));

  const [ccaEnabled, setCcaEnabled] = React.useState(readLS(CCA_ENABLED_KEY, CCA_DEFAULTS.enabled));
  const [ccaWidth, setCcaWidth] = React.useState(readNum(CCA_WIDTH_KEY, CCA_DEFAULTS.width));
  const [ccaHeight, setCcaHeight] = React.useState(readNum(CCA_HEIGHT_KEY, CCA_DEFAULTS.height));
  const [ccaMarginBottom, setCcaMarginBottom] = React.useState(readNum(CCA_MARGIN_BOTTOM_KEY, CCA_DEFAULTS.marginBottom));
  const [ccaMarginLeft, setCcaMarginLeft] = React.useState(readNum(CCA_MARGIN_LEFT_KEY, CCA_DEFAULTS.marginLeft));

  const [npvcMode, setNpvcMode] = React.useState(readLS(NPVC_MODE_KEY, NPVC_DEFAULTS.mode));
  const [npvcShowAlways, setNpvcShowAlways] = React.useState(readLS(NPVC_SHOW_ALWAYS_KEY, NPVC_DEFAULTS.showAlways));
  const [npvcBlur, setNpvcBlur] = React.useState(readNum(NPVC_BLUR_KEY, NPVC_DEFAULTS.blur));

  const [popupBounceMode, setPopupBounceMode] = React.useState(readLS(POPUP_BOUNCE_KEY, "on"));
  const [homeLayout, setHomeLayout] = React.useState(readLS(HOME_LAYOUT_KEY, "on"));
  const [performanceMode, setPerformanceMode] = React.useState(!isGlassEnabled());
  const [glassBlur, setGlassBlurState] = React.useState(readNum(GLASS_BLUR_KEY, GLASS_BLUR_DEFAULT));
  const [backdropBlur, setBackdropBlurState] = React.useState(readNum(BACKDROP_BLUR_KEY, BACKDROP_BLUR_DEFAULT));
  const [navRadius, setNavRadiusState] = React.useState(readNum(NAV_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.nav));
  const [mainRadius, setMainRadiusState] = React.useState(readNum(MAIN_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.main));
  const [rightRadius, setRightRadiusState] = React.useState(readNum(RIGHT_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.right));

  const [configText, setConfigText] = React.useState(() => exportConfig());
  const [configStatus, setConfigStatus] = React.useState(null as null | { ok: boolean; msg: string });
  const [configDirty, setConfigDirty] = React.useState(false);
  const configFingerprint = React.useRef(settingsFingerprint());

  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const [libraryFor, setLibraryFor] = React.useState("background" as LibraryTarget);
  const openLibrary = (target: LibraryTarget) => {
    setLibraryFor(target);
    setLibraryOpen(true);
  };

  const cfg = t.config || {};
  const handleConfigCopy = async () => {
    try {
      await navigator.clipboard.writeText(configText);
      setConfigStatus({ ok: true, msg: cfg.copied || "Copied to clipboard." });
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = configText;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setConfigStatus({ ok: true, msg: cfg.copied || "Copied to clipboard." });
      } catch {
        setConfigStatus({ ok: false, msg: cfg.copyFailed || "Couldn't copy — select the text and copy manually." });
      }
    }
  };
  React.useEffect(() => {
    if (configDirty) return;
    const sync = () => {
      const fingerprint = settingsFingerprint();
      if (fingerprint === configFingerprint.current) return;
      configFingerprint.current = fingerprint;
      setConfigText(exportConfig());
      setConfigStatus(null);
    };
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, [configDirty]);

  const handleConfigApply = async () => {
    let text = configText;
    try {
      const clip = await navigator.clipboard.readText();
      if (clip && clip.trim()) {
        text = clip;
        setConfigText(clip);
      }
    } catch {
    }
    const res = importConfig(text);
    if (!res.ok) setConfigStatus({ ok: false, msg: res.error || cfg.invalid || "Invalid config." });
  };

  React.useEffect(() => {
    ensureSettingsUiStyle();
  }, []);

  React.useEffect(() => {
    const handler = () => {
      setPlaybarCoverRadius(readNum(PLAYBAR_COVER_BORDER_RADIUS_KEY, PLAYBAR_COVER_DEFAULTS.borderRadius));
    };
    window.addEventListener("liquifyPlaybarCoverRadiusChange", handler);
    return () => window.removeEventListener("liquifyPlaybarCoverRadiusChange", handler);
  }, []);

  const applyAccentMode = (mode: string) => {
    setAccentMode(mode);
    selectAccentMode(mode);
  };

  const applyAccentSource = (source: string) => {
    setAccentSource(source);
    selectAccentSource(source);
  };

  const applyGlowMode = (mode: string) => {
    setGlowMode(mode);
    if (mode === "custom") applyGlowAccent(glowColor);
    else resetGlowAccentToDefault();
  };

  const applyBgMode = async (mode: string) => {
    setBgMode(mode);
    localStorage.setItem("liquify-bg-mode", mode);

    if (mode === "custom" && !getLibraryUrl()) openLibrary("background");

    if (mode === "url") {
      const saved = localStorage.getItem("liquify-bg-url");
      if (!saved) return;
    }

    updateBackground();
  };

  const applyArtistMode = async (mode: string) => {
    setArtistBgMode(mode);
    localStorage.setItem("liquify-artist-bg-mode", mode);

    if (mode === "custom" && !getArtistLibraryUrl()) openLibrary("artist");

    if (mode === "url") {
      const saved = localStorage.getItem("liquify-artist-bg-url");
      if (!saved) return;
    }

    props.artistCtrl?.setMode?.(mode);
  };

  const applyPlayerWidthMode = (mode: string) => {
    setPlayerWidthMode(mode);
    localStorage.setItem("liquify-player-width", mode);
    applyPlayerWidth(mode);
  };

  const applyPlayerCustom = (nextW: number, nextH: number) => {
    localStorage.setItem("liquify-player-custom-width", String(nextW));
    localStorage.setItem("liquify-player-custom-height", String(nextH));
    applyPlayerWidth("custom");
  };

  const applyRadius = (value: number) => {
    setPlayerRadiusState(value);
    applyPlayerRadius(value);
  };

  const applyPlaylistHeaderMode = (mode: string) => {
    setPlaylistHeader(mode);
    applyPlaylistHeader(mode);
  };

  const applyActionBarBoxMode = (mode: string) => {
    setActionBarBox(mode);
    applyActionBarBox(mode);
  };

  const applyAppearance = (surface: BgSurface, field: BgField, value: number) => {
    setBgAppearance((prev: Record<BgSurface, Record<BgField, number>>) => ({
      ...prev,
      [surface]: { ...prev[surface], [field]: value },
    }));
    setBackgroundAppearance(surface, field, value);
  };

  const appearanceRows = (
    <React.Fragment>
      <div className="liquifyRow">
        <div className="liquifyLabel">{t.backgroundBlur}</div>
        <Stepper
          value={bgAppearance[bgSurface].blur}
          min={0}
          max={BG_BLUR_RANGE[bgSurface]}
          onChange={(v: number) => applyAppearance(bgSurface, "blur", v)}
        />
      </div>
      <div className="liquifyRow">
        <div className="liquifyLabel">{t.backgroundBrightness || "Background Brightness:"}</div>
        <Stepper
          value={bgAppearance[bgSurface].brightness}
          min={0}
          max={200}
          onChange={(v: number) => applyAppearance(bgSurface, "brightness", v)}
        />
      </div>
    </React.Fragment>
  );

  const applyArtistBlur = (value: number) => {
    setArtistScrollBlur(value);
    applyArtistScrollEffect(value, artistScrollBrightness);
  };

  const applyArtistBrightness = (value: number) => {
    setArtistScrollBrightness(value);
    applyArtistScrollEffect(artistScrollBlur, value);
  };

  const handleReset = () => {
    resetAccent();
    setAccentMode("dynamic");
    setAccentSource("background");
    setAccentColor("#1DB954");
    setAccentSatBoost(17);
    setAccentLightBoost(11);

    localStorage.setItem("liquify-glow-mode", "default");
    localStorage.removeItem("liquify-glow-color");
    setGlowMode("default");
    setGlowColor("#1DB954");
    resetGlowAccentToDefault();

    localStorage.setItem("liquify-bg-mode", "dynamic");
    localStorage.removeItem("liquify-bg-url");
    localStorage.setItem("liquify-bg-custom-animated", "off");
    setBgCustomAnimated("off");
    resetKawarpDefaults();
    setKawarpState({ ...KAWARP_DEFAULTS });
    resetBackgroundAppearance();
    setBgAppearance(readAllBackgroundAppearance());
    setBgEngineState("kawarp");
    setBgMode("dynamic");
    setBgUrl("");
    window.dispatchEvent(new Event("liquifyBackgroundChange"));

    localStorage.setItem("liquify-artist-bg-mode", "theme");
    localStorage.setItem("liquify-artist-scroll-blur", "15");
    localStorage.setItem("liquify-artist-scroll-brightness", "70");
    localStorage.removeItem("liquify-artist-bg-url");
    setArtistBgMode("theme");
    setArtistScrollBlur(15);
    setArtistScrollBrightness(70);
    setArtistBgUrl("");
    applyArtistScrollEffect(15, 70);
    props.artistCtrl?.setMode?.("theme");

    localStorage.setItem("liquify-player-width", "theme");
    localStorage.setItem("liquify-player-custom-width", String(DEFAULT_CUSTOM_WIDTH));
    localStorage.setItem("liquify-player-custom-height", String(DEFAULT_CUSTOM_HEIGHT));
    localStorage.setItem("liquify-player-radius", "30");
    setPlayerWidthMode("theme");
    setPlayerCustomW(DEFAULT_CUSTOM_WIDTH);
    setPlayerCustomH(DEFAULT_CUSTOM_HEIGHT);
    setPlayerRadiusState(30);
    applyPlayerWidth("theme");
    applyPlayerRadius(30);

    localStorage.setItem("liquify-playlist-header-mode", "show");
    setPlaylistHeader("show");
    applyPlaylistHeader("show");
    localStorage.setItem("liquify-action-bar-box-mode", "show");
    setActionBarBox("show");
    applyActionBarBox("show");

    setWindowControls("macos");
    applyWindowControls("macos");

    localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, String(PLAYBAR_COVER_DEFAULTS.borderRadius));
    setPlaybarCoverRadius(PLAYBAR_COVER_DEFAULTS.borderRadius);
    applyPlaybarCoverBorderRadius(PLAYBAR_COVER_DEFAULTS.borderRadius);
    window.dispatchEvent(new Event("liquifyPlaybarCoverRadiusChange"));

    setProgressBarHeightState(PROGRESS_BAR_HEIGHT_DEFAULT);
    setProgressBarHeight(PROGRESS_BAR_HEIGHT_DEFAULT);
    setProgressBarRadiusState(PROGRESS_BAR_RADIUS_DEFAULT);
    setProgressBarRadius(PROGRESS_BAR_RADIUS_DEFAULT);
    setProgressBarCompatState(false);
    setProgressBarCompat(false, ensureProgressBarRadiusApplied);

    setTransparentPlayer("off");
    applyTransparentPlayer("off");

    setFloatingPlayer("off");
    applyFloatingPlayer("off");
    setPlaybarBlur(null);
    setPlaybarBlurState(PLAYBAR_BLUR_DEFAULT);
    setCoverFlip(true);
    setCoverFlipState(true);
    setNpvCoverAnim("swipe");
    setNpvCoverAnimState("swipe");

    setConnectBar("show");
    applyConnectBar("show");

    setCompactPlayer("off");
    applyCompactPlayer("off");

    setPlayerIcons("on");
    setPlayerControlIcons("on");

    localStorage.setItem(CCA_ENABLED_KEY, CCA_DEFAULTS.enabled);
    localStorage.setItem(CCA_WIDTH_KEY, String(CCA_DEFAULTS.width));
    localStorage.setItem(CCA_HEIGHT_KEY, String(CCA_DEFAULTS.height));
    localStorage.setItem(CCA_MARGIN_BOTTOM_KEY, String(CCA_DEFAULTS.marginBottom));
    localStorage.setItem(CCA_MARGIN_LEFT_KEY, String(CCA_DEFAULTS.marginLeft));
    setCcaEnabled(CCA_DEFAULTS.enabled);
    setCcaWidth(CCA_DEFAULTS.width);
    setCcaHeight(CCA_DEFAULTS.height);
    setCcaMarginBottom(CCA_DEFAULTS.marginBottom);
    setCcaMarginLeft(CCA_DEFAULTS.marginLeft);
    applyComfyCoverArt();

    localStorage.setItem(NPVC_MODE_KEY, NPVC_DEFAULTS.mode);
    localStorage.setItem(NPVC_SHOW_ALWAYS_KEY, NPVC_DEFAULTS.showAlways);
    localStorage.setItem(NPVC_BLUR_KEY, String(NPVC_DEFAULTS.blur));
    setNpvcMode(NPVC_DEFAULTS.mode);
    setNpvcShowAlways(NPVC_DEFAULTS.showAlways);
    setNpvcBlur(NPVC_DEFAULTS.blur);
    window.dispatchEvent(new Event("liquifyNpvcUpdate"));

    localStorage.setItem(NSC_SHOW_KEY, NSC_DEFAULTS.show);
    localStorage.setItem(NSC_POSITION_KEY, NSC_DEFAULTS.position);
    localStorage.setItem(NSC_HEIGHT_KEY, String(NSC_DEFAULTS.height));
    localStorage.setItem(NSC_MAX_WIDTH_KEY, String(NSC_DEFAULTS.maxWidth));
    localStorage.setItem(NSC_GAP_KEY, String(NSC_DEFAULTS.gap));
    localStorage.setItem(NSC_COVER_SIZE_KEY, String(NSC_DEFAULTS.coverSize));
    localStorage.setItem(NSC_HPAD_KEY, String(NSC_DEFAULTS.hPad));
    localStorage.setItem(NSC_VPAD_KEY, String(NSC_DEFAULTS.vPad));
    localStorage.setItem(NSC_GAP_PLAYER_KEY, String(NSC_DEFAULTS.gapToPlayer));
    localStorage.setItem(NSC_BORDER_RADIUS_KEY, String(NSC_DEFAULTS.borderRadius));
    localStorage.setItem(NSC_BLUR_KEY, String(NSC_DEFAULTS.blur));
    localStorage.setItem(NSC_COVER_FLIP_KEY, "on");
    setNscCoverFlip(true);
    setNscBlur(NSC_DEFAULTS.blur);
    localStorage.setItem(NSC_COVER_BORDER_RADIUS_KEY, String(NSC_DEFAULTS.coverBorderRadius));
    setNscShow(NSC_DEFAULTS.show);
    setNscPosition(NSC_DEFAULTS.position);
    setNscHeight(NSC_DEFAULTS.height);
    setNscMaxWidth(NSC_DEFAULTS.maxWidth);
    setNscGap(NSC_DEFAULTS.gap);
    setNscCoverSize(NSC_DEFAULTS.coverSize);
    setNscHPad(NSC_DEFAULTS.hPad);
    setNscVPad(NSC_DEFAULTS.vPad);
    setNscGapToPlayer(NSC_DEFAULTS.gapToPlayer);
    setNscBorderRadius(NSC_DEFAULTS.borderRadius);
    setNscCoverBorderRadius(NSC_DEFAULTS.coverBorderRadius);
    window.dispatchEvent(new Event("liquifyNscUpdate"));

    localStorage.setItem("liquify-lyrics-mode", "romanization");
    setLyricsMode("romanization");
    window.dispatchEvent(new Event("liquifyLyricsModeChange"));
    setThemedLyricsState("on");
    setThemedLyrics(true);
    setLyricsFontSizeState(LYRICS_FONT_SIZE_DEFAULT);
    setLyricsFontSize(LYRICS_FONT_SIZE_DEFAULT);
    setLyricsMarginState(LYRICS_MARGIN_DEFAULT);
    setLyricsMargin(LYRICS_MARGIN_DEFAULT);

    localStorage.setItem(POPUP_BOUNCE_KEY, "on");
    setPopupBounceMode("on");
    applyPopupBounce("on");
    setHomeLayout("on");
    applyHomeLayout("on");
    setPerformanceMode(false);
    setGlassEnabled(true);
    setGlassBlurState(GLASS_BLUR_DEFAULT);
    setGlassBlur(GLASS_BLUR_DEFAULT);
    setBackdropBlurState(BACKDROP_BLUR_DEFAULT);
    setBackdropBlur(BACKDROP_BLUR_DEFAULT);
    setNavRadiusState(LAYOUT_RADIUS_DEFAULTS.nav);
    setNavRadius(LAYOUT_RADIUS_DEFAULTS.nav);
    setMainRadiusState(LAYOUT_RADIUS_DEFAULTS.main);
    setMainRadius(LAYOUT_RADIUS_DEFAULTS.main);
    setRightRadiusState(LAYOUT_RADIUS_DEFAULTS.right);
    setRightRadius(LAYOUT_RADIUS_DEFAULTS.right);
    resetFonts();
    setBodyFontState(FONT_DEFAULT);
    setHeadingFontState(FONT_DEFAULT);
    resetVinyl();
    setVinylState({ npv: false, playbar: false, cinema: false });
    setVinylSpeedState(VINYL_SPEED_DEFAULT);
    setVinylDetailsState({ grooves: true, label: true, tonearm: false });
    resetSidebarBlur();
    setSidebarBlurState({
      left: { on: false, amount: SIDEBAR_BLUR_DEFAULT },
      right: { on: false, amount: SIDEBAR_BLUR_DEFAULT },
    });
    setLocalFilesTransparentState("off");
    setLocalFilesTransparent("off");
  };

  return (
    <div className="liquifySettingsPanel">
      <div className="liquifySettingsHeader">
        <h3 className="liquifySettingsTitle">{t.title}</h3>
        <div className="liquifyHeaderActions">
          <ButtonTooltip text="Discord">
            <button
              type="button"
              className="liquifyControlSurface liquifyHeaderActionBtn"
              aria-label="Discord"
              onClick={() => openExternalLink(LIQUIFY_DISCORD_URL)}
            >
              {getDiscordIcon()}
            </button>
          </ButtonTooltip>
          <ButtonTooltip text="GitHub">
            <button
              type="button"
              className="liquifyControlSurface liquifyHeaderActionBtn"
              aria-label="GitHub"
              onClick={() => openExternalLink(LIQUIFY_GITHUB_URL)}
            >
              {getGithubIcon()}
            </button>
          </ButtonTooltip>
          <ButtonTooltip text={t.close || "Close"}>
            <button
              type="button"
              className="liquifyControlSurface liquifyHeaderActionBtn liquifyCloseBtn"
              aria-label={t.close || "Close"}
              onClick={props.onClose}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5 19 19" />
                <path d="M19 5 5 19" />
              </svg>
            </button>
          </ButtonTooltip>
        </div>
      </div>

      <div className="liquifySearchIsland">
        <input
          type="text"
          className="liquifyControlSurface liquifySearchInput"
          placeholder={t.searchPlaceholder || "Search settings..."}
          value={searchQuery}
          onChange={(e: any) => setSearchQuery((e.target as HTMLInputElement).value)}
          spellCheck={false}
        />
        <div className="liquifySectionNavWrap">
          <div className="liquifySectionNav" ref={sectionNavRef}>
            {[
              { id: "language", title: titles.language || "Language" },
              { id: "accent", title: titles.accent },
              { id: "background", title: titles.background },
              { id: "artist", title: titles.artist },
              { id: "ui", title: titles.ui || "UI" },
              { id: "player", title: titles.player },
              { id: "nextSongCard", title: titles.nextSongCard || "Next Song Card" },
              { id: "canvasCoverArt", title: titles.canvasCoverArt || "Canvas Cover Art" },
              { id: "playlist", title: titles.playlist },
              { id: "lyrics", title: titles.lyrics || "Lyrics" },
              { id: "transparent", title: titles.transparent },
              { id: "config", title: titles.config || "Config" },
            ].map((s) => (
            <button
              key={s.id}
              type="button"
              className="liquifySectionNavBtn"
              onClick={() => jumpToSection(s.id)}
            >
              {s.title}
            </button>
            ))}
          </div>
        </div>
      </div>
      {sectionNavScrollControls}

      <div className="liquifySettingsBody" ref={bodyRef}>

      <Section id="liquify-sec-language" title={titles.language || "Language"}>
        <div className="liquifyRow">
          <div className="liquifyLabel">{t.language || "Language:"}<HelpTip text={tips.language} /></div>
          <Select
            value={languageMode === "auto" ? "auto" : "custom"}
            options={[
              { value: "auto", label: t.languageOptions?.auto || "Follow Spotify" },
              { value: "custom", label: t.dropdown.custom },
            ]}
            onChange={(v: string) => {
              const next = v === "auto" ? "auto" : languageCode;
              setLanguageModeState(next);
              setLanguage(next);
            }}
          />
        </div>
        {languageMode !== "auto" && (
          <div className="liquifyRow">
            <div className="liquifyLabel">{t.languageChoice || "Language:"}</div>
            <Select
              value={languageMode}
              options={getAvailableLanguages()}
              onChange={(v: string) => {
                setLanguageModeState(v);
                setLanguage(v);
              }}
            />
          </div>
        )}
      </Section>

      <Section id="liquify-sec-accent" title={titles.accent}>
        <div className="liquifyRow">
          <div className="liquifyLabel">{t.accentColor}<HelpTip text={tips.accentColor} /></div>
          <div className="liquifyRowControls">
            <Select
              value={accentMode}
              options={[
                { value: "default", label: t.dropdown.default },
                { value: "custom", label: t.dropdown.custom },
                { value: "dynamic", label: t.dropdown.dynamic }
              ]}
              onChange={applyAccentMode}
            />
            {accentMode === "custom" && (
              <ColorPicker
                value={accentColor}
                onChange={(next) => {
                  setAccentColor(next);
                  selectCustomAccent(next);
                }}
              />
            )}
          </div>
        </div>
        <div className="liquifyRow">
          <div className="liquifyLabel">{t.accentSource}<HelpTip text={tips.accentSource} /></div>
          <Select
            value={accentSource}
            options={[
              { value: "background", label: t.dropdown.backgroundSource },
              { value: "cover", label: t.dropdown.songCover }
            ]}
            onChange={applyAccentSource}
          />
        </div>
        {accentMode === "dynamic" && (
          <>
            <div className="liquifyRow">
              <div className="liquifyLabel">{t.accentSatBoost}<HelpTip text={tips.accentSatBoost} /></div>
              <Stepper value={accentSatBoost} min={1} max={100} onChange={(v) => {
                setAccentSatBoost(v);
                setAccentSaturation(v);
              }} />
            </div>
            <div className="liquifyRow">
              <div className="liquifyLabel">{t.accentLightBoost}<HelpTip text={tips.accentLightBoost} /></div>
              <Stepper value={accentLightBoost} min={1} max={100} onChange={(v) => {
                setAccentLightBoost(v);
                setAccentLightness(v);
              }} />
            </div>
          </>
        )}
      </Section>

      <Section id="liquify-sec-background" title={titles.background}>
        <div className="liquifyRow">
          <div className="liquifyLabel">{t.background}<HelpTip text={tips.background} /></div>
          <div className="liquifyStackedControls">
            <Select
              value={bgMode}
              options={[
                { value: "dynamic", label: t.dropdown.dynamic },
                { value: "animated", label: t.dropdown.animated },
                { value: "playlist", label: t.dropdown.playlist || "Playlist" },
                { value: "custom", label: t.dropdown.custom },
                { value: "url", label: t.dropdown.url || "URL" }
              ]}
              onChange={(m) => void applyBgMode(m)}
            />
            {bgMode === "custom" && (
              <button
                type="button"
                className="liquifyControlSurface liquifyActionBtn"
                onClick={() => openLibrary("background")}
              >
                {t.openLibrary || "Image Library"}
              </button>
            )}
            {bgMode === "url" && (
              <input
                type="text"
                className="liquifyControlSurface liquifyTextInput"
                placeholder={t.enterUrl || "Enter image URL..."}
                value={bgUrl}
                onChange={(e: any) => {
                  const val = (e.target as HTMLInputElement).value;
                  setBgUrl(val);
                  localStorage.setItem("liquify-bg-url", val);
                  if (val) updateBackground();
                }}
              />
            )}
          </div>
        </div>

        <div className="liquifyRow">
          <div className="liquifyLabel">{t.hiResCover || "Use hi-res pictures:"}<HelpTip text={tips.hiResCover} /></div>
          <Toggle
            checked={hiResCover}
            onChange={(checked) => {
              setHiResCoverState(checked);
              setHiResCover(checked);
            }}
          />
        </div>

        {(bgMode === "custom" || bgMode === "url" || bgMode === "playlist") && (
          <div className="liquifyRow">
            <div className="liquifyLabel">{t.animatedBackground || "Animated Background:"}<HelpTip text={tips.animatedBackground} /></div>
            <Toggle
              checked={bgCustomAnimated === "on"}
              onChange={(checked) => {
                const v = checked ? "on" : "off";
                setBgCustomAnimated(v);
                localStorage.setItem("liquify-bg-custom-animated", v);
                window.dispatchEvent(new Event("liquifyBackgroundChange"));
              }}
            />
          </div>
        )}

        {!animatedActive && appearanceRows}

        {animatedActive && (
          <SubSection title={sub.kawarp || "Animated Background"}>
            <div className="liquifyRow">
              <div className="liquifyLabel">{t.animatedEngine || "Engine:"}</div>
              <Select
                value={bgEngine}
                onChange={(v: string) => {
                  setBgEngineState(v as BgEngine);
                  setBgEngine(v as BgEngine);
                }}
                options={[
                  { value: "kawarp", label: t.dropdown.engineKawarp || "Kawarp (WebGL)" },
                  { value: "tiles", label: t.dropdown.engineTiles || "Classic" },
                ]}
              />
            </div>

            {appearanceRows}

            {bgEngine === "kawarp" && (Object.keys(KAWARP_RANGES) as KawarpKey[]).map((key) => (
              <div className="liquifyRow" key={key}>
                <div className="liquifyLabel">{(t.kawarp || {})[key] || key}</div>
                <Stepper
                  value={kawarp[key]}
                  min={KAWARP_RANGES[key].min}
                  max={KAWARP_RANGES[key].max}
                  onChange={(v: number) => applyKawarp(key, v)}
                />
              </div>
            ))}
          </SubSection>
        )}

        <BackgroundLibrary
          open={libraryOpen}
          target={libraryFor}
          onClose={() => setLibraryOpen(false)}
          labels={{
            title: t.imageLibrary || "Image Library",
            add: t.addImages || "Add images",
            empty: t.libraryEmpty || "No images yet. Add some to get started.",
            remove: t.removeImage || "Remove",
            close: t.close || "Close",
          }}
        />
      </Section>

      <Section id="liquify-sec-artist" title={titles.artist}>
        <div className="liquifyRow">
          <div className="liquifyLabel">{t.apbackground}<HelpTip text={tips.artistBackground} /></div>
          <div className="liquifyStackedControls">
            <Select
              value={artistBgMode}
              options={[
                { value: "theme", label: t.dropdown.theme },
                { value: "none", label: t.dropdown.none },
                { value: "custom", label: t.dropdown.custom },
                { value: "url", label: t.dropdown.url || "URL" }
              ]}
              onChange={(m) => void applyArtistMode(m)}
            />
            {artistBgMode === "custom" && (
              <button
                type="button"
                className="liquifyControlSurface liquifyActionBtn"
                onClick={() => openLibrary("artist")}
              >
                {t.openLibrary || "Image Library"}
              </button>
            )}
            {artistBgMode === "url" && (
              <input
                type="text"
                className="liquifyControlSurface liquifyTextInput"
                placeholder={t.enterUrl || "Enter image URL..."}
                value={artistBgUrl}
                onChange={(e: any) => {
                  const val = (e.target as HTMLInputElement).value;
                  setArtistBgUrl(val);
                  localStorage.setItem("liquify-artist-bg-url", val);
                  if (val) props.artistCtrl?.setMode?.("url");
                }}
              />
            )}
          </div>
        </div>

        <div className="liquifyRow">
          <div className="liquifyLabel">{t.artistScrollBlur}<HelpTip text={tips.artistScrollBlur} /></div>
          <Stepper value={artistScrollBlur} min={0} max={100} onChange={applyArtistBlur} />
        </div>

        <div className="liquifyRow">
          <div className="liquifyLabel">{t.artistScrollBrightness}<HelpTip text={tips.artistScrollBrightness} /></div>
          <Stepper value={artistScrollBrightness} min={0} max={200} onChange={applyArtistBrightness} />
        </div>
      </Section>

      <Section id="liquify-sec-ui" title={titles.ui || "UI"}>
        <SubSection title={sub.performanceGlass || "Performance & Glass"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.ui?.performanceMode) || "Performance Mode:"}<HelpTip text={tips.performanceMode} /></div>
            <Toggle
              checked={performanceMode}
              onChange={(checked) => {
                setPerformanceMode(checked);
                setGlassEnabled(!checked);
              }}
            />
          </div>
          {performanceMode ? (
            <div className="liquifyRow">
              <div className="liquifyLabel">{(t.ui?.backdropBlur) || "Backdrop Blur (px):"}</div>
              <Stepper value={backdropBlur} min={0} max={80} onChange={(v) => { setBackdropBlurState(v); setBackdropBlur(v); }} />
            </div>
          ) : (
            <>
              <div className="liquifyRow">
                <div className="liquifyLabel">{(t.ui?.glassBlur) || "Glass Blur (px):"}<HelpTip text={tips.glassBlur} /></div>
                <Stepper value={glassBlur} min={0} max={30} onChange={(v) => { setGlassBlurState(v); setGlassBlur(v); }} />
              </div>
            </>
          )}
        </SubSection>
        <SubSection title={sub.animations || "Animations"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.ui?.popupBounce) || "Popup Bounce:"}<HelpTip text={tips.popupBounce} /></div>
            <Toggle
              checked={popupBounceMode === "on"}
              onChange={(checked) => {
                const v = checked ? "on" : "off";
                setPopupBounceMode(v);
                applyPopupBounce(v);
              }}
            />
          </div>
        </SubSection>
        <SubSection title={sub.homescreen || "Homescreen"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.ui?.newHomescreenLayout) || "Use New Homescreen Layout:"}<HelpTip text={tips.newHomescreenLayout} /></div>
            <Toggle
              checked={homeLayout === "on"}
              onChange={(checked) => {
                const v = checked ? "on" : "off";
                setHomeLayout(v);
                applyHomeLayout(v);
              }}
            />
          </div>
        </SubSection>
        <SubSection title={sub.borderRadius || "Border Radius"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.ui?.leftSidebarRadius) || "Left Sidebar Border Radius:"}</div>
            <Stepper value={navRadius} min={0} max={50} onChange={(v) => { setNavRadiusState(v); setNavRadius(v); }} />
          </div>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.ui?.mainViewRadius) || "Main View Border Radius:"}</div>
            <Stepper value={mainRadius} min={0} max={50} onChange={(v) => { setMainRadiusState(v); setMainRadius(v); }} />
          </div>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.ui?.rightSidebarRadius) || "Right Sidebar Border Radius:"}</div>
            <Stepper value={rightRadius} min={0} max={50} onChange={(v) => { setRightRadiusState(v); setRightRadius(v); }} />
          </div>
        </SubSection>
        <SubSection title={sub.sidebars || "Sidebars"}>
          {(Object.keys(SIDEBARS) as SidebarSide[]).map((side) => (
            <React.Fragment key={side}>
              <div className="liquifyRow">
                <div className="liquifyLabel">
                  {(t.ui?.[side === "left" ? "leftSidebarBlur" : "rightSidebarBlur"]) ||
                    (side === "left" ? "Blur Behind Left Sidebar:" : "Blur Behind Right Sidebar:")}
                  <HelpTip text={tips.sidebarBlur} />
                </div>
                <Toggle
                  checked={sidebarBlur[side].on}
                  onChange={(checked) => applySidebarBlur(side, { on: checked })}
                />
              </div>
              {sidebarBlur[side].on && (
                <div className="liquifyRow">
                  <div className="liquifyLabel">
                    {(t.ui?.[side === "left" ? "leftSidebarBlurAmount" : "rightSidebarBlurAmount"]) ||
                      (side === "left" ? "Left Sidebar Blur (px):" : "Right Sidebar Blur (px):")}
                  </div>
                  <Stepper
                    value={sidebarBlur[side].amount}
                    min={0}
                    max={80}
                    onChange={(v: number) => applySidebarBlur(side, { amount: v })}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.ui?.localFilesTransparent) || "Transparent Local Files Card:"}<HelpTip text={tips.localFilesTransparent} /></div>
            <Toggle
              checked={localFilesTransparent === "on"}
              onChange={(checked) => {
                const v = checked ? "on" : "off";
                setLocalFilesTransparentState(v);
                setLocalFilesTransparent(v);
              }}
            />
          </div>
        </SubSection>
        <SubSection title={sub.typography || "Typography"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.ui?.bodyFont) || "Body Font:"}<HelpTip text={tips.bodyFont} /></div>
            <FontPicker value={bodyFont} labels={t.fontPicker} onChange={(v: string) => { setBodyFontState(v); setFont("body", v); }} />
          </div>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.ui?.headingFont) || "Heading Font:"}<HelpTip text={tips.headingFont} /></div>
            <FontPicker value={headingFont} labels={t.fontPicker} onChange={(v: string) => { setHeadingFontState(v); setFont("heading", v); }} />
          </div>
        </SubSection>
        <SubSection title={sub.vinyl || "Vinyl Cover Art"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.npvCoverAnim) || "Sidebar Cover Animation:"}<HelpTip text={tips.npvCoverAnim} /></div>
            <Select
              value={npvCoverAnim}
              onChange={(v: string) => { setNpvCoverAnimState(v as NpvCoverAnim); setNpvCoverAnim(v as NpvCoverAnim); }}
              options={[
                { value: "swipe", label: (t.npvCoverAnimOptions || {}).swipe || "Swipe" },
                { value: "flip", label: (t.npvCoverAnimOptions || {}).flip || "Flip" },
                { value: "off", label: (t.dropdown || {}).off || "Off" },
              ]}
            />
          </div>
          {(Object.keys(VINYL_SURFACES) as VinylSurface[]).map((surface) => (
            <div className="liquifyRow" key={surface}>
              <div className="liquifyLabel">
                {(t.vinyl || {})[surface] || surface}
                <HelpTip text={tips.vinyl} />
              </div>
              <Toggle
                checked={vinyl[surface]}
                onChange={(checked) => applyVinyl(surface, checked)}
              />
            </div>
          ))}
          {(Object.keys(VINYL_SURFACES) as VinylSurface[]).some((s) => vinyl[s]) && (
            <>
              <div className="liquifyRow">
                <div className="liquifyLabel">{(t.vinyl || {}).speed || "Seconds Per Turn:"}</div>
                <Stepper
                  value={vinylSpeed}
                  min={1}
                  max={60}
                  onChange={(v: number) => { setVinylSpeedState(v); setVinylSpeed(v); }}
                />
              </div>
              {(Object.keys(VINYL_DETAILS) as VinylDetail[]).map((detail) => (
                <div className="liquifyRow" key={detail}>
                  <div className="liquifyLabel">
                    {(t.vinyl || {})[detail] || detail}
                    <HelpTip text={tips[`vinyl${detail[0].toUpperCase()}${detail.slice(1)}`]} />
                  </div>
                  <Toggle
                    checked={vinylDetails[detail]}
                    onChange={(checked) => applyVinylDetail(detail, checked)}
                  />
                </div>
              ))}
            </>
          )}
        </SubSection>
      </Section>

      <Section id="liquify-sec-player" title={titles.player}>
        <SubSection title={sub.sizeShape || "Size & Shape"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{t.playerWidth}<HelpTip text={tips.playerWidth} /></div>
            <Select
              value={playerWidthMode}
              options={[
                { value: "default", label: t.dropdown.default },
                { value: "theme", label: t.dropdown.theme },
                { value: "custom", label: t.dropdown.custom }
              ]}
              onChange={applyPlayerWidthMode}
            />
          </div>

          {playerWidthMode === "custom" && (
            <div className="liquifySubBlock">
              <div className="liquifyRow" style={{ margin: 0 }}>
                <div className="liquifyLabel">{t.playerCustomWidth}</div>
                <Stepper
                  value={playerCustomW}
                  min={0}
                  max={100}
                  onChange={(v) => {
                    setPlayerCustomW(v);
                    applyPlayerCustom(v, playerCustomH);
                  }}
                />
              </div>
              <div className="liquifyRow" style={{ margin: 0 }}>
                <div className="liquifyLabel">{t.playerCustomHeight}</div>
                <Stepper
                  value={playerCustomH}
                  min={0}
                  max={300}
                  onChange={(v) => {
                    setPlayerCustomH(v);
                    applyPlayerCustom(playerCustomW, v);
                  }}
                />
              </div>
            </div>
          )}

          <div className="liquifyRow">
            <div className="liquifyLabel">{t.playerRadius}</div>
            <Stepper value={playerRadius} min={0} max={100} onChange={applyRadius} />
          </div>
        </SubSection>

        <SubSection title={sub.progressVolume || "Progress & Volume Bar"}>
          {!progressBarCompat && (
            <>
              <div className="liquifyRow">
                <div className="liquifyLabel">{(t.progressBarHeight) || "Progress & Volume Bar Height:"}</div>
                <Stepper value={progressBarHeight} min={1} max={20} onChange={(v) => { setProgressBarHeightState(v); setProgressBarHeight(v); }} />
              </div>
              <div className="liquifyRow">
                <div className="liquifyLabel">{(t.progressBarRadius) || "Progress & Volume Bar Border Radius:"}</div>
                <Stepper value={progressBarRadius} min={0} max={20} onChange={(v) => { setProgressBarRadiusState(v); setProgressBarRadius(v); }} />
              </div>
            </>
          )}
          <div className="liquifyRow">
            <div className="liquifyLabel">
              {t.progressBarCompat || "Compatibility Mode:"}<HelpTip text={tips.progressBarCompat} />
            </div>
            <div className="liquifyRowControls">
              <Toggle
                checked={progressBarCompat}
                onChange={(checked) => {
                  setProgressBarCompatState(checked);
                  setProgressBarCompat(checked, ensureProgressBarRadiusApplied);
                }}
              />
            </div>
          </div>
        </SubSection>

        <SubSection title={sub.coverArt || "Cover Art"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.coverFlip) || "Flip Cover on Song Change:"}<HelpTip text={tips.coverFlip} /></div>
            <Toggle
              checked={coverFlip}
              onChange={(checked) => { setCoverFlipState(checked); setCoverFlip(checked); }}
            />
          </div>

          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.playbarCoverBorderRadius) || "Cover Art Border Radius:"}</div>
            <Stepper value={playbarCoverRadius} min={0} max={50} onChange={(v) => {
              setPlaybarCoverRadius(v);
              applyPlaybarCoverBorderRadius(v);
            }} />
          </div>

          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.comfyCoverArt?.enabled) || "Comfy Cover Art:"}<HelpTip text={tips.comfyCoverArt} /></div>
            <div className="liquifyRowControls">
              <Toggle
                checked={ccaEnabled === "show"}
                onChange={(checked) => {
                  const v = checked ? "show" : "hide";
                  setCcaEnabled(v);
                  localStorage.setItem(CCA_ENABLED_KEY, v);
                  applyComfyCoverArt();
                }}
              />
            </div>
          </div>

          {ccaEnabled === "show" && (
            <div className="liquifySubBlock">
              <div className="liquifyRow" style={{ margin: 0 }}>
                <div className="liquifyLabel">{(t.comfyCoverArt?.width) || "Width (px)"}</div>
                <Stepper value={ccaWidth} min={16} max={200} onChange={(v) => {
                  setCcaWidth(v);
                  localStorage.setItem(CCA_WIDTH_KEY, String(v));
                  applyComfyCoverArt();
                }} />
              </div>
              <div className="liquifyRow" style={{ margin: 0 }}>
                <div className="liquifyLabel">{(t.comfyCoverArt?.height) || "Height (px)"}</div>
                <Stepper value={ccaHeight} min={16} max={200} onChange={(v) => {
                  setCcaHeight(v);
                  localStorage.setItem(CCA_HEIGHT_KEY, String(v));
                  applyComfyCoverArt();
                }} />
              </div>
              <div className="liquifyRow" style={{ margin: 0 }}>
                <div className="liquifyLabel">{(t.comfyCoverArt?.marginBottom) || "Margin Bottom (px)"}</div>
                <Stepper value={ccaMarginBottom} min={-50} max={200} onChange={(v) => {
                  setCcaMarginBottom(v);
                  localStorage.setItem(CCA_MARGIN_BOTTOM_KEY, String(v));
                  applyComfyCoverArt();
                }} />
              </div>
              <div className="liquifyRow" style={{ margin: 0 }}>
                <div className="liquifyLabel">{(t.comfyCoverArt?.marginLeft) || "Margin Left (px)"}</div>
                <Stepper value={ccaMarginLeft} min={-50} max={200} onChange={(v) => {
                  setCcaMarginLeft(v);
                  localStorage.setItem(CCA_MARGIN_LEFT_KEY, String(v));
                  applyComfyCoverArt();
                }} />
              </div>
            </div>
          )}
        </SubSection>

        <SubSection title={sub.modes || "Modes"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.floatingPlayer) || "Floating Player:"}<HelpTip text={tips.floatingPlayer} /></div>
            <Toggle
              checked={floatingPlayer === "on"}
              onChange={(checked) => {
                const v = checked ? "on" : "off";
                setFloatingPlayer(v);
                applyFloatingPlayer(v);
              }}
            />
          </div>
          {floatingPlayer === "on" && (
            <div className="liquifyRow">
              <div className="liquifyLabel">{(t.playbarBlur) || "Playbar Blur (px):"}<HelpTip text={tips.playbarBlur} /></div>
              <Stepper
                value={playbarBlur}
                min={0}
                max={100}
                onChange={(v: number) => { setPlaybarBlurState(v); setPlaybarBlur(v); }}
              />
            </div>
          )}
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.transparentPlayer) || "Transparent Player:"}<HelpTip text={tips.transparentPlayer} /></div>
            <Toggle
              checked={transparentPlayer === "on"}
              onChange={(checked) => {
                const v = checked ? "on" : "off";
                setTransparentPlayer(v);
                applyTransparentPlayer(v);
              }}
            />
          </div>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.compactPlayer) || "Compact Player:"}<HelpTip text={tips.compactPlayer} /></div>
            <Toggle
              checked={compactPlayer === "on"}
              onChange={(checked) => {
                const v = checked ? "on" : "off";
                setCompactPlayer(v);
                applyCompactPlayer(v);
              }}
            />
          </div>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.playerControlIcons) || "Use New Player Icons:"}<HelpTip text={tips.playerControlIcons} /></div>
            <Toggle
              checked={playerIcons === "on"}
              onChange={(checked) => {
                const v = checked ? "on" : "off";
                setPlayerIcons(v);
                setPlayerControlIcons(v);
              }}
            />
          </div>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.connectBar) || "Show Connect Bar:"}<HelpTip text={tips.connectBar} /></div>
            <Toggle
              checked={connectBar === "show"}
              onChange={(checked) => {
                const v = checked ? "show" : "hide";
                setConnectBar(v);
                applyConnectBar(v);
              }}
            />
          </div>
        </SubSection>
      </Section>

      <Section id="liquify-sec-nextSongCard" title={titles.nextSongCard || "Next Song Card"}>
        <div className="liquifyRow">
          <div className="liquifyLabel">{(t.nextSongCard?.show) || "Show Next Song Card:"}<HelpTip text={tips.nextSongCard} /></div>
          <div className="liquifyRowControls">
            <Toggle
              checked={nscShow === "show"}
              onChange={(checked) => {
                const v = checked ? "show" : "hide";
                setNscShow(v);
                localStorage.setItem(NSC_SHOW_KEY, v);
                fireNscUpdate();
              }}
            />
          </div>
        </div>

        {nscShow === "show" && (
          <div className="liquifySubBlock">
            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.position) || "Horizontal Position"}</div>
              <div className="liquifyRowControls">
                <Select
                  value={nscPosition}
                  options={[
                    { value: "left", label: (t.nextSongCard?.left) || "Left" },
                    { value: "right", label: (t.nextSongCard?.right) || "Right" }
                  ]}
                  onChange={(v) => {
                    setNscPosition(v);
                    localStorage.setItem(NSC_POSITION_KEY, v);
                    fireNscUpdate();
                  }}
                />
              </div>
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.cardHeight) || "Card Height (px)"}</div>
              <Stepper value={nscHeight} min={32} max={200} onChange={(v) => {
                setNscHeight(v);
                localStorage.setItem(NSC_HEIGHT_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.cardMaxWidth) || "Card Max Width (px)"}</div>
              <Stepper value={nscMaxWidth} min={100} max={600} onChange={(v) => {
                setNscMaxWidth(v);
                localStorage.setItem(NSC_MAX_WIDTH_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.gap) || "Gap between Image and Text (px)"}</div>
              <Stepper value={nscGap} min={0} max={24} onChange={(v) => {
                setNscGap(v);
                localStorage.setItem(NSC_GAP_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.coverSize) || "Cover Size (px)"}</div>
              <Stepper value={nscCoverSize} min={16} max={128} onChange={(v) => {
                setNscCoverSize(v);
                localStorage.setItem(NSC_COVER_SIZE_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.hPad) || "Horizontal Padding (px)"}</div>
              <Stepper value={nscHPad} min={0} max={32} onChange={(v) => {
                setNscHPad(v);
                localStorage.setItem(NSC_HPAD_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.vPad) || "Vertical Padding (px)"}</div>
              <Stepper value={nscVPad} min={0} max={32} onChange={(v) => {
                setNscVPad(v);
                localStorage.setItem(NSC_VPAD_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.gapToPlayer) || "Distance to Player (px)"}</div>
              <Stepper value={nscGapToPlayer} min={0} max={40} onChange={(v) => {
                setNscGapToPlayer(v);
                localStorage.setItem(NSC_GAP_PLAYER_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.borderRadius) || "Border Radius (px)"}</div>
              <Stepper value={nscBorderRadius} min={0} max={50} onChange={(v) => {
                setNscBorderRadius(v);
                localStorage.setItem(NSC_BORDER_RADIUS_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.coverBorderRadius) || "Cover Border Radius (px)"}</div>
              <Stepper value={nscCoverBorderRadius} min={0} max={50} onChange={(v) => {
                setNscCoverBorderRadius(v);
                localStorage.setItem(NSC_COVER_BORDER_RADIUS_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.blur) || "Blur (px):"}</div>
              <Stepper value={nscBlur} min={0} max={50} onChange={(v) => {
                setNscBlur(v);
                localStorage.setItem(NSC_BLUR_KEY, String(v));
                fireNscUpdate();
              }} />
            </div>

            <div className="liquifyRow" style={{ margin: 0 }}>
              <div className="liquifyLabel">{(t.nextSongCard?.coverFlip) || "Flip Cover on Song Change:"}</div>
              <Toggle
                checked={nscCoverFlip}
                onChange={(checked) => {
                  setNscCoverFlip(checked);
                  localStorage.setItem(NSC_COVER_FLIP_KEY, checked ? "on" : "off");
                }}
              />
            </div>
          </div>
        )}
      </Section>

      <Section id="liquify-sec-canvasCoverArt" title={titles.canvasCoverArt || "Canvas Cover Art"}>
        <div className="liquifyRow">
          <div className="liquifyLabel">{(t.canvasCoverArt?.mode) || "Track Name Cover Art:"}<HelpTip text={tips.canvasCoverArt} /></div>
          <Select
            value={npvcMode}
            options={[
              { value: "off", label: (t.canvasCoverArt?.off) || "Off" },
              { value: "trackInfo", label: (t.canvasCoverArt?.trackInfo) || "Next to Track Info" },
              { value: "outsideTrackInfo", label: (t.canvasCoverArt?.outsideTrackInfo) || "Outside Track Info" }
            ]}
            onChange={(v) => {
              setNpvcMode(v);
              localStorage.setItem(NPVC_MODE_KEY, v);
              window.dispatchEvent(new Event("liquifyNpvcUpdate"));
            }}
          />
        </div>
        <div className="liquifyRow">
          <div className="liquifyLabel">{(t.canvasCoverArt?.showAlways) || "Show Always:"}<HelpTip text={tips.canvasShowAlways} /></div>
          <Toggle
            checked={npvcShowAlways === "yes"}
            onChange={(checked) => {
              const v = checked ? "yes" : "no";
              setNpvcShowAlways(v);
              localStorage.setItem(NPVC_SHOW_ALWAYS_KEY, v);
              window.dispatchEvent(new Event("liquifyNpvcUpdate"));
            }}
          />
        </div>
      </Section>

      <Section id="liquify-sec-playlist" title={titles.playlist}>
        <div className="liquifyRow">
          <div className="liquifyLabel">{t.playlistHeaderBox}<HelpTip text={tips.playlistHeaderBox} /></div>
          <Toggle
            checked={playlistHeader === "show"}
            onChange={(checked) => applyPlaylistHeaderMode(checked ? "show" : "hide")}
          />
        </div>
        <div className="liquifyRow">
          <div className="liquifyLabel">{t.actionBarBox || "Action Bar Box:"}<HelpTip text={tips.actionBarBox} /></div>
          <Toggle
            checked={actionBarBox === "show"}
            onChange={(checked) => applyActionBarBoxMode(checked ? "show" : "hide")}
          />
        </div>

      </Section>

      <Section id="liquify-sec-lyrics" title={titles.lyrics || "Lyrics"}>
        <SubSection title={sub.styling || "Styling"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{t.themedLyrics || "Themed Lyrics:"}<HelpTip text={tips.themedLyrics} /></div>
            <Toggle
              checked={themedLyrics === "on"}
              onChange={(checked) => {
                setThemedLyricsState(checked ? "on" : "off");
                setThemedLyrics(checked);
              }}
            />
          </div>
          {themedLyrics === "on" && (
            <div className="liquifyRow">
              <div className="liquifyLabel">{t.lyricsFontSize || "Lyrics Font Size:"}</div>
              <Stepper value={lyricsFontSize} min={50} max={300} onChange={(v) => { setLyricsFontSizeState(v); setLyricsFontSize(v); }} />
            </div>
          )}
          {themedLyrics === "on" && (
            <div className="liquifyRow">
              <div className="liquifyLabel">{t.lyricsMargin || "Lyrics Margin:"}</div>
              <Stepper value={lyricsMargin} min={0} max={120} onChange={(v) => { setLyricsMarginState(v); setLyricsMargin(v); }} />
            </div>
          )}
        </SubSection>
        <SubSection title={sub.translation || "Translation"}>
          <div className="liquifyRow">
            <div className="liquifyLabel">{(t.lyricsMode || "Lyrics Translation/Romanization:").replace("/", "/\u200B")}</div>
            <div className="liquifyRowControls">
              <Select
                value={lyricsMode}
                options={[
                  { value: "off", label: t.lyricsOptions?.off || "Off" },
                  { value: "translation", label: t.lyricsOptions?.translation || "Translation only" },
                  { value: "romanization", label: t.lyricsOptions?.romanization || "Romanization only" },
                  { value: "both", label: t.lyricsOptions?.both || "Translation + Romanization" }
                ]}
                onChange={applyLyricsMode}
              />
            </div>
          </div>
        </SubSection>
      </Section>

      <Section id="liquify-sec-transparent" title={titles.transparent}>
        <div className="liquifyRow">
          <div className="liquifyLabel">{t.windowsControls || "Windows Window Controls:"}<HelpTip text={tips.windowsControls} /></div>
          <Toggle
            checked={windowControls === "windows"}
            onChange={(checked) => {
              const v = checked ? "windows" : "macos";
              setWindowControls(v);
              applyWindowControls(v);
            }}
          />
        </div>
      </Section>

      <Section id="liquify-sec-config" title={titles.config || "Config"}>
        <div className="liquifyConfigBlock">
          <div className="liquifyConfigHint">
            {cfg.hint || "Copy your current Liquify config, or paste one and apply it. Background images aren't included."}
          </div>
          <textarea
            className="liquifyControlSurface liquifyConfigTextarea"
            spellCheck={false}
            value={configText}
            onChange={(e: any) => {
              setConfigText((e.target as HTMLTextAreaElement).value);
              setConfigDirty(true);
              setConfigStatus(null);
            }}
          />
          {configStatus && (
            <div className={"liquifyConfigStatus" + (configStatus.ok ? " isOk" : " isError")}>
              {configStatus.msg}
            </div>
          )}
          <div className="liquifyConfigActions">
            <button type="button" className="liquifyControlSurface liquifyActionBtn" onClick={handleConfigCopy}>
              {cfg.copy || "Copy"}
            </button>
            <button type="button" className="liquifyControlSurface liquifyActionBtn liquifyConfigApplyBtn" onClick={handleConfigApply}>
              {cfg.apply || "Paste & Apply"}
            </button>
          </div>
        </div>
      </Section>

<div style={{ display: "flex", justifyContent: "center", marginTop: "16px", marginBottom: "8px" }}>
        <button
          type="button"
          className="liquifyControlSurface liquifyActionBtn liquifyResetBtn"
          onClick={handleReset}
          style={{ padding: "8px 24px", fontSize: "14px" }}
        >
          {t.resetAllSettings || "Reset all Settings"}
        </button>
      </div>

      </div>
    </div>
  );
}
