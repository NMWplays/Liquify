"use strict";
(() => {
  // src/glassSurface.ts
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = {
    borderRadius: 20,
    borderWidth: 0.07,
    brightness: 50,
    opacity: 0.93,
    blur: 2,
    glassBlur: "",
    backdropBlur: "",
    displace: 0.2,
    saturation: 1,
    distortionScale: -80,
    chromaticAberration: true,
    redOffset: 0,
    greenOffset: 6,
    blueOffset: 10,
    xChannel: "R",
    yChannel: "G",
    mixBlendMode: "screen",
    applyTo: "element"
  };
  var instanceCounter = 0;
  var filterDefs = null;
  var svgFilterSupport = null;
  function supportsSVGFilters() {
    if (svgFilterSupport !== null) return svgFilterSupport;
    const ua = navigator.userAgent;
    const isWebkit = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    if (isWebkit || isFirefox) {
      svgFilterSupport = false;
    } else {
      const div = document.createElement("div");
      div.style.backdropFilter = "url(#liquify-probe)";
      svgFilterSupport = div.style.backdropFilter !== "";
    }
    return svgFilterSupport;
  }
  function ensureFilterDefs() {
    if (filterDefs && filterDefs.isConnected) return filterDefs;
    const host = document.createElementNS(SVG_NS, "svg");
    host.setAttribute("id", "liquify-filter-host");
    host.setAttribute("width", "0");
    host.setAttribute("height", "0");
    host.setAttribute("aria-hidden", "true");
    filterDefs = document.createElementNS(SVG_NS, "defs");
    host.appendChild(filterDefs);
    document.body.appendChild(host);
    return filterDefs;
  }
  var GLASS_STORAGE_KEY = "liquify-glass-enabled";
  var SIMPLE_STYLE_ID = "liquify-glass-simple-style";
  var BULK_FILTER_ID = "glass-filter--r1-7";
  var BULK_FILTER_HOST_ID = "liquify-bulk-filter-host";
  var BULK_STYLE_ID = "liquify-glass-bulk-style";
  var PERF_CLASS = "liquify-perf-no-glass";
  var instances = /* @__PURE__ */ new Set();
  var glassEnabled = readGlassEnabled();
  function readGlassEnabled() {
    try {
      return localStorage.getItem(GLASS_STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  }
  function ensureSimpleStyle() {
    if (document.getElementById(SIMPLE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = SIMPLE_STYLE_ID;
    style.textContent = ".liquify-glass--simple{background:transparent;backdrop-filter:blur(var(--liquify-backdrop-blur, 2rem)) saturate(1.4);-webkit-backdrop-filter:blur(var(--liquify-backdrop-blur, 2rem)) saturate(1.4);}";
    document.head.appendChild(style);
  }
  function isGlassEnabled() {
    return glassEnabled;
  }
  function setGlassEnabled(enabled) {
    glassEnabled = enabled;
    try {
      localStorage.setItem(GLASS_STORAGE_KEY, enabled ? "on" : "off");
    } catch {
    }
    for (const instance of instances) instance.refreshMode();
    document.documentElement.classList.toggle(PERF_CLASS, !enabled);
  }
  function bulkDisplacementMap() {
    const w2 = 400;
    const h2 = 200;
    const r = 20;
    const edge = Math.min(w2, h2) * (0.07 * 0.5);
    const svg = `<svg viewBox="0 0 ${w2} ${h2}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lqbulk-rg" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="lqbulk-bg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect x="0" y="0" width="${w2}" height="${h2}" fill="black"></rect><rect x="0" y="0" width="${w2}" height="${h2}" rx="${r}" fill="url(#lqbulk-rg)" /><rect x="0" y="0" width="${w2}" height="${h2}" rx="${r}" fill="url(#lqbulk-bg)" style="mix-blend-mode: screen" /><rect x="${edge}" y="${edge}" width="${w2 - edge * 2}" height="${h2 - edge * 2}" rx="${r}" fill="hsl(0 0% 50% / 0.93)" style="filter:blur(2px)" /></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  function ensureSharedGlassFilter() {
    if (!supportsSVGFilters()) return;
    if (document.getElementById(BULK_FILTER_HOST_ID)) return;
    const fe = (name, attrs) => {
      const node = document.createElementNS(SVG_NS, name);
      for (const [k, v2] of Object.entries(attrs)) node.setAttribute(k, v2);
      return node;
    };
    const host = document.createElementNS(SVG_NS, "svg");
    host.setAttribute("id", BULK_FILTER_HOST_ID);
    host.setAttribute("width", "0");
    host.setAttribute("height", "0");
    host.setAttribute("aria-hidden", "true");
    const defs = document.createElementNS(SVG_NS, "defs");
    const filter = fe("filter", {
      id: BULK_FILTER_ID,
      "color-interpolation-filters": "sRGB",
      x: "0%",
      y: "0%",
      width: "100%",
      height: "100%"
    });
    const feImage = fe("feImage", { x: "0", y: "0", width: "100%", height: "100%", preserveAspectRatio: "none", result: "map" });
    const map = bulkDisplacementMap();
    feImage.setAttribute("href", map);
    feImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", map);
    filter.appendChild(feImage);
    const distortionScale = -80;
    const channels = [
      { name: "Red", offset: 0, matrix: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" },
      { name: "Green", offset: 6, matrix: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" },
      { name: "Blue", offset: 10, matrix: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" }
    ];
    for (const c2 of channels) {
      filter.appendChild(fe("feDisplacementMap", { in: "SourceGraphic", in2: "map", scale: String(distortionScale + c2.offset), xChannelSelector: "R", yChannelSelector: "G", result: `disp${c2.name}` }));
      filter.appendChild(fe("feColorMatrix", { in: `disp${c2.name}`, type: "matrix", values: c2.matrix, result: c2.name.toLowerCase() }));
    }
    filter.appendChild(fe("feBlend", { in: "red", in2: "green", mode: "screen", result: "rg" }));
    filter.appendChild(fe("feBlend", { in: "rg", in2: "blue", mode: "screen", result: "output" }));
    filter.appendChild(fe("feGaussianBlur", { in: "output", stdDeviation: "0.2" }));
    defs.appendChild(filter);
    host.appendChild(defs);
    document.body.appendChild(host);
  }
  function applyBulkGlass(targets) {
    ensureSharedGlassFilter();
    const defaultSelectors = [];
    const extraRules = [];
    const allSelectors = [];
    for (const t of targets) {
      if (t.before) {
        const b2 = t.blur != null ? `${t.blur}px` : "var(--liquify-glass-blur, 2px)";
        extraRules.push(
          `${t.selector}::before{content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;backdrop-filter:var(--glass-filter) blur(${b2});-webkit-backdrop-filter:var(--glass-filter) blur(${b2});}`
        );
      } else if (t.blur != null) {
        extraRules.push(
          `${t.selector}{backdrop-filter:var(--glass-filter) blur(${t.blur}px);-webkit-backdrop-filter:var(--glass-filter) blur(${t.blur}px);}`
        );
        allSelectors.push(t.selector);
      } else {
        defaultSelectors.push(t.selector);
        allSelectors.push(t.selector);
      }
    }
    const perfBlur = "blur(var(--liquify-backdrop-blur, 2rem)) saturate(1.4)";
    const css = `:root{--glass-filter:url(#${BULK_FILTER_ID});}` + (defaultSelectors.length ? `${defaultSelectors.join(",")}{backdrop-filter:var(--glass-filter) blur(var(--liquify-glass-blur, 2px));-webkit-backdrop-filter:var(--glass-filter) blur(var(--liquify-glass-blur, 2px));}` : "") + extraRules.join("") + (allSelectors.length ? `html.${PERF_CLASS} :is(${allSelectors.join(",")}){backdrop-filter:${perfBlur};-webkit-backdrop-filter:${perfBlur};}` : "");
    let style = document.getElementById(BULK_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = BULK_STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = css;
    document.documentElement.classList.toggle(PERF_CLASS, !glassEnabled);
  }
  function installGlassDevtools() {
    ensureSimpleStyle();
    window.liquifyGlass = {
      enable: () => setGlassEnabled(true),
      disable: () => setGlassEnabled(false),
      toggle: () => setGlassEnabled(!glassEnabled),
      get enabled() {
        return glassEnabled;
      }
    };
  }
  var GlassSurface = class {
    constructor(el, options = {}) {
      this.filter = null;
      this.feImage = null;
      this.resizeObserver = null;
      this.attrObserver = null;
      this.styleEl = null;
      this.destroyed = false;
      this.lastSize = { width: 0, height: 0 };
      this.syncScheduled = false;
      this.scheduleSync = () => {
        if (this.syncScheduled || this.destroyed) return;
        this.syncScheduled = true;
        requestAnimationFrame(() => {
          this.syncScheduled = false;
          this.updateDisplacementMap();
        });
      };
      this.el = el;
      this.opts = { ...DEFAULTS, ...options };
      this.filterId = `liquify-filter-${++instanceCounter}`;
      instances.add(this);
      if (supportsSVGFilters()) {
        this.buildFilter();
        this.applyStyles();
        this.updateDisplacementMap();
        this.resizeObserver = new ResizeObserver(this.scheduleSync);
        this.resizeObserver.observe(el);
      } else {
        this.applyStyles();
      }
      this.attrObserver = new MutationObserver(() => this.ensureApplied());
      this.attrObserver.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
    }
    /**
     * Re-applies class and marker attribute in case Spotify wiped them.
     * Called on every mutation batch, so it must stay cheap: no layout reads —
     * geometry changes are the ResizeObserver's job.
     */
    ensureApplied() {
      if (this.destroyed) return;
      if (!this.el.classList.contains("liquify-glass") || this.el.getAttribute("data-liquify") !== this.filterId) {
        this.applyStyles();
      }
    }
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      instances.delete(this);
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.attrObserver?.disconnect();
      this.attrObserver = null;
      this.filter?.remove();
      this.filter = null;
      this.feImage = null;
      this.styleEl?.remove();
      this.styleEl = null;
      this.el.classList.remove("liquify-glass", "liquify-glass--svg", "liquify-glass--simple", "liquify-glass--before");
      this.el.removeAttribute("data-liquify");
    }
    /** Re-applies the current on/off mode (called by the DevTools toggle). */
    refreshMode() {
      if (this.destroyed) return;
      this.applyStyles();
    }
    applyStyles() {
      const useSvg = glassEnabled && supportsSVGFilters();
      this.el.classList.add("liquify-glass");
      this.el.classList.toggle("liquify-glass--svg", useSvg);
      this.el.classList.toggle("liquify-glass--simple", !useSvg);
      this.el.classList.toggle("liquify-glass--before", this.opts.applyTo === "before");
      this.el.setAttribute("data-liquify", this.filterId);
      this.ensureInstanceStyle();
    }
    /**
     * Element-static custom properties in an own stylesheet rule (Spotify rewrites
     * the inline style attribute, which would wipe them). Holds this element's
     * displacement filter and any per-element blur overrides — none of which
     * depend on the on/off mode, so the rule is built once.
     *
     * A per-element blur is written as `var(--…-special, <value>)` so theme
     * settings can override every special element at once via that variable,
     * while unset elements keep their own value.
     */
    ensureInstanceStyle() {
      if (this.styleEl) return;
      const decls = [];
      if (supportsSVGFilters()) {
        const saturate = this.opts.saturation !== 1 ? ` saturate(${this.opts.saturation})` : "";
        decls.push(`--liquify-filter:url(#${this.filterId})${saturate}`);
      }
      if (this.opts.glassBlur) {
        decls.push(`--liquify-glass-blur:${this.opts.glassBlur}`);
      }
      if (this.opts.backdropBlur) {
        decls.push(`--liquify-backdrop-blur:var(--liquify-backdrop-blur-special, ${this.opts.backdropBlur})`);
      }
      if (decls.length === 0) return;
      this.styleEl = document.createElement("style");
      this.styleEl.textContent = `[data-liquify="${this.filterId}"]{${decls.join(";")};}`;
      document.head.appendChild(this.styleEl);
    }
    /** Builds the SVG filter chain (per-channel displacement + screen blend). */
    buildFilter() {
      const fe = (name, attrs) => {
        const node = document.createElementNS(SVG_NS, name);
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
        return node;
      };
      const o = this.opts;
      const filter = fe("filter", {
        id: this.filterId,
        "color-interpolation-filters": "sRGB",
        x: "0%",
        y: "0%",
        width: "100%",
        height: "100%"
      });
      this.feImage = fe("feImage", {
        x: "0",
        y: "0",
        width: "100%",
        height: "100%",
        preserveAspectRatio: "none",
        result: "map"
      });
      filter.appendChild(this.feImage);
      if (o.chromaticAberration) {
        const channels = [
          {
            name: "Red",
            offset: o.redOffset,
            matrix: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          },
          {
            name: "Green",
            offset: o.greenOffset,
            matrix: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          },
          {
            name: "Blue",
            offset: o.blueOffset,
            matrix: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          }
        ];
        for (const channel of channels) {
          filter.appendChild(
            fe("feDisplacementMap", {
              in: "SourceGraphic",
              in2: "map",
              scale: String(o.distortionScale + channel.offset),
              xChannelSelector: o.xChannel,
              yChannelSelector: o.yChannel,
              result: `disp${channel.name}`
            })
          );
          filter.appendChild(
            fe("feColorMatrix", {
              in: `disp${channel.name}`,
              type: "matrix",
              values: channel.matrix,
              result: channel.name.toLowerCase()
            })
          );
        }
        filter.appendChild(fe("feBlend", { in: "red", in2: "green", mode: "screen", result: "rg" }));
        filter.appendChild(fe("feBlend", { in: "rg", in2: "blue", mode: "screen", result: "output" }));
      } else {
        filter.appendChild(
          fe("feDisplacementMap", {
            in: "SourceGraphic",
            in2: "map",
            scale: String(o.distortionScale),
            xChannelSelector: o.xChannel,
            yChannelSelector: o.yChannel,
            result: "output"
          })
        );
      }
      filter.appendChild(fe("feGaussianBlur", { in: "output", stdDeviation: String(o.displace) }));
      ensureFilterDefs().appendChild(filter);
      this.filter = filter;
    }
    /**
     * The reactbits original displacement map: red ramps transparent→red
     * right-to-left (x axis), blue ramps transparent→blue top-to-bottom and is
     * screen-blended on top. The blurred inner rect keeps the centre clear, so
     * only the edge band refracts.
     */
    generateDisplacementMap(actualWidth, actualHeight) {
      const o = this.opts;
      const edgeSize = Math.min(actualWidth, actualHeight) * (o.borderWidth * 0.5);
      const redGradId = `${this.filterId}-red-grad`;
      const blueGradId = `${this.filterId}-blue-grad`;
      const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${o.borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${o.borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${o.mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${o.borderRadius}" fill="hsl(0 0% ${o.brightness}% / ${o.opacity})" style="filter:blur(${o.blur}px)" />
      </svg>
    `;
      return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
    }
    updateDisplacementMap() {
      if (this.destroyed || !this.feImage) return;
      const rect = this.el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (rect.width === this.lastSize.width && rect.height === this.lastSize.height) return;
      this.lastSize = { width: rect.width, height: rect.height };
      const dataUrl = this.generateDisplacementMap(rect.width, rect.height);
      this.feImage.setAttribute("href", dataUrl);
      this.feImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", dataUrl);
      this.feImage.setAttribute("width", "100%");
      this.feImage.setAttribute("height", "100%");
    }
  };

  // src/observer.ts
  function watchGlassTargets(targets) {
    const attached = /* @__PURE__ */ new Map();
    let scheduled = false;
    const scan = () => {
      scheduled = false;
      const matched = /* @__PURE__ */ new Set();
      for (const target of targets) {
        for (const el of document.querySelectorAll(target.selector)) {
          if (el.closest(".liquify-popup-clone")) continue;
          matched.add(el);
          const existing = attached.get(el);
          if (existing) {
            existing.ensureApplied();
          } else {
            attached.set(el, new GlassSurface(el, target.options));
          }
        }
      }
      for (const [el, surface] of attached) {
        if (!el.isConnected || !matched.has(el)) {
          surface.destroy();
          attached.delete(el);
        }
      }
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(scan);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    scan();
    return () => {
      observer.disconnect();
      for (const surface of attached.values()) surface.destroy();
      attached.clear();
    };
  }

  // src/background.ts
  var FALLBACK_COLOR = "rgb(30,215,96)";
  var EMPTY_BACKDROP = "linear-gradient(135deg, rgb(32,32,38) 0%, rgb(20,20,25) 50%, rgb(26,23,33) 100%)";
  function cssImage(source) {
    return source.startsWith("linear-gradient(") ? source : `url("${source}")`;
  }
  var UNSAMPLEABLE = "liquify:unsampleable";
  function getCoverUrl() {
    const raw = Spicetify.Player?.data?.item?.metadata?.image_url;
    if (!raw) return null;
    return raw.replace("spotify:image:", "https://i.scdn.co/image/");
  }
  var MAX_SAMPLE_PIXELS = 1e6;
  function averageColorOf(img) {
    try {
      const scale = Math.min(1, Math.sqrt(MAX_SAMPLE_PIXELS / (img.width * img.height)));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height).data;
      let r = 0;
      let g2 = 0;
      let b2 = 0;
      let count = 0;
      for (let i2 = 0; i2 < data.length; i2 += 4) {
        r += data[i2];
        g2 += data[i2 + 1];
        b2 += data[i2 + 2];
        count++;
      }
      if (!count) return null;
      return `rgb(${Math.round(r / count)},${Math.round(g2 / count)},${Math.round(b2 / count)})`;
    } catch {
      return null;
    }
  }
  function loadImage(url, anonymous) {
    return new Promise((resolve) => {
      const img = new Image();
      if (anonymous) img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
  async function getDominantColor(url) {
    if (!url) return null;
    if (/^https?:/i.test(url)) {
      const cors = await loadImage(url, true);
      if (cors) {
        const color = averageColorOf(cors);
        if (color) return color;
      }
    }
    const plain = await loadImage(url, false);
    return plain ? averageColorOf(plain) : null;
  }
  function hexToRgbString(hex) {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!match) return null;
    const value = parseInt(match[1], 16);
    return `rgb(${value >> 16 & 255},${value >> 8 & 255},${value & 255})`;
  }
  async function getPaletteColor(uri) {
    if (!uri) return null;
    try {
      const palette = await Spicetify.colorExtractor?.(uri);
      for (const key of ["VIBRANT", "PROMINENT", "LIGHT_VIBRANT", "DESATURATED"]) {
        const hex = palette?.[key];
        if (typeof hex === "string" && hex) {
          const rgb = hexToRgbString(hex);
          if (rgb) return rgb;
        }
      }
    } catch {
    }
    return null;
  }
  async function resolveAccentColor(sourceUrl, fallbackUrl) {
    const direct = await getDominantColor(sourceUrl);
    if (direct) return direct;
    if (fallbackUrl && fallbackUrl !== sourceUrl) {
      const cover = await getDominantColor(fallbackUrl);
      if (cover) return cover;
    }
    const palette = await getPaletteColor(Spicetify.Player?.data?.item?.uri ?? null);
    if (palette) return palette;
    return FALLBACK_COLOR;
  }
  function enhanceColor(rgb, saturationBoost = 2, lightnessBoost = 1.3) {
    const parts = rgb.match(/\d+/g);
    if (!parts || parts.length < 3) return rgb;
    const [r, g2, b2] = parts.map(Number);
    const r1 = r / 255;
    const g1 = g2 / 255;
    const b1 = b2 / 255;
    const max = Math.max(r1, g1, b1);
    const min = Math.min(r1, g1, b1);
    let h2 = 0;
    let s2 = 0;
    let l = (max + min) / 2;
    if (max !== min) {
      const d2 = max - min;
      s2 = l > 0.5 ? d2 / (2 - max - min) : d2 / (max + min);
      switch (max) {
        case r1:
          h2 = (g1 - b1) / d2 + (g1 < b1 ? 6 : 0);
          break;
        case g1:
          h2 = (b1 - r1) / d2 + 2;
          break;
        case b1:
          h2 = (r1 - g1) / d2 + 4;
          break;
      }
      h2 /= 6;
    }
    s2 = Math.min(s2 * saturationBoost, 1);
    l = Math.min(l * lightnessBoost, 1);
    const hue2rgb = (p2, q2, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
      if (t < 1 / 2) return q2;
      if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      return p2;
    };
    let r2;
    let g22;
    let b22;
    if (s2 === 0) {
      r2 = g22 = b22 = l;
    } else {
      const q2 = l < 0.5 ? l * (1 + s2) : l + s2 - l * s2;
      const p2 = 2 * l - q2;
      r2 = hue2rgb(p2, q2, h2 + 1 / 3);
      g22 = hue2rgb(p2, q2, h2);
      b22 = hue2rgb(p2, q2, h2 - 1 / 3);
    }
    return `rgb(${Math.round(r2 * 255)},${Math.round(g22 * 255)},${Math.round(b22 * 255)})`;
  }
  function readAccentBoosts() {
    return {
      satBoost: parseInt(localStorage.getItem("liquify-accent-sat-boost") || "17", 10) / 10,
      lightBoost: parseInt(localStorage.getItem("liquify-accent-light-boost") || "11", 10) / 10
    };
  }
  async function applyAccent(sourceUrl, fallbackUrl) {
    const { satBoost, lightBoost } = readAccentBoosts();
    const color = sourceUrl === UNSAMPLEABLE ? FALLBACK_COLOR : await resolveAccentColor(sourceUrl, fallbackUrl);
    document.documentElement.style.setProperty("--accent-color", enhanceColor(color, satBoost, lightBoost));
    window.dispatchEvent(new Event("liquifyAccentColorReady"));
  }
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function waitFor(get, timeoutMs) {
    const start2 = Date.now();
    for (; ; ) {
      const value = get();
      if (value) return value;
      if (Date.now() - start2 >= timeoutMs) return null;
      await sleep(300);
    }
  }
  async function startBackground() {
    const root = await waitFor(() => document.querySelector(".Root__top-container"), 3e4);
    if (!root) return;
    const layerA = document.createElement("div");
    const layerB = document.createElement("div");
    layerA.classList.add("liquify-bg-layer", "layer-a");
    layerB.classList.add("liquify-bg-layer", "layer-b");
    root.prepend(layerA, layerB);
    const animatedContainer = document.createElement("div");
    animatedContainer.classList.add("liquify-animated-bg");
    const animatedTilesA = [];
    const animatedTilesB = [];
    for (let i2 = 0; i2 < 2; i2++) {
      const tile = document.createElement("div");
      tile.classList.add("liquify-animated-tile");
      animatedContainer.appendChild(tile);
      animatedTilesA.push(tile);
    }
    for (let i2 = 0; i2 < 2; i2++) {
      const tile = document.createElement("div");
      tile.classList.add("liquify-animated-tile");
      animatedContainer.appendChild(tile);
      animatedTilesB.push(tile);
    }
    root.prepend(animatedContainer);
    let useAnimatedA = true;
    let useA = true;
    let lastAccentUrl = null;
    let lastRenderKey = null;
    const contextCoverCache = /* @__PURE__ */ new Map();
    let resolvingContextUri = null;
    function getContextUri() {
      const d2 = Spicetify.Player?.data || {};
      const state = Spicetify.Platform?.PlayerAPI?._state || {};
      return d2.context?.uri || d2.contextUri || d2.context_uri || state.context?.uri || state.contextUri || state.context_uri || "";
    }
    window.liquifyContextDebug = async () => {
      const cover = getCoverUrl();
      return {
        uri: getContextUri(),
        context: Spicetify.Player?.data?.context,
        rawCoverUrl: Spicetify.Player?.data?.item?.metadata?.image_url ?? null,
        coverUrl: cover,
        coverSampledColor: await getDominantColor(cover),
        paletteColor: await getPaletteColor(Spicetify.Player?.data?.item?.uri ?? null),
        accentSource: localStorage.getItem("liquify-accent-source") || "background"
      };
    };
    async function fetchPlaylistCover(uri) {
      const norm = (s2) => String(s2).replace("spotify:image:", "https://i.scdn.co/image/");
      try {
        const meta = await Spicetify.Platform?.PlaylistAPI?.getMetadata?.(uri);
        const img = meta?.images?.[0]?.url || meta?.picture || meta?.image;
        if (img) return norm(img);
      } catch {
      }
      try {
        const id = uri.split(":").pop();
        const res = await Spicetify.CosmosAsync?.get(
          `https://api.spotify.com/v1/playlists/${id}?fields=images`
        );
        const img = res?.images?.[0]?.url;
        if (img) return img;
      } catch {
      }
      return null;
    }
    function getResolvedContextCover() {
      const uri = getContextUri();
      if (!uri || !uri.includes(":playlist:")) return null;
      if (contextCoverCache.has(uri)) return contextCoverCache.get(uri) || null;
      if (resolvingContextUri !== uri) {
        resolvingContextUri = uri;
        fetchPlaylistCover(uri).then((img) => {
          resolvingContextUri = null;
          contextCoverCache.set(uri, img || "");
          if (img) window.dispatchEvent(new Event("liquifyBackgroundChange"));
        });
      }
      return null;
    }
    function render(kind, image) {
      if (!image) return;
      const key = `${kind}|${image}`;
      if (key === lastRenderKey) return;
      lastRenderKey = key;
      if (kind === "animated") {
        layerA.classList.remove("active");
        layerB.classList.remove("active");
        animatedContainer.classList.add("active");
        const onTiles = useAnimatedA ? animatedTilesA : animatedTilesB;
        const offTiles = useAnimatedA ? animatedTilesB : animatedTilesA;
        onTiles.forEach((tile) => {
          tile.style.backgroundImage = image;
          tile.classList.add("active");
        });
        offTiles.forEach((tile) => tile.classList.remove("active"));
        useAnimatedA = !useAnimatedA;
      } else {
        animatedContainer.classList.remove("active");
        animatedTilesA.forEach((tile) => tile.classList.remove("active"));
        animatedTilesB.forEach((tile) => tile.classList.remove("active"));
        if (useA) {
          layerA.style.backgroundImage = image;
          layerA.classList.add("active");
          layerB.classList.remove("active");
        } else {
          layerB.style.backgroundImage = image;
          layerB.classList.add("active");
          layerA.classList.remove("active");
        }
        useA = !useA;
      }
    }
    function resolveBackdrop() {
      const bgMode = localStorage.getItem("liquify-bg-mode") || "dynamic";
      const customImage = localStorage.getItem("liquify-bg-image");
      const bgUrl = localStorage.getItem("liquify-bg-url");
      const customAnimated = localStorage.getItem("liquify-bg-custom-animated") === "on";
      const customKind = customAnimated ? "animated" : "static";
      const coverUrl = getCoverUrl();
      const from = (kind, url) => ({ kind, image: url ? cssImage(url) : null, sampleUrl: url });
      let result;
      if (bgMode === "custom" && customImage) result = from(customKind, customImage);
      else if (bgMode === "url" && bgUrl) {
        result = { kind: customKind, image: cssImage(bgUrl), sampleUrl: UNSAMPLEABLE };
      } else if (bgMode === "playlist") {
        const playlistCover = getResolvedContextCover();
        const isPlaylist = getContextUri().includes(":playlist:");
        result = from(customKind, isPlaylist ? playlistCover : playlistCover || coverUrl);
      } else if (bgMode === "animated") result = from("animated", coverUrl);
      else result = from("static", coverUrl);
      if (!result.image && lastRenderKey === null) {
        return { kind: "static", image: EMPTY_BACKDROP, sampleUrl: null };
      }
      return result;
    }
    function accentSourceOf(sampleUrl) {
      const source = localStorage.getItem("liquify-accent-source") || "background";
      if (source === "cover") return getCoverUrl();
      if (sampleUrl === UNSAMPLEABLE) return UNSAMPLEABLE;
      return sampleUrl || getCoverUrl();
    }
    async function updateBackgroundAndAccent() {
      const { kind, image, sampleUrl } = resolveBackdrop();
      render(kind, image);
      const accentUrl = accentSourceOf(sampleUrl);
      if (accentUrl && accentUrl !== lastAccentUrl) {
        lastAccentUrl = accentUrl;
        await applyAccent(accentUrl, getCoverUrl());
      }
    }
    async function updateAccentOnly() {
      const accentUrl = accentSourceOf(resolveBackdrop().sampleUrl);
      if (!accentUrl) return;
      lastAccentUrl = accentUrl;
      await applyAccent(accentUrl, getCoverUrl());
    }
    updateBackgroundAndAccent();
    window.addEventListener("liquifyBackgroundChange", updateBackgroundAndAccent);
    window.addEventListener("liquifyAccentColorParamsChange", updateAccentOnly);
    waitFor(
      () => typeof Spicetify?.Player?.addEventListener === "function" ? Spicetify.Player : null,
      3e4
    ).then((player) => {
      try {
        player?.addEventListener("songchange", updateBackgroundAndAccent);
      } catch {
      }
    });
    setInterval(updateBackgroundAndAccent, 500);
  }

  // src/popupBounce.ts
  var STORAGE_KEY = "liquify-popup-bounce";
  var STYLE_ID = "liquify-popup-bounce-style";
  var START_SCALE = 0.86;
  var ENTER_DURATION_MS = 240;
  var ENTER_EASING = "cubic-bezier(0.34, 1.7, 0.64, 1)";
  var EXIT_DURATION_MS = 180;
  var EXIT_EASING = "cubic-bezier(0.8, 0, 0.2, 1)";
  var EXIT_FADE_MS = 150;
  var BASE_CLASS = "liquify-popup-bounce";
  var START_CLASS = "liquify-popup-bounce--start";
  var RUN_CLASS = "liquify-popup-bounce--run";
  var CLONE_CLASS = "liquify-popup-clone";
  var POPUP_SELECTOR = ".main-contextMenu-menu, .NJh1B8rnlSUlK7sY, .xamNkt5LX9o8aL1q";
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `.${BASE_CLASS}{transform-origin:top center;will-change:transform;}.${START_CLASS}{transform:scale(${START_SCALE});}.${RUN_CLASS}{transform:scale(1);transition:transform ${ENTER_DURATION_MS}ms ${ENTER_EASING};}`;
    document.head.appendChild(style);
  }
  function startPopupBounce() {
    ensureStyle();
    let enabled = (localStorage.getItem(STORAGE_KEY) || "on") === "on";
    window.addEventListener("liquifyPopupBounceChange", () => {
      enabled = (localStorage.getItem(STORAGE_KEY) || "on") === "on";
    });
    const enterCleanups = /* @__PURE__ */ new WeakMap();
    const lastRect = /* @__PURE__ */ new WeakMap();
    function bounceIn(el, triggerBtn) {
      if (!el || !enabled) return;
      if (triggerBtn?.id === "liquify-settings-btn") return;
      enterCleanups.get(el)?.();
      el.classList.remove(RUN_CLASS);
      el.classList.add(BASE_CLASS, START_CLASS);
      void el.offsetWidth;
      el.classList.remove(START_CLASS);
      el.classList.add(RUN_CLASS);
      const done = () => {
        el.removeEventListener("transitionend", done);
        window.clearTimeout(timer);
        enterCleanups.delete(el);
        el.classList.remove(BASE_CLASS, START_CLASS, RUN_CLASS);
      };
      const timer = window.setTimeout(done, ENTER_DURATION_MS + 120);
      el.addEventListener("transitionend", done, { once: true });
      enterCleanups.set(el, done);
    }
    function fadeOutClone(el) {
      if (!enabled) return;
      const rect = lastRect.get(el);
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const clone = el.cloneNode(true);
      clone.classList.add(CLONE_CLASS);
      const wasBefore = clone.classList.contains("liquify-glass--before");
      clone.classList.remove(BASE_CLASS, START_CLASS, RUN_CLASS, "liquify-glass", "liquify-glass--svg", "liquify-glass--simple", "liquify-glass--before");
      clone.removeAttribute("data-liquify");
      const s2 = clone.style;
      s2.position = "fixed";
      s2.left = `${rect.left}px`;
      s2.top = `${rect.top}px`;
      s2.width = `${rect.width}px`;
      s2.height = `${rect.height}px`;
      s2.margin = "0";
      s2.pointerEvents = "none";
      s2.zIndex = "10000";
      s2.transformOrigin = "top center";
      s2.transform = "translateY(0) scale(1)";
      s2.opacity = "1";
      document.body.appendChild(clone);
      const radius = parseFloat(getComputedStyle(clone).borderTopLeftRadius) || 20;
      const surface = new GlassSurface(clone, {
        borderRadius: radius,
        glassBlur: "5px",
        applyTo: wasBefore ? "before" : "element"
      });
      requestAnimationFrame(() => {
        s2.transition = `transform ${EXIT_DURATION_MS}ms ${EXIT_EASING}, opacity ${EXIT_FADE_MS}ms ease-in`;
        s2.transform = "translateY(8px) scale(0.95)";
        s2.opacity = "0";
      });
      const remove = () => {
        clone.removeEventListener("transitionend", remove);
        window.clearTimeout(timer);
        surface.destroy();
        clone.remove();
      };
      const timer = window.setTimeout(remove, EXIT_DURATION_MS + 150);
      clone.addEventListener("transitionend", remove, { once: true });
    }
    const prevVisible = /* @__PURE__ */ new WeakMap();
    const expandedState = /* @__PURE__ */ new WeakMap();
    function isVisible(el) {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false;
      return el.offsetParent !== null;
    }
    function scanPopups() {
      document.querySelectorAll(POPUP_SELECTOR).forEach((el) => {
        if (el.classList.contains(CLONE_CLASS)) return;
        const was = !!prevVisible.get(el);
        const now = isVisible(el);
        if (now) {
          lastRect.set(el, el.getBoundingClientRect());
          if (!was) bounceIn(el);
        }
        prevVisible.set(el, now);
      });
    }
    function collectRemovedPopups(node, out) {
      if (!(node instanceof HTMLElement) || node.classList.contains(CLONE_CLASS)) return;
      if (node.matches(POPUP_SELECTOR)) out.add(node);
      node.querySelectorAll(POPUP_SELECTOR).forEach((p2) => {
        if (!p2.classList.contains(CLONE_CLASS)) out.add(p2);
      });
    }
    const mo = new MutationObserver((mutations) => {
      const removedPopups = /* @__PURE__ */ new Set();
      for (const m2 of mutations) {
        if (m2.attributeName === "aria-expanded") {
          const btn = m2.target;
          const now = btn.getAttribute("aria-expanded");
          const was = expandedState.get(btn);
          if (was === "false" && now === "true") {
            const popup = btn.parentElement?.querySelector(POPUP_SELECTOR) ?? null;
            bounceIn(popup, btn);
          }
          expandedState.set(btn, now);
        }
        m2.removedNodes.forEach((node) => collectRemovedPopups(node, removedPopups));
      }
      for (const popup of removedPopups) fadeOutClone(popup);
      requestAnimationFrame(scanPopups);
    });
    mo.observe(document.body, {
      subtree: true,
      attributes: true,
      childList: true,
      attributeFilter: ["aria-expanded", "style", "class"]
    });
    document.querySelectorAll("[aria-expanded]").forEach((btn) => {
      expandedState.set(btn, btn.getAttribute("aria-expanded"));
    });
    scanPopups();
  }

  // src/settings/shared.ts
  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }
  function sleep2(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function readLS(key, fallback) {
    const value = localStorage.getItem(key);
    return value === null || value === "" ? fallback : value;
  }
  function readNum(key, fallback) {
    const raw = localStorage.getItem(key);
    const parsed = raw === null ? NaN : parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  function ensureStyleTag(id) {
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    return style;
  }
  function updateStyle(id, css) {
    ensureStyleTag(id).textContent = css;
  }
  function hasMountedCanvasMedia(el) {
    if (!el) return false;
    if (el.querySelector("video")) return true;
    const img = el.querySelector("img");
    return !!img && !!img.getAttribute("src");
  }
  function getOsName() {
    return (Spicetify?.Platform?.PlatformData?.os_name || navigator.platform || "").toString().toLowerCase();
  }
  function isUnixLikeOS() {
    const os = getOsName();
    return os.includes("linux") || os.includes("mac") || os.includes("darwin") || os.includes("osx") || os.includes("macos");
  }

  // src/settings/runtime/reactRuntime.ts
  var React;
  var ReactDOM;
  async function awaitSpicetifyReact() {
    while (!Spicetify?.React || !Spicetify?.ReactDOM) await sleep2(200);
    React = Spicetify.React;
    ReactDOM = Spicetify.ReactDOM;
  }
  async function awaitSpicetifyPlayer(timeoutMs = 1e4) {
    const start2 = Date.now();
    const ready = () => {
      const p2 = Spicetify?.Player;
      return !!p2 && typeof p2.next === "function" && typeof p2.back === "function" && typeof p2.addEventListener === "function";
    };
    while (!ready() && Date.now() - start2 < timeoutMs) await sleep2(200);
  }

  // src/settings/i18n/translations.ts
  var settingsCopy = {
    settingsTitle: "Liquify Settings",
    title: "Liquify Settings",
    close: "Close",
    chooseFile: "Choose file",
    enterUrl: "Enter image URL...",
    resetAllSettings: "Reset all Settings",
    searchPlaceholder: "Search settings...",
    accentColor: "Color Theme:",
    accentSource: "Color Source:",
    accentSatBoost: "Saturation Boost:",
    accentLightBoost: "Brightness Boost:",
    background: "Background:",
    backgroundBlur: "Background Blur (px):",
    animatedBackground: "Animated Background:",
    backgroundBrightness: "Background Brightness (%):",
    apbackground: "Artist Page Background:",
    artistScrollBlur: "Artist Scroll Blur (px):",
    artistScrollBrightness: "Artist Scroll Brightness (%):",
    playerWidth: "Player Width:",
    playerCustomWidth: "Player Width (%):",
    playerCustomHeight: "Player Height (px):",
    playerRadius: "Player Border Radius (px):",
    playbarCoverBorderRadius: "Cover Art Border Radius (px):",
    transparentPlayer: "Transparent Player:",
    floatingPlayer: "Floating Player:",
    connectBar: "Show Connect Bar:",
    compactPlayer: "Compact Player:",
    playerControlIcons: "Use New Player Icons:",
    progressBarHeight: "Progress & Volume Bar Height (px):",
    progressBarRadius: "Progress & Volume Bar Border Radius (px):",
    progressBarCompat: "Compatibility Mode:",
    playlistHeaderBox: "Playlist Header Box:",
    actionBarBox: "Action Bar Box:",
    lyricsMode: "Lyrics Translation/Romanization:",
    themedLyrics: "Themed Lyrics:",
    lyricsFontSize: "Lyrics Font Size (px):",
    lyricsMargin: "Lyrics Margin (px):",
    transparentWidth: "Window Controls Width (px):",
    transparentHeight: "Window Controls Height (px):",
    aria: {
      scrollSectionsLeft: "Scroll sections left",
      scrollSectionsRight: "Scroll sections right",
      help: "Help"
    },
    sections: {
      accent: "Colors",
      background: "Background",
      artist: "Artist",
      ui: "UI",
      player: "Player",
      nextSongCard: "Next Song Card",
      canvasCoverArt: "Canvas Cover Art",
      playlist: "Playlist",
      lyrics: "Lyrics",
      transparent: "Window Controls",
      config: "Config"
    },
    subSections: {
      performanceGlass: "Performance & Glass",
      animations: "Animations",
      homescreen: "Homescreen",
      borderRadius: "Border Radius",
      sizeShape: "Size & Shape",
      progressVolume: "Progress & Volume Bar",
      coverArt: "Cover Art",
      modes: "Modes",
      styling: "Styling",
      translation: "Translation"
    },
    config: {
      hint: "Copy your current Liquify config to back it up or share it, or paste one in and apply it. Custom background images aren't included.",
      copy: "Copy",
      reload: "Load current",
      apply: "Paste & Apply",
      copied: "Copied to clipboard.",
      copyFailed: "Couldn't copy - select the text and copy manually.",
      invalid: "Invalid config."
    },
    dropdown: {
      default: "Default",
      custom: "Custom",
      dynamic: "Dynamic",
      animated: "Animated",
      playlist: "Playlist",
      theme: "Theme",
      none: "None",
      show: "Show",
      hide: "Hide",
      on: "On",
      off: "Off",
      url: "URL",
      backgroundSource: "Background",
      songCover: "Song Cover"
    },
    ui: {
      performanceMode: "Performance Mode:",
      popupBounce: "Popup Bounce:",
      newHomescreenLayout: "Use New Homescreen Layout:",
      glassBlur: "Glass Blur (px):",
      backdropBlur: "Backdrop Blur (px):",
      leftSidebarRadius: "Left Sidebar Border Radius (px):",
      mainViewRadius: "Main View Border Radius (px):",
      rightSidebarRadius: "Right Sidebar Border Radius (px):"
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
      width: "Width (px):",
      height: "Height (px):",
      marginBottom: "Margin Bottom (px):",
      marginLeft: "Margin Left (px):"
    },
    nextSongCard: {
      show: "Show Next Song Card:",
      position: "Horizontal Position",
      cardHeight: "Card Height (px):",
      cardMaxWidth: "Card Max Width (px):",
      gap: "Gap between Image and Text (px):",
      coverSize: "Cover Size (px):",
      hPad: "Horizontal Padding (px):",
      vPad: "Vertical Padding (px):",
      gapToPlayer: "Distance to Player (px):",
      borderRadius: "Border Radius (px):",
      coverBorderRadius: "Cover Border Radius (px):",
      left: "Left",
      right: "Right"
    },
    lyricsOptions: {
      off: "Off",
      translation: "Translation only",
      romanization: "Romanization only",
      both: "Translation + Romanization"
    },
    tooltips: {
      accentColor: "Default uses Spotify's green, Custom a fixed color you pick, Dynamic adapts the accent to the current cover art.",
      accentSource: "Which image the dynamic colors are taken from: whatever the background currently shows (playlist, your own image or URL), or always the song cover.",
      accentSatBoost: "How much to intensify the colors taken from the cover art (Dynamic mode only).",
      accentLightBoost: "How much to brighten the accent taken from the cover art (Dynamic mode only).",
      background: "Dynamic = blurred current cover, Animated = moving gradient, Playlist = the playlist's image, Custom = your own image, URL = an image link.",
      animatedBackground: "Subtly animates the custom, URL or playlist background.",
      artistBackground: "What to show behind artist pages: the theme default, nothing, your own image, or an image URL.",
      artistScrollBlur: "Blur of the artist header image as you scroll down the page.",
      artistScrollBrightness: "Brightness of the artist header image as you scroll down the page.",
      performanceMode: "Turns off the SVG liquid-glass refraction and uses a plain blur instead - lighter on the GPU.",
      glassBlur: "Backdrop blur strength behind the liquid-glass surfaces.",
      popupBounce: "Spring / bounce animation when popups and menus open.",
      newHomescreenLayout: "Boxes the home sections in glass cards and tidies up the card grid heights.",
      playerWidth: "Default = Spotify's width, Theme = Liquify's width, Custom = set it yourself below.",
      comfyCoverArt: "Enlarges the now-playing cover art in the bottom-left for a comfier look.",
      floatingPlayer: "Detaches the playbar and floats it centered at the bottom, over the content.",
      transparentPlayer: "Removes the glass refraction from the bottom playbar so it's see-through.",
      compactPlayer: "Shrinks the bottom bar to a single row with controls and progress side by side.",
      playerControlIcons: "Replaces Spotify's play, pause and skip glyphs with Liquify's own media player icons.",
      connectBar: "The bar that appears when playback is running on another device via Spotify Connect.",
      nextSongCard: "Shows a small preview card of the upcoming track.",
      canvasCoverArt: "Adds the cover art in the Now Playing view: next to the track info, outside it, or off.",
      canvasShowAlways: "Keeps the cover art visible even when a Canvas / video is playing.",
      progressBarCompat: "Stops the theme from styling the progress and volume bars, so another extension can control them. Hides the height and radius options above.",
      playlistHeaderBox: "Wraps the playlist header in a glass box.",
      actionBarBox: "Wraps the playlist action bar (play / shuffle row) in a glass box.",
      themedLyrics: "Styles the lyrics page to match the theme (glass + accent).",
      transparentWidth: "Width of the transparent draggable area reserved for the window buttons (Windows only).",
      transparentHeight: "Height of the transparent draggable area reserved for the window buttons (Windows only)."
    },
    onboarding: {
      welcomeTag: "Welcome to",
      step1Title: "Liquify Settings V3",
      step1Text: "This button opens Liquify Settings V3 for Liquify Theme V2. Customize backgrounds, accent colors, the player, animations and much more - all in one place.",
      lyricsTitle: "Liquid Lyrics",
      lyricsText: "Liquid Lyrics is the official lyrics extension for Liquify Theme V2 - it makes the theme feel complete, and it's the only lyrics extension officially supported by the theme. Install it from the Marketplace?",
      lyricsInstallBtn: "Install",
      lyricsSkipBtn: "Maybe later",
      lyricsInstalling: "Installing...",
      lyricsInstalled: "Installed",
      lyricsRetryBtn: "Retry",
      lyricsFailed: "Couldn't auto-install - you can grab Liquid Lyrics from the Marketplace.",
      lyricsReloadNote: "Liquify will reload once you finish to load Liquid Lyrics.",
      step2Title: "Explore your Settings",
      step2Text: "All Liquify Settings V3 options live here, and changes are saved instantly. Close the panel anytime with the close button or by clicking outside.",
      nextBtn: "Next",
      gotItBtn: "Got it"
    }
  };
  var liquifyTranslations = {
    en: settingsCopy,
    de: {
      settingsTitle: "Liquify Einstellungen",
      title: "Liquify Einstellungen",
      close: "Schlie\xDFen",
      chooseFile: "Datei w\xE4hlen",
      enterUrl: "Bild-URL eingeben...",
      resetAllSettings: "Alle Einstellungen zur\xFCcksetzen",
      searchPlaceholder: "Einstellungen suchen...",
      accentColor: "Farbschema:",
      accentSource: "Farbquelle:",
      accentSatBoost: "S\xE4ttigungs-Boost:",
      accentLightBoost: "Helligkeits-Boost:",
      background: "Hintergrund:",
      backgroundBlur: "Hintergrundunsch\xE4rfe (px):",
      animatedBackground: "Animierter Hintergrund:",
      backgroundBrightness: "Hintergrundhelligkeit (%):",
      apbackground: "K\xFCnstlerseiten-Hintergrund:",
      artistScrollBlur: "K\xFCnstler-Scroll-Unsch\xE4rfe (px):",
      artistScrollBrightness: "K\xFCnstler-Scroll-Helligkeit (%):",
      playerWidth: "Player-Breite:",
      playerCustomWidth: "Player-Breite (%):",
      playerCustomHeight: "Player-H\xF6he (px):",
      playerRadius: "Player-Rundung (px):",
      playbarCoverBorderRadius: "Cover-Rundung (px):",
      transparentPlayer: "Transparenter Player:",
      floatingPlayer: "Schwebender Player:",
      connectBar: "Connect-Leiste anzeigen:",
      compactPlayer: "Kompakter Player:",
      playerControlIcons: "Neue Player-Icons verwenden:",
      progressBarHeight: "Fortschritts- & Lautst\xE4rkeleisten-H\xF6he (px):",
      progressBarRadius: "Fortschritts- & Lautst\xE4rkeleisten-Rundung (px):",
      progressBarCompat: "Kompatibilit\xE4tsmodus:",
      playlistHeaderBox: "Playlist-Header-Box:",
      actionBarBox: "Aktionsleisten-Box:",
      lyricsMode: "Songtext-\xDCbersetzung/Romanisierung:",
      themedLyrics: "Thematisierte Songtexte:",
      lyricsFontSize: "Songtext-Schriftgr\xF6\xDFe (px):",
      lyricsMargin: "Songtext-Abstand (px):",
      transparentWidth: "Fenstersteuerungs-Breite (px):",
      transparentHeight: "Fenstersteuerungs-H\xF6he (px):",
      aria: { scrollSectionsLeft: "Sektionen nach links scrollen", scrollSectionsRight: "Sektionen nach rechts scrollen", help: "Hilfe" },
      sections: { accent: "Farben", background: "Hintergrund", artist: "K\xFCnstler", ui: "UI", player: "Player", nextSongCard: "N\xE4chster Song", canvasCoverArt: "Canvas Cover Art", playlist: "Playlist", lyrics: "Songtexte", transparent: "Fenstersteuerung", config: "Konfig" },
      subSections: { performanceGlass: "Performance & Glass", animations: "Animationen", homescreen: "Startseite", borderRadius: "Rundungen", sizeShape: "Gr\xF6\xDFe & Form", progressVolume: "Fortschritts- & Lautst\xE4rkeleiste", coverArt: "Cover-Art", modes: "Modi", styling: "Styling", translation: "\xDCbersetzung" },
      config: { hint: "Kopiere deine aktuelle Liquify-Konfiguration zum Sichern oder Teilen, oder f\xFCge eine ein und wende sie an. Eigene Hintergrundbilder sind nicht enthalten.", copy: "Kopieren", reload: "Aktuelle laden", apply: "Einf\xFCgen & Anwenden", copied: "In die Zwischenablage kopiert.", copyFailed: "Kopieren fehlgeschlagen - markiere den Text und kopiere ihn manuell.", invalid: "Ung\xFCltige Konfiguration." },
      dropdown: { default: "Standard", custom: "Benutzerdefiniert", dynamic: "Dynamisch", animated: "Animiert", playlist: "Playlist", theme: "Theme", none: "Keine", show: "Anzeigen", hide: "Ausblenden", on: "An", off: "Aus", url: "URL", backgroundSource: "Hintergrund", songCover: "Song-Cover" },
      ui: { performanceMode: "Performance-Modus:", popupBounce: "Popup-Bounce:", newHomescreenLayout: "Neues Startseiten-Layout verwenden:", glassBlur: "Glass-Unsch\xE4rfe (px):", backdropBlur: "Backdrop-Unsch\xE4rfe (px):", leftSidebarRadius: "Rundung der linken Seitenleiste (px):", mainViewRadius: "Rundung der Hauptansicht (px):", rightSidebarRadius: "Rundung der rechten Seitenleiste (px):" },
      canvasCoverArt: { mode: "Cover-Art beim Tracknamen:", off: "Aus", trackInfo: "Neben Track-Info", outsideTrackInfo: "Au\xDFerhalb der Track-Info", overCanvas: "\xDCber Canvas", showAlways: "Immer anzeigen:", yes: "Ja", no: "Nein", blur: "Unsch\xE4rfe (px):" },
      comfyCoverArt: { enabled: "Comfy Cover Art:", width: "Breite (px):", height: "H\xF6he (px):", marginBottom: "Unterer Abstand (px):", marginLeft: "Linker Abstand (px):" },
      nextSongCard: { show: "N\xE4chste-Song-Karte anzeigen:", position: "Horizontale Position", cardHeight: "Kartenh\xF6he (px):", cardMaxWidth: "Max. Kartenbreite (px):", gap: "Abstand zwischen Bild und Text (px):", coverSize: "Cover-Gr\xF6\xDFe (px):", hPad: "Horizontaler Innenabstand (px):", vPad: "Vertikaler Innenabstand (px):", gapToPlayer: "Abstand zum Player (px):", borderRadius: "Rundung (px):", coverBorderRadius: "Cover-Rundung (px):", left: "Links", right: "Rechts" },
      lyricsOptions: { off: "Aus", translation: "Nur \xDCbersetzung", romanization: "Nur Romanisierung", both: "\xDCbersetzung + Romanisierung" },
      tooltips: {
        accentColor: "Standard nutzt Spotifys Gr\xFCn, Benutzerdefiniert eine feste Farbe, Dynamisch passt den Akzent an das aktuelle Cover an.",
        accentSource: "Woher die dynamischen Farben kommen: vom aktuell angezeigten Hintergrund (Playlist, eigenes Bild oder URL) oder immer vom Song-Cover.",
        accentSatBoost: "Wie stark Farben aus dem Cover intensiviert werden (nur dynamischer Modus).",
        accentLightBoost: "Wie stark der Akzent aus dem Cover aufgehellt wird (nur dynamischer Modus).",
        background: "Dynamisch = verschwommenes aktuelles Cover, Animiert = bewegter Verlauf, Playlist = Playlist-Bild, Benutzerdefiniert = eigenes Bild, URL = Bildlink.",
        animatedBackground: "Animiert benutzerdefinierte, URL- oder Playlist-Hintergr\xFCnde dezent.",
        artistBackground: "Was hinter K\xFCnstlerseiten angezeigt wird: Theme-Standard, nichts, eigenes Bild oder Bild-URL.",
        artistScrollBlur: "Unsch\xE4rfe des K\xFCnstler-Headerbilds beim Scrollen nach unten.",
        artistScrollBrightness: "Helligkeit des K\xFCnstler-Headerbilds beim Scrollen nach unten.",
        performanceMode: "Schaltet die SVG-Liquid-Glass-Brechung aus und nutzt stattdessen einfache Unsch\xE4rfe - leichter f\xFCr die GPU.",
        glassBlur: "Backdrop-Unsch\xE4rfe hinter Liquid-Glass-Fl\xE4chen.",
        popupBounce: "Federnde Animation, wenn Popups und Men\xFCs ge\xF6ffnet werden.",
        newHomescreenLayout: "Packt Startseiten-Sektionen in Glass-Karten und r\xE4umt die Kartenh\xF6hen auf.",
        playerWidth: "Standard = Spotify-Breite, Theme = Liquify-Breite, Benutzerdefiniert = unten selbst einstellen.",
        comfyCoverArt: "Vergr\xF6\xDFert das Cover unten links f\xFCr einen gem\xFCtlicheren Look.",
        floatingPlayer: "L\xF6st die Wiedergabeleiste und l\xE4sst sie unten mittig \xFCber dem Inhalt schweben.",
        transparentPlayer: "Entfernt die Glass-Brechung vom unteren Player, sodass er durchsichtig ist.",
        compactPlayer: "Verkleinert die untere Leiste auf eine Reihe mit Controls und Fortschritt nebeneinander.",
        playerControlIcons: "Ersetzt Spotifys Play-, Pause- und Skip-Symbole durch Liquifys eigene Mediaplayer-Icons.",
        connectBar: "Die Leiste, die erscheint, wenn Wiedergabe \xFCber Spotify Connect auf einem anderen Ger\xE4t l\xE4uft.",
        nextSongCard: "Zeigt eine kleine Vorschaukarte des n\xE4chsten Tracks.",
        canvasCoverArt: "F\xFCgt Cover-Art in der Now-Playing-Ansicht hinzu: neben der Track-Info, au\xDFerhalb davon oder aus.",
        canvasShowAlways: "H\xE4lt das Cover sichtbar, auch wenn Canvas/Video l\xE4uft.",
        playlistHeaderBox: "Packt den Playlist-Header in eine Glass-Box.",
        progressBarCompat: "Verhindert, dass das Theme die Fortschritts- und Lautst\xE4rkeleiste stylt, damit eine andere Extension sie steuern kann. Blendet die H\xF6hen- und Rundungsoptionen dar\xFCber aus.",
        actionBarBox: "Packt die Playlist-Aktionsleiste (Play-/Shuffle-Reihe) in eine Glass-Box.",
        themedLyrics: "Stylt die Songtextseite passend zum Theme (Glass + Akzent).",
        transparentWidth: "Breite des transparenten Ziehbereichs f\xFCr Fensterbuttons (nur Windows).",
        transparentHeight: "H\xF6he des transparenten Ziehbereichs f\xFCr Fensterbuttons (nur Windows)."
      },
      onboarding: { welcomeTag: "Willkommen bei", step1Title: "Liquify Settings V3", step1Text: "Dieser Button \xF6ffnet Liquify Settings V3 f\xFCr Liquify Theme V2. Passe Hintergr\xFCnde, Akzentfarben, Player, Animationen und vieles mehr an - alles an einem Ort.", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics ist die offizielle Songtext-Erweiterung f\xFCr Liquify Theme V2 - sie macht das Theme komplett und ist die einzige offiziell unterst\xFCtzte Songtext-Erweiterung. Aus dem Marketplace installieren?", lyricsInstallBtn: "Installieren", lyricsSkipBtn: "Vielleicht sp\xE4ter", lyricsInstalling: "Installiere...", lyricsInstalled: "Installiert", lyricsRetryBtn: "Erneut versuchen", lyricsFailed: "Automatische Installation fehlgeschlagen - du findest Liquid Lyrics im Marketplace.", lyricsReloadNote: "Liquify l\xE4dt neu, sobald du fertig bist, um Liquid Lyrics zu laden.", step2Title: "Erkunde deine Einstellungen", step2Text: "Alle Optionen von Liquify Settings V3 sind hier und \xC4nderungen werden sofort gespeichert. Schlie\xDFe das Fenster jederzeit mit dem Schlie\xDFen-Button oder per Klick au\xDFerhalb.", nextBtn: "Weiter", gotItBtn: "Verstanden" }
    },
    ru: {
      settingsTitle: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Liquify",
      title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Liquify",
      close: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
      chooseFile: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B",
      enterUrl: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 URL \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F...",
      resetAllSettings: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
      searchPlaceholder: "\u041F\u043E\u0438\u0441\u043A \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A...",
      accentColor: "\u0426\u0432\u0435\u0442\u043E\u0432\u0430\u044F \u0442\u0435\u043C\u0430:",
      accentSource: "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0446\u0432\u0435\u0442\u0430:",
      accentSatBoost: "\u0423\u0441\u0438\u043B\u0435\u043D\u0438\u0435 \u043D\u0430\u0441\u044B\u0449\u0435\u043D\u043D\u043E\u0441\u0442\u0438:",
      accentLightBoost: "\u0423\u0441\u0438\u043B\u0435\u043D\u0438\u0435 \u044F\u0440\u043A\u043E\u0441\u0442\u0438:",
      background: "\u0424\u043E\u043D:",
      backgroundBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0444\u043E\u043D\u0430 (px):",
      animatedBackground: "\u0410\u043D\u0438\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0444\u043E\u043D:",
      backgroundBrightness: "\u042F\u0440\u043A\u043E\u0441\u0442\u044C \u0444\u043E\u043D\u0430 (%):",
      apbackground: "\u0424\u043E\u043D \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0430\u0440\u0442\u0438\u0441\u0442\u0430:",
      artistScrollBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0430\u0440\u0442\u0438\u0441\u0442\u0430 \u043F\u0440\u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0435 (px):",
      artistScrollBrightness: "\u042F\u0440\u043A\u043E\u0441\u0442\u044C \u0430\u0440\u0442\u0438\u0441\u0442\u0430 \u043F\u0440\u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0435 (%):",
      playerWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u0435\u0435\u0440\u0430:",
      playerCustomWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u0435\u0435\u0440\u0430 (%):",
      playerCustomHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043F\u043B\u0435\u0435\u0440\u0430 (px):",
      playerRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u043F\u043B\u0435\u0435\u0440\u0430 (px):",
      playbarCoverBorderRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 (px):",
      transparentPlayer: "\u041F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0439 \u043F\u043B\u0435\u0435\u0440:",
      floatingPlayer: "\u041F\u043B\u0430\u0432\u0430\u044E\u0449\u0438\u0439 \u043F\u043B\u0435\u0435\u0440:",
      connectBar: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C Connect-\u043F\u0430\u043D\u0435\u043B\u044C:",
      compactPlayer: "\u041A\u043E\u043C\u043F\u0430\u043A\u0442\u043D\u044B\u0439 \u043F\u043B\u0435\u0435\u0440:",
      playerControlIcons: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0435 \u0437\u043D\u0430\u0447\u043A\u0438 \u043F\u043B\u0435\u0435\u0440\u0430:",
      progressBarHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u0430 \u0438 \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u0438 (px):",
      progressBarRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u0430 \u0438 \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u0438 (px):",
      progressBarCompat: "\u0420\u0435\u0436\u0438\u043C \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u0438:",
      playlistHeaderBox: "\u0411\u043B\u043E\u043A \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430 \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u0430:",
      actionBarBox: "\u0411\u043B\u043E\u043A \u043F\u0430\u043D\u0435\u043B\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439:",
      lyricsMode: "\u041F\u0435\u0440\u0435\u0432\u043E\u0434/\u0440\u043E\u043C\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0442\u0435\u043A\u0441\u0442\u0430:",
      themedLyrics: "\u0422\u0435\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0442\u0435\u043A\u0441\u0442\u044B:",
      lyricsFontSize: "\u0420\u0430\u0437\u043C\u0435\u0440 \u0448\u0440\u0438\u0444\u0442\u0430 \u0442\u0435\u043A\u0441\u0442\u0430 (px):",
      lyricsMargin: "\u041E\u0442\u0441\u0442\u0443\u043F \u0442\u0435\u043A\u0441\u0442\u0430 (px):",
      transparentWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432 \u043E\u043A\u043D\u0430 (px):",
      transparentHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432 \u043E\u043A\u043D\u0430 (px):",
      aria: { scrollSectionsLeft: "\u041F\u0440\u043E\u043A\u0440\u0443\u0442\u0438\u0442\u044C \u0440\u0430\u0437\u0434\u0435\u043B\u044B \u0432\u043B\u0435\u0432\u043E", scrollSectionsRight: "\u041F\u0440\u043E\u043A\u0440\u0443\u0442\u0438\u0442\u044C \u0440\u0430\u0437\u0434\u0435\u043B\u044B \u0432\u043F\u0440\u0430\u0432\u043E", help: "\u0421\u043F\u0440\u0430\u0432\u043A\u0430" },
      sections: { accent: "\u0426\u0432\u0435\u0442\u0430", background: "\u0424\u043E\u043D", artist: "\u0410\u0440\u0442\u0438\u0441\u0442", ui: "\u0418\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441", player: "\u041F\u043B\u0435\u0435\u0440", nextSongCard: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0442\u0440\u0435\u043A", canvasCoverArt: "Canvas Cover Art", playlist: "\u041F\u043B\u0435\u0439\u043B\u0438\u0441\u0442", lyrics: "\u0422\u0435\u043A\u0441\u0442\u044B", transparent: "\u042D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u043E\u043A\u043D\u0430", config: "\u041A\u043E\u043D\u0444\u0438\u0433" },
      subSections: { performanceGlass: "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0438 Glass", animations: "\u0410\u043D\u0438\u043C\u0430\u0446\u0438\u0438", homescreen: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", borderRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F", sizeShape: "\u0420\u0430\u0437\u043C\u0435\u0440 \u0438 \u0444\u043E\u0440\u043C\u0430", progressVolume: "\u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0438 \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u044C", coverArt: "\u041E\u0431\u043B\u043E\u0436\u043A\u0430", modes: "\u0420\u0435\u0436\u0438\u043C\u044B", styling: "\u0421\u0442\u0438\u043B\u044C", translation: "\u041F\u0435\u0440\u0435\u0432\u043E\u0434" },
      config: { hint: "\u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u043A\u043E\u043D\u0444\u0438\u0433 Liquify \u0434\u043B\u044F \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0439 \u043A\u043E\u043F\u0438\u0438 \u0438\u043B\u0438 \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u0438 \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u0435 \u0435\u0433\u043E. \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0435 \u0444\u043E\u043D\u043E\u0432\u044B\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0430\u044E\u0442\u0441\u044F.", copy: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C", reload: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0438\u0439", apply: "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0438 \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C", copied: "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0432 \u0431\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430.", copyFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C - \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0438 \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0432\u0440\u0443\u0447\u043D\u0443\u044E.", invalid: "\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u043A\u043E\u043D\u0444\u0438\u0433." },
      dropdown: { default: "\u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E", custom: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0439", dynamic: "\u0414\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439", animated: "\u0410\u043D\u0438\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439", playlist: "\u041F\u043B\u0435\u0439\u043B\u0438\u0441\u0442", theme: "\u0422\u0435\u043C\u0430", none: "\u041D\u0435\u0442", show: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C", hide: "\u0421\u043A\u0440\u044B\u0442\u044C", on: "\u0412\u043A\u043B", off: "\u0412\u044B\u043A\u043B", url: "URL", backgroundSource: "\u0424\u043E\u043D", songCover: "\u041E\u0431\u043B\u043E\u0436\u043A\u0430 \u0442\u0440\u0435\u043A\u0430" },
      ui: { performanceMode: "\u0420\u0435\u0436\u0438\u043C \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438:", popupBounce: "\u041F\u0440\u0443\u0436\u0438\u043D\u0430 \u043F\u043E\u043F\u0430\u043F\u043E\u0432:", newHomescreenLayout: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439 \u0432\u0438\u0434 \u0433\u043B\u0430\u0432\u043D\u043E\u0439:", glassBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 Glass (px):", backdropBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0444\u043E\u043D\u0430 (px):", leftSidebarRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u043B\u0435\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438 (px):", mainViewRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 (px):", rightSidebarRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u0430\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438 (px):" },
      canvasCoverArt: { mode: "\u041E\u0431\u043B\u043E\u0436\u043A\u0430 \u0443 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0442\u0440\u0435\u043A\u0430:", off: "\u0412\u044B\u043A\u043B", trackInfo: "\u0420\u044F\u0434\u043E\u043C \u0441 \u0438\u043D\u0444\u043E \u0442\u0440\u0435\u043A\u0430", outsideTrackInfo: "\u0412\u043D\u0435 \u0438\u043D\u0444\u043E \u0442\u0440\u0435\u043A\u0430", overCanvas: "\u041F\u043E\u0432\u0435\u0440\u0445 Canvas", showAlways: "\u0412\u0441\u0435\u0433\u0434\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C:", yes: "\u0414\u0430", no: "\u041D\u0435\u0442", blur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 (px):" },
      comfyCoverArt: { enabled: "\u0423\u044E\u0442\u043D\u0430\u044F \u043E\u0431\u043B\u043E\u0436\u043A\u0430:", width: "\u0428\u0438\u0440\u0438\u043D\u0430 (px):", height: "\u0412\u044B\u0441\u043E\u0442\u0430 (px):", marginBottom: "\u041D\u0438\u0436\u043D\u0438\u0439 \u043E\u0442\u0441\u0442\u0443\u043F (px):", marginLeft: "\u041B\u0435\u0432\u044B\u0439 \u043E\u0442\u0441\u0442\u0443\u043F (px):" },
      nextSongCard: { show: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0433\u043E \u0442\u0440\u0435\u043A\u0430:", position: "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u0430\u044F \u043F\u043E\u0437\u0438\u0446\u0438\u044F", cardHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 (px):", cardMaxWidth: "\u041C\u0430\u043A\u0441. \u0448\u0438\u0440\u0438\u043D\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 (px):", gap: "\u0420\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043C\u0435\u0436\u0434\u0443 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435\u043C \u0438 \u0442\u0435\u043A\u0441\u0442\u043E\u043C (px):", coverSize: "\u0420\u0430\u0437\u043C\u0435\u0440 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 (px):", hPad: "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0441\u0442\u0443\u043F (px):", vPad: "\u0412\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0441\u0442\u0443\u043F (px):", gapToPlayer: "\u0420\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0434\u043E \u043F\u043B\u0435\u0435\u0440\u0430 (px):", borderRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 (px):", coverBorderRadius: "\u0421\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 (px):", left: "\u0421\u043B\u0435\u0432\u0430", right: "\u0421\u043F\u0440\u0430\u0432\u0430" },
      lyricsOptions: { off: "\u0412\u044B\u043A\u043B", translation: "\u0422\u043E\u043B\u044C\u043A\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434", romanization: "\u0422\u043E\u043B\u044C\u043A\u043E \u0440\u043E\u043C\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F", both: "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 + \u0440\u043E\u043C\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F" },
      tooltips: {
        accentColor: "\u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0437\u0435\u043B\u0435\u043D\u044B\u0439 Spotify, \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0439 - \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u0446\u0432\u0435\u0442, \u0434\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u043E\u0434\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u0434 \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u043E\u0431\u043B\u043E\u0436\u043A\u0443.",
        accentSource: "\u041E\u0442\u043A\u0443\u0434\u0430 \u0431\u0435\u0440\u0443\u0442\u0441\u044F \u0434\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0446\u0432\u0435\u0442\u0430: \u0438\u0437 \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u0444\u043E\u043D\u0430 (\u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442, \u0441\u0432\u043E\u0451 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0438\u043B\u0438 URL) \u0438\u043B\u0438 \u0432\u0441\u0435\u0433\u0434\u0430 \u0438\u0437 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 \u0442\u0440\u0435\u043A\u0430.",
        accentSatBoost: "\u041D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0443\u0441\u0438\u043B\u0438\u0432\u0430\u0442\u044C \u0446\u0432\u0435\u0442\u0430 \u0438\u0437 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 (\u0442\u043E\u043B\u044C\u043A\u043E \u0434\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0440\u0435\u0436\u0438\u043C).",
        accentLightBoost: "\u041D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043E\u0441\u0432\u0435\u0442\u043B\u044F\u0442\u044C \u0430\u043A\u0446\u0435\u043D\u0442 \u0438\u0437 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 (\u0442\u043E\u043B\u044C\u043A\u043E \u0434\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0440\u0435\u0436\u0438\u043C).",
        background: "\u0414\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439 = \u0440\u0430\u0437\u043C\u044B\u0442\u0430\u044F \u0442\u0435\u043A\u0443\u0449\u0430\u044F \u043E\u0431\u043B\u043E\u0436\u043A\u0430, \u0430\u043D\u0438\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 = \u0434\u0432\u0438\u0436\u0443\u0449\u0438\u0439\u0441\u044F \u0433\u0440\u0430\u0434\u0438\u0435\u043D\u0442, \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442 = \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u0430, \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0439 = \u0441\u0432\u043E\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435, URL = \u0441\u0441\u044B\u043B\u043A\u0430.",
        animatedBackground: "\u041D\u0435\u043D\u0430\u0432\u044F\u0437\u0447\u0438\u0432\u043E \u0430\u043D\u0438\u043C\u0438\u0440\u0443\u0435\u0442 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0439, URL \u0438\u043B\u0438 \u0444\u043E\u043D \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u0430.",
        artistBackground: "\u0427\u0442\u043E \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0437\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u043C\u0438 \u0430\u0440\u0442\u0438\u0441\u0442\u043E\u0432: \u0444\u043E\u043D \u0442\u0435\u043C\u044B, \u043D\u0438\u0447\u0435\u0433\u043E, \u0441\u0432\u043E\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0438\u043B\u0438 URL.",
        artistScrollBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430 \u0430\u0440\u0442\u0438\u0441\u0442\u0430 \u043F\u0440\u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0435 \u0432\u043D\u0438\u0437.",
        artistScrollBrightness: "\u042F\u0440\u043A\u043E\u0441\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430 \u0430\u0440\u0442\u0438\u0441\u0442\u0430 \u043F\u0440\u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0435 \u0432\u043D\u0438\u0437.",
        performanceMode: "\u041E\u0442\u043A\u043B\u044E\u0447\u0430\u0435\u0442 SVG-\u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u0435 Liquid Glass \u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043E\u0431\u044B\u0447\u043D\u043E\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435 - \u043B\u0435\u0433\u0447\u0435 \u0434\u043B\u044F GPU.",
        glassBlur: "\u0421\u0438\u043B\u0430 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u044F \u0437\u0430 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044F\u043C\u0438 Liquid Glass.",
        popupBounce: "\u041F\u0440\u0443\u0436\u0438\u043D\u043D\u0430\u044F \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u044F \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F \u043F\u043E\u043F\u0430\u043F\u043E\u0432 \u0438 \u043C\u0435\u043D\u044E.",
        newHomescreenLayout: "\u041F\u043E\u043C\u0435\u0449\u0430\u0435\u0442 \u0440\u0430\u0437\u0434\u0435\u043B\u044B \u0433\u043B\u0430\u0432\u043D\u043E\u0439 \u0432 glass-\u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u0438 \u0432\u044B\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0435\u0442 \u0432\u044B\u0441\u043E\u0442\u0443 \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A.",
        playerWidth: "\u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E = \u0448\u0438\u0440\u0438\u043D\u0430 Spotify, \u0422\u0435\u043C\u0430 = \u0448\u0438\u0440\u0438\u043D\u0430 Liquify, \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0439 = \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u043D\u0438\u0436\u0435.",
        comfyCoverArt: "\u0423\u0432\u0435\u043B\u0438\u0447\u0438\u0432\u0430\u0435\u0442 \u043E\u0431\u043B\u043E\u0436\u043A\u0443 \u0432\u043D\u0438\u0437\u0443 \u0441\u043B\u0435\u0432\u0430 \u0434\u043B\u044F \u0431\u043E\u043B\u0435\u0435 \u0443\u044E\u0442\u043D\u043E\u0433\u043E \u0432\u0438\u0434\u0430.",
        floatingPlayer: "\u041E\u0442\u0434\u0435\u043B\u044F\u0435\u0442 \u043F\u0430\u043D\u0435\u043B\u044C \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u0438 \u0440\u0430\u0437\u043C\u0435\u0449\u0430\u0435\u0442 \u0435\u0435 \u043F\u043E \u0446\u0435\u043D\u0442\u0440\u0443 \u0441\u043D\u0438\u0437\u0443 \u043F\u043E\u0432\u0435\u0440\u0445 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430.",
        transparentPlayer: "\u0423\u0431\u0438\u0440\u0430\u0435\u0442 glass-\u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u0435 \u0441 \u043D\u0438\u0436\u043D\u0435\u0433\u043E \u043F\u043B\u0435\u0435\u0440\u0430, \u0434\u0435\u043B\u0430\u044F \u0435\u0433\u043E \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u043C.",
        compactPlayer: "\u0421\u0436\u0438\u043C\u0430\u0435\u0442 \u043D\u0438\u0436\u043D\u044E\u044E \u043F\u0430\u043D\u0435\u043B\u044C \u0432 \u043E\u0434\u0438\u043D \u0440\u044F\u0434 \u0441 \u043A\u043D\u043E\u043F\u043A\u0430\u043C\u0438 \u0438 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u043E\u043C \u0440\u044F\u0434\u043E\u043C.",
        playerControlIcons: "\u0417\u0430\u043C\u0435\u043D\u044F\u0435\u0442 \u0437\u043D\u0430\u0447\u043A\u0438 \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F, \u043F\u0430\u0443\u0437\u044B \u0438 \u043F\u0435\u0440\u0435\u043C\u043E\u0442\u043A\u0438 Spotify \u043D\u0430 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u043A\u0438 \u043F\u043B\u0435\u0435\u0440\u0430 Liquify.",
        connectBar: "\u041F\u0430\u043D\u0435\u043B\u044C, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u0438\u0434\u0435\u0442 \u043D\u0430 \u0434\u0440\u0443\u0433\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435 \u0447\u0435\u0440\u0435\u0437 Spotify Connect.",
        nextSongCard: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u0443\u044E \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0433\u043E \u0442\u0440\u0435\u043A\u0430.",
        canvasCoverArt: "\u0414\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 \u043E\u0431\u043B\u043E\u0436\u043A\u0443 \u0432 \u0432\u0438\u0434 Now Playing: \u0440\u044F\u0434\u043E\u043C \u0441 \u0438\u043D\u0444\u043E \u0442\u0440\u0435\u043A\u0430, \u0432\u043D\u0435 \u0435\u0433\u043E \u0438\u043B\u0438 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u043E.",
        canvasShowAlways: "\u041E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u043E\u0431\u043B\u043E\u0436\u043A\u0443 \u0432\u0438\u0434\u0438\u043C\u043E\u0439, \u0434\u0430\u0436\u0435 \u043A\u043E\u0433\u0434\u0430 \u0438\u0433\u0440\u0430\u0435\u0442 Canvas/\u0432\u0438\u0434\u0435\u043E.",
        playlistHeaderBox: "\u041E\u0431\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u0435\u0442 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u0430 \u0432 glass-\u0431\u043B\u043E\u043A.",
        progressBarCompat: "\u0417\u0430\u043F\u0440\u0435\u0449\u0430\u0435\u0442 \u0442\u0435\u043C\u0435 \u043E\u0444\u043E\u0440\u043C\u043B\u044F\u0442\u044C \u043F\u043E\u043B\u043E\u0441\u044B \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u0430 \u0438 \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u0438, \u0447\u0442\u043E\u0431\u044B \u0438\u043C\u0438 \u043C\u043E\u0433\u043B\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0434\u0440\u0443\u0433\u043E\u0435 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435. \u0421\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0432\u044B\u0441\u043E\u0442\u044B \u0438 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F \u0432\u044B\u0448\u0435.",
        actionBarBox: "\u041E\u0431\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u0435\u0442 \u043F\u0430\u043D\u0435\u043B\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u0430 (\u0440\u044F\u0434 play/shuffle) \u0432 glass-\u0431\u043B\u043E\u043A.",
        themedLyrics: "\u041E\u0444\u043E\u0440\u043C\u043B\u044F\u0435\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0442\u0435\u043A\u0441\u0442\u043E\u0432 \u043F\u043E\u0434 \u0442\u0435\u043C\u0443 (Glass + \u0430\u043A\u0446\u0435\u043D\u0442).",
        transparentWidth: "\u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0439 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u043D\u0438\u044F \u0434\u043B\u044F \u043A\u043D\u043E\u043F\u043E\u043A \u043E\u043A\u043D\u0430 (\u0442\u043E\u043B\u044C\u043A\u043E Windows).",
        transparentHeight: "\u0412\u044B\u0441\u043E\u0442\u0430 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0439 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u043D\u0438\u044F \u0434\u043B\u044F \u043A\u043D\u043E\u043F\u043E\u043A \u043E\u043A\u043D\u0430 (\u0442\u043E\u043B\u044C\u043A\u043E Windows)."
      },
      onboarding: { welcomeTag: "\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C \u0432", step1Title: "Liquify Settings V3", step1Text: "\u042D\u0442\u0430 \u043A\u043D\u043E\u043F\u043A\u0430 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 Liquify Settings V3 \u0434\u043B\u044F Liquify Theme V2. \u041D\u0430\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0439\u0442\u0435 \u0444\u043E\u043D\u044B, \u0430\u043A\u0446\u0435\u043D\u0442\u043D\u044B\u0435 \u0446\u0432\u0435\u0442\u0430, \u043F\u043B\u0435\u0435\u0440, \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u0438 \u0438 \u043C\u043D\u043E\u0433\u043E\u0435 \u0434\u0440\u0443\u0433\u043E\u0435 \u0432 \u043E\u0434\u043D\u043E\u043C \u043C\u0435\u0441\u0442\u0435.", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics - \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0435 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 \u0442\u0435\u043A\u0441\u0442\u043E\u0432 \u0434\u043B\u044F Liquify Theme V2. \u041E\u043D\u043E \u0434\u043E\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0442\u0435\u043C\u0443 \u0438 \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u043C \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u043C \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435\u043C \u0442\u0435\u043A\u0441\u0442\u043E\u0432. \u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0438\u0437 Marketplace?", lyricsInstallBtn: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C", lyricsSkipBtn: "\u041C\u043E\u0436\u0435\u0442 \u043F\u043E\u0437\u0436\u0435", lyricsInstalling: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430...", lyricsInstalled: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E", lyricsRetryBtn: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C", lyricsFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 - \u043D\u0430\u0439\u0434\u0438\u0442\u0435 Liquid Lyrics \u0432 Marketplace.", lyricsReloadNote: "Liquify \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C Liquid Lyrics.", step2Title: "\u0418\u0437\u0443\u0447\u0438\u0442\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", step2Text: "\u0412\u0441\u0435 \u043E\u043F\u0446\u0438\u0438 Liquify Settings V3 \u043D\u0430\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C, \u0430 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u043E. \u0417\u0430\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u0430\u043D\u0435\u043B\u044C \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u044F \u0438\u043B\u0438 \u043A\u043B\u0438\u043A\u043E\u043C \u0441\u043D\u0430\u0440\u0443\u0436\u0438.", nextBtn: "\u0414\u0430\u043B\u0435\u0435", gotItBtn: "\u041F\u043E\u043D\u044F\u0442\u043D\u043E" }
    },
    es: {
      settingsTitle: "Ajustes de Liquify",
      title: "Ajustes de Liquify",
      close: "Cerrar",
      chooseFile: "Elegir archivo",
      enterUrl: "Introduce la URL de la imagen...",
      resetAllSettings: "Restablecer todos los ajustes",
      searchPlaceholder: "Buscar ajustes...",
      accentColor: "Tema de color:",
      accentSource: "Fuente de color:",
      accentSatBoost: "Aumento de saturaci\xF3n:",
      accentLightBoost: "Aumento de brillo:",
      background: "Fondo:",
      backgroundBlur: "Desenfoque del fondo (px):",
      animatedBackground: "Fondo animado:",
      backgroundBrightness: "Brillo del fondo (%):",
      apbackground: "Fondo de p\xE1gina de artista:",
      artistScrollBlur: "Desenfoque del artista al desplazar (px):",
      artistScrollBrightness: "Brillo del artista al desplazar (%):",
      playerWidth: "Ancho del reproductor:",
      playerCustomWidth: "Ancho del reproductor (%):",
      playerCustomHeight: "Alto del reproductor (px):",
      playerRadius: "Radio del reproductor (px):",
      playbarCoverBorderRadius: "Radio de portada (px):",
      transparentPlayer: "Reproductor transparente:",
      floatingPlayer: "Reproductor flotante:",
      connectBar: "Mostrar barra Connect:",
      compactPlayer: "Reproductor compacto:",
      playerControlIcons: "Usar nuevos iconos del reproductor:",
      progressBarHeight: "Altura de progreso y volumen (px):",
      progressBarRadius: "Radio de progreso y volumen (px):",
      progressBarCompat: "Modo de compatibilidad:",
      playlistHeaderBox: "Caja del encabezado de playlist:",
      actionBarBox: "Caja de barra de acciones:",
      lyricsMode: "Traducci\xF3n/Romanizaci\xF3n de letras:",
      themedLyrics: "Letras tematizadas:",
      lyricsFontSize: "Tama\xF1o de letra (px):",
      lyricsMargin: "Margen de letras (px):",
      transparentWidth: "Ancho de controles de ventana (px):",
      transparentHeight: "Alto de controles de ventana (px):",
      aria: { scrollSectionsLeft: "Desplazar secciones a la izquierda", scrollSectionsRight: "Desplazar secciones a la derecha", help: "Ayuda" },
      sections: { accent: "Colores", background: "Fondo", artist: "Artista", ui: "Interfaz", player: "Reproductor", nextSongCard: "Siguiente canci\xF3n", canvasCoverArt: "Canvas Cover Art", playlist: "Playlist", lyrics: "Letras", transparent: "Controles de ventana", config: "Config" },
      subSections: { performanceGlass: "Rendimiento y Glass", animations: "Animaciones", homescreen: "Inicio", borderRadius: "Bordes redondeados", sizeShape: "Tama\xF1o y forma", progressVolume: "Progreso y volumen", coverArt: "Portada", modes: "Modos", styling: "Estilo", translation: "Traducci\xF3n" },
      config: { hint: "Copia tu configuraci\xF3n actual de Liquify para guardarla o compartirla, o pega una y apl\xEDcala. Las im\xE1genes de fondo personalizadas no se incluyen.", copy: "Copiar", reload: "Cargar actual", apply: "Pegar y aplicar", copied: "Copiado al portapapeles.", copyFailed: "No se pudo copiar - selecciona el texto y c\xF3pialo manualmente.", invalid: "Configuraci\xF3n no v\xE1lida." },
      dropdown: { default: "Predeterminado", custom: "Personalizado", dynamic: "Din\xE1mico", animated: "Animado", playlist: "Playlist", theme: "Tema", none: "Ninguno", show: "Mostrar", hide: "Ocultar", on: "Activado", off: "Desactivado", url: "URL", backgroundSource: "Fondo", songCover: "Portada" },
      ui: { performanceMode: "Modo rendimiento:", popupBounce: "Rebote de popups:", newHomescreenLayout: "Usar nuevo dise\xF1o de inicio:", glassBlur: "Desenfoque Glass (px):", backdropBlur: "Desenfoque de fondo (px):", leftSidebarRadius: "Radio de barra lateral izquierda (px):", mainViewRadius: "Radio de vista principal (px):", rightSidebarRadius: "Radio de barra lateral derecha (px):" },
      canvasCoverArt: { mode: "Portada junto al nombre:", off: "Desactivado", trackInfo: "Junto a info de pista", outsideTrackInfo: "Fuera de info de pista", overCanvas: "Sobre Canvas", showAlways: "Mostrar siempre:", yes: "S\xED", no: "No", blur: "Desenfoque (px):" },
      comfyCoverArt: { enabled: "Comfy Cover Art:", width: "Ancho (px):", height: "Alto (px):", marginBottom: "Margen inferior (px):", marginLeft: "Margen izquierdo (px):" },
      nextSongCard: { show: "Mostrar tarjeta de siguiente canci\xF3n:", position: "Posici\xF3n horizontal", cardHeight: "Alto de tarjeta (px):", cardMaxWidth: "Ancho m\xE1x. de tarjeta (px):", gap: "Separaci\xF3n entre imagen y texto (px):", coverSize: "Tama\xF1o de portada (px):", hPad: "Relleno horizontal (px):", vPad: "Relleno vertical (px):", gapToPlayer: "Distancia al reproductor (px):", borderRadius: "Radio de borde (px):", coverBorderRadius: "Radio de portada (px):", left: "Izquierda", right: "Derecha" },
      lyricsOptions: { off: "Desactivado", translation: "Solo traducci\xF3n", romanization: "Solo romanizaci\xF3n", both: "Traducci\xF3n + romanizaci\xF3n" },
      tooltips: {
        accentColor: "Predeterminado usa el verde de Spotify, Personalizado usa un color fijo, Din\xE1mico adapta el acento a la portada actual.",
        accentSource: "De d\xF3nde se toman los colores din\xE1micos: del fondo actual (playlist, tu imagen o URL) o siempre de la portada.",
        accentSatBoost: "Cu\xE1nto intensificar los colores tomados de la portada (solo modo Din\xE1mico).",
        accentLightBoost: "Cu\xE1nto aclarar el acento tomado de la portada (solo modo Din\xE1mico).",
        background: "Din\xE1mico = portada actual desenfocada, Animado = degradado en movimiento, Playlist = imagen de la playlist, Personalizado = imagen propia, URL = enlace de imagen.",
        animatedBackground: "Anima suavemente el fondo personalizado, URL o de playlist.",
        artistBackground: "Qu\xE9 mostrar detr\xE1s de p\xE1ginas de artista: fondo del tema, nada, imagen propia o URL.",
        artistScrollBlur: "Desenfoque de la imagen del encabezado de artista al desplazarte.",
        artistScrollBrightness: "Brillo de la imagen del encabezado de artista al desplazarte.",
        performanceMode: "Desactiva la refracci\xF3n SVG Liquid Glass y usa un desenfoque simple - m\xE1s ligero para la GPU.",
        glassBlur: "Intensidad del desenfoque detr\xE1s de superficies Liquid Glass.",
        popupBounce: "Animaci\xF3n el\xE1stica al abrir popups y men\xFAs.",
        newHomescreenLayout: "Coloca las secciones de inicio en tarjetas glass y ordena las alturas de la cuadr\xEDcula.",
        playerWidth: "Predeterminado = ancho de Spotify, Tema = ancho de Liquify, Personalizado = config\xFAralo abajo.",
        comfyCoverArt: "Aumenta la portada de reproducci\xF3n abajo a la izquierda para un aspecto m\xE1s c\xF3modo.",
        floatingPlayer: "Separa la barra de reproducci\xF3n y la hace flotar centrada abajo sobre el contenido.",
        transparentPlayer: "Quita la refracci\xF3n glass del reproductor inferior para hacerlo transparente.",
        compactPlayer: "Reduce la barra inferior a una fila con controles y progreso juntos.",
        playerControlIcons: "Reemplaza los iconos de reproducir, pausar y saltar de Spotify por los iconos de reproductor propios de Liquify.",
        connectBar: "La barra que aparece cuando la reproducci\xF3n est\xE1 en otro dispositivo v\xEDa Spotify Connect.",
        nextSongCard: "Muestra una peque\xF1a tarjeta de vista previa de la pr\xF3xima pista.",
        canvasCoverArt: "A\xF1ade la portada en Now Playing: junto a la info de pista, fuera de ella o desactivado.",
        canvasShowAlways: "Mantiene la portada visible incluso cuando se reproduce Canvas/video.",
        playlistHeaderBox: "Envuelve el encabezado de la playlist en una caja glass.",
        progressBarCompat: "Impide que el tema aplique estilos a las barras de progreso y volumen, para que otra extensi\xF3n pueda controlarlas. Oculta las opciones de altura y redondeo de arriba.",
        actionBarBox: "Envuelve la barra de acciones de la playlist (play/shuffle) en una caja glass.",
        themedLyrics: "Da estilo a la p\xE1gina de letras para que coincida con el tema (Glass + acento).",
        transparentWidth: "Ancho del \xE1rea transparente para arrastrar reservada a los botones de ventana (solo Windows).",
        transparentHeight: "Alto del \xE1rea transparente para arrastrar reservada a los botones de ventana (solo Windows)."
      },
      onboarding: { welcomeTag: "Bienvenido a", step1Title: "Liquify Settings V3", step1Text: "Este bot\xF3n abre Liquify Settings V3 para Liquify Theme V2. Personaliza fondos, colores de acento, el reproductor, animaciones y mucho m\xE1s en un solo lugar.", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics es la extensi\xF3n oficial de letras para Liquify Theme V2. Completa el tema y es la \xFAnica extensi\xF3n de letras oficialmente compatible. \xBFInstalarla desde Marketplace?", lyricsInstallBtn: "Instalar", lyricsSkipBtn: "Quiz\xE1 despu\xE9s", lyricsInstalling: "Instalando...", lyricsInstalled: "Instalado", lyricsRetryBtn: "Reintentar", lyricsFailed: "No se pudo instalar autom\xE1ticamente - puedes buscar Liquid Lyrics en Marketplace.", lyricsReloadNote: "Liquify se recargar\xE1 al terminar para cargar Liquid Lyrics.", step2Title: "Explora tus ajustes", step2Text: "Todas las opciones de Liquify Settings V3 est\xE1n aqu\xED y los cambios se guardan al instante. Cierra el panel con el bot\xF3n de cerrar o haciendo clic fuera.", nextBtn: "Siguiente", gotItBtn: "Entendido" }
    },
    pt: {
      settingsTitle: "Configura\xE7\xF5es do Liquify",
      title: "Configura\xE7\xF5es do Liquify",
      close: "Fechar",
      chooseFile: "Escolher arquivo",
      enterUrl: "Digite a URL da imagem...",
      resetAllSettings: "Redefinir todas as configura\xE7\xF5es",
      searchPlaceholder: "Pesquisar configura\xE7\xF5es...",
      accentColor: "Tema de cor:",
      accentSource: "Fonte da cor:",
      accentSatBoost: "Aumento de satura\xE7\xE3o:",
      accentLightBoost: "Aumento de brilho:",
      background: "Fundo:",
      backgroundBlur: "Desfoque do fundo (px):",
      animatedBackground: "Fundo animado:",
      backgroundBrightness: "Brilho do fundo (%):",
      apbackground: "Fundo da p\xE1gina do artista:",
      artistScrollBlur: "Desfoque do artista ao rolar (px):",
      artistScrollBrightness: "Brilho do artista ao rolar (%):",
      playerWidth: "Largura do player:",
      playerCustomWidth: "Largura do player (%):",
      playerCustomHeight: "Altura do player (px):",
      playerRadius: "Raio do player (px):",
      playbarCoverBorderRadius: "Raio da capa (px):",
      transparentPlayer: "Player transparente:",
      floatingPlayer: "Player flutuante:",
      connectBar: "Mostrar barra Connect:",
      compactPlayer: "Player compacto:",
      playerControlIcons: "Usar novos \xEDcones do player:",
      progressBarHeight: "Altura de progresso e volume (px):",
      progressBarRadius: "Raio de progresso e volume (px):",
      progressBarCompat: "Modo de compatibilidade:",
      playlistHeaderBox: "Caixa do cabe\xE7alho da playlist:",
      actionBarBox: "Caixa da barra de a\xE7\xF5es:",
      lyricsMode: "Tradu\xE7\xE3o/Romaniza\xE7\xE3o das letras:",
      themedLyrics: "Letras com tema:",
      lyricsFontSize: "Tamanho da fonte das letras (px):",
      lyricsMargin: "Margem das letras (px):",
      transparentWidth: "Largura dos controles da janela (px):",
      transparentHeight: "Altura dos controles da janela (px):",
      aria: { scrollSectionsLeft: "Rolar se\xE7\xF5es para a esquerda", scrollSectionsRight: "Rolar se\xE7\xF5es para a direita", help: "Ajuda" },
      sections: { accent: "Cores", background: "Fundo", artist: "Artista", ui: "UI", player: "Player", nextSongCard: "Pr\xF3xima m\xFAsica", canvasCoverArt: "Canvas Cover Art", playlist: "Playlist", lyrics: "Letras", transparent: "Controles da janela", config: "Config" },
      subSections: { performanceGlass: "Performance e Glass", animations: "Anima\xE7\xF5es", homescreen: "In\xEDcio", borderRadius: "Bordas arredondadas", sizeShape: "Tamanho e forma", progressVolume: "Progresso e volume", coverArt: "Capa", modes: "Modos", styling: "Estilo", translation: "Tradu\xE7\xE3o" },
      config: { hint: "Copie sua configura\xE7\xE3o atual do Liquify para backup ou compartilhamento, ou cole uma e aplique. Imagens de fundo personalizadas n\xE3o s\xE3o inclu\xEDdas.", copy: "Copiar", reload: "Carregar atual", apply: "Colar e aplicar", copied: "Copiado para a \xE1rea de transfer\xEAncia.", copyFailed: "N\xE3o foi poss\xEDvel copiar - selecione o texto e copie manualmente.", invalid: "Configura\xE7\xE3o inv\xE1lida." },
      dropdown: { default: "Padr\xE3o", custom: "Personalizado", dynamic: "Din\xE2mico", animated: "Animado", playlist: "Playlist", theme: "Tema", none: "Nenhum", show: "Mostrar", hide: "Ocultar", on: "Ligado", off: "Desligado", url: "URL", backgroundSource: "Fundo", songCover: "Capa da m\xFAsica" },
      ui: { performanceMode: "Modo performance:", popupBounce: "Rebote dos popups:", newHomescreenLayout: "Usar novo layout da tela inicial:", glassBlur: "Desfoque Glass (px):", backdropBlur: "Desfoque do fundo (px):", leftSidebarRadius: "Raio da barra lateral esquerda (px):", mainViewRadius: "Raio da \xE1rea principal (px):", rightSidebarRadius: "Raio da barra lateral direita (px):" },
      canvasCoverArt: { mode: "Capa no nome da faixa:", off: "Desligado", trackInfo: "Ao lado das informa\xE7\xF5es", outsideTrackInfo: "Fora das informa\xE7\xF5es", overCanvas: "Sobre o Canvas", showAlways: "Sempre mostrar:", yes: "Sim", no: "N\xE3o", blur: "Desfoque (px):" },
      comfyCoverArt: { enabled: "Comfy Cover Art:", width: "Largura (px):", height: "Altura (px):", marginBottom: "Margem inferior (px):", marginLeft: "Margem esquerda (px):" },
      nextSongCard: { show: "Mostrar cart\xE3o da pr\xF3xima m\xFAsica:", position: "Posi\xE7\xE3o horizontal", cardHeight: "Altura do cart\xE3o (px):", cardMaxWidth: "Largura m\xE1x. do cart\xE3o (px):", gap: "Espa\xE7o entre imagem e texto (px):", coverSize: "Tamanho da capa (px):", hPad: "Preenchimento horizontal (px):", vPad: "Preenchimento vertical (px):", gapToPlayer: "Dist\xE2ncia at\xE9 o player (px):", borderRadius: "Raio da borda (px):", coverBorderRadius: "Raio da capa (px):", left: "Esquerda", right: "Direita" },
      lyricsOptions: { off: "Desligado", translation: "Somente tradu\xE7\xE3o", romanization: "Somente romaniza\xE7\xE3o", both: "Tradu\xE7\xE3o + romaniza\xE7\xE3o" },
      tooltips: {
        accentColor: "Padr\xE3o usa o verde do Spotify, Personalizado usa uma cor fixa, Din\xE2mico adapta o acento \xE0 capa atual.",
        accentSource: "De onde v\xEAm as cores din\xE2micas: do fundo atual (playlist, sua imagem ou URL) ou sempre da capa da m\xFAsica.",
        accentSatBoost: "Quanto intensificar as cores tiradas da capa (somente modo Din\xE2mico).",
        accentLightBoost: "Quanto clarear o acento tirado da capa (somente modo Din\xE2mico).",
        background: "Din\xE2mico = capa atual desfocada, Animado = gradiente em movimento, Playlist = imagem da playlist, Personalizado = sua imagem, URL = link de imagem.",
        animatedBackground: "Anima suavemente o fundo personalizado, de URL ou de playlist.",
        artistBackground: "O que mostrar atr\xE1s das p\xE1ginas de artista: padr\xE3o do tema, nada, sua imagem ou URL.",
        artistScrollBlur: "Desfoque da imagem do cabe\xE7alho do artista ao rolar para baixo.",
        artistScrollBrightness: "Brilho da imagem do cabe\xE7alho do artista ao rolar para baixo.",
        performanceMode: "Desliga a refra\xE7\xE3o SVG Liquid Glass e usa um desfoque simples - mais leve para a GPU.",
        glassBlur: "For\xE7a do desfoque atr\xE1s das superf\xEDcies Liquid Glass.",
        popupBounce: "Anima\xE7\xE3o el\xE1stica ao abrir popups e menus.",
        newHomescreenLayout: "Coloca se\xE7\xF5es da tela inicial em cart\xF5es glass e ajusta as alturas da grade.",
        playerWidth: "Padr\xE3o = largura do Spotify, Tema = largura do Liquify, Personalizado = ajuste abaixo.",
        comfyCoverArt: "Aumenta a capa em reprodu\xE7\xE3o no canto inferior esquerdo para um visual mais confort\xE1vel.",
        floatingPlayer: "Solta a barra de reprodu\xE7\xE3o e a faz flutuar centralizada embaixo sobre o conte\xFAdo.",
        transparentPlayer: "Remove a refra\xE7\xE3o glass do player inferior para deix\xE1-lo transparente.",
        compactPlayer: "Encolhe a barra inferior para uma linha com controles e progresso lado a lado.",
        playerControlIcons: "Substitui os \xEDcones de reproduzir, pausar e pular do Spotify pelos \xEDcones de player pr\xF3prios do Liquify.",
        connectBar: "A barra que aparece quando a reprodu\xE7\xE3o est\xE1 em outro dispositivo via Spotify Connect.",
        nextSongCard: "Mostra um pequeno cart\xE3o de pr\xE9via da pr\xF3xima faixa.",
        canvasCoverArt: "Adiciona a capa na visualiza\xE7\xE3o Now Playing: ao lado das informa\xE7\xF5es, fora delas ou desligado.",
        canvasShowAlways: "Mant\xE9m a capa vis\xEDvel mesmo quando um Canvas/v\xEDdeo est\xE1 tocando.",
        playlistHeaderBox: "Envolve o cabe\xE7alho da playlist em uma caixa glass.",
        progressBarCompat: "Impede que o tema estilize as barras de progresso e volume, para que outra extens\xE3o possa control\xE1-las. Oculta as op\xE7\xF5es de altura e arredondamento acima.",
        actionBarBox: "Envolve a barra de a\xE7\xF5es da playlist (linha play/shuffle) em uma caixa glass.",
        themedLyrics: "Estiliza a p\xE1gina de letras para combinar com o tema (Glass + acento).",
        transparentWidth: "Largura da \xE1rea transparente de arrasto reservada para os bot\xF5es da janela (somente Windows).",
        transparentHeight: "Altura da \xE1rea transparente de arrasto reservada para os bot\xF5es da janela (somente Windows)."
      },
      onboarding: { welcomeTag: "Bem-vindo ao", step1Title: "Liquify Settings V3", step1Text: "Este bot\xE3o abre o Liquify Settings V3 para o Liquify Theme V2. Personalize fundos, cores de acento, player, anima\xE7\xF5es e muito mais em um s\xF3 lugar.", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics \xE9 a extens\xE3o oficial de letras do Liquify Theme V2. Ela completa o tema e \xE9 a \xFAnica extens\xE3o de letras oficialmente suportada. Instalar pelo Marketplace?", lyricsInstallBtn: "Instalar", lyricsSkipBtn: "Talvez depois", lyricsInstalling: "Instalando...", lyricsInstalled: "Instalado", lyricsRetryBtn: "Tentar novamente", lyricsFailed: "N\xE3o foi poss\xEDvel instalar automaticamente - procure Liquid Lyrics no Marketplace.", lyricsReloadNote: "O Liquify ser\xE1 recarregado quando voc\xEA terminar para carregar o Liquid Lyrics.", step2Title: "Explore suas configura\xE7\xF5es", step2Text: "Todas as op\xE7\xF5es do Liquify Settings V3 ficam aqui e as mudan\xE7as s\xE3o salvas instantaneamente. Feche o painel pelo bot\xE3o de fechar ou clicando fora.", nextBtn: "Pr\xF3ximo", gotItBtn: "Entendi" }
    },
    tr: {
      settingsTitle: "Liquify Ayarlar\u0131",
      title: "Liquify Ayarlar\u0131",
      close: "Kapat",
      chooseFile: "Dosya se\xE7",
      enterUrl: "G\xF6rsel URL'si gir...",
      resetAllSettings: "T\xFCm ayarlar\u0131 s\u0131f\u0131rla",
      searchPlaceholder: "Ayarlar\u0131 ara...",
      accentColor: "Renk temas\u0131:",
      accentSource: "Renk kayna\u011F\u0131:",
      accentSatBoost: "Doygunluk art\u0131rma:",
      accentLightBoost: "Parlakl\u0131k art\u0131rma:",
      background: "Arka plan:",
      backgroundBlur: "Arka plan bulan\u0131kl\u0131\u011F\u0131 (px):",
      animatedBackground: "Animasyonlu arka plan:",
      backgroundBrightness: "Arka plan parlakl\u0131\u011F\u0131 (%):",
      apbackground: "Sanat\xE7\u0131 sayfas\u0131 arka plan\u0131:",
      artistScrollBlur: "Sanat\xE7\u0131 kayd\u0131rma bulan\u0131kl\u0131\u011F\u0131 (px):",
      artistScrollBrightness: "Sanat\xE7\u0131 kayd\u0131rma parlakl\u0131\u011F\u0131 (%):",
      playerWidth: "Oynat\u0131c\u0131 geni\u015Fli\u011Fi:",
      playerCustomWidth: "Oynat\u0131c\u0131 geni\u015Fli\u011Fi (%):",
      playerCustomHeight: "Oynat\u0131c\u0131 y\xFCksekli\u011Fi (px):",
      playerRadius: "Oynat\u0131c\u0131 k\xF6\u015Fe yar\u0131\xE7ap\u0131 (px):",
      playbarCoverBorderRadius: "Kapak k\xF6\u015Fe yar\u0131\xE7ap\u0131 (px):",
      transparentPlayer: "\u015Eeffaf oynat\u0131c\u0131:",
      floatingPlayer: "Y\xFCzen oynat\u0131c\u0131:",
      connectBar: "Connect \xE7ubu\u011Funu g\xF6ster:",
      compactPlayer: "Kompakt oynat\u0131c\u0131:",
      playerControlIcons: "Yeni oynat\u0131c\u0131 simgelerini kullan:",
      progressBarHeight: "\u0130lerleme ve ses \xE7ubu\u011Fu y\xFCksekli\u011Fi (px):",
      progressBarRadius: "\u0130lerleme ve ses \xE7ubu\u011Fu yar\u0131\xE7ap\u0131 (px):",
      progressBarCompat: "Uyumluluk modu:",
      playlistHeaderBox: "Playlist ba\u015Fl\u0131k kutusu:",
      actionBarBox: "Eylem \xE7ubu\u011Fu kutusu:",
      lyricsMode: "\u015Eark\u0131 s\xF6z\xFC \xE7eviri/romanizasyon:",
      themedLyrics: "Temal\u0131 \u015Fark\u0131 s\xF6zleri:",
      lyricsFontSize: "\u015Eark\u0131 s\xF6z\xFC yaz\u0131 boyutu (px):",
      lyricsMargin: "\u015Eark\u0131 s\xF6z\xFC bo\u015Flu\u011Fu (px):",
      transparentWidth: "Pencere kontrolleri geni\u015Fli\u011Fi (px):",
      transparentHeight: "Pencere kontrolleri y\xFCksekli\u011Fi (px):",
      aria: { scrollSectionsLeft: "B\xF6l\xFCmleri sola kayd\u0131r", scrollSectionsRight: "B\xF6l\xFCmleri sa\u011Fa kayd\u0131r", help: "Yard\u0131m" },
      sections: { accent: "Renkler", background: "Arka plan", artist: "Sanat\xE7\u0131", ui: "UI", player: "Oynat\u0131c\u0131", nextSongCard: "Sonraki \u015Fark\u0131", canvasCoverArt: "Canvas Cover Art", playlist: "Playlist", lyrics: "\u015Eark\u0131 s\xF6zleri", transparent: "Pencere kontrolleri", config: "Config" },
      subSections: { performanceGlass: "Performans ve Glass", animations: "Animasyonlar", homescreen: "Ana ekran", borderRadius: "K\xF6\u015Fe yar\u0131\xE7ap\u0131", sizeShape: "Boyut ve \u015Fekil", progressVolume: "\u0130lerleme ve ses", coverArt: "Kapak", modes: "Modlar", styling: "Stil", translation: "\xC7eviri" },
      config: { hint: "Mevcut Liquify yap\u0131land\u0131rman\u0131 yedeklemek veya payla\u015Fmak i\xE7in kopyala ya da bir yap\u0131land\u0131rma yap\u0131\u015Ft\u0131r\u0131p uygula. \xD6zel arka plan g\xF6rselleri dahil de\u011Fildir.", copy: "Kopyala", reload: "Mevcut olan\u0131 y\xFCkle", apply: "Yap\u0131\u015Ft\u0131r ve uygula", copied: "Panoya kopyaland\u0131.", copyFailed: "Kopyalanamad\u0131 - metni se\xE7ip elle kopyala.", invalid: "Ge\xE7ersiz yap\u0131land\u0131rma." },
      dropdown: { default: "Varsay\u0131lan", custom: "\xD6zel", dynamic: "Dinamik", animated: "Animasyonlu", playlist: "Playlist", theme: "Tema", none: "Yok", show: "G\xF6ster", hide: "Gizle", on: "A\xE7\u0131k", off: "Kapal\u0131", url: "URL", backgroundSource: "Arka plan", songCover: "\u015Eark\u0131 kapa\u011F\u0131" },
      ui: { performanceMode: "Performans modu:", popupBounce: "Popup s\u0131\xE7ramas\u0131:", newHomescreenLayout: "Yeni ana ekran d\xFCzenini kullan:", glassBlur: "Glass bulan\u0131kl\u0131\u011F\u0131 (px):", backdropBlur: "Arka plan bulan\u0131kl\u0131\u011F\u0131 (px):", leftSidebarRadius: "Sol kenar \xE7ubu\u011Fu yar\u0131\xE7ap\u0131 (px):", mainViewRadius: "Ana g\xF6r\xFCn\xFCm yar\u0131\xE7ap\u0131 (px):", rightSidebarRadius: "Sa\u011F kenar \xE7ubu\u011Fu yar\u0131\xE7ap\u0131 (px):" },
      canvasCoverArt: { mode: "Par\xE7a ad\u0131 kapak g\xF6rseli:", off: "Kapal\u0131", trackInfo: "Par\xE7a bilgisi yan\u0131nda", outsideTrackInfo: "Par\xE7a bilgisi d\u0131\u015F\u0131nda", overCanvas: "Canvas \xFCst\xFCnde", showAlways: "Her zaman g\xF6ster:", yes: "Evet", no: "Hay\u0131r", blur: "Bulan\u0131kl\u0131k (px):" },
      comfyCoverArt: { enabled: "Comfy Cover Art:", width: "Geni\u015Flik (px):", height: "Y\xFCkseklik (px):", marginBottom: "Alt bo\u015Fluk (px):", marginLeft: "Sol bo\u015Fluk (px):" },
      nextSongCard: { show: "Sonraki \u015Fark\u0131 kart\u0131n\u0131 g\xF6ster:", position: "Yatay konum", cardHeight: "Kart y\xFCksekli\u011Fi (px):", cardMaxWidth: "Maks. kart geni\u015Fli\u011Fi (px):", gap: "G\xF6rsel ve metin aras\u0131 bo\u015Fluk (px):", coverSize: "Kapak boyutu (px):", hPad: "Yatay i\xE7 bo\u015Fluk (px):", vPad: "Dikey i\xE7 bo\u015Fluk (px):", gapToPlayer: "Oynat\u0131c\u0131ya uzakl\u0131k (px):", borderRadius: "K\xF6\u015Fe yar\u0131\xE7ap\u0131 (px):", coverBorderRadius: "Kapak yar\u0131\xE7ap\u0131 (px):", left: "Sol", right: "Sa\u011F" },
      lyricsOptions: { off: "Kapal\u0131", translation: "Yaln\u0131zca \xE7eviri", romanization: "Yaln\u0131zca romanizasyon", both: "\xC7eviri + romanizasyon" },
      tooltips: {
        accentColor: "Varsay\u0131lan Spotify ye\u015Filini kullan\u0131r, \xD6zel sabit bir renk se\xE7er, Dinamik mevcut kapa\u011Fa g\xF6re uyarlan\u0131r.",
        accentSource: "Dinamik renklerin nereden al\u0131naca\u011F\u0131: mevcut arka plandan (playlist, kendi resmin veya URL) ya da her zaman \u015Fark\u0131 kapa\u011F\u0131ndan.",
        accentSatBoost: "Kapaktan al\u0131nan renklerin ne kadar g\xFC\xE7lendirilece\u011Fi (yaln\u0131zca Dinamik mod).",
        accentLightBoost: "Kapaktan al\u0131nan vurgu renginin ne kadar ayd\u0131nlat\u0131laca\u011F\u0131 (yaln\u0131zca Dinamik mod).",
        background: "Dinamik = bulan\u0131k mevcut kapak, Animasyonlu = hareketli gradyan, Playlist = playlist g\xF6rseli, \xD6zel = kendi g\xF6rselin, URL = g\xF6rsel ba\u011Flant\u0131s\u0131.",
        animatedBackground: "\xD6zel, URL veya playlist arka plan\u0131n\u0131 hafif\xE7e animasyonland\u0131r\u0131r.",
        artistBackground: "Sanat\xE7\u0131 sayfalar\u0131n\u0131n arkas\u0131nda ne g\xF6sterilece\u011Fi: tema varsay\u0131lan\u0131, hi\xE7bir \u015Fey, kendi g\xF6rselin veya URL.",
        artistScrollBlur: "A\u015Fa\u011F\u0131 kayd\u0131r\u0131rken sanat\xE7\u0131 ba\u015Fl\u0131k g\xF6rselinin bulan\u0131kl\u0131\u011F\u0131.",
        artistScrollBrightness: "A\u015Fa\u011F\u0131 kayd\u0131r\u0131rken sanat\xE7\u0131 ba\u015Fl\u0131k g\xF6rselinin parlakl\u0131\u011F\u0131.",
        performanceMode: "SVG Liquid Glass k\u0131r\u0131lmas\u0131n\u0131 kapat\u0131p d\xFCz bulan\u0131kl\u0131k kullan\u0131r - GPU i\xE7in daha hafiftir.",
        glassBlur: "Liquid Glass y\xFCzeylerinin arkas\u0131ndaki arka plan bulan\u0131kl\u0131\u011F\u0131 g\xFCc\xFC.",
        popupBounce: "Popup ve men\xFCler a\xE7\u0131l\u0131rken yayl\u0131 animasyon.",
        newHomescreenLayout: "Ana ekran b\xF6l\xFCmlerini glass kartlara koyar ve kart \u0131zgara y\xFCksekliklerini d\xFCzenler.",
        playerWidth: "Varsay\u0131lan = Spotify geni\u015Fli\u011Fi, Tema = Liquify geni\u015Fli\u011Fi, \xD6zel = a\u015Fa\u011F\u0131dan ayarla.",
        comfyCoverArt: "Daha rahat bir g\xF6r\xFCn\xFCm i\xE7in sol alttaki \xE7alan kapak g\xF6rselini b\xFCy\xFCt\xFCr.",
        floatingPlayer: "Oynatma \xE7ubu\u011Funu ay\u0131r\u0131p i\xE7eri\u011Fin \xFCzerinde altta ortalanm\u0131\u015F \u015Fekilde y\xFCzd\xFCr\xFCr.",
        transparentPlayer: "Alt oynat\u0131c\u0131daki glass k\u0131r\u0131lmas\u0131n\u0131 kald\u0131rarak onu \u015Feffaf yapar.",
        compactPlayer: "Alt \xE7ubu\u011Fu kontroller ve ilerleme yan yana olacak \u015Fekilde tek sat\u0131ra k\xFC\xE7\xFClt\xFCr.",
        playerControlIcons: "Spotify'\u0131n oynat, duraklat ve atla simgelerini Liquify'\u0131n kendi medya oynat\u0131c\u0131 simgeleriyle de\u011Fi\u015Ftirir.",
        connectBar: "Spotify Connect ile ba\u015Fka bir cihazda \xE7alma oldu\u011Funda g\xF6r\xFCnen \xE7ubuk.",
        nextSongCard: "S\u0131radaki par\xE7an\u0131n k\xFC\xE7\xFCk bir \xF6nizleme kart\u0131n\u0131 g\xF6sterir.",
        canvasCoverArt: "Now Playing g\xF6r\xFCn\xFCm\xFCne kapak ekler: par\xE7a bilgisinin yan\u0131nda, d\u0131\u015F\u0131nda veya kapal\u0131.",
        canvasShowAlways: "Canvas/video oynarken bile kapa\u011F\u0131 g\xF6r\xFCn\xFCr tutar.",
        playlistHeaderBox: "Playlist ba\u015Fl\u0131\u011F\u0131n\u0131 glass kutuya sarar.",
        progressBarCompat: "Teman\u0131n ilerleme ve ses \xE7ubuklar\u0131n\u0131 bi\xE7imlendirmesini engeller, b\xF6ylece ba\u015Fka bir eklenti onlar\u0131 kontrol edebilir. Yukar\u0131daki y\xFCkseklik ve yuvarlakl\u0131k se\xE7eneklerini gizler.",
        actionBarBox: "Playlist eylem \xE7ubu\u011Funu (play/shuffle sat\u0131r\u0131) glass kutuya sarar.",
        themedLyrics: "\u015Eark\u0131 s\xF6z\xFC sayfas\u0131n\u0131 temaya uygun stillendirir (Glass + vurgu).",
        transparentWidth: "Pencere d\xFC\u011Fmeleri i\xE7in ayr\u0131lm\u0131\u015F \u015Feffaf s\xFCr\xFCkleme alan\u0131n\u0131n geni\u015Fli\u011Fi (yaln\u0131zca Windows).",
        transparentHeight: "Pencere d\xFC\u011Fmeleri i\xE7in ayr\u0131lm\u0131\u015F \u015Feffaf s\xFCr\xFCkleme alan\u0131n\u0131n y\xFCksekli\u011Fi (yaln\u0131zca Windows)."
      },
      onboarding: { welcomeTag: "Ho\u015F geldin", step1Title: "Liquify Settings V3", step1Text: "Bu d\xFC\u011Fme Liquify Theme V2 i\xE7in Liquify Settings V3 panelini a\xE7ar. Arka planlar\u0131, vurgu renklerini, oynat\u0131c\u0131y\u0131, animasyonlar\u0131 ve \xE7ok daha fazlas\u0131n\u0131 tek yerde \xF6zelle\u015Ftir.", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics, Liquify Theme V2 i\xE7in resmi \u015Fark\u0131 s\xF6z\xFC eklentisidir. Temay\u0131 tamamlar ve resmi olarak desteklenen tek \u015Fark\u0131 s\xF6z\xFC eklentisidir. Marketplace'ten kurulsun mu?", lyricsInstallBtn: "Kur", lyricsSkipBtn: "Belki sonra", lyricsInstalling: "Kuruluyor...", lyricsInstalled: "Kuruldu", lyricsRetryBtn: "Tekrar dene", lyricsFailed: "Otomatik kurulum ba\u015Far\u0131s\u0131z - Liquid Lyrics'i Marketplace'ten alabilirsin.", lyricsReloadNote: "Bitirdi\u011Finde Liquid Lyrics'i y\xFCklemek i\xE7in Liquify yeniden y\xFCklenecek.", step2Title: "Ayarlar\u0131n\u0131 ke\u015Ffet", step2Text: "T\xFCm Liquify Settings V3 se\xE7enekleri burada ve de\u011Fi\u015Fiklikler an\u0131nda kaydedilir. Paneli kapat d\xFC\u011Fmesiyle veya d\u0131\u015Far\u0131 t\u0131klayarak kapatabilirsin.", nextBtn: "\u0130leri", gotItBtn: "Anlad\u0131m" }
    }
  };
  liquifyTranslations.hi = deepMerge(settingsCopy, {
    settingsTitle: "Liquify \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
    title: "Liquify \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
    close: "\u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
    chooseFile: "\u092B\u093C\u093E\u0907\u0932 \u091A\u0941\u0928\u0947\u0902",
    enterUrl: "\u091B\u0935\u093F URL \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902...",
    resetAllSettings: "\u0938\u092D\u0940 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0930\u0940\u0938\u0947\u091F \u0915\u0930\u0947\u0902",
    searchPlaceholder: "\u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0916\u094B\u091C\u0947\u0902...",
    accentColor: "\u0930\u0902\u0917 \u0925\u0940\u092E:",
    accentSource: "\u0930\u0902\u0917 \u0938\u094D\u0930\u094B\u0924:",
    accentSatBoost: "\u0938\u0948\u091A\u0941\u0930\u0947\u0936\u0928 \u092C\u0942\u0938\u094D\u091F:",
    accentLightBoost: "\u092C\u094D\u0930\u093E\u0907\u091F\u0928\u0947\u0938 \u092C\u0942\u0938\u094D\u091F:",
    background: "\u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921:",
    backgroundBlur: "\u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u092C\u094D\u0932\u0930 (px):",
    animatedBackground: "\u090F\u0928\u093F\u092E\u0947\u091F\u0947\u0921 \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921:",
    backgroundBrightness: "\u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u092C\u094D\u0930\u093E\u0907\u091F\u0928\u0947\u0938 (%):",
    apbackground: "\u0906\u0930\u094D\u091F\u093F\u0938\u094D\u091F \u092A\u0947\u091C \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921:",
    artistScrollBlur: "\u0906\u0930\u094D\u091F\u093F\u0938\u094D\u091F \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u092C\u094D\u0932\u0930 (px):",
    artistScrollBrightness: "\u0906\u0930\u094D\u091F\u093F\u0938\u094D\u091F \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u092C\u094D\u0930\u093E\u0907\u091F\u0928\u0947\u0938 (%):",
    playerWidth: "\u092A\u094D\u0932\u0947\u092F\u0930 \u091A\u094C\u0921\u093C\u093E\u0908:",
    playerCustomWidth: "\u092A\u094D\u0932\u0947\u092F\u0930 \u091A\u094C\u0921\u093C\u093E\u0908 (%):",
    playerCustomHeight: "\u092A\u094D\u0932\u0947\u092F\u0930 \u090A\u0901\u091A\u093E\u0908 (px):",
    playerRadius: "\u092A\u094D\u0932\u0947\u092F\u0930 \u092C\u0949\u0930\u094D\u0921\u0930 \u0930\u0947\u0921\u093F\u092F\u0938 (px):",
    playbarCoverBorderRadius: "\u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u092C\u0949\u0930\u094D\u0921\u0930 \u0930\u0947\u0921\u093F\u092F\u0938 (px):",
    transparentPlayer: "\u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u092A\u094D\u0932\u0947\u092F\u0930:",
    floatingPlayer: "\u092B\u093C\u094D\u0932\u094B\u091F\u093F\u0902\u0917 \u092A\u094D\u0932\u0947\u092F\u0930:",
    connectBar: "Connect \u092C\u093E\u0930 \u0926\u093F\u0916\u093E\u090F\u0901:",
    compactPlayer: "\u0915\u0949\u092E\u094D\u092A\u0948\u0915\u094D\u091F \u092A\u094D\u0932\u0947\u092F\u0930:",
    playerControlIcons: "\u0928\u090F \u092A\u094D\u0932\u0947\u092F\u0930 \u0906\u0907\u0915\u0928 \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0947\u0902:",
    progressBarHeight: "\u092A\u094D\u0930\u094B\u0917\u094D\u0930\u0947\u0938 \u0914\u0930 \u0935\u0949\u0932\u094D\u092F\u0942\u092E \u092C\u093E\u0930 \u090A\u0901\u091A\u093E\u0908 (px):",
    progressBarRadius: "\u092A\u094D\u0930\u094B\u0917\u094D\u0930\u0947\u0938 \u0914\u0930 \u0935\u0949\u0932\u094D\u092F\u0942\u092E \u092C\u093E\u0930 \u0930\u0947\u0921\u093F\u092F\u0938 (px):",
    progressBarCompat: "\u0938\u0902\u0917\u0924\u0924\u093E \u092E\u094B\u0921:",
    playlistHeaderBox: "\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F \u0939\u0947\u0921\u0930 \u092C\u0949\u0915\u094D\u0938:",
    actionBarBox: "\u090F\u0915\u094D\u0936\u0928 \u092C\u093E\u0930 \u092C\u0949\u0915\u094D\u0938:",
    lyricsMode: "\u0917\u0940\u0924 \u0905\u0928\u0941\u0935\u093E\u0926/\u0930\u094B\u092E\u0928\u093E\u0907\u091C\u093C\u0947\u0936\u0928:",
    themedLyrics: "\u0925\u0940\u092E \u0935\u093E\u0932\u0947 \u0917\u0940\u0924:",
    lyricsFontSize: "\u0917\u0940\u0924 \u092B\u093C\u0949\u0928\u094D\u091F \u0906\u0915\u093E\u0930 (px):",
    lyricsMargin: "\u0917\u0940\u0924 \u092E\u093E\u0930\u094D\u091C\u093F\u0928 (px):",
    transparentWidth: "\u0935\u093F\u0902\u0921\u094B \u0915\u0902\u091F\u094D\u0930\u094B\u0932 \u091A\u094C\u0921\u093C\u093E\u0908 (px):",
    transparentHeight: "\u0935\u093F\u0902\u0921\u094B \u0915\u0902\u091F\u094D\u0930\u094B\u0932 \u090A\u0901\u091A\u093E\u0908 (px):",
    aria: { scrollSectionsLeft: "\u0938\u0947\u0915\u094D\u0936\u0928 \u092C\u093E\u090F\u0901 \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u0915\u0930\u0947\u0902", scrollSectionsRight: "\u0938\u0947\u0915\u094D\u0936\u0928 \u0926\u093E\u090F\u0901 \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u0915\u0930\u0947\u0902", help: "\u092E\u0926\u0926" },
    sections: { accent: "\u0930\u0902\u0917", background: "\u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921", artist: "\u0906\u0930\u094D\u091F\u093F\u0938\u094D\u091F", ui: "UI", player: "\u092A\u094D\u0932\u0947\u092F\u0930", nextSongCard: "\u0905\u0917\u0932\u093E \u0917\u0940\u0924", canvasCoverArt: "Canvas Cover Art", playlist: "\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F", lyrics: "\u0917\u0940\u0924", transparent: "\u0935\u093F\u0902\u0921\u094B \u0915\u0902\u091F\u094D\u0930\u094B\u0932", config: "\u0915\u0949\u0928\u094D\u092B\u093C\u093F\u0917" },
    subSections: { performanceGlass: "\u092A\u0930\u092B\u093C\u0949\u0930\u094D\u092E\u0947\u0902\u0938 \u0914\u0930 Glass", animations: "\u090F\u0928\u093F\u092E\u0947\u0936\u0928", homescreen: "\u0939\u094B\u092E\u0938\u094D\u0915\u094D\u0930\u0940\u0928", borderRadius: "\u092C\u0949\u0930\u094D\u0921\u0930 \u0930\u0947\u0921\u093F\u092F\u0938", sizeShape: "\u0906\u0915\u093E\u0930 \u0914\u0930 \u0930\u0942\u092A", progressVolume: "\u092A\u094D\u0930\u094B\u0917\u094D\u0930\u0947\u0938 \u0914\u0930 \u0935\u0949\u0932\u094D\u092F\u0942\u092E", coverArt: "\u0915\u0935\u0930 \u0906\u0930\u094D\u091F", modes: "\u092E\u094B\u0921", styling: "\u0938\u094D\u091F\u093E\u0907\u0932", translation: "\u0905\u0928\u0941\u0935\u093E\u0926" },
    config: { hint: "\u0905\u092A\u0928\u0940 \u0935\u0930\u094D\u0924\u092E\u093E\u0928 Liquify \u0915\u0949\u0928\u094D\u092B\u093C\u093F\u0917 \u0915\u094B \u092C\u0948\u0915\u0905\u092A \u092F\u093E \u0936\u0947\u092F\u0930 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0915\u0949\u092A\u0940 \u0915\u0930\u0947\u0902, \u092F\u093E \u0915\u094B\u0908 \u0915\u0949\u0928\u094D\u092B\u093C\u093F\u0917 \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0915\u0947 \u0932\u093E\u0917\u0942 \u0915\u0930\u0947\u0902\u0964 \u0915\u0938\u094D\u091F\u092E \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u091B\u0935\u093F\u092F\u093E\u0901 \u0936\u093E\u092E\u093F\u0932 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902\u0964", copy: "\u0915\u0949\u092A\u0940", reload: "\u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0932\u094B\u0921 \u0915\u0930\u0947\u0902", apply: "\u092A\u0947\u0938\u094D\u091F \u0914\u0930 \u0932\u093E\u0917\u0942 \u0915\u0930\u0947\u0902", copied: "\u0915\u094D\u0932\u093F\u092A\u092C\u094B\u0930\u094D\u0921 \u092E\u0947\u0902 \u0915\u0949\u092A\u0940 \u0915\u093F\u092F\u093E \u0917\u092F\u093E\u0964", copyFailed: "\u0915\u0949\u092A\u0940 \u0928\u0939\u0940\u0902 \u0939\u094B \u0938\u0915\u093E - \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u091A\u0941\u0928\u0915\u0930 \u092E\u0948\u0928\u094D\u092F\u0941\u0905\u0932\u0940 \u0915\u0949\u092A\u0940 \u0915\u0930\u0947\u0902\u0964", invalid: "\u0905\u092E\u093E\u0928\u094D\u092F \u0915\u0949\u0928\u094D\u092B\u093C\u093F\u0917\u0964" },
    dropdown: { default: "\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F", custom: "\u0915\u0938\u094D\u091F\u092E", dynamic: "\u0921\u093E\u092F\u0928\u093E\u092E\u093F\u0915", animated: "\u090F\u0928\u093F\u092E\u0947\u091F\u0947\u0921", playlist: "\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F", theme: "\u0925\u0940\u092E", none: "\u0915\u094B\u0908 \u0928\u0939\u0940\u0902", show: "\u0926\u093F\u0916\u093E\u090F\u0901", hide: "\u091B\u093F\u092A\u093E\u090F\u0901", on: "\u091A\u093E\u0932\u0942", off: "\u092C\u0902\u0926", url: "URL", backgroundSource: "\u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921", songCover: "\u0917\u0940\u0924 \u0915\u0935\u0930" },
    ui: { performanceMode: "\u092A\u0930\u092B\u093C\u0949\u0930\u094D\u092E\u0947\u0902\u0938 \u092E\u094B\u0921:", popupBounce: "\u092A\u0949\u092A\u0905\u092A \u092C\u093E\u0909\u0902\u0938:", newHomescreenLayout: "\u0928\u092F\u093E \u0939\u094B\u092E\u0938\u094D\u0915\u094D\u0930\u0940\u0928 \u0932\u0947\u0906\u0909\u091F \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0947\u0902:", glassBlur: "Glass \u092C\u094D\u0932\u0930 (px):", backdropBlur: "\u092C\u0948\u0915\u0921\u094D\u0930\u0949\u092A \u092C\u094D\u0932\u0930 (px):", leftSidebarRadius: "\u092C\u093E\u090F\u0901 \u0938\u093E\u0907\u0921\u092C\u093E\u0930 \u0930\u0947\u0921\u093F\u092F\u0938 (px):", mainViewRadius: "\u092E\u0941\u0916\u094D\u092F \u0926\u0943\u0936\u094D\u092F \u0930\u0947\u0921\u093F\u092F\u0938 (px):", rightSidebarRadius: "\u0926\u093E\u090F\u0901 \u0938\u093E\u0907\u0921\u092C\u093E\u0930 \u0930\u0947\u0921\u093F\u092F\u0938 (px):" },
    canvasCoverArt: { mode: "\u091F\u094D\u0930\u0948\u0915 \u0928\u093E\u092E \u0915\u0935\u0930 \u0906\u0930\u094D\u091F:", off: "\u092C\u0902\u0926", trackInfo: "\u091F\u094D\u0930\u0948\u0915 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0915\u0947 \u092A\u093E\u0938", outsideTrackInfo: "\u091F\u094D\u0930\u0948\u0915 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0915\u0947 \u092C\u093E\u0939\u0930", overCanvas: "Canvas \u0915\u0947 \u090A\u092A\u0930", showAlways: "\u0939\u092E\u0947\u0936\u093E \u0926\u093F\u0916\u093E\u090F\u0901:", yes: "\u0939\u093E\u0901", no: "\u0928\u0939\u0940\u0902", blur: "\u092C\u094D\u0932\u0930 (px):" },
    comfyCoverArt: { enabled: "Comfy Cover Art:", width: "\u091A\u094C\u0921\u093C\u093E\u0908 (px):", height: "\u090A\u0901\u091A\u093E\u0908 (px):", marginBottom: "\u0928\u0940\u091A\u0947 \u092E\u093E\u0930\u094D\u091C\u093F\u0928 (px):", marginLeft: "\u092C\u093E\u092F\u093E\u0901 \u092E\u093E\u0930\u094D\u091C\u093F\u0928 (px):" },
    nextSongCard: { show: "\u0905\u0917\u0932\u0947 \u0917\u0940\u0924 \u0915\u093E \u0915\u093E\u0930\u094D\u0921 \u0926\u093F\u0916\u093E\u090F\u0901:", position: "\u0915\u094D\u0937\u0948\u0924\u093F\u091C \u0938\u094D\u0925\u093F\u0924\u093F", cardHeight: "\u0915\u093E\u0930\u094D\u0921 \u090A\u0901\u091A\u093E\u0908 (px):", cardMaxWidth: "\u0905\u0927\u093F\u0915\u0924\u092E \u0915\u093E\u0930\u094D\u0921 \u091A\u094C\u0921\u093C\u093E\u0908 (px):", gap: "\u091B\u0935\u093F \u0914\u0930 \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u0915\u0947 \u092C\u0940\u091A \u0905\u0902\u0924\u0930 (px):", coverSize: "\u0915\u0935\u0930 \u0906\u0915\u093E\u0930 (px):", hPad: "\u0915\u094D\u0937\u0948\u0924\u093F\u091C \u092A\u0948\u0921\u093F\u0902\u0917 (px):", vPad: "\u090A\u0930\u094D\u0927\u094D\u0935\u093E\u0927\u0930 \u092A\u0948\u0921\u093F\u0902\u0917 (px):", gapToPlayer: "\u092A\u094D\u0932\u0947\u092F\u0930 \u0938\u0947 \u0926\u0942\u0930\u0940 (px):", borderRadius: "\u092C\u0949\u0930\u094D\u0921\u0930 \u0930\u0947\u0921\u093F\u092F\u0938 (px):", coverBorderRadius: "\u0915\u0935\u0930 \u0930\u0947\u0921\u093F\u092F\u0938 (px):", left: "\u092C\u093E\u090F\u0901", right: "\u0926\u093E\u090F\u0901" },
    lyricsOptions: { off: "\u092C\u0902\u0926", translation: "\u0915\u0947\u0935\u0932 \u0905\u0928\u0941\u0935\u093E\u0926", romanization: "\u0915\u0947\u0935\u0932 \u0930\u094B\u092E\u0928\u093E\u0907\u091C\u093C\u0947\u0936\u0928", both: "\u0905\u0928\u0941\u0935\u093E\u0926 + \u0930\u094B\u092E\u0928\u093E\u0907\u091C\u093C\u0947\u0936\u0928" },
    tooltips: translateTooltips("hi"),
    onboarding: { welcomeTag: "\u0938\u094D\u0935\u093E\u0917\u0924 \u0939\u0948", step1Title: "Liquify Settings V3", step1Text: "\u092F\u0939 \u092C\u091F\u0928 Liquify Theme V2 \u0915\u0947 \u0932\u093F\u090F Liquify Settings V3 \u092A\u0948\u0928\u0932 \u0916\u094B\u0932\u0924\u093E \u0939\u0948\u0964 \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921, \u090F\u0915\u094D\u0938\u0947\u0902\u091F \u0930\u0902\u0917, \u092A\u094D\u0932\u0947\u092F\u0930, \u090F\u0928\u093F\u092E\u0947\u0936\u0928 \u0914\u0930 \u092C\u0939\u0941\u0924 \u0915\u0941\u091B \u090F\u0915 \u0939\u0940 \u091C\u0917\u0939 \u092C\u0926\u0932\u0947\u0902\u0964", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics, Liquify Theme V2 \u0915\u0947 \u0932\u093F\u090F \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0917\u0940\u0924 \u090F\u0915\u094D\u0938\u091F\u0947\u0902\u0936\u0928 \u0939\u0948\u0964 \u092F\u0939 \u0925\u0940\u092E \u0915\u094B \u092A\u0942\u0930\u093E \u092E\u0939\u0938\u0942\u0938 \u0915\u0930\u093E\u0924\u093E \u0939\u0948 \u0914\u0930 \u092F\u0939\u0940 \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0930\u0942\u092A \u0938\u0947 \u0938\u092E\u0930\u094D\u0925\u093F\u0924 \u0917\u0940\u0924 \u090F\u0915\u094D\u0938\u091F\u0947\u0902\u0936\u0928 \u0939\u0948\u0964 Marketplace \u0938\u0947 \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u0930\u0947\u0902?", lyricsInstallBtn: "\u0907\u0902\u0938\u094D\u091F\u0949\u0932", lyricsSkipBtn: "\u0936\u093E\u092F\u0926 \u092C\u093E\u0926 \u092E\u0947\u0902", lyricsInstalling: "\u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0939\u094B \u0930\u0939\u093E \u0939\u0948...", lyricsInstalled: "\u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0939\u0941\u0906", lyricsRetryBtn: "\u092B\u093F\u0930 \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902", lyricsFailed: "\u0905\u092A\u0928\u0947 \u0906\u092A \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0928\u0939\u0940\u0902 \u0939\u094B \u0938\u0915\u093E - Marketplace \u0938\u0947 Liquid Lyrics \u0932\u0947 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964", lyricsReloadNote: "\u092A\u0942\u0930\u093E \u0939\u094B\u0928\u0947 \u092A\u0930 Liquid Lyrics \u0932\u094B\u0921 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F Liquify \u0930\u0940\u0932\u094B\u0921 \u0939\u094B\u0917\u093E\u0964", step2Title: "\u0905\u092A\u0928\u0940 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0926\u0947\u0916\u0947\u0902", step2Text: "Liquify Settings V3 \u0915\u0947 \u0938\u092D\u0940 \u0935\u093F\u0915\u0932\u094D\u092A \u092F\u0939\u093E\u0901 \u0939\u0948\u0902 \u0914\u0930 \u092C\u0926\u0932\u093E\u0935 \u0924\u0941\u0930\u0902\u0924 \u0938\u0947\u0935 \u0939\u094B\u0924\u0947 \u0939\u0948\u0902\u0964 \u092A\u0948\u0928\u0932 \u0915\u094B \u092C\u0902\u0926 \u092C\u091F\u0928 \u092F\u093E \u092C\u093E\u0939\u0930 \u0915\u094D\u0932\u093F\u0915 \u0915\u0930\u0915\u0947 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902\u0964", nextBtn: "\u0906\u0917\u0947", gotItBtn: "\u0938\u092E\u091D \u0917\u092F\u093E" }
  });
  liquifyTranslations.sv = deepMerge(settingsCopy, {
    settingsTitle: "Liquify-inst\xE4llningar",
    title: "Liquify-inst\xE4llningar",
    close: "St\xE4ng",
    chooseFile: "V\xE4lj fil",
    enterUrl: "Ange bild-URL...",
    resetAllSettings: "\xC5terst\xE4ll alla inst\xE4llningar",
    searchPlaceholder: "S\xF6k inst\xE4llningar...",
    accentColor: "F\xE4rgtema:",
    accentSource: "F\xE4rgk\xE4lla:",
    accentSatBoost: "M\xE4ttnadsboost:",
    accentLightBoost: "Ljusstyrkeboost:",
    background: "Bakgrund:",
    backgroundBlur: "Bakgrundsosk\xE4rpa (px):",
    animatedBackground: "Animerad bakgrund:",
    backgroundBrightness: "Bakgrundsljusstyrka (%):",
    apbackground: "Artistbakgrund:",
    artistScrollBlur: "Artist-scrollosk\xE4rpa (px):",
    artistScrollBrightness: "Artist-scrollljusstyrka (%):",
    playerWidth: "Spelarbredd:",
    playerCustomWidth: "Spelarbredd (%):",
    playerCustomHeight: "Spelarh\xF6jd (px):",
    playerRadius: "Spelarens h\xF6rnradie (px):",
    playbarCoverBorderRadius: "Omslagets h\xF6rnradie (px):",
    transparentPlayer: "Transparent spelare:",
    floatingPlayer: "Flytande spelare:",
    connectBar: "Visa Connect-f\xE4lt:",
    compactPlayer: "Kompakt spelare:",
    playerControlIcons: "Anv\xE4nd nya spelarikoner:",
    progressBarHeight: "H\xF6jd f\xF6r progress och volym (px):",
    progressBarRadius: "Radie f\xF6r progress och volym (px):",
    progressBarCompat: "Kompatibilitetsl\xE4ge:",
    playlistHeaderBox: "Playlist-headerbox:",
    actionBarBox: "\xC5tg\xE4rdsf\xE4ltsbox:",
    lyricsMode: "Text\xF6vers\xE4ttning/Romanisering:",
    themedLyrics: "Tematiserade l\xE5ttexter:",
    lyricsFontSize: "Textstorlek f\xF6r l\xE5ttexter (px):",
    lyricsMargin: "Marginal f\xF6r l\xE5ttexter (px):",
    transparentWidth: "F\xF6nsterkontrollers bredd (px):",
    transparentHeight: "F\xF6nsterkontrollers h\xF6jd (px):",
    aria: { scrollSectionsLeft: "Bl\xE4ddra sektioner \xE5t v\xE4nster", scrollSectionsRight: "Bl\xE4ddra sektioner \xE5t h\xF6ger", help: "Hj\xE4lp" },
    sections: { accent: "F\xE4rger", background: "Bakgrund", artist: "Artist", ui: "UI", player: "Spelare", nextSongCard: "N\xE4sta l\xE5t", canvasCoverArt: "Canvas Cover Art", playlist: "Playlist", lyrics: "L\xE5ttexter", transparent: "F\xF6nsterkontroller", config: "Konfig" },
    subSections: { performanceGlass: "Prestanda och Glass", animations: "Animationer", homescreen: "Hemsk\xE4rm", borderRadius: "H\xF6rnradie", sizeShape: "Storlek och form", progressVolume: "Progress och volym", coverArt: "Omslag", modes: "L\xE4gen", styling: "Stil", translation: "\xD6vers\xE4ttning" },
    config: { hint: "Kopiera din nuvarande Liquify-konfiguration f\xF6r backup eller delning, eller klistra in en och anv\xE4nd den. Egna bakgrundsbilder ing\xE5r inte.", copy: "Kopiera", reload: "Ladda aktuell", apply: "Klistra in och anv\xE4nd", copied: "Kopierat till urklipp.", copyFailed: "Kunde inte kopiera - markera texten och kopiera manuellt.", invalid: "Ogiltig konfiguration." },
    dropdown: { default: "Standard", custom: "Anpassad", dynamic: "Dynamisk", animated: "Animerad", playlist: "Playlist", theme: "Tema", none: "Ingen", show: "Visa", hide: "D\xF6lj", on: "P\xE5", off: "Av", url: "URL", backgroundSource: "Bakgrund", songCover: "L\xE5tomslag" },
    ui: { performanceMode: "Prestandal\xE4ge:", popupBounce: "Popup-studs:", newHomescreenLayout: "Anv\xE4nd ny hemsk\xE4rmslayout:", glassBlur: "Glass-osk\xE4rpa (px):", backdropBlur: "Bakgrundsosk\xE4rpa (px):", leftSidebarRadius: "V\xE4nster sidopanelradie (px):", mainViewRadius: "Huvudvyns radie (px):", rightSidebarRadius: "H\xF6ger sidopanelradie (px):" },
    canvasCoverArt: { mode: "Omslag vid sp\xE5rnamn:", off: "Av", trackInfo: "Bredvid sp\xE5rinfo", outsideTrackInfo: "Utanf\xF6r sp\xE5rinfo", overCanvas: "\xD6ver Canvas", showAlways: "Visa alltid:", yes: "Ja", no: "Nej", blur: "Osk\xE4rpa (px):" },
    comfyCoverArt: { enabled: "Comfy Cover Art:", width: "Bredd (px):", height: "H\xF6jd (px):", marginBottom: "Nedre marginal (px):", marginLeft: "V\xE4nster marginal (px):" },
    nextSongCard: { show: "Visa kort f\xF6r n\xE4sta l\xE5t:", position: "Horisontell position", cardHeight: "Korth\xF6jd (px):", cardMaxWidth: "Max kortbredd (px):", gap: "Avst\xE5nd mellan bild och text (px):", coverSize: "Omslagsstorlek (px):", hPad: "Horisontell padding (px):", vPad: "Vertikal padding (px):", gapToPlayer: "Avst\xE5nd till spelare (px):", borderRadius: "H\xF6rnradie (px):", coverBorderRadius: "Omslagsradie (px):", left: "V\xE4nster", right: "H\xF6ger" },
    lyricsOptions: { off: "Av", translation: "Endast \xF6vers\xE4ttning", romanization: "Endast romanisering", both: "\xD6vers\xE4ttning + romanisering" },
    tooltips: translateTooltips("sv"),
    onboarding: { welcomeTag: "V\xE4lkommen till", step1Title: "Liquify Settings V3", step1Text: "Den h\xE4r knappen \xF6ppnar Liquify Settings V3 f\xF6r Liquify Theme V2. Anpassa bakgrunder, accentf\xE4rger, spelaren, animationer och mycket mer p\xE5 ett st\xE4lle.", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics \xE4r det officiella l\xE5ttexttill\xE4gget f\xF6r Liquify Theme V2. Det g\xF6r temat komplett och \xE4r det enda officiellt st\xF6dda l\xE5ttexttill\xE4gget. Installera fr\xE5n Marketplace?", lyricsInstallBtn: "Installera", lyricsSkipBtn: "Kanske senare", lyricsInstalling: "Installerar...", lyricsInstalled: "Installerat", lyricsRetryBtn: "F\xF6rs\xF6k igen", lyricsFailed: "Kunde inte installera automatiskt - h\xE4mta Liquid Lyrics fr\xE5n Marketplace.", lyricsReloadNote: "Liquify laddas om n\xE4r du \xE4r klar f\xF6r att ladda Liquid Lyrics.", step2Title: "Utforska dina inst\xE4llningar", step2Text: "Alla Liquify Settings V3-alternativ finns h\xE4r och \xE4ndringar sparas direkt. St\xE4ng panelen med st\xE4ngknappen eller genom att klicka utanf\xF6r.", nextBtn: "N\xE4sta", gotItBtn: "Jag f\xF6rst\xE5r" }
  });
  liquifyTranslations.ja = deepMerge(settingsCopy, {
    settingsTitle: "Liquify \u8A2D\u5B9A",
    title: "Liquify \u8A2D\u5B9A",
    close: "\u9589\u3058\u308B",
    chooseFile: "\u30D5\u30A1\u30A4\u30EB\u3092\u9078\u629E",
    enterUrl: "\u753B\u50CFURL\u3092\u5165\u529B...",
    resetAllSettings: "\u3059\u3079\u3066\u306E\u8A2D\u5B9A\u3092\u30EA\u30BB\u30C3\u30C8",
    searchPlaceholder: "\u8A2D\u5B9A\u3092\u691C\u7D22...",
    accentColor: "\u30AB\u30E9\u30FC\u30C6\u30FC\u30DE:",
    accentSource: "\u30AB\u30E9\u30FC\u30BD\u30FC\u30B9:",
    accentSatBoost: "\u5F69\u5EA6\u30D6\u30FC\u30B9\u30C8:",
    accentLightBoost: "\u660E\u308B\u3055\u30D6\u30FC\u30B9\u30C8:",
    background: "\u80CC\u666F:",
    backgroundBlur: "\u80CC\u666F\u307C\u304B\u3057 (px):",
    animatedBackground: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u80CC\u666F:",
    backgroundBrightness: "\u80CC\u666F\u306E\u660E\u308B\u3055 (%):",
    apbackground: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30DA\u30FC\u30B8\u80CC\u666F:",
    artistScrollBlur: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30B9\u30AF\u30ED\u30FC\u30EB\u307C\u304B\u3057 (px):",
    artistScrollBrightness: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30B9\u30AF\u30ED\u30FC\u30EB\u660E\u308B\u3055 (%):",
    playerWidth: "\u30D7\u30EC\u30FC\u30E4\u30FC\u5E45:",
    playerCustomWidth: "\u30D7\u30EC\u30FC\u30E4\u30FC\u5E45 (%):",
    playerCustomHeight: "\u30D7\u30EC\u30FC\u30E4\u30FC\u9AD8\u3055 (px):",
    playerRadius: "\u30D7\u30EC\u30FC\u30E4\u30FC\u89D2\u4E38 (px):",
    playbarCoverBorderRadius: "\u30AB\u30D0\u30FC\u89D2\u4E38 (px):",
    transparentPlayer: "\u900F\u660E\u30D7\u30EC\u30FC\u30E4\u30FC:",
    floatingPlayer: "\u30D5\u30ED\u30FC\u30C6\u30A3\u30F3\u30B0\u30D7\u30EC\u30FC\u30E4\u30FC:",
    connectBar: "Connect\u30D0\u30FC\u3092\u8868\u793A:",
    compactPlayer: "\u30B3\u30F3\u30D1\u30AF\u30C8\u30D7\u30EC\u30FC\u30E4\u30FC:",
    playerControlIcons: "\u65B0\u3057\u3044\u30D7\u30EC\u30FC\u30E4\u30FC\u30A2\u30A4\u30B3\u30F3\u3092\u4F7F\u7528:",
    progressBarHeight: "\u9032\u884C/\u97F3\u91CF\u30D0\u30FC\u9AD8\u3055 (px):",
    progressBarRadius: "\u9032\u884C/\u97F3\u91CF\u30D0\u30FC\u89D2\u4E38 (px):",
    progressBarCompat: "\u4E92\u63DB\u30E2\u30FC\u30C9:",
    playlistHeaderBox: "\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u30D8\u30C3\u30C0\u30FC\u30DC\u30C3\u30AF\u30B9:",
    actionBarBox: "\u30A2\u30AF\u30B7\u30E7\u30F3\u30D0\u30FC\u30DC\u30C3\u30AF\u30B9:",
    lyricsMode: "\u6B4C\u8A5E\u7FFB\u8A33/\u30ED\u30FC\u30DE\u5B57\u5316:",
    themedLyrics: "\u30C6\u30FC\u30DE\u4ED8\u304D\u6B4C\u8A5E:",
    lyricsFontSize: "\u6B4C\u8A5E\u30D5\u30A9\u30F3\u30C8\u30B5\u30A4\u30BA (px):",
    lyricsMargin: "\u6B4C\u8A5E\u30DE\u30FC\u30B8\u30F3 (px):",
    transparentWidth: "\u30A6\u30A3\u30F3\u30C9\u30A6\u64CD\u4F5C\u5E45 (px):",
    transparentHeight: "\u30A6\u30A3\u30F3\u30C9\u30A6\u64CD\u4F5C\u9AD8\u3055 (px):",
    aria: { scrollSectionsLeft: "\u30BB\u30AF\u30B7\u30E7\u30F3\u3092\u5DE6\u3078\u30B9\u30AF\u30ED\u30FC\u30EB", scrollSectionsRight: "\u30BB\u30AF\u30B7\u30E7\u30F3\u3092\u53F3\u3078\u30B9\u30AF\u30ED\u30FC\u30EB", help: "\u30D8\u30EB\u30D7" },
    sections: { accent: "\u8272", background: "\u80CC\u666F", artist: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8", ui: "UI", player: "\u30D7\u30EC\u30FC\u30E4\u30FC", nextSongCard: "\u6B21\u306E\u66F2", canvasCoverArt: "Canvas Cover Art", playlist: "\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8", lyrics: "\u6B4C\u8A5E", transparent: "\u30A6\u30A3\u30F3\u30C9\u30A6\u64CD\u4F5C", config: "\u8A2D\u5B9A\u30C7\u30FC\u30BF" },
    subSections: { performanceGlass: "\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u3068Glass", animations: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3", homescreen: "\u30DB\u30FC\u30E0\u753B\u9762", borderRadius: "\u89D2\u4E38", sizeShape: "\u30B5\u30A4\u30BA\u3068\u5F62\u72B6", progressVolume: "\u9032\u884C\u3068\u97F3\u91CF", coverArt: "\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8", modes: "\u30E2\u30FC\u30C9", styling: "\u30B9\u30BF\u30A4\u30EB", translation: "\u7FFB\u8A33" },
    config: { hint: "\u73FE\u5728\u306ELiquify\u8A2D\u5B9A\u3092\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u307E\u305F\u306F\u5171\u6709\u7528\u306B\u30B3\u30D4\u30FC\u3059\u308B\u304B\u3001\u8A2D\u5B9A\u3092\u8CBC\u308A\u4ED8\u3051\u3066\u9069\u7528\u3057\u307E\u3059\u3002\u30AB\u30B9\u30BF\u30E0\u80CC\u666F\u753B\u50CF\u306F\u542B\u307E\u308C\u307E\u305B\u3093\u3002", copy: "\u30B3\u30D4\u30FC", reload: "\u73FE\u5728\u3092\u8AAD\u307F\u8FBC\u307F", apply: "\u8CBC\u308A\u4ED8\u3051\u3066\u9069\u7528", copied: "\u30AF\u30EA\u30C3\u30D7\u30DC\u30FC\u30C9\u306B\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F\u3002", copyFailed: "\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F - \u30C6\u30AD\u30B9\u30C8\u3092\u9078\u629E\u3057\u3066\u624B\u52D5\u3067\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044\u3002", invalid: "\u7121\u52B9\u306A\u8A2D\u5B9A\u3067\u3059\u3002" },
    dropdown: { default: "\u30C7\u30D5\u30A9\u30EB\u30C8", custom: "\u30AB\u30B9\u30BF\u30E0", dynamic: "\u30C0\u30A4\u30CA\u30DF\u30C3\u30AF", animated: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3", playlist: "\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8", theme: "\u30C6\u30FC\u30DE", none: "\u306A\u3057", show: "\u8868\u793A", hide: "\u975E\u8868\u793A", on: "\u30AA\u30F3", off: "\u30AA\u30D5", url: "URL", backgroundSource: "\u80CC\u666F", songCover: "\u66F2\u306E\u30AB\u30D0\u30FC" },
    ui: { performanceMode: "\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u30E2\u30FC\u30C9:", popupBounce: "\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u30D0\u30A6\u30F3\u30B9:", newHomescreenLayout: "\u65B0\u3057\u3044\u30DB\u30FC\u30E0\u753B\u9762\u30EC\u30A4\u30A2\u30A6\u30C8\u3092\u4F7F\u7528:", glassBlur: "Glass\u307C\u304B\u3057 (px):", backdropBlur: "\u80CC\u666F\u307C\u304B\u3057 (px):", leftSidebarRadius: "\u5DE6\u30B5\u30A4\u30C9\u30D0\u30FC\u89D2\u4E38 (px):", mainViewRadius: "\u30E1\u30A4\u30F3\u30D3\u30E5\u30FC\u89D2\u4E38 (px):", rightSidebarRadius: "\u53F3\u30B5\u30A4\u30C9\u30D0\u30FC\u89D2\u4E38 (px):" },
    canvasCoverArt: { mode: "\u30C8\u30E9\u30C3\u30AF\u540D\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8:", off: "\u30AA\u30D5", trackInfo: "\u30C8\u30E9\u30C3\u30AF\u60C5\u5831\u306E\u6A2A", outsideTrackInfo: "\u30C8\u30E9\u30C3\u30AF\u60C5\u5831\u306E\u5916", overCanvas: "Canvas\u306E\u4E0A", showAlways: "\u5E38\u306B\u8868\u793A:", yes: "\u306F\u3044", no: "\u3044\u3044\u3048", blur: "\u307C\u304B\u3057 (px):" },
    comfyCoverArt: { enabled: "Comfy Cover Art:", width: "\u5E45 (px):", height: "\u9AD8\u3055 (px):", marginBottom: "\u4E0B\u30DE\u30FC\u30B8\u30F3 (px):", marginLeft: "\u5DE6\u30DE\u30FC\u30B8\u30F3 (px):" },
    nextSongCard: { show: "\u6B21\u306E\u66F2\u30AB\u30FC\u30C9\u3092\u8868\u793A:", position: "\u6C34\u5E73\u4F4D\u7F6E", cardHeight: "\u30AB\u30FC\u30C9\u9AD8\u3055 (px):", cardMaxWidth: "\u30AB\u30FC\u30C9\u6700\u5927\u5E45 (px):", gap: "\u753B\u50CF\u3068\u30C6\u30AD\u30B9\u30C8\u306E\u9593\u9694 (px):", coverSize: "\u30AB\u30D0\u30FC\u30B5\u30A4\u30BA (px):", hPad: "\u6C34\u5E73\u30D1\u30C7\u30A3\u30F3\u30B0 (px):", vPad: "\u5782\u76F4\u30D1\u30C7\u30A3\u30F3\u30B0 (px):", gapToPlayer: "\u30D7\u30EC\u30FC\u30E4\u30FC\u307E\u3067\u306E\u8DDD\u96E2 (px):", borderRadius: "\u89D2\u4E38 (px):", coverBorderRadius: "\u30AB\u30D0\u30FC\u89D2\u4E38 (px):", left: "\u5DE6", right: "\u53F3" },
    lyricsOptions: { off: "\u30AA\u30D5", translation: "\u7FFB\u8A33\u306E\u307F", romanization: "\u30ED\u30FC\u30DE\u5B57\u5316\u306E\u307F", both: "\u7FFB\u8A33 + \u30ED\u30FC\u30DE\u5B57\u5316" },
    tooltips: translateTooltips("ja"),
    onboarding: { welcomeTag: "\u3088\u3046\u3053\u305D", step1Title: "Liquify Settings V3", step1Text: "\u3053\u306E\u30DC\u30BF\u30F3\u3067Liquify Theme V2\u7528\u306ELiquify Settings V3\u30D1\u30CD\u30EB\u3092\u958B\u304D\u307E\u3059\u3002\u80CC\u666F\u3001\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC\u3001\u30D7\u30EC\u30FC\u30E4\u30FC\u3001\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u306A\u3069\u3092\u4E00\u304B\u6240\u3067\u30AB\u30B9\u30BF\u30DE\u30A4\u30BA\u3067\u304D\u307E\u3059\u3002", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics\u306FLiquify Theme V2\u516C\u5F0F\u306E\u6B4C\u8A5E\u62E1\u5F35\u6A5F\u80FD\u3067\u3059\u3002\u30C6\u30FC\u30DE\u3092\u5B8C\u6210\u3055\u305B\u308B\u3082\u306E\u3067\u3001\u516C\u5F0F\u306B\u30B5\u30DD\u30FC\u30C8\u3055\u308C\u308B\u552F\u4E00\u306E\u6B4C\u8A5E\u62E1\u5F35\u6A5F\u80FD\u3067\u3059\u3002Marketplace\u304B\u3089\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3057\u307E\u3059\u304B\uFF1F", lyricsInstallBtn: "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB", lyricsSkipBtn: "\u5F8C\u3067", lyricsInstalling: "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u4E2D...", lyricsInstalled: "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u6E08\u307F", lyricsRetryBtn: "\u518D\u8A66\u884C", lyricsFailed: "\u81EA\u52D5\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F - Marketplace\u3067Liquid Lyrics\u3092\u5165\u624B\u3067\u304D\u307E\u3059\u3002", lyricsReloadNote: "\u5B8C\u4E86\u5F8C\u3001Liquid Lyrics\u3092\u8AAD\u307F\u8FBC\u3080\u305F\u3081Liquify\u304C\u518D\u8AAD\u307F\u8FBC\u307F\u3055\u308C\u307E\u3059\u3002", step2Title: "\u8A2D\u5B9A\u3092\u898B\u3066\u307F\u3088\u3046", step2Text: "Liquify Settings V3\u306E\u3059\u3079\u3066\u306E\u30AA\u30D7\u30B7\u30E7\u30F3\u306F\u3053\u3053\u306B\u3042\u308A\u3001\u5909\u66F4\u306F\u3059\u3050\u4FDD\u5B58\u3055\u308C\u307E\u3059\u3002\u9589\u3058\u308B\u30DC\u30BF\u30F3\u307E\u305F\u306F\u5916\u5074\u30AF\u30EA\u30C3\u30AF\u3067\u9589\u3058\u3089\u308C\u307E\u3059\u3002", nextBtn: "\u6B21\u3078", gotItBtn: "\u4E86\u89E3" }
  });
  liquifyTranslations.zh = deepMerge(settingsCopy, {
    settingsTitle: "Liquify \u8BBE\u7F6E",
    title: "Liquify \u8BBE\u7F6E",
    close: "\u5173\u95ED",
    chooseFile: "\u9009\u62E9\u6587\u4EF6",
    enterUrl: "\u8F93\u5165\u56FE\u7247 URL...",
    resetAllSettings: "\u91CD\u7F6E\u6240\u6709\u8BBE\u7F6E",
    searchPlaceholder: "\u641C\u7D22\u8BBE\u7F6E...",
    accentColor: "\u989C\u8272\u4E3B\u9898:",
    accentSource: "\u989C\u8272\u6765\u6E90:",
    accentSatBoost: "\u9971\u548C\u5EA6\u589E\u5F3A:",
    accentLightBoost: "\u4EAE\u5EA6\u589E\u5F3A:",
    background: "\u80CC\u666F:",
    backgroundBlur: "\u80CC\u666F\u6A21\u7CCA (px):",
    animatedBackground: "\u52A8\u6001\u80CC\u666F:",
    backgroundBrightness: "\u80CC\u666F\u4EAE\u5EA6 (%):",
    apbackground: "\u827A\u672F\u5BB6\u9875\u9762\u80CC\u666F:",
    artistScrollBlur: "\u827A\u672F\u5BB6\u6EDA\u52A8\u6A21\u7CCA (px):",
    artistScrollBrightness: "\u827A\u672F\u5BB6\u6EDA\u52A8\u4EAE\u5EA6 (%):",
    playerWidth: "\u64AD\u653E\u5668\u5BBD\u5EA6:",
    playerCustomWidth: "\u64AD\u653E\u5668\u5BBD\u5EA6 (%):",
    playerCustomHeight: "\u64AD\u653E\u5668\u9AD8\u5EA6 (px):",
    playerRadius: "\u64AD\u653E\u5668\u5706\u89D2 (px):",
    playbarCoverBorderRadius: "\u5C01\u9762\u5706\u89D2 (px):",
    transparentPlayer: "\u900F\u660E\u64AD\u653E\u5668:",
    floatingPlayer: "\u6D6E\u52A8\u64AD\u653E\u5668:",
    connectBar: "\u663E\u793A Connect \u680F:",
    compactPlayer: "\u7D27\u51D1\u64AD\u653E\u5668:",
    playerControlIcons: "\u4F7F\u7528\u65B0\u7684\u64AD\u653E\u5668\u56FE\u6807:",
    progressBarHeight: "\u8FDB\u5EA6\u548C\u97F3\u91CF\u6761\u9AD8\u5EA6 (px):",
    progressBarRadius: "\u8FDB\u5EA6\u548C\u97F3\u91CF\u6761\u5706\u89D2 (px):",
    progressBarCompat: "\u517C\u5BB9\u6A21\u5F0F:",
    playlistHeaderBox: "\u64AD\u653E\u5217\u8868\u6807\u9898\u6846:",
    actionBarBox: "\u64CD\u4F5C\u680F\u6846:",
    lyricsMode: "\u6B4C\u8BCD\u7FFB\u8BD1/\u7F57\u9A6C\u5316:",
    themedLyrics: "\u4E3B\u9898\u6B4C\u8BCD:",
    lyricsFontSize: "\u6B4C\u8BCD\u5B57\u53F7 (px):",
    lyricsMargin: "\u6B4C\u8BCD\u8FB9\u8DDD (px):",
    transparentWidth: "\u7A97\u53E3\u63A7\u4EF6\u5BBD\u5EA6 (px):",
    transparentHeight: "\u7A97\u53E3\u63A7\u4EF6\u9AD8\u5EA6 (px):",
    aria: { scrollSectionsLeft: "\u5411\u5DE6\u6EDA\u52A8\u5206\u533A", scrollSectionsRight: "\u5411\u53F3\u6EDA\u52A8\u5206\u533A", help: "\u5E2E\u52A9" },
    sections: { accent: "\u989C\u8272", background: "\u80CC\u666F", artist: "\u827A\u672F\u5BB6", ui: "UI", player: "\u64AD\u653E\u5668", nextSongCard: "\u4E0B\u4E00\u9996\u6B4C", canvasCoverArt: "Canvas Cover Art", playlist: "\u64AD\u653E\u5217\u8868", lyrics: "\u6B4C\u8BCD", transparent: "\u7A97\u53E3\u63A7\u4EF6", config: "\u914D\u7F6E" },
    subSections: { performanceGlass: "\u6027\u80FD\u4E0E Glass", animations: "\u52A8\u753B", homescreen: "\u4E3B\u9875", borderRadius: "\u5706\u89D2", sizeShape: "\u5927\u5C0F\u4E0E\u5F62\u72B6", progressVolume: "\u8FDB\u5EA6\u4E0E\u97F3\u91CF", coverArt: "\u5C01\u9762", modes: "\u6A21\u5F0F", styling: "\u6837\u5F0F", translation: "\u7FFB\u8BD1" },
    config: { hint: "\u590D\u5236\u5F53\u524D Liquify \u914D\u7F6E\u4EE5\u5907\u4EFD\u6216\u5206\u4EAB\uFF0C\u6216\u7C98\u8D34\u914D\u7F6E\u5E76\u5E94\u7528\u3002\u81EA\u5B9A\u4E49\u80CC\u666F\u56FE\u7247\u4E0D\u4F1A\u5305\u542B\u5728\u5185\u3002", copy: "\u590D\u5236", reload: "\u52A0\u8F7D\u5F53\u524D", apply: "\u7C98\u8D34\u5E76\u5E94\u7528", copied: "\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\u3002", copyFailed: "\u65E0\u6CD5\u590D\u5236 - \u8BF7\u9009\u4E2D\u6587\u672C\u540E\u624B\u52A8\u590D\u5236\u3002", invalid: "\u914D\u7F6E\u65E0\u6548\u3002" },
    dropdown: { default: "\u9ED8\u8BA4", custom: "\u81EA\u5B9A\u4E49", dynamic: "\u52A8\u6001", animated: "\u52A8\u753B", playlist: "\u64AD\u653E\u5217\u8868", theme: "\u4E3B\u9898", none: "\u65E0", show: "\u663E\u793A", hide: "\u9690\u85CF", on: "\u5F00", off: "\u5173", url: "URL", backgroundSource: "\u80CC\u666F", songCover: "\u6B4C\u66F2\u5C01\u9762" },
    ui: { performanceMode: "\u6027\u80FD\u6A21\u5F0F:", popupBounce: "\u5F39\u7A97\u5F39\u8DF3:", newHomescreenLayout: "\u4F7F\u7528\u65B0\u4E3B\u9875\u5E03\u5C40:", glassBlur: "Glass \u6A21\u7CCA (px):", backdropBlur: "\u80CC\u666F\u6A21\u7CCA (px):", leftSidebarRadius: "\u5DE6\u4FA7\u680F\u5706\u89D2 (px):", mainViewRadius: "\u4E3B\u89C6\u56FE\u5706\u89D2 (px):", rightSidebarRadius: "\u53F3\u4FA7\u680F\u5706\u89D2 (px):" },
    canvasCoverArt: { mode: "\u66F2\u540D\u5C01\u9762\u56FE:", off: "\u5173", trackInfo: "\u5728\u66F2\u76EE\u4FE1\u606F\u65C1", outsideTrackInfo: "\u5728\u66F2\u76EE\u4FE1\u606F\u5916", overCanvas: "\u8986\u76D6 Canvas", showAlways: "\u59CB\u7EC8\u663E\u793A:", yes: "\u662F", no: "\u5426", blur: "\u6A21\u7CCA (px):" },
    comfyCoverArt: { enabled: "Comfy Cover Art:", width: "\u5BBD\u5EA6 (px):", height: "\u9AD8\u5EA6 (px):", marginBottom: "\u5E95\u90E8\u8FB9\u8DDD (px):", marginLeft: "\u5DE6\u4FA7\u8FB9\u8DDD (px):" },
    nextSongCard: { show: "\u663E\u793A\u4E0B\u4E00\u9996\u6B4C\u5361\u7247:", position: "\u6C34\u5E73\u4F4D\u7F6E", cardHeight: "\u5361\u7247\u9AD8\u5EA6 (px):", cardMaxWidth: "\u5361\u7247\u6700\u5927\u5BBD\u5EA6 (px):", gap: "\u56FE\u7247\u4E0E\u6587\u5B57\u95F4\u8DDD (px):", coverSize: "\u5C01\u9762\u5927\u5C0F (px):", hPad: "\u6C34\u5E73\u5185\u8FB9\u8DDD (px):", vPad: "\u5782\u76F4\u5185\u8FB9\u8DDD (px):", gapToPlayer: "\u5230\u64AD\u653E\u5668\u8DDD\u79BB (px):", borderRadius: "\u5706\u89D2 (px):", coverBorderRadius: "\u5C01\u9762\u5706\u89D2 (px):", left: "\u5DE6", right: "\u53F3" },
    lyricsOptions: { off: "\u5173", translation: "\u4EC5\u7FFB\u8BD1", romanization: "\u4EC5\u7F57\u9A6C\u5316", both: "\u7FFB\u8BD1 + \u7F57\u9A6C\u5316" },
    tooltips: translateTooltips("zh"),
    onboarding: { welcomeTag: "\u6B22\u8FCE\u4F7F\u7528", step1Title: "Liquify Settings V3", step1Text: "\u6B64\u6309\u94AE\u4F1A\u6253\u5F00 Liquify Theme V2 \u7684 Liquify Settings V3 \u9762\u677F\u3002\u4F60\u53EF\u4EE5\u5728\u4E00\u4E2A\u5730\u65B9\u81EA\u5B9A\u4E49\u80CC\u666F\u3001\u5F3A\u8C03\u8272\u3001\u64AD\u653E\u5668\u3001\u52A8\u753B\u7B49\u5185\u5BB9\u3002", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics \u662F Liquify Theme V2 \u7684\u5B98\u65B9\u6B4C\u8BCD\u6269\u5C55\u3002\u5B83\u80FD\u8BA9\u4E3B\u9898\u66F4\u5B8C\u6574\uFF0C\u4E5F\u662F\u552F\u4E00\u5B98\u65B9\u652F\u6301\u7684\u6B4C\u8BCD\u6269\u5C55\u3002\u8981\u4ECE Marketplace \u5B89\u88C5\u5417\uFF1F", lyricsInstallBtn: "\u5B89\u88C5", lyricsSkipBtn: "\u7A0D\u540E\u518D\u8BF4", lyricsInstalling: "\u6B63\u5728\u5B89\u88C5...", lyricsInstalled: "\u5DF2\u5B89\u88C5", lyricsRetryBtn: "\u91CD\u8BD5", lyricsFailed: "\u65E0\u6CD5\u81EA\u52A8\u5B89\u88C5 - \u4F60\u53EF\u4EE5\u5728 Marketplace \u83B7\u53D6 Liquid Lyrics\u3002", lyricsReloadNote: "\u5B8C\u6210\u540E Liquify \u5C06\u91CD\u65B0\u52A0\u8F7D\u4EE5\u542F\u7528 Liquid Lyrics\u3002", step2Title: "\u63A2\u7D22\u4F60\u7684\u8BBE\u7F6E", step2Text: "\u6240\u6709 Liquify Settings V3 \u9009\u9879\u90FD\u5728\u8FD9\u91CC\uFF0C\u4FEE\u6539\u4F1A\u7ACB\u5373\u4FDD\u5B58\u3002\u53EF\u7528\u5173\u95ED\u6309\u94AE\u6216\u70B9\u51FB\u5916\u90E8\u5173\u95ED\u9762\u677F\u3002", nextBtn: "\u4E0B\u4E00\u6B65", gotItBtn: "\u77E5\u9053\u4E86" }
  });
  liquifyTranslations.ko = deepMerge(settingsCopy, {
    settingsTitle: "Liquify \uC124\uC815",
    title: "Liquify \uC124\uC815",
    close: "\uB2EB\uAE30",
    chooseFile: "\uD30C\uC77C \uC120\uD0DD",
    enterUrl: "\uC774\uBBF8\uC9C0 URL \uC785\uB825...",
    resetAllSettings: "\uBAA8\uB4E0 \uC124\uC815 \uCD08\uAE30\uD654",
    searchPlaceholder: "\uC124\uC815 \uAC80\uC0C9...",
    accentColor: "\uC0C9\uC0C1 \uD14C\uB9C8:",
    accentSource: "\uC0C9\uC0C1 \uCD9C\uCC98:",
    accentSatBoost: "\uCC44\uB3C4 \uBD80\uC2A4\uD2B8:",
    accentLightBoost: "\uBC1D\uAE30 \uBD80\uC2A4\uD2B8:",
    background: "\uBC30\uACBD:",
    backgroundBlur: "\uBC30\uACBD \uD750\uB9BC (px):",
    animatedBackground: "\uC560\uB2C8\uBA54\uC774\uC158 \uBC30\uACBD:",
    backgroundBrightness: "\uBC30\uACBD \uBC1D\uAE30 (%):",
    apbackground: "\uC544\uD2F0\uC2A4\uD2B8 \uD398\uC774\uC9C0 \uBC30\uACBD:",
    artistScrollBlur: "\uC544\uD2F0\uC2A4\uD2B8 \uC2A4\uD06C\uB864 \uD750\uB9BC (px):",
    artistScrollBrightness: "\uC544\uD2F0\uC2A4\uD2B8 \uC2A4\uD06C\uB864 \uBC1D\uAE30 (%):",
    playerWidth: "\uD50C\uB808\uC774\uC5B4 \uB108\uBE44:",
    playerCustomWidth: "\uD50C\uB808\uC774\uC5B4 \uB108\uBE44 (%):",
    playerCustomHeight: "\uD50C\uB808\uC774\uC5B4 \uB192\uC774 (px):",
    playerRadius: "\uD50C\uB808\uC774\uC5B4 \uBAA8\uC11C\uB9AC \uBC18\uACBD (px):",
    playbarCoverBorderRadius: "\uCEE4\uBC84 \uBAA8\uC11C\uB9AC \uBC18\uACBD (px):",
    transparentPlayer: "\uD22C\uBA85 \uD50C\uB808\uC774\uC5B4:",
    floatingPlayer: "\uD50C\uB85C\uD305 \uD50C\uB808\uC774\uC5B4:",
    connectBar: "Connect \uBC14 \uD45C\uC2DC:",
    compactPlayer: "\uCEF4\uD329\uD2B8 \uD50C\uB808\uC774\uC5B4:",
    playerControlIcons: "\uC0C8 \uD50C\uB808\uC774\uC5B4 \uC544\uC774\uCF58 \uC0AC\uC6A9:",
    progressBarHeight: "\uC9C4\uD589/\uBCFC\uB968 \uBC14 \uB192\uC774 (px):",
    progressBarRadius: "\uC9C4\uD589/\uBCFC\uB968 \uBC14 \uBC18\uACBD (px):",
    progressBarCompat: "\uD638\uD658 \uBAA8\uB4DC:",
    playlistHeaderBox: "\uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8 \uD5E4\uB354 \uBC15\uC2A4:",
    actionBarBox: "\uC561\uC158 \uBC14 \uBC15\uC2A4:",
    lyricsMode: "\uAC00\uC0AC \uBC88\uC5ED/\uB85C\uB9C8\uC790 \uD45C\uAE30:",
    themedLyrics: "\uD14C\uB9C8 \uAC00\uC0AC:",
    lyricsFontSize: "\uAC00\uC0AC \uAE00\uAF34 \uD06C\uAE30 (px):",
    lyricsMargin: "\uAC00\uC0AC \uC5EC\uBC31 (px):",
    transparentWidth: "\uCC3D \uCEE8\uD2B8\uB864 \uB108\uBE44 (px):",
    transparentHeight: "\uCC3D \uCEE8\uD2B8\uB864 \uB192\uC774 (px):",
    aria: { scrollSectionsLeft: "\uC139\uC158\uC744 \uC67C\uCABD\uC73C\uB85C \uC2A4\uD06C\uB864", scrollSectionsRight: "\uC139\uC158\uC744 \uC624\uB978\uCABD\uC73C\uB85C \uC2A4\uD06C\uB864", help: "\uB3C4\uC6C0\uB9D0" },
    sections: { accent: "\uC0C9\uC0C1", background: "\uBC30\uACBD", artist: "\uC544\uD2F0\uC2A4\uD2B8", ui: "UI", player: "\uD50C\uB808\uC774\uC5B4", nextSongCard: "\uB2E4\uC74C \uACE1", canvasCoverArt: "Canvas Cover Art", playlist: "\uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8", lyrics: "\uAC00\uC0AC", transparent: "\uCC3D \uCEE8\uD2B8\uB864", config: "\uAD6C\uC131" },
    subSections: { performanceGlass: "\uC131\uB2A5 \uBC0F Glass", animations: "\uC560\uB2C8\uBA54\uC774\uC158", homescreen: "\uD648 \uD654\uBA74", borderRadius: "\uBAA8\uC11C\uB9AC \uBC18\uACBD", sizeShape: "\uD06C\uAE30\uC640 \uBAA8\uC591", progressVolume: "\uC9C4\uD589 \uBC0F \uBCFC\uB968", coverArt: "\uCEE4\uBC84 \uC544\uD2B8", modes: "\uBAA8\uB4DC", styling: "\uC2A4\uD0C0\uC77C", translation: "\uBC88\uC5ED" },
    config: { hint: "\uD604\uC7AC Liquify \uAD6C\uC131\uC744 \uBC31\uC5C5\uD558\uAC70\uB098 \uACF5\uC720\uD558\uB824\uBA74 \uBCF5\uC0AC\uD558\uACE0, \uB2E4\uB978 \uAD6C\uC131\uC744 \uBD99\uC5EC\uB123\uC5B4 \uC801\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC0AC\uC6A9\uC790 \uBC30\uACBD \uC774\uBBF8\uC9C0\uB294 \uD3EC\uD568\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", copy: "\uBCF5\uC0AC", reload: "\uD604\uC7AC \uD56D\uBAA9 \uBD88\uB7EC\uC624\uAE30", apply: "\uBD99\uC5EC\uB123\uACE0 \uC801\uC6A9", copied: "\uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", copyFailed: "\uBCF5\uC0AC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4 - \uD14D\uC2A4\uD2B8\uB97C \uC120\uD0DD\uD574 \uC218\uB3D9\uC73C\uB85C \uBCF5\uC0AC\uD558\uC138\uC694.", invalid: "\uC798\uBABB\uB41C \uAD6C\uC131\uC785\uB2C8\uB2E4." },
    dropdown: { default: "\uAE30\uBCF8\uAC12", custom: "\uC0AC\uC6A9\uC790 \uC9C0\uC815", dynamic: "\uB3D9\uC801", animated: "\uC560\uB2C8\uBA54\uC774\uC158", playlist: "\uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8", theme: "\uD14C\uB9C8", none: "\uC5C6\uC74C", show: "\uD45C\uC2DC", hide: "\uC228\uAE30\uAE30", on: "\uCF1C\uAE30", off: "\uB044\uAE30", url: "URL", backgroundSource: "\uBC30\uACBD", songCover: "\uACE1 \uCEE4\uBC84" },
    ui: { performanceMode: "\uC131\uB2A5 \uBAA8\uB4DC:", popupBounce: "\uD31D\uC5C5 \uBC14\uC6B4\uC2A4:", newHomescreenLayout: "\uC0C8 \uD648 \uD654\uBA74 \uB808\uC774\uC544\uC6C3 \uC0AC\uC6A9:", glassBlur: "Glass \uD750\uB9BC (px):", backdropBlur: "\uBC30\uACBD \uD750\uB9BC (px):", leftSidebarRadius: "\uC67C\uCABD \uC0AC\uC774\uB4DC\uBC14 \uBC18\uACBD (px):", mainViewRadius: "\uBA54\uC778 \uBDF0 \uBC18\uACBD (px):", rightSidebarRadius: "\uC624\uB978\uCABD \uC0AC\uC774\uB4DC\uBC14 \uBC18\uACBD (px):" },
    canvasCoverArt: { mode: "\uD2B8\uB799 \uC774\uB984 \uCEE4\uBC84 \uC544\uD2B8:", off: "\uB044\uAE30", trackInfo: "\uD2B8\uB799 \uC815\uBCF4 \uC606", outsideTrackInfo: "\uD2B8\uB799 \uC815\uBCF4 \uBC16", overCanvas: "Canvas \uC704", showAlways: "\uD56D\uC0C1 \uD45C\uC2DC:", yes: "\uC608", no: "\uC544\uB2C8\uC694", blur: "\uD750\uB9BC (px):" },
    comfyCoverArt: { enabled: "Comfy Cover Art:", width: "\uB108\uBE44 (px):", height: "\uB192\uC774 (px):", marginBottom: "\uC544\uB798 \uC5EC\uBC31 (px):", marginLeft: "\uC67C\uCABD \uC5EC\uBC31 (px):" },
    nextSongCard: { show: "\uB2E4\uC74C \uACE1 \uCE74\uB4DC \uD45C\uC2DC:", position: "\uAC00\uB85C \uC704\uCE58", cardHeight: "\uCE74\uB4DC \uB192\uC774 (px):", cardMaxWidth: "\uCE74\uB4DC \uCD5C\uB300 \uB108\uBE44 (px):", gap: "\uC774\uBBF8\uC9C0\uC640 \uD14D\uC2A4\uD2B8 \uAC04\uACA9 (px):", coverSize: "\uCEE4\uBC84 \uD06C\uAE30 (px):", hPad: "\uAC00\uB85C \uD328\uB529 (px):", vPad: "\uC138\uB85C \uD328\uB529 (px):", gapToPlayer: "\uD50C\uB808\uC774\uC5B4\uAE4C\uC9C0 \uAC70\uB9AC (px):", borderRadius: "\uBAA8\uC11C\uB9AC \uBC18\uACBD (px):", coverBorderRadius: "\uCEE4\uBC84 \uBC18\uACBD (px):", left: "\uC67C\uCABD", right: "\uC624\uB978\uCABD" },
    lyricsOptions: { off: "\uB044\uAE30", translation: "\uBC88\uC5ED\uB9CC", romanization: "\uB85C\uB9C8\uC790 \uD45C\uAE30\uB9CC", both: "\uBC88\uC5ED + \uB85C\uB9C8\uC790 \uD45C\uAE30" },
    tooltips: translateTooltips("ko"),
    onboarding: { welcomeTag: "\uD658\uC601\uD569\uB2C8\uB2E4", step1Title: "Liquify Settings V3", step1Text: "\uC774 \uBC84\uD2BC\uC740 Liquify Theme V2\uC6A9 Liquify Settings V3 \uD328\uB110\uC744 \uC5FD\uB2C8\uB2E4. \uBC30\uACBD, \uAC15\uC870 \uC0C9\uC0C1, \uD50C\uB808\uC774\uC5B4, \uC560\uB2C8\uBA54\uC774\uC158 \uB4F1\uC744 \uD55C\uACF3\uC5D0\uC11C \uC0AC\uC6A9\uC790 \uC9C0\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", lyricsTitle: "Liquid Lyrics", lyricsText: "Liquid Lyrics\uB294 Liquify Theme V2\uC758 \uACF5\uC2DD \uAC00\uC0AC \uD655\uC7A5\uC785\uB2C8\uB2E4. \uD14C\uB9C8\uB97C \uC644\uC131\uD574 \uC8FC\uBA70 \uACF5\uC2DD \uC9C0\uC6D0\uB418\uB294 \uC720\uC77C\uD55C \uAC00\uC0AC \uD655\uC7A5\uC785\uB2C8\uB2E4. Marketplace\uC5D0\uC11C \uC124\uCE58\uD560\uAE4C\uC694?", lyricsInstallBtn: "\uC124\uCE58", lyricsSkipBtn: "\uB098\uC911\uC5D0", lyricsInstalling: "\uC124\uCE58 \uC911...", lyricsInstalled: "\uC124\uCE58\uB428", lyricsRetryBtn: "\uB2E4\uC2DC \uC2DC\uB3C4", lyricsFailed: "\uC790\uB3D9 \uC124\uCE58\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4 - Marketplace\uC5D0\uC11C Liquid Lyrics\uB97C \uBC1B\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", lyricsReloadNote: "\uC644\uB8CC\uD558\uBA74 Liquid Lyrics\uB97C \uB85C\uB4DC\uD558\uAE30 \uC704\uD574 Liquify\uAC00 \uB2E4\uC2DC \uB85C\uB4DC\uB429\uB2C8\uB2E4.", step2Title: "\uC124\uC815 \uB458\uB7EC\uBCF4\uAE30", step2Text: "\uBAA8\uB4E0 Liquify Settings V3 \uC635\uC158\uC740 \uC5EC\uAE30\uC5D0 \uC788\uC73C\uBA70 \uBCC0\uACBD \uC0AC\uD56D\uC740 \uC989\uC2DC \uC800\uC7A5\uB429\uB2C8\uB2E4. \uB2EB\uAE30 \uBC84\uD2BC\uC774\uB098 \uBC14\uAE65 \uD074\uB9AD\uC73C\uB85C \uD328\uB110\uC744 \uB2EB\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", nextBtn: "\uB2E4\uC74C", gotItBtn: "\uC54C\uACA0\uC5B4\uC694" }
  });
  function deepMerge(base, override) {
    if (!override || typeof override !== "object") return override;
    const out = Array.isArray(base) ? [...base] : { ...base || {} };
    for (const key of Object.keys(override)) {
      const value = override[key];
      out[key] = value && typeof value === "object" && !Array.isArray(value) ? deepMerge(base?.[key], value) : value;
    }
    return out;
  }
  function translateTooltips(lang) {
    const tips = {
      hi: {
        accentColor: "\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F Spotify \u0915\u093E \u0939\u0930\u093E \u0930\u0902\u0917 \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0924\u093E \u0939\u0948, \u0915\u0938\u094D\u091F\u092E \u091A\u0941\u0928\u093E \u0939\u0941\u0906 \u0938\u094D\u0925\u093F\u0930 \u0930\u0902\u0917, \u0914\u0930 \u0921\u093E\u092F\u0928\u093E\u092E\u093F\u0915 \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0915\u0935\u0930 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0930\u0902\u0917 \u092C\u0926\u0932\u0924\u093E \u0939\u0948.",
        accentSource: "\u0921\u093E\u092F\u0928\u093E\u092E\u093F\u0915 \u0930\u0902\u0917 \u0915\u0939\u093E\u0901 \u0938\u0947 \u0932\u093F\u090F \u091C\u093E\u090F\u0901: \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u0938\u0947 (\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F, \u0905\u092A\u0928\u0940 \u091B\u0935\u093F \u092F\u093E URL) \u092F\u093E \u0939\u092E\u0947\u0936\u093E \u0917\u0940\u0924 \u0915\u0935\u0930 \u0938\u0947.",
        accentSatBoost: "\u0915\u0935\u0930 \u0938\u0947 \u0932\u093F\u090F \u0917\u090F \u0930\u0902\u0917\u094B\u0902 \u0915\u094B \u0915\u093F\u0924\u0928\u093E \u0924\u0940\u0935\u094D\u0930 \u0915\u0930\u0928\u093E \u0939\u0948 (\u0915\u0947\u0935\u0932 \u0921\u093E\u092F\u0928\u093E\u092E\u093F\u0915 \u092E\u094B\u0921).",
        accentLightBoost: "\u0915\u0935\u0930 \u0938\u0947 \u0932\u093F\u090F \u0917\u090F \u090F\u0915\u094D\u0938\u0947\u0902\u091F \u0915\u094B \u0915\u093F\u0924\u0928\u093E \u091A\u092E\u0915\u093E\u0928\u093E \u0939\u0948 (\u0915\u0947\u0935\u0932 \u0921\u093E\u092F\u0928\u093E\u092E\u093F\u0915 \u092E\u094B\u0921).",
        background: "\u0921\u093E\u092F\u0928\u093E\u092E\u093F\u0915 = \u0927\u0941\u0902\u0927\u0932\u093E \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0915\u0935\u0930, \u090F\u0928\u093F\u092E\u0947\u091F\u0947\u0921 = \u091A\u0932\u0924\u093E \u0917\u094D\u0930\u0947\u0921\u093F\u090F\u0902\u091F, \u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F = \u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F \u091B\u0935\u093F, \u0915\u0938\u094D\u091F\u092E = \u0905\u092A\u0928\u0940 \u091B\u0935\u093F, URL = \u091B\u0935\u093F \u0932\u093F\u0902\u0915.",
        animatedBackground: "\u0915\u0938\u094D\u091F\u092E, URL \u092F\u093E \u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u0915\u094B \u0939\u0932\u094D\u0915\u093E \u090F\u0928\u093F\u092E\u0947\u091F \u0915\u0930\u0924\u093E \u0939\u0948.",
        artistBackground: "\u0906\u0930\u094D\u091F\u093F\u0938\u094D\u091F \u092A\u0947\u091C\u094B\u0902 \u0915\u0947 \u092A\u0940\u091B\u0947 \u0915\u094D\u092F\u093E \u0926\u093F\u0916\u0947: \u0925\u0940\u092E \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F, \u0915\u0941\u091B \u0928\u0939\u0940\u0902, \u0905\u092A\u0928\u0940 \u091B\u0935\u093F \u092F\u093E URL.",
        artistScrollBlur: "\u0928\u0940\u091A\u0947 \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u0915\u0930\u0924\u0947 \u0938\u092E\u092F \u0906\u0930\u094D\u091F\u093F\u0938\u094D\u091F \u0939\u0947\u0921\u0930 \u091B\u0935\u093F \u0915\u0940 \u0927\u0941\u0902\u0927.",
        artistScrollBrightness: "\u0928\u0940\u091A\u0947 \u0938\u094D\u0915\u094D\u0930\u0949\u0932 \u0915\u0930\u0924\u0947 \u0938\u092E\u092F \u0906\u0930\u094D\u091F\u093F\u0938\u094D\u091F \u0939\u0947\u0921\u0930 \u091B\u0935\u093F \u0915\u0940 \u091A\u092E\u0915.",
        performanceMode: "SVG Liquid Glass \u0930\u093F\u092B\u094D\u0930\u0948\u0915\u094D\u0936\u0928 \u092C\u0902\u0926 \u0915\u0930\u0915\u0947 \u0938\u093E\u0927\u093E\u0930\u0923 \u092C\u094D\u0932\u0930 \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0924\u093E \u0939\u0948 - GPU \u092A\u0930 \u0939\u0932\u094D\u0915\u093E.",
        glassBlur: "Liquid Glass \u0938\u0924\u0939\u094B\u0902 \u0915\u0947 \u092A\u0940\u091B\u0947 \u092C\u0948\u0915\u0921\u094D\u0930\u0949\u092A \u092C\u094D\u0932\u0930 \u0915\u0940 \u0924\u093E\u0915\u0924.",
        popupBounce: "\u092A\u0949\u092A\u0905\u092A \u0914\u0930 \u092E\u0947\u0928\u0942 \u0916\u0941\u0932\u0928\u0947 \u092A\u0930 \u0938\u094D\u092A\u094D\u0930\u093F\u0902\u0917/\u092C\u093E\u0909\u0902\u0938 \u090F\u0928\u093F\u092E\u0947\u0936\u0928.",
        newHomescreenLayout: "\u0939\u094B\u092E \u0938\u0947\u0915\u094D\u0936\u0928 \u0915\u094B glass \u0915\u093E\u0930\u094D\u0921 \u092E\u0947\u0902 \u0930\u0916\u0924\u093E \u0939\u0948 \u0914\u0930 \u0915\u093E\u0930\u094D\u0921 \u0917\u094D\u0930\u093F\u0921 \u0915\u0940 \u090A\u0901\u091A\u093E\u0908 \u0938\u093E\u092B \u0915\u0930\u0924\u093E \u0939\u0948.",
        playerWidth: "\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F = Spotify \u091A\u094C\u0921\u093C\u093E\u0908, \u0925\u0940\u092E = Liquify \u091A\u094C\u0921\u093C\u093E\u0908, \u0915\u0938\u094D\u091F\u092E = \u0928\u0940\u091A\u0947 \u0916\u0941\u0926 \u0938\u0947\u091F \u0915\u0930\u0947\u0902.",
        comfyCoverArt: "\u0928\u0940\u091A\u0947 \u092C\u093E\u090F\u0901 Now Playing \u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0915\u094B \u092C\u0921\u093C\u093E \u0915\u0930\u0924\u093E \u0939\u0948.",
        floatingPlayer: "\u092A\u094D\u0932\u0947\u092C\u093E\u0930 \u0915\u094B \u0905\u0932\u0917 \u0915\u0930 \u0928\u0940\u091A\u0947 \u092C\u0940\u091A \u092E\u0947\u0902 \u0915\u0902\u091F\u0947\u0902\u091F \u0915\u0947 \u090A\u092A\u0930 \u0924\u0948\u0930\u093E\u0924\u093E \u0939\u0948.",
        transparentPlayer: "\u0928\u0940\u091A\u0947 \u0915\u0947 \u092A\u094D\u0932\u0947\u092F\u0930 \u0938\u0947 glass \u0930\u093F\u092B\u094D\u0930\u0948\u0915\u094D\u0936\u0928 \u0939\u091F\u093E\u0915\u0930 \u0909\u0938\u0947 \u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u092C\u0928\u093E\u0924\u093E \u0939\u0948.",
        compactPlayer: "\u0928\u0940\u091A\u0947 \u0915\u0940 \u092C\u093E\u0930 \u0915\u094B \u090F\u0915 \u092A\u0902\u0915\u094D\u0924\u093F \u092E\u0947\u0902 \u0915\u0902\u091F\u094D\u0930\u094B\u0932 \u0914\u0930 \u092A\u094D\u0930\u094B\u0917\u094D\u0930\u0947\u0938 \u0915\u0947 \u0938\u093E\u0925 \u091B\u094B\u091F\u093E \u0915\u0930\u0924\u093E \u0939\u0948.",
        playerControlIcons: "Spotify \u0915\u0947 play, pause \u0914\u0930 skip \u0906\u0907\u0915\u0928 \u0915\u094B Liquify \u0915\u0947 \u0905\u092A\u0928\u0947 \u092E\u0940\u0921\u093F\u092F\u093E \u092A\u094D\u0932\u0947\u092F\u0930 \u0906\u0907\u0915\u0928 \u0938\u0947 \u092C\u0926\u0932\u0924\u093E \u0939\u0948.",
        connectBar: "\u091C\u092C Spotify Connect \u0938\u0947 \u0915\u093F\u0938\u0940 \u0926\u0942\u0938\u0930\u0947 \u0921\u093F\u0935\u093E\u0907\u0938 \u092A\u0930 \u092A\u094D\u0932\u0947\u092C\u0948\u0915 \u0939\u094B \u0924\u094B \u0926\u093F\u0916\u0928\u0947 \u0935\u093E\u0932\u0940 \u092C\u093E\u0930.",
        nextSongCard: "\u0905\u0917\u0932\u0947 \u091F\u094D\u0930\u0948\u0915 \u0915\u093E \u091B\u094B\u091F\u093E \u092A\u094D\u0930\u0940\u0935\u094D\u092F\u0942 \u0915\u093E\u0930\u094D\u0921 \u0926\u093F\u0916\u093E\u0924\u093E \u0939\u0948.",
        canvasCoverArt: "Now Playing \u0926\u0943\u0936\u094D\u092F \u092E\u0947\u0902 \u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u091C\u094B\u0921\u093C\u0924\u093E \u0939\u0948: \u091F\u094D\u0930\u0948\u0915 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0915\u0947 \u092A\u093E\u0938, \u092C\u093E\u0939\u0930 \u092F\u093E \u092C\u0902\u0926.",
        canvasShowAlways: "Canvas/\u0935\u0940\u0921\u093F\u092F\u094B \u091A\u0932\u0928\u0947 \u092A\u0930 \u092D\u0940 \u0915\u0935\u0930 \u0906\u0930\u094D\u091F \u0926\u093F\u0916\u093E\u090F \u0930\u0916\u0924\u093E \u0939\u0948.",
        playlistHeaderBox: "\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F \u0939\u0947\u0921\u0930 \u0915\u094B glass \u092C\u0949\u0915\u094D\u0938 \u092E\u0947\u0902 \u0930\u0916\u0924\u093E \u0939\u0948.",
        progressBarCompat: "\u0925\u0940\u092E \u0915\u094B \u092A\u094D\u0930\u094B\u0917\u094D\u0930\u0947\u0938 \u0914\u0930 \u0935\u0949\u0932\u094D\u092F\u0942\u092E \u092C\u093E\u0930 \u0938\u094D\u091F\u093E\u0907\u0932 \u0915\u0930\u0928\u0947 \u0938\u0947 \u0930\u094B\u0915\u0924\u093E \u0939\u0948, \u0924\u093E\u0915\u093F \u0915\u094B\u0908 \u0926\u0942\u0938\u0930\u093E \u090F\u0915\u094D\u0938\u091F\u0947\u0902\u0936\u0928 \u0909\u0928\u094D\u0939\u0947\u0902 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u093F\u0924 \u0915\u0930 \u0938\u0915\u0947. \u090A\u092A\u0930 \u0915\u0947 \u090A\u0901\u091A\u093E\u0908 \u0914\u0930 \u0930\u0947\u0921\u093F\u092F\u0938 \u0935\u093F\u0915\u0932\u094D\u092A \u091B\u093F\u092A \u091C\u093E\u0924\u0947 \u0939\u0948\u0902.",
        actionBarBox: "\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F \u090F\u0915\u094D\u0936\u0928 \u092C\u093E\u0930 (play/shuffle \u092A\u0902\u0915\u094D\u0924\u093F) \u0915\u094B glass \u092C\u0949\u0915\u094D\u0938 \u092E\u0947\u0902 \u0930\u0916\u0924\u093E \u0939\u0948.",
        themedLyrics: "\u0917\u0940\u0924 \u092A\u0947\u091C \u0915\u094B \u0925\u0940\u092E \u0938\u0947 \u092E\u093F\u0932\u093E\u0924\u093E \u0939\u0948 (Glass + \u090F\u0915\u094D\u0938\u0947\u0902\u091F).",
        transparentWidth: "\u0935\u093F\u0902\u0921\u094B \u092C\u091F\u0928 \u0915\u0947 \u0932\u093F\u090F \u0906\u0930\u0915\u094D\u0937\u093F\u0924 \u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u0921\u094D\u0930\u0948\u0917 \u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0915\u0940 \u091A\u094C\u0921\u093C\u093E\u0908 (\u0915\u0947\u0935\u0932 Windows).",
        transparentHeight: "\u0935\u093F\u0902\u0921\u094B \u092C\u091F\u0928 \u0915\u0947 \u0932\u093F\u090F \u0906\u0930\u0915\u094D\u0937\u093F\u0924 \u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u0921\u094D\u0930\u0948\u0917 \u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0915\u0940 \u090A\u0901\u091A\u093E\u0908 (\u0915\u0947\u0935\u0932 Windows)."
      },
      sv: {
        accentColor: "Standard anv\xE4nder Spotifys gr\xF6na, Anpassad en fast f\xE4rg, Dynamisk anpassar accentf\xE4rgen till aktuell omslagsbild.",
        accentSource: "Varifr\xE5n de dynamiska f\xE4rgerna tas: fr\xE5n den aktuella bakgrunden (playlist, egen bild eller URL) eller alltid fr\xE5n l\xE5tomslaget.",
        accentSatBoost: "Hur mycket f\xE4rger fr\xE5n omslaget ska f\xF6rst\xE4rkas (endast dynamiskt l\xE4ge).",
        accentLightBoost: "Hur mycket accentf\xE4rgen fr\xE5n omslaget ska ljusas upp (endast dynamiskt l\xE4ge).",
        background: "Dynamisk = suddigt aktuellt omslag, Animerad = r\xF6rlig gradient, Playlist = playlistbild, Anpassad = egen bild, URL = bildl\xE4nk.",
        animatedBackground: "Animerar anpassad, URL- eller playlistbakgrund subtilt.",
        artistBackground: "Vad som visas bakom artistsidor: temats standard, inget, egen bild eller bild-URL.",
        artistScrollBlur: "Osk\xE4rpa f\xF6r artistens headerbild n\xE4r du scrollar ned\xE5t.",
        artistScrollBrightness: "Ljusstyrka f\xF6r artistens headerbild n\xE4r du scrollar ned\xE5t.",
        performanceMode: "St\xE4nger av SVG Liquid Glass-brytning och anv\xE4nder enkel osk\xE4rpa - l\xE4ttare f\xF6r GPU:n.",
        glassBlur: "Styrka p\xE5 bakgrundsosk\xE4rpan bakom Liquid Glass-ytor.",
        popupBounce: "Fj\xE4drande animation n\xE4r popups och menyer \xF6ppnas.",
        newHomescreenLayout: "L\xE4gger hemsektioner i glass-kort och g\xF6r kortens h\xF6jder j\xE4mnare.",
        playerWidth: "Standard = Spotifys bredd, Tema = Liquifys bredd, Anpassad = st\xE4ll in sj\xE4lv nedan.",
        comfyCoverArt: "F\xF6rstorar omslaget nere till v\xE4nster f\xF6r en bekv\xE4mare look.",
        floatingPlayer: "Lossar uppspelningsf\xE4ltet och l\xE5ter det flyta centrerat l\xE4ngst ned \xF6ver inneh\xE5llet.",
        transparentPlayer: "Tar bort glass-brytningen fr\xE5n nedre spelaren s\xE5 den blir genomskinlig.",
        compactPlayer: "Krymper nedre f\xE4ltet till en rad med kontroller och progress bredvid varandra.",
        playerControlIcons: "Ers\xE4tter Spotifys spela-, pausa- och hoppa-ikoner med Liquifys egna mediaspelarikoner.",
        connectBar: "F\xE4ltet som visas n\xE4r uppspelning sker p\xE5 en annan enhet via Spotify Connect.",
        nextSongCard: "Visar ett litet f\xF6rhandskort f\xF6r n\xE4sta sp\xE5r.",
        canvasCoverArt: "L\xE4gger till omslaget i Now Playing: bredvid sp\xE5rinfo, utanf\xF6r den eller av.",
        canvasShowAlways: "H\xE5ller omslaget synligt \xE4ven n\xE4r Canvas/video spelas.",
        playlistHeaderBox: "L\xE4gger playlist-headern i en glass-box.",
        progressBarCompat: "Hindrar temat fr\xE5n att styla progress- och volymf\xE4lten, s\xE5 att ett annat till\xE4gg kan styra dem. D\xF6ljer h\xF6jd- och radiealternativen ovanf\xF6r.",
        actionBarBox: "L\xE4gger playlistens \xE5tg\xE4rdsf\xE4lt (play/shuffle-rad) i en glass-box.",
        themedLyrics: "Stilar l\xE5ttextsidan s\xE5 den matchar temat (Glass + accent).",
        transparentWidth: "Bredd p\xE5 transparent dragyta reserverad f\xF6r f\xF6nsterknapparna (endast Windows).",
        transparentHeight: "H\xF6jd p\xE5 transparent dragyta reserverad f\xF6r f\xF6nsterknapparna (endast Windows)."
      },
      ja: {
        accentColor: "\u30C7\u30D5\u30A9\u30EB\u30C8\u306FSpotify\u306E\u7DD1\u3001\u30AB\u30B9\u30BF\u30E0\u306F\u9078\u3093\u3060\u56FA\u5B9A\u8272\u3001\u30C0\u30A4\u30CA\u30DF\u30C3\u30AF\u306F\u73FE\u5728\u306E\u30AB\u30D0\u30FC\u306B\u5408\u308F\u305B\u3066\u30A2\u30AF\u30BB\u30F3\u30C8\u3092\u5909\u3048\u307E\u3059\u3002",
        accentSource: "\u30C0\u30A4\u30CA\u30DF\u30C3\u30AF\u30AB\u30E9\u30FC\u306E\u53D6\u5F97\u5143: \u73FE\u5728\u306E\u80CC\u666F (\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u3001\u81EA\u5206\u306E\u753B\u50CF\u3001URL) \u304B\u3001\u5E38\u306B\u66F2\u306E\u30AB\u30D0\u30FC\u3002",
        accentSatBoost: "\u30AB\u30D0\u30FC\u304B\u3089\u53D6\u5F97\u3057\u305F\u8272\u3092\u3069\u308C\u3060\u3051\u5F37\u3081\u308B\u304B\uFF08\u30C0\u30A4\u30CA\u30DF\u30C3\u30AF\u30E2\u30FC\u30C9\u306E\u307F\uFF09\u3002",
        accentLightBoost: "\u30AB\u30D0\u30FC\u304B\u3089\u53D6\u5F97\u3057\u305F\u30A2\u30AF\u30BB\u30F3\u30C8\u3092\u3069\u308C\u3060\u3051\u660E\u308B\u304F\u3059\u308B\u304B\uFF08\u30C0\u30A4\u30CA\u30DF\u30C3\u30AF\u30E2\u30FC\u30C9\u306E\u307F\uFF09\u3002",
        background: "\u30C0\u30A4\u30CA\u30DF\u30C3\u30AF = \u73FE\u5728\u306E\u30AB\u30D0\u30FC\u3092\u307C\u304B\u3059\u3001\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3 = \u52D5\u304F\u30B0\u30E9\u30C7\u30FC\u30B7\u30E7\u30F3\u3001\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8 = \u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u753B\u50CF\u3001\u30AB\u30B9\u30BF\u30E0 = \u81EA\u5206\u306E\u753B\u50CF\u3001URL = \u753B\u50CF\u30EA\u30F3\u30AF\u3002",
        animatedBackground: "\u30AB\u30B9\u30BF\u30E0\u3001URL\u3001\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u80CC\u666F\u3092\u3055\u308A\u3052\u306A\u304F\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u3057\u307E\u3059\u3002",
        artistBackground: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30DA\u30FC\u30B8\u306E\u80CC\u5F8C\u306B\u8868\u793A\u3059\u308B\u3082\u306E: \u30C6\u30FC\u30DE\u6A19\u6E96\u3001\u306A\u3057\u3001\u81EA\u5206\u306E\u753B\u50CF\u3001\u753B\u50CFURL\u3002",
        artistScrollBlur: "\u4E0B\u3078\u30B9\u30AF\u30ED\u30FC\u30EB\u3059\u308B\u3068\u304D\u306E\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30D8\u30C3\u30C0\u30FC\u753B\u50CF\u306E\u307C\u304B\u3057\u3002",
        artistScrollBrightness: "\u4E0B\u3078\u30B9\u30AF\u30ED\u30FC\u30EB\u3059\u308B\u3068\u304D\u306E\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u30D8\u30C3\u30C0\u30FC\u753B\u50CF\u306E\u660E\u308B\u3055\u3002",
        performanceMode: "SVG Liquid Glass\u5C48\u6298\u3092\u30AA\u30D5\u306B\u3057\u3001\u8EFD\u3044\u901A\u5E38\u307C\u304B\u3057\u3092\u4F7F\u3044\u307E\u3059\u3002",
        glassBlur: "Liquid Glass\u9762\u306E\u80CC\u5F8C\u306E\u307C\u304B\u3057\u5F37\u5EA6\u3002",
        popupBounce: "\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u3084\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F\u3068\u304D\u306E\u30D0\u30A6\u30F3\u30B9\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u3002",
        newHomescreenLayout: "\u30DB\u30FC\u30E0\u30BB\u30AF\u30B7\u30E7\u30F3\u3092glass\u30AB\u30FC\u30C9\u5316\u3057\u3001\u30AB\u30FC\u30C9\u30B0\u30EA\u30C3\u30C9\u306E\u9AD8\u3055\u3092\u6574\u3048\u307E\u3059\u3002",
        playerWidth: "\u30C7\u30D5\u30A9\u30EB\u30C8 = Spotify\u5E45\u3001\u30C6\u30FC\u30DE = Liquify\u5E45\u3001\u30AB\u30B9\u30BF\u30E0 = \u4E0B\u3067\u6307\u5B9A\u3002",
        comfyCoverArt: "\u5DE6\u4E0B\u306E\u518D\u751F\u4E2D\u30AB\u30D0\u30FC\u3092\u5927\u304D\u304F\u3057\u3066\u898B\u3084\u3059\u304F\u3057\u307E\u3059\u3002",
        floatingPlayer: "\u518D\u751F\u30D0\u30FC\u3092\u5207\u308A\u96E2\u3057\u3001\u30B3\u30F3\u30C6\u30F3\u30C4\u4E0A\u306E\u4E0B\u4E2D\u592E\u306B\u6D6E\u304B\u305B\u307E\u3059\u3002",
        transparentPlayer: "\u4E0B\u90E8\u30D7\u30EC\u30FC\u30E4\u30FC\u306Eglass\u5C48\u6298\u3092\u5916\u3057\u3066\u900F\u660E\u306B\u3057\u307E\u3059\u3002",
        compactPlayer: "\u4E0B\u90E8\u30D0\u30FC\u3092\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u3068\u9032\u884C\u8868\u793A\u304C\u6A2A\u4E26\u3073\u306E1\u884C\u306B\u7E2E\u5C0F\u3057\u307E\u3059\u3002",
        playerControlIcons: "Spotify\u306E\u518D\u751F\u30FB\u4E00\u6642\u505C\u6B62\u30FB\u30B9\u30AD\u30C3\u30D7\u306E\u30A2\u30A4\u30B3\u30F3\u3092Liquify\u72EC\u81EA\u306E\u30E1\u30C7\u30A3\u30A2\u30D7\u30EC\u30FC\u30E4\u30FC\u30A2\u30A4\u30B3\u30F3\u306B\u7F6E\u304D\u63DB\u3048\u307E\u3059\u3002",
        connectBar: "Spotify Connect\u3067\u5225\u30C7\u30D0\u30A4\u30B9\u518D\u751F\u4E2D\u306B\u8868\u793A\u3055\u308C\u308B\u30D0\u30FC\u3002",
        nextSongCard: "\u6B21\u306E\u30C8\u30E9\u30C3\u30AF\u306E\u5C0F\u3055\u306A\u30D7\u30EC\u30D3\u30E5\u30FC\u30AB\u30FC\u30C9\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
        canvasCoverArt: "Now Playing\u306B\u30AB\u30D0\u30FC\u3092\u8FFD\u52A0\u3057\u307E\u3059: \u30C8\u30E9\u30C3\u30AF\u60C5\u5831\u306E\u6A2A\u3001\u5916\u5074\u3001\u307E\u305F\u306F\u30AA\u30D5\u3002",
        canvasShowAlways: "Canvas/\u52D5\u753B\u518D\u751F\u4E2D\u3067\u3082\u30AB\u30D0\u30FC\u3092\u8868\u793A\u3057\u7D9A\u3051\u307E\u3059\u3002",
        playlistHeaderBox: "\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u30D8\u30C3\u30C0\u30FC\u3092glass\u30DC\u30C3\u30AF\u30B9\u3067\u56F2\u307F\u307E\u3059\u3002",
        progressBarCompat: "\u30C6\u30FC\u30DE\u304C\u9032\u884C\u30D0\u30FC\u3068\u97F3\u91CF\u30D0\u30FC\u306B\u30B9\u30BF\u30A4\u30EB\u3092\u9069\u7528\u3057\u306A\u3044\u3088\u3046\u306B\u3057\u3001\u4ED6\u306E\u62E1\u5F35\u6A5F\u80FD\u304C\u5236\u5FA1\u3067\u304D\u308B\u3088\u3046\u306B\u3057\u307E\u3059\u3002\u4E0A\u306E\u9AD8\u3055\u3068\u89D2\u4E38\u306E\u8A2D\u5B9A\u306F\u975E\u8868\u793A\u306B\u306A\u308A\u307E\u3059\u3002",
        actionBarBox: "\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u306E\u30A2\u30AF\u30B7\u30E7\u30F3\u30D0\u30FC\uFF08\u518D\u751F/\u30B7\u30E3\u30C3\u30D5\u30EB\u884C\uFF09\u3092glass\u30DC\u30C3\u30AF\u30B9\u3067\u56F2\u307F\u307E\u3059\u3002",
        themedLyrics: "\u6B4C\u8A5E\u30DA\u30FC\u30B8\u3092\u30C6\u30FC\u30DE\u306B\u5408\u308F\u305B\u3066\u30B9\u30BF\u30A4\u30EB\u3057\u307E\u3059\uFF08Glass + \u30A2\u30AF\u30BB\u30F3\u30C8\uFF09\u3002",
        transparentWidth: "\u30A6\u30A3\u30F3\u30C9\u30A6\u30DC\u30BF\u30F3\u7528\u306B\u4E88\u7D04\u3055\u308C\u305F\u900F\u660E\u30C9\u30E9\u30C3\u30B0\u9818\u57DF\u306E\u5E45\uFF08Windows\u306E\u307F\uFF09\u3002",
        transparentHeight: "\u30A6\u30A3\u30F3\u30C9\u30A6\u30DC\u30BF\u30F3\u7528\u306B\u4E88\u7D04\u3055\u308C\u305F\u900F\u660E\u30C9\u30E9\u30C3\u30B0\u9818\u57DF\u306E\u9AD8\u3055\uFF08Windows\u306E\u307F\uFF09\u3002"
      },
      zh: {
        accentColor: "\u9ED8\u8BA4\u4F7F\u7528 Spotify \u7EFF\u8272\uFF0C\u81EA\u5B9A\u4E49\u4F7F\u7528\u4F60\u9009\u62E9\u7684\u56FA\u5B9A\u989C\u8272\uFF0C\u52A8\u6001\u4F1A\u6839\u636E\u5F53\u524D\u5C01\u9762\u8C03\u6574\u5F3A\u8C03\u8272\u3002",
        accentSource: "\u52A8\u6001\u989C\u8272\u7684\u53D6\u8272\u6765\u6E90\uFF1A\u5F53\u524D\u80CC\u666F\uFF08\u64AD\u653E\u5217\u8868\u3001\u81EA\u5B9A\u4E49\u56FE\u7247\u6216 URL\uFF09\uFF0C\u6216\u59CB\u7EC8\u4F7F\u7528\u6B4C\u66F2\u5C01\u9762\u3002",
        accentSatBoost: "\u589E\u5F3A\u4ECE\u5C01\u9762\u63D0\u53D6\u7684\u989C\u8272\u5F3A\u5EA6\uFF08\u4EC5\u52A8\u6001\u6A21\u5F0F\uFF09\u3002",
        accentLightBoost: "\u63D0\u9AD8\u4ECE\u5C01\u9762\u63D0\u53D6\u7684\u5F3A\u8C03\u8272\u4EAE\u5EA6\uFF08\u4EC5\u52A8\u6001\u6A21\u5F0F\uFF09\u3002",
        background: "\u52A8\u6001 = \u6A21\u7CCA\u5F53\u524D\u5C01\u9762\uFF0C\u52A8\u753B = \u79FB\u52A8\u6E10\u53D8\uFF0C\u64AD\u653E\u5217\u8868 = \u64AD\u653E\u5217\u8868\u56FE\u7247\uFF0C\u81EA\u5B9A\u4E49 = \u81EA\u5DF1\u7684\u56FE\u7247\uFF0CURL = \u56FE\u7247\u94FE\u63A5\u3002",
        animatedBackground: "\u8F7B\u5FAE\u52A8\u753B\u5316\u81EA\u5B9A\u4E49\u3001URL \u6216\u64AD\u653E\u5217\u8868\u80CC\u666F\u3002",
        artistBackground: "\u827A\u672F\u5BB6\u9875\u9762\u80CC\u540E\u663E\u793A\u4EC0\u4E48\uFF1A\u4E3B\u9898\u9ED8\u8BA4\u3001\u65E0\u3001\u81EA\u5B9A\u4E49\u56FE\u7247\u6216\u56FE\u7247 URL\u3002",
        artistScrollBlur: "\u5411\u4E0B\u6EDA\u52A8\u65F6\u827A\u672F\u5BB6\u6807\u9898\u56FE\u7247\u7684\u6A21\u7CCA\u7A0B\u5EA6\u3002",
        artistScrollBrightness: "\u5411\u4E0B\u6EDA\u52A8\u65F6\u827A\u672F\u5BB6\u6807\u9898\u56FE\u7247\u7684\u4EAE\u5EA6\u3002",
        performanceMode: "\u5173\u95ED SVG Liquid Glass \u6298\u5C04\uFF0C\u6539\u7528\u666E\u901A\u6A21\u7CCA\uFF0C\u5BF9 GPU \u66F4\u8F7B\u3002",
        glassBlur: "Liquid Glass \u8868\u9762\u80CC\u540E\u7684\u80CC\u666F\u6A21\u7CCA\u5F3A\u5EA6\u3002",
        popupBounce: "\u5F39\u7A97\u548C\u83DC\u5355\u6253\u5F00\u65F6\u7684\u5F39\u6027\u52A8\u753B\u3002",
        newHomescreenLayout: "\u5C06\u4E3B\u9875\u5206\u533A\u653E\u5165 glass \u5361\u7247\uFF0C\u5E76\u6574\u7406\u5361\u7247\u7F51\u683C\u9AD8\u5EA6\u3002",
        playerWidth: "\u9ED8\u8BA4 = Spotify \u5BBD\u5EA6\uFF0C\u4E3B\u9898 = Liquify \u5BBD\u5EA6\uFF0C\u81EA\u5B9A\u4E49 = \u5728\u4E0B\u65B9\u81EA\u884C\u8BBE\u7F6E\u3002",
        comfyCoverArt: "\u653E\u5927\u5DE6\u4E0B\u89D2\u6B63\u5728\u64AD\u653E\u7684\u5C01\u9762\uFF0C\u8BA9\u5916\u89C2\u66F4\u8212\u9002\u3002",
        floatingPlayer: "\u5C06\u64AD\u653E\u680F\u5206\u79BB\uFF0C\u5E76\u8BA9\u5B83\u5C45\u4E2D\u6D6E\u52A8\u5728\u5185\u5BB9\u5E95\u90E8\u4E0A\u65B9\u3002",
        transparentPlayer: "\u79FB\u9664\u5E95\u90E8\u64AD\u653E\u5668\u7684 glass \u6298\u5C04\uFF0C\u4F7F\u5176\u900F\u660E\u3002",
        compactPlayer: "\u5C06\u5E95\u90E8\u680F\u7F29\u5C0F\u4E3A\u4E00\u884C\uFF0C\u63A7\u4EF6\u548C\u8FDB\u5EA6\u5E76\u6392\u663E\u793A\u3002",
        playerControlIcons: "\u5C06 Spotify \u7684\u64AD\u653E\u3001\u6682\u505C\u548C\u8DF3\u8FC7\u56FE\u6807\u66FF\u6362\u4E3A Liquify \u81EA\u5DF1\u7684\u5A92\u4F53\u64AD\u653E\u5668\u56FE\u6807\u3002",
        connectBar: "\u901A\u8FC7 Spotify Connect \u5728\u5176\u4ED6\u8BBE\u5907\u64AD\u653E\u65F6\u51FA\u73B0\u7684\u680F\u3002",
        nextSongCard: "\u663E\u793A\u4E0B\u4E00\u9996\u66F2\u76EE\u7684\u5C0F\u9884\u89C8\u5361\u3002",
        canvasCoverArt: "\u5728 Now Playing \u4E2D\u6DFB\u52A0\u5C01\u9762\uFF1A\u4F4D\u4E8E\u66F2\u76EE\u4FE1\u606F\u65C1\u3001\u5916\u4FA7\u6216\u5173\u95ED\u3002",
        canvasShowAlways: "\u5373\u4F7F\u64AD\u653E Canvas/\u89C6\u9891\u4E5F\u4FDD\u6301\u5C01\u9762\u53EF\u89C1\u3002",
        playlistHeaderBox: "\u7528 glass \u6846\u5305\u4F4F\u64AD\u653E\u5217\u8868\u6807\u9898\u3002",
        progressBarCompat: "\u963B\u6B62\u4E3B\u9898\u5BF9\u8FDB\u5EA6\u6761\u548C\u97F3\u91CF\u6761\u5E94\u7528\u6837\u5F0F\uFF0C\u4EE5\u4FBF\u5176\u4ED6\u6269\u5C55\u63A7\u5236\u5B83\u4EEC\u3002\u4F1A\u9690\u85CF\u4E0A\u65B9\u7684\u9AD8\u5EA6\u548C\u5706\u89D2\u9009\u9879\u3002",
        actionBarBox: "\u7528 glass \u6846\u5305\u4F4F\u64AD\u653E\u5217\u8868\u64CD\u4F5C\u680F\uFF08\u64AD\u653E/\u968F\u673A\u884C\uFF09\u3002",
        themedLyrics: "\u5C06\u6B4C\u8BCD\u9875\u9762\u6837\u5F0F\u4E0E\u4E3B\u9898\u5339\u914D\uFF08Glass + \u5F3A\u8C03\u8272\uFF09\u3002",
        transparentWidth: "\u4E3A\u7A97\u53E3\u6309\u94AE\u4FDD\u7559\u7684\u900F\u660E\u62D6\u62FD\u533A\u57DF\u5BBD\u5EA6\uFF08\u4EC5 Windows\uFF09\u3002",
        transparentHeight: "\u4E3A\u7A97\u53E3\u6309\u94AE\u4FDD\u7559\u7684\u900F\u660E\u62D6\u62FD\u533A\u57DF\u9AD8\u5EA6\uFF08\u4EC5 Windows\uFF09\u3002"
      },
      ko: {
        accentColor: "\uAE30\uBCF8\uAC12\uC740 Spotify \uCD08\uB85D\uC0C9, \uC0AC\uC6A9\uC790 \uC9C0\uC815\uC740 \uACE0\uC815 \uC0C9\uC0C1, \uB3D9\uC801\uC740 \uD604\uC7AC \uCEE4\uBC84\uC5D0 \uB9DE\uCDB0 \uAC15\uC870\uC0C9\uC744 \uC870\uC815\uD569\uB2C8\uB2E4.",
        accentSource: "\uB3D9\uC801 \uC0C9\uC0C1\uC744 \uAC00\uC838\uC62C \uC774\uBBF8\uC9C0: \uD604\uC7AC \uBC30\uACBD(\uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8, \uB0B4 \uC774\uBBF8\uC9C0 \uB610\uB294 URL) \uB610\uB294 \uD56D\uC0C1 \uACE1 \uCEE4\uBC84.",
        accentSatBoost: "\uCEE4\uBC84\uC5D0\uC11C \uAC00\uC838\uC628 \uC0C9\uC0C1\uC744 \uC5BC\uB9C8\uB098 \uAC15\uD558\uAC8C \uD560\uC9C0 \uC124\uC815\uD569\uB2C8\uB2E4(\uB3D9\uC801 \uBAA8\uB4DC\uB9CC).",
        accentLightBoost: "\uCEE4\uBC84\uC5D0\uC11C \uAC00\uC838\uC628 \uAC15\uC870\uC0C9\uC744 \uC5BC\uB9C8\uB098 \uBC1D\uAC8C \uD560\uC9C0 \uC124\uC815\uD569\uB2C8\uB2E4(\uB3D9\uC801 \uBAA8\uB4DC\uB9CC).",
        background: "\uB3D9\uC801 = \uD604\uC7AC \uCEE4\uBC84 \uD750\uB9BC, \uC560\uB2C8\uBA54\uC774\uC158 = \uC6C0\uC9C1\uC774\uB294 \uADF8\uB77C\uB370\uC774\uC158, \uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8 = \uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8 \uC774\uBBF8\uC9C0, \uC0AC\uC6A9\uC790 \uC9C0\uC815 = \uB0B4 \uC774\uBBF8\uC9C0, URL = \uC774\uBBF8\uC9C0 \uB9C1\uD06C.",
        animatedBackground: "\uC0AC\uC6A9\uC790 \uC9C0\uC815, URL \uB610\uB294 \uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8 \uBC30\uACBD\uC744 \uC740\uC740\uD558\uAC8C \uC560\uB2C8\uBA54\uC774\uC158\uD569\uB2C8\uB2E4.",
        artistBackground: "\uC544\uD2F0\uC2A4\uD2B8 \uD398\uC774\uC9C0 \uB4A4\uC5D0 \uD45C\uC2DC\uD560 \uD56D\uBAA9: \uD14C\uB9C8 \uAE30\uBCF8\uAC12, \uC5C6\uC74C, \uB0B4 \uC774\uBBF8\uC9C0 \uB610\uB294 \uC774\uBBF8\uC9C0 URL.",
        artistScrollBlur: "\uC544\uB798\uB85C \uC2A4\uD06C\uB864\uD560 \uB54C \uC544\uD2F0\uC2A4\uD2B8 \uD5E4\uB354 \uC774\uBBF8\uC9C0\uC758 \uD750\uB9BC \uC815\uB3C4.",
        artistScrollBrightness: "\uC544\uB798\uB85C \uC2A4\uD06C\uB864\uD560 \uB54C \uC544\uD2F0\uC2A4\uD2B8 \uD5E4\uB354 \uC774\uBBF8\uC9C0\uC758 \uBC1D\uAE30.",
        performanceMode: "SVG Liquid Glass \uAD74\uC808\uC744 \uB044\uACE0 \uC77C\uBC18 \uD750\uB9BC\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4 - GPU \uBD80\uB2F4\uC774 \uB354 \uB0AE\uC2B5\uB2C8\uB2E4.",
        glassBlur: "Liquid Glass \uD45C\uBA74 \uB4A4\uC758 \uBC30\uACBD \uD750\uB9BC \uAC15\uB3C4.",
        popupBounce: "\uD31D\uC5C5\uACFC \uBA54\uB274\uAC00 \uC5F4\uB9B4 \uB54C\uC758 \uD0C4\uC131 \uC560\uB2C8\uBA54\uC774\uC158.",
        newHomescreenLayout: "\uD648 \uC139\uC158\uC744 glass \uCE74\uB4DC\uB85C \uAC10\uC2F8\uACE0 \uCE74\uB4DC \uADF8\uB9AC\uB4DC \uB192\uC774\uB97C \uC815\uB3C8\uD569\uB2C8\uB2E4.",
        playerWidth: "\uAE30\uBCF8\uAC12 = Spotify \uB108\uBE44, \uD14C\uB9C8 = Liquify \uB108\uBE44, \uC0AC\uC6A9\uC790 \uC9C0\uC815 = \uC544\uB798\uC5D0\uC11C \uC9C1\uC811 \uC124\uC815.",
        comfyCoverArt: "\uC67C\uCABD \uC544\uB798 \uC7AC\uC0DD \uC911 \uCEE4\uBC84\uB97C \uB354 \uD06C\uAC8C \uBCF4\uC5EC \uC90D\uB2C8\uB2E4.",
        floatingPlayer: "\uC7AC\uC0DD \uBC14\uB97C \uBD84\uB9AC\uD574 \uCF58\uD150\uCE20 \uC704\uCABD\uC758 \uD558\uB2E8 \uC911\uC559\uC5D0 \uB744\uC6C1\uB2C8\uB2E4.",
        transparentPlayer: "\uD558\uB2E8 \uD50C\uB808\uC774\uC5B4\uC758 glass \uAD74\uC808\uC744 \uC81C\uAC70\uD574 \uD22C\uBA85\uD558\uAC8C \uB9CC\uB4ED\uB2C8\uB2E4.",
        compactPlayer: "\uD558\uB2E8 \uBC14\uB97C \uCEE8\uD2B8\uB864\uACFC \uC9C4\uD589\uB960\uC774 \uB098\uB780\uD788 \uC788\uB294 \uD55C \uC904\uB85C \uC904\uC785\uB2C8\uB2E4.",
        playerControlIcons: "Spotify\uC758 \uC7AC\uC0DD, \uC77C\uC2DC\uC815\uC9C0, \uAC74\uB108\uB6F0\uAE30 \uC544\uC774\uCF58\uC744 Liquify \uACE0\uC720\uC758 \uBBF8\uB514\uC5B4 \uD50C\uB808\uC774\uC5B4 \uC544\uC774\uCF58\uC73C\uB85C \uBC14\uAFC9\uB2C8\uB2E4.",
        connectBar: "Spotify Connect\uB85C \uB2E4\uB978 \uAE30\uAE30\uC5D0\uC11C \uC7AC\uC0DD \uC911\uC77C \uB54C \uB098\uD0C0\uB098\uB294 \uBC14\uC785\uB2C8\uB2E4.",
        nextSongCard: "\uB2E4\uC74C \uD2B8\uB799\uC758 \uC791\uC740 \uBBF8\uB9AC\uBCF4\uAE30 \uCE74\uB4DC\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        canvasCoverArt: "Now Playing \uBCF4\uAE30\uC5D0\uC11C \uCEE4\uBC84\uB97C \uCD94\uAC00\uD569\uB2C8\uB2E4: \uD2B8\uB799 \uC815\uBCF4 \uC606, \uBC16 \uB610\uB294 \uB044\uAE30.",
        canvasShowAlways: "Canvas/\uBE44\uB514\uC624\uAC00 \uC7AC\uC0DD \uC911\uC774\uC5B4\uB3C4 \uCEE4\uBC84\uB97C \uACC4\uC18D \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        playlistHeaderBox: "\uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8 \uD5E4\uB354\uB97C glass \uBC15\uC2A4\uB85C \uAC10\uC309\uB2C8\uB2E4.",
        progressBarCompat: "\uD14C\uB9C8\uAC00 \uC9C4\uD589 \uBC14\uC640 \uBCFC\uB968 \uBC14\uC5D0 \uC2A4\uD0C0\uC77C\uC744 \uC801\uC6A9\uD558\uC9C0 \uC54A\uB3C4\uB85D \uD558\uC5EC \uB2E4\uB978 \uD655\uC7A5\uC774 \uC81C\uC5B4\uD560 \uC218 \uC788\uAC8C \uD569\uB2C8\uB2E4. \uC704\uC758 \uB192\uC774\uC640 \uBC18\uACBD \uC635\uC158\uC774 \uC228\uACA8\uC9D1\uB2C8\uB2E4.",
        actionBarBox: "\uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8 \uC561\uC158 \uBC14(\uC7AC\uC0DD/\uC154\uD50C \uD589)\uB97C glass \uBC15\uC2A4\uB85C \uAC10\uC309\uB2C8\uB2E4.",
        themedLyrics: "\uAC00\uC0AC \uD398\uC774\uC9C0\uB97C \uD14C\uB9C8\uC5D0 \uB9DE\uAC8C \uC2A4\uD0C0\uC77C\uB9C1\uD569\uB2C8\uB2E4(Glass + \uAC15\uC870\uC0C9).",
        transparentWidth: "\uCC3D \uBC84\uD2BC\uC6A9 \uD22C\uBA85 \uB4DC\uB798\uADF8 \uC601\uC5ED\uC758 \uB108\uBE44\uC785\uB2C8\uB2E4(Windows \uC804\uC6A9).",
        transparentHeight: "\uCC3D \uBC84\uD2BC\uC6A9 \uD22C\uBA85 \uB4DC\uB798\uADF8 \uC601\uC5ED\uC758 \uB192\uC774\uC785\uB2C8\uB2E4(Windows \uC804\uC6A9)."
      }
    };
    return tips[lang] || settingsCopy.tooltips;
  }
  function getClientLanguage() {
    const raw = (Spicetify?.Platform?.Session?.locale || Spicetify?.Platform?.Session?.language || navigator.language || "en").toString().toLowerCase();
    const base = raw.split(/[-_]/)[0];
    if (raw.startsWith("zh")) return "zh";
    if (raw.startsWith("pt")) return "pt";
    return base;
  }
  function getTranslation() {
    const lang = getClientLanguage();
    return deepMerge(settingsCopy, liquifyTranslations[lang] || liquifyTranslations.en);
  }

  // src/settings/components/Onboarding.tsx
  var LL_USER = "NMWplays";
  var LL_REPO = "Liquid-Lyrics";
  var LL_BRANCHES = ["main", "master"];
  var EXIT_MS = 250;
  async function fetchJson(url) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
  var MP_DB = "spicetify-marketplace";
  var MP_STORE = "settings";
  function openMarketplaceDb() {
    return new Promise((resolve) => {
      try {
        let storeCreated = false;
        const request = indexedDB.open(MP_DB);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(MP_STORE)) {
            db.createObjectStore(MP_STORE, { keyPath: "key" });
            storeCreated = true;
          }
        };
        request.onsuccess = () => resolve({ db: request.result, storeCreated });
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  function idbRead(db, key) {
    return new Promise((resolve) => {
      try {
        const request = db.transaction(MP_STORE, "readonly").objectStore(MP_STORE).get(key);
        request.onsuccess = () => resolve(request.result?.value ?? null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  function idbWrite(db, entries) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(MP_STORE, "readwrite");
        const store = tx.objectStore(MP_STORE);
        for (const [key, value] of entries) store.put({ key, value });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }
  function parseKeyList(raw) {
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((k) => typeof k === "string") : [];
    } catch {
      return [];
    }
  }
  var MP_LIST_KEY = "marketplace:installed-extensions";
  var LL_KEY_PREFIX = `marketplace:installed:${LL_USER}/${LL_REPO}/`;
  function localLiquidLyricsKeys() {
    const keys = [];
    try {
      for (let i2 = 0; i2 < localStorage.length; i2++) {
        const key = localStorage.key(i2);
        if (key && key.startsWith(LL_KEY_PREFIX)) keys.push(key);
      }
    } catch {
    }
    return keys;
  }
  async function reconcileLiquidLyricsInstall() {
    const staleKeys = localLiquidLyricsKeys();
    if (!staleKeys.length) return;
    const opened = await openMarketplaceDb();
    if (!opened) return;
    const { db, storeCreated } = opened;
    try {
      if (storeCreated || await idbRead(db, MP_LIST_KEY) === null) return;
      for (const key of staleKeys) {
        if (await idbRead(db, key) === null) {
          try {
            localStorage.removeItem(key);
          } catch {
          }
        }
      }
    } finally {
      db.close();
    }
  }
  async function fetchRepoMeta() {
    const repo = await fetchJson(`https://api.github.com/repos/${LL_USER}/${LL_REPO}`);
    if (!repo) return null;
    return {
      stars: Number(repo.stargazers_count) || 0,
      created: typeof repo.created_at === "string" ? repo.created_at : "",
      lastUpdated: typeof repo.pushed_at === "string" ? repo.pushed_at : repo.updated_at || ""
    };
  }
  async function installLiquidLyrics() {
    try {
      let branch = "";
      let manifestRaw = null;
      for (const b2 of LL_BRANCHES) {
        manifestRaw = await fetchJson(`https://raw.githubusercontent.com/${LL_USER}/${LL_REPO}/${b2}/manifest.json`);
        if (manifestRaw) {
          branch = b2;
          break;
        }
      }
      if (!manifestRaw) return false;
      const manifest = Array.isArray(manifestRaw) ? manifestRaw.find((m2) => m2 && m2.main) || manifestRaw[0] : manifestRaw;
      if (!manifest || !manifest.main) return false;
      const rawBase = `https://raw.githubusercontent.com/${LL_USER}/${LL_REPO}/${branch}`;
      const isAbsolute = (u2) => /^https?:\/\//i.test(u2);
      const resolve = (p2) => p2 ? isAbsolute(p2) ? p2 : `${rawBase}/${String(p2).replace(/^\.?\//, "")}` : "";
      const main = String(manifest.main);
      const key = `${LL_KEY_PREFIX}${main}`;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const meta = await fetchRepoMeta();
      const entry = {
        manifest,
        type: "extension",
        title: manifest.name || LL_REPO,
        subtitle: manifest.description || "",
        authors: manifest.authors || [{ name: LL_USER, url: `https://github.com/${LL_USER}` }],
        user: LL_USER,
        repo: LL_REPO,
        branch,
        imageURL: resolve(manifest.preview),
        extensionURL: resolve(main),
        readmeURL: resolve(manifest.readme || "README.md"),
        stars: meta?.stars ?? 0,
        lastUpdated: meta?.lastUpdated || now,
        created: meta?.created || now
      };
      const entryJson = JSON.stringify(entry);
      const opened = await openMarketplaceDb();
      const storedList = opened ? await idbRead(opened.db, MP_LIST_KEY) : null;
      const list = parseKeyList(storedList ?? localStorage.getItem(MP_LIST_KEY));
      if (!list.includes(key)) list.push(key);
      const listJson = JSON.stringify(list);
      let written = false;
      if (opened) {
        written = await idbWrite(opened.db, [[key, entryJson], [MP_LIST_KEY, listJson]]);
        opened.db.close();
      }
      if (written) {
        try {
          localStorage.removeItem(key);
        } catch {
        }
      } else {
        try {
          localStorage.setItem(key, entryJson);
          localStorage.setItem(MP_LIST_KEY, listJson);
          written = true;
        } catch {
        }
      }
      return written;
    } catch {
      return false;
    }
  }
  function ensureOnboardingStyle() {
    if (document.getElementById("liquify-onboarding-style")) return;
    const style = document.createElement("style");
    style.id = "liquify-onboarding-style";
    style.textContent = `
    /* Transparent full-screen blocker so the app underneath can't be clicked
       mid-tour (also stops a stray click from closing the settings panel on the
       last step). Sits below the spotlight and the cards. */
    .lqObBlocker {
      position: fixed; inset: 0; z-index: 100001;
      background: transparent; pointer-events: all;
      animation: lqObFadeIn 320ms ease-out both;
    }

    /* Spotlight = an accent ring whose huge box-shadow dims everything else,
       punching a "hole" around the highlighted button. */
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

    /* Centered cards live in a non-interactive flex wrapper, so the card's own
       transform is pure scale/translate \u2014 no translate(-50%,-50%) for the
       keyframes to fight (that was the old "slides in from the corner" glitch). */
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
      /* Enter: settings-panel bounce curve. */
      animation: lqObCardIn 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .lqObCenter .lqObCard { position: relative; }
    /* Exit: snappy ease-in, matching the settings panel close. */
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
  var GearIcon = () => /* @__PURE__ */ React.createElement(
    "svg",
    {
      role: "img",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      focusable: "false",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "butt",
      strokeLinejoin: "miter",
      style: { width: 16, height: 16, flexShrink: 0 }
    },
    /* @__PURE__ */ React.createElement("path", { vectorEffect: "non-scaling-stroke", d: "M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" }),
    /* @__PURE__ */ React.createElement("path", { vectorEffect: "non-scaling-stroke", d: "M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" })
  );
  var LyricsIcon = () => /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 16 16",
      fill: "currentColor",
      "aria-hidden": "true",
      focusable: "false",
      style: { width: 14, height: 14, flexShrink: 0 }
    },
    /* @__PURE__ */ React.createElement("path", { d: "M13 2.5a.75.75 0 0 0-.93-.728l-6 1.5A.75.75 0 0 0 5.5 4v6.04A2.5 2.5 0 1 0 7 12.5V6.586l4.5-1.125v3.579A2.5 2.5 0 1 0 13 11.5z" })
  );
  var DownloadIcon = () => /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: { width: 13, height: 13, flexShrink: 0 }
    },
    /* @__PURE__ */ React.createElement("path", { d: "M8 2v8" }),
    /* @__PURE__ */ React.createElement("polyline", { points: "4.5,7 8,10.5 11.5,7" }),
    /* @__PURE__ */ React.createElement("path", { d: "M3 13.5h10" })
  );
  var CheckIcon = () => /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: { width: 13, height: 13, flexShrink: 0 }
    },
    /* @__PURE__ */ React.createElement("polyline", { points: "2,9 6,13 14,3" })
  );
  var ArrowIcon = () => /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: { width: 13, height: 13, flexShrink: 0 }
    },
    /* @__PURE__ */ React.createElement("polyline", { points: "5,2 11,8 5,14" })
  );
  function Dots(props) {
    return /* @__PURE__ */ React.createElement("div", { className: "lqObDots" }, [0, 1, 2].map((i2) => /* @__PURE__ */ React.createElement("div", { key: i2, className: "lqObDot" + (i2 === props.active ? " active" : "") })));
  }
  function LiquifyOnboarding(props) {
    const t = getTranslation();
    const ob = t.onboarding || {};
    const [renderStep, setRenderStep] = React.useState(0);
    const [exiting, setExiting] = React.useState(false);
    const [gearRect, setGearRect] = React.useState(null);
    const [installState, setInstallState] = React.useState("idle");
    const pendingReloadRef = React.useRef(false);
    React.useEffect(() => {
      ensureOnboardingStyle();
      const btn = document.getElementById("liquify-settings-gear-btn");
      if (btn) {
        const r = btn.getBoundingClientRect();
        setGearRect({ top: r.top, left: r.left, right: r.right, width: r.width, height: r.height });
      }
    }, []);
    const PAD = 6;
    const spotStyle = gearRect ? {
      top: gearRect.top - PAD,
      left: gearRect.left - PAD,
      width: gearRect.width + PAD * 2,
      height: gearRect.height + PAD * 2
    } : {};
    const cardRight = gearRect ? Math.max(12, window.innerWidth - gearRect.right - PAD) : 16;
    const cardTop = gearRect ? gearRect.top + gearRect.height + PAD + 12 : 80;
    const transitionTo = (next, atSwap) => {
      setExiting(true);
      setTimeout(() => {
        atSwap?.();
        setExiting(false);
        setRenderStep(next);
      }, EXIT_MS);
    };
    const goToLyrics = () => transitionTo(1);
    const openSettings = () => {
      if (typeof window.showLiquifySettingsMenu === "function") {
        try {
          window.showLiquifySettingsMenu();
        } catch {
        }
      }
    };
    const goToSettings = () => transitionTo(2, openSettings);
    const handleInstall = async () => {
      if (installState === "installing") return;
      setInstallState("installing");
      const ok = await installLiquidLyrics();
      if (ok) {
        pendingReloadRef.current = true;
        setInstallState("done");
        setTimeout(goToSettings, 650);
      } else {
        setInstallState("failed");
      }
    };
    const finish = () => {
      setExiting(true);
      setTimeout(() => {
        const overlay = document.getElementById("liquify-settings-react-overlay");
        if (overlay) {
          overlay.classList.remove("overlay-visible");
          overlay.classList.add("overlay-closing");
          document.querySelectorAll("body > .liquifyTooltipPopup, body > .liquifySectionNavScrollBtn").forEach((el) => {
            el.style.display = "none";
          });
          setTimeout(() => {
            try {
              ReactDOM.unmountComponentAtNode(overlay.querySelector("div"));
            } catch {
            }
            document.querySelectorAll("body > .liquifyTooltipPopup, body > .liquifySectionNavScrollBtn").forEach((el) => el.remove());
            overlay.remove();
          }, 400);
        }
        localStorage.setItem("liquify-onboarding-done", "1");
        props.onFinish();
        if (pendingReloadRef.current) {
          setTimeout(() => {
            try {
              window.location.reload();
            } catch {
            }
          }, 250);
        }
      }, EXIT_MS);
    };
    const cardCls = "lqObCard" + (exiting ? " is-out" : "");
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "lqObBlocker" }), renderStep === 0 && gearRect && /* @__PURE__ */ React.createElement("div", { className: "lqObSpot" + (exiting ? " is-out" : ""), style: spotStyle }), renderStep === 0 && /* @__PURE__ */ React.createElement("div", { className: cardCls, style: { top: cardTop, right: cardRight, width: 280, transformOrigin: "top right" } }, /* @__PURE__ */ React.createElement("div", { className: "lqObArrow" }), /* @__PURE__ */ React.createElement(Dots, { active: 0 }), /* @__PURE__ */ React.createElement("div", { className: "lqObContent" }, /* @__PURE__ */ React.createElement("div", { className: "lqObBrand" }, ob.welcomeTag || "Welcome to", " Liquify V2"), /* @__PURE__ */ React.createElement("div", { className: "lqObTitle" }, /* @__PURE__ */ React.createElement(GearIcon, null), ob.step1Title || "Liquify Settings V3"), /* @__PURE__ */ React.createElement("p", { className: "lqObText" }, ob.step1Text || "This button opens Liquify Settings V3 for Liquify Theme V2. Customize backgrounds, accent colors, the player, animations and much more.")), /* @__PURE__ */ React.createElement("div", { className: "lqObActions" }, /* @__PURE__ */ React.createElement("button", { className: "lqObBtn lqObBtnPrimary", type: "button", onClick: goToLyrics }, ob.nextBtn || "Next", /* @__PURE__ */ React.createElement(ArrowIcon, null)))), renderStep === 1 && /* @__PURE__ */ React.createElement("div", { className: "lqObCenter" }, /* @__PURE__ */ React.createElement("div", { className: cardCls, style: { width: 320 } }, /* @__PURE__ */ React.createElement(Dots, { active: 1 }), /* @__PURE__ */ React.createElement("div", { className: "lqObContent" }, /* @__PURE__ */ React.createElement("div", { className: "lqObTitle" }, /* @__PURE__ */ React.createElement(LyricsIcon, null), ob.lyricsTitle || "Liquid Lyrics"), /* @__PURE__ */ React.createElement("p", { className: "lqObText" }, ob.lyricsText || "Liquid Lyrics is the official lyrics extension for Liquify Theme V2 - it makes the theme feel complete, and it's the only lyrics extension officially supported by the theme. Install it from the Marketplace?"), installState === "done" && /* @__PURE__ */ React.createElement("p", { className: "lqObNote isInfo" }, ob.lyricsReloadNote || "Liquify will reload once you finish to load Liquid Lyrics."), installState === "failed" && /* @__PURE__ */ React.createElement("p", { className: "lqObNote isError" }, ob.lyricsFailed || "Couldn't auto-install \u2014 you can grab Liquid Lyrics from the Marketplace.")), /* @__PURE__ */ React.createElement("div", { className: "lqObActions isSplit" }, /* @__PURE__ */ React.createElement("button", { className: "lqObBtn lqObBtnGhost", type: "button", onClick: goToSettings, disabled: installState === "installing" }, ob.lyricsSkipBtn || "Maybe later"), /* @__PURE__ */ React.createElement("button", { className: "lqObBtn lqObBtnPrimary", type: "button", onClick: handleInstall, disabled: installState === "installing" || installState === "done" }, installState === "installing" ? ob.lyricsInstalling || "Installing\u2026" : installState === "done" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(CheckIcon, null), ob.lyricsInstalled || "Installed") : installState === "failed" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(DownloadIcon, null), ob.lyricsRetryBtn || "Retry") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(DownloadIcon, null), ob.lyricsInstallBtn || "Install"))))), renderStep === 2 && /* @__PURE__ */ React.createElement("div", { className: "lqObCenter" }, /* @__PURE__ */ React.createElement("div", { className: cardCls, style: { width: 320 } }, /* @__PURE__ */ React.createElement(Dots, { active: 2 }), /* @__PURE__ */ React.createElement("div", { className: "lqObContent" }, /* @__PURE__ */ React.createElement("div", { className: "lqObTitle" }, ob.step2Title || "Explore your Settings"), /* @__PURE__ */ React.createElement("p", { className: "lqObText" }, ob.step2Text || "All Liquify Settings V3 options live here, and changes are saved instantly. Close the panel anytime with the close button or by clicking outside.")), /* @__PURE__ */ React.createElement("div", { className: "lqObActions" }, /* @__PURE__ */ React.createElement("button", { className: "lqObBtn lqObBtnPrimary", type: "button", onClick: finish }, /* @__PURE__ */ React.createElement(CheckIcon, null), ob.gotItBtn || "Got it")))));
  }
  async function startLiquifyOnboarding() {
    if (localStorage.getItem("liquify-onboarding-done")) return;
    let tries = 0;
    while (!document.getElementById("liquify-settings-gear-btn") && tries < 50) {
      await sleep2(200);
      tries++;
    }
    if (!document.getElementById("liquify-settings-gear-btn")) return;
    await sleep2(400);
    const container = document.createElement("div");
    container.id = "liquify-onboarding-root";
    document.body.appendChild(container);
    const finish = () => {
      try {
        ReactDOM.unmountComponentAtNode(container);
      } catch {
      }
      container.remove();
    };
    ReactDOM.render(/* @__PURE__ */ React.createElement(LiquifyOnboarding, { onFinish: finish }), container);
  }

  // src/settings/features/accent.ts
  var lastDynamicColor = null;
  function resetDynamicAccentCache() {
    lastDynamicColor = null;
  }
  function applyAccent2(color) {
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
    .e-10310-legacy-button-primary:hover .e-10310-button-primary__inner { background-color: ${color} !important; }
    .e-10310-legacy-button-primary:active .e-10310-button-primary__inner { background-color: ${color} !important; }
    .e-10310-legacy-chip:hover > .e-10310-legacy-chip__inner.e-10310-legacy-chip__inner--selected { background-color: ${color} !important; }
    [class*="-legacy-button-primary"]:hover > [class*="-button-primary__inner"] { background-color: ${color} !important; }
    [class*="-legacy-button-primary"]:active > [class*="-button-primary__inner"] { background-color: ${color} !important; }
    [class*="-legacy-chip"]:hover > [class*="-legacy-chip__inner"][class*="--selected"] { background-color: ${color} !important; }
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
    applyAccent2(dynamicColor);
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
    .e-10310-legacy-button-primary:hover .e-10310-button-primary__inner { background-color: #3be477; }
    .e-10310-legacy-button-primary:active .e-10310-button-primary__inner { background-color: #3be477; }
    .e-10310-legacy-chip:hover > .e-10310-legacy-chip__inner.e-10310-legacy-chip__inner--selected { background-color: #3be477; }
    [class*="-legacy-button-primary"]:hover > [class*="-button-primary__inner"] { background-color: #3be477; }
    [class*="-legacy-button-primary"]:active > [class*="-button-primary__inner"] { background-color: #3be477; }
    [class*="-legacy-chip"]:hover > [class*="-legacy-chip__inner"][class*="--selected"] { background-color: #3be477; }
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

  // src/settings/features/artistScrollEffect.ts
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

  // src/settings/features/background.ts
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
    if (root) {
      if (mode === "custom" && image) {
        root.style.setProperty("--image_url", `url("${image}")`);
      } else if (mode === "url" && bgUrl) {
        root.style.setProperty("--image_url", `url("${bgUrl}")`);
      }
    }
    window.dispatchEvent(new Event("liquifyBackgroundChange"));
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
      } catch {
        return false;
      }
    }
    function getImgElem(el) {
      if (!el) return null;
      if (el.tagName === "IMG") return el;
      return el.querySelector?.("img") ?? null;
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
        if (!artistFound && m2.type === "attributes" && m2.target?.matches?.(ART_SELECTOR)) artistFound = true;
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
      } catch {
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
          await sleep2(RETRY_DELAY);
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

  // src/settings/features/backgroundAppearance.ts
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

  // src/settings/features/playbarCoverRadius.ts
  var PLAYBAR_COVER_BORDER_RADIUS_KEY = "liquify-playbar-cover-border-radius";
  var PLAYBAR_COVER_DEFAULTS = { borderRadius: 12 };
  var LEGACY_PLAYBAR_COVER_DEFAULT_RADIUS = 8;
  function applyPlaybarCoverBorderRadius(px) {
    const css = `
    .main-nowPlayingWidget-coverArtContainer { border-radius: ${px}px !important; }
    .main-nowPlayingWidget-coverArtContainer img { border-radius: ${px}px !important; }
  `;
    updateStyle("liquify-playbar-cover-radius", css);
    localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, String(px));
  }
  function ensurePlaybarCoverBorderRadiusApplied() {
    const comfyEnabled = readLS("liquify-comfy-cover-enabled", "hide");
    let saved = readNum(PLAYBAR_COVER_BORDER_RADIUS_KEY, PLAYBAR_COVER_DEFAULTS.borderRadius);
    if (comfyEnabled === "hide" && saved === LEGACY_PLAYBAR_COVER_DEFAULT_RADIUS) {
      saved = PLAYBAR_COVER_DEFAULTS.borderRadius;
      localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, String(saved));
    }
    applyPlaybarCoverBorderRadius(saved);
  }

  // src/settings/features/comfyCoverArt.ts
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
  function applyComfyCoverArt(setDefaultRadius = true) {
    const enabled = readLS(CCA_ENABLED_KEY, CCA_DEFAULTS.enabled);
    if (enabled === "hide") {
      updateStyle("liquify-comfy-cover-art", "");
      if (setDefaultRadius) {
        localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, "12");
        applyPlaybarCoverBorderRadius(12);
        window.dispatchEvent(new Event("liquifyPlaybarCoverRadiusChange"));
      }
      return;
    }
    if (setDefaultRadius) {
      localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, "20");
      applyPlaybarCoverBorderRadius(20);
      window.dispatchEvent(new Event("liquifyPlaybarCoverRadiusChange"));
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
    .main-nowPlayingWidget-coverArtContainer {
      margin-bottom: ${mb}px !important;
      margin-left: ${ml}px !important;
    }
  `;
    updateStyle("liquify-comfy-cover-art", css);
  }

  // src/settings/features/coverSwipe.ts
  function installCoverSwipe() {
    (() => {
      const anyWin = window;
      const STYLE_ID10 = "cs-cover-swipe";
      const TRACK_ID = "cs-track";
      const DURATION = 300;
      const FADE = 250;
      const CANVAS_SCALE = 1.1;
      const CANVAS_FADE = 500;
      const SAME_SONG_THRESHOLD = 3e3;
      const POST_CANVAS_GRACE = 600;
      const CANVAS_GAP_GRACE = 150;
      const CANVAS_SEL = ".main-nowPlayingView-canvasVisualEnhancement";
      const VIDEO_SEL = "#VideoPlayerNpv_ReactPortal";
      const CINEMA_SEL = ".Root__cinema-view";
      const CONTAINER_SEL = ".main-nowPlayingView-coverArtContainer";
      document.getElementById(STYLE_ID10)?.remove();
      anyWin.__coverSwipeOff?.();
      const style = document.createElement("style");
      style.id = STYLE_ID10;
      style.textContent = `
        ${CONTAINER_SEL}:has(#${TRACK_ID}) .main-nowPlayingView-coverArt {
            visibility: hidden !important;
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
        /* When a Canvas/video takes over, the cover doesn't just fade \u2014 it
           expands downward toward the canvas (top-anchored scale) and collapses
           back into itself when the canvas leaves. */
        #${TRACK_ID}.cs-hidden { opacity: 0; transform: scale(${CANVAS_SCALE}); }
        #${TRACK_ID}::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            box-shadow: var(--liquify-shadow);
            pointer-events: none;
            z-index: 10;
        }
        #${TRACK_ID} .cs-clip {
            position: absolute;
            inset: 0;
            overflow: hidden;
            border-radius: 20px;
        }
        #${TRACK_ID} .cs-slot {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 20px;
            will-change: transform;
        }
        #${TRACK_ID} .cs-current { transform: translateX(0); }
        #${TRACK_ID} .cs-next    { transform: translateX(100%); }
        #${TRACK_ID} .cs-prev    { transform: translateX(-100%); }
        #${TRACK_ID}.cs-animating .cs-slot {
            transition: transform ${DURATION}ms cubic-bezier(.4,0,.2,1);
        }
        #${TRACK_ID}.cs-animating.cs-going-next .cs-current { transform: translateX(-100%); }
        #${TRACK_ID}.cs-animating.cs-going-next .cs-next    { transform: translateX(0); }
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-current { transform: translateX(100%); }
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-prev    { transform: translateX(0); }
        #${TRACK_ID} .cs-fade-overlay {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 20px;
            opacity: 0;
            pointer-events: none;
            z-index: 5;
        }
        #${TRACK_ID} .cs-fade-overlay.cs-fade-in {
            transition: opacity ${FADE}ms ease;
            opacity: 1;
        }
    `;
      document.head.appendChild(style);
      const trackToImageUrl = (t) => {
        if (!t) return "";
        const ctx = t.contextTrack || t;
        const meta = ctx.metadata || {};
        const uri = meta.image_xlarge_url || meta.image_large_url || meta.image_url || meta.image_small_url;
        if (uri) {
          if (uri.startsWith("http")) return uri;
          if (uri.startsWith("spotify:image:")) return "https://i.scdn.co/image/" + uri.split(":")[2];
          return uri;
        }
        const imgs = ctx.album?.images || t.album?.images;
        if (Array.isArray(imgs) && imgs[0]?.url) return imgs[0].url;
        return "";
      };
      const trackToUri = (t) => {
        if (!t) return "";
        const ctx = t.contextTrack || t;
        return ctx.uri || ctx.contextUri || t.uri || "";
      };
      const getQueue = () => anyWin.Spicetify?.Queue || anyWin.Spicetify?.Platform?.PlayerAPI?._queue || {};
      const getCurrentItem = () => {
        try {
          const data = anyWin.Spicetify?.Player?.data;
          return data?.item || data?.track || null;
        } catch {
          return null;
        }
      };
      const getCurrentCoverUrl = () => {
        const url = trackToImageUrl(getCurrentItem());
        if (url) return url;
        const cont = document.querySelector(CONTAINER_SEL);
        return cont?.querySelector(".main-nowPlayingView-coverArt img")?.src || cont?.querySelector("img")?.src || "";
      };
      const getCurrentUri = () => trackToUri(getCurrentItem());
      const getNextItem = () => {
        try {
          const q2 = getQueue();
          return q2.nextTracks?.[0] || q2.next_tracks?.[0] || null;
        } catch {
          return null;
        }
      };
      const getPrevItem = () => {
        try {
          const q2 = getQueue();
          const arr = q2.prevTracks || q2.previous_tracks;
          return arr?.[arr.length - 1] || null;
        } catch {
          return null;
        }
      };
      const getNextCoverUrl = () => {
        const url = trackToImageUrl(getNextItem());
        if (url) return url;
        const el = document.querySelector("#liquify-next-song-card .nsc-cover");
        if (!el) return "";
        if (el.tagName === "IMG") return el.src;
        const m2 = getComputedStyle(el).backgroundImage.match(/url\(["']?(.+?)["']?\)/);
        return m2 ? m2[1] : "";
      };
      const getPrevCoverUrl = () => trackToImageUrl(getPrevItem());
      const getNextUri = () => trackToUri(getNextItem());
      const getPrevUri = () => trackToUri(getPrevItem());
      let prevUrl = "", currentUrl = "", nextUrl = "";
      let prevUri = "", currentUri = "", nextUri = "";
      let track = null, clip = null, prevSlot = null, currentSlot = null, nextSlot = null;
      let mountedContainer = null, origPosition = "";
      let canvasVisible = false;
      let animating = false;
      let canvasPoll = null;
      let nextObserver = null;
      let canvasObserver = null;
      let revealTimer = null;
      let manualSkipPending = false;
      let manualSkipTimer = null;
      let lastCanvasOffAt = 0;
      const setSlot = (slot, url) => {
        if (!slot) return;
        slot.style.backgroundImage = url ? `url("${url}")` : "";
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
        if (nNextUri !== nextUri) {
          nextUri = nNextUri;
          nextUrl = nNext;
          setSlot(nextSlot, nextUrl);
        }
        const nPrev = getPrevCoverUrl(), nPrevUri = getPrevUri();
        if (nPrevUri !== prevUri) {
          prevUri = nPrevUri;
          prevUrl = nPrev;
          setSlot(prevSlot, prevUrl);
        }
      };
      const refreshAdjacent = () => {
        const nNext = getNextCoverUrl(), nNextUri = getNextUri();
        if (nNextUri !== nextUri) {
          nextUri = nNextUri;
          nextUrl = nNext;
          setSlot(nextSlot, nextUrl);
        }
        const nPrev = getPrevCoverUrl(), nPrevUri = getPrevUri();
        if (nPrevUri !== prevUri) {
          prevUri = nPrevUri;
          prevUrl = nPrev;
          setSlot(prevSlot, prevUrl);
        }
      };
      const checkVideoVisible = () => {
        const portal = document.querySelector(VIDEO_SEL);
        if (!portal || !portal.querySelector("video")) return false;
        const cs = getComputedStyle(portal);
        return cs.display !== "none" && cs.visibility !== "hidden";
      };
      const checkCanvasVisible = () => {
        const el = document.querySelector(CANVAS_SEL);
        if (hasMountedCanvasMedia(el)) {
          const cs = getComputedStyle(el);
          if (cs.display !== "none" && cs.visibility !== "hidden") return true;
        }
        return checkVideoVisible();
      };
      const inCanvasGrace = () => Date.now() - lastCanvasOffAt < POST_CANVAS_GRACE;
      const mount = (container) => {
        if (track) return;
        mountedContainer = container;
        origPosition = container.style.position;
        if (getComputedStyle(container).position === "static") {
          container.style.position = "relative";
        }
        track = document.createElement("div");
        track.id = TRACK_ID;
        clip = document.createElement("div");
        clip.className = "cs-clip";
        prevSlot = Object.assign(document.createElement("div"), { className: "cs-slot cs-prev" });
        currentSlot = Object.assign(document.createElement("div"), { className: "cs-slot cs-current" });
        nextSlot = Object.assign(document.createElement("div"), { className: "cs-slot cs-next" });
        clip.append(prevSlot, currentSlot, nextSlot);
        track.appendChild(clip);
        container.appendChild(track);
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
          track.classList.add("cs-hidden");
          track.style.display = "none";
          container.style.position = origPosition;
        }
        canvasPoll = setInterval(updateCanvasState, 150);
        canvasObserver = new MutationObserver(() => updateCanvasState());
        canvasObserver.observe(container, { childList: true, subtree: true });
        const nextCard = document.querySelector("#liquify-next-song-card");
        if (nextCard) {
          nextObserver = new MutationObserver(() => {
            if (animating) return;
            refreshAdjacent();
          });
          nextObserver.observe(nextCard, {
            attributes: true,
            attributeFilter: ["src", "style"],
            subtree: true,
            childList: true
          });
        }
      };
      const unmount = () => {
        if (!track) return;
        if (canvasPoll) clearInterval(canvasPoll);
        canvasPoll = null;
        if (revealTimer) clearTimeout(revealTimer);
        revealTimer = null;
        nextObserver?.disconnect();
        nextObserver = null;
        canvasObserver?.disconnect();
        canvasObserver = null;
        track.remove();
        if (mountedContainer && document.body.contains(mountedContainer)) {
          mountedContainer.style.position = origPosition;
        }
        track = clip = prevSlot = currentSlot = nextSlot = null;
        mountedContainer = null;
        animating = false;
        canvasVisible = false;
      };
      const hideTrackForCanvas = () => {
        if (!track) return;
        const r = track.getBoundingClientRect();
        track.style.position = "fixed";
        track.style.inset = "auto";
        track.style.left = `${r.left}px`;
        track.style.top = `${r.top}px`;
        track.style.width = `${r.width}px`;
        track.style.height = `${r.height}px`;
        if (mountedContainer) mountedContainer.style.position = origPosition;
        track.classList.add("cs-hidden");
        setTimeout(() => {
          if (!track || !canvasVisible) return;
          track.style.display = "none";
        }, CANVAS_FADE + 50);
      };
      const revealTrackAfterCanvas = () => {
        if (!track) return;
        lastCanvasOffAt = Date.now();
        if (mountedContainer) mountedContainer.style.position = "relative";
        track.style.position = "";
        track.style.inset = "";
        track.style.left = "";
        track.style.top = "";
        track.style.width = "";
        track.style.height = "";
        syncFromTruth();
        track.style.display = "";
        void track.offsetWidth;
        requestAnimationFrame(() => {
          if (track && !canvasVisible) track.classList.remove("cs-hidden");
        });
        [50, 200, 450].forEach((d2) => setTimeout(() => {
          if (!track || canvasVisible || animating) return;
          syncFromTruth();
        }, d2));
      };
      const updateCanvasState = () => {
        if (!track) return;
        const visible = checkCanvasVisible();
        if (visible) {
          if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
          }
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
      const swipe = (dir) => {
        if (!track || animating || canvasVisible) return;
        const truthUri = getCurrentUri();
        const truthUrl = getCurrentCoverUrl();
        if (truthUri && truthUri !== currentUri) {
          currentUri = truthUri;
          currentUrl = truthUrl;
          setSlot(currentSlot, currentUrl);
          prevUri = getPrevUri();
          prevUrl = getPrevCoverUrl();
          nextUri = getNextUri();
          nextUrl = getNextCoverUrl();
          setSlot(prevSlot, prevUrl);
          setSlot(nextSlot, nextUrl);
        }
        if (dir === "prev" && !prevUri && !prevUrl) return;
        animating = true;
        if (dir === "next") {
          const fresh = getNextCoverUrl(), freshUri = getNextUri();
          if (fresh) {
            nextUrl = fresh;
            nextUri = freshUri;
            setSlot(nextSlot, nextUrl);
          }
        } else {
          const fresh = getPrevCoverUrl(), freshUri = getPrevUri();
          if (fresh) {
            prevUrl = fresh;
            prevUri = freshUri;
            setSlot(prevSlot, prevUrl);
          }
        }
        track.classList.add("cs-animating", dir === "next" ? "cs-going-next" : "cs-going-prev");
        setTimeout(() => {
          if (!track) return;
          if (dir === "next") {
            prevUrl = currentUrl;
            prevUri = currentUri;
            currentUrl = nextUrl;
            currentUri = nextUri;
          } else {
            nextUrl = currentUrl;
            nextUri = currentUri;
            currentUrl = prevUrl;
            currentUri = prevUri;
          }
          setSlot(prevSlot, prevUrl);
          setSlot(currentSlot, currentUrl);
          setSlot(nextSlot, nextUrl);
          void track.offsetWidth;
          track.classList.remove("cs-animating", "cs-going-next", "cs-going-prev");
          animating = false;
          setTimeout(() => {
            if (!track) return;
            refreshAdjacent();
          }, 150);
        }, DURATION + 20);
      };
      const swipeWithKnownTarget = (dir, newUrl, newUri) => {
        if (!track || animating || canvasVisible) return;
        animating = true;
        if (dir === "next") {
          nextUrl = newUrl;
          nextUri = newUri;
          setSlot(nextSlot, nextUrl);
        } else {
          prevUrl = newUrl;
          prevUri = newUri;
          setSlot(prevSlot, prevUrl);
        }
        track.classList.add("cs-animating", dir === "next" ? "cs-going-next" : "cs-going-prev");
        setTimeout(() => {
          if (!track) return;
          if (dir === "next") {
            prevUrl = currentUrl;
            prevUri = currentUri;
            currentUrl = newUrl;
            currentUri = newUri;
          } else {
            nextUrl = currentUrl;
            nextUri = currentUri;
            currentUrl = newUrl;
            currentUri = newUri;
          }
          setSlot(prevSlot, prevUrl);
          setSlot(currentSlot, currentUrl);
          setSlot(nextSlot, nextUrl);
          void track.offsetWidth;
          track.classList.remove("cs-animating", "cs-going-next", "cs-going-prev");
          animating = false;
          setTimeout(() => {
            if (!track) return;
            refreshAdjacent();
          }, 150);
        }, DURATION + 20);
      };
      const crossfadeToNew = (newUrl, newUri) => {
        if (!track || !clip || animating || canvasVisible) return;
        animating = true;
        const overlay = document.createElement("div");
        overlay.className = "cs-fade-overlay";
        overlay.style.backgroundImage = `url("${newUrl}")`;
        clip.appendChild(overlay);
        void overlay.offsetWidth;
        overlay.classList.add("cs-fade-in");
        setTimeout(() => {
          if (!track) {
            overlay.remove();
            animating = false;
            return;
          }
          prevUrl = currentUrl;
          prevUri = currentUri;
          currentUrl = newUrl;
          currentUri = newUri;
          setSlot(currentSlot, currentUrl);
          overlay.remove();
          nextUri = getNextUri();
          nextUrl = getNextCoverUrl();
          const freshPrev = getPrevCoverUrl();
          const freshPrevUri = getPrevUri();
          if (freshPrev || freshPrevUri) {
            prevUrl = freshPrev;
            prevUri = freshPrevUri;
          }
          setSlot(prevSlot, prevUrl);
          setSlot(nextSlot, nextUrl);
          animating = false;
        }, FADE + 30);
      };
      const markManualSkip = () => {
        manualSkipPending = true;
        if (manualSkipTimer) clearTimeout(manualSkipTimer);
        manualSkipTimer = setTimeout(() => {
          manualSkipPending = false;
        }, 1500);
      };
      const tryBack = () => {
        const progress = anyWin.Spicetify?.Player?.getProgress?.();
        if (typeof progress === "number" && progress >= SAME_SONG_THRESHOLD) return;
        if (!prevUri && !prevUrl) return;
        markManualSkip();
        swipe("prev");
      };
      const onPointerDown = (e) => {
        const target = e.target;
        if (target?.closest('[data-testid="control-button-skip-forward"]')) {
          markManualSkip();
          swipe("next");
        } else if (target?.closest('[data-testid="control-button-skip-back"]')) {
          tryBack();
        }
      };
      const onKeyDown = (e) => {
        if (e.ctrlKey && e.key === "ArrowRight") {
          markManualSkip();
          swipe("next");
        } else if (e.ctrlKey && e.key === "ArrowLeft") {
          tryBack();
        }
      };
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKeyDown, true);
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
          setTimeout(() => {
            if (track && !canvasVisible && !animating) syncFromTruth();
          }, 200);
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
            swipeWithKnownTarget("next", fresh, freshUri);
          } else if (freshUri === prevUri) {
            swipeWithKnownTarget("prev", fresh, freshUri);
          } else {
            crossfadeToNew(fresh, freshUri);
          }
        }, 80);
      };
      let origNext, origBack;
      const player = anyWin.Spicetify?.Player;
      if (player && typeof player.next === "function" && typeof player.back === "function") {
        origNext = player.next.bind(player);
        origBack = player.back.bind(player);
        player.next = (...a) => {
          markManualSkip();
          swipe("next");
          return origNext(...a);
        };
        player.back = (...a) => {
          tryBack();
          return origBack(...a);
        };
        player.addEventListener?.("songchange", onSongChange);
      }
      let noQueueSince = 0;
      const QUEUE_GRACE = 1500;
      const cinemaPoll = setInterval(() => {
        const cinemaActive = !!document.querySelector(CINEMA_SEL);
        const container = document.querySelector(CONTAINER_SEL);
        const queueOk = !!getNextItem();
        if (queueOk) noQueueSince = 0;
        else if (noQueueSince === 0) noQueueSince = Date.now();
        const queueGone = !queueOk && noQueueSince !== 0 && Date.now() - noQueueSince >= QUEUE_GRACE;
        const shouldMount = !cinemaActive && !!container && !queueGone;
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
        document.removeEventListener("pointerdown", onPointerDown, true);
        document.removeEventListener("keydown", onKeyDown, true);
        clearInterval(cinemaPoll);
        if (manualSkipTimer) clearTimeout(manualSkipTimer);
        unmount();
        if (anyWin.Spicetify?.Player) {
          Spicetify.Player.removeEventListener("songchange", onSongChange);
          if (origNext) Spicetify.Player.next = origNext;
          if (origBack) Spicetify.Player.back = origBack;
        }
        document.getElementById(STYLE_ID10)?.remove();
        delete anyWin.__coverSwipeOff;
      };
    })();
  }

  // src/settings/features/lyricsTranslator.ts
  function installLyricsTranslator() {
    const STORAGE_KEY2 = "liquify-lyrics-mode";
    const CACHE = /* @__PURE__ */ new Map();
    const RESOLVED = /* @__PURE__ */ new Map();
    const LANG = (Spicetify?.Platform?.Session?.locale || navigator.language || "en").split("-")[0];
    let mode = localStorage.getItem(STORAGE_KEY2) || "romanization";
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
      const parts = Array.isArray(d2?.[0]) ? d2[0] : [];
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
              const dtQuery = dt.map((x) => `dt=${x}`).join("&");
              const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${LANG}&${dtQuery}&q=${encodeURIComponent(text)}`;
              const r = await fetch(url);
              const d2 = await r.json();
              const detectedLang = (typeof d2?.[2] === "string" ? d2[2] : typeof d2?.[1] === "string" ? d2[1] : LANG) || LANG;
              const translated = showTranslation && Array.isArray(d2?.[0]) ? d2[0].map((x) => x?.[0] ?? "").join("") : text;
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
      } catch {
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
            } catch {
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
    const start2 = () => {
      if (observer) return;
      observer = new MutationObserver(() => scheduleProcessLyrics());
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      scheduleProcessLyrics();
    };
    const stop = () => {
      try {
        observer?.disconnect();
      } catch {
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
      localStorage.setItem(STORAGE_KEY2, next);
      if (next === "off") stop();
      else {
        try {
          document.querySelectorAll(".sp-lyric-translation").forEach((el) => {
            delete el.dataset.translated;
            delete el.dataset.translating;
          });
        } catch {
        }
        start2();
        scheduleProcessLyrics();
      }
    };
    if (mode !== "off") start2();
    window.addEventListener("liquifyLyricsModeChange", () => {
      const next = localStorage.getItem(STORAGE_KEY2) || "romanization";
      setMode(next);
    });
    return { setMode, start: start2, stop, getMode: () => mode };
  }

  // src/settings/features/player.ts
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

  // src/settings/features/nextSongCard.ts
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
      box-shadow: var(--liquify-shadow);
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
    #liquify-next-song-card.nsc-cinema-hidden {
      opacity: 0;
      pointer-events: none;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      box-shadow: none !important;
    }
    #liquify-next-song-card.nsc-watchfeed-hidden {
      opacity: 0;
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
    const PLAYABLE_URI = /^spotify:(track|episode|local):/;
    function isPlayableEntry(track) {
      const uri = track?.uri;
      if (typeof uri !== "string" || !PLAYABLE_URI.test(uri)) return false;
      return !!String(track?.metadata?.title || "").trim();
    }
    function getNextTrack() {
      try {
        const queue = Spicetify?.Queue?.nextTracks;
        if (!queue || queue.length === 0) return null;
        for (const entry of queue) {
          const t = entry?.contextTrack || entry;
          if (isPlayableEntry(t)) return t;
        }
        return null;
      } catch {
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
      } catch {
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
          const target = e.target;
          if (target.classList.contains("nsc-cover")) {
            e.preventDefault();
            const uri2 = target.getAttribute("data-uri") || "";
            if (uri2 && Spicetify?.Platform?.History?.push) {
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
          if (uri && Spicetify?.Platform?.History?.push) {
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
        } catch {
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
      const artistUri = allArtists[0]?.uri || "";
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
      } catch {
      }
    }, 1e3);
    window.addEventListener("resize", repositionCard);
    document.addEventListener("scroll", repositionCard, true);
    const observePlayer = async () => {
      while (!getPlayerElement()) await sleep2(300);
      const player = getPlayerElement();
      if (player) {
        const ro = new ResizeObserver(repositionCard);
        ro.observe(player);
      }
    };
    observePlayer();
    const waitForPlayer = async () => {
      while (!Spicetify?.Player?.addEventListener) await sleep2(300);
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
        const apply = () => {
          if (!card) return;
          card.classList.toggle(
            "nsc-cinema-hidden",
            el.classList.contains("Root__cinema-view--controls-hidden")
          );
        };
        cinemaObserver = new MutationObserver(apply);
        cinemaObserver.observe(el, { attributes: true, attributeFilter: ["class"] });
        apply();
      }
      if (!el) {
        lastCinemaEl = null;
        if (cinemaObserver) {
          cinemaObserver.disconnect();
          cinemaObserver = null;
        }
        if (card) card.classList.remove("nsc-cinema-hidden");
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
    function watchFeed() {
      if (!card) return;
      card.classList.toggle(
        "nsc-watchfeed-hidden",
        !!document.querySelector('[data-testid="watch-feed-view"]')
      );
    }
    setInterval(watchFeed, 1e3);
  }

  // src/settings/features/nowPlayingViewCover.ts
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
    const CANVAS_SEL = ".main-nowPlayingView-canvasVisualEnhancement";
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
      const el = document.querySelector(CANVAS_SEL);
      if (!hasMountedCanvasMedia(el)) return false;
      const cs = window.getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden";
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
      const name = target?.querySelector(".main-trackInfo-name");
      const artists = target?.querySelector(".main-trackInfo-artists");
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
        ".main-nowPlayingView-coverArtContainer .main-nowPlayingView-coverArtVisualEnhancement { opacity: 1 !important; }",
        ".main-nowPlayingView-coverArtVisualEnhancement { visibility: visible !important; }",
        ".main-nowPlayingView-coverArtVisualEnhancement { left: 0 !important; opacity: 1 !important; padding-inline: 16px !important; position: absolute !important; right: 0 !important; z-index: 2 !important; }",
        ".main-nowPlayingView-coverArtContainer { margin-top: 90px !important; }",
        ".canvasVideoContainerNPV>video { filter: blur(" + blur + "px) !important; }"
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
      while (!Spicetify?.Player?.addEventListener) await sleep2(300);
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

  // src/settings/features/actionBarBox.ts
  var STYLE_ID2 = "liquify-action-bar-box-style";
  function updateActionBarBoxCss(show) {
    const css = show ? "" : ".main-actionBar-ActionBar { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }";
    updateStyle(STYLE_ID2, css);
  }
  function applyActionBarBox(mode) {
    const m2 = mode === "show" ? "show" : "hide";
    localStorage.setItem("liquify-action-bar-box-mode", m2);
    updateActionBarBoxCss(m2 === "show");
  }
  function applySavedActionBarBox() {
    const saved = localStorage.getItem("liquify-action-bar-box-mode") || "show";
    updateActionBarBoxCss(saved === "show");
  }

  // src/settings/features/glassBlur.ts
  var GLASS_BLUR_KEY = "liquify-glass-blur";
  var BACKDROP_BLUR_KEY = "liquify-backdrop-blur";
  var GLASS_BLUR_DEFAULT = 2;
  var BACKDROP_BLUR_DEFAULT = 32;
  function applyCss() {
    const glass = readNum(GLASS_BLUR_KEY, GLASS_BLUR_DEFAULT);
    const backdrop = readNum(BACKDROP_BLUR_KEY, BACKDROP_BLUR_DEFAULT);
    updateStyle(
      "liquify-glass-blur",
      `:root { --liquify-glass-blur: ${glass}px !important; --liquify-backdrop-blur: ${backdrop}px !important; }`
    );
  }
  function setGlassBlur(px) {
    localStorage.setItem(GLASS_BLUR_KEY, String(px));
    applyCss();
  }
  function setBackdropBlur(px) {
    localStorage.setItem(BACKDROP_BLUR_KEY, String(px));
    applyCss();
  }
  function ensureGlassBlurApplied() {
    applyCss();
  }

  // src/settings/features/homeLayout.ts
  var STYLE_ID3 = "liquify-home-layout-style";
  var HOME_LAYOUT_KEY = "liquify-home-layout";
  function updateHomeLayoutCss(on) {
    const css = on ? ".main-home-content section { padding: 1rem; gap: .5rem; box-shadow: var(--liquify-shadow); border-radius: 20px; }.main-card-cardContainer, .LXxEtdyreLg2dh0C { height: calc(100% - 1px); }.XtiGtrj_ysgd8Bmv { --margin-start: 0px; --margin-end: 0px; }" : ".main-home-content section { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }";
    updateStyle(STYLE_ID3, css);
  }
  function applyHomeLayout(mode) {
    const m2 = mode === "on" ? "on" : "off";
    localStorage.setItem(HOME_LAYOUT_KEY, m2);
    updateHomeLayoutCss(m2 === "on");
  }
  function applySavedHomeLayout() {
    const saved = localStorage.getItem(HOME_LAYOUT_KEY) || "on";
    updateHomeLayoutCss(saved === "on");
  }

  // src/settings/features/compactPlayer.ts
  var STYLE_ID4 = "liquify-compact-player-style";
  function updateCss(enabled) {
    const css = enabled ? [
      ".Root__now-playing-bar { height: 65px !important; border-radius: 20px !important; }",
      ".main-nowPlayingBar-nowPlayingBar { height: 50px !important; }",
      ".main-nowPlayingBar-center { width: 60% !important; }",
      ".player-controls { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 0px !important; margin-left: 15px !important; }",
      ".player-controls__buttons { width: fit-content !important; margin-bottom: 0px !important; }",
      ".player-controls .playback-bar { flex: 1 1 auto; min-width: 0; }",
      ".BNf2Xbd3qYwZdYVY { display: none !important; }"
    ].join("\n") : "";
    updateStyle(STYLE_ID4, css);
  }
  function applyCompactPlayer(mode) {
    const m2 = mode === "on" ? "on" : "off";
    localStorage.setItem("liquify-compact-player", m2);
    updateCss(m2 === "on");
  }
  function applySavedCompactPlayer() {
    updateCss((localStorage.getItem("liquify-compact-player") || "off") === "on");
  }

  // src/settings/features/layoutRadius.ts
  var NAV_RADIUS_KEY = "liquify-nav-radius";
  var MAIN_RADIUS_KEY = "liquify-main-radius";
  var RIGHT_RADIUS_KEY = "liquify-right-radius";
  var LAYOUT_RADIUS_DEFAULTS = { nav: 20, main: 20, right: 20 };
  function applyLayoutRadiusCss() {
    const nav = readNum(NAV_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.nav);
    const main = readNum(MAIN_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.main);
    const right = readNum(RIGHT_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.right);
    updateStyle(
      "liquify-layout-radius",
      `:root { --liquify-nav-radius: ${nav}px; --liquify-main-radius: ${main}px; --liquify-right-radius: ${right}px; }`
    );
  }
  function setNavRadius(px) {
    localStorage.setItem(NAV_RADIUS_KEY, String(px));
    applyLayoutRadiusCss();
  }
  function setMainRadius(px) {
    localStorage.setItem(MAIN_RADIUS_KEY, String(px));
    applyLayoutRadiusCss();
  }
  function setRightRadius(px) {
    localStorage.setItem(RIGHT_RADIUS_KEY, String(px));
    applyLayoutRadiusCss();
  }
  function ensureLayoutRadiusApplied() {
    applyLayoutRadiusCss();
  }

  // src/settings/features/playlistHeader.ts
  var STYLE_ID5 = "liquify-playlist-header-style";
  function updatePlaylistHeaderCss(show) {
    const css = show ? "" : ".main-entityHeader-container { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }";
    updateStyle(STYLE_ID5, css);
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

  // src/assets/player-icons/pause.png
  var pause_default = "data:image/png;base64,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1tofLHFX7Q+aWOv3Yb3Xpfbvw6E6QEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEChBQnQEhxAoQUJ0BIcQKEFCdASHEC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";

  // src/assets/player-icons/play.png
  var play_default = "data:image/png;base64,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";

  // src/assets/player-icons/skip-back.png
  var skip_back_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAigAAAFPCAYAAABnFDX6AAAACXBIWXMAABYlAAAWJQFJUiTwAAAgAElEQVR4nO3d7VUcudLA8ZbP893eCGAjMI5gcQTGETCOwDgCQwQ7ROAhgh0iMETgIQJDBNcTgZ4jXI2bl5lRq99Upf/vHO7ufri7TY+lKVVJKue9rwD0wzl3UFXVm6qqDuVfGP7+oMW//FZ+gqvwP977Kz4eIF+NcV//te24r8d4Pf5vvfe3O/4/5hGgAAmcc/syAR1IMBL+eW/Ad7muqmrV+LliAgPG5Zx70xjz9fgfctxfS8ByP/ZLW6wQoAARJCA5bPwMOSnFWsvK60oClhWfJdAfCUia4/5tBq/3ujHmTQcsBCjABpK2nWU0Me1yV1XVUiauZd6PCuRJFiNH8vNP5h/Tuh7z4a/e+18ZPFNvCFCABpmcTmRyyiFLkqqeuOZkVoDtJFNyJAuS3IOSbS4kUDGxQCFAQfEak9OJkkxJWyGzMq+qamFthQV0IVnSMO6Pjb3IMOYXMubV7lUjQEGxGtmSsGp6Xch7uCCrgtI552aGFyRPXUigom6/CgEKiiOByanBVVMbYaPdKUeYURIJTE6Vl29TqRvzBCgoBoHJiwhUYF7hgclTasY8AQrMIzCJEiatE0o/sMQ5dyh7MQhMngtjfpbzHpVXGTwDMBjn3KlcckRwsl04ufDDObeQTcOAWmFR4pwLGYLvBCcbhTH/0zk3z3XMk0GBSc65Izm5wuTU3lpSwHNtDw7IouRr8S+inbVkU7I6nkyAAlOknLNQfpdBLm5k0qLsg+xRzunFpYz5LK4joMQDE0KKUlZOPwlOevNWyj6nRn4fGCRjf0k5pxcfQu8fyUBPjgwK1KOcM4qQTTmiQSFy4pw7kQ3wpdxjNKYL2Tg/WTaFAAVqUc4Z3VomrEVhvzcyIzfAzhn7g5u0zEuJB+pQzplMWKV+Cyd9Cv39MTEZ+yEw+cHYH0Uo815NVfIhgwJVKOdkI6ysDuntg7Ew9id35r0fdT8aAQpUoJyTpbUEKZzywWBk7M9lAyemdeG9n431BJR4kDXKOVl7PWX6F/Y1LlokOMnDsXNuNdbFbmRQkC1Suqp8YvMs+iJ3mswL6Tas0SglXgIUZIdyjloEKehEVuYha/KZN5m9wYMUSjzIBuUc9b7JvRRAa9Jx+JbgRI36hM9g5R4yKMgC5RxTvtDHB7HImKo3WCaFAAWTYnIyi3IPtpKV9wmN/UwYJEghQMEkmJyKQJCCF9HYz6Rr7/1hn78YAQpGRzmnKB9za+GO6cjCZMGxYbN6vSeFTbIYTSjnOOeuqqr6j+CkGAvpm4LCyQbqW4IT04773ChPBgWDo5xTvHDj7D7X4pdJAtQFd5oUpZfMKQEKBkU5B+LGe08mpSDcaVK0sCg58N7fdnkJlHgwCMo5eOItXZDLIQuTFcFJsUIbjM4ZFAIU9IrL1rDFsVzGBaNYmKAhLEo63YdEiQe9oZyDCL2kfpEfWZicyOoZqCXvRyFAQWdctoaW2I9iCI39sEPyJnlKPEhGOQeJ3sqfGygm4z8sTL4TnGCL17KAbY0MCpJQzkEP3nnvV7xIfWQv0ZxyDlpoXeohQEErlHPQI0o9ysidJnPGPxLcyf6z6FIPJR5EoZyDAbzt89ZJDKcx/n8w/pFoTzZRRyODgp0o52BA3DKbORr7oWd/x57iI4OCjbjTACN4LcEvMiPjfymbYBn/6Ev0eCeDgmfondO766qqfsnNmpvsy89BoRsPo1dVGJ6U3k7ZBNvJjYz7qw3/kjcy3vcLDADfe+83vZcHBCh4hHJOZ2uZkMLKc5VySkU2Ih82fkr4LK6994cZPEfRaOzXyXVj3O/88m2SRWFzzFt//1HjnQAF9zid09lFmJz66OD5lHxpzOTH8oo2alWF/tHYL9mNLOiWfe6jkvk4ZLGODC9Qdo53ApTCUc7pZC2T03ysTZ5y/8Sp0UmLLMoEJGu6oJzTSsiWnI4RUBse8zvHOwFKwSjnJFvL5DTZ5k7DkxZZlJGQNU0yWmDylNExv3W8c4qnQJzO6eRMjsVOevLEe7/w3ocvmC8SMFnBvSgjkDtNVgQn0e7kJtTDqQLoxpg/m+K/P5CtLS/IoBSEck4nYeU0y/GkiXyuYSX8IYPH6QMnegbCnSZJziVrks1dPZL9WhrZTLtxvJNBKYSUc1YEJ601V05ZfmmGidN7Hz7fT0ayKTQS7NmTxn4EJ3FupF/USW4XCYa5SNpEnGfwOF1tHO9kUIyjztzJ2ZgbYPtg5Jgot8v2iDtNWpt8j1kbBho3bhzvZFCMondOJ9eSdswqrRtD7l05lN9Bq9dyvBIdhGBV9pr9S3AS7TKHPWZthL0pMua1Zk83jncyKAZxOidZKOecDHGXyRQkpX+s9PHpdJyIvWZJ7mSPmdoTZJI9vVIajL443glQDKGc04m6ck4M5UEKm2VbYnGSxMzYVx6kPBvvlHgMoJzTidpyTgzv/UxuudWII8eRGo39uDognrmx3yjxaiz3PBvvZFCUY8WUzFQ5Zxfn3Erhxtk7ufcBW7AJtrW1jP2FsueOJt8L/yl53Nqz8U4GRSkuW+skpHQPSglOxKEEZZrsScoaLwh3mkjgySbYeOeyCdZscFL9zqQsFV7o9my8E6AoQzmnE9PlnG3k99V4MobTPE/IHDCXO03oOhznRq5Vz+5Ok6GEeU7hab5H450ARREuW0uW/WVrY5D69Bdlj02A0iBzwC1dh6OFcs5ZOCFSaI+nmbL9KI/GO3tQFOB0TicmT+d0IaVBTX+W/ir982MOSHIpe02KPgkme5T+zeBRYj2MdzIoGaOc00mx5ZwIs+yf8LGisyjMAa3VGdOj0oOT6nfmdC4lLi0exjsBSqYo5ySjnLODvBdNG+gOM3iG0ckm2FvmgFbOC9wAH0PTkf2H8U6JJzOkcjuhnBNJbhu9VXL6o6jjxga7U4/hWso5K/u/ahpFpd2H8U4GJRONnfmkctujnNOSvCct/Ub25EvbPNkvcEtwEi1sAP0iGVOCk+20dAl/GO8EKBmQbpTszG+Pck43c0U7/E2XeWjsl0RdY78pySkmLceO78c7AcqEGpPSNyal1kq8bK1XyrIoJi9sa2ROf5A5jXYnd5ockTFtTcsFdffjnT0oE5D01SkZkyTX0nWUjEkPZM/TTwWPeh0yZRk8R29oU5HkTC4gQyLn3C8FC+L78U4GZWSUc5JRzhmAvMtLBY9qZpMsjf2SPOwzU/jsudGQRWGT7Jgo53RCOWdYGt6riS9yudNkxSbYaGsWJr3TEKDcj3dKPAOjnNMJ5ZwRyJ/R/yl41PdarysPd5pIOYfeOfHCnSaczBuAkjLPezIoA6Kck4xyzojkC0DD7n51R41p7JekuMZ+E9CQNX1DgDIAyjmdUM6Zhob3reokDwuU1uo7TUpt7DcmDe/34P8yeAgzKOd0QjlnWhouuVKRQeE26CQ09huXivHOHpSeyGppTsaktTuZmMiYTMw5l/tkkPVRY1mgnNA7pxXG/0Q0jHdKPB1RzumEck5eNHU8zYpsgqW5ZzuM/2llv++MACURN0B2Qu+cPOWe9s3uLhSZB5ayCZY7TeKE8f+O8T+53Mtp+wQoCdj8lozTOXnL/TPJKgCgsV9rNPbLS/bjnU2yLYRyjuwzIWPSXkjnzlkxZY2gMYLMAwuODbdyIXtNGP/5yH68E6BE4HROJ5zO0YPPaAvmgSR3Mv45NpwfAhTtOJ2TjN35MIPGfq2tJWNK7xwkI0DZgHJOJ5RzYAJ3miQha4peEKA8QRq3EyYmmCGN/U7InkZby/gna4pecFFbA+WcZJRzDNDQNNB774b+b9DYLwmN/ZTRMN4JUCjndEU5x5Dcb5ccMkCRCTvMA8dD/TcMupGsCceGFcp9vBdd4qGc0wnlHJhB9rS1tWRM5sqeG4oUG6AwISWjnAMzyJ4mobEfRlFcgMKE1AnlHJhAY78k3GmCURUToFDO6YRyDsyQTbAL7jRphcUJRldEgEI5JxnlHJghd5rM6Z3TyrXMAWyCxehMNwsM5RznXEhHfiM4aY1W6DBDGvutCE6ihU2wn2jshymZzKBQzumEcg7MoLFfEhr7IQvmMihSzrklOGktlHM+yoqJ4ASqhUWKcy6Uc34QnEQLd5q8997PCE6QAzMZFE7ndMIGOJghjf0WlHWj0dgPWVIfoFDO6YRyDsygsV8S5gBkS3WJh3JOMso5MEUa+60ITqIxByB7KjMolHOSreW9Uc6BCdxpkoTGflBBVYBCOacTrqeGGTT2S0JjP6iipsRDOSfZnezMPyI4gQVyp8ktwUm0kDn94r0/IDiBJtlnUCjnJGNnPsyRixeZC+JdStaEcg7Ucd77LJ+Zck4nlHOQxDmX54SAtmjsh51yH+9ZZlDonZOMSQkA9xrBhKwCFO4xSEY5BwB3msCUbDbJNpp5EZy0cylN/QhOgDI1G/sRnMCMyTMoZE2SUc4BwJ0mMGvSAIWeGUko5wC4kY3wLFBg1mQBinQa5YROO5zOAcrGAgXFGD1AkePDS0o6rVDOAcACBUUZdZOsXLrGRUvxwmrpzHu/T3ACFKtu7Mdt0CjKaBmURnDCfpM4rJYAsAkWxRolQJGL177xxywK5RwA17JAoXcOijV4iYfgJBrlHAB1Y79DghOUbtAMCsFJNMo5AGjsBzQMFqAQnEShnAOAeQB4wSAlHoKTnSjnAKiYB4DNes+gEJzsRDkHAI39gB2c9763dyRHiX/w0l9EGhfZc871NyHgJWuZB5a8HUwt9/HeW4mncc8JHqOcA6CSO032CU6AOL2UeOT6epr+PUc5BwCN/YAEfe1BCSuCt3wADyjnAFjLLbDz4t8EkKBzgOKcO6W3zgM6jQKoyJ4C3XXaJOucO6yq6jufwz0mJKjHJtnO7mQeYJ8Jspf7eE8OUGTfyS37TijnwA4ClE7OJIPKTbBQIffx3qXEsyw8OKGcA6CisR8wjKQAxTl3Uvi+E8o5ANgECwyodYnHObdfVdWq0OwJ5RyYRokn2oUsUijnQC2LJZ4S7zuhnAOgYpECjKdVgOKcOyqwtEM5B0AlN0KzSAFGEl3ikVM7obSzV8iHw0oJxaHE8yIa+8EkS714TgoJTuidA6CSueCj9/6Q4AQYX1QGRTbG/izg86Gcg6KRQXlwLid02AQLs6xskrVed6WcA6CSxn4z7jQBprczg2I8e8LpHKCh4AwKd5qgOBYyKFa/vCnnAKiYC4A8bc2gGM2eUM4BNigsg8JcgKJpP8VjKXvC6RwAtdDY74C5AMjXxgyKsewJ9xgAEQrIoLAJFhCaMyizEZ9jKCFr8oV7DABI/5xDghNAh20ZlF/Ke+6E+vIRkxEQz3AG5ZP3fpHBcwDZUHmKxzk3Ux6c3MhKiUuWgLKtZaHCXhNAmU0lHs3lnQuCEwASnBwSnAA6PSvxKN8ce+G9t7B3BpiEoRLPmv0mwHYaN8keTfAcfbgkOAEgCE4A5V4KUDR+yd8YOXUEoLtPBCeAfo9KPErLOyGVu8+eE6A7AyWec+/9SQbPAWRPW4lHY3mHDbEAghuCE8AO7QHKGalcAIIyL2DIQ4nHOfemqqr/KfrVwmrpIIPnAMxQXOIJixWrndeBQWgq8RxO+BwpWC0BCO4ITgB7tAYo55R2AAj2nQAGNUs84Qv/rYJfkVM7wEAUlniuQzPQDJ4DUEdFiUf2n2gIToI5wQkAQWkHMKou8WjZbBqyJ/MMngPA9G7oswPYVQcoWlKkC7InAASLFcAwbRkUJiQAlWRTl7wJwC5NAUrYDHebwXMAmN6SbCpgWx2g7Cn4LRcZPAOAPJA9AYxzsv/ku4Jf8y9WTMCwlBwzXnvv32TwHIBqGo4Zaxjo1wQnAAQnd4ACvFKy/4QJCUCN+QAogJYMChMSgBrzAVAAJ4P9n5x/Ve+9y+AxAPM07EFhPgD6oambca5uFDwjgHFc856BMoQAZT/z35S7TwDUmA+AQrxScAfKKoNnAJAHAhSgEBpKPExIAGrMB0AhCFAAaMJ8ABRCQ4ACAAAKQ4ACAACyoyFA4Yp7ADXmA6AQZFAA3HPO5X7lAICCaAhQ6FoKjMB7r2EDKvMBUAgyKAAAIDsEKAAAIDuUeABownwAFEJDgHKQwTMAyAPzAVCIEKCsM/9VOVkAoEYGBSjEKwXN+AhQANTIoACF0FDi+SeDZwCQBwIUoBCvNDTfcs4xKQEIXnOhHFAGFQFKVVWHGTwDgDwwHwAFIEABoA3zAVAAAhQA2jAfAAXQcIqnkrrzUQbPAWB6e+xLA+x75b3/peAulIAABUBtxpsAbKuPGWvIohw557ikCUDFggWwT1OA8ppVEwARyjzsRQEM0xSgBCcZPAOAPDAfAIbVAcqVkl8xrJrIogAIPnBpG2DXfYDivQ9Hje+U/JanGTwDgDwwHwBGNXvxaCnzkEUBUDsmiwLY1AxQlop+wzknegCIBS8CsKcZoGjZh1LJiZ55Bs8BYHr/cJEjYI/z3j/8Us65sBdlT9Fv+d57rymwArLmnPNKP6Gwh+5ALp4EECH38f7qyT9rKvMES0o9AGRhRVYVMORpgKKtlvtaYVAFYBjHbKAH7HhU4ql0lnmCC+89ExPQkeISTy30FTv03ms5lQhMRluJp1KakQgrJ26VBBCyqleUfgH9XgpQtB7Z+5f0LgCCFMCGZyWeSm+Zp/bJe8+9CEACAyWephsp93CyB3iBxhJPpXw3/DfnHNdfA3hLJgXQa1MGJQzo/yn/XC9Ct1NWT0A8YxmUWrgj5YiNs8BjKjMo8qV+Mf7j9OpYVk8Hyn8PAN3syVzAbbOAIptKPJWRS4/qFC8nfICyhY2z/znn6OMFKPFiiafmnAvXyP9j5MO8lpIPaV5gA6MlnqdCyWdGmwyUTusm2ZqlzaYh0PrBCgooXij5fHfOLZgLgHxtzaBU9rIotbVkUziODDQUkkFpYi5AsbRnUCpjWZTaazmOzCZaoGzMBUCmdgYoUqe9NvoBUvYBUDXmglPmAiAPO0s81e800GGo2Rr/zEj1ongFlnhewiZaFMFCiafOolwO/ziTItULoGpsol065/Z5I8A0ojIo1e9IKwzUnwV9Tudh/w030aIkZFCeWcs8YOFeKOARExmU6ncWJTQQPBv2cbLyuaqqWzokA0V7LZ3SV1LqBjCS6AxK9adHz0pxp+NUXPKGIpBB2YnMKswwk0Gp/vToKTGjwGkfAFUjs0pfH2BgrQKU6s+G2fNCPxjKPgDqvj5XbKIFhtOqxFMruNTTRNkH5lDiSXLmvbd4oSWMM1XiqRVc6mmi7AMg+Oqcu2UTLdCvpACl+lPqKelUzyaUfQDQgBDoWVKJp8loM8FUlH2gGiWeXnB3ClTIfbz3EaCwH+U5jiJCJQKUXrFgQdZM7kFpki/hI1k14DfKPgBoQAh00DlAqX4HKWGFcMIH8Qi9fQAEX0OWmbtTgHZ6CVCq30FK6AL8hff/DKd9AOzJ3Sk0IAQidd6D8lTYxV5V1TEfwIvWUpNeZPhsAHtQxhHmgTl3p2Bq5jfJvvgvJUjZhc1zyBIByqhuZB64Kuh3RkbMb5J9ifc+bA69GOLfbQRlHwBv5e4U5gHgBYNkUGpkUqJwZwKyQQZlMpR/MboiSzyP/gMEKbFI92JyBCiTC+Xfmff+tvD3gBEUWeJpotwT7S1XZQPFC+Xfn+HulNJfBDB4gFL9CVLo2xPnWC55414ZoFw0IETxBi/xNMnNqt9Kf+ktUPbBqCjxZOlSyj60zkCvii/xNMkGsHdcix+Nsg+AD2RVUaJRA5Tqz7X4B5IdQBzKPkDZQuuMf2mdgZKMHqBUv4OUW+/9gXT9RZx6glpRlwaKxR1KKMaoe1BeIg20FvIFjHgXsj+FujR6wx4UVe5kDliW/iKQpvh7UKIe4vdKYCmrA8Tjkjf0igBFJe5OQRI2yUYIWQDv/aF0Q2YDbTzKPgDCwm7F3SmwJosMSpNkUxaycx3tUPZBJ2RQ1ONqAkQjg9KSZFPCvpT3UmNFPE77AGXjagKYkV2AUgsrAO/9vtxAS9knHmUfWMZcEKderMw0PCzwkmwDlJr3/lTuTbnM44nUYCUFi5gL4oXFyje5O2Vfy0MDtewDlOrPvSmUfdJQ9oEZzAVJHhoQsliBJtltko0hu9VPuDulNTbQYavcN81571399/JlG+aBr9M+lSp3ciSZOQDcgzIUSVnOOe2ThNM+eJGmAKUmV7/PuUepFRoQglM8QyHV2wllH5gR+nvJPUqf2EQbjQaEyJ7aDMpTlH2SUfbBA40ZlCYp+8wlCEecG8mmrHhfZaHEMyLKPp1Q9oH6AKUmR+zDhY97ozyYDefSOoM5oBAEKBNgckpGb5/CWQlQamRWW1tLNoUGhAUgQJkQk1Myyj6FshagVH8yqws20bZCA8ICEKBMjLJPJ5R9CmMxQKk5544kUGHBEidkU+ZyWSYMIkDJBGWfZJR9CmI5QKn+bKINX7if+3sq87g7xSgClMxQ9klG2acA1gOUmtydspCWEIhDRtUY7kHJDL19ktHbB2bI3SlhHvjC3SnRaECIURWXQWmi7JOMso9RpWRQmiTgXrBPrZVryaZwd4piZFAyFsoV3vuwifaMVVQroTz2r3NuJUEeoFYoWXArdWvhRNQPGhBiSEVnUJo47dMJtWkjSsygNNGAMAmbaJUig6IEvX06obePAWTDHrIpYZ/a31LGwG57sj9tKQs9KKBhvBOgPEHZJxllH5ghCxYaELYTss8rFiroCwHKBo3TPhdZPmC+OO0DM7z3YfPsPvNANBYq6A0ByhayippJ2ecm2wfNE2UfmCBlH+aBduqFypyFClIRoESQsg93JrTHakoXvki2aMwDlH/jfZaFypGWB0Y+CFBakHs/SPe2R9lHh4PSX0CMRvmXTbRxwkLlP+fcFZtos8ImWWtI93ZC2SdvBI+RGptoP3LqL1q4O+WntBvB9HIf72sClESUfZJR9slX7hmU7DIW3vulvLfzDB5Hi6/OuVvG/+RyH+8rApSOKPsko+yTH0o8CSSrGrKC7yj7RNtj/E8u+3IbAUoPKPt0QtknA9LdN/cO37cZPMNG0oDwkKxqK4z/CUhQmHsPulsClB5R9klG2Wd6GrInWQcotUZWlY7pcerxfyWBMoanYZ4lQBkCZZ9klH2mo2HCUtPriQaESWhAOB4ClJJR9umEtO/4NNxToa61/5PWGYjzVa7M5+6U4Wh4t7d0Mx6JfNmeKqjz5+ZGOiXTKXUg8kXwn4JH/Utzx2y5A2QhmQLEuZTxr6K8p4H8Ofyp4FH/IoMyEso+ySj7DE/FSlVzcFLRgDBV3YCQu1P6o2G8r8N4J0AZEWWfTij7DECCPg0Tlpnju40GhNydEue13J3CJvp+aJhD78u5BCgT4LRPMk779O9ISdlR3f6TbRp3p7BYiUcDwo5k3sz9eHFFgJIByj7JKPv0R0vq3FSAUqMBYZK6AeFM4bNPTcs7ux/vbJLNhES2c/nyRbwwqZ9KsIcW5M/cdyXv7F24CC2D5xiMbF6cy74LxAmlvxmbaHdTtDk2+Dt8pmRQMkHZJxlln3Ragrq19eCk+rOJ9ogGhK3QgDCelne0rgNOApTMUPZJ1iz70NJ9B0mPa8nWFXXEvNGAkLtT4tGAcAuZE4+zfcDHHsY7AUqGOO3TyTHHEreTfTua3k9xd+DIHHBKA8JW6gaES/amPaNyvBOgZIyyT7LXrKi2OlWyk79W7CV9NCBM8oErCf6QOVBL9iRY1n/DJlklZEUwV/YHLRfcRimUbYwN7uSq+OIxByS5lrFvfg/TS+TPzErRguTReCeDogRln064jfLPZLXI4FHaoMWBeDIHsIk2Tt2AsNS7U7RlS5fNfyBAUYayTzLKPr+DE02TVfV0wgINCBN9Lq0BofyunzN4lDYeLUgo8ShGyreToso+YQWpcLIKxw3Z7LgFDQiTmL87xTl3IF/2mprTPhvvZFAUo+zTSTFlHzlSrC04qcie7NZoQPiRjGq0fyyP/UYpV1vn/GfjnQDFAMo+ycyXfSQ4+ZbBo6QgQIkkd6fQgDCeyQaEEpxcKb2R/Nl4p8RjDGWfTkyVfZQHJ5zeSUTbjCQXMvZ/KXz2e8qDkxfHOxkUYyj7dGKm7CN3QGgNTiqFp42yQUY1ybHmBoTKg5Nq03gng2KcfFGdKqxHTu1ONtKpO+Yarvs3kEH7m3truqMBYRJVm2jlM14qz5i9ON7JoBhHb59kzWuzVZQawnOGmrqB4OSS4KQfjQaE3J0S76EBYe53p0g5b6U8ONk43glQCkDZpxMVZR/JlGmfqGpauiyrIZlAGhC281XGfpabaGVO+m4gO75xvFPiKRBln2TZlX0M3oNxI/snMBC5I2PO3SmtXMrYn3wTrXx+CyOLka2b4cmgFIiyT7Jsyj4h9SyXr/009kVD9mRgjQaEn9hEG61uQDhZJlXGfAhMfhg6obX1fZJBKRxHEjsJAd58zEZkEhiFDNjMYAaMo8Uj41qCJCGTeuq9H+WkmXxGJ/JjaczvHO8EKLhH2aeTa0m5LodKAUtfjZnx0xifxpr08ZgsVDT2aprSWoK7xRCbuuUzmRkOHneOdwIUPGA11YtLOfJ31WXSks8iTFBH8mM9cCR7kgEpYVhbqY/hRgK8qy4ZVQlK6jFvOViMGu8EKHiGsk9v7uRkTfi5lZ97YaOtbHarjzG+kVMW9U9pK9mPcl07JkYDws7WMubDZvpf8vebHDbGfknvOypbSoCCjSj7YCTXsmkTGZGyosamc8hbdLaUUzzYiNM+GMkJLzo/NCDEQKLbCRCgYCsuecPAzsc8BYV2ZPyHAPId4x89uG5zjxQlHrRC2Qc9CrX6fc0dZEvD+EcHYbwftDk8QAYFrVD2QY+yuJkT8Rrj/5LXhpbmbU82kkFBMk77oINLaWIHpbg7BS0ktbAgQEFnpH3REqUdIxq3nH4t/V1gq3cpe80o8aAzyj5oidKOEbhsZ0wAAAPFSURBVLKJNixO/pYblYGnzlI3wpNBQa8o+2CHczkVAoOcczMZ/2RTUXW944gABYOg7IMXJNWhoQstMyBan9p5ihIPBkHZB0+spb8IjOPuJIhZ1yaKBCgYDBMVGo6G6PiKfIULuSRjdiYBKspx1kdvLUo8GA1ln2JFNQaDXTQgLEpvVwiQQcFoKPsU6ZzgBCF7JpslP0qXb9h006bXzi5kUDAJ59yBbKRjRWXXhZT4gAeyiTZkUj/zVkzp/X4jAhRMimOJZnFTLLaSRcqCKwlMCMHJYd+NPynxYFKS/qeluy29pnlhU/gyk020X9hEq9ogwUlFBgU5oexjwo1MVtwUi2hS9gmLlQ+8NVUGC04qMijIiayowka6T6yoVLokOEEKuZLgSK4kYBOtDoMGJxUBCnJE2UelsCH2iOAEXcjdKftydwryNXhwUlHiQe4o+6jAaR30jrtTsjVKcFKRQUHuKPtk7xPBCYbQuDuFsZ+Pm7GCk4oABVpQ9slO+ML4yCVsGBpjPxujBicVJR5oRNlncjfSCGy0iQqofo/9Qxn73J0yrknKuGRQoA5ln0ldjL2KAmo0IJzEZGVcMihQjWuzRxO+DE4o6SAXsol2zt0pg7mTLuSTLUYIUGACZZ9BXUtJ59bw7wilnHNHMvb3+Ax7cyELkkmvDaDEAxMo+wwivMcv4b0SnCBX3vtlVVUHbKLtRb35fZbDnUZkUGAOZZ9ekDWBOmRSO8kia9JEBgXmyLXZJ1VVvZMvWsS7kxUUWROo08ik0oAwXjiV9z6XrEkTAQrMelL2ob/HdmEyPwvXjEvKHFDLez/n7pSd6hLuQTgdleMDUuJBMZxzJ1L6ec2n/mAtKfE5fXRgkZz2CeP+mA/4npoxT4CCosj+lBCozArf9U9ggqLI/pSTggMVdWOeAAXFcs7NZGVVUqByJw3YCExQpAIzKmoXIwQoKJ5cnz0zPmGFzcILLloDfpNAZWY4m3ojQYnaMU+AAggp/9QTloVeHyFbspRJihM5wAZy2dvMwK2068aYV9+OggAFeIGsro4UBit1ULKgXw7QjixSjuRHS7BSByVLayfwCFCAHSRYOZRJ6zDDU0CXVVWFY4JXBCVAPyRYaY77nMpANzLml7keEe4DAQrQkpwGOJBJa3/kWyvDxLSSHwISYCSNhUo9/sca9+t6vMvPqpQN7gQoQA8kaKlXXG9kAqvkr20zLvXtt7fyEyanX5ZXSoBGErTUgUvV+Ot+y4xLWHj8kp9V46/FBCMvIUABRtYIZiqCDgB4QVVV/w+QY8rZyX/TjwAAAABJRU5ErkJggg==";

  // src/assets/player-icons/skip-forward.png
  var skip_forward_default = "data:image/png;base64,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";

  // src/settings/features/playerControlIcons.ts
  var STYLE_ID6 = "liquify-player-control-icons-style";
  var ICON_CLASS = "liquify-player-control-icon";
  var OBSERVER_KEY = "liquifyPlayerControlIconsObserver";
  var PLAYER_ICONS_KEY = "liquify-player-icons";
  function isPlayerControlIconsEnabled() {
    return (localStorage.getItem(PLAYER_ICONS_KEY) || "on") === "on";
  }
  var CONTROL_SELECTORS = {
    playPause: 'button[data-testid="control-button-playpause"]',
    skipBack: 'button[data-testid="control-button-skip-back"]',
    skipForward: 'button[data-testid="control-button-skip-forward"]',
    shuffle: '.player-controls__left button[aria-label*="Shuffle"]',
    repeat: 'button[data-testid="control-button-repeat"]'
  };
  function getPlayerControlIconCss() {
    return `
${CONTROL_SELECTORS.playPause} .e-10451-button__icon-wrapper svg,
${CONTROL_SELECTORS.skipBack} .e-10451-button__icon-wrapper svg,
${CONTROL_SELECTORS.skipForward} .e-10451-button__icon-wrapper svg {
  display: none !important;
}

.${ICON_CLASS} {
  display: block !important;
  width: var(--liquify-player-control-icon-size, 22px) !important;
  height: var(--liquify-player-control-icon-size, 22px) !important;
  flex: 0 0 auto !important;
  background-color: #fff !important;
  -webkit-mask: var(--liquify-player-control-icon) center / contain no-repeat !important;
  mask: var(--liquify-player-control-icon) center / contain no-repeat !important;
  pointer-events: none !important;
}

${CONTROL_SELECTORS.playPause} .${ICON_CLASS} {
  --liquify-player-control-icon-size: 16px;
}

${CONTROL_SELECTORS.shuffle},
${CONTROL_SELECTORS.repeat},
${CONTROL_SELECTORS.shuffle} .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.repeat} .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.shuffle} .e-10451-icon,
${CONTROL_SELECTORS.repeat} .e-10451-icon {
  color: #fff !important;
  fill: #fff !important;
}

${CONTROL_SELECTORS.shuffle}[aria-checked="true"],
${CONTROL_SELECTORS.repeat}[aria-checked="true"],
${CONTROL_SELECTORS.shuffle}[aria-label*="deaktivieren"],
${CONTROL_SELECTORS.repeat}[aria-label*="deaktivieren"],
${CONTROL_SELECTORS.shuffle}[aria-label*="disable"],
${CONTROL_SELECTORS.repeat}[aria-label*="disable"],
${CONTROL_SELECTORS.shuffle}.encore-internal-color-text-bright-accent,
${CONTROL_SELECTORS.repeat}.encore-internal-color-text-bright-accent,
${CONTROL_SELECTORS.shuffle}[aria-checked="true"] .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.repeat}[aria-checked="true"] .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.shuffle}[aria-label*="deaktivieren"] .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.repeat}[aria-label*="deaktivieren"] .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.shuffle}[aria-label*="disable"] .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.repeat}[aria-label*="disable"] .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.shuffle}.encore-internal-color-text-bright-accent .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.repeat}.encore-internal-color-text-bright-accent .e-10451-button__icon-wrapper,
${CONTROL_SELECTORS.shuffle}[aria-checked="true"] .e-10451-icon,
${CONTROL_SELECTORS.repeat}[aria-checked="true"] .e-10451-icon,
${CONTROL_SELECTORS.shuffle}[aria-label*="deaktivieren"] .e-10451-icon,
${CONTROL_SELECTORS.repeat}[aria-label*="deaktivieren"] .e-10451-icon,
${CONTROL_SELECTORS.shuffle}[aria-label*="disable"] .e-10451-icon,
${CONTROL_SELECTORS.repeat}[aria-label*="disable"] .e-10451-icon,
${CONTROL_SELECTORS.shuffle}.encore-internal-color-text-bright-accent .e-10451-icon,
${CONTROL_SELECTORS.repeat}.encore-internal-color-text-bright-accent .e-10451-icon {
  color: var(--spice-button-active, var(--spice-button, var(--accent-color, #1ed760))) !important;
  fill: var(--spice-button-active, var(--spice-button, var(--accent-color, #1ed760))) !important;
}

span.e-10451-overflow-wrap-anywhere.e-10451-button-primary__inner.encore-inverted-light-set.e-10451-button-icon-only--small {
  transform: scale(1.45) !important;
  transform-origin: center !important;
}
`;
  }
  function getPlayerControlIconsDisabledCss() {
    return `
span.e-10451-overflow-wrap-anywhere.e-10451-button-primary__inner.encore-inverted-light-set.e-10451-button-icon-only--small {
  transform: scale(1.45) !important;
  transform-origin: center !important;
  color: var(--encore-icon-fill, currentColor) !important;
}

.e-10451-legacy-button:hover {
  color: #fff !important;
}
`;
  }
  function disablePlayerControlIcons() {
    updateStyle(STYLE_ID6, getPlayerControlIconsDisabledCss());
    document.querySelectorAll(`.${ICON_CLASS}`).forEach((icon) => icon.remove());
  }
  function getControlWrapper(button) {
    return button?.querySelector(".e-10451-button__icon-wrapper");
  }
  function getPlayPauseIcon(button) {
    const label = (button.getAttribute("aria-label") || "").toLowerCase();
    const isPauseLabel = label.includes("pause") || label.includes("pausieren");
    const isPlaying = Boolean(window.Spicetify?.Player?.isPlaying?.());
    return isPauseLabel || isPlaying ? pause_default : play_default;
  }
  function ensureIconElement(wrapper) {
    let icon = wrapper.querySelector(`.${ICON_CLASS}`);
    if (!icon) {
      icon = document.createElement("span");
      icon.className = ICON_CLASS;
      icon.setAttribute("aria-hidden", "true");
      wrapper.appendChild(icon);
    }
    return icon;
  }
  function setControlIcon(selector, iconUrl) {
    const wrapper = getControlWrapper(document.querySelector(selector));
    if (!wrapper) return;
    const icon = ensureIconElement(wrapper);
    const value = `url("${iconUrl}")`;
    if (icon.style.getPropertyValue("--liquify-player-control-icon") !== value) {
      icon.style.setProperty("--liquify-player-control-icon", value);
    }
  }
  function applyPlayerControlIcons() {
    if (!isPlayerControlIconsEnabled()) {
      disablePlayerControlIcons();
      return;
    }
    const playPauseButton = document.querySelector(CONTROL_SELECTORS.playPause);
    if (playPauseButton) {
      setControlIcon(CONTROL_SELECTORS.playPause, getPlayPauseIcon(playPauseButton));
    }
    setControlIcon(CONTROL_SELECTORS.skipBack, skip_back_default);
    setControlIcon(CONTROL_SELECTORS.skipForward, skip_forward_default);
  }
  function installPlayerControlIcons() {
    const anyWin = window;
    if (!isPlayerControlIconsEnabled()) {
      anyWin[OBSERVER_KEY]?.disconnect?.();
      anyWin[OBSERVER_KEY] = void 0;
      disablePlayerControlIcons();
      return;
    }
    updateStyle(STYLE_ID6, getPlayerControlIconCss());
    applyPlayerControlIcons();
    if (anyWin[OBSERVER_KEY]) return;
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyPlayerControlIcons();
      });
    };
    const observer = new MutationObserver(schedule);
    anyWin[OBSERVER_KEY] = observer;
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-label", "class"],
      childList: true,
      subtree: true
    });
    anyWin.Spicetify?.Player?.addEventListener?.("onplaypause", applyPlayerControlIcons);
    anyWin.Spicetify?.Player?.addEventListener?.("songchange", applyPlayerControlIcons);
  }
  function setPlayerControlIcons(mode) {
    const m2 = mode === "on" ? "on" : "off";
    localStorage.setItem(PLAYER_ICONS_KEY, m2);
    installPlayerControlIcons();
  }

  // src/settings/features/progressBarHeight.ts
  var PROGRESS_BAR_HEIGHT_KEY = "liquify-progress-bar-height";
  var PROGRESS_BAR_HEIGHT_DEFAULT = 4;
  var PROGRESS_BAR_COMPAT_KEY = "liquify-progress-bar-compat";
  function isProgressBarCompat() {
    return readLS(PROGRESS_BAR_COMPAT_KEY, "off") === "on";
  }
  function applyCss2(px) {
    updateStyle(
      "liquify-progress-bar-height",
      isProgressBarCompat() ? "" : `.x-progressBar-progressBarBg, .x-progressBar-sliderArea { --progress-bar-height: ${px}px !important; height: ${px}px !important; }`
    );
  }
  function setProgressBarHeight(px) {
    localStorage.setItem(PROGRESS_BAR_HEIGHT_KEY, String(px));
    applyCss2(px);
  }
  function ensureProgressBarHeightApplied() {
    applyCss2(readNum(PROGRESS_BAR_HEIGHT_KEY, PROGRESS_BAR_HEIGHT_DEFAULT));
  }
  function setProgressBarCompat(enabled, reapplyRadius) {
    localStorage.setItem(PROGRESS_BAR_COMPAT_KEY, enabled ? "on" : "off");
    ensureProgressBarHeightApplied();
    reapplyRadius();
  }

  // src/settings/features/progressBarRadius.ts
  var PROGRESS_BAR_RADIUS_KEY = "liquify-progress-bar-radius";
  var PROGRESS_BAR_RADIUS_DEFAULT = 10;
  function applyCss3(px) {
    updateStyle(
      "liquify-progress-bar-radius",
      isProgressBarCompat() ? "" : `.x-progressBar-progressBarBg, .x-progressBar-sliderArea { border-radius: ${px}px !important; }`
    );
  }
  function setProgressBarRadius(px) {
    localStorage.setItem(PROGRESS_BAR_RADIUS_KEY, String(px));
    applyCss3(px);
  }
  function ensureProgressBarRadiusApplied() {
    applyCss3(readNum(PROGRESS_BAR_RADIUS_KEY, PROGRESS_BAR_RADIUS_DEFAULT));
  }

  // src/settings/features/shareButtonTransition.ts
  var SHARE_BTN_SEL = ".main-watchFeed-shareButtonHidden";
  var TRANSITION = "opacity .3s ease-out, width .3s ease-out";
  function applyShareButtonTransition() {
    document.querySelectorAll(SHARE_BTN_SEL).forEach((btn) => {
      if (btn.dataset.liquifyShareTransition === "1") return;
      btn.dataset.liquifyShareTransition = "1";
      btn.style.setProperty("transition", TRANSITION, "important");
    });
  }
  function installShareButtonTransition() {
    const anyWin = window;
    if (anyWin.liquifyShareBtnTransitionObserver) {
      applyShareButtonTransition();
      return;
    }
    applyShareButtonTransition();
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyShareButtonTransition();
      });
    };
    const observer = new MutationObserver(schedule);
    anyWin.liquifyShareBtnTransitionObserver = observer;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  // src/settings/features/themedLyrics.ts
  var THEMED_LYRICS_KEY = "liquify-themed-lyrics";
  var LYRICS_FONT_SIZE_KEY = "liquify-lyrics-font-size";
  var LYRICS_FONT_SIZE_DEFAULT = 70;
  var LYRICS_MARGIN_KEY = "liquify-lyrics-margin";
  var LYRICS_MARGIN_DEFAULT = 56;
  function applyCss4() {
    const themed = readLS(THEMED_LYRICS_KEY, "on") === "on";
    const size = readNum(LYRICS_FONT_SIZE_KEY, LYRICS_FONT_SIZE_DEFAULT);
    const margin = readNum(LYRICS_MARGIN_KEY, LYRICS_MARGIN_DEFAULT);
    const css = themed ? `.lyrics-lyricsContent-lyric.lyrics-lyricsContent-active { font-size: ${size}px; }
.lyrics-lyricsContent-lyric:not(.aLaX8poOH8kdbmGf) { margin-bottom: ${margin}px; }` : `.lyrics-lyricsContent-lyric:not(.aLaX8poOH8kdbmGf) { margin-bottom: .6em; }`;
    updateStyle("liquify-themed-lyrics", css);
  }
  function setThemedLyrics(on) {
    localStorage.setItem(THEMED_LYRICS_KEY, on ? "on" : "off");
    applyCss4();
  }
  function setLyricsFontSize(px) {
    localStorage.setItem(LYRICS_FONT_SIZE_KEY, String(px));
    applyCss4();
  }
  function setLyricsMargin(px) {
    localStorage.setItem(LYRICS_MARGIN_KEY, String(px));
    applyCss4();
  }
  function ensureThemedLyricsApplied() {
    applyCss4();
  }

  // src/settings/features/transparentControls.ts
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
    /* Hide the window-control overlay only while cinema view has its controls
       hidden (normal cinema mode keeps them visible). */
    .Root__top-container:has(.Root__cinema-view.Root__cinema-view--controls-hidden)::after {
      opacity: 0 !important;
    }
    /* Fullscreen has no window buttons, so nothing needs reserving for them. */
    html.liquify-fullscreen .Root__top-container::after {
      opacity: 0 !important;
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
  function isFullscreen() {
    if (document.fullscreenElement) return true;
    const screenW = window.screen?.width ?? 0;
    const screenH = window.screen?.height ?? 0;
    if (!screenW || !screenH) return false;
    return window.innerWidth >= screenW - 1 && window.innerHeight >= screenH - 1;
  }
  function installFullscreenWatcher() {
    const anyWin = window;
    if (anyWin.liquifyFullscreenWatcher) return;
    anyWin.liquifyFullscreenWatcher = true;
    const sync = () => {
      document.documentElement.classList.toggle("liquify-fullscreen", isFullscreen());
    };
    sync();
    window.addEventListener("resize", sync);
    document.addEventListener("fullscreenchange", sync);
    setInterval(sync, 1e3);
  }

  // src/settings/features/transparentPlayer.ts
  var STYLE_ID7 = "liquify-transparent-player-style";
  function updateTransparentPlayerCss(transparent) {
    const css = transparent ? ".Root__now-playing-bar { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }" : "";
    updateStyle(STYLE_ID7, css);
  }
  function applyTransparentPlayer(mode) {
    const m2 = mode === "on" ? "on" : "off";
    localStorage.setItem("liquify-transparent-player", m2);
    updateTransparentPlayerCss(m2 === "on");
  }
  function applySavedTransparentPlayer() {
    const saved = localStorage.getItem("liquify-transparent-player") || "off";
    updateTransparentPlayerCss(saved === "on");
  }

  // src/settings/features/floatingPlayer.ts
  var STYLE_ID8 = "liquify-floating-player-style";
  var FLOATING_PLAYER_KEY = "liquify-floating-player";
  function updateFloatingPlayerCss(on) {
    const css = on ? [
      // z-index: out of grid flow the bar's paint order would otherwise rest on
      // DOM order alone, leaving it at the mercy of whatever main-view stacks
      // over its strip. Pin it above the content it now floats on top of.
      ".Root__now-playing-bar { position: absolute; bottom: 0px; justify-self: center; z-index: 5; }",
      ".JlQyoTD6puMgqY_y,.main-yourLibraryX-libraryRootlist,.main-nowPlayingView-panel,.L1PjPOgsoqc2nbpl,.QbBd77Gr02YOoZzr,.YT5cYwULCoyD6pGh,.x-settings-container,.main-yourLibraryX-libraryRootlist.YPRhFiIfXdwCZJ9q,.OjXmN1Ml9AEI6JbR,.tsCJQaqF4ALEqTft,.marketplace-footer { padding-bottom: 7rem !important; }",
      ".aotfMYhXr8Ag8I7a { padding-bottom: 6rem !important; }",
      ".goTtSSnEdE9nZjky { padding-block-end: 7rem !important; }",
      "span.e-10451-overflow-wrap-anywhere.e-10451-button-primary__inner.encore-inverted-light-set.e-10451-legacy-button--medium { margin-bottom: 7rem !important; }"
    ].join("\n") : "";
    updateStyle(STYLE_ID8, css);
  }
  function applyFloatingPlayer(mode) {
    const m2 = mode === "on" ? "on" : "off";
    localStorage.setItem(FLOATING_PLAYER_KEY, m2);
    updateFloatingPlayerCss(m2 === "on");
  }
  function applySavedFloatingPlayer() {
    updateFloatingPlayerCss((localStorage.getItem(FLOATING_PLAYER_KEY) || "off") === "on");
  }

  // src/settings/features/connectBar.ts
  var STYLE_ID9 = "liquify-connect-bar-style";
  var CONNECT_BAR_KEY = "liquify-connect-bar";
  function updateConnectBarCss(show) {
    updateStyle(STYLE_ID9, show ? "" : ".main-connectBar-connectBar { display: none !important; }");
  }
  function applyConnectBar(mode) {
    const m2 = mode === "show" ? "show" : "hide";
    localStorage.setItem(CONNECT_BAR_KEY, m2);
    updateConnectBarCss(m2 === "show");
  }
  function applySavedConnectBar() {
    updateConnectBarCss((localStorage.getItem(CONNECT_BAR_KEY) || "show") === "show");
  }

  // src/settings/features/uiEffects.ts
  var POPUP_BOUNCE_KEY = "liquify-popup-bounce";
  function applyPopupBounce(mode) {
    localStorage.setItem(POPUP_BOUNCE_KEY, mode);
    window.dispatchEvent(new Event("liquifyPopupBounceChange"));
  }
  function ensurePopupBounceApplied() {
    window.dispatchEvent(new Event("liquifyPopupBounceChange"));
  }

  // src/settings/features/visualizers.ts
  function installPlaylistIndicatorVisualizer() {
    (async function() {
      while (!Spicetify?.Player || !Spicetify?.Player?.data) await sleep2(300);
      let lastSvg = null;
      let lastIndicator = null;
      function createBars(indicator) {
        if (lastSvg) {
          try {
            lastSvg.remove();
          } catch {
          }
          lastSvg = null;
        }
        if (!indicator || !indicator.parentNode) return;
        const parent = indicator.parentNode;
        const rectHeight = parent.offsetHeight || 20;
        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.left = "0px";
        wrapper.style.top = "0px";
        wrapper.style.width = "22px";
        wrapper.style.height = rectHeight + "px";
        wrapper.style.overflow = "hidden";
        wrapper.style.pointerEvents = "none";
        wrapper.style.color = "var(--spice-button-active, var(--spice-button, var(--spice-text, #1ed760)))";
        wrapper.dataset.liquifyVisualizerWrapper = "1";
        const bars = [];
        const speeds = [];
        const phases = [];
        const fullH = Math.max(8, rectHeight * 0.8);
        for (let i2 = 0; i2 < 4; i2++) {
          const bar = document.createElement("div");
          bar.classList.add("custom-playing-bar");
          bar.style.position = "absolute";
          bar.style.left = i2 * 6 + "px";
          bar.style.width = "4px";
          bar.style.height = fullH + "px";
          bar.style.top = rectHeight / 2 - fullH / 2 + "px";
          bar.style.borderRadius = "2px";
          bar.style.background = "currentColor";
          bar.style.willChange = "clip-path";
          wrapper.appendChild(bar);
          bars.push(bar);
          speeds.push(7e-3 + Math.random() * 6e-3);
          phases.push(Math.random() * Math.PI * 2);
        }
        parent.insertBefore(wrapper, indicator);
        lastSvg = wrapper;
        lastIndicator = indicator;
        let lastHeight = rectHeight;
        const start2 = performance.now();
        function animate() {
          if (!lastSvg || !lastIndicator) return;
          const parentNode = lastIndicator.parentNode;
          if (!parentNode) {
            try {
              lastSvg.remove();
            } catch {
            }
            lastSvg = null;
            lastIndicator = null;
            return;
          }
          const playButton = parentNode.querySelector?.(".main-trackList-rowImagePlayButton");
          const isPlaying = Spicetify.Player.isPlaying() && (!playButton || window.getComputedStyle(playButton).opacity === "0");
          if (!isPlaying) {
            try {
              lastSvg.remove();
            } catch {
            }
            lastSvg = null;
            lastIndicator = null;
            return;
          }
          const now = performance.now();
          const t = now - start2;
          const currentRectHeight = parentNode.offsetHeight || rectHeight;
          const maxHeight = Math.max(8, currentRectHeight * 0.8);
          const minHeight = 4;
          if (lastHeight !== currentRectHeight) {
            lastSvg.style.height = currentRectHeight + "px";
            const top = currentRectHeight / 2 - maxHeight / 2;
            bars.forEach((bar) => {
              bar.style.height = maxHeight + "px";
              bar.style.top = top + "px";
            });
            lastHeight = currentRectHeight;
          }
          bars.forEach((bar, i2) => {
            const height = minHeight + (Math.sin(t * speeds[i2] + phases[i2]) + 1) / 2 * (maxHeight - minHeight);
            const inset = (maxHeight - height) / 2;
            bar.style.clipPath = `inset(${inset}px 0 ${inset}px 0 round 2px)`;
          });
          requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      }
      async function updateIndicator() {
        const indicator = document.querySelector(
          ".POVCTaiu08g8SWXr, [data-playing-indicator]"
        );
        if (!indicator) {
          if (lastSvg) {
            try {
              lastSvg.remove();
            } catch {
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
            } catch {
            }
            lastSvg = null;
            lastIndicator = null;
          }
          return false;
        }
        const parentNode = indicator.parentNode;
        const playButton = parentNode.querySelector?.(".main-trackList-rowImagePlayButton");
        const isPlaying = Spicetify.Player.isPlaying() && (!playButton || window.getComputedStyle(playButton).opacity === "0");
        if (lastSvg && !isPlaying) {
          try {
            lastSvg.remove();
          } catch {
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
          } catch {
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
      let wasPlaying = false;
      function createHomeVisualizer(img) {
        if (homeSvgs.has(img)) return;
        const parent = img.parentNode;
        if (!parent) return;
        const measuredW = img.offsetWidth || parent.offsetWidth || 0;
        const measuredH = img.offsetHeight || parent.offsetHeight || 0;
        const imgWidth = measuredW >= 16 ? measuredW : 24;
        const imgHeight = measuredH >= 16 ? measuredH : 24;
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.width = Math.max(22, imgWidth) + "px";
        wrapper.style.height = imgHeight + "px";
        wrapper.style.overflow = "hidden";
        wrapper.style.pointerEvents = "none";
        wrapper.style.color = "var(--spice-button-active, var(--spice-button, var(--spice-text, #1ed760)))";
        wrapper.style.flex = "0 0 auto";
        const bars = [];
        const fullH = Math.max(8, imgHeight * 0.8);
        for (let i2 = 0; i2 < 4; i2++) {
          const bar = document.createElement("div");
          bar.classList.add("home-visualizer-bar");
          bar.style.position = "absolute";
          bar.style.left = i2 * 6 + "px";
          bar.style.width = "4px";
          bar.style.height = fullH + "px";
          bar.style.top = imgHeight / 2 - fullH / 2 + "px";
          bar.style.borderRadius = "2px";
          bar.style.background = "currentColor";
          bar.style.willChange = "clip-path";
          wrapper.appendChild(bar);
          bars.push({
            element: bar,
            speed: 7e-3 + Math.random() * 6e-3,
            phase: Math.random() * Math.PI * 2
          });
        }
        parent.insertBefore(wrapper, img);
        img.style.visibility = "hidden";
        img.style.width = "0px";
        img.style.height = "0px";
        img.style.margin = "0";
        img.style.padding = "0";
        homeSvgs.set(img, { wrapper, bars, img, parent, lastHeight: imgHeight });
      }
      function updateHomeScreenVisualizer() {
        document.querySelectorAll("img.view-homeShortcutsGrid-equaliserImage").forEach((img) => {
          const im = img;
          if (!homeSvgs.has(im)) createHomeVisualizer(im);
        });
      }
      const homeObserver = new MutationObserver(() => updateHomeScreenVisualizer());
      homeObserver.observe(document.body, { childList: true, subtree: true });
      const start2 = performance.now();
      function animate() {
        const t = performance.now() - start2;
        for (const [img, data] of homeSvgs.entries()) {
          if (!document.body.contains(data.wrapper)) {
            homeSvgs.delete(img);
            continue;
          }
          const imgEl = data.img;
          const pH = data.parent.offsetHeight || 0;
          const rectHeight = pH >= 16 ? pH : data.lastHeight || 24;
          const maxHeight = Math.max(8, rectHeight * 0.8);
          const minHeight = 4;
          if (data.lastHeight !== rectHeight) {
            data.wrapper.style.height = rectHeight + "px";
            const top = rectHeight / 2 - maxHeight / 2;
            data.bars.forEach((barData) => {
              barData.element.style.height = maxHeight + "px";
              barData.element.style.top = top + "px";
            });
            data.lastHeight = rectHeight;
          }
          const shortcut = data.wrapper.closest?.(".view-homeShortcutsGrid-shortcut");
          try {
            data.wrapper.style.display = shortcut && shortcut.matches?.(":hover") ? "none" : "block";
          } catch {
            data.wrapper.style.display = "block";
          }
          data.bars.forEach((barData) => {
            const height = minHeight + (Math.sin(t * barData.speed + barData.phase) + 1) / 2 * (maxHeight - minHeight);
            const inset = (maxHeight - height) / 2;
            barData.element.style.clipPath = `inset(${inset}px 0 ${inset}px 0 round 2px)`;
          });
        }
        requestAnimationFrame(animate);
      }
      animate();
      updateHomeScreenVisualizer();
      Spicetify.Player.addEventListener("onplaypause", () => {
        const isPlaying = Spicetify.Player.isPlaying();
        if (wasPlaying && !isPlaying) {
          for (const [, data] of homeSvgs.entries()) {
            try {
              data.wrapper?.remove();
            } catch {
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

  // src/settings/react-shim.ts
  function getReact() {
    return window?.Spicetify?.React || window?.React;
  }
  function requireReact() {
    const react = getReact();
    if (!react) throw new Error("Spicetify.React is not ready yet");
    return react;
  }
  var ReactFacade = {
    memo(component, compare) {
      const react = getReact();
      return react?.memo ? react.memo(component, compare) : component;
    },
    forwardRef(render) {
      const react = getReact();
      return react?.forwardRef ? react.forwardRef(render) : render;
    },
    createElement(...args) {
      return requireReact().createElement(...args);
    },
    get Fragment() {
      return getReact()?.Fragment || ((props) => props?.children);
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
    const react = requireReact();
    return (react.useLayoutEffect || react.useEffect)(effect, deps);
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
        var n = arguments[r];
        for (var t in n) Object.prototype.hasOwnProperty.call(n, t) && (e[t] = n[t]);
      }
      return e;
    }).apply(this, arguments);
  }
  function c(e, r) {
    if (null == e) return {};
    var n, t, o = {}, a = Object.keys(e);
    for (t = 0; t < a.length; t++) r.indexOf(n = a[t]) >= 0 || (o[n] = e[n]);
    return o;
  }
  function i(e) {
    var n = useRef(e), t = useRef(function(e2) {
      n.current && n.current(e2);
    });
    return n.current = e, t.current;
  }
  var s = function(e, r, n) {
    return void 0 === r && (r = 0), void 0 === n && (n = 1), e > n ? n : e < r ? r : e;
  };
  var f = function(e) {
    return "touches" in e;
  };
  var v = function(e) {
    return e && e.ownerDocument.defaultView || self;
  };
  var d = function(e, r, n) {
    var t = e.getBoundingClientRect(), o = f(r) ? (function(e2, r2) {
      for (var n2 = 0; n2 < e2.length; n2++) if (e2[n2].identifier === r2) return e2[n2];
      return e2[0];
    })(r.touches, n) : r;
    return { left: s((o.pageX - (t.left + v(e).pageXOffset)) / t.width), top: s((o.pageY - (t.top + v(e).pageYOffset)) / t.height) };
  };
  var h = function(e) {
    !f(e) && e.preventDefault();
  };
  var g = react_shim_default.memo(function(o) {
    var a = o.onMove, l = o.onKey, s2 = o.onEnd, g2 = c(o, ["onMove", "onKey", "onEnd"]), m2 = useRef(null), p2 = i(a), b2 = i(l), _2 = i(s2), E2 = useRef(null), C2 = useRef(false), x = useMemo(function() {
      var e = function(e2) {
        h(e2), (f(e2) ? e2.touches.length > 0 : e2.buttons > 0) && m2.current ? p2(d(m2.current, e2, E2.current)) : (n(false), _2());
      }, r = function() {
        n(false), _2();
      };
      function n(n2) {
        var t = C2.current, o2 = v(m2.current), a2 = n2 ? o2.addEventListener : o2.removeEventListener;
        a2(t ? "touchmove" : "mousemove", e), a2(t ? "touchend" : "mouseup", r);
      }
      return [function(e2) {
        var r2 = e2.nativeEvent, t = m2.current;
        if (t && (h(r2), !(function(e3, r3) {
          return r3 && !f(e3);
        })(r2, C2.current) && t)) {
          if (f(r2)) {
            C2.current = true;
            var o2 = r2.changedTouches || [];
            o2.length && (E2.current = o2[0].identifier);
          }
          t.focus(), p2(d(t, r2, E2.current)), n(true);
        }
      }, function(e2) {
        var r2 = e2.which || e2.keyCode;
        r2 < 37 || r2 > 40 || (e2.preventDefault(), b2({ left: 39 === r2 ? 0.05 : 37 === r2 ? -0.05 : 0, top: 40 === r2 ? 0.05 : 38 === r2 ? -0.05 : 0 }));
      }, function(e2) {
        var r2 = e2.which || e2.keyCode;
        r2 >= 37 && r2 <= 40 && _2();
      }, n];
    }, [b2, p2, _2]), H = x[0], M = x[1], N = x[2], w2 = x[3];
    return useEffect(function() {
      return w2;
    }, [w2]), react_shim_default.createElement("div", u({}, g2, { onTouchStart: H, onMouseDown: H, className: "react-colorful__interactive", ref: m2, onKeyDown: M, onKeyUp: N, tabIndex: 0, role: "slider" }));
  });
  var m = function(e) {
    return e.filter(Boolean).join(" ");
  };
  var p = function(r) {
    var n = r.color, t = r.left, o = r.top, a = void 0 === o ? 0.5 : o, l = m(["react-colorful__pointer", r.className]);
    return react_shim_default.createElement("div", { className: l, style: { top: 100 * a + "%", left: 100 * t + "%" } }, react_shim_default.createElement("div", { className: "react-colorful__pointer-fill", style: { backgroundColor: n } }));
  };
  var b = function(e, r, n) {
    return void 0 === r && (r = 0), void 0 === n && (n = Math.pow(10, r)), Math.round(n * e) / n;
  };
  var _ = { grad: 0.9, turn: 360, rad: 360 / (2 * Math.PI) };
  var E = function(e) {
    return L(C(e));
  };
  var C = function(e) {
    return "#" === e[0] && (e = e.substring(1)), e.length < 6 ? { r: parseInt(e[0] + e[0], 16), g: parseInt(e[1] + e[1], 16), b: parseInt(e[2] + e[2], 16), a: 4 === e.length ? b(parseInt(e[3] + e[3], 16) / 255, 2) : 1 } : { r: parseInt(e.substring(0, 2), 16), g: parseInt(e.substring(2, 4), 16), b: parseInt(e.substring(4, 6), 16), a: 8 === e.length ? b(parseInt(e.substring(6, 8), 16) / 255, 2) : 1 };
  };
  var w = function(e) {
    return D(I(e));
  };
  var y = function(e) {
    var r = e.s, n = e.v, t = e.a, o = (200 - r) * n / 100;
    return { h: b(e.h), s: b(o > 0 && o < 200 ? r * n / 100 / (o <= 100 ? o : 200 - o) * 100 : 0), l: b(o / 2), a: b(t, 2) };
  };
  var q = function(e) {
    var r = y(e);
    return "hsl(" + r.h + ", " + r.s + "%, " + r.l + "%)";
  };
  var I = function(e) {
    var r = e.h, n = e.s, t = e.v, o = e.a;
    r = r / 360 * 6, n /= 100, t /= 100;
    var a = Math.floor(r), l = t * (1 - n), u2 = t * (1 - (r - a) * n), c2 = t * (1 - (1 - r + a) * n), i2 = a % 6;
    return { r: b(255 * [t, u2, l, l, c2, t][i2]), g: b(255 * [c2, t, t, u2, l, l][i2]), b: b(255 * [l, l, c2, t, t, u2][i2]), a: b(o, 2) };
  };
  var B = function(e) {
    var r = e.toString(16);
    return r.length < 2 ? "0" + r : r;
  };
  var D = function(e) {
    var r = e.r, n = e.g, t = e.b, o = e.a, a = o < 1 ? B(b(255 * o)) : "";
    return "#" + B(r) + B(n) + B(t) + a;
  };
  var L = function(e) {
    var r = e.r, n = e.g, t = e.b, o = e.a, a = Math.max(r, n, t), l = a - Math.min(r, n, t), u2 = l ? a === r ? (n - t) / l : a === n ? 2 + (t - r) / l : 4 + (r - n) / l : 0;
    return { h: b(60 * (u2 < 0 ? u2 + 6 : u2)), s: b(a ? l / a * 100 : 0), v: b(a / 255 * 100), a: o };
  };
  var S = react_shim_default.memo(function(r) {
    var n = r.hue, t = r.onChange, o = r.onChangeEnd, a = m(["react-colorful__hue", r.className]);
    return react_shim_default.createElement("div", { className: a }, react_shim_default.createElement(g, { onMove: function(e) {
      t({ h: 360 * e.left });
    }, onKey: function(e) {
      t({ h: s(n + 360 * e.left, 0, 360) });
    }, onEnd: o, "aria-label": "Hue", "aria-valuenow": b(n), "aria-valuemax": "360", "aria-valuemin": "0" }, react_shim_default.createElement(p, { className: "react-colorful__hue-pointer", left: n / 360, color: q({ h: n, s: 100, v: 100, a: 1 }) })));
  });
  var T = react_shim_default.memo(function(r) {
    var n = r.hsva, t = r.onChange, o = r.onChangeEnd, a = { backgroundColor: q({ h: n.h, s: 100, v: 100, a: 1 }) };
    return react_shim_default.createElement("div", { className: "react-colorful__saturation", style: a }, react_shim_default.createElement(g, { onMove: function(e) {
      t({ s: 100 * e.left, v: 100 - 100 * e.top });
    }, onKey: function(e) {
      t({ s: s(n.s + 100 * e.left, 0, 100), v: s(n.v - 100 * e.top, 0, 100) });
    }, onEnd: o, "aria-label": "Color", "aria-valuetext": "Saturation " + b(n.s) + "%, Brightness " + b(n.v) + "%" }, react_shim_default.createElement(p, { className: "react-colorful__saturation-pointer", top: 1 - n.v / 100, left: n.s / 100, color: q(n) })));
  });
  var F = function(e, r) {
    if (e === r) return true;
    for (var n in e) if (e[n] !== r[n]) return false;
    return true;
  };
  var X = function(e, r) {
    return e.toLowerCase() === r.toLowerCase() || F(C(e), C(r));
  };
  function Y(e, n, l, u2) {
    var c2 = i(l), s2 = i(u2), f2 = useState(function() {
      return e.toHsva(n);
    }), v2 = f2[0], d2 = f2[1], h2 = useRef({ color: n, hsva: v2 }), g2 = useRef(false);
    useEffect(function() {
      if (!e.equal(n, h2.current.color)) {
        var r = e.toHsva(n);
        h2.current = { hsva: r, color: n }, d2(r), g2.current = false;
      }
    }, [n, e]), useEffect(function() {
      var r;
      F(v2, h2.current.hsva) || e.equal(r = e.fromHsva(v2), h2.current.color) || (h2.current = { hsva: v2, color: r }, c2(r), g2.current = true);
    }, [v2, e, c2]);
    var m2 = useCallback(function(e2) {
      d2(function(r) {
        return Object.assign({}, r, e2);
      });
    }, []), p2 = useCallback(function() {
      g2.current && (g2.current = false, s2(h2.current.color));
    }, [s2]);
    return [v2, m2, p2];
  }
  var R;
  var U = "undefined" != typeof window ? useLayoutEffect : useEffect;
  var V = function() {
    return R || ("undefined" != typeof __webpack_nonce__ ? __webpack_nonce__ : void 0);
  };
  var G = /* @__PURE__ */ new Map();
  var J = function(e) {
    U(function() {
      var r = e.current ? e.current.ownerDocument : document;
      if (void 0 !== r && !G.has(r)) {
        var n = r.createElement("style");
        n.innerHTML = `.react-colorful{position:relative;display:flex;flex-direction:column;width:200px;height:200px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:default}.react-colorful__saturation{position:relative;flex-grow:1;border-color:transparent;border-bottom:12px solid #000;border-radius:8px 8px 0 0;background-image:linear-gradient(0deg,#000,transparent),linear-gradient(90deg,#fff,hsla(0,0%,100%,0))}.react-colorful__alpha-gradient,.react-colorful__pointer-fill{content:"";position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;border-radius:inherit}.react-colorful__alpha-gradient,.react-colorful__saturation{box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}.react-colorful__alpha,.react-colorful__hue{position:relative;height:24px}.react-colorful__hue{background:linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red)}.react-colorful__last-control{border-radius:0 0 8px 8px}.react-colorful__interactive{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:inherit;outline:none;touch-action:none}.react-colorful__pointer{position:absolute;z-index:1;box-sizing:border-box;width:28px;height:28px;transform:translate(-50%,-50%);background-color:#fff;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,.2)}.react-colorful__interactive:focus .react-colorful__pointer{transform:translate(-50%,-50%) scale(1.1)}.react-colorful__alpha,.react-colorful__alpha-pointer{background-color:#fff;background-image:url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill-opacity=".05"><path d="M8 0h8v8H8zM0 8h8v8H0z"/></svg>')}.react-colorful__saturation-pointer{z-index:3}.react-colorful__hue-pointer{z-index:2}`, G.set(r, n);
        var t = V();
        t && n.setAttribute("nonce", t), r.head.appendChild(n);
      }
    }, []);
  };
  var Q = function(n) {
    var t = n.className, o = n.colorModel, a = n.color, l = void 0 === a ? o.defaultColor : a, i2 = n.onChange, s2 = n.onChangeEnd, f2 = c(n, ["className", "colorModel", "color", "onChange", "onChangeEnd"]), v2 = useRef(null);
    J(v2);
    var d2 = Y(o, l, i2, s2), h2 = d2[0], g2 = d2[1], p2 = d2[2], b2 = m(["react-colorful", t]);
    return react_shim_default.createElement("div", u({}, f2, { ref: v2, className: b2 }), react_shim_default.createElement(T, { hsva: h2, onChange: g2, onChangeEnd: p2 }), react_shim_default.createElement(S, { hue: h2.h, onChange: g2, onChangeEnd: p2, className: "react-colorful__last-control" }));
  };
  var W = { defaultColor: "000", toHsva: E, fromHsva: function(e) {
    return w({ h: e.h, s: e.s, v: e.v, a: 1 });
  }, equal: X };
  var Z = function(r) {
    return react_shim_default.createElement(Q, u({}, r, { colorModel: W }));
  };

  // src/settings/components/settingsStyles.tsx
  function openExternalLink(url) {
    if (!url) return;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      try {
        location.href = url;
      } catch {
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
      width: min(560px, 92vw);
      min-width: 0;
      padding: 18px 0 20px;
      border-radius: 20px;
      color: white;
      background: transparent;
      box-shadow: var(--liquify-shadow);
      position: relative;
      isolation: isolate;
      transform: translateZ(0);
      will-change: transform;
      height: min(70vh, calc(100vh - 80px));
      max-height: min(70vh, calc(100vh - 80px));
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .liquifySettingsHeader {
      height: 100px;
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
      box-shadow: var(--liquify-shadow) !important;
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
      padding-top: 0px;
      padding-right: 22px;
      padding-bottom: 10px;
      margin-bottom: -20px;
      will-change: box-shadow, backdrop-filter;
      box-sizing: border-box;
      overflow-y: overlay;
      scrollbar-width: auto;
      scrollbar-color: rgba(205, 205, 205, 0.78) transparent;
    }
    .liquifySettingsBody::-webkit-scrollbar { width: 12px; }
    .liquifySettingsBody::-webkit-scrollbar-track { background: transparent; }
    .liquifySettingsBody::-webkit-scrollbar-thumb { background: rgba(205, 205, 205, 0.78); border-radius: 999px; }
    .liquifySettingsBody::-webkit-scrollbar-thumb:hover { background: rgba(225, 225, 225, 0.9); }
    .liquifySettingsBody.isDropdownOpen {
      scrollbar-color: transparent transparent;
    }
    .liquifySettingsBody.isDropdownOpen::-webkit-scrollbar-thumb,
    .liquifySettingsBody.isDropdownOpen::-webkit-scrollbar-thumb:hover {
      background: transparent;
    }
    .liquifySearchIsland {
      margin: 0 34px 12px 34px;
      padding: 10px;
      border-radius: 16px;
      box-shadow: var(--liquify-shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 0 0 auto;
    }
    .liquifySearchInput {
      width: 100%;
      padding: 8px 12px;
      font-size: 13px;
      border: none;
      outline: none;
    }
    .liquifySearchInput::placeholder { color: rgba(255,255,255,0.45); }
    .liquifySectionNavWrap {
      position: relative;
      min-width: 0;
    }
    .liquifySectionNav {
      display: flex;
      gap: 8px;
      min-width: 0;
      overflow-x: auto;
      overflow-y: hidden;
      /* Room so the buttons' hover scale and glow aren't clipped by the scroll container. */
      padding: 10px 12px 13px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .liquifySectionNav::-webkit-scrollbar { width: 0; height: 0; display: none; }
    .liquifySectionNavScrollBtn {
      position: fixed;
      z-index: 1000002;
      width: 30px;
      height: 28px;
      padding: 0;
      border-radius: 12px;
      border: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      background: transparent;
      box-shadow: var(--liquify-shadow);
      font-size: 22px;
      line-height: 1;
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease, background-color 0.2s ease;
    }
    .liquifySectionNavScrollBtn:hover { transform: scale(1.08); background: var(--liquify-glow-accent); }
    .liquifySectionNavScrollBtn:active { transform: scale(0.95); }
    .liquifySectionNavBtn {
      flex: 0 0 auto;
      padding: 5px 12px;
      height: 28px;
      border-radius: 10px;
      border: 0;
      cursor: pointer;
      white-space: nowrap;
      font-size: 12px;
      color: white;
      background: transparent;
      box-shadow: var(--liquify-shadow);
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease, background-color 0.2s ease;
    }
    .liquifySectionNavBtn:hover { transform: scale(1.08); background: var(--liquify-glow-accent); }
    .liquifySectionNavBtn:active { transform: scale(0.95); }
    .liquifyRow {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 10px;
      width: 100%;
      margin: 10px 0;
      flex-wrap: wrap;
      box-shadow: var(--liquify-shadow);
      padding: 10px;
      border-radius: 17px;
    }
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
    .liquifyControlSurface { background: transparent; border: none; border-radius: 12px; color: white; box-shadow: var(--liquify-shadow); }
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
      position: fixed;
      z-index: 999999;
      background: transparent;
      border-radius: 15px;
      overflow: hidden;
      padding: 4px;
      box-sizing: border-box;
      box-shadow: var(--liquify-shadow);
      color: white;
      width: max-content;
    }
    .liquifySelectItem {
      padding: 8px 10px;
      margin: 2px;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
      color: white;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      transition: background-color 0.25s ease, box-shadow 0.28s ease, transform 0.25s ease;
    }
    .liquifySelectItem:hover {
      background: var(--liquify-glow-accent);
      box-shadow: var(--liquify-shadow);
      transform: scale(1.02);
    }

    .liquifyPopover {
      --glass-filter: url(#glass-filter--r1-7);
      position: fixed;
      z-index: 1000000;
      border-radius: 17px;
      overflow: hidden;
      background: #00000057;
      backdrop-filter: var(--glass-filter) blur(5px);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px);
      box-shadow: var(--liquify-shadow);
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
    .react-colorful__last-control {
      border-radius: 10px !important;
      overflow: visible !important;
      box-shadow: 0 0 12px 2px rgba(255,255,255,0.06), var(--liquify-shadow);
    }
    .react-colorful__last-control .react-colorful__interactive { border-radius: 10px !important; }
    .react-colorful__hue-pointer {
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: rgba(255,255,255,0.95);
      box-shadow: 0 0 0 3px rgba(0,0,0,0.35);
    }
    .liquifyInline { display: flex; align-items: center; gap: 6px; }
    .liquifyStepperBtn {
      width: 24px; height: 24px; border-radius: 9px; cursor: pointer;
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease, background-color 0.2s ease !important;
    }
    .liquifyStepperBtn:hover { background: var(--accent-color) !important; transform: scale(1.15); }
    /* Press feedback must NOT shrink the button: a smaller :active box pulls its
       edge out from under the cursor, so an edge press releases outside the
       button and the click never fires. Keep the hovered scale and darken
       instead, so presses anywhere on the button register. */
    .liquifyStepperBtn:active { transform: scale(1.15); filter: brightness(0.82); }
    .liquifyNumberInput { width: 74px; padding: 5px 6px; text-align: center; }
    .liquifySubBlock { margin-left: 0; display: flex; flex-direction: column; gap: 8px; }
    .liquifyActionBtn { padding: 6px 10px; cursor: pointer; transition: background-color 0.2s ease; }
    .liquifyActionBtn:hover { background: var(--liquify-glow-accent) !important; }
    .liquifyConfigBlock { display: flex; flex-direction: column; gap: 10px; }
    .liquifyConfigHint { font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.7); }
    .liquifyConfigTextarea {
      width: 100%;
      box-sizing: border-box;
      min-height: 220px;
      resize: vertical;
      padding: 12px 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #fff;
      background: transparent;
      border: none;
      outline: none;
      border-radius: 14px;
      white-space: pre-wrap;
      word-break: break-word;
      overflow: auto;
    }
    .liquifyConfigTextarea::-webkit-scrollbar { width: 10px; }
    .liquifyConfigTextarea::-webkit-scrollbar-thumb { background: rgba(205,205,205,0.6); border-radius: 999px; }
    .liquifyConfigActions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    .liquifyConfigApplyBtn:hover { background: var(--liquify-glow-accent) !important; }
    .liquifyConfigStatus { font-size: 12px; line-height: 1.45; }
    .liquifyConfigStatus.isOk { color: #5ad17f; }
    .liquifyConfigStatus.isError { color: #ff8a8a; }
    .liquifyHelpIcon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 15px;
      height: 15px;
      margin-left: 6px;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      color: rgba(255,255,255,0.72);
      box-shadow: var(--liquify-shadow);
      cursor: help;
      user-select: none;
      flex: 0 0 auto;
      vertical-align: middle;
      transition: color 0.15s ease, transform 0.15s ease;
    }
    .liquifyHelpIcon:hover { color: #fff; transform: scale(1.12); }
    .liquifyResetBtn {
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease, background-color 0.2s ease;
    }
    .liquifyResetBtn:hover {
      transform: scale(1.08);
      background: var(--liquify-glow-accent) !important;
    }
    .liquifyResetBtn:active { transform: scale(0.95); }
    .liquifyTextInput { width: 100%; padding: 6px 10px; border: none; border-radius: 12px; font-size: 13px; color: #fff; background: transparent; outline: none; }
    .liquifyTextInput::placeholder { color: rgba(255,255,255,0.4); }
    .liquifyIndentedBtn { margin-left: 31px; }
    .liquifyColorSwatch { width: 20px; height: 20px; border-radius: 6px; box-shadow: var(--liquify-shadow); }
    .liquid-toggle {
      --complete: 0;
      --unchecked: transparent;
      --checked: var(--spice-button-active, var(--spice-button, var(--accent-color, #1ed760)));
      --control: #fff;
      --border: 3px;
      --width: 54;
      --height: 30;
      --transition: 0.2s;
      --ease: ease-out;
      position: relative;
      width: calc(var(--width) * 1px);
      height: calc(var(--height) * 1px);
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: transparent;
      /* The rim (--liquify-shadow) lives on the .liquid-toggle__rim overlay
         instead of here: these are inset shadows, and the opaque "on" indicator
         would otherwise paint over them so the rim only showed in the off state. */
      cursor: pointer;
      container-type: inline-size;
      overflow: visible;
      isolation: isolate;
      transform-style: preserve-3d;
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1);
      flex: 0 0 auto;
      touch-action: none;
      user-select: none;
    }
    .liquid-toggle * { pointer-events: none; }
    .liquid-toggle:focus-visible {
      outline: 2px solid var(--checked);
      outline-offset: 3px;
    }
    .liquid-toggle[aria-pressed="true"] { --complete: 100; }
    .liquid-toggle[data-active="true"] {
      --transition: 0.32s;
      --ease: cubic-bezier(0.3, 2.25, 0.32, 1);
    }
    /* While dragging, kill the transition so the knob tracks the cursor 1:1.
       Placed after the data-active rule so it wins on the shared --transition. */
    .liquid-toggle[data-dragging="true"] {
      --transition: 0s;
      --ease: linear;
    }
    .liquid-toggle .indicator {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: color-mix(in srgb, var(--unchecked), var(--checked) calc(var(--complete) * 1%));
      transition: background-color var(--transition) var(--ease);
      overflow: hidden;
      z-index: 0;
    }
    .liquid-toggle .knockout {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      overflow: hidden;
      z-index: 1;
    }
    .liquid-toggle .wrapper {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      clip-path: inset(0 0 0 0 round 999px);
      filter: blur(4px);
      transition: filter var(--transition) var(--ease);
    }
    .liquid-toggle[data-active="true"] .wrapper,
    .liquid-toggle:active .wrapper {
      filter: blur(0);
    }
    .liquid-toggle .liquids {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      overflow: hidden;
      filter: url(#liquify-toggle-goo);
    }
    .liquid-toggle .liquid__shadow {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow:
        inset 0 0 3px 3px var(--checked),
        inset calc(((var(--complete) / 100) * 6px) - 3px) 0 3px 3px var(--checked);
      opacity: calc(var(--complete) / 100);
      transition: opacity var(--transition) var(--ease), box-shadow var(--transition) var(--ease);
    }
    .liquid-toggle .liquid__track {
      position: absolute;
      top: 50%;
      left: 0;
      width: calc((var(--width) * 1px) - (0 * var(--border)));
      height: calc((var(--height) * 1px) - (0 * var(--border)));
      border-radius: inherit;
      background: var(--checked);
      /* Fade the accent fill with --complete so the toggle is transparent when
         off and only shows the accent colour when on. */
      opacity: calc(var(--complete) / 100);
      translate: calc((var(--complete) / 100) * (100cqi - 100% - (6 * var(--border)))) -50%;
      transition:
        opacity var(--transition) var(--ease),
        translate var(--transition) var(--ease),
        height var(--transition) var(--ease),
        width var(--transition) var(--ease),
        left var(--transition) var(--ease);
    }
    .liquid-toggle .indicator--masked {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--checked);
      z-index: 2;
      opacity: calc(var(--complete) / 100);
      transition: opacity var(--transition) var(--ease);
      overflow: hidden;
    }
    .liquid-toggle .indicator--masked .mask {
      position: absolute;
      top: 50%;
      left: var(--border);
      width: calc(60% - (2 * var(--border)));
      height: calc(100% - (2 * var(--border)));
      border-radius: inherit;
      background: rgba(0,0,0,0.18);
      translate: calc((var(--complete) / 100) * (100cqi - 60cqi - (0 * var(--border)))) -50%;
      transition:
        translate var(--transition) var(--ease),
        height var(--transition) var(--ease),
        width var(--transition) var(--ease),
        margin var(--transition) var(--ease);
    }
    .liquid-toggle .indicator__liquid {
      position: absolute;
      top: 50%;
      left: var(--border);
      width: calc(60% - (2 * var(--border)));
      height: calc(100% - (2 * var(--border)));
      border-radius: inherit;
      translate: calc((var(--complete) / 100) * (100cqi - 100% - (2 * var(--border)))) -50%;
      transition:
        translate var(--transition) var(--ease),
        scale var(--transition) var(--ease);
      z-index: 3;
      /* The knob body is OUR glass: theme.ts attaches a GlassSurface to
         ".liquid-toggle .indicator__liquid", so .liquify-glass--svg paints the
         backdrop refraction here while the background stays transparent. The
         box-shadow only adds the glass rim/depth \u2014 the lens itself is the
         backdrop-filter, not these shadows. */
      overflow: hidden;
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.55),
        inset 0 -1px 1px rgba(0, 0, 0, 0.28),
        0 1px 3px rgba(0, 0, 0, 0.35);
    }
    .liquid-toggle[data-active="true"] .indicator--masked .mask,
    .liquid-toggle:active .indicator--masked .mask {
      height: calc((100% - (2 * var(--border))) * 1.65);
      width: calc((60% - (2 * var(--border))) * 1.65);
      margin-left: calc((60% - (2 * var(--border))) * -0.325);
    }
    .liquid-toggle[data-active="true"] .indicator__liquid,
    .liquid-toggle:active .indicator__liquid {
      scale: 1.65;
    }
    /* Thin top highlight + faint bottom shade painted over the glass lens so it
       reads as glass without hiding the refraction underneath (replaces the
       website's opaque white .cover / .shadow knob). */
    .liquid-toggle .indicator__liquid .liquid-toggle__gloss {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.35),
        rgba(255, 255, 255, 0) 45%,
        rgba(0, 0, 0, 0.10)
      );
      pointer-events: none;
    }
    /* Pill rim highlight, painted above every colored/glass layer so it stays
       visible whether the toggle is on or off (the inset --liquify-shadow would
       otherwise be hidden by the opaque "on" indicator). */
    .liquid-toggle .liquid-toggle__rim {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: var(--liquify-shadow);
      pointer-events: none;
      z-index: 4;
    }
    .liquifyToggleFilters {
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
      pointer-events: none;
    }

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
      box-shadow: var(--liquify-shadow);
    }
    .liquifySectionBody {
      padding: 10px;
      border-radius: 14px;
      background: transparent;
      box-shadow: var(--liquify-shadow);
    }
    .liquifySectionBody .liquifyRow { margin: 8px 0; }
    .liquifySubSection {
      margin: 8px 0;
      padding: 10px;
      border-radius: 15px;
      box-shadow: var(--liquify-shadow);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .liquifySubSection .liquifyRow { margin: 0; }
    .liquifySubSectionTitle {
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      text-transform: none;
      letter-spacing: 0;
      color: white;
      opacity: 1;
      text-align: left;
      margin: 0 0 2px 4px;
    }
    .liquifyTooltipPopup {
      --glass-filter: url(#glass-filter--r1-7);
      position: fixed;
      z-index: 1000001;
      padding: 7px 11px;
      border-radius: 10px;
      background: transparent;
      backdrop-filter: var(--glass-filter) blur(5px);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px);
      color: white;
      font-size: 13px;
      line-height: 1.4;
      pointer-events: none;
      white-space: normal;
      word-break: break-word;
      width: max-content;
      max-width: 260px;
      text-align: center;
      transform: translateX(-50%) translateY(-3px);
      opacity: 0;
      transition: opacity 160ms ease, transform 160ms ease;
      box-shadow: var(--liquify-shadow);
    }
    .liquifyTooltipPopup.isVisible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* Settings panel open/close \u2014 uses the popup-bounce curves (see popupBounce.ts):
       enter springs up from scale(0.86) with an overshoot; exit drops, shrinks and
       fades with a sharp ease-in. transform-origin matches the popup bounce. */
    .liquifySettingsPanel {
      opacity: 0;
      transform: scale(0.86);
      transform-origin: top center;
      will-change: transform, opacity;
    }
    #liquify-settings-react-overlay.overlay-visible .liquifySettingsPanel {
      opacity: 1;
      transform: translateY(0) scale(1);
      transition: transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1),
                  opacity 360ms ease-out;
    }
    #liquify-settings-react-overlay.overlay-closing .liquifySettingsPanel {
      opacity: 0;
      transform: translateY(8px) scale(0.95);
      transition: transform 260ms cubic-bezier(0.8, 0, 0.2, 1),
                  opacity 220ms ease-in;
    }
  `;
    document.head.appendChild(style);
  }
  function useOutsideClick(open, onClose, refs) {
    React.useEffect(() => {
      if (!open) return;
      const handler = (ev) => {
        for (const r of refs) {
          const node = r?.current;
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
        const btn = btnRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const margin = 6;
        const panel = btn.closest?.(".liquifySettingsPanel");
        const body = panel?.querySelector?.(".liquifySettingsBody") ?? null;
        const bounds = body?.getBoundingClientRect ? body.getBoundingClientRect() : panel ? panel.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
        const controls = btn.closest?.(".liquifyRowControls") ?? null;
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
    ), popover && (ReactDOM?.createPortal ? ReactDOM.createPortal(popover, document.body) : popover));
  }
  function Select(props) {
    const btnRef = React.useRef(null);
    const menuRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    const [pos, setPos] = React.useState(null);
    const useLayout = React.useLayoutEffect || React.useEffect;
    useOutsideClick(open, () => setOpen(false), [btnRef, menuRef]);
    useLayout(() => {
      if (!open) return;
      const body = btnRef.current?.closest?.(".liquifySettingsPanel")?.querySelector?.(".liquifySettingsBody");
      if (!body) return;
      body.classList.add("isDropdownOpen");
      return () => {
        body.classList.remove("isDropdownOpen");
      };
    }, [open]);
    const current = props.options.find((o) => o.value === props.value) ?? props.options[0];
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
        const btn = btnRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const margin = 6;
        const panel = btn.closest?.(".liquifySettingsPanel");
        const body = panel?.querySelector?.(".liquifySettingsBody") ?? null;
        const bounds = body?.getBoundingClientRect ? body.getBoundingClientRect() : panel ? panel.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
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
      /* @__PURE__ */ React.createElement("span", { className: "liquifySelectLabel" }, current?.label ?? props.value),
      /* @__PURE__ */ React.createElement("span", { className: "liquifySelectChevron", "aria-hidden": "true" })
    ), menu && (ReactDOM?.createPortal ? ReactDOM.createPortal(menu, document.body) : menu));
  }
  function Toggle(props) {
    const [active, setActive] = React.useState(false);
    const btnRef = React.useRef(null);
    const animatingRef = React.useRef(false);
    const timersRef = React.useRef([]);
    const downRef = React.useRef(false);
    const draggingRef = React.useRef(false);
    const draggedRef = React.useRef(false);
    const startRef = React.useRef({ x: 0, complete: 0 });
    const completeRef = React.useRef(0);
    const DRAG_THRESHOLD = 3;
    const BUBBLE_MS = 160;
    const SLIDE_MS = 320;
    const clearTimers = () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
    };
    const later = (fn, ms) => {
      timersRef.current.push(setTimeout(fn, ms));
    };
    React.useEffect(() => () => clearTimers(), []);
    const setComplete = (v2) => {
      completeRef.current = v2;
      btnRef.current?.style.setProperty("--complete", String(v2));
    };
    const runToggle = () => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      setActive(true);
      later(() => {
        props.onChange(!props.checked);
        later(() => {
          setActive(false);
          animatingRef.current = false;
        }, SLIDE_MS);
      }, BUBBLE_MS);
    };
    const onPointerDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      if (animatingRef.current) return;
      const el = btnRef.current;
      if (!el) return;
      clearTimers();
      animatingRef.current = false;
      downRef.current = true;
      draggingRef.current = false;
      draggedRef.current = false;
      startRef.current = { x: e.clientX, complete: props.checked ? 100 : 0 };
      completeRef.current = startRef.current.complete;
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {
      }
      setActive(true);
    };
    const onPointerMove = (e) => {
      if (!downRef.current) return;
      const el = btnRef.current;
      if (!el) return;
      const dx = e.clientX - startRef.current.x;
      if (!draggingRef.current && Math.abs(dx) < DRAG_THRESHOLD) return;
      if (!draggingRef.current) {
        draggingRef.current = true;
        el.setAttribute("data-dragging", "true");
      }
      const travel = el.getBoundingClientRect().width * 0.4 || 1;
      setComplete(clamp(startRef.current.complete + dx / travel * 100, 0, 100));
    };
    const onPointerUp = (e) => {
      if (!downRef.current) return;
      downRef.current = false;
      const el = btnRef.current;
      if (el) try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
      }
      if (!draggingRef.current) return;
      draggingRef.current = false;
      draggedRef.current = true;
      el?.removeAttribute("data-dragging");
      setActive(false);
      const target = completeRef.current >= 50 ? 100 : 0;
      setComplete(target);
      props.onChange(target === 100);
      later(() => {
        el?.style.removeProperty("--complete");
      }, SLIDE_MS);
    };
    const onPointerCancel = () => {
      downRef.current = false;
      draggingRef.current = false;
      const el = btnRef.current;
      el?.removeAttribute("data-dragging");
      el?.style.removeProperty("--complete");
      setActive(false);
    };
    const onClick = () => {
      if (draggedRef.current) {
        draggedRef.current = false;
        return;
      }
      runToggle();
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("svg", { className: "liquifyToggleFilters", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("filter", { id: "liquify-toggle-goo" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "2", result: "blur" }), /* @__PURE__ */ React.createElement(
      "feColorMatrix",
      {
        in: "blur",
        mode: "matrix",
        values: "1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 16 -10",
        result: "goo"
      }
    ), /* @__PURE__ */ React.createElement("feComposite", { in: "SourceGraphic", in2: "goo", operator: "atop" })))), /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: btnRef,
        type: "button",
        className: "liquid-toggle",
        "data-active": active ? "true" : "false",
        "aria-pressed": props.checked ? "true" : "false",
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        onClick
      },
      /* @__PURE__ */ React.createElement("span", { className: "indicator", "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement("span", { className: "knockout", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "indicator indicator--masked" }, /* @__PURE__ */ React.createElement("span", { className: "mask" }))),
      /* @__PURE__ */ React.createElement("span", { className: "wrapper", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "liquids" }, /* @__PURE__ */ React.createElement("span", { className: "liquid__shadow" }), /* @__PURE__ */ React.createElement("span", { className: "liquid__track" }))),
      /* @__PURE__ */ React.createElement("span", { className: "indicator__liquid", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "liquid-toggle__gloss" })),
      /* @__PURE__ */ React.createElement("span", { className: "liquid-toggle__rim", "aria-hidden": "true" })
    ));
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
    const [render, setRender] = React.useState(false);
    const [shown, setShown] = React.useState(false);
    const [pos, setPos] = React.useState(null);
    const hideTimer = React.useRef(null);
    const computePos = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      let left = r.left + r.width / 2;
      let top = r.bottom + 6;
      if (top + 40 > window.innerHeight - 4) top = r.top - 40 - 6;
      setPos({ left, top });
    };
    const handleEnter = () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      computePos();
      setRender(true);
    };
    const handleLeave = () => {
      setShown(false);
      hideTimer.current = window.setTimeout(() => {
        setRender(false);
        setPos(null);
      }, 220);
    };
    React.useEffect(() => {
      if (!render || !pos) return;
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }, [render, pos]);
    React.useEffect(() => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }, []);
    const popup = render && pos ? /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "liquifyTooltipPopup" + (shown ? " isVisible" : ""),
        style: { left: `${pos.left}px`, top: `${pos.top}px` }
      },
      props.text
    ) : null;
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        ref: wrapRef,
        style: { display: "inline-flex", verticalAlign: "middle" },
        onMouseEnter: handleEnter,
        onMouseLeave: handleLeave
      },
      props.children,
      popup && (ReactDOM?.createPortal ? ReactDOM.createPortal(popup, document.body) : popup)
    );
  }
  function HelpTip(props) {
    return /* @__PURE__ */ React.createElement(ButtonTooltip, { text: props.text }, /* @__PURE__ */ React.createElement("span", { className: "liquifyHelpIcon", role: "img", "aria-label": "Help", tabIndex: 0 }, "?"));
  }
  function Section(props) {
    return /* @__PURE__ */ React.createElement("div", { className: "liquifySection", id: props.id }, /* @__PURE__ */ React.createElement("div", { className: "liquifySectionTitle" }, props.title), /* @__PURE__ */ React.createElement("div", { className: "liquifySectionBody" }, props.children));
  }
  function SubSection(props) {
    return /* @__PURE__ */ React.createElement("div", { className: "liquifySubSection" }, /* @__PURE__ */ React.createElement("div", { className: "liquifySubSectionTitle" }, props.title), props.children);
  }

  // src/settings/gear.ts
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
      width: 47px;
      height: 47px;
      border: 0;
      background: transparent;
      cursor: pointer;
      color: var(--text-subdued);
      z-index: 2;
      align-self: center;
      box-shadow: var(--liquify-shadow);
      border-radius: 17px;
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1) !important;
    }
    #liquify-settings-gear-btn:hover {
      color: var(--text-base);
      transform: scale(1.05);
    }
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
    const host = document.querySelector(LIQUIFY_GEAR_HOST_SELECTOR);
    if (!host) {
      console.warn("[Liquify] Settings button: host container not found (", LIQUIFY_GEAR_HOST_SELECTOR, ")");
      return false;
    }
    if (host.querySelector?.("#liquify-settings-gear-btn")) return true;
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
    let gearTooltipTimer = null;
    btn.addEventListener("mouseenter", () => {
      if (gearTooltipTimer) {
        clearTimeout(gearTooltipTimer);
        gearTooltipTimer = null;
      }
      if (!gearTooltipEl) {
        gearTooltipEl = document.createElement("div");
        gearTooltipEl.className = "liquifyTooltipPopup";
        gearTooltipEl.textContent = t.settingsTitle || "Liquify Settings";
        document.body.appendChild(gearTooltipEl);
      }
      const r = btn.getBoundingClientRect();
      let left = r.left + r.width / 2;
      let top = r.bottom + 6;
      if (top + 40 > window.innerHeight - 4) top = r.top - 40 - 6;
      gearTooltipEl.style.left = left + "px";
      gearTooltipEl.style.top = top + "px";
      void gearTooltipEl.offsetWidth;
      gearTooltipEl.classList.add("isVisible");
    });
    btn.addEventListener("mouseleave", () => {
      const tip = gearTooltipEl;
      if (!tip) return;
      tip.classList.remove("isVisible");
      if (gearTooltipTimer) clearTimeout(gearTooltipTimer);
      gearTooltipTimer = setTimeout(() => {
        tip.remove();
        if (gearTooltipEl === tip) gearTooltipEl = null;
        gearTooltipTimer = null;
      }, 220);
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

  // src/settings/links.ts
  var LIQUIFY_DISCORD_URL = "https://discord.gg/QRMnrgjhvq";
  var LIQUIFY_GITHUB_URL = "https://github.com/NMWplays/Liquify";

  // src/settings/features/config.ts
  var PLAIN_KEYS = [
    "liquify-accent-mode",
    "liquify-accent-source",
    "liquify-custom-color",
    "liquify-accent-sat-boost",
    "liquify-accent-light-boost",
    "liquify-glow-mode",
    "liquify-glow-color",
    "liquify-bg-mode",
    "liquify-bg-custom-animated",
    "liquify-bg-blur",
    "liquify-bg-brightness",
    "liquify-bg-url",
    "liquify-artist-bg-mode",
    "liquify-artist-bg-url",
    "liquify-artist-scroll-blur",
    "liquify-artist-scroll-brightness",
    "liquify-player-width",
    "liquify-player-custom-width",
    "liquify-player-custom-height",
    "liquify-player-radius",
    "liquify-playlist-header-mode",
    "liquify-action-bar-box-mode",
    "liquify-transparent-player",
    "liquify-compact-player",
    "liquify-lyrics-mode",
    "liquify-glass-enabled"
  ];
  var CONFIG_KEYS = [
    ...PLAIN_KEYS,
    FLOATING_PLAYER_KEY,
    CONNECT_BAR_KEY,
    HOME_LAYOUT_KEY,
    POPUP_BOUNCE_KEY,
    PROGRESS_BAR_HEIGHT_KEY,
    PROGRESS_BAR_RADIUS_KEY,
    PROGRESS_BAR_COMPAT_KEY,
    GLASS_BLUR_KEY,
    BACKDROP_BLUR_KEY,
    NAV_RADIUS_KEY,
    MAIN_RADIUS_KEY,
    RIGHT_RADIUS_KEY,
    THEMED_LYRICS_KEY,
    LYRICS_FONT_SIZE_KEY,
    LYRICS_MARGIN_KEY,
    NSC_SHOW_KEY,
    NSC_POSITION_KEY,
    NSC_HEIGHT_KEY,
    NSC_MAX_WIDTH_KEY,
    NSC_GAP_KEY,
    NSC_COVER_SIZE_KEY,
    NSC_HPAD_KEY,
    NSC_VPAD_KEY,
    NSC_GAP_PLAYER_KEY,
    NSC_BORDER_RADIUS_KEY,
    NSC_COVER_BORDER_RADIUS_KEY,
    NPVC_MODE_KEY,
    NPVC_SHOW_ALWAYS_KEY,
    NPVC_BLUR_KEY,
    CCA_ENABLED_KEY,
    CCA_WIDTH_KEY,
    CCA_HEIGHT_KEY,
    CCA_MARGIN_BOTTOM_KEY,
    CCA_MARGIN_LEFT_KEY,
    PLAYBAR_COVER_BORDER_RADIUS_KEY,
    PLAYER_ICONS_KEY
  ];
  var CONFIG_KEY_SET = new Set(CONFIG_KEYS);
  function collectSettings() {
    const settings = {};
    for (const key of CONFIG_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) settings[key] = value;
    }
    return settings;
  }
  function settingsFingerprint() {
    return JSON.stringify(collectSettings());
  }
  function exportConfig() {
    const payload = {
      app: "Liquify V2",
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      settings: collectSettings()
    };
    return JSON.stringify(payload, null, 2);
  }
  function looksFlat(obj) {
    return CONFIG_KEYS.some((k) => Object.prototype.hasOwnProperty.call(obj, k));
  }
  function importConfig(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: "Invalid JSON." };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "Config must be a JSON object." };
    }
    const settings = parsed.settings && typeof parsed.settings === "object" && !Array.isArray(parsed.settings) ? parsed.settings : looksFlat(parsed) ? parsed : null;
    if (!settings) {
      return { ok: false, error: "No Liquify settings found in this JSON." };
    }
    if (!Object.keys(settings).some((k) => CONFIG_KEY_SET.has(k))) {
      return { ok: false, error: "No Liquify settings found in this JSON." };
    }
    let applied = 0;
    for (const key of CONFIG_KEYS) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        const value = settings[key];
        if (value === null || value === void 0) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, String(value));
          applied++;
        }
      } else {
        localStorage.removeItem(key);
      }
    }
    try {
      window.liquifyApplyAllSettings?.();
    } catch {
    }
    window.dispatchEvent(new Event("liquifyConfigApplied"));
    return { ok: true, applied };
  }

  // src/settings/components/SettingsContent.tsx
  function SettingsContent(props) {
    const [lyricsMode, setLyricsMode] = React.useState(readLS("liquify-lyrics-mode", "romanization"));
    const [themedLyrics, setThemedLyricsState] = React.useState(readLS(THEMED_LYRICS_KEY, "on"));
    const [lyricsFontSize, setLyricsFontSizeState] = React.useState(readNum(LYRICS_FONT_SIZE_KEY, LYRICS_FONT_SIZE_DEFAULT));
    const [lyricsMargin, setLyricsMarginState] = React.useState(readNum(LYRICS_MARGIN_KEY, LYRICS_MARGIN_DEFAULT));
    const applyLyricsMode = (mode) => {
      setLyricsMode(mode);
      localStorage.setItem("liquify-lyrics-mode", mode);
      window.dispatchEvent(new Event("liquifyLyricsModeChange"));
    };
    const t = getTranslation();
    const tips = t.tooltips || {};
    const sub = t.subSections || {};
    const [searchQuery, setSearchQuery] = React.useState("");
    const bodyRef = React.useRef(null);
    const sectionNavRef = React.useRef(null);
    const [sectionNavScroll, setSectionNavScroll] = React.useState({ left: false, right: false });
    const [sectionNavControls, setSectionNavControls] = React.useState(null);
    const [sectionNavControlsReady, setSectionNavControlsReady] = React.useState(false);
    const useLayout = React.useLayoutEffect || React.useEffect;
    const jumpToSection = (id) => {
      document.getElementById("liquify-sec-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const updateSectionNavScroll = () => {
      const nav = sectionNavRef.current;
      if (!nav) return;
      const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
      const left = nav.scrollLeft > 1;
      const right = nav.scrollLeft < maxScroll - 1;
      const rect = nav.getBoundingClientRect();
      const nextControls = {
        top: Math.round(rect.top + 10),
        left: Math.round(rect.left + 12),
        right: Math.round(window.innerWidth - rect.right + 12)
      };
      setSectionNavScroll((current) => current.left === left && current.right === right ? current : { left, right });
      setSectionNavControls((current) => current && current.top === nextControls.top && current.left === nextControls.left && current.right === nextControls.right ? current : nextControls);
    };
    const scrollSectionNav = (direction) => {
      const nav = sectionNavRef.current;
      if (!nav) return;
      nav.scrollBy({ left: direction * Math.max(120, nav.clientWidth * 0.72), behavior: "smooth" });
    };
    useLayout(() => {
      const nav = sectionNavRef.current;
      if (!nav) return;
      let raf = 0;
      let readyTimer = 0;
      const startedAt = performance.now();
      const overlay = nav.closest?.("#liquify-settings-react-overlay");
      const panel = nav.closest?.(".liquifySettingsPanel");
      const isClosing = () => !!overlay?.classList.contains("overlay-closing");
      const trackOpeningPosition = () => {
        if (isClosing()) return;
        updateSectionNavScroll();
        if (performance.now() - startedAt < 650) {
          raf = requestAnimationFrame(trackOpeningPosition);
        }
      };
      const showControlsAfterIntro = () => {
        if (isClosing()) return;
        updateSectionNavScroll();
        requestAnimationFrame(() => {
          if (!isClosing()) {
            updateSectionNavScroll();
            setSectionNavControlsReady(true);
          }
        });
      };
      const onPanelTransitionEnd = (e) => {
        if (e.target === panel && e.propertyName === "transform") showControlsAfterIntro();
      };
      setSectionNavControlsReady(false);
      updateSectionNavScroll();
      raf = requestAnimationFrame(trackOpeningPosition);
      panel?.addEventListener("transitionend", onPanelTransitionEnd);
      readyTimer = window.setTimeout(showControlsAfterIntro, 430);
      nav.addEventListener("scroll", updateSectionNavScroll, { passive: true });
      window.addEventListener("resize", updateSectionNavScroll);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(readyTimer);
        panel?.removeEventListener("transitionend", onPanelTransitionEnd);
        nav.removeEventListener("scroll", updateSectionNavScroll);
        window.removeEventListener("resize", updateSectionNavScroll);
      };
    }, []);
    React.useEffect(() => {
      updateSectionNavScroll();
    });
    React.useEffect(() => {
      const body = bodyRef.current;
      if (!body) return;
      const q2 = searchQuery.trim().toLowerCase();
      body.querySelectorAll(".liquifySection").forEach((section) => {
        const title = (section.querySelector(".liquifySectionTitle")?.textContent || "").toLowerCase();
        const sectionMatches = q2 !== "" && title.includes(q2);
        let anyVisible = false;
        section.querySelectorAll(".liquifyRow").forEach((row) => {
          const label = (row.querySelector(".liquifyLabel")?.textContent || "").toLowerCase();
          const matches = q2 === "" || sectionMatches || label.includes(q2);
          row.style.display = matches ? "" : "none";
          if (matches) anyVisible = true;
        });
        section.querySelectorAll(".liquifySubSection").forEach((sub2) => {
          const subVisible = Array.from(sub2.querySelectorAll(".liquifyRow")).some(
            (r) => r.style.display !== "none"
          );
          sub2.style.display = q2 === "" || sectionMatches || subVisible ? "" : "none";
        });
        section.style.display = q2 === "" || sectionMatches || anyVisible ? "" : "none";
      });
    });
    const titles = t.sections || {
      accent: "Colors",
      background: "Background",
      artist: "Artist",
      ui: "UI",
      player: "Player",
      nextSongCard: "Next Song Card",
      canvasCoverArt: "Canvas Cover Art",
      playlist: "Playlist",
      lyrics: "Lyrics",
      transparent: "Window Controls",
      config: "Config"
    };
    const chooseFileLabel = t.chooseFile || "Choose file";
    const sectionNavScrollControls = sectionNavControlsReady && sectionNavControls && ReactDOM?.createPortal ? /* @__PURE__ */ React.createElement(React.Fragment, null, sectionNavScroll.left && ReactDOM.createPortal(
      /* @__PURE__ */ React.createElement(
        "div",
        {
          role: "button",
          tabIndex: 0,
          className: "liquifySectionNavScrollBtn isLeft",
          "aria-label": t.aria?.scrollSectionsLeft || "Scroll sections left",
          style: { top: `${sectionNavControls.top}px`, left: `${sectionNavControls.left}px` },
          onClick: () => scrollSectionNav(-1),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") scrollSectionNav(-1);
          }
        },
        "\u2039"
      ),
      document.body
    ), sectionNavScroll.right && ReactDOM.createPortal(
      /* @__PURE__ */ React.createElement(
        "div",
        {
          role: "button",
          tabIndex: 0,
          className: "liquifySectionNavScrollBtn isRight",
          "aria-label": t.aria?.scrollSectionsRight || "Scroll sections right",
          style: { top: `${sectionNavControls.top}px`, right: `${sectionNavControls.right}px` },
          onClick: () => scrollSectionNav(1),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") scrollSectionNav(1);
          }
        },
        "\u203A"
      ),
      document.body
    )) : null;
    const [accentMode, setAccentMode] = React.useState(readLS("liquify-accent-mode", "dynamic"));
    const [accentSource, setAccentSource] = React.useState(readLS("liquify-accent-source", "background"));
    const [accentColor, setAccentColor] = React.useState(readLS("liquify-custom-color", "#1DB954"));
    const [accentSatBoost, setAccentSatBoost] = React.useState(readNum("liquify-accent-sat-boost", 17));
    const [accentLightBoost, setAccentLightBoost] = React.useState(readNum("liquify-accent-light-boost", 11));
    const [glowMode, setGlowMode] = React.useState(readLS("liquify-glow-mode", "default"));
    const [glowColor, setGlowColor] = React.useState(readLS("liquify-glow-color", "#1DB954"));
    const [bgMode, setBgMode] = React.useState(readLS("liquify-bg-mode", "dynamic"));
    const [bgCustomAnimated, setBgCustomAnimated] = React.useState(readLS("liquify-bg-custom-animated", "off"));
    const [artistBgMode, setArtistBgMode] = React.useState(readLS("liquify-artist-bg-mode", "theme"));
    const [playerWidthMode, setPlayerWidthMode] = React.useState(readLS("liquify-player-width", "default"));
    const [playerCustomW, setPlayerCustomW] = React.useState(readNum("liquify-player-custom-width", DEFAULT_CUSTOM_WIDTH));
    const [playerCustomH, setPlayerCustomH] = React.useState(readNum("liquify-player-custom-height", DEFAULT_CUSTOM_HEIGHT));
    const [playlistHeader, setPlaylistHeader] = React.useState(readLS("liquify-playlist-header-mode", "show"));
    const [actionBarBox, setActionBarBox] = React.useState(readLS("liquify-action-bar-box-mode", "show"));
    const [transparentPlayer, setTransparentPlayer] = React.useState(readLS("liquify-transparent-player", "off"));
    const [floatingPlayer, setFloatingPlayer] = React.useState(readLS(FLOATING_PLAYER_KEY, "off"));
    const [connectBar, setConnectBar] = React.useState(readLS(CONNECT_BAR_KEY, "show"));
    const [compactPlayer, setCompactPlayer] = React.useState(readLS("liquify-compact-player", "off"));
    const [playerIcons, setPlayerIcons] = React.useState(readLS(PLAYER_ICONS_KEY, "on"));
    const [progressBarHeight, setProgressBarHeightState] = React.useState(readNum(PROGRESS_BAR_HEIGHT_KEY, PROGRESS_BAR_HEIGHT_DEFAULT));
    const [progressBarRadius, setProgressBarRadiusState] = React.useState(readNum(PROGRESS_BAR_RADIUS_KEY, PROGRESS_BAR_RADIUS_DEFAULT));
    const [progressBarCompat, setProgressBarCompatState] = React.useState(readLS(PROGRESS_BAR_COMPAT_KEY, "off") === "on");
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
    const [popupBounceMode, setPopupBounceMode] = React.useState(readLS(POPUP_BOUNCE_KEY, "on"));
    const [homeLayout, setHomeLayout] = React.useState(readLS(HOME_LAYOUT_KEY, "on"));
    const [performanceMode, setPerformanceMode] = React.useState(!isGlassEnabled());
    const [glassBlur, setGlassBlurState] = React.useState(readNum(GLASS_BLUR_KEY, GLASS_BLUR_DEFAULT));
    const [backdropBlur, setBackdropBlurState] = React.useState(readNum(BACKDROP_BLUR_KEY, BACKDROP_BLUR_DEFAULT));
    const [navRadius, setNavRadiusState] = React.useState(readNum(NAV_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.nav));
    const [mainRadius, setMainRadiusState] = React.useState(readNum(MAIN_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.main));
    const [rightRadius, setRightRadiusState] = React.useState(readNum(RIGHT_RADIUS_KEY, LAYOUT_RADIUS_DEFAULTS.right));
    const [configText, setConfigText] = React.useState(() => exportConfig());
    const [configStatus, setConfigStatus] = React.useState(null);
    const [configDirty, setConfigDirty] = React.useState(false);
    const configFingerprint = React.useRef(settingsFingerprint());
    const unixLike = isUnixLikeOS();
    const bgFileRef = React.useRef(null);
    const artistFileRef = React.useRef(null);
    const cfg = t.config || {};
    const handleConfigCopy = async () => {
      try {
        await navigator.clipboard.writeText(configText);
        setConfigStatus({ ok: true, msg: cfg.copied || "Copied to clipboard." });
      } catch {
        try {
          const ta = document.createElement("textarea");
          ta.value = configText;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          setConfigStatus({ ok: true, msg: cfg.copied || "Copied to clipboard." });
        } catch {
          setConfigStatus({ ok: false, msg: cfg.copyFailed || "Couldn't copy \u2014 select the text and copy manually." });
        }
      }
    };
    React.useEffect(() => {
      if (configDirty) return;
      const sync = () => {
        const fingerprint = settingsFingerprint();
        if (fingerprint === configFingerprint.current) return;
        configFingerprint.current = fingerprint;
        setConfigText(exportConfig());
        setConfigStatus(null);
      };
      sync();
      const id = setInterval(sync, 500);
      return () => clearInterval(id);
    }, [configDirty]);
    const handleConfigApply = async () => {
      let text = configText;
      try {
        const clip = await navigator.clipboard.readText();
        if (clip && clip.trim()) {
          text = clip;
          setConfigText(clip);
        }
      } catch {
      }
      const res = importConfig(text);
      if (!res.ok) setConfigStatus({ ok: false, msg: res.error || cfg.invalid || "Invalid config." });
    };
    React.useEffect(() => {
      ensureSettingsUiStyle();
    }, []);
    React.useEffect(() => {
      const handler = () => {
        setPlaybarCoverRadius(readNum(PLAYBAR_COVER_BORDER_RADIUS_KEY, PLAYBAR_COVER_DEFAULTS.borderRadius));
      };
      window.addEventListener("liquifyPlaybarCoverRadiusChange", handler);
      return () => window.removeEventListener("liquifyPlaybarCoverRadiusChange", handler);
    }, []);
    const applyAccentMode = (mode) => {
      setAccentMode(mode);
      if (mode === "custom") {
        applyAccent2(accentColor);
      } else if (mode === "dynamic") {
        resetDynamicAccentCache();
        applyDynamicAccent();
      } else {
        resetAccentToDefault();
      }
    };
    const applyAccentSource = (source) => {
      setAccentSource(source);
      localStorage.setItem("liquify-accent-source", source);
      window.dispatchEvent(new Event("liquifyAccentColorParamsChange"));
    };
    const applyGlowMode = (mode) => {
      setGlowMode(mode);
      if (mode === "custom") applyGlowAccent(glowColor);
      else resetGlowAccentToDefault();
    };
    const applyBgMode = async (mode) => {
      setBgMode(mode);
      localStorage.setItem("liquify-bg-mode", mode);
      if (mode === "custom") {
        const saved = localStorage.getItem("liquify-bg-image");
        if (!saved) {
          bgFileRef.current?.click();
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
      setArtistBgMode(mode);
      localStorage.setItem("liquify-artist-bg-mode", mode);
      if (mode === "custom") {
        const saved = localStorage.getItem("liquify-artist-bg-image");
        if (!saved) {
          artistFileRef.current?.click();
          return;
        }
      }
      if (mode === "url") {
        const saved = localStorage.getItem("liquify-artist-bg-url");
        if (!saved) return;
      }
      props.artistCtrl?.setMode?.(mode);
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
    const applyActionBarBoxMode = (mode) => {
      setActionBarBox(mode);
      applyActionBarBox(mode);
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
    const handleReset = () => {
      localStorage.setItem("liquify-accent-mode", "dynamic");
      localStorage.removeItem("liquify-custom-color");
      localStorage.setItem("liquify-accent-sat-boost", "17");
      localStorage.setItem("liquify-accent-light-boost", "11");
      localStorage.setItem("liquify-accent-source", "background");
      setAccentMode("dynamic");
      setAccentSource("background");
      setAccentColor("#1DB954");
      setAccentSatBoost(17);
      setAccentLightBoost(11);
      resetDynamicAccentCache();
      applyDynamicAccent();
      window.dispatchEvent(new Event("liquifyAccentColorParamsChange"));
      localStorage.setItem("liquify-glow-mode", "default");
      localStorage.removeItem("liquify-glow-color");
      setGlowMode("default");
      setGlowColor("#1DB954");
      resetGlowAccentToDefault();
      localStorage.setItem("liquify-bg-mode", "dynamic");
      localStorage.setItem("liquify-bg-blur", "7");
      localStorage.setItem("liquify-bg-brightness", "45");
      localStorage.removeItem("liquify-bg-url");
      localStorage.setItem("liquify-bg-custom-animated", "off");
      setBgCustomAnimated("off");
      setBgMode("dynamic");
      setBgBlurState(7);
      setBgBrightnessState(45);
      setBgUrl("");
      applyBackgroundBlur(7);
      applyBackgroundBrightness(45);
      window.dispatchEvent(new Event("liquifyBackgroundChange"));
      localStorage.setItem("liquify-artist-bg-mode", "theme");
      localStorage.setItem("liquify-artist-scroll-blur", "15");
      localStorage.setItem("liquify-artist-scroll-brightness", "70");
      localStorage.removeItem("liquify-artist-bg-url");
      setArtistBgMode("theme");
      setArtistScrollBlur(15);
      setArtistScrollBrightness(70);
      setArtistBgUrl("");
      applyArtistScrollEffect(15, 70);
      props.artistCtrl?.setMode?.("theme");
      localStorage.setItem("liquify-player-width", "theme");
      localStorage.setItem("liquify-player-custom-width", String(DEFAULT_CUSTOM_WIDTH));
      localStorage.setItem("liquify-player-custom-height", String(DEFAULT_CUSTOM_HEIGHT));
      localStorage.setItem("liquify-player-radius", "30");
      setPlayerWidthMode("theme");
      setPlayerCustomW(DEFAULT_CUSTOM_WIDTH);
      setPlayerCustomH(DEFAULT_CUSTOM_HEIGHT);
      setPlayerRadiusState(30);
      applyPlayerWidth("theme");
      applyPlayerRadius(30);
      localStorage.setItem("liquify-playlist-header-mode", "show");
      setPlaylistHeader("show");
      applyPlaylistHeader("show");
      localStorage.setItem("liquify-action-bar-box-mode", "show");
      setActionBarBox("show");
      applyActionBarBox("show");
      localStorage.setItem("liquify-tc-width", "135");
      localStorage.setItem("liquify-tc-height", "64");
      setTcW(135);
      setTcH(64);
      applyTransparentControls(135, 64);
      localStorage.setItem(PLAYBAR_COVER_BORDER_RADIUS_KEY, String(PLAYBAR_COVER_DEFAULTS.borderRadius));
      setPlaybarCoverRadius(PLAYBAR_COVER_DEFAULTS.borderRadius);
      applyPlaybarCoverBorderRadius(PLAYBAR_COVER_DEFAULTS.borderRadius);
      window.dispatchEvent(new Event("liquifyPlaybarCoverRadiusChange"));
      setProgressBarHeightState(PROGRESS_BAR_HEIGHT_DEFAULT);
      setProgressBarHeight(PROGRESS_BAR_HEIGHT_DEFAULT);
      setProgressBarRadiusState(PROGRESS_BAR_RADIUS_DEFAULT);
      setProgressBarRadius(PROGRESS_BAR_RADIUS_DEFAULT);
      setProgressBarCompatState(false);
      setProgressBarCompat(false, ensureProgressBarRadiusApplied);
      setTransparentPlayer("off");
      applyTransparentPlayer("off");
      setFloatingPlayer("off");
      applyFloatingPlayer("off");
      setConnectBar("show");
      applyConnectBar("show");
      setCompactPlayer("off");
      applyCompactPlayer("off");
      setPlayerIcons("on");
      setPlayerControlIcons("on");
      localStorage.setItem(CCA_ENABLED_KEY, CCA_DEFAULTS.enabled);
      localStorage.setItem(CCA_WIDTH_KEY, String(CCA_DEFAULTS.width));
      localStorage.setItem(CCA_HEIGHT_KEY, String(CCA_DEFAULTS.height));
      localStorage.setItem(CCA_MARGIN_BOTTOM_KEY, String(CCA_DEFAULTS.marginBottom));
      localStorage.setItem(CCA_MARGIN_LEFT_KEY, String(CCA_DEFAULTS.marginLeft));
      setCcaEnabled(CCA_DEFAULTS.enabled);
      setCcaWidth(CCA_DEFAULTS.width);
      setCcaHeight(CCA_DEFAULTS.height);
      setCcaMarginBottom(CCA_DEFAULTS.marginBottom);
      setCcaMarginLeft(CCA_DEFAULTS.marginLeft);
      applyComfyCoverArt();
      localStorage.setItem(NPVC_MODE_KEY, NPVC_DEFAULTS.mode);
      localStorage.setItem(NPVC_SHOW_ALWAYS_KEY, NPVC_DEFAULTS.showAlways);
      localStorage.setItem(NPVC_BLUR_KEY, String(NPVC_DEFAULTS.blur));
      setNpvcMode(NPVC_DEFAULTS.mode);
      setNpvcShowAlways(NPVC_DEFAULTS.showAlways);
      setNpvcBlur(NPVC_DEFAULTS.blur);
      window.dispatchEvent(new Event("liquifyNpvcUpdate"));
      localStorage.setItem(NSC_SHOW_KEY, NSC_DEFAULTS.show);
      localStorage.setItem(NSC_POSITION_KEY, NSC_DEFAULTS.position);
      localStorage.setItem(NSC_HEIGHT_KEY, String(NSC_DEFAULTS.height));
      localStorage.setItem(NSC_MAX_WIDTH_KEY, String(NSC_DEFAULTS.maxWidth));
      localStorage.setItem(NSC_GAP_KEY, String(NSC_DEFAULTS.gap));
      localStorage.setItem(NSC_COVER_SIZE_KEY, String(NSC_DEFAULTS.coverSize));
      localStorage.setItem(NSC_HPAD_KEY, String(NSC_DEFAULTS.hPad));
      localStorage.setItem(NSC_VPAD_KEY, String(NSC_DEFAULTS.vPad));
      localStorage.setItem(NSC_GAP_PLAYER_KEY, String(NSC_DEFAULTS.gapToPlayer));
      localStorage.setItem(NSC_BORDER_RADIUS_KEY, String(NSC_DEFAULTS.borderRadius));
      localStorage.setItem(NSC_COVER_BORDER_RADIUS_KEY, String(NSC_DEFAULTS.coverBorderRadius));
      setNscShow(NSC_DEFAULTS.show);
      setNscPosition(NSC_DEFAULTS.position);
      setNscHeight(NSC_DEFAULTS.height);
      setNscMaxWidth(NSC_DEFAULTS.maxWidth);
      setNscGap(NSC_DEFAULTS.gap);
      setNscCoverSize(NSC_DEFAULTS.coverSize);
      setNscHPad(NSC_DEFAULTS.hPad);
      setNscVPad(NSC_DEFAULTS.vPad);
      setNscGapToPlayer(NSC_DEFAULTS.gapToPlayer);
      setNscBorderRadius(NSC_DEFAULTS.borderRadius);
      setNscCoverBorderRadius(NSC_DEFAULTS.coverBorderRadius);
      window.dispatchEvent(new Event("liquifyNscUpdate"));
      localStorage.setItem("liquify-lyrics-mode", "romanization");
      setLyricsMode("romanization");
      window.dispatchEvent(new Event("liquifyLyricsModeChange"));
      setThemedLyricsState("on");
      setThemedLyrics(true);
      setLyricsFontSizeState(LYRICS_FONT_SIZE_DEFAULT);
      setLyricsFontSize(LYRICS_FONT_SIZE_DEFAULT);
      setLyricsMarginState(LYRICS_MARGIN_DEFAULT);
      setLyricsMargin(LYRICS_MARGIN_DEFAULT);
      localStorage.setItem(POPUP_BOUNCE_KEY, "on");
      setPopupBounceMode("on");
      applyPopupBounce("on");
      setHomeLayout("on");
      applyHomeLayout("on");
      setPerformanceMode(false);
      setGlassEnabled(true);
      setGlassBlurState(GLASS_BLUR_DEFAULT);
      setGlassBlur(GLASS_BLUR_DEFAULT);
      setBackdropBlurState(BACKDROP_BLUR_DEFAULT);
      setBackdropBlur(BACKDROP_BLUR_DEFAULT);
      setNavRadiusState(LAYOUT_RADIUS_DEFAULTS.nav);
      setNavRadius(LAYOUT_RADIUS_DEFAULTS.nav);
      setMainRadiusState(LAYOUT_RADIUS_DEFAULTS.main);
      setMainRadius(LAYOUT_RADIUS_DEFAULTS.main);
      setRightRadiusState(LAYOUT_RADIUS_DEFAULTS.right);
      setRightRadius(LAYOUT_RADIUS_DEFAULTS.right);
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
    )))), /* @__PURE__ */ React.createElement("div", { className: "liquifySearchIsland" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        className: "liquifyControlSurface liquifySearchInput",
        placeholder: t.searchPlaceholder || "Search settings...",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        spellCheck: false
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "liquifySectionNavWrap" }, /* @__PURE__ */ React.createElement("div", { className: "liquifySectionNav", ref: sectionNavRef }, [
      { id: "accent", title: titles.accent },
      { id: "background", title: titles.background },
      { id: "artist", title: titles.artist },
      { id: "ui", title: titles.ui || "UI" },
      { id: "player", title: titles.player },
      { id: "nextSongCard", title: titles.nextSongCard || "Next Song Card" },
      { id: "canvasCoverArt", title: titles.canvasCoverArt || "Canvas Cover Art" },
      { id: "playlist", title: titles.playlist },
      { id: "lyrics", title: titles.lyrics || "Lyrics" },
      { id: "transparent", title: titles.transparent },
      { id: "config", title: titles.config || "Config" }
    ].map((s2) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: s2.id,
        type: "button",
        className: "liquifySectionNavBtn",
        onClick: () => jumpToSection(s2.id)
      },
      s2.title
    ))))), sectionNavScrollControls, /* @__PURE__ */ React.createElement("div", { className: "liquifySettingsBody", ref: bodyRef }, /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-accent", title: titles.accent }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.accentColor, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.accentColor })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
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
          applyAccent2(next);
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.accentSource, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.accentSource })), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: accentSource,
        options: [
          { value: "background", label: t.dropdown.backgroundSource },
          { value: "cover", label: t.dropdown.songCover }
        ],
        onChange: applyAccentSource
      }
    )), accentMode === "dynamic" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.accentSatBoost, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.accentSatBoost })), /* @__PURE__ */ React.createElement(Stepper, { value: accentSatBoost, min: 1, max: 100, onChange: (v2) => {
      setAccentSatBoost(v2);
      localStorage.setItem("liquify-accent-sat-boost", String(v2));
      window.dispatchEvent(new Event("liquifyAccentColorParamsChange"));
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.accentLightBoost, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.accentLightBoost })), /* @__PURE__ */ React.createElement(Stepper, { value: accentLightBoost, min: 1, max: 100, onChange: (v2) => {
      setAccentLightBoost(v2);
      localStorage.setItem("liquify-accent-light-boost", String(v2));
      window.dispatchEvent(new Event("liquifyAccentColorParamsChange"));
    } })))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-background", title: titles.background }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.background, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.background })), /* @__PURE__ */ React.createElement("div", { className: "liquifyStackedControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: bgMode,
        options: [
          { value: "dynamic", label: t.dropdown.dynamic },
          { value: "animated", label: t.dropdown.animated },
          { value: "playlist", label: t.dropdown.playlist || "Playlist" },
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
        onClick: () => bgFileRef.current?.click()
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
          const file = e.target.files?.[0];
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
    ))), (bgMode === "custom" || bgMode === "url" || bgMode === "playlist") && /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.animatedBackground || "Animated Background:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.animatedBackground })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: bgCustomAnimated === "on",
        onChange: (checked) => {
          const v2 = checked ? "on" : "off";
          setBgCustomAnimated(v2);
          localStorage.setItem("liquify-bg-custom-animated", v2);
          window.dispatchEvent(new Event("liquifyBackgroundChange"));
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.backgroundBlur), /* @__PURE__ */ React.createElement(Stepper, { value: bgBlur, min: 0, max: 100, onChange: applyBlur })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.backgroundBrightness || "Background Brightness:"), /* @__PURE__ */ React.createElement(Stepper, { value: bgBrightness, min: 0, max: 200, onChange: applyBgBrightness }))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-artist", title: titles.artist }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.apbackground, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.artistBackground })), /* @__PURE__ */ React.createElement("div", { className: "liquifyStackedControls" }, /* @__PURE__ */ React.createElement(
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
        onClick: () => artistFileRef.current?.click()
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
          const file = e.target.files?.[0];
          if (!file) return;
          await applyCustomArtistBackground(file);
          props.artistCtrl?.applySavedModeIfArtist?.();
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
          const val = e.target.value;
          setArtistBgUrl(val);
          localStorage.setItem("liquify-artist-bg-url", val);
          if (val) props.artistCtrl?.setMode?.("url");
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.artistScrollBlur, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.artistScrollBlur })), /* @__PURE__ */ React.createElement(Stepper, { value: artistScrollBlur, min: 0, max: 100, onChange: applyArtistBlur })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.artistScrollBrightness, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.artistScrollBrightness })), /* @__PURE__ */ React.createElement(Stepper, { value: artistScrollBrightness, min: 0, max: 200, onChange: applyArtistBrightness }))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-ui", title: titles.ui || "UI" }, /* @__PURE__ */ React.createElement(SubSection, { title: sub.performanceGlass || "Performance & Glass" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.performanceMode || "Performance Mode:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.performanceMode })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: performanceMode,
        onChange: (checked) => {
          setPerformanceMode(checked);
          setGlassEnabled(!checked);
        }
      }
    )), performanceMode ? /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.backdropBlur || "Backdrop Blur (px):"), /* @__PURE__ */ React.createElement(Stepper, { value: backdropBlur, min: 0, max: 80, onChange: (v2) => {
      setBackdropBlurState(v2);
      setBackdropBlur(v2);
    } })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.glassBlur || "Glass Blur (px):", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.glassBlur })), /* @__PURE__ */ React.createElement(Stepper, { value: glassBlur, min: 0, max: 30, onChange: (v2) => {
      setGlassBlurState(v2);
      setGlassBlur(v2);
    } })))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.animations || "Animations" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.popupBounce || "Popup Bounce:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.popupBounce })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: popupBounceMode === "on",
        onChange: (checked) => {
          const v2 = checked ? "on" : "off";
          setPopupBounceMode(v2);
          applyPopupBounce(v2);
        }
      }
    ))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.homescreen || "Homescreen" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.newHomescreenLayout || "Use New Homescreen Layout:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.newHomescreenLayout })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: homeLayout === "on",
        onChange: (checked) => {
          const v2 = checked ? "on" : "off";
          setHomeLayout(v2);
          applyHomeLayout(v2);
        }
      }
    ))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.borderRadius || "Border Radius" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.leftSidebarRadius || "Left Sidebar Border Radius:"), /* @__PURE__ */ React.createElement(Stepper, { value: navRadius, min: 0, max: 50, onChange: (v2) => {
      setNavRadiusState(v2);
      setNavRadius(v2);
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.mainViewRadius || "Main View Border Radius:"), /* @__PURE__ */ React.createElement(Stepper, { value: mainRadius, min: 0, max: 50, onChange: (v2) => {
      setMainRadiusState(v2);
      setMainRadius(v2);
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.rightSidebarRadius || "Right Sidebar Border Radius:"), /* @__PURE__ */ React.createElement(Stepper, { value: rightRadius, min: 0, max: 50, onChange: (v2) => {
      setRightRadiusState(v2);
      setRightRadius(v2);
    } })))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-player", title: titles.player }, /* @__PURE__ */ React.createElement(SubSection, { title: sub.sizeShape || "Size & Shape" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerWidth, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.playerWidth })), /* @__PURE__ */ React.createElement(
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
    )), playerWidthMode === "custom" && /* @__PURE__ */ React.createElement("div", { className: "liquifySubBlock" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerCustomWidth), /* @__PURE__ */ React.createElement(
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
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerCustomHeight), /* @__PURE__ */ React.createElement(
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
    ))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerRadius), /* @__PURE__ */ React.createElement(Stepper, { value: playerRadius, min: 0, max: 100, onChange: applyRadius }))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.progressVolume || "Progress & Volume Bar" }, !progressBarCompat && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.progressBarHeight || "Progress & Volume Bar Height:"), /* @__PURE__ */ React.createElement(Stepper, { value: progressBarHeight, min: 1, max: 20, onChange: (v2) => {
      setProgressBarHeightState(v2);
      setProgressBarHeight(v2);
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.progressBarRadius || "Progress & Volume Bar Border Radius:"), /* @__PURE__ */ React.createElement(Stepper, { value: progressBarRadius, min: 0, max: 20, onChange: (v2) => {
      setProgressBarRadiusState(v2);
      setProgressBarRadius(v2);
    } }))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.progressBarCompat || "Compatibility Mode:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.progressBarCompat })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: progressBarCompat,
        onChange: (checked) => {
          setProgressBarCompatState(checked);
          setProgressBarCompat(checked, ensureProgressBarRadiusApplied);
        }
      }
    )))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.coverArt || "Cover Art" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playbarCoverBorderRadius || "Cover Art Border Radius:"), /* @__PURE__ */ React.createElement(Stepper, { value: playbarCoverRadius, min: 0, max: 50, onChange: (v2) => {
      setPlaybarCoverRadius(v2);
      applyPlaybarCoverBorderRadius(v2);
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.comfyCoverArt?.enabled || "Comfy Cover Art:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.comfyCoverArt })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: ccaEnabled === "show",
        onChange: (checked) => {
          const v2 = checked ? "show" : "hide";
          setCcaEnabled(v2);
          localStorage.setItem(CCA_ENABLED_KEY, v2);
          applyComfyCoverArt();
        }
      }
    ))), ccaEnabled === "show" && /* @__PURE__ */ React.createElement("div", { className: "liquifySubBlock" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.comfyCoverArt?.width || "Width (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: ccaWidth, min: 16, max: 200, onChange: (v2) => {
      setCcaWidth(v2);
      localStorage.setItem(CCA_WIDTH_KEY, String(v2));
      applyComfyCoverArt();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.comfyCoverArt?.height || "Height (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: ccaHeight, min: 16, max: 200, onChange: (v2) => {
      setCcaHeight(v2);
      localStorage.setItem(CCA_HEIGHT_KEY, String(v2));
      applyComfyCoverArt();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.comfyCoverArt?.marginBottom || "Margin Bottom (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: ccaMarginBottom, min: -50, max: 200, onChange: (v2) => {
      setCcaMarginBottom(v2);
      localStorage.setItem(CCA_MARGIN_BOTTOM_KEY, String(v2));
      applyComfyCoverArt();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.comfyCoverArt?.marginLeft || "Margin Left (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: ccaMarginLeft, min: -50, max: 200, onChange: (v2) => {
      setCcaMarginLeft(v2);
      localStorage.setItem(CCA_MARGIN_LEFT_KEY, String(v2));
      applyComfyCoverArt();
    } })))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.modes || "Modes" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.floatingPlayer || "Floating Player:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.floatingPlayer })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: floatingPlayer === "on",
        onChange: (checked) => {
          const v2 = checked ? "on" : "off";
          setFloatingPlayer(v2);
          applyFloatingPlayer(v2);
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.transparentPlayer || "Transparent Player:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.transparentPlayer })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: transparentPlayer === "on",
        onChange: (checked) => {
          const v2 = checked ? "on" : "off";
          setTransparentPlayer(v2);
          applyTransparentPlayer(v2);
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.compactPlayer || "Compact Player:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.compactPlayer })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: compactPlayer === "on",
        onChange: (checked) => {
          const v2 = checked ? "on" : "off";
          setCompactPlayer(v2);
          applyCompactPlayer(v2);
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerControlIcons || "Use New Player Icons:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.playerControlIcons })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: playerIcons === "on",
        onChange: (checked) => {
          const v2 = checked ? "on" : "off";
          setPlayerIcons(v2);
          setPlayerControlIcons(v2);
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.connectBar || "Show Connect Bar:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.connectBar })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: connectBar === "show",
        onChange: (checked) => {
          const v2 = checked ? "show" : "hide";
          setConnectBar(v2);
          applyConnectBar(v2);
        }
      }
    )))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-nextSongCard", title: titles.nextSongCard || "Next Song Card" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.show || "Show Next Song Card:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.nextSongCard })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: nscShow === "show",
        onChange: (checked) => {
          const v2 = checked ? "show" : "hide";
          setNscShow(v2);
          localStorage.setItem(NSC_SHOW_KEY, v2);
          fireNscUpdate();
        }
      }
    ))), nscShow === "show" && /* @__PURE__ */ React.createElement("div", { className: "liquifySubBlock" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.position || "Horizontal Position"), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: nscPosition,
        options: [
          { value: "left", label: t.nextSongCard?.left || "Left" },
          { value: "right", label: t.nextSongCard?.right || "Right" }
        ],
        onChange: (v2) => {
          setNscPosition(v2);
          localStorage.setItem(NSC_POSITION_KEY, v2);
          fireNscUpdate();
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.cardHeight || "Card Height (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: nscHeight, min: 32, max: 200, onChange: (v2) => {
      setNscHeight(v2);
      localStorage.setItem(NSC_HEIGHT_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.cardMaxWidth || "Card Max Width (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: nscMaxWidth, min: 100, max: 600, onChange: (v2) => {
      setNscMaxWidth(v2);
      localStorage.setItem(NSC_MAX_WIDTH_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.gap || "Gap between Image and Text (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: nscGap, min: 0, max: 24, onChange: (v2) => {
      setNscGap(v2);
      localStorage.setItem(NSC_GAP_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.coverSize || "Cover Size (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: nscCoverSize, min: 16, max: 128, onChange: (v2) => {
      setNscCoverSize(v2);
      localStorage.setItem(NSC_COVER_SIZE_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.hPad || "Horizontal Padding (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: nscHPad, min: 0, max: 32, onChange: (v2) => {
      setNscHPad(v2);
      localStorage.setItem(NSC_HPAD_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.vPad || "Vertical Padding (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: nscVPad, min: 0, max: 32, onChange: (v2) => {
      setNscVPad(v2);
      localStorage.setItem(NSC_VPAD_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.gapToPlayer || "Distance to Player (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: nscGapToPlayer, min: 0, max: 40, onChange: (v2) => {
      setNscGapToPlayer(v2);
      localStorage.setItem(NSC_GAP_PLAYER_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.borderRadius || "Border Radius (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: nscBorderRadius, min: 0, max: 50, onChange: (v2) => {
      setNscBorderRadius(v2);
      localStorage.setItem(NSC_BORDER_RADIUS_KEY, String(v2));
      fireNscUpdate();
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.nextSongCard?.coverBorderRadius || "Cover Border Radius (px)"), /* @__PURE__ */ React.createElement(Stepper, { value: nscCoverBorderRadius, min: 0, max: 50, onChange: (v2) => {
      setNscCoverBorderRadius(v2);
      localStorage.setItem(NSC_COVER_BORDER_RADIUS_KEY, String(v2));
      fireNscUpdate();
    } })))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-canvasCoverArt", title: titles.canvasCoverArt || "Canvas Cover Art" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.canvasCoverArt?.mode || "Track Name Cover Art:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.canvasCoverArt })), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: npvcMode,
        options: [
          { value: "off", label: t.canvasCoverArt?.off || "Off" },
          { value: "trackInfo", label: t.canvasCoverArt?.trackInfo || "Next to Track Info" },
          { value: "outsideTrackInfo", label: t.canvasCoverArt?.outsideTrackInfo || "Outside Track Info" }
        ],
        onChange: (v2) => {
          setNpvcMode(v2);
          localStorage.setItem(NPVC_MODE_KEY, v2);
          window.dispatchEvent(new Event("liquifyNpvcUpdate"));
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.canvasCoverArt?.showAlways || "Show Always:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.canvasShowAlways })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: npvcShowAlways === "yes",
        onChange: (checked) => {
          const v2 = checked ? "yes" : "no";
          setNpvcShowAlways(v2);
          localStorage.setItem(NPVC_SHOW_ALWAYS_KEY, v2);
          window.dispatchEvent(new Event("liquifyNpvcUpdate"));
        }
      }
    ))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-playlist", title: titles.playlist }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playlistHeaderBox, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.playlistHeaderBox })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: playlistHeader === "show",
        onChange: (checked) => applyPlaylistHeaderMode(checked ? "show" : "hide")
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.actionBarBox || "Action Bar Box:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.actionBarBox })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: actionBarBox === "show",
        onChange: (checked) => applyActionBarBoxMode(checked ? "show" : "hide")
      }
    ))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-lyrics", title: titles.lyrics || "Lyrics" }, /* @__PURE__ */ React.createElement(SubSection, { title: sub.styling || "Styling" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.themedLyrics || "Themed Lyrics:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.themedLyrics })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: themedLyrics === "on",
        onChange: (checked) => {
          setThemedLyricsState(checked ? "on" : "off");
          setThemedLyrics(checked);
        }
      }
    )), themedLyrics === "on" && /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.lyricsFontSize || "Lyrics Font Size:"), /* @__PURE__ */ React.createElement(Stepper, { value: lyricsFontSize, min: 10, max: 150, onChange: (v2) => {
      setLyricsFontSizeState(v2);
      setLyricsFontSize(v2);
    } })), themedLyrics === "on" && /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.lyricsMargin || "Lyrics Margin:"), /* @__PURE__ */ React.createElement(Stepper, { value: lyricsMargin, min: 0, max: 120, onChange: (v2) => {
      setLyricsMarginState(v2);
      setLyricsMargin(v2);
    } }))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.translation || "Translation" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.lyricsMode || "Lyrics Translation/Romanization:"), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
      Select,
      {
        value: lyricsMode,
        options: [
          { value: "off", label: t.lyricsOptions?.off || "Off" },
          { value: "translation", label: t.lyricsOptions?.translation || "Translation only" },
          { value: "romanization", label: t.lyricsOptions?.romanization || "Romanization only" },
          { value: "both", label: t.lyricsOptions?.both || "Translation + Romanization" }
        ],
        onChange: applyLyricsMode
      }
    ))))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-transparent", title: titles.transparent }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.transparentWidth, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.transparentWidth })), /* @__PURE__ */ React.createElement("div", { style: { opacity: unixLike ? 0.5 : 1, pointerEvents: unixLike ? "none" : "auto" } }, /* @__PURE__ */ React.createElement(Stepper, { value: tcW, min: 0, max: 400, onChange: (v2) => applyTransparent(v2, tcH) }))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.transparentHeight, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.transparentHeight })), /* @__PURE__ */ React.createElement("div", { style: { opacity: unixLike ? 0.5 : 1, pointerEvents: unixLike ? "none" : "auto" } }, /* @__PURE__ */ React.createElement(Stepper, { value: tcH, min: 0, max: 300, onChange: (v2) => applyTransparent(tcW, v2) })))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-config", title: titles.config || "Config" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyConfigBlock" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyConfigHint" }, cfg.hint || "Copy your current Liquify config, or paste one and apply it. Background images aren't included."), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "liquifyControlSurface liquifyConfigTextarea",
        spellCheck: false,
        value: configText,
        onChange: (e) => {
          setConfigText(e.target.value);
          setConfigDirty(true);
          setConfigStatus(null);
        }
      }
    ), configStatus && /* @__PURE__ */ React.createElement("div", { className: "liquifyConfigStatus" + (configStatus.ok ? " isOk" : " isError") }, configStatus.msg), /* @__PURE__ */ React.createElement("div", { className: "liquifyConfigActions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "liquifyControlSurface liquifyActionBtn", onClick: handleConfigCopy }, cfg.copy || "Copy"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "liquifyControlSurface liquifyActionBtn liquifyConfigApplyBtn", onClick: handleConfigApply }, cfg.apply || "Paste & Apply")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", marginTop: "16px", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "liquifyControlSurface liquifyActionBtn liquifyResetBtn",
        onClick: handleReset,
        style: { padding: "8px 24px", fontSize: "14px" }
      },
      t.resetAllSettings || "Reset all Settings"
    ))));
  }

  // src/settings/modal.tsx
  var OVERLAY_ID = "liquify-settings-react-overlay";
  var FLOATING_SETTINGS_SELECTOR = "body > .liquifyTooltipPopup, body > .liquifySectionNavScrollBtn";
  function removeFloatingSettingsElements() {
    document.querySelectorAll(FLOATING_SETTINGS_SELECTOR).forEach((el) => el.remove());
  }
  function hideFloatingSettingsElements() {
    document.querySelectorAll(FLOATING_SETTINGS_SELECTOR).forEach((el) => {
      el.style.display = "none";
    });
  }
  function createOverlay(onBackgroundClick) {
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
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
      if (e.target === overlay) onBackgroundClick(overlay);
    });
    return overlay;
  }
  function showOverlay(overlay) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("overlay-visible");
      });
    });
  }
  function unmountOverlay(overlay, root) {
    try {
      const mountRoot = root || overlay.querySelector("div");
      if (mountRoot) ReactDOM.unmountComponentAtNode(mountRoot);
    } catch {
    }
    removeFloatingSettingsElements();
    overlay.remove();
  }
  function closeWithAnimation(overlay, root) {
    overlay.classList.remove("overlay-visible");
    overlay.classList.add("overlay-closing");
    hideFloatingSettingsElements();
    const panel = overlay.querySelector(".liquifySettingsPanel");
    let closed = false;
    let fallback = 0;
    const onEnd = (e) => {
      if (e && e.propertyName && e.propertyName !== "transform") return;
      if (closed) return;
      closed = true;
      window.clearTimeout(fallback);
      panel?.removeEventListener("transitionend", onEnd);
      unmountOverlay(overlay, root);
    };
    if (panel) panel.addEventListener("transitionend", onEnd);
    fallback = window.setTimeout(onEnd, 500);
  }
  function SettingsModalRoot(props) {
    const [nonce, setNonce] = React.useState(0);
    React.useEffect(() => {
      const handler = () => setNonce((n) => n + 1);
      window.addEventListener("liquifyConfigApplied", handler);
      return () => window.removeEventListener("liquifyConfigApplied", handler);
    }, []);
    const SettingsContentAny = SettingsContent;
    return /* @__PURE__ */ React.createElement(SettingsContentAny, { key: nonce, onClose: props.onClose, artistCtrl: props.artistCtrl });
  }
  function openSettingsModal(artistCtrl) {
    ensureSettingsUiStyle();
    document.getElementById(OVERLAY_ID)?.remove();
    const overlay = createOverlay((target) => closeWithAnimation(target, root));
    const root = document.createElement("div");
    document.body.appendChild(overlay);
    overlay.appendChild(root);
    showOverlay(overlay);
    const onClose = () => closeWithAnimation(overlay, root);
    ReactDOM.render(/* @__PURE__ */ React.createElement(SettingsModalRoot, { onClose, artistCtrl }), root);
  }

  // src/settings/index.tsx
  function applySavedGlowSettings() {
    const mode = localStorage.getItem("liquify-glow-mode") || "default";
    const color = localStorage.getItem("liquify-glow-color") || "#1DB954";
    if (mode === "custom") applyGlowAccent(color);
    else resetGlowAccentToDefault();
  }
  function applySavedAccentSettings() {
    const mode = localStorage.getItem("liquify-accent-mode") || "dynamic";
    const color = localStorage.getItem("liquify-custom-color") || "#1DB954";
    if (!localStorage.getItem("liquify-accent-mode")) {
      localStorage.setItem("liquify-accent-mode", "dynamic");
    }
    if (mode === "custom") applyAccent2(color);
    else if (mode === "dynamic") applyDynamicAccent();
    else resetAccentToDefault();
  }
  function applySavedLayoutSettings() {
    applySavedBackground();
    ensurePlayerApplied();
    ensureTransparentControlsApplied();
    ensureBackgroundBlurApplied();
    ensureBackgroundBrightnessApplied();
    ensureArtistScrollEffectApplied();
    applySavedPlaylistHeader();
    applySavedActionBarBox();
    applySavedTransparentPlayer();
    applySavedFloatingPlayer();
    applySavedConnectBar();
    applySavedCompactPlayer();
    ensureProgressBarHeightApplied();
    ensureProgressBarRadiusApplied();
    ensureLayoutRadiusApplied();
    ensureThemedLyricsApplied();
    ensureGlassBlurApplied();
    applySavedHomeLayout();
    applyComfyCoverArt(false);
    ensurePlaybarCoverBorderRadiusApplied();
    ensurePopupBounceApplied();
  }
  function applyAllSavedSettings(artistCtrl) {
    applySavedGlowSettings();
    applySavedAccentSettings();
    applySavedLayoutSettings();
    installPlayerControlIcons();
    setGlassEnabled(localStorage.getItem("liquify-glass-enabled") !== "off");
    try {
      artistCtrl?.setMode?.(localStorage.getItem("liquify-artist-bg-mode") || "theme");
    } catch {
    }
    for (const ev of [
      "liquifyNscUpdate",
      "liquifyNpvcUpdate",
      "liquifyLyricsModeChange",
      "liquifyAccentColorParamsChange",
      "liquifyBackgroundChange",
      "liquifyPlaybarCoverRadiusChange"
    ]) {
      window.dispatchEvent(new Event(ev));
    }
  }
  function pushDynamicAccent() {
    const mode = localStorage.getItem("liquify-accent-mode") || "dynamic";
    if (mode === "dynamic") applyDynamicAccent();
  }
  function installDynamicAccentObserver(anyWin) {
    if (anyWin.liquifyDynamicObserverTs) return;
    anyWin.liquifyDynamicObserverTs = new MutationObserver(pushDynamicAccent);
    anyWin.liquifyDynamicObserverTs.observe(document.body, { attributes: true, subtree: true });
    window.addEventListener("liquifyAccentColorReady", pushDynamicAccent);
  }
  function registerSettingsModal(artistCtrl) {
    window.showLiquifySettingsMenu = () => {
      try {
        openSettingsModal(artistCtrl);
      } catch (e) {
        console.error("Liquify settings open failed", e);
      }
    };
  }
  function installFeatureControllers() {
    installLyricsTranslator();
    installPlaylistIndicatorVisualizer();
    installHomeScreenVisualizer();
    installNextSongCard();
    installNowPlayingViewCover();
    installCoverSwipe();
    installPlayerControlIcons();
    installShareButtonTransition();
  }
  async function startLiquifySettings() {
    const anyWin = window;
    if (anyWin.liquifyStandaloneTsInitialized) return;
    anyWin.liquifyStandaloneTsInitialized = true;
    await awaitSpicetifyReact();
    applySavedGlowSettings();
    applySavedAccentSettings();
    applySavedLayoutSettings();
    installDynamicAccentObserver(anyWin);
    installFullscreenWatcher();
    const artistCtrl = installArtistBackgroundController();
    registerSettingsModal(artistCtrl);
    window.liquifyApplyAllSettings = () => applyAllSavedSettings(artistCtrl);
    initLiquifyGearInjection(getTranslation());
    startLiquifyOnboarding();
    reconcileLiquidLyricsInstall().catch(() => {
    });
    await awaitSpicetifyPlayer();
    installFeatureControllers();
  }

  // src/theme.ts
  var GLASS_TARGETS = [
    {
      // Top bar background layer (made transparent in user.css)
      selector: ".main-topBar-background",
      options: { borderRadius: 8 }
    },
    {
      // Dropdown / panel container (made transparent in user.css)
      selector: ".zddkQq3wlxEOg6aa",
      options: { borderRadius: 20, glassBlur: "5px" }
    },
    {
      selector: ".main-trackList-trackListHeader",
      options: { borderRadius: 20 }
    },
    {
      selector: ".Root__now-playing-bar",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-globalNav-searchInputContainer .main-topBar-searchBar",
      options: { borderRadius: 17 }
    },
    {
      selector: ".Root__globalNav .main-globalNav-navLink",
      options: { borderRadius: 17 }
    },
    {
      selector: ".NJh1B8rnlSUlK7sY",
      options: { borderRadius: 20, glassBlur: "5px" }
    },
    {
      selector: ".search-searchCategory-carouselButton",
      options: { borderRadius: 12 }
    },
    {
      selector: ".e-10451-box--tinted",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-entityHeader-container",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-actionBar-ActionBar",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-nowPlayingView-headerWrapper",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-nowPlayingView-section",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-nowPlayingView-trackInfo",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-contextMenu-tippy",
      options: { borderRadius: 10 }
    },
    {
      selector: ".PromotionButtonTooltip-module_tooltip-animation__cE-rt",
      options: { borderRadius: 12 }
    },
    {
      selector: ".iiX8td2tfVETS09_ button",
      options: { borderRadius: 13 }
    },
    {
      selector: ".gpBiAnJHb1gq46qV",
      options: { borderRadius: 20 }
    },
    {
      selector: ".view-homeShortcutsGrid-shortcut",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-home-filterChipsSection",
      options: { borderRadius: 20 }
    },
    {
      selector: "dialog",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-topBar-buddyFeed",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-userWidget-box",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-globalNav-historyButtons",
      options: { borderRadius: 20 }
    },
    {
      selector: ".EU1ylDKh7s2oMU0g",
      options: { borderRadius: 12 }
    },
    {
      selector: ".VwcQJ4Zsf0JKD3Ls",
      options: { borderRadius: 12 }
    },
    {
      selector: ".KQDsZX3kwwuAFpE8",
      options: { borderRadius: 20 }
    },
    {
      selector: ".KFAJvMWTSagxYXGC",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-trackList-trackListRow.q8suB2R_XkoUyIeZ",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-nowPlayingView-actionButton",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-playlistEditDetailsModal-container",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-playlistEditDetailsModal-imageDropDownButton",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-home-content section",
      options: { borderRadius: 20 }
    },
    {
      selector: ".os-scrollbar-handle",
      options: { borderRadius: 20 }
    },
    {
      selector: ".JDUQ8zTo6EUgHoYt",
      options: { borderRadius: 20 }
    },
    {
      selector: ".B9ji6YIpLSUHiyxx",
      options: { borderRadius: 20 }
    },
    {
      selector: ".gu0S9_98ZXIo5DaV",
      options: { borderRadius: 20 }
    },
    {
      selector: ".SUjhgyMvTou7TddO",
      options: { borderRadius: 20 }
    },
    {
      selector: ".ERRo1Br0ZQtJYVhz",
      options: { borderRadius: 20 }
    },
    {
      selector: ".LR7w41pC8ccVc11Q",
      options: { borderRadius: 20 }
    },
    {
      selector: ".VsYY0YB3c4lmhoDI",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-shelf-shelf",
      options: { borderRadius: 20 }
    },
    {
      selector: ".CO34wNPAbR8mpcdD",
      options: { borderRadius: 20 }
    },
    {
      selector: ".JthDv0xUCm8rLhu6",
      options: { borderRadius: 20 }
    },
    {
      selector: ".tlq9Tt69FX4bauLX",
      options: { borderRadius: 20 }
    },
    {
      selector: ".x-settings-section",
      options: { borderRadius: 20 }
    },
    {
      selector: ".fa_L1qIbh7QDDd_h",
      options: { borderRadius: 20 }
    },
    {
      selector: ".TguLwQ522LIEgpK_.IxVxBUbV5M5tGaEx",
      options: { borderRadius: 20 }
    },
    {
      selector: ".HOf9H18Ya0DkJ4_K",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-nowPlayingView-onTourItemGrid:hover",
      options: { borderRadius: 20 }
    },
    {
      selector: ".qm0mrbeno_z0mpoo",
      options: { borderRadius: 20 }
    },
    {
      selector: ".N3kf5S8O84aeaCZu",
      options: { borderRadius: 20 }
    },
    {
      selector: ".J8g7rZ2MDknxmiYP",
      options: { borderRadius: 20 }
    },
    {
      selector: ".Root__cinema-view",
      options: { borderRadius: 20, glassBlur: "10px" }
    },
    {
      selector: ".n5KI8mwa5o8qbn4b",
      options: { borderRadius: 20 }
    },
    {
      selector: ".vado7sbDrEsKhSmn",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-embedWidgetGenerator-container",
      options: { borderRadius: 20 }
    },
    {
      selector: ".e-10451-box--elevated",
      options: { borderRadius: 15 }
    },
    {
      selector: ".Wzl40f9FIUD91O2o",
      options: { borderRadius: 20 }
    },
    {
      selector: ".mcZzjuAJUvE9X4gX",
      options: { borderRadius: 20, glassBlur: "10px", applyTo: "before" }
    },
    {
      selector: ".Htdd9HRV28F07Dwl",
      options: { borderRadius: 20 }
    },
    {
      selector: ".p67WtOnm9lsRLOu2",
      options: { borderRadius: 20 }
    },
    {
      selector: ".JLkvt5ABTQYw_rG7",
      options: { borderRadius: 20 }
    },
    {
      selector: ".mKvcoJ_veYlcHwOz",
      options: { borderRadius: 20 }
    },
    {
      selector: ".tMcqYZ2om0nYbgrw",
      options: { borderRadius: 20 }
    },
    {
      selector: ".yZCluNwEsPD2zYyY",
      options: { borderRadius: 20 }
    },
    {
      selector: ".Hrce4GF4EEkPJdBI",
      options: { borderRadius: 20 }
    },
    {
      selector: ".EpfIE3glwAOGcNT6",
      options: { borderRadius: 20 }
    },
    {
      // Glass on a ::before layer behind the menu items (see user.css
      // .liquify-glass--before), so the items stay crisp above the refraction.
      selector: ".main-contextMenu-menu",
      options: { borderRadius: 20, glassBlur: "5px", applyTo: "before" }
    },
    {
      // Popup panel — glass on a ::before layer (see user.css .liquify-glass--before).
      selector: ".xamNkt5LX9o8aL1q",
      options: { borderRadius: 20, glassBlur: "5px", applyTo: "before" }
    },
    {
      selector: ".marketplace-header",
      options: { borderRadius: 20 }
    },
    {
      selector: ".marketplace-tabBar-active",
      options: { borderRadius: 20 }
    },
    {
      selector: ".Dropdown-menu",
      options: { borderRadius: 20 }
    },
    {
      selector: "#marketplace-readme",
      options: { borderRadius: 20 }
    },
    {
      selector: ".liquifySettingsPanel",
      options: { borderRadius: 20, glassBlur: "5px" }
    },
    {
      selector: ".liquifySelectMenu",
      options: { borderRadius: 15 }
    },
    {
      selector: ".liquifySectionNavScrollBtn",
      options: { borderRadius: 12 }
    },
    {
      // The toggle's knob is our glass lens (the colored liquid + goo morph come
      // from settingsStyles.tsx). Glass goes on the knob itself — not the whole
      // pill — so it doesn't nest behind the toggle's own backdrop. Small element:
      // a gentle distortion and no chromatic aberration keep the refraction clean
      // at ~26x24px. It only translates (and scales on press), so the displacement
      // map stays valid without regeneration.
      selector: ".liquid-toggle .indicator__liquid",
      options: { borderRadius: 999, distortionScale: -14, chromaticAberration: false }
    },
    {
      selector: "#liquify-next-song-card",
      options: { borderRadius: 20 }
    },
    {
      selector: ".main-card-card",
      options: { borderRadius: 20 }
    },
    {
      selector: "#liquify-settings-gear-btn",
      options: { borderRadius: 20 }
    },
    {
      selector: ".artist-artistDiscography-topBar.artist-artistDiscography-topBarScrolled",
      options: { borderRadius: 20 }
    },
    {
      selector: ".wJiY1vDfuci2a4db",
      options: { borderRadius: 20 }
    },
    {
      selector: ".oc3OomY6r9UoIEQ0",
      options: { borderRadius: 20 }
    },
    {
      selector: ".oReO3E1Df2odSFHX",
      options: { borderRadius: 10 }
    },
    {
      selector: ".fA6CNWFY1WQBCde9",
      options: { borderRadius: 10 }
    },
    {
      selector: ".main-trackCreditsModal-container",
      options: { borderRadius: 10 }
    },
    {
      selector: ".TGvpaalpJK0BKYYL",
      options: { borderRadius: 10, glassBlur: "5px" }
    },
    {
      selector: ".edvX5XPBIXITSQoH",
      options: { borderRadius: 10 }
    }
  ];
  var PRECISE_TARGETS = [
    { selector: ".main-trackList-trackListHeader", options: { borderRadius: 20 } },
    { selector: ".main-topBar-background", options: { borderRadius: 0 } },
    { selector: ".znOINyqAy7ivIGbQyrbt", options: { borderRadius: 20, glassBlur: "5px" } },
    { selector: ".iGRaSZDa1r0m21aF6oZq", options: { borderRadius: 20 } },
    { selector: ".niJOWstqVyfckHcXQxP1 .cSZJwcwYgJfwduUmXOOV", options: { borderRadius: 20 } },
    { selector: ".main-nowPlayingView-trackInfo", options: { borderRadius: 20 } },
    { selector: ".main-nowPlayingView-section", options: { borderRadius: 20 } },
    { selector: ".main-entityHeader-container.gmKBgPCnX785KDicbdJu", options: { borderRadius: 20 } },
    { selector: ".main-home-filterChipsSection", options: { borderRadius: 20 } },
    { selector: ".view-homeShortcutsGrid-shortcut", options: { borderRadius: 20 } },
    { selector: ".main-card-card", options: { borderRadius: 20 } },
    { selector: ".Root__globalNav .DoxYADBBjYMvoYwl7QPg", options: { borderRadius: 50 } },
    { selector: ".yfJeY2Xi99dPOe6fsIha", options: { borderRadius: 20 } },
    { selector: ".main-entityHeader-container.main-entityHeader-containerNormal", options: { borderRadius: 20 } },
    { selector: ".x-settings-section", options: { borderRadius: 20 } },
    { selector: ".LR7w41pC8ccVc11Q", options: { borderRadius: 20 } },
    { selector: ".ERRo1Br0ZQtJYVhz", options: { borderRadius: 20 } },
    { selector: ".HOf9H18Ya0DkJ4_K", options: { borderRadius: 20 } },
    { selector: ".main-entityHeader-imageContainerWrapper", options: { borderRadius: 20 } },
    { selector: ".JDUQ8zTo6EUgHoYt", options: { borderRadius: 20 } },
    { selector: ".main-globalNav-searchInputContainer .main-topBar-searchBar", options: { borderRadius: 17 } },
    { selector: ".Root__globalNav .main-globalNav-navLink", options: { borderRadius: 17 } },
    // Context menu / popup: glass on a ::before layer (see user.css .liquify-glass--before).
    { selector: ".main-contextMenu-menu", options: { borderRadius: 20, glassBlur: "5px", applyTo: "before" } },
    { selector: ".xamNkt5LX9o8aL1q", options: { borderRadius: 20, glassBlur: "5px", applyTo: "before" } },
    // Settings toggle knob — tiny, gentle distortion, no chromatic aberration.
    { selector: ".liquid-toggle .indicator__liquid", options: { borderRadius: 999, distortionScale: -14, chromaticAberration: false } }
  ];
  var preciseSelectors = new Set(PRECISE_TARGETS.map((t) => t.selector));
  var BULK_TARGETS = GLASS_TARGETS.filter((t) => !preciseSelectors.has(t.selector)).map((t) => {
    const gb = t.options?.glassBlur;
    return {
      selector: t.selector,
      blur: gb ? parseInt(gb, 10) : void 0,
      before: t.options?.applyTo === "before" ? true : void 0
    };
  });
  function start() {
    installGlassDevtools();
    watchGlassTargets(PRECISE_TARGETS);
    applyBulkGlass(BULK_TARGETS);
    startBackground();
    startPopupBounce();
    startLiquifySettings();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
