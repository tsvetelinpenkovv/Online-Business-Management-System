import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const { hostname, search } = window.location;

const hasLovableToken =
  search.includes("__lovable_token=") || search.includes("_lovable_token=");

const isPreviewHost =
  hostname.includes("id-preview--") ||
  hostname.includes("preview--") ||
  hostname.endsWith(".lovableproject.com");

const isLovablePreview = isPreviewHost || hasLovableToken;

if ("serviceWorker" in navigator) {
  if (isLovablePreview) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  } else {
    import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);

