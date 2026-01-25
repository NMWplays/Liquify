"use strict";
(() => {
  // Extensions/_src/react-shim.ts
  function getReact() {
    var _a;
    return ((_a = window == null ? void 0 : window.Spicetify) == null ? void 0 : _a.React) || (window == null ? void 0 : window.React);
  }
  function requireReact() {
    const R2 = getReact();
    if (!R2) throw new Error("Spicetify.React is not ready yet");
    return R2;
  }
  var ReactFacade = {
    // Safe fallbacks during module init
    memo(component, compare) {
      const R2 = getReact();
      return (R2 == null ? void 0 : R2.memo) ? R2.memo(component, compare) : component;
    },
    forwardRef(render) {
      const R2 = getReact();
      return (R2 == null ? void 0 : R2.forwardRef) ? R2.forwardRef(render) : render;
    },
    // Most other APIs are only used at render time; require React then.
    createElement(...args) {
      return requireReact().createElement(...args);
    },
    get Fragment() {
      var _a;
      return ((_a = getReact()) == null ? void 0 : _a.Fragment) || ((props) => props == null ? void 0 : props.children);
    }
  };
  var react_shim_default = ReactFacade;
  function useState(initial) {
    return requireReact().useState(initial);
  }
  function useEffect(effect, deps) {
    return requireReact().useEffect(effect, deps);
  }
  function useLayoutEffect(effect, deps) {
    const R2 = requireReact();
    return (R2.useLayoutEffect || R2.useEffect)(effect, deps);
  }
  function useMemo(factory, deps) {
    return requireReact().useMemo(factory, deps);
  }
  function useRef(initial) {
    return requireReact().useRef(initial);
  }
  function useCallback(fn, deps) {
    return requireReact().useCallback(fn, deps);
  }

  // node_modules/react-colorful/dist/index.mjs
  function u() {
    return (u = Object.assign || function(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = arguments[r];
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
      }
      return e;
    }).apply(this, arguments);
  }
  function c(e, r) {
    if (null == e) return {};
    var t, n, o = {}, a = Object.keys(e);
    for (n = 0; n < a.length; n++) r.indexOf(t = a[n]) >= 0 || (o[t] = e[t]);
    return o;
  }
  function i(e) {
    var t = useRef(e), n = useRef(function(e2) {
      t.current && t.current(e2);
    });
    return t.current = e, n.current;
  }
  var s = function(e, r, t) {
    return void 0 === r && (r = 0), void 0 === t && (t = 1), e > t ? t : e < r ? r : e;
  };
  var f = function(e) {
    return "touches" in e;
  };
  var v = function(e) {
    return e && e.ownerDocument.defaultView || self;
  };
  var d = function(e, r, t) {
    var n = e.getBoundingClientRect(), o = f(r) ? (function(e2, r2) {
      for (var t2 = 0; t2 < e2.length; t2++) if (e2[t2].identifier === r2) return e2[t2];
      return e2[0];
    })(r.touches, t) : r;
    return { left: s((o.pageX - (n.left + v(e).pageXOffset)) / n.width), top: s((o.pageY - (n.top + v(e).pageYOffset)) / n.height) };
  };
  var h = function(e) {
    !f(e) && e.preventDefault();
  };
  var m = react_shim_default.memo(function(o) {
    var a = o.onMove, l = o.onKey, s2 = c(o, ["onMove", "onKey"]), m2 = useRef(null), g2 = i(a), p2 = i(l), b2 = useRef(null), _2 = useRef(false), x2 = useMemo(function() {
      var e = function(e2) {
        h(e2), (f(e2) ? e2.touches.length > 0 : e2.buttons > 0) && m2.current ? g2(d(m2.current, e2, b2.current)) : t(false);
      }, r = function() {
        return t(false);
      };
      function t(t2) {
        var n = _2.current, o2 = v(m2.current), a2 = t2 ? o2.addEventListener : o2.removeEventListener;
        a2(n ? "touchmove" : "mousemove", e), a2(n ? "touchend" : "mouseup", r);
      }
      return [function(e2) {
        var r2 = e2.nativeEvent, n = m2.current;
        if (n && (h(r2), !(function(e3, r3) {
          return r3 && !f(e3);
        })(r2, _2.current) && n)) {
          if (f(r2)) {
            _2.current = true;
            var o2 = r2.changedTouches || [];
            o2.length && (b2.current = o2[0].identifier);
          }
          n.focus(), g2(d(n, r2, b2.current)), t(true);
        }
      }, function(e2) {
        var r2 = e2.which || e2.keyCode;
        r2 < 37 || r2 > 40 || (e2.preventDefault(), p2({ left: 39 === r2 ? 0.05 : 37 === r2 ? -0.05 : 0, top: 40 === r2 ? 0.05 : 38 === r2 ? -0.05 : 0 }));
      }, t];
    }, [p2, g2]), C2 = x2[0], E = x2[1], H = x2[2];
    return useEffect(function() {
      return H;
    }, [H]), react_shim_default.createElement("div", u({}, s2, { onTouchStart: C2, onMouseDown: C2, className: "react-colorful__interactive", ref: m2, onKeyDown: E, tabIndex: 0, role: "slider" }));
  });
  var g = function(e) {
    return e.filter(Boolean).join(" ");
  };
  var p = function(r) {
    var t = r.color, n = r.left, o = r.top, a = void 0 === o ? 0.5 : o, l = g(["react-colorful__pointer", r.className]);
    return react_shim_default.createElement("div", { className: l, style: { top: 100 * a + "%", left: 100 * n + "%" } }, react_shim_default.createElement("div", { className: "react-colorful__pointer-fill", style: { backgroundColor: t } }));
  };
  var b = function(e, r, t) {
    return void 0 === r && (r = 0), void 0 === t && (t = Math.pow(10, r)), Math.round(t * e) / t;
  };
  var _ = { grad: 0.9, turn: 360, rad: 360 / (2 * Math.PI) };
  var x = function(e) {
    return L(C(e));
  };
  var C = function(e) {
    return "#" === e[0] && (e = e.substring(1)), e.length < 6 ? { r: parseInt(e[0] + e[0], 16), g: parseInt(e[1] + e[1], 16), b: parseInt(e[2] + e[2], 16), a: 4 === e.length ? b(parseInt(e[3] + e[3], 16) / 255, 2) : 1 } : { r: parseInt(e.substring(0, 2), 16), g: parseInt(e.substring(2, 4), 16), b: parseInt(e.substring(4, 6), 16), a: 8 === e.length ? b(parseInt(e.substring(6, 8), 16) / 255, 2) : 1 };
  };
  var w = function(e) {
    return K(I(e));
  };
  var y = function(e) {
    var r = e.s, t = e.v, n = e.a, o = (200 - r) * t / 100;
    return { h: b(e.h), s: b(o > 0 && o < 200 ? r * t / 100 / (o <= 100 ? o : 200 - o) * 100 : 0), l: b(o / 2), a: b(n, 2) };
  };
  var q = function(e) {
    var r = y(e);
    return "hsl(" + r.h + ", " + r.s + "%, " + r.l + "%)";
  };
  var I = function(e) {
    var r = e.h, t = e.s, n = e.v, o = e.a;
    r = r / 360 * 6, t /= 100, n /= 100;
    var a = Math.floor(r), l = n * (1 - t), u2 = n * (1 - (r - a) * t), c2 = n * (1 - (1 - r + a) * t), i2 = a % 6;
    return { r: b(255 * [n, u2, l, l, c2, n][i2]), g: b(255 * [c2, n, n, u2, l, l][i2]), b: b(255 * [l, l, c2, n, n, u2][i2]), a: b(o, 2) };
  };
  var D = function(e) {
    var r = e.toString(16);
    return r.length < 2 ? "0" + r : r;
  };
  var K = function(e) {
    var r = e.r, t = e.g, n = e.b, o = e.a, a = o < 1 ? D(b(255 * o)) : "";
    return "#" + D(r) + D(t) + D(n) + a;
  };
  var L = function(e) {
    var r = e.r, t = e.g, n = e.b, o = e.a, a = Math.max(r, t, n), l = a - Math.min(r, t, n), u2 = l ? a === r ? (t - n) / l : a === t ? 2 + (n - r) / l : 4 + (r - t) / l : 0;
    return { h: b(60 * (u2 < 0 ? u2 + 6 : u2)), s: b(a ? l / a * 100 : 0), v: b(a / 255 * 100), a: o };
  };
  var S = react_shim_default.memo(function(r) {
    var t = r.hue, n = r.onChange, o = g(["react-colorful__hue", r.className]);
    return react_shim_default.createElement("div", { className: o }, react_shim_default.createElement(m, { onMove: function(e) {
      n({ h: 360 * e.left });
    }, onKey: function(e) {
      n({ h: s(t + 360 * e.left, 0, 360) });
    }, "aria-label": "Hue", "aria-valuenow": b(t), "aria-valuemax": "360", "aria-valuemin": "0" }, react_shim_default.createElement(p, { className: "react-colorful__hue-pointer", left: t / 360, color: q({ h: t, s: 100, v: 100, a: 1 }) })));
  });
  var T = react_shim_default.memo(function(r) {
    var t = r.hsva, n = r.onChange, o = { backgroundColor: q({ h: t.h, s: 100, v: 100, a: 1 }) };
    return react_shim_default.createElement("div", { className: "react-colorful__saturation", style: o }, react_shim_default.createElement(m, { onMove: function(e) {
      n({ s: 100 * e.left, v: 100 - 100 * e.top });
    }, onKey: function(e) {
      n({ s: s(t.s + 100 * e.left, 0, 100), v: s(t.v - 100 * e.top, 0, 100) });
    }, "aria-label": "Color", "aria-valuetext": "Saturation " + b(t.s) + "%, Brightness " + b(t.v) + "%" }, react_shim_default.createElement(p, { className: "react-colorful__saturation-pointer", top: 1 - t.v / 100, left: t.s / 100, color: q(t) })));
  });
  var F = function(e, r) {
    if (e === r) return true;
    for (var t in e) if (e[t] !== r[t]) return false;
    return true;
  };
  var X = function(e, r) {
    return e.toLowerCase() === r.toLowerCase() || F(C(e), C(r));
  };
  function Y(e, t, l) {
    var u2 = i(l), c2 = useState(function() {
      return e.toHsva(t);
    }), s2 = c2[0], f2 = c2[1], v2 = useRef({ color: t, hsva: s2 });
    useEffect(function() {
      if (!e.equal(t, v2.current.color)) {
        var r = e.toHsva(t);
        v2.current = { hsva: r, color: t }, f2(r);
      }
    }, [t, e]), useEffect(function() {
      var r;
      F(s2, v2.current.hsva) || e.equal(r = e.fromHsva(s2), v2.current.color) || (v2.current = { hsva: s2, color: r }, u2(r));
    }, [s2, e, u2]);
    var d2 = useCallback(function(e2) {
      f2(function(r) {
        return Object.assign({}, r, e2);
      });
    }, []);
    return [s2, d2];
  }
  var R;
  var V = "undefined" != typeof window ? useLayoutEffect : useEffect;
  var $ = function() {
    return R || ("undefined" != typeof __webpack_nonce__ ? __webpack_nonce__ : void 0);
  };
  var J = /* @__PURE__ */ new Map();
  var Q = function(e) {
    V(function() {
      var r = e.current ? e.current.ownerDocument : document;
      if (void 0 !== r && !J.has(r)) {
        var t = r.createElement("style");
        t.innerHTML = `.react-colorful{position:relative;display:flex;flex-direction:column;width:200px;height:200px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:default}.react-colorful__saturation{position:relative;flex-grow:1;border-color:transparent;border-bottom:12px solid #000;border-radius:8px 8px 0 0;background-image:linear-gradient(0deg,#000,transparent),linear-gradient(90deg,#fff,hsla(0,0%,100%,0))}.react-colorful__alpha-gradient,.react-colorful__pointer-fill{content:"";position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;border-radius:inherit}.react-colorful__alpha-gradient,.react-colorful__saturation{box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}.react-colorful__alpha,.react-colorful__hue{position:relative;height:24px}.react-colorful__hue{background:linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red)}.react-colorful__last-control{border-radius:0 0 8px 8px}.react-colorful__interactive{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:inherit;outline:none;touch-action:none}.react-colorful__pointer{position:absolute;z-index:1;box-sizing:border-box;width:28px;height:28px;transform:translate(-50%,-50%);background-color:#fff;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,.2)}.react-colorful__interactive:focus .react-colorful__pointer{transform:translate(-50%,-50%) scale(1.1)}.react-colorful__alpha,.react-colorful__alpha-pointer{background-color:#fff;background-image:url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill-opacity=".05"><path d="M8 0h8v8H8zM0 8h8v8H0z"/></svg>')}.react-colorful__saturation-pointer{z-index:3}.react-colorful__hue-pointer{z-index:2}`, J.set(r, t);
        var n = $();
        n && t.setAttribute("nonce", n), r.head.appendChild(t);
      }
    }, []);
  };
  var U = function(t) {
    var n = t.className, o = t.colorModel, a = t.color, l = void 0 === a ? o.defaultColor : a, i2 = t.onChange, s2 = c(t, ["className", "colorModel", "color", "onChange"]), f2 = useRef(null);
    Q(f2);
    var v2 = Y(o, l, i2), d2 = v2[0], h2 = v2[1], m2 = g(["react-colorful", n]);
    return react_shim_default.createElement("div", u({}, s2, { ref: f2, className: m2 }), react_shim_default.createElement(T, { hsva: d2, onChange: h2 }), react_shim_default.createElement(S, { hue: d2.h, onChange: h2, className: "react-colorful__last-control" }));
  };
  var W = { defaultColor: "000", toHsva: x, fromHsva: function(e) {
    return w({ h: e.h, s: e.s, v: e.v, a: 1 });
  }, equal: X };
  var Z = function(r) {
    return react_shim_default.createElement(U, u({}, r, { colorModel: W }));
  };

  // Extensions/_src/liquify-settings.tsx
  function installLyricsTranslator() {
    var _a, _b;
    const STORAGE_KEY = "glowify-lyrics-mode";
    const CACHE = /* @__PURE__ */ new Map();
    const RESOLVED = /* @__PURE__ */ new Map();
    const LANG = (((_b = (_a = Spicetify == null ? void 0 : Spicetify.Platform) == null ? void 0 : _a.Session) == null ? void 0 : _b.locale) || navigator.language || "en").split("-")[0];
    let mode = localStorage.getItem(STORAGE_KEY) || "romanization";
    const getFlags = (m2) => {
      const showTranslation = m2 === "translation" || m2 === "both";
      const showRoman = m2 === "romanization" || m2 === "both";
      return { showTranslation, showRoman };
    };
    let wanakanaLoadPromise = null;
    const ensureWanakana = async () => {
      const anyWin = window;
      if (anyWin.wanakana) return true;
      if (wanakanaLoadPromise) return wanakanaLoadPromise;
      wanakanaLoadPromise = new Promise((resolve) => {
        const s2 = document.createElement("script");
        s2.src = "https://cdn.jsdelivr.net/npm/wanakana@4.0.2/umd/wanakana.min.js";
        s2.onload = () => resolve(true);
        s2.onerror = () => resolve(false);
        document.head.appendChild(s2);
      });
      return wanakanaLoadPromise;
    };
    const extractGoogleRomanization = (d2) => {
      const parts = Array.isArray(d2 == null ? void 0 : d2[0]) ? d2[0] : [];
      for (const part of parts) {
        if (!Array.isArray(part) || part.length < 4) continue;
        const candidate = part[3];
        if (part[0] == null && part[1] == null && part[2] == null && typeof candidate === "string" && candidate.trim()) {
          return candidate;
        }
      }
      return "";
    };
    const stripCjk = (s2) => {
      if (!s2) return "";
      return String(s2).replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g, "").replace(/[\u3040-\u30FF\u31F0-\u31FF\uFF65-\uFF9F]/g, "").replace(/\s+/g, " ").trim();
    };
    const translate = async (text) => {
      if (text.includes("\u266A")) return { translated: text, detected: LANG, roman: "" };
      if (!CACHE.has(text)) {
        CACHE.set(
          text,
          (async () => {
            try {
              const { showTranslation, showRoman } = getFlags(mode);
              const dt = [];
              if (showTranslation) dt.push("t");
              else dt.push("t");
              if (showRoman) dt.push("rm");
              const dtQuery = dt.map((x2) => `dt=${x2}`).join("&");
              const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${LANG}&${dtQuery}&q=${encodeURIComponent(text)}`;
              const r = await fetch(url);
              const d2 = await r.json();
              const detectedLang = (typeof (d2 == null ? void 0 : d2[2]) === "string" ? d2[2] : typeof (d2 == null ? void 0 : d2[1]) === "string" ? d2[1] : LANG) || LANG;
              const translated = showTranslation && Array.isArray(d2 == null ? void 0 : d2[0]) ? d2[0].map((x2) => {
                var _a2;
                return (_a2 = x2 == null ? void 0 : x2[0]) != null ? _a2 : "";
              }).join("") : text;
              let roman = "";
              if (showRoman) {
                const detectedLc = String(detectedLang).toLowerCase();
                if (detectedLc.startsWith("ja")) {
                  roman = stripCjk(extractGoogleRomanization(d2));
                  if (!roman) {
                    await ensureWanakana();
                    const anyWin = window;
                    if (anyWin.wanakana) roman = stripCjk(anyWin.wanakana.toRomaji(text));
                  }
                } else if (detectedLc.startsWith("zh")) {
                  roman = stripCjk(extractGoogleRomanization(d2));
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
      } catch (e) {
      }
    };
    const applyToContainer = (container, translated, detected, roman) => {
      const { showTranslation, showRoman } = getFlags(mode);
      const detectedLc = String(detected || "").toLowerCase();
      const tEl = container.querySelector(".sp-lyric-translation-text");
      const rEl = container.querySelector(".sp-lyric-translation-roman");
      if (tEl) tEl.innerText = showTranslation && detectedLc !== LANG.toLowerCase() ? translated || "" : "";
      if (rEl) rEl.innerText = showRoman ? roman || "" : "";
      if (tEl) tEl.style.display = showTranslation && detectedLc !== LANG.toLowerCase() ? "block" : "none";
      if (rEl) rEl.style.display = showRoman && !!(roman || "").trim() ? "block" : "none";
      const anyVisible = tEl && tEl.style.display !== "none" && !!tEl.innerText.trim() || rEl && rEl.style.display !== "none" && !!rEl.innerText.trim();
      container.style.display = anyVisible ? "block" : "none";
    };
    let observer = null;
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
      const parents = document.querySelectorAll(".lyrics-lyricsContent-lyric");
      const jobs = [];
      for (const parent of Array.from(parents)) {
        const textEl = parent.querySelector(".lyrics-lyricsContent-text");
        if (!textEl) continue;
        const text = (textEl.textContent || "").trim();
        if (!text) continue;
        if (text.includes("\u266A")) {
          const existing = parent.querySelector(".sp-lyric-translation");
          if (existing) {
            try {
              existing.remove();
            } catch (e) {
            }
          }
          continue;
        }
        let container = parent.querySelector(".sp-lyric-translation");
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
        const active = parent.classList.contains("lyrics-lyricsContent-active");
        const color = active ? "var(--lyrics-color-active)" : "var(--lyrics-color-inactive)";
        const tEl = container.querySelector(".sp-lyric-translation-text");
        const rEl = container.querySelector(".sp-lyric-translation-roman");
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
              applyToContainer(container, translated, detected, roman);
              container.dataset.translated = "1";
              container.dataset.detected = detected || "";
              delete container.dataset.translating;
            })()
          );
        }
      }
      await Promise.all(jobs.map((p2) => p2.then(() => null, () => null)));
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
      try {
        observer == null ? void 0 : observer.disconnect();
      } catch (e) {
      }
      observer = null;
      processing = false;
      rerunRequested = false;
      scheduled = false;
      removeAllContainers();
    };
    const setMode = (next) => {
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
            delete el.dataset.translated;
            delete el.dataset.translating;
          });
        } catch (e) {
        }
        start();
        scheduleProcessLyrics();
      }
    };
    if (mode !== "off") start();
    window.addEventListener("glowifyLyricsModeChange", () => {
      const next = localStorage.getItem(STORAGE_KEY) || "romanization";
      setMode(next);
    });
    return { setMode, start, stop, getMode: () => mode };
  }
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }
  function readLS(key, fallback) {
    const v2 = localStorage.getItem(key);
    return v2 === null || v2 === "" ? fallback : v2;
  }
  function readNum(key, fallback) {
    const raw = localStorage.getItem(key);
    const parsed = raw === null ? NaN : parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  function ensureStyleTag(id) {
    let s2 = document.getElementById(id);
    if (!s2) {
      s2 = document.createElement("style");
      s2.id = id;
      document.head.appendChild(s2);
    }
    return s2;
  }
  function updateStyle(id, css) {
    ensureStyleTag(id).textContent = css;
  }
  function getOsName() {
    var _a, _b;
    return (((_b = (_a = Spicetify == null ? void 0 : Spicetify.Platform) == null ? void 0 : _a.PlatformData) == null ? void 0 : _b.os_name) || navigator.platform || "").toString().toLowerCase();
  }
  function isUnixLikeOS() {
    const os = getOsName();
    return os.includes("linux") || os.includes("mac") || os.includes("darwin") || os.includes("osx") || os.includes("macos");
  }
  var lastDynamicColor = null;
  function applyAccent(color) {
    document.documentElement.style.setProperty("--spice-button", color);
    document.documentElement.style.setProperty("--spice-button-active", color);
    document.documentElement.style.setProperty("--background-highlight", color);
    document.documentElement.style.setProperty("--glowify-accent", color);
    const css = `
    .AZ6uIUy8_YPogVERteBi:hover .r9ZhqDYZeNTrb4R4Te8W { fill: ${color} !important; }
    .AZ6uIUy8_YPogVERteBi:hover .t_sZQVE189C6jf_gtE_w { fill: ${color} !important; }
    .e-91000-button-primary:hover .e-91000-button-primary__inner { background-color: ${color} !important; }
    .e-91000-button-primary:active .e-91000-button-primary__inner { background-color: ${color} !important; }
    .encore-dark-theme .encore-inverted-light-set { --background-base: ${color} !important; }
    .LegacyChip__LegacyChipComponent-sc-tzfq94-0:hover > .ChipInnerComponent-sm-selected.ChipInnerComponent-sm-selected { background-color: ${color} !important; }
    .button-module__button___hf2qg_marketplace { background-color: ${color} !important; }
    .custom-playing-bar { fill: ${color} !important; }
    .home-visualizer-bar { fill: ${color} !important; }
  `;
    updateStyle("glowify-button-style", css);
    localStorage.setItem("glowify-accent-mode", "custom");
    localStorage.setItem("glowify-custom-color", color);
  }
  function applyDynamicAccent() {
    const dynamicColor = getComputedStyle(document.documentElement).getPropertyValue("--accent-color").trim();
    if (!dynamicColor || dynamicColor === lastDynamicColor) return;
    lastDynamicColor = dynamicColor;
    applyAccent(dynamicColor);
    document.documentElement.style.setProperty("--glowify-dynamic-color", dynamicColor);
    localStorage.setItem("glowify-accent-mode", "dynamic");
  }
  function resetAccentToDefault() {
    document.documentElement.style.setProperty("--spice-button", "");
    document.documentElement.style.setProperty("--spice-button-active", "");
    document.documentElement.style.setProperty("--background-highlight", "");
    document.documentElement.style.setProperty("--glowify-accent", "");
    const css = `
    .AZ6uIUy8_YPogVERteBi:hover .r9ZhqDYZeNTrb4R4Te8W { fill: #3be477; }
    .AZ6uIUy8_YPogVERteBi:hover .t_sZQVE189C6jf_gtE_w { fill: #3be477; }
    .e-91000-button-primary:hover .e-91000-button-primary__inner { background-color: #3be477; }
    .e-91000-button-primary:active .e-91000-button-primary__inner { background-color: #3be477; }
    .encore-dark-theme .encore-inverted-light-set { --background-base: #FFFFFF !important; }
    .LegacyChip__LegacyChipComponent-sc-tzfq94-0:hover > .ChipInnerComponent-sm-selected.ChipInnerComponent-sm-selected { background-color: #f0f0f0 !important; }
    .button-module__button___hf2qg_marketplace { background-color: #FFFFFF !important; }
    .custom-playing-bar { fill: #3be477; }
    .home-visualizer-bar { fill: #3be477; }
  `;
    updateStyle("glowify-button-style", css);
    localStorage.setItem("glowify-accent-mode", "default");
    localStorage.removeItem("glowify-custom-color");
  }
  function applyGlowAccent(color) {
    document.documentElement.style.setProperty("--glowify-glow-accent", color);
    localStorage.setItem("glowify-glow-mode", "custom");
    localStorage.setItem("glowify-glow-color", color);
  }
  function resetGlowAccentToDefault() {
    document.documentElement.style.setProperty("--glowify-glow-accent", "var(--accent-color)");
    localStorage.setItem("glowify-glow-mode", "default");
  }
  async function fileToBase64(file) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  async function applyCustomBackground(file) {
    const img = await fileToBase64(file);
    const tmpImg = new Image();
    tmpImg.src = img;
    await new Promise((r) => {
      tmpImg.onload = () => r();
    });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const maxW = 1920, maxH = 1080;
    let width = tmpImg.width, height = tmpImg.height;
    if (width > maxW) {
      height *= maxW / width;
      width = maxW;
    }
    if (height > maxH) {
      width *= maxH / height;
      height = maxH;
    }
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(tmpImg, 0, 0, width, height);
    const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
    localStorage.setItem("glowify-bg-mode", "custom");
    localStorage.setItem("glowify-bg-image", compressedBase64);
    updateBackground();
  }
  function applySavedBackground() {
    const mode = localStorage.getItem("glowify-bg-mode");
    const image = localStorage.getItem("glowify-bg-image");
    const root = document.querySelector(".Root__top-container");
    if (!root) return;
    if (mode === "custom" && image) root.style.setProperty("--image_url", `url("${image}")`);
  }
  function updateBackground() {
    const mode = localStorage.getItem("glowify-bg-mode") || "dynamic";
    const image = localStorage.getItem("glowify-bg-image");
    const root = document.querySelector(".Root__top-container");
    if (!root) return;
    if (mode === "custom" && image) {
      root.style.setProperty("--image_url", `url("${image}")`);
    } else {
      window.dispatchEvent(new Event("glowifyBackgroundChange"));
    }
  }
  function installArtistBackgroundController() {
    const ORIGINALS = /* @__PURE__ */ new WeakMap();
    const ART_SELECTOR = ".XR9tiExSLOuxgWTKxzse";
    const STORAGE_KEY_MODE = "glowify-artist-bg-mode";
    const STORAGE_KEY_CUSTOM = "glowify-bg-image";
    const getSavedMode = () => localStorage.getItem(STORAGE_KEY_MODE) || "theme";
    const setSavedMode = (mode) => localStorage.setItem(STORAGE_KEY_MODE, mode);
    const getCustomImage = () => localStorage.getItem(STORAGE_KEY_CUSTOM);
    function isArtistPage() {
      try {
        return location && location.pathname && location.pathname.includes("/artist") || !!document.querySelector(ART_SELECTOR);
      } catch (e) {
        return false;
      }
    }
    function getImgElem(el) {
      var _a, _b;
      if (!el) return null;
      if (el.tagName === "IMG") return el;
      return (_b = (_a = el.querySelector) == null ? void 0 : _a.call(el, "img")) != null ? _b : null;
    }
    function saveOriginalIfNeeded(el) {
      if (ORIGINALS.has(el)) return;
      const img = getImgElem(el);
      if (img) ORIGINALS.set(el, { type: "img", src: img.src || "" });
      else {
        const inlineBg = el.style.backgroundImage;
        if (inlineBg) ORIGINALS.set(el, { type: "bg", bg: inlineBg });
        else ORIGINALS.set(el, { type: "bg", bg: getComputedStyle(el).backgroundImage || "" });
      }
    }
    function restoreOriginal(el) {
      if (!ORIGINALS.has(el)) return;
      const orig = ORIGINALS.get(el);
      const img = getImgElem(el);
      if (orig.type === "img" && img) img.src = orig.src || "";
      else if (orig.type === "bg") {
        const html = el;
        html.style.backgroundImage = orig.bg || "";
        html.style.backgroundRepeat = "";
        html.style.backgroundSize = "";
        html.style.backgroundPosition = "";
      }
    }
    function applyMode(mode) {
      if (!isArtistPage()) return;
      const nodes = document.querySelectorAll(ART_SELECTOR);
      if (!nodes || nodes.length === 0) return;
      const customImage = getCustomImage();
      nodes.forEach((el) => {
        try {
          saveOriginalIfNeeded(el);
          const img = getImgElem(el);
          el.style.opacity = "0";
          if (mode === "theme") {
            restoreOriginal(el);
            el.style.opacity = "1";
          } else if (mode === "custom" && customImage) {
            if (img) img.src = customImage;
            else {
              const html = el;
              html.style.backgroundImage = `url("${customImage}")`;
              html.style.backgroundRepeat = "no-repeat";
              html.style.backgroundSize = "cover";
              html.style.backgroundPosition = "center center";
            }
            el.style.opacity = "1";
          }
        } catch (err) {
          console.warn("applyMode element error", err);
        }
      });
    }
    function applySavedModeIfArtist() {
      if (!isArtistPage()) return;
      applyMode(getSavedMode());
    }
    const bodyObserver = new MutationObserver((mutations) => {
      var _a, _b;
      let artistFound = false;
      for (const m2 of mutations) {
        if (m2.addedNodes && m2.addedNodes.length) {
          for (const n of Array.from(m2.addedNodes)) {
            if (!n || n.nodeType !== 1) continue;
            if (!artistFound && (n.matches && n.matches(ART_SELECTOR) || n.querySelector && n.querySelector(ART_SELECTOR))) {
              artistFound = true;
            }
          }
        }
        if (!artistFound && m2.type === "attributes" && ((_b = (_a = m2.target) == null ? void 0 : _a.matches) == null ? void 0 : _b.call(_a, ART_SELECTOR))) artistFound = true;
      }
      if (artistFound) {
        const obsAny = bodyObserver;
        if (obsAny._debounce) clearTimeout(obsAny._debounce);
        obsAny._debounce = setTimeout(() => {
          applySavedModeIfArtist();
          obsAny._debounce = null;
        }, 60);
      }
    });
    function startObservers() {
      if (!document.body) return false;
      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "src", "class"]
      });
      return true;
    }
    (function hookHistory() {
      const wrap = (fn) => {
        const orig = history[fn];
        history[fn] = function(...args) {
          const res = orig.apply(this, args);
          setTimeout(() => {
            if (isArtistPage()) applySavedModeIfArtist();
          }, 80);
          return res;
        };
      };
      try {
        wrap("pushState");
        wrap("replaceState");
      } catch (e) {
      }
      window.addEventListener("popstate", () => setTimeout(() => isArtistPage() && applySavedModeIfArtist(), 80));
    })();
    (function installBgChangeHandler() {
      const RETRY_COUNT = 4;
      const RETRY_DELAY = 80;
      let debounceTimer = null;
      async function doApplyCustomWithRetries() {
        if (getSavedMode() !== "custom") return;
        if (!isArtistPage()) return;
        for (let i2 = 0; i2 < RETRY_COUNT; i2++) {
          try {
            applyMode("custom");
          } catch (e) {
            console.warn("applyMode(custom) failed", i2, e);
          }
          await sleep(RETRY_DELAY);
        }
      }
      const anyWin = window;
      window.removeEventListener("glowifyBackgroundChange", anyWin._glowifyArtistBgHandler || (() => {
      }));
      anyWin._glowifyArtistBgHandler = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          doApplyCustomWithRetries().catch(console.warn);
          debounceTimer = null;
        }, 60);
      };
      window.addEventListener("glowifyBackgroundChange", anyWin._glowifyArtistBgHandler);
    })();
    (function tryInit() {
      if (!startObservers()) {
        setTimeout(tryInit, 200);
        return;
      }
      if (isArtistPage()) applySavedModeIfArtist();
    })();
    return {
      applyMode,
      applySavedModeIfArtist,
      setMode: (mode) => {
        setSavedMode(mode);
        applySavedModeIfArtist();
      }
    };
  }
  var PLAYER_WIDTH_MODE_KEY = "glowify-player-width";
  var PLAYER_CUSTOM_W_KEY = "glowify-player-custom-width";
  var PLAYER_CUSTOM_H_KEY = "glowify-player-custom-height";
  var DEFAULT_CUSTOM_WIDTH = 80;
  var DEFAULT_CUSTOM_HEIGHT = 88;
  function getPlayerElement() {
    return document.querySelector(".Root__now-playing-bar");
  }
  function applyPlayerWidth(mode) {
    const player = getPlayerElement();
    if (!player) return;
    if (mode === "theme") {
      player.style.width = "65%";
      player.style.margin = "0 auto 5px";
      player.style.height = "";
    } else if (mode === "default") {
      player.style.width = "unset";
      player.style.margin = "calc(var(--panel-gap) * -1)";
      player.style.height = "";
    } else if (mode === "custom") {
      const w2 = parseFloat(localStorage.getItem(PLAYER_CUSTOM_W_KEY) || String(DEFAULT_CUSTOM_WIDTH));
      const h2 = parseInt(localStorage.getItem(PLAYER_CUSTOM_H_KEY) || String(DEFAULT_CUSTOM_HEIGHT), 10);
      player.style.width = Number.isFinite(w2) ? w2 + "%" : DEFAULT_CUSTOM_WIDTH + "%";
      player.style.height = Number.isFinite(h2) ? h2 + "px" : DEFAULT_CUSTOM_HEIGHT + "px";
      player.style.margin = "0 auto 5px";
    }
  }
  function applyPlayerRadius(px) {
    const player = getPlayerElement();
    if (!player) return;
    player.style.borderRadius = px + "px";
    localStorage.setItem("glowify-player-radius", String(px));
  }
  function ensurePlayerApplied() {
    const mode = localStorage.getItem(PLAYER_WIDTH_MODE_KEY) || "theme";
    const radius = parseInt(localStorage.getItem("glowify-player-radius") || "30", 10);
    const player = getPlayerElement();
    if (player) {
      applyPlayerWidth(mode);
      applyPlayerRadius(radius);
      return;
    }
    const obs = new MutationObserver(() => {
      const found = getPlayerElement();
      if (found) {
        applyPlayerWidth(mode);
        applyPlayerRadius(radius);
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  function applyTransparentControls(width, height) {
    const opacity = isUnixLikeOS() ? 0 : 1;
    const css = `
    .Root__top-container::after {
      content: "";
      position: fixed;
      top: 0;
      right: 0;
      z-index: 999;
      backdrop-filter: brightness(2.12);
      width: ${width}px !important;
      height: ${height}px !important;
      pointer-events: none;
      transition: all 0.25s ease;
      opacity: ${opacity} !important;
    }
  `;
    updateStyle("glowify-transparent-controls", css);
    localStorage.setItem("glowify-tc-width", String(width));
    localStorage.setItem("glowify-tc-height", String(height));
  }
  function ensureTransparentControlsApplied() {
    const width = parseInt(localStorage.getItem("glowify-tc-width") || "135", 10);
    const height = parseInt(localStorage.getItem("glowify-tc-height") || "64", 10);
    applyTransparentControls(width, height);
  }
  function updatePlaylistHeaderCss(show) {
    const css = show ? `.main-entityHeader-container.gmKBgPCnX785KDicbdJu { --glass-filter: url(#glass-filter--r1-7); backdrop-filter: var(--glass-filter) blur(5px) !important; box-shadow: var(--glass-shadow) !important; }` : `.main-entityHeader-container.gmKBgPCnX785KDicbdJu { backdrop-filter: none !important; box-shadow: none !important; }`;
    updateStyle("glowify-playlist-header-style", css);
  }
  function applyPlaylistHeader(mode) {
    const m2 = mode === "show" ? "show" : "hide";
    localStorage.setItem("glowify-playlist-header-mode", m2);
    updatePlaylistHeaderCss(m2 === "show");
  }
  function applySavedPlaylistHeader() {
    const saved = localStorage.getItem("glowify-playlist-header-mode") || "show";
    updatePlaylistHeaderCss(saved === "show");
  }
  function applyBackgroundBlur(px) {
    document.documentElement.style.setProperty("--glowify-bg-blur", px + "px");
    localStorage.setItem("glowify-bg-blur", String(px));
  }
  function ensureBackgroundBlurApplied() {
    const saved = parseInt(localStorage.getItem("glowify-bg-blur") || "7", 10);
    applyBackgroundBlur(saved);
  }
  function installPlaylistIndicatorVisualizer() {
    (async function() {
      var _a;
      while (!(Spicetify == null ? void 0 : Spicetify.Player) || !((_a = Spicetify == null ? void 0 : Spicetify.Player) == null ? void 0 : _a.data)) await sleep(300);
      let lastSvg = null;
      let lastIndicator = null;
      function createBars(indicator) {
        if (lastSvg) {
          try {
            lastSvg.remove();
          } catch (e) {
          }
          lastSvg = null;
        }
        if (!indicator || !indicator.parentNode) return;
        const parent = indicator.parentNode;
        const rectHeight = parent.offsetHeight || 20;
        const bottom = rectHeight - 2;
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", String(rectHeight));
        svg.style.position = "absolute";
        svg.style.left = "0px";
        svg.style.top = "0px";
        svg.style.pointerEvents = "none";
        const bars = [];
        const speeds = [];
        const phases = [];
        for (let i2 = 0; i2 < 4; i2++) {
          const bar = document.createElementNS(svgNS, "rect");
          bar.setAttribute("x", String(i2 * 4));
          bar.setAttribute("width", "3");
          bar.setAttribute("y", String(bottom - 4));
          bar.setAttribute("height", "4");
          bar.classList.add("custom-playing-bar");
          svg.appendChild(bar);
          bars.push(bar);
          speeds.push(7e-3 + Math.random() * 6e-3);
          phases.push(Math.random() * Math.PI * 2);
        }
        parent.insertBefore(svg, indicator);
        lastSvg = svg;
        lastIndicator = indicator;
        const start = performance.now();
        function animate() {
          var _a2;
          if (!lastSvg || !lastIndicator) return;
          const parentNode = lastIndicator.parentNode;
          if (!parentNode) {
            try {
              lastSvg.remove();
            } catch (e) {
            }
            lastSvg = null;
            lastIndicator = null;
            return;
          }
          const playButton = (_a2 = parentNode.querySelector) == null ? void 0 : _a2.call(parentNode, ".main-trackList-rowImagePlayButton");
          const isPlaying = Spicetify.Player.isPlaying() && (!playButton || window.getComputedStyle(playButton).opacity === "0");
          if (!isPlaying) {
            try {
              lastSvg.remove();
            } catch (e) {
            }
            lastSvg = null;
            lastIndicator = null;
            return;
          }
          const now = performance.now();
          const t = now - start;
          const currentRectHeight = parentNode.offsetHeight || rectHeight;
          const maxHeight = currentRectHeight * 0.7;
          const minHeight = 3;
          const bottomNow = currentRectHeight - 2;
          lastSvg.setAttribute("height", String(currentRectHeight));
          bars.forEach((bar, i2) => {
            const height = minHeight + (Math.sin(t * speeds[i2] + phases[i2]) + 1) / 2 * (maxHeight - minHeight);
            bar.setAttribute("height", String(height));
            bar.setAttribute("y", String(bottomNow - height));
          });
          requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      }
      async function updateIndicator() {
        var _a2;
        const indicator = document.querySelector(
          ".X_HqPouENflGygaUXNus:not([style*='display: none']), [data-playing-indicator]:not([style*='display: none'])"
        );
        if (!indicator) {
          if (lastSvg) {
            try {
              lastSvg.remove();
            } catch (e) {
            }
            lastSvg = null;
            lastIndicator = null;
          }
          return false;
        }
        if (!indicator.parentNode) {
          if (lastSvg) {
            try {
              lastSvg.remove();
            } catch (e) {
            }
            lastSvg = null;
            lastIndicator = null;
          }
          return false;
        }
        const parentNode = indicator.parentNode;
        const playButton = (_a2 = parentNode.querySelector) == null ? void 0 : _a2.call(parentNode, ".main-trackList-rowImagePlayButton");
        const isPlaying = Spicetify.Player.isPlaying() && (!playButton || window.getComputedStyle(playButton).opacity === "0");
        if (lastSvg && !isPlaying) {
          try {
            lastSvg.remove();
          } catch (e) {
          }
          lastSvg = null;
          lastIndicator = null;
        }
        if (indicator !== lastIndicator) createBars(indicator);
        return true;
      }
      Spicetify.Player.addEventListener("songchange", () => {
        if (lastSvg) {
          try {
            lastSvg.remove();
          } catch (e) {
          }
          lastSvg = null;
          lastIndicator = null;
        }
        void updateIndicator();
      });
      setInterval(() => void updateIndicator(), 100);
    })();
  }
  function installHomeScreenVisualizer() {
    (function() {
      const homeSvgs = /* @__PURE__ */ new Map();
      const svgNS = "http://www.w3.org/2000/svg";
      let wasPlaying = false;
      function createHomeVisualizer(img) {
        if (homeSvgs.has(img)) return;
        const parent = img.parentNode;
        if (!parent) return;
        parent.style.setProperty("position", "relative", "important");
        const rectHeight = parent.offsetHeight || 20;
        const bottom = rectHeight - 2;
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", String(rectHeight));
        svg.style.pointerEvents = "none";
        svg.style.zIndex = "999999";
        svg.style.position = "absolute";
        const bars = [];
        for (let i2 = 0; i2 < 4; i2++) {
          const bar = document.createElementNS(svgNS, "rect");
          bar.setAttribute("x", String(i2 * 4));
          bar.setAttribute("width", "3");
          bar.setAttribute("y", String(bottom - 4));
          bar.setAttribute("height", "4");
          bar.classList.add("home-visualizer-bar");
          svg.appendChild(bar);
          bars.push({
            element: bar,
            speed: 7e-3 + Math.random() * 6e-3,
            phase: Math.random() * Math.PI * 2
          });
        }
        parent.appendChild(svg);
        img.style.display = "none";
        homeSvgs.set(img, { svg, bars, rectHeight, bottom, parent });
      }
      function updateHomeScreenVisualizer() {
        document.querySelectorAll("img.H70qcBekoGWOlskuON5R").forEach((img) => {
          const im = img;
          if (im.style.display !== "none") createHomeVisualizer(im);
        });
      }
      const homeObserver = new MutationObserver(() => updateHomeScreenVisualizer());
      homeObserver.observe(document.body, { childList: true, subtree: true });
      const start = performance.now();
      function animate() {
        var _a, _b, _c;
        const t = performance.now() - start;
        for (const [img, data] of homeSvgs.entries()) {
          if (!document.body.contains(data.svg)) {
            homeSvgs.delete(img);
            continue;
          }
          const rectHeight = data.parent.offsetHeight || 20;
          const bottom = rectHeight - 2;
          data.svg.setAttribute("height", String(rectHeight));
          const shortcut = (_b = (_a = data.svg).closest) == null ? void 0 : _b.call(_a, ".view-homeShortcutsGrid-shortcut");
          try {
            data.svg.style.display = shortcut && ((_c = shortcut.matches) == null ? void 0 : _c.call(shortcut, ":hover")) ? "none" : "block";
          } catch (e) {
            data.svg.style.display = "block";
          }
          data.bars.forEach((barData) => {
            const maxHeight = rectHeight * 0.7;
            const minHeight = 3;
            const height = minHeight + (Math.sin(t * barData.speed + barData.phase) + 1) / 2 * (maxHeight - minHeight);
            barData.element.setAttribute("height", String(height));
            barData.element.setAttribute("y", String(bottom - height));
          });
        }
        requestAnimationFrame(animate);
      }
      animate();
      updateHomeScreenVisualizer();
      Spicetify.Player.addEventListener("onplaypause", () => {
        var _a;
        const isPlaying = Spicetify.Player.isPlaying();
        if (wasPlaying && !isPlaying) {
          for (const [, data] of homeSvgs.entries()) {
            try {
              (_a = data.svg) == null ? void 0 : _a.remove();
            } catch (e) {
            }
          }
          homeSvgs.clear();
        }
        if (!wasPlaying && isPlaying) {
          updateHomeScreenVisualizer();
        }
        wasPlaying = isPlaying;
      });
    })();
  }
  var glowifyTranslations = {
    de: {
      settingsTitle: "Liquify Einstellungen",
      title: "Liquify Einstellungen",
      accentColor: "Button-Farbe:",
      glowColor: "Glow-Farbe:",
      background: "Hintergrund:",
      apbackground: "K\xFCnstler Seiten Hintergrund:",
      playerWidth: "Player-Breite:",
      playerRadius: "Player Border Radius:",
      backgroundBlur: "Hintergrund-Unsch\xE4rfe:",
      transparentWidth: "Transparente Controls Breite:",
      transparentHeight: "Transparente Controls H\xF6he:",
      close: "Schlie\xDFen",
      playlistHeaderBox: "Playlist-Header-Box:",
      playerCustomWidth: "Player-Breite (%):",
      playerCustomHeight: "Player-H\xF6he (px):",
      chooseFile: "Datei ausw\xE4hlen",
      dropdown: {
        default: "Standard",
        custom: "Benutzerdefiniert",
        dynamic: "Dynamisch",
        theme: "Theme",
        none: "Keiner",
        show: "Anzeigen",
        hide: "Ausblenden"
      }
    },
    en: {
      settingsTitle: "Liquify Settings",
      title: "Liquify Settings",
      accentColor: "Button Accent Color:",
      glowColor: "Glow Accent Color:",
      background: "Background:",
      apbackground: "Artist Page Background:",
      playerWidth: "Player Width:",
      playerRadius: "Player Border Radius:",
      backgroundBlur: "Background Blur:",
      transparentWidth: "Transparent Controls Width:",
      transparentHeight: "Transparent Controls Height:",
      close: "Close",
      playlistHeaderBox: "Playlist Header Box:",
      playerCustomWidth: "Player Width (%):",
      playerCustomHeight: "Player Height (px):",
      chooseFile: "Choose file",
      dropdown: {
        default: "Default",
        custom: "Custom",
        dynamic: "Dynamic",
        theme: "Theme",
        none: "None",
        show: "Show",
        hide: "Hide"
      }
    },
    ru: {
      settingsTitle: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Liquify",
      title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Liquify",
      accentColor: "\u0426\u0432\u0435\u0442 \u0430\u043A\u0446\u0435\u043D\u0442\u0430 \u043A\u043D\u043E\u043F\u043E\u043A:",
      glowColor: "\u0426\u0432\u0435\u0442 \u0441\u0432\u0435\u0447\u0435\u043D\u0438\u044F:",
      background: "\u0424\u043E\u043D:",
      apbackground: "\u0424\u043E\u043D \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0430\u0440\u0442\u0438\u0441\u0442\u0430:",
      playerWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u0435\u0435\u0440\u0430:",
      playerRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u0443\u0433\u043B\u043E\u0432 \u043F\u043B\u0435\u0435\u0440\u0430:",
      backgroundBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0444\u043E\u043D\u0430:",
      transparentWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432:",
      transparentHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432:",
      close: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
      playlistHeaderBox: "\u0411\u043B\u043E\u043A \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430 \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u0430:",
      playerCustomWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u0435\u0435\u0440\u0430 (%):",
      playerCustomHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043F\u043B\u0435\u0435\u0440\u0430 (px):",
      chooseFile: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B",
      dropdown: {
        default: "\u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u043E",
        custom: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0439",
        dynamic: "\u0414\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439",
        theme: "\u0422\u0435\u043C\u0430",
        none: "\u041D\u0435\u0442",
        show: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C",
        hide: "\u0421\u043A\u0440\u044B\u0442\u044C"
      }
    },
    es: {
      settingsTitle: "Configuraci\xF3n de Liquify",
      title: "Configuraci\xF3n de Liquify",
      accentColor: "Color de acento del bot\xF3n:",
      glowColor: "Color del brillo:",
      background: "Fondo:",
      apbackground: "Fondo de la p\xE1gina del artista:",
      playerWidth: "Ancho del reproductor:",
      playerRadius: "Radio del borde del reproductor:",
      backgroundBlur: "Desenfoque del fondo:",
      transparentWidth: "Ancho de controles transparentes:",
      transparentHeight: "Altura de controles transparentes:",
      close: "Cerrar",
      playlistHeaderBox: "Caja del encabezado de la playlist:",
      playerCustomWidth: "Ancho del reproductor (%):",
      playerCustomHeight: "Altura del reproductor (px):",
      chooseFile: "Elegir archivo",
      dropdown: {
        default: "Predeterminado",
        custom: "Personalizado",
        dynamic: "Din\xE1mico",
        theme: "Tema",
        none: "Ninguno",
        show: "Mostrar",
        hide: "Ocultar"
      }
    },
    fr: {
      settingsTitle: "Param\xE8tres Liquify",
      title: "Param\xE8tres Liquify",
      accentColor: "Couleur d\u2019accent du bouton:",
      glowColor: "Couleur de l\u2019effet lumineux:",
      background: "Arri\xE8re-plan:",
      apbackground: "Arri\xE8re-plan de la page de l\u2019artiste:",
      playerWidth: "Largeur du lecteur:",
      playerRadius: "Rayon de bord du lecteur:",
      backgroundBlur: "Flou de l\u2019arri\xE8re-plan:",
      transparentWidth: "Largeur des contr\xF4les transparents:",
      transparentHeight: "Hauteur des contr\xF4les transparents:",
      close: "Fermer",
      playlistHeaderBox: "Bo\xEEte d\u2019en-t\xEAte de la playlist:",
      playerCustomWidth: "Largeur du lecteur (%):",
      playerCustomHeight: "Hauteur du lecteur (px):",
      chooseFile: "Choisir un fichier",
      dropdown: {
        default: "Par d\xE9faut",
        custom: "Personnalis\xE9",
        dynamic: "Dynamique",
        theme: "Th\xE8me",
        none: "Aucun",
        show: "Afficher",
        hide: "Masquer"
      }
    },
    pt: {
      settingsTitle: "Configura\xE7\xF5es do Liquify",
      title: "Configura\xE7\xF5es do Liquify",
      accentColor: "Cor de destaque do bot\xE3o:",
      glowColor: "Cor do brilho:",
      background: "Fundo:",
      apbackground: "Fundo da p\xE1gina do artista:",
      playerWidth: "Largura do player:",
      playerRadius: "Raio do canto do player:",
      backgroundBlur: "Desfoque do fundo:",
      transparentWidth: "Largura dos controles transparentes:",
      transparentHeight: "Altura dos controles transparentes:",
      close: "Fechar",
      playlistHeaderBox: "Caixa do cabe\xE7alho da playlist:",
      playerCustomWidth: "Largura do player (%):",
      playerCustomHeight: "Altura do player (px):",
      chooseFile: "Escolher arquivo",
      dropdown: {
        default: "Padr\xE3o",
        custom: "Personalizado",
        dynamic: "Din\xE2mico",
        theme: "Tema",
        none: "Nenhum",
        show: "Mostrar",
        hide: "Ocultar"
      }
    },
    tr: {
      settingsTitle: "Liquify Ayarlar\u0131",
      title: "Liquify Ayarlar\u0131",
      accentColor: "D\xFC\u011Fme vurgu rengi:",
      glowColor: "Parlama rengi:",
      background: "Arka plan:",
      apbackground: "Sanat\xE7\u0131 Sayfas\u0131 Arka Plan\u0131:",
      playerWidth: "Oynat\u0131c\u0131 geni\u015Fli\u011Fi:",
      playerRadius: "Oynat\u0131c\u0131 k\xF6\u015Fe yuvarlama:",
      backgroundBlur: "Arka plan bulan\u0131kl\u0131\u011F\u0131:",
      transparentWidth: "\u015Eeffaf kontroller geni\u015Fli\u011Fi:",
      transparentHeight: "\u015Eeffaf kontroller y\xFCksekli\u011Fi:",
      close: "Kapat",
      playlistHeaderBox: "\xC7alma listesi ba\u015Fl\u0131k kutusu:",
      playerCustomWidth: "Oynat\u0131c\u0131 geni\u015Fli\u011Fi (%):",
      playerCustomHeight: "Oynat\u0131c\u0131 y\xFCksekli\u011Fi (px):",
      chooseFile: "Dosya se\xE7",
      dropdown: {
        default: "Varsay\u0131lan",
        custom: "\xD6zel",
        dynamic: "Dinamik",
        theme: "Tema",
        none: "Hi\xE7biri",
        show: "G\xF6ster",
        hide: "Gizle"
      }
    },
    hi: {
      settingsTitle: "Liquify \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
      title: "Liquify \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
      accentColor: "\u092C\u091F\u0928 \u090F\u0915\u094D\u0938\u0947\u0902\u091F \u0930\u0902\u0917:",
      glowColor: "\u0917\u094D\u0932\u094B \u090F\u0915\u094D\u0938\u0947\u0902\u091F \u0930\u0902\u0917:",
      background: "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F:",
      apbackground: "\u0915\u0932\u093E\u0915\u093E\u0930 \u092A\u0943\u0937\u094D\u0920 \u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F:",
      playerWidth: "\u092A\u094D\u0932\u0947\u092F\u0930 \u091A\u094C\u0921\u093C\u093E\u0908:",
      playerRadius: "\u092A\u094D\u0932\u0947\u092F\u0930 \u092C\u0949\u0930\u094D\u0921\u0930 \u0930\u0947\u0921\u093F\u092F\u0938:",
      backgroundBlur: "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F \u0927\u0941\u0902\u0927\u0932\u093E\u092A\u0928:",
      transparentWidth: "\u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u0915\u0902\u091F\u094D\u0930\u094B\u0932 \u091A\u094C\u0921\u093C\u093E\u0908:",
      transparentHeight: "\u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u0915\u0902\u091F\u094D\u0930\u094B\u0932 \u090A\u0901\u091A\u093E\u0908:",
      playlistHeaderBox: "\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F \u0939\u0947\u0921\u0930 \u092C\u0949\u0915\u094D\u0938",
      playerCustomWidth: "\u092A\u094D\u0932\u0947\u092F\u0930 \u091A\u094C\u0921\u093C\u093E\u0908 (%):",
      playerCustomHeight: "\u092A\u094D\u0932\u0947\u092F\u0930 \u090A\u0901\u091A\u093E\u0908 (px):",
      chooseFile: "\u092B\u093C\u093E\u0907\u0932 \u091A\u0941\u0928\u0947\u0902",
      close: "\u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
      dropdown: {
        default: "\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F",
        custom: "\u0915\u0938\u094D\u091F\u092E",
        dynamic: "\u0921\u093E\u092F\u0928\u0947\u092E\u093F\u0915",
        theme: "\u0925\u0940\u092E",
        none: "\u0915\u094B\u0908 \u0928\u0939\u0940\u0902",
        show: "\u0926\u093F\u0916\u093E\u090F\u0901",
        hide: "\u091B\u093F\u092A\u093E\u090F\u0901"
      }
    }
  };
  function getTranslation() {
    var _a, _b;
    const clientLocale = (((_b = (_a = Spicetify == null ? void 0 : Spicetify.Platform) == null ? void 0 : _a.Session) == null ? void 0 : _b.locale) || navigator.language || "en").split("-")[0];
    const lang = glowifyTranslations[clientLocale] ? clientLocale : "en";
    return glowifyTranslations[lang];
  }
  var GLOWIFY_GEAR_HOST_SELECTOR = ".vRrKblnUUQV5eMbvUdv8";
  function ensureGlowifyGearStyle() {
    if (document.getElementById("glowify-gear-style")) return;
    const style = document.createElement("style");
    style.id = "glowify-gear-style";
    style.textContent = `
    #glowify-settings-gear-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 0;
      background: transparent;
      cursor: pointer;
      color: var(--text-subdued);
      margin-inline-end: -13px;
      z-index: 2;
      align-self: center;
    }
    #glowify-settings-gear-btn:hover { color: var(--text-base); }
    #glowify-settings-gear-btn:focus-visible {
      outline: 2px solid var(--spice-button, var(--glowify-accent));
      outline-offset: 2px;
    }
    #glowify-settings-gear-btn svg { width: 18px; height: 18px; display: block; }
  `;
    document.head.appendChild(style);
  }
  function getGearSvg() {
    return `
    <svg role="img" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="butt" stroke-linejoin="miter">
      <path vector-effect="non-scaling-stroke" d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" />
      <path vector-effect="non-scaling-stroke" d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </svg>
  `;
  }
  function ensureGlowifyGearButton(t) {
    var _a;
    const host = document.querySelector(GLOWIFY_GEAR_HOST_SELECTOR);
    if (!host) return false;
    if ((_a = host.querySelector) == null ? void 0 : _a.call(host, "#glowify-settings-gear-btn")) return true;
    ensureGlowifyGearStyle();
    const btn = document.createElement("button");
    btn.id = "glowify-settings-gear-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", t.settingsTitle);
    btn.setAttribute("title", t.settingsTitle);
    btn.innerHTML = getGearSvg();
    btn.style.setProperty("-webkit-app-region", "no-drag");
    btn.style.pointerEvents = "auto";
    btn.addEventListener("click", () => {
      if (typeof window.showGlowifySettingsMenu === "function") window.showGlowifySettingsMenu();
    });
    host.insertBefore(btn, host.firstChild);
    return true;
  }
  function initGlowifyGearInjection(t) {
    const tryInsert = () => {
      try {
        ensureGlowifyGearButton(t);
      } catch (e) {
      }
    };
    tryInsert();
    const anyWin = window;
    if (!anyWin._glowifyGearInsertTimer) {
      const startedAt = Date.now();
      anyWin._glowifyGearInsertTimer = setInterval(() => {
        const host = document.querySelector(GLOWIFY_GEAR_HOST_SELECTOR);
        const hasBtn = !!document.querySelector("#glowify-settings-gear-btn");
        if (hasBtn || Date.now() - startedAt > 1e4) {
          clearInterval(anyWin._glowifyGearInsertTimer);
          anyWin._glowifyGearInsertTimer = null;
          return;
        }
        if (host) tryInsert();
      }, 200);
    }
    if (!anyWin._glowifyGearObserver) {
      anyWin._glowifyGearObserver = new MutationObserver(() => {
        if (anyWin._glowifyGearObserver._debounce) clearTimeout(anyWin._glowifyGearObserver._debounce);
        anyWin._glowifyGearObserver._debounce = setTimeout(() => {
          tryInsert();
          anyWin._glowifyGearObserver._debounce = null;
        }, 60);
      });
      anyWin._glowifyGearObserver.observe(document.body, { childList: true, subtree: true });
    }
  }
  var React;
  var ReactDOM;
  var GLOWIFY_DISCORD_URL = "https://discord.gg/QRMnrgjhvq";
  var GLOWIFY_GITHUB_URL = "https://github.com/NMWplays/Glowify";
  function openExternalLink(url) {
    if (!url) return;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      try {
        location.href = url;
      } catch (e2) {
      }
    }
  }
  function getDiscordIcon() {
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 16 16",
        fill: "currentColor",
        "aria-hidden": "true",
        focusable: "false"
      },
      /* @__PURE__ */ React.createElement("path", { d: "M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" })
    );
  }
  function getGithubIcon() {
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 98 96",
        fill: "currentColor",
        "aria-hidden": "true",
        focusable: "false"
      },
      /* @__PURE__ */ React.createElement(
        "path",
        {
          fillRule: "evenodd",
          clipRule: "evenodd",
          d: "M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
        }
      )
    );
  }
  function ensureSettingsUiStyle() {
    if (document.getElementById("glowify-settings-ui-style")) return;
    const style = document.createElement("style");
    style.id = "glowify-settings-ui-style";
    style.textContent = `
    .glowifySettingsPanel {
      --glass-filter: url(#glass-filter--r1-7);
      width: min(560px, 92vw);
      min-width: 0;
      padding: 18px 0 20px;
      border-radius: 20px;
      color: white;
      background: transparent;
      backdrop-filter: var(--glass-filter) blur(5px);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px);
      box-shadow: var(--glass-shadow);
      position: relative;
      isolation: isolate;
      transform: translateZ(0);
      will-change: transform;
      height: min(60vh, calc(100vh - 80px));
      max-height: min(60vh, calc(100vh - 80px));
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .glowifySettingsHeader {
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
    .glowifySettingsTitle { margin: 0; text-align: center; font-weight: 700; position: relative; z-index: 1; }
    .glowifyHeaderActions {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 1;
    }
    .glowifyHeaderActionBtn {
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
      box-shadow: var(--glass-shadow) !important;
    }
    .glowifyHeaderActionBtn:hover { background: var(--accent-color) !important; }
    .glowifyHeaderActionBtn svg { width: 16px; height: 16px; display: block; }
    .glowifyCloseBtn { font-size: 18px; }
    .glowifySettingsBody {
      flex: 1 1 auto;
      overflow-x: hidden;
      overflow-y: auto;
      /* Safe padding so large outer glows don't get clipped by the scroll container */
      padding: 34px;
      padding-top: 20px;
      padding-bottom: 10px;
      scrollbar-gutter: stable;
      margin-bottom: -20px;
      will-change: box-shadow, backdrop-filter;
    }
    .glowifyRow { display: flex; align-items: center; justify-content: flex-start; gap: 10px; width: 100%; margin: 10px 0; flex-wrap: wrap; }
    .glowifyLabel { min-width: 140px; text-align: left; flex: 1 1 140px; }
    .glowifyRowControls {
      display: flex;
      gap: 10px;
      flex: 0 0 auto;
      margin-left: auto;
      justify-content: flex-end;
      flex-wrap: nowrap;
      min-width: 0;
      max-width: 100%;
    }
    .glowifyStackedControls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      min-width: 0;
      margin-left: auto;
      max-width: 100%;
    }
    .glowifyRowControls > * { flex: 0 0 auto; min-width: 0; }
    .glowifyControlSurface { background: transparent; border: none; border-radius: 12px; color: white; box-shadow: var(--glass-shadow); }
    .glowifySelectBtn {
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
    }
    .glowifySelectLabel { overflow: hidden; text-overflow: ellipsis; }
    .glowifySelectChevron { width: 14px; height: 14px; flex: 0 0 14px; position: relative; }
    .glowifySelectChevron::before {
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
    .glowifySelectBtn.isOpen .glowifySelectChevron::before { transform: rotate(-135deg); }
    .glowifySelectBtn:focus-visible { outline: 2px solid var(--spice-button, var(--glowify-accent, var(--accent-color))); outline-offset: 2px; }
    .glowifySelectMenu {
      --glass-filter: url(#glass-filter--r1-7);
      position: fixed;
      z-index: 999999;
      background: transparent;
      backdrop-filter: var(--glass-filter) blur(5px);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px);
      border-radius: 15px;
      overflow: hidden;
      box-shadow: var(--glass-shadow);
      color: white;
      width: max-content;
    }
    .glowifySelectItem {
      padding: 8px 10px;
      cursor: pointer;
      user-select: none;
      color: white;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      transition: background-color 0.2s ease;
    }
    .glowifySelectItem:hover { background: var(--glowify-glow-accent); }

    .glowifyPopover {
      --glass-filter: url(#glass-filter--r1-7);
      position: fixed;
      z-index: 1000000;
      border-radius: 17px;
      overflow: hidden;
      background: #00000057;
      backdrop-filter: var(--glass-filter) blur(5px);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px);
      box-shadow: var(--glass-shadow);
      color: white;
      align-items: center;
      width: fit-content;
    }
    .glowifyColorPicker {
      padding: 10px 15px 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 230px;
      align-self: center;
    }
    .glowifyColorPreviewRow { display: flex; align-items: center; gap: 10px; }
    .glowifyColorPreviewRow { margin-left: 17px; }
    .glowifyColorPreview { width: 34px; height: 34px; border-radius: 10px; flex: 0 0 34px; }
    .glowifyHexInput { width: 120px; padding: 6px 8px; text-transform: uppercase; }

    /* react-colorful styling (inline, because we don't import CSS files here) */
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
      border-radius: 15px !important;
      overflow: visible !important;
      cursor: crosshair;
      /* No bottom border look */
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.10),
        inset 1px 0 0 rgba(255, 255, 255, 0.10),
        inset -1px 0 0 rgba(255, 255, 255, 0.10);
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

    /* Some react-colorful builds expose the last control wrapper as this class */
    .react-colorful__last-control { border-radius: 10px !important; overflow: visible !important; }
    .react-colorful__last-control .react-colorful__interactive { border-radius: 10px !important; }
    .react-colorful__hue-pointer {
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: rgba(255,255,255,0.95);
      box-shadow: 0 0 0 3px rgba(0,0,0,0.35);
    }
    .glowifyInline { display: flex; align-items: center; gap: 6px; }
    .glowifyStepperBtn { width: 24px; height: 24px; border-radius: 9px; cursor: pointer; transition: background-color 0.2s ease; }
    .glowifyStepperBtn:hover { background: var(--accent-color) !important; }
    .glowifyNumberInput { width: 74px; padding: 5px 6px; text-align: center; }
    .glowifySubBlock { margin-left: 0; display: flex; flex-direction: column; gap: 8px; }
    .glowifyActionBtn { padding: 6px 10px; cursor: pointer; }
    .glowifyIndentedBtn { margin-left: 31px; }
    .glowifyColorSwatch { width: 20px; height: 20px; border-radius: 6px; box-shadow: var(--glass-shadow); }

    .glowifySection {
      margin: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .glowifySectionTitle {
      margin: 0;
      padding: 10px 12px;
      text-align: center;
      font-weight: 700;
      border-radius: 14px;
      background: transparent;
      box-shadow: var(--glass-shadow);
    }
    .glowifySectionBody {
      padding: 10px;
      border-radius: 14px;
      background: transparent;
      box-shadow: var(--glass-shadow);
    }
    .glowifySectionBody .glowifyRow { margin: 8px 0; }
  `;
    document.head.appendChild(style);
  }
  function useOutsideClick(open, onClose, refs) {
    React.useEffect(() => {
      if (!open) return;
      const handler = (ev) => {
        for (const r of refs) {
          const node = r == null ? void 0 : r.current;
          if (node && node.contains(ev.target)) return;
        }
        onClose();
      };
      document.addEventListener("mousedown", handler, true);
      return () => document.removeEventListener("mousedown", handler, true);
    }, [open, onClose]);
  }
  function normalizeHexColor(input) {
    const raw = (input || "").trim();
    const m2 = /^#?([0-9a-fA-F]{6})$/.exec(raw);
    if (!m2) return null;
    return ("#" + m2[1]).toUpperCase();
  }
  function ColorPicker(props) {
    const btnRef = React.useRef(null);
    const popRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    const [pos, setPos] = React.useState(null);
    const normalized = normalizeHexColor(props.value) || "#1DB954";
    const [hex, setHex] = React.useState(normalized);
    React.useEffect(() => {
      const next = normalizeHexColor(props.value);
      if (!next || next === hex) return;
      setHex(next);
    }, [props.value]);
    useOutsideClick(open, () => setOpen(false), [btnRef, popRef]);
    const useLayout = React.useLayoutEffect || React.useEffect;
    useLayout(() => {
      if (!open) return;
      const recalc = () => {
        var _a, _b, _c, _d, _e;
        const btn = btnRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const margin = 6;
        const panel = (_a = btn.closest) == null ? void 0 : _a.call(btn, ".glowifySettingsPanel");
        const body = (_c = (_b = panel == null ? void 0 : panel.querySelector) == null ? void 0 : _b.call(panel, ".glowifySettingsBody")) != null ? _c : null;
        const bounds = (body == null ? void 0 : body.getBoundingClientRect) ? body.getBoundingClientRect() : panel ? panel.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
        const controls = (_e = (_d = btn.closest) == null ? void 0 : _d.call(btn, ".glowifyRowControls")) != null ? _e : null;
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
      const onKeyDown = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", onKeyDown, true);
      return () => {
        window.removeEventListener("resize", recalc);
        window.removeEventListener("scroll", recalc, true);
        document.removeEventListener("keydown", onKeyDown, true);
      };
    }, [open]);
    const commitHex = (raw) => {
      const next = normalizeHexColor(raw);
      if (!next) return;
      setHex(next);
      props.onChange(next);
    };
    const popover = open && pos ? /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: popRef,
        className: "glowifyPopover",
        style: {
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          minWidth: `${pos.minWidth}px`,
          maxHeight: `${pos.maxHeight}px`,
          overflowY: "auto"
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: "glowifyColorPicker" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyColorPreviewRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyColorPreview", style: { background: hex } }), /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "glowifyControlSurface glowifyHexInput",
          value: hex,
          onChange: (e) => setHex(e.target.value.toUpperCase()),
          onBlur: () => commitHex(hex),
          onKeyDown: (e) => {
            if (e.key === "Enter") e.target.blur();
          },
          inputMode: "text",
          spellCheck: false
        }
      )), /* @__PURE__ */ React.createElement(
        Z,
        {
          color: hex,
          onChange: (c2) => {
            const next = normalizeHexColor(c2) || hex;
            setHex(next);
            props.onChange(next);
          }
        }
      ))
    ) : null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: btnRef,
        type: "button",
        className: "glowifyControlSurface glowifyActionBtn",
        onClick: () => {
          setPos(null);
          setOpen((v2) => !v2);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "glowifyInline" }, /* @__PURE__ */ React.createElement("span", { className: "glowifyColorSwatch", style: { background: normalized } }), normalized)
    ), popover && ((ReactDOM == null ? void 0 : ReactDOM.createPortal) ? ReactDOM.createPortal(popover, document.body) : popover));
  }
  function Select(props) {
    var _a, _b;
    const btnRef = React.useRef(null);
    const menuRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    const [pos, setPos] = React.useState(null);
    useOutsideClick(open, () => setOpen(false), [btnRef, menuRef]);
    const current = (_a = props.options.find((o) => o.value === props.value)) != null ? _a : props.options[0];
    const useLayout = React.useLayoutEffect || React.useEffect;
    useLayout(() => {
      if (!open) return;
      const measureMenuWidth = (btn) => {
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
        var _a2, _b2, _c;
        const btn = btnRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const margin = 6;
        const panel = (_a2 = btn.closest) == null ? void 0 : _a2.call(btn, ".glowifySettingsPanel");
        const body = (_c = (_b2 = panel == null ? void 0 : panel.querySelector) == null ? void 0 : _b2.call(panel, ".glowifySettingsBody")) != null ? _c : null;
        const bounds = (body == null ? void 0 : body.getBoundingClientRect) ? body.getBoundingClientRect() : panel ? panel.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
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
    const menu = open && pos ? /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: menuRef,
        className: "glowifySelectMenu",
        style: {
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          width: `${pos.width}px`,
          maxHeight: `${pos.maxHeight}px`,
          overflowY: "auto",
          transform: void 0
        }
      },
      props.options.map((o) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: o.value,
          className: "glowifySelectItem",
          onClick: () => {
            setOpen(false);
            props.onChange(o.value);
          }
        },
        o.label
      ))
    ) : null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: btnRef,
        type: "button",
        className: `glowifyControlSurface glowifySelectBtn${open ? " isOpen" : ""}`,
        onClick: () => {
          setPos(null);
          setOpen((v2) => !v2);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "glowifySelectLabel" }, (_b = current == null ? void 0 : current.label) != null ? _b : props.value),
      /* @__PURE__ */ React.createElement("span", { className: "glowifySelectChevron", "aria-hidden": "true" })
    ), menu && ((ReactDOM == null ? void 0 : ReactDOM.createPortal) ? ReactDOM.createPortal(menu, document.body) : menu));
  }
  function Stepper(props) {
    const [text, setText] = React.useState(String(props.value));
    React.useEffect(() => {
      setText(String(props.value));
    }, [props.value]);
    const commit = (raw) => {
      const parsed = parseInt(raw, 10);
      if (!Number.isFinite(parsed)) {
        setText(String(props.value));
        return;
      }
      props.onChange(clamp(parsed, props.min, props.max));
    };
    return /* @__PURE__ */ React.createElement("div", { className: "glowifyInline" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "glowifyControlSurface glowifyStepperBtn",
        onClick: () => props.onChange(clamp(props.value - 1, props.min, props.max))
      },
      "-"
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "glowifyControlSurface glowifyNumberInput",
        type: "text",
        inputMode: "numeric",
        value: text,
        onChange: (e) => setText(e.target.value),
        onBlur: () => commit(text),
        onKeyDown: (e) => {
          if (e.key === "Enter") e.target.blur();
        }
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "glowifyControlSurface glowifyStepperBtn",
        onClick: () => props.onChange(clamp(props.value + 1, props.min, props.max))
      },
      "+"
    ));
  }
  function Section(props) {
    return /* @__PURE__ */ React.createElement("div", { className: "glowifySection" }, /* @__PURE__ */ React.createElement("div", { className: "glowifySectionTitle" }, props.title), /* @__PURE__ */ React.createElement("div", { className: "glowifySectionBody" }, props.children));
  }
  function SettingsContent(props) {
    var _a, _b, _c, _d, _e, _f;
    const [lyricsMode, setLyricsMode] = React.useState(readLS("glowify-lyrics-mode", "romanization"));
    React.useEffect(() => {
      installLyricsTranslator();
    }, []);
    const applyLyricsMode = (mode) => {
      setLyricsMode(mode);
      localStorage.setItem("glowify-lyrics-mode", mode);
      window.dispatchEvent(new Event("glowifyLyricsModeChange"));
    };
    const t = getTranslation();
    const locale = (((_b = (_a = Spicetify == null ? void 0 : Spicetify.Platform) == null ? void 0 : _a.Session) == null ? void 0 : _b.locale) || navigator.language || "en").toString().toLowerCase();
    const de = locale.startsWith("de");
    const titles = {
      accent: de ? "Akzent" : "Accent",
      glow: de ? "Glow" : "Glow",
      background: de ? "Hintergrund" : "Background",
      artist: de ? "K\xFCnstler" : "Artist",
      player: de ? "Player" : "Player",
      playlist: de ? "Playlist" : "Playlist",
      transparent: de ? "Transparente Controls" : "Transparent Controls"
    };
    const chooseFileLabel = t.chooseFile || (de ? "Datei ausw\xE4hlen" : "Choose file");
    const [accentMode, setAccentMode] = React.useState(readLS("glowify-accent-mode", "default"));
    const [accentColor, setAccentColor] = React.useState(readLS("glowify-custom-color", "#1DB954"));
    const [glowMode, setGlowMode] = React.useState(readLS("glowify-glow-mode", "default"));
    const [glowColor, setGlowColor] = React.useState(readLS("glowify-glow-color", "#1DB954"));
    const [bgMode, setBgMode] = React.useState(readLS("glowify-bg-mode", "dynamic"));
    const [artistBgMode, setArtistBgMode] = React.useState(readLS("glowify-artist-bg-mode", "theme"));
    const [playerWidthMode, setPlayerWidthMode] = React.useState(readLS("glowify-player-width", "default"));
    const [playerCustomW, setPlayerCustomW] = React.useState(readNum("glowify-player-custom-width", DEFAULT_CUSTOM_WIDTH));
    const [playerCustomH, setPlayerCustomH] = React.useState(readNum("glowify-player-custom-height", DEFAULT_CUSTOM_HEIGHT));
    const [playlistHeader, setPlaylistHeader] = React.useState(readLS("glowify-playlist-header-mode", "show"));
    const [playerRadius, setPlayerRadiusState] = React.useState(readNum("glowify-player-radius", 30));
    const [bgBlur, setBgBlurState] = React.useState(readNum("glowify-bg-blur", 7));
    const [tcW, setTcW] = React.useState(readNum("glowify-tc-width", 135));
    const [tcH, setTcH] = React.useState(readNum("glowify-tc-height", 64));
    const unixLike = isUnixLikeOS();
    const bgFileRef = React.useRef(null);
    const artistFileRef = React.useRef(null);
    React.useEffect(() => {
      ensureSettingsUiStyle();
    }, []);
    const applyAccentMode = (mode) => {
      setAccentMode(mode);
      if (mode === "custom") {
        applyAccent(accentColor);
      } else if (mode === "dynamic") {
        lastDynamicColor = null;
        applyDynamicAccent();
      } else {
        resetAccentToDefault();
      }
    };
    const applyGlowMode = (mode) => {
      setGlowMode(mode);
      if (mode === "custom") applyGlowAccent(glowColor);
      else resetGlowAccentToDefault();
    };
    const applyBgMode = async (mode) => {
      var _a2;
      setBgMode(mode);
      localStorage.setItem("glowify-bg-mode", mode);
      if (mode === "custom") {
        const saved = localStorage.getItem("glowify-bg-image");
        if (!saved) {
          (_a2 = bgFileRef.current) == null ? void 0 : _a2.click();
          return;
        }
      }
      updateBackground();
    };
    const applyArtistMode = async (mode) => {
      var _a2, _b2, _c2;
      setArtistBgMode(mode);
      localStorage.setItem("glowify-artist-bg-mode", mode);
      if (mode === "custom") {
        const saved = localStorage.getItem("glowify-bg-image");
        if (!saved) {
          (_a2 = artistFileRef.current) == null ? void 0 : _a2.click();
          return;
        }
      }
      (_c2 = (_b2 = props.artistCtrl) == null ? void 0 : _b2.setMode) == null ? void 0 : _c2.call(_b2, mode);
    };
    const applyPlayerWidthMode = (mode) => {
      setPlayerWidthMode(mode);
      localStorage.setItem("glowify-player-width", mode);
      applyPlayerWidth(mode);
    };
    const applyPlayerCustom = (nextW, nextH) => {
      localStorage.setItem("glowify-player-custom-width", String(nextW));
      localStorage.setItem("glowify-player-custom-height", String(nextH));
      applyPlayerWidth("custom");
    };
    const applyRadius = (value) => {
      setPlayerRadiusState(value);
      applyPlayerRadius(value);
    };
    const applyPlaylistHeaderMode = (mode) => {
      setPlaylistHeader(mode);
      applyPlaylistHeader(mode);
    };
    const applyBlur = (value) => {
      setBgBlurState(value);
      applyBackgroundBlur(value);
    };
    const applyTransparent = (w2, h2) => {
      setTcW(w2);
      setTcH(h2);
      applyTransparentControls(w2, h2);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "glowifySettingsPanel" }, /* @__PURE__ */ React.createElement("div", { className: "glowifySettingsHeader" }, /* @__PURE__ */ React.createElement("h3", { className: "glowifySettingsTitle" }, t.title), /* @__PURE__ */ React.createElement("div", { className: "glowifyHeaderActions" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "glowifyControlSurface glowifyHeaderActionBtn",
        "aria-label": "Discord",
        title: "Discord",
        onClick: () => openExternalLink(GLOWIFY_DISCORD_URL)
      },
      getDiscordIcon()
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "glowifyControlSurface glowifyHeaderActionBtn",
        "aria-label": "GitHub",
        title: "GitHub",
        onClick: () => openExternalLink(GLOWIFY_GITHUB_URL)
      },
      getGithubIcon()
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "glowifyControlSurface glowifyHeaderActionBtn glowifyCloseBtn",
        "aria-label": t.close || "Close",
        title: t.close || "Close",
        onClick: props.onClose
      },
      "\xD7"
    ))), /* @__PURE__ */ React.createElement("div", { className: "glowifySettingsBody" }, /* @__PURE__ */ React.createElement(Section, { title: titles.accent }, /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.accentColor), /* @__PURE__ */ React.createElement("div", { className: "glowifyRowControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: accentMode,
        options: [
          { value: "default", label: t.dropdown.default },
          { value: "custom", label: t.dropdown.custom },
          { value: "dynamic", label: t.dropdown.dynamic }
        ],
        onChange: applyAccentMode
      }
    ), accentMode === "custom" && /* @__PURE__ */ React.createElement(
      ColorPicker,
      {
        value: accentColor,
        onChange: (next) => {
          setAccentColor(next);
          localStorage.setItem("glowify-custom-color", next);
          applyAccent(next);
        }
      }
    )))), /* @__PURE__ */ React.createElement(Section, { title: titles.background }, /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.background), /* @__PURE__ */ React.createElement("div", { className: "glowifyStackedControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: bgMode,
        options: [
          { value: "dynamic", label: t.dropdown.dynamic },
          { value: "custom", label: t.dropdown.custom }
        ],
        onChange: (m2) => void applyBgMode(m2)
      }
    ), bgMode === "custom" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "glowifyControlSurface glowifyActionBtn",
        onClick: () => {
          var _a2;
          return (_a2 = bgFileRef.current) == null ? void 0 : _a2.click();
        }
      },
      chooseFileLabel
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: bgFileRef,
        type: "file",
        accept: "image/*",
        style: { display: "none" },
        onChange: async (e) => {
          var _a2;
          const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
          if (!file) return;
          await applyCustomBackground(file);
        }
      }
    )))), /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.backgroundBlur), /* @__PURE__ */ React.createElement(Stepper, { value: bgBlur, min: 0, max: 40, onChange: applyBlur }))), /* @__PURE__ */ React.createElement(Section, { title: titles.artist }, /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.apbackground), /* @__PURE__ */ React.createElement("div", { className: "glowifyStackedControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: artistBgMode,
        options: [
          { value: "theme", label: t.dropdown.theme },
          { value: "none", label: t.dropdown.none },
          { value: "custom", label: t.dropdown.custom }
        ],
        onChange: (m2) => void applyArtistMode(m2)
      }
    ), artistBgMode === "custom" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "glowifyControlSurface glowifyActionBtn",
        onClick: () => {
          var _a2;
          return (_a2 = artistFileRef.current) == null ? void 0 : _a2.click();
        }
      },
      chooseFileLabel
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: artistFileRef,
        type: "file",
        accept: "image/*",
        style: { display: "none" },
        onChange: async (e) => {
          var _a2, _b2, _c2;
          const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
          if (!file) return;
          await applyCustomBackground(file);
          (_c2 = (_b2 = props.artistCtrl) == null ? void 0 : _b2.applySavedModeIfArtist) == null ? void 0 : _c2.call(_b2);
        }
      }
    ))))), /* @__PURE__ */ React.createElement(Section, { title: titles.player }, /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.playerWidth), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: playerWidthMode,
        options: [
          { value: "default", label: t.dropdown.default },
          { value: "theme", label: t.dropdown.theme },
          { value: "custom", label: t.dropdown.custom }
        ],
        onChange: applyPlayerWidthMode
      }
    )), playerWidthMode === "custom" && /* @__PURE__ */ React.createElement("div", { className: "glowifySubBlock" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.playerCustomWidth), /* @__PURE__ */ React.createElement(
      Stepper,
      {
        value: playerCustomW,
        min: 0,
        max: 100,
        onChange: (v2) => {
          setPlayerCustomW(v2);
          applyPlayerCustom(v2, playerCustomH);
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "glowifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.playerCustomHeight), /* @__PURE__ */ React.createElement(
      Stepper,
      {
        value: playerCustomH,
        min: 0,
        max: 300,
        onChange: (v2) => {
          setPlayerCustomH(v2);
          applyPlayerCustom(playerCustomW, v2);
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.playerRadius), /* @__PURE__ */ React.createElement(Stepper, { value: playerRadius, min: 0, max: 100, onChange: applyRadius }))), /* @__PURE__ */ React.createElement(Section, { title: titles.playlist }, /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.playlistHeaderBox), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: playlistHeader,
        options: [
          { value: "show", label: t.dropdown.show },
          { value: "hide", label: t.dropdown.hide }
        ],
        onChange: applyPlaylistHeaderMode
      }
    ))), /* @__PURE__ */ React.createElement(Section, { title: "Lyrics" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.lyricsMode || "Lyrics-\xDCbersetzung/Romanisierung:"), /* @__PURE__ */ React.createElement("div", { className: "glowifyRowControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: lyricsMode,
        options: [
          { value: "off", label: ((_c = t.lyricsOptions) == null ? void 0 : _c.off) || "Aus" },
          { value: "translation", label: ((_d = t.lyricsOptions) == null ? void 0 : _d.translation) || "Nur \xDCbersetzung" },
          { value: "romanization", label: ((_e = t.lyricsOptions) == null ? void 0 : _e.romanization) || "Nur Romanisierung" },
          { value: "both", label: ((_f = t.lyricsOptions) == null ? void 0 : _f.both) || "\xDCbersetzung + Romanisierung" }
        ],
        onChange: applyLyricsMode
      }
    )))), /* @__PURE__ */ React.createElement(Section, { title: titles.transparent }, /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.transparentWidth), /* @__PURE__ */ React.createElement("div", { style: { opacity: unixLike ? 0.5 : 1, pointerEvents: unixLike ? "none" : "auto" } }, /* @__PURE__ */ React.createElement(Stepper, { value: tcW, min: 50, max: 400, onChange: (v2) => applyTransparent(v2, tcH) }))), /* @__PURE__ */ React.createElement("div", { className: "glowifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "glowifyLabel" }, t.transparentHeight), /* @__PURE__ */ React.createElement("div", { style: { opacity: unixLike ? 0.5 : 1, pointerEvents: unixLike ? "none" : "auto" } }, /* @__PURE__ */ React.createElement(Stepper, { value: tcH, min: 20, max: 300, onChange: (v2) => applyTransparent(tcW, v2) }))))));
  }
  function openSettingsModal(artistCtrl) {
    ensureSettingsUiStyle();
    const t = getTranslation();
    const existing = document.getElementById("glowify-settings-react-overlay");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "glowify-settings-react-overlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "99999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "transparent";
    overlay.style.overflow = "hidden";
    overlay.style.padding = "24px";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    const root = document.createElement("div");
    overlay.appendChild(root);
    const onClose = () => {
      try {
        ReactDOM.unmountComponentAtNode(root);
      } catch (e) {
      }
      overlay.remove();
    };
    ReactDOM.render(/* @__PURE__ */ React.createElement(SettingsContent, { onClose, artistCtrl }), root);
  }
  async function awaitSpicetifyReact() {
    while (!(Spicetify == null ? void 0 : Spicetify.React) || !(Spicetify == null ? void 0 : Spicetify.ReactDOM)) await sleep(200);
    React = Spicetify.React;
    ReactDOM = Spicetify.ReactDOM;
  }
  (async function initGlowifyStandaloneTs() {
    const anyWin = window;
    if (anyWin.glowifyStandaloneTsInitialized) return;
    anyWin.glowifyStandaloneTsInitialized = true;
    await awaitSpicetifyReact();
    const savedGlowMode = localStorage.getItem("glowify-glow-mode") || "default";
    const savedGlowColor = localStorage.getItem("glowify-glow-color") || "#1DB954";
    if (savedGlowMode === "custom") applyGlowAccent(savedGlowColor);
    else resetGlowAccentToDefault();
    const savedAccentMode = localStorage.getItem("glowify-accent-mode") || "default";
    const savedAccentColor = localStorage.getItem("glowify-custom-color") || "#1DB954";
    if (savedAccentMode === "custom") applyAccent(savedAccentColor);
    else if (savedAccentMode === "dynamic") applyDynamicAccent();
    else resetAccentToDefault();
    applySavedBackground();
    ensurePlayerApplied();
    ensureTransparentControlsApplied();
    ensureBackgroundBlurApplied();
    applySavedPlaylistHeader();
    if (!anyWin.glowifyDynamicObserverTs) {
      anyWin.glowifyDynamicObserverTs = new MutationObserver(() => {
        const mode = localStorage.getItem("glowify-accent-mode");
        if (mode === "dynamic") applyDynamicAccent();
      });
      anyWin.glowifyDynamicObserverTs.observe(document.body, { attributes: true, subtree: true });
    }
    const artistCtrl = installArtistBackgroundController();
    window.showGlowifySettingsMenu = () => {
      try {
        openSettingsModal(artistCtrl);
      } catch (e) {
        console.error("Glowify settings open failed", e);
      }
    };
    initGlowifyGearInjection(getTranslation());
    installPlaylistIndicatorVisualizer();
    installHomeScreenVisualizer();
  })();
})();
