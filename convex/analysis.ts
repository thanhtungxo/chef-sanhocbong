import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// HTTP endpoints related to AI analysis and model ping.
// Note: Do not expose real API keys. Only read alias keys from environment.

export const pingModel = httpAction(async (ctx, req) => {
  try {
    const activeModel = await ctx.runQuery(api.aiEngine.getActiveModel, {} as any);
    if (!activeModel) {
      return new Response(JSON.stringify({ ok: false, error: "No active model" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const alias = activeModel.aliasKey as string;
    const key = process.env[alias];
    const ok = !!key; // Basic check: ensure alias key exists in env
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
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