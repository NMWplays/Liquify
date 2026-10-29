import { SettingsContent } from './components/SettingsContent';
import { ensureSettingsUiStyle } from './components/settingsStyles';
import { React, ReactDOM } from './runtime/reactRuntime';

const OVERLAY_ID = 'liquify-settings-react-overlay';
const TOOLTIP_SELECTOR = 'body > .liquifyTooltipPopup';
const FLOATING_SETTINGS_SELECTOR = 'body > .liquifyTooltipPopup, body > .liquifySectionNavScrollBtn';

function removeTooltips(): void {
  document.querySelectorAll(TOOLTIP_SELECTOR).forEach((el) => el.remove());
}

function removeFloatingSettingsElements(): void {
  document.querySelectorAll(FLOATING_SETTINGS_SELECTOR).forEach((el) => el.remove());
}

function hideFloatingSettingsElements(): void {
  document.querySelectorAll<HTMLElement>(FLOATING_SETTINGS_SELECTOR).forEach((el) => {
    el.style.display = 'none';
  });
}

function createOverlay(onBackgroundClick: (overlay: HTMLElement) => void): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.background = 'transparent';
  overlay.style.overflow = 'hidden';
  overlay.style.padding = '24px';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) onBackgroundClick(overlay);
  });
  return overlay;
}

function showOverlay(overlay: HTMLElement): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('overlay-visible');
    });
  });
}

function unmountOverlay(overlay: HTMLElement, root?: HTMLElement): void {
  try {
    const mountRoot = root || overlay.querySelector('div');
    if (mountRoot) ReactDOM.unmountComponentAtNode(mountRoot);
  } catch {}
  removeFloatingSettingsElements();
  overlay.remove();
}

function closeWithAnimation(overlay: HTMLElement, root?: HTMLElement): void {
  overlay.classList.remove('overlay-visible');
  overlay.classList.add('overlay-closing');
  hideFloatingSettingsElements();

  const panel = overlay.querySelector('.liquifySettingsPanel') as HTMLElement | null;
  let closed = false;
  let fallback = 0;
  const onEnd = (e?: any) => {
    if (e && e.propertyName && e.propertyName !== 'transform') return;
    if (closed) return;
    closed = true;
    window.clearTimeout(fallback);
    panel?.removeEventListener('transitionend', onEnd);
    unmountOverlay(overlay, root);
  };

  if (panel) panel.addEventListener('transitionend', onEnd);
  fallback = window.setTimeout(onEnd, 500);
}

function SettingsModalRoot(props: { onClose: () => void; artistCtrl: any }) {
  const [nonce, setNonce] = React.useState(0);
  React.useEffect(() => {
    const handler = () => setNonce((n: number) => n + 1);
    window.addEventListener('liquifyConfigApplied', handler);
    window.addEventListener('liquifyLanguageChanged', handler);
    return () => {
      window.removeEventListener('liquifyConfigApplied', handler);
      window.removeEventListener('liquifyLanguageChanged', handler);
    };
  }, []);
  const SettingsContentAny = SettingsContent as any;
  return <SettingsContentAny key={nonce} onClose={props.onClose} artistCtrl={props.artistCtrl} />;
}

export function openSettingsModal(artistCtrl: any): void {
  ensureSettingsUiStyle();
  document.getElementById(OVERLAY_ID)?.remove();

  const overlay = createOverlay((target) => closeWithAnimation(target, root));
  const root = document.createElement('div');

  document.body.appendChild(overlay);
  overlay.appendChild(root);
  showOverlay(overlay);

  const onClose = () => closeWithAnimation(overlay, root);
  ReactDOM.render(<SettingsModalRoot onClose={onClose} artistCtrl={artistCtrl} />, root);
}
