// Service worker do sistema CRAS: deixa a página abrir mesmo sem internet.
// Coloque este arquivo na MESMA pasta do HTML (o site precisa ser http/https).
const C = 'cras-app-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return; // Supabase passa direto
  e.respondWith((async () => {
    const c = await caches.open(C);
    const rede = fetch(r).then((x) => { if (x.ok) c.put(r, x.clone()); return x; });
    try { return await Promise.race([rede, new Promise((_, no) => setTimeout(no, 4000))]); }  // rede lenta: usa a cópia guardada
    catch (_) { return (await c.match(r, { ignoreSearch: true })) || rede.catch(() => new Response('Sem conexão', { status: 503 })); }
  })());
});
