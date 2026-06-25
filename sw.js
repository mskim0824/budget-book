// 가계부 서비스워커 — 설치 가능(PWA) + 오프라인 캐시
// 같은 출처(우리 앱 파일)만 캐시. Firebase 등 외부 요청은 그대로 통과.
const CACHE = "budget-cache-v1";

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return; // 외부(Firebase/CDN)는 통과

  // 네트워크 우선 → 실패 시 캐시 (최신 반영 + 오프라인 대비)
  e.respondWith(
    fetch(req)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req))
  );
});
