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
    const svg2 = `<svg viewBox="0 0 ${w2} ${h2}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lqbulk-rg" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="lqbulk-bg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect x="0" y="0" width="${w2}" height="${h2}" fill="black"></rect><rect x="0" y="0" width="${w2}" height="${h2}" rx="${r}" fill="url(#lqbulk-rg)" /><rect x="0" y="0" width="${w2}" height="${h2}" rx="${r}" fill="url(#lqbulk-bg)" style="mix-blend-mode: screen" /><rect x="${edge}" y="${edge}" width="${w2 - edge * 2}" height="${h2 - edge * 2}" rx="${r}" fill="hsl(0 0% 50% / 0.93)" style="filter:blur(2px)" /></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg2)}`;
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
    const perfOverrides = [];
    for (const t of targets) {
      const bright = t.brightness != null ? ` brightness(${t.brightness})` : "";
      if (t.before) {
        const b2 = t.blur != null ? `${t.blur}px` : "var(--liquify-glass-blur, 2px)";
        extraRules.push(
          `${t.selector}::before{content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;backdrop-filter:var(--glass-filter) blur(${b2})${bright};-webkit-backdrop-filter:var(--glass-filter) blur(${b2})${bright};}`
        );
      } else if (t.blur != null || bright) {
        const b2 = t.blur != null ? `${t.blur}px` : "var(--liquify-glass-blur, 2px)";
        extraRules.push(
          `${t.selector}{backdrop-filter:var(--glass-filter) blur(${b2})${bright};-webkit-backdrop-filter:var(--glass-filter) blur(${b2})${bright};}`
        );
        allSelectors.push(t.selector);
        if (bright) perfOverrides.push({ selector: t.selector, bright });
      } else {
        defaultSelectors.push(t.selector);
        allSelectors.push(t.selector);
      }
    }
    const perfBlur = "blur(var(--liquify-backdrop-blur, 2rem)) saturate(1.4)";
    const css = `:root{--glass-filter:url(#${BULK_FILTER_ID});}` + (defaultSelectors.length ? `${defaultSelectors.join(",")}{backdrop-filter:var(--glass-filter) blur(var(--liquify-glass-blur, 2px));-webkit-backdrop-filter:var(--glass-filter) blur(var(--liquify-glass-blur, 2px));}` : "") + extraRules.join("") + (allSelectors.length ? `html.${PERF_CLASS} :is(${allSelectors.join(",")}){backdrop-filter:${perfBlur};-webkit-backdrop-filter:${perfBlur};}` : "") + // After the blanket perf rule, so these keep their darkening in perf mode.
    perfOverrides.map(
      ({ selector, bright }) => `html.${PERF_CLASS} ${selector}{backdrop-filter:${perfBlur}${bright};-webkit-backdrop-filter:${perfBlur}${bright};}`
    ).join("");
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

  // node_modules/@kawarp/core/dist/index.js
  var BLUR_SIZE = 128;
  var VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;
  var KAWASE_BLUR_SHADER = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_offset;
  varying vec2 v_texCoord;

  void main() {
    highp vec2 texelSize = 1.0 / u_resolution;
    highp vec4 color = vec4(0.0);

    color += texture2D(u_texture, v_texCoord + vec2(-u_offset, -u_offset) * texelSize);
    color += texture2D(u_texture, v_texCoord + vec2(u_offset, -u_offset) * texelSize);
    color += texture2D(u_texture, v_texCoord + vec2(-u_offset, u_offset) * texelSize);
    color += texture2D(u_texture, v_texCoord + vec2(u_offset, u_offset) * texelSize);

    gl_FragColor = color * 0.25;
  }
`;
  var BLEND_SHADER = `
  precision highp float;
  uniform sampler2D u_texture1;
  uniform sampler2D u_texture2;
  uniform float u_blend;
  varying vec2 v_texCoord;

  void main() {
    vec4 color1 = texture2D(u_texture1, v_texCoord);
    vec4 color2 = texture2D(u_texture2, v_texCoord);
    gl_FragColor = mix(color1, color2, u_blend);
  }
`;
  var TINT_SHADER = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec3 u_tintColor;
  uniform float u_tintIntensity;
  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    // darkMask: 1.0 for black, 0.0 for luma >= 0.5
    float darkMask = 1.0 - smoothstep(0.0, 0.5, luma);

    // Blend dark areas toward tint color
    color.rgb = mix(color.rgb, u_tintColor, darkMask * u_tintIntensity);

    gl_FragColor = color;
  }
`;
  var DOMAIN_WARP_SHADER = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform float u_time;
  uniform float u_intensity;
  varying vec2 v_texCoord;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = v_texCoord;
    float t = u_time * 0.05;

    vec2 center = uv - 0.5;
    float centerWeight = 1.0 - smoothstep(0.0, 0.7, length(center));

    // Large-scale movement (slow, big blobs)
    float n1 = snoise(uv * 0.35 + vec2(t, t * 0.7));
    float n2 = snoise(uv * 0.35 + vec2(-t * 0.8, t * 0.5) + vec2(50.0, 50.0));

    // Medium-scale detail (adds organic movement)
    float n3 = snoise(uv * 0.9 + vec2(t * 1.2, -t) + vec2(100.0, 0.0));
    float n4 = snoise(uv * 0.9 + vec2(-t, t * 1.1) + vec2(0.0, 100.0));

    // Combine two octaves
    vec2 warp = vec2(
      n1 * 0.65 + n3 * 0.35,
      n2 * 0.65 + n4 * 0.35
    ) * centerWeight;

    vec2 warpedUV = uv + warp * u_intensity;
    warpedUV = clamp(warpedUV, 0.0, 1.0);

    gl_FragColor = texture2D(u_texture, warpedUV);
  }
`;
  var OUTPUT_SHADER = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform float u_saturation;
  uniform float u_dithering;
  uniform float u_time;
  uniform float u_scale;
  uniform vec2 u_resolution;
  varying vec2 v_texCoord;

  highp float hash(highp vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec2 uv = (v_texCoord - 0.5) / u_scale + 0.5;
    uv = clamp(uv, 0.0, 1.0);

    vec4 color = texture2D(u_texture, uv);

    vec2 center = v_texCoord - 0.5;
    float vignette = 1.0 - dot(center, center) * 0.3;
    color.rgb *= vignette;

    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(gray), color.rgb, u_saturation);

    highp vec2 pixelPos = floor(v_texCoord * u_resolution);
    highp float noise = hash(vec3(pixelPos, floor(u_time * 60.0)));
    color.rgb += (noise - 0.5) * u_dithering;

    gl_FragColor = color;
  }
`;
  var Kawarp = class {
    canvas;
    gl;
    halfFloatExt = null;
    halfFloatLinearExt = null;
    // Shader programs
    blurProgram;
    blendProgram;
    tintProgram;
    warpProgram;
    outputProgram;
    // Buffers
    positionBuffer;
    texCoordBuffer;
    // Source texture (original image)
    sourceTexture;
    // Small FBOs for blur (BLUR_SIZE x BLUR_SIZE)
    blurFBO1;
    blurFBO2;
    // Album FBOs for crossfade (BLUR_SIZE x BLUR_SIZE)
    currentAlbumFBO;
    nextAlbumFBO;
    // Full-res FBO for warp output
    warpFBO;
    // Animation state
    animationId = null;
    lastFrameTime = 0;
    accumulatedTime = 0;
    isPlaying = false;
    // Transition state
    isTransitioning = false;
    transitionStartTime = 0;
    _transitionDuration;
    // Options
    _warpIntensity;
    _blurPasses;
    _animationSpeed;
    _targetAnimationSpeed;
    _saturation;
    _tintColor;
    _tintIntensity;
    _dithering;
    _scale;
    hasImage = false;
    // Cached attribute locations
    attribs;
    // Cached uniform locations
    uniforms;
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
      if (!gl)
        throw new Error("WebGL not supported");
      this.gl = gl;
      this.halfFloatExt = gl.getExtension("OES_texture_half_float");
      this.halfFloatLinearExt = gl.getExtension("OES_texture_half_float_linear");
      this._warpIntensity = options.warpIntensity ?? 1;
      this._blurPasses = options.blurPasses ?? 8;
      this._animationSpeed = options.animationSpeed ?? 1;
      this._targetAnimationSpeed = this._animationSpeed;
      this._transitionDuration = options.transitionDuration ?? 1e3;
      this._saturation = options.saturation ?? 1.5;
      this._tintColor = options.tintColor ?? [0.157, 0.157, 0.235];
      this._tintIntensity = options.tintIntensity ?? 0.15;
      this._dithering = options.dithering ?? 8e-3;
      this._scale = options.scale ?? 1;
      this.blurProgram = this.createProgram(VERTEX_SHADER, KAWASE_BLUR_SHADER);
      this.blendProgram = this.createProgram(VERTEX_SHADER, BLEND_SHADER);
      this.tintProgram = this.createProgram(VERTEX_SHADER, TINT_SHADER);
      this.warpProgram = this.createProgram(VERTEX_SHADER, DOMAIN_WARP_SHADER);
      this.outputProgram = this.createProgram(VERTEX_SHADER, OUTPUT_SHADER);
      this.attribs = {
        position: gl.getAttribLocation(this.blurProgram, "a_position"),
        texCoord: gl.getAttribLocation(this.blurProgram, "a_texCoord")
      };
      this.uniforms = {
        blur: {
          resolution: gl.getUniformLocation(this.blurProgram, "u_resolution"),
          texture: gl.getUniformLocation(this.blurProgram, "u_texture"),
          offset: gl.getUniformLocation(this.blurProgram, "u_offset")
        },
        blend: {
          texture1: gl.getUniformLocation(this.blendProgram, "u_texture1"),
          texture2: gl.getUniformLocation(this.blendProgram, "u_texture2"),
          blend: gl.getUniformLocation(this.blendProgram, "u_blend")
        },
        warp: {
          texture: gl.getUniformLocation(this.warpProgram, "u_texture"),
          time: gl.getUniformLocation(this.warpProgram, "u_time"),
          intensity: gl.getUniformLocation(this.warpProgram, "u_intensity")
        },
        tint: {
          texture: gl.getUniformLocation(this.tintProgram, "u_texture"),
          tintColor: gl.getUniformLocation(this.tintProgram, "u_tintColor"),
          tintIntensity: gl.getUniformLocation(this.tintProgram, "u_tintIntensity")
        },
        output: {
          texture: gl.getUniformLocation(this.outputProgram, "u_texture"),
          saturation: gl.getUniformLocation(this.outputProgram, "u_saturation"),
          dithering: gl.getUniformLocation(this.outputProgram, "u_dithering"),
          time: gl.getUniformLocation(this.outputProgram, "u_time"),
          scale: gl.getUniformLocation(this.outputProgram, "u_scale"),
          resolution: gl.getUniformLocation(this.outputProgram, "u_resolution")
        }
      };
      this.positionBuffer = this.createBuffer(new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]));
      this.texCoordBuffer = this.createBuffer(new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]));
      this.sourceTexture = this.createTexture();
      this.blurFBO1 = this.createFramebuffer(BLUR_SIZE, BLUR_SIZE, true);
      this.blurFBO2 = this.createFramebuffer(BLUR_SIZE, BLUR_SIZE, true);
      this.currentAlbumFBO = this.createFramebuffer(BLUR_SIZE, BLUR_SIZE, true);
      this.nextAlbumFBO = this.createFramebuffer(BLUR_SIZE, BLUR_SIZE, true);
      this.warpFBO = this.createFramebuffer(1, 1, true);
      this.resize();
    }
    // Getters and setters
    get warpIntensity() {
      return this._warpIntensity;
    }
    set warpIntensity(value) {
      this._warpIntensity = Math.max(0, Math.min(1, value));
    }
    get blurPasses() {
      return this._blurPasses;
    }
    set blurPasses(value) {
      const newValue = Math.max(1, Math.min(40, Math.floor(value)));
      if (newValue !== this._blurPasses) {
        this._blurPasses = newValue;
        if (this.hasImage) {
          this.reblurCurrentImage();
        }
      }
    }
    get animationSpeed() {
      return this._targetAnimationSpeed;
    }
    set animationSpeed(value) {
      this._targetAnimationSpeed = Math.max(0.1, Math.min(5, value));
    }
    get transitionDuration() {
      return this._transitionDuration;
    }
    set transitionDuration(value) {
      this._transitionDuration = Math.max(0, Math.min(5e3, value));
    }
    get saturation() {
      return this._saturation;
    }
    set saturation(value) {
      this._saturation = Math.max(0, Math.min(3, value));
    }
    get tintColor() {
      return this._tintColor;
    }
    set tintColor(value) {
      const newValue = value.map((v2) => Math.max(0, Math.min(1, v2)));
      const changed = newValue.some((v2, i2) => v2 !== this._tintColor[i2]);
      if (changed) {
        this._tintColor = newValue;
        if (this.hasImage) {
          this.reblurCurrentImage();
        }
      }
    }
    get tintIntensity() {
      return this._tintIntensity;
    }
    set tintIntensity(value) {
      const newValue = Math.max(0, Math.min(1, value));
      if (newValue !== this._tintIntensity) {
        this._tintIntensity = newValue;
        if (this.hasImage) {
          this.reblurCurrentImage();
        }
      }
    }
    get dithering() {
      return this._dithering;
    }
    set dithering(value) {
      this._dithering = Math.max(0, Math.min(0.1, value));
    }
    get scale() {
      return this._scale;
    }
    set scale(value) {
      this._scale = Math.max(0.01, Math.min(4, value));
    }
    setOptions(options) {
      if (options.warpIntensity !== void 0)
        this.warpIntensity = options.warpIntensity;
      if (options.blurPasses !== void 0)
        this.blurPasses = options.blurPasses;
      if (options.animationSpeed !== void 0)
        this.animationSpeed = options.animationSpeed;
      if (options.transitionDuration !== void 0)
        this.transitionDuration = options.transitionDuration;
      if (options.saturation !== void 0)
        this.saturation = options.saturation;
      if (options.tintColor !== void 0)
        this.tintColor = options.tintColor;
      if (options.tintIntensity !== void 0)
        this.tintIntensity = options.tintIntensity;
      if (options.dithering !== void 0)
        this.dithering = options.dithering;
      if (options.scale !== void 0)
        this.scale = options.scale;
    }
    getOptions() {
      return {
        warpIntensity: this._warpIntensity,
        blurPasses: this._blurPasses,
        animationSpeed: this._targetAnimationSpeed,
        transitionDuration: this._transitionDuration,
        saturation: this._saturation,
        tintColor: this._tintColor,
        tintIntensity: this._tintIntensity,
        dithering: this._dithering,
        scale: this._scale
      };
    }
    // Image loading methods
    loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          this.gl.bindTexture(this.gl.TEXTURE_2D, this.sourceTexture);
          this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
          this.processNewImage();
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    }
    loadImageElement(source) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.sourceTexture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);
      this.processNewImage();
    }
    loadImageData(data, width, height) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.sourceTexture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data instanceof Uint8ClampedArray ? new Uint8Array(data.buffer) : data);
      this.processNewImage();
    }
    loadFromImageData(imageData) {
      this.loadImageData(imageData.data, imageData.width, imageData.height);
    }
    async loadBlob(blob) {
      const bitmap = await createImageBitmap(blob);
      this.loadImageElement(bitmap);
      bitmap.close();
    }
    loadBase64(base64) {
      const src = base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
      return this.loadImage(src);
    }
    async loadArrayBuffer(buffer, mimeType = "image/png") {
      const blob = new Blob([buffer], { type: mimeType });
      return this.loadBlob(blob);
    }
    loadGradient(colors, angle = 135) {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return;
      const angleRad = angle * Math.PI / 180;
      const x1 = size / 2 - Math.cos(angleRad) * size;
      const y1 = size / 2 - Math.sin(angleRad) * size;
      const x2 = size / 2 + Math.cos(angleRad) * size;
      const y2 = size / 2 + Math.sin(angleRad) * size;
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      colors.forEach((color, i2) => {
        gradient.addColorStop(i2 / (colors.length - 1), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      this.loadImageElement(canvas);
    }
    /**
     * Process a new image: blur it and start transition
     * This is the key optimization - blur only runs here, not every frame!
     */
    processNewImage() {
      [this.currentAlbumFBO, this.nextAlbumFBO] = [
        this.nextAlbumFBO,
        this.currentAlbumFBO
      ];
      this.blurSourceInto(this.nextAlbumFBO);
      this.hasImage = true;
      this.isTransitioning = true;
      this.transitionStartTime = performance.now();
    }
    /**
     * Re-blur the current image (used when blurPasses changes)
     * Updates nextAlbumFBO in place without starting a transition
     */
    reblurCurrentImage() {
      this.blurSourceInto(this.nextAlbumFBO);
    }
    /**
     * Blur the source texture into the target FBO (with tint applied before blur)
     */
    blurSourceInto(targetFBO) {
      const gl = this.gl;
      gl.useProgram(this.tintProgram);
      this.setupAttributes();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurFBO1.framebuffer);
      gl.viewport(0, 0, BLUR_SIZE, BLUR_SIZE);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
      gl.uniform1i(this.uniforms.tint.texture, 0);
      gl.uniform3fv(this.uniforms.tint.tintColor, this._tintColor);
      gl.uniform1f(this.uniforms.tint.tintIntensity, this._tintIntensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.useProgram(this.blurProgram);
      this.setupAttributes();
      gl.uniform2f(this.uniforms.blur.resolution, BLUR_SIZE, BLUR_SIZE);
      gl.uniform1i(this.uniforms.blur.texture, 0);
      let readFBO = this.blurFBO1;
      let writeFBO = this.blurFBO2;
      for (let i2 = 0; i2 < this._blurPasses; i2++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeFBO.framebuffer);
        gl.viewport(0, 0, BLUR_SIZE, BLUR_SIZE);
        gl.bindTexture(gl.TEXTURE_2D, readFBO.texture);
        gl.uniform1f(this.uniforms.blur.offset, i2 + 0.5);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        [readFBO, writeFBO] = [writeFBO, readFBO];
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO.framebuffer);
      gl.viewport(0, 0, BLUR_SIZE, BLUR_SIZE);
      gl.bindTexture(gl.TEXTURE_2D, readFBO.texture);
      gl.uniform1f(this.uniforms.blur.offset, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    resize() {
      const width = this.canvas.width;
      const height = this.canvas.height;
      if (this.warpFBO)
        this.deleteFramebuffer(this.warpFBO);
      this.warpFBO = this.createFramebuffer(width, height, true);
    }
    start() {
      if (this.isPlaying)
        return;
      this.isPlaying = true;
      this.lastFrameTime = performance.now();
      requestAnimationFrame(this.renderLoop);
    }
    stop() {
      this.isPlaying = false;
      if (this.animationId !== null) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
    renderFrame(time) {
      const now = performance.now();
      if (time !== void 0) {
        this.render(time, now);
      } else {
        const dt = (now - this.lastFrameTime) / 1e3;
        this.lastFrameTime = now;
        this._animationSpeed += (this._targetAnimationSpeed - this._animationSpeed) * 0.05;
        this.accumulatedTime += dt * this._animationSpeed;
        this.render(this.accumulatedTime, now);
      }
    }
    dispose() {
      this.stop();
      const gl = this.gl;
      gl.deleteProgram(this.blurProgram);
      gl.deleteProgram(this.blendProgram);
      gl.deleteProgram(this.tintProgram);
      gl.deleteProgram(this.warpProgram);
      gl.deleteProgram(this.outputProgram);
      gl.deleteBuffer(this.positionBuffer);
      gl.deleteBuffer(this.texCoordBuffer);
      gl.deleteTexture(this.sourceTexture);
      this.deleteFramebuffer(this.blurFBO1);
      this.deleteFramebuffer(this.blurFBO2);
      this.deleteFramebuffer(this.currentAlbumFBO);
      this.deleteFramebuffer(this.nextAlbumFBO);
      this.deleteFramebuffer(this.warpFBO);
    }
    renderLoop = (timestamp) => {
      if (!this.isPlaying)
        return;
      const dt = (timestamp - this.lastFrameTime) / 1e3;
      this.lastFrameTime = timestamp;
      this._animationSpeed += (this._targetAnimationSpeed - this._animationSpeed) * 0.05;
      this.accumulatedTime += dt * this._animationSpeed;
      this.render(this.accumulatedTime, timestamp);
      this.animationId = requestAnimationFrame(this.renderLoop);
    };
    /**
     * Main render loop - very efficient!
     * Just: blend album FBOs → domain warp → output
     */
    render(time, timestamp = performance.now()) {
      const gl = this.gl;
      const width = this.canvas.width;
      const height = this.canvas.height;
      let blendFactor = 1;
      if (this.isTransitioning) {
        const elapsed = timestamp - this.transitionStartTime;
        blendFactor = Math.min(1, elapsed / this._transitionDuration);
        if (blendFactor >= 1) {
          this.isTransitioning = false;
        }
      }
      let blendedTexture;
      if (this.isTransitioning && blendFactor < 1) {
        gl.useProgram(this.blendProgram);
        this.setupAttributes();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurFBO1.framebuffer);
        gl.viewport(0, 0, BLUR_SIZE, BLUR_SIZE);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.currentAlbumFBO.texture);
        gl.uniform1i(this.uniforms.blend.texture1, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.nextAlbumFBO.texture);
        gl.uniform1i(this.uniforms.blend.texture2, 1);
        gl.uniform1f(this.uniforms.blend.blend, blendFactor);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        blendedTexture = this.blurFBO1.texture;
        gl.useProgram(this.warpProgram);
        this.setupAttributes();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.warpFBO.framebuffer);
        gl.viewport(0, 0, width, height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, blendedTexture);
        gl.uniform1i(this.uniforms.warp.texture, 0);
        gl.uniform1f(this.uniforms.warp.time, time);
        gl.uniform1f(this.uniforms.warp.intensity, this._warpIntensity);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.useProgram(this.outputProgram);
        this.setupAttributes();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.bindTexture(gl.TEXTURE_2D, this.warpFBO.texture);
        gl.uniform1i(this.uniforms.output.texture, 0);
        gl.uniform1f(this.uniforms.output.saturation, this._saturation);
        gl.uniform1f(this.uniforms.output.dithering, this._dithering);
        gl.uniform1f(this.uniforms.output.time, time);
        gl.uniform1f(this.uniforms.output.scale, this._scale);
        gl.uniform2f(this.uniforms.output.resolution, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        gl.useProgram(this.warpProgram);
        this.setupAttributes();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.warpFBO.framebuffer);
        gl.viewport(0, 0, width, height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.nextAlbumFBO.texture);
        gl.uniform1i(this.uniforms.warp.texture, 0);
        gl.uniform1f(this.uniforms.warp.time, time);
        gl.uniform1f(this.uniforms.warp.intensity, this._warpIntensity);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.useProgram(this.outputProgram);
        this.setupAttributes();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.bindTexture(gl.TEXTURE_2D, this.warpFBO.texture);
        gl.uniform1i(this.uniforms.output.texture, 0);
        gl.uniform1f(this.uniforms.output.saturation, this._saturation);
        gl.uniform1f(this.uniforms.output.dithering, this._dithering);
        gl.uniform1f(this.uniforms.output.time, time);
        gl.uniform1f(this.uniforms.output.scale, this._scale);
        gl.uniform2f(this.uniforms.output.resolution, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }
    setupAttributes() {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(this.attribs.position);
      gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.enableVertexAttribArray(this.attribs.texCoord);
      gl.vertexAttribPointer(this.attribs.texCoord, 2, gl.FLOAT, false, 0, 0);
    }
    createShader(type, source) {
      const gl = this.gl;
      const shader = gl.createShader(type);
      if (!shader)
        throw new Error("Failed to create shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compile error: ${error}`);
      }
      return shader;
    }
    createProgram(vertexSource, fragmentSource) {
      const gl = this.gl;
      const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
      const program = gl.createProgram();
      if (!program)
        throw new Error("Failed to create program");
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program link error: ${error}`);
      }
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return program;
    }
    createBuffer(data) {
      const gl = this.gl;
      const buffer = gl.createBuffer();
      if (!buffer)
        throw new Error("Failed to create buffer");
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return buffer;
    }
    createTexture() {
      const gl = this.gl;
      const texture = gl.createTexture();
      if (!texture)
        throw new Error("Failed to create texture");
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return texture;
    }
    createFramebuffer(width, height, useHighPrecision = false) {
      const gl = this.gl;
      const texture = this.createTexture();
      const canUseHalfFloat = useHighPrecision && this.halfFloatExt && this.halfFloatLinearExt;
      const type = canUseHalfFloat ? this.halfFloatExt.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);
      const framebuffer = gl.createFramebuffer();
      if (!framebuffer)
        throw new Error("Failed to create framebuffer");
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return { framebuffer, texture };
    }
    deleteFramebuffer(fbo) {
      this.gl.deleteFramebuffer(fbo.framebuffer);
      this.gl.deleteTexture(fbo.texture);
    }
  };

  // src/settings/shared.ts
  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }
  function sleep(ms) {
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

  // src/settings/features/backgroundAppearance.ts
  var BG_ENGINE_KEY = "liquify-bg-engine";
  function getBgEngine() {
    return localStorage.getItem(BG_ENGINE_KEY) === "tiles" ? "tiles" : "kawarp";
  }
  function setBgEngine(engine) {
    localStorage.setItem(BG_ENGINE_KEY, engine);
    applyBackgroundAppearance();
    window.dispatchEvent(new Event("liquifyBackgroundChange"));
  }
  var HIRES_COVER_KEY = "liquify-hires-cover";
  function isHiResCoverOn() {
    return (localStorage.getItem(HIRES_COVER_KEY) || "on") === "on";
  }
  function setHiResCover(on) {
    localStorage.setItem(HIRES_COVER_KEY, on ? "on" : "off");
    window.dispatchEvent(new Event("liquifyBackgroundChange"));
  }
  var BG_SURFACES = {
    // The two crossfading cover layers — every non-animated mode.
    static: {
      blurKey: "liquify-bg-blur",
      brightnessKey: "liquify-bg-brightness",
      blurVar: "--liquify-bg-blur",
      brightnessVar: "--liquify-bg-brightness",
      defaults: { blur: 7, brightness: 45 }
    },
    // Kawarp: the blur is rescaled into render passes in kawarpBackground.ts, so
    // only the brightness reaches CSS.
    kawarp: {
      blurKey: "liquify-kawarp-blur",
      brightnessKey: "liquify-kawarp-brightness",
      blurVar: "",
      brightnessVar: "--liquify-kawarp-brightness",
      defaults: { blur: 10, brightness: 45 }
    },
    // The drifting blob field. Its old look was hard-coded blur(50px)
    // brightness(60%); those are its defaults so nothing changes for anyone who
    // never touches the sliders.
    tiles: {
      blurKey: "liquify-tiles-blur",
      brightnessKey: "liquify-tiles-brightness",
      blurVar: "--liquify-tiles-blur",
      brightnessVar: "--liquify-tiles-brightness",
      defaults: { blur: 50, brightness: 60 }
    }
  };
  var BG_BLUR_RANGE = { static: 100, kawarp: 100, tiles: 150 };
  function readBackgroundAppearance(surface, field) {
    const spec = BG_SURFACES[surface];
    const key = field === "blur" ? spec.blurKey : spec.brightnessKey;
    return readNum(key, spec.defaults[field]);
  }
  function readAllBackgroundAppearance() {
    const all = {};
    for (const surface of Object.keys(BG_SURFACES)) {
      all[surface] = {
        blur: readBackgroundAppearance(surface, "blur"),
        brightness: readBackgroundAppearance(surface, "brightness")
      };
    }
    return all;
  }
  function applyBackgroundAppearance() {
    const style = document.documentElement.style;
    const write = (name, value) => {
      if (!name) return;
      if (style.getPropertyValue(name) === value) return;
      style.setProperty(name, value);
    };
    for (const surface of Object.keys(BG_SURFACES)) {
      const spec = BG_SURFACES[surface];
      write(spec.blurVar, `${readBackgroundAppearance(surface, "blur")}px`);
      write(spec.brightnessVar, `${readBackgroundAppearance(surface, "brightness")}%`);
    }
  }
  function setBackgroundAppearance(surface, field, value) {
    const spec = BG_SURFACES[surface];
    localStorage.setItem(field === "blur" ? spec.blurKey : spec.brightnessKey, String(value));
    applyBackgroundAppearance();
    window.dispatchEvent(new Event("liquifyBackgroundChange"));
  }
  function resetBackgroundAppearance() {
    for (const surface of Object.keys(BG_SURFACES)) {
      const spec = BG_SURFACES[surface];
      localStorage.setItem(spec.blurKey, String(spec.defaults.blur));
      localStorage.setItem(spec.brightnessKey, String(spec.defaults.brightness));
    }
    localStorage.setItem(BG_ENGINE_KEY, "kawarp");
    applyBackgroundAppearance();
  }
  function ensureBackgroundAppearanceApplied() {
    applyBackgroundAppearance();
  }

  // src/settings/features/kawarpBackground.ts
  var KAWARP_KEYS = {
    warp: "liquify-kawarp-warp",
    speed: "liquify-kawarp-speed",
    saturation: "liquify-kawarp-saturation",
    scale: "liquify-kawarp-scale",
    contrast: "liquify-kawarp-contrast"
  };
  var KAWARP_DEFAULTS = {
    warp: 50,
    speed: 100,
    saturation: 150,
    scale: 100,
    contrast: 100
  };
  var KAWARP_RANGES = {
    warp: { min: 0, max: 100 },
    speed: { min: 0, max: 400 },
    saturation: { min: 0, max: 500 },
    scale: { min: 10, max: 400 },
    contrast: { min: 0, max: 300 }
  };
  var CROSSFADE_MS = 600;
  var TARGET_FPS = 60;
  var MAX_KAWARP_PX = 1280;
  var MAX_DPR = 1.5;
  var RESIZE_SETTLE_MS = 160;
  var MAX_FRAME_STEP_MS = 250;
  function read(key) {
    const range = KAWARP_RANGES[key];
    return clamp(readNum(KAWARP_KEYS[key], KAWARP_DEFAULTS[key]), range.min, range.max);
  }
  function kawarpOptions() {
    return {
      // The generic 0-100 slider maps onto Kawarp's 0-1 intensity.
      warpIntensity: read("warp") / 100,
      // Kawarp counts blur passes (1-40) rather than pixels, so the slider is
      // rescaled. It has its own stored value — see backgroundAppearance.ts.
      blurPasses: Math.max(
        1,
        Math.round(clamp(readBackgroundAppearance("kawarp", "blur"), 0, 100) / 100 * 40)
      ),
      // Only informational here: the shared loop below advances its own clock, so
      // the speed is applied there rather than by Kawarp's accumulator.
      animationSpeed: read("speed") / 100,
      // Kawarp's own blend stays off — the crossfade is the two-canvas stack in
      // swap(), so each renderer only ever holds one still image.
      transitionDuration: 0,
      saturation: read("saturation") / 100,
      scale: clamp(read("scale") / 100, 0.01, 4)
    };
  }
  function applyKawarpAppearance() {
    const style = document.documentElement.style;
    const value = `${read("contrast")}%`;
    if (style.getPropertyValue("--liquify-kawarp-contrast") !== value) {
      style.setProperty("--liquify-kawarp-contrast", value);
    }
  }
  function setKawarpValue(key, value) {
    localStorage.setItem(KAWARP_KEYS[key], String(value));
    applyKawarpAppearance();
    window.dispatchEvent(new Event("liquifyBackgroundChange"));
  }
  function resetKawarpDefaults() {
    for (const key of Object.keys(KAWARP_KEYS)) {
      localStorage.setItem(KAWARP_KEYS[key], String(KAWARP_DEFAULTS[key]));
    }
    applyKawarpAppearance();
  }
  var KawarpBackdrop = class {
    constructor() {
      this.layers = [];
      this.useA = true;
      this.swapTimer = 0;
      this.resizeTimer = 0;
      this.resizeObserver = null;
      // Guards against a slow decode resolving after the mode moved on.
      this.token = 0;
      this.lastUrl = "";
      this.lastOptions = "";
      this.active = false;
      // WebGL refused a context, or the picture failed to decode with CORS. Either
      // way the caller has to paint something else.
      this.failed = false;
      this.failedUrls = /* @__PURE__ */ new Set();
      // --- Shared render loop ---
      this.live = /* @__PURE__ */ new Set();
      this.rafId = 0;
      this.lastFrame = 0;
      /** The warp's own time. Shared, so both renderers stay in phase. */
      this.clock = 0;
      this.speed = 1;
      this.tick = (now) => {
        this.rafId = requestAnimationFrame(this.tick);
        const elapsed = now - this.lastFrame;
        if (elapsed < 1e3 / TARGET_FPS - 4) return;
        this.lastFrame = now;
        this.clock += Math.min(elapsed, MAX_FRAME_STEP_MS) / 1e3 * this.speed;
        for (const renderer of this.live) {
          try {
            renderer.renderFrame(this.clock);
          } catch {
          }
        }
      };
      this.el = document.createElement("div");
      this.el.className = "liquify-kawarp-bg";
      this.el.setAttribute("aria-hidden", "true");
      document.addEventListener("visibilitychange", () => this.syncLoop());
    }
    /** Whether this URL can be shown. A picture Kawarp could not read (an image
     *  host that sends no Access-Control-Allow-Origin — WebGL needs the pixels,
     *  unlike a plain CSS background) has to fall back to the static layers. */
    canRender(url) {
      return !this.failed && !!url && !this.failedUrls.has(url);
    }
    setActive(active) {
      if (this.active === active) return;
      this.active = active;
      this.el.classList.toggle("active", active);
      this.syncLoop();
    }
    /** Re-reads the settings and pushes them into both renderers. */
    applyOptions() {
      const options = kawarpOptions();
      this.speed = options.animationSpeed;
      if (this.layers.length === 0) return;
      const next = JSON.stringify(options);
      if (next === this.lastOptions) return;
      this.lastOptions = next;
      for (const layer of this.layers) layer.renderer.setOptions(options);
    }
    /** Paints `url`, crossfading from whatever is already on screen. */
    show(url) {
      if (!this.ensureLayers()) return;
      this.applyOptions();
      if (url === this.lastUrl) return;
      this.lastUrl = url;
      void this.swap(url);
    }
    // --- The loop -------------------------------------------------------------
    syncLoop() {
      const wanted = this.active && this.live.size > 0 && !document.hidden;
      if (wanted && !this.rafId) {
        this.lastFrame = performance.now();
        this.rafId = requestAnimationFrame(this.tick);
      } else if (!wanted && this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    }
    // --- Layers ---------------------------------------------------------------
    ensureLayers() {
      if (this.failed) return false;
      if (this.layers.length === 2) return true;
      try {
        this.layers = [0, 1].map(() => {
          const canvas = document.createElement("canvas");
          canvas.className = "liquify-kawarp-canvas";
          this.el.appendChild(canvas);
          return { canvas, renderer: new Kawarp(canvas, kawarpOptions()) };
        });
      } catch (error) {
        console.warn("[Liquify] Kawarp unavailable, falling back to the static background.", error);
        this.failed = true;
        this.el.replaceChildren();
        this.layers = [];
        return false;
      }
      for (const layer of this.layers) this.sizeCanvas(layer);
      this.observeResize();
      this.lastOptions = JSON.stringify(kawarpOptions());
      return true;
    }
    async swap(url) {
      const token = ++this.token;
      let source;
      try {
        source = await decodeImage(url);
      } catch {
        this.failedUrls.add(url);
        if (token === this.token) this.lastUrl = "";
        window.dispatchEvent(new Event("liquifyBackgroundChange"));
        return;
      }
      if (token !== this.token || this.layers.length < 2) return;
      const incoming = this.useA ? this.layers[0] : this.layers[1];
      const outgoing = this.useA ? this.layers[1] : this.layers[0];
      this.sizeCanvas(incoming);
      incoming.renderer.loadImageElement(source);
      this.live.add(incoming.renderer);
      this.syncLoop();
      try {
        incoming.renderer.renderFrame(this.clock);
      } catch {
      }
      await nextFrame();
      if (token !== this.token) return;
      incoming.canvas.classList.add("active", "is-front");
      outgoing.canvas.classList.remove("is-front");
      this.useA = !this.useA;
      window.clearTimeout(this.swapTimer);
      this.swapTimer = window.setTimeout(() => {
        if (token !== this.token) return;
        outgoing.canvas.classList.remove("active");
        this.live.delete(outgoing.renderer);
        this.syncLoop();
      }, CROSSFADE_MS + 80);
    }
    observeResize() {
      if (this.resizeObserver) return;
      this.resizeObserver = new ResizeObserver(() => {
        window.clearTimeout(this.resizeTimer);
        this.resizeTimer = window.setTimeout(() => {
          for (const layer of this.layers) this.sizeCanvas(layer);
        }, RESIZE_SETTLE_MS);
      });
      this.resizeObserver.observe(this.el);
    }
    /** Matches a renderer's backing store to the space it is stretched across.
     *
     *  Kawarp draws at canvas.width/height and never touches them — its resize()
     *  only reallocates the warp buffer to whatever they already say. Left unset,
     *  every frame renders at a bare canvas's 300x150 and is scaled up by CSS. */
    sizeCanvas(layer) {
      const width = this.el.clientWidth;
      const height = this.el.clientHeight;
      if (width < 2 || height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const longest = Math.max(width, height) * dpr;
      const factor = longest > MAX_KAWARP_PX ? MAX_KAWARP_PX / longest * dpr : dpr;
      const target = { width: Math.round(width * factor), height: Math.round(height * factor) };
      if (layer.canvas.width === target.width && layer.canvas.height === target.height) return;
      layer.canvas.width = target.width;
      layer.canvas.height = target.height;
      layer.renderer.resize();
      try {
        layer.renderer.renderFrame(this.clock);
      } catch {
      }
    }
  };
  function decodeImage(url) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    return image.decode().then(() => image);
  }
  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  // src/settings/features/backgroundLibrary.ts
  var DB_NAME = "liquify-backgrounds";
  var DB_VERSION = 1;
  var STORE = "images";
  var LIBRARY_SELECTED_KEY = "liquify-bg-library-id";
  var LEGACY_IMAGE_KEY = "liquify-bg-image";
  var dbPromise = null;
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }
  function tx(mode, run) {
    return openDb().then(
      (db) => new Promise((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
    );
  }
  async function listImages() {
    try {
      const all = await tx("readonly", (s2) => s2.getAll()) || [];
      return all.sort((a, b2) => b2.added - a.added);
    } catch {
      return [];
    }
  }
  async function addImages(files) {
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        added: Date.now(),
        blob: file
      };
      await tx("readwrite", (s2) => s2.put(entry));
    }
  }
  async function deleteImage(id) {
    await tx("readwrite", (s2) => s2.delete(id));
    if (localStorage.getItem(LIBRARY_SELECTED_KEY) === id) {
      localStorage.removeItem(LIBRARY_SELECTED_KEY);
      await refreshSelected();
    }
  }
  var currentUrl = null;
  var currentId = "";
  function getLibraryUrl() {
    return currentUrl;
  }
  function revoke() {
    if (currentUrl && currentUrl.startsWith("blob:")) URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
  async function refreshSelected() {
    const id = localStorage.getItem(LIBRARY_SELECTED_KEY) || "";
    if (!id) {
      revoke();
      currentId = "";
      currentUrl = localStorage.getItem(LEGACY_IMAGE_KEY) || null;
      window.dispatchEvent(new Event("liquifyBackgroundChange"));
      return;
    }
    if (id === currentId && currentUrl) return;
    try {
      const entry = await tx("readonly", (s2) => s2.get(id));
      revoke();
      currentId = id;
      currentUrl = entry?.blob ? URL.createObjectURL(entry.blob) : null;
    } catch {
      revoke();
      currentId = "";
    }
    window.dispatchEvent(new Event("liquifyBackgroundChange"));
  }
  function selectImage(id) {
    localStorage.setItem(LIBRARY_SELECTED_KEY, id);
    void refreshSelected();
  }
  function ensureLibraryApplied() {
    void refreshSelected();
  }

  // src/background.ts
  var FALLBACK_COLOR = "rgb(30,215,96)";
  var EMPTY_BACKDROP = "linear-gradient(135deg, rgb(32,32,38) 0%, rgb(20,20,25) 50%, rgb(26,23,33) 100%)";
  function cssImage(source) {
    return source.startsWith("linear-gradient(") ? source : `url("${source}")`;
  }
  var UNSAMPLEABLE = "liquify:unsampleable";
  var IMAGE_SIZE_UPGRADES = {
    // Album / track art: 64 and 300 → 640.
    ab67616d00004851: "ab67616d0000b273",
    ab67616d00001e02: "ab67616d0000b273",
    // Artist images: 160 and 320 → 640.
    ab6761610000f178: "ab6761610000e5eb",
    ab67616100005174: "ab6761610000e5eb",
    // Playlist mosaics: 300 → 640.
    ab67706c0000da84: "ab67706c0000bebb"
  };
  function upgradeImageSize(url) {
    return url.replace(/\/image\/([0-9a-f]{16})/i, (whole, code) => {
      const larger = IMAGE_SIZE_UPGRADES[code.toLowerCase()];
      return larger ? `/image/${larger}` : whole;
    });
  }
  var COVER_PREFIX_2000 = "ab67616d000082c1";
  var coverSize = /* @__PURE__ */ new Map();
  var coverPending = /* @__PURE__ */ new Set();
  function resolveBigCover(base, big) {
    if (coverPending.has(base)) return;
    coverPending.add(base);
    const probe = new Image();
    const settle = (url) => {
      coverPending.delete(base);
      coverSize.set(base, url);
      if (base === baseCoverUrlOf(Spicetify.Player?.data?.item)) {
        window.dispatchEvent(new Event("liquifyBackgroundChange"));
      }
    };
    probe.onload = () => settle(big);
    probe.onerror = () => settle(base);
    probe.src = big;
  }
  function baseCoverUrlOf(item) {
    const meta = (item?.contextTrack || item)?.metadata;
    const raw = meta?.image_xlarge_url || meta?.image_large_url || meta?.image_url || meta?.image_small_url;
    if (!raw) return null;
    const url = String(raw).replace("spotify:image:", "https://i.scdn.co/image/");
    return isHiResCoverOn() ? upgradeImageSize(url) : url;
  }
  function bigCoverUrlOf(base) {
    if (!isHiResCoverOn()) return null;
    const big = base.replace(/\/image\/ab67616d[0-9a-f]{8}/i, `/image/${COVER_PREFIX_2000}`);
    return big === base ? null : big;
  }
  function getCoverUrl() {
    const base = baseCoverUrlOf(Spicetify.Player?.data?.item);
    if (!base) return null;
    const big = bigCoverUrlOf(base);
    if (!big) return base;
    const settled = coverSize.get(base);
    if (settled) return settled;
    resolveBigCover(base, big);
    return null;
  }
  function prefetchNeighbourCovers() {
    const queue = Spicetify.Queue || Spicetify.Platform?.PlayerAPI?._queue || {};
    const around = [
      ...(queue.nextTracks || queue.next_tracks || []).slice(0, 2),
      ...(queue.prevTracks || queue.prev_tracks || []).slice(-1)
    ];
    for (const track of around) {
      const base = baseCoverUrlOf(track);
      if (!base || coverSize.has(base)) continue;
      const big = bigCoverUrlOf(base);
      if (big) resolveBigCover(base, big);
    }
  }
  var MAX_SAMPLE_PIXELS = 128 * 128;
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
  var sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
  async function waitFor(get, timeoutMs) {
    const start2 = Date.now();
    for (; ; ) {
      const value = get();
      if (value) return value;
      if (Date.now() - start2 >= timeoutMs) return null;
      await sleep2(300);
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
    const kawarp = new KawarpBackdrop();
    root.prepend(kawarp.el);
    applyKawarpAppearance();
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
    const hideTiles = () => {
      animatedContainer.classList.remove("active");
      animatedTilesA.forEach((tile) => tile.classList.remove("active"));
      animatedTilesB.forEach((tile) => tile.classList.remove("active"));
    };
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
      const norm = (s2) => {
        const url = String(s2).replace("spotify:image:", "https://i.scdn.co/image/");
        return isHiResCoverOn() ? upgradeImageSize(url) : url;
      };
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
    function render(kind, image, url) {
      if (!image) return;
      const engine = getBgEngine();
      const key = `${kind}|${engine}|${image}`;
      if (key === lastRenderKey) return;
      lastRenderKey = key;
      if (kind === "animated" && engine === "kawarp" && url) {
        layerA.classList.remove("active");
        layerB.classList.remove("active");
        hideTiles();
        kawarp.setActive(true);
        kawarp.show(url);
        return;
      }
      kawarp.setActive(false);
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
        return;
      }
      hideTiles();
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
    function resolveBackdrop() {
      const bgMode = localStorage.getItem("liquify-bg-mode") || "dynamic";
      const customImage = getLibraryUrl();
      const bgUrl = localStorage.getItem("liquify-bg-url");
      const customAnimated = localStorage.getItem("liquify-bg-custom-animated") === "on";
      const customKind = customAnimated ? "animated" : "static";
      const coverUrl = getCoverUrl();
      const from = (kind, url) => ({ kind, image: url ? cssImage(url) : null, url, sampleUrl: url });
      let result;
      if (bgMode === "custom" && customImage) result = from(customKind, customImage);
      else if (bgMode === "url" && bgUrl) {
        result = { kind: customKind, image: cssImage(bgUrl), url: bgUrl, sampleUrl: UNSAMPLEABLE };
      } else if (bgMode === "playlist") {
        const playlistCover = getResolvedContextCover();
        const isPlaylist = getContextUri().includes(":playlist:");
        result = from(customKind, isPlaylist ? playlistCover : playlistCover || coverUrl);
      } else if (bgMode === "animated") result = from("animated", coverUrl);
      else result = from("static", coverUrl);
      if (result.kind === "animated" && getBgEngine() === "kawarp" && !kawarp.canRender(result.url)) {
        result = { ...result, kind: "static" };
      }
      if (!result.image && lastRenderKey === null) {
        return { kind: "static", image: EMPTY_BACKDROP, url: null, sampleUrl: null };
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
      const { kind, image, url, sampleUrl } = resolveBackdrop();
      render(kind, image, url);
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
    window.addEventListener("liquifyBackgroundChange", () => {
      applyKawarpAppearance();
      kawarp.applyOptions();
    });
    window.addEventListener("liquifyAccentColorParamsChange", updateAccentOnly);
    waitFor(
      () => typeof Spicetify?.Player?.addEventListener === "function" ? Spicetify.Player : null,
      3e4
    ).then((player) => {
      try {
        player?.addEventListener("songchange", () => {
          updateBackgroundAndAccent();
          prefetchNeighbourCovers();
        });
      } catch {
      }
      prefetchNeighbourCovers();
    });
    setInterval(updateBackgroundAndAccent, 500);
    setInterval(prefetchNeighbourCovers, 2e3);
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
    const lastGlass = /* @__PURE__ */ new WeakMap();
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
      const glass = lastGlass.get(el);
      if (glass?.background) s2.backgroundColor = glass.background;
      const captured = glass?.backdrop;
      const backdrop = captured && captured !== "none" && !captured.includes("url(") ? captured : "blur(var(--liquify-backdrop-blur, 2rem))";
      s2.backdropFilter = backdrop;
      s2.webkitBackdropFilter = backdrop;
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
          const cs = getComputedStyle(el);
          lastGlass.set(el, {
            backdrop: cs.backdropFilter || cs.webkitBackdropFilter || "",
            background: cs.backgroundColor || ""
          });
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

  // src/settings/runtime/reactRuntime.ts
  var React;
  var ReactDOM;
  async function awaitSpicetifyReact() {
    while (!Spicetify?.React || !Spicetify?.ReactDOM) await sleep(200);
    React = Spicetify.React;
    ReactDOM = Spicetify.ReactDOM;
  }
  async function awaitSpicetifyPlayer(timeoutMs = 1e4) {
    const start2 = Date.now();
    const ready = () => {
      const p2 = Spicetify?.Player;
      return !!p2 && typeof p2.next === "function" && typeof p2.back === "function" && typeof p2.addEventListener === "function";
    };
    while (!ready() && Date.now() - start2 < timeoutMs) await sleep(200);
  }

  // src/settings/i18n/translations.ts
  var settingsCopy = {
    settingsTitle: "Liquify Settings",
    title: "Liquify Settings",
    close: "Close",
    chooseFile: "Choose file",
    openLibrary: "Image Library",
    imageLibrary: "Image Library",
    addImages: "Add images",
    libraryEmpty: "No images yet. Add some to get started.",
    removeImage: "Remove",
    enterUrl: "Enter image URL...",
    resetAllSettings: "Reset all Settings",
    searchPlaceholder: "Search settings...",
    language: "Language:",
    languageChoice: "Choose Language:",
    languageOptions: { auto: "Follow Spotify" },
    accentColor: "Color Theme:",
    accentSource: "Color Source:",
    accentSatBoost: "Saturation Boost:",
    accentLightBoost: "Brightness Boost:",
    background: "Background:",
    hiResCover: "Use hi-res pictures:",
    backgroundBlur: "Background Blur (px):",
    animatedBackground: "Animated Background:",
    backgroundBrightness: "Background Brightness (%):",
    animatedEngine: "Engine:",
    vinyl: {
      npv: "Vinyl in Sidebar:",
      playbar: "Vinyl in Playbar:",
      cinema: "Vinyl in Cinema View:",
      speed: "Seconds Per Turn:"
    },
    kawarp: {
      warp: "Warp Intensity (%):",
      speed: "Animation Speed (%):",
      saturation: "Saturation (%):",
      scale: "Scale (%):",
      contrast: "Contrast (%):"
    },
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
      language: "Language",
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
      translation: "Translation",
      kawarp: "Animated Background",
      sidebars: "Sidebars",
      typography: "Typography",
      vinyl: "Vinyl Cover Art"
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
      songCover: "Song Cover",
      engineKawarp: "Kawarp (WebGL)",
      engineTiles: "Classic"
    },
    ui: {
      performanceMode: "Performance Mode:",
      popupBounce: "Popup Bounce:",
      newHomescreenLayout: "Use New Homescreen Layout:",
      glassBlur: "Glass Blur (px):",
      backdropBlur: "Backdrop Blur (px):",
      leftSidebarRadius: "Left Sidebar Border Radius (px):",
      mainViewRadius: "Main View Border Radius (px):",
      rightSidebarRadius: "Right Sidebar Border Radius (px):",
      leftSidebarBlur: "Blur Behind Left Sidebar:",
      leftSidebarBlurAmount: "Left Sidebar Blur (px):",
      bodyFont: "Body Font:",
      headingFont: "Heading Font:",
      rightSidebarBlur: "Blur Behind Right Sidebar:",
      rightSidebarBlurAmount: "Right Sidebar Blur (px):",
      localFilesTransparent: "Transparent Local Files Card:"
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
      hiResCover: "Loads the largest cover the CDN has, so the backdrop stays sharp on a large window. Turn it off to load pictures faster and avoid the delay on a track change.",
      artistBackground: "What to show behind artist pages: the theme default, nothing, your own image, or an image URL.",
      artistScrollBlur: "Blur of the artist header image as you scroll down the page.",
      artistScrollBrightness: "Brightness of the artist header image as you scroll down the page.",
      performanceMode: "Turns off the SVG liquid-glass refraction and uses a plain blur instead - lighter on the GPU.",
      language: "Follow Spotify uses whatever language the app is set to; Custom pins the panel to one you pick.",
      vinyl: "Turns the cover art into a spinning record. It holds its angle while playback is paused.",
      glassBlur: "Backdrop blur strength behind the liquid-glass surfaces.",
      bodyFont: "Replaces Spotify's typeface everywhere except headings and titles.",
      headingFont: "Replaces the typeface of headlines and titles only.",
      sidebarBlur: "Blurs the background showing through the left and right sidebars.",
      localFilesTransparent: "Clears the solid fill behind the Local Files entry in the library list.",
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
      openLibrary: "Bildbibliothek",
      imageLibrary: "Bildbibliothek",
      addImages: "Bilder hinzuf\xFCgen",
      libraryEmpty: "Noch keine Bilder. F\xFCge welche hinzu, um zu starten.",
      removeImage: "Entfernen",
      enterUrl: "Bild-URL eingeben...",
      resetAllSettings: "Alle Einstellungen zur\xFCcksetzen",
      searchPlaceholder: "Einstellungen suchen...",
      language: "Sprache:",
      languageChoice: "Sprache w\xE4hlen:",
      languageOptions: { auto: "Spotify folgen" },
      accentColor: "Farbschema:",
      accentSource: "Farbquelle:",
      accentSatBoost: "S\xE4ttigungs-Boost:",
      accentLightBoost: "Helligkeits-Boost:",
      background: "Hintergrund:",
      hiResCover: "Hi-Res-Bilder verwenden:",
      backgroundBlur: "Hintergrundunsch\xE4rfe (px):",
      animatedBackground: "Animierter Hintergrund:",
      backgroundBrightness: "Hintergrundhelligkeit (%):",
      animatedEngine: "Engine:",
      vinyl: { npv: "Vinyl in Seitenleiste:", playbar: "Vinyl in Playbar:", cinema: "Vinyl im Cinema-Modus:", speed: "Sekunden pro Umdrehung:" },
      kawarp: { warp: "Verzerrungsst\xE4rke (%):", speed: "Animationsgeschwindigkeit (%):", saturation: "S\xE4ttigung (%):", scale: "Skalierung (%):", contrast: "Kontrast (%):" },
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
      sections: { language: "Sprache", accent: "Farben", background: "Hintergrund", artist: "K\xFCnstler", ui: "UI", player: "Player", nextSongCard: "N\xE4chster Song", canvasCoverArt: "Canvas Cover Art", playlist: "Playlist", lyrics: "Songtexte", transparent: "Fenstersteuerung", config: "Konfig" },
      subSections: { performanceGlass: "Performance & Glass", animations: "Animationen", homescreen: "Startseite", borderRadius: "Rundungen", sizeShape: "Gr\xF6\xDFe & Form", progressVolume: "Fortschritts- & Lautst\xE4rkeleiste", coverArt: "Cover-Art", modes: "Modi", styling: "Styling", translation: "\xDCbersetzung", kawarp: "Animierter Hintergrund", sidebars: "Seitenleisten", typography: "Typografie", vinyl: "Vinyl Cover Art" },
      config: { hint: "Kopiere deine aktuelle Liquify-Konfiguration zum Sichern oder Teilen, oder f\xFCge eine ein und wende sie an. Eigene Hintergrundbilder sind nicht enthalten.", copy: "Kopieren", reload: "Aktuelle laden", apply: "Einf\xFCgen & Anwenden", copied: "In die Zwischenablage kopiert.", copyFailed: "Kopieren fehlgeschlagen - markiere den Text und kopiere ihn manuell.", invalid: "Ung\xFCltige Konfiguration." },
      dropdown: { default: "Standard", custom: "Benutzerdefiniert", dynamic: "Dynamisch", animated: "Animiert", playlist: "Playlist", theme: "Theme", none: "Keine", show: "Anzeigen", hide: "Ausblenden", on: "An", off: "Aus", url: "URL", backgroundSource: "Hintergrund", songCover: "Song-Cover", engineKawarp: "Kawarp (WebGL)", engineTiles: "Klassisch" },
      ui: { performanceMode: "Performance-Modus:", popupBounce: "Popup-Bounce:", newHomescreenLayout: "Neues Startseiten-Layout verwenden:", glassBlur: "Glass-Unsch\xE4rfe (px):", backdropBlur: "Backdrop-Unsch\xE4rfe (px):", leftSidebarRadius: "Rundung der linken Seitenleiste (px):", mainViewRadius: "Rundung der Hauptansicht (px):", rightSidebarRadius: "Rundung der rechten Seitenleiste (px):", leftSidebarBlur: "Hinter linker Seitenleiste weichzeichnen:", leftSidebarBlurAmount: "Unsch\xE4rfe linke Seitenleiste (px):", bodyFont: "Flie\xDFtext-Schrift:", headingFont: "\xDCberschriften-Schrift:", rightSidebarBlur: "Hinter rechter Seitenleiste weichzeichnen:", rightSidebarBlurAmount: "Unsch\xE4rfe rechte Seitenleiste (px):", localFilesTransparent: "Lokale Dateien transparent:" },
      canvasCoverArt: { mode: "Cover-Art beim Tracknamen:", off: "Aus", trackInfo: "Neben Track-Info", outsideTrackInfo: "Au\xDFerhalb der Track-Info", overCanvas: "\xDCber Canvas", showAlways: "Immer anzeigen:", yes: "Ja", no: "Nein", blur: "Unsch\xE4rfe (px):" },
      comfyCoverArt: { enabled: "Comfy Cover Art:", width: "Breite (px):", height: "H\xF6he (px):", marginBottom: "Unterer Abstand (px):", marginLeft: "Linker Abstand (px):" },
      nextSongCard: { show: "N\xE4chste-Song-Karte anzeigen:", position: "Horizontale Position", cardHeight: "Kartenh\xF6he (px):", cardMaxWidth: "Max. Kartenbreite (px):", gap: "Abstand zwischen Bild und Text (px):", coverSize: "Cover-Gr\xF6\xDFe (px):", hPad: "Horizontaler Innenabstand (px):", vPad: "Vertikaler Innenabstand (px):", gapToPlayer: "Abstand zum Player (px):", borderRadius: "Rundung (px):", coverBorderRadius: "Cover-Rundung (px):", left: "Links", right: "Rechts" },
      lyricsOptions: { off: "Aus", translation: "Nur \xDCbersetzung", romanization: "Nur Romanisierung", both: "\xDCbersetzung + Romanisierung" },
      tooltips: {
        language: '\u201ESpotify folgen" \xFCbernimmt die Sprache der App; \u201EBenutzerdefiniert" legt das Panel auf eine feste Sprache.',
        accentColor: "Standard nutzt Spotifys Gr\xFCn, Benutzerdefiniert eine feste Farbe, Dynamisch passt den Akzent an das aktuelle Cover an.",
        accentSource: "Woher die dynamischen Farben kommen: vom aktuell angezeigten Hintergrund (Playlist, eigenes Bild oder URL) oder immer vom Song-Cover.",
        accentSatBoost: "Wie stark Farben aus dem Cover intensiviert werden (nur dynamischer Modus).",
        accentLightBoost: "Wie stark der Akzent aus dem Cover aufgehellt wird (nur dynamischer Modus).",
        background: "Dynamisch = verschwommenes aktuelles Cover, Animiert = bewegter Verlauf, Playlist = Playlist-Bild, Benutzerdefiniert = eigenes Bild, URL = Bildlink.",
        animatedBackground: "Animiert benutzerdefinierte, URL- oder Playlist-Hintergr\xFCnde dezent.",
        hiResCover: "L\xE4dt das gr\xF6\xDFte verf\xFCgbare Cover, damit der Hintergrund auch im gro\xDFen Fenster scharf bleibt. Deaktivieren, damit Bilder schneller laden und die Verz\xF6gerung beim Songwechsel entf\xE4llt.",
        bodyFont: "Ersetzt Spotifys Schriftart \xFCberall au\xDFer bei \xDCberschriften und Titeln.",
        headingFont: "Ersetzt die Schriftart nur bei \xDCberschriften und Titeln.",
        vinyl: "Macht aus dem Cover eine drehende Schallplatte. Bei pausierter Wiedergabe beh\xE4lt sie ihren Winkel.",
        sidebarBlur: "Zeichnet den Hintergrund weich, der durch die linke und rechte Seitenleiste scheint.",
        localFilesTransparent: 'Entfernt die gef\xFCllte Fl\xE4che hinter dem Eintrag \u201ELokale Dateien" in der Bibliothek.',
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
  var LATE_STRINGS = {
    ru: {
      openLibrary: "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439",
      imageLibrary: "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439",
      addImages: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F",
      libraryEmpty: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u0447\u0430\u0442\u044C.",
      removeImage: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C",
      hiResCover: "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0432\u044B\u0441\u043E\u043A\u043E\u0433\u043E \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F:",
      language: "\u042F\u0437\u044B\u043A:",
      languageChoice: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u044F\u0437\u044B\u043A:",
      languageOptions: { auto: "\u041A\u0430\u043A \u0432 Spotify" },
      animatedEngine: "\u0414\u0432\u0438\u0436\u043E\u043A:",
      kawarp: { warp: "\u0421\u0438\u043B\u0430 \u0438\u0441\u043A\u0430\u0436\u0435\u043D\u0438\u044F (%):", speed: "\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u0438 (%):", saturation: "\u041D\u0430\u0441\u044B\u0449\u0435\u043D\u043D\u043E\u0441\u0442\u044C (%):", scale: "\u041C\u0430\u0441\u0448\u0442\u0430\u0431 (%):", contrast: "\u041A\u043E\u043D\u0442\u0440\u0430\u0441\u0442 (%):" },
      sections: { language: "\u042F\u0437\u044B\u043A" },
      subSections: { kawarp: "\u0410\u043D\u0438\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0444\u043E\u043D", sidebars: "\u0411\u043E\u043A\u043E\u0432\u044B\u0435 \u043F\u0430\u043D\u0435\u043B\u0438", vinyl: "\u0412\u0438\u043D\u0438\u043B" },
      vinyl: { npv: "\u0412\u0438\u043D\u0438\u043B \u0432 \u0431\u043E\u043A\u043E\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438:", playbar: "\u0412\u0438\u043D\u0438\u043B \u0432 \u043F\u043B\u0435\u0435\u0440\u0435:", cinema: "\u0412\u0438\u043D\u0438\u043B \u0432 \u043A\u0438\u043D\u043E\u0440\u0435\u0436\u0438\u043C\u0435:", speed: "\u0421\u0435\u043A\u0443\u043D\u0434 \u043D\u0430 \u043E\u0431\u043E\u0440\u043E\u0442:" },
      dropdown: { engineTiles: "\u041A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u0438\u0439" },
      ui: { leftSidebarBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0437\u0430 \u043B\u0435\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u044C\u044E:", leftSidebarBlurAmount: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u043B\u0435\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438 (px):", rightSidebarBlur: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0437\u0430 \u043F\u0440\u0430\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u044C\u044E:", rightSidebarBlurAmount: "\u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u043F\u0440\u0430\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438 (px):", localFilesTransparent: "\u041F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u0430\u044F \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0445 \u0444\u0430\u0439\u043B\u043E\u0432:" },
      tooltips: {
        language: "\xAB\u041A\u0430\u043A \u0432 Spotify\xBB \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u044F\u0437\u044B\u043A \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F; \xAB\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0439\xBB \u0437\u0430\u043A\u0440\u0435\u043F\u043B\u044F\u0435\u0442 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u0432\u0430\u043C\u0438 \u044F\u0437\u044B\u043A.",
        sidebarBlur: "\u0420\u0430\u0437\u043C\u044B\u0432\u0430\u0435\u0442 \u0444\u043E\u043D, \u043F\u0440\u043E\u0441\u0432\u0435\u0447\u0438\u0432\u0430\u044E\u0449\u0438\u0439 \u0441\u043A\u0432\u043E\u0437\u044C \u0431\u043E\u043A\u043E\u0432\u044B\u0435 \u043F\u0430\u043D\u0435\u043B\u0438.",
        vinyl: "\u041F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043E\u0431\u043B\u043E\u0436\u043A\u0443 \u0432\u043E \u0432\u0440\u0430\u0449\u0430\u044E\u0449\u0443\u044E\u0441\u044F \u043F\u043B\u0430\u0441\u0442\u0438\u043D\u043A\u0443. \u041D\u0430 \u043F\u0430\u0443\u0437\u0435 \u043E\u043D\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0441\u0432\u043E\u0439 \u0443\u0433\u043E\u043B.",
        localFilesTransparent: "\u0423\u0431\u0438\u0440\u0430\u0435\u0442 \u0441\u043F\u043B\u043E\u0448\u043D\u0443\u044E \u0437\u0430\u043B\u0438\u0432\u043A\u0443 \u0437\u0430 \u043F\u0443\u043D\u043A\u0442\u043E\u043C \xAB\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0444\u0430\u0439\u043B\u044B\xBB \u0432 \u043C\u0435\u0434\u0438\u0430\u0442\u0435\u043A\u0435.",
        hiResCover: "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442 \u0441\u0430\u043C\u0443\u044E \u0431\u043E\u043B\u044C\u0448\u0443\u044E \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0443\u044E \u043E\u0431\u043B\u043E\u0436\u043A\u0443, \u0447\u0442\u043E\u0431\u044B \u0444\u043E\u043D \u043E\u0441\u0442\u0430\u0432\u0430\u043B\u0441\u044F \u0447\u0451\u0442\u043A\u0438\u043C \u0432 \u0431\u043E\u043B\u044C\u0448\u043E\u043C \u043E\u043A\u043D\u0435. \u041E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u043B\u0438\u0441\u044C \u0431\u044B\u0441\u0442\u0440\u0435\u0435 \u0438 \u043D\u0435 \u0431\u044B\u043B\u043E \u0437\u0430\u0434\u0435\u0440\u0436\u043A\u0438 \u043F\u0440\u0438 \u0441\u043C\u0435\u043D\u0435 \u0442\u0440\u0435\u043A\u0430."
      }
    },
    es: {
      openLibrary: "Biblioteca de im\xE1genes",
      imageLibrary: "Biblioteca de im\xE1genes",
      addImages: "A\xF1adir im\xE1genes",
      libraryEmpty: "A\xFAn no hay im\xE1genes. A\xF1ade algunas para empezar.",
      removeImage: "Quitar",
      hiResCover: "Usar im\xE1genes en alta resoluci\xF3n:",
      language: "Idioma:",
      languageChoice: "Elegir idioma:",
      languageOptions: { auto: "Seguir a Spotify" },
      animatedEngine: "Motor:",
      kawarp: { warp: "Intensidad de distorsi\xF3n (%):", speed: "Velocidad de animaci\xF3n (%):", saturation: "Saturaci\xF3n (%):", scale: "Escala (%):", contrast: "Contraste (%):" },
      sections: { language: "Idioma" },
      subSections: { kawarp: "Fondo animado", sidebars: "Barras laterales", vinyl: "Vinilo" },
      vinyl: { npv: "Vinilo en la barra lateral:", playbar: "Vinilo en el reproductor:", cinema: "Vinilo en modo cine:", speed: "Segundos por vuelta:" },
      dropdown: { engineTiles: "Cl\xE1sico" },
      ui: { leftSidebarBlur: "Desenfoque tras la barra izquierda:", leftSidebarBlurAmount: "Desenfoque barra izquierda (px):", rightSidebarBlur: "Desenfoque tras la barra derecha:", rightSidebarBlurAmount: "Desenfoque barra derecha (px):", localFilesTransparent: "Tarjeta de archivos locales transparente:" },
      tooltips: {
        language: "\xABSeguir a Spotify\xBB usa el idioma de la aplicaci\xF3n; \xABPersonalizado\xBB fija el panel en el que elijas.",
        sidebarBlur: "Desenfoca el fondo que se ve a trav\xE9s de las barras laterales izquierda y derecha.",
        vinyl: "Convierte la portada en un disco giratorio. Mantiene su \xE1ngulo mientras la reproducci\xF3n est\xE1 en pausa.",
        localFilesTransparent: "Quita el relleno s\xF3lido detr\xE1s de la entrada Archivos locales en la biblioteca.",
        hiResCover: "Carga la portada m\xE1s grande disponible para que el fondo se mantenga n\xEDtido en una ventana grande. Desact\xEDvalo para que las im\xE1genes carguen m\xE1s r\xE1pido y evitar el retardo al cambiar de canci\xF3n."
      }
    },
    pt: {
      openLibrary: "Biblioteca de imagens",
      imageLibrary: "Biblioteca de imagens",
      addImages: "Adicionar imagens",
      libraryEmpty: "Ainda sem imagens. Adicione algumas para come\xE7ar.",
      removeImage: "Remover",
      hiResCover: "Usar imagens em alta resolu\xE7\xE3o:",
      language: "Idioma:",
      languageChoice: "Escolher idioma:",
      languageOptions: { auto: "Seguir o Spotify" },
      animatedEngine: "Motor:",
      kawarp: { warp: "Intensidade da distor\xE7\xE3o (%):", speed: "Velocidade da anima\xE7\xE3o (%):", saturation: "Satura\xE7\xE3o (%):", scale: "Escala (%):", contrast: "Contraste (%):" },
      sections: { language: "Idioma" },
      subSections: { kawarp: "Fundo animado", sidebars: "Barras laterais", vinyl: "Vinil" },
      vinyl: { npv: "Vinil na barra lateral:", playbar: "Vinil no player:", cinema: "Vinil no modo cinema:", speed: "Segundos por volta:" },
      dropdown: { engineTiles: "Cl\xE1ssico" },
      ui: { leftSidebarBlur: "Desfoque atr\xE1s da barra esquerda:", leftSidebarBlurAmount: "Desfoque da barra esquerda (px):", rightSidebarBlur: "Desfoque atr\xE1s da barra direita:", rightSidebarBlurAmount: "Desfoque da barra direita (px):", localFilesTransparent: "Cart\xE3o de arquivos locais transparente:" },
      tooltips: {
        language: "\xABSeguir o Spotify\xBB usa o idioma do aplicativo; \xABPersonalizado\xBB fixa o painel no que voc\xEA escolher.",
        sidebarBlur: "Desfoca o fundo que aparece atrav\xE9s das barras laterais esquerda e direita.",
        vinyl: "Transforma a capa em um disco girat\xF3rio. Ele mant\xE9m o \xE2ngulo enquanto a reprodu\xE7\xE3o est\xE1 pausada.",
        localFilesTransparent: "Remove o preenchimento s\xF3lido atr\xE1s do item Arquivos locais na biblioteca.",
        hiResCover: "Carrega a maior capa dispon\xEDvel para o fundo continuar n\xEDtido em uma janela grande. Desative para as imagens carregarem mais r\xE1pido e evitar o atraso ao trocar de m\xFAsica."
      }
    },
    tr: {
      openLibrary: "G\xF6rsel kitapl\u0131\u011F\u0131",
      imageLibrary: "G\xF6rsel kitapl\u0131\u011F\u0131",
      addImages: "G\xF6rsel ekle",
      libraryEmpty: "Hen\xFCz g\xF6rsel yok. Ba\u015Flamak i\xE7in birka\xE7 tane ekleyin.",
      removeImage: "Kald\u0131r",
      hiResCover: "Y\xFCksek \xE7\xF6z\xFCn\xFCrl\xFCkl\xFC g\xF6rseller:",
      language: "Dil:",
      languageChoice: "Dil se\xE7:",
      languageOptions: { auto: "Spotify'\u0131 takip et" },
      animatedEngine: "Motor:",
      kawarp: { warp: "B\xFCk\xFClme \u015Fiddeti (%):", speed: "Animasyon h\u0131z\u0131 (%):", saturation: "Doygunluk (%):", scale: "\xD6l\xE7ek (%):", contrast: "Kontrast (%):" },
      sections: { language: "Dil" },
      subSections: { kawarp: "Animasyonlu arka plan", sidebars: "Kenar \xE7ubuklar\u0131", vinyl: "Plak" },
      vinyl: { npv: "Kenar \xE7ubu\u011Funda plak:", playbar: "Oynat\u0131c\u0131da plak:", cinema: "Sinema modunda plak:", speed: "Tur ba\u015F\u0131na saniye:" },
      dropdown: { engineTiles: "Klasik" },
      ui: { leftSidebarBlur: "Sol kenar \xE7ubu\u011Funun arkas\u0131n\u0131 bulan\u0131kla\u015Ft\u0131r:", leftSidebarBlurAmount: "Sol kenar \xE7ubu\u011Fu bulan\u0131kl\u0131\u011F\u0131 (px):", rightSidebarBlur: "Sa\u011F kenar \xE7ubu\u011Funun arkas\u0131n\u0131 bulan\u0131kla\u015Ft\u0131r:", rightSidebarBlurAmount: "Sa\u011F kenar \xE7ubu\u011Fu bulan\u0131kl\u0131\u011F\u0131 (px):", localFilesTransparent: "\u015Eeffaf yerel dosyalar kart\u0131:" },
      tooltips: {
        language: "\xABSpotify'\u0131 takip et\xBB uygulaman\u0131n dilini kullan\u0131r; \xAB\xD6zel\xBB paneli se\xE7ti\u011Finiz dile sabitler.",
        sidebarBlur: "Sol ve sa\u011F kenar \xE7ubuklar\u0131ndan g\xF6r\xFCnen arka plan\u0131 bulan\u0131kla\u015Ft\u0131r\u0131r.",
        vinyl: "Kapa\u011F\u0131 d\xF6nen bir pla\u011Fa d\xF6n\xFC\u015Ft\xFCr\xFCr. Duraklat\u0131ld\u0131\u011F\u0131nda a\xE7\u0131s\u0131n\u0131 korur.",
        localFilesTransparent: "Kitapl\u0131ktaki \xABYerel Dosyalar\xBB girdisinin arkas\u0131ndaki dolgu rengini kald\u0131r\u0131r.",
        hiResCover: "Arka plan\u0131n b\xFCy\xFCk pencerede de net kalmas\u0131 i\xE7in mevcut en b\xFCy\xFCk kapa\u011F\u0131 y\xFCkler. G\xF6rsellerin daha h\u0131zl\u0131 y\xFCklenmesi ve \u015Fark\u0131 de\u011Fi\u015Fiminde gecikme olmamas\u0131 i\xE7in kapat\u0131n."
      }
    },
    hi: {
      openLibrary: "\u091B\u0935\u093F \u0932\u093E\u0907\u092C\u094D\u0930\u0947\u0930\u0940",
      imageLibrary: "\u091B\u0935\u093F \u0932\u093E\u0907\u092C\u094D\u0930\u0947\u0930\u0940",
      addImages: "\u091B\u0935\u093F\u092F\u093E\u0901 \u091C\u094B\u0921\u093C\u0947\u0902",
      libraryEmpty: "\u0905\u092D\u0940 \u0915\u094B\u0908 \u091B\u0935\u093F \u0928\u0939\u0940\u0902. \u0936\u0941\u0930\u0942 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0915\u0941\u091B \u091C\u094B\u0921\u093C\u0947\u0902.",
      removeImage: "\u0939\u091F\u093E\u090F\u0901",
      hiResCover: "\u0939\u093E\u0908-\u0930\u0947\u091C\u093C \u091B\u0935\u093F\u092F\u093E\u0901 \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0947\u0902:",
      language: "\u092D\u093E\u0937\u093E:",
      languageChoice: "\u092D\u093E\u0937\u093E \u091A\u0941\u0928\u0947\u0902:",
      languageOptions: { auto: "Spotify \u0915\u093E \u0905\u0928\u0941\u0938\u0930\u0923 \u0915\u0930\u0947\u0902" },
      animatedEngine: "\u0907\u0902\u091C\u0928:",
      kawarp: { warp: "\u0935\u093F\u0915\u0943\u0924\u093F \u0924\u0940\u0935\u094D\u0930\u0924\u093E (%):", speed: "\u090F\u0928\u093F\u092E\u0947\u0936\u0928 \u0917\u0924\u093F (%):", saturation: "\u0938\u0902\u0924\u0943\u092A\u094D\u0924\u093F (%):", scale: "\u0938\u094D\u0915\u0947\u0932 (%):", contrast: "\u0915\u0902\u091F\u094D\u0930\u093E\u0938\u094D\u091F (%):" },
      sections: { language: "\u092D\u093E\u0937\u093E" },
      subSections: { kawarp: "\u090F\u0928\u093F\u092E\u0947\u091F\u0947\u0921 \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921", sidebars: "\u0938\u093E\u0907\u0921\u092C\u093E\u0930", vinyl: "\u0935\u093F\u0928\u093E\u0907\u0932" },
      vinyl: { npv: "\u0938\u093E\u0907\u0921\u092C\u093E\u0930 \u092E\u0947\u0902 \u0935\u093F\u0928\u093E\u0907\u0932:", playbar: "\u092A\u094D\u0932\u0947\u092F\u0930 \u092E\u0947\u0902 \u0935\u093F\u0928\u093E\u0907\u0932:", cinema: "\u0938\u093F\u0928\u0947\u092E\u093E \u092E\u094B\u0921 \u092E\u0947\u0902 \u0935\u093F\u0928\u093E\u0907\u0932:", speed: "\u092A\u094D\u0930\u0924\u093F \u091A\u0915\u094D\u0915\u0930 \u0938\u0947\u0915\u0902\u0921:" },
      dropdown: { engineTiles: "\u0915\u094D\u0932\u093E\u0938\u093F\u0915" },
      ui: { leftSidebarBlur: "\u092C\u093E\u090F\u0901 \u0938\u093E\u0907\u0921\u092C\u093E\u0930 \u0915\u0947 \u092A\u0940\u091B\u0947 \u092C\u094D\u0932\u0930:", leftSidebarBlurAmount: "\u092C\u093E\u092F\u093E\u0901 \u0938\u093E\u0907\u0921\u092C\u093E\u0930 \u092C\u094D\u0932\u0930 (px):", rightSidebarBlur: "\u0926\u093E\u090F\u0901 \u0938\u093E\u0907\u0921\u092C\u093E\u0930 \u0915\u0947 \u092A\u0940\u091B\u0947 \u092C\u094D\u0932\u0930:", rightSidebarBlurAmount: "\u0926\u093E\u092F\u093E\u0901 \u0938\u093E\u0907\u0921\u092C\u093E\u0930 \u092C\u094D\u0932\u0930 (px):", localFilesTransparent: "\u0932\u094B\u0915\u0932 \u092B\u093C\u093E\u0907\u0932\u094D\u0938 \u0915\u093E\u0930\u094D\u0921 \u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940:" },
      tooltips: {
        language: "\xABSpotify \u0915\u093E \u0905\u0928\u0941\u0938\u0930\u0923 \u0915\u0930\u0947\u0902\xBB \u0910\u092A \u0915\u0940 \u092D\u093E\u0937\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0924\u093E \u0939\u0948; \xAB\u0915\u0938\u094D\u091F\u092E\xBB \u092A\u0948\u0928\u0932 \u0915\u094B \u091A\u0941\u0928\u0940 \u0939\u0941\u0908 \u092D\u093E\u0937\u093E \u092A\u0930 \u0938\u094D\u0925\u093F\u0930 \u0915\u0930\u0924\u093E \u0939\u0948.",
        sidebarBlur: "\u092C\u093E\u090F\u0901 \u0914\u0930 \u0926\u093E\u090F\u0901 \u0938\u093E\u0907\u0921\u092C\u093E\u0930 \u0938\u0947 \u0926\u093F\u0916\u0928\u0947 \u0935\u093E\u0932\u0947 \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u0915\u094B \u0927\u0941\u0902\u0927\u0932\u093E \u0915\u0930\u0924\u093E \u0939\u0948.",
        vinyl: "\u0915\u0935\u0930 \u0915\u094B \u0918\u0942\u092E\u0924\u0947 \u0930\u093F\u0915\u0949\u0930\u094D\u0921 \u092E\u0947\u0902 \u092C\u0926\u0932\u0924\u093E \u0939\u0948. \u0930\u0941\u0915\u0928\u0947 \u092A\u0930 \u092F\u0939 \u0905\u092A\u0928\u093E \u0915\u094B\u0923 \u092C\u0928\u093E\u090F \u0930\u0916\u0924\u093E \u0939\u0948.",
        localFilesTransparent: "\u0932\u093E\u0907\u092C\u094D\u0930\u0947\u0930\u0940 \u092E\u0947\u0902 \xAB\u0932\u094B\u0915\u0932 \u092B\u093C\u093E\u0907\u0932\u094D\u0938\xBB \u092A\u094D\u0930\u0935\u093F\u0937\u094D\u091F\u093F \u0915\u0947 \u092A\u0940\u091B\u0947 \u0915\u0940 \u0920\u094B\u0938 \u092D\u0930\u093E\u0908 \u0939\u091F\u093E\u0924\u093E \u0939\u0948.",
        hiResCover: "\u0938\u092C\u0938\u0947 \u092C\u0921\u093C\u093E \u0909\u092A\u0932\u092C\u094D\u0927 \u0915\u0935\u0930 \u0932\u094B\u0921 \u0915\u0930\u0924\u093E \u0939\u0948 \u0924\u093E\u0915\u093F \u092C\u0921\u093C\u0947 \u0935\u093F\u0902\u0921\u094B \u092E\u0947\u0902 \u092D\u0940 \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u0936\u093E\u0930\u094D\u092A \u0930\u0939\u0947. \u091B\u0935\u093F\u092F\u093E\u0901 \u0924\u0947\u091C\u093C\u0940 \u0938\u0947 \u0932\u094B\u0921 \u0915\u0930\u0928\u0947 \u0914\u0930 \u0917\u093E\u0928\u093E \u092C\u0926\u0932\u0924\u0947 \u0938\u092E\u092F \u0926\u0947\u0930\u0940 \u0938\u0947 \u092C\u091A\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0907\u0938\u0947 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902."
      }
    },
    sv: {
      openLibrary: "Bildbibliotek",
      imageLibrary: "Bildbibliotek",
      addImages: "L\xE4gg till bilder",
      libraryEmpty: "Inga bilder \xE4n. L\xE4gg till n\xE5gra f\xF6r att komma ig\xE5ng.",
      removeImage: "Ta bort",
      hiResCover: "Anv\xE4nd h\xF6guppl\xF6sta bilder:",
      language: "Spr\xE5k:",
      languageChoice: "V\xE4lj spr\xE5k:",
      languageOptions: { auto: "F\xF6lj Spotify" },
      animatedEngine: "Motor:",
      kawarp: { warp: "F\xF6rvr\xE4ngningsstyrka (%):", speed: "Animationshastighet (%):", saturation: "M\xE4ttnad (%):", scale: "Skala (%):", contrast: "Kontrast (%):" },
      sections: { language: "Spr\xE5k" },
      subSections: { kawarp: "Animerad bakgrund", sidebars: "Sidopaneler", vinyl: "Vinyl" },
      vinyl: { npv: "Vinyl i sidopanelen:", playbar: "Vinyl i spelaren:", cinema: "Vinyl i biol\xE4ge:", speed: "Sekunder per varv:" },
      dropdown: { engineTiles: "Klassisk" },
      ui: { leftSidebarBlur: "Osk\xE4rpa bakom v\xE4nster sidopanel:", leftSidebarBlurAmount: "Osk\xE4rpa v\xE4nster sidopanel (px):", rightSidebarBlur: "Osk\xE4rpa bakom h\xF6ger sidopanel:", rightSidebarBlurAmount: "Osk\xE4rpa h\xF6ger sidopanel (px):", localFilesTransparent: "Genomskinligt kort f\xF6r lokala filer:" },
      tooltips: {
        language: "\xBBF\xF6lj Spotify\xBB anv\xE4nder appens spr\xE5k; \xBBAnpassad\xBB l\xE5ser panelen till det du v\xE4ljer.",
        sidebarBlur: "G\xF6r bakgrunden som syns genom v\xE4nster och h\xF6ger sidopanel oskarp.",
        vinyl: "G\xF6r omslaget till en snurrande skiva. Den beh\xE5ller sin vinkel n\xE4r uppspelningen pausas.",
        localFilesTransparent: "Tar bort den helt\xE4ckande fyllningen bakom posten Lokala filer i biblioteket.",
        hiResCover: "Laddar det st\xF6rsta omslag som finns, s\xE5 att bakgrunden h\xE5ller sig skarp i ett stort f\xF6nster. St\xE4ng av f\xF6r att bilder ska laddas snabbare och f\xF6r att undvika f\xF6rdr\xF6jningen vid l\xE5tbyte."
      }
    },
    ja: {
      openLibrary: "\u753B\u50CF\u30E9\u30A4\u30D6\u30E9\u30EA",
      imageLibrary: "\u753B\u50CF\u30E9\u30A4\u30D6\u30E9\u30EA",
      addImages: "\u753B\u50CF\u3092\u8FFD\u52A0",
      libraryEmpty: "\u753B\u50CF\u304C\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002\u8FFD\u52A0\u3057\u3066\u59CB\u3081\u307E\u3057\u3087\u3046\u3002",
      removeImage: "\u524A\u9664",
      hiResCover: "\u9AD8\u89E3\u50CF\u5EA6\u306E\u753B\u50CF\u3092\u4F7F\u3046:",
      language: "\u8A00\u8A9E:",
      languageChoice: "\u8A00\u8A9E\u3092\u9078\u629E:",
      languageOptions: { auto: "Spotify\u306B\u5408\u308F\u305B\u308B" },
      animatedEngine: "\u30A8\u30F3\u30B8\u30F3:",
      kawarp: { warp: "\u3086\u304C\u307F\u306E\u5F37\u3055 (%):", speed: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u901F\u5EA6 (%):", saturation: "\u5F69\u5EA6 (%):", scale: "\u30B9\u30B1\u30FC\u30EB (%):", contrast: "\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8 (%):" },
      sections: { language: "\u8A00\u8A9E" },
      subSections: { kawarp: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u80CC\u666F", sidebars: "\u30B5\u30A4\u30C9\u30D0\u30FC", vinyl: "\u30EC\u30B3\u30FC\u30C9" },
      vinyl: { npv: "\u30B5\u30A4\u30C9\u30D0\u30FC\u306E\u30EC\u30B3\u30FC\u30C9:", playbar: "\u30D7\u30EC\u30FC\u30E4\u30FC\u306E\u30EC\u30B3\u30FC\u30C9:", cinema: "\u30B7\u30CD\u30DE\u30E2\u30FC\u30C9\u306E\u30EC\u30B3\u30FC\u30C9:", speed: "1\u56DE\u8EE2\u306E\u79D2\u6570:" },
      dropdown: { engineTiles: "\u30AF\u30E9\u30B7\u30C3\u30AF" },
      ui: { leftSidebarBlur: "\u5DE6\u30B5\u30A4\u30C9\u30D0\u30FC\u306E\u80CC\u666F\u3092\u307C\u304B\u3059:", leftSidebarBlurAmount: "\u5DE6\u30B5\u30A4\u30C9\u30D0\u30FC\u306E\u307C\u304B\u3057 (px):", rightSidebarBlur: "\u53F3\u30B5\u30A4\u30C9\u30D0\u30FC\u306E\u80CC\u666F\u3092\u307C\u304B\u3059:", rightSidebarBlurAmount: "\u53F3\u30B5\u30A4\u30C9\u30D0\u30FC\u306E\u307C\u304B\u3057 (px):", localFilesTransparent: "\u30ED\u30FC\u30AB\u30EB\u30D5\u30A1\u30A4\u30EB\u306E\u30AB\u30FC\u30C9\u3092\u900F\u660E\u306B:" },
      tooltips: {
        language: "\u300CSpotify\u306B\u5408\u308F\u305B\u308B\u300D\u306F\u30A2\u30D7\u30EA\u306E\u8A00\u8A9E\u3092\u4F7F\u3044\u307E\u3059\u3002\u300C\u30AB\u30B9\u30BF\u30E0\u300D\u306F\u9078\u3093\u3060\u8A00\u8A9E\u306B\u56FA\u5B9A\u3057\u307E\u3059\u3002",
        sidebarBlur: "\u5DE6\u53F3\u306E\u30B5\u30A4\u30C9\u30D0\u30FC\u8D8A\u3057\u306B\u898B\u3048\u308B\u80CC\u666F\u3092\u307C\u304B\u3057\u307E\u3059\u3002",
        vinyl: "\u30AB\u30D0\u30FC\u30A2\u30FC\u30C8\u3092\u56DE\u8EE2\u3059\u308B\u30EC\u30B3\u30FC\u30C9\u306B\u3057\u307E\u3059\u3002\u4E00\u6642\u505C\u6B62\u4E2D\u306F\u89D2\u5EA6\u3092\u4FDD\u3061\u307E\u3059\u3002",
        localFilesTransparent: "\u30E9\u30A4\u30D6\u30E9\u30EA\u306E\u300C\u30ED\u30FC\u30AB\u30EB\u30D5\u30A1\u30A4\u30EB\u300D\u9805\u76EE\u306E\u80CC\u666F\u306E\u5857\u308A\u3064\u3076\u3057\u3092\u6D88\u3057\u307E\u3059\u3002",
        hiResCover: "\u5229\u7528\u3067\u304D\u308B\u6700\u5927\u30B5\u30A4\u30BA\u306E\u30AB\u30D0\u30FC\u3092\u8AAD\u307F\u8FBC\u307F\u3001\u5927\u304D\u306A\u30A6\u30A3\u30F3\u30C9\u30A6\u3067\u3082\u80CC\u666F\u3092\u9BAE\u660E\u306B\u4FDD\u3061\u307E\u3059\u3002\u753B\u50CF\u306E\u8AAD\u307F\u8FBC\u307F\u3092\u901F\u304F\u3057\u3001\u66F2\u306E\u5207\u308A\u66FF\u3048\u6642\u306E\u9045\u308C\u3092\u306A\u304F\u3059\u306B\u306F\u30AA\u30D5\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
      }
    },
    zh: {
      openLibrary: "\u56FE\u7247\u5E93",
      imageLibrary: "\u56FE\u7247\u5E93",
      addImages: "\u6DFB\u52A0\u56FE\u7247",
      libraryEmpty: "\u8FD8\u6CA1\u6709\u56FE\u7247\u3002\u6DFB\u52A0\u4E00\u4E9B\u5373\u53EF\u5F00\u59CB\u3002",
      removeImage: "\u79FB\u9664",
      hiResCover: "\u4F7F\u7528\u9AD8\u5206\u8FA8\u7387\u56FE\u7247:",
      language: "\u8BED\u8A00:",
      languageChoice: "\u9009\u62E9\u8BED\u8A00:",
      languageOptions: { auto: "\u8DDF\u968F Spotify" },
      animatedEngine: "\u5F15\u64CE:",
      kawarp: { warp: "\u626D\u66F2\u5F3A\u5EA6 (%):", speed: "\u52A8\u753B\u901F\u5EA6 (%):", saturation: "\u9971\u548C\u5EA6 (%):", scale: "\u7F29\u653E (%):", contrast: "\u5BF9\u6BD4\u5EA6 (%):" },
      sections: { language: "\u8BED\u8A00" },
      subSections: { kawarp: "\u52A8\u753B\u80CC\u666F", sidebars: "\u4FA7\u8FB9\u680F", vinyl: "\u9ED1\u80F6" },
      vinyl: { npv: "\u4FA7\u8FB9\u680F\u9ED1\u80F6:", playbar: "\u64AD\u653E\u5668\u9ED1\u80F6:", cinema: "\u5F71\u9662\u6A21\u5F0F\u9ED1\u80F6:", speed: "\u6BCF\u5708\u79D2\u6570:" },
      dropdown: { engineTiles: "\u7ECF\u5178" },
      ui: { leftSidebarBlur: "\u6A21\u7CCA\u5DE6\u4FA7\u680F\u80CC\u666F:", leftSidebarBlurAmount: "\u5DE6\u4FA7\u680F\u6A21\u7CCA (px):", rightSidebarBlur: "\u6A21\u7CCA\u53F3\u4FA7\u680F\u80CC\u666F:", rightSidebarBlurAmount: "\u53F3\u4FA7\u680F\u6A21\u7CCA (px):", localFilesTransparent: "\u672C\u5730\u6587\u4EF6\u5361\u7247\u900F\u660E:" },
      tooltips: {
        language: "\u201C\u8DDF\u968F Spotify\u201D\u4F7F\u7528\u5E94\u7528\u7684\u8BED\u8A00\uFF1B\u201C\u81EA\u5B9A\u4E49\u201D\u5C06\u9762\u677F\u56FA\u5B9A\u4E3A\u4F60\u9009\u62E9\u7684\u8BED\u8A00\u3002",
        sidebarBlur: "\u6A21\u7CCA\u900F\u8FC7\u5DE6\u53F3\u4FA7\u8FB9\u680F\u663E\u793A\u7684\u80CC\u666F\u3002",
        vinyl: "\u628A\u5C01\u9762\u53D8\u6210\u65CB\u8F6C\u7684\u5531\u7247\u3002\u6682\u505C\u65F6\u4F1A\u4FDD\u6301\u5F53\u524D\u89D2\u5EA6\u3002",
        localFilesTransparent: "\u6E05\u9664\u8D44\u6599\u5E93\u4E2D\u201C\u672C\u5730\u6587\u4EF6\u201D\u6761\u76EE\u80CC\u540E\u7684\u7EAF\u8272\u586B\u5145\u3002",
        hiResCover: "\u52A0\u8F7D\u53EF\u7528\u7684\u6700\u5927\u5C01\u9762\uFF0C\u8BA9\u80CC\u666F\u5728\u5927\u7A97\u53E3\u4E0B\u4E5F\u4FDD\u6301\u6E05\u6670\u3002\u5173\u95ED\u53EF\u8BA9\u56FE\u7247\u52A0\u8F7D\u66F4\u5FEB\uFF0C\u907F\u514D\u5207\u6B4C\u65F6\u7684\u5EF6\u8FDF\u3002"
      }
    },
    ko: {
      openLibrary: "\uC774\uBBF8\uC9C0 \uB77C\uC774\uBE0C\uB7EC\uB9AC",
      imageLibrary: "\uC774\uBBF8\uC9C0 \uB77C\uC774\uBE0C\uB7EC\uB9AC",
      addImages: "\uC774\uBBF8\uC9C0 \uCD94\uAC00",
      libraryEmpty: "\uC544\uC9C1 \uC774\uBBF8\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uCD94\uAC00\uD574\uC11C \uC2DC\uC791\uD558\uC138\uC694.",
      removeImage: "\uC0AD\uC81C",
      hiResCover: "\uACE0\uD574\uC0C1\uB3C4 \uC774\uBBF8\uC9C0 \uC0AC\uC6A9:",
      language: "\uC5B8\uC5B4:",
      languageChoice: "\uC5B8\uC5B4 \uC120\uD0DD:",
      languageOptions: { auto: "Spotify \uB530\uB974\uAE30" },
      animatedEngine: "\uC5D4\uC9C4:",
      kawarp: { warp: "\uC65C\uACE1 \uAC15\uB3C4 (%):", speed: "\uC560\uB2C8\uBA54\uC774\uC158 \uC18D\uB3C4 (%):", saturation: "\uCC44\uB3C4 (%):", scale: "\uD06C\uAE30 (%):", contrast: "\uB300\uBE44 (%):" },
      sections: { language: "\uC5B8\uC5B4" },
      subSections: { kawarp: "\uC560\uB2C8\uBA54\uC774\uC158 \uBC30\uACBD", sidebars: "\uC0AC\uC774\uB4DC\uBC14", vinyl: "\uBC14\uC774\uB2D0" },
      vinyl: { npv: "\uC0AC\uC774\uB4DC\uBC14 \uBC14\uC774\uB2D0:", playbar: "\uD50C\uB808\uC774\uC5B4 \uBC14\uC774\uB2D0:", cinema: "\uC2DC\uB124\uB9C8 \uBAA8\uB4DC \uBC14\uC774\uB2D0:", speed: "\uD55C \uBC14\uD034\uB2F9 \uCD08:" },
      dropdown: { engineTiles: "\uD074\uB798\uC2DD" },
      ui: { leftSidebarBlur: "\uC67C\uCABD \uC0AC\uC774\uB4DC\uBC14 \uB4A4 \uD750\uB9AC\uAC8C:", leftSidebarBlurAmount: "\uC67C\uCABD \uC0AC\uC774\uB4DC\uBC14 \uD750\uB9BC (px):", rightSidebarBlur: "\uC624\uB978\uCABD \uC0AC\uC774\uB4DC\uBC14 \uB4A4 \uD750\uB9AC\uAC8C:", rightSidebarBlurAmount: "\uC624\uB978\uCABD \uC0AC\uC774\uB4DC\uBC14 \uD750\uB9BC (px):", localFilesTransparent: "\uB85C\uCEEC \uD30C\uC77C \uCE74\uB4DC \uD22C\uBA85:" },
      tooltips: {
        language: "\u300CSpotify \uB530\uB974\uAE30\u300D\uB294 \uC571\uC758 \uC5B8\uC5B4\uB97C \uC0AC\uC6A9\uD558\uACE0, \u300C\uC0AC\uC6A9\uC790 \uC9C0\uC815\u300D\uC740 \uC120\uD0DD\uD55C \uC5B8\uC5B4\uB85C \uD328\uB110\uC744 \uACE0\uC815\uD569\uB2C8\uB2E4.",
        sidebarBlur: "\uC67C\uCABD\uACFC \uC624\uB978\uCABD \uC0AC\uC774\uB4DC\uBC14 \uB108\uBA38\uB85C \uBE44\uCE58\uB294 \uBC30\uACBD\uC744 \uD750\uB9AC\uAC8C \uD569\uB2C8\uB2E4.",
        vinyl: "\uCEE4\uBC84 \uC544\uD2B8\uB97C \uD68C\uC804\uD558\uB294 \uB808\uCF54\uB4DC\uB85C \uBC14\uAFC9\uB2C8\uB2E4. \uC77C\uC2DC\uC815\uC9C0 \uC911\uC5D0\uB294 \uAC01\uB3C4\uB97C \uC720\uC9C0\uD569\uB2C8\uB2E4.",
        localFilesTransparent: "\uB77C\uC774\uBE0C\uB7EC\uB9AC\uC758 \u300C\uB85C\uCEEC \uD30C\uC77C\u300D \uD56D\uBAA9 \uB4A4\uC5D0 \uC788\uB294 \uB2E8\uC0C9 \uBC30\uACBD\uC744 \uC5C6\uC571\uB2C8\uB2E4.",
        hiResCover: "\uC0AC\uC6A9\uD560 \uC218 \uC788\uB294 \uAC00\uC7A5 \uD070 \uCEE4\uBC84\uB97C \uBD88\uB7EC\uC640 \uD070 \uCC3D\uC5D0\uC11C\uB3C4 \uBC30\uACBD\uC774 \uC120\uBA85\uD558\uAC8C \uC720\uC9C0\uB429\uB2C8\uB2E4. \uC774\uBBF8\uC9C0\uB97C \uB354 \uBE68\uB9AC \uBD88\uB7EC\uC624\uACE0 \uACE1 \uC804\uD658 \uC2DC \uC9C0\uC5F0\uC744 \uC5C6\uC560\uB824\uBA74 \uB044\uC138\uC694."
      }
    }
  };
  for (const code of Object.keys(LATE_STRINGS)) {
    liquifyTranslations[code] = deepMerge(liquifyTranslations[code] || settingsCopy, LATE_STRINGS[code]);
  }
  var LANGUAGE_KEY = "liquify-language";
  var LANGUAGE_NAMES = {
    en: "English",
    de: "Deutsch",
    ru: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
    es: "Espa\xF1ol",
    pt: "Portugu\xEAs",
    tr: "T\xFCrk\xE7e",
    hi: "\u0939\u093F\u0928\u094D\u0926\u0940",
    sv: "Svenska",
    ja: "\u65E5\u672C\u8A9E",
    zh: "\u4E2D\u6587",
    ko: "\uD55C\uAD6D\uC5B4"
  };
  function getAvailableLanguages() {
    return Object.keys(liquifyTranslations).map((code) => ({
      value: code,
      label: LANGUAGE_NAMES[code] || code
    }));
  }
  function getSpotifyLanguage() {
    const raw = (Spicetify?.Platform?.Session?.locale || Spicetify?.Platform?.Session?.language || navigator.language || "en").toString().toLowerCase();
    const base = raw.split(/[-_]/)[0];
    if (raw.startsWith("zh")) return "zh";
    if (raw.startsWith("pt")) return "pt";
    return base;
  }
  function getLanguageMode() {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (!saved || saved === "auto") return "auto";
    return liquifyTranslations[saved] ? saved : "auto";
  }
  function getClientLanguage() {
    const mode = getLanguageMode();
    return mode === "auto" ? getSpotifyLanguage() : mode;
  }
  function getEffectiveLanguage() {
    const lang = getClientLanguage();
    return liquifyTranslations[lang] ? lang : "en";
  }
  function setLanguage(mode) {
    localStorage.setItem(LANGUAGE_KEY, mode);
    window.dispatchEvent(new Event("liquifyLanguageChanged"));
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
        const tx2 = db.transaction(MP_STORE, "readwrite");
        const store = tx2.objectStore(MP_STORE);
        for (const [key, value] of entries) store.put({ key, value });
        tx2.oncomplete = () => resolve(true);
        tx2.onerror = () => resolve(false);
        tx2.onabort = () => resolve(false);
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
      await sleep(200);
      tries++;
    }
    if (!document.getElementById("liquify-settings-gear-btn")) return;
    await sleep(400);
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
  var NOT_ICON_ONLY = ':not([class*="button-icon-only--small"])';
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
    .encore-dark-theme .encore-inverted-light-set${NOT_ICON_ONLY} { --background-base: ${color} !important; }
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
    .encore-dark-theme .encore-inverted-light-set${NOT_ICON_ONLY} { --background-base: #FFFFFF !important; }
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
    const image = getLibraryUrl();
    const bgUrl = localStorage.getItem("liquify-bg-url");
    const root = document.querySelector(".Root__top-container");
    if (!root) return;
    if (mode === "custom" && image) root.style.setProperty("--image_url", `url("${image}")`);
    else if (mode === "url" && bgUrl) root.style.setProperty("--image_url", `url("${bgUrl}")`);
  }
  function updateBackground() {
    const mode = localStorage.getItem("liquify-bg-mode") || "dynamic";
    const image = getLibraryUrl();
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
      const STYLE_ID14 = "cs-cover-swipe";
      const TRACK_ID = "cs-track";
      const TRAVEL = 2;
      const DURATION = Math.round(300 * TRAVEL * 0.9);
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
      document.getElementById(STYLE_ID14)?.remove();
      anyWin.__coverSwipeOff?.();
      const style = document.createElement("style");
      style.id = STYLE_ID14;
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
        /* The rim belongs to each cover, not to the track. On the track it was a
           fixed frame around the artwork area \u2014 fine while the swipe was clipped
           to that area, but now that a cover leaves the panel it has to take its
           own edge with it. border-radius: inherit so it follows whatever shape
           the slot is, square or the vinyl option's circle. */
        #${TRACK_ID} .cs-slot::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: var(--liquify-shadow);
            pointer-events: none;
            z-index: 10;
        }
        /* A cover carries on past its own box and leaves the panel instead of
           vanishing at the edge of the artwork. The neighbours are parked well
           outside the sidebar (--cs-travel) and kept invisible until they are
           actually part of a swipe \u2014 without that they would sit in plain view
           either side of the cover, since nothing crops them here.

           Nothing is clipped here, so the covers are free to travel across the
           panel; the clipping happens at the sidebar instead (see below). */
        #${TRACK_ID} .cs-clip {
            position: absolute;
            inset: 0;
            overflow: visible;
            border-radius: 20px;
            --cs-travel: ${TRAVEL * 100}%;
        }
        /* Where the travelling covers actually stop.
           They have to leave their own box to be seen sliding, and anything that
           overflows a scroll container is added to its scrollable width \u2014 which
           is what made the whole sidebar draggable sideways. overflow-clip-margin
           on the cover did not help: the expanded clip region counts again.
           Clipping higher up does work, and clip rather than hidden is what
           keeps these from becoming scroll containers of their own \u2014 the
           vertical scrolling they do is untouched.

           Which element actually cuts the cover short is not something to guess
           at \u2014 Spotify nests several scrollers and wrappers between the artwork
           and the sidebar, and naming them meant fixing one and being cut by the
           next. unclipAncestors() walks the real chain at runtime and marks
           every level that clips; this is what those levels then do.

           clip with a margin rather than visible: these are scroll containers,
           and an overflow-x of visible computes back to auto when the other axis
           scrolls \u2014 which is what put the sidebar on a horizontal scrollbar in
           the first place. Clipping keeps them from scrolling, and the margin is
           what lets them keep painting outwards anyway. */
        .cs-unclip {
            overflow-x: clip !important;
            overflow-clip-margin: 100vw !important;
        }
        #${TRACK_ID} .cs-slot {
            position: absolute;
            inset: 0;
            border-radius: 20px;
            will-change: transform;
        }
        /* The picture sits one level in rather than on the slot itself. The slot
           owns transform for the swipe, and the vinyl option needs a transform
           of its own to spin the artwork \u2014 one element cannot carry both. With
           the vinyl off this face fills its slot exactly, so it changes nothing. */
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
            transition: transform ${DURATION}ms cubic-bezier(.4,0,.2,1);
        }
        /* Only the two slots taking part are revealed. Showing every slot would
           put the idle third one on screen too, stacked on the outgoing one.
           visibility isn't interpolated, so each appears at its parked position
           \u2014 which is off the panel \u2014 and slides in from there. */
        #${TRACK_ID}.cs-animating.cs-going-next .cs-current,
        #${TRACK_ID}.cs-animating.cs-going-next .cs-next,
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-current,
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-prev { visibility: visible; }
        #${TRACK_ID}.cs-animating.cs-going-next .cs-current { transform: translateX(calc(var(--cs-travel) * -1)); }
        #${TRACK_ID}.cs-animating.cs-going-next .cs-next    { transform: translateX(0); }
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-current { transform: translateX(var(--cs-travel)); }
        #${TRACK_ID}.cs-animating.cs-going-prev .cs-prev    { transform: translateX(0); }
        /* Lives inside the current slot's face (see crossfadeToNew), so it takes
           that face's shape and, with the vinyl option on, its rotation \u2014 the
           two pictures cross-fade on one turning disc instead of the overlay
           standing still as a square on top of it. Below the vinyl furniture's
           z-index 3, so the label and grooves stay on top of both. */
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
        const start2 = document.querySelector(CONTAINER_SEL);
        if (!start2) return "cover container not found";
        const rows = [];
        for (let el = start2; el && el !== document.documentElement; el = el.parentElement) {
          const cs = getComputedStyle(el);
          const clips = cs.overflowX !== "visible";
          const containing = cs.transform !== "none" || cs.filter !== "none" || cs.backdropFilter !== "none" || cs.contain !== "none";
          if (!clips && !containing) continue;
          const r = el.getBoundingClientRect();
          rows.push({
            el: el.className || el.tagName,
            overflowX: cs.overflowX,
            clipMargin: cs.overflowClipMargin || "",
            transform: cs.transform === "none" ? "" : "yes",
            filter: cs.filter === "none" ? "" : "yes",
            backdrop: cs.backdropFilter === "none" ? "" : "yes",
            left: Math.round(r.left),
            right: Math.round(r.right)
          });
        }
        return { coverBox: start2.getBoundingClientRect().toJSON(), clippers: rows };
      };
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
      let prevUrl = "", currentUrl2 = "", nextUrl = "";
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
        const face = slot.querySelector(".cs-face") || slot;
        face.style.backgroundImage = url ? `url("${url}")` : "";
      };
      const syncFromTruth = () => {
        if (!track) return;
        const realUri = getCurrentUri();
        const realUrl = getCurrentCoverUrl();
        if (realUri && realUri !== currentUri) {
          currentUri = realUri;
          currentUrl2 = realUrl;
          setSlot(currentSlot, currentUrl2);
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
      const UNCLIP_CLASS = "cs-unclip";
      let unclipped = [];
      const unclipAncestors = (from) => {
        clearUnclipped();
        const stop = document.querySelector(".Root__right-sidebar");
        for (let el = from; el && el !== stop; el = el.parentElement) {
          if (getComputedStyle(el).overflowX === "visible") continue;
          el.classList.add(UNCLIP_CLASS);
          unclipped.push(el);
        }
      };
      const clearUnclipped = () => {
        for (const el of unclipped) el.classList.remove(UNCLIP_CLASS);
        unclipped = [];
      };
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
        for (const slot of [prevSlot, currentSlot, nextSlot]) {
          slot.appendChild(Object.assign(document.createElement("div"), { className: "cs-face" }));
        }
        clip.append(prevSlot, currentSlot, nextSlot);
        track.appendChild(clip);
        container.appendChild(track);
        unclipAncestors(container);
        currentUrl2 = getCurrentCoverUrl();
        currentUri = getCurrentUri();
        prevUrl = getPrevCoverUrl();
        prevUri = getPrevUri();
        nextUrl = getNextCoverUrl();
        nextUri = getNextUri();
        setSlot(prevSlot, prevUrl);
        setSlot(currentSlot, currentUrl2);
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
        clearUnclipped();
      };
      const hideTrackForCanvas = () => {
        if (!track) return;
        if (animating) {
          setTimeout(() => {
            if (canvasVisible) hideTrackForCanvas();
          }, DURATION);
          return;
        }
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
          currentUrl2 = truthUrl;
          setSlot(currentSlot, currentUrl2);
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
            prevUrl = currentUrl2;
            prevUri = currentUri;
            currentUrl2 = nextUrl;
            currentUri = nextUri;
          } else {
            nextUrl = currentUrl2;
            nextUri = currentUri;
            currentUrl2 = prevUrl;
            currentUri = prevUri;
          }
          setSlot(prevSlot, prevUrl);
          setSlot(currentSlot, currentUrl2);
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
            prevUrl = currentUrl2;
            prevUri = currentUri;
            currentUrl2 = newUrl;
            currentUri = newUri;
          } else {
            nextUrl = currentUrl2;
            nextUri = currentUri;
            currentUrl2 = newUrl;
            currentUri = newUri;
          }
          setSlot(prevSlot, prevUrl);
          setSlot(currentSlot, currentUrl2);
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
        (currentSlot?.querySelector(".cs-face") || clip).appendChild(overlay);
        void overlay.offsetWidth;
        overlay.classList.add("cs-fade-in");
        setTimeout(() => {
          if (!track) {
            overlay.remove();
            animating = false;
            return;
          }
          prevUrl = currentUrl2;
          prevUri = currentUri;
          currentUrl2 = newUrl;
          currentUri = newUri;
          setSlot(currentSlot, currentUrl2);
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
        document.getElementById(STYLE_ID14)?.remove();
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
      while (!getPlayerElement()) await sleep(300);
      const player = getPlayerElement();
      if (player) {
        const ro = new ResizeObserver(repositionCard);
        ro.observe(player);
      }
    };
    observePlayer();
    const waitForPlayer = async () => {
      while (!Spicetify?.Player?.addEventListener) await sleep(300);
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
    mode: "outsideTrackInfo",
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
      while (!Spicetify?.Player?.addEventListener) await sleep(300);
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

  // src/settings/features/sidebarBlur.ts
  var STYLE_ID3 = "liquify-sidebar-blur-style";
  var SIDEBAR_BLUR_DEFAULT = 24;
  var SIDEBARS = {
    left: {
      key: "liquify-sidebar-blur-left",
      amountKey: "liquify-sidebar-blur-left-amount",
      selector: ".Root__nav-bar"
    },
    right: {
      key: "liquify-sidebar-blur-right",
      amountKey: "liquify-sidebar-blur-right-amount",
      selector: ".Root__right-sidebar"
    }
  };
  function isSidebarBlurOn(side) {
    return readLS(SIDEBARS[side].key, "off") === "on";
  }
  function readSidebarBlurAmount(side) {
    return readNum(SIDEBARS[side].amountKey, SIDEBAR_BLUR_DEFAULT);
  }
  function applyCss2() {
    const rules = [];
    for (const side of Object.keys(SIDEBARS)) {
      if (!isSidebarBlurOn(side)) continue;
      const px = readSidebarBlurAmount(side);
      rules.push(
        `${SIDEBARS[side].selector} {
  backdrop-filter: blur(${px}px) !important;
  -webkit-backdrop-filter: blur(${px}px) !important;
}`
      );
    }
    updateStyle(STYLE_ID3, rules.join("\n\n"));
  }
  function setSidebarBlur(side, mode) {
    localStorage.setItem(SIDEBARS[side].key, mode === "on" ? "on" : "off");
    applyCss2();
  }
  function setSidebarBlurAmount(side, px) {
    localStorage.setItem(SIDEBARS[side].amountKey, String(px));
    applyCss2();
  }
  function resetSidebarBlur() {
    for (const side of Object.keys(SIDEBARS)) {
      localStorage.setItem(SIDEBARS[side].key, "off");
      localStorage.setItem(SIDEBARS[side].amountKey, String(SIDEBAR_BLUR_DEFAULT));
    }
    applyCss2();
  }
  function ensureSidebarBlurApplied() {
    applyCss2();
  }

  // src/settings/features/fonts.ts
  var FONT_BODY_KEY = "liquify-font-body";
  var FONT_HEADING_KEY = "liquify-font-heading";
  var FONT_DEFAULT = "default";
  var STYLE_ID4 = "liquify-fonts-style";
  var FAMILY_LINK_ID = "liquify-font-families";
  var PREVIEW_LINK_ID = "liquify-font-previews";
  var FONT_CATEGORIES = [
    "sans-serif",
    "serif",
    "display",
    "handwriting",
    "monospace"
  ];
  var CATALOGUE = {
    "sans-serif": "Roboto,Open Sans,Google Sans,Inter,Montserrat,Poppins,Lato,Noto Sans JP,Arimo,Roboto Condensed,Oswald,Noto Sans,DM Sans,Raleway,Nunito,Nunito Sans,Rubik,Archivo Black,Manrope,Outfit,Ubuntu,Kanit,Noto Sans KR,Work Sans,PT Sans,Bebas Neue,Noto Sans TC,Prompt,Plus Jakarta Sans,Figtree,Bricolage Grotesque,Saira,Mulish,Barlow,Jost,Quicksand,Source Sans 3,Share Tech,Smooch Sans,Karla,IBM Plex Sans,Archivo,Space Grotesk,Fira Sans,Titillium Web,Heebo,Fjalla One,Noto Color Emoji,Google Sans Flex,Noto Sans SC,Libre Franklin,Barlow Condensed,Anton,Josefin Sans,Public Sans,Cairo,Lexend,Mukta,Sora,Assistant,Hind Siliguri,Inter Tight,Schibsted Grotesk,Cabin,Roboto Flex,Nanum Gothic,Noto Sans Khmer,Urbanist,Dosis,Rajdhani,Noto Sans Telugu,Orbitron,Exo 2,Ramabhadra,Red Hat Display,M PLUS Rounded 1c,Fredoka,Anek Telugu,Geist,Hind,Oxygen,Tajawal,M PLUS 1p,Instrument Sans,PT Sans Narrow,Overpass,Barlow Semi Condensed,Merriweather Sans,Teko,Noto Sans Arabic,Abel,Noto Sans Thai,Asap,Hanken Grotesk,Maven Pro,Chakra Petch,League Spartan,Rethink Sans,Alumni Sans,Onest,Play,Zen Kaku Gothic New,Questrial,ABeeZee,Lexend Deca,Archivo Narrow,Almarai,Exo,Be Vietnam Pro,Albert Sans,Syne,Sofia Sans,Saira Condensed,Noto Sans Tamil,IBM Plex Sans Arabic,Epilogue,Varela Round,Unbounded,Red Hat Text,Geologica,Zen Maru Gothic,Viga,Russo One,Yanone Kaffeesatz,Sarabun,Noto Kufi Arabic,Fira Sans Condensed,Signika,LINE Seed JP,News Cycle,Alegreya Sans,Catamaran,Atkinson Hyperlegible,Noto Sans Display,Hammersmith One,Montserrat Alternates,Chivo,IBM Plex Sans Condensed,Acme,Khand,Encode Sans,Alata,Kumbh Sans,Changa,Noto Sans Devanagari,Readex Pro,Tenor Sans,Gothic A1,Cantarell,Advent Pro,Hind Madurai,Sawarabi Gothic,Asap Condensed,Golos Text,Lexend Giga,PT Sans Caption,M PLUS 1,Biryani,Sen,Sofia Sans Condensed,Noto Sans Mono,Antonio,M PLUS U,Rubik Mono One,Vazirmatn,League Gothic,Philosopher,Alexandria,Signika Negative,Quantico,Francois One,Gruppo,Noto Sans Bengali,Yantramanav,Actor,BIZ UDPGothic,Commissioner,Monda,Encode Sans Condensed,Jura,Ropa Sans,Kosugi Maru,Ubuntu Condensed,Didact Gothic,Istok Web,Bai Jamjuree,Paytone One,Krub,Amaranth,Radio Canada,Quattrocento Sans,Lalezar,Noto Sans Hebrew,El Messiri,Pathway Gothic One,Saira Extra Condensed,Black Han Sans,Noto Sans HK,Secular One,Ubuntu Sans,Mitr,Noto Sans Malayalam,Arsenal,Michroma,Hind Guntur,Radio Canada Big,Belleza,Anek Bangla,Six Caps,Blinker,IBM Plex Sans Thai,Georama,Jua,Hind Vadodara,Fira Sans Extra Condensed,Cuprum,Afacad,Dongle,Syncopate,Host Grotesk,Palanquin,Sofia Sans Extra Condensed,Mona Sans,Noto Sans Symbols,Saira Semi Condensed,Mandali,Pragati Narrow,Varela,Gudea,Funnel Sans,Zen Kaku Gothic Antique,Mukta Malar,Mada,Economica,Belanosima,Electrolize,Alegreya Sans SC,Parkinsans,Reddit Sans,Khula,M PLUS 2,Wix Madefor Display,Julius Sans One,REM,Noto Sans Gujarati,Akshar,Murecho,Familjen Grotesk,Cabin Condensed,Italiana,Gantari,Andika,IBM Plex Sans JP,Tomorrow,Special Gothic Expanded One,Niramit,Reem Kufi,Fahkwang,Aldrich,Basic,Martel Sans,Do Hyeon,Noto Sans Sinhala,BenchNine,Ruda,Sansita,Geo,Spline Sans,Palanquin Dark,K2D,Fustat,Anuphan,Proza Libre,Spinnaker,Noto Sans Meetei Mayek,Anek Latin,Carlito,Atkinson Hyperlegible Next,Wix Madefor Text,Sofia Sans Semi Condensed,Sintony,Days One,Glory,Aclonica,ZCOOL XiaoWei,Noto Sans Kannada,Pontano Sans,Darker Grotesque,Livvic,Noto Sans Gurmukhi,BIZ UDGothic,Krona One,Lexend Exa,Armata,Athiti,Mochiy Pop One,Candal,DotGothic16,Sarala,ZCOOL KuaiLe,TikTok Sans,IBM Plex Sans KR,Metrophobic,Pathway Extreme,Noto Sans Oriya,Noto Sans Georgian,Rosario,AR One Sans,Afacad Flux,Alef,Nobile,Cal Sans,Kosugi,Yusei Magic,Share,Noto Sans Myanmar,Lexend Zetta,Pattaya,Allerta Stencil,Anek Devanagari,Telex,Reddit Sans Condensed,Marmelad,RocknRoll One,Average Sans,Alatsi,Marvel,Chiron GoRound TC,Encode Sans Expanded,Monomaniac One,Allerta,Inria Sans,Bayon,Magra,IBM Plex Sans Hebrew,Zalando Sans,Noto Sans Ol Chiki,Akatab,Lexend Peta,ZCOOL QingKe HuangYou,Amiko,Recursive,Noto Emoji,Anton SC,Mouse Memoirs,Cairo Play,Gowun Dodum,Kantumruy Pro,Scada,Gurajada,Mukta Mahee,Manjari,Rambla,Puritan,Zalando Sans Expanded,Jockey One,Carrois Gothic,Zen Kurenaido,Gotu,Encode Sans Semi Condensed,Kodchasan,Zain,Voltaire,Padauk,KoHo,Noto Sans Thai Looped,Zalando Sans SemiExpanded,Teachers,Cambay,Noto Sans Warang Citi,Noto Sans Symbols 2,Capriola,Miriam Libre,Voces,Stick No Bills,SUSE,Sulphur Point,Inclusive Sans,Jaldi,Kdam Thmor Pro,Tenali Ramakrishna,Special Gothic Condensed One,Kufam,B612,Nata Sans,Anaheim,Mukta Vaani,Noto Sans Bhaiksuki,Arya,Numans,Ysabeau Office,Genos,Federo,Doppio One,Sunflower,Sarpanch,Special Gothic,Farro,Mako,Molengo,Fresca,Shippori Antique,Inder,Mallanna,Noto Sans Armenian,Convergence,Port Lligat Sans,Shanti,Anta,Thasadith,Madimi One,Harmattan,Noto Sans Lao,Science Gothic,Imprima,Encode Sans Semi Expanded,Antic,Sansation,Gasoek One,Wendy One,Ysabeau SC,Noto Sans Ethiopic,Doto,Alan Sans,Wire One,Mochiy Pop P One,Asta Sans,Homenaje,Comme,Noto Sans Math,Sour Gummy,Gayathri,Denk One,Mina,Anek Malayalam,Elms Sans,Mozilla Headline,Mohave,NTR,Truculenta,Kulim Park,Duru Sans,Chau Philomene One,Nokora,Moderustic,Anek Tamil,Mooli,Gafata,Orienta,Jaro,Stick,Ysabeau,Faculty Glyphic,IBM Plex Sans Thai Looped,Gemunu Libre,Khmer,Carme,Varta,TASA Orbiter,Timmana,Momo Trust Sans,Trispace,Agdasima,Mozilla Text,Anek Gujarati,Rationale,Stack Sans Headline,Strait,Story Script,Cantora One,Pavanam,Geom,Hubot Sans,Dorsa,Carrois Gothic SC,Stack Sans Text,New Amsterdam,Tauri,Noto Sans Mende Kikakui,Tac One,Liter,Huninn,IBM Plex Sans Devanagari,Chocolate Classical Sans,Stylish,Noto Sans Buhid,Qahiri,Libertinus Sans,Shippori Antique B1,Noto Music,Notable,Englebert,Tiny5,Sono,Braah One,Rum Raisin,Anek Kannada,Cagliostro,Preahvihear,Hedvig Letters Sans,Noto Sans Canadian Aboriginal,Noto Sans Tagalog,Noto Sans Samaritan,Text Me One,Montserrat Underline,Lexend Mega,Yaldevi,Seymour One,SN Pro,Asap Sharp,WDXL Lubrifont JP N,Noto Sans Thaana,Scoutie Sans,Atkinson Hyperlegible Mono,National Park,Winky Sans,Encode Sans SC,Siemreap,Beiruti,Momo Trust Display,Anek Odia,Valley Sans,Akt,BBH Bartle,Vend Sans,Alumni Sans Pinstripe,Noto Sans Linear A,Noto Sans Coptic,Ysabeau Infant,Kite One,Reem Kufi Fun,Ruluko,Arsenal SC,Noto Sans Gothic,Nuosu SIL,Noto Sans Osmanya,Chiron Hei HK,Galdeano,Noto Sans Javanese,Meera Inimai,Dhurjati,Cascadia Code,Noto Sans Tai Viet,Noto Sans Glagolitic,Noto Sans Nag Mundari,Bpmf Huninn,Bubbler One,Anek Gurmukhi,Lexend Tera,Orbit,Hubballi,Alumni Sans SC,Noto Sans Sora Sompeng,Noto Sans Tamil Supplement,Noto Sans Adlam,Noto Sans Lao Looped,Momo Signature,Reem Kufi Ink,Gidugu,SUSE Mono,GFS Neohellenic,Pliant,Noto Sans Anatolian Hieroglyphs,Stack Sans Notch,Lunasima,WDXL Lubrifont SC,Epunda Sans,Ancizar Sans,Gidole,Chathura,Alumni Sans Collegiate One,TASA Explorer,Cossette Texte,Noto Sans Deseret,Noto Sans Tangsa,Noto Sans Batak,Snippet,Tsukimi Rounded,Noto Sans Caucasian Albanian,Noto Sans Cypro Minoan,Matemasie,Noto Sans Cherokee,Kedebideri,Moulpali,Cossette Titre,Cascadia Mono,Noto Sans Pahawh Hmong,Noto Sans NKo,Ojuju,Narnoor,Amarna,Finlandica Text,Noto Traditional Nushu,Noto Sans Vai,Noto Sans Syloti Nagri,Noto Sans Vithkuqi,Noto Sans Shavian,Asimovian,Noto Sans Kaithi,Noto Sans Mongolian,Menbere,Estedad,LXGW Marker Gothic,Noto Sans Carian,WDXL Lubrifont TC,Noto Sans Siddham,BBH Bogle,Noto Sans Old Italic,Noto Sans Multani,BBH Hegarty,M PLUS Code Latin,Noto Sans Syriac,Noto Sans Yi,Noto Sans Hanunoo,Noto Sans Marchen,Phetsarath,Geomini,Noto Sans Sunuwar,Savate,Noto Sans Balinese,Noto Sans Runic,Noto Sans Takri,Noto Sans Old Permic,Noto Sans Egyptian Hieroglyphs,Noto Sans Nandinagari,Noto Sans Duployan,Karla Tamil Upright,Noto Sans Bamum,Noto Sans Old Persian,Winky Rough,Noto Sans Tifinagh,Tirra,Noto Sans Old Hungarian,Noto Sans Grantha,Noto Sans Lisu,Mingzat,Hind Mysuru,Noto Sans Osage,Karla Tamil Inclined,Noto Sans Syriac Eastern,Sirivennela,Bytesized,Noto Sans Mandaic,Noto Sans Avestan,Noto Sans Old Turkic,Matangi,Noto Sans Tai Le,Miranda Sans,Noto Sans Mahajani,Noto Sans Medefaidrin,Noto Sans Adlam Unjoined,Noto Sans Newa,Noto Sans Indic Siyaq Numbers,Noto Sans Miao,Noto Sans Lydian,Noto Sans Elbasan,Noto Sans Nabataean,Noto Sans Old North Arabian,Noto Sans Pau Cin Hau,Noto Sans Meroitic,Sankofa Display,Noto Sans Khojki,Bpmf Zihi Kai Std,Noto Sans Cuneiform,Tuffy,Noto Sans Sundanese,Noto Sans Imperial Aramaic,Noto Sans Inscriptional Parthian,Noto Sans Cham,Noto Znamenny Musical Notation,Noto Sans Wancho,Noto Sans Inscriptional Pahlavi,Noto Sans Palmyrene,Noto Sans NKo Unjoined,Noto Sans Hanifi Rohingya,Noto Sans Zanabazar Square,Noto Sans Brahmi,Finlandica Headline,Noto Sans Old South Arabian,Noto Sans Buginese,Noto Sans Chakma,Noto Sans Rejang,Noto Sans Sharada,Noto Sans Mayan Numerals,Noto Sans Limbu,Noto Sans Kawi,Noto Sans Elymaic,Noto Sans Sogdian,Noto Sans Linear B,Noto Sans New Tai Lue,Noto Sans Bassa Vah,Strichpunkt Sans,Noto Sans Tai Tham,Noto Sans Tagbanwa,Noto Sans Cypriot,Noto Sans Hatran,Noto Sans Phoenician,Noto Sans Tirhuta,Noto Sans Saurashtra,Noto Sans Ugaritic,Noto Sans SignWriting,Kanchenjunga,Noto Sans Masaram Gondi,Noto Sans Khudawadi,Noto Sans Syriac Western,Noto Sans Mro,Noto Sans Ogham,Noto Sans Psalter Pahlavi,Noto Sans Chorasmian,Noto Sans PhagsPa,Noto Sans Nushu,Noto Sans Gunjala Gondi,Noto Sans Old Sogdian,Noto Sans Soyombo,Noto Sans Kayah Li,Noto Sans Lepcha,Noto Sans Manichaean,Noto Sans Kharoshthi,Noto Sans Modi,Noto Sans Lycian",
    "serif": "Playfair Display,Roboto Slab,Merriweather,Lora,Noto Serif,Cormorant Garamond,PT Serif,Libre Baskerville,Noto Serif JP,Instrument Serif,EB Garamond,Fraunces,Bitter,DM Serif Display,Crimson Text,Cinzel,Source Serif 4,Slabo 27px,Arvo,Newsreader,Bodoni Moda,Domine,Zilla Slab,Crimson Pro,Marcellus,Spectral,IBM Plex Serif,Cormorant,Frank Ruhl Libre,Noto Serif TC,Noto Serif SC,Nanum Myeongjo,Vollkorn,Noto Serif KR,Amiri,Roboto Serif,Libre Caslon Text,Literata,Cardo,Antic Slab,DM Serif Text,Prata,Aleo,Shippori Mincho,Bree Serif,Playfair,Baskervville,Tinos,Alegreya,Sawarabi Mincho,Noto Naskh Arabic,Noto Nastaliq Urdu,Sanchez,Old Standard TT,Crete Round,Noticia Text,Martel,Zen Old Mincho,Josefin Slab,STIX Two Text,Gilda Display,Neuton,Quattrocento,Faustina,Rokkitt,Unna,Andada Pro,Playfair Display SC,Abhaya Libre,Libre Bodoni,Suez One,GFS Didot,Lustria,Gelasio,Petrona,Lusitana,Cormorant Infant,Sorts Mill Goudy,Vidaloka,Volkhov,Besley,Noto Serif Display,Noto Serif Bengali,Arapey,Eczar,Alice,Shippori Mincho B1,Ultra,Bevan,Kaisei Decol,Taviraj,Pridi,Adamina,Mate,IM Fell English,Ovo,Charis SIL,Rufina,Kreon,Yrsa,Yuji Mai,Marcellus SC,Inria Serif,Bentham,Kiwi Maru,Radley,Libre Caslon Display,Gloock,Gowun Batang,Rozha One,Caudex,Noto Serif Khojki,Bona Nova SC,Laila,Castoro,Kameron,Tiro Bangla,Podkova,Glegoo,Cormorant Upright,Ibarra Real Nova,Judson,Lateef,Trirong,Gabriela,Bellefair,Cantata One,PT Serif Caption,Karma,Oranienbaum,Antic Didone,IM Fell English SC,Noto Serif Devanagari,BIZ UDPMincho,Noto Serif Georgian,Graduate,Tiro Devanagari Hindi,Brygada 1918,Montagu Slab,Cormorant SC,Arbutus Slab,Hina Mincho,Coustard,Alegreya SC,Halant,Hepta Slab,Enriqueta,Markazi Text,Fjord One,Goudy Bookletter 1911,Caladea,Hahmlet,Trocchi,Fanwood Text,Zen Antique,BioRhyme,STIX Two Math,Abyssinica SIL,Young Serif,Copse,Almendra,Cormorant Unicase,Hanuman,Average,Aref Ruqaa,Maitree,IM Fell DW Pica,Kadwa,Spectral SC,Noto Serif Thai,Hedvig Letters Serif,Kaisei Opti,Yuji Syuku,Fauna One,Kurale,Vesper Libre,David Libre,Scheherazade New,Platypi,Inknut Antiqua,Asul,Asar,Vollkorn SC,Kalnia,Alike,Rasa,Quando,Rosarivo,Libertinus Serif,Poly,Brawler,Piazzolla,Cutive,Slabo 13px,Vast Shadow,Della Respira,Prociono,Suranna,Buenard,BhuTuka Expanded One,Mirza,IM Fell Double Pica,Balthazar,Artifika,Tienne,IM Fell French Canon,Bona Nova,Song Myung,IM Fell Great Primer,Cambo,Zen Antique Soft,Solway,Alike Angular,Holtwood One SC,Aoboshi One,Esteban,Noto Serif Tamil,Noto Serif Kannada,Ledger,Grenze,IM Fell DW Pica SC,Kaisei Tokumin,Imbue,Amethysta,Maiden Orange,Montaga,Noto Serif Malayalam,IM Fell Double Pica SC,Gentium Book Plus,Jacques Francois,Sumana,Scope One,Tiro Devanagari Sanskrit,Noto Serif HK,Poltawski Nowy,Gupter,Headland One,IM Fell Great Primer SC,Zilla Slab Highlight,BIZ UDMincho,Manuale,Belgrano,IM Fell French Canon SC,Peralta,Habibi,Bodoni Moda SC,Fenix,Amiri Quran,Baskervville SC,Kotta One,Suwannaphum,Stint Ultra Condensed,Sree Krushnadevaraya,Mate SC,Alkalami,Arbutus,Cactus Classical Serif,Jomolhari,Port Lligat Slab,Sura,Tiro Tamil,Gentium Plus,Noto Serif Gujarati,Inika,Wittgenstein,New Tegomin,Junge,Noto Serif Telugu,Stoke,Kaisei HarunoUmi,Donegal One,Gulzar,Joan,Yuji Boku,Tiro Gurmukhi,Dai Banna SIL,Ancizar Serif,Stint Ultra Expanded,Odor Mean Chey,Linden Hill,Tiro Devanagari Marathi,Texturina,Ramaraja,Noto Serif Ahom,Koh Santepheap,Noto Serif Hebrew,Noto Serif Tibetan,Marko One,Noto Serif Lao,Peddana,Uchen,Sedan,Noto Serif Ethiopic,Benne,Almendra SC,Wellfleet,Noto Serif Armenian,Noto Serif Sinhala,Sahitya,Trykker,Noto Serif Khmer,Diphylleia,Bacasime Antique,Aref Ruqaa Ink,Tiro Kannada,Sedan SC,Noto Rashi Hebrew,Rhodium Libre,Alyamama,Noto Serif Dives Akuru,Tiro Telugu,BioRhyme Expanded,Labrada,UoqMunThenKhung,Ruwudu,Noto Serif Myanmar,Noto Serif Tangut,Parastoo,Noto Serif Vithkuqi,Chiron Sung HK,Tai Heritage Pro,Annapurna SIL,Suravaram,Noto Serif Balinese,Danfo,Noto Serif Dogra,Noto Serif Yezidi,Noto Serif Toto,Grandiflora One,Noto Serif Gurmukhi,Epunda Slab,Lisu Bosa,Noto Serif Oriya,Noto Serif Todhri,Namdhinggo,Noto Serif Khitan Small Script,Noto Serif Makasar,Noto Serif Ottoman Siyaq,Montenegrin Gothic One,Noto Serif NP Hmong,Kay Pho Du,Maname,Padyakke Expanded One,Noto Serif Grantha,BJCree,Noto Serif Hentaigana,Noto Serif Old Uyghur,Idiqlat,Ramsina",
    "display": "Black Ops One,Lobster Two,Changa One,Alfa Slab One,Lilita One,Bungee,Gravitas One,Lobster,Comfortaa,Abril Fatface,Righteous,Baloo 2,Press Start 2P,Luckiest Guy,Libre Barcode 39,Rowdies,Special Elite,Bangers,Patua One,Oleo Script,Oxanium,Chelsea Market,Angkor,Titan One,Passion One,Creepster,Audiowide,Fugaz One,Dela Gothic One,Forum,Cinzel Decorative,Unica One,Concert One,Yeseva One,Chango,Monoton,Playball,Eater,Gabarito,Rammetto One,Poiret One,Staatliches,Goldman,Comic Relief,Calistoga,Caprasimo,Racing Sans One,Shrikhand,Squada One,Carter One,Londrina Solid,Averia Serif Libre,Chewy,Bowlby One SC,Vina Sans,Pirata One,Lemonada,Potta One,Coda,Skranji,Aboreto,Grandstander,Tilt Warp,Germania One,MuseoModerno,Limelight,UnifrakturMaguntia,Jersey 25,Rye,Boogaloo,Funnel Display,Stardos Stencil,Big Shoulders,Baloo Da 2,Balsamiq Sans,Libre Barcode 128,Nixie One,Yatra One,Grenze Gotisch,Fredericka the Great,Cabin Sketch,Bowlby One,Pixelify Sans,Barriecito,Elsie,Averia Libre,Corben,Protest Revolution,Tektur,Seaweed Script,Nova Square,ADLaM Display,MedievalSharp,Rampart One,Wallpoet,Irish Grover,Knewave,Silkscreen,Chonburi,Koulen,Flow Circular,Rakkas,Honk,DynaPuff,Poller One,Faster One,Croissant One,Overlock,Sniglet,Bubblegum Sans,Sigmar One,Sansita Swashed,Baloo Thambi 2,Turret Road,Oleo Script Swash Caps,Anybody,Poetsen One,Love Ya Like A Sister,Mountains of Christmas,Kelly Slab,Ruslan Display,Bellota Text,Agbalumo,Bungee Inline,Baloo Bhaijaan 2,Rubik Doodle Shadow,Frijole,Happy Monkey,Metamorphous,Jomhuria,Battambang,Red Rose,Slackey,Bungee Spice,Libre Barcode 39 Text,Zen Dots,Fasthand,Modern Antiqua,Tilt Neon,Boldonse,Baloo Bhai 2,Shantell Sans,Lacquer,Original Surfer,Bungee Shade,Contrail One,Baloo Tamma 2,Supermercado One,Averia Sans Libre,Metal Mania,Vampiro One,Sarina,Nosifer,Prosto One,Macondo,Fontdiner Swanky,Freehand,Amarante,Rubik Dirt,Baloo Chettan 2,Megrim,Coiny,Arima,Freeman,Road Rage,Trade Winds,Allan,Kranky,Codystar,Bagel Fat One,Finger Paint,Modak,Bigshot One,Jersey 10,Expletus Sans,Uncial Antiqua,Poor Story,Baumans,Iceberg,Cherry Bomb One,Lily Script One,Oregano,Bakbak One,Pompiere,Cherry Cream Soda,Atma,Aladin,Unkempt,Libertinus Math,New Rocker,Protest Strike,Bokor,Odibee Sans,Darumadrop One,McLaren,Dynalight,Sail,Rubik Spray Paint,Life Savers,Moul,Rubik Glitch,Baloo Paaji 2,Bellota,Orelega One,Salsa,Gluten,UnifrakturCook,Goblin One,Sevillana,Medula One,Sekuya,Crushed,Freckle Face,Climate Crisis,Galindo,Reggae One,Nova Flat,Shojumaru,Nova Round,Karantina,Viaoda Libre,Smythe,Galada,Train One,Dokdo,Sancreek,Henny Penny,Libre Barcode 39 Extended Text,Kablammo,Lemon,Nova Cut,Ceviche One,Alkatra,Rubik Bubbles,Asset,Spicy Rice,Bruno Ace,Cherry Swash,Nova Oval,Akronim,Londrina Outline,Baloo Bhaina 2,Iceland,Protest Riot,Ribeye,Raleway Dots,Jolly Lodger,Caesar Dressing,Atomic Age,Baloo Tammudu 2,Kavoon,Bitcount Single,Kenia,Miltonian,Gugi,Ranchers,Overlock SC,Chicle,Nova Slim,Macondo Swash Caps,Katibeh,Miniver,Phudu,Badeen Display,Miltonian Tattoo,Akaya Kanadaka,Emilys Candy,Marhey,Gorditas,Astloch,Libre Barcode 128 Text,Spirax,Nova Script,Girassol,Yeon Sung,Sigmar,Fascinate,Redacted,Rubik Scribble,Dangrek,Smokum,Srisakdi,Tourney,Glass Antiqua,Metal,Underdog,Margarine,Emblema One,Mystery Quest,Averia Gruesa Libre,Zen Tokyo Zoo,Nabla,Jacquard 12,Manufacturing Consent,Akaya Telivigala,Cute Font,Erica One,Single Day,Joti One,Risque,Unlock,Almendra Display,Barrio,Elsie Swash Caps,Simonetta,Content,Geostar Fill,Paprika,Bitcount Grid Double,Rubik Moonrocks,Handjet,Flamenco,Jersey 20,Bitcount Prop Single,Milonga,Caacupe One,Tulpen One,Autour One,Chela One,Sonsie One,Tilt Prism,Mogra,Monomakh,Rubik Wet Paint,Tillana,Purple Purse,Castoro Titling,Piedra,Vibes,Offside,Bruno Ace SC,Luxurious Roman,Keania One,Griffy,Ravi Prakash,Libre Barcode EAN13 Text,Ewert,Big Shoulders Stencil,Jacques Francois Shadow,Bigelow Rules,Sirin Stencil,Fruktur,Diplomata,Plaster,Federant,Farsan,Fascinate Inline,Sofadi One,Bungee Hairline,Alumni Sans Inline One,Oldenburg,Hanalei Fill,Londrina Shadow,Buda,Bungee Outline,Konkhmer Sleokchher,Butcherman,Oi,Stalinist One,Libre Barcode 39 Extended,Kirang Haerang,Ribeye Marrow,Ranga,Passero One,Bahiana,Gideon Roman,Rubik Iso,Londrina Sketch,Jacquarda Bastarda 9,Jersey 15,Lancelot,Kumar One,Revalia,Rubik Pixels,Rubik Distressed,Foldit,Aubrey,Ponomar,Shizuru,Diplomata SC,Flavors,Micro 5,Blaka,Big Shoulders Inline,Kumar One Outline,Triodion,Trochut,Jacquard 24,Hanalei,Rubik Vinyl,Rubik Burned,Rubik Glitch Pop,Chenla,Bitcount Grid Single,Gajraj One,Bungee Tint,Black And White Picture,Zen Loop,Rubik Puddles,Rubik Gemstones,Langar,Geist Pixel,Rubik 80s Fade,Kalnia Glaze,Bahianita,Flow Rounded,Rubik Beastly,Flow Block,Rubik Doodle Triangles,Protest Guerrilla,Combo,Blaka Hollow,Rubik Microbe,Rubik Broken Fax,Redacted Script,Taprom,Linefont,Agu Display,Syne Tactile,Tagesschrift,Snowburst One,Coral Pixels,Rubik Marker Hatch,Ga Maamli,Moo Lah Lah,Geostar,Rock 3D,Moirai One,Exile,Palette Mosaic,Rubik Maze,Libertinus Serif Display,Chokokutai,Jaini Purva,Rubik Maps,Ponnala,Shafarik,Jaini,Alien Block,Bitcount,Allkin,Rubik Lines,Warnes,Saira Stencil,Rubik Storm,Bitcount Prop Double Ink,Bitcount Single Ink,Wavefont,Blaka Ink,Libertinus Keyboard,Jacquard 12 Charted,Jersey 10 Charted,Bitcount Prop Double,Bitcount Grid Single Ink,Jacquard 24 Charted,Jersey 15 Charted,Bitcount Prop Single Ink,Micro 5 Charted,Bitcount Grid Double Ink,Pochaevsk,Bitcount Ink,Yarndings 20 Charted,Jersey 25 Charted,Yarndings 20,Jersey 20 Charted,Jacquarda Bastarda 9 Charted,Yarndings 12,Yarndings 12 Charted",
    "handwriting": "Dancing Script,Caveat,Pacifico,Shadows Into Light,Great Vibes,Indie Flower,Permanent Marker,Satisfy,Kalam,Yellowtail,Amatic SC,Zeyada,Kaushan Script,Courgette,Allura,Patrick Hand,Comic Neue,Nanum Gothic Coding,Sacramento,Rock Salt,Italianno,Delius,Gloria Hallelujah,Tangerine,Damion,Berkshire Swash,Alex Brush,Cookie,Pinyon Script,Architects Daughter,Homemade Apple,Caveat Brush,Nothing You Could Do,Parisienne,Nanum Pen Script,Merienda,Reenie Beanie,Sriracha,Bad Script,Amita,Handlee,Sofia,Marck Script,Mrs Saint Delafield,Gochi Hand,Leckerli One,Pangolin,Hachi Maru Pop,Mr Dafoe,Charm,Ms Madi,Ma Shan Zheng,Covered By Your Grace,Cedarville Cursive,Itim,Just Another Hand,Oooh Baby,La Belle Aurore,Neucha,Nanum Brush Script,Shadows Into Light Two,Niconne,Herr Von Muellerhoff,Style Script,Petit Formal Script,Playpen Sans,Mali,Fondamento,Sedgwick Ave Display,Yesteryear,Grand Hotel,Klee One,Ephesis,Annie Use Your Telescope,Allison,Schoolbell,Quintessential,Calligraffitti,Dawning of a New Day,Rancho,Coming Soon,Norican,Arizonia,Crafty Girls,Kristi,Rouge Script,Corinthia,Monsieur La Doulaise,Qwitcher Grypen,Meddon,Waiting for the Sunrise,Over the Rainbow,Aguafina Script,Meow Script,Beth Ellen,Birthstone,Hurricane,Mansalva,Square Peg,Gaegu,Nerko One,Rochester,Moon Dance,Delius Unicase,Give You Glory,Vibur,Sue Ellen Francisco,Whisper,Walter Turncoat,Vujahday Script,Qwigley,Euphoria Script,Fuggles,MonteCarlo,Patrick Hand SC,Redressed,Montez,Gamja Flower,Carattere,Fuzzy Bubbles,Bilbo Swash Caps,Birthstone Bounce,Mr De Haviland,WindSong,League Script,Sunshiney,Delicious Handrawn,Julee,Meie Script,Smooch,The Girl Next Door,Long Cang,Zhi Mang Xing,Just Me Again Down Here,Bonheur Royale,Charmonman,Delius Swash Caps,Loved by the King,Borel,Sedgwick Ave,Swanky and Moo Moo,Licorice,Clicker Script,Eagle Lake,Edu TAS Beginner,The Nautigal,Hi Melody,Short Stack,Yomogi,Liu Jian Mao Cao,Waterfall,Lavishly Yours,Ruthie,Beau Rivage,East Sea Dokdo,Imperial Script,Edu SA Beginner,Mynerve,Mea Culpa,Luxurious Script,Engagement,LXGW WenKai TC,Lovers Quarrel,Edu NSW ACT Cursive,Comforter,Passions Conflict,Grape Nuts,Kavivanar,Solitreo,Devonshire,Playwrite US Trad,Gwendolyn,Ballet,Playwrite NO,My Soul,Festive,Stalemate,Island Moments,Playwrite IN,Bilbo,Jim Nightshade,Romanesco,Caramel,Lugrasimo,Edu AU VIC WA NT Guides,Playwrite DE Grund,Dekko,Playpen Sans Arabic,Butterfly Kids,Kapakana,Water Brush,Playwrite CU,Betania Patmos,Playwrite IS,Shalimar,Playwrite AU SA,Condiment,Comforter Brush,Playwrite GB S,Playwrite AU NSW,Edu AU VIC WA NT Hand,Fleur De Leah,Iansui,Slackside One,Neonderthaw,Chilanka,Praise,Bonbon,Updock,Playwrite VN Guides,Babylonica,Playwrite HR,Edu NSW ACT Foundation,Love Light,Grey Qo,Inspiration,Dr Sugiyama,Playwrite VN,Edu VIC WA NT Beginner,Felipa,Miss Fajardose,Lakki Reddy,Playwrite IE,Mr Bedfort,Send Flowers,Playwrite US Modern,Princess Sofia,Grechen Fuemen,Cause,Kolker Brush,Playwrite BR Guides,Lumanosimo,Mrs Sheppards,Twinkle Star,Are You Serious,Cherish,Playwrite HU,Molle,Playwrite MX Guides,Kings,Playpen Sans Hebrew,Playwrite DK Loopet,Playwrite AU QLD,Splash,Ole,Edu AU VIC WA NT Dots,Estonia,Sassy Frass,Gveret Levin,Playwrite DE LA Guides,Explora,Petemoss,Playwrite ZA,Playwrite CA,Playwrite AT,Playwrite PL,Playwrite RO,Tapestry,Playwrite DK Uloopet,Playwrite DE SAS,Edu SA Hand,Playpen Sans Deva,Ruge Boogie,Playwrite DE SAS Guides,Playwrite NZ Basic,Playwrite ES,Ingrid Darling,Playwrite FR Moderne,Playwrite NL,Playwrite BE VLG,Playwrite PT,Playwrite IT Moderna,Puppies Play,Playwrite GB J,Playwrite AR,Playwrite MX,Playpen Sans Thai,Edu QLD Beginner,Playwrite HR Lijeva,Playwrite AU TAS,Yuyu,Edu AU VIC WA NT Pre,Playwrite AU VIC,Edu NSW ACT Hand Pre,Playwrite NG Modern,Playwrite NZ,Playwrite CZ,Playwrite TZ,Yuyu Short,Yuji Hentaigana Akari,Playwrite SK,Playwrite BE WAL,Edu AU VIC WA NT Arrows,Playwrite DE LA,Playwrite CO Guides,Edu VIC WA NT Hand,Playwrite CO,Playwrite CU Guides,Edu VIC WA NT Hand Pre,Playwrite US Trad Guides,Bpmf Iansui,Edu QLD Hand,Playwrite PE,Playwrite CL,Playwrite ES Deco,Playwrite BR,Playwrite ID,Yuji Hentaigana Akebono,Playwrite AU VIC Guides,Playwrite GB J Guides,Betania Patmos In,Betania Patmos In GDL,Playwrite NZ Guides,Playwrite TZ Guides,Playwrite PL Guides,Playwrite AR Guides,Playwrite PT Guides,Playwrite PE Guides,Playwrite FR Trad,Playwrite DE Grund Guides,Betania Patmos GDL,Playwrite GB S Guides,Playwrite DE VA,Playwrite BE WAL Guides,Playwrite IT Trad,Playwrite NZ Basic Guides,Playwrite IE Guides,Playwrite IN Guides,Playwrite DK Uloopet Guides,Playwrite ES Guides,Playwrite IT Moderna Guides,Playwrite DE VA Guides,Playwrite FR Moderne Guides,Playwrite HU Guides,Playwrite ES Deco Guides,Playwrite FR Trad Guides,Playwrite IT Trad Guides,Playwrite AU SA Guides,Playwrite US Modern Guides,Playwrite AU TAS Guides,Playwrite ID Guides,Playwrite HR Lijeva Guides,Playwrite NG Modern Guides,Playwrite AU QLD Guides,Playwrite RO Guides,Playwrite CL Guides,Playwrite ZA Guides,Playwrite AU NSW Guides,Playwrite AT Guides,Playwrite DK Loopet Guides,Playwrite NL Guides,Playwrite CA Guides,Playwrite BE VLG Guides,Playwrite NO Guides,Playwrite IS Guides,Playwrite SK Guides,Playwrite CZ Guides,Playwrite HR Guides",
    "monospace": "Roboto Mono,JetBrains Mono,Source Code Pro,Inconsolata,IBM Plex Mono,Space Mono,DM Mono,Geist Mono,Courier Prime,PT Mono,Share Tech Mono,VT323,Fira Code,Google Sans Code,Cutive Mono,Ubuntu Mono,Anonymous Pro,Cousine,Fira Mono,Red Hat Mono,Overpass Mono,Fragment Mono,Azeret Mono,Spline Sans Mono,Chivo Mono,Major Mono Display,Sometype Mono,Oxygen Mono,Syne Mono,B612 Mono,Xanh Mono,Lekton,Nova Mono,Martian Mono,M PLUS 1 Code,Monofett,Reddit Mono,Victor Mono,Kode Mono,Sixtyfour,Intel One Mono,LXGW WenKai Mono TC,Ubuntu Sans Mono,Sixtyfour Convergence,Iosevka Charon,Libertinus Mono,Workbench,Iosevka Charon Mono,Lilex,Hibur Mono,Datatype"
  };
  var FONTS = FONT_CATEGORIES.flatMap(
    (category) => CATALOGUE[category].split(",").map((family) => ({ family, category }))
  );
  var BY_FAMILY = new Map(FONTS.map((f2) => [f2.family, f2]));
  var SPOTIFY_STACK = "SpotifyMixUI, CircularSp, CircularSp-Arab, CircularSp-Cyrl, CircularSp-Deva, CircularSp-Grek, CircularSp-Hebr, sans-serif";
  var SPOTIFY_TITLE_STACK = `SpotifyMixUITitle, ${SPOTIFY_STACK}`;
  var HEADING_BASE = [
    ".encore-text-headline-large",
    ".encore-text-headline-medium",
    ".encore-text-title-large",
    ".encore-text-title-medium",
    ".encore-text-title-small",
    ".encore-text-title-extra-small",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6"
  ];
  var HEADING_SELECTORS = HEADING_BASE.flatMap((s2) => [`body ${s2}`, `body ${s2} *`]).join(",\n");
  function getFont(which) {
    return readLS(which === "body" ? FONT_BODY_KEY : FONT_HEADING_KEY, FONT_DEFAULT);
  }
  var CHUNK_SIZE = 25;
  function loadFamilies(id, families) {
    const wanted = families.filter((f2) => f2 && f2 !== FONT_DEFAULT && BY_FAMILY.has(f2));
    const existing = Array.from(document.querySelectorAll(`link[data-liquify-fonts="${id}"]`));
    const hrefs = [];
    for (let i2 = 0; i2 < wanted.length; i2 += CHUNK_SIZE) {
      const query = wanted.slice(i2, i2 + CHUNK_SIZE).map((f2) => `family=${encodeURIComponent(f2).replace(/%20/g, "+")}:wght@400;500;700`).join("&");
      hrefs.push(`https://fonts.googleapis.com/css2?${query}&display=swap`);
    }
    const current = existing.map((l) => l.href);
    if (current.length === hrefs.length && hrefs.every((h2, i2) => current[i2] === h2)) return;
    for (const link of existing) link.remove();
    for (const href of hrefs) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.liquifyFonts = id;
      document.head.appendChild(link);
    }
  }
  var previewed = /* @__PURE__ */ new Set();
  function loadFontPreviews(families) {
    const fresh = families.filter((f2) => f2 && f2 !== FONT_DEFAULT && BY_FAMILY.has(f2) && !previewed.has(f2));
    if (fresh.length === 0) return;
    for (const f2 of fresh) previewed.add(f2);
    for (let i2 = 0; i2 < fresh.length; i2 += CHUNK_SIZE) {
      const query = fresh.slice(i2, i2 + CHUNK_SIZE).map((f2) => `family=${encodeURIComponent(f2).replace(/%20/g, "+")}:wght@400;500;700`).join("&");
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
      link.dataset.liquifyFonts = PREVIEW_LINK_ID;
      document.head.appendChild(link);
    }
  }
  function applyFonts() {
    const body = getFont("body");
    const heading = getFont("heading");
    loadFamilies(FAMILY_LINK_ID, [body, heading]);
    const rules = [];
    if (body !== FONT_DEFAULT) {
      rules.push(`body, body *:not(svg):not(svg *) {
  font-family: "${body}", ${SPOTIFY_STACK} !important;
}`);
    }
    if (heading !== FONT_DEFAULT || body !== FONT_DEFAULT) {
      const stack = heading === FONT_DEFAULT ? SPOTIFY_TITLE_STACK : `"${heading}", ${SPOTIFY_TITLE_STACK}`;
      rules.push(`${HEADING_SELECTORS} {
  font-family: ${stack} !important;
}`);
    }
    updateStyle(STYLE_ID4, rules.join("\n\n"));
  }
  function setFont(which, family) {
    localStorage.setItem(which === "body" ? FONT_BODY_KEY : FONT_HEADING_KEY, family);
    applyFonts();
  }
  function resetFonts() {
    localStorage.setItem(FONT_BODY_KEY, FONT_DEFAULT);
    localStorage.setItem(FONT_HEADING_KEY, FONT_DEFAULT);
    applyFonts();
  }
  function ensureFontsApplied() {
    applyFonts();
  }

  // src/settings/features/vinylCoverArt.ts
  var STYLE_ID5 = "liquify-vinyl-style";
  var PLAY_STATE_KEY = "liquifyVinylPlayState";
  var PLAYING_CLASS = "liquify-playing";
  var VINYL_SPEED_KEY = "liquify-vinyl-speed";
  var VINYL_SPEED_DEFAULT = 12;
  var VINYL_SURFACES = {
    npv: { key: "liquify-vinyl-npv" },
    playbar: { key: "liquify-vinyl-playbar" },
    cinema: { key: "liquify-vinyl-cinema" }
  };
  function isVinylOn(surface) {
    return readLS(VINYL_SURFACES[surface].key, "off") === "on";
  }
  function discFurniture(disc) {
    return `
${disc}::before,
${disc}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
}
/* The pressed grooves, drawn rather than imaged. Cleared through the middle,
   where the label sits. */
${disc}::before {
  background: repeating-radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.055) 0 1px,
    rgba(0, 0, 0, 0.14) 1px 3px
  );
  opacity: 0.5;
  mask-image: radial-gradient(circle at 50% 50%, transparent 0 22%, black 26%);
  -webkit-mask-image: radial-gradient(circle at 50% 50%, transparent 0 22%, black 26%);
}
/* Label and spindle in one paint: the dark hole sits over the accent disc. */
${disc}::after {
  background:
    radial-gradient(circle at 50% 50%, #06080b 0 6.5%, transparent 6.6%),
    radial-gradient(circle at 50% 50%, var(--accent-color, #1ed760) 0 17%, transparent 17.1%);
}`;
  }
  function vinylCss(disc, art) {
    return `
${disc} {
  border-radius: 50% !important;
  overflow: hidden !important;
  position: relative;
}
${art} {
  border-radius: 50% !important;
  /* Paused rather than stopped, so it holds its angle while the music does \u2014
     the animation runs from the moment the element exists, only its play state
     moves. */
  animation: liquify-vinyl-spin var(--liquify-vinyl-spin, 12s) linear infinite;
  animation-play-state: paused;
}
html.${PLAYING_CLASS} ${art} { animation-play-state: running; }
${discFurniture(disc)}`;
  }
  function buildCss() {
    const parts = [];
    if (isVinylOn("npv")) {
      parts.push(vinylCss(".main-nowPlayingView-coverArt", ".main-nowPlayingView-coverArt img"));
      parts.push(`
#cs-track .cs-slot { border-radius: 50% !important; }
#cs-track .cs-face {
  border-radius: 50% !important;
  animation: liquify-vinyl-spin var(--liquify-vinyl-spin, 12s) linear infinite;
  animation-play-state: paused;
}
html.${PLAYING_CLASS} #cs-track .cs-face { animation-play-state: running; }
${discFurniture("#cs-track .cs-face")}`);
    }
    if (isVinylOn("playbar")) {
      parts.push(vinylCss(
        ".main-coverSlotCollapsed-container .cover-art",
        ".main-coverSlotCollapsed-container .cover-art .cover-art-image"
      ));
      parts.push(`
.main-coverSlotCollapsed-container .main-nowPlayingWidget-coverArtContainer,
.main-coverSlotCollapsed-container .main-nowPlayingWidget-coverArt {
  border-radius: 50% !important;
  background: transparent !important;
}`);
    }
    if (isVinylOn("cinema")) {
      parts.push(vinylCss(
        ".Root__cinema-view .cover-art",
        ".Root__cinema-view .cover-art .cover-art-image"
      ));
    }
    if (parts.length === 0) return "";
    const seconds = Math.max(1, readNum(VINYL_SPEED_KEY, VINYL_SPEED_DEFAULT));
    return `:root { --liquify-vinyl-spin: ${seconds}s; }
${parts.join("\n")}

@keyframes liquify-vinyl-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  html.${PLAYING_CLASS} [class*="cover-art"], html.${PLAYING_CLASS} .cs-face { animation: none !important; }
}`;
  }
  function installPlayState() {
    const win = window;
    if (win[PLAY_STATE_KEY]) return;
    win[PLAY_STATE_KEY] = true;
    const sync = () => {
      const playing = Boolean(win.Spicetify?.Player?.isPlaying?.());
      document.documentElement.classList.toggle(PLAYING_CLASS, playing);
    };
    sync();
    win.Spicetify?.Player?.addEventListener?.("onplaypause", sync);
    setInterval(sync, 1e3);
  }
  function applyCss3() {
    updateStyle(STYLE_ID5, buildCss());
  }
  function setVinyl(surface, mode) {
    localStorage.setItem(VINYL_SURFACES[surface].key, mode === "on" ? "on" : "off");
    applyCss3();
  }
  function setVinylSpeed(seconds) {
    localStorage.setItem(VINYL_SPEED_KEY, String(seconds));
    applyCss3();
  }
  function resetVinyl() {
    for (const surface of Object.keys(VINYL_SURFACES)) {
      localStorage.setItem(VINYL_SURFACES[surface].key, "off");
    }
    localStorage.setItem(VINYL_SPEED_KEY, String(VINYL_SPEED_DEFAULT));
    applyCss3();
  }
  function ensureVinylApplied() {
    installPlayState();
    applyCss3();
  }

  // src/settings/features/localFilesCard.ts
  var STYLE_ID6 = "liquify-local-files-style";
  var LOCAL_FILES_TRANSPARENT_KEY = "liquify-local-files-transparent";
  var LOCAL_FILES_CARD = ".KmN1Y8bq8eC6k8TX";
  function applyCss4() {
    const on = readLS(LOCAL_FILES_TRANSPARENT_KEY, "off") === "on";
    updateStyle(
      STYLE_ID6,
      on ? `${LOCAL_FILES_CARD} {
  background-color: transparent !important;
  /* The fill was the only thing giving the entry an edge; the theme's rim takes
     over that job once it's gone. */
  box-shadow: var(--liquify-shadow);
}` : ""
    );
  }
  function setLocalFilesTransparent(mode) {
    localStorage.setItem(LOCAL_FILES_TRANSPARENT_KEY, mode === "on" ? "on" : "off");
    applyCss4();
  }
  function ensureLocalFilesTransparentApplied() {
    applyCss4();
  }

  // src/settings/features/homeLayout.ts
  var STYLE_ID7 = "liquify-home-layout-style";
  var HOME_LAYOUT_KEY = "liquify-home-layout";
  function updateHomeLayoutCss(on) {
    const css = on ? ".main-home-content section { padding: 1rem; gap: .5rem; box-shadow: var(--liquify-shadow); border-radius: 20px; }.main-card-cardContainer, .LXxEtdyreLg2dh0C { height: calc(100% - 1px); }.XtiGtrj_ysgd8Bmv { --margin-start: 0px; --margin-end: 0px; }" : ".main-home-content section { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }";
    updateStyle(STYLE_ID7, css);
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
  var STYLE_ID8 = "liquify-compact-player-style";
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
    updateStyle(STYLE_ID8, css);
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
  var STYLE_ID9 = "liquify-playlist-header-style";
  function updatePlaylistHeaderCss(show) {
    const css = show ? "" : ".main-entityHeader-container { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }";
    updateStyle(STYLE_ID9, css);
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

  // src/settings/features/playerControlIcons.ts
  var PLAYER_ICONS_KEY = "liquify-player-icons";
  var STYLE_ID10 = "liquify-player-control-icons-style";
  var ICON = "liquify-player-icon";
  var PLAYING = "is-playing";
  var SKIPPING = "is-skipping";
  var OBSERVER_KEY = "liquifyPlayerControlIconsObserver";
  var PRESS_KEY = "liquifyPlayerControlIconsPress";
  var control = (id) => `button[data-testid="control-button-${id}"]`;
  var PLAY = control("playpause");
  var BACK = control("skip-back");
  var FORWARD = control("skip-forward");
  var SHUFFLE = control("shuffle");
  var REPEAT = control("repeat");
  var TRANSPORT_BUTTONS = [PLAY, BACK, FORWARD];
  var TRANSPORT = TRANSPORT_BUTTONS.join(", ");
  var SKIPS = `${BACK}, ${FORWARD}`;
  var eachTransport = (suffix) => TRANSPORT_BUTTONS.map((selector) => selector + suffix).join(", ");
  var SKIP_ROW = `<g class="${ICON}__nudge"><g class="${ICON}__row" fill="currentColor" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path class="${ICON}__in" d="M-6.4 5.6 1.6 12 -6.4 18.4Z"/><path d="M3.2 5.6 11.2 12 3.2 18.4Z"/><path class="${ICON}__out" d="M12.8 5.6 20.8 12 12.8 18.4Z"/></g></g>`;
  var svg = (body) => `<svg class="${ICON}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
  var PLAY_SHAPE = `<g fill="currentColor" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"><path class="${ICON}__a" d="M9.4 6.6 L13.5 9.3 L13.5 14.7 L9.4 17.4 Z"/><path class="${ICON}__b" d="M13.5 9.3 L17.6 12 L17.6 12 L13.5 14.7 Z"/></g>`;
  var CONTROLS = [
    [PLAY, svg(PLAY_SHAPE)],
    [FORWARD, svg(SKIP_ROW)],
    [BACK, svg(`<g transform="translate(24 0) scale(-1 1)">${SKIP_ROW}</g>`)]
  ];
  var SCALE_PLAY_BUTTON = `${PLAY} span[class*="button-icon-only--small"] {
  transform: scale(1.45) !important;
  transform-origin: center !important;
}`;
  var BARE_PLAY_BUTTON = `${PLAY},
${PLAY}:hover,
${PLAY}:active,
${PLAY} [class*="button-primary__inner"],
${PLAY}:hover [class*="button-primary__inner"],
${PLAY}:active [class*="button-primary__inner"] {
  background: transparent !important;
  box-shadow: none !important;
}
${PLAY} [class*="button-primary__inner"]::after { display: none !important; }`;
  var ACTIVE_TINT = ".encore-internal-color-text-bright-accent";
  var ACCENT_COLOR = "var(--spice-button-active, var(--spice-button, var(--accent-color, #1ed760)))";
  function tintedControls(color) {
    const targets = [SHUFFLE, `button[data-encore-id="buttonTertiary"][aria-label*="Shuffle"]`, REPEAT];
    const scoped = (suffix, state = "") => targets.map((t) => t + state + suffix).join(", ");
    const off = (suffix) => scoped(suffix, `:not(${ACTIVE_TINT})`);
    const on = (suffix) => scoped(suffix, ACTIVE_TINT);
    return `${off("")}, ${off(" *")} {
  color: ${color} !important;
}
${on("")}, ${on(" *")} {
  color: ${ACCENT_COLOR} !important;
}
${scoped(" svg")}, ${scoped(" path")} {
  fill: currentColor !important;
}`;
  }
  function getPlayerControlIconCss() {
    return `
/* Spotify's glyph keeps its box \u2014 the button sizes itself off it \u2014 and only
   stops drawing. Ours floats centred on the button instead of replacing
   anything inside it, so no Encore-internal element has to be found. */
${TRANSPORT} {
  position: relative !important;
  transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1) !important;
}
${eachTransport(":active")} { transform: scale(var(--liquify-player-press-scale, 0.9)) !important; }
${eachTransport(` svg:not(.${ICON})`)} { visibility: hidden !important; }

.${ICON} {
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: var(--liquify-player-icon-size, 26px) !important;
  height: var(--liquify-player-icon-size, 26px) !important;
  color: var(--liquify-player-icon-color, #fff) !important;
  overflow: hidden;
  pointer-events: none;
}

${BARE_PLAY_BUTTON}

/* Bigger than the skips, not equal: the triangle fills far less of its viewBox
   than the skip pair does, and play is the primary control. */
${PLAY} .${ICON} { --liquify-player-icon-size: 36px; }

/* Play/pause \u2014 shape change, not an icon swap. */
.${ICON}__a, .${ICON}__b { transition: d 0.46s cubic-bezier(0.32, 1.35, 0.46, 1); }
.${ICON}__a { d: path("M9.4 6.6 L13.5 9.3 L13.5 14.7 L9.4 17.4 Z"); }
.${ICON}__b { d: path("M13.5 9.3 L17.6 12 L17.6 12 L13.5 14.7 Z"); }
.${ICON}.${PLAYING} .${ICON}__a { d: path("M7.8 6 L9.3 6 L9.3 18 L7.8 18 Z"); }
.${ICON}.${PLAYING} .${ICON}__b { d: path("M14.7 6 L16.2 6 L16.2 18 L14.7 18 Z"); }

/* Optical centring: a triangle carries its mass at the flat edge, so a
   geometrically centred pair reads as shifted backwards. The nudge lives in
   the mirrored group, so it applies to both directions. */
.${ICON}__nudge { transform-box: view-box; transform-origin: 0 0; transform: translateX(1.1px); }
.${ICON}__row { transform-box: view-box; transform-origin: 0 0; }
.${ICON}__in { opacity: 0; }

/* One press advances the row by exactly one position (9.6 units): the spare
   triangle fades in, the leading one runs out of the viewBox. End state equals
   start state, which is why dropping the class again is invisible. */
.${SKIPPING} .${ICON}__row { animation: liquifySkipFlow 0.52s cubic-bezier(0.3, 1.75, 0.44, 1) both; }
.${SKIPPING} .${ICON}__in { animation: liquifySkipIn 0.52s cubic-bezier(0.32, 0.72, 0.22, 1) both; }
.${SKIPPING} .${ICON}__out { animation: liquifySkipOut 0.52s cubic-bezier(0.32, 0.72, 0.22, 1) both; }

@keyframes liquifySkipFlow { from { transform: translateX(0); } to { transform: translateX(9.6px); } }
@keyframes liquifySkipIn { 0% { opacity: 0; } 45%, 100% { opacity: 1; } }
@keyframes liquifySkipOut { 0% { opacity: 1; } 55%, 100% { opacity: 0; } }

${tintedControls("#fff")}

/* Both are role=switch, so aria-checked carries the engaged state \u2014 repeat
   reports "mixed" for repeat-one, hence the negated match rather than ="true".
   The descendants come along for the same reason as above. */
${SHUFFLE}[aria-checked]:not([aria-checked="false"]),
${SHUFFLE}[aria-checked]:not([aria-checked="false"]) *,
${REPEAT}[aria-checked]:not([aria-checked="false"]),
${REPEAT}[aria-checked]:not([aria-checked="false"]) * {
  color: ${ACCENT_COLOR} !important;
}

${SCALE_PLAY_BUTTON}

@media (prefers-reduced-motion: reduce) {
  ${TRANSPORT}, .${ICON}__a, .${ICON}__b { transition: none !important; }
  .${SKIPPING} .${ICON}__row,
  .${SKIPPING} .${ICON}__in,
  .${SKIPPING} .${ICON}__out { animation: none !important; }
}
`;
  }
  function getPlayerControlIconsDisabledCss() {
    return `
${SCALE_PLAY_BUTTON}

${BARE_PLAY_BUTTON}

${eachTransport("")},
${eachTransport(" *")} {
  color: #fff !important;
}
${eachTransport(" svg")}, ${eachTransport(" path")} { fill: currentColor !important; }

[class*="-legacy-button"]:hover { color: #fff !important; }
`;
  }
  function isPlayerControlIconsEnabled() {
    return (localStorage.getItem(PLAYER_ICONS_KEY) || "on") === "on";
  }
  function removeIcons() {
    document.querySelectorAll(`.${ICON}`).forEach((icon) => icon.remove());
  }
  function ensureIcon(button, markup) {
    let icon = button.querySelector(`.${ICON}`);
    if (!icon) {
      const holder = document.createElement("div");
      holder.innerHTML = markup;
      icon = holder.firstElementChild;
      button.appendChild(icon);
    }
    return icon;
  }
  function isPlaying(button) {
    const label = (button.getAttribute("aria-label") || "").toLowerCase();
    return /paus/.test(label) || Boolean(window.Spicetify?.Player?.isPlaying?.());
  }
  var PRESS_GRACE_MS = 500;
  var RECONCILE_MS = 650;
  function setPlayingState(icon, playing) {
    const el = icon;
    const pressedAt = Number(el.dataset.liquifyPressed || 0);
    if (pressedAt) {
      if (icon.classList.contains(PLAYING) !== playing && performance.now() - pressedAt < PRESS_GRACE_MS) {
        return;
      }
      delete el.dataset.liquifyPressed;
    }
    icon.classList.toggle(PLAYING, playing);
  }
  function applyPlayerControlIcons() {
    if (!isPlayerControlIconsEnabled()) {
      removeIcons();
      return;
    }
    for (const [selector, markup] of CONTROLS) {
      const button = document.querySelector(selector);
      if (!button) continue;
      const icon = ensureIcon(button, markup);
      if (selector === PLAY) setPlayingState(icon, isPlaying(button));
    }
  }
  function installPressFeedback(win) {
    if (win[PRESS_KEY]) return;
    win[PRESS_KEY] = true;
    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const target = event.target;
      const playIcon = target?.closest?.(PLAY)?.querySelector(`.${ICON}`);
      if (playIcon) {
        playIcon.classList.toggle(PLAYING);
        playIcon.dataset.liquifyPressed = String(performance.now());
        window.setTimeout(applyPlayerControlIcons, RECONCILE_MS);
      }
      const icon = target?.closest?.(SKIPS)?.querySelector(`.${ICON}`);
      if (!icon) return;
      icon.classList.remove(SKIPPING);
      void icon.getBoundingClientRect();
      icon.classList.add(SKIPPING);
    }, true);
    document.addEventListener("animationend", (event) => {
      if (event.animationName !== "liquifySkipFlow") return;
      event.target.closest?.(`.${ICON}`)?.classList.remove(SKIPPING);
    }, true);
  }
  function installPlayerControlIcons() {
    const win = window;
    if (!isPlayerControlIconsEnabled()) {
      win[OBSERVER_KEY]?.disconnect?.();
      win[OBSERVER_KEY] = void 0;
      updateStyle(STYLE_ID10, getPlayerControlIconsDisabledCss());
      removeIcons();
      return;
    }
    updateStyle(STYLE_ID10, getPlayerControlIconCss());
    applyPlayerControlIcons();
    installPressFeedback(win);
    if (win[OBSERVER_KEY]) return;
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyPlayerControlIcons();
      });
    });
    win[OBSERVER_KEY] = observer;
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-label"],
      childList: true,
      subtree: true
    });
    win.Spicetify?.Player?.addEventListener?.("onplaypause", applyPlayerControlIcons);
    win.Spicetify?.Player?.addEventListener?.("songchange", applyPlayerControlIcons);
  }
  function setPlayerControlIcons(mode) {
    const m2 = mode === "on" ? "on" : "off";
    localStorage.setItem(PLAYER_ICONS_KEY, m2);
    installPlayerControlIcons();
  }

  // src/settings/features/progressBarHeight.ts
  var PROGRESS_BAR_HEIGHT_KEY = "liquify-progress-bar-height";
  var PROGRESS_BAR_HEIGHT_DEFAULT = 6;
  var PROGRESS_BAR_COMPAT_KEY = "liquify-progress-bar-compat";
  function isProgressBarCompat() {
    return readLS(PROGRESS_BAR_COMPAT_KEY, "off") === "on";
  }
  function applyCss5(px) {
    updateStyle(
      "liquify-progress-bar-height",
      isProgressBarCompat() ? "" : `.x-progressBar-progressBarBg, .x-progressBar-sliderArea { --progress-bar-height: ${px}px !important; height: ${px}px !important; }`
    );
  }
  function setProgressBarHeight(px) {
    localStorage.setItem(PROGRESS_BAR_HEIGHT_KEY, String(px));
    applyCss5(px);
  }
  function ensureProgressBarHeightApplied() {
    applyCss5(readNum(PROGRESS_BAR_HEIGHT_KEY, PROGRESS_BAR_HEIGHT_DEFAULT));
  }
  function setProgressBarCompat(enabled, reapplyRadius) {
    localStorage.setItem(PROGRESS_BAR_COMPAT_KEY, enabled ? "on" : "off");
    ensureProgressBarHeightApplied();
    reapplyRadius();
  }

  // src/settings/features/progressBarRadius.ts
  var PROGRESS_BAR_RADIUS_KEY = "liquify-progress-bar-radius";
  var PROGRESS_BAR_RADIUS_DEFAULT = 10;
  function applyCss6(px) {
    updateStyle(
      "liquify-progress-bar-radius",
      isProgressBarCompat() ? "" : `.x-progressBar-progressBarBg, .x-progressBar-sliderArea { border-radius: ${px}px !important; }`
    );
  }
  function setProgressBarRadius(px) {
    localStorage.setItem(PROGRESS_BAR_RADIUS_KEY, String(px));
    applyCss6(px);
  }
  function ensureProgressBarRadiusApplied() {
    applyCss6(readNum(PROGRESS_BAR_RADIUS_KEY, PROGRESS_BAR_RADIUS_DEFAULT));
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
  function applyCss7() {
    const themed = readLS(THEMED_LYRICS_KEY, "on") === "on";
    const size = readNum(LYRICS_FONT_SIZE_KEY, LYRICS_FONT_SIZE_DEFAULT);
    const margin = readNum(LYRICS_MARGIN_KEY, LYRICS_MARGIN_DEFAULT);
    const css = themed ? `.lyrics-lyricsContent-lyric.lyrics-lyricsContent-active { font-size: ${size}px; }
.lyrics-lyricsContent-lyric:not(.aLaX8poOH8kdbmGf) { margin-bottom: ${margin}px; }` : `.lyrics-lyricsContent-lyric:not(.aLaX8poOH8kdbmGf) { margin-bottom: .6em; }`;
    updateStyle("liquify-themed-lyrics", css);
  }
  function setThemedLyrics(on) {
    localStorage.setItem(THEMED_LYRICS_KEY, on ? "on" : "off");
    applyCss7();
  }
  function setLyricsFontSize(px) {
    localStorage.setItem(LYRICS_FONT_SIZE_KEY, String(px));
    applyCss7();
  }
  function setLyricsMargin(px) {
    localStorage.setItem(LYRICS_MARGIN_KEY, String(px));
    applyCss7();
  }
  function ensureThemedLyricsApplied() {
    applyCss7();
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
  var STYLE_ID11 = "liquify-transparent-player-style";
  function updateTransparentPlayerCss(transparent) {
    const css = transparent ? ".Root__now-playing-bar { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }" : "";
    updateStyle(STYLE_ID11, css);
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
  var STYLE_ID12 = "liquify-floating-player-style";
  var FLOATING_PLAYER_KEY = "liquify-floating-player";
  function updateFloatingPlayerCss(on) {
    const css = on ? [
      // z-index: out of grid flow the bar's paint order would otherwise rest on
      // DOM order alone, leaving it at the mercy of whatever main-view stacks
      // over its strip. Pin it above the content it now floats on top of.
      //
      // Spotify's own token, not a number: its scale puts the cinema view at 5
      // while its controls are showing (the variable is literally named
      // "above everything except now playing bar"), the bar at 6, and the
      // cinema view at 7 once the controls are hidden. A hard-coded 5 here tied
      // with the first of those and lost the tie, which is why the floating bar
      // vanished behind cinema and fullscreen. At 6 it sits above cinema with
      // the controls up, and still lets cinema cover it once they are hidden —
      // which is the point of that mode.
      ".Root__now-playing-bar { position: absolute; bottom: 0px; justify-self: center; z-index: var(--now-playing-bar-grid-area-z-index, 6); }",
      ".JlQyoTD6puMgqY_y,.main-yourLibraryX-libraryRootlist,.main-nowPlayingView-panel,.L1PjPOgsoqc2nbpl,.QbBd77Gr02YOoZzr,.YT5cYwULCoyD6pGh,.x-settings-container,.main-yourLibraryX-libraryRootlist.YPRhFiIfXdwCZJ9q,.OjXmN1Ml9AEI6JbR,.tsCJQaqF4ALEqTft,.marketplace-footer { padding-bottom: 7rem !important; }",
      // user.css pulls the controls-hidden cinema view 90px further down than
      // Spotify does, to swallow the docked bar's strip. The floating bar is
      // out of flow and no longer leaves that strip behind, so the same offset
      // drags the view 90px too far.
      ".Root__cinema-view.Root__cinema-view--controls-hidden { margin-bottom: calc(0px - var(--bottom-bar-height) - var(--panel-gap)) !important; }",
      ".aotfMYhXr8Ag8I7a { padding-bottom: 6rem !important; }",
      ".goTtSSnEdE9nZjky { padding-block-end: 7rem !important; }",
      // Version-agnostic: Encore's build hash moved from e-10451 to e-10810
      // with the update, which left this one silently matching nothing.
      'span.encore-inverted-light-set[class*="button-primary__inner"][class*="legacy-button--medium"] { margin-bottom: 7rem !important; }'
    ].join("\n") : "";
    updateStyle(STYLE_ID12, css);
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
  var STYLE_ID13 = "liquify-connect-bar-style";
  var CONNECT_BAR_KEY = "liquify-connect-bar";
  function updateConnectBarCss(show) {
    updateStyle(STYLE_ID13, show ? "" : ".main-connectBar-connectBar { display: none !important; }");
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
  var BOUNCE_CLASS = "liquify-popup-bounce";
  function isPopupBounceOn() {
    return (localStorage.getItem(POPUP_BOUNCE_KEY) || "on") === "on";
  }
  function syncClass() {
    document.documentElement.classList.toggle(BOUNCE_CLASS, isPopupBounceOn());
  }
  function applyPopupBounce(mode) {
    localStorage.setItem(POPUP_BOUNCE_KEY, mode);
    syncClass();
    window.dispatchEvent(new Event("liquifyPopupBounceChange"));
  }
  function ensurePopupBounceApplied() {
    syncClass();
    window.dispatchEvent(new Event("liquifyPopupBounceChange"));
  }

  // src/settings/features/visualizers.ts
  function installPlaylistIndicatorVisualizer() {
    (async function() {
      while (!Spicetify?.Player || !Spicetify?.Player?.data) await sleep(300);
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
          const isPlaying2 = Spicetify.Player.isPlaying() && (!playButton || window.getComputedStyle(playButton).opacity === "0");
          if (!isPlaying2) {
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
        const isPlaying2 = Spicetify.Player.isPlaying() && (!playButton || window.getComputedStyle(playButton).opacity === "0");
        if (lastSvg && !isPlaying2) {
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
        const isPlaying2 = Spicetify.Player.isPlaying();
        if (wasPlaying && !isPlaying2) {
          for (const [, data] of homeSvgs.entries()) {
            try {
              data.wrapper?.remove();
            } catch {
            }
          }
          homeSvgs.clear();
        }
        if (!wasPlaying && isPlaying2) {
          updateHomeScreenVisualizer();
        }
        wasPlaying = isPlaying2;
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
  var ROW_HEIGHT = 52;
  var OVERSCAN = 6;
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
    /* Stroked rather than filled, matching the drawn close glyph below. */
    .liquifyCloseBtn svg {
      width: 18px;
      height: 18px;
      display: block;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
    }
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
      line-height: 1;
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease, background-color 0.2s ease;
    }
    /* Drawn rather than the \u2039 \u203A characters: at this size the glyphs render thin
       and sit off-centre, since their metrics depend on whichever font Spotify
       has loaded. */
    .liquifySectionNavScrollBtn svg {
      display: block;
      width: 14px;
      height: 14px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.4;
      stroke-linecap: round;
      stroke-linejoin: round;
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
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1), box-shadow 0.28s ease;
    }
    .liquifySelectBtn:active { transform: scale(0.9); }
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
    /* The current entry is bold *and* filled, so it reads as chosen at a glance
       instead of only on close inspection. */
    .liquifySelectItem.isSelected {
      font-weight: 700;
      background: var(--liquify-glow-accent);
      box-shadow: var(--liquify-shadow);
    }

    /* The same spring popupBounce.ts plays on Spotify's own menus, as a plain
       animation: these menus are React portals that mount and unmount on the
       spot, so there is no class for that module's enter/exit to hang off. Only
       the entrance \u2014 an exit would need the element kept alive past its unmount,
       which is the clone dance popupBounce has to do for Spotify's menus. */
    @keyframes liquifyMenuPop {
      from { opacity: 0; transform: translateY(-6px) scale(0.86); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    /* The exit keeps its own, sharper curve \u2014 the same split popupBounce uses
       between arriving and leaving. */
    @keyframes liquifyMenuPopOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(8px) scale(0.95); }
    }
    /* Gated on the Popup Bounce toggle, which uiEffects.ts mirrors onto <html> \u2014
       one switch for these and for the menus popupBounce.ts animates. */
    html.liquify-popup-bounce .liquifySelectMenu,
    html.liquify-popup-bounce .liquifyPopover,
    html.liquify-popup-bounce .liquifyLibrary {
      transform-origin: top center;
      animation: liquifyMenuPop 240ms cubic-bezier(0.34, 1.7, 0.64, 1) both;
    }
    html.liquify-popup-bounce .liquifySelectMenu.isClosing,
    html.liquify-popup-bounce .liquifyPopover.isClosing,
    html.liquify-popup-bounce .liquifyLibrary.isClosing {
      animation: liquifyMenuPopOut 180ms cubic-bezier(0.8, 0, 0.2, 1) both;
      pointer-events: none;
    }

    /* ---- Font picker ---- */
    .liquifyFontMenu {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      overflow: hidden;
    }
    /* Search and filter share one row; the field takes whatever the dropdown
       leaves. min-width:0 so it may actually shrink instead of forcing the row
       wider than the menu. */
    .liquifyFontTop {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .liquifyFontSearch {
      flex: 1 1 auto;
      min-width: 0;
      padding: 7px 10px;
      font-size: 12px;
      outline: none;
    }
    .liquifyFontSearch::placeholder { color: rgba(255, 255, 255, 0.5); }
    .liquifyFontTop .liquifySelectBtn { flex: 0 0 auto; }
    .liquifyFontList {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      /* Explicit, because overflow-y alone makes the other axis scrollable too \u2014
         which is what put a horizontal scrollbar under the list. */
      overflow-x: clip;
      position: relative;
      /* The room the hover scale grows into. Clipping happens at this padding
         edge, so the inset is what keeps a scaled row from being cut off left
         and right \u2014 and overflow-x above is what stops it scrolling instead. */
      padding: 4px 10px;
    }
    /* Holds the full scroll height while only the visible rows exist inside it. */
    .liquifyFontRunway { position: relative; }
    .liquifyFontItem {
      position: absolute;
      left: 0;
      right: 0;
      /* Must match ROW_HEIGHT in the picker: rows are placed by arithmetic, not
         measured, so a mismatch here shows up as drift down the list. The 4px
         is the gap, taken out of the row's own box. */
      height: 48px;
      margin-bottom: 4px;
      box-sizing: border-box;
      padding: 6px 10px;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
      text-align: left;
      overflow: hidden;
      /* Every row carries the rim, not just the one under the pointer. */
      box-shadow: var(--liquify-shadow);
      transition: background-color 0.25s ease, transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1);
    }
    .liquifyFontItem:hover { transform: scale(1.02); }
    /* The current one keeps the rim and adds the accent fill, so it stays
       distinct from whatever the pointer happens to be over. Never bolded \u2014 the
       name is already set in its own face, and forcing a weight would
       misrepresent the very thing being chosen. */
    .liquifyFontItem.isSelected { background: var(--liquify-glow-accent); }
    /* !important and at class specificity, so a chosen body font \u2014 which sets
       its own !important rule over the whole app \u2014 cannot repaint the previews
       in itself. The variable is set per row. */
    .liquifyFontName,
    .liquifyFontPreview {
      font-family: var(--liquify-preview-font) !important;
    }
    .liquifyFontName { font-size: 13px; font-weight: 700; line-height: 1.3; }
    .liquifyFontPreview {
      font-size: 12px;
      opacity: 0.66;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .liquifyFontEmpty { padding: 10px; font-size: 12px; opacity: 0.6; text-align: center; }
    /* Same height as a real row, so nothing shifts when they are replaced. */
    .liquifyFontSkeleton { pointer-events: none; opacity: 0.35; }

    /* ---- Background image library ---- */
    /* A click-catcher, and nothing more. It used to dim the page, which is what
       made the panel read as a black box: backdrop-filter samples whatever is
       painted behind the element, so a dark sheet directly underneath is all
       the glass had left to refract. Transparent, the real UI is the backdrop
       and the panel is glass like every other surface. */
    .liquifyLibraryScrim {
      position: fixed;
      inset: 0;
      /* Above .liquifySectionNavScrollBtn (1000002), which is portalled to
         <body> for the panel behind and would otherwise sit on top of the
         pictures \u2014 glass and all. Hidden outright below, but the ordering
         matters for anything else in that band. */
      z-index: 1000003;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* The settings panel's carousel arrows belong to the panel, not to this. */
    html.liquify-library-open .liquifySectionNavScrollBtn { display: none; }
    .liquifyLibrary {
      --glass-filter: url(#glass-filter--r1-7);
      /* Wide enough for three tiles at their minimum, two on a small window. */
      width: min(820px, calc(100vw - 60px));
      max-height: min(640px, calc(100vh - 80px));
      display: flex;
      flex-direction: column;
      border-radius: 17px;
      overflow: hidden;
      background: transparent;
      /* Darkened to match the settings panel and its dropdowns \u2014 over a bright
         wallpaper the glass alone leaves the text washed out. */
      backdrop-filter: var(--glass-filter) blur(5px) brightness(0.8);
      -webkit-backdrop-filter: var(--glass-filter) blur(5px) brightness(0.8);
      box-shadow: var(--liquify-shadow);
      color: white;
    }
    .liquifyLibraryHead {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
    }
    .liquifyLibraryTitle { font-size: 14px; font-weight: 700; flex: 1 1 auto; }
    .liquifyLibraryGrid {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: clip;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
      align-items: start;
      /* Room for the hover scale to grow into without being clipped. */
      padding: 4px 12px 14px;
    }
    .liquifyLibraryTile {
      position: relative;
      /* 16:9 as a percentage of the tile's own width, and deliberately not
         aspect-ratio. On a grid item that ratio has to be transferred into the
         row's size, and here it was not: the rows came out shorter than the
         tiles standing in them, so the pictures overlapped once there were
         enough to need a second row. A percentage padding resolves against the
         inline size, which the column track has already made definite, so the
         height is settled before rows are sized at all. height:0 keeps the
         content box empty, and also stops any stretch from applying. */
      height: 0;
      padding-top: 56.25%;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      box-shadow: var(--liquify-shadow);
      background: rgba(255, 255, 255, 0.05);
      transition: transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1);
    }
    /* Driven by the same hover state as the remove button rather than by
       :hover \u2014 the button is portalled out of the tile, so the pointer moving
       onto it counts as leaving, and the picture would drop its scale just as
       you reach for the X. */
    .liquifyLibraryTile.isHovered { transform: scale(1.02); }
    /* Absolute, because the tile's height is all padding \u2014 inset resolves
       against the padding box, so this fills it. */
    .liquifyLibraryTile img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    /* The chosen picture gets the accent as a ring drawn inside its own box, so
       the frame does not shift the tile or fight the rounded corners. */
    .liquifyLibraryTile.isSelected::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: inset 0 0 0 3px var(--liquify-glow-accent), var(--liquify-shadow);
    }
    /* Portalled beside the panel and laid over the tile by coordinates \u2014 the
       same trick the dropdown menus use, and here it is what makes the glass
       work at all. Nested in the tile it had nothing to refract: the panel's
       own backdrop-filter makes it a backdrop root, and the tile's hover scale
       composites its subtree, so the button sampled an empty layer and came out
       flat. Out here its backdrop is the page, cover and all. */
    .liquifyLibraryDelete {
      position: fixed;
      z-index: 1000004;
      width: 28px;
      height: 28px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      color: white;
      background: transparent;
      /* Blur and brightness only, no refraction: at 28px the lens distortion
         has nothing to bend and only muddies the X. The brightness lifts the
         button off dark artwork, which is most of it. */
      backdrop-filter: blur(6px) brightness(1.35);
      -webkit-backdrop-filter: blur(6px) brightness(1.35);
      box-shadow: var(--liquify-shadow);
      transition: background-color 0.2s ease,
                  transform 0.28s cubic-bezier(0.3, 2.25, 0.32, 1);
      animation: liquifyLibraryDeleteIn 160ms cubic-bezier(0.34, 1.7, 0.64, 1) both;
    }
    @keyframes liquifyLibraryDeleteIn {
      from { opacity: 0; transform: scale(0.7); }
      to { opacity: 1; transform: scale(1); }
    }
    /* Tinted rather than filled, so the glass survives the hover. */
    .liquifyLibraryDelete:hover { background: rgba(220, 60, 60, 0.45); }
    .liquifyLibraryDelete:active { transform: scale(0.86); }
    .liquifyLibraryDelete svg { width: 13px; height: 13px; }
    .liquifyLibraryEmpty {
      grid-column: 1 / -1;
      padding: 30px 10px;
      font-size: 12px;
      opacity: 0.6;
      text-align: center;
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
  var MENU_EXIT_MS = 180;
  function useMenuExit(open, setOpen) {
    const [closing, setClosing] = React.useState(false);
    const timer = React.useRef(0);
    React.useEffect(() => () => window.clearTimeout(timer.current), []);
    const requestClose = React.useCallback(() => {
      if (!open || closing) return;
      if (!isPopupBounceOn()) {
        setOpen(false);
        return;
      }
      setClosing(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setClosing(false);
        setOpen(false);
      }, MENU_EXIT_MS);
    }, [open, closing, setOpen]);
    React.useEffect(() => {
      if (open) return;
      window.clearTimeout(timer.current);
      setClosing(false);
    }, [open]);
    return { closing, requestClose };
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
  function FontPicker(props) {
    const btnRef = React.useRef(null);
    const menuRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    const [pos, setPos] = React.useState(null);
    const [query, setQuery] = React.useState("");
    const [category, setCategory] = React.useState("all");
    const [ready, setReady] = React.useState(false);
    const [scrollTop, setScrollTop] = React.useState(0);
    const [viewportHeight, setViewportHeight] = React.useState(240);
    const listRef = React.useRef(null);
    const catalogue = FONTS;
    const useLayout = React.useLayoutEffect || React.useEffect;
    const nestedMenus = {
      current: {
        contains: (node) => Array.from(document.querySelectorAll(".liquifySelectMenu")).some(
          (m2) => m2 !== menuRef.current && m2.contains(node)
        )
      }
    };
    const { closing, requestClose } = useMenuExit(open, setOpen);
    useOutsideClick(open, requestClose, [btnRef, menuRef, nestedMenus]);
    React.useEffect(() => {
      if (!open) {
        setReady(false);
        return;
      }
      const id = requestAnimationFrame(() => {
        setReady(true);
        const el = listRef.current;
        if (!el) return;
        const height = el.clientHeight;
        setViewportHeight(height);
        const index = rows.findIndex((f2) => f2.family === props.value);
        const top = index > 0 ? Math.max(0, index * ROW_HEIGHT - height / 2 + ROW_HEIGHT / 2) : 0;
        el.scrollTop = top;
        setScrollTop(top);
      });
      return () => cancelAnimationFrame(id);
    }, [open]);
    useLayout(() => {
      if (!open) return;
      const body = btnRef.current?.closest?.(".liquifySettingsPanel")?.querySelector?.(".liquifySettingsBody");
      if (!body) return;
      body.classList.add("isDropdownOpen");
      return () => {
        body.classList.remove("isDropdownOpen");
      };
    }, [open]);
    useLayout(() => {
      if (!open) {
        setPos(null);
        return;
      }
      const recalc = () => {
        const btn = btnRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const panel = btn.closest?.(".liquifySettingsPanel");
        const body = panel?.querySelector?.(".liquifySettingsBody") ?? null;
        const bounds = body?.getBoundingClientRect ? body.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
        const inView = r.bottom > bounds.top + 4 && r.top < bounds.bottom - 4;
        if (!inView) {
          setPos(null);
          setOpen(false);
          return;
        }
        const width = Math.min(300, Math.max(0, bounds.right - bounds.left - 16));
        const top = r.bottom + 6;
        let left = r.right - width;
        left = Math.min(Math.max(left, bounds.left + 8), bounds.right - width - 8);
        const maxHeight = Math.max(180, Math.min(320, bounds.bottom - top - 8));
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
    const needle = query.trim().toLowerCase();
    const shown = catalogue.filter(
      (f2) => (category === "all" || f2.category === category) && (!needle || f2.family.toLowerCase().includes(needle))
    );
    const rows = [{ family: FONT_DEFAULT, category: "" }, ...shown];
    const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const last = Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);
    const windowRows = rows.slice(first, last);
    React.useEffect(() => {
      setScrollTop(0);
      if (listRef.current) listRef.current.scrollTop = 0;
    }, [query, category]);
    React.useEffect(() => {
      if (open && ready) loadFontPreviews(windowRows.map((f2) => f2.family));
    }, [open, ready, first, last, query, category]);
    const onListScroll = (e) => {
      const el = e.currentTarget;
      setScrollTop(el.scrollTop);
      if (el.clientHeight !== viewportHeight) setViewportHeight(el.clientHeight);
    };
    const pick = (family) => {
      requestClose();
      props.onChange(family);
    };
    const menu = open && pos ? /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: menuRef,
        className: `liquifySelectMenu liquifyFontMenu${closing ? " isClosing" : ""}`,
        style: { left: `${pos.left}px`, top: `${pos.top}px`, width: `${pos.width}px`, maxHeight: `${pos.maxHeight}px` }
      },
      /* @__PURE__ */ React.createElement("div", { className: "liquifyFontTop" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          className: "liquifyControlSurface liquifyFontSearch",
          placeholder: "Search fonts...",
          value: query,
          autoFocus: true,
          onChange: (e) => setQuery(e.target.value)
        }
      ), /* @__PURE__ */ React.createElement(
        Select,
        {
          value: category,
          onChange: setCategory,
          options: [
            { value: "all", label: "All" },
            ...FONT_CATEGORIES.map((c2) => ({
              value: c2,
              label: c2.charAt(0).toUpperCase() + c2.slice(1)
            }))
          ]
        }
      )),
      /* @__PURE__ */ React.createElement("div", { className: "liquifyFontList", ref: listRef, onScroll: onListScroll }, !ready && Array.from({ length: 6 }).map((_2, i2) => /* @__PURE__ */ React.createElement("div", { className: "liquifyFontItem liquifyFontSkeleton", style: { top: i2 * ROW_HEIGHT }, key: `skeleton-${i2}` }, /* @__PURE__ */ React.createElement("div", { className: "liquifyFontName" }, "\xA0"), /* @__PURE__ */ React.createElement("div", { className: "liquifyFontPreview" }, "\xA0"))), ready && // Full height for the scrollbar to work against, with only the
      // window's rows inside it, each placed at its own offset.
      /* @__PURE__ */ React.createElement("div", { className: "liquifyFontRunway", style: { height: `${rows.length * ROW_HEIGHT}px` } }, windowRows.map((f2, i2) => {
        const isDefault = f2.family === FONT_DEFAULT;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: f2.family,
            className: `liquifyFontItem${props.value === f2.family ? " isSelected" : ""}`,
            style: {
              top: `${(first + i2) * ROW_HEIGHT}px`,
              ["--liquify-preview-font"]: isDefault ? SPOTIFY_STACK : `"${f2.family}"`
            },
            onClick: () => pick(f2.family)
          },
          /* @__PURE__ */ React.createElement("div", { className: "liquifyFontName" }, isDefault ? "Spotify default" : f2.family),
          /* @__PURE__ */ React.createElement("div", { className: "liquifyFontPreview" }, "The quick brown fox")
        );
      })), ready && shown.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "liquifyFontEmpty" }, "No fonts found"))
    ) : null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: btnRef,
        type: "button",
        className: `liquifyControlSurface liquifySelectBtn${open && !closing ? " isOpen" : ""}`,
        onClick: () => {
          if (open) {
            requestClose();
            return;
          }
          setPos(null);
          setOpen(true);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "liquifySelectLabel" }, props.value === FONT_DEFAULT ? "Spotify default" : props.value),
      /* @__PURE__ */ React.createElement("span", { className: "liquifySelectChevron", "aria-hidden": "true" })
    ), menu && (ReactDOM?.createPortal ? ReactDOM.createPortal(menu, document.body) : menu));
  }
  function BackgroundLibrary(props) {
    const [items, setItems] = React.useState([]);
    const [selected, setSelected] = React.useState(
      () => localStorage.getItem(LIBRARY_SELECTED_KEY) || ""
    );
    const fileRef = React.useRef(null);
    const cardRef = React.useRef(null);
    const gridRef = React.useRef(null);
    const [hover, setHover] = React.useState(null);
    const hoverRef = React.useRef("");
    hoverRef.current = hover?.id || "";
    const { closing, requestClose } = useMenuExit(props.open, (v2) => {
      if (!v2) props.onClose();
    });
    const reload = React.useCallback(() => {
      void listImages().then(setItems);
    }, []);
    React.useEffect(() => {
      if (props.open) reload();
    }, [props.open, reload]);
    const urls = React.useMemo(
      () => items.map((item) => URL.createObjectURL(item.blob)),
      [items]
    );
    React.useEffect(
      () => () => {
        for (const url of urls) URL.revokeObjectURL(url);
      },
      [urls]
    );
    React.useEffect(() => {
      if (!props.open) return;
      const onKey = (ev) => {
        if (ev.key === "Escape") {
          ev.stopPropagation();
          requestClose();
        }
      };
      document.addEventListener("keydown", onKey, true);
      return () => document.removeEventListener("keydown", onKey, true);
    }, [props.open, requestClose]);
    React.useEffect(() => {
      if (!props.open) return;
      let frame = 0;
      const onMove = (ev) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const grid = gridRef.current;
          if (!grid) return;
          const inside = (r) => ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
          if (!inside(grid.getBoundingClientRect())) {
            setHover(null);
            return;
          }
          const tiles = Array.from(grid.querySelectorAll(".liquifyLibraryTile"));
          const current = tiles.filter((el) => el.dataset.id === hoverRef.current);
          for (const el of [...current, ...tiles]) {
            const r = el.getBoundingClientRect();
            if (!inside(r)) continue;
            setHover({ id: el.dataset.id, top: r.top, right: r.right });
            return;
          }
          setHover(null);
        });
      };
      document.addEventListener("mousemove", onMove);
      return () => {
        document.removeEventListener("mousemove", onMove);
        cancelAnimationFrame(frame);
      };
    }, [props.open]);
    React.useEffect(() => {
      if (props.open) return;
      setHover(null);
    }, [props.open]);
    React.useEffect(() => {
      const on = props.open || closing;
      document.documentElement.classList.toggle("liquify-library-open", on);
      return () => document.documentElement.classList.remove("liquify-library-open");
    }, [props.open, closing]);
    if (!props.open && !closing) return null;
    const choose = (id) => {
      setSelected(id);
      selectImage(id);
    };
    const modal = /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "liquifyLibraryScrim",
        onMouseDown: (e) => {
          if (!cardRef.current?.contains(e.target)) requestClose();
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: `liquifyLibrary${closing ? " isClosing" : ""}`, ref: cardRef }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLibraryHead" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLibraryTitle" }, props.labels.title), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "liquifyControlSurface liquifyActionBtn",
          onClick: () => fileRef.current?.click()
        },
        props.labels.add
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "liquifyControlSurface liquifyHeaderActionBtn liquifyCloseBtn",
          "aria-label": props.labels.close,
          onClick: requestClose
        },
        /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M5 5 19 19" }), /* @__PURE__ */ React.createElement("path", { d: "M19 5 5 19" }))
      ), /* @__PURE__ */ React.createElement(
        "input",
        {
          ref: fileRef,
          type: "file",
          accept: "image/*",
          multiple: true,
          style: { display: "none" },
          onChange: async (e) => {
            const input = e.target;
            const files = Array.from(input.files || []);
            if (!files.length) return;
            await addImages(files);
            input.value = "";
            const next = await listImages();
            setItems(next);
            if (!localStorage.getItem(LIBRARY_SELECTED_KEY) && next[0]) choose(next[0].id);
          }
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "liquifyLibraryGrid", ref: gridRef, onScroll: () => setHover(null) }, items.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "liquifyLibraryEmpty" }, props.labels.empty), items.map((item, i2) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: item.id,
          "data-id": item.id,
          className: "liquifyLibraryTile" + (item.id === selected ? " isSelected" : "") + (item.id === hover?.id ? " isHovered" : ""),
          title: item.name,
          onClick: () => choose(item.id)
        },
        /* @__PURE__ */ React.createElement("img", { src: urls[i2], alt: item.name })
      ))))
    );
    const removeButton = hover && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "liquifyLibraryDelete",
        "aria-label": props.labels.remove,
        style: { top: `${hover.top + 7}px`, left: `${hover.right - 35}px` },
        onClick: async (e) => {
          e.stopPropagation();
          const id = hover.id;
          setHover(null);
          await deleteImage(id);
          if (id === selected) setSelected(localStorage.getItem(LIBRARY_SELECTED_KEY) || "");
          reload();
        }
      },
      /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M5 5 19 19" }), /* @__PURE__ */ React.createElement("path", { d: "M19 5 5 19" }))
    );
    const tree = /* @__PURE__ */ React.createElement(React.Fragment, null, modal, removeButton);
    return ReactDOM?.createPortal ? ReactDOM.createPortal(tree, document.body) : tree;
  }
  function Select(props) {
    const btnRef = React.useRef(null);
    const menuRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    const [pos, setPos] = React.useState(null);
    const useLayout = React.useLayoutEffect || React.useEffect;
    const { closing, requestClose } = useMenuExit(open, setOpen);
    useOutsideClick(open, requestClose, [btnRef, menuRef]);
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
        className: `liquifySelectMenu${closing ? " isClosing" : ""}`,
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
          className: `liquifySelectItem${o.value === props.value ? " isSelected" : ""}`,
          onClick: () => {
            requestClose();
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
        className: `liquifyControlSurface liquifySelectBtn${open && !closing ? " isOpen" : ""}`,
        onClick: () => {
          if (open) {
            requestClose();
            return;
          }
          setPos(null);
          setOpen(true);
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
    "liquify-language",
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
    "liquify-hires-cover",
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
    PLAYER_ICONS_KEY,
    ...Object.values(SIDEBARS).flatMap((spec) => [spec.key, spec.amountKey]),
    LOCAL_FILES_TRANSPARENT_KEY,
    FONT_BODY_KEY,
    FONT_HEADING_KEY,
    VINYL_SPEED_KEY,
    ...Object.values(VINYL_SURFACES).map((spec) => spec.key),
    BG_ENGINE_KEY,
    ...Object.values(KAWARP_KEYS),
    // liquify-bg-blur / -brightness are already in PLAIN_KEYS; the set below adds
    // the per-engine values without having to repeat them by hand.
    ...Object.values(BG_SURFACES).flatMap((spec) => [spec.blurKey, spec.brightnessKey])
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
    const [languageMode, setLanguageModeState] = React.useState(getLanguageMode());
    const languageCode = getEffectiveLanguage();
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
        /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M15 5 8 12l7 7" }))
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
        /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M9 5l7 7-7 7" }))
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
    const [hiResCover, setHiResCoverState] = React.useState(() => isHiResCoverOn());
    const [kawarp, setKawarpState] = React.useState(() => {
      const initial = {};
      for (const key of Object.keys(KAWARP_KEYS)) {
        initial[key] = readNum(KAWARP_KEYS[key], KAWARP_DEFAULTS[key]);
      }
      return initial;
    });
    const applyKawarp = (key, value) => {
      setKawarpState((prev) => ({ ...prev, [key]: value }));
      setKawarpValue(key, value);
    };
    const animatedActive = bgMode === "animated" || bgCustomAnimated === "on" && (bgMode === "custom" || bgMode === "url" || bgMode === "playlist");
    const [bgAppearance, setBgAppearance] = React.useState(readAllBackgroundAppearance);
    const [bgEngine, setBgEngineState] = React.useState(getBgEngine());
    const bgSurface = !animatedActive ? "static" : bgEngine === "tiles" ? "tiles" : "kawarp";
    const [sidebarBlur, setSidebarBlurState] = React.useState(() => {
      const initial = {};
      for (const side of Object.keys(SIDEBARS)) {
        initial[side] = { on: isSidebarBlurOn(side), amount: readSidebarBlurAmount(side) };
      }
      return initial;
    });
    const applySidebarBlur = (side, patch) => {
      setSidebarBlurState((prev) => ({
        ...prev,
        [side]: { ...prev[side], ...patch }
      }));
      if (patch.on !== void 0) setSidebarBlur(side, patch.on ? "on" : "off");
      if (patch.amount !== void 0) setSidebarBlurAmount(side, patch.amount);
    };
    const [localFilesTransparent, setLocalFilesTransparentState] = React.useState(readLS(LOCAL_FILES_TRANSPARENT_KEY, "off"));
    const [vinyl, setVinylState] = React.useState(() => {
      const initial = {};
      for (const surface of Object.keys(VINYL_SURFACES)) initial[surface] = isVinylOn(surface);
      return initial;
    });
    const [vinylSpeed, setVinylSpeedState] = React.useState(readNum(VINYL_SPEED_KEY, VINYL_SPEED_DEFAULT));
    const [bodyFont, setBodyFontState] = React.useState(readLS(FONT_BODY_KEY, FONT_DEFAULT));
    const [headingFont, setHeadingFontState] = React.useState(readLS(FONT_HEADING_KEY, FONT_DEFAULT));
    const applyVinyl = (surface, on) => {
      setVinylState((prev) => ({ ...prev, [surface]: on }));
      setVinyl(surface, on ? "on" : "off");
    };
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
    const artistFileRef = React.useRef(null);
    const [libraryOpen, setLibraryOpen] = React.useState(false);
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
      if (mode === "custom" && !getLibraryUrl()) setLibraryOpen(true);
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
    const applyAppearance = (surface, field, value) => {
      setBgAppearance((prev) => ({
        ...prev,
        [surface]: { ...prev[surface], [field]: value }
      }));
      setBackgroundAppearance(surface, field, value);
    };
    const appearanceRows = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.backgroundBlur), /* @__PURE__ */ React.createElement(
      Stepper,
      {
        value: bgAppearance[bgSurface].blur,
        min: 0,
        max: BG_BLUR_RANGE[bgSurface],
        onChange: (v2) => applyAppearance(bgSurface, "blur", v2)
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.backgroundBrightness || "Background Brightness:"), /* @__PURE__ */ React.createElement(
      Stepper,
      {
        value: bgAppearance[bgSurface].brightness,
        min: 0,
        max: 200,
        onChange: (v2) => applyAppearance(bgSurface, "brightness", v2)
      }
    )));
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
      localStorage.removeItem("liquify-bg-url");
      localStorage.setItem("liquify-bg-custom-animated", "off");
      setBgCustomAnimated("off");
      resetKawarpDefaults();
      setKawarpState({ ...KAWARP_DEFAULTS });
      resetBackgroundAppearance();
      setBgAppearance(readAllBackgroundAppearance());
      setBgEngineState("kawarp");
      setBgMode("dynamic");
      setBgUrl("");
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
      resetFonts();
      setBodyFontState(FONT_DEFAULT);
      setHeadingFontState(FONT_DEFAULT);
      resetVinyl();
      setVinylState({ npv: false, playbar: false, cinema: false });
      setVinylSpeedState(VINYL_SPEED_DEFAULT);
      resetSidebarBlur();
      setSidebarBlurState({
        left: { on: false, amount: SIDEBAR_BLUR_DEFAULT },
        right: { on: false, amount: SIDEBAR_BLUR_DEFAULT }
      });
      setLocalFilesTransparentState("off");
      setLocalFilesTransparent("off");
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
      /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M5 5 19 19" }), /* @__PURE__ */ React.createElement("path", { d: "M19 5 5 19" }))
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
      { id: "language", title: titles.language || "Language" },
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
    ))))), sectionNavScrollControls, /* @__PURE__ */ React.createElement("div", { className: "liquifySettingsBody", ref: bodyRef }, /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-language", title: titles.language || "Language" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.language || "Language:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.language })), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: languageMode === "auto" ? "auto" : "custom",
        options: [
          { value: "auto", label: t.languageOptions?.auto || "Follow Spotify" },
          { value: "custom", label: t.dropdown.custom }
        ],
        onChange: (v2) => {
          const next = v2 === "auto" ? "auto" : languageCode;
          setLanguageModeState(next);
          setLanguage(next);
        }
      }
    )), languageMode !== "auto" && /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.languageChoice || "Language:"), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: languageMode,
        options: getAvailableLanguages(),
        onChange: (v2) => {
          setLanguageModeState(v2);
          setLanguage(v2);
        }
      }
    ))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-accent", title: titles.accent }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.accentColor, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.accentColor })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRowControls" }, /* @__PURE__ */ React.createElement(
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
    ), bgMode === "custom" && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "liquifyControlSurface liquifyActionBtn",
        onClick: () => setLibraryOpen(true)
      },
      t.openLibrary || "Image Library"
    ), bgMode === "url" && /* @__PURE__ */ React.createElement(
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
    ))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.hiResCover || "Use hi-res pictures:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.hiResCover })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: hiResCover,
        onChange: (checked) => {
          setHiResCoverState(checked);
          setHiResCover(checked);
        }
      }
    )), (bgMode === "custom" || bgMode === "url" || bgMode === "playlist") && /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.animatedBackground || "Animated Background:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.animatedBackground })), /* @__PURE__ */ React.createElement(
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
    )), !animatedActive && appearanceRows, animatedActive && /* @__PURE__ */ React.createElement(SubSection, { title: sub.kawarp || "Animated Background" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.animatedEngine || "Engine:"), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: bgEngine,
        onChange: (v2) => {
          setBgEngineState(v2);
          setBgEngine(v2);
        },
        options: [
          { value: "kawarp", label: t.dropdown.engineKawarp || "Kawarp (WebGL)" },
          { value: "tiles", label: t.dropdown.engineTiles || "Classic" }
        ]
      }
    )), appearanceRows, bgEngine === "kawarp" && Object.keys(KAWARP_RANGES).map((key) => /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", key }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, (t.kawarp || {})[key] || key), /* @__PURE__ */ React.createElement(
      Stepper,
      {
        value: kawarp[key],
        min: KAWARP_RANGES[key].min,
        max: KAWARP_RANGES[key].max,
        onChange: (v2) => applyKawarp(key, v2)
      }
    )))), /* @__PURE__ */ React.createElement(
      BackgroundLibrary,
      {
        open: libraryOpen,
        onClose: () => setLibraryOpen(false),
        labels: {
          title: t.imageLibrary || "Image Library",
          add: t.addImages || "Add images",
          empty: t.libraryEmpty || "No images yet. Add some to get started.",
          remove: t.removeImage || "Remove",
          close: t.close || "Close"
        }
      }
    )), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-artist", title: titles.artist }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.apbackground, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.artistBackground })), /* @__PURE__ */ React.createElement("div", { className: "liquifyStackedControls" }, /* @__PURE__ */ React.createElement(
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
    } }))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.sidebars || "Sidebars" }, Object.keys(SIDEBARS).map((side) => /* @__PURE__ */ React.createElement(React.Fragment, { key: side }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.[side === "left" ? "leftSidebarBlur" : "rightSidebarBlur"] || (side === "left" ? "Blur Behind Left Sidebar:" : "Blur Behind Right Sidebar:"), /* @__PURE__ */ React.createElement(HelpTip, { text: tips.sidebarBlur })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: sidebarBlur[side].on,
        onChange: (checked) => applySidebarBlur(side, { on: checked })
      }
    )), sidebarBlur[side].on && /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.[side === "left" ? "leftSidebarBlurAmount" : "rightSidebarBlurAmount"] || (side === "left" ? "Left Sidebar Blur (px):" : "Right Sidebar Blur (px):")), /* @__PURE__ */ React.createElement(
      Stepper,
      {
        value: sidebarBlur[side].amount,
        min: 0,
        max: 80,
        onChange: (v2) => applySidebarBlur(side, { amount: v2 })
      }
    )))), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.localFilesTransparent || "Transparent Local Files Card:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.localFilesTransparent })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: localFilesTransparent === "on",
        onChange: (checked) => {
          const v2 = checked ? "on" : "off";
          setLocalFilesTransparentState(v2);
          setLocalFilesTransparent(v2);
        }
      }
    ))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.typography || "Typography" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.bodyFont || "Body Font:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.bodyFont })), /* @__PURE__ */ React.createElement(FontPicker, { value: bodyFont, onChange: (v2) => {
      setBodyFontState(v2);
      setFont("body", v2);
    } })), /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.ui?.headingFont || "Heading Font:", /* @__PURE__ */ React.createElement(HelpTip, { text: tips.headingFont })), /* @__PURE__ */ React.createElement(FontPicker, { value: headingFont, onChange: (v2) => {
      setHeadingFontState(v2);
      setFont("heading", v2);
    } }))), /* @__PURE__ */ React.createElement(SubSection, { title: sub.vinyl || "Vinyl Cover Art" }, Object.keys(VINYL_SURFACES).map((surface) => /* @__PURE__ */ React.createElement("div", { className: "liquifyRow", key: surface }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, (t.vinyl || {})[surface] || surface, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.vinyl })), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: vinyl[surface],
        onChange: (checked) => applyVinyl(surface, checked)
      }
    ))), Object.keys(VINYL_SURFACES).some((s2) => vinyl[s2]) && /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, (t.vinyl || {}).speed || "Seconds Per Turn:"), /* @__PURE__ */ React.createElement(
      Stepper,
      {
        value: vinylSpeed,
        min: 1,
        max: 60,
        onChange: (v2) => {
          setVinylSpeedState(v2);
          setVinylSpeed(v2);
        }
      }
    )))), /* @__PURE__ */ React.createElement(Section, { id: "liquify-sec-player", title: titles.player }, /* @__PURE__ */ React.createElement(SubSection, { title: sub.sizeShape || "Size & Shape" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyRow" }, /* @__PURE__ */ React.createElement("div", { className: "liquifyLabel" }, t.playerWidth, /* @__PURE__ */ React.createElement(HelpTip, { text: tips.playerWidth })), /* @__PURE__ */ React.createElement(
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
      window.addEventListener("liquifyLanguageChanged", handler);
      return () => {
        window.removeEventListener("liquifyConfigApplied", handler);
        window.removeEventListener("liquifyLanguageChanged", handler);
      };
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
    ensureLibraryApplied();
    applySavedBackground();
    ensurePlayerApplied();
    ensureTransparentControlsApplied();
    ensureBackgroundAppearanceApplied();
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
    ensureSidebarBlurApplied();
    ensureFontsApplied();
    ensureVinylApplied();
    ensureLocalFilesTransparentApplied();
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
  var DARKENED = {
    ".liquifySettingsPanel": 0.8,
    ".liquifySelectMenu": 0.8
  };
  var BULK_TARGETS = GLASS_TARGETS.filter((t) => !preciseSelectors.has(t.selector)).map((t) => {
    const gb = t.options?.glassBlur;
    return {
      selector: t.selector,
      blur: gb ? parseInt(gb, 10) : void 0,
      before: t.options?.applyTo === "before" ? true : void 0,
      brightness: DARKENED[t.selector]
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
