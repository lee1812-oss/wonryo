// 빵을그리다 주문 앱(바탕화면 설치용) — 주문서 화면만 맡음. 항상 인터넷에서 새로 받고, 끊겼을 때만 저장해 둔 화면을 보여 줌
const OC = 'bggd-order-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(OC).then(c => c.addAll(['./order.html', './order_192.png', './logo_mark.png'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('bggd-order-') === 0 && k !== OC).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || e.request.mode !== 'navigate') return;   // 중계·사진 요청은 손대지 않음
  e.respondWith(fetch(new Request(e.request.url, { cache: 'no-store' })).then(r => { const cp = r.clone(); caches.open(OC).then(c => c.put('./order.html', cp)); return r; })
    .catch(() => caches.match('./order.html')));
});
