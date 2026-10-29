import { readLS, updateStyle } from '../shared';

const STYLE_ID = 'liquify-local-files-style';

export const LOCAL_FILES_TRANSPARENT_KEY = 'liquify-local-files-transparent';

const LOCAL_FILES_CARD = '.folder-image-placeholder';

function applyCss(): void {
  const on = readLS(LOCAL_FILES_TRANSPARENT_KEY, 'off') === 'on';
  updateStyle(
    STYLE_ID,
    on
      ? `${LOCAL_FILES_CARD} {
  background-color: transparent !important;
  box-shadow: var(--liquify-shadow);
}`
      : '',
  );
}

export function setLocalFilesTransparent(mode: string): void {
  localStorage.setItem(LOCAL_FILES_TRANSPARENT_KEY, mode === 'on' ? 'on' : 'off');
  applyCss();
}

export function ensureLocalFilesTransparentApplied(): void {
  applyCss();
}
