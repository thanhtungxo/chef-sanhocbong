import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// HTTP endpoints related to AI analysis and model ping.
// Note: Do not expose real API keys. Only read alias keys from environment.

export const pingModel = httpAction(async (ctx, req) => {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}
    const modelId = body?.modelId as string | undefined;
    const inlineKey = body?.apiKey as string | undefined;

    // Resolve target model: by id or active
    let targetModel: any | null = null;
    if (modelId) {
      const allModels = await ctx.runQuery(api.aiEngine.listModels, {} as any);
      targetModel = allModels?.find((m: any) => m._id === modelId) ?? null;
    } else {
      targetModel = await ctx.runQuery(api.aiEngine.getActiveModel, {} as any);
    }

    if (!targetModel) {
      return new Response(JSON.stringify({ ok: false, error: "No model found (no active model or invalid id)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const analysis = httpAction(async (ctx, req) => {
  try {
    let body: any = {};
    let layer: string | undefined;
    let override: any = {};
    let profile: any = {};

    // Primary: try JSON body
    try {
      body = await req.json();
    } catch {}
    layer = body?.layer as string | undefined;
    override = body?.override ?? {};
    profile = body?.profile ?? {};

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
      } catch {}
    }

    if (!layer) {
      return new Response(JSON.stringify({ error: "Missing 'layer' in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const activeModel = await ctx.runQuery(api.aiEngine.getActiveModel, {} as any);
    const activePrompt = await ctx.runQuery(api.aiEngine.getActivePromptByLayer, { layer } as any);

    if (!activePrompt) {
      return new Response(JSON.stringify({ error: "No active prompt configured for this layer" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use override values if provided (from Preview Test), otherwise use active prompt
    const temperature = override.temperature ?? activePrompt?.temperature ?? 0.7;
    const language = override.language ?? activePrompt?.language ?? "vi";

    // Determine target model (override.modelId or active)
    let targetModel: any | null = activeModel ?? null;
    if (override.modelId && typeof override.modelId === "string") {
      const allModels = await ctx.runQuery(api.aiEngine.listModels, {} as any);
      const found = allModels?.find((m: any) => m._id === override.modelId) ?? null;
      if (found) targetModel = found;
    }

    if (!targetModel) {
      return new Response(JSON.stringify({ error: "No active model found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const alias = targetModel.aliasKey as string | undefined;
    const provider = (targetModel.provider as string | undefined)?.toLowerCase() || "";
    const modelName = (targetModel.model as string | undefined) || "";
    const apiKey = alias ? process.env[alias] : undefined;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Alias key missing in environment", alias }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (provider !== "openai") {
      return new Response(JSON.stringify({ error: "Provider unsupported for analysis (expected OpenAI)", provider }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare OpenAI chat completion request based on prompt template and input profile
    const template: string = activePrompt.template || "";
    const promptVersion = override.version ?? activePrompt.version ?? "v1";

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
          headers: { "Content-Type": "application/json" },
        });
      }

      const json = await r.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";

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
            },
          };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      const friendly = msg.includes("aborted") ? `Timeout after ${Math.round(timeoutMs / 1000)}s` : msg;
      return new Response(JSON.stringify({ error: friendly }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});