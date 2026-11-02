
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { applyTheme, getThemePreference, watchSystemTheme } from "./lib/theme";
  import { initAnalytics } from "./lib/analytics";

  applyTheme(getThemePreference());
  watchSystemTheme();
  initAnalytics();

  createRoot(document.getElementById("root")!).render(<App />);

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    });
  }
