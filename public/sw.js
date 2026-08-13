const SW_VERSION = "onrol-pwa-v32";
const APP_SHELL_CACHE = `${SW_VERSION}-shell`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const APP_SHELL = [
  "/",
  "/index.html",
  "/task",
  "/task/app",
  "/admin/dashboard",
  "/task/admin/institutions",
  "/admin/settings/automation",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isApiRequest =
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/functions/");

  if (isApiRequest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => (await caches.match(request)) || new Response(null, { status: 503, statusText: "Offline" }))
    );
    return;
  }

  if (request.mode === "navigate") {
    // Always network-first for HTML navigation — never serve stale HTML that
    // would reference outdated JS chunk hashes and cause blank/crash pages.
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => response)
        .catch(async () => (await caches.match("/offline.html")) || new Response("Offline", { status: 503 }))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    const isHashed = /\/assets\/.*\.[a-f0-9]{8,}\.(js|css)$/.test(url.pathname);
    if (isHashed) {
      // Hashed assets: cache-first (hash guarantees freshness)
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
            return response;
          });
        })
      );
    } else {
      // Unhashed assets (icons, manifests, sw.js itself): network-first
      event.respondWith(
        fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        }).catch(async () => (await caches.match(request)) || new Response(null, { status: 404 }))
      );
    }
  }
});

// ─── Message handler ────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  // Show an incoming-call system notification (sent by the app when it receives
  // a call-invite via Supabase Realtime). This ensures the notification appears
  // even when the device screen is off or the app is backgrounded.
  if (msg.type === "SHOW_CALL_NOTIFICATION") {
    const { callerName, callType, conversationId } = msg;
    event.waitUntil(
      self.registration.showNotification(`📞 Incoming ${callType} call`, {
        body: `${callerName} is calling you`,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: `call-${conversationId}`,
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          { action: "accept", title: "✅ Accept" },
          { action: "decline", title: "❌ Decline" },
        ],
        data: {
          type: "call",
          conversationId,
          callType,
          url: "/task/app",
        },
      })
    );
    return;
  }

  // Dismiss call notification once the call is answered/rejected in-app
  if (msg.type === "DISMISS_CALL_NOTIFICATION") {
    const { conversationId } = msg;
    event.waitUntil(
      self.registration.getNotifications({ tag: `call-${conversationId}` }).then((notifs) => {
        notifs.forEach((n) => n.close());
      })
    );
    return;
  }

  // Show a generic in-app notification as a system notification
  if (msg.type === "SHOW_NOTIFICATION") {
    const { title, body, url = "/task/app", tag = "onrol-notif", icon = "/icons/icon-192.png" } = msg;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon,
        badge: "/icons/icon-192.png",
        tag,
        data: { url },
        vibrate: [200, 100, 200],
      })
    );
    return;
  }
});

// ─── Push (server-sent push) ─────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let payload = {
    title: "ONROL Task Manager",
    body: "You have a new reminder.",
    url: "/task/app",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "onrol-push",
    type: "general",
    conversationId: null,
    callType: null,
    callerName: null,
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const isCall = payload.type === "call";
  const notifOptions = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    renotify: true,
    requireInteraction: isCall,
    silent: false,
    vibrate: isCall ? [300, 100, 300, 100, 300] : [200, 100, 200],
    data: { url: payload.url, type: payload.type, conversationId: payload.conversationId },
    ...(isCall
      ? {
          actions: [
            { action: "accept", title: "✅ Accept" },
            { action: "decline", title: "❌ Decline" },
          ],
        }
      : {}),
  };

  event.waitUntil(self.registration.showNotification(payload.title, notifOptions));
});

// ─── Notification click handler ──────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action;
  let targetUrl = data.url || "/task/app";

  if (data.type === "call") {
    if (action === "accept") {
      targetUrl = `/task/app?call_action=accept&cid=${data.conversationId || ""}`;
    } else if (action === "decline") {
      targetUrl = `/task/app?call_action=decline&cid=${data.conversationId || ""}`;
    } else {
      targetUrl = "/task/app";
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientPath = new URL(client.url).pathname;
        if (clientPath.startsWith("/task") || clientPath.startsWith("/admin")) {
          // Post the action to the app so it can handle accept/decline
          if (data.type === "call" && action) {
            client.postMessage({ type: "CALL_NOTIFICATION_ACTION", action, conversationId: data.conversationId });
          }
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      self.clients.openWindow(targetUrl);
    })
  );
});

// ─── Notification close handler ──────────────────────────────────────────────
self.addEventListener("notificationclose", (event) => {
  const data = event.notification.data || {};
  if (data.type === "call") {
    // Tell the app the user dismissed the call notification (= decline)
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: "CALL_NOTIFICATION_DISMISSED", conversationId: data.conversationId });
      }
    });
  }
});
