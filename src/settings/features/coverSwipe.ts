import { CANVAS_CONTAINER_SEL, hasMountedCanvasMedia } from '../shared';
import { getNpvCoverAnim } from './coverFlip';

export function installCoverSwipe() {
  (() => {
    const anyWin = window as any;
    const STYLE_ID = 'cs-cover-swipe';
    const TRACK_ID  = 'cs-track';
    const TRAVEL    = 2;
    const DURATION  = Math.round(300 * TRAVEL * 0.9);
    const SETTLE    = 190;
    const TOTAL     = DURATION + SETTLE;
    const SLIDE_END = ((DURATION / TOTAL) * 100).toFixed(2);
    const OVERSHOOT = 3.5;
    const FADE      = 250;
    const CANVAS_SCALE = 1.1;
    const CANVAS_FADE = 500;
    const SAME_SONG_THRESHOLD = 3000;
    const POST_CANVAS_GRACE = 600;
    const CANVAS_GAP_GRACE = 150;
    const CANVAS_SEL = CANVAS_CONTAINER_SEL;
    const VIDEO_SEL = '#VideoPlayerNpv_ReactPortal';
    const CINEMA_SEL = '.cinema-container';
    const CONTAINER_SEL = '.npv-cover-art-slot';
    const SPOTIFY_COVER_SEL = '.npv-cover-art-motion';
    const SIDEBAR_SEL = '.right-sidebar';

    document.getElementById(STYLE_ID)?.remove();
    anyWin.__coverSwipeOff?.();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        ${CONTAINER_SEL}:has(#${TRACK_ID}) > ${SPOTIFY_COVER_SEL} {
            visibility: hidden !important;
        }
        ${CONTAINER_SEL}:has(#${TRACK_ID})::after {
            display: none !important;
        }
        #${TRACK_ID} {
            position: absolute;
            inset: 0;
            border-radius: 20px;
            pointer-events: none;
            opacity: 1;
            transform: scale(1);
            transform-origin: center top;
            transition: opacity ${CANVAS_FADE}ms ease, transform ${CANVAS_FADE}ms cubic-bezier(.4,0,.2,1);
        }
        #${TRACK_ID}.cs-hidden { opacity: 0; transform: scale(${CANVAS_SCALE}); }
        #${TRACK_ID} .cs-slot::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: var(--liquify-shadow);
            pointer-events: none;
            z-index: 10;
        }
        #${TRACK_ID} .cs-clip {
            position: absolute;
            inset: 0;
            overflow: visible;
            border-radius: 20px;
            --cs-travel: ${TRAVEL * 100}%;
        }
        .cs-unclip {
            overflow-x: clip !important;
            overflow-clip-margin: 100vw !important;
        }
        .cs-unclip.cs-unclip-both {
            overflow: clip !important;
        }
        #${TRACK_ID} .cs-slot {
            position: absolute;
            inset: 0;
            border-radius: 20px;
            will-change: transform;
        }
        #${TRACK_ID} .cs-face {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: inherit;
        }
        #${TRACK_ID} .cs-current { transform: translateX(0); }
        #${TRACK_ID} .cs-next    { transform: translateX(var(--cs-travel)); }
        #${TRACK_ID} .cs-prev    { transform: translateX(calc(var(--cs-travel) * -1)); }
        #${TRACK_ID} .cs-next,
        #${TRACK_ID} .cs-prev    { visibility: hidden; }
        #${TRACK_ID}.cs-animating .cs-slot {
            transition: transform ${DURATION}ms cubic-bezier(.4, 0, .2, 1);
        }
        /* The arriving cover gets the spring, as two legs rather than one curve
           (see SETTLE). The first runs to ${SLIDE_END}% of the total, which is
           exactly the old ${DURATION}ms, on exactly the old easing — so the
           swipe travels at the pace it always did. It stops ${OVERSHOOT}% of a
           cover width past centre, and the remaining ${SETTLE}ms ease that back. */
        @keyframes liquifyCsArriveNext {
            0%   { transform: translateX(var(--cs-travel)); animation-timing-function: cubic-bezier(.4, 0, .2, 1); }
            ${SLIDE_END}% { transform: translateX(-${OVERSHOOT}%); animation-timing-function: cubic-bezier(.33, 0, .25, 1); }
            100% { transform: translateX(0); }
        }
        @keyframes liquifyCsArrivePrev {
            0%   { transform: translateX(calc(var(--cs-travel) * -1)); animation-timing-function: cubic-bezier(.4, 0, .2, 1); }
            ${SLIDE_END}% { transform: translateX(${OVERSHOOT}%); animation-timing-function: cubic-bezier(.33, 0, .25, 1); }
            100% { transform: translateX(0); }
        }
        #${TRACK_ID}.cs-animating.cs-going-next .cs-next { animation: liquifyCsArriveNext ${TOTAL}ms both; }
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-prev { animation: liquifyCsArrivePrev ${TOTAL}ms both; }
        #${TRACK_ID}.cs-animating.cs-going-next .cs-current,
        #${TRACK_ID}.cs-animating.cs-going-next .cs-next,
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-current,
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-prev { visibility: visible; }
        #${TRACK_ID}.cs-animating.cs-going-next .cs-current { transform: translateX(calc(var(--cs-travel) * -1)); }
        #${TRACK_ID}.cs-animating.cs-going-next .cs-next    { transform: translateX(0); }
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-current { transform: translateX(var(--cs-travel)); }
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-prev    { transform: translateX(0); }
        #${TRACK_ID} .cs-fade-overlay {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: inherit;
            opacity: 0;
            pointer-events: none;
            z-index: 1;
        }
        #${TRACK_ID} .cs-fade-overlay.cs-fade-in {
            transition: opacity ${FADE}ms ease;
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    anyWin.liquifyCoverSwipeDebug = () => {
        const start = document.querySelector(CONTAINER_SEL) as HTMLElement | null;
        if (!start) return 'cover container not found';
        const rows: any[] = [];
        for (let el: HTMLElement | null = start; el && el !== document.documentElement; el = el.parentElement) {
            const cs = getComputedStyle(el);
            const clips = cs.overflowX !== 'visible';
            const containing = cs.transform !== 'none' || cs.filter !== 'none'
                || (cs as any).backdropFilter !== 'none' || cs.contain !== 'none';
            if (!clips && !containing) continue;
            const r = el.getBoundingClientRect();
            rows.push({
                el: el.className || el.tagName,
                overflowX: cs.overflowX,
                clipMargin: (cs as any).overflowClipMargin || '',
                transform: cs.transform === 'none' ? '' : 'yes',
                filter: cs.filter === 'none' ? '' : 'yes',
                backdrop: (cs as any).backdropFilter === 'none' ? '' : 'yes',
                left: Math.round(r.left),
                right: Math.round(r.right),
            });
        }
        return { coverBox: start.getBoundingClientRect().toJSON(), clippers: rows };
    };

    const trackToImageUrl = (t: any) => {
        if (!t) return '';
        const ctx = t.contextTrack || t;
        const meta = ctx.metadata || {};
        const uri = meta.image_xlarge_url || meta.image_large_url
            || meta.image_url || meta.image_small_url || t.image;
        if (uri) {
            if (uri.startsWith('http')) return uri;
            if (uri.startsWith('spotify:image:')) return 'https://i.scdn.co/image/' + uri.split(':')[2];
            return uri;
        }
        const imgs = ctx.album?.images || t.album?.images;
        if (Array.isArray(imgs) && imgs[0]?.url) return imgs[0].url;
        return '';
    };
    const trackToUri = (t: any) => {
        if (!t) return '';
        const ctx = t.contextTrack || t;
        return ctx.uri || ctx.contextUri || t.uri || '';
    };
    const getCurrentItem = () => {
        try {
            return SpotiKit.Player?.track || null;
        } catch { return null; }
    };
    const getCurrentCoverUrl = () => {
        const url = trackToImageUrl(getCurrentItem());
        if (url) return url;
        const cont = document.querySelector(CONTAINER_SEL);
        return (cont?.querySelector(`${SPOTIFY_COVER_SEL} img`) as HTMLImageElement | null)?.src
            || (cont?.querySelector('img') as HTMLImageElement | null)?.src || '';
    };
    const getCurrentUri = () => trackToUri(getCurrentItem());

    const getNextItem = () => {
        try {
            return SpotiKit.Queue?.next?.[0] || null;
        } catch { return null; }
    };
    const getPrevItem = () => {
        try {
            const previous = SpotiKit.Queue?.previous;
            return previous?.[previous.length - 1] || null;
        } catch { return null; }
    };
    const getNextCoverUrl = () => {
        const url = trackToImageUrl(getNextItem());
        if (url) return url;
        const el = document.querySelector('#liquify-next-song-card .nsc-cover') as HTMLElement | HTMLImageElement | null;
        if (!el) return '';
        if (el.tagName === 'IMG') return (el as HTMLImageElement).src;
        const m = getComputedStyle(el).backgroundImage.match(/url\(["']?(.+?)["']?\)/);
        return m ? m[1] : '';
    };
    const getPrevCoverUrl = () => trackToImageUrl(getPrevItem());
    const getNextUri = () => trackToUri(getNextItem());
    const getPrevUri = () => trackToUri(getPrevItem());

    let prevUrl = '', currentUrl = '', nextUrl = '';
    let prevUri = '', currentUri = '', nextUri = '';
    let track: HTMLElement | null = null, clip: HTMLElement | null = null, prevSlot: HTMLElement | null = null, currentSlot: HTMLElement | null = null, nextSlot: HTMLElement | null = null;
    let mountedContainer: HTMLElement | null = null, origPosition = '';
    let canvasVisible = false;
    let animating = false;
    let canvasPoll: ReturnType<typeof setInterval> | null = null;
    let nextObserver: MutationObserver | null = null;
    let canvasObserver: MutationObserver | null = null;
    let revealTimer: ReturnType<typeof setTimeout> | null = null;
    let manualSkipPending = false;
    let manualSkipTimer: ReturnType<typeof setTimeout> | null = null;
    let lastCanvasOffAt = 0;

    // The queue only hands out 300px art, too soft for the sidebar cover.
    const sharp = (url: string) => url.replace(/\/image\/ab67616d0000(?:4851|11eb|1e02)/i, '/image/ab67616d0000b273');

    const setSlot = (slot: HTMLElement | null, url: string) => {
        if (!slot) return;
        const face = (slot.querySelector('.cs-face') as HTMLElement | null) || slot;
        face.style.backgroundImage = url ? `url("${sharp(url)}")` : '';
    };

    const syncFromTruth = () => {
        if (!track) return;
        const realUri = getCurrentUri();
        const realUrl = getCurrentCoverUrl();
        if (realUri && realUri !== currentUri) {
            currentUri = realUri;
            currentUrl = realUrl;
            setSlot(currentSlot, currentUrl);
        }
        const nNext = getNextCoverUrl(), nNextUri = getNextUri();
        if (nNextUri !== nextUri) { nextUri = nNextUri; nextUrl = nNext; setSlot(nextSlot, nextUrl); }
        const nPrev = getPrevCoverUrl(), nPrevUri = getPrevUri();
        if (nPrevUri !== prevUri) { prevUri = nPrevUri; prevUrl = nPrev; setSlot(prevSlot, prevUrl); }
    };

    const refreshAdjacent = () => {
        const nNext = getNextCoverUrl(), nNextUri = getNextUri();
        if (nNextUri !== nextUri) { nextUri = nNextUri; nextUrl = nNext; setSlot(nextSlot, nextUrl); }
        const nPrev = getPrevCoverUrl(), nPrevUri = getPrevUri();
        if (nPrevUri !== prevUri) { prevUri = nPrevUri; prevUrl = nPrev; setSlot(prevSlot, prevUrl); }
    };
    const checkVideoVisible = () => {
        const portal = document.querySelector(VIDEO_SEL) as HTMLElement | null;
        if (!portal || !portal.querySelector('video')) return false;
        const cs = getComputedStyle(portal);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    const checkCanvasVisible = () => {
        const el = document.querySelector(CANVAS_SEL) as HTMLElement | null;
        if (hasMountedCanvasMedia(el)) {
            const cs = getComputedStyle(el as HTMLElement);
            if (cs.display !== 'none' && cs.visibility !== 'hidden') return true;
        }
        return checkVideoVisible();
    };
    const inCanvasGrace = () => (Date.now() - lastCanvasOffAt) < POST_CANVAS_GRACE;

    const UNCLIP_CLASS = 'cs-unclip';
    const UNCLIP_BOTH_CLASS = 'cs-unclip-both';
    let unclipped: HTMLElement[] = [];

    // Lets travelling covers paint past Spotify's clipping wrappers without making them scroll.
    const unclipAncestors = (from: HTMLElement) => {
        clearUnclipped();
        const stop = document.querySelector(SIDEBAR_SEL);
        for (let el: HTMLElement | null = from; el && el !== stop; el = el.parentElement) {
            const cs = getComputedStyle(el);
            if (cs.overflowX === 'visible') continue;
            el.classList.add(UNCLIP_CLASS);
            if (!/auto|scroll/.test(cs.overflowY)) el.classList.add(UNCLIP_BOTH_CLASS);
            unclipped.push(el);
        }
    };

    const clearUnclipped = () => {
        for (const el of unclipped) el.classList.remove(UNCLIP_CLASS, UNCLIP_BOTH_CLASS);
        unclipped = [];
    };

    const mount = (container: HTMLElement) => {
        if (track) return;
        mountedContainer = container;
        origPosition = container.style.position;
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        track = document.createElement('div');
        track.id = TRACK_ID;
        clip = document.createElement('div');
        clip.className = 'cs-clip';
        prevSlot    = Object.assign(document.createElement('div'), { className: 'cs-slot cs-prev' });
        currentSlot = Object.assign(document.createElement('div'), { className: 'cs-slot cs-current' });
        nextSlot    = Object.assign(document.createElement('div'), { className: 'cs-slot cs-next' });
        for (const slot of [prevSlot, currentSlot, nextSlot]) {
            slot.appendChild(Object.assign(document.createElement('div'), { className: 'cs-face' }));
        }
        clip.append(prevSlot, currentSlot, nextSlot);
        track.appendChild(clip);
        container.appendChild(track);
        unclipAncestors(container);

        currentUrl = getCurrentCoverUrl();
        currentUri = getCurrentUri();
        prevUrl = getPrevCoverUrl();
        prevUri = getPrevUri();
        nextUrl = getNextCoverUrl();
        nextUri = getNextUri();
        setSlot(prevSlot, prevUrl);
        setSlot(currentSlot, currentUrl);
        setSlot(nextSlot, nextUrl);

        canvasVisible = checkCanvasVisible();
        if (canvasVisible) {
            track.classList.add('cs-hidden');
            track.style.display = 'none';
            container.style.position = origPosition;
        }
        canvasPoll = setInterval(updateCanvasState, 150);
        canvasObserver = new MutationObserver(() => updateCanvasState());
        canvasObserver.observe(container, { childList: true, subtree: true });

        const nextCard = document.querySelector('#liquify-next-song-card');
        if (nextCard) {
            nextObserver = new MutationObserver(() => {
                if (animating) return;
                refreshAdjacent();
            });
            nextObserver.observe(nextCard, {
                attributes: true, attributeFilter: ['src', 'style'],
                subtree: true, childList: true,
            });
        }
    };

    const unmount = () => {
        if (!track) return;
        if (canvasPoll) clearInterval(canvasPoll); canvasPoll = null;
        if (revealTimer) clearTimeout(revealTimer); revealTimer = null;
        nextObserver?.disconnect(); nextObserver = null;
        canvasObserver?.disconnect(); canvasObserver = null;
        track.remove();
        if (mountedContainer && document.body.contains(mountedContainer)) {
            mountedContainer.style.position = origPosition;
        }
        track = clip = prevSlot = currentSlot = nextSlot = null;
        mountedContainer = null;
        animating = false;
        canvasVisible = false;
        clearUnclipped();
    };

    const hideTrackForCanvas = () => {
        if (!track) return;
        if (animating) {
            setTimeout(() => { if (canvasVisible) hideTrackForCanvas(); }, TOTAL);
            return;
        }
        const r = track.getBoundingClientRect();
        track.style.position = 'fixed';
        track.style.inset = 'auto';
        track.style.left = `${r.left}px`;
        track.style.top = `${r.top}px`;
        track.style.width = `${r.width}px`;
        track.style.height = `${r.height}px`;
        if (mountedContainer) mountedContainer.style.position = origPosition;
        track.classList.add('cs-hidden');
        setTimeout(() => {
            if (!track || !canvasVisible) return;
            track.style.display = 'none';
        }, CANVAS_FADE + 50);
    };

    const revealTrackAfterCanvas = () => {
        if (!track) return;
        lastCanvasOffAt = Date.now();
        if (mountedContainer) mountedContainer.style.position = 'relative';
        track.style.position = '';
        track.style.inset = '';
        track.style.left = '';
        track.style.top = '';
        track.style.width = '';
        track.style.height = '';
        syncFromTruth();
        track.style.display = '';
        void track.offsetWidth;
        requestAnimationFrame(() => {
            if (track && !canvasVisible) track.classList.remove('cs-hidden');
        });
        [50, 200, 450].forEach(d => setTimeout(() => {
            if (!track || canvasVisible || animating) return;
            syncFromTruth();
        }, d));
    };

    const updateCanvasState = () => {
        if (!track) return;
        const visible = checkCanvasVisible();

        if (visible) {
            if (revealTimer) { clearTimeout(revealTimer); revealTimer = null; }
            if (canvasVisible) return;
            canvasVisible = true;
            hideTrackForCanvas();
        } else {
            if (!canvasVisible || revealTimer) return;
            revealTimer = setTimeout(() => {
                revealTimer = null;
                if (!track || checkCanvasVisible()) return;
                canvasVisible = false;
                revealTrackAfterCanvas();
            }, CANVAS_GAP_GRACE);
        }
    };

    const swipe = (dir: 'next' | 'prev') => {
        if (!track || animating || canvasVisible) return;

        const truthUri = getCurrentUri();
        const truthUrl = getCurrentCoverUrl();
        if (truthUri && truthUri !== currentUri) {
            currentUri = truthUri;
            currentUrl = truthUrl;
            setSlot(currentSlot, currentUrl);
            prevUri = getPrevUri(); prevUrl = getPrevCoverUrl();
            nextUri = getNextUri(); nextUrl = getNextCoverUrl();
            setSlot(prevSlot, prevUrl);
            setSlot(nextSlot, nextUrl);
        }

        if (dir === 'prev' && !prevUri && !prevUrl) return;
        animating = true;

        if (dir === 'next') {
            const fresh = getNextCoverUrl(), freshUri = getNextUri();
            if (fresh) { nextUrl = fresh; nextUri = freshUri; setSlot(nextSlot, nextUrl); }
        } else {
            const fresh = getPrevCoverUrl(), freshUri = getPrevUri();
            if (fresh) { prevUrl = fresh; prevUri = freshUri; setSlot(prevSlot, prevUrl); }
        }

        track.classList.add('cs-animating', dir === 'next' ? 'cs-going-next' : 'cs-going-prev');

        setTimeout(() => {
            if (!track) return;
            if (dir === 'next') {
                prevUrl = currentUrl; prevUri = currentUri;
                currentUrl = nextUrl; currentUri = nextUri;
            } else {
                nextUrl = currentUrl; nextUri = currentUri;
                currentUrl = prevUrl; currentUri = prevUri;
            }
            setSlot(prevSlot, prevUrl);
            setSlot(currentSlot, currentUrl);
            setSlot(nextSlot, nextUrl);

            void track.offsetWidth;
            track.classList.remove('cs-animating', 'cs-going-next', 'cs-going-prev');
            animating = false;

            setTimeout(() => {
                if (!track) return;
                refreshAdjacent();
            }, 150);
        }, TOTAL + 20);
    };

    const swipeWithKnownTarget = (dir: 'next' | 'prev', newUrl: string, newUri: string) => {
        if (!track || animating || canvasVisible) return;
        animating = true;

        if (dir === 'next') {
            nextUrl = newUrl; nextUri = newUri; setSlot(nextSlot, nextUrl);
        } else {
            prevUrl = newUrl; prevUri = newUri; setSlot(prevSlot, prevUrl);
        }

        track.classList.add('cs-animating', dir === 'next' ? 'cs-going-next' : 'cs-going-prev');

        setTimeout(() => {
            if (!track) return;
            if (dir === 'next') {
                prevUrl = currentUrl; prevUri = currentUri;
                currentUrl = newUrl; currentUri = newUri;
            } else {
                nextUrl = currentUrl; nextUri = currentUri;
                currentUrl = newUrl; currentUri = newUri;
            }
            setSlot(prevSlot, prevUrl);
            setSlot(currentSlot, currentUrl);
            setSlot(nextSlot, nextUrl);

            void track.offsetWidth;
            track.classList.remove('cs-animating', 'cs-going-next', 'cs-going-prev');
            animating = false;

            setTimeout(() => {
                if (!track) return;
                refreshAdjacent();
            }, 150);
        }, TOTAL + 20);
    };

    const crossfadeToNew = (newUrl: string, newUri: string) => {
        if (!track || !clip || animating || canvasVisible) return;
        animating = true;

        const overlay = document.createElement('div');
        overlay.className = 'cs-fade-overlay';
        overlay.style.backgroundImage = `url("${sharp(newUrl)}")`;
        ((currentSlot?.querySelector('.cs-face') as HTMLElement | null) || clip).appendChild(overlay);

        void overlay.offsetWidth;
        overlay.classList.add('cs-fade-in');

        setTimeout(() => {
            if (!track) { overlay.remove(); animating = false; return; }
            prevUrl = currentUrl; prevUri = currentUri;
            currentUrl = newUrl; currentUri = newUri;
            setSlot(currentSlot, currentUrl);
            overlay.remove();
            nextUri = getNextUri();
            nextUrl = getNextCoverUrl();
            const freshPrev = getPrevCoverUrl();
            const freshPrevUri = getPrevUri();
            if (freshPrev || freshPrevUri) { prevUrl = freshPrev; prevUri = freshPrevUri; }
            setSlot(prevSlot, prevUrl);
            setSlot(nextSlot, nextUrl);
            animating = false;
        }, FADE + 30);
    };

    const markManualSkip = () => {
        manualSkipPending = true;
        if (manualSkipTimer) clearTimeout(manualSkipTimer);
        manualSkipTimer = setTimeout(() => { manualSkipPending = false; }, 1500);
    };

    const tryBack = () => {
        const progress = SpotiKit.Player?.position;
        if (typeof progress === 'number' && progress >= SAME_SONG_THRESHOLD) return;
        if (!prevUri && !prevUrl) return;
        markManualSkip();
        swipe('prev');
    };

    const onPointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-testid="control-button-skip-forward"]')) {
            markManualSkip();
            swipe('next');
        } else if (target?.closest('[data-testid="control-button-skip-back"]')) {
            tryBack();
        }
    };
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'ArrowRight') {
            markManualSkip();
            swipe('next');
        } else if (e.ctrlKey && e.key === 'ArrowLeft') {
            tryBack();
        }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);

    const onSongChange = () => {
        if (!track) return;

        if (manualSkipPending) {
            manualSkipPending = false;
            if (manualSkipTimer) clearTimeout(manualSkipTimer);
            return;
        }

        if (animating) return;
        if (canvasVisible) return;
        if (inCanvasGrace()) {
            setTimeout(() => { if (track && !canvasVisible && !animating) syncFromTruth(); }, 200);
            return;
        }

        setTimeout(() => {
            if (!track || canvasVisible || animating) return;
            const freshUri = getCurrentUri();
            const fresh = getCurrentCoverUrl();
            if (!freshUri || freshUri === currentUri) {
                refreshAdjacent();
                return;
            }
            if (freshUri === nextUri) {
                swipeWithKnownTarget('next', fresh, freshUri);
            } else if (freshUri === prevUri) {
                swipeWithKnownTarget('prev', fresh, freshUri);
            } else {
                crossfadeToNew(fresh, freshUri);
            }
        }, 80);
    };

    let origNext: any, origPrevious: any;
    const player = SpotiKit.Player;
    if (player && typeof player.next === 'function' && typeof player.previous === 'function') {
        origNext = player.next.bind(player);
        origPrevious = player.previous.bind(player);
        player.next = (...a: any[]) => { markManualSkip(); swipe('next'); return origNext(...a); };
        player.previous = (...a: any[]) => { tryBack(); return origPrevious(...a); };
        player.on?.('track', onSongChange);
    }

    let noQueueSince = 0;
    const QUEUE_GRACE = 1500;

    const cinemaPoll = setInterval(() => {
        const cinemaActive = !!document.querySelector(CINEMA_SEL);
        const container = document.querySelector(CONTAINER_SEL) as HTMLElement | null;

        const queueOk = !!getNextItem();
        if (queueOk) noQueueSince = 0;
        else if (noQueueSince === 0) noQueueSince = Date.now();
        const queueGone = !queueOk && noQueueSince !== 0 && (Date.now() - noQueueSince) >= QUEUE_GRACE;

        const shouldMount = !cinemaActive && !!container && !queueGone && getNpvCoverAnim() === 'swipe';

        if (!shouldMount && track) {
            unmount();
        } else if (shouldMount && !track) {
            mount(container);
        } else if (track && container && !container.contains(track)) {
            unmount();
            mount(container);
        }
    }, 200);

    anyWin.__coverSwipeOff = () => {
        document.removeEventListener('pointerdown', onPointerDown, true);
        document.removeEventListener('keydown', onKeyDown, true);
        clearInterval(cinemaPoll);
        if (manualSkipTimer) clearTimeout(manualSkipTimer);
        unmount();
        if (player) {
            player.off?.('track', onSongChange);
            if (origNext) player.next = origNext;
            if (origPrevious) player.previous = origPrevious;
        }
        document.getElementById(STYLE_ID)?.remove();
        delete anyWin.__coverSwipeOff;
    };
  })();
}
