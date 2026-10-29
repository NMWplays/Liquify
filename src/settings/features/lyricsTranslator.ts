export
function installLyricsTranslator() {
  const STORAGE_KEY = "liquify-lyrics-mode";
  const LYRIC_LINE = ".lyrics-line";
  const LYRIC_TEXT = ".lyrics-line-text";
  const LYRIC_ACTIVE_CLASS = "lyrics-line--active";
  const CACHE = new Map<string, Promise<any>>();
  const RESOLVED = new Map<string, any>();
  const LANG = (SpotiKit.Locale?.language || navigator.language || "en").split("-")[0];
  let mode = localStorage.getItem(STORAGE_KEY) || "romanization";

  const getFlags = (m: string) => {
    const showTranslation = m === "translation" || m === "both";
    const showRoman = m === "romanization" || m === "both";
    return { showTranslation, showRoman };
  };

  let wanakanaLoadPromise: Promise<boolean> | null = null;
  const ensureWanakana = async () => {
    const anyWin = window as any;
    if (anyWin.wanakana) return true;
    if (wanakanaLoadPromise) return wanakanaLoadPromise;
    wanakanaLoadPromise = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/wanakana@4.0.2/umd/wanakana.min.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
    return wanakanaLoadPromise;
  };

  const extractGoogleRomanization = (d: any) => {
    const parts = Array.isArray(d?.[0]) ? d[0] : [];
    for (const part of parts) {
      if (!Array.isArray(part) || part.length < 4) continue;
      const candidate = part[3];
      if (part[0] == null && part[1] == null && part[2] == null && typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
    return "";
  };

  const stripCjk = (s: string) => {
    if (!s) return "";
    return String(s)
      .replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g, "")
      .replace(/[\u3040-\u30FF\u31F0-\u31FF\uFF65-\uFF9F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const translate = async (text: string) => {
    if (text.includes("♪")) return { translated: text, detected: LANG, roman: "" };
    if (!CACHE.has(text)) {
      CACHE.set(
        text,
        (async () => {
          try {
            const { showTranslation, showRoman } = getFlags(mode);
            const dt = [];
            if (showTranslation) dt.push("t"); else dt.push("t");
            if (showRoman) dt.push("rm");
            const dtQuery = dt.map((x) => `dt=${x}`).join("&");
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${LANG}&${dtQuery}&q=${encodeURIComponent(text)}`;
            const r = await fetch(url);
            const d = await r.json();
            const detectedLang = (typeof d?.[2] === "string" ? d[2] : typeof d?.[1] === "string" ? d[1] : LANG) || LANG;
            const translated = showTranslation && Array.isArray(d?.[0]) ? d[0].map((x: any) => x?.[0] ?? "").join("") : text;
            let roman = "";
            if (showRoman) {
              const detectedLc = String(detectedLang).toLowerCase();
              if (detectedLc.startsWith("ja")) {
                roman = stripCjk(extractGoogleRomanization(d));
                if (!roman) {
                  await ensureWanakana();
                  const anyWin = window as any;
                  if (anyWin.wanakana) roman = stripCjk(anyWin.wanakana.toRomaji(text));
                }
              } else if (detectedLc.startsWith("zh")) {
                roman = stripCjk(extractGoogleRomanization(d));
              }
            }
            const result = { translated, detected: detectedLang, roman };
            RESOLVED.set(text, result);
            return result;
          } catch (e) {
            console.error("Translate failed:", e);
            return { translated: text, detected: LANG, roman: "" };
          }
        })()
      );
    }
    return CACHE.get(text);
  };

  const removeAllContainers = () => {
    try {
      document.querySelectorAll(".sp-lyric-translation").forEach((el) => el.remove());
    } catch {}
  };

  const applyToContainer = (container: HTMLElement, translated: string, detected: string, roman: string) => {
    const { showTranslation, showRoman } = getFlags(mode);
    const detectedLc = String(detected || "").toLowerCase();
    const tEl = container.querySelector(".sp-lyric-translation-text") as HTMLElement | null;
    const rEl = container.querySelector(".sp-lyric-translation-roman") as HTMLElement | null;
    if (tEl) tEl.innerText = showTranslation && detectedLc !== LANG.toLowerCase() ? translated || "" : "";
    if (rEl) rEl.innerText = showRoman ? roman || "" : "";
    if (tEl) tEl.style.display = showTranslation && detectedLc !== LANG.toLowerCase() ? "block" : "none";
    if (rEl) rEl.style.display = showRoman && !!(roman || "").trim() ? "block" : "none";
    const anyVisible = (tEl && tEl.style.display !== "none" && !!tEl.innerText.trim()) || (rEl && rEl.style.display !== "none" && !!rEl.innerText.trim());
    (container as HTMLElement).style.display = anyVisible ? "block" : "none";
  };

  let observer: MutationObserver | null = null;
  let processing = false;
  let rerunRequested = false;
  let scheduled = false;
  const processLyrics = async () => {
    if (mode === "off") return;
    if (processing) {
      rerunRequested = true;
      return;
    }
    processing = true;
    const { showTranslation, showRoman } = getFlags(mode);
    const parents = document.querySelectorAll(LYRIC_LINE);
    const jobs: Promise<any>[] = [];
    for (const parent of Array.from(parents)) {
      const textEl = parent.querySelector(LYRIC_TEXT);
      if (!textEl) continue;
      const text = (textEl.textContent || "").trim();
      if (!text) continue;
      if (text.includes("♪")) {
        const existing = parent.querySelector(".sp-lyric-translation");
        if (existing) {
          try { existing.remove(); } catch {}
        }
        continue;
      }
      let container = parent.querySelector(".sp-lyric-translation") as HTMLElement | null;
      if (!container) {
        container = document.createElement("div");
        container.className = "sp-lyric-translation";
        container.setAttribute("aria-hidden", "true");
        container.style.display = "none";
        const tspan = document.createElement("div");
        tspan.className = "sp-lyric-translation-text";
        Object.assign(tspan.style, { fontSize: "0.65em", lineHeight: "1.1em", marginTop: "2px", pointerEvents: "none", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere" });
        const rspan = document.createElement("div");
        rspan.className = "sp-lyric-translation-roman";
        Object.assign(rspan.style, { fontSize: "0.55em", lineHeight: "1em", marginTop: "2px", pointerEvents: "none", fontStyle: "italic", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere" });
        container.appendChild(tspan);
        container.appendChild(rspan);
        parent.appendChild(container);
      }
      const active = parent.classList.contains(LYRIC_ACTIVE_CLASS);
      const color = active ? "var(--lyrics-color-active)" : "var(--lyrics-color-inactive)";
      const tEl = container.querySelector(".sp-lyric-translation-text") as HTMLElement | null;
      const rEl = container.querySelector(".sp-lyric-translation-roman") as HTMLElement | null;
      if (tEl) tEl.style.color = color;
      if (rEl) rEl.style.color = color;
      if (!showTranslation && !showRoman) {
        container.style.display = "none";
        continue;
      }
      if (!container.dataset.translated) {
        const cached = RESOLVED.get(text);
        if (cached) {
          applyToContainer(container, cached.translated, cached.detected, cached.roman);
          container.dataset.translated = "1";
          container.dataset.detected = cached.detected || "";
        }
      }
      if (!container.dataset.translated && !container.dataset.translating) {
        container.dataset.translating = "1";
        jobs.push(
          (async () => {
            const { translated, detected, roman } = await translate(text);
            applyToContainer(container!, translated, detected, roman);
            container!.dataset.translated = "1";
            container!.dataset.detected = detected || "";
            delete container!.dataset.translating;
          })()
        );
      }
    }
    await Promise.all(jobs.map((p) => p.then(() => null, () => null)));
    processing = false;
    if (rerunRequested) {
      rerunRequested = false;
      scheduleProcessLyrics();
    }
  };

  const scheduleProcessLyrics = () => {
    if (mode === "off") return;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      void processLyrics();
    });
  };

  const start = () => {
    if (observer) return;
    observer = new MutationObserver(() => scheduleProcessLyrics());
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    scheduleProcessLyrics();
  };

  const stop = () => {
    try { observer?.disconnect(); } catch {}
    observer = null;
    processing = false;
    rerunRequested = false;
    scheduled = false;
    removeAllContainers();
  };

  const setMode = (next: string) => {
    const prev = mode;
    mode = next;
    if (prev !== next) {
      CACHE.clear();
      RESOLVED.clear();
    }
    localStorage.setItem(STORAGE_KEY, next);
    if (next === "off") stop();
    else {
      try {
        document.querySelectorAll(".sp-lyric-translation").forEach((el) => {
          delete (el as any).dataset.translated;
          delete (el as any).dataset.translating;
        });
      } catch {}
      start();
      scheduleProcessLyrics();
    }
  };

  if (mode !== "off") start();
  window.addEventListener("liquifyLyricsModeChange", () => {
    const next = localStorage.getItem(STORAGE_KEY) || "romanization";
    setMode(next);
  });
  return { setMode, start, stop, getMode: () => mode };
}

