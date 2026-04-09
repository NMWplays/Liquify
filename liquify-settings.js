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
    const STORAGE_KEY = "liquify-lyrics-mode";
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
    window.addEventListener("liquifyLyricsModeChange", () => {
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
    document.documentElement.style.setProperty("--liquify-accent", color);
    const css = `
    .AZ6uIUy8_YPogVERteBi:hover .r9ZhqDYZeNTrb4R4Te8W { fill: ${color} !important; }
    .AZ6uIUy8_YPogVERteBi:hover .t_sZQVE189C6jf_gtE_w { fill: ${color} !important; }
    .e-91000-button-primary:hover .e-91000-button-primary__inner { background-color: ${color} !important; }
    .e-91000-button-primary:active .e-91000-button-primary__inner { background-color: ${color} !important; }
    .e-10180-legacy-button-primary:hover .e-10180-button-primary__inner { background-color: ${color} !important; }
    .e-10180-legacy-button-primary:active .e-10180-button-primary__inner { background-color: ${color} !important; }
    .e-10180-legacy-chip:hover > .e-10180-legacy-chip__inner.e-10180-legacy-chip__inner--selected { background-color: ${color} !important; }
    .encore-dark-theme .encore-inverted-light-set { --background-base: ${color} !important; }
    .LegacyChip__LegacyChipComponent-sc-tzfq94-0:hover > .ChipInnerComponent-sm-selected.ChipInnerComponent-sm-selected { background-color: ${color} !important; }
    .button-module__button___hf2qg_marketplace { background-color: ${color} !important; }
    .custom-playing-bar { fill: ${color} !important; }
    .home-visualizer-bar { fill: ${color} !important; }
  `;
    updateStyle("liquify-button-style", css);
    localStorage.setItem("liquify-accent-mode", "custom");
    localStorage.setItem("liquify-custom-color", color);
  }
  function applyDynamicAccent() {
    const dynamicColor = getComputedStyle(document.documentElement).getPropertyValue("--accent-color").trim();
    if (!dynamicColor || dynamicColor === lastDynamicColor) return;
    lastDynamicColor = dynamicColor;
    applyAccent(dynamicColor);
    document.documentElement.style.setProperty("--liquify-dynamic-color", dynamicColor);
    localStorage.setItem("liquify-accent-mode", "dynamic");
  }
  function resetAccentToDefault() {
    document.documentElement.style.setProperty("--spice-button", "");
    document.documentElement.style.setProperty("--spice-button-active", "");
    document.documentElement.style.setProperty("--background-highlight", "");
    document.documentElement.style.setProperty("--liquify-accent", "");
    const css = `
    .AZ6uIUy8_YPogVERteBi:hover .r9ZhqDYZeNTrb4R4Te8W { fill: #3be477; }
    .AZ6uIUy8_YPogVERteBi:hover .t_sZQVE189C6jf_gtE_w { fill: #3be477; }
    .e-91000-button-primary:hover .e-91000-button-primary__inner { background-color: #3be477; }
    .e-91000-button-primary:active .e-91000-button-primary__inner { background-color: #3be477; }
    .e-10180-legacy-button-primary:hover .e-10180-button-primary__inner { background-color: #3be477; }
    .e-10180-legacy-button-primary:active .e-10180-button-primary__inner { background-color: #3be477; }
    .e-10180-legacy-chip:hover > .e-10180-legacy-chip__inner.e-10180-legacy-chip__inner--selected { background-color: #3be477; }
    .encore-dark-theme .encore-inverted-light-set { --background-base: #FFFFFF !important; }
    .LegacyChip__LegacyChipComponent-sc-tzfq94-0:hover > .ChipInnerComponent-sm-selected.ChipInnerComponent-sm-selected { background-color: #f0f0f0 !important; }
    .button-module__button___hf2qg_marketplace { background-color: #FFFFFF !important; }
    .custom-playing-bar { fill: #3be477; }
    .home-visualizer-bar { fill: #3be477; }
  `;
    updateStyle("liquify-button-style", css);
    localStorage.setItem("liquify-accent-mode", "default");
    localStorage.removeItem("liquify-custom-color");
  }
  function applyGlowAccent(color) {
    document.documentElement.style.setProperty("--liquify-glow-accent", color);
    localStorage.setItem("liquify-glow-mode", "custom");
    localStorage.setItem("liquify-glow-color", color);
  }
  function resetGlowAccentToDefault() {
    document.documentElement.style.setProperty("--liquify-glow-accent", "var(--accent-color)");
    localStorage.setItem("liquify-glow-mode", "default");
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
    const qualities = [0.92, 0.85, 0.7, 0.5];
    for (const q2 of qualities) {
      const compressed = canvas.toDataURL("image/jpeg", q2);
      try {
        localStorage.setItem("liquify-bg-image", compressed);
        localStorage.setItem("liquify-bg-mode", "custom");
        updateBackground();
        return;
      } catch (e) {
      }
    }
    console.warn("Image too large for localStorage even at lowest quality");
  }
  async function applyCustomArtistBackground(file) {
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
    const qualities = [0.92, 0.85, 0.7, 0.5];
    for (const q2 of qualities) {
      const compressed = canvas.toDataURL("image/jpeg", q2);
      try {
        localStorage.setItem("liquify-artist-bg-image", compressed);
        return;
      } catch (e) {
      }
    }
    console.warn("Artist image too large for localStorage even at lowest quality");
  }
  function applySavedBackground() {
    const mode = localStorage.getItem("liquify-bg-mode");
    const image = localStorage.getItem("liquify-bg-image");
    const bgUrl = localStorage.getItem("liquify-bg-url");
    const root = document.querySelector(".Root__top-container");
    if (!root) return;
    if (mode === "custom" && image) root.style.setProperty("--image_url", `url("${image}")`);
    else if (mode === "url" && bgUrl) root.style.setProperty("--image_url", `url("${bgUrl}")`);
  }
  function updateBackground() {
    const mode = localStorage.getItem("liquify-bg-mode") || "dynamic";
    const image = localStorage.getItem("liquify-bg-image");
    const bgUrl = localStorage.getItem("liquify-bg-url");
    const root = document.querySelector(".Root__top-container");
    if (!root) return;
    if (mode === "custom" && image) {
      root.style.setProperty("--image_url", `url("${image}")`);
    } else if (mode === "url" && bgUrl) {
      root.style.setProperty("--image_url", `url("${bgUrl}")`);
    } else {
      window.dispatchEvent(new Event("liquifyBackgroundChange"));
    }
  }
  function installArtistBackgroundController() {
    const ORIGINALS = /* @__PURE__ */ new WeakMap();
    const ART_SELECTOR = ".jiWxWueoicolJZnS";
    const STORAGE_KEY_MODE = "liquify-artist-bg-mode";
    const STORAGE_KEY_CUSTOM = "liquify-artist-bg-image";
    const STORAGE_KEY_URL = "liquify-artist-bg-url";
    const getSavedMode = () => localStorage.getItem(STORAGE_KEY_MODE) || "theme";
    const setSavedMode = (mode) => localStorage.setItem(STORAGE_KEY_MODE, mode);
    const getCustomImage = () => localStorage.getItem(STORAGE_KEY_CUSTOM);
    const getCustomUrl = () => localStorage.getItem(STORAGE_KEY_URL);
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
      const customUrl = getCustomUrl();
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
          } else if (mode === "url" && customUrl) {
            if (img) img.src = customUrl;
            else {
              const html = el;
              html.style.backgroundImage = `url("${customUrl}")`;
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
      window.removeEventListener("liquifyBackgroundChange", anyWin._liquifyArtistBgHandler || (() => {
      }));
      anyWin._liquifyArtistBgHandler = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          doApplyCustomWithRetries().catch(console.warn);
          debounceTimer = null;
        }, 60);
      };
      window.addEventListener("liquifyBackgroundChange", anyWin._liquifyArtistBgHandler);
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
  var PLAYER_WIDTH_MODE_KEY = "liquify-player-width";
  var PLAYER_CUSTOM_W_KEY = "liquify-player-custom-width";
  var PLAYER_CUSTOM_H_KEY = "liquify-player-custom-height";
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
    localStorage.setItem("liquify-player-radius", String(px));
  }
  function ensurePlayerApplied() {
    const mode = localStorage.getItem(PLAYER_WIDTH_MODE_KEY) || "theme";
    const radius = parseInt(localStorage.getItem("liquify-player-radius") || "30", 10);
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
    updateStyle("liquify-transparent-controls", css);
    localStorage.setItem("liquify-tc-width", String(width));
    localStorage.setItem("liquify-tc-height", String(height));
  }
  function ensureTransparentControlsApplied() {
    const width = parseInt(localStorage.getItem("liquify-tc-width") || "135", 10);
    const height = parseInt(localStorage.getItem("liquify-tc-height") || "64", 10);
    applyTransparentControls(width, height);
  }
  function updatePlaylistHeaderCss(show) {
    const css = show ? `.main-entityHeader-container.gmKBgPCnX785KDicbdJu { --glass-filter: url(#glass-filter--r1-7); backdrop-filter: var(--glass-filter) blur(5px) !important; box-shadow: var(--glass-shadow) !important; }` : `.main-entityHeader-container.gmKBgPCnX785KDicbdJu { backdrop-filter: none !important; box-shadow: none !important; }`;
    updateStyle("liquify-playlist-header-style", css);
  }
  function applyPlaylistHeader(mode) {
    const m2 = mode === "show" ? "show" : "hide";
    localStorage.setItem("liquify-playlist-header-mode", m2);
    updatePlaylistHeaderCss(m2 === "show");
  }
  function applySavedPlaylistHeader() {
    const saved = localStorage.getItem("liquify-playlist-header-mode") || "show";
    updatePlaylistHeaderCss(saved === "show");
  }
  function applyBackgroundBlur(px) {
    document.documentElement.style.setProperty("--liquify-bg-blur", px + "px");
    localStorage.setItem("liquify-bg-blur", String(px));
  }
  function ensureBackgroundBlurApplied() {
    const saved = parseInt(localStorage.getItem("liquify-bg-blur") || "7", 10);
    applyBackgroundBlur(saved);
  }
  function applyBackgroundBrightness(percent) {
    document.documentElement.style.setProperty("--liquify-bg-brightness", percent + "%");
    localStorage.setItem("liquify-bg-brightness", String(percent));
  }
  function ensureBackgroundBrightnessApplied() {
    const saved = parseInt(localStorage.getItem("liquify-bg-brightness") || "45", 10);
    applyBackgroundBrightness(saved);
  }
  function applyArtistScrollEffect(blur, brightness) {
    localStorage.setItem("liquify-artist-scroll-blur", String(blur));
    localStorage.setItem("liquify-artist-scroll-brightness", String(brightness));
    const style = ensureStyleTag("liquify-artist-scroll-effect");
    const brightnessVal = (brightness / 100).toFixed(2);
    style.textContent = `
@keyframes BKunRzRbjJ8Sj3or {
  0% {
    filter: blur(0px) brightness(${brightnessVal});
  }
  80% {
    -webkit-transform: scale(2);
    transform: scale(2);
    filter: blur(${blur}px) brightness(${brightnessVal});
  }
}
@keyframes PM3yG5WWpg8FtBiq {
  0% {
    filter: blur(0px) brightness(${brightnessVal});
  }
  80% {
    -webkit-transform: scale(2);
    transform: scale(2);
    filter: blur(${blur}px) brightness(${brightnessVal});
  }
}`;
  }
  function ensureArtistScrollEffectApplied() {
    const blur = readNum("liquify-artist-scroll-blur", 15);
    const brightness = readNum("liquify-artist-scroll-brightness", 70);
    applyArtistScrollEffect(blur, brightness);
  }
  var CCA_ENABLED_KEY = "liquify-comfy-cover-enabled";
  var CCA_WIDTH_KEY = "liquify-comfy-cover-width";
  var CCA_HEIGHT_KEY = "liquify-comfy-cover-height";
  var CCA_MARGIN_BOTTOM_KEY = "liquify-comfy-cover-mb";
  var CCA_MARGIN_LEFT_KEY = "liquify-comfy-cover-ml";
  var CCA_DEFAULTS = {
    enabled: "hide",
    width: 90,
    height: 90,
    marginBottom: 35,
    marginLeft: 0
  };
  function applyComfyCoverArt() {
    const enabled = readLS(CCA_ENABLED_KEY, CCA_DEFAULTS.enabled);
    if (enabled === "hide") {
      updateStyle("liquify-comfy-cover-art", "");
      return;
    }
    const w2 = readNum(CCA_WIDTH_KEY, CCA_DEFAULTS.width);
    const h2 = readNum(CCA_HEIGHT_KEY, CCA_DEFAULTS.height);
    const mb = readNum(CCA_MARGIN_BOTTOM_KEY, CCA_DEFAULTS.marginBottom);
    const ml = readNum(CCA_MARGIN_LEFT_KEY, CCA_DEFAULTS.marginLeft);
    const css = `
    :root .Root__top-container .main-nowPlayingWidget-nowPlaying .main-coverSlotCollapsed-container .cover-art,
    :root .Root__top-container .main-nowPlayingWidget-nowPlaying .main-coverSlotCollapsed-container .VideoPlayer__container video {
      width: ${w2}px !important;
      height: ${h2}px !important;
      overflow: hidden;
      object-fit: cover;
      max-height: none;
      max-width: none;
    }
    .FyKX_3VME_oKotEj {
      margin-bottom: ${mb}px !important;
      margin-left: ${ml}px !important;
    }
  `;
    updateStyle("liquify-comfy-cover-art", css);
  }
  function applyPlaybarCoverBorderRadius(px) {
    const css = `
    .FyKX_3VME_oKotEj { border-radius: ${px}px !important; }
    .FyKX_3VME_oKotEj img { border-radius: ${px}px !important; }
  `;
    updateStyle("liquify-playbar-cover-radius", css);
    localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, String(px));
  }
  function ensurePlaybarCoverBorderRadiusApplied() {
    const saved = readNum(PLAYBAR_COVER_BORDER_RADIUS_KEY, PLAYBAR_COVER_DEFAULTS.borderRadius);
    applyPlaybarCoverBorderRadius(saved);
  }
  var NPVC_MODE_KEY = "liquify-npv-cover-mode";
  var NPVC_SHOW_ALWAYS_KEY = "liquify-npv-cover-show-always";
  var NPVC_BLUR_KEY = "liquify-npv-cover-blur";
  var NPVC_DEFAULTS = {
    mode: "off",
    showAlways: "no",
    blur: 7
  };
  function installNowPlayingViewCover() {
    const TRACK_INFO_SEL = ".main-nowPlayingView-trackInfo.main-trackInfo-container";
    const COVER_SOURCE_SEL = "img.main-image-image.cover-art-image";
    const VISIBILITY_SEL = ".jDEJUdVW3pEDRC6E";
    const OUTSIDE_COVER_SEL = ".main-nowPlayingView-contextItemVisualEnhancement";
    const OUTSIDE_STYLE_ID = "liquify-npv-outside-cover";
    const OVER_CANVAS_STYLE_ID = "liquify-npv-over-canvas";
    function getMode() {
      return readLS(NPVC_MODE_KEY, NPVC_DEFAULTS.mode);
    }
    function getShowAlways() {
      return readLS(NPVC_SHOW_ALWAYS_KEY, NPVC_DEFAULTS.showAlways) === "yes";
    }
    function getBlur() {
      return readNum(NPVC_BLUR_KEY, NPVC_DEFAULTS.blur);
    }
    function isNpvVisible() {
      const el = document.querySelector(VISIBILITY_SEL);
      if (!el) return false;
      return window.getComputedStyle(el).visibility === "visible";
    }
    function removeTrackInfoCover() {
      const target = document.querySelector(TRACK_INFO_SEL);
      if (!target) return;
      const wrap = target.querySelector(".liquify-npv-row");
      if (!wrap) return;
      const text = wrap.querySelector(".liquify-npv-text");
      if (text) {
        while (text.firstChild) target.appendChild(text.firstChild);
      }
      wrap.remove();
    }
    function applyTrackInfo() {
      const target = document.querySelector(TRACK_INFO_SEL);
      const source = document.querySelector(COVER_SOURCE_SEL);
      const name = target == null ? void 0 : target.querySelector(".main-trackInfo-name");
      const artists = target == null ? void 0 : target.querySelector(".main-trackInfo-artists");
      if (!target || !source || !name || !artists) return;
      let wrap = target.querySelector(".liquify-npv-row");
      let cover = target.querySelector(".liquify-npv-cover");
      let text = target.querySelector(".liquify-npv-text");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "liquify-npv-row";
        wrap.style.cssText = "display:flex;align-items:center;gap:12px;width:100%;min-width:0;";
        cover = document.createElement("img");
        cover.className = "liquify-npv-cover";
        cover.style.cssText = "width:56px;height:56px;min-width:56px;object-fit:cover;border-radius:10px;display:block;";
        cover.draggable = false;
        text = document.createElement("div");
        text.className = "liquify-npv-text";
        text.style.cssText = "display:flex;flex-direction:column;justify-content:center;min-width:0;flex:1;overflow:hidden;";
        name.style.minWidth = "0";
        artists.style.minWidth = "0";
        text.append(name, artists);
        wrap.append(cover, text);
        target.replaceChildren(wrap);
      }
      if (cover) cover.src = source.src;
    }
    function removeOutsideCover() {
      updateStyle(OUTSIDE_STYLE_ID, "");
    }
    function applyOutsideCover() {
      updateStyle(OUTSIDE_STYLE_ID, OUTSIDE_COVER_SEL + " { opacity: 1 !important; width: 70px !important; }");
    }
    function removeOverCanvas() {
      updateStyle(OVER_CANVAS_STYLE_ID, "");
    }
    function applyOverCanvas() {
      const blur = getBlur();
      updateStyle(OVER_CANVAS_STYLE_ID, [
        ".fuq9616CQ8Fhz6n6 .main-nowPlayingView-coverArtVisualEnhancement { opacity: 1 !important; }",
        ".QniGNpglI7Qq052T { visibility: visible !important; }",
        ".main-nowPlayingView-coverArtVisualEnhancement { left: 0 !important; opacity: 1 !important; padding-inline: 16px !important; position: absolute !important; right: 0 !important; z-index: 2 !important; }",
        ".fuq9616CQ8Fhz6n6 { margin-top: 90px !important; }",
        ".Aj0SLDANBjINzpsp>video { filter: blur(" + blur + "px) !important; }"
      ].join("\n"));
    }
    function removeAll() {
      removeTrackInfoCover();
      removeOutsideCover();
      removeOverCanvas();
    }
    function apply() {
      const mode = getMode();
      if (mode === "off") {
        removeAll();
        return;
      }
      if (mode === "overCanvas") {
        removeTrackInfoCover();
        removeOutsideCover();
        if (!isNpvVisible()) {
          removeOverCanvas();
          return;
        }
        applyOverCanvas();
        return;
      }
      if (!getShowAlways() && !isNpvVisible()) {
        removeAll();
        return;
      }
      removeOverCanvas();
      if (mode === "trackInfo") {
        removeOutsideCover();
        applyTrackInfo();
      } else if (mode === "outsideTrackInfo") {
        removeTrackInfoCover();
        applyOutsideCover();
      }
    }
    (async () => {
      var _a;
      while (!((_a = Spicetify == null ? void 0 : Spicetify.Player) == null ? void 0 : _a.addEventListener)) await sleep(300);
      Spicetify.Player.addEventListener("songchange", () => {
        setTimeout(apply, 400);
        setTimeout(apply, 1e3);
      });
    })();
    window.addEventListener("liquifyNpvcUpdate", () => {
      removeAll();
      setTimeout(apply, 100);
    });
    apply();
    setTimeout(apply, 1e3);
    setTimeout(apply, 3e3);
  }
  function installLyricsEnhancer() {
    var _a, _b;
    const anyWin = window;
    function tryClick() {
      let tries = 0;
      if (anyWin.__glowifyMehrTimer) clearInterval(anyWin.__glowifyMehrTimer);
      anyWin.__glowifyMehrTimer = setInterval(() => {
        tries++;
        const sidebar = document.querySelector(".a_fKt7xvd8od_kEb");
        if (sidebar && sidebar.getAttribute("aria-hidden") === "true") return;
        const btn = document.querySelector('.hGL4EJtqSKEstgcI button[data-encore-id="buttonPrimary"]');
        if (btn) {
          btn.click();
          clearInterval(anyWin.__glowifyMehrTimer);
          anyWin.__glowifyMehrTimer = null;
          return;
        }
        if (tries >= 20) {
          clearInterval(anyWin.__glowifyMehrTimer);
          anyWin.__glowifyMehrTimer = null;
        }
      }, 500);
    }
    if (anyWin.__glowifyMehrCb) {
      (_b = (_a = Spicetify.Player).removeEventListener) == null ? void 0 : _b.call(_a, "songchange", anyWin.__glowifyMehrCb);
    }
    anyWin.__glowifyMehrCb = () => setTimeout(tryClick, 10);
    Spicetify.Player.addEventListener("songchange", anyWin.__glowifyMehrCb);
    tryClick();
  }
  var NSC_SHOW_KEY = "liquify-nsc-show";
  var NSC_POSITION_KEY = "liquify-nsc-position";
  var NSC_HEIGHT_KEY = "liquify-nsc-height";
  var NSC_MAX_WIDTH_KEY = "liquify-nsc-max-width";
  var NSC_GAP_KEY = "liquify-nsc-gap";
  var NSC_COVER_SIZE_KEY = "liquify-nsc-cover-size";
  var NSC_HPAD_KEY = "liquify-nsc-hpad";
  var NSC_VPAD_KEY = "liquify-nsc-vpad";
  var NSC_GAP_PLAYER_KEY = "liquify-nsc-gap-player";
  var NSC_BORDER_RADIUS_KEY = "liquify-nsc-border-radius";
  var NSC_COVER_BORDER_RADIUS_KEY = "liquify-nsc-cover-border-radius";
  var PLAYBAR_COVER_BORDER_RADIUS_KEY = "liquify-playbar-cover-border-radius";
  var NSC_DEFAULTS = {
    show: "show",
    position: "left",
    height: 80,
    maxWidth: 256,
    gap: 10,
    coverSize: 55,
    hPad: 10,
    vPad: 8,
    gapToPlayer: 7,
    borderRadius: 20,
    coverBorderRadius: 13
  };
  var PLAYBAR_COVER_DEFAULTS = {
    borderRadius: 8
  };
  function getNscValues() {
    return {
      show: readLS(NSC_SHOW_KEY, NSC_DEFAULTS.show),
      position: readLS(NSC_POSITION_KEY, NSC_DEFAULTS.position),
      height: readNum(NSC_HEIGHT_KEY, NSC_DEFAULTS.height),
      maxWidth: readNum(NSC_MAX_WIDTH_KEY, NSC_DEFAULTS.maxWidth),
      gap: readNum(NSC_GAP_KEY, NSC_DEFAULTS.gap),
      coverSize: readNum(NSC_COVER_SIZE_KEY, NSC_DEFAULTS.coverSize),
      hPad: readNum(NSC_HPAD_KEY, NSC_DEFAULTS.hPad),
      vPad: readNum(NSC_VPAD_KEY, NSC_DEFAULTS.vPad),
      gapToPlayer: readNum(NSC_GAP_PLAYER_KEY, NSC_DEFAULTS.gapToPlayer),
      borderRadius: readNum(NSC_BORDER_RADIUS_KEY, NSC_DEFAULTS.borderRadius),
      coverBorderRadius: readNum(NSC_COVER_BORDER_RADIUS_KEY, NSC_DEFAULTS.coverBorderRadius)
    };
  }
  function applyNextSongCardStyle() {
    const v2 = getNscValues();
    if (v2.show === "hide") {
      updateStyle("liquify-next-song-card-style", "#liquify-next-song-card { display: none !important; }");
      return;
    }
    const css = `
    #liquify-next-song-card {
      --glass-filter: url(#glass-filter--r1-7);
      position: fixed;
      z-index: 999;
      height: ${v2.height}px;
      max-width: ${v2.maxWidth}px;
      padding: ${v2.vPad}px ${v2.hPad}px;
      display: flex;
      align-items: center;
      gap: ${v2.gap}px;
      border-radius: ${v2.borderRadius}px;
      background-color: transparent;
      backdrop-filter: var(--glass-filter) blur(2px);
      -webkit-backdrop-filter: var(--glass-filter) blur(2px);
      box-shadow: var(--glass-shadow);
      color: #fff;
      pointer-events: auto;
      overflow: hidden;
      isolation: isolate;
      transition: opacity 0.3s ease, transform 0.3s ease;
      box-sizing: border-box;
    }
    #liquify-next-song-card.nsc-hidden {
      opacity: 0;
      transform: translateY(6px);
      pointer-events: none;
    }
    #liquify-next-song-card .nsc-cover {
      width: ${v2.coverSize}px;
      height: ${v2.coverSize}px;
      border-radius: ${v2.coverBorderRadius}px;
      object-fit: cover;
      flex-shrink: 0;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    #liquify-next-song-card .nsc-cover:hover {
      transform: scale(1.08);
    }
    #liquify-next-song-card .nsc-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      min-width: 0;
      gap: 1px;
    }
    /* ---- marquee scroll container ---- */
    #liquify-next-song-card .nsc-marquee {
      overflow: hidden;
      white-space: nowrap;
      position: relative;
      line-height: 0.5;
    }
    #liquify-next-song-card .nsc-marquee.nsc-scrolling {
      mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
    }
    #liquify-next-song-card .nsc-marquee-inner {
      display: inline-block;
      white-space: nowrap;
    }
    #liquify-next-song-card .nsc-marquee.nsc-scrolling .nsc-marquee-inner {
      /* animation is set inline via JS for pixel-exact scroll distance */
    }
    #liquify-next-song-card .nsc-title-link,
    #liquify-next-song-card .nsc-artist-link {
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }
    #liquify-next-song-card .nsc-title-link:hover,
    #liquify-next-song-card .nsc-artist-link:hover {
      text-decoration: underline;
    }
    #liquify-next-song-card .nsc-title {
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      line-height: 1.3;
      color: var(--text-base, #fff);
    }
    #liquify-next-song-card .nsc-artist {
      font-size: 11px;
      font-weight: 400;
      opacity: 0.7;
      white-space: nowrap;
      line-height: 1.3;
      color: var(--text-subdued, rgba(255,255,255,0.7));
    }
  `;
    updateStyle("liquify-next-song-card-style", css);
  }
  function installNextSongCard() {
    applyNextSongCardStyle();
    let card = null;
    let lastUri = "";
    function getNextTrack() {
      var _a;
      try {
        const queue = (_a = Spicetify == null ? void 0 : Spicetify.Queue) == null ? void 0 : _a.nextTracks;
        if (!queue || queue.length === 0) return null;
        for (const entry of queue) {
          const t = (entry == null ? void 0 : entry.contextTrack) || entry;
          if (t == null ? void 0 : t.uri) return t;
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    function extractImageUrl(track) {
      try {
        const meta = track.metadata || {};
        if (meta.image_url) return meta.image_url;
        if (meta.image_xlarge_url) return meta.image_xlarge_url;
        if (meta.image_large_url) return meta.image_large_url;
        if (meta.image_small_url) return meta.image_small_url;
        const artUri = meta.artist_uri || "";
        const albumImages = meta["image_url"] || "";
        if (albumImages && albumImages.startsWith("spotify:image:")) {
          const id = albumImages.replace("spotify:image:", "");
          return `https://i.scdn.co/image/${id}`;
        }
      } catch (e) {
      }
      return "";
    }
    function resolveSpotifyImage(url) {
      if (!url) return "";
      if (url.startsWith("spotify:image:")) {
        const id = url.replace("spotify:image:", "");
        return `https://i.scdn.co/image/${id}`;
      }
      return url;
    }
    function ensureCard() {
      if (!card || !card.isConnected) {
        card = document.createElement("div");
        card.id = "liquify-next-song-card";
        card.className = "nsc-hidden";
        card.innerHTML = `
        <img class="nsc-cover" src="" alt="" data-uri="" />
        <div class="nsc-info">
          <div class="nsc-marquee nsc-title-wrap">
            <span class="nsc-marquee-inner"><a class="nsc-title nsc-title-link" href="#"></a></span>
          </div>
          <div class="nsc-marquee nsc-artist-wrap">
            <span class="nsc-marquee-inner"><a class="nsc-artist nsc-artist-link" href="#"></a></span>
          </div>
        </div>
      `;
        card.addEventListener("click", (e) => {
          var _a, _b, _c, _d;
          const target = e.target;
          if (target.classList.contains("nsc-cover")) {
            e.preventDefault();
            const uri2 = target.getAttribute("data-uri") || "";
            if (uri2 && ((_b = (_a = Spicetify == null ? void 0 : Spicetify.Platform) == null ? void 0 : _a.History) == null ? void 0 : _b.push)) {
              const parts = uri2.split(":");
              if (parts.length >= 3) {
                const type = parts[1];
                const id = parts.slice(2).join(":");
                Spicetify.Platform.History.push(`/${type}/${id}`);
              }
            }
            return;
          }
          const link = target.closest("a[data-uri]");
          if (!link) return;
          e.preventDefault();
          const uri = link.getAttribute("data-uri") || "";
          if (uri && ((_d = (_c = Spicetify == null ? void 0 : Spicetify.Platform) == null ? void 0 : _c.History) == null ? void 0 : _d.push)) {
            const parts = uri.split(":");
            if (parts.length >= 3) {
              const type = parts[1];
              const id = parts.slice(2).join(":");
              Spicetify.Platform.History.push(`/${type}/${id}`);
            }
          }
        });
        document.body.appendChild(card);
      }
      return card;
    }
    function setupMarquee(wrap) {
      const inner = wrap.querySelector(".nsc-marquee-inner");
      if (!inner) return;
      const textEl = inner.firstElementChild;
      if (!textEl) return;
      wrap.classList.remove("nsc-scrolling");
      if (inner._nscAnim) {
        try {
          inner._nscAnim.cancel();
        } catch (e) {
        }
        inner._nscAnim = null;
      }
      inner.style.transform = "";
      while (inner.childElementCount > 1) inner.removeChild(inner.lastChild);
      const origOverflow = wrap.style.overflow;
      wrap.style.overflow = "visible";
      const textWidth = inner.scrollWidth;
      const containerWidth = wrap.offsetWidth;
      wrap.style.overflow = origOverflow || "";
      if (textWidth > containerWidth && containerWidth > 0) {
        const gap = 48;
        const clone = textEl.cloneNode(true);
        clone.removeAttribute("data-uri");
        clone.style.pointerEvents = "none";
        clone.style.marginLeft = gap + "px";
        inner.appendChild(clone);
        const scrollDist = textWidth + gap;
        const duration = Math.max(5e3, scrollDist / 20 * 1e3);
        wrap.classList.add("nsc-scrolling");
        const anim = inner.animate(
          [
            { transform: "translateX(0)" },
            { transform: `translateX(-${scrollDist}px)` }
          ],
          {
            duration,
            iterations: Infinity,
            easing: "linear"
          }
        );
        inner._nscAnim = anim;
      } else {
        wrap.classList.remove("nsc-scrolling");
      }
    }
    function repositionCard() {
      if (!card || !card.isConnected) return;
      const player = getPlayerElement();
      if (!player) return;
      const v2 = getNscValues();
      const rect = player.getBoundingClientRect();
      const cardHeight = card.offsetHeight || v2.height;
      card.style.top = `${rect.top - cardHeight - v2.gapToPlayer}px`;
      if (v2.position === "right") {
        const cardWidth = card.offsetWidth || v2.maxWidth;
        card.style.left = `${rect.right - cardWidth}px`;
      } else {
        card.style.left = `${rect.left}px`;
      }
    }
    function updateCard() {
      var _a;
      const v2 = getNscValues();
      if (v2.show === "hide") {
        if (card) card.classList.add("nsc-hidden");
        return;
      }
      const next = getNextTrack();
      if (!next) {
        if (card) card.classList.add("nsc-hidden");
        lastUri = "";
        return;
      }
      const uri = next.uri || "";
      const meta = next.metadata || {};
      const title = meta.title || "";
      const albumUri = meta.album_uri || "";
      const allArtists = [];
      if (meta.artist_name) {
        allArtists.push({ name: meta.artist_name, uri: meta.artist_uri || "" });
      }
      for (let i2 = 1; ; i2++) {
        const name = meta[`artist_name:${i2}`];
        if (!name) break;
        allArtists.push({ name, uri: meta[`artist_uri:${i2}`] || "" });
      }
      const artistUri = ((_a = allArtists[0]) == null ? void 0 : _a.uri) || "";
      const imageRaw = meta.image_url || meta.image_xlarge_url || meta.image_large_url || meta.image_small_url || "";
      const image = resolveSpotifyImage(imageRaw);
      const el = ensureCard();
      if (!el) return;
      const coverEl = el.querySelector(".nsc-cover");
      const titleLink = el.querySelector(".nsc-title-link");
      const artistInner = el.querySelector(".nsc-artist-wrap .nsc-marquee-inner");
      const titleWrap = el.querySelector(".nsc-title-wrap");
      const artistWrap = el.querySelector(".nsc-artist-wrap");
      if (coverEl) {
        if (image) {
          coverEl.src = image;
          coverEl.style.display = "";
        } else {
          coverEl.style.display = "none";
        }
        if (albumUri) {
          coverEl.setAttribute("data-uri", albumUri);
        } else if (uri) {
          coverEl.setAttribute("data-uri", uri);
        }
      }
      if (uri !== lastUri) {
        if (titleLink) {
          titleLink.textContent = title;
          if (uri) {
            titleLink.setAttribute("data-uri", uri);
          } else {
            titleLink.removeAttribute("data-uri");
          }
        }
        if (artistInner) {
          artistInner.innerHTML = "";
          const artistContainer = document.createElement("span");
          artistContainer.className = "nsc-artist nsc-artist-container";
          allArtists.forEach((a, idx) => {
            if (idx > 0) {
              const sep = document.createTextNode(", ");
              artistContainer.appendChild(sep);
            }
            const link = document.createElement("a");
            link.className = "nsc-artist nsc-artist-link";
            link.textContent = a.name;
            link.href = "#";
            if (a.uri) link.setAttribute("data-uri", a.uri);
            artistContainer.appendChild(link);
          });
          artistInner.appendChild(artistContainer);
        }
      }
      el.classList.remove("nsc-hidden");
      repositionCard();
      if (uri !== lastUri) {
        lastUri = uri;
        requestAnimationFrame(() => {
          if (titleWrap) setupMarquee(titleWrap);
          if (artistWrap) setupMarquee(artistWrap);
        });
      }
    }
    setInterval(() => {
      try {
        updateCard();
      } catch (e) {
      }
    }, 1e3);
    window.addEventListener("resize", repositionCard);
    document.addEventListener("scroll", repositionCard, true);
    const observePlayer = async () => {
      while (!getPlayerElement()) await sleep(300);
      const player = getPlayerElement();
      if (player) {
        const ro = new ResizeObserver(repositionCard);
        ro.observe(player);
      }
    };
    observePlayer();
    const waitForPlayer = async () => {
      var _a;
      while (!((_a = Spicetify == null ? void 0 : Spicetify.Player) == null ? void 0 : _a.addEventListener)) await sleep(300);
      Spicetify.Player.addEventListener("songchange", () => {
        setTimeout(updateCard, 300);
      });
      setTimeout(updateCard, 500);
    };
    waitForPlayer();
    window.addEventListener("liquifyNscUpdate", () => {
      applyNextSongCardStyle();
      lastUri = "";
      updateCard();
    });
    let cinemaObserver = null;
    let lastCinemaEl = null;
    function watchCinema() {
      const el = document.querySelector(".Root__cinema-view");
      if (el && el !== lastCinemaEl) {
        lastCinemaEl = el;
        if (cinemaObserver) cinemaObserver.disconnect();
        cinemaObserver = new MutationObserver(() => {
          if (!card) return;
          const hidden = el.classList.contains("Root__cinema-view--controls-hidden");
          card.style.opacity = hidden ? "0" : "1";
          card.style.pointerEvents = hidden ? "none" : "auto";
          card.style.backdropFilter = hidden ? "none" : "var(--glass-filter) blur(2px)";
          card.style.webkitBackdropFilter = hidden ? "none" : "var(--glass-filter) blur(2px)";
          card.style.boxShadow = hidden ? "none" : "var(--glass-shadow)";
        });
        cinemaObserver.observe(el, { attributes: true, attributeFilter: ["class"] });
        if (card) {
          const hidden = el.classList.contains("Root__cinema-view--controls-hidden");
          card.style.opacity = hidden ? "0" : "1";
          card.style.pointerEvents = hidden ? "none" : "auto";
          card.style.backdropFilter = hidden ? "none" : "var(--glass-filter) blur(2px)";
          card.style.webkitBackdropFilter = hidden ? "none" : "var(--glass-filter) blur(2px)";
          card.style.boxShadow = hidden ? "none" : "var(--glass-shadow)";
        }
      }
      if (!el && card) {
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
        card.style.backdropFilter = "var(--glass-filter) blur(2px)";
        card.style.webkitBackdropFilter = "var(--glass-filter) blur(2px)";
        card.style.boxShadow = "var(--glass-shadow)";
      }
    }
    setInterval(watchCinema, 1e3);
    let nscBarObserver = null;
    let lastBarContainer = null;
    function watchBarContainer() {
      const el = document.querySelector(".kUPoamhLb3kO_sjj.wRMAmo4RKCAZpoBA");
      if (el && el !== lastBarContainer) {
        lastBarContainer = el;
        if (nscBarObserver) nscBarObserver.disconnect();
        nscBarObserver = new MutationObserver(() => {
          if (!card) return;
          const hidden = el.classList.contains("dwWT5Kw_H7IhSKjG");
          card.style.display = hidden ? "none" : "";
        });
        nscBarObserver.observe(el, { attributes: true, attributeFilter: ["class"] });
        if (card) {
          const hidden = el.classList.contains("dwWT5Kw_H7IhSKjG");
          card.style.display = hidden ? "none" : "";
        }
      }
    }
    setInterval(watchBarContainer, 1e3);
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
          ".POVCTaiu08g8SWXr, [data-playing-indicator]"
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
        document.querySelectorAll("img.view-homeShortcutsGrid-equaliserImage").forEach((img) => {
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
  var HP_MODE_KEY = "liquify-high-performance-mode";
  function applyHighPerformanceMode(mode) {
    localStorage.setItem(HP_MODE_KEY, mode);
    if (mode === "on") {
      const css = `
      .main-card-cardContainer,
      .PromotionDefaultNative-module_card-container__Y90Vl,
      .main-yourLibraryX-libraryContainer {
        --glass-filter: url(#glass-filter--r1-7);
        backdrop-filter: var(--glass-filter) blur(2px) !important;
        -webkit-backdrop-filter: var(--glass-filter) blur(2px) !important;
      }
    `;
      updateStyle("liquify-high-performance-mode", css);
    } else {
      updateStyle("liquify-high-performance-mode", "");
    }
  }
  function ensureHighPerformanceModeApplied() {
    const saved = readLS(HP_MODE_KEY, "off");
    applyHighPerformanceMode(saved);
  }
  var POPUP_BOUNCE_KEY = "liquify-popup-bounce";
  function applyPopupBounce(mode) {
    localStorage.setItem(POPUP_BOUNCE_KEY, mode);
    window.dispatchEvent(new Event("liquifyPopupBounceChange"));
  }
  function ensurePopupBounceApplied() {
    window.dispatchEvent(new Event("liquifyPopupBounceChange"));
  }
  var liquifyTranslations = {
    de: {
      settingsTitle: "Liquify Einstellungen",
      title: "Liquify Einstellungen",
      accentColor: "Button-Farbe:",
      glowColor: "Glow-Farbe:",
      background: "Hintergrund:",
      apbackground: "K\xFCnstler Seiten Hintergrund:",
      artistScrollBlur: "K\xFCnstler Scroll-Unsch\xE4rfe (px):",
      artistScrollBrightness: "K\xFCnstler Scroll-Helligkeit (%):",
      playerWidth: "Player-Breite:",
      playerRadius: "Player-Eckenradius:",
      backgroundBlur: "Hintergrund-Unsch\xE4rfe:",
      backgroundBrightness: "Hintergrund-Helligkeit (%):",
      transparentWidth: "Transparente Controls Breite:",
      transparentHeight: "Transparente Controls H\xF6he:",
      close: "Schlie\xDFen",
      playlistHeaderBox: "Playlist-Header-Box:",
      playerCustomWidth: "Player-Breite (%):",
      playerCustomHeight: "Player-H\xF6he (px):",
      chooseFile: "Datei ausw\xE4hlen",
      enterUrl: "Bild-URL eingeben...",
      sections: {
        accent: "Akzent",
        glow: "Glow",
        background: "Hintergrund",
        artist: "K\xFCnstler",
        player: "Player",
        playlist: "Playlist",
        transparent: "Transparente Controls",
        lyrics: "Lyrics",
        nextSongCard: "N\xE4chster Song Karte",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "High Performance Mode:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "Aus",
        trackInfo: "Neben Titelinfo",
        outsideTrackInfo: "Au\xDFerhalb Titelinfo",
        overCanvas: "\xDCber Canvas",
        showAlways: "Immer anzeigen:",
        yes: "Ja",
        no: "Nein",
        blur: "Unsch\xE4rfe (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "Breite (px)",
        height: "H\xF6he (px)",
        marginBottom: "Abstand unten (px)",
        marginLeft: "Abstand links (px)"
      },
      nextSongCard: {
        show: "N\xE4chster Song Karte anzeigen:",
        position: "Horizontale Position",
        cardHeight: "Kartenh\xF6he (px)",
        cardMaxWidth: "Kartenbreite max. (px)",
        gap: "Abstand Bild/Text (px)",
        coverSize: "Cover-Gr\xF6\xDFe (px)",
        hPad: "Horizontales Padding (px)",
        vPad: "Vertikales Padding (px)",
        gapToPlayer: "Abstand zum Player (px)",
        borderRadius: "Eckenradius (px)",
        coverBorderRadius: "Cover Eckenradius (px)",
        left: "Links",
        right: "Rechts"
      },
      playbarCoverBorderRadius: "Cover-Art Eckenradius:",
      lyricsMode: "Lyrics-\xDCbersetzung/Romanisierung:",
      lyricsOptions: {
        off: "Aus",
        translation: "Nur \xDCbersetzung",
        romanization: "Nur Romanisierung",
        both: "\xDCbersetzung + Romanisierung"
      },
      dropdown: {
        default: "Standard",
        custom: "Benutzerdefiniert",
        dynamic: "Dynamisch",
        animated: "Animiert",
        theme: "Theme",
        none: "Keiner",
        show: "Anzeigen",
        hide: "Ausblenden",
        on: "An",
        off: "Aus",
        url: "URL"
      },
      tooltips: {
        accentColor: "W\xE4hle die Akzentfarbe f\xFCr Buttons und UI-Elemente.",
        background: "W\xE4hle die Quelle f\xFCr das Hintergrundbild.",
        backgroundBlur: "St\xE4rke der Unsch\xE4rfe auf dem Hintergrundbild.",
        backgroundBrightness: "Helligkeit des Hintergrundbildes.",
        apbackground: "Hintergrund auf K\xFCnstlerseiten.",
        artistScrollBlur: "Unsch\xE4rfe beim Scrollen auf K\xFCnstlerseiten.",
        artistScrollBrightness: "Helligkeit beim Scrollen auf K\xFCnstlerseiten.",
        playerWidth: "Breite des Players in der unteren Leiste.",
        playerCustomWidth: "Benutzerdefinierte Breite des Players in Prozent.",
        playerCustomHeight: "Benutzerdefinierte H\xF6he des Players in Pixeln.",
        playerRadius: "Eckenradius des Players.",
        ccaEnabled: "Aktiviert benutzerdefinierte Cover-Art-Gr\xF6\xDFe im Player.",
        ccaWidth: "Breite der Cover-Art im Player.",
        ccaHeight: "H\xF6he der Cover-Art im Player.",
        ccaMarginBottom: "Abstand der Cover-Art nach unten.",
        ccaMarginLeft: "Abstand der Cover-Art nach links.",
        nscShow: "Zeigt eine Karte mit dem n\xE4chsten Song \xFCber dem Player.",
        nscPosition: "Horizontale Position der Karte.",
        nscHeight: "H\xF6he der Karte in Pixeln.",
        nscMaxWidth: "Maximale Breite der Karte.",
        nscGap: "Abstand zwischen Cover und Text in der Karte.",
        nscCoverSize: "Gr\xF6\xDFe des Cover-Bildes in der Karte.",
        nscHPad: "Horizontaler Innenabstand der Karte.",
        nscVPad: "Vertikaler Innenabstand der Karte.",
        nscGapToPlayer: "Abstand zwischen Karte und Player.",
        nscBorderRadius: "Eckenradius der Karte.",
        nscCoverBorderRadius: "Eckenradius des Cover-Bildes in der Karte.",
        playbarCoverRadius: "Eckenradius des Cover-Art in der Playbar.",
        playlistHeaderBox: "Zeigt oder versteckt die Playlist-Header-Box.",
        lyricsMode: "\xDCbersetzung und Romanisierung f\xFCr Songtexte.",
        transparentWidth: "Breite der transparenten Steuerelemente.",
        transparentHeight: "H\xF6he der transparenten Steuerelemente.",
        tncaMode: "Zeigt ein Cover-Art-Bild neben dem Tracknamen in der rechten Seitenleiste.",
        tncaShowAlways: "Cover-Art immer anzeigen, auch wenn das Canvas-Video ausgeblendet ist.",
        tncaOverCanvas: "Zeigt Titelinformationen \xFCber dem Canvas-Video an.",
        tncaBlur: "St\xE4rke der Unsch\xE4rfe f\xFCr das Canvas-Video im Hintergrund.",
        highPerformanceMode: "Aktiviert den vollen Liquid Glass Modus f\xFCr zus\xE4tzliche Elemente. Achtung: Nur f\xFCr Systeme mit guter Performance empfohlen, da viele Liquid Glass Elemente gerendert werden.",
        popupBounce: "Aktiviert oder deaktiviert den Bounce-Effekt bei Popup-Men\xFCs."
      }
    },
    en: {
      settingsTitle: "Liquify Settings",
      title: "Liquify Settings",
      accentColor: "Button Accent Color:",
      glowColor: "Glow Accent Color:",
      background: "Background:",
      apbackground: "Artist Page Background:",
      artistScrollBlur: "Artist Scroll Blur (px):",
      artistScrollBrightness: "Artist Scroll Brightness (%):",
      playerWidth: "Player Width:",
      playerRadius: "Player Border Radius:",
      backgroundBlur: "Background Blur:",
      backgroundBrightness: "Background Brightness (%):",
      transparentWidth: "Transparent Controls Width:",
      transparentHeight: "Transparent Controls Height:",
      close: "Close",
      playlistHeaderBox: "Playlist Header Box:",
      playerCustomWidth: "Player Width (%):",
      playerCustomHeight: "Player Height (px):",
      chooseFile: "Choose file",
      enterUrl: "Enter image URL...",
      sections: {
        accent: "Accent",
        glow: "Glow",
        background: "Background",
        artist: "Artist",
        player: "Player",
        playlist: "Playlist",
        transparent: "Transparent Controls",
        lyrics: "Lyrics",
        nextSongCard: "Next Song Card",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "High Performance Mode:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "Off",
        trackInfo: "Next to Track Info",
        outsideTrackInfo: "Outside Track Info",
        overCanvas: "Over Canvas",
        showAlways: "Show Always:",
        yes: "Yes",
        no: "No",
        blur: "Blur (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "Width (px)",
        height: "Height (px)",
        marginBottom: "Margin Bottom (px)",
        marginLeft: "Margin Left (px)"
      },
      nextSongCard: {
        show: "Show Next Song Card:",
        position: "Horizontal Position",
        cardHeight: "Card Height (px)",
        cardMaxWidth: "Card Max Width (px)",
        gap: "Gap between Image and Text (px)",
        coverSize: "Cover Size (px)",
        hPad: "Horizontal Padding (px)",
        vPad: "Vertical Padding (px)",
        gapToPlayer: "Distance to Player (px)",
        borderRadius: "Border Radius (px)",
        coverBorderRadius: "Cover Border Radius (px)",
        left: "Left",
        right: "Right"
      },
      playbarCoverBorderRadius: "Cover Art Border Radius:",
      lyricsMode: "Lyrics Translation/Romanization:",
      lyricsOptions: {
        off: "Off",
        translation: "Translation only",
        romanization: "Romanization only",
        both: "Translation + Romanization"
      },
      dropdown: {
        default: "Default",
        custom: "Custom",
        dynamic: "Dynamic",
        animated: "Animated",
        theme: "Theme",
        none: "None",
        show: "Show",
        hide: "Hide",
        on: "On",
        off: "Off",
        url: "URL"
      },
      tooltips: {
        accentColor: "Choose the accent color for buttons and UI elements.",
        background: "Select the source for the background image.",
        backgroundBlur: "Amount of blur applied to the background image.",
        backgroundBrightness: "Brightness of the background image.",
        apbackground: "Background on artist pages.",
        artistScrollBlur: "Blur effect when scrolling on artist pages.",
        artistScrollBrightness: "Brightness when scrolling on artist pages.",
        playerWidth: "Width of the player in the bottom bar.",
        playerCustomWidth: "Custom player width in percent.",
        playerCustomHeight: "Custom player height in pixels.",
        playerRadius: "Corner radius of the player.",
        ccaEnabled: "Enable custom cover art size in the player.",
        ccaWidth: "Width of the cover art in the player.",
        ccaHeight: "Height of the cover art in the player.",
        ccaMarginBottom: "Bottom margin of the cover art.",
        ccaMarginLeft: "Left margin of the cover art.",
        nscShow: "Shows a card with the next song above the player.",
        nscPosition: "Horizontal position of the card.",
        nscHeight: "Height of the card in pixels.",
        nscMaxWidth: "Maximum width of the card.",
        nscGap: "Gap between cover and text inside the card.",
        nscCoverSize: "Size of the cover image in the card.",
        nscHPad: "Horizontal inner padding of the card.",
        nscVPad: "Vertical inner padding of the card.",
        nscGapToPlayer: "Distance between card and player.",
        nscBorderRadius: "Corner radius of the card.",
        nscCoverBorderRadius: "Corner radius of the cover image in the card.",
        playbarCoverRadius: "Corner radius of the cover art in the playbar.",
        playlistHeaderBox: "Show or hide the playlist header box.",
        lyricsMode: "Translation and romanization for song lyrics.",
        transparentWidth: "Width of the transparent controls.",
        transparentHeight: "Height of the transparent controls.",
        tncaMode: "Display a cover art thumbnail next to the track name in the right sidebar.",
        tncaShowAlways: "Always show cover art even when the canvas video is hidden.",
        tncaOverCanvas: "Display track information overlaid on the canvas video.",
        tncaBlur: "Blur intensity for the canvas video background.",
        highPerformanceMode: "Enables the full Liquid Glass mode for additional elements. Warning: Only recommended for systems with good performance, as many Liquid Glass elements will be rendered.",
        popupBounce: "Enable or disable the bounce effect on popup menus."
      }
    },
    ru: {
      settingsTitle: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Liquify",
      title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Liquify",
      accentColor: "\u0426\u0432\u0435\u0442 \u0430\u043A\u0446\u0435\u043D\u0442\u0430 \u043A\u043D\u043E\u043F\u043E\u043A:",
      glowColor: "\u0426\u0432\u0435\u0442 \u0441\u0432\u0435\u0447\u0435\u043D\u0438\u044F:",
      background: "\u0424\u043E\u043D:",
      apbackground: "\u0424\u043E\u043D \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0430\u0440\u0442\u0438\u0441\u0442\u0430:",
      artistScrollBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0438 \u0430\u0440\u0442\u0438\u0441\u0442\u0430 (px):",
      artistScrollBrightness: "\u042F\u0440\u043A\u043E\u0441\u0442\u044C \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0438 \u0430\u0440\u0442\u0438\u0441\u0442\u0430 (%):",
      playerWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u0435\u0435\u0440\u0430:",
      playerRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u0443\u0433\u043B\u043E\u0432 \u043F\u043B\u0435\u0435\u0440\u0430:",
      backgroundBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0444\u043E\u043D\u0430:",
      backgroundBrightness: "\u042F\u0440\u043A\u043E\u0441\u0442\u044C \u0444\u043E\u043D\u0430 (%):",
      transparentWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432:",
      transparentHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432:",
      close: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
      playlistHeaderBox: "\u0411\u043B\u043E\u043A \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430 \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u0430:",
      playerCustomWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u0435\u0435\u0440\u0430 (%):",
      playerCustomHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043F\u043B\u0435\u0435\u0440\u0430 (px):",
      chooseFile: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B",
      enterUrl: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 URL \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F...",
      sections: {
        accent: "\u0410\u043A\u0446\u0435\u043D\u0442",
        glow: "\u0421\u0432\u0435\u0447\u0435\u043D\u0438\u0435",
        background: "\u0424\u043E\u043D",
        artist: "\u0410\u0440\u0442\u0438\u0441\u0442",
        player: "\u041F\u043B\u0435\u0435\u0440",
        playlist: "\u041F\u043B\u0435\u0439\u043B\u0438\u0441\u0442",
        transparent: "\u041F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
        lyrics: "\u0422\u0435\u043A\u0441\u0442\u044B \u043F\u0435\u0441\u0435\u043D",
        nextSongCard: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u043F\u0435\u0441\u043D\u0438",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "\u0420\u0435\u0436\u0438\u043C \u0432\u044B\u0441\u043E\u043A\u043E\u0439 \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "\u0412\u044B\u043A\u043B",
        trackInfo: "\u0420\u044F\u0434\u043E\u043C \u0441 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0435\u0439 \u043E \u0442\u0440\u0435\u043A\u0435",
        outsideTrackInfo: "\u0417\u0430 \u043F\u0440\u0435\u0434\u0435\u043B\u0430\u043C\u0438 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u043E \u0442\u0440\u0435\u043A\u0435",
        overCanvas: "Over Canvas",
        showAlways: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0432\u0441\u0435\u0433\u0434\u0430:",
        yes: "\u0414\u0430",
        no: "\u041D\u0435\u0442",
        blur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "\u0428\u0438\u0440\u0438\u043D\u0430 (px)",
        height: "\u0412\u044B\u0441\u043E\u0442\u0430 (px)",
        marginBottom: "\u041E\u0442\u0441\u0442\u0443\u043F \u0441\u043D\u0438\u0437\u0443 (px)",
        marginLeft: "\u041E\u0442\u0441\u0442\u0443\u043F \u0441\u043B\u0435\u0432\u0430 (px)"
      },
      nextSongCard: {
        show: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u043F\u0435\u0441\u043D\u0438:",
        position: "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u043E\u0435 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
        cardHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 (px)",
        cardMaxWidth: "\u041C\u0430\u043A\u0441. \u0448\u0438\u0440\u0438\u043D\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 (px)",
        gap: "\u041E\u0442\u0441\u0442\u0443\u043F \u043C\u0435\u0436\u0434\u0443 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435\u043C \u0438 \u0442\u0435\u043A\u0441\u0442\u043E\u043C (px)",
        coverSize: "\u0420\u0430\u0437\u043C\u0435\u0440 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 (px)",
        hPad: "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0441\u0442\u0443\u043F (px)",
        vPad: "\u0412\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0441\u0442\u0443\u043F (px)",
        gapToPlayer: "\u0420\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0434\u043E \u043F\u043B\u0435\u0435\u0440\u0430 (px)",
        borderRadius: "\u0420\u0430\u0434\u0438\u0443\u0441 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F (px)",
        coverBorderRadius: "\u0420\u0430\u0434\u0438\u0443\u0441 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F \u043E\u0431\u043B\u043E\u0436\u043A\u0438 (px)",
        left: "\u0421\u043B\u0435\u0432\u0430",
        right: "\u0421\u043F\u0440\u0430\u0432\u0430"
      },
      playbarCoverBorderRadius: "\u0420\u0430\u0434\u0438\u0443\u0441 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F \u043E\u0431\u043B\u043E\u0436\u043A\u0438:",
      lyricsMode: "\u041F\u0435\u0440\u0435\u0432\u043E\u0434/\u0420\u043E\u043C\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0442\u0435\u043A\u0441\u0442\u0430:",
      lyricsOptions: {
        off: "\u0412\u044B\u043A\u043B",
        translation: "\u0422\u043E\u043B\u044C\u043A\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434",
        romanization: "\u0422\u043E\u043B\u044C\u043A\u043E \u0440\u043E\u043C\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F",
        both: "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 + \u0420\u043E\u043C\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F"
      },
      dropdown: {
        default: "\u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u043E",
        custom: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0439",
        dynamic: "\u0414\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439",
        animated: "\u0410\u043D\u0438\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439",
        theme: "\u0422\u0435\u043C\u0430",
        none: "\u041D\u0435\u0442",
        show: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C",
        hide: "\u0421\u043A\u0440\u044B\u0442\u044C",
        on: "\u0412\u043A\u043B",
        off: "\u0412\u044B\u043A\u043B",
        url: "URL"
      },
      tooltips: {
        accentColor: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0446\u0432\u0435\u0442 \u0430\u043A\u0446\u0435\u043D\u0442\u0430 \u0434\u043B\u044F \u043A\u043D\u043E\u043F\u043E\u043A \u0438 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430.",
        background: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0444\u043E\u043D\u043E\u0432\u043E\u0433\u043E \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F.",
        backgroundBlur: "\u0421\u0442\u0435\u043F\u0435\u043D\u044C \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u044F \u0444\u043E\u043D\u043E\u0432\u043E\u0433\u043E \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F.",
        backgroundBrightness: "\u042F\u0440\u043A\u043E\u0441\u0442\u044C \u0444\u043E\u043D\u043E\u0432\u043E\u0433\u043E \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F.",
        apbackground: "\u0424\u043E\u043D \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0430\u0440\u0442\u0438\u0441\u0442\u043E\u0432.",
        artistScrollBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u043F\u0440\u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u0430\u0440\u0442\u0438\u0441\u0442\u043E\u0432.",
        artistScrollBrightness: "\u042F\u0440\u043A\u043E\u0441\u0442\u044C \u043F\u0440\u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u0430\u0440\u0442\u0438\u0441\u0442\u043E\u0432.",
        playerWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u0435\u0435\u0440\u0430 \u0432 \u043D\u0438\u0436\u043D\u0435\u0439 \u043F\u0430\u043D\u0435\u043B\u0438.",
        playerCustomWidth: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0430\u044F \u0448\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u0435\u0435\u0440\u0430 \u0432 \u043F\u0440\u043E\u0446\u0435\u043D\u0442\u0430\u0445.",
        playerCustomHeight: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0430\u044F \u0432\u044B\u0441\u043E\u0442\u0430 \u043F\u043B\u0435\u0435\u0440\u0430 \u0432 \u043F\u0438\u043A\u0441\u0435\u043B\u044F\u0445.",
        playerRadius: "\u0420\u0430\u0434\u0438\u0443\u0441 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F \u0443\u0433\u043B\u043E\u0432 \u043F\u043B\u0435\u0435\u0440\u0430.",
        ccaEnabled: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0439 \u0440\u0430\u0437\u043C\u0435\u0440 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 \u0432 \u043F\u043B\u0435\u0435\u0440\u0435.",
        ccaWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 \u0432 \u043F\u043B\u0435\u0435\u0440\u0435.",
        ccaHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 \u0432 \u043F\u043B\u0435\u0435\u0440\u0435.",
        ccaMarginBottom: "\u041D\u0438\u0436\u043D\u0438\u0439 \u043E\u0442\u0441\u0442\u0443\u043F \u043E\u0431\u043B\u043E\u0436\u043A\u0438.",
        ccaMarginLeft: "\u041B\u0435\u0432\u044B\u0439 \u043E\u0442\u0441\u0442\u0443\u043F \u043E\u0431\u043B\u043E\u0436\u043A\u0438.",
        nscShow: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u043F\u0435\u0441\u043D\u0438 \u043D\u0430\u0434 \u043F\u043B\u0435\u0435\u0440\u043E\u043C.",
        nscPosition: "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u043E\u0435 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438.",
        nscHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u0432 \u043F\u0438\u043A\u0441\u0435\u043B\u044F\u0445.",
        nscMaxWidth: "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u0430\u044F \u0448\u0438\u0440\u0438\u043D\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438.",
        nscGap: "\u0420\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043C\u0435\u0436\u0434\u0443 \u043E\u0431\u043B\u043E\u0436\u043A\u043E\u0439 \u0438 \u0442\u0435\u043A\u0441\u0442\u043E\u043C \u0432 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435.",
        nscCoverSize: "\u0420\u0430\u0437\u043C\u0435\u0440 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 \u0432 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435.",
        nscHPad: "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u044B\u0439 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0439 \u043E\u0442\u0441\u0442\u0443\u043F \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438.",
        nscVPad: "\u0412\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0439 \u043E\u0442\u0441\u0442\u0443\u043F \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438.",
        nscGapToPlayer: "\u0420\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043C\u0435\u0436\u0434\u0443 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u043E\u0439 \u0438 \u043F\u043B\u0435\u0435\u0440\u043E\u043C.",
        nscBorderRadius: "\u0420\u0430\u0434\u0438\u0443\u0441 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F \u0443\u0433\u043B\u043E\u0432 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438.",
        nscCoverBorderRadius: "\u0420\u0430\u0434\u0438\u0443\u0441 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F \u043E\u0431\u043B\u043E\u0436\u043A\u0438 \u0432 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435.",
        playbarCoverRadius: "\u0420\u0430\u0434\u0438\u0443\u0441 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F \u043E\u0431\u043B\u043E\u0436\u043A\u0438 \u0432 \u043F\u043B\u0435\u0435\u0440\u0435.",
        playlistHeaderBox: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0438\u043B\u0438 \u0441\u043A\u0440\u044B\u0442\u044C \u0431\u043B\u043E\u043A \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430 \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u0430.",
        lyricsMode: "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0438 \u0440\u043E\u043C\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0442\u0435\u043A\u0441\u0442\u043E\u0432 \u043F\u0435\u0441\u0435\u043D.",
        transparentWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F.",
        transparentHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F.",
        tncaMode: "\u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u0435\u0442 \u043E\u0431\u043B\u043E\u0436\u043A\u0443 \u0440\u044F\u0434\u043E\u043C \u0441 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435\u043C \u0442\u0440\u0435\u043A\u0430 \u0432 \u043F\u0440\u0430\u0432\u043E\u0439 \u0431\u043E\u043A\u043E\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438.",
        tncaShowAlways: "\u0412\u0441\u0435\u0433\u0434\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043E\u0431\u043B\u043E\u0436\u043A\u0443, \u0434\u0430\u0436\u0435 \u0435\u0441\u043B\u0438 \u043F\u0430\u043D\u0435\u043B\u044C \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u0441\u043A\u0440\u044B\u0442\u0430.",
        tncaOverCanvas: "\u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u0435\u0442 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044E \u043E \u0442\u0440\u0435\u043A\u0435 \u043F\u043E\u0432\u0435\u0440\u0445 \u0432\u0438\u0434\u0435\u043E Canvas.",
        tncaBlur: "\u0418\u043D\u0442\u0435\u043D\u0441\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u044F \u0434\u043B\u044F \u0444\u043E\u043D\u043E\u0432\u043E\u0433\u043E \u0432\u0438\u0434\u0435\u043E Canvas.",
        highPerformanceMode: "\u0412\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u043F\u043E\u043B\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C Liquid Glass \u0434\u043B\u044F \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432. \u0412\u043D\u0438\u043C\u0430\u043D\u0438\u0435: \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0441\u0438\u0441\u0442\u0435\u043C \u0441 \u0445\u043E\u0440\u043E\u0448\u0435\u0439 \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C\u044E.",
        popupBounce: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u043B\u0438 \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u044D\u0444\u0444\u0435\u043A\u0442 \u043E\u0442\u0441\u043A\u043E\u043A\u0430 \u0432\u0441\u043F\u043B\u044B\u0432\u0430\u044E\u0449\u0438\u0445 \u043C\u0435\u043D\u044E."
      }
    },
    es: {
      settingsTitle: "Configuraci\xF3n de Liquify",
      title: "Configuraci\xF3n de Liquify",
      accentColor: "Color de acento del bot\xF3n:",
      glowColor: "Color del brillo:",
      background: "Fondo:",
      apbackground: "Fondo de la p\xE1gina del artista:",
      artistScrollBlur: "Desenfoque de desplazamiento del artista (px):",
      artistScrollBrightness: "Brillo de desplazamiento del artista (%):",
      playerWidth: "Ancho del reproductor:",
      playerRadius: "Radio del borde del reproductor:",
      backgroundBlur: "Desenfoque del fondo:",
      backgroundBrightness: "Brillo del fondo (%):",
      transparentWidth: "Ancho de controles transparentes:",
      transparentHeight: "Altura de controles transparentes:",
      close: "Cerrar",
      playlistHeaderBox: "Caja del encabezado de la playlist:",
      playerCustomWidth: "Ancho del reproductor (%):",
      playerCustomHeight: "Altura del reproductor (px):",
      chooseFile: "Elegir archivo",
      enterUrl: "Introducir URL de imagen...",
      sections: {
        accent: "Acento",
        glow: "Brillo",
        background: "Fondo",
        artist: "Artista",
        player: "Reproductor",
        playlist: "Playlist",
        transparent: "Controles transparentes",
        lyrics: "Letras",
        nextSongCard: "Tarjeta de la siguiente canci\xF3n",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "Modo de alto rendimiento:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "Desactivado",
        trackInfo: "Junto a info de pista",
        outsideTrackInfo: "Fuera de info de pista",
        overCanvas: "Over Canvas",
        showAlways: "Mostrar siempre:",
        yes: "S\xED",
        no: "No",
        blur: "Desenfoque (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "Ancho (px)",
        height: "Alto (px)",
        marginBottom: "Margen inferior (px)",
        marginLeft: "Margen izquierdo (px)"
      },
      nextSongCard: {
        show: "Mostrar tarjeta de la siguiente canci\xF3n:",
        position: "Posici\xF3n horizontal",
        cardHeight: "Altura de la tarjeta (px)",
        cardMaxWidth: "Ancho m\xE1ximo de la tarjeta (px)",
        gap: "Espacio entre imagen y texto (px)",
        coverSize: "Tama\xF1o de la portada (px)",
        hPad: "Relleno horizontal (px)",
        vPad: "Relleno vertical (px)",
        gapToPlayer: "Distancia al reproductor (px)",
        borderRadius: "Radio de borde (px)",
        coverBorderRadius: "Radio de borde de portada (px)",
        left: "Izquierda",
        right: "Derecha"
      },
      playbarCoverBorderRadius: "Radio de borde de portada:",
      lyricsMode: "Traducci\xF3n/Romanizaci\xF3n de letras:",
      lyricsOptions: {
        off: "Desactivado",
        translation: "Solo traducci\xF3n",
        romanization: "Solo romanizaci\xF3n",
        both: "Traducci\xF3n + Romanizaci\xF3n"
      },
      dropdown: {
        default: "Predeterminado",
        custom: "Personalizado",
        dynamic: "Din\xE1mico",
        animated: "Animado",
        theme: "Tema",
        none: "Ninguno",
        show: "Mostrar",
        hide: "Ocultar",
        on: "Activado",
        off: "Desactivado",
        url: "URL"
      },
      tooltips: {
        accentColor: "Elige el color de acento para botones y elementos de la interfaz.",
        background: "Selecciona la fuente de la imagen de fondo.",
        backgroundBlur: "Cantidad de desenfoque aplicado a la imagen de fondo.",
        backgroundBrightness: "Brillo de la imagen de fondo.",
        apbackground: "Fondo en las p\xE1ginas de artistas.",
        artistScrollBlur: "Desenfoque al desplazarse en p\xE1ginas de artistas.",
        artistScrollBrightness: "Brillo al desplazarse en p\xE1ginas de artistas.",
        playerWidth: "Ancho del reproductor en la barra inferior.",
        playerCustomWidth: "Ancho personalizado del reproductor en porcentaje.",
        playerCustomHeight: "Altura personalizada del reproductor en p\xEDxeles.",
        playerRadius: "Radio de las esquinas del reproductor.",
        ccaEnabled: "Activa un tama\xF1o personalizado para la portada en el reproductor.",
        ccaWidth: "Ancho de la portada en el reproductor.",
        ccaHeight: "Altura de la portada en el reproductor.",
        ccaMarginBottom: "Margen inferior de la portada.",
        ccaMarginLeft: "Margen izquierdo de la portada.",
        nscShow: "Muestra una tarjeta con la siguiente canci\xF3n sobre el reproductor.",
        nscPosition: "Posici\xF3n horizontal de la tarjeta.",
        nscHeight: "Altura de la tarjeta en p\xEDxeles.",
        nscMaxWidth: "Ancho m\xE1ximo de la tarjeta.",
        nscGap: "Espacio entre portada y texto en la tarjeta.",
        nscCoverSize: "Tama\xF1o de la portada en la tarjeta.",
        nscHPad: "Relleno horizontal interno de la tarjeta.",
        nscVPad: "Relleno vertical interno de la tarjeta.",
        nscGapToPlayer: "Distancia entre la tarjeta y el reproductor.",
        nscBorderRadius: "Radio de las esquinas de la tarjeta.",
        nscCoverBorderRadius: "Radio de las esquinas de la portada en la tarjeta.",
        playbarCoverRadius: "Radio de las esquinas de la portada en el reproductor.",
        playlistHeaderBox: "Mostrar u ocultar la caja del encabezado de la playlist.",
        lyricsMode: "Traducci\xF3n y romanizaci\xF3n de las letras de canciones.",
        transparentWidth: "Ancho de los controles transparentes.",
        transparentHeight: "Altura de los controles transparentes.",
        tncaMode: "Muestra una miniatura de portada junto al nombre de la pista en la barra lateral derecha.",
        tncaShowAlways: "Mostrar siempre la portada incluso cuando la vista de reproducci\xF3n est\xE1 oculta.",
        tncaOverCanvas: "Muestra informaci\xF3n de la pista superpuesta en el video Canvas.",
        tncaBlur: "Intensidad del desenfoque para el video Canvas de fondo.",
        highPerformanceMode: "Activa el modo Liquid Glass completo para elementos adicionales. Advertencia: Solo recomendado para sistemas con buen rendimiento.",
        popupBounce: "Activa o desactiva el efecto de rebote en los men\xFAs emergentes."
      }
    },
    pt: {
      settingsTitle: "Configura\xE7\xF5es do Liquify",
      title: "Configura\xE7\xF5es do Liquify",
      accentColor: "Cor de destaque do bot\xE3o:",
      glowColor: "Cor do brilho:",
      background: "Fundo:",
      apbackground: "Fundo da p\xE1gina do artista:",
      artistScrollBlur: "Desfoque de rolagem do artista (px):",
      artistScrollBrightness: "Brilho de rolagem do artista (%):",
      playerWidth: "Largura do player:",
      playerRadius: "Raio do canto do player:",
      backgroundBlur: "Desfoque do fundo:",
      backgroundBrightness: "Brilho do fundo (%):",
      transparentWidth: "Largura dos controles transparentes:",
      transparentHeight: "Altura dos controles transparentes:",
      close: "Fechar",
      playlistHeaderBox: "Caixa do cabe\xE7alho da playlist:",
      playerCustomWidth: "Largura do player (%):",
      playerCustomHeight: "Altura do player (px):",
      chooseFile: "Escolher arquivo",
      enterUrl: "Inserir URL da imagem...",
      sections: {
        accent: "Destaque",
        glow: "Brilho",
        background: "Fundo",
        artist: "Artista",
        player: "Player",
        playlist: "Playlist",
        transparent: "Controles transparentes",
        lyrics: "Letras",
        nextSongCard: "Cart\xE3o da pr\xF3xima m\xFAsica",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "Modo de alta performance:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "Desligado",
        trackInfo: "Ao lado da info da faixa",
        outsideTrackInfo: "Fora da info da faixa",
        overCanvas: "Over Canvas",
        showAlways: "Mostrar sempre:",
        yes: "Sim",
        no: "N\xE3o",
        blur: "Desfoque (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "Largura (px)",
        height: "Altura (px)",
        marginBottom: "Margem inferior (px)",
        marginLeft: "Margem esquerda (px)"
      },
      nextSongCard: {
        show: "Mostrar cart\xE3o da pr\xF3xima m\xFAsica:",
        position: "Posi\xE7\xE3o horizontal",
        cardHeight: "Altura do cart\xE3o (px)",
        cardMaxWidth: "Largura m\xE1xima do cart\xE3o (px)",
        gap: "Espa\xE7o entre imagem e texto (px)",
        coverSize: "Tamanho da capa (px)",
        hPad: "Preenchimento horizontal (px)",
        vPad: "Preenchimento vertical (px)",
        gapToPlayer: "Dist\xE2ncia ao reprodutor (px)",
        borderRadius: "Raio da borda (px)",
        coverBorderRadius: "Raio da borda da capa (px)",
        left: "Esquerda",
        right: "Direita"
      },
      playbarCoverBorderRadius: "Raio da borda da capa:",
      lyricsMode: "Tradu\xE7\xE3o/Romaniza\xE7\xE3o das letras:",
      lyricsOptions: {
        off: "Desligado",
        translation: "Apenas tradu\xE7\xE3o",
        romanization: "Apenas romaniza\xE7\xE3o",
        both: "Tradu\xE7\xE3o + Romaniza\xE7\xE3o"
      },
      dropdown: {
        default: "Padr\xE3o",
        custom: "Personalizado",
        dynamic: "Din\xE2mico",
        animated: "Animado",
        theme: "Tema",
        none: "Nenhum",
        show: "Mostrar",
        hide: "Ocultar",
        on: "Ligado",
        off: "Desligado",
        url: "URL"
      },
      tooltips: {
        accentColor: "Escolha a cor de destaque para bot\xF5es e elementos da interface.",
        background: "Selecione a fonte da imagem de fundo.",
        backgroundBlur: "Quantidade de desfoque aplicado \xE0 imagem de fundo.",
        backgroundBrightness: "Brilho da imagem de fundo.",
        apbackground: "Fundo nas p\xE1ginas de artistas.",
        artistScrollBlur: "Desfoque ao rolar nas p\xE1ginas de artistas.",
        artistScrollBrightness: "Brilho ao rolar nas p\xE1ginas de artistas.",
        playerWidth: "Largura do player na barra inferior.",
        playerCustomWidth: "Largura personalizada do player em porcentagem.",
        playerCustomHeight: "Altura personalizada do player em pixels.",
        playerRadius: "Raio do canto do player.",
        ccaEnabled: "Ativa tamanho personalizado da capa no player.",
        ccaWidth: "Largura da capa no player.",
        ccaHeight: "Altura da capa no player.",
        ccaMarginBottom: "Margem inferior da capa.",
        ccaMarginLeft: "Margem esquerda da capa.",
        nscShow: "Mostra um cart\xE3o com a pr\xF3xima m\xFAsica acima do player.",
        nscPosition: "Posi\xE7\xE3o horizontal do cart\xE3o.",
        nscHeight: "Altura do cart\xE3o em pixels.",
        nscMaxWidth: "Largura m\xE1xima do cart\xE3o.",
        nscGap: "Espa\xE7o entre capa e texto no cart\xE3o.",
        nscCoverSize: "Tamanho da capa no cart\xE3o.",
        nscHPad: "Preenchimento horizontal interno do cart\xE3o.",
        nscVPad: "Preenchimento vertical interno do cart\xE3o.",
        nscGapToPlayer: "Dist\xE2ncia entre o cart\xE3o e o player.",
        nscBorderRadius: "Raio do canto do cart\xE3o.",
        nscCoverBorderRadius: "Raio do canto da capa no cart\xE3o.",
        playbarCoverRadius: "Raio do canto da capa no player.",
        playlistHeaderBox: "Mostrar ou ocultar a caixa do cabe\xE7alho da playlist.",
        lyricsMode: "Tradu\xE7\xE3o e romaniza\xE7\xE3o das letras das m\xFAsicas.",
        transparentWidth: "Largura dos controles transparentes.",
        transparentHeight: "Altura dos controles transparentes.",
        tncaMode: "Exibe uma miniatura de capa ao lado do nome da faixa na barra lateral direita.",
        tncaShowAlways: "Mostrar sempre a capa mesmo quando a visualiza\xE7\xE3o de reprodu\xE7\xE3o est\xE1 oculta.",
        tncaOverCanvas: "Exibe informa\xE7\xF5es da faixa sobrepostas no v\xEDdeo Canvas.",
        tncaBlur: "Intensidade do desfoque para o v\xEDdeo Canvas de fundo.",
        highPerformanceMode: "Ativa o modo Liquid Glass completo para elementos adicionais. Aten\xE7\xE3o: Recomendado apenas para sistemas com boa performance.",
        popupBounce: "Ativa ou desativa o efeito de quique nos menus pop-up."
      }
    },
    tr: {
      settingsTitle: "Liquify Ayarlar\u0131",
      title: "Liquify Ayarlar\u0131",
      accentColor: "D\xFC\u011Fme vurgu rengi:",
      glowColor: "Parlama rengi:",
      background: "Arka plan:",
      apbackground: "Sanat\xE7\u0131 Sayfas\u0131 Arka Plan\u0131:",
      artistScrollBlur: "Sanat\xE7\u0131 kayd\u0131rma bulan\u0131kl\u0131\u011F\u0131 (px):",
      artistScrollBrightness: "Sanat\xE7\u0131 kayd\u0131rma parlakl\u0131\u011F\u0131 (%):",
      playerWidth: "Oynat\u0131c\u0131 geni\u015Fli\u011Fi:",
      playerRadius: "Oynat\u0131c\u0131 k\xF6\u015Fe yuvarlama:",
      backgroundBlur: "Arka plan bulan\u0131kl\u0131\u011F\u0131:",
      backgroundBrightness: "Arka plan parlakl\u0131\u011F\u0131 (%):",
      transparentWidth: "\u015Eeffaf kontroller geni\u015Fli\u011Fi:",
      transparentHeight: "\u015Eeffaf kontroller y\xFCksekli\u011Fi:",
      close: "Kapat",
      playlistHeaderBox: "\xC7alma listesi ba\u015Fl\u0131k kutusu:",
      playerCustomWidth: "Oynat\u0131c\u0131 geni\u015Fli\u011Fi (%):",
      playerCustomHeight: "Oynat\u0131c\u0131 y\xFCksekli\u011Fi (px):",
      chooseFile: "Dosya se\xE7",
      enterUrl: "Resim URL'si girin...",
      sections: {
        accent: "Vurgu",
        glow: "Parlama",
        background: "Arka Plan",
        artist: "Sanat\xE7\u0131",
        player: "Oynat\u0131c\u0131",
        playlist: "\xC7alma Listesi",
        transparent: "\u015Eeffaf Kontroller",
        lyrics: "\u015Eark\u0131 S\xF6zleri",
        nextSongCard: "Sonraki \u015Eark\u0131 Kart\u0131",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "Y\xFCksek Performans Modu:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "Kapal\u0131",
        trackInfo: "Par\xE7a bilgisi yan\u0131nda",
        outsideTrackInfo: "Par\xE7a bilgisi d\u0131\u015F\u0131nda",
        overCanvas: "Over Canvas",
        showAlways: "Her zaman g\xF6ster:",
        yes: "Evet",
        no: "Hay\u0131r",
        blur: "Bulan\u0131kl\u0131k (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "Geni\u015Flik (px)",
        height: "Y\xFCkseklik (px)",
        marginBottom: "Alt kenar bo\u015Flu\u011Fu (px)",
        marginLeft: "Sol kenar bo\u015Flu\u011Fu (px)"
      },
      nextSongCard: {
        show: "Sonraki \u015Fark\u0131 kart\u0131n\u0131 g\xF6ster:",
        position: "Yatay konum",
        cardHeight: "Kart y\xFCksekli\u011Fi (px)",
        cardMaxWidth: "Kart maks. geni\u015Flik (px)",
        gap: "G\xF6rsel ve metin aras\u0131 bo\u015Fluk (px)",
        coverSize: "Kapak boyutu (px)",
        hPad: "Yatay dolgu (px)",
        vPad: "Dikey dolgu (px)",
        gapToPlayer: "Oynat\u0131c\u0131ya mesafe (px)",
        borderRadius: "K\xF6\u015Fe yar\u0131\xE7ap\u0131 (px)",
        coverBorderRadius: "Kapak k\xF6\u015Fe yar\u0131\xE7ap\u0131 (px)",
        left: "Sol",
        right: "Sa\u011F"
      },
      playbarCoverBorderRadius: "Kapak k\xF6\u015Fe yar\u0131\xE7ap\u0131:",
      lyricsMode: "\u015Eark\u0131 S\xF6z\xFC \xC7eviri/Romanizasyonu:",
      lyricsOptions: {
        off: "Kapal\u0131",
        translation: "Yaln\u0131zca \xE7eviri",
        romanization: "Yaln\u0131zca romanizasyon",
        both: "\xC7eviri + Romanizasyon"
      },
      dropdown: {
        default: "Varsay\u0131lan",
        custom: "\xD6zel",
        dynamic: "Dinamik",
        animated: "Animasyonlu",
        theme: "Tema",
        none: "Hi\xE7biri",
        show: "G\xF6ster",
        hide: "Gizle",
        on: "A\xE7\u0131k",
        off: "Kapal\u0131",
        url: "URL"
      },
      tooltips: {
        accentColor: "D\xFC\u011Fmeler ve aray\xFCz \xF6\u011Feleri i\xE7in vurgu rengini se\xE7in.",
        background: "Arka plan g\xF6r\xFCnt\xFCs\xFCn\xFCn kayna\u011F\u0131n\u0131 se\xE7in.",
        backgroundBlur: "Arka plan g\xF6r\xFCnt\xFCs\xFCne uygulanan bulan\u0131kl\u0131k miktar\u0131.",
        backgroundBrightness: "Arka plan g\xF6r\xFCnt\xFCs\xFCn\xFCn parlakl\u0131\u011F\u0131.",
        apbackground: "Sanat\xE7\u0131 sayfalar\u0131ndaki arka plan.",
        artistScrollBlur: "Sanat\xE7\u0131 sayfalar\u0131nda kayd\u0131rma s\u0131ras\u0131nda bulan\u0131kl\u0131k.",
        artistScrollBrightness: "Sanat\xE7\u0131 sayfalar\u0131nda kayd\u0131rma s\u0131ras\u0131nda parlakl\u0131k.",
        playerWidth: "Alt \xE7ubuktaki oynat\u0131c\u0131 geni\u015Fli\u011Fi.",
        playerCustomWidth: "\xD6zel oynat\u0131c\u0131 geni\u015Fli\u011Fi y\xFCzde olarak.",
        playerCustomHeight: "\xD6zel oynat\u0131c\u0131 y\xFCksekli\u011Fi piksel olarak.",
        playerRadius: "Oynat\u0131c\u0131n\u0131n k\xF6\u015Fe yuvarlama yar\u0131\xE7ap\u0131.",
        ccaEnabled: "Oynat\u0131c\u0131da \xF6zel kapak g\xF6rseli boyutunu etkinle\u015Ftir.",
        ccaWidth: "Oynat\u0131c\u0131daki kapak g\xF6rselinin geni\u015Fli\u011Fi.",
        ccaHeight: "Oynat\u0131c\u0131daki kapak g\xF6rselinin y\xFCksekli\u011Fi.",
        ccaMarginBottom: "Kapak g\xF6rselinin alt kenar bo\u015Flu\u011Fu.",
        ccaMarginLeft: "Kapak g\xF6rselinin sol kenar bo\u015Flu\u011Fu.",
        nscShow: "Oynat\u0131c\u0131n\u0131n \xFCzerinde sonraki \u015Fark\u0131 kart\u0131n\u0131 g\xF6sterir.",
        nscPosition: "Kart\u0131n yatay konumu.",
        nscHeight: "Kart\u0131n piksel cinsinden y\xFCksekli\u011Fi.",
        nscMaxWidth: "Kart\u0131n maksimum geni\u015Fli\u011Fi.",
        nscGap: "Karttaki kapak ile metin aras\u0131ndaki bo\u015Fluk.",
        nscCoverSize: "Karttaki kapak g\xF6rselinin boyutu.",
        nscHPad: "Kart\u0131n yatay i\xE7 dolgusu.",
        nscVPad: "Kart\u0131n dikey i\xE7 dolgusu.",
        nscGapToPlayer: "Kart ile oynat\u0131c\u0131 aras\u0131ndaki mesafe.",
        nscBorderRadius: "Kart\u0131n k\xF6\u015Fe yuvarlama yar\u0131\xE7ap\u0131.",
        nscCoverBorderRadius: "Karttaki kapak g\xF6rselinin k\xF6\u015Fe yar\u0131\xE7ap\u0131.",
        playbarCoverRadius: "Oynat\u0131c\u0131daki kapak g\xF6rselinin k\xF6\u015Fe yar\u0131\xE7ap\u0131.",
        playlistHeaderBox: "\xC7alma listesi ba\u015Fl\u0131k kutusunu g\xF6ster veya gizle.",
        lyricsMode: "\u015Eark\u0131 s\xF6zleri i\xE7in \xE7eviri ve romanizasyon.",
        transparentWidth: "\u015Eeffaf kontrollerin geni\u015Fli\u011Fi.",
        transparentHeight: "\u015Eeffaf kontrollerin y\xFCksekli\u011Fi.",
        tncaMode: "Sa\u011F kenar \xE7ubu\u011Funda par\xE7a ad\u0131n\u0131n yan\u0131nda bir kapak g\xF6rseli k\xFC\xE7\xFCk resmi g\xF6sterir.",
        tncaShowAlways: "\u015Eimdi \xC7al\u0131yor g\xF6r\xFCn\xFCm\xFC gizliyken bile kapak g\xF6rselini her zaman g\xF6ster.",
        tncaOverCanvas: "Canvas videosunun \xFCzerinde par\xE7a bilgilerini g\xF6sterir.",
        tncaBlur: "Canvas arka plan videosu i\xE7in bulan\u0131kl\u0131k yo\u011Funlu\u011Fu.",
        highPerformanceMode: "Ek \xF6\u011Feler i\xE7in tam Liquid Glass modunu etkinle\u015Ftirir. Uyar\u0131: Yaln\u0131zca iyi performansl\u0131 sistemler i\xE7in \xF6nerilir.",
        popupBounce: "A\xE7\u0131l\u0131r men\xFClerdeki z\u0131plama efektini etkinle\u015Ftirin veya devre d\u0131\u015F\u0131 b\u0131rak\u0131n."
      }
    },
    hi: {
      settingsTitle: "Liquify \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
      title: "Liquify \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
      accentColor: "\u092C\u091F\u0928 \u090F\u0915\u094D\u0938\u0947\u0902\u091F \u0930\u0902\u0917:",
      glowColor: "\u0917\u094D\u0932\u094B \u090F\u0915\u094D\u0938\u0947\u0902\u091F \u0930\u0902\u0917:",
      background: "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F:",
      apbackground: "\u0915\u0932\u093E\u0915\u093E\u0930 \u092A\u0943\u0937\u094D\u0920 \u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F:",
      artistScrollBlur: "\u0915\u0932\u093E\u0915\u093E\u0930 \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u0927\u0941\u0902\u0927\u0932\u093E\u092A\u0928 (px):",
      artistScrollBrightness: "\u0915\u0932\u093E\u0915\u093E\u0930 \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u091A\u092E\u0915 (%):",
      playerWidth: "\u092A\u094D\u0932\u0947\u092F\u0930 \u091A\u094C\u0921\u093C\u093E\u0908:",
      playerRadius: "\u092A\u094D\u0932\u0947\u092F\u0930 \u092C\u0949\u0930\u094D\u0921\u0930 \u0930\u0947\u0921\u093F\u092F\u0938:",
      backgroundBlur: "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F \u0927\u0941\u0902\u0927\u0932\u093E\u092A\u0928:",
      backgroundBrightness: "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F \u091A\u092E\u0915 (%):",
      transparentWidth: "\u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u0915\u0902\u091F\u094D\u0930\u094B\u0932 \u091A\u094C\u0921\u093C\u093E\u0908:",
      transparentHeight: "\u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u0915\u0902\u091F\u094D\u0930\u094B\u0932 \u090A\u0901\u091A\u093E\u0908:",
      playlistHeaderBox: "\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F \u0939\u0947\u0921\u0930 \u092C\u0949\u0915\u094D\u0938",
      playerCustomWidth: "\u092A\u094D\u0932\u0947\u092F\u0930 \u091A\u094C\u0921\u093C\u093E\u0908 (%):",
      playerCustomHeight: "\u092A\u094D\u0932\u0947\u092F\u0930 \u090A\u0901\u091A\u093E\u0908 (px):",
      chooseFile: "\u092B\u093C\u093E\u0907\u0932 \u091A\u0941\u0928\u0947\u0902",
      enterUrl: "\u091B\u0935\u093F URL \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902...",
      close: "\u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
      sections: {
        accent: "\u090F\u0915\u094D\u0938\u0947\u0902\u091F",
        glow: "\u0917\u094D\u0932\u094B",
        background: "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F",
        artist: "\u0915\u0932\u093E\u0915\u093E\u0930",
        player: "\u092A\u094D\u0932\u0947\u092F\u0930",
        playlist: "\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F",
        transparent: "\u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u0915\u0902\u091F\u094D\u0930\u094B\u0932",
        lyrics: "\u0917\u093E\u0928\u0947 \u0915\u0947 \u092C\u094B\u0932",
        nextSongCard: "\u0905\u0917\u0932\u0947 \u0917\u0BE3\u0947 \u0915\u093E \u0915\u093E\u0930\u094D\u0921",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "\u0909\u091A\u094D\u091A \u092A\u094D\u0930\u0926\u0930\u094D\u0936\u0928 \u092E\u094B\u0921:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "\u092C\u0902\u0926",
        trackInfo: "\u091F\u094D\u0930\u0948\u0915 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0915\u0947 \u092C\u0917\u0932 \u092E\u0947\u0902",
        outsideTrackInfo: "\u091F\u094D\u0930\u0948\u0915 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0915\u0947 \u092C\u093E\u0939\u0930",
        overCanvas: "Over Canvas",
        showAlways: "\u0939\u092E\u0947\u0936\u093E \u0926\u093F\u0916\u093E\u090F\u0902:",
        yes: "\u0939\u093E\u0901",
        no: "\u0928\u0939\u0940\u0902",
        blur: "\u0927\u0941\u0902\u0927\u0932\u093E\u092A\u0928 (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "\u091A\u094C\u0921\u093C\u093E\u0908 (px)",
        height: "\u090A\u0901\u091A\u093E\u0908 (px)",
        marginBottom: "\u0928\u0940\u091A\u0947 \u0915\u093E \u0905\u0902\u0924\u0930 (px)",
        marginLeft: "\u092C\u093E\u090F\u0901 \u0915\u093E \u0905\u0902\u0924\u0930 (px)"
      },
      nextSongCard: {
        show: "\u0905\u0917\u0932\u0947 \u0917\u093E\u0928\u0947 \u0915\u093E \u0915\u093E\u0930\u094D\u0921 \u0926\u093F\u0916\u093E\u090F\u0901:",
        position: "\u0915\u094D\u0937\u0948\u0924\u093F\u091C \u0938\u094D\u0925\u093F\u0924\u093F",
        cardHeight: "\u0915\u093E\u0930\u094D\u0921 \u090A\u0901\u091A\u093E\u0908 (px)",
        cardMaxWidth: "\u0915\u093E\u0930\u094D\u0921 \u0905\u0927\u093F\u0915\u0924\u092E \u091A\u094C\u0921\u093C\u093E\u0908 (px)",
        gap: "\u091B\u0935\u093F \u0914\u0930 \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u0915\u0947 \u092C\u0940\u091A \u0905\u0902\u0924\u0930 (px)",
        coverSize: "\u0915\u0935\u0930 \u0906\u0915\u093E\u0930 (px)",
        hPad: "\u0915\u094D\u0937\u0948\u0924\u093F\u091C \u092A\u0948\u0921\u093F\u0902\u0917 (px)",
        vPad: "\u0932\u0902\u092C\u0935\u0924 \u092A\u0948\u0921\u093F\u0902\u0917 (px)",
        gapToPlayer: "\u092A\u094D\u0932\u0947\u092F\u0930 \u0938\u0947 \u0926\u0942\u0930\u0940 (px)",
        borderRadius: "\u092C\u0949\u0930\u094D\u0921\u0930 \u0924\u094D\u0930\u093F\u091C\u094D\u092F\u093E (px)",
        coverBorderRadius: "\u0915\u0935\u0930 \u092C\u0949\u0930\u094D\u0921\u0930 \u0924\u094D\u0930\u093F\u091C\u094D\u092F\u093E (px)",
        left: "\u092C\u093E\u090F\u0901",
        right: "\u0926\u093E\u090F\u0901"
      },
      playbarCoverBorderRadius: "\u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u092C\u0949\u0930\u094D\u0921\u0930 \u0924\u094D\u0930\u093F\u091C\u094D\u092F\u093E:",
      lyricsMode: "\u0917\u0940\u0924 \u0905\u0928\u0941\u0935\u093E\u0926/\u0930\u094B\u092E\u0928\u0940\u0915\u0930\u0923:",
      lyricsOptions: {
        off: "\u092C\u0902\u0926",
        translation: "\u0915\u0947\u0935\u0932 \u0905\u0928\u0941\u0935\u093E\u0926",
        romanization: "\u0915\u0947\u0935\u0932 \u0930\u094B\u092E\u0928\u0940\u0915\u0930\u0923",
        both: "\u0905\u0928\u0941\u0935\u093E\u0926 + \u0930\u094B\u092E\u0928\u0940\u0915\u0930\u0923"
      },
      dropdown: {
        default: "\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F",
        custom: "\u0915\u0938\u094D\u091F\u092E",
        dynamic: "\u0921\u093E\u092F\u0928\u0947\u092E\u093F\u0915",
        animated: "\u090F\u0928\u093F\u092E\u0947\u091F\u0947\u0921",
        theme: "\u0925\u0940\u092E",
        none: "\u0915\u094B\u0908 \u0928\u0939\u0940\u0902",
        show: "\u0926\u093F\u0916\u093E\u090F\u0901",
        hide: "\u091B\u093F\u092A\u093E\u090F\u0901",
        on: "\u091A\u093E\u0932\u0942",
        off: "\u092C\u0902\u0926",
        url: "URL"
      },
      tooltips: {
        accentColor: "\u092C\u091F\u0928 \u0914\u0930 UI \u0924\u0924\u094D\u0935\u094B\u0902 \u0915\u0947 \u0932\u093F\u090F \u090F\u0915\u094D\u0938\u0947\u0902\u091F \u0930\u0902\u0917 \u091A\u0941\u0928\u0947\u0902\u0964",
        background: "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F \u091B\u0935\u093F \u0915\u093E \u0938\u094D\u0930\u094B\u0924 \u091A\u0941\u0928\u0947\u0902\u0964",
        backgroundBlur: "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F \u091B\u0935\u093F \u092A\u0930 \u0927\u0941\u0902\u0927\u0932\u093E\u092A\u0928 \u0915\u0940 \u092E\u093E\u0924\u094D\u0930\u093E\u0964",
        backgroundBrightness: "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F \u091B\u0935\u093F \u0915\u0940 \u091A\u092E\u0915\u0964",
        apbackground: "\u0915\u0932\u093E\u0915\u093E\u0930 \u092A\u0943\u0937\u094D\u0920\u094B\u0902 \u092A\u0930 \u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F\u0964",
        artistScrollBlur: "\u0915\u0932\u093E\u0915\u093E\u0930 \u092A\u0943\u0937\u094D\u0920\u094B\u0902 \u092A\u0930 \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u0915\u0930\u0924\u0947 \u0938\u092E\u092F \u0927\u0941\u0902\u0927\u0932\u093E\u092A\u0928\u0964",
        artistScrollBrightness: "\u0915\u0932\u093E\u0915\u093E\u0930 \u092A\u0943\u0937\u094D\u0920\u094B\u0902 \u092A\u0930 \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u0915\u0930\u0924\u0947 \u0938\u092E\u092F \u091A\u092E\u0915\u0964",
        playerWidth: "\u0928\u093F\u091A\u0932\u0940 \u092A\u091F\u094D\u091F\u0940 \u092E\u0947\u0902 \u092A\u094D\u0932\u0947\u092F\u0930 \u0915\u0940 \u091A\u094C\u0921\u093C\u093E\u0908\u0964",
        playerCustomWidth: "\u092A\u094D\u0930\u0924\u093F\u0936\u0924 \u092E\u0947\u0902 \u0915\u0938\u094D\u091F\u092E \u092A\u094D\u0932\u0947\u092F\u0930 \u091A\u094C\u0921\u093C\u093E\u0908\u0964",
        playerCustomHeight: "\u092A\u093F\u0915\u094D\u0938\u0947\u0932 \u092E\u0947\u0902 \u0915\u0938\u094D\u091F\u092E \u092A\u094D\u0932\u0947\u092F\u0930 \u090A\u0901\u091A\u093E\u0908\u0964",
        playerRadius: "\u092A\u094D\u0932\u0947\u092F\u0930 \u0915\u093E \u0915\u094B\u0928\u0947 \u0915\u093E \u0924\u094D\u0930\u093F\u091C\u094D\u092F\u093E\u0964",
        ccaEnabled: "\u092A\u094D\u0932\u0947\u092F\u0930 \u092E\u0947\u0902 \u0915\u0938\u094D\u091F\u092E \u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0906\u0915\u093E\u0930 \u0938\u0915\u094D\u0937\u092E \u0915\u0930\u0947\u0902\u0964",
        ccaWidth: "\u092A\u094D\u0932\u0947\u092F\u0930 \u092E\u0947\u0902 \u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0915\u0940 \u091A\u094C\u0921\u093C\u093E\u0908\u0964",
        ccaHeight: "\u092A\u094D\u0932\u0947\u092F\u0930 \u092E\u0947\u0902 \u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0915\u0940 \u090A\u0901\u091A\u093E\u0908\u0964",
        ccaMarginBottom: "\u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0915\u093E \u0928\u093F\u091A\u0932\u093E \u092E\u093E\u0930\u094D\u091C\u093F\u0928\u0964",
        ccaMarginLeft: "\u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0915\u093E \u092C\u093E\u092F\u093E\u0901 \u092E\u093E\u0930\u094D\u091C\u093F\u0928\u0964",
        nscShow: "\u092A\u094D\u0932\u0947\u092F\u0930 \u0915\u0947 \u090A\u092A\u0930 \u0905\u0917\u0932\u0947 \u0917\u093E\u0928\u0947 \u0915\u093E \u0915\u093E\u0930\u094D\u0921 \u0926\u093F\u0916\u093E\u0924\u093E \u0939\u0948\u0964",
        nscPosition: "\u0915\u093E\u0930\u094D\u0921 \u0915\u0940 \u0915\u094D\u0937\u0948\u0924\u093F\u091C \u0938\u094D\u0925\u093F\u0924\u093F\u0964",
        nscHeight: "\u0915\u093E\u0930\u094D\u0921 \u0915\u0940 \u092A\u093F\u0915\u094D\u0938\u0947\u0932 \u092E\u0947\u0902 \u090A\u0901\u091A\u093E\u0908\u0964",
        nscMaxWidth: "\u0915\u093E\u0930\u094D\u0921 \u0915\u0940 \u0905\u0927\u093F\u0915\u0924\u092E \u091A\u094C\u0921\u093C\u093E\u0908\u0964",
        nscGap: "\u0915\u093E\u0930\u094D\u0921 \u092E\u0947\u0902 \u0915\u0935\u0930 \u0914\u0930 \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u0915\u0947 \u092C\u0940\u091A \u0915\u093E \u0905\u0902\u0924\u0930\u0964",
        nscCoverSize: "\u0915\u093E\u0930\u094D\u0921 \u092E\u0947\u0902 \u0915\u0935\u0930 \u091B\u0935\u093F \u0915\u093E \u0906\u0915\u093E\u0930\u0964",
        nscHPad: "\u0915\u093E\u0930\u094D\u0921 \u0915\u093E \u0915\u094D\u0937\u0948\u0924\u093F\u091C \u0906\u0902\u0924\u0930\u093F\u0915 \u092A\u0948\u0921\u093F\u0902\u0917\u0964",
        nscVPad: "\u0915\u093E\u0930\u094D\u0921 \u0915\u093E \u090A\u0930\u094D\u0927\u094D\u0935\u093E\u0927\u0930 \u0906\u0902\u0924\u0930\u093F\u0915 \u092A\u0948\u0921\u093F\u0902\u0917\u0964",
        nscGapToPlayer: "\u0915\u093E\u0930\u094D\u0921 \u0914\u0930 \u092A\u094D\u0932\u0947\u092F\u0930 \u0915\u0947 \u092C\u0940\u091A \u0915\u0940 \u0926\u0942\u0930\u0940\u0964",
        nscBorderRadius: "\u0915\u093E\u0930\u094D\u0921 \u0915\u093E \u0915\u094B\u0928\u0947 \u0915\u093E \u0924\u094D\u0930\u093F\u091C\u094D\u092F\u093E\u0964",
        nscCoverBorderRadius: "\u0915\u093E\u0930\u094D\u0921 \u092E\u0947\u0902 \u0915\u0935\u0930 \u091B\u0935\u093F \u0915\u093E \u0915\u094B\u0928\u0947 \u0915\u093E \u0924\u094D\u0930\u093F\u091C\u094D\u092F\u093E\u0964",
        playbarCoverRadius: "\u092A\u094D\u0932\u0947\u092C\u093E\u0930 \u092E\u0947\u0902 \u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0915\u093E \u0915\u094B\u0928\u0947 \u0915\u093E \u0924\u094D\u0930\u093F\u091C\u094D\u092F\u093E\u0964",
        playlistHeaderBox: "\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F \u0939\u0947\u0921\u0930 \u092C\u0949\u0915\u094D\u0938 \u0926\u093F\u0916\u093E\u090F\u0901 \u092F\u093E \u091B\u093F\u092A\u093E\u090F\u0901\u0964",
        lyricsMode: "\u0917\u093E\u0928\u0947 \u0915\u0947 \u092C\u094B\u0932 \u0915\u093E \u0905\u0928\u0941\u0935\u093E\u0926 \u0914\u0930 \u0930\u094B\u092E\u0928\u0940\u0915\u0930\u0923\u0964",
        transparentWidth: "\u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923\u094B\u0902 \u0915\u0940 \u091A\u094C\u0921\u093C\u093E\u0908\u0964",
        transparentHeight: "\u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923\u094B\u0902 \u0915\u0940 \u090A\u0901\u091A\u093E\u0908\u0964",
        tncaMode: "\u0926\u093E\u0908\u0902 \u0938\u093E\u0907\u0921\u092C\u093E\u0930 \u092E\u0947\u0902 \u091F\u094D\u0930\u0948\u0915 \u0928\u093E\u092E \u0915\u0947 \u092C\u0917\u0932 \u092E\u0947\u0902 \u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0925\u0902\u092C\u0928\u0947\u0932 \u0926\u093F\u0916\u093E\u0924\u093E \u0939\u0948\u0964",
        tncaShowAlways: "\u0928\u093E\u0909 \u092A\u094D\u0932\u0947\u0907\u0902\u0917 \u0935\u094D\u092F\u0942 \u091B\u093F\u092A\u093E \u0939\u094B\u0928\u0947 \u092A\u0930 \u092D\u0940 \u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0939\u092E\u0947\u0936\u093E \u0926\u093F\u0916\u093E\u090F\u0902\u0964",
        tncaOverCanvas: "Canvas \u0935\u0940\u0921\u093F\u092F\u094B \u0915\u0947 \u090A\u092A\u0930 \u091F\u094D\u0930\u0948\u0915 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u092A\u094D\u0930\u0926\u0930\u094D\u0936\u093F\u0924 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
        tncaBlur: "Canvas \u092A\u0943\u0937\u094D\u0920\u092D\u0942\u043C\u0438 \u0935\u0940\u0921\u093F\u092F\u094B \u0915\u0947 \u0932\u093F\u090F \u0927\u0941\u0902\u0927\u0932\u093E\u092A\u0928 \u0924\u0940\u0935\u094D\u0930\u0924\u093E\u0964",
        highPerformanceMode: "\u0905\u0924\u093F\u0930\u093F\u0915\u094D\u0924 \u0924\u0924\u094D\u0935\u094B\u0902 \u0915\u0947 \u0932\u093F\u090F \u092A\u0942\u0930\u094D\u0923 Liquid Glass \u092E\u094B\u0921 \u0938\u0915\u094D\u0937\u092E \u0915\u0930\u0924\u093E \u0939\u0948\u0964 \u091A\u0947\u0924\u093E\u0935\u0928\u0940: \u0915\u0947\u0935\u0932 \u0905\u091A\u094D\u091B\u0947 \u092A\u094D\u0930\u0926\u0930\u094D\u0936\u0928 \u0935\u093E\u0932\u0947 \u0938\u093F\u0938\u094D\u091F\u092E \u0915\u0947 \u0932\u093F\u090F \u0905\u0928\u0941\u0936\u0902\u0938\u093F\u0924\u0964",
        popupBounce: "\u092A\u0949\u092A\u0905\u092A \u092E\u0947\u0928\u0942 \u092A\u0930 \u092C\u093E\u0909\u0902\u0938 \u092A\u094D\u0930\u092D\u093E\u0935 \u0938\u0915\u094D\u0937\u092E \u092F\u093E \u0905\u0915\u094D\u0937\u092E \u0915\u0930\u0947\u0902\u0964"
      }
    },
    sv: {
      settingsTitle: "Liquify Inst\xE4llningar",
      title: "Liquify Inst\xE4llningar",
      accentColor: "Knappens accentf\xE4rg:",
      glowColor: "Gl\xF6df\xE4rg:",
      background: "Bakgrund:",
      apbackground: "Artistsidans bakgrund:",
      artistScrollBlur: "Artistrullningsosk\xE4rpa (px):",
      artistScrollBrightness: "Artistrullningsljusstyrka (%):",
      playerWidth: "Spelarbredd:",
      playerRadius: "Spelarens kantradie:",
      backgroundBlur: "Bakgrundsosk\xE4rpa:",
      backgroundBrightness: "Bakgrundsljusstyrka (%):",
      transparentWidth: "Transparenta kontrollernas bredd:",
      transparentHeight: "Transparenta kontrollernas h\xF6jd:",
      close: "St\xE4ng",
      playlistHeaderBox: "Spellistans rubrikruta:",
      playerCustomWidth: "Spelarbredd (%):",
      playerCustomHeight: "Spelarh\xF6jd (px):",
      chooseFile: "V\xE4lj fil",
      enterUrl: "Ange bild-URL...",
      dropdown: {
        default: "Standard",
        custom: "Anpassad",
        dynamic: "Dynamisk",
        animated: "Animerad",
        theme: "Tema",
        none: "Ingen",
        show: "Visa",
        hide: "D\xF6lj",
        on: "P\xE5",
        off: "Av",
        url: "URL"
      },
      sections: {
        accent: "Accent",
        glow: "Gl\xF6d",
        background: "Bakgrund",
        artist: "Artist",
        player: "Spelare",
        playlist: "Spellista",
        transparent: "Transparenta kontroller",
        lyrics: "L\xE5ttexter",
        nextSongCard: "N\xE4sta l\xE5tkort",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "H\xF6gprestandal\xE4ge:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "Av",
        trackInfo: "Bredvid sp\xE5rinfo",
        outsideTrackInfo: "Utanf\xF6r sp\xE5rinfo",
        overCanvas: "Over Canvas",
        showAlways: "Visa alltid:",
        yes: "Ja",
        no: "Nej",
        blur: "Osk\xE4rpa (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "Bredd (px)",
        height: "H\xF6jd (px)",
        marginBottom: "Marginal ned\xE5t (px)",
        marginLeft: "Marginal v\xE4nster (px)"
      },
      nextSongCard: {
        show: "Visa n\xE4sta l\xE5tkort:",
        position: "Horisontell position",
        cardHeight: "Korth\xF6jd (px)",
        cardMaxWidth: "Kort maxbredd (px)",
        gap: "Avst\xE5nd mellan bild och text (px)",
        coverSize: "Omslagsstorlek (px)",
        hPad: "Horisontell utfyllnad (px)",
        vPad: "Vertikal utfyllnad (px)",
        gapToPlayer: "Avst\xE5nd till spelaren (px)",
        borderRadius: "H\xF6rnavrundning (px)",
        coverBorderRadius: "Omslagets h\xF6rnavrundning (px)",
        left: "V\xE4nster",
        right: "H\xF6ger"
      },
      playbarCoverBorderRadius: "Omslagets h\xF6rnavrundning:",
      lyricsMode: "\xD6vers\xE4ttning/Romanisering av l\xE5ttexter:",
      lyricsOptions: {
        off: "Av",
        translation: "Endast \xF6vers\xE4ttning",
        romanization: "Endast romanisering",
        both: "\xD6vers\xE4ttning + Romanisering"
      },
      tooltips: {
        accentColor: "V\xE4lj accentf\xE4rg f\xF6r knappar och gr\xE4nssnittselement.",
        background: "V\xE4lj k\xE4lla f\xF6r bakgrundsbilden.",
        backgroundBlur: "M\xE4ngd osk\xE4rpa p\xE5 bakgrundsbilden.",
        backgroundBrightness: "Ljusstyrka p\xE5 bakgrundsbilden.",
        apbackground: "Bakgrund p\xE5 artistsidor.",
        artistScrollBlur: "Osk\xE4rpa vid rullning p\xE5 artistsidor.",
        artistScrollBrightness: "Ljusstyrka vid rullning p\xE5 artistsidor.",
        playerWidth: "Spelarens bredd i det nedre f\xE4ltet.",
        playerCustomWidth: "Anpassad spelarbredd i procent.",
        playerCustomHeight: "Anpassad spelarh\xF6jd i pixlar.",
        playerRadius: "H\xF6rnradie f\xF6r spelaren.",
        ccaEnabled: "Aktivera anpassad omslagsstorlek i spelaren.",
        ccaWidth: "Bredd p\xE5 omslaget i spelaren.",
        ccaHeight: "H\xF6jd p\xE5 omslaget i spelaren.",
        ccaMarginBottom: "Nedre marginal f\xF6r omslaget.",
        ccaMarginLeft: "V\xE4nster marginal f\xF6r omslaget.",
        nscShow: "Visar ett kort med n\xE4sta l\xE5t ovanf\xF6r spelaren.",
        nscPosition: "Horisontell position f\xF6r kortet.",
        nscHeight: "Kortets h\xF6jd i pixlar.",
        nscMaxWidth: "Kortets maximala bredd.",
        nscGap: "Avst\xE5nd mellan omslag och text i kortet.",
        nscCoverSize: "Storlek p\xE5 omslaget i kortet.",
        nscHPad: "Horisontell inre utfyllnad i kortet.",
        nscVPad: "Vertikal inre utfyllnad i kortet.",
        nscGapToPlayer: "Avst\xE5nd mellan kortet och spelaren.",
        nscBorderRadius: "H\xF6rnradie f\xF6r kortet.",
        nscCoverBorderRadius: "H\xF6rnradie f\xF6r omslaget i kortet.",
        playbarCoverRadius: "H\xF6rnradie f\xF6r omslaget i spelaren.",
        playlistHeaderBox: "Visa eller d\xF6lj spellistans rubrikruta.",
        lyricsMode: "\xD6vers\xE4ttning och romanisering av l\xE5ttexter.",
        transparentWidth: "Bredd p\xE5 de transparenta kontrollerna.",
        transparentHeight: "H\xF6jd p\xE5 de transparenta kontrollerna.",
        tncaMode: "Visar en omslagsbild bredvid sp\xE5rnamnet i h\xF6ger sidof\xE4lt.",
        tncaShowAlways: "Visa alltid omslaget \xE4ven n\xE4r Canvas-videon \xE4r dold.",
        tncaOverCanvas: "Visar sp\xE5rinformation ovanp\xE5 Canvas-videon.",
        tncaBlur: "Osk\xE4rpa f\xF6r Canvas-videons bakgrund.",
        highPerformanceMode: "Aktiverar fullt Liquid Glass-l\xE4ge f\xF6r ytterligare element. Varning: Rekommenderas bara f\xF6r system med bra prestanda.",
        popupBounce: "Aktivera eller inaktivera studseffekten p\xE5 popup-menyer."
      }
    },
    ja: {
      settingsTitle: "Liquify \u8A2D\u5B9A",
      title: "Liquify \u8A2D\u5B9A",
      accentColor: "\u30DC\u30BF\u30F3\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC:",
      glowColor: "\u30B0\u30ED\u30FC\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC:",
      background: "\u80CC\u666F:",
      apbackground: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30DA\u30FC\u30B8\u80CC\u666F:",
      artistScrollBlur: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30B9\u30AF\u30ED\u30FC\u30EB\u307C\u304B\u3057 (px):",
      artistScrollBrightness: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30B9\u30AF\u30ED\u30FC\u30EB\u660E\u5EA6 (%):",
      playerWidth: "\u30D7\u30EC\u30FC\u30E4\u30FC\u5E45:",
      playerRadius: "\u30D7\u30EC\u30FC\u30E4\u30FC\u89D2\u4E38:",
      backgroundBlur: "\u80CC\u666F\u307C\u304B\u3057:",
      backgroundBrightness: "\u80CC\u666F\u660E\u5EA6 (%):",
      transparentWidth: "\u900F\u660E\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u5E45:",
      transparentHeight: "\u900F\u660E\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u9AD8\u3055:",
      close: "\u9589\u3058\u308B",
      playlistHeaderBox: "\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u30D8\u30C3\u30C0\u30FC\u30DC\u30C3\u30AF\u30B9:",
      playerCustomWidth: "\u30D7\u30EC\u30FC\u30E4\u30FC\u5E45 (%):",
      playerCustomHeight: "\u30D7\u30EC\u30FC\u30E4\u30FC\u9AD8\u3055 (px):",
      chooseFile: "\u30D5\u30A1\u30A4\u30EB\u3092\u9078\u629E",
      enterUrl: "\u753B\u50CFURL\u3092\u5165\u529B...",
      sections: {
        accent: "\u30A2\u30AF\u30BB\u30F3\u30C8",
        glow: "\u30B0\u30ED\u30FC",
        background: "\u80CC\u666F",
        artist: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8",
        player: "\u30D7\u30EC\u30FC\u30E4\u30FC",
        playlist: "\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8",
        transparent: "\u900F\u660E\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB",
        lyrics: "\u6B4C\u8A5E",
        nextSongCard: "\u6B21\u306E\u66F2\u30AB\u30FC\u30C9",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "\u9AD8\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u30E2\u30FC\u30C9:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "\u30AA\u30D5",
        trackInfo: "\u30C8\u30E9\u30C3\u30AF\u60C5\u5831\u306E\u6A2A",
        outsideTrackInfo: "\u30C8\u30E9\u30C3\u30AF\u60C5\u5831\u306E\u5916\u5074",
        overCanvas: "Over Canvas",
        showAlways: "\u5E38\u306B\u8868\u793A:",
        yes: "\u306F\u3044",
        no: "\u3044\u3044\u3048",
        blur: "\u30D6\u30E9\u30FC (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "\u5E45 (px)",
        height: "\u9AD8\u3055 (px)",
        marginBottom: "\u4E0B\u30DE\u30FC\u30B8\u30F3 (px)",
        marginLeft: "\u5DE6\u30DE\u30FC\u30B8\u30F3 (px)"
      },
      nextSongCard: {
        show: "\u6B21\u306E\u66F2\u30AB\u30FC\u30C9\u3092\u8868\u793A:",
        position: "\u6C34\u5E73\u4F4D\u7F6E",
        cardHeight: "\u30AB\u30FC\u30C9\u9AD8\u3055 (px)",
        cardMaxWidth: "\u30AB\u30FC\u30C9\u6700\u5927\u5E45 (px)",
        gap: "\u753B\u50CF\u3068\u30C6\u30AD\u30B9\u30C8\u306E\u9593\u9694 (px)",
        coverSize: "\u30AB\u30D0\u30FC\u30B5\u30A4\u30BA (px)",
        hPad: "\u6C34\u5E73\u30D1\u30C7\u30A3\u30F3\u30B0 (px)",
        vPad: "\u5782\u76F4\u30D1\u30C7\u30A3\u30F3\u30B0 (px)",
        gapToPlayer: "\u30D7\u30EC\u30FC\u30E4\u30FC\u3068\u306E\u8DDD\u96E2 (px)",
        borderRadius: "\u89D2\u4E38 (px)",
        coverBorderRadius: "\u30AB\u30D0\u30FC\u89D2\u4E38 (px)",
        left: "\u5DE6",
        right: "\u53F3"
      },
      playbarCoverBorderRadius: "\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u89D2\u4E38:",
      lyricsMode: "\u6B4C\u8A5E\u7FFB\u8A33/\u30ED\u30FC\u30DE\u5B57\u5316:",
      lyricsOptions: {
        off: "\u30AA\u30D5",
        translation: "\u7FFB\u8A33\u306E\u307F",
        romanization: "\u30ED\u30FC\u30DE\u5B57\u306E\u307F",
        both: "\u7FFB\u8A33 + \u30ED\u30FC\u30DE\u5B57"
      },
      dropdown: {
        default: "\u30C7\u30D5\u30A9\u30EB\u30C8",
        custom: "\u30AB\u30B9\u30BF\u30E0",
        dynamic: "\u30C0\u30A4\u30CA\u30DF\u30C3\u30AF",
        animated: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3",
        theme: "\u30C6\u30FC\u30DE",
        none: "\u306A\u3057",
        show: "\u8868\u793A",
        hide: "\u975E\u8868\u793A",
        on: "\u30AA\u30F3",
        off: "\u30AA\u30D5",
        url: "URL"
      },
      tooltips: {
        accentColor: "\u30DC\u30BF\u30F3\u3084UI\u8981\u7D20\u306E\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC\u3092\u9078\u629E\u3057\u307E\u3059\u3002",
        background: "\u80CC\u666F\u753B\u50CF\u306E\u30BD\u30FC\u30B9\u3092\u9078\u629E\u3057\u307E\u3059\u3002",
        backgroundBlur: "\u80CC\u666F\u753B\u50CF\u306B\u9069\u7528\u3055\u308C\u308B\u307C\u304B\u3057\u306E\u91CF\u3002",
        backgroundBrightness: "\u80CC\u666F\u753B\u50CF\u306E\u660E\u5EA6\u3002",
        apbackground: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30DA\u30FC\u30B8\u306E\u80CC\u666F\u3002",
        artistScrollBlur: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30DA\u30FC\u30B8\u3067\u306E\u30B9\u30AF\u30ED\u30FC\u30EB\u6642\u306E\u307C\u304B\u3057\u3002",
        artistScrollBrightness: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30DA\u30FC\u30B8\u3067\u306E\u30B9\u30AF\u30ED\u30FC\u30EB\u6642\u306E\u660E\u5EA6\u3002",
        playerWidth: "\u4E0B\u90E8\u30D0\u30FC\u306E\u30D7\u30EC\u30FC\u30E4\u30FC\u5E45\u3002",
        playerCustomWidth: "\u30AB\u30B9\u30BF\u30E0\u30D7\u30EC\u30FC\u30E4\u30FC\u5E45\uFF08\u30D1\u30FC\u30BB\u30F3\u30C8\uFF09\u3002",
        playerCustomHeight: "\u30AB\u30B9\u30BF\u30E0\u30D7\u30EC\u30FC\u30E4\u30FC\u9AD8\u3055\uFF08\u30D4\u30AF\u30BB\u30EB\uFF09\u3002",
        playerRadius: "\u30D7\u30EC\u30FC\u30E4\u30FC\u306E\u89D2\u4E38\u534A\u5F84\u3002",
        ccaEnabled: "\u30D7\u30EC\u30FC\u30E4\u30FC\u306E\u30AB\u30B9\u30BF\u30E0\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u30B5\u30A4\u30BA\u3092\u6709\u52B9\u306B\u3057\u307E\u3059\u3002",
        ccaWidth: "\u30D7\u30EC\u30FC\u30E4\u30FC\u5185\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u306E\u5E45\u3002",
        ccaHeight: "\u30D7\u30EC\u30FC\u30E4\u30FC\u5185\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u306E\u9AD8\u3055\u3002",
        ccaMarginBottom: "\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u306E\u4E0B\u30DE\u30FC\u30B8\u30F3\u3002",
        ccaMarginLeft: "\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u306E\u5DE6\u30DE\u30FC\u30B8\u30F3\u3002",
        nscShow: "\u30D7\u30EC\u30FC\u30E4\u30FC\u4E0A\u90E8\u306B\u6B21\u306E\u66F2\u30AB\u30FC\u30C9\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
        nscPosition: "\u30AB\u30FC\u30C9\u306E\u6C34\u5E73\u4F4D\u7F6E\u3002",
        nscHeight: "\u30AB\u30FC\u30C9\u306E\u9AD8\u3055\uFF08\u30D4\u30AF\u30BB\u30EB\uFF09\u3002",
        nscMaxWidth: "\u30AB\u30FC\u30C9\u306E\u6700\u5927\u5E45\u3002",
        nscGap: "\u30AB\u30FC\u30C9\u5185\u306E\u30AB\u30D0\u30FC\u3068\u30C6\u30AD\u30B9\u30C8\u306E\u9593\u9694\u3002",
        nscCoverSize: "\u30AB\u30FC\u30C9\u5185\u306E\u30AB\u30D0\u30FC\u753B\u50CF\u30B5\u30A4\u30BA\u3002",
        nscHPad: "\u30AB\u30FC\u30C9\u306E\u6C34\u5E73\u5185\u5074\u30D1\u30C7\u30A3\u30F3\u30B0\u3002",
        nscVPad: "\u30AB\u30FC\u30C9\u306E\u5782\u76F4\u5185\u5074\u30D1\u30C7\u30A3\u30F3\u30B0\u3002",
        nscGapToPlayer: "\u30AB\u30FC\u30C9\u3068\u30D7\u30EC\u30FC\u30E4\u30FC\u306E\u8DDD\u96E2\u3002",
        nscBorderRadius: "\u30AB\u30FC\u30C9\u306E\u89D2\u4E38\u534A\u5F84\u3002",
        nscCoverBorderRadius: "\u30AB\u30FC\u30C9\u5185\u306E\u30AB\u30D0\u30FC\u753B\u50CF\u306E\u89D2\u4E38\u534A\u5F84\u3002",
        playbarCoverRadius: "\u30D7\u30EC\u30FC\u30D0\u30FC\u306E\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u306E\u89D2\u4E38\u534A\u5F84\u3002",
        playlistHeaderBox: "\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u30D8\u30C3\u30C0\u30FC\u30DC\u30C3\u30AF\u30B9\u306E\u8868\u793A/\u975E\u8868\u793A\u3002",
        lyricsMode: "\u6B4C\u8A5E\u306E\u7FFB\u8A33\u3068\u30ED\u30FC\u30DE\u5B57\u5316\u3002",
        transparentWidth: "\u900F\u660E\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u306E\u5E45\u3002",
        transparentHeight: "\u900F\u660E\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u306E\u9AD8\u3055\u3002",
        tncaMode: "\u53F3\u30B5\u30A4\u30C9\u30D0\u30FC\u306E\u30C8\u30E9\u30C3\u30AF\u540D\u306E\u6A2A\u306B\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u306E\u30B5\u30E0\u30CD\u30A4\u30EB\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
        tncaShowAlways: "\u518D\u751F\u4E2D\u30D3\u30E5\u30FC\u304C\u975E\u8868\u793A\u3067\u3082\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u3092\u5E38\u306B\u8868\u793A\u3057\u307E\u3059\u3002",
        tncaOverCanvas: "Canvas\u30D3\u30C7\u30AA\u306E\u4E0A\u306B\u30C8\u30E9\u30C3\u30AF\u60C5\u5831\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
        tncaBlur: "Canvas\u80CC\u666F\u30D3\u30C7\u30AA\u306E\u307C\u304B\u3057\u5F37\u5EA6\u3002",
        highPerformanceMode: "\u8FFD\u52A0\u8981\u7D20\u306E\u305F\u3081\u306E\u30D5\u30EBLiquid Glass\u30E2\u30FC\u30C9\u3092\u6709\u52B9\u306B\u3057\u307E\u3059\u3002\u8B66\u544A: \u9AD8\u6027\u80FD\u306A\u30B7\u30B9\u30C6\u30E0\u306E\u307F\u63A8\u5968\u3002",
        popupBounce: "\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u30E1\u30CB\u30E5\u30FC\u306E\u30D0\u30A6\u30F3\u30B9\u52B9\u679C\u3092\u6709\u52B9/\u7121\u52B9\u306B\u3057\u307E\u3059\u3002"
      }
    },
    zh: {
      settingsTitle: "Liquify \u8BBE\u7F6E",
      title: "Liquify \u8BBE\u7F6E",
      accentColor: "\u6309\u94AE\u5F3A\u8C03\u8272:",
      glowColor: "\u53D1\u5149\u5F3A\u8C03\u8272:",
      background: "\u80CC\u666F:",
      apbackground: "\u827A\u672F\u5BB6\u9875\u9762\u80CC\u666F:",
      artistScrollBlur: "\u827A\u672F\u5BB6\u6EDA\u52A8\u6A21\u7CCA (px):",
      artistScrollBrightness: "\u827A\u672F\u5BB6\u6EDA\u52A8\u4EAE\u5EA6 (%):",
      playerWidth: "\u64AD\u653E\u5668\u5BBD\u5EA6:",
      playerRadius: "\u64AD\u653E\u5668\u5706\u89D2:",
      backgroundBlur: "\u80CC\u666F\u6A21\u7CCA:",
      backgroundBrightness: "\u80CC\u666F\u4EAE\u5EA6 (%):",
      transparentWidth: "\u900F\u660E\u63A7\u4EF6\u5BBD\u5EA6:",
      transparentHeight: "\u900F\u660E\u63A7\u4EF6\u9AD8\u5EA6:",
      close: "\u5173\u95ED",
      playlistHeaderBox: "\u64AD\u653E\u5217\u8868\u6807\u9898\u6846:",
      playerCustomWidth: "\u64AD\u653E\u5668\u5BBD\u5EA6 (%):",
      playerCustomHeight: "\u64AD\u653E\u5668\u9AD8\u5EA6 (px):",
      chooseFile: "\u9009\u62E9\u6587\u4EF6",
      enterUrl: "\u8F93\u5165\u56FE\u7247URL...",
      sections: {
        accent: "\u5F3A\u8C03\u8272",
        glow: "\u53D1\u5149",
        background: "\u80CC\u666F",
        artist: "\u827A\u672F\u5BB6",
        player: "\u64AD\u653E\u5668",
        playlist: "\u64AD\u653E\u5217\u8868",
        transparent: "\u900F\u660E\u63A7\u4EF6",
        lyrics: "\u6B4C\u8BCD",
        nextSongCard: "\u4E0B\u4E00\u9996\u6B4C\u66F2\u5361\u7247",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "\u9AD8\u6027\u80FD\u6A21\u5F0F:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "\u5173\u95ED",
        trackInfo: "\u5728\u66F2\u76EE\u4FE1\u606F\u65C1\u8FB9",
        outsideTrackInfo: "\u5728\u66F2\u76EE\u4FE1\u606F\u5916\u90E8",
        overCanvas: "Over Canvas",
        showAlways: "\u59CB\u7EC8\u663E\u793A:",
        yes: "\u662F",
        no: "\u5426",
        blur: "\u6A21\u7CCA (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "\u5BBD\u5EA6 (px)",
        height: "\u9AD8\u5EA6 (px)",
        marginBottom: "\u4E0B\u8FB9\u8DDD (px)",
        marginLeft: "\u5DE6\u8FB9\u8DDD (px)"
      },
      nextSongCard: {
        show: "\u663E\u793A\u4E0B\u4E00\u9996\u6B4C\u66F2\u5361\u7247:",
        position: "\u6C34\u5E73\u4F4D\u7F6E",
        cardHeight: "\u5361\u7247\u9AD8\u5EA6 (px)",
        cardMaxWidth: "\u5361\u7247\u6700\u5927\u5BBD\u5EA6 (px)",
        gap: "\u56FE\u7247\u4E0E\u6587\u5B57\u95F4\u8DDD (px)",
        coverSize: "\u5C01\u9762\u5927\u5C0F (px)",
        hPad: "\u6C34\u5E73\u5185\u8FB9\u8DDD (px)",
        vPad: "\u5782\u76F4\u5185\u8FB9\u8DDD (px)",
        gapToPlayer: "\u4E0E\u64AD\u653E\u5668\u7684\u8DDD\u79BB (px)",
        borderRadius: "\u5706\u89D2 (px)",
        coverBorderRadius: "\u5C01\u9762\u5706\u89D2 (px)",
        left: "\u5DE6",
        right: "\u53F3"
      },
      playbarCoverBorderRadius: "\u5C01\u9762\u5706\u89D2:",
      lyricsMode: "\u6B4C\u8BCD\u7FFB\u8BD1/\u7F57\u9A6C\u5316:",
      lyricsOptions: {
        off: "\u5173\u95ED",
        translation: "\u4EC5\u7FFB\u8BD1",
        romanization: "\u4EC5\u7F57\u9A6C\u5316",
        both: "\u7FFB\u8BD1 + \u7F57\u9A6C\u5316"
      },
      dropdown: {
        default: "\u9ED8\u8BA4",
        custom: "\u81EA\u5B9A\u4E49",
        dynamic: "\u52A8\u6001",
        animated: "\u52A8\u753B",
        theme: "\u4E3B\u9898",
        none: "\u65E0",
        show: "\u663E\u793A",
        hide: "\u9690\u85CF",
        on: "\u5F00",
        off: "\u5173",
        url: "URL"
      },
      tooltips: {
        accentColor: "\u9009\u62E9\u6309\u94AE\u548C\u754C\u9762\u5143\u7D20\u7684\u5F3A\u8C03\u8272\u3002",
        background: "\u9009\u62E9\u80CC\u666F\u56FE\u7247\u7684\u6765\u6E90\u3002",
        backgroundBlur: "\u5E94\u7528\u4E8E\u80CC\u666F\u56FE\u7247\u7684\u6A21\u7CCA\u91CF\u3002",
        backgroundBrightness: "\u80CC\u666F\u56FE\u7247\u7684\u4EAE\u5EA6\u3002",
        apbackground: "\u827A\u672F\u5BB6\u9875\u9762\u7684\u80CC\u666F\u3002",
        artistScrollBlur: "\u827A\u672F\u5BB6\u9875\u9762\u6EDA\u52A8\u65F6\u7684\u6A21\u7CCA\u6548\u679C\u3002",
        artistScrollBrightness: "\u827A\u672F\u5BB6\u9875\u9762\u6EDA\u52A8\u65F6\u7684\u4EAE\u5EA6\u3002",
        playerWidth: "\u5E95\u90E8\u680F\u64AD\u653E\u5668\u7684\u5BBD\u5EA6\u3002",
        playerCustomWidth: "\u81EA\u5B9A\u4E49\u64AD\u653E\u5668\u5BBD\u5EA6\uFF08\u767E\u5206\u6BD4\uFF09\u3002",
        playerCustomHeight: "\u81EA\u5B9A\u4E49\u64AD\u653E\u5668\u9AD8\u5EA6\uFF08\u50CF\u7D20\uFF09\u3002",
        playerRadius: "\u64AD\u653E\u5668\u7684\u5706\u89D2\u534A\u5F84\u3002",
        ccaEnabled: "\u542F\u7528\u64AD\u653E\u5668\u4E2D\u7684\u81EA\u5B9A\u4E49\u5C01\u9762\u5927\u5C0F\u3002",
        ccaWidth: "\u64AD\u653E\u5668\u4E2D\u5C01\u9762\u7684\u5BBD\u5EA6\u3002",
        ccaHeight: "\u64AD\u653E\u5668\u4E2D\u5C01\u9762\u7684\u9AD8\u5EA6\u3002",
        ccaMarginBottom: "\u5C01\u9762\u7684\u4E0B\u8FB9\u8DDD\u3002",
        ccaMarginLeft: "\u5C01\u9762\u7684\u5DE6\u8FB9\u8DDD\u3002",
        nscShow: "\u5728\u64AD\u653E\u5668\u4E0A\u65B9\u663E\u793A\u4E0B\u4E00\u9996\u6B4C\u66F2\u5361\u7247\u3002",
        nscPosition: "\u5361\u7247\u7684\u6C34\u5E73\u4F4D\u7F6E\u3002",
        nscHeight: "\u5361\u7247\u7684\u9AD8\u5EA6\uFF08\u50CF\u7D20\uFF09\u3002",
        nscMaxWidth: "\u5361\u7247\u7684\u6700\u5927\u5BBD\u5EA6\u3002",
        nscGap: "\u5361\u7247\u4E2D\u5C01\u9762\u4E0E\u6587\u5B57\u7684\u95F4\u8DDD\u3002",
        nscCoverSize: "\u5361\u7247\u4E2D\u5C01\u9762\u56FE\u7247\u7684\u5927\u5C0F\u3002",
        nscHPad: "\u5361\u7247\u7684\u6C34\u5E73\u5185\u8FB9\u8DDD\u3002",
        nscVPad: "\u5361\u7247\u7684\u5782\u76F4\u5185\u8FB9\u8DDD\u3002",
        nscGapToPlayer: "\u5361\u7247\u4E0E\u64AD\u653E\u5668\u7684\u8DDD\u79BB\u3002",
        nscBorderRadius: "\u5361\u7247\u7684\u5706\u89D2\u534A\u5F84\u3002",
        nscCoverBorderRadius: "\u5361\u7247\u4E2D\u5C01\u9762\u56FE\u7247\u7684\u5706\u89D2\u534A\u5F84\u3002",
        playbarCoverRadius: "\u64AD\u653E\u680F\u4E2D\u5C01\u9762\u7684\u5706\u89D2\u534A\u5F84\u3002",
        playlistHeaderBox: "\u663E\u793A\u6216\u9690\u85CF\u64AD\u653E\u5217\u8868\u6807\u9898\u6846\u3002",
        lyricsMode: "\u6B4C\u8BCD\u7684\u7FFB\u8BD1\u548C\u7F57\u9A6C\u5316\u3002",
        transparentWidth: "\u900F\u660E\u63A7\u4EF6\u7684\u5BBD\u5EA6\u3002",
        transparentHeight: "\u900F\u660E\u63A7\u4EF6\u7684\u9AD8\u5EA6\u3002",
        tncaMode: "\u5728\u53F3\u4FA7\u8FB9\u680F\u7684\u66F2\u76EE\u540D\u79F0\u65C1\u8FB9\u663E\u793A\u5C01\u9762\u7F29\u7565\u56FE\u3002",
        tncaShowAlways: "\u5373\u4F7F\u201C\u6B63\u5728\u64AD\u653E\u201D\u89C6\u56FE\u9690\u85CF\u65F6\u4E5F\u59CB\u7EC8\u663E\u793A\u5C01\u9762\u3002",
        tncaOverCanvas: "\u5728Canvas\u89C6\u9891\u4E0A\u53E0\u52A0\u663E\u793A\u66F2\u76EE\u4FE1\u606F\u3002",
        tncaBlur: "Canvas\u80CC\u666F\u89C6\u9891\u7684\u6A21\u7CCA\u5F3A\u5EA6\u3002",
        highPerformanceMode: "\u4E3A\u989D\u5916\u5143\u7D20\u542F\u7528\u5B8C\u6574\u7684Liquid Glass\u6A21\u5F0F\u3002\u8B66\u544A: \u4EC5\u5EFA\u8BAE\u6027\u80FD\u826F\u597D\u7684\u7CFB\u7EDF\u4F7F\u7528\u3002",
        popupBounce: "\u542F\u7528\u6216\u7981\u7528\u5F39\u51FA\u83DC\u5355\u7684\u5F39\u8DF3\u6548\u679C\u3002"
      }
    },
    ko: {
      settingsTitle: "Liquify \uC124\uC815",
      title: "Liquify \uC124\uC815",
      accentColor: "\uBC84\uD2BC \uAC15\uC870 \uC0C9\uC0C1:",
      glowColor: "\uAE00\uB85C\uC6B0 \uAC15\uC870 \uC0C9\uC0C1:",
      background: "\uBC30\uACBD:",
      apbackground: "\uC544\uD2F0\uC2A4\uD2B8 \uD398\uC774\uC9C0 \uBC30\uACBD:",
      artistScrollBlur: "\uC544\uD2F0\uC2A4\uD2B8 \uC2A4\uD06C\uB864 \uBE14\uB7EC (px):",
      artistScrollBrightness: "\uC544\uD2F0\uC2A4\uD2B8 \uC2A4\uD06C\uB864 \uBC1D\uAE30 (%):",
      playerWidth: "\uD50C\uB808\uC774\uC5B4 \uB108\uBE44:",
      playerRadius: "\uD50C\uB808\uC774\uC5B4 \uBAA8\uC11C\uB9AC \uBC18\uACBD:",
      backgroundBlur: "\uBC30\uACBD \uBE14\uB7EC:",
      backgroundBrightness: "\uBC30\uACBD \uBC1D\uAE30 (%):",
      transparentWidth: "\uD22C\uBA85 \uCEE8\uD2B8\uB864 \uB108\uBE44:",
      transparentHeight: "\uD22C\uBA85 \uCEE8\uD2B8\uB864 \uB192\uC774:",
      close: "\uB2EB\uAE30",
      playlistHeaderBox: "\uC7AC\uC0DD\uBAA9\uB85D \uD5E4\uB354 \uBC15\uC2A4:",
      playerCustomWidth: "\uD50C\uB808\uC774\uC5B4 \uB108\uBE44 (%):",
      playerCustomHeight: "\uD50C\uB808\uC774\uC5B4 \uB192\uC774 (px):",
      chooseFile: "\uD30C\uC77C \uC120\uD0DD",
      enterUrl: "\uC774\uBBF8\uC9C0 URL \uC785\uB825...",
      sections: {
        accent: "\uAC15\uC870",
        glow: "\uAE00\uB85C\uC6B0",
        background: "\uBC30\uACBD",
        artist: "\uC544\uD2F0\uC2A4\uD2B8",
        player: "\uD50C\uB808\uC774\uC5B4",
        playlist: "\uC7AC\uC0DD\uBAA9\uB85D",
        transparent: "\uD22C\uBA85 \uCEE8\uD2B8\uB864",
        lyrics: "\uAC00\uC0AC",
        nextSongCard: "\uB2E4\uC74C \uACE1 \uCE74\uB4DC",
        canvasCoverArt: "Canvas Cover Art",
        ui: "UI"
      },
      ui: {
        highPerformanceMode: "\uACE0\uC131\uB2A5 \uBAA8\uB4DC:",
        popupBounce: "Popup Bounce:"
      },
      canvasCoverArt: {
        mode: "Track Name Cover Art:",
        off: "\uB044\uAE30",
        trackInfo: "\uD2B8\uB799 \uC815\uBCF4 \uC606",
        outsideTrackInfo: "\uD2B8\uB799 \uC815\uBCF4 \uC678\uBD80",
        overCanvas: "Over Canvas",
        showAlways: "\uD56D\uC0C1 \uD45C\uC2DC:",
        yes: "\uC608",
        no: "\uC544\uB2C8\uC624",
        blur: "\uBE14\uB7EC (px):"
      },
      comfyCoverArt: {
        enabled: "Comfy Cover Art:",
        width: "\uB108\uBE44 (px)",
        height: "\uB192\uC774 (px)",
        marginBottom: "\uD558\uB2E8 \uC5EC\uBC31 (px)",
        marginLeft: "\uC88C\uCE21 \uC5EC\uBC31 (px)"
      },
      nextSongCard: {
        show: "\uB2E4\uC74C \uACE1 \uCE74\uB4DC \uD45C\uC2DC:",
        position: "\uC218\uD3C9 \uC704\uCE58",
        cardHeight: "\uCE74\uB4DC \uB192\uC774 (px)",
        cardMaxWidth: "\uCE74\uB4DC \uCD5C\uB300 \uB108\uBE44 (px)",
        gap: "\uC774\uBBF8\uC9C0\uC640 \uD14D\uC2A4\uD2B8 \uAC04\uACA9 (px)",
        coverSize: "\uCEE4\uBC84 \uD06C\uAE30 (px)",
        hPad: "\uC218\uD3C9 \uD328\uB529 (px)",
        vPad: "\uC218\uC9C1 \uD328\uB529 (px)",
        gapToPlayer: "\uD50C\uB808\uC774\uC5B4\uC640\uC758 \uAC70\uB9AC (px)",
        borderRadius: "\uBAA8\uC11C\uB9AC \uBC18\uACBD (px)",
        coverBorderRadius: "\uCEE4\uBC84 \uBAA8\uC11C\uB9AC \uBC18\uACBD (px)",
        left: "\uC67C\uCABD",
        right: "\uC624\uB978\uCABD"
      },
      playbarCoverBorderRadius: "\uCEE4\uBC84 \uC544\uD2B8 \uBAA8\uC11C\uB9AC \uBC18\uACBD:",
      lyricsMode: "\uAC00\uC0AC \uBC88\uC5ED/\uB85C\uB9C8\uC790 \uD45C\uAE30:",
      lyricsOptions: {
        off: "\uB044\uAE30",
        translation: "\uBC88\uC5ED\uB9CC",
        romanization: "\uB85C\uB9C8\uC790\uB9CC",
        both: "\uBC88\uC5ED + \uB85C\uB9C8\uC790"
      },
      dropdown: {
        default: "\uAE30\uBCF8",
        custom: "\uC0AC\uC6A9\uC790 \uC9C0\uC815",
        dynamic: "\uB3D9\uC801",
        animated: "\uC560\uB2C8\uBA54\uC774\uC158",
        theme: "\uD14C\uB9C8",
        none: "\uC5C6\uC74C",
        show: "\uD45C\uC2DC",
        hide: "\uC228\uAE30\uAE30",
        on: "\uCF1C\uAE30",
        off: "\uB044\uAE30",
        url: "URL"
      },
      tooltips: {
        accentColor: "\uBC84\uD2BC \uBC0F UI \uC694\uC18C\uC758 \uAC15\uC870 \uC0C9\uC0C1\uC744 \uC120\uD0DD\uD569\uB2C8\uB2E4.",
        background: "\uBC30\uACBD \uC774\uBBF8\uC9C0\uC758 \uC18C\uC2A4\uB97C \uC120\uD0DD\uD569\uB2C8\uB2E4.",
        backgroundBlur: "\uBC30\uACBD \uC774\uBBF8\uC9C0\uC5D0 \uC801\uC6A9\uB418\uB294 \uBE14\uB7EC \uC815\uB3C4.",
        backgroundBrightness: "\uBC30\uACBD \uC774\uBBF8\uC9C0\uC758 \uBC1D\uAE30.",
        apbackground: "\uC544\uD2F0\uC2A4\uD2B8 \uD398\uC774\uC9C0\uC758 \uBC30\uACBD.",
        artistScrollBlur: "\uC544\uD2F0\uC2A4\uD2B8 \uD398\uC774\uC9C0\uC5D0\uC11C \uC2A4\uD06C\uB864 \uC2DC \uBE14\uB7EC \uD6A8\uACFC.",
        artistScrollBrightness: "\uC544\uD2F0\uC2A4\uD2B8 \uD398\uC774\uC9C0\uC5D0\uC11C \uC2A4\uD06C\uB864 \uC2DC \uBC1D\uAE30.",
        playerWidth: "\uD558\uB2E8 \uBC14\uC758 \uD50C\uB808\uC774\uC5B4 \uB108\uBE44.",
        playerCustomWidth: "\uC0AC\uC6A9\uC790 \uC9C0\uC815 \uD50C\uB808\uC774\uC5B4 \uB108\uBE44 (\uD37C\uC13C\uD2B8).",
        playerCustomHeight: "\uC0AC\uC6A9\uC790 \uC9C0\uC815 \uD50C\uB808\uC774\uC5B4 \uB192\uC774 (\uD53D\uC140).",
        playerRadius: "\uD50C\uB808\uC774\uC5B4\uC758 \uBAA8\uC11C\uB9AC \uBC18\uACBD.",
        ccaEnabled: "\uD50C\uB808\uC774\uC5B4\uC758 \uC0AC\uC6A9\uC790 \uC9C0\uC815 \uCEE4\uBC84 \uC544\uD2B8 \uD06C\uAE30\uB97C \uD65C\uC131\uD654\uD569\uB2C8\uB2E4.",
        ccaWidth: "\uD50C\uB808\uC774\uC5B4 \uB0B4 \uCEE4\uBC84 \uC544\uD2B8\uC758 \uB108\uBE44.",
        ccaHeight: "\uD50C\uB808\uC774\uC5B4 \uB0B4 \uCEE4\uBC84 \uC544\uD2B8\uC758 \uB192\uC774.",
        ccaMarginBottom: "\uCEE4\uBC84 \uC544\uD2B8\uC758 \uD558\uB2E8 \uC5EC\uBC31.",
        ccaMarginLeft: "\uCEE4\uBC84 \uC544\uD2B8\uC758 \uC88C\uCE21 \uC5EC\uBC31.",
        nscShow: "\uD50C\uB808\uC774\uC5B4 \uC704\uC5D0 \uB2E4\uC74C \uACE1 \uCE74\uB4DC\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        nscPosition: "\uCE74\uB4DC\uC758 \uC218\uD3C9 \uC704\uCE58.",
        nscHeight: "\uCE74\uB4DC\uC758 \uB192\uC774 (\uD53D\uC140).",
        nscMaxWidth: "\uCE74\uB4DC\uC758 \uCD5C\uB300 \uB108\uBE44.",
        nscGap: "\uCE74\uB4DC \uB0B4 \uCEE4\uBC84\uC640 \uD14D\uC2A4\uD2B8 \uAC04\uACA9.",
        nscCoverSize: "\uCE74\uB4DC \uB0B4 \uCEE4\uBC84 \uC774\uBBF8\uC9C0 \uD06C\uAE30.",
        nscHPad: "\uCE74\uB4DC\uC758 \uC218\uD3C9 \uB0B4\uBD80 \uD328\uB529.",
        nscVPad: "\uCE74\uB4DC\uC758 \uC218\uC9C1 \uB0B4\uBD80 \uD328\uB529.",
        nscGapToPlayer: "\uCE74\uB4DC\uC640 \uD50C\uB808\uC774\uC5B4 \uC0AC\uC774\uC758 \uAC70\uB9AC.",
        nscBorderRadius: "\uCE74\uB4DC\uC758 \uBAA8\uC11C\uB9AC \uBC18\uACBD.",
        nscCoverBorderRadius: "\uCE74\uB4DC \uB0B4 \uCEE4\uBC84 \uC774\uBBF8\uC9C0\uC758 \uBAA8\uC11C\uB9AC \uBC18\uACBD.",
        playbarCoverRadius: "\uD50C\uB808\uC774\uBC14\uC758 \uCEE4\uBC84 \uC544\uD2B8 \uBAA8\uC11C\uB9AC \uBC18\uACBD.",
        playlistHeaderBox: "\uC7AC\uC0DD\uBAA9\uB85D \uD5E4\uB354 \uBC15\uC2A4\uB97C \uD45C\uC2DC\uD558\uAC70\uB098 \uC228\uAE41\uB2C8\uB2E4.",
        lyricsMode: "\uAC00\uC0AC\uC758 \uBC88\uC5ED \uBC0F \uB85C\uB9C8\uC790 \uD45C\uAE30.",
        transparentWidth: "\uD22C\uBA85 \uCEE8\uD2B8\uB864\uC758 \uB108\uBE44.",
        transparentHeight: "\uD22C\uBA85 \uCEE8\uD2B8\uB864\uC758 \uB192\uC774.",
        tncaMode: "\uC624\uB978\uCABD \uC0AC\uC774\uB4DC\uBC14\uC758 \uD2B8\uB799 \uC774\uB984 \uC606\uC5D0 \uCEE4\uBC84 \uC544\uD2B8 \uC378\uB124\uC77C\uC744 \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        tncaShowAlways: "\uC9C0\uAE08 \uC7AC\uC0DD \uC911 \uBCF4\uAE30\uAC00 \uC228\uACA8\uC838 \uC788\uC5B4\uB3C4 \uCEE4\uBC84 \uC544\uD2B8\uB97C \uD56D\uC0C1 \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        tncaOverCanvas: "Canvas \uBE44\uB514\uC624 \uC704\uC5D0 \uD2B8\uB799 \uC815\uBCF4\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        tncaBlur: "Canvas \uBC30\uACBD \uBE44\uB514\uC624\uC758 \uBE14\uB7EC \uAC15\uB3C4.",
        highPerformanceMode: "\uCD94\uAC00 \uC694\uC18C\uC5D0 \uB300\uD55C \uC804\uCCB4 Liquid Glass \uBAA8\uB4DC\uB97C \uD65C\uC131\uD654\uD569\uB2C8\uB2E4. \uACBD\uACE0: \uC131\uB2A5\uC774 \uC88B\uC740 \uC2DC\uC2A4\uD15C\uC5D0\uB9CC \uAD8C\uC7A5\uB429\uB2C8\uB2E4.",
        popupBounce: "\uD31D\uC5C5 \uBA54\uB274\uC758 \uBC14\uC6B4\uC2A4 \uD6A8\uACFC\uB97C \uD65C\uC131\uD654 \uB610\uB294 \uBE44\uD65C\uC131\uD654\uD569\uB2C8\uB2E4."
      }
    }
  };
  function getTranslation() {
    var _a, _b;
    const clientLocale = (((_b = (_a = Spicetify == null ? void 0 : Spicetify.Platform) == null ? void 0 : _a.Session) == null ? void 0 : _b.locale) || navigator.language || "en").split("-")[0];
    const lang = liquifyTranslations[clientLocale] ? clientLocale : "en";
    return liquifyTranslations[lang];
  }
  var LIQUIFY_GEAR_HOST_SELECTOR = ".main-actionButtons";
  function ensureLiquifyGearStyle() {
    if (document.getElementById("liquify-gear-style")) return;
    const style = document.createElement("style");
    style.id = "liquify-gear-style";
    style.textContent = `
    #liquify-settings-gear-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 0;
      background: transparent;
      cursor: pointer;
      color: var(--text-subdued);
      z-index: 2;
      align-self: center;
    }
    #liquify-settings-gear-btn:hover { color: var(--text-base); }
    #liquify-settings-gear-btn:focus-visible {
      outline: 2px solid var(--spice-button, var(--liquify-accent));
      outline-offset: 2px;
    }
    #liquify-settings-gear-btn svg { width: 18px; height: 18px; display: block; }
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
  function ensureLiquifyGearButton(t) {
    var _a;
    const host = document.querySelector(LIQUIFY_GEAR_HOST_SELECTOR);
    if (!host) {
      console.warn("[Liquify] Settings button: host container not found (", LIQUIFY_GEAR_HOST_SELECTOR, ")");
      return false;
    }
    if ((_a = host.querySelector) == null ? void 0 : _a.call(host, "#liquify-settings-gear-btn")) return true;
    ensureLiquifyGearStyle();
    ensureSettingsUiStyle();
    const btn = document.createElement("button");
    btn.id = "liquify-settings-gear-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", t.settingsTitle);
    btn.innerHTML = getGearSvg();
    btn.style.setProperty("-webkit-app-region", "no-drag");
    btn.style.pointerEvents = "auto";
    let gearTooltipEl = null;
    btn.addEventListener("mouseenter", () => {
      if (gearTooltipEl) return;
      gearTooltipEl = document.createElement("div");
      gearTooltipEl.className = "liquifyTooltipPopup";
      gearTooltipEl.textContent = t.settingsTitle || "Settings";
      document.body.appendChild(gearTooltipEl);
      const r = btn.getBoundingClientRect();
      let left = r.left + r.width / 2;
      let top = r.bottom + 6;
      if (top + 40 > window.innerHeight - 4) top = r.top - 40 - 6;
      gearTooltipEl.style.left = left + "px";
      gearTooltipEl.style.top = top + "px";
    });
    btn.addEventListener("mouseleave", () => {
      if (gearTooltipEl) {
        gearTooltipEl.remove();
        gearTooltipEl = null;
      }
    });
    btn.addEventListener("click", () => {
      if (typeof window.showLiquifySettingsMenu === "function") window.showLiquifySettingsMenu();
    });
    host.insertBefore(btn, host.firstChild);
    console.info("[Liquify] Settings button successfully loaded.");
    return true;
  }
  function initLiquifyGearInjection(t) {
    const tryInsert = () => {
      try {
        ensureLiquifyGearButton(t);
      } catch (e) {
        console.error("[Liquify] Settings button failed to load:", e);
      }
    };
    tryInsert();
    const anyWin = window;
    if (!anyWin._liquifyGearInsertTimer) {
      const startedAt = Date.now();
      anyWin._liquifyGearInsertTimer = setInterval(() => {
        const host = document.querySelector(LIQUIFY_GEAR_HOST_SELECTOR);
        const hasBtn = !!document.querySelector("#liquify-settings-gear-btn");
        if (hasBtn || Date.now() - startedAt > 1e4) {
          if (!hasBtn) console.error("[Liquify] Settings button failed to load: timed out after 10s \u2014 host container never appeared.");
          clearInterval(anyWin._liquifyGearInsertTimer);
          anyWin._liquifyGearInsertTimer = null;
          return;
        }
        if (host) tryInsert();
      }, 200);
    }
    if (!anyWin._liquifyGearObserver) {
      anyWin._liquifyGearObserver = new MutationObserver(() => {
        if (anyWin._liquifyGearObserver._debounce) clearTimeout(anyWin._liquifyGearObserver._debounce);
        anyWin._liquifyGearObserver._debounce = setTimeout(() => {
          tryInsert();
          anyWin._liquifyGearObserver._debounce = null;
        }, 60);
      });
      anyWin._liquifyGearObserver.observe(document.body, { childList: true, subtree: true });
    }
  }
  var React;
  var ReactDOM;
  var LIQUIFY_DISCORD_URL = "https://discord.gg/QRMnrgjhvq";
  var LIQUIFY_GITHUB_URL = "https://github.com/NMWplays/Liquify";
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
    if (document.getElementById("liquify-settings-ui-style")) return;
    const style = document.createElement("style");
    style.id = "liquify-settings-ui-style";
    style.textContent = `
    .liquifySettingsPanel {
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
    .liquifySettingsHeader {
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
    .liquifySettingsTitle { margin: 0; text-align: center; font-weight: 700; position: relative; z-index: 1; }
    .liquifyHeaderActions {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 1;
    }
    .liquifyHeaderActionBtn {
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
    .liquifyHeaderActionBtn:hover { background: var(--accent-color) !important; }
    .liquifyHeaderActionBtn svg { width: 16px; height: 16px; display: block; }
    .liquifyCloseBtn { font-size: 18px; }
    .liquifySettingsBody {
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
    .liquifyRow { display: flex; align-items: center; justify-content: flex-start; gap: 10px; width: 100%; margin: 10px 0; flex-wrap: wrap; }
    .liquifyLabel { min-width: 140px; text-align: left; flex: 1 1 140px; }
    .liquifyRowControls {
      display: flex;
      gap: 10px;
      flex: 0 0 auto;
      margin-left: auto;
      justify-content: flex-end;
      flex-wrap: nowrap;
      min-width: 0;
      max-width: 100%;
    }
    .liquifyStackedControls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      min-width: 0;
      margin-left: auto;
      max-width: 100%;
    }
    .liquifyRowControls > * { flex: 0 0 auto; min-width: 0; }
    .liquifyControlSurface { background: transparent; border: none; border-radius: 12px; color: white; box-shadow: var(--glass-shadow); }
    .liquifySelectBtn {
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
    .liquifySelectLabel { overflow: hidden; text-overflow: ellipsis; }
    .liquifySelectChevron { width: 14px; height: 14px; flex: 0 0 14px; position: relative; }
    .liquifySelectChevron::before {
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
    .liquifySelectBtn.isOpen .liquifySelectChevron::before { transform: rotate(-135deg); }
    .liquifySelectBtn:focus-visible { outline: 2px solid var(--spice-button, var(--liquify-accent, var(--accent-color))); outline-offset: 2px; }
    .liquifySelectMenu {
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
    .liquifySelectItem {
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
    .liquifySelectItem:hover { background: var(--liquify-glow-accent); }

    .liquifyPopover {
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
    .liquifyColorPicker {
      padding: 10px 15px 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 230px;
      align-self: center;
    }
    .liquifyColorPreviewRow { display: flex; align-items: center; gap: 10px; }
    .liquifyColorPreviewRow { margin-left: 17px; }
    .liquifyColorPreview { width: 34px; height: 34px; border-radius: 10px; flex: 0 0 34px; }
    .liquifyHexInput { width: 120px; padding: 6px 8px; text-transform: uppercase; }

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
    .react-colorful__last-control { border-radius: 10px !important; overflow: visible !imp
      box-shadow: 0 0 12px 2px rgba(255,255,255,0.06), var(--glass-shadow);ortant; }
    .react-colorful__last-control .react-colorful__interactive { border-radius: 10px !important; }
    .react-colorful__hue-pointer {
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: rgba(255,255,255,0.95);
      box-shadow: 0 0 0 3px rgba(0,0,0,0.35);
    }
    .liquifyInline { display: flex; align-items: center; gap: 6px; }
    .liquifyStepperBtn { width: 24px; height: 24px; border-radius: 9px; cursor: pointer; transition: background-color 0.2s ease; }
    .liquifyStepperBtn:hover { background: var(--accent-color) !important; }
    .liquifyNumberInput { width: 74px; padding: 5px 6px; text-align: center; }
    .liquifySubBlock { margin-left: 0; display: flex; flex-direction: column; gap: 8px; }
    .liquifyActionBtn { padding: 6px 10px; cursor: pointer; }
    .liquifyTextInput { width: 100%; padding: 6px 10px; border: none; border-radius: 12px; font-size: 13px; color: #fff; background: transparent; outline: none; }
    .liquifyTextInput::placeholder { color: rgba(255,255,255,0.4); }
    .liquifyIndentedBtn { margin-left: 31px; }
    .liquifyColorSwatch { width: 20px; height: 20px; border-radius: 6px; box-shadow: var(--glass-shadow); }

    .liquifySection {
      margin: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .liquifySectionTitle {
      margin: 0;
      padding: 10px 12px;
      text-align: center;
      font-weight: 700;
      border-radius: 14px;
      background: transparent;
      box-shadow: var(--glass-shadow);
    }
    .liquifySectionBody {
      padding: 10px;
      border-radius: 14px;
      background:
      box-s transparent;
      box-shadow: var(--glass-shadow);
    }
    .liquifySectionBody .liquifyRow { margin: 8px 0; }
    .liquifyTooltipIcon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.35);
      font-size: 9px;
      font-weight: 600;
      color: rgba(255,255,255,0.45);
      cursor: help;
      margin-left: 5px;
      flex-shrink: 0;
      user-select: none;
      line-height: 1;
      vertical-align: middle;
      transition: border-color 0.15s, color 0.15s;
    }
    .liquifyTooltipIcon:hover {
      border-color: rgba(255,255,255,0.7);
      color: rgba(255,255,255,0.85);
    }
    .liquifyTooltipPopup {
      --glass-filter: url(#glass-filter--r1-7);
      position: fixed;
      z-index: 1000001;
      padding: 4px 10px;
      border-radius: 10px;
      background: transparent;
      backdrop-filter: var(--glass-filter) blur(5px);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px);
      color: white;
      font-size: 13px;
      line-height: 1.35;
      pointer-events: none;
      white-space: normal;
      word-break: break-word;
      width: max-content;
      text-align: center;
      transform: translateX(-50%);
      box-shadow: var(--glass-shadow)
    }

    /* Settings panel animation */
    .liquifySettingsPanel {
      opacity: 0;
      transform: translateY(16px) scale(0.97);
      will-change: transform, opacity;
      transition: opacity .4s cubic-bezier(.16, 1, .3, 1),
                  transform .4s cubic-bezier(.16, 1, .3, 1);
    }
    #liquify-settings-react-overlay.overlay-visible .liquifySettingsPanel {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
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
        const panel = (_a = btn.closest) == null ? void 0 : _a.call(btn, ".liquifySettingsPanel");
        const body = (_c = (_b = panel == null ? void 0 : panel.querySelector) == null ? void 0 : _b.call(panel, ".liquifySettingsBody")) != null ? _c : null;
        const bounds = (body == null ? void 0 : body.getBoundingClientRect) ? body.getBoundingClientRect() : panel ? panel.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
        const controls = (_e = (_d = btn.closest) == null ? void 0 : _d.call(btn, ".liquifyRowControls")) != null ? _e : null;
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
        className: "liquifyPopover",
        style: {
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          minWidth: `${pos.minWidth}px`,
          maxHeight: `${pos.maxHeight}px`,
          overflowY: "auto"
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: "liquifyColorPicker" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyColorPreviewRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyColorPreview", style: { background: hex } }), /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "liquifyControlSurface liquifyHexInput",
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
        className: "liquifyControlSurface liquifyActionBtn",
        onClick: () => {
          setPos(null);
          setOpen((v2) => !v2);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "liquifyInline" }, /* @__PURE__ */ React.createElement("span", { className: "liquifyColorSwatch", style: { background: normalized } }), normalized)
    ), popover && ((ReactDOM == null ? void 0 : ReactDOM.createPortal) ? ReactDOM.createPortal(popover, document.body) : popover));
  }
  function Select(props) {
    var _a, _b;
    const btnRef = React.useRef(null);
    const menuRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    const [pos, setPos] = React.useState(null);
    useOutsideClick(open, () => setOpen(false), [btnRef, menuRef]);
    React.useEffect(() => {
      var _a2, _b2, _c, _d;
      if (!open) return;
      const body = (_d = (_c = (_b2 = (_a2 = btnRef.current) == null ? void 0 : _a2.closest) == null ? void 0 : _b2.call(_a2, ".liquifySettingsPanel")) == null ? void 0 : _c.querySelector) == null ? void 0 : _d.call(_c, ".liquifySettingsBody");
      if (!body) return;
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = "";
      };
    }, [open]);
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
        const panel = (_a2 = btn.closest) == null ? void 0 : _a2.call(btn, ".liquifySettingsPanel");
        const body = (_c = (_b2 = panel == null ? void 0 : panel.querySelector) == null ? void 0 : _b2.call(panel, ".liquifySettingsBody")) != null ? _c : null;
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
        className: "liquifySelectMenu",
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
          className: "liquifySelectItem",
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
        className: `liquifyControlSurface liquifySelectBtn${open ? " isOpen" : ""}`,
        onClick: () => {
          setPos(null);
          setOpen((v2) => !v2);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "liquifySelectLabel" }, (_b = current == null ? void 0 : current.label) != null ? _b : props.value),
      /* @__PURE__ */ React.createElement("span", { className: "liquifySelectChevron", "aria-hidden": "true" })
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
    return /* @__PURE__ */ React.createElement("div", { className: "liquifyInline" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "liquifyControlSurface liquifyStepperBtn",
        onClick: () => props.onChange(clamp(props.value - 1, props.min, props.max))
      },
      "-"
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "liquifyControlSurface liquifyNumberInput",
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
        className: "liquifyControlSurface liquifyStepperBtn",
        onClick: () => props.onChange(clamp(props.value + 1, props.min, props.max))
      },
      "+"
    ));
  }
  function ButtonTooltip(props) {
    const wrapRef = React.useRef(null);
    const [show, setShow] = React.useState(false);
    const [pos, setPos] = React.useState(null);
    const useLayout = React.useLayoutEffect || React.useEffect;
    useLayout(() => {
      if (!show) return;
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      let left = r.left + r.width / 2;
      let top = r.bottom + 6;
      if (top + 40 > window.innerHeight - 4) top = r.top - 40 - 6;
      setPos({ left, top });
    }, [show]);
    const popup = show && pos ? /* @__PURE__ */ React.createElement("div", { className: "liquifyTooltipPopup", style: { left: `${pos.left}px`, top: `${pos.top}px` } }, props.text) : null;
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        ref: wrapRef,
        style: { display: "inline-flex" },
        onMouseEnter: () => setShow(true),
        onMouseLeave: () => {
          setShow(false);
          setPos(null);
        }
      },
      props.children,
      popup && ((ReactDOM == null ? void 0 : ReactDOM.createPortal) ? ReactDOM.createPortal(popup, document.body) : popup)
    );
  }
  function Tooltip(props) {
    if (!props.text) return null;
    const iconRef = React.useRef(null);
    const [show, setShow] = React.useState(false);
    const [pos, setPos] = React.useState(null);
    const useLayout = React.useLayoutEffect || React.useEffect;
    useLayout(() => {
      if (!show) return;
      const recalc = () => {
        const el = iconRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        let left = r.left + r.width / 2;
        let top = r.top - 30 - 6;
        if (top < 4) top = r.bottom + 6;
        setPos({ left, top });
      };
      recalc();
      return void 0;
    }, [show]);
    React.useEffect(() => {
      var _a, _b;
      if (!show) return;
      const hide = () => {
        setShow(false);
        setPos(null);
      };
      const body = (_b = (_a = iconRef.current) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, ".liquifySettingsBody");
      if (body) body.addEventListener("scroll", hide, { passive: true });
      return () => {
        if (body) body.removeEventListener("scroll", hide);
      };
    }, [show]);
    const popup = show && pos ? /* @__PURE__ */ React.createElement("div", { className: "liquifyTooltipPopup", style: { left: `${pos.left}px`, top: `${pos.top}px` } }, props.text) : null;
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        ref: iconRef,
        className: "liquifyTooltipIcon",
        onMouseEnter: () => setShow(true),
        onMouseLeave: () => {
          setShow(false);
          setPos(null);
        }
      },
      "?",
      popup && ((ReactDOM == null ? void 0 : ReactDOM.createPortal) ? ReactDOM.createPortal(popup, document.body) : popup)
    );
  }
  function Section(props) {
    return /* @__PURE__ */ React.createElement("div", { className: "liquifySection" }, /* @__PURE__ */ React.createElement("div", { className: "liquifySectionTitle" }, props.title), /* @__PURE__ */ React.createElement("div", { className: "liquifySectionBody" }, props.children));
  }
  function SettingsContent(props) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va;
    const [lyricsMode, setLyricsMode] = React.useState(readLS("liquify-lyrics-mode", "romanization"));
    const applyLyricsMode = (mode) => {
      setLyricsMode(mode);
      localStorage.setItem("liquify-lyrics-mode", mode);
      window.dispatchEvent(new Event("liquifyLyricsModeChange"));
    };
    const t = getTranslation();
    const titles = t.sections || {
      accent: "Accent",
      glow: "Glow",
      background: "Background",
      artist: "Artist",
      player: "Player",
      playlist: "Playlist",
      transparent: "Transparent Controls",
      lyrics: "Lyrics",
      canvasCoverArt: "Canvas Cover Art",
      ui: "UI"
    };
    const chooseFileLabel = t.chooseFile || "Choose file";
    const [accentMode, setAccentMode] = React.useState(readLS("liquify-accent-mode", "dynamic"));
    const [accentColor, setAccentColor] = React.useState(readLS("liquify-custom-color", "#1DB954"));
    const [glowMode, setGlowMode] = React.useState(readLS("liquify-glow-mode", "default"));
    const [glowColor, setGlowColor] = React.useState(readLS("liquify-glow-color", "#1DB954"));
    const [bgMode, setBgMode] = React.useState(readLS("liquify-bg-mode", "dynamic"));
    const [artistBgMode, setArtistBgMode] = React.useState(readLS("liquify-artist-bg-mode", "theme"));
    const [playerWidthMode, setPlayerWidthMode] = React.useState(readLS("liquify-player-width", "default"));
    const [playerCustomW, setPlayerCustomW] = React.useState(readNum("liquify-player-custom-width", DEFAULT_CUSTOM_WIDTH));
    const [playerCustomH, setPlayerCustomH] = React.useState(readNum("liquify-player-custom-height", DEFAULT_CUSTOM_HEIGHT));
    const [playlistHeader, setPlaylistHeader] = React.useState(readLS("liquify-playlist-header-mode", "show"));
    const [playerRadius, setPlayerRadiusState] = React.useState(readNum("liquify-player-radius", 30));
    const [bgBlur, setBgBlurState] = React.useState(readNum("liquify-bg-blur", 7));
    const [bgBrightness, setBgBrightnessState] = React.useState(readNum("liquify-bg-brightness", 45));
    const [bgUrl, setBgUrl] = React.useState(readLS("liquify-bg-url", ""));
    const [artistBgUrl, setArtistBgUrl] = React.useState(readLS("liquify-artist-bg-url", ""));
    const [artistScrollBlur, setArtistScrollBlur] = React.useState(readNum("liquify-artist-scroll-blur", 15));
    const [artistScrollBrightness, setArtistScrollBrightness] = React.useState(readNum("liquify-artist-scroll-brightness", 70));
    const [tcW, setTcW] = React.useState(readNum("liquify-tc-width", 135));
    const [tcH, setTcH] = React.useState(readNum("liquify-tc-height", 64));
    const [nscShow, setNscShow] = React.useState(readLS(NSC_SHOW_KEY, NSC_DEFAULTS.show));
    const [nscPosition, setNscPosition] = React.useState(readLS(NSC_POSITION_KEY, NSC_DEFAULTS.position));
    const [nscHeight, setNscHeight] = React.useState(readNum(NSC_HEIGHT_KEY, NSC_DEFAULTS.height));
    const [nscMaxWidth, setNscMaxWidth] = React.useState(readNum(NSC_MAX_WIDTH_KEY, NSC_DEFAULTS.maxWidth));
    const [nscGap, setNscGap] = React.useState(readNum(NSC_GAP_KEY, NSC_DEFAULTS.gap));
    const [nscCoverSize, setNscCoverSize] = React.useState(readNum(NSC_COVER_SIZE_KEY, NSC_DEFAULTS.coverSize));
    const [nscHPad, setNscHPad] = React.useState(readNum(NSC_HPAD_KEY, NSC_DEFAULTS.hPad));
    const [nscVPad, setNscVPad] = React.useState(readNum(NSC_VPAD_KEY, NSC_DEFAULTS.vPad));
    const [nscGapToPlayer, setNscGapToPlayer] = React.useState(readNum(NSC_GAP_PLAYER_KEY, NSC_DEFAULTS.gapToPlayer));
    const [nscBorderRadius, setNscBorderRadius] = React.useState(readNum(NSC_BORDER_RADIUS_KEY, NSC_DEFAULTS.borderRadius));
    const [nscCoverBorderRadius, setNscCoverBorderRadius] = React.useState(readNum(NSC_COVER_BORDER_RADIUS_KEY, NSC_DEFAULTS.coverBorderRadius));
    const fireNscUpdate = () => window.dispatchEvent(new Event("liquifyNscUpdate"));
    const [playbarCoverRadius, setPlaybarCoverRadius] = React.useState(readNum(PLAYBAR_COVER_BORDER_RADIUS_KEY, PLAYBAR_COVER_DEFAULTS.borderRadius));
    const [ccaEnabled, setCcaEnabled] = React.useState(readLS(CCA_ENABLED_KEY, CCA_DEFAULTS.enabled));
    const [ccaWidth, setCcaWidth] = React.useState(readNum(CCA_WIDTH_KEY, CCA_DEFAULTS.width));
    const [ccaHeight, setCcaHeight] = React.useState(readNum(CCA_HEIGHT_KEY, CCA_DEFAULTS.height));
    const [ccaMarginBottom, setCcaMarginBottom] = React.useState(readNum(CCA_MARGIN_BOTTOM_KEY, CCA_DEFAULTS.marginBottom));
    const [ccaMarginLeft, setCcaMarginLeft] = React.useState(readNum(CCA_MARGIN_LEFT_KEY, CCA_DEFAULTS.marginLeft));
    const [npvcMode, setNpvcMode] = React.useState(readLS(NPVC_MODE_KEY, NPVC_DEFAULTS.mode));
    const [npvcShowAlways, setNpvcShowAlways] = React.useState(readLS(NPVC_SHOW_ALWAYS_KEY, NPVC_DEFAULTS.showAlways));
    const [npvcBlur, setNpvcBlur] = React.useState(readNum(NPVC_BLUR_KEY, NPVC_DEFAULTS.blur));
    const [hpMode, setHpMode] = React.useState(readLS(HP_MODE_KEY, "off"));
    const [popupBounceMode, setPopupBounceMode] = React.useState(readLS(POPUP_BOUNCE_KEY, "on"));
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
      localStorage.setItem("liquify-bg-mode", mode);
      if (mode === "custom") {
        const saved = localStorage.getItem("liquify-bg-image");
        if (!saved) {
          (_a2 = bgFileRef.current) == null ? void 0 : _a2.click();
          return;
        }
      }
      if (mode === "url") {
        const saved = localStorage.getItem("liquify-bg-url");
        if (!saved) return;
      }
      updateBackground();
    };
    const applyArtistMode = async (mode) => {
      var _a2, _b2, _c2;
      setArtistBgMode(mode);
      localStorage.setItem("liquify-artist-bg-mode", mode);
      if (mode === "custom") {
        const saved = localStorage.getItem("liquify-artist-bg-image");
        if (!saved) {
          (_a2 = artistFileRef.current) == null ? void 0 : _a2.click();
          return;
        }
      }
      if (mode === "url") {
        const saved = localStorage.getItem("liquify-artist-bg-url");
        if (!saved) return;
      }
      (_c2 = (_b2 = props.artistCtrl) == null ? void 0 : _b2.setMode) == null ? void 0 : _c2.call(_b2, mode);
    };
    const applyPlayerWidthMode = (mode) => {
      setPlayerWidthMode(mode);
      localStorage.setItem("liquify-player-width", mode);
      applyPlayerWidth(mode);
    };
    const applyPlayerCustom = (nextW, nextH) => {
      localStorage.setItem("liquify-player-custom-width", String(nextW));
      localStorage.setItem("liquify-player-custom-height", String(nextH));
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
    const applyBgBrightness = (value) => {
      setBgBrightnessState(value);
      applyBackgroundBrightness(value);
    };
    const applyArtistBlur = (value) => {
      setArtistScrollBlur(value);
      applyArtistScrollEffect(value, artistScrollBrightness);
    };
    const applyArtistBrightness = (value) => {
      setArtistScrollBrightness(value);
      applyArtistScrollEffect(artistScrollBlur, value);
    };
    const applyTransparent = (w2, h2) => {
      setTcW(w2);
      setTcH(h2);
      applyTransparentControls(w2, h2);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "liquifySettingsPanel" }, /* @__PURE__ */ React.createElement("div", { className: "liquifySettingsHeader" }, /* @__PURE__ */ React.createElement("h3", { className: "liquifySettingsTitle" }, t.title), /* @__PURE__ */ React.createElement("div", { className: "liquifyHeaderActions" }, /* @__PURE__ */ React.createElement(ButtonTooltip, { text: "Discord" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "liquifyControlSurface liquifyHeaderActionBtn",
        "aria-label": "Discord",
        onClick: () => openExternalLink(LIQUIFY_DISCORD_URL)
      },
      getDiscordIcon()
    )), /* @__PURE__ */ React.createElement(ButtonTooltip, { text: "GitHub" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "liquifyControlSurface liquifyHeaderActionBtn",
        "aria-label": "GitHub",
        onClick: () => openExternalLink(LIQUIFY_GITHUB_URL)
      },
      getGithubIcon()
    )), /* @__PURE__ */ React.createElement(ButtonTooltip, { text: t.close || "Close" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "liquifyControlSurface liquifyHeaderActionBtn liquifyCloseBtn",
        "aria-label": t.close || "Close",
        onClick: props.onClose
      },
      "\xD7"
    )))), /* @__PURE__ */ React.createElement("div", { className: "liquifySettingsBody" }, /* @__PURE__ */ React.createElement(Section, { title: titles.accent }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.accentColor, /* @__PURE__ */ React.createElement(Tooltip, { text: (_a = t.tooltips) == null ? void 0 : _a.accentColor })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
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
          localStorage.setItem("liquify-custom-color", next);
          applyAccent(next);
        }
      }
    )))), /* @__PURE__ */ React.createElement(Section, { title: titles.ui || "UI" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_b = t.ui) == null ? void 0 : _b.highPerformanceMode) || "High Performance Mode:", /* @__PURE__ */ React.createElement(Tooltip, { text: (_c = t.tooltips) == null ? void 0 : _c.highPerformanceMode })), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: hpMode,
        options: [
          { value: "on", label: ((_d = t.dropdown) == null ? void 0 : _d.on) || "On" },
          { value: "off", label: ((_e = t.dropdown) == null ? void 0 : _e.off) || "Off" }
        ],
        onChange: (v2) => {
          setHpMode(v2);
          applyHighPerformanceMode(v2);
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_f = t.ui) == null ? void 0 : _f.popupBounce) || "Popup Bounce:", /* @__PURE__ */ React.createElement(Tooltip, { text: (_g = t.tooltips) == null ? void 0 : _g.popupBounce })), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: popupBounceMode,
        options: [
          { value: "on", label: ((_h = t.dropdown) == null ? void 0 : _h.on) || "On" },
          { value: "off", label: ((_i = t.dropdown) == null ? void 0 : _i.off) || "Off" }
        ],
        onChange: (v2) => {
          setPopupBounceMode(v2);
          applyPopupBounce(v2);
        }
      }
    ))), /* @__PURE__ */ React.createElement(Section, { title: titles.background }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.background, /* @__PURE__ */ React.createElement(Tooltip, { text: (_j = t.tooltips) == null ? void 0 : _j.background })), /* @__PURE__ */ React.createElement("div", { className: "liquifyStackedControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: bgMode,
        options: [
          { value: "dynamic", label: t.dropdown.dynamic },
          { value: "animated", label: t.dropdown.animated },
          { value: "custom", label: t.dropdown.custom },
          { value: "url", label: t.dropdown.url || "URL" }
        ],
        onChange: (m2) => void applyBgMode(m2)
      }
    ), bgMode === "custom" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "liquifyControlSurface liquifyActionBtn",
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
    )), bgMode === "url" && /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        className: "liquifyControlSurface liquifyTextInput",
        placeholder: t.enterUrl || "Enter image URL...",
        value: bgUrl,
        onChange: (e) => {
          const val = e.target.value;
          setBgUrl(val);
          localStorage.setItem("liquify-bg-url", val);
          if (val) updateBackground();
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.backgroundBlur, /* @__PURE__ */ React.createElement(Tooltip, { text: (_k = t.tooltips) == null ? void 0 : _k.backgroundBlur })), /* @__PURE__ */ React.createElement(Stepper, { value: bgBlur, min: 0, max: 100, onChange: applyBlur })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.backgroundBrightness || "Background Brightness:", /* @__PURE__ */ React.createElement(Tooltip, { text: (_l = t.tooltips) == null ? void 0 : _l.backgroundBrightness })), /* @__PURE__ */ React.createElement(Stepper, { value: bgBrightness, min: 0, max: 200, onChange: applyBgBrightness }))), /* @__PURE__ */ React.createElement(Section, { title: titles.artist }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.apbackground, /* @__PURE__ */ React.createElement(Tooltip, { text: (_m = t.tooltips) == null ? void 0 : _m.apbackground })), /* @__PURE__ */ React.createElement("div", { className: "liquifyStackedControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: artistBgMode,
        options: [
          { value: "theme", label: t.dropdown.theme },
          { value: "none", label: t.dropdown.none },
          { value: "custom", label: t.dropdown.custom },
          { value: "url", label: t.dropdown.url || "URL" }
        ],
        onChange: (m2) => void applyArtistMode(m2)
      }
    ), artistBgMode === "custom" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "liquifyControlSurface liquifyActionBtn",
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
          await applyCustomArtistBackground(file);
          (_c2 = (_b2 = props.artistCtrl) == null ? void 0 : _b2.applySavedModeIfArtist) == null ? void 0 : _c2.call(_b2);
        }
      }
    )), artistBgMode === "url" && /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        className: "liquifyControlSurface liquifyTextInput",
        placeholder: t.enterUrl || "Enter image URL...",
        value: artistBgUrl,
        onChange: (e) => {
          var _a2, _b2;
          const val = e.target.value;
          setArtistBgUrl(val);
          localStorage.setItem("liquify-artist-bg-url", val);
          if (val) (_b2 = (_a2 = props.artistCtrl) == null ? void 0 : _a2.setMode) == null ? void 0 : _b2.call(_a2, "url");
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.artistScrollBlur, /* @__PURE__ */ React.createElement(Tooltip, { text: (_n = t.tooltips) == null ? void 0 : _n.artistScrollBlur })), /* @__PURE__ */ React.createElement(Stepper, { value: artistScrollBlur, min: 0, max: 100, onChange: applyArtistBlur })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.artistScrollBrightness, /* @__PURE__ */ React.createElement(Tooltip, { text: (_o = t.tooltips) == null ? void 0 : _o.artistScrollBrightness })), /* @__PURE__ */ React.createElement(Stepper, { value: artistScrollBrightness, min: 0, max: 200, onChange: applyArtistBrightness }))), /* @__PURE__ */ React.createElement(Section, { title: titles.canvasCoverArt || "Canvas Cover Art" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_p = t.canvasCoverArt) == null ? void 0 : _p.mode) || "Track Name Cover Art:", /* @__PURE__ */ React.createElement(Tooltip, { text: (_q = t.tooltips) == null ? void 0 : _q.tncaMode })), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: npvcMode,
        options: [
          { value: "off", label: ((_r = t.canvasCoverArt) == null ? void 0 : _r.off) || "Off" },
          { value: "trackInfo", label: ((_s = t.canvasCoverArt) == null ? void 0 : _s.trackInfo) || "Next to Track Info" },
          { value: "outsideTrackInfo", label: ((_t = t.canvasCoverArt) == null ? void 0 : _t.outsideTrackInfo) || "Outside Track Info" },
          { value: "overCanvas", label: ((_u = t.canvasCoverArt) == null ? void 0 : _u.overCanvas) || "Over Canvas" }
        ],
        onChange: (v2) => {
          setNpvcMode(v2);
          localStorage.setItem(NPVC_MODE_KEY, v2);
          window.dispatchEvent(new Event("liquifyNpvcUpdate"));
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_v = t.canvasCoverArt) == null ? void 0 : _v.showAlways) || "Show Always:", /* @__PURE__ */ React.createElement(Tooltip, { text: (_w = t.tooltips) == null ? void 0 : _w.tncaShowAlways })), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: npvcShowAlways,
        options: [
          { value: "yes", label: ((_x = t.canvasCoverArt) == null ? void 0 : _x.yes) || "Yes" },
          { value: "no", label: ((_y = t.canvasCoverArt) == null ? void 0 : _y.no) || "No" }
        ],
        onChange: (v2) => {
          setNpvcShowAlways(v2);
          localStorage.setItem(NPVC_SHOW_ALWAYS_KEY, v2);
          window.dispatchEvent(new Event("liquifyNpvcUpdate"));
        }
      }
    )), npvcMode === "overCanvas" && /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_z = t.canvasCoverArt) == null ? void 0 : _z.blur) || "Blur (px):", /* @__PURE__ */ React.createElement(Tooltip, { text: (_A = t.tooltips) == null ? void 0 : _A.tncaBlur })), /* @__PURE__ */ React.createElement(Stepper, { value: npvcBlur, min: 0, max: 50, onChange: (v2) => {
      setNpvcBlur(v2);
      localStorage.setItem(NPVC_BLUR_KEY, String(v2));
      window.dispatchEvent(new Event("liquifyNpvcUpdate"));
    } }))), /* @__PURE__ */ React.createElement(Section, { title: titles.player }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerWidth, /* @__PURE__ */ React.createElement(Tooltip, { text: (_B = t.tooltips) == null ? void 0 : _B.playerWidth })), /* @__PURE__ */ React.createElement(
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
    )), playerWidthMode === "custom" && /* @__PURE__ */ React.createElement("div", { className: "liquifySubBlock" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerCustomWidth, /* @__PURE__ */ React.createElement(Tooltip, { text: (_C = t.tooltips) == null ? void 0 : _C.playerCustomWidth })), /* @__PURE__ */ React.createElement(
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
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerCustomHeight, /* @__PURE__ */ React.createElement(Tooltip, { text: (_D = t.tooltips) == null ? void 0 : _D.playerCustomHeight })), /* @__PURE__ */ React.createElement(
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
    ))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerRadius, /* @__PURE__ */ React.createElement(Tooltip, { text: (_E = t.tooltips) == null ? void 0 : _E.playerRadius })), /* @__PURE__ */ React.createElement(Stepper, { value: playerRadius, min: 0, max: 100, onChange: applyRadius })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playbarCoverBorderRadius || "Cover Art Border Radius:", /* @__PURE__ */ React.createElement(Tooltip, { text: (_F = t.tooltips) == null ? void 0 : _F.playbarCoverRadius })), /* @__PURE__ */ React.createElement(Stepper, { value: playbarCoverRadius, min: 0, max: 50, onChange: (v2) => {
      setPlaybarCoverRadius(v2);
      applyPlaybarCoverBorderRadius(v2);
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_G = t.comfyCoverArt) == null ? void 0 : _G.enabled) || "Comfy Cover Art:", /* @__PURE__ */ React.createElement(Tooltip, { text: (_H = t.tooltips) == null ? void 0 : _H.ccaEnabled })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: ccaEnabled,
        options: [
          { value: "show", label: t.dropdown.show },
          { value: "hide", label: t.dropdown.hide }
        ],
        onChange: (v2) => {
          setCcaEnabled(v2);
          localStorage.setItem(CCA_ENABLED_KEY, v2);
          applyComfyCoverArt();
        }
      }
    ))), ccaEnabled === "show" && /* @__PURE__ */ React.createElement("div", { className: "liquifySubBlock" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_I = t.comfyCoverArt) == null ? void 0 : _I.width) || "Width (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_J = t.tooltips) == null ? void 0 : _J.ccaWidth })), /* @__PURE__ */ React.createElement(Stepper, { value: ccaWidth, min: 16, max: 200, onChange: (v2) => {
      setCcaWidth(v2);
      localStorage.setItem(CCA_WIDTH_KEY, String(v2));
      applyComfyCoverArt();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_K = t.comfyCoverArt) == null ? void 0 : _K.height) || "Height (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_L = t.tooltips) == null ? void 0 : _L.ccaHeight })), /* @__PURE__ */ React.createElement(Stepper, { value: ccaHeight, min: 16, max: 200, onChange: (v2) => {
      setCcaHeight(v2);
      localStorage.setItem(CCA_HEIGHT_KEY, String(v2));
      applyComfyCoverArt();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_M = t.comfyCoverArt) == null ? void 0 : _M.marginBottom) || "Margin Bottom (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_N = t.tooltips) == null ? void 0 : _N.ccaMarginBottom })), /* @__PURE__ */ React.createElement(Stepper, { value: ccaMarginBottom, min: -50, max: 200, onChange: (v2) => {
      setCcaMarginBottom(v2);
      localStorage.setItem(CCA_MARGIN_BOTTOM_KEY, String(v2));
      applyComfyCoverArt();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_O = t.comfyCoverArt) == null ? void 0 : _O.marginLeft) || "Margin Left (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_P = t.tooltips) == null ? void 0 : _P.ccaMarginLeft })), /* @__PURE__ */ React.createElement(Stepper, { value: ccaMarginLeft, min: -50, max: 200, onChange: (v2) => {
      setCcaMarginLeft(v2);
      localStorage.setItem(CCA_MARGIN_LEFT_KEY, String(v2));
      applyComfyCoverArt();
    } })))), /* @__PURE__ */ React.createElement(Section, { title: titles.nextSongCard || "Next Song Card" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_Q = t.nextSongCard) == null ? void 0 : _Q.show) || "Show Next Song Card:", /* @__PURE__ */ React.createElement(Tooltip, { text: (_R = t.tooltips) == null ? void 0 : _R.nscShow })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: nscShow,
        options: [
          { value: "show", label: ((_S = t.dropdown) == null ? void 0 : _S.show) || "Show" },
          { value: "hide", label: ((_T = t.dropdown) == null ? void 0 : _T.hide) || "Hide" }
        ],
        onChange: (v2) => {
          setNscShow(v2);
          localStorage.setItem(NSC_SHOW_KEY, v2);
          fireNscUpdate();
        }
      }
    ))), nscShow === "show" && /* @__PURE__ */ React.createElement("div", { className: "liquifySubBlock" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_U = t.nextSongCard) == null ? void 0 : _U.position) || "Horizontal Position", /* @__PURE__ */ React.createElement(Tooltip, { text: (_V = t.tooltips) == null ? void 0 : _V.nscPosition })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: nscPosition,
        options: [
          { value: "left", label: ((_W = t.nextSongCard) == null ? void 0 : _W.left) || "Left" },
          { value: "right", label: ((_X = t.nextSongCard) == null ? void 0 : _X.right) || "Right" }
        ],
        onChange: (v2) => {
          setNscPosition(v2);
          localStorage.setItem(NSC_POSITION_KEY, v2);
          fireNscUpdate();
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_Y = t.nextSongCard) == null ? void 0 : _Y.cardHeight) || "Card Height (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_Z = t.tooltips) == null ? void 0 : _Z.nscHeight })), /* @__PURE__ */ React.createElement(Stepper, { value: nscHeight, min: 32, max: 200, onChange: (v2) => {
      setNscHeight(v2);
      localStorage.setItem(NSC_HEIGHT_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((__ = t.nextSongCard) == null ? void 0 : __.cardMaxWidth) || "Card Max Width (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_$ = t.tooltips) == null ? void 0 : _$.nscMaxWidth })), /* @__PURE__ */ React.createElement(Stepper, { value: nscMaxWidth, min: 100, max: 600, onChange: (v2) => {
      setNscMaxWidth(v2);
      localStorage.setItem(NSC_MAX_WIDTH_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_aa = t.nextSongCard) == null ? void 0 : _aa.gap) || "Gap between Image and Text (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_ba = t.tooltips) == null ? void 0 : _ba.nscGap })), /* @__PURE__ */ React.createElement(Stepper, { value: nscGap, min: 0, max: 24, onChange: (v2) => {
      setNscGap(v2);
      localStorage.setItem(NSC_GAP_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_ca = t.nextSongCard) == null ? void 0 : _ca.coverSize) || "Cover Size (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_da = t.tooltips) == null ? void 0 : _da.nscCoverSize })), /* @__PURE__ */ React.createElement(Stepper, { value: nscCoverSize, min: 16, max: 128, onChange: (v2) => {
      setNscCoverSize(v2);
      localStorage.setItem(NSC_COVER_SIZE_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_ea = t.nextSongCard) == null ? void 0 : _ea.hPad) || "Horizontal Padding (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_fa = t.tooltips) == null ? void 0 : _fa.nscHPad })), /* @__PURE__ */ React.createElement(Stepper, { value: nscHPad, min: 0, max: 32, onChange: (v2) => {
      setNscHPad(v2);
      localStorage.setItem(NSC_HPAD_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_ga = t.nextSongCard) == null ? void 0 : _ga.vPad) || "Vertical Padding (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_ha = t.tooltips) == null ? void 0 : _ha.nscVPad })), /* @__PURE__ */ React.createElement(Stepper, { value: nscVPad, min: 0, max: 32, onChange: (v2) => {
      setNscVPad(v2);
      localStorage.setItem(NSC_VPAD_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_ia = t.nextSongCard) == null ? void 0 : _ia.gapToPlayer) || "Distance to Player (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_ja = t.tooltips) == null ? void 0 : _ja.nscGapToPlayer })), /* @__PURE__ */ React.createElement(Stepper, { value: nscGapToPlayer, min: 0, max: 40, onChange: (v2) => {
      setNscGapToPlayer(v2);
      localStorage.setItem(NSC_GAP_PLAYER_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_ka = t.nextSongCard) == null ? void 0 : _ka.borderRadius) || "Border Radius (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_la = t.tooltips) == null ? void 0 : _la.nscBorderRadius })), /* @__PURE__ */ React.createElement(Stepper, { value: nscBorderRadius, min: 0, max: 50, onChange: (v2) => {
      setNscBorderRadius(v2);
      localStorage.setItem(NSC_BORDER_RADIUS_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, ((_ma = t.nextSongCard) == null ? void 0 : _ma.coverBorderRadius) || "Cover Border Radius (px)", /* @__PURE__ */ React.createElement(Tooltip, { text: (_na = t.tooltips) == null ? void 0 : _na.nscCoverBorderRadius })), /* @__PURE__ */ React.createElement(Stepper, { value: nscCoverBorderRadius, min: 0, max: 50, onChange: (v2) => {
      setNscCoverBorderRadius(v2);
      localStorage.setItem(NSC_COVER_BORDER_RADIUS_KEY, String(v2));
      fireNscUpdate();
    } })))), /* @__PURE__ */ React.createElement(Section, { title: titles.playlist }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playlistHeaderBox, /* @__PURE__ */ React.createElement(Tooltip, { text: (_oa = t.tooltips) == null ? void 0 : _oa.playlistHeaderBox })), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: playlistHeader,
        options: [
          { value: "show", label: t.dropdown.show },
          { value: "hide", label: t.dropdown.hide }
        ],
        onChange: applyPlaylistHeaderMode
      }
    ))), /* @__PURE__ */ React.createElement(Section, { title: titles.lyrics || "Lyrics" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.lyricsMode || "Lyrics Translation/Romanization:", /* @__PURE__ */ React.createElement(Tooltip, { text: (_pa = t.tooltips) == null ? void 0 : _pa.lyricsMode })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: lyricsMode,
        options: [
          { value: "off", label: ((_qa = t.lyricsOptions) == null ? void 0 : _qa.off) || "Off" },
          { value: "translation", label: ((_ra = t.lyricsOptions) == null ? void 0 : _ra.translation) || "Translation only" },
          { value: "romanization", label: ((_sa = t.lyricsOptions) == null ? void 0 : _sa.romanization) || "Romanization only" },
          { value: "both", label: ((_ta = t.lyricsOptions) == null ? void 0 : _ta.both) || "Translation + Romanization" }
        ],
        onChange: applyLyricsMode
      }
    )))), /* @__PURE__ */ React.createElement(Section, { title: titles.transparent }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.transparentWidth, /* @__PURE__ */ React.createElement(Tooltip, { text: (_ua = t.tooltips) == null ? void 0 : _ua.transparentWidth })), /* @__PURE__ */ React.createElement("div", { style: { opacity: unixLike ? 0.5 : 1, pointerEvents: unixLike ? "none" : "auto" } }, /* @__PURE__ */ React.createElement(Stepper, { value: tcW, min: 0, max: 400, onChange: (v2) => applyTransparent(v2, tcH) }))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.transparentHeight, /* @__PURE__ */ React.createElement(Tooltip, { text: (_va = t.tooltips) == null ? void 0 : _va.transparentHeight })), /* @__PURE__ */ React.createElement("div", { style: { opacity: unixLike ? 0.5 : 1, pointerEvents: unixLike ? "none" : "auto" } }, /* @__PURE__ */ React.createElement(Stepper, { value: tcH, min: 0, max: 300, onChange: (v2) => applyTransparent(tcW, v2) }))))));
  }
  function closeWithAnimation(overlay, root) {
    overlay.classList.remove("overlay-visible");
    document.querySelectorAll("body > .liquifyTooltipPopup").forEach((el) => el.remove());
    const panel = overlay.querySelector(".liquifySettingsPanel");
    const onEnd = () => {
      panel == null ? void 0 : panel.removeEventListener("transitionend", onEnd);
      try {
        const mountRoot = root || overlay.querySelector("div");
        if (mountRoot) ReactDOM.unmountComponentAtNode(mountRoot);
      } catch (e) {
      }
      document.querySelectorAll("body > .liquifyTooltipPopup").forEach((el) => el.remove());
      overlay.remove();
    };
    if (panel) panel.addEventListener("transitionend", onEnd);
    setTimeout(onEnd, 500);
  }
  function openSettingsModal(artistCtrl) {
    ensureSettingsUiStyle();
    const t = getTranslation();
    const existing = document.getElementById("liquify-settings-react-overlay");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "liquify-settings-react-overlay";
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
      if (e.target === overlay) closeWithAnimation(overlay, root);
    });
    document.body.appendChild(overlay);
    const root = document.createElement("div");
    overlay.appendChild(root);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("overlay-visible");
      });
    });
    const onClose = () => closeWithAnimation(overlay, root);
    ReactDOM.render(/* @__PURE__ */ React.createElement(SettingsContent, { onClose, artistCtrl }), root);
  }
  async function awaitSpicetifyReact() {
    while (!(Spicetify == null ? void 0 : Spicetify.React) || !(Spicetify == null ? void 0 : Spicetify.ReactDOM)) await sleep(200);
    React = Spicetify.React;
    ReactDOM = Spicetify.ReactDOM;
  }
  (async function initLiquifyStandaloneTs() {
    const anyWin = window;
    if (anyWin.liquifyStandaloneTsInitialized) return;
    anyWin.liquifyStandaloneTsInitialized = true;
    await awaitSpicetifyReact();
    const savedGlowMode = localStorage.getItem("liquify-glow-mode") || "default";
    const savedGlowColor = localStorage.getItem("liquify-glow-color") || "#1DB954";
    if (savedGlowMode === "custom") applyGlowAccent(savedGlowColor);
    else resetGlowAccentToDefault();
    const savedAccentMode = localStorage.getItem("liquify-accent-mode") || "dynamic";
    const savedAccentColor = localStorage.getItem("liquify-custom-color") || "#1DB954";
    if (savedAccentMode === "custom") applyAccent(savedAccentColor);
    else if (savedAccentMode === "dynamic") applyDynamicAccent();
    else resetAccentToDefault();
    applySavedBackground();
    ensurePlayerApplied();
    ensureTransparentControlsApplied();
    ensureBackgroundBlurApplied();
    ensureBackgroundBrightnessApplied();
    ensureArtistScrollEffectApplied();
    applySavedPlaylistHeader();
    applyComfyCoverArt();
    ensurePlaybarCoverBorderRadiusApplied();
    ensureHighPerformanceModeApplied();
    ensurePopupBounceApplied();
    if (!anyWin.liquifyDynamicObserverTs) {
      anyWin.liquifyDynamicObserverTs = new MutationObserver(() => {
        const mode = localStorage.getItem("liquify-accent-mode");
        if (mode === "dynamic") applyDynamicAccent();
      });
      anyWin.liquifyDynamicObserverTs.observe(document.body, { attributes: true, subtree: true });
    }
    const artistCtrl = installArtistBackgroundController();
    window.showLiquifySettingsMenu = () => {
      try {
        openSettingsModal(artistCtrl);
      } catch (e) {
        console.error("Liquify settings open failed", e);
      }
    };
    initLiquifyGearInjection(getTranslation());
    installLyricsTranslator();
    installPlaylistIndicatorVisualizer();
    installHomeScreenVisualizer();
    installNextSongCard();
    installLyricsEnhancer();
    installNowPlayingViewCover();
  })();
})();
