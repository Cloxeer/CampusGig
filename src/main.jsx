import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import { ToastProvider } from "./components/toast/ToastProvider";
import { queryClient } from "./lib/queryClient";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
        <SpeedInsights />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
