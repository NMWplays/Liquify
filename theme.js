(()=>{(()=>{let S="liquify-glass-target-style",h="liquify-glass-filters",v=[{selector:".main-trackList-trackListHeader",options:{borderRadius:20}},{selector:".main-topBar-background",options:{borderRadius:0}},{selector:".znOINyqAy7ivIGbQyrbt",options:{borderRadius:20,blur:5}},{selector:".iGRaSZDa1r0m21aF6oZq",options:{borderRadius:20}},{selector:".niJOWstqVyfckHcXQxP1 .cSZJwcwYgJfwduUmXOOV",options:{borderRadius:20}},{selector:".main-nowPlayingView-trackInfo",options:{borderRadius:20}},{selector:".main-nowPlayingView-section",options:{borderRadius:20}},{selector:".main-entityHeader-container.gmKBgPCnX785KDicbdJu",options:{borderRadius:20}},{selector:".main-home-filterChipsSection",options:{borderRadius:20}},{selector:".view-homeShortcutsGrid-shortcut",options:{borderRadius:20}},{selector:".main-card-card",options:{borderRadius:20}},{selector:".Root__globalNav .DoxYADBBjYMvoYwl7QPg",options:{borderRadius:50}},{selector:".yfJeY2Xi99dPOe6fsIha",options:{borderRadius:20}}],C={borderWidth:.07,brightness:50,opacity:.93,blur:2,displace:.2,distortionScale:-80,redOffset:0,greenOffset:6,blueOffset:10,xChannel:"R",yChannel:"G",mixBlendMode:"screen"},R=new WeakMap,M=0;function E(){if(document.getElementById(S))return;let t=document.createElement("style");t.id=S,t.textContent=`
      .liquify-glass-target {
                backdrop-filter: var(--glass-filter) blur(var(--glass-blur)) !important;
                -webkit-backdrop-filter: var(--glass-filter) blur(var(--glass-blur)) !important;
                box-shadow: var(--glass-shadow) !important;
      }
    `,document.head.appendChild(t)}function I(){let t=document.getElementById(h);if(t)return t;t=document.createElementNS("http://www.w3.org/2000/svg","svg"),t.setAttribute("id",h),t.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink"),t.setAttribute("width","0"),t.setAttribute("height","0"),t.setAttribute("aria-hidden","true"),t.style.position="fixed",t.style.left="-9999px",t.style.top="-9999px",t.style.pointerEvents="none";let r=document.createElementNS("http://www.w3.org/2000/svg","defs");return t.appendChild(r),document.body.appendChild(t),t}function i(t,r){let e=t?.width||400,n=t?.height||200,o=r.borderRadius??0,s=Math.min(e,n)*(r.borderWidth*.5),a=`red-grad-${r.filterId}`,l=`blue-grad-${r.filterId}`,u=`
      <svg viewBox="0 0 ${e} ${n}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${a}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${l}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${e}" height="${n}" fill="black"></rect>
        <rect x="0" y="0" width="${e}" height="${n}" rx="${o}" fill="url(#${a})" />
        <rect x="0" y="0" width="${e}" height="${n}" rx="${o}" fill="url(#${l})" style="mix-blend-mode: ${r.mixBlendMode}" />
        <rect x="${s}" y="${s}" width="${e-s*2}" height="${n-s*2}" rx="${o}" fill="hsl(0 0% ${r.brightness}% / ${r.opacity})" style="filter:blur(${r.blur}px)" />
      </svg>
    `;return`data:image/svg+xml,${encodeURIComponent(u)}`}function w(t,r){let e=document.createElementNS("http://www.w3.org/2000/svg","filter");e.setAttribute("id",r.filterId),e.setAttribute("color-interpolation-filters","sRGB"),e.setAttribute("x","0%"),e.setAttribute("y","0%"),e.setAttribute("width","100%"),e.setAttribute("height","100%");let n=document.createElementNS("http://www.w3.org/2000/svg","feImage");n.setAttribute("x","0"),n.setAttribute("y","0"),n.setAttribute("width","100%"),n.setAttribute("height","100%"),n.setAttribute("preserveAspectRatio","none"),n.setAttribute("result","map");let o=document.createElementNS("http://www.w3.org/2000/svg","feDisplacementMap");o.setAttribute("in","SourceGraphic"),o.setAttribute("in2","map"),o.setAttribute("result","dispRed");let s=document.createElementNS("http://www.w3.org/2000/svg","feColorMatrix");s.setAttribute("in","dispRed"),s.setAttribute("type","matrix"),s.setAttribute("values",`1 0 0 0 0
0 0 0 0 0
0 0 0 0 0
0 0 0 1 0`),s.setAttribute("result","red");let a=document.createElementNS("http://www.w3.org/2000/svg","feDisplacementMap");a.setAttribute("in","SourceGraphic"),a.setAttribute("in2","map"),a.setAttribute("result","dispGreen");let l=document.createElementNS("http://www.w3.org/2000/svg","feColorMatrix");l.setAttribute("in","dispGreen"),l.setAttribute("type","matrix"),l.setAttribute("values",`0 0 0 0 0
0 1 0 0 0
0 0 0 0 0
0 0 0 1 0`),l.setAttribute("result","green");let u=document.createElementNS("http://www.w3.org/2000/svg","feDisplacementMap");u.setAttribute("in","SourceGraphic"),u.setAttribute("in2","map"),u.setAttribute("result","dispBlue");let p=document.createElementNS("http://www.w3.org/2000/svg","feColorMatrix");p.setAttribute("in","dispBlue"),p.setAttribute("type","matrix"),p.setAttribute("values",`0 0 0 0 0
0 0 0 0 0
0 0 1 0 0
0 0 0 1 0`),p.setAttribute("result","blue");let g=document.createElementNS("http://www.w3.org/2000/svg","feBlend");g.setAttribute("in","red"),g.setAttribute("in2","green"),g.setAttribute("mode","screen"),g.setAttribute("result","rg");let b=document.createElementNS("http://www.w3.org/2000/svg","feBlend");b.setAttribute("in","rg"),b.setAttribute("in2","blue"),b.setAttribute("mode","screen"),b.setAttribute("result","output");let A=document.createElementNS("http://www.w3.org/2000/svg","feGaussianBlur");return A.setAttribute("in","output"),e.appendChild(n),e.appendChild(o),e.appendChild(s),e.appendChild(a),e.appendChild(l),e.appendChild(u),e.appendChild(p),e.appendChild(g),e.appendChild(b),e.appendChild(A),t.appendChild(e),{filter:e,feImage:n,feDispRed:o,feDispGreen:a,feDispBlue:u,feGaussian:A}}function m(t,r){let e=r.distortionScale+r.redOffset,n=r.distortionScale+r.greenOffset,o=r.distortionScale+r.blueOffset;t.feDispRed.setAttribute("scale",e.toString()),t.feDispGreen.setAttribute("scale",n.toString()),t.feDispBlue.setAttribute("scale",o.toString()),[t.feDispRed,t.feDispGreen,t.feDispBlue].forEach(s=>{s.setAttribute("xChannelSelector",r.xChannel),s.setAttribute("yChannelSelector",r.yChannel)}),t.feGaussian.setAttribute("stdDeviation",r.displace.toString())}function d(t,r){if(!t||R.has(t))return;let n=I().querySelector("defs"),o=`glass-filter--r1-${M++}`,s={...C,...r,filterId:o},a=w(n,s);m(a,s);let l=0,u=0,p=()=>{let b=t.getBoundingClientRect();if(!b.width||!b.height||b.width===l&&b.height===u)return;l=b.width,u=b.height;let A=i(b,s);a.feImage.setAttribute("href",A),a.feImage.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",A),a.feImage.setAttribute("width","100%"),a.feImage.setAttribute("height","100%")};p();let g=new ResizeObserver(()=>{requestAnimationFrame(p)});g.observe(t),t.classList.add("liquify-glass-target"),t.style.setProperty("--glass-filter",`url(#${o})`),t.style.setProperty("--glass-blur",`${s.blur??2}px`),t.style.backdropFilter="var(--glass-filter) blur(var(--glass-blur)) !important",t.style.webkitBackdropFilter="var(--glass-filter) blur(var(--glass-blur)) !important",t.style.boxShadow="var(--glass-shadow) !important",typeof s.borderRadius=="number"&&(t.style.borderRadius=`${s.borderRadius}px`),R.set(t,{options:s,nodes:a,resizeObserver:g})}function y(){v.forEach(({selector:t,options:r})=>{document.querySelectorAll(t).forEach(e=>d(e,r))})}E(),y(),new MutationObserver(()=>{y()}).observe(document.body,{childList:!0,subtree:!0})})();(async function(){for(;!Spicetify?.Player||!Spicetify?.Player?.data;)await new Promise(d=>setTimeout(d,300));let S=document.querySelector(".Root__top-container");if(!S)return;let h=document.createElement("div"),v=document.createElement("div");h.classList.add("glowify-bg-layer","layer-a"),v.classList.add("glowify-bg-layer","layer-b"),S.prepend(h,v);let C=!0,R=null,M=null,E=null;function I(){let d=Spicetify.Player?.data?.item?.metadata?.image_url;return d?d.replace("spotify:image:","https://i.scdn.co/image/"):null}function i(d){return new Promise(y=>{if(!d)return y("rgb(30,215,96)");let c=new Image;c.crossOrigin="Anonymous",c.src=d,c.onload=()=>{let t=document.createElement("canvas");t.width=c.width,t.height=c.height;let r=t.getContext("2d");r.drawImage(c,0,0);let e=r.getImageData(0,0,c.width,c.height).data,n=0,o=0,s=0,a=0;for(let l=0;l<e.length;l+=4)n+=e[l],o+=e[l+1],s+=e[l+2],a++;y(`rgb(${Math.round(n/a)},${Math.round(o/a)},${Math.round(s/a)})`)},c.onerror=()=>y("rgb(30,215,96)")})}function w(d,y=1.7,c=1.1){let[t,r,e]=d.match(/\d+/g).map(Number),n=t/255,o=r/255,s=e/255,a=Math.max(n,o,s),l=Math.min(n,o,s),u,p,g=(a+l)/2;if(a===l)u=p=0;else{let f=a-l;switch(p=g>.5?f/(2-a-l):f/(a+l),a){case n:u=(o-s)/f+(o<s?6:0);break;case o:u=(s-n)/f+2;break;case s:u=(n-o)/f+4;break}u/=6}p=Math.min(p*y,1),g=Math.min(g*c,1);function b(f,$,x){return x<0&&(x+=1),x>1&&(x-=1),x<1/6?f+($-f)*6*x:x<1/2?$:x<2/3?f+($-f)*(2/3-x)*6:f}let A,B,k;if(p===0)A=B=k=g;else{let f=g<.5?g*(1+p):g+p-g*p,$=2*g-f;A=b($,f,u+1/3),B=b($,f,u),k=b($,f,u-1/3)}return`rgb(${Math.round(A*255)},${Math.round(B*255)},${Math.round(k*255)})`}async function m(){let d=localStorage.getItem("glowify-bg-mode")||"dynamic",y=localStorage.getItem("glowify-bg-image"),c=I();if(!(d!==M||y!==R)&&!(c!==E))return;M=d,R=y,E=c;let e;if(d==="custom"&&y?(e=y,h.style.backgroundImage=`url("${e}")`,v.style.backgroundImage=`url("${e}")`,h.classList.add("active"),v.classList.remove("active")):c&&(e=c,C?(h.style.backgroundImage=`url("${e}")`,h.classList.add("active"),v.classList.remove("active")):(v.style.backgroundImage=`url("${e}")`,v.classList.add("active"),h.classList.remove("active")),C=!C),c){let n=await i(c),o=w(n,1.7,1.1);document.documentElement.style.setProperty("--accent-color",o)}}m(),Spicetify.Player.addEventListener("songchange",m),window.addEventListener("glowifyBackgroundChange",m),setInterval(m,500)})();(()=>{let S="liquify-popup-bounce-style";if(!document.getElementById(S)){let i=document.createElement("style");i.id=S,i.textContent=`
      @keyframes popupBounce {
        0%   { transform: scale(0.85); }
        40%  { transform: scale(1.05); }
        60%  { transform: scale(0.98); }
        80%  { transform: scale(1.02); }
        100% { transform: scale(1); }
      }

      .popup-bounce {
        animation: popupBounce 300ms cubic-bezier(.22,.9,.3,1) forwards;
        transform-origin: top center;
      }

      .main-contextMenu-menu::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        z-index: -1;
        box-shadow: var(--glass-shadow);
        backdrop-filter: var(--glass-filter) blur(5px);
        --glass-filter: url(#glass-filter--r1-7);
      }
    `,document.head.appendChild(i)}let h=new WeakMap,v=new WeakMap,C=`
    .main-contextMenu-menu,
    .jHt3xA6ovwVKkMJKqOhO,
    .HwAlGCDD0hvEKSl4MqyQ
  `;function R(i,w){i&&w?.id!=="liquify-settings-btn"&&(i.classList.remove("popup-bounce"),i.offsetWidth,i.classList.add("popup-bounce"),i.addEventListener("animationend",()=>{i.classList.remove("popup-bounce")},{once:!0}))}function M(i){if(!i)return!1;let w=getComputedStyle(i);return w.display==="none"||w.visibility==="hidden"||w.opacity==="0"?!1:i.offsetParent!==null}function E(){document.querySelectorAll(C).forEach(i=>{let w=!!v.get(i),m=M(i);!w&&m&&R(i),v.set(i,m)})}new MutationObserver(i=>{for(let w of i)if(w.attributeName==="aria-expanded"){let m=w.target,d=m.getAttribute("aria-expanded");if(h.get(m)==="false"&&d==="true"){let c=m.parentElement?.querySelector(C);R(c,m)}h.set(m,d)}requestAnimationFrame(E)}).observe(document.body,{subtree:!0,attributes:!0,childList:!0,attributeFilter:["aria-expanded","style","class"]}),document.querySelectorAll("[aria-expanded]").forEach(i=>{h.set(i,i.getAttribute("aria-expanded"))}),E()})();})();
