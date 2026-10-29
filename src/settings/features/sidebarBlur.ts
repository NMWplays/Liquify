import { readLS, readNum, updateStyle } from '../shared';

const STYLE_ID = 'liquify-sidebar-blur-style';

export const SIDEBAR_BLUR_DEFAULT = 24;

export const SIDEBARS = {
  left: {
    key: 'liquify-sidebar-blur-left',
    amountKey: 'liquify-sidebar-blur-left-amount',
    selector: '.left-sidebar',
  },
  right: {
    key: 'liquify-sidebar-blur-right',
    amountKey: 'liquify-sidebar-blur-right-amount',
    selector: '.right-sidebar',
  },
} as const;

export type SidebarSide = keyof typeof SIDEBARS;

export function isSidebarBlurOn(side: SidebarSide): boolean {
  return readLS(SIDEBARS[side].key, 'off') === 'on';
}

export function readSidebarBlurAmount(side: SidebarSide): number {
  return readNum(SIDEBARS[side].amountKey, SIDEBAR_BLUR_DEFAULT);
}

function applyCss(): void {
  const rules: string[] = [];

  for (const side of Object.keys(SIDEBARS) as SidebarSide[]) {
    if (!isSidebarBlurOn(side)) continue;
    const px = readSidebarBlurAmount(side);
    rules.push(
      `${SIDEBARS[side].selector} {
  backdrop-filter: blur(${px}px) !important;
  -webkit-backdrop-filter: blur(${px}px) !important;
}`,
    );
  }

  updateStyle(STYLE_ID, rules.join('\n\n'));
}

export function setSidebarBlur(side: SidebarSide, mode: string): void {
  localStorage.setItem(SIDEBARS[side].key, mode === 'on' ? 'on' : 'off');
  applyCss();
}

export function setSidebarBlurAmount(side: SidebarSide, px: number): void {
  localStorage.setItem(SIDEBARS[side].amountKey, String(px));
  applyCss();
}

export function resetSidebarBlur(): void {
  for (const side of Object.keys(SIDEBARS) as SidebarSide[]) {
    localStorage.setItem(SIDEBARS[side].key, 'off');
    localStorage.setItem(SIDEBARS[side].amountKey, String(SIDEBAR_BLUR_DEFAULT));
  }
  applyCss();
}

export function ensureSidebarBlurApplied(): void {
  applyCss();
}
