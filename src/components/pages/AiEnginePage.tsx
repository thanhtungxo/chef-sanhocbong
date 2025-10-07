import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const layers = [
  "Result Page",
  "Smart Profile Analysis",
  "Email Generator",
];

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL as string | undefined;
const httpActionsUrl = (import.meta as any).env?.VITE_HTTP_ACTIONS_URL as string | undefined;
const isDev = !!((import.meta as any).env?.DEV || ((import.meta as any).env?.MODE === "development"));

export const AiEnginePage: React.FC = () => {
  const [tab, setTab] = React.useState<string>("prompt");

  return (
    <div className="min-h-[70vh] w-full px-4 sm:px-6 py-6 bg-gradient-to-b from-[#7DE2FC] to-[#B9B6FF] rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">AI Engine</h1>
          <p className="text-sm text-[#0F172A]/70">Quản lý prompt, model & keys cho các tầng AI của hệ thống.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList className="bg-white/70 rounded-xl p-1">
          <TabsTrigger value="prompt">Prompt Configurator</TabsTrigger>
          <TabsTrigger value="models">AI Models & Keys</TabsTrigger>
        </TabsList>
        {/* Removed framer-motion AnimatePresence/motion wrappers to avoid CJS runtime issues */}
        {tab === "prompt" ? (
          <TabsContent value="prompt">
            <div className="transition-opacity duration-200">
              <PromptConfigurator />
            </div>
          </TabsContent>
        ) : (
          <TabsContent value="models">
            <div className="transition-opacity duration-200">
              <ModelsAndKeys />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

const OutputSchemaBlock: React.FC = () => {
  const schemaText = `{
  "overall": string,
  "fit_with_scholarship": string,
  "contextual_insight": string,
  "next_step": string
}`;
  return (
    <pre className="bg-white rounded-xl p-4 text-xs sm:text-sm font-mono text-slate-700 overflow-auto border border-white/60 shadow-inner">
      {schemaText}
    </pre>
  );
};

const PromptConfigurator: React.FC = () => {
  const [layer, setLayer] = React.useState<string>(layers[0]);
  const [title, setTitle] = React.useState<string>("");
  const [version, setVersion] = React.useState<string>("v1");
  const [modelId, setModelId] = React.useState<string>("");
  const [temperature, setTemperature] = React.useState<number>(0.7);
  const [languageVi, setLanguageVi] = React.useState<boolean>(true);
  const [template, setTemplate] = React.useState<string>("");
  const [fallbackText, setFallbackText] = React.useState<string>("");
  const [versionNote, setVersionNote] = React.useState<string>("");
  const [testing, setTesting] = React.useState<boolean>(false);
  const [testResult, setTestResult] = React.useState<any>(null);
  const [statusText, setStatusText] = React.useState<string>("");

  const models = useQuery(api.aiEngine.listModels, {});
  const prompts = useQuery(api.aiEngine.listPromptsByLayer, { layer });
  const activePrompt = useQuery(api.aiEngine.getActivePromptByLayer, { layer });
  const addPrompt = useMutation(api.aiEngine.addPrompt);
  const publishPrompt = useMutation(api.aiEngine.publishPrompt);

  React.useEffect(() => {
    if (activePrompt) {
      setTitle(activePrompt.title || "");
      setVersion(activePrompt.version || "v1");
      setModelId(activePrompt.modelId);
      setTemperature(activePrompt.temperature ?? 0.7);
      setLanguageVi((activePrompt.language || "vi") === "vi");
      setTemplate(activePrompt.template || "");
      setFallbackText(activePrompt.fallbackText || "");
      setVersionNote(activePrompt.versionNote || "");
    }
  }, [activePrompt?._id]);

  const onSaveDraft = async () => {
    try {
      await addPrompt({
        layer,
        title,
        version,
        template,
        modelId: modelId as any,
        temperature,
        language: languageVi ? "vi" : "en",
        fallbackText,
        versionNote,
        isActive: false,
      });
      setStatusText("Prompt saved successfully ✅");
      setTimeout(() => setStatusText(""), 3000);
    } catch (e: any) {
      setStatusText(e?.message || "Error saving prompt");
    }
  };

  const onPublish = async () => {
    try {
      if (!prompts || prompts.length === 0) {
        // create then publish
        const id = await addPrompt({
          layer,
          title,
          version,
          template,
          modelId: modelId as any,
          temperature,
          language: languageVi ? "vi" : "en",
          fallbackText,
          versionNote,
          isActive: false,
        });
        await publishPrompt({ promptId: id as any });
      } else if (activePrompt?._id) {
        await publishPrompt({ promptId: activePrompt._id as any });
      }
      setStatusText(`Prompt activated for ${layer} 🚀`);
      setTimeout(() => setStatusText(""), 3000);
    } catch (e: any) {
      setStatusText(e?.message || "Error publishing prompt");
    }
  };

  const onPreviewTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const base = !isDev ? (httpActionsUrl || convexUrl) : undefined;
      const url = base ? `${base}/api/analysis?layer=${encodeURIComponent(layer)}` : `/api/analysis?layer=${encodeURIComponent(layer)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer,
          profile: {
            fullName: "Nguyễn Văn A",
            email: "test@example.com",
            englishScore: 7.5,
            currentJobTitle: "Software Engineer",
            employerName: "ABC Tech",
            aasEligible: true,
            cheveningEligible: false,
          },
          override: {
            title,
            version,
            template,
            modelId,
            temperature,
            language: languageVi ? "vi" : "en",
          },
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({ error: "Error ❌" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">🧠 Prompt Configurator</h2>
          <p className="text-sm text-slate-700">Quản lý và chỉnh sửa prompt template cho từng layer AI của hệ thống.</p>
        </div>
        <Button className="bg-gradient-to-r from-teal-400 to-sky-500 text-white font-semibold rounded-xl shadow hover:scale-[1.02] hover:shadow-md">+ New Prompt</Button>
      </div>

      <Card className="bg-white/80 backdrop-blur rounded-2xl p-4 sm:p-6 shadow">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-slate-700">Layer</Label>
            <select value={layer} onChange={(e) => setLayer(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2">
              {layers.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-slate-700">Prompt Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: ResultPage v1" className="mt-2 rounded-xl" />
          </div>
          <div>
            <Label className="text-slate-700">Active Model</Label>
            <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2">
              <option value="">Chọn model</option>
              {models?.map((m: any) => (
                <option key={m._id} value={m._id}>{m.provider} / {m.model} ({m.aliasKey})</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-slate-700">Version</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1" className="mt-2 rounded-xl" />
          </div>
          <div>
            <Label className="text-slate-700">Temperature: {temperature.toFixed(1)}</Label>
            <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="mt-2 w-full" />
          </div>
          <div className="flex items-end">
            <div>
              <Label className="text-slate-700">Language Mode</Label>
              <div className="mt-2 flex items-center gap-2">
                <span className={`${languageVi ? "font-semibold" : "text-slate-500"}`}>Tiếng Việt</span>
                <Switch checked={!languageVi} onCheckedChange={(checked) => setLanguageVi(!checked)} />
                <span className={`${!languageVi ? "font-semibold" : "text-slate-500"}`}>English</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-slate-700">Prompt Template</Label>
          <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={8} placeholder="Viết template prompt ở đây..." className="mt-2 w-full rounded-xl border px-3 py-2 font-mono text-sm leading-6" />
        </div>

        <div className="mt-4">
          <Label className="text-slate-700">Output Format (read-only)</Label>
          <OutputSchemaBlock />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div>
            <Label className="text-slate-700">Fallback Text</Label>
            <textarea value={fallbackText} onChange={(e) => setFallbackText(e.target.value)} rows={3} placeholder="Hiển thị khi API lỗi" className="mt-2 w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
          <div>
            <Label className="text-slate-700">Version Note</Label>
            <Input value={versionNote} onChange={(e) => setVersionNote(e.target.value)} placeholder="Ghi chú phiên bản" className="mt-2 rounded-xl" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={onPreviewTest} className="bg-gradient-to-r from-teal-400 to-sky-500 text-white font-semibold rounded-xl shadow hover:scale-[1.02]">Preview Test</Button>
          <Button onClick={onSaveDraft} variant="secondary" className="rounded-xl">Save Draft</Button>
          <Button onClick={onPublish} className="bg-gradient-to-r from-teal-400 to-sky-500 text-white font-semibold rounded-xl shadow hover:scale-[1.02]">Publish</Button>
          <Button variant="outline" className="rounded-xl">View History</Button>
        </div>

        {statusText && (
          <div className="mt-3 text-sm text-teal-700">{statusText}</div>
        )}

        <div className="mt-6">
          {testing ? (
            <div className="text-sm text-slate-700">Tùng đang phân tích hồ sơ mẫu…</div>
          ) : testResult ? (
            <Card className="bg-white rounded-xl p-4 border">
              <div className="text-sm text-slate-700">Kết quả Preview:</div>
              <pre className="mt-2 text-xs sm:text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </Card>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

const ModelsAndKeys: React.FC = () => {
  const models = useQuery(api.aiEngine.listModels, {});
  const setActive = useMutation(api.aiEngine.setActiveModel);
  const updateModel = useMutation(api.aiEngine.updateModel);
  const addModel = useMutation(api.aiEngine.addModel);
  const activeModel = useQuery(api.aiEngine.getActiveModel, {});
  const deleteModel = useMutation(api.aiEngine.deleteModel);
  const [statusText, setStatusText] = React.useState<string>("");
  const [envWarning, setEnvWarning] = React.useState<string>("");
  const [showAdd, setShowAdd] = React.useState<boolean>(false);
  const [providerAdd, setProviderAdd] = React.useState<string>("OpenAI");
  const [modelAdd, setModelAdd] = React.useState<string>("");
  const [aliasAdd, setAliasAdd] = React.useState<string>("");
  const [statusAdd, setStatusAdd] = React.useState<string>("Testing");
  const [isActiveAdd, setIsActiveAdd] = React.useState<boolean>(false);

  const onPing = async (modelId?: string) => {
    try {
      const url = isDev
        ? "/api/ping-model"
        : (httpActionsUrl ? `${httpActionsUrl}/api/ping-model` : "/api/ping-model");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelId ? { modelId } : {}),
      });
      const data = await res.json();
      if (!data?.ok && data?.alias && typeof data?.error === "string") {
        setEnvWarning(`Alias ${data.alias} chưa có API key trong môi trường. Vui lòng chạy: npx convex env set ${data.alias} <key>`);
      } else {
        setEnvWarning("");
      }
      setStatusText(data?.ok ? "Model OK ✅" : "Error ❌");
    } catch {
      setStatusText("Error ❌");
    } finally {
      setTimeout(() => setStatusText(""), 3000);
    }
  };

  const onSetActive = async (modelId: string) => {
    await setActive({ modelId: modelId as any });
    setStatusText("Model set active ✅");
    setTimeout(() => setStatusText(""), 3000);
  };

  const onQuickAdd = async () => {
    setShowAdd(true);
  };

  const onSaveAdd = async () => {
    try {
      if (!providerAdd || !modelAdd || !aliasAdd) {
        setStatusText("Vui lòng nhập Provider, Model và Alias");
        setTimeout(() => setStatusText(""), 3000);
        return;
      }
      const id = await addModel({
        provider: providerAdd,
        model: modelAdd,
        aliasKey: aliasAdd,
        status: statusAdd,
        isActive: isActiveAdd,
      });
      setStatusText("Model added ✅");
      setShowAdd(false);
      setTimeout(() => setStatusText(""), 3000);
      if (id) {
        onPing(id as any);
      }
    } catch (e: any) {
      setStatusText(e?.message || "Error adding model ❌");
      setTimeout(() => setStatusText(""), 3000);
    }
  };

  const onDelete = async (modelId: string) => {
    try {
      const res = await deleteModel({ modelId: modelId as any });
      if ((res as any)?.ok) {
        setStatusText("Model deleted ✅");
      } else {
        setStatusText((res as any)?.error || "Delete error ❌");
      }
    } catch (e: any) {
      setStatusText(e?.message || "Delete error ❌");
    } finally {
      setTimeout(() => setStatusText(""), 3000);
    }
  };

  React.useEffect(() => {
    // Check env key for active model
    if (activeModel?._id) {
      onPing();
    } else {
      setEnvWarning("");
    }
  }, [activeModel?._id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">🤖 AI Models & Keys</h2>
          <p className="text-sm text-slate-700">Quản lý model, provider, và alias key dùng cho các tầng AI của hệ thống.</p>
        </div>
        <Button onClick={onQuickAdd} className="bg-gradient-to-r from-teal-400 to-sky-500 text-white font-semibold rounded-xl shadow hover:scale-[1.02] hover:shadow-md">+ Add Model</Button>
      </div>

      {/* Add Model Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white rounded-2xl p-4 sm:p-6 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Thêm Model</h3>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Đóng</Button>
            </div>
            <div className="mt-4 grid gap-3">
              <div>
                <Label>Provider</Label>
                <select value={providerAdd} onChange={(e) => setProviderAdd(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2">
                  <option>OpenAI</option>
                  <option>Claude</option>
                  <option>Gemini</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label>Model</Label>
                <Input value={modelAdd} onChange={(e) => setModelAdd(e.target.value)} placeholder="Ví dụ: gpt-4o-mini" className="mt-2 rounded-xl" />
              </div>
              <div>
                <Label>Alias Key</Label>
                <Input value={aliasAdd} onChange={(e) => setAliasAdd(e.target.value)} placeholder="Ví dụ: OPENAI_KEY_1" className="mt-2 rounded-xl" />
              </div>
              <div>
                <Label>Status</Label>
                <select value={statusAdd} onChange={(e) => setStatusAdd(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2">
                  <option>Testing</option>
                  <option>Active</option>
                  <option>Disabled</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label>Set Active</Label>
                <Switch checked={isActiveAdd} onCheckedChange={setIsActiveAdd} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Hủy</Button>
              <Button onClick={onSaveAdd} className="bg-gradient-to-r from-teal-400 to-sky-500 text-white font-semibold rounded-xl">Lưu</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Warning banners */}
      {(!models || models.length === 0) && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 px-4 py-3">
          Chưa có model nào. Hãy thêm model để bắt đầu.
        </div>
      )}

      {(models && models.length > 0 && !activeModel) && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 text-orange-800 px-4 py-3">
          Chưa có model được đặt Active. Hãy chọn một model và bấm "Set Active".
        </div>
      )}

      {envWarning && (
        <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-3">
          {envWarning}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models?.map((m: any) => (
          <Card key={m._id} className="bg-white/80 rounded-2xl p-4 shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{m.provider}</div>
                <div className="text-xs text-slate-600">{m.model}</div>
              </div>
              {m.isActive && <span className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700">Active</span>}
            </div>
            <div className="mt-2 text-xs text-slate-600">Alias: {m.aliasKey}</div>
            <div className="mt-2 text-xs text-slate-600">Status: {m.status}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => onPing(m._id)} variant="secondary" className="rounded-xl">Test</Button>
              <Button onClick={() => onSetActive(m._id)} className="bg-gradient-to-r from-teal-400 to-sky-500 text-white font-semibold rounded-xl">Set Active</Button>
              <Button onClick={() => onDelete(m._id)} variant="destructive" className="rounded-xl">Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      {statusText && (
        <div className="text-sm text-teal-700">{statusText}</div>
      )}
    </div>
  );
};

export default AiEnginePage;