import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import { ToastProvider } from "./components/toast/ToastProvider";
import ScrollToTop from "./components/ScrollToTop";
import { queryClient } from "./lib/queryClient";
import { queryPersister, PERSIST_BUSTER, PERSIST_MAX_AGE } from "./lib/queryPersister";
// Self-hosted fonts (no Google Fonts CDN → no visitor IPs sent to Google).
import "@fontsource/geist-sans/300.css";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "@fontsource/geist-mono/600.css";
import "./styles/global.css";
import "./styles/borderFx.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        buster: PERSIST_BUSTER,
        maxAge: PERSIST_MAX_AGE,
      }}
    >
      <BrowserRouter>
        <ScrollToTop />
        <ToastProvider>
          <App />
        </ToastProvider>
        <SpeedInsights />
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>
);
