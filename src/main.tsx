import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isLovablePreview =
  window.location.hostname.includes("id-preview--") ||
  window.location.search.includes("__lovable_token=");

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

