const DB_NAME = 'liquify-backgrounds';
const DB_VERSION = 1;
const STORE = 'images';

export const LIBRARY_SELECTED_KEY = 'liquify-bg-library-id';
const LEGACY_IMAGE_KEY = 'liquify-bg-image';
export const ARTIST_LIBRARY_SELECTED_KEY = 'liquify-artist-bg-library-id';
const LEGACY_ARTIST_IMAGE_KEY = 'liquify-artist-bg-image';

export type LibraryImage = { id: string; name: string; added: number; blob: Blob };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function listImages(): Promise<LibraryImage[]> {
  try {
    const all = (await tx<LibraryImage[]>('readonly', (s) => s.getAll() as any)) || [];
    return all.sort((a, b) => b.added - a.added);
  } catch {
    return [];
  }
}

export async function addImages(files: File[]): Promise<void> {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const entry: LibraryImage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      added: Date.now(),
      blob: file,
    };
    await tx('readwrite', (s) => s.put(entry) as any);
  }
}

export async function deleteImage(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id) as any);
  for (const selection of [background, artist]) {
    if (localStorage.getItem(selection.key) !== id) continue;
    localStorage.removeItem(selection.key);
    await selection.refresh();
  }
}

function createSelection(key: string, legacyKey: string, changeEvent: string) {
  let currentUrl: string | null = null;
  let currentId = '';

  function revoke(): void {
    if (currentUrl && currentUrl.startsWith('blob:')) URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }

  async function refresh(): Promise<void> {
    const id = localStorage.getItem(key) || '';

    if (!id) {
      revoke();
      currentId = '';
      currentUrl = localStorage.getItem(legacyKey) || null;
      window.dispatchEvent(new Event(changeEvent));
      return;
    }

    if (id === currentId && currentUrl) return;

    try {
      const entry = await tx<LibraryImage | undefined>('readonly', (s) => s.get(id) as any);
      revoke();
      currentId = id;
      currentUrl = entry?.blob ? URL.createObjectURL(entry.blob) : null;
    } catch {
      revoke();
      currentId = '';
    }
    window.dispatchEvent(new Event(changeEvent));
  }

  return {
    key,
    refresh,
    url: () => currentUrl,
    select(id: string): void {
      localStorage.setItem(key, id);
      void refresh();
    },
  };
}

const background = createSelection(LIBRARY_SELECTED_KEY, LEGACY_IMAGE_KEY, 'liquifyBackgroundChange');
const artist = createSelection(ARTIST_LIBRARY_SELECTED_KEY, LEGACY_ARTIST_IMAGE_KEY, 'liquifyArtistBackgroundChange');

export type LibraryTarget = 'background' | 'artist';

export function librarySelectedKey(target: LibraryTarget): string {
  return target === 'artist' ? artist.key : background.key;
}

export function getLibraryUrl(): string | null {
  return background.url();
}

export function getArtistLibraryUrl(): string | null {
  return artist.url();
}

export function selectImage(id: string, target: LibraryTarget = 'background'): void {
  (target === 'artist' ? artist : background).select(id);
}

export function ensureLibraryApplied(): void {
  void background.refresh();
}

export function ensureArtistLibraryApplied(): void {
  void artist.refresh();
}
