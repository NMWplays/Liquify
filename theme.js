(()=>{(()=>{let S="liquify-glass-target-style",h="liquify-glass-filters",A=[{selector:".main-trackList-trackListHeader",options:{borderRadius:20}},{selector:".main-topBar-background",options:{borderRadius:0}},{selector:".znOINyqAy7ivIGbQyrbt",options:{borderRadius:20}},{selector:".iGRaSZDa1r0m21aF6oZq",options:{borderRadius:20}},{selector:".niJOWstqVyfckHcXQxP1 .cSZJwcwYgJfwduUmXOOV",options:{borderRadius:20}},{selector:".main-nowPlayingView-trackInfo",options:{borderRadius:20}},{selector:".main-nowPlayingView-section",options:{borderRadius:20}},{selector:".main-entityHeader-container.gmKBgPCnX785KDicbdJu",options:{borderRadius:20}},{selector:".main-home-filterChipsSection",options:{borderRadius:20}}],C={borderWidth:.07,brightness:50,opacity:.93,blur:11,displace:.2,distortionScale:-80,redOffset:0,greenOffset:6,blueOffset:10,xChannel:"R",yChannel:"G",mixBlendMode:"screen"},E=new WeakMap,M=0;function $(){if(document.getElementById(S))return;let t=document.createElement("style");t.id=S,t.textContent=`
      .liquify-glass-target {
                backdrop-filter: var(--glass-filter) blur(2px) !important;
                -webkit-backdrop-filter: var(--glass-filter) blur(2px) !important;
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
0 0 0 1 0`),l.setAttribute("result","green");let u=document.createElementNS("http://www.w3.org/2000/svg","feDisplacementMap");u.setAttribute("in","SourceGraphic"),u.setAttribute("in2","map"),u.setAttribute("result","dispBlue");let g=document.createElementNS("http://www.w3.org/2000/svg","feColorMatrix");g.setAttribute("in","dispBlue"),g.setAttribute("type","matrix"),g.setAttribute("values",`0 0 0 0 0
0 0 0 0 0
0 0 1 0 0
0 0 0 1 0`),g.setAttribute("result","blue");let p=document.createElementNS("http://www.w3.org/2000/svg","feBlend");p.setAttribute("in","red"),p.setAttribute("in2","green"),p.setAttribute("mode","screen"),p.setAttribute("result","rg");let f=document.createElementNS("http://www.w3.org/2000/svg","feBlend");f.setAttribute("in","rg"),f.setAttribute("in2","blue"),f.setAttribute("mode","screen"),f.setAttribute("result","output");let v=document.createElementNS("http://www.w3.org/2000/svg","feGaussianBlur");return v.setAttribute("in","output"),e.appendChild(n),e.appendChild(o),e.appendChild(s),e.appendChild(a),e.appendChild(l),e.appendChild(u),e.appendChild(g),e.appendChild(p),e.appendChild(f),e.appendChild(v),t.appendChild(e),{filter:e,feImage:n,feDispRed:o,feDispGreen:a,feDispBlue:u,feGaussian:v}}function b(t,r){let e=r.distortionScale+r.redOffset,n=r.distortionScale+r.greenOffset,o=r.distortionScale+r.blueOffset;t.feDispRed.setAttribute("scale",e.toString()),t.feDispGreen.setAttribute("scale",n.toString()),t.feDispBlue.setAttribute("scale",o.toString()),[t.feDispRed,t.feDispGreen,t.feDispBlue].forEach(s=>{s.setAttribute("xChannelSelector",r.xChannel),s.setAttribute("yChannelSelector",r.yChannel)}),t.feGaussian.setAttribute("stdDeviation",r.displace.toString())}function d(t,r){if(!t||E.has(t))return;let n=I().querySelector("defs"),o=`glass-filter--r1-${M++}`,s={...C,...r,filterId:o},a=w(n,s);b(a,s);let l=0,u=0,g=()=>{let f=t.getBoundingClientRect();if(!f.width||!f.height||f.width===l&&f.height===u)return;l=f.width,u=f.height;let v=i(f,s);a.feImage.setAttribute("href",v),a.feImage.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",v),a.feImage.setAttribute("width","100%"),a.feImage.setAttribute("height","100%")};g();let p=new ResizeObserver(()=>{requestAnimationFrame(g)});p.observe(t),t.classList.add("liquify-glass-target"),t.style.setProperty("--glass-filter",`url(#${o})`),t.style.backdropFilter="var(--glass-filter) blur(2px) !important",t.style.webkitBackdropFilter="var(--glass-filter) blur(2px) !important",t.style.boxShadow="var(--glass-shadow) !important",typeof s.borderRadius=="number"&&(t.style.borderRadius=`${s.borderRadius}px`),E.set(t,{options:s,nodes:a,resizeObserver:p})}function y(){A.forEach(({selector:t,options:r})=>{document.querySelectorAll(t).forEach(e=>d(e,r))})}$(),y(),new MutationObserver(()=>{y()}).observe(document.body,{childList:!0,subtree:!0})})();(async function(){for(;!Spicetify?.Player||!Spicetify?.Player?.data;)await new Promise(d=>setTimeout(d,300));let S=document.querySelector(".Root__top-container");if(!S)return;let h=document.createElement("div"),A=document.createElement("div");h.classList.add("glowify-bg-layer","layer-a"),A.classList.add("glowify-bg-layer","layer-b"),S.prepend(h,A);let C=!0,E=null,M=null,$=null;function I(){let d=Spicetify.Player?.data?.item?.metadata?.image_url;return d?d.replace("spotify:image:","https://i.scdn.co/image/"):null}function i(d){return new Promise(y=>{if(!d)return y("rgb(30,215,96)");let c=new Image;c.crossOrigin="Anonymous",c.src=d,c.onload=()=>{let t=document.createElement("canvas");t.width=c.width,t.height=c.height;let r=t.getContext("2d");r.drawImage(c,0,0);let e=r.getImageData(0,0,c.width,c.height).data,n=0,o=0,s=0,a=0;for(let l=0;l<e.length;l+=4)n+=e[l],o+=e[l+1],s+=e[l+2],a++;y(`rgb(${Math.round(n/a)},${Math.round(o/a)},${Math.round(s/a)})`)},c.onerror=()=>y("rgb(30,215,96)")})}function w(d,y=1.7,c=1.1){let[t,r,e]=d.match(/\d+/g).map(Number),n=t/255,o=r/255,s=e/255,a=Math.max(n,o,s),l=Math.min(n,o,s),u,g,p=(a+l)/2;if(a===l)u=g=0;else{let m=a-l;switch(g=p>.5?m/(2-a-l):m/(a+l),a){case n:u=(o-s)/m+(o<s?6:0);break;case o:u=(s-n)/m+2;break;case s:u=(n-o)/m+4;break}u/=6}g=Math.min(g*y,1),p=Math.min(p*c,1);function f(m,R,x){return x<0&&(x+=1),x>1&&(x-=1),x<1/6?m+(R-m)*6*x:x<1/2?R:x<2/3?m+(R-m)*(2/3-x)*6:m}let v,k,B;if(g===0)v=k=B=p;else{let m=p<.5?p*(1+g):p+g-p*g,R=2*p-m;v=f(R,m,u+1/3),k=f(R,m,u),B=f(R,m,u-1/3)}return`rgb(${Math.round(v*255)},${Math.round(k*255)},${Math.round(B*255)})`}async function b(){let d=localStorage.getItem("glowify-bg-mode")||"dynamic",y=localStorage.getItem("glowify-bg-image"),c=I();if(!(d!==M||y!==E)&&!(c!==$))return;M=d,E=y,$=c;let e;if(d==="custom"&&y?(e=y,h.style.backgroundImage=`url("${e}")`,A.style.backgroundImage=`url("${e}")`,h.classList.add("active"),A.classList.remove("active")):c&&(e=c,C?(h.style.backgroundImage=`url("${e}")`,h.classList.add("active"),A.classList.remove("active")):(A.style.backgroundImage=`url("${e}")`,A.classList.add("active"),h.classList.remove("active")),C=!C),c){let n=await i(c),o=w(n,1.7,1.1);document.documentElement.style.setProperty("--accent-color",o)}}b(),Spicetify.Player.addEventListener("songchange",b),window.addEventListener("glowifyBackgroundChange",b),setInterval(b,500)})();(()=>{let S="liquify-popup-bounce-style";if(!document.getElementById(S)){let i=document.createElement("style");i.id=S,i.textContent=`
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
  `;function E(i,w){i&&w?.id!=="liquify-settings-btn"&&(i.classList.remove("popup-bounce"),i.offsetWidth,i.classList.add("popup-bounce"),i.addEventListener("animationend",()=>{i.classList.remove("popup-bounce")},{once:!0}))}function M(i){if(!i)return!1;let w=getComputedStyle(i);return w.display==="none"||w.visibility==="hidden"||w.opacity==="0"?!1:i.offsetParent!==null}function $(){document.querySelectorAll(C).forEach(i=>{let w=!!A.get(i),b=M(i);!w&&b&&E(i),A.set(i,b)})}new MutationObserver(i=>{for(let w of i)if(w.attributeName==="aria-expanded"){let b=w.target,d=b.getAttribute("aria-expanded");if(h.get(b)==="false"&&d==="true"){let c=b.parentElement?.querySelector(C);E(c,b)}h.set(b,d)}requestAnimationFrame($)}).observe(document.body,{subtree:!0,attributes:!0,childList:!0,attributeFilter:["aria-expanded","style","class"]}),document.querySelectorAll("[aria-expanded]").forEach(i=>{h.set(i,i.getAttribute("aria-expanded"))}),$()})();})();
