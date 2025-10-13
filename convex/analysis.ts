import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
// noop: trigger Convex upload for latest analysis logic supporting Gemini

// HTTP endpoints related to AI analysis and model ping.
// Note: Do not expose real API keys. Only read alias keys from environment.

export const pingModel = httpAction(async (ctx, req) => {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}
    // Accept both string and DocumentId-like objects for modelId
    const modelIdRaw = body?.modelId;
    const inlineKey = body?.apiKey as string | undefined;

    // Helper to normalize Convex DocumentId to comparable string
    const toIdString = (v: any): string | undefined => {
      if (!v) return undefined;
      if (typeof v === "string") return v;
      if (typeof v === "object") {
        // Convex DocumentId objects often have an `id` property
        return (v.id as string) ?? (v._id?.id as string) ?? undefined;
      }
      return undefined;
    };

    // Resolve target model: by id or active
    let targetModel: any | null = null;
    if (modelIdRaw) {
      const allModels = await ctx.runQuery(api.aiEngine.listModels, {} as any);
      const reqId = toIdString(modelIdRaw);
      targetModel = allModels?.find((m: any) => {
        const mid = (m._id as any)?.id ?? (m._id as any);
        return mid === reqId;
      }) ?? null;
    } else {
      targetModel = await ctx.runQuery(api.aiEngine.getActiveModel, {} as any);
    }

    if (!targetModel) {
      return new Response(JSON.stringify({ ok: false, error: "No model found (no active model or invalid id)" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const alias = targetModel.aliasKey as string;
    const provider = (targetModel.provider as string) || "";
    const modelName = (targetModel.model as string) || "";
    const useKey = inlineKey || process.env[alias];

    if (!useKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Key alias chưa được gắn API key hợp lệ. Vui lòng chạy: npx convex env set ${alias} <key>`,
          alias,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        }
      );
    }

    // Helper to timeout requests
    const timeoutMs = 10000; // 10s
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let ok = false;
    let status = 0;
    let message: string | undefined;
    let error: string | undefined;
    try {
      const p = provider.toLowerCase();

      if (p === "openai") {
        // Minimal chat completion to verify connectivity and model validity
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${useKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
            temperature: 0,
          }),
          signal: controller.signal,
        });
        status = r.status;
        if (r.ok) {
          ok = true;
          message = "Model OK ✅";
        } else {
          let errMsg = `OpenAI error (${r.status})`;
          try {
            const j = await r.json();
            const apiMsg = j?.error?.message || j?.message || j?.error || undefined;
            if (apiMsg) errMsg = String(apiMsg);
          } catch {}
          if (r.status === 401) errMsg = "Unauthorized - invalid API key";
          if (r.status === 404) errMsg = "Model not found";
          error = errMsg;
        }
      } else if (p === "claude" || p === "anthropic") {
        // Anthropic Messages API (Claude)
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": useKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            max_tokens: 1,
            messages: [{ role: "user", content: "ping" }],
          }),
          signal: controller.signal,
        });
        status = r.status;
        if (r.ok) {
          ok = true;
          message = "Model OK ✅";
        } else {
          let errMsg = `Anthropic error (${r.status})`;
          try {
            const j = await r.json();
            const apiMsg = j?.error?.message || j?.message || j?.error || undefined;
            if (apiMsg) errMsg = String(apiMsg);
          } catch {}
          if (r.status === 401) errMsg = "Unauthorized - invalid API key";
          if (r.status === 404) errMsg = "Model not found";
          error = errMsg;
        }
      } else if (p === "gemini" || p === "google") {
        // Google Generative Language API (Gemini)
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          modelName
        )}:generateContent?key=${encodeURIComponent(useKey)}`;
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: "ping" }] },
            ],
            generationConfig: { maxOutputTokens: 1 },
          }),
          signal: controller.signal,
        });
        status = r.status;
        if (r.ok) {
          ok = true;
          message = "Model OK ✅";
        } else {
          let errMsg = `Gemini error (${r.status})`;
          try {
            const j = await r.json();
            const apiMsg = j?.error?.message || j?.message || j?.error || undefined;
            if (apiMsg) errMsg = String(apiMsg);
          } catch {}
          if (r.status === 401) errMsg = "Unauthorized - invalid API key";
          if (r.status === 404) errMsg = "Model not found";
          error = errMsg;
        }
      } else {
        // Other providers: we only verify that a key exists (no external call)
        ok = !!useKey;
        status = ok ? 200 : 400;
        message = ok ? "Model OK ✅" : undefined;
        if (!ok) error = "Missing provider API key";
      }
    } catch (err: any) {
      // Handle aborts/timeouts or network errors
      const msg = String(err?.message || err);
      error = msg.includes("aborted") ? `Timeout after ${Math.round(timeoutMs / 1000)}s` : msg;
      ok = false;
    } finally {
      clearTimeout(timer);
    }

    return new Response(
      JSON.stringify({
        ok,
        message,
        error,
        provider,
        alias,
        status,
        source: inlineKey ? "input" : "env",
      }),
      {
        status: ok ? 200 : 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});

// Simple CORS headers for preflight
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const analysisOptions = httpAction(async (ctx, req) => {
  // Respond to CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: CORS_HEADERS });
  }
  return new Response("", { status: 405, headers: CORS_HEADERS });
});

// New: OPTIONS handler for /api/ping-model
export const pingModelOptions = httpAction(async (ctx, req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: CORS_HEADERS });
  }
  return new Response("", { status: 405, headers: CORS_HEADERS });
});
export const analysis = httpAction(async (ctx, req) => {
  try {
    let body: any = {};
    let layer: string | undefined;
    let override: any = {};
    let profile: any = {};
    let debugFlag = false;

    // Primary: try JSON body
    try {
      body = await req.json();
    } catch {}
    layer = body?.layer as string | undefined;
    override = body?.override ?? {};
    profile = body?.profile ?? {};
    debugFlag = !!(body?.debug || override?.debug);

    // Fallback 1: try raw text body (JSON or form-encoded)
    if (!layer) {
      try {
        const raw = await req.text();
        if (raw && raw.length > 0) {
          // Attempt JSON parse
          try {
            const parsed = JSON.parse(raw);
            layer = parsed?.layer ?? layer;
            override = parsed?.override ?? override;
            profile = parsed?.profile ?? profile;
          } catch {
            // Attempt form-encoded parse
            const params = new URLSearchParams(raw);
            const l = params.get("layer");
            if (l) layer = l;
            const o = params.get("override");
            if (o) {
              try {
                override = JSON.parse(o);
              } catch {}
            }
            const d = params.get("debug");
            if (d && (d === "1" || d === "true")) debugFlag = true;
          }
        }
      } catch {}
    }

    // Fallback 2: query string
    if (!layer) {
      try {
        const url = new URL(req.url);
        layer = url.searchParams.get("layer") ?? layer;
        const o = url.searchParams.get("override");
        if (o) {
          try {
            override = JSON.parse(o);
          } catch {}
        }
        const d = url.searchParams.get("debug");
        if (d && (d === "1" || d === "true")) debugFlag = true;
      } catch {}
    }

    if (!layer) {
      return new Response(JSON.stringify({ error: "Missing 'layer' in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const activeModel = await ctx.runQuery(api.aiEngine.getActiveModel, {} as any);
    let activePrompt = await ctx.runQuery(api.aiEngine.getActivePromptByLayer, { layer } as any);

    // Fallback: if no active prompt, try the latest prompt in this layer
    if (!activePrompt) {
      try {
        const prompts = await ctx.runQuery(api.aiEngine.listPromptsByLayer, { layer } as any);
        activePrompt = (prompts && prompts.length > 0) ? prompts[0] : null;
      } catch {}
    }

    if (!activePrompt) {
      // Built-in fallback prompt to ensure /api/analysis works even when DB has no active prompt for this layer
      activePrompt = {
        layer,
        version: "v1",
        template: [
          "Bạn là Scholarship Mentor AI. Hãy tạo phản hồi ở dạng JSON với các khóa: overall, fit_with_scholarship, contextual_insight, next_step.",
          "- overall: Tóm tắt ngắn gọn (1-2 câu) về kết quả tổng quan.",
          "- fit_with_scholarship: Mô tả tại sao hồ sơ phù hợp/không phù hợp với học bổng (ngắn gọn).",
          "- contextual_insight: Gợi ý chi tiết dựa trên thông tin hồ sơ và các lý do không đạt (nếu có).",
          "- next_step: Hành động tiếp theo cụ thể." ,
          "Trả lời bằng tiếng Việt nếu không được chỉ định ngôn ngữ khác. Không dùng markdown, chỉ JSON thuần."
        ].join("\n"),
        temperature: 0.7,
        language: "vi",
      } as any;
    }

    // Use override values if provided (from Preview Test), otherwise use active prompt
    const temperature = override.temperature ?? activePrompt?.temperature ?? 0.7;
    const language = override.language ?? activePrompt?.language ?? "vi";

    // Determine target model (override.modelId or active)
    let targetModel: any | null = activeModel ?? null;
    if (override.modelId) {
      // Normalize Convex DocumentId to string for comparison
      const toIdString = (v: any): string | undefined => {
        if (!v) return undefined;
        if (typeof v === "string") return v;
        if (typeof v === "object") return (v.id as string) ?? (v._id?.id as string) ?? undefined;
        return undefined;
      };
      const reqId = toIdString(override.modelId);
      if (reqId) {
        const allModels = await ctx.runQuery(api.aiEngine.listModels, {} as any);
        const found = allModels?.find((m: any) => ((m?._id as any)?.id ?? (m?._id as any)) === reqId) ?? null;
        if (found) targetModel = found;
      }
    }

    if (!targetModel) {
      return new Response(JSON.stringify({ error: "No active model found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const alias = targetModel.aliasKey as string | undefined;
    const provider = (targetModel.provider as string | undefined)?.toLowerCase() || "";
    const modelName = (targetModel.model as string | undefined) || "";
    const apiKey = alias ? process.env[alias] : undefined;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Alias key missing in environment", alias }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Support OpenAI and Gemini providers. Others are not supported for analysis yet.
    if (provider !== "openai" && provider !== "gemini" && provider !== "google") {
      return new Response(JSON.stringify({ error: "Provider unsupported for analysis (expected OpenAI/Gemini/Google)", provider, deployedVersion: "v2-gemini" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Prepare chat-style request based on prompt template and input profile
    const template: string = activePrompt?.template ?? "";
    const promptVersion = override.version ?? activePrompt?.version ?? "v1";

    const systemInstruction = `You are Scholarship Mentor AI. Reply strictly as a JSON object with keys: overall, fit_with_scholarship, contextual_insight, next_step. Use ${language === "vi" ? "Vietnamese" : "English"}. Do not include markdown or extra text.`;

    const userContent = [
      template.trim(),
      "",
      "Input Context:",
      JSON.stringify({ profile }, null, 2),
      "",
      "Output JSON keys: { overall, fit_with_scholarship, contextual_insight, next_step }",
    ].join("\n");

    // Timeout controller to keep request lightweight
    const timeoutMs = 20000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Gemini (Google Generative Language API) branch
    if (provider === "gemini" || provider === "google") {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Put system instruction explicitly for newer Gemini models
            systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
            contents: [
              { role: "user", parts: [{ text: userContent }] },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: 2048,
              // Strongly hint JSON output
              response_mime_type: "application/json",
              response_schema: {
                type: "object",
                properties: {
                  overall: { type: "string" },
                  fit_with_scholarship: { type: "string" },
                  contextual_insight: { type: "string" },
                  next_step: { type: "string" },
                },
                required: [
                  "overall",
                  "fit_with_scholarship",
                  "contextual_insight",
                  "next_step",
                ],
              },
            },
            // Loosen default safety to avoid empty, blocked responses for benign prompts
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
            ],
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!r.ok) {
          let errMsg = `Gemini error (${r.status})`;
          try {
            const j = await r.json();
            const apiMsg = j?.error?.message || j?.message || j?.error || undefined;
            if (apiMsg) errMsg = String(apiMsg);
          } catch {}
          if (r.status === 401) errMsg = "Unauthorized - invalid API key";
          if (r.status === 404) errMsg = "Model not found";
          return new Response(JSON.stringify({ error: errMsg }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          });
        }

        const j = await r.json();
        // Robustly extract text from Gemini response across all candidates and parts
        const collectTexts = (obj: any): string => {
          try {
            const cands = Array.isArray(obj?.candidates) ? obj.candidates : [];
            const texts: string[] = [];
            for (const c of cands) {
              // Typical REST shape: { content: { parts: [{ text }] } }
              const partsA = Array.isArray(c?.content?.parts) ? c.content.parts : [];
              for (const p of partsA) {
                const t = typeof p?.text === "string" ? p.text : "";
                if (t) texts.push(t);
              }
              // Alternate shape observed: { content: [{ text }] }
              const partsB = Array.isArray(c?.content) ? c.content : [];
              for (const p of partsB) {
                const t = typeof p?.text === "string" ? p.text : (typeof p === "string" ? p : "");
                if (t) texts.push(t);
              }
              // Some SDKs return `output_text` directly
              const out = typeof c?.output_text === "string" ? c.output_text : "";
              if (out) texts.push(out);
              // Very defensive: top-level text on candidate
              const direct = typeof c?.text === "string" ? c.text : "";
              if (direct) texts.push(direct);
            }
            return texts.join("\n").trim();
          } catch {
            return "";
          }
        };
        // Detect safety blocks / empty candidates
        let content = collectTexts(j);
        const blockReason = (j?.promptFeedback?.blockReason || j?.candidates?.[0]?.safetyRatings?.[0]?.blocked) as string | undefined;
        const finishReason = (j?.candidates?.[0]?.finishReason || j?.candidates?.[0]?.finish_reason) as string | undefined;

        // Allow schema fallback text from prompt config if model returns nothing
        const fallbackText: string = (activePrompt?.fallbackText ?? "").toString().trim();
        if (!content && fallbackText) {
          content = fallbackText;
        }

        if (!content && blockReason) {
          content = language === "vi"
            ? "Hiện Gemini đã chặn phản hồi vì lý do an toàn. Nội dung sẽ được cập nhật sau."
            : "Gemini blocked the response due to safety filters.";
        }

        // Retry once if model hit MAX_TOKENS without visible output
        let retried = false;
        if (!content && finishReason === "MAX_TOKENS") {
          retried = true;
          const controller2 = new AbortController();
          const timer2 = setTimeout(() => controller2.abort(), 12000);
          try {
            const r2 = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
                contents: [ { role: "user", parts: [{ text: userContent }] } ],
                generationConfig: {
                  temperature,
                  maxOutputTokens: 4096,
                  response_mime_type: "application/json",
                  response_schema: {
                    type: "object",
                    properties: {
                      overall: { type: "string" },
                      fit_with_scholarship: { type: "string" },
                      contextual_insight: { type: "string" },
                      next_step: { type: "string" },
                    },
                    required: ["overall","fit_with_scholarship","contextual_insight","next_step"],
                  },
                },
                safetySettings: [
                  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
                ],
              }),
              signal: controller2.signal,
            });
            clearTimeout(timer2);
            if (r2.ok) {
              const j2 = await r2.json();
              const c2 = collectTexts(j2);
              if (c2) {
                content = c2;
              }
            }
          } catch {
            clearTimeout(timer2);
          }
        }

        // Try to parse JSON content from model response
        const tryParse = (txt: string): any => {
          try { return JSON.parse(txt); } catch {}
          const m = txt.match(/\{[\s\S]*\}/);
          if (m) {
            try { return JSON.parse(m[0]); } catch {}
          }
          return null;
        };

        const parsed = content ? tryParse(content) : null;
        const defaultMsg = language === "vi"
          ? "Hệ thống chưa nhận được phản hồi từ Gemini. Vui lòng thử lại sau."
          : "No response received from Gemini yet. Please try again.";

        const hadCandidates = Array.isArray(j?.candidates) && j.candidates.length > 0;

        // Console diagnostics (server logs)
        try {
          const firstText = (content || "").slice(0, 240);
          console.log(`[AI][Gemini] model=${modelName} status=${r.status} hadCandidates=${hadCandidates} block=${blockReason ? String(blockReason) : 'none'} finish=${finishReason || 'none'} retried=${retried} textLen=${(content||'').length} preview="${firstText}"`);
        } catch {}
        const result = parsed && typeof parsed === "object"
          ? {
              overall: String(parsed.overall ?? ""),
              fit_with_scholarship: String(parsed.fit_with_scholarship ?? ""),
              contextual_insight: String(parsed.contextual_insight ?? ""),
              next_step: String(parsed.next_step ?? ""),
              debug: {
                model: `${targetModel.provider}/${targetModel.model}`,
                promptVersion,
                temperature,
                language,
                hadCandidates,
                blockReason: blockReason || undefined,
                finishReason: finishReason || undefined,
                apiStatus: r.status,
                raw: debugFlag ? {
                  promptFeedback: j?.promptFeedback ?? null,
                  usage: j?.usageMetadata ?? null,
                  firstCandidate: Array.isArray(j?.candidates) && j.candidates.length > 0 ? {
                    finishReason: j.candidates[0]?.finishReason,
                    safetyRatings: j.candidates[0]?.safetyRatings,
                    textPreview: (content || '').slice(0, 2000),
                  } : null,
                  retried,
                } : undefined,
              },
            }
          : {
              overall: ((content || "").trim()) || defaultMsg,
              fit_with_scholarship: "",
              contextual_insight: "",
              next_step: "",
              debug: {
                model: `${targetModel.provider}/${targetModel.model}`,
                promptVersion,
                temperature,
                language,
                note: content ? "Response was not valid JSON; returned raw text in 'overall'" : "Empty model response",
                hadCandidates,
                blockReason: blockReason || undefined,
                finishReason: finishReason || undefined,
                apiStatus: r.status,
                raw: debugFlag ? {
                  promptFeedback: j?.promptFeedback ?? null,
                  usage: j?.usageMetadata ?? null,
                  firstCandidate: Array.isArray(j?.candidates) && j.candidates.length > 0 ? {
                    finishReason: j.candidates[0]?.finishReason,
                    safetyRatings: j.candidates[0]?.safetyRatings,
                    textPreview: (content || '').slice(0, 2000),
                  } : null,
                  retried,
                } : undefined,
              },
            };

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      } catch (err: any) {
        const msg = String(err?.message || err);
        const friendly = msg.includes("aborted") ? `Timeout after ${Math.round(timeoutMs / 1000)}s` : msg;
        return new Response(JSON.stringify({ error: friendly }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }
    }

    // Fallback to OpenAI branch (existing behavior)
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userContent },
          ],
          temperature,
          // Encourage JSON output for compatible models
          response_format: { type: "json_object" },
          max_tokens: 800,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!r.ok) {
        let errMsg = `OpenAI error (${r.status})`;
        try {
          const j = await r.json();
          const apiMsg = j?.error?.message || j?.message || j?.error || undefined;
          if (apiMsg) errMsg = String(apiMsg);
        } catch {}
        if (r.status === 401) errMsg = "Unauthorized - invalid API key";
        if (r.status === 404) errMsg = "Model not found";
        return new Response(JSON.stringify({ error: errMsg }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      const json = await r.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";

      // Console diagnostics for OpenAI
      try {
        console.log(`[AI][OpenAI] model=${modelName} status=${r.status} textLen=${(content||'').length} preview="${(content||'').slice(0,240)}"`);
      } catch {}

      // Try to parse JSON content from model response
      const tryParse = (txt: string): any => {
        try {
          return JSON.parse(txt);
        } catch {}
        const m = txt.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            return JSON.parse(m[0]);
          } catch {}
        }
        return null;
      };

      const parsed = tryParse(content);
      const result = parsed && typeof parsed === "object"
        ? {
            overall: String(parsed.overall ?? ""),
            fit_with_scholarship: String(parsed.fit_with_scholarship ?? ""),
            contextual_insight: String(parsed.contextual_insight ?? ""),
            next_step: String(parsed.next_step ?? ""),
            debug: {
              model: `${targetModel.provider}/${targetModel.model}`,
              promptVersion,
              temperature,
              language,
              apiStatus: r.status,
              raw: debugFlag ? { firstChoice: (json?.choices?.[0] ?? null), textPreview: (content || '').slice(0, 2000) } : undefined,
            },
          }
        : {
            overall: content?.trim() || "",
            fit_with_scholarship: "",
            contextual_insight: "",
            next_step: "",
            debug: {
              model: `${targetModel.provider}/${targetModel.model}`,
              promptVersion,
              temperature,
              language,
              note: "Response was not valid JSON; returned raw text in 'overall'",
              apiStatus: r.status,
              raw: debugFlag ? { firstChoice: (json?.choices?.[0] ?? null), textPreview: (content || '').slice(0, 2000) } : undefined,
            },
          };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      const friendly = msg.includes("aborted") ? `Timeout after ${Math.round(timeoutMs / 1000)}s` : msg;
      return new Response(JSON.stringify({ error: friendly }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
