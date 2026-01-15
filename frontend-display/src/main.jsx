import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import {
  registerServiceWorker,
  isPWAInstalled,
  getDisplayMode,
} from "./pwa.js";

// Register service worker for PWA
registerServiceWorker();

// Log PWA status for debugging
console.log("[PWA] Display mode:", getDisplayMode());
console.log("[PWA] Installed as PWA:", isPWAInstalled());

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
