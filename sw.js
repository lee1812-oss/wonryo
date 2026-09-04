// 원료수불부 오프라인 캐시 — index.html은 네트워크 우선(브라우저 HTTP 캐시 우회 → 최신 배포 즉시 반영), 실패 시 캐시
const CACHE = 'wonryo-v006';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './logo_192.png', './logo_512.png', './logo_apple.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate' || /index\.html$|\/$/.test(new URL(e.request.url).pathname);
  const req = isPage ? new Request(e.request.url, { cache: 'no-store' }) : e.request;
  e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
