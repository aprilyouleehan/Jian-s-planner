// 지안이 플래너: 한 번 열면 인터넷 없이도 열리게 저장해 둔다
const C="jian-26e97c0651";
const CORE=["./","index.html","assets.js","icon.png","icon-192.png","manifest.json"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
function put(req,res){ if(res && (res.ok || res.type==="opaque")){ const cp=res.clone(); caches.open(C).then(c=>c.put(req,cp)); } return res; }
function timeout(ms){ return new Promise((_,rej)=>setTimeout(()=>rej(new Error("slow")),ms)); }
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const u=new URL(req.url);
  const font=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(u.origin!==location.origin && !font) return;
  if(font){ e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>put(req,res)))); return; }
  const page=req.mode==="navigate" || u.pathname.endsWith("/") || u.pathname.endsWith("index.html");
  if(page){ // 화면 코드: 인터넷이 되면 새것, 안 되거나 느리면 저장해 둔 것
    e.respondWith(Promise.race([fetch(req).then(res=>put(req,res)),timeout(4000)]).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match("index.html")).then(r=>r||fetch(req))));
    return;
  }
  // 그림·소리: 저장해 둔 것을 바로 쓰고, 뒤에서 새것으로 바꿔 둔다
  e.respondWith(caches.match(req).then(r=>{ const net=fetch(req).then(res=>put(req,res)).catch(()=>r); return r||net; }));
});
