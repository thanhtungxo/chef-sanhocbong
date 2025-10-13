import { auth } from "./auth";
import router from "./router";
import { analysis, pingModel, analysisOptions, pingModelOptions } from "./analysis";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = router;

auth.addHttpRoutes(http);

// Register AI Engine HTTP endpoints
http.route({
  path: "/api/ping-model",
  method: "OPTIONS",
  handler: pingModelOptions,
});
http.route({
  path: "/api/ping-model",
  method: "POST",
  handler: pingModel,
});
http.route({
  path: "/api/analysis",
  method: "OPTIONS",
  handler: analysisOptions,
});
http.route({
  path: "/api/analysis",
  method: "POST",
  handler: analysis,
});

// Simple CORS headers for preflight
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Register Form Answers Sync endpoints (local)
export const syncAnswersOptions = httpAction(async (ctx, req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: CORS_HEADERS });
  }
  return new Response("", { status: 405, headers: CORS_HEADERS });
});

export const syncAnswersHttp = httpAction(async (ctx, req) => {
  try {
    const res = await ctx.runAction(api.answers.syncAnswers);
    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});

http.route({ path: "/api/sync-answers", method: "OPTIONS", handler: syncAnswersOptions });
http.route({ path: "/api/sync-answers", method: "POST", handler: syncAnswersHttp });

export default http;
