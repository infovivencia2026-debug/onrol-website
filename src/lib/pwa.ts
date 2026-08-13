let swRegisterPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }

  // learn.onrol.in must NEVER run a service worker — a cached marketing SW there
  // intercepts /learn and serves the stale marketing shell (old UI + reload
  // loops). Actively unregister any existing SW and never register one.
  if (window.location.hostname === "learn.onrol.in") {
    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    if (window.caches?.keys) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
    return Promise.resolve(null);
  }

  // Avoid stale-cache routing issues while developing locally or in local preview.
  if (
    import.meta.env.DEV ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return Promise.resolve(null);
  }

  if (swRegisterPromise) return swRegisterPromise;

  const register = () =>
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration)
      .catch(() => null);

  swRegisterPromise =
    document.readyState === "complete"
      ? register()
      : new Promise<ServiceWorkerRegistration | null>((resolve) => {
          window.addEventListener("load", () => register().then(resolve), { once: true });
        });

  return swRegisterPromise;
}

export function isPwaInstallSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

export function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}
