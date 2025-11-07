import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Temporarily disable StrictMode for ChatKit compatibility
// (until @openai/chatkit-react >= 1.3.1 is stable)
createRoot(document.getElementById("root")!).render(<App />);