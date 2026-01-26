(()=>{(()=>{let S="liquify-glass-target-style",h="liquify-glass-filters",A=[{selector:".main-trackList-trackListHeader",options:{borderRadius:20}},{selector:".main-topBar-background",options:{borderRadius:0}},{selector:".znOINyqAy7ivIGbQyrbt",options:{borderRadius:20}},{selector:".iGRaSZDa1r0m21aF6oZq",options:{borderRadius:20}},{selector:".niJOWstqVyfckHcXQxP1 .cSZJwcwYgJfwduUmXOOV",options:{borderRadius:20}},{selector:".main-nowPlayingView-trackInfo",options:{borderRadius:20}},{selector:".main-nowPlayingView-section",options:{borderRadius:20}},{selector:".main-entityHeader-container.gmKBgPCnX785KDicbdJu",options:{borderRadius:20}},{selector:".main-home-filterChipsSection",options:{borderRadius:20}},{selector:".view-homeShortcutsGrid-shortcut",options:{borderRadius:20}},{selector:".main-card-card",options:{borderRadius:20}},{selector:".Root__globalNav .DoxYADBBjYMvoYwl7QPg",options:{borderRadius:50}},{selector:".yfJeY2Xi99dPOe6fsIha",options:{borderRadius:20}}],C={borderWidth:.07,brightness:50,opacity:.93,blur:11,displace:.2,distortionScale:-80,redOffset:0,greenOffset:6,blueOffset:10,xChannel:"R",yChannel:"G",mixBlendMode:"screen"},R=new WeakMap,M=0;function E(){if(document.getElementById(S))return;let t=document.createElement("style");t.id=S,t.textContent=`
      .liquify-glass-target {
                backdrop-filter: var(--glass-filter) blur(2px) !important;
                -webkit-backdrop-filter: var(--glass-filter) blur(2px) !important;
                box-shadow: var(--glass-shadow) !important;
      }
    `,document.head.appendChild(t)}function I(){let t=document.getElementById(h);if(t)return t;t=document.createElementNS("http://www.w3.org/2000/svg","svg"),t.setAttribute("id",h),t.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink"),t.setAttribute("width","0"),t.setAttribute("height","0"),t.setAttribute("aria-hidden","true"),t.style.position="fixed",t.style.left="-9999px",t.style.top="-9999px",t.style.pointerEvents="none";let r=document.createElementNS("http://www.w3.org/2000/svg","defs");return t.appendChild(r),document.body.appendChild(t),t}function i(t,r){let e=t?.width||400,s=t?.height||200,a=r.borderRadius??0,n=Math.min(e,s)*(r.borderWidth*.5),o=`red-grad-${r.filterId}`,l=`blue-grad-${r.filterId}`,d=`
      <svg viewBox="0 0 ${e} ${s}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${o}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${l}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${e}" height="${s}" fill="black"></rect>
        <rect x="0" y="0" width="${e}" height="${s}" rx="${a}" fill="url(#${o})" />
        <rect x="0" y="0" width="${e}" height="${s}" rx="${a}" fill="url(#${l})" style="mix-blend-mode: ${r.mixBlendMode}" />
        <rect x="${n}" y="${n}" width="${e-n*2}" height="${s-n*2}" rx="${a}" fill="hsl(0 0% ${r.brightness}% / ${r.opacity})" style="filter:blur(${r.blur}px)" />
      </svg>
    `;return`data:image/svg+xml,${encodeURIComponent(d)}`}function w(t,r){let e=document.createElementNS("http://www.w3.org/2000/svg","filter");e.setAttribute("id",r.filterId),e.setAttribute("color-interpolation-filters","sRGB"),e.setAttribute("x","0%"),e.setAttribute("y","0%"),e.setAttribute("width","100%"),e.setAttribute("height","100%");let s=document.createElementNS("http://www.w3.org/2000/svg","feImage");s.setAttribute("x","0"),s.setAttribute("y","0"),s.setAttribute("width","100%"),s.setAttribute("height","100%"),s.setAttribute("preserveAspectRatio","none"),s.setAttribute("result","map");let a=document.createElementNS("http://www.w3.org/2000/svg","feDisplacementMap");a.setAttribute("in","SourceGraphic"),a.setAttribute("in2","map"),a.setAttribute("result","dispRed");let n=document.createElementNS("http://www.w3.org/2000/svg","feColorMatrix");n.setAttribute("in","dispRed"),n.setAttribute("type","matrix"),n.setAttribute("values",`1 0 0 0 0
0 0 0 0 0
0 0 0 0 0
0 0 0 1 0`),n.setAttribute("result","red");let o=document.createElementNS("http://www.w3.org/2000/svg","feDisplacementMap");o.setAttribute("in","SourceGraphic"),o.setAttribute("in2","map"),o.setAttribute("result","dispGreen");let l=document.createElementNS("http://www.w3.org/2000/svg","feColorMatrix");l.setAttribute("in","dispGreen"),l.setAttribute("type","matrix"),l.setAttribute("values",`0 0 0 0 0
0 1 0 0 0
0 0 0 0 0
0 0 0 1 0`),l.setAttribute("result","green");let d=document.createElementNS("http://www.w3.org/2000/svg","feDisplacementMap");d.setAttribute("in","SourceGraphic"),d.setAttribute("in2","map"),d.setAttribute("result","dispBlue");let g=document.createElementNS("http://www.w3.org/2000/svg","feColorMatrix");g.setAttribute("in","dispBlue"),g.setAttribute("type","matrix"),g.setAttribute("values",`0 0 0 0 0
0 0 0 0 0
0 0 1 0 0
0 0 0 1 0`),g.setAttribute("result","blue");let p=document.createElementNS("http://www.w3.org/2000/svg","feBlend");p.setAttribute("in","red"),p.setAttribute("in2","green"),p.setAttribute("mode","screen"),p.setAttribute("result","rg");let f=document.createElementNS("http://www.w3.org/2000/svg","feBlend");f.setAttribute("in","rg"),f.setAttribute("in2","blue"),f.setAttribute("mode","screen"),f.setAttribute("result","output");let v=document.createElementNS("http://www.w3.org/2000/svg","feGaussianBlur");return v.setAttribute("in","output"),e.appendChild(s),e.appendChild(a),e.appendChild(n),e.appendChild(o),e.appendChild(l),e.appendChild(d),e.appendChild(g),e.appendChild(p),e.appendChild(f),e.appendChild(v),t.appendChild(e),{filter:e,feImage:s,feDispRed:a,feDispGreen:o,feDispBlue:d,feGaussian:v}}function b(t,r){let e=r.distortionScale+r.redOffset,s=r.distortionScale+r.greenOffset,a=r.distortionScale+r.blueOffset;t.feDispRed.setAttribute("scale",e.toString()),t.feDispGreen.setAttribute("scale",s.toString()),t.feDispBlue.setAttribute("scale",a.toString()),[t.feDispRed,t.feDispGreen,t.feDispBlue].forEach(n=>{n.setAttribute("xChannelSelector",r.xChannel),n.setAttribute("yChannelSelector",r.yChannel)}),t.feGaussian.setAttribute("stdDeviation",r.displace.toString())}function u(t,r){if(!t||R.has(t))return;let s=I().querySelector("defs"),a=`glass-filter--r1-${M++}`,n={...C,...r,filterId:a},o=w(s,n);b(o,n);let l=0,d=0,g=()=>{let f=t.getBoundingClientRect();if(!f.width||!f.height||f.width===l&&f.height===d)return;l=f.width,d=f.height;let v=i(f,n);o.feImage.setAttribute("href",v),o.feImage.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",v),o.feImage.setAttribute("width","100%"),o.feImage.setAttribute("height","100%")};g();let p=new ResizeObserver(()=>{requestAnimationFrame(g)});p.observe(t),t.classList.add("liquify-glass-target"),t.style.setProperty("--glass-filter",`url(#${a})`),t.style.backdropFilter="var(--glass-filter) blur(2px) !important",t.style.webkitBackdropFilter="var(--glass-filter) blur(2px) !important",t.style.boxShadow="var(--glass-shadow) !important",typeof n.borderRadius=="number"&&(t.style.borderRadius=`${n.borderRadius}px`),R.set(t,{options:n,nodes:o,resizeObserver:p})}function y(){A.forEach(({selector:t,options:r})=>{document.querySelectorAll(t).forEach(e=>u(e,r))})}E(),y(),new MutationObserver(()=>{y()}).observe(document.body,{childList:!0,subtree:!0})})();(async function(){for(;!Spicetify?.Player||!Spicetify?.Player?.data;)await new Promise(u=>setTimeout(u,300));let S=document.querySelector(".Root__top-container");if(!S)return;let h=document.createElement("div"),A=document.createElement("div");h.classList.add("glowify-bg-layer","layer-a"),A.classList.add("glowify-bg-layer","layer-b"),S.prepend(h,A);let C=!0,R=null,M=null,E=null;function I(){let u=Spicetify.Player?.data?.item?.metadata?.image_url;return u?u.replace("spotify:image:","https://i.scdn.co/image/"):null}function i(u){return new Promise(y=>{if(!u)return y("rgb(30,215,96)");let c=new Image;c.crossOrigin="Anonymous",c.src=u,c.onload=()=>{let t=document.createElement("canvas");t.width=c.width,t.height=c.height;let r=t.getContext("2d");r.drawImage(c,0,0);let e=r.getImageData(0,0,c.width,c.height).data,s=0,a=0,n=0,o=0;for(let l=0;l<e.length;l+=4)s+=e[l],a+=e[l+1],n+=e[l+2],o++;y(`rgb(${Math.round(s/o)},${Math.round(a/o)},${Math.round(n/o)})`)},c.onerror=()=>y("rgb(30,215,96)")})}function w(u,y=1.7,c=1.1){let[t,r,e]=u.match(/\d+/g).map(Number),s=t/255,a=r/255,n=e/255,o=Math.max(s,a,n),l=Math.min(s,a,n),d,g,p=(o+l)/2;if(o===l)d=g=0;else{let m=o-l;switch(g=p>.5?m/(2-o-l):m/(o+l),o){case s:d=(a-n)/m+(a<n?6:0);break;case a:d=(n-s)/m+2;break;case n:d=(s-a)/m+4;break}d/=6}g=Math.min(g*y,1),p=Math.min(p*c,1);function f(m,$,x){return x<0&&(x+=1),x>1&&(x-=1),x<1/6?m+($-m)*6*x:x<1/2?$:x<2/3?m+($-m)*(2/3-x)*6:m}let v,B,k;if(g===0)v=B=k=p;else{let m=p<.5?p*(1+g):p+g-p*g,$=2*p-m;v=f($,m,d+1/3),B=f($,m,d),k=f($,m,d-1/3)}return`rgb(${Math.round(v*255)},${Math.round(B*255)},${Math.round(k*255)})`}async function b(){let u=localStorage.getItem("glowify-bg-mode")||"dynamic",y=localStorage.getItem("glowify-bg-image"),c=I();if(!(u!==M||y!==R)&&!(c!==E))return;M=u,R=y,E=c;let e;if(u==="custom"&&y?(e=y,h.style.backgroundImage=`url("${e}")`,A.style.backgroundImage=`url("${e}")`,h.classList.add("active"),A.classList.remove("active")):c&&(e=c,C?(h.style.backgroundImage=`url("${e}")`,h.classList.add("active"),A.classList.remove("active")):(A.style.backgroundImage=`url("${e}")`,A.classList.add("active"),h.classList.remove("active")),C=!C),c){let s=await i(c),a=w(s,1.7,1.1);document.documentElement.style.setProperty("--accent-color",a)}}b(),Spicetify.Player.addEventListener("songchange",b),window.addEventListener("glowifyBackgroundChange",b),setInterval(b,500)})();(()=>{let S="liquify-popup-bounce-style";if(!document.getElementById(S)){let i=document.createElement("style");i.id=S,i.textContent=`
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
    `,document.head.appendChild(i)}let h=new WeakMap,A=new WeakMap,C=`
    .main-contextMenu-menu,
    .jHt3xA6ovwVKkMJKqOhO,
    .HwAlGCDD0hvEKSl4MqyQ
  `;function R(i,w){i&&w?.id!=="liquify-settings-btn"&&(i.classList.remove("popup-bounce"),i.offsetWidth,i.classList.add("popup-bounce"),i.addEventListener("animationend",()=>{i.classList.remove("popup-bounce")},{once:!0}))}function M(i){if(!i)return!1;let w=getComputedStyle(i);return w.display==="none"||w.visibility==="hidden"||w.opacity==="0"?!1:i.offsetParent!==null}function E(){document.querySelectorAll(C).forEach(i=>{let w=!!A.get(i),b=M(i);!w&&b&&R(i),A.set(i,b)})}new MutationObserver(i=>{for(let w of i)if(w.attributeName==="aria-expanded"){let b=w.target,u=b.getAttribute("aria-expanded");if(h.get(b)==="false"&&u==="true"){let c=b.parentElement?.querySelector(C);R(c,b)}h.set(b,u)}requestAnimationFrame(E)}).observe(document.body,{subtree:!0,attributes:!0,childList:!0,attributeFilter:["aria-expanded","style","class"]}),document.querySelectorAll("[aria-expanded]").forEach(i=>{h.set(i,i.getAttribute("aria-expanded"))}),E()})();})();
