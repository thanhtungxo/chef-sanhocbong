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

    let ok = false;
    let status = 0;
    let error: string | null = null;
    try {
      const p = provider.toLowerCase();
      if (p === "openai") {
        const r = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${useKey}` },
        });
        ok = r.ok;
        status = r.status;
      } else if (p === "claude" || p === "anthropic") {
        const r = await fetch("https://api.anthropic.com/v1/models", {
          headers: { "x-api-key": useKey, "anthropic-version": "2023-06-01" },
        });
        ok = r.ok;
        status = r.status;
      } else if (p === "gemini" || p === "google") {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(useKey)}`
        );
        ok = r.ok;
        status = r.status;
      } else {
        // Custom provider: basic key existence check only
        ok = !!useKey;
        status = 200;
      }
    } catch (err: any) {
      ok = false;
      error = String(err);
    }

    return new Response(
      JSON.stringify({ ok, provider, alias, status, error, source: inlineKey ? "input" : "env" }),
      {
        status: ok ? 200 : 500,
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
    const body = await req.json();
    const layer = body?.layer as string;
    const override = body?.override ?? {};

    const activeModel = await ctx.runQuery(api.aiEngine.getActiveModel, {} as any);
    const activePrompt = await ctx.runQuery(api.aiEngine.getActivePromptByLayer, { layer } as any);

    // Use override values if provided (from Preview Test), otherwise use active prompt
    const temperature = override.temperature ?? activePrompt?.temperature ?? 0.7;
    const language = override.language ?? activePrompt?.language ?? "vi";

    // Read alias key from env based on active model (do not return it to client)
    const alias = (override.modelId && typeof override.modelId === "string")
      ? (await ctx.runQuery(api.aiEngine.listModels, {} as any))?.find((m: any) => m._id === override.modelId)?.aliasKey
      : activeModel?.aliasKey;
    const keyExists = alias ? !!process.env[alias] : false;

    if (!keyExists) {
      return new Response(JSON.stringify({ error: "Alias key missing in environment" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mocked analysis result (replace with real provider call using alias env key)
    const result = {
      overall: language === "vi" ? "Đây là bản xem trước kết quả phân tích." : "This is a preview analysis result.",
      fit_with_scholarship: language === "vi" ? "Mức độ phù hợp: Khá tốt." : "Fit level: Quite good.",
      contextual_insight: language === "vi" ? "Ứng viên có kinh nghiệm phù hợp với tiêu chí học bổng." : "The candidate has experience matching scholarship criteria.",
      next_step: language === "vi" ? "Hoàn thiện hồ sơ và chuẩn bị bài luận." : "Complete your application and prepare your essay.",
      debug: {
        model: activeModel ? `${activeModel.provider}/${activeModel.model}` : null,
        promptVersion: override.version ?? activePrompt?.version ?? null,
        temperature,
        language,
      },
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});