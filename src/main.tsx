import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootstrapApp } from "./utils/bootstrap";

async function init() {
  await bootstrapApp();
  createRoot(document.getElementById("root")!).render(<App />);
}

init();
