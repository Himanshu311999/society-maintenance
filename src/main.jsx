import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/theme.css";
import { DEFAULT_THEME } from "./constants";

// Apply default theme at startup ("light" or "dark")
try {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = DEFAULT_THEME;
  }
} catch (e) {
  // ignore in non-browser env
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
