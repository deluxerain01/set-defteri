'use strict';
// Her yayın değişikliğinde v1 -> v2 -> v3 olarak artır.
// Scope içeren ad aynı origin'deki başka uygulamaların cache'ini silmez.
const PREFIX='set-defteri-'+self.registration.scope+'-';
const CACHE=PREFIX+'v1';
const FILES=['./','./index.html','./manifest.json'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(FILES);
    // skipWaiting yok: yeni sürüm açık sekmenin dosyalarını karıştırmaz.
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    // Yalnızca uygulama kabuğu önbellekte; kullanıcı verisi localStorage'da.
    const cached=await cache.match(event.request,{ignoreSearch:true});
    if(cached)return cached;
    try{return await fetch(event.request);}
    catch(err){
      if(event.request.mode==='navigate')return (await cache.match('./index.html'))||Response.error();
      return Response.error();
    }
  })());
});
