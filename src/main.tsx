
  import { createRoot } from "react-dom/client";
  import { GoogleOAuthProvider } from "@react-oauth/google";
  import App from "./App.tsx";
  import "./index.css";
  import { applyTheme, getThemePreference, watchSystemTheme } from "./lib/theme";
  import { initAnalytics } from "./lib/analytics";
  import { ErrorBoundary } from "./components/ErrorBoundary";

  applyTheme(getThemePreference());
  watchSystemTheme();
  initAnalytics();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string || '';

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      {googleClientId
        ? <GoogleOAuthProvider clientId={googleClientId}><App /></GoogleOAuthProvider>
        : <App />}
    </ErrorBoundary>
  );

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    });
  }
