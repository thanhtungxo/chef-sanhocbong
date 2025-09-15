import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
const root = createRoot(document.getElementById("root")!);
if (url) {
  const convex = new ConvexReactClient(url);
  root.render(
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  );
} else {
  root.render(<App />);
}
