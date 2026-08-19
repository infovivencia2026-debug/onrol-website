import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Ceiling polish — must load LAST so it cascades over every page-specific CSS.
import "./styles/learn-ceiling-polish.css";
// Ceiling SHELL treatment — ported from CRM /learn prototype the user signed off on.
import "./styles/learn-ceiling-shell.css";
import { registerServiceWorker } from "@/lib/pwa";

createRoot(document.getElementById("root")!).render(<App />);

void registerServiceWorker();
