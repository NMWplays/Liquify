import { React, ReactDOM } from '../runtime/reactRuntime';
import { getTranslation } from '../i18n/translations';
import { sleep } from '../shared';

const LL_REPO = 'nmwplays/liquid-lyrics';

const EXIT_MS = 250;

function isLiquidLyricsInstalled(): boolean {
  try {
    const installed = (window as any).SpotiKit?.Marketplace?.installed?.() || {};
    return Object.keys(installed).some((id) => id.startsWith(`${LL_REPO}/`));
  } catch {
    return false;
  }
}

async function installLiquidLyrics(): Promise<{ ok: boolean; reload: boolean }> {
  const failed = { ok: false, reload: false };
  try {
    const marketplace = (window as any).SpotiKit?.Marketplace;
    if (!marketplace?.install) return failed;
    const catalog = marketplace.catalog?.items?.length ? marketplace.catalog : await marketplace.refresh();
    const items: any[] = (catalog?.items || []).filter(
      (item: any) => item.kind === 'extension' && String(item.id).startsWith(`${LL_REPO}/`),
    );
    const item = items.find((i) => i.origin === 'spotikit') || items[0];
    if (!item) return failed;
    await marketplace.install(item.id);
    return { ok: !!marketplace.installed()[item.id], reload: !!marketplace.pendingReload?.[item.id] };
  } catch {
    return failed;
  }
}

function ensureOnboardingStyle() {
  if (document.getElementById('liquify-onboarding-style')) return;
  const style = document.createElement('style');
  style.id = 'liquify-onboarding-style';
  style.textContent = `
    .lqObBlocker {
      position: fixed; inset: 0; z-index: 100001;
      background: transparent; pointer-events: all;
      animation: lqObFadeIn 320ms ease-out both;
    }

    .lqObSpot {
      position: fixed; z-index: 100003;
      border-radius: 20px; pointer-events: none;
      box-shadow:
        0 0 0 9999px rgba(0,0,0,0.72),
        0 0 0 3px var(--accent-color,#1DB954),
        0 0 16px 3px var(--accent-color,#1DB954);
      animation: lqObFadeIn 320ms ease-out both, lqObSpotPulse 2.4s ease-in-out 320ms infinite;
    }
    .lqObSpot.is-out { animation: lqObFadeOut 220ms ease-in both; }
    @keyframes lqObSpotPulse {
      0%,100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 3px var(--accent-color,#1DB954), 0 0 16px 3px var(--accent-color,#1DB954); }
      50%     { box-shadow: 0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 3px var(--accent-color,#1DB954), 0 0 26px 7px var(--accent-color,#1DB954); }
    }

    @keyframes lqObFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes lqObFadeOut { from { opacity: 1; } to { opacity: 0; } }

    .lqObCenter {
      position: fixed; inset: 0; z-index: 100005;
      display: flex; align-items: center; justify-content: center;
      pointer-events: none;
    }

    .lqObCard {
      position: fixed;
      z-index: 100005;
      --glass-filter: url(#glass-filter--r1-7);
      background: transparent;
      backdrop-filter: var(--glass-filter) blur(3px);
      -webkit-backdrop-filter: var(--glass-filter) blur(3px);
      box-shadow: var(--liquify-shadow);
      border-radius: 16px;
      padding: 18px 20px 16px;
      color: white;
      pointer-events: all;
      will-change: transform, opacity;
      animation: lqObCardIn 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .lqObCenter .lqObCard { position: relative; }
    .lqObCard.is-out { animation: lqObCardOut ${EXIT_MS}ms cubic-bezier(0.8, 0, 0.2, 1) both; }
    @keyframes lqObCardIn {
      from { opacity: 0; transform: scale(0.86); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes lqObCardOut {
      from { opacity: 1; transform: scale(1); }
      to   { opacity: 0; transform: translateY(8px) scale(0.95); }
    }

    .lqObArrow {
      position: absolute;
      top: -8px; right: 18px;
      width: 0; height: 0;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-bottom: 9px solid rgba(255,255,255,0.13);
    }

    .lqObBrand {
      font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent-color, #1DB954);
      margin: 0 0 6px;
    }
    .lqObContent { margin-bottom: 14px; }
    .lqObTitle {
      font-size: 14px; font-weight: 700;
      margin: 0 0 7px; color: rgba(255,255,255,0.95);
      display: flex; align-items: center; gap: 7px;
    }
    .lqObText { font-size: 12px; line-height: 1.55; color: rgba(255,255,255,0.74); margin: 0; }
    .lqObNote { font-size: 11px; line-height: 1.45; margin: 9px 0 0; }
    .lqObNote.isError { color: rgba(255,170,170,0.9); }
    .lqObNote.isInfo { color: rgba(255,255,255,0.55); }

    .lqObActions { display: flex; justify-content: flex-end; gap: 8px; align-items: center; }
    .lqObActions.isSplit { justify-content: space-between; }
    .lqObBtn {
      padding: 7px 16px;
      border-radius: 10px;
      font-size: 13px; font-weight: 600;
      cursor: pointer; border: none;
      background: transparent; color: white;
      box-shadow: var(--liquify-shadow);
      display: inline-flex; align-items: center; gap: 6px;
      transition: background-color 0.18s ease, transform 0.12s ease, opacity 0.15s ease;
    }
    .lqObBtn:hover { transform: scale(1.04); }
    .lqObBtnPrimary:hover { background: var(--liquify-glow-accent, var(--accent-color)); }
    .lqObBtnGhost { box-shadow: none; color: rgba(255,255,255,0.6); }
    .lqObBtnGhost:hover { color: rgba(255,255,255,0.92); transform: none; }
    .lqObBtn:disabled { opacity: 0.55; cursor: default; transform: none; }

    .lqObDots { display: flex; gap: 6px; align-items: center; margin-bottom: 12px; }
    .lqObDot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,255,255,0.25);
      transition: background 0.25s ease, width 0.25s ease, border-radius 0.25s ease;
    }
    .lqObDot.active { background: var(--accent-color, #1DB954); width: 16px; border-radius: 3px; }
  `;
  document.head.appendChild(style);
}

const GearIcon = () => (
  <svg role="img" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="butt" strokeLinejoin="miter"
    style={{ width: 16, height: 16, flexShrink: 0 }}>
    <path vectorEffect="non-scaling-stroke" d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" />
    <path vectorEffect="non-scaling-stroke" d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
  </svg>
);

const LyricsIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"
    style={{ width: 14, height: 14, flexShrink: 0 }}>
    <path d="M13 2.5a.75.75 0 0 0-.93-.728l-6 1.5A.75.75 0 0 0 5.5 4v6.04A2.5 2.5 0 1 0 7 12.5V6.586l4.5-1.125v3.579A2.5 2.5 0 1 0 13 11.5z" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 13, height: 13, flexShrink: 0 }}>
    <path d="M8 2v8" /><polyline points="4.5,7 8,10.5 11.5,7" /><path d="M3 13.5h10" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 13, height: 13, flexShrink: 0 }}>
    <polyline points="2,9 6,13 14,3" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 13, height: 13, flexShrink: 0 }}>
    <polyline points="5,2 11,8 5,14" />
  </svg>
);

function Dots(props: { active: number }) {
  return (
    <div className="lqObDots">
      {[0, 1, 2].map((i) => (
        <div key={i} className={'lqObDot' + (i === props.active ? ' active' : '')} />
      ))}
    </div>
  );
}

const SIDE_CARD_WIDTH = 320;
const SIDE_GAP = 20;

function sideOfPanel(panel: { top: number; right: number; height: number } | null): any {
  if (!panel || window.innerWidth - panel.right < SIDE_CARD_WIDTH + SIDE_GAP * 2) return undefined;
  return { inset: 'auto', left: panel.right + SIDE_GAP, top: panel.top, height: panel.height, width: SIDE_CARD_WIDTH };
}

function LiquifyOnboarding(props: { onFinish: () => void }) {
  const t = getTranslation();
  const ob = t.onboarding || {};

  const [renderStep, setRenderStep] = React.useState(0);
  const [exiting, setExiting] = React.useState(false);
  const [gearRect, setGearRect] = React.useState(null as any);
  const [installState, setInstallState] = React.useState('idle' as 'idle' | 'installing' | 'done' | 'failed');
  const pendingReloadRef = React.useRef(false);
  const [panelRect, setPanelRect] = React.useState(null as any);

  React.useEffect(() => {
    if (renderStep !== 2) return;
    let timer = 0;
    let tries = 0;
    const measure = () => {
      const panel = document.querySelector('.liquifySettingsPanel') as HTMLElement | null;
      const r = panel?.getBoundingClientRect();
      if (r && r.width > 0) setPanelRect({ top: r.top, right: r.right, height: r.height });
      else if (++tries < 10) timer = window.setTimeout(measure, 100);
    };
    timer = window.setTimeout(measure, 450);
    return () => window.clearTimeout(timer);
  }, [renderStep]);

  React.useEffect(() => {
    ensureOnboardingStyle();
    const btn = document.getElementById('liquify-settings-gear-btn');
    if (btn) {
      const r = btn.getBoundingClientRect();
      setGearRect({ top: r.top, left: r.left, right: r.right, width: r.width, height: r.height });
    }
  }, []);

  const PAD = 6;
  const spotStyle: any = gearRect ? {
    top: gearRect.top - PAD,
    left: gearRect.left - PAD,
    width: gearRect.width + PAD * 2,
    height: gearRect.height + PAD * 2,
  } : {};
  const cardRight = gearRect ? Math.max(12, window.innerWidth - gearRect.right - PAD) : 16;
  const cardTop = gearRect ? gearRect.top + gearRect.height + PAD + 12 : 80;

  const transitionTo = (next: number, atSwap?: () => void) => {
    setExiting(true);
    setTimeout(() => {
      atSwap?.();
      setExiting(false);
      setRenderStep(next);
    }, EXIT_MS);
  };

  const openSettings = () => {
    if (typeof (window as any).showLiquifySettingsMenu === 'function') {
      try { (window as any).showLiquifySettingsMenu(); } catch {}
    }
  };
  const goToSettings = () => transitionTo(2, openSettings);
  const goToLyrics = () => (isLiquidLyricsInstalled() ? goToSettings() : transitionTo(1));

  const handleInstall = async () => {
    if (installState === 'installing') return;
    setInstallState('installing');
    const result = await installLiquidLyrics();
    if (result.ok) {
      pendingReloadRef.current = result.reload;
      setInstallState('done');
      setTimeout(goToSettings, 650);
    } else {
      setInstallState('failed');
    }
  };

  const finish = () => {
    setExiting(true);
    setTimeout(() => {
      const overlay = document.getElementById('liquify-settings-react-overlay');
      if (overlay) {
        overlay.classList.remove('overlay-visible');
        overlay.classList.add('overlay-closing');
        document
          .querySelectorAll<HTMLElement>('body > .liquifyTooltipPopup, body > .liquifySectionNavScrollBtn')
          .forEach((el) => { el.style.display = 'none'; });
        setTimeout(() => {
          try { ReactDOM.unmountComponentAtNode(overlay.querySelector('div') as any); } catch {}
          document.querySelectorAll('body > .liquifyTooltipPopup, body > .liquifySectionNavScrollBtn').forEach((el) => el.remove());
          overlay.remove();
        }, 400);
      }
      localStorage.setItem('liquify-onboarding-done', '1');
      props.onFinish();
      if (pendingReloadRef.current) {
        setTimeout(() => { try { window.location.reload(); } catch {} }, 250);
      }
    }, EXIT_MS);
  };

  const cardCls = 'lqObCard' + (exiting ? ' is-out' : '');

  return (
    <>
      <div className="lqObBlocker" />

      {renderStep === 0 && gearRect && (
        <div className={'lqObSpot' + (exiting ? ' is-out' : '')} style={spotStyle} />
      )}

      {renderStep === 0 && (
        <div className={cardCls} style={{ top: cardTop, right: cardRight, width: 280, transformOrigin: 'top right' }}>
          <div className="lqObArrow" />
          <Dots active={0} />
          <div className="lqObContent">
            <div className="lqObBrand">{ob.welcomeTag || 'Welcome to'} Liquify V2</div>
            <div className="lqObTitle"><GearIcon />{ob.step1Title || 'Liquify Settings V3'}</div>
            <p className="lqObText">{ob.step1Text || 'This button opens Liquify Settings V3 for Liquify Theme V2. Customize backgrounds, accent colors, the player, animations and much more.'}</p>
          </div>
          <div className="lqObActions">
            <button className="lqObBtn lqObBtnPrimary" type="button" onClick={goToLyrics}>{ob.nextBtn || 'Next'}<ArrowIcon /></button>
          </div>
        </div>
      )}

      {renderStep === 1 && (
        <div className="lqObCenter">
          <div className={cardCls} style={{ width: 320 }}>
            <Dots active={1} />
            <div className="lqObContent">
              <div className="lqObTitle"><LyricsIcon />{ob.lyricsTitle || 'Liquid Lyrics'}</div>
              <p className="lqObText">{ob.lyricsText || "Liquid Lyrics is the official lyrics extension for Liquify Theme V2 - it makes the theme feel complete, and it's the only lyrics extension officially supported by the theme. Install it from the Marketplace?"}</p>
              {installState === 'done' && (
                <p className="lqObNote isInfo">{ob.lyricsReloadNote || 'Liquify will reload once you finish to load Liquid Lyrics.'}</p>
              )}
              {installState === 'failed' && (
                <p className="lqObNote isError">{ob.lyricsFailed || "Couldn't auto-install — you can grab Liquid Lyrics from the Marketplace."}</p>
              )}
            </div>
            <div className="lqObActions isSplit">
              <button className="lqObBtn lqObBtnGhost" type="button" onClick={goToSettings} disabled={installState === 'installing'}>
                {ob.lyricsSkipBtn || 'Maybe later'}
              </button>
              <button className="lqObBtn lqObBtnPrimary" type="button" onClick={handleInstall} disabled={installState === 'installing' || installState === 'done'}>
                {installState === 'installing'
                  ? (ob.lyricsInstalling || 'Installing…')
                  : installState === 'done'
                    ? <><CheckIcon />{ob.lyricsInstalled || 'Installed'}</>
                    : installState === 'failed'
                      ? <><DownloadIcon />{ob.lyricsRetryBtn || 'Retry'}</>
                      : <><DownloadIcon />{ob.lyricsInstallBtn || 'Install'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {renderStep === 2 && (
        <div className="lqObCenter" style={sideOfPanel(panelRect)}>
          <div className={cardCls} style={{ width: 320 }}>
            <Dots active={2} />
            <div className="lqObContent">
              <div className="lqObTitle">{ob.step2Title || 'Explore your Settings'}</div>
              <p className="lqObText">{ob.step2Text || 'All Liquify Settings V3 options live here, and changes are saved instantly. Close the panel anytime with the close button or by clicking outside.'}</p>
            </div>
            <div className="lqObActions">
              <button className="lqObBtn lqObBtnPrimary" type="button" onClick={finish}><CheckIcon />{ob.gotItBtn || 'Got it'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export async function startLiquifyOnboarding() {
  if (localStorage.getItem('liquify-onboarding-done')) return;

  let tries = 0;
  while (!document.getElementById('liquify-settings-gear-btn') && tries < 50) {
    await sleep(200);
    tries++;
  }
  if (!document.getElementById('liquify-settings-gear-btn')) return;

  await sleep(400);

  const container = document.createElement('div');
  container.id = 'liquify-onboarding-root';
  document.body.appendChild(container);

  const finish = () => {
    try { ReactDOM.unmountComponentAtNode(container); } catch {}
    container.remove();
  };

  ReactDOM.render(<LiquifyOnboarding onFinish={finish} />, container);
}
