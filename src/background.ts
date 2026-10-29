import { KawarpBackdrop, applyKawarpAppearance } from './settings/features/kawarpBackground';
import { getBgEngine, isHiResCoverOn } from './settings/features/backgroundAppearance';
import { getLibraryUrl } from './settings/features/backgroundLibrary';
import { startAccent, syncAccent } from './settings/features/accent';
import { paletteColor, sampleImageColor } from './settings/features/accentColor';

const EMPTY_BACKDROP = 'linear-gradient(135deg, rgb(32,32,38) 0%, rgb(20,20,25) 50%, rgb(26,23,33) 100%)';

function cssImage(source: string): string {
  return source.startsWith('linear-gradient(') ? source : `url("${source}")`;
}

type Backdrop = {
  kind: 'static' | 'animated';
  image: string | null;
  url: string | null;
  sampleUrl: string | null;
};

const IMAGE_SIZE_UPGRADES: Record<string, string> = {
  ab67616d00004851: 'ab67616d0000b273',
  ab67616d00001e02: 'ab67616d0000b273',
  ab6761610000f178: 'ab6761610000e5eb',
  ab67616100005174: 'ab6761610000e5eb',
  ab67706c0000da84: 'ab67706c0000bebb',
};

function upgradeImageSize(url: string): string {
  return url.replace(/\/image\/([0-9a-f]{16})/i, (whole, code: string) => {
    const larger = IMAGE_SIZE_UPGRADES[code.toLowerCase()];
    return larger ? `/image/${larger}` : whole;
  });
}

const COVER_PREFIX_2000 = 'ab67616d000082c1';
const coverSize = new Map<string, string>();
const coverPending = new Set<string>();

function resolveBigCover(base: string, big: string): void {
  if (coverPending.has(base)) return;
  coverPending.add(base);
  const probe = new Image();
  const settle = (url: string) => {
    coverPending.delete(base);
    coverSize.set(base, url);
    if (base === baseCoverUrlOf(SpotiKit.Player?.track)) {
      window.dispatchEvent(new Event('liquifyBackgroundChange'));
    }
  };
  probe.onload = () => settle(big);
  probe.onerror = () => settle(base);
  probe.src = big;
}

function baseCoverUrlOf(item: any): string | null {
  const meta: any = item?.metadata;
  const raw =
    meta?.image_xlarge_url || meta?.image_large_url || meta?.image_url || meta?.image_small_url || item?.image;
  if (!raw) return null;
  const url = String(raw).replace('spotify:image:', 'https://i.scdn.co/image/');
  return isHiResCoverOn() ? upgradeImageSize(url) : url;
}

function bigCoverUrlOf(base: string): string | null {
  if (!isHiResCoverOn()) return null;
  const big = base.replace(/\/image\/ab67616d[0-9a-f]{8}/i, `/image/${COVER_PREFIX_2000}`);
  return big === base ? null : big;
}

function getCoverUrl(): string | null {
  const base = baseCoverUrlOf(SpotiKit.Player?.track);
  if (!base) return null;
  const big = bigCoverUrlOf(base);
  if (!big) return base;

  const settled = coverSize.get(base);
  if (settled) return settled;
  resolveBigCover(base, big);
  return null;
}

function prefetchNeighbourCovers(): void {
  const queue: any = SpotiKit.Queue || {};
  const around = [...(queue.next || []).slice(0, 2), ...(queue.previous || []).slice(-1)];
  for (const track of around) {
    const base = baseCoverUrlOf(track);
    if (!base || coverSize.has(base)) continue;
    const big = bigCoverUrlOf(base);
    if (big) resolveBigCover(base, big);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(get: () => T | null | undefined, timeoutMs: number): Promise<T | null> {
  const start = Date.now();
  for (;;) {
    const value = get();
    if (value) return value;
    if (Date.now() - start >= timeoutMs) return null;
    await sleep(300);
  }
}

export async function startBackground(): Promise<void> {
  startAccent();
  const root = await waitFor(() => document.querySelector('.app-layout'), 30000);
  if (!root) return;

  const layerA = document.createElement('div');
  const layerB = document.createElement('div');
  layerA.classList.add('liquify-bg-layer', 'layer-a');
  layerB.classList.add('liquify-bg-layer', 'layer-b');
  root.prepend(layerA, layerB);

  const kawarp = new KawarpBackdrop();
  root.prepend(kawarp.el);
  applyKawarpAppearance();

  const animatedContainer = document.createElement('div');
  animatedContainer.classList.add('liquify-animated-bg');

  const animatedTilesA: HTMLDivElement[] = [];
  const animatedTilesB: HTMLDivElement[] = [];
  for (let i = 0; i < 2; i++) {
    const tile = document.createElement('div');
    tile.classList.add('liquify-animated-tile');
    animatedContainer.appendChild(tile);
    animatedTilesA.push(tile);
  }
  for (let i = 0; i < 2; i++) {
    const tile = document.createElement('div');
    tile.classList.add('liquify-animated-tile');
    animatedContainer.appendChild(tile);
    animatedTilesB.push(tile);
  }
  root.prepend(animatedContainer);

  const hideTiles = (): void => {
    animatedContainer.classList.remove('active');
    animatedTilesA.forEach((tile) => tile.classList.remove('active'));
    animatedTilesB.forEach((tile) => tile.classList.remove('active'));
  };

  let useAnimatedA = true;
  let useA = true;

  let lastRenderKey: string | null = null;

  const contextCoverCache = new Map<string, string>();
  let resolvingContextUri: string | null = null;

  function getContextUri(): string {
    return SpotiKit.Player?.state?.context?.uri || '';
  }

  (window as any).liquifyContextDebug = async () => {
    const cover = getCoverUrl();
    return {
      uri: getContextUri(),
      context: SpotiKit.Player?.state?.context,
      rawCoverUrl: SpotiKit.Player?.track?.metadata?.image_url ?? null,
      coverUrl: cover,
      coverSampledColor: cover ? await sampleImageColor(cover) : null,
      paletteColor: await paletteColor(SpotiKit.Player?.track?.uri ?? null),
      accentSource: localStorage.getItem('liquify-accent-source') || 'background',
    };
  };

  async function fetchPlaylistCover(uri: string): Promise<string | null> {
    const norm = (s: string) => {
      const url = String(s).replace('spotify:image:', 'https://i.scdn.co/image/');
      return isHiResCoverOn() ? upgradeImageSize(url) : url;
    };
    try {
      const meta: any = await SpotiKit.Platform?.PlaylistAPI?.getMetadata?.(uri);
      const img = meta?.images?.[0]?.url || meta?.picture || meta?.image;
      if (img) return norm(img);
    } catch {}
    try {
      const id = uri.split(':').pop();
      const res: any = await SpotiKit.Http?.get(
        `https://api.spotify.com/v1/playlists/${id}?fields=images`
      );
      const img = res?.images?.[0]?.url;
      if (img) return img;
    } catch {}
    return null;
  }

  function getResolvedContextCover(): string | null {
    const uri = getContextUri();
    if (!uri || !uri.includes(':playlist:')) return null;
    if (contextCoverCache.has(uri)) return contextCoverCache.get(uri) || null;

    if (resolvingContextUri !== uri) {
      resolvingContextUri = uri;
      fetchPlaylistCover(uri).then((img) => {
        resolvingContextUri = null;
        contextCoverCache.set(uri, img || '');
        if (img) window.dispatchEvent(new Event('liquifyBackgroundChange'));
      });
    }
    return null;
  }

  function render(kind: 'static' | 'animated', image: string | null, url: string | null): void {
    if (!image) return;
    const engine = getBgEngine();
    const key = `${kind}|${engine}|${image}`;
    if (key === lastRenderKey) return;
    lastRenderKey = key;

    if (kind === 'animated' && engine === 'kawarp' && url) {
      layerA.classList.remove('active');
      layerB.classList.remove('active');
      hideTiles();
      kawarp.setActive(true);
      kawarp.show(url);
      return;
    }

    kawarp.setActive(false);

    if (kind === 'animated') {
      layerA.classList.remove('active');
      layerB.classList.remove('active');
      animatedContainer.classList.add('active');
      const onTiles = useAnimatedA ? animatedTilesA : animatedTilesB;
      const offTiles = useAnimatedA ? animatedTilesB : animatedTilesA;
      onTiles.forEach((tile) => {
        tile.style.backgroundImage = image;
        tile.classList.add('active');
      });
      offTiles.forEach((tile) => tile.classList.remove('active'));
      useAnimatedA = !useAnimatedA;
      return;
    }

    hideTiles();
    if (useA) {
      layerA.style.backgroundImage = image;
      layerA.classList.add('active');
      layerB.classList.remove('active');
    } else {
      layerB.style.backgroundImage = image;
      layerB.classList.add('active');
      layerA.classList.remove('active');
    }
    useA = !useA;
  }

  function resolveBackdrop(): Backdrop {
    const bgMode = localStorage.getItem('liquify-bg-mode') || 'dynamic';
    const customImage = getLibraryUrl();
    const bgUrl = localStorage.getItem('liquify-bg-url');
    const customAnimated = localStorage.getItem('liquify-bg-custom-animated') === 'on';
    const customKind: 'static' | 'animated' = customAnimated ? 'animated' : 'static';
    const coverUrl = getCoverUrl();
    const from = (kind: 'static' | 'animated', url: string | null): Backdrop =>
      ({ kind, image: url ? cssImage(url) : null, url, sampleUrl: url });

    let result: Backdrop;
    if (bgMode === 'custom' && customImage) result = from(customKind, customImage);
    else if (bgMode === 'url' && bgUrl) {
      result = { kind: customKind, image: cssImage(bgUrl), url: bgUrl, sampleUrl: null };
    } else if (bgMode === 'playlist') {
      const playlistCover = getResolvedContextCover();
      const isPlaylist = getContextUri().includes(':playlist:');
      result = from(customKind, isPlaylist ? playlistCover : (playlistCover || coverUrl));
    } else if (bgMode === 'animated') result = from('animated', coverUrl);
    else result = from('static', coverUrl);

    if (result.kind === 'animated' && getBgEngine() === 'kawarp' && !kawarp.canRender(result.url)) {
      result = { ...result, kind: 'static' };
    }

    if (!result.image && lastRenderKey === null) {
      return { kind: 'static', image: EMPTY_BACKDROP, url: null, sampleUrl: null };
    }
    return result;
  }

  function updateBackgroundAndAccent(): void {
    const { kind, image, url, sampleUrl } = resolveBackdrop();
    render(kind, image, url);
    syncAccent(sampleUrl, baseCoverUrlOf(SpotiKit.Player?.track));
  }

  updateBackgroundAndAccent();

  window.addEventListener('liquifyBackgroundChange', updateBackgroundAndAccent);
  window.addEventListener('liquifyBackgroundChange', () => {
    applyKawarpAppearance();
    kawarp.applyOptions();
  });

  waitFor(
    () => (typeof SpotiKit?.Player?.on === 'function' ? SpotiKit.Player : null),
    30000
  ).then((player) => {
    try {
      player?.on('track', () => {
        updateBackgroundAndAccent();
        prefetchNeighbourCovers();
      });
    } catch {}
    prefetchNeighbourCovers();
  });

  setInterval(updateBackgroundAndAccent, 500);
  setInterval(prefetchNeighbourCovers, 2000);
}
