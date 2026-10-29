import { HexColorPicker } from 'react-colorful';
import { FONTS, FONT_CATEGORIES, FONT_DEFAULT, SPOTIFY_STACK, loadFontPreviews } from '../features/fonts';
import { isPopupBounceOn } from '../features/uiEffects';
import { getTranslation } from '../i18n/translations';
import {
  LibraryImage,
  LibraryTarget,
  addImages,
  deleteImage,
  librarySelectedKey,
  listImages,
  selectImage,
} from '../features/backgroundLibrary';

const ROW_HEIGHT = 52;
const OVERSCAN = 6;
import { clamp, Option } from '../shared';
import { React, ReactDOM } from '../runtime/reactRuntime';

const LIQUIFY_DISCORD_URL = "https://discord.gg/QRMnrgjhvq";
const LIQUIFY_GITHUB_URL = "https://github.com/NMWplays/Liquify";

export function openExternalLink(url: string) {
  if (!url) return;
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    try {
      location.href = url;
    } catch {}
  }
}

export function getDiscordIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
    </svg>
  );
}

export function getGithubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 98 96"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      />
    </svg>
  );
}

export function ensureSettingsUiStyle() {
  if (document.getElementById("liquify-settings-ui-style")) return;
  const style = document.createElement("style");
  style.id = "liquify-settings-ui-style";
  style.textContent = `
    .liquifySettingsPanel {
      width: min(560px, 92vw);
      min-width: 0;
      padding: 18px 0 20px;
      border-radius: 20px;
      color: white;
      background: transparent;
      box-shadow: var(--liquify-shadow);
      position: relative;
      isolation: isolate;
      transform: translateZ(0);
      will-change: transform;
      height: min(70vh, calc(100vh - 80px));
      max-height: min(70vh, calc(100vh - 80px));
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .liquifySettingsHeader {
      height: 100px;
      position: relative;
      z-index: 10;
      margin: 0 0 14px 0;
      -webkit-backdrop-filter: blur(2rem) saturate(1.25) brightness(1.08);
      padding: 10px 12px;
      border-radius: 0;
      background: transparent;
      overflow: hidden;
      isolation: isolate;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .liquifySettingsTitle { margin: 0; text-align: center; font-weight: 700; position: relative; z-index: 1; }
    .liquifyHeaderActions {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 1;
    }
    .liquifyHeaderActionBtn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-shadow: none !important;
      background: transparent !important;
      padding: 0;
      transition: background-color 0.2s ease;
      box-shadow: var(--liquify-shadow) !important;
    }
    .liquifyHeaderActionBtn:hover { background: var(--accent-color) !important; }
    .liquifyHeaderActionBtn svg { width: 16px; height: 16px; display: block; }
    .liquifyCloseBtn svg {
      width: 18px;
      height: 18px;
      display: block;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
    }
    .liquifySettingsBody {
      flex: 1 1 auto;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 34px;
      padding-top: 0px;
      padding-right: 22px;
      padding-bottom: 10px;
      margin-bottom: -20px;
      will-change: box-shadow, backdrop-filter;
      box-sizing: border-box;
      overflow-y: overlay;
      scrollbar-width: auto;
      scrollbar-color: rgba(205, 205, 205, 0.78) transparent;
    }
    .liquifySettingsBody::-webkit-scrollbar { width: 12px; }
    .liquifySettingsBody::-webkit-scrollbar-track { background: transparent; }
    .liquifySettingsBody::-webkit-scrollbar-thumb { background: rgba(205, 205, 205, 0.78); border-radius: 999px; }
    .liquifySettingsBody::-webkit-scrollbar-thumb:hover { background: rgba(225, 225, 225, 0.9); }
    .liquifySettingsBody.isDropdownOpen {
      scrollbar-color: transparent transparent;
    }
    .liquifySettingsBody.isDropdownOpen::-webkit-scrollbar-thumb,
    .liquifySettingsBody.isDropdownOpen::-webkit-scrollbar-thumb:hover {
      background: transparent;
    }
    .liquifySearchIsland {
      margin: 0 34px 12px 34px;
      padding: 10px;
      border-radius: 16px;
      box-shadow: var(--liquify-shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 0 0 auto;
    }
    .liquifySearchInput {
      width: 100%;
      padding: 8px 12px;
      font-size: 13px;
      border: none;
      outline: none;
    }
    .liquifySearchInput::placeholder { color: rgba(255,255,255,0.45); }
    .liquifySectionNavWrap {
      position: relative;
      min-width: 0;
    }
    .liquifySectionNav {
      display: flex;
      gap: 8px;
      min-width: 0;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 10px 12px 13px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .liquifySectionNav::-webkit-scrollbar { width: 0; height: 0; display: none; }
    .liquifySectionNavScrollBtn {
      position: fixed;
      z-index: 1000002;
      width: 30px;
      height: 28px;
      padding: 0;
      border-radius: 12px;
      border: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      background: transparent;
      box-shadow: var(--liquify-shadow);
      line-height: 1;
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease, background-color 0.2s ease;
    }
    .liquifySectionNavScrollBtn svg {
      display: block;
      width: 14px;
      height: 14px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .liquifySectionNavScrollBtn:hover { transform: scale(1.08); background: var(--liquify-glow-accent); }
    .liquifySectionNavScrollBtn:active { transform: scale(0.95); }
    .liquifySectionNavBtn {
      flex: 0 0 auto;
      padding: 5px 12px;
      height: 28px;
      border-radius: 10px;
      border: 0;
      cursor: pointer;
      white-space: nowrap;
      font-size: 12px;
      color: white;
      background: transparent;
      box-shadow: var(--liquify-shadow);
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease, background-color 0.2s ease;
    }
    .liquifySectionNavBtn:hover { transform: scale(1.08); background: var(--liquify-glow-accent); }
    .liquifySectionNavBtn:active { transform: scale(0.95); }
    .liquifyRow {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 10px;
      width: 100%;
      margin: 10px 0;
      flex-wrap: wrap;
      box-shadow: var(--liquify-shadow);
      padding: 10px;
      border-radius: 17px;
    }
    .liquifyLabel { min-width: 140px; text-align: left; flex: 1 1 140px; overflow-wrap: break-word; }
    .liquifyRowControls {
      display: flex;
      gap: 10px;
      flex: 0 0 auto;
      margin-left: auto;
      justify-content: flex-end;
      flex-wrap: nowrap;
      min-width: 0;
      max-width: 100%;
    }
    .liquifyStackedControls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      min-width: 0;
      margin-left: auto;
      max-width: 100%;
    }
    .liquifyRowControls > * { flex: 0 0 auto; min-width: 0; }
    .liquifyControlSurface { background: transparent; border: none; border-radius: 12px; color: white; box-shadow: var(--liquify-shadow); }
    .liquifySelectBtn {
      appearance: none;
      padding: 6px 10px;
      cursor: pointer;
      min-width: 0;
      width: auto;
      max-width: 260px;
      text-align: left;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      white-space: nowrap;
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease;
    }
    .liquifySelectBtn:active { transform: scale(0.9); }
    .liquifySelectLabel { overflow: hidden; text-overflow: ellipsis; }
    .liquifySelectChevron { width: 14px; height: 14px; flex: 0 0 14px; position: relative; }
    .liquifySelectChevron::before {
      content: "";
      position: absolute;
      left: 4px;
      top: 3px;
      width: 6px;
      height: 6px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(45deg);
      transform-origin: 50% 50%;
      transition: transform 160ms ease;
      will-change: transform;
    }
    .liquifySelectBtn.isOpen .liquifySelectChevron::before { transform: rotate(-135deg); }
    .liquifySelectBtn:focus-visible { outline: 2px solid var(--liquify-accent, var(--accent-color, #1ed760)); outline-offset: 2px; }
    .liquifySelectMenu {
      position: fixed;
      z-index: 999999;
      background: transparent;
      border-radius: 15px;
      overflow: hidden;
      padding: 4px;
      box-sizing: border-box;
      box-shadow: var(--liquify-shadow);
      color: white;
      width: max-content;
    }
    .liquifySelectItem {
      padding: 8px 10px;
      margin: 2px;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
      color: white;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      transition: background-color 0.25s ease, box-shadow 0.28s ease, transform 0.25s ease;
    }
    .liquifySelectItem:hover {
      background: var(--liquify-glow-accent);
      box-shadow: var(--liquify-shadow);
      transform: scale(1.02);
    }
    .liquifySelectItem.isSelected {
      font-weight: 700;
      background: var(--liquify-glow-accent);
      box-shadow: var(--liquify-shadow);
    }

    @keyframes liquifySelectIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.9); }
    }
    @keyframes liquifySelectOut {
      to { opacity: 0; transform: translateY(-6px) scale(0.94); }
    }
    @keyframes liquifySelectItemIn {
      from { opacity: 0; translate: -6px 0; }
    }
    html.liquify-popup-bounce .liquifySelectMenu,
    html.liquify-popup-bounce .liquifyPopover,
    html.liquify-popup-bounce .liquifyLibrary {
      transform-origin: top right;
      animation: liquifySelectIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    html.liquify-popup-bounce .liquifyLibrary { transform-origin: center; }
    html.liquify-popup-bounce .liquifySelectMenu.isClosing,
    html.liquify-popup-bounce .liquifyPopover.isClosing,
    html.liquify-popup-bounce .liquifyLibrary.isClosing {
      animation: liquifySelectOut 0.18s cubic-bezier(0.5, 0, 0.75, 0) both;
      pointer-events: none;
    }
    html.liquify-popup-bounce .liquifySelectItem,
    html.liquify-popup-bounce .liquifyLibraryTile {
      animation: liquifySelectItemIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) backwards;
      animation-delay: calc(40ms + var(--i, 0) * 35ms);
    }

    .liquifyFontMenu {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      overflow: hidden;
    }
    .liquifyFontTop {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .liquifyFontSearch {
      flex: 1 1 auto;
      min-width: 0;
      padding: 7px 10px;
      font-size: 12px;
      outline: none;
    }
    .liquifyFontSearch::placeholder { color: rgba(255, 255, 255, 0.5); }
    .liquifyFontTop .liquifySelectBtn { flex: 0 0 auto; }
    .liquifyFontList {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: clip;
      position: relative;
      padding: 4px 10px;
    }
    .liquifyFontRunway { position: relative; }
    .liquifyFontItem {
      position: absolute;
      left: 0;
      right: 0;
      height: 48px;
      margin-bottom: 4px;
      box-sizing: border-box;
      padding: 6px 10px;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
      text-align: left;
      overflow: hidden;
      box-shadow: var(--liquify-shadow);
      transition: background-color 0.25s ease, transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1);
    }
    .liquifyFontItem:hover { transform: scale(1.02); }
    .liquifyFontItem.isSelected { background: var(--liquify-glow-accent); }
    .liquifyFontName,
    .liquifyFontPreview {
      font-family: var(--liquify-preview-font) !important;
    }
    .liquifyFontName { font-size: 13px; font-weight: 700; line-height: 1.3; }
    .liquifyFontPreview {
      font-size: 12px;
      opacity: 0.66;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .liquifyFontEmpty { padding: 10px; font-size: 12px; opacity: 0.6; text-align: center; }
    .liquifyFontSkeleton { pointer-events: none; opacity: 0.35; }

    .liquifyLibraryScrim {
      position: fixed;
      inset: 0;
      z-index: 1000003;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    html.liquify-library-open .liquifySectionNavScrollBtn { display: none; }
    .liquifyLibrary {
      --glass-filter: url(#glass-filter--r1-7);
      width: min(820px, calc(100vw - 60px));
      max-height: min(640px, calc(100vh - 80px));
      display: flex;
      flex-direction: column;
      border-radius: 17px;
      overflow: hidden;
      background: transparent;
      backdrop-filter: var(--glass-filter) blur(5px) brightness(0.8);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px) brightness(0.8);
      box-shadow: var(--liquify-shadow);
      color: white;
    }
    .liquifyLibraryHead {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
    }
    .liquifyLibraryTitle { font-size: 14px; font-weight: 700; flex: 1 1 auto; }
    .liquifyLibraryGrid {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: clip;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
      align-items: start;
      padding: 4px 12px 14px;
    }
    .liquifyLibraryTile {
      position: relative;
      height: 0;
      padding-top: 56.25%;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      box-shadow: var(--liquify-shadow);
      background: rgba(255, 255, 255, 0.05);
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1);
    }
    .liquifyLibraryTile.isHovered { transform: scale(1.02); }
    .liquifyLibraryTile img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .liquifyLibraryTile.isSelected::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: inset 0 0 0 3px var(--liquify-glow-accent), var(--liquify-shadow);
    }
    .liquifyLibraryDelete {
      position: fixed;
      z-index: 1000004;
      width: 28px;
      height: 28px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      color: white;
      background: transparent;
      backdrop-filter: blur(6px) brightness(1.35);
      -webkit-backdrop-filter: blur(6px) brightness(1.35);
      box-shadow: var(--liquify-shadow);
      transition: background-color 0.2s ease,
                  transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1);
      animation: liquifyLibraryDeleteIn 160ms cubic-bezier(0.34, 1.7, 0.64, 1) both;
    }
    @keyframes liquifyLibraryDeleteIn {
      from { opacity: 0; transform: scale(0.7); }
      to { opacity: 1; transform: scale(1); }
    }
    .liquifyLibraryDelete:hover { background: rgba(220, 60, 60, 0.45); }
    .liquifyLibraryDelete:active { transform: scale(0.86); }
    .liquifyLibraryDelete svg { width: 13px; height: 13px; }
    .liquifyLibraryEmpty {
      grid-column: 1 / -1;
      padding: 30px 10px;
      font-size: 12px;
      opacity: 0.6;
      text-align: center;
    }

    .liquifyPopover {
      --glass-filter: url(#glass-filter--r1-7);
      position: fixed;
      z-index: 1000000;
      border-radius: 17px;
      overflow: hidden;
      background: #00000057;
      backdrop-filter: var(--glass-filter) blur(5px);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px);
      box-shadow: var(--liquify-shadow);
      color: white;
      align-items: center;
      width: fit-content;
    }
    .liquifyColorPicker {
      padding: 10px 15px 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 230px;
      align-self: center;
    }
    .liquifyColorPreviewRow { display: flex; align-items: center; gap: 10px; }
    .liquifyColorPreviewRow { margin-left: 17px; }
    .liquifyColorPreview { width: 34px; height: 34px; border-radius: 10px; flex: 0 0 34px; box-shadow: var(--liquify-shadow); }
    .liquifyHexInput { width: 120px; padding: 6px 8px; text-transform: uppercase; }

    .react-colorful {
      width: 200px;
      height: 200px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      user-select: none;
      touch-action: none;
      align-self: center;
    }
    .react-colorful__saturation {
      position: relative;
      flex: 1 1 auto;
      border-bottom: 0 !important;
      border-radius: 15px !important;
      overflow: visible !important;
      cursor: crosshair;
    }
    .react-colorful__saturation::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      border-radius: inherit;
      box-shadow: var(--liquify-shadow);
      pointer-events: none;
    }
    .react-colorful__saturation .react-colorful__interactive { border-radius: 15px !important; }
    .react-colorful__saturation-white,
    .react-colorful__saturation-black { border-radius: 15px !important; }
    .react-colorful__saturation-white,
    .react-colorful__saturation-black {
      position: absolute;
      inset: 0;
    }
    .react-colorful__saturation-white {
      background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
    }
    .react-colorful__saturation-black {
      background: linear-gradient(to top, #000, rgba(0, 0, 0, 0));
    }
    .react-colorful__interactive {
      position: absolute;
      inset: 0;
      outline: none;
    }
    .react-colorful__pointer {
      position: absolute;
      z-index: 2;
      width: 14px;
      height: 14px;
      border-radius: 999px;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.0);
      box-shadow: 0 0 0 3px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.95);
    }
    .react-colorful__hue {
      position: relative;
      height: 12px;
      border-radius: 10px;
      overflow: hidden;
      background: linear-gradient(to right,
        #ff0000 0%,
        #ffff00 16%,
        #00ff00 33%,
        #00ffff 50%,
        #0000ff 66%,
        #ff00ff 83%,
        #ff0000 100%
      );
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.10);
    }
    .react-colorful__hue .react-colorful__interactive { border-radius: 10px; }

    .react-colorful__last-control {
      border-radius: 10px !important;
      overflow: visible !important;
      box-shadow: 0 0 12px 2px rgba(255,255,255,0.06), var(--liquify-shadow);
    }
    .react-colorful__last-control .react-colorful__interactive { border-radius: 10px !important; }
    .react-colorful__hue-pointer {
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: rgba(255,255,255,0.95);
      box-shadow: 0 0 0 3px rgba(0,0,0,0.35);
    }
    .liquifyInline { display: flex; align-items: center; gap: 6px; }
    .liquifyStepperBtn {
      width: 24px; height: 24px; border-radius: 9px; cursor: pointer;
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease, background-color 0.2s ease !important;
    }
    .liquifyStepperBtn:hover { background: var(--accent-color) !important; transform: scale(1.15); }
    .liquifyStepperBtn:active { transform: scale(1.15); filter: brightness(0.82); }
    .liquifyNumberInput { width: 74px; padding: 5px 6px; text-align: center; }
    .liquifySubBlock { margin-left: 0; display: flex; flex-direction: column; gap: 8px; }
    .liquifyActionBtn { padding: 6px 10px; cursor: pointer; transition: background-color 0.2s ease; }
    .liquifyActionBtn:hover { background: var(--liquify-glow-accent) !important; }
    .liquifyConfigBlock { display: flex; flex-direction: column; gap: 10px; }
    .liquifyConfigHint { font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.7); }
    .liquifyConfigTextarea {
      width: 100%;
      box-sizing: border-box;
      min-height: 220px;
      resize: vertical;
      padding: 12px 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #fff;
      background: transparent;
      border: none;
      outline: none;
      border-radius: 14px;
      white-space: pre-wrap;
      word-break: break-word;
      overflow: auto;
    }
    .liquifyConfigTextarea::-webkit-scrollbar { width: 10px; }
    .liquifyConfigTextarea::-webkit-scrollbar-thumb { background: rgba(205,205,205,0.6); border-radius: 999px; }
    .liquifyConfigActions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    .liquifyConfigApplyBtn:hover { background: var(--liquify-glow-accent) !important; }
    .liquifyConfigStatus { font-size: 12px; line-height: 1.45; }
    .liquifyConfigStatus.isOk { color: #5ad17f; }
    .liquifyConfigStatus.isError { color: #ff8a8a; }
    .liquifyHelpIcon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 15px;
      height: 15px;
      margin-left: 6px;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      color: rgba(255,255,255,0.72);
      box-shadow: var(--liquify-shadow);
      cursor: help;
      user-select: none;
      flex: 0 0 auto;
      vertical-align: middle;
      transition: color 0.15s ease, transform 0.15s ease;
    }
    .liquifyHelpIcon:hover { color: #fff; transform: scale(1.12); }
    .liquifyResetBtn {
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease, background-color 0.2s ease;
    }
    .liquifyResetBtn:hover {
      transform: scale(1.08);
      background: var(--liquify-glow-accent) !important;
    }
    .liquifyResetBtn:active { transform: scale(0.95); }
    .liquifyTextInput { width: 100%; padding: 6px 10px; border: none; border-radius: 12px; font-size: 13px; color: #fff; background: transparent; outline: none; }
    .liquifyTextInput::placeholder { color: rgba(255,255,255,0.4); }
    .liquifyIndentedBtn { margin-left: 31px; }
    .liquifyColorSwatch { width: 20px; height: 20px; border-radius: 6px; box-shadow: var(--liquify-shadow); }
    .liquifyToggle {
      --f: 0;
      --checked: var(--liquify-accent, var(--accent-color, #1ed760));
      --track: color-mix(in srgb, rgba(120, 120, 128, 0.36), var(--checked) calc(var(--f) * 100%));
      position: relative;
      flex: 0 0 auto;
      width: 64px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: transparent;
      cursor: pointer;
      touch-action: none;
      user-select: none;
    }
    .liquifyToggle * { pointer-events: none; }
    .liquifyToggle:focus-visible {
      outline: 2px solid var(--checked);
      outline-offset: 3px;
    }
    .liquifyToggleTrack {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--track);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 0 4px rgba(0, 0, 0, 0.15);
    }
    .liquifyToggleKnob {
      position: absolute;
      left: 0;
      top: 2px;
      width: 40px;
      height: 24px;
      border-radius: 999px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.15);
    }
    .liquifyToggleKnob > span {
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }
    .liquifyToggleLens { overflow: hidden; }
    .liquifyToggleLens > span {
      position: absolute;
      width: 64px;
      height: 28px;
      border-radius: 999px;
      background: var(--track);
      filter: blur(5px);
    }
    .liquifyToggleSurface { background: #fff; }
    .liquifyToggleRim {
      opacity: 0;
      background: rgba(255, 255, 255, 0.1);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.8),
        inset 0 -1px 0 rgba(255, 255, 255, 0.2),
        inset 0 0 0 1px rgba(255, 255, 255, 0.16),
        inset 0 0 6px rgba(0, 0, 0, 0.2);
    }

    .liquifySection {
      margin: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .liquifySectionTitle {
      margin: 0;
      padding: 10px 12px;
      text-align: center;
      font-weight: 700;
      border-radius: 14px;
      background: transparent;
      box-shadow: var(--liquify-shadow);
    }
    .liquifySectionBody {
      padding: 10px;
      border-radius: 14px;
      background: transparent;
      box-shadow: var(--liquify-shadow);
    }
    .liquifySectionBody .liquifyRow { margin: 8px 0; }
    .liquifySubSection {
      margin: 8px 0;
      padding: 10px;
      border-radius: 15px;
      box-shadow: var(--liquify-shadow);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .liquifySubSection .liquifyRow { margin: 0; }
    .liquifySubSectionTitle {
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      text-transform: none;
      letter-spacing: 0;
      color: white;
      opacity: 1;
      text-align: left;
      margin: 0 0 2px 4px;
    }
    .liquifyTooltipPopup {
      --glass-filter: url(#glass-filter--r1-7);
      position: fixed;
      z-index: 1000001;
      padding: 7px 11px;
      border-radius: 10px;
      background: transparent;
      backdrop-filter: var(--glass-filter) blur(5px);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px);
      color: white;
      font-size: 13px;
      line-height: 1.4;
      pointer-events: none;
      white-space: normal;
      word-break: break-word;
      width: max-content;
      max-width: 260px;
      text-align: center;
      transform: translateX(-50%) translateY(-3px);
      opacity: 0;
      transition: opacity 160ms ease, transform 160ms ease;
      box-shadow: var(--liquify-shadow);
    }
    .liquifyTooltipPopup.isVisible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .liquifySettingsPanel {
      opacity: 0;
      transform: scale(0.86);
      transform-origin: top center;
      will-change: transform, opacity;
    }
    #liquify-settings-react-overlay.overlay-visible .liquifySettingsPanel {
      opacity: 1;
      transform: translateY(0) scale(1);
      transition: transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1),
                  opacity 360ms ease-out;
    }
    #liquify-settings-react-overlay.overlay-closing .liquifySettingsPanel {
      opacity: 0;
      transform: translateY(8px) scale(0.95);
      transition: transform 260ms cubic-bezier(0.8, 0, 0.2, 1),
                  opacity 220ms ease-in;
    }
  `;
  document.head.appendChild(style);
}

const MENU_EXIT_MS = 180;

function useMenuExit(open: boolean, setOpen: (v: boolean) => void) {
  const [closing, setClosing] = React.useState(false);
  const timer = React.useRef(0 as any);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const requestClose = React.useCallback(() => {
    if (!open || closing) return;
    if (!isPopupBounceOn()) {
      setOpen(false);
      return;
    }
    setClosing(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setClosing(false);
      setOpen(false);
    }, MENU_EXIT_MS);
  }, [open, closing, setOpen]);

  React.useEffect(() => {
    if (open) return;
    window.clearTimeout(timer.current);
    setClosing(false);
  }, [open]);

  return { closing, requestClose };
}

function useDropdownScrollLock(open: boolean, btnRef: any) {
  const useLayout = (React as any).useLayoutEffect || React.useEffect;
  useLayout(() => {
    if (!open) return;
    const body = btnRef.current?.closest?.(".liquifySettingsPanel")?.querySelector?.(".liquifySettingsBody") as HTMLElement | null;
    if (!body) return;
    const block = (e: Event) => e.preventDefault();
    body.classList.add("isDropdownOpen");
    body.addEventListener("wheel", block, { passive: false });
    body.addEventListener("touchmove", block, { passive: false });
    return () => {
      body.classList.remove("isDropdownOpen");
      body.removeEventListener("wheel", block);
      body.removeEventListener("touchmove", block);
    };
  }, [open]);
}

function useOutsideClick(open: boolean, onClose: () => void, refs: Array<any>) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (ev: MouseEvent) => {
      for (const r of refs) {
        const node = r?.current;
        if (node && node.contains(ev.target as Node)) return;
      }
      onClose();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open, onClose]);
}

function normalizeHexColor(input: string) {
  const raw = (input || "").trim();
  const m = /^#?([0-9a-fA-F]{6})$/.exec(raw);
  if (!m) return null;
  return ("#" + m[1]).toUpperCase();
}

function hexToRgb(hex: string) {
  const n = normalizeHexColor(hex);
  const v = n ? n.slice(1) : "000000";
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16)
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const to2 = (x: number) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, "0");
  return ("#" + to2(r) + to2(g) + to2(b)).toUpperCase();
}

export function ColorPicker(props: { value: string; onChange: (hex: string) => void }) {
  const btnRef = React.useRef(null as any);
  const popRef = React.useRef(null as any);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null as any);

  const normalized = normalizeHexColor(props.value) || "#1DB954";
  const [hex, setHex] = React.useState(normalized);

  React.useEffect(() => {
    const next = normalizeHexColor(props.value);
    if (!next || next === hex) return;
    setHex(next);
  }, [props.value]);

  const { closing, requestClose } = useMenuExit(open, setOpen);

  useOutsideClick(open, requestClose, [btnRef, popRef]);

  const useLayout = (React as any).useLayoutEffect || React.useEffect;

  useLayout(() => {
    if (!open) return;

    const recalc = () => {
      const btn = btnRef.current as HTMLElement | null;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const margin = 6;

      const panel = btn.closest?.(".liquifySettingsPanel") as HTMLElement | null;
      const body = (panel?.querySelector?.(".liquifySettingsBody") as HTMLElement | null) ?? null;
      const bounds = body?.getBoundingClientRect
        ? body.getBoundingClientRect()
        : panel
          ? panel.getBoundingClientRect()
          : ({ left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight } as any);

      const controls = (btn.closest?.(".liquifyRowControls") as HTMLElement | null) ?? null;
      const anchorRect = controls ? controls.getBoundingClientRect() : r;

      const inView = anchorRect.bottom > bounds.top + 4 && anchorRect.top < bounds.bottom - 4;
      if (!inView) {
        setPos(null);
        setOpen(false);
        return;
      }

      const minWidth = 230;
      const wantedWidth = Math.max(minWidth, Math.round(anchorRect.width));
      const maxPossible = Math.max(0, bounds.right - bounds.left - 16);
      const width = Math.min(wantedWidth, maxPossible);

      const top = r.bottom + margin;
      let left = anchorRect.right - width;

      const minLeft = bounds.left + 8;
      const maxLeft = bounds.right - width - 8;
      left = Math.min(Math.max(left, minLeft), maxLeft);

      const belowSpace = bounds.bottom - top - 8;
      const maxHeight = Math.max(160, Math.min(290, belowSpace));
      setPos({ left, top, minWidth: width, maxHeight });
    };

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const commitHex = (raw: string) => {
    const next = normalizeHexColor(raw);
    if (!next) return;
    setHex(next);
    props.onChange(next);
  };

  const popover =
    open && pos ? (
      <div
        ref={popRef}
        className={`liquifyPopover${closing ? " isClosing" : ""}`}
        style={{
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          minWidth: `${pos.minWidth}px`,
          maxHeight: `${pos.maxHeight}px`,
          overflowY: "auto"
        }}
      >
        <div className="liquifyColorPicker">
          <div className="liquifyColorPreviewRow">
            <div className="liquifyColorPreview" style={{ background: hex }} />
            <input
              className="liquifyControlSurface liquifyHexInput"
              value={hex}
              onChange={(e: any) => setHex((e.target as HTMLInputElement).value.toUpperCase())}
              onBlur={() => commitHex(hex)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              inputMode="text"
              spellCheck={false}
            />
          </div>

          <HexColorPicker
            color={hex}
            onChange={(c: string) => {
              const next = normalizeHexColor(c) || hex;
              setHex(next);
              props.onChange(next);
            }}
          />
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="liquifyControlSurface liquifyActionBtn"
        onClick={() => {
          if (open) {
            requestClose();
            return;
          }
          setPos(null);
          setOpen(true);
        }}
      >
        <span className="liquifyInline">
          <span className="liquifyColorSwatch" style={{ background: normalized }} />
          {normalized}
        </span>
      </button>
      {popover && (ReactDOM?.createPortal ? ReactDOM.createPortal(popover, document.body) : popover)}
    </>
  );
}

export interface FontPickerLabels {
  search: string;
  all: string;
  empty: string;
  spotifyDefault: string;
  categories: Record<string, string>;
}

export function FontPicker(props: { value: string; onChange: (value: string) => void; labels: FontPickerLabels }) {
  const btnRef = React.useRef(null as any);
  const menuRef = React.useRef(null as any);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null as any);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [ready, setReady] = React.useState(false);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(240);
  const listRef = React.useRef(null as any);
  const catalogue = FONTS;
  const useLayout = (React as any).useLayoutEffect || React.useEffect;

  const nestedMenus = {
    current: {
      contains: (node: Node) =>
        Array.from(document.querySelectorAll(".liquifySelectMenu")).some(
          (m) => m !== menuRef.current && m.contains(node),
        ),
    },
  };

  const { closing, requestClose } = useMenuExit(open, setOpen);

  useOutsideClick(open, requestClose, [btnRef, menuRef, nestedMenus]);

  React.useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      setReady(true);
      const el = listRef.current;
      if (!el) return;
      const height = el.clientHeight;
      setViewportHeight(height);

      const index = rows.findIndex((f: any) => f.family === props.value);
      const top = index > 0 ? Math.max(0, index * ROW_HEIGHT - height / 2 + ROW_HEIGHT / 2) : 0;
      el.scrollTop = top;
      setScrollTop(top);
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useDropdownScrollLock(open, btnRef);

  useLayout(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const recalc = () => {
      const btn = btnRef.current as HTMLElement | null;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const panel = btn.closest?.(".liquifySettingsPanel") as HTMLElement | null;
      const body = (panel?.querySelector?.(".liquifySettingsBody") as HTMLElement | null) ?? null;
      const bounds = body?.getBoundingClientRect
        ? body.getBoundingClientRect()
        : ({ left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight } as any);

      const inView = r.bottom > bounds.top + 4 && r.top < bounds.bottom - 4;
      if (!inView) {
        setPos(null);
        setOpen(false);
        return;
      }

      const width = Math.min(300, Math.max(0, bounds.right - bounds.left - 16));
      const top = r.bottom + 6;
      let left = r.right - width;
      left = Math.min(Math.max(left, bounds.left + 8), bounds.right - width - 8);
      const maxHeight = Math.max(180, Math.min(320, bounds.bottom - top - 8));
      setPos({ left, top, width, maxHeight });
    };

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [open]);

  const needle = query.trim().toLowerCase();
  const shown = catalogue.filter(
    (f: any) => (category === "all" || f.category === category) && (!needle || f.family.toLowerCase().includes(needle)),
  );
  const rows = [{ family: FONT_DEFAULT, category: "" } as any, ...shown];
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);
  const windowRows = rows.slice(first, last);

  React.useEffect(() => {
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [query, category]);

  React.useEffect(() => {
    if (open && ready) loadFontPreviews(windowRows.map((f: any) => f.family));
  }, [open, ready, first, last, query, category]);

  const onListScroll = (e: any) => {
    const el = e.currentTarget as HTMLElement;
    setScrollTop(el.scrollTop);
    if (el.clientHeight !== viewportHeight) setViewportHeight(el.clientHeight);
  };

  const pick = (family: string) => {
    requestClose();
    props.onChange(family);
  };

  const menu =
    open && pos ? (
      <div
        ref={menuRef}
        className={`liquifySelectMenu liquifyFontMenu${closing ? " isClosing" : ""}`}
        style={{ left: `${pos.left}px`, top: `${pos.top}px`, width: `${pos.width}px`, maxHeight: `${pos.maxHeight}px` }}
      >
        <div className="liquifyFontTop">
          <input
            type="text"
            className="liquifyControlSurface liquifyFontSearch"
            placeholder={props.labels.search}
            value={query}
            autoFocus
            onChange={(e: any) => setQuery(e.target.value)}
          />
          <Select
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: props.labels.all },
              ...FONT_CATEGORIES.map((c) => ({
                value: c,
                label: props.labels.categories[c] || c,
              })),
            ]}
          />
        </div>
        <div className="liquifyFontList" ref={listRef} onScroll={onListScroll}>
          {!ready &&
            Array.from({ length: 6 }).map((_, i) => (
              <div className="liquifyFontItem liquifyFontSkeleton" style={{ top: i * ROW_HEIGHT }} key={`skeleton-${i}`}>
                <div className="liquifyFontName">&nbsp;</div>
                <div className="liquifyFontPreview">&nbsp;</div>
              </div>
            ))}
          {ready && (
            <div className="liquifyFontRunway" style={{ height: `${rows.length * ROW_HEIGHT}px` }}>
              {windowRows.map((f: any, i: number) => {
                const isDefault = f.family === FONT_DEFAULT;
                return (
                  <div
                    key={f.family}
                    className={`liquifyFontItem${props.value === f.family ? " isSelected" : ""}`}
                    style={{
                      top: `${(first + i) * ROW_HEIGHT}px`,
                      ["--liquify-preview-font" as any]: isDefault ? SPOTIFY_STACK : `"${f.family}"`,
                    }}
                    onClick={() => pick(f.family)}
                  >
                    <div className="liquifyFontName">
                      {isDefault ? props.labels.spotifyDefault : f.family}
                    </div>
                    <div className="liquifyFontPreview">The quick brown fox</div>
                  </div>
                );
              })}
            </div>
          )}
          {ready && shown.length === 0 && <div className="liquifyFontEmpty">{props.labels.empty}</div>}
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`liquifyControlSurface liquifySelectBtn${open && !closing ? " isOpen" : ""}`}
        onClick={() => {
          if (open) {
            requestClose();
            return;
          }
          setPos(null);
          setOpen(true);
        }}
      >
        <span className="liquifySelectLabel">
          {props.value === FONT_DEFAULT ? props.labels.spotifyDefault : props.value}
        </span>
        <span className="liquifySelectChevron" aria-hidden="true" />
      </button>
      {menu && (ReactDOM?.createPortal ? ReactDOM.createPortal(menu, document.body) : menu)}
    </>
  );
}

export function BackgroundLibrary(props: {
  open: boolean;
  onClose: () => void;
  labels: { title: string; add: string; empty: string; remove: string; close: string };
  target?: LibraryTarget;
}) {
  const target: LibraryTarget = props.target ?? "background";
  const selectedKey = librarySelectedKey(target);
  const [items, setItems] = React.useState([] as LibraryImage[]);
  const [selected, setSelected] = React.useState(() => localStorage.getItem(selectedKey) || "");
  const fileRef = React.useRef(null as any);
  const cardRef = React.useRef(null as any);
  const gridRef = React.useRef(null as any);
  const [hover, setHover] = React.useState(null as any);
  const hoverRef = React.useRef("" as string);
  hoverRef.current = hover?.id || "";
  const { closing, requestClose } = useMenuExit(props.open, (v) => {
    if (!v) props.onClose();
  });

  const reload = React.useCallback(() => {
    void listImages().then(setItems);
  }, []);

  React.useEffect(() => {
    if (!props.open) return;
    reload();
    setSelected(localStorage.getItem(selectedKey) || "");
  }, [props.open, reload, selectedKey]);

  const urls: string[] = React.useMemo(
    () => (items as LibraryImage[]).map((item: LibraryImage) => URL.createObjectURL(item.blob)),
    [items],
  );
  React.useEffect(
    () => () => {
      for (const url of urls) URL.revokeObjectURL(url);
    },
    [urls],
  );

  React.useEffect(() => {
    if (!props.open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [props.open, requestClose]);

  React.useEffect(() => {
    if (!props.open) return;
    let frame = 0;
    const onMove = (ev: MouseEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const grid = gridRef.current as HTMLElement | null;
        if (!grid) return;
        const inside = (r: DOMRect) =>
          ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
        if (!inside(grid.getBoundingClientRect())) {
          setHover(null);
          return;
        }
        const tiles = Array.from(grid.querySelectorAll(".liquifyLibraryTile")) as HTMLElement[];
        const current = tiles.filter((el) => el.dataset.id === hoverRef.current);
        for (const el of [...current, ...tiles]) {
          const r = el.getBoundingClientRect();
          if (!inside(r)) continue;
          setHover({ id: el.dataset.id, top: r.top, right: r.right });
          return;
        }
        setHover(null);
      });
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [props.open]);

  React.useEffect(() => {
    if (props.open) return;
    setHover(null);
  }, [props.open]);

  React.useEffect(() => {
    const on = props.open || closing;
    document.documentElement.classList.toggle("liquify-library-open", on);
    return () => document.documentElement.classList.remove("liquify-library-open");
  }, [props.open, closing]);

  if (!props.open && !closing) return null;

  const choose = (id: string) => {
    setSelected(id);
    selectImage(id, target);
  };

  const modal = (
    <div
      className="liquifyLibraryScrim"
      onMouseDown={(e: any) => {
        if (!cardRef.current?.contains(e.target as Node)) requestClose();
      }}
    >
      <div className={`liquifyLibrary${closing ? " isClosing" : ""}`} ref={cardRef}>
        <div className="liquifyLibraryHead">
          <div className="liquifyLibraryTitle">{props.labels.title}</div>
          <button
            type="button"
            className="liquifyControlSurface liquifyActionBtn"
            onClick={() => fileRef.current?.click()}
          >
            {props.labels.add}
          </button>
          <button
            type="button"
            className="liquifyControlSurface liquifyHeaderActionBtn liquifyCloseBtn"
            aria-label={props.labels.close}
            onClick={requestClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5 19 19" />
              <path d="M19 5 5 19" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={async (e: any) => {
              const input = e.target as HTMLInputElement;
              const files = Array.from(input.files || []);
              if (!files.length) return;
              await addImages(files);
              input.value = "";
              const next = await listImages();
              setItems(next);
              if (!localStorage.getItem(selectedKey) && next[0]) choose(next[0].id);
            }}
          />
        </div>
        <div className="liquifyLibraryGrid" ref={gridRef} onScroll={() => setHover(null)}>
          {items.length === 0 && <div className="liquifyLibraryEmpty">{props.labels.empty}</div>}
          {(items as LibraryImage[]).map((item: LibraryImage, i: number) => (
            <div
              key={item.id}
              data-id={item.id}
              className={
                "liquifyLibraryTile" +
                (item.id === selected ? " isSelected" : "") +
                (item.id === hover?.id ? " isHovered" : "")
              }
              title={item.name}
              style={{ "--i": Math.min(i, 12) } as any}
              onClick={() => choose(item.id)}
            >
              <img src={urls[i]} alt={item.name} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const removeButton = hover && (
    <button
      type="button"
      className="liquifyLibraryDelete"
      aria-label={props.labels.remove}
      style={{ top: `${hover.top + 7}px`, left: `${hover.right - 35}px` }}
      onClick={async (e: any) => {
        e.stopPropagation();
        const id = hover.id;
        setHover(null);
        await deleteImage(id);
        if (id === selected) setSelected(localStorage.getItem(selectedKey) || "");
        reload();
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M5 5 19 19" />
        <path d="M19 5 5 19" />
      </svg>
    </button>
  );

  const tree = (
    <>
      {modal}
      {removeButton}
    </>
  );

  return ReactDOM?.createPortal ? ReactDOM.createPortal(tree, document.body) : tree;
}

export function Select(props: { value: string; options: Option[]; onChange: (value: string) => void }) {
  const btnRef = React.useRef(null as any);
  const menuRef = React.useRef(null as any);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null as any);
  const useLayout = (React as any).useLayoutEffect || React.useEffect;

  const { closing, requestClose } = useMenuExit(open, setOpen);

  useOutsideClick(open, requestClose, [btnRef, menuRef]);
  useDropdownScrollLock(open, btnRef);

  const current = props.options.find((o) => o.value === props.value) ?? props.options[0];

  useLayout(() => {
    if (!open) return;

    const measureMenuWidth = (btn: HTMLElement) => {
      const probe = document.createElement("span");
      const cs = getComputedStyle(btn);
      probe.style.position = "fixed";
      probe.style.left = "-9999px";
      probe.style.top = "-9999px";
      probe.style.visibility = "hidden";
      probe.style.whiteSpace = "nowrap";
      probe.style.boxSizing = "border-box";
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontSize = cs.fontSize;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.letterSpacing = cs.letterSpacing;
      probe.style.padding = "8px 10px";
      document.body.appendChild(probe);

      let max = 0;
      for (const o of props.options) {
        probe.textContent = o.label;
        max = Math.max(max, probe.getBoundingClientRect().width);
      }
      probe.remove();

      return Math.ceil(max + 28);
    };

    const recalc = () => {
      const btn = btnRef.current as HTMLElement | null;
      if (!btn) return;

      const r = btn.getBoundingClientRect();
      const margin = 6;

      const panel = btn.closest?.(".liquifySettingsPanel") as HTMLElement | null;
      const body = (panel?.querySelector?.(".liquifySettingsBody") as HTMLElement | null) ?? null;
      const bounds = body?.getBoundingClientRect
        ? body.getBoundingClientRect()
        : panel
          ? panel.getBoundingClientRect()
          : ({ left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight } as any);

      const wantedWidth = measureMenuWidth(btn);
      const maxPossible = Math.max(0, bounds.right - bounds.left - 16);
      const width = Math.min(wantedWidth, maxPossible);

      const top = r.bottom + margin;

      const inView = r.bottom > bounds.top + 4 && r.top < bounds.bottom - 4;
      if (!inView) {
        setPos(null);
        setOpen(false);
        return;
      }

      let left = r.right - width;

      const minLeft = bounds.left + 8;
      const maxLeft = bounds.right - width - 8;
      left = Math.min(Math.max(left, minLeft), maxLeft);

      const belowSpace = bounds.bottom - top - 8;
      const maxHeight = Math.max(120, Math.min(240, belowSpace));
      setPos({ left, top, width, maxHeight });
    };

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [open]);

  const menu =
    open && pos ? (
      <div
        ref={menuRef}
        className={`liquifySelectMenu${closing ? " isClosing" : ""}`}
        style={{
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          width: `${pos.width}px`,
          maxHeight: `${pos.maxHeight}px`,
          overflowY: "auto",
          transform: undefined
        }}
      >
        {props.options.map((o, i) => (
          <div
            key={o.value}
            className={`liquifySelectItem${o.value === props.value ? " isSelected" : ""}`}
            style={{ "--i": Math.min(i, 12) } as any}
            onClick={() => {
              requestClose();
              props.onChange(o.value);
            }}
          >
            {o.label}
          </div>
        ))}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`liquifyControlSurface liquifySelectBtn${open && !closing ? " isOpen" : ""}`}
        onClick={() => {
          if (open) {
            requestClose();
            return;
          }
          setPos(null);
          setOpen(true);
        }}
      >
        <span className="liquifySelectLabel">{current?.label ?? props.value}</span>
        <span className="liquifySelectChevron" aria-hidden="true" />
      </button>
      {menu && (ReactDOM?.createPortal ? ReactDOM.createPortal(menu, document.body) : menu)}
    </>
  );
}

class Spring {
  value = 0;
  velocity = 0;
  target = 0;
  constructor(private dampingRatio: number, private stiffness: number) {}

  get settled() {
    return Math.abs(this.value - this.target) < 0.0005 && Math.abs(this.velocity) < 0.005;
  }

  snap(value: number) {
    this.value = this.target = value;
    this.velocity = 0;
  }

  step(dt: number) {
    const damping = 2 * this.dampingRatio * Math.sqrt(this.stiffness);
    const h = dt / 4;
    for (let i = 0; i < 4; i++) {
      const acceleration = -this.stiffness * (this.value - this.target) - damping * this.velocity;
      this.velocity += acceleration * h;
      this.value += this.velocity * h;
    }
  }
}

const TOGGLE_INSET = 2;
const TOGGLE_SIZE = { width: 64, height: 28 };
const TOGGLE_KNOB_WIDTH = 40;

// Whole device pixels, so the knob stays centred at fractional display scaling.
function toggleGeometry() {
  const dpr = window.devicePixelRatio || 1;
  const inset = Math.max(1, Math.round(TOGGLE_INSET * dpr)) / dpr;
  return {
    inset,
    height: TOGGLE_SIZE.height - 2 * inset,
    travel: TOGGLE_SIZE.width - 2 * inset - TOGGLE_KNOB_WIDTH,
  };
}
const TOGGLE_PRESSED_SCALE = 1.5;
const TOGGLE_DRAG_THRESHOLD = 3;

export function Toggle(props: { checked: boolean; onChange: (checked: boolean) => void }) {
  const btnRef = React.useRef(null as any);
  const knobRef = React.useRef(null as any);
  const lensRef = React.useRef(null as any);
  const surfaceRef = React.useRef(null as any);
  const rimRef = React.useRef(null as any);
  const propsRef = React.useRef(props);
  propsRef.current = props;

  const stateRef = React.useRef(null as any);
  if (!stateRef.current) {
    const s = {
      value: new Spring(1, 1000),
      velocity: new Spring(0.5, 300),
      press: new Spring(1, 1000),
      scaleX: new Spring(0.6, 250),
      scaleY: new Spring(0.7, 250),
      frame: 0,
      lastFrame: 0,
      releasePending: false,
      dragging: false,
      dragged: false,
      dragFraction: 0,
      startX: 0,
      lastX: 0,
      pending: null as boolean | null,
    };
    s.value.snap(props.checked ? 1 : 0);
    s.scaleX.snap(1);
    s.scaleY.snap(1);
    stateRef.current = s;
  }
  const s = stateRef.current;

  const paint = () => {
    const btn = btnRef.current as HTMLElement | null;
    const knob = knobRef.current as HTMLElement | null;
    const lens = lensRef.current as HTMLElement | null;
    if (!btn || !knob || !lens || !surfaceRef.current || !rimRef.current) return;

    const fraction = clamp(s.value.value, 0, 1);
    const press = clamp(s.press.value, 0, 1);
    const speed = Math.abs(s.velocity.value) / 50;
    const scaleX = s.scaleX.value / (1 - clamp(speed * 0.75, 0, 0.2));
    const scaleY = s.scaleY.value * (1 - clamp(speed * 0.25, 0, 0.2));
    const g = toggleGeometry();
    const x = g.inset + fraction * g.travel;

    btn.style.setProperty("--f", String(fraction));
    knob.style.top = `${g.inset}px`;
    knob.style.height = `${g.height}px`;
    knob.style.transform = `translateX(${x}px) scale(${scaleX}, ${scaleY})`;
    lens.style.left = `${-x}px`;
    lens.style.top = `${-g.inset}px`;
    lens.style.transformOrigin = `${x + TOGGLE_KNOB_WIDTH / 2}px ${g.inset + g.height / 2}px`;
    lens.style.transform = `scale(${1 - 0.25 * press})`;
    surfaceRef.current.style.opacity = String(1 - press);
    rimRef.current.style.opacity = String(press);
  };

  const onFrame = (time: number) => {
    const dt = s.lastFrame ? clamp((time - s.lastFrame) / 1000, 0, 0.05) : 1 / 60;
    s.lastFrame = time;

    s.value.step(dt);
    s.velocity.target = s.value.velocity;
    s.velocity.step(dt);
    s.press.step(dt);
    s.scaleX.step(dt);
    s.scaleY.step(dt);

    if (s.releasePending && !s.dragging && Math.abs(s.value.value - s.value.target) < 0.025) {
      s.releasePending = false;
      s.press.target = 0;
      s.scaleX.target = 1;
      s.scaleY.target = 1;
    }

    paint();

    if (s.pending !== null && !s.dragging && !s.releasePending &&
        Math.abs(s.value.value - s.value.target) < 0.005 && s.press.value < 0.01 &&
        Math.abs(s.scaleX.value - 1) < 0.01 && Math.abs(s.scaleY.value - 1) < 0.01) {
      commit();
    }

    const settled = s.value.settled && s.velocity.settled && s.press.settled &&
      s.scaleX.settled && s.scaleY.settled && !s.releasePending;
    s.frame = settled || !btnRef.current ? 0 : requestAnimationFrame(onFrame);
    if (!s.frame) {
      rest();
      commit();
    }
  };

  const rest = () => {
    for (const spring of [s.value, s.velocity, s.press, s.scaleX, s.scaleY]) spring.snap(spring.target);
    paint();
    if (knobRef.current) knobRef.current.style.willChange = "";
  };

  const commit = () => {
    const next = s.pending;
    s.pending = null;
    if (next === null || next === propsRef.current.checked) return;
    propsRef.current.onChange(next);
  };

  const startAnimating = () => {
    if (s.frame) return;
    if (knobRef.current) knobRef.current.style.willChange = "transform";
    s.lastFrame = 0;
    s.frame = requestAnimationFrame(onFrame);
  };

  const press = () => {
    s.releasePending = false;
    s.press.target = 1;
    s.scaleX.target = TOGGLE_PRESSED_SCALE;
    s.scaleY.target = TOGGLE_PRESSED_SCALE;
    startAnimating();
  };

  const release = () => {
    s.releasePending = true;
    startAnimating();
  };

  const animateTo = (checked: boolean) => {
    press();
    s.value.target = checked ? 1 : 0;
    release();
  };

  const useLayout = (React as any).useLayoutEffect || React.useEffect;
  useLayout(() => {
    paint();
    return () => {
      cancelAnimationFrame(s.frame);
      s.frame = 0;
      commit();
    };
  }, []);

  React.useEffect(() => {
    if (s.pending !== null || (s.value.target >= 0.5) === props.checked) return;
    animateTo(props.checked);
  }, [props.checked]);

  const onPointerDown = (e: any) => {
    if (e.button !== 0) return;
    try { btnRef.current?.setPointerCapture?.(e.pointerId); } catch {}
    s.dragging = true;
    s.dragged = false;
    s.dragFraction = s.value.target;
    s.startX = s.lastX = e.clientX;
    press();
  };

  const onPointerMove = (e: any) => {
    if (!s.dragging) return;
    if (!s.dragged && Math.abs(e.clientX - s.startX) < TOGGLE_DRAG_THRESHOLD) return;
    const dx = e.clientX - s.lastX;
    s.lastX = e.clientX;
    if (!dx) return;
    s.dragged = true;
    s.dragFraction = clamp(s.dragFraction + dx / toggleGeometry().travel, 0, 1);
    s.value.target = s.dragFraction;
    startAnimating();
  };

  const endDrag = () => {
    if (!s.dragging) return;
    s.dragging = false;
    const current = s.pending ?? propsRef.current.checked;
    const next = s.dragged ? s.value.target >= 0.5 : !current;
    s.value.target = next ? 1 : 0;
    s.pending = next;
    release();
  };

  const onPointerUp = (e: any) => {
    endDrag();
    try { btnRef.current?.releasePointerCapture?.(e.pointerId); } catch {}
  };

  const onClick = (e: any) => {
    if (e.detail !== 0) return;
    const next = !(s.pending ?? props.checked);
    s.pending = next;
    animateTo(next);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      role="switch"
      aria-checked={props.checked ? "true" : "false"}
      className="liquifyToggle"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onClick={onClick}
    >
      <span className="liquifyToggleTrack" aria-hidden="true" />
      <span ref={knobRef} className="liquifyToggleKnob" aria-hidden="true">
        <span className="liquifyToggleLens">
          <span ref={lensRef} />
        </span>
        <span ref={surfaceRef} className="liquifyToggleSurface" />
        <span ref={rimRef} className="liquifyToggleRim" />
      </span>
    </button>
  );
}

export function Stepper(props: { value: number; min: number; max: number; onChange: (value: number) => void }) {
  const [text, setText] = React.useState(String(props.value));

  React.useEffect(() => {
    setText(String(props.value));
  }, [props.value]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setText(String(props.value));
      return;
    }
    props.onChange(clamp(parsed, props.min, props.max));
  };

  return (
    <div className="liquifyInline">
      <button
        type="button"
        className="liquifyControlSurface liquifyStepperBtn"
        onClick={() => props.onChange(clamp(props.value - 1, props.min, props.max))}
      >
        -
      </button>
      <input
        className="liquifyControlSurface liquifyNumberInput"
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e: any) => setText(e.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(e: any) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      <button
        type="button"
        className="liquifyControlSurface liquifyStepperBtn"
        onClick={() => props.onChange(clamp(props.value + 1, props.min, props.max))}
      >
        +
      </button>
    </div>
  );
}

let lastScrollAt = 0;
let watchingScroll = false;
const SCROLL_SETTLE_MS = 150;

function watchScroll() {
  if (watchingScroll) return;
  watchingScroll = true;
  const mark = () => { lastScrollAt = Date.now(); };
  window.addEventListener("wheel", mark, { capture: true, passive: true });
  window.addEventListener("scroll", mark, { capture: true, passive: true });
}

export function ButtonTooltip(props: { text: string; children?: any }) {
  const wrapRef = React.useRef(null as any);
  const [render, setRender] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const [pos, setPos] = React.useState(null as any);
  const hideTimer = React.useRef(null as any);
  const showTimer = React.useRef(null as any);

  React.useEffect(() => { watchScroll(); }, []);

  const clearTimers = () => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
  };

  const computePos = () => {
    const el = wrapRef.current as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = r.left + r.width / 2;
    let top = r.bottom + 6;
    if (top + 40 > window.innerHeight - 4) top = r.top - 40 - 6;
    setPos({ left, top });
  };

  const handleEnter = () => {
    clearTimers();
    const wait = lastScrollAt + SCROLL_SETTLE_MS - Date.now();
    if (wait > 0) {
      showTimer.current = window.setTimeout(handleEnter, wait);
      return;
    }
    computePos();
    setRender(true);
  };
  const handleLeave = () => {
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
    setShown(false);
    hideTimer.current = window.setTimeout(() => {
      setRender(false);
      setPos(null);
    }, 220);
  };

  React.useEffect(() => {
    if (!render || !pos) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [render, pos]);

  React.useEffect(() => {
    if (!render) return;
    const hide = () => {
      clearTimers();
      setShown(false);
      setRender(false);
      setPos(null);
    };
    window.addEventListener("wheel", hide, { capture: true, passive: true });
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    return () => {
      window.removeEventListener("wheel", hide, { capture: true } as any);
      window.removeEventListener("scroll", hide, { capture: true } as any);
    };
  }, [render]);

  React.useEffect(() => () => clearTimers(), []);

  const popup = render && pos ? (
    <div
      className={"liquifyTooltipPopup" + (shown ? " isVisible" : "")}
      style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
    >
      {props.text}
    </div>
  ) : null;

  return (
    <span
      ref={wrapRef}
      style={{ display: "inline-flex", verticalAlign: "middle" }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {props.children}
      {popup && (ReactDOM?.createPortal ? ReactDOM.createPortal(popup, document.body) : popup)}
    </span>
  );
}

export function HelpTip(props: { text: string }) {
  const label = React.useMemo(() => getTranslation().aria?.help || "Help", []);
  return (
    <ButtonTooltip text={props.text}>
      <span className="liquifyHelpIcon" role="img" aria-label={label} tabIndex={0}>?</span>
    </ButtonTooltip>
  );
}

export function Section(props: { title: string; id?: string; children?: any }) {
  return (
    <div className="liquifySection" id={props.id}>
      <div className="liquifySectionTitle">{props.title}</div>
      <div className="liquifySectionBody">{props.children}</div>
    </div>
  );
}

export function SubSection(props: { title: string; children?: any }) {
  return (
    <div className="liquifySubSection">
      <div className="liquifySubSectionTitle">{props.title}</div>
      {props.children}
    </div>
  );
}
