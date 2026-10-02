// Service worker do sistema CRAS: deixa a página abrir mesmo sem internet.
// Coloque este arquivo na MESMA pasta do index.html (o site precisa ser http/https).
const C = 'cras-app-v2';
const RAIZ = self.registration.scope;

// Já guarda a página na instalação (antes, a 1ª visita ficava fora do cache)
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(C).then((c) => Promise.allSettled([c.add(RAIZ), c.add(RAIZ + 'index.html')])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return; // Supabase passa direto
  e.respondWith((async () => {
    const c = await caches.open(C);
    const rede = fetch(r).then((x) => { if (x.ok) c.put(r, x.clone()); return x; });
    try { return await Promise.race([rede, new Promise((_, no) => setTimeout(no, 4000))]); } // rede lenta: usa a cópia guardada
    catch (_) {
      const guardado = (await c.match(r, { ignoreSearch: true })) || (r.mode === 'navigate' && (await c.match(RAIZ) || await c.match(RAIZ + 'index.html')));
      return guardado || rede.catch(() => new Response('Sem conexão e a página ainda não foi guardada. Abra uma vez com internet.', { status: 503 }));
    }
  })());
});
