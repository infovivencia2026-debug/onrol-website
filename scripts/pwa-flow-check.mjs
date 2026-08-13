import { chromium } from "@playwright/test";

const baseUrl = process.env.PWA_BASE_URL || "http://127.0.0.1:4173";

const results = {
  baseUrl,
  installSignals: {},
  offline: {},
  push: {},
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/task`, { waitUntil: "networkidle", timeout: 45000 });

  results.installSignals.manifestLinked = await page.evaluate(() => {
    const manifest = document.querySelector('link[rel="manifest"]');
    return Boolean(manifest && manifest.getAttribute("href"));
  });

  const manifestResponse = await page.request.get(`${baseUrl}/manifest.webmanifest`);
  results.installSignals.manifestStatus = manifestResponse.status();
  if (manifestResponse.ok()) {
    const manifest = await manifestResponse.json();
    results.installSignals.manifestFields = {
      hasName: Boolean(manifest.name),
      hasShortName: Boolean(manifest.short_name),
      hasStartUrl: Boolean(manifest.start_url),
      hasDisplay: Boolean(manifest.display),
      hasThemeColor: Boolean(manifest.theme_color),
      hasBackgroundColor: Boolean(manifest.background_color),
      iconCount: Array.isArray(manifest.icons) ? manifest.icons.length : 0,
    };
  }

  const swState = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return { supported: false, count: 0, scope: null };
    await new Promise((r) => setTimeout(r, 1500));
    const regs = await navigator.serviceWorker.getRegistrations();
    return { supported: true, count: regs.length, scope: regs[0]?.scope || null };
  });
  results.installSignals.serviceWorker = swState;

  const icons = [192, 512].map((s) => `${baseUrl}/icons/icon-${s}.png`);
  const iconStatuses = {};
  for (const iconUrl of icons) {
    const r = await page.request.get(iconUrl);
    iconStatuses[iconUrl] = r.status();
  }
  results.installSignals.iconStatuses = iconStatuses;

  await page.goto(`${baseUrl}/task/app`, { waitUntil: "networkidle", timeout: 45000 });
  await context.setOffline(true);
  try {
    await page.goto(`${baseUrl}/task/app`, { waitUntil: "domcontentloaded", timeout: 12000 });
    const bodyText = await page.locator("body").innerText();
    results.offline.navigationLoaded = true;
    results.offline.usedOfflineFallback = bodyText.toLowerCase().includes("you are offline");
  } catch (err) {
    results.offline.navigationLoaded = false;
    results.offline.error = String(err);
  } finally {
    await context.setOffline(false);
  }

  const subscribeEndpoint = await page.request.post(`${baseUrl}/api/push/subscribe`, {
    data: { subscription: { endpoint: "test" } },
  });
  results.push.subscribeEndpointStatus = subscribeEndpoint.status();

  const sendEndpoint = await page.request.post(`${baseUrl}/api/push/send-test`, { data: {} });
  results.push.sendTestEndpointStatus = sendEndpoint.status();
} catch (e) {
  results.error = String(e);
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
