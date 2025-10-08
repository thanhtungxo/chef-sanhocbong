import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Sanitize URLs coming from host env (remove quotes/backticks/whitespace)
  const sanitizeUrl = (u?: string): string | undefined => {
    if (!u) return undefined;
    const trimmed = u.trim().replace(/^`+|`+$/g, "").replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
    return trimmed || undefined;
  };
  let rawViteUrl = sanitizeUrl(env.VITE_CONVEX_URL);
  const deployment = env.CONVEX_DEPLOYMENT;
  const deploymentName = deployment ? deployment.replace(/^dev:/, "") : undefined;
  // Always derive HTTP Actions URL from the Convex client URL to avoid cross-deployment mismatches
  let httpActionsUrl = rawViteUrl ? rawViteUrl.replace(".convex.cloud", ".convex.site") : undefined;
  // Fallbacks if rawViteUrl is not available
  if (!httpActionsUrl) {
    const envHttp = sanitizeUrl(env.VITE_HTTP_ACTIONS_URL);
    httpActionsUrl = envHttp || (deploymentName ? `https://${deploymentName}.convex.site` : undefined);
  }

  // Production fallback: ensure UI points to the correct Convex deployment even when host env vars are missing
  if (mode === "production") {
    rawViteUrl = rawViteUrl ?? "https://strong-ermine-969.convex.cloud";
    httpActionsUrl = httpActionsUrl ?? "https://strong-ermine-969.convex.site";
  }

  return {
    plugins: [
      react(),
      // The code below enables dev tools like taking screenshots of your site
      // while it is being developed on chef.convex.dev.
      // Feel free to remove this code if you're no longer developing your app with Chef.
      mode === "development"
        ? {
            name: "inject-chef-dev",
            transform(code: string, id: string) {
              if (id.includes("main.tsx")) {
                return {
                  code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                  map: null,
                };
              }
              return null;
            },
          }
        : null,
      // End of code for taking screenshots on chef.convex.dev.
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.VITE_CONVEX_URL': JSON.stringify(rawViteUrl ?? ""),
      // Ensure the in-app HTTP base always matches the Convex deployment
      'import.meta.env.VITE_HTTP_ACTIONS_URL': JSON.stringify(httpActionsUrl ?? (rawViteUrl ? rawViteUrl.replace('.convex.cloud', '.convex.site') : "")),
    },
    server: httpActionsUrl
      ? {
          proxy: {
            "/api": {
              target: httpActionsUrl,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : undefined,
  };
});
