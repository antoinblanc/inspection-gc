/* Service worker – Inspection GC Benban. Keeps the app usable without network. */
const VERSION='20261025-0120-8d4fcb';
const CACHE='inspection-gc-'+VERSION;
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('inspection-gc-')&&k!==CACHE&&k!=='inspection-gc-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // App files: answer from cache at once (works offline), refresh the cache in the background.
    e.respondWith(caches.open(CACHE).then(async c=>{
      const key=req.mode==='navigate'?'./index.html':req;
      const hit=await c.match(key,{ignoreSearch:true});
      const net=fetch(req).then(r=>{if(r&&r.ok)c.put(key,r.clone());return r;}).catch(()=>null);
      return hit||(await net)||new Response('Hors ligne',{status:503});
    }));
  } else if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.open('inspection-gc-fonts').then(async c=>{const hit=await c.match(req);if(hit)return hit;try{const r=await fetch(req);c.put(req,r.clone());return r;}catch(err){return new Response('',{status:503});}}));
  }
});
