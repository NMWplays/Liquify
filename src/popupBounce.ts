const STORAGE_KEY = 'liquify-popup-bounce';
const STYLE_ID = 'liquify-popup-bounce-style';

const START_SCALE = 0.86;
const ENTER_DURATION_MS = 240;
const ENTER_EASING = 'cubic-bezier(0.34, 1.7, 0.64, 1)';

const EXIT_DURATION_MS = 180;
const EXIT_EASING = 'cubic-bezier(0.8, 0, 0.2, 1)';
const EXIT_FADE_MS = 150;

const BASE_CLASS = 'liquify-popup-bouncing';
const START_CLASS = 'liquify-popup-bouncing--start';
const RUN_CLASS = 'liquify-popup-bouncing--run';
const CLONE_CLASS = 'liquify-popup-clone';

const POPUP_SELECTOR = '.context-menu, .library-create-menu, .curation-sheet-menu, .search-dropdown-panel';

const SIZE_CONTAINED = '[data-scroll-size-contained]';

function isInsideContained(node: Node): boolean {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  const contained = el?.closest(SIZE_CONTAINED);
  return !!contained && contained !== el;
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent =
    `.${BASE_CLASS}{transform-origin:top center;will-change:transform;}` +
    `.${START_CLASS}{transform:scale(${START_SCALE});}` +
    `.${RUN_CLASS}{transform:scale(1);transition:transform ${ENTER_DURATION_MS}ms ${ENTER_EASING};}`;
  document.head.appendChild(style);
}

export function startPopupBounce(): void {
  ensureStyle();

  let enabled = (localStorage.getItem(STORAGE_KEY) || 'on') === 'on';
  window.addEventListener('liquifyPopupBounceChange', () => {
    enabled = (localStorage.getItem(STORAGE_KEY) || 'on') === 'on';
  });

  const enterCleanups = new WeakMap<HTMLElement, () => void>();
  const lastRect = new WeakMap<HTMLElement, DOMRect>();
  const lastBackground = new WeakMap<HTMLElement, string>();

  function bounceIn(el: HTMLElement | null, triggerBtn?: Element | null): void {
    if (!el || !enabled) return;
    if ((triggerBtn as HTMLElement | null)?.id === 'liquify-settings-gear-btn') return;

    enterCleanups.get(el)?.();

    el.classList.remove(RUN_CLASS);
    el.classList.add(BASE_CLASS, START_CLASS);
    void el.offsetWidth;
    el.classList.remove(START_CLASS);
    el.classList.add(RUN_CLASS);

    const done = (): void => {
      el.removeEventListener('transitionend', done);
      window.clearTimeout(timer);
      enterCleanups.delete(el);
      el.classList.remove(BASE_CLASS, START_CLASS, RUN_CLASS);
    };
    const timer = window.setTimeout(done, ENTER_DURATION_MS + 120);
    el.addEventListener('transitionend', done, { once: true });
    enterCleanups.set(el, done);
  }

  function fadeOutClone(el: HTMLElement): void {
    if (!enabled) return;
    const rect = lastRect.get(el);
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const clone = el.cloneNode(true) as HTMLElement;
    clone.classList.add(CLONE_CLASS);
    clone.classList.remove(BASE_CLASS, START_CLASS, RUN_CLASS);

    const s = clone.style;
    s.position = 'fixed';
    s.left = `${rect.left}px`;
    s.top = `${rect.top}px`;
    s.width = `${rect.width}px`;
    s.height = `${rect.height}px`;
    s.margin = '0';
    // Detached from its parent, the clone's list is no longer height-limited.
    s.overflow = 'hidden';
    s.pointerEvents = 'none';
    s.zIndex = '10000';
    s.transformOrigin = 'top center';
    s.transform = 'translateY(0) scale(1)';
    s.opacity = '1';

    const background = lastBackground.get(el);
    if (background) s.backgroundColor = background;
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      s.transition = `transform ${EXIT_DURATION_MS}ms ${EXIT_EASING}, opacity ${EXIT_FADE_MS}ms ease-in`;
      s.transform = 'translateY(8px) scale(0.95)';
      s.opacity = '0';
    });

    const remove = (): void => {
      clone.removeEventListener('transitionend', remove);
      window.clearTimeout(timer);
      clone.remove();
    };
    const timer = window.setTimeout(remove, EXIT_DURATION_MS + 150);
    clone.addEventListener('transitionend', remove, { once: true });
  }

  const prevVisible = new WeakMap<Element, boolean>();
  const expandedState = new WeakMap<Element, string | null>();

  function isVisible(el: HTMLElement | null): boolean {
    if (!el) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    return el.offsetParent !== null;
  }

  function scanPopups(): void {
    document.querySelectorAll<HTMLElement>(POPUP_SELECTOR).forEach((el) => {
      if (el.classList.contains(CLONE_CLASS)) return;
      const was = !!prevVisible.get(el);
      const now = isVisible(el);
      if (now) {
        lastRect.set(el, el.getBoundingClientRect());
        lastBackground.set(el, getComputedStyle(el).backgroundColor);
        if (!was) bounceIn(el);
      }
      prevVisible.set(el, now);
    });
  }

  function collectRemovedPopups(node: Node, out: Set<HTMLElement>): void {
    if (!(node instanceof HTMLElement) || node.classList.contains(CLONE_CLASS)) return;
    if (node.matches(POPUP_SELECTOR)) out.add(node);
    node.querySelectorAll<HTMLElement>(POPUP_SELECTOR).forEach((p) => {
      if (!p.classList.contains(CLONE_CLASS)) out.add(p);
    });
  }

  let scanQueued = false;
  function queueScan(): void {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      scanPopups();
    });
  }

  const mo = new MutationObserver((mutations) => {
    const removedPopups = new Set<HTMLElement>();
    let relevant = false;

    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName !== 'aria-expanded' && isInsideContained(m.target)) continue;
      relevant = true;

      if (m.attributeName === 'aria-expanded') {
        const btn = m.target as HTMLElement;
        const now = btn.getAttribute('aria-expanded');
        const was = expandedState.get(btn);

        if (was === 'false' && now === 'true') {
          const popup = btn.parentElement?.querySelector<HTMLElement>(POPUP_SELECTOR) ?? null;
          bounceIn(popup, btn);
        }

        expandedState.set(btn, now);
      }

      m.removedNodes.forEach((node) => collectRemovedPopups(node, removedPopups));
    }

    for (const popup of removedPopups) fadeOutClone(popup);
    if (relevant) queueScan();
  });

  mo.observe(document.body, {
    subtree: true,
    attributes: true,
    childList: true,
    attributeFilter: ['aria-expanded', 'style', 'class'],
  });

  document.querySelectorAll('[aria-expanded]').forEach((btn) => {
    expandedState.set(btn, btn.getAttribute('aria-expanded'));
  });

  scanPopups();
}
