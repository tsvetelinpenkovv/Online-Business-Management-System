import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const { hostname, search, pathname, hash } = window.location;

const hasLovableToken =
  search.includes("__lovable_token=") || search.includes("_lovable_token=");

const isPreviewHost =
  hostname.includes("id-preview--") ||
  hostname.includes("preview--") ||
  hostname.endsWith(".lovableproject.com");

const isLovablePreview = isPreviewHost || hasLovableToken;

// Remove preview-only token params from the visible URL to avoid oversized/share-broken links.
if (hasLovableToken) {
  const url = new URL(window.location.href);
  url.searchParams.delete("__lovable_token");
  url.searchParams.delete("_lovable_token");
  const cleanSearch = url.searchParams.toString();
  const cleanUrl = `${pathname}${cleanSearch ? `?${cleanSearch}` : ""}${hash}`;
  window.history.replaceState({}, "", cleanUrl);
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
        onRegisteredSW(swUrl, registration) {
          // Check for updates every 60 seconds
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

createRoot(document.getElementById("root")!).render(<App />);

