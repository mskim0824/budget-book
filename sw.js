// 가계부 서비스워커 — 항상 최신 우선(네트워크), 오프라인 시 캐시
// 캐시 이름을 바꾸면 옛 캐시는 자동 삭제됨 (업데이트마다 숫자 올리기)
const CACHE = "budget-cache-v3";

self.addEventListener("install", (e) => { self.skipWaiting(); });

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return; // 외부(Firebase/CDN)는 통과

  // 항상 네트워크에서 새로 받음(브라우저 HTTP 캐시도 무시) → 실패하면 캐시
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: "no-store" });
      const cache = await caches.open(CACHE);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      return cached || Response.error();
    }
  })());
});
