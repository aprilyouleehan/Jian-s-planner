// 지안이 플래너: 한 번 열면 인터넷 없이도 열리게 저장해 둔다
const C="jian-9aaa764b3f";
const CORE=["index.html","assets.js?v=63fec1fc","icon.png","icon-192.png","manifest.json"];
self.addEventListener("install",e=>{ self.skipWaiting(); e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{}))))); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
function put(key,res){ try{ if(res && (res.ok || res.type==="opaque")){ const cp=res.clone(); caches.open(C).then(c=>c.put(key,cp)).catch(()=>{}); } }catch(e){} return res; }
function timeout(ms){ return new Promise((_,rej)=>setTimeout(()=>rej(new Error("slow")),ms)); }
// 화면 코드: 인터넷이 되면 새것, 안 되거나 느리면 저장해 둔 것. 어떤 경우에도 빈 화면이 되지 않게 끝까지 돌려준다
async function page(req){
  try{
    let res=await Promise.race([fetch(req.url,{cache:"no-store"}),timeout(6000)]);
    if(!res || !res.ok) throw new Error("bad");
    if(res.redirected) res=new Response(await res.blob(),{status:200,headers:{"Content-Type":"text/html; charset=utf-8"}});      // 사파리는 주소가 바뀐 응답을 화면으로 못 쓴다
    put("index.html",res); return res;
  }catch(e){
    const r=(await caches.match("index.html")) || (await caches.match("./"));
    if(r) return r;
    try{ return await fetch(req.url); }catch(e2){ return new Response("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'><body style='font-family:sans-serif;padding:40px 24px;text-align:center'>인터넷에 연결한 뒤 다시 열어 주세요.</body>",{headers:{"Content-Type":"text/html; charset=utf-8"}}); }
  }
}
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  let u; try{ u=new URL(req.url); }catch(x){ return; }
  const font=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(u.origin!==location.origin && !font) return;
  if(u.pathname.endsWith("sw.js")) return;
  if(font){ e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>put(req,res)))); return; }
  if(req.mode==="navigate" || u.pathname.endsWith("/") || u.pathname.endsWith("index.html")){ e.respondWith(page(req)); return; }
  // 그림·소리: 저장해 둔 것을 바로 쓰고, 뒤에서 새것으로 바꿔 둔다
  e.respondWith(caches.match(req).then(r=>{ const net=fetch(req).then(res=>put(req,res)); return r||net; }));
});
