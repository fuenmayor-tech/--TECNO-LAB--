/* TECNO LAB · Service worker: permite usar la app sin internet.
   · index.html y lo básico se guardan al instalar.
   · Los modelos 3D (models/js) y las bibliotecas (lib/) se guardan la primera vez que se usan
     o con el botón "Preparar sin internet". No se vuelven a descargar en cada visita.
   · El detector de manos (lib/mediapipe) se guarda aparte y se conserva entre versiones. */
const VERSION = 'tecnolab-v1.7.0';
const MP = 'tecnolab-mediapipe-0.4';
const KEEP = [VERSION, MP];
const CORE = ['index.html', 'manifest.webmanifest', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'models/modelos.json'];
const fijo = p => /\/(models\/js|lib)\//.test(p);          // no cambian dentro de una misma versión
const esMP = p => /\/lib\/mediapipe\//.test(p);
const esApp = p => /\/(index\.html)?$/.test(p);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !KEEP.includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function guardar(nombre, req, r) {
  if (r && r.ok && (r.type === 'basic' || r.type === 'default')) { const c = await caches.open(nombre); await c.put(req, r.clone()).catch(() => {}); }
  return r;
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Comprobaciones HEAD (por ejemplo, si existe lib/mediapipe): responde desde la caché si no hay red
  if (req.method === 'HEAD') {
    e.respondWith(fetch(req).catch(async () => (await caches.match(req.url, { ignoreMethod: true, ignoreSearch: true })) ? new Response(null, { status: 200 }) : new Response(null, { status: 404 })));
    return;
  }
  if (req.method !== 'GET') return;
  // La aplicación: primero la red (para recibir actualizaciones); sin red, la copia guardada
  if (req.mode === 'navigate') {
    if (!esApp(url.pathname)) { e.respondWith(fetch(req).catch(async () => (await caches.match(req, { ignoreSearch: true })) || Response.error())); return; }
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put('index.html', cp)).catch(() => {}); } return r; })
      .catch(async () => (await (await caches.open(VERSION)).match('index.html')) || (await caches.match('index.html')) || Response.error()));
    return;
  }
  // Modelos 3D y bibliotecas: de la caché si ya están; si no, se descargan una vez y se guardan
  if (fijo(url.pathname)) {
    const nombre = esMP(url.pathname) ? MP : VERSION;
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => guardar(nombre, req, r))));
    return;
  }
  // Lo demás (lista de modelos, iconos…): la copia guardada al instante y se actualiza en segundo plano
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => guardar(VERSION, req, r)).catch(() => hit || Response.error());
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
