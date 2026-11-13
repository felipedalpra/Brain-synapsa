// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { BrainProvider } from "./store";
import { App } from "./App";
import "./styles.css";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrainProvider>
      <App />
    </BrainProvider>
  </React.StrictMode>,
);
