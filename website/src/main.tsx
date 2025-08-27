import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.css";
import "./custom-bootstrap.css";
import "./App.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* @ts-ignore */}
      <App />
    </BrowserRouter>
  </StrictMode>
);

serviceWorkerRegistration.register();
