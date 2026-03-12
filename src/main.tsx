import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  const { hostname, search, pathname, hash } = window.location;

  const hasLovableToken =
    search.includes("__lovable_token=") || search.includes("_lovable_token=");

  const isPreviewHost =
    hostname.includes("id-preview--") ||
    hostname.includes("preview--") ||
    hostname.endsWith(".lovableproject.com");

  const isLovablePreview = isPreviewHost || hasLovableToken;

  // Remove preview-only token params (backup — index.html does this earlier too)
  if (hasLovableToken) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("__lovable_token");
      url.searchParams.delete("_lovable_token");
      const cleanSearch = url.searchParams.toString();
      const cleanUrl = `${pathname}${cleanSearch ? `?${cleanSearch}` : ""}${hash}`;
      window.history.replaceState({}, "", cleanUrl);
    } catch (_) { /* ignore */ }
  }

  if ("serviceWorker" in navigator) {
    if (isLovablePreview) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
    } else {
      import("virtual:pwa-register").then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onRegisteredSW(_swUrl, registration) {
            if (registration) {
              setInterval(() => {
                registration.update();
              }, 60 * 1000);
            }
          },
        });
      });
    }
  }
} catch (e) {
  console.error('[main.tsx] Boot error:', e);
}

// Block right-click context menu on images globally
document.addEventListener('contextmenu', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'IMG' || target.closest('img')) {
    e.preventDefault();
  }
});

// Global error handler — show fallback if React fails to mount
window.addEventListener('error', (e) => {
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    console.error('[global] Uncaught error before React mount:', e.error);
  }
});

createRoot(document.getElementById("root")!).render(<App />);

