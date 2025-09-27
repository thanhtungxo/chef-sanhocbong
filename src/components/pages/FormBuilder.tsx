import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { t } from '@/lib/i18n';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border bg-white p-4 space-y-3">
      <div className="font-medium">{title}</div>
      {children}
    </div>
  );
}

export const FormBuilder: React.FC = () => {
  const formSets = useQuery(api.forms.listFormSets, {});
  const active = useQuery(api.forms.getActiveForm, {});

  const createFormSet = useMutation(api.forms.createFormSet);
  const publishFormSet = useMutation(api.forms.publishFormSet);
  const activateFormSet = useMutation(api.forms.activateFormSet);
  const createStep = useMutation(api.forms.createStep);
  const updateStep = useMutation(api.forms.updateStep);
  const deleteStep = useMutation(api.forms.deleteStep);
  const reorderSteps = useMutation(api.forms.reorderSteps);
  const createQuestion = useMutation(api.forms.createQuestion);
  const updateQuestion = useMutation(api.forms.updateQuestion);
  const deleteQuestion = useMutation(api.forms.deleteQuestion);
  const reorderQuestions = useMutation(api.forms.reorderQuestions);
  const seedLegacyForm = useMutation(api.forms.seedLegacyForm);
  const deleteFormSet = useMutation(api.forms.deleteFormSet);

  const [selectedStepId, setSelectedStepId] = React.useState<string | null>(null);
  const [editingQ, setEditingQ] = React.useState<null | { mode: 'add'|'edit'; q?: any }>(null);
  const [dragStepId, setDragStepId] = React.useState<string | null>(null);
  const [dragQuestionId, setDragQuestionId] = React.useState<string | null>(null);

  const steps = active?.steps ?? [];
  const stepIdToStringRoot = (step: any): string => {
    if (!step) return '';
    const raw = step?._id ?? step;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object' && raw) {
      if ('id' in raw && raw.id) return String(raw.id);
      const keys = Object.keys(raw as any);
      if (keys.includes('id')) return String((raw as any)['id']);
      if (keys.includes('value')) return String((raw as any)['value']);
    }
    return String(raw ?? '');
  };
  const questionsByStep = active?.questionsByStep ?? {};
  const selectedStep = selectedStepId ? steps.find((s: any) => stepIdToStringRoot(s) === selectedStepId) : null;
  const qSectionRef = React.useRef<HTMLDivElement | null>(null);
  
  const [editStep, setEditStep] = React.useState<{ step?: any } | null>(null);
  const [showAddStep, setShowAddStep] = React.useState(false);
  const [newStep, setNewStep] = React.useState<{ labelText: string; placeholderText: string; labelKey: string }>({ labelText: '', placeholderText: '', labelKey: '' });

  const slugify = (s: string) => {
    const noAccent = s.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
    return noAccent.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  };
  const regenLabelKey = (labelText: string) => `ui.step.${slugify(labelText)}.title`;

  React.useEffect(() => {
    if (!selectedStepId && steps.length) setSelectedStepId(stepIdToStringRoot(steps[0]));
  }, [steps, selectedStepId]);
  
  const doReorderSteps = async (sid: string, dir: -1 | 1) => {
    const ordered = steps.slice().sort((a: any,b:any)=>a.order-b.order);
    const idx = ordered.findIndex((s:any)=> stepIdToStringRoot(s)===sid);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= ordered.length) return;
    const swap = ordered[j];
    ordered[j] = ordered[idx];
    ordered[idx] = swap;
    await reorderSteps({ formSetId: active!.formSet._id as any, orderedStepIds: ordered.map((s:any)=> s._id) } as any);
  };

  const moveStep = async (sourceId: string, targetId: string) => {
    const ordered = steps.slice().sort((a:any,b:any)=> a.order-b.order);
    const from = ordered.findIndex((s:any)=> stepIdToStringRoot(s)===String(sourceId));
    const to = ordered.findIndex((s:any)=> stepIdToStringRoot(s)===String(targetId));
    if (from < 0 || to < 0 || from === to) return;
    const item = ordered.splice(from,1)[0];
    ordered.splice(to,0,item);
    await reorderSteps({ formSetId: active!.formSet._id as any, orderedStepIds: ordered.map((s:any)=> s._id) } as any);
  };

  const doReorderQuestions = async (qid: string, dir: -1 | 1) => {
    if (!selectedStep) return;
    const list = (questionsByStep[stepIdToStringRoot(selectedStep)] ?? []).slice().sort((a:any,b:any)=> a.order-b.order);
    const idx = list.findIndex((q:any)=> q._id.id===qid);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= list.length) return;
    const swap = list[j];
    list[j] = list[idx];
    list[idx] = swap;
    await reorderQuestions({ stepId: selectedStep._id as any, orderedQuestionIds: list.map((q:any)=> q._id) } as any);
  };

  const moveQuestion = async (sourceQId: string, targetQId: string) => {
    if (!selectedStep) return;
    const list = (questionsByStep[stepIdToStringRoot(selectedStep)] ?? []).slice().sort((a:any,b:any)=> a.order-b.order);
    const from = list.findIndex((q:any)=> String(q._id.id)===String(sourceQId));
    const to = list.findIndex((q:any)=> String(q._id.id)===String(targetQId));
    if (from < 0 || to < 0 || from === to) return;
    const item = list.splice(from,1)[0];
    list.splice(to,0,item);
    await reorderQuestions({ stepId: selectedStep._id as any, orderedQuestionIds: list.map((q:any)=> q._id) } as any);
  };

  const openAddQuestion = (presetStepId?: string) => setEditingQ({ mode: 'add', q: { stepId: presetStepId ? { id: presetStepId } : undefined } as any });
  const openEditQuestion = (q: any) => setEditingQ({ mode: 'edit', q });

  const saveQuestion = async (payload: any) => {
    if (!active?.formSet) return;
    if (editingQ?.mode === 'add') {
      const p: any = { ...payload, formSetId: active.formSet._id };
      await createQuestion(p);
    } else if (editingQ?.mode === 'edit' && editingQ.q) {
      const patch = { ...(payload.patch || {}) } as any;
      // If moved to another step, push to the end of destination step
      const newStepId = patch.stepId?.id as string | undefined;
      const oldStepId = editingQ.q.stepId?.id as string | undefined;
      if (newStepId && newStepId !== oldStepId) {
        const list = (questionsByStep[newStepId] ?? []).slice().sort((a:any,b:any)=> a.order-b.order);
        const lastOrder = list.length ? list[list.length - 1].order : 0;
        patch.order = lastOrder + 1;
      }
      await updateQuestion({ questionId: editingQ.q._id, patch } as any);
    }
    setEditingQ(null);
  };

  return (
    <div className="space-y-6">
      <Section title="Form Sets">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" className="px-3 py-2 rounded bg-primary text-white" onClick={async ()=>{
            const name = prompt('TÃªn Form Set', 'Default') || 'Default';
            const version = prompt('Version', '1.0.0') || '1.0.0';
            await createFormSet({ name, version, activate: true } as any);
            alert('ÄÃ£ táº¡o & kÃ­ch hoáº¡t Form Set');
          }}>Táº¡o & kÃ­ch hoáº¡t</button>
          <button type="button" className="px-3 py-2 rounded border" onClick={async ()=>{ await seedLegacyForm({ forceNew: false } as any); alert('ÄÃ£ seed form Legacy (náº¿u chÆ°a cÃ³).'); }}>Seed Legacy</button>
        </div>
        <div className="mt-2 text-sm">
          {(formSets ?? []).map((fs:any)=> (
            <div key={(fs._id?.id ?? fs._id) + ''} className="flex items-center justify-between py-1">
              <div>
                <span className="font-medium">{fs.name}</span> <span className="text-muted-foreground">(v{fs.version})</span>
                {active?.formSet && active.formSet._id.id===fs._id.id && <span className="ml-2 text-green-600">â€¢ active</span>}
              </div>
              <div className="flex gap-2">
                <button type="button" className="px-2 py-1 text-sm border rounded" onClick={async()=>{ await activateFormSet({ formSetId: fs._id } as any); }}>Activate</button>
                <button type="button" className="px-2 py-1 text-sm border rounded text-red-600" onClick={async()=>{ if (confirm('XÃ³a Form Set nÃ y vÃ  toÃ n bá»™ Steps/Questions?')) await deleteFormSet({ formSetId: fs._id } as any); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {!active?.formSet ? (
        <div className="text-sm text-muted-foreground">ChÆ°a cÃ³ Form Set active.</div>
      ) : (
        <div className="grid md:grid-cols-1 gap-6">
          <div className="space-y-6">
            <Section title={`Steps â€“ ${active.formSet.name} (v${active.formSet.version})`}>
              <div className="space-y-2">
                {(steps ?? []).map((s:any)=> (
                  <div
                    key={(s._id?.id ?? s._id) + '-' + s.order}
                    className={`flex items-center justify-between border rounded px-2 py-1 ${stepIdToStringRoot(s)===selectedStepId ? 'bg-primary/5 border-primary' : ''}`}
                    draggable
                    onDragStart={()=> setDragStepId(stepIdToStringRoot(s))}
                    onDragOver={(e)=> e.preventDefault()}
                    onDrop={async ()=>{ if (dragStepId) await moveStep(dragStepId, stepIdToStringRoot(s)); setDragStepId(null); }}
                  >
                    <div className="flex flex-col items-start gap-0">
                      <div className="flex items-center gap-2">
                        <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> { setSelectedStepId(stepIdToStringRoot(s)); qSectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>Chá»n</button>
                        <span className="font-medium">{s.ui?.labelText ?? t(s.titleKey, s.titleKey)}</span>
                        <span className="text-xs text-muted-foreground">#{s.order}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="mr-2">Key: {s.titleKey}</span>
                        {s.ui?.placeholderText && <span>â€¢ Placeholder: {s.ui.placeholderText}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> doReorderSteps(s._id.id, -1)}>Up</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> doReorderSteps(s._id.id, 1)}>Down</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> setEditStep({ step: s })}>Edit</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded text-red-600" onClick={async()=>{ if (confirm('XÃ³a step vÃ  toÃ n bá»™ cÃ¢u há»i?')) await deleteStep({ stepId: s._id } as any); }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <button type="button" className="px-3 py-2 rounded bg-primary text-white" onClick={()=>{
                  setNewStep({ labelText: '', placeholderText: '', labelKey: regenLabelKey('') });
                  setShowAddStep(true);
                }}>ThÃªm Step</button>
              </div>
            </Section>

            <Section title={`Questions ${selectedStep ? `â€“ ${t(selectedStep.titleKey, selectedStep.titleKey)}`: ''}`}>
              <div ref={qSectionRef} />
              {!selectedStep ? (
                <div className="text-sm text-muted-foreground">Chá»n má»™t Step Ä‘á»ƒ xem cÃ¢u há»i.</div>
              ) : (
                <div className="space-y-2">
                  {((questionsByStep[stepIdToStringRoot(selectedStep)] ?? []) as any[])
                    .filter((q:any)=> String(q.stepId?.id ?? q.stepId) === stepIdToStringRoot(selectedStep))
                    .sort((a:any,b:any)=> a.order - b.order)
                    .map((q:any)=> (
                      <div
                        key={(q._id?.id ?? q._id) + '-' + q.order}
                        className="flex items-center justify-between border rounded px-2 py-1"
                        draggable
                        onDragStart={()=> setDragQuestionId(String(q._id.id))}
                        onDragOver={(e)=> e.preventDefault()}
                        onDrop={async ()=>{ if (dragQuestionId) await moveQuestion(dragQuestionId, String(q._id.id)); setDragQuestionId(null); }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{q.ui?.labelText ?? t(q.labelKey, q.labelKey)}</span>
                          <span className="text-xs text-muted-foreground">[{q.key}] â€¢ {q.type} â€¢ #{q.order}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> doReorderQuestions(q._id.id, -1)}>Up</button>
                          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> doReorderQuestions(q._id.id, 1)}>Down</button>
                          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> openEditQuestion(q)}>Edit</button>
                          <button type="button" className="px-2 py-1 text-xs border rounded text-red-600" onClick={async()=>{ if (confirm('XÃ³a cÃ¢u há»i?')) await deleteQuestion({ questionId: q._id } as any); }}>Delete</button>
                        </div>
                      </div>
                  ))}
                  <div>
                    <button type="button" className="mt-2 px-3 py-2 rounded bg-primary text-white" onClick={()=> openAddQuestion(stepIdToStringRoot(selectedStep))}>ThÃªm cÃ¢u há»i</button>
                  </div>
                </div>
              )}
            </Section>

            {editingQ && (
              <QuestionEditor
                mode={editingQ.mode}
                steps={steps as any}
                formSetId={active.formSet._id as any}
                questionsByStep={questionsByStep as any}
                question={editingQ.q}
                onClose={()=> setEditingQ(null)}
                onSave={saveQuestion}
              />
            )}
          </div>

        </div>
      )}
      {editStep?.step && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={()=> setEditStep(null)}>
          <div className="bg-white rounded shadow-lg w-full max-w-md p-4" onClick={(e)=> e.stopPropagation()}>
            <div className="text-base font-semibold mb-3">Sá»­a Step</div>
            <EditStepInner step={editStep.step} onClose={()=> setEditStep(null)} onSave={async (patch)=>{ await updateStep({ stepId: editStep.step._id, ...patch } as any); setEditStep(null); }} />
          </div>
        </div>
      )}
      {showAddStep && active?.formSet && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={()=> setShowAddStep(false)}>
          <div className="bg-white rounded shadow-lg w-full max-w-md p-4" onClick={(e)=> e.stopPropagation()}>
            <div className="text-base font-semibold mb-3">ThÃªm Step</div>
            <div className="space-y-3">
              <label className="block">
                <div className="text-sm mb-1">Label (hiá»ƒn thá»‹) <span className="text-red-500">*</span></div>
                <input className="w-full border rounded px-2 py-1" value={newStep.labelText} onChange={(e)=>{
                  const v = e.target.value;
                  setNewStep({ ...newStep, labelText: v, labelKey: regenLabelKey(v) });
                }} placeholder="VÃ­ dá»¥: ThÃ´ng tin cÃ¡ nhÃ¢n" />
              </label>
              <label className="block">
                <div className="text-sm mb-1">Placeholder (hiá»ƒn thá»‹)</div>
                <input className="w-full border rounded px-2 py-1" value={newStep.placeholderText} onChange={(e)=> setNewStep({ ...newStep, placeholderText: e.target.value })} placeholder="TÃ¹y chá»n" />
              </label>
              <label className="block">
                <div className="text-sm mb-1">Label Key (tá»± sinh, khÃ´ng sá»­a)</div>
                <input className="w-full border rounded px-2 py-1 bg-muted" value={newStep.labelKey} readOnly />
              </label>
              <div className="text-xs text-muted-foreground">Label Key Ä‘Æ°á»£c sinh tá»± Ä‘á»™ng, khÃ´ng thá»ƒ sá»­a trong Admin UI</div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2" onClick={()=> setShowAddStep(false)}>Há»§y</button>
              <button className="px-3 py-2 rounded bg-primary text-white" onClick={async()=>{
                if (!newStep.labelText.trim()) { alert('Vui lÃ²ng nháº­p Label'); return; }
                await createStep({ formSetId: active.formSet._id as any, titleKey: newStep.labelKey, ui: { labelText: newStep.labelText, placeholderText: newStep.placeholderText || undefined } } as any);
                setShowAddStep(false);
              }}>LÆ°u</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function EditStepInner({ step, onClose, onSave }: { step: any; onClose: ()=>void; onSave: (patch: any)=>Promise<void>; }){
  const [form, setForm] = React.useState<{ titleKey: string; labelText: string; placeholderText: string }>(()=> ({
    titleKey: step.titleKey,
    labelText: step.ui?.labelText ?? '',
    placeholderText: step.ui?.placeholderText ?? '',
  }));
  const update = (k: string, v: string)=> setForm(p=> ({ ...p, [k]: v }));
  const [saving, setSaving] = React.useState(false);
  return (
    <div className="space-y-3">
      <label className="block">
        <div className="text-sm mb-1">Label (hiá»ƒn thá»‹)</div>
        <input className="w-full border rounded px-2 py-1" value={form.labelText} onChange={(e)=> update('labelText', e.target.value)} placeholder="Nháº­p tiÃªu Ä‘á» Step hiá»ƒn thá»‹" />
      </label>
      <label className="block">
        <div className="text-sm mb-1">Placeholder (hiá»ƒn thá»‹)</div>
        <input className="w-full border rounded px-2 py-1" value={form.placeholderText} onChange={(e)=> update('placeholderText', e.target.value)} placeholder="Nháº­p placeholder cho Step (tuá»³ chá»n)" />
      </label>
      <label className="block">
        <div className="text-sm mb-1">Title key</div>
        <input className="w-full border rounded px-2 py-1" value={form.titleKey} onChange={(e)=> update('titleKey', e.target.value)} placeholder="ui.step.xxx.title" />
      </label>
      <div className="flex justify-end gap-2">
        <button className="px-3 py-2" onClick={onClose} disabled={saving}>Há»§y</button>
        <button className="px-3 py-2 rounded bg-primary text-white" disabled={saving} onClick={async ()=>{
          try {
            setSaving(true);
            await onSave({ titleKey: form.titleKey, ui: { labelText: form.labelText || undefined, placeholderText: form.placeholderText || undefined } });
            onClose();
          } finally { setSaving(false); }
        }}>LÆ°u</button>
      </div>
    </div>
  );
}

function QuestionEditor({ mode, steps, formSetId, questionsByStep, question, onClose, onSave }: { mode: 'add'|'edit'; steps: any[]; formSetId: any; questionsByStep: Record<string, any[]>; question?: any; onClose: ()=>void; onSave: (payload: any)=>Promise<void>; }){
  const stepIdToString = (step: any): string => {
    if (!step) return '';
    const raw = step._id ?? step;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object' && raw) {
      if ('id' in raw && raw.id) return String(raw.id);
      const keys = Object.keys(raw as any);
      if (keys.includes('id')) return String((raw as any)['id']);
      if (keys.includes('value')) return String((raw as any)['value']);
    }
    return String(raw ?? '');
  };
  const normalizeStepId = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      if ('id' in val && (val as any).id) return String((val as any).id);
      if ('_id' in val && (val as any)._id) return normalizeStepId((val as any)._id);
      const keys = Object.keys(val as any);
      if (keys.includes('id')) return String((val as any)['id']);
      if (keys.includes('value')) return String((val as any)['value']);
    }
    return String(val ?? '');
  };
  const fallbackStepId = steps.length ? stepIdToString(steps[0]) : '';
  const initialStepId = normalizeStepId(question?.stepId) || fallbackStepId;

  const findStepById = (id: string) => steps.find((s:any)=> stepIdToString(s) === id);

  const [form, setForm] = React.useState<any>(()=>{
    if (mode==='edit' && question) {
      return {
        stepId: initialStepId,
        key: question.key,
        labelKey: question.labelKey,
        labelText: question.ui?.labelText ?? '',
        type: question.type,
        required: !!question.required,
        optionsText: (question.options ?? []).map((o:any)=> {
          if (o.labelKey && o.labelText) return `${o.value}|${o.labelKey}|${o.labelText}`;
          if (o.labelKey) return `${o.value}|${o.labelKey}`;
          if (o.labelText) return `${o.value}|${o.labelText}`;
          return `${o.value}|`;
        }).join('\n'),
        mapTo: question.mapTo ?? '',
        widget: question.ui?.widget ?? '',
        placeholderKey: question.ui?.placeholderKey ?? '',
        placeholderText: question.ui?.placeholderText ?? '',
        min: question.validation?.min ?? '',
        max: question.validation?.max ?? '',
        pattern: question.validation?.pattern ?? '',
      };
    }
    return { stepId: initialStepId, key: '', labelKey: '', labelText: '', type: 'text', required: false, optionsText: '', mapTo: '', widget: '', placeholderKey: '', placeholderText: '', min: '', max: '', pattern: '' };
  });
  const update = (k:string, v:any)=> setForm((p:any)=> ({ ...p, [k]: v }));
  const parseOptions = () => form.optionsText
    .split('\n')
    .map((l:string)=> l.trim())
    .filter(Boolean)
    .map((line:string)=>{
      const parts = line.split('|');
      const value = (parts[0] ?? '').trim();
      const second = (parts[1] ?? '').trim();
      const third = (parts[2] ?? '').trim();
      if (!value) return null as any;
      if (third) return { value, labelKey: second || undefined, labelText: third };
      // náº¿u chá»‰ cÃ³ 2 pháº§n: náº¿u pháº§n 2 trÃ´ng nhÆ° key i18n (báº¯t Ä‘áº§u báº±ng 'ui.'), coi lÃ  labelKey; ngÆ°á»£c láº¡i coi lÃ  labelText
      if (second) {
        if (second.startsWith('ui.')) return { value, labelKey: second } as any;
        return { value, labelText: second } as any;
      }
      return { value } as any;
    })
    .filter(Boolean);
  const serializeOptions = (arr:any[]) => arr.map((o:any)=> o.labelKey && o.labelText ? `${o.value}|${o.labelKey}|${o.labelText}` : o.labelKey ? `${o.value}|${o.labelKey}` : o.labelText ? `${o.value}|${o.labelText}` : `${o.value}|`).join('\n');

  const [optList, setOptList] = React.useState<any[]>(parseOptions());
  React.useEffect(()=>{
    setOptList(parseOptions());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.optionsText]);
  const commitOptions = (arr:any[]) => {
    setOptList(arr);
    update('optionsText', serializeOptions(arr));
  };
  const [saving, setSaving] = React.useState(false);
  const [adv, setAdv] = React.useState(false);
  const removeDiacritics = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
  const toCamelKey = (s: string) => {
    const base = removeDiacritics(s).toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').trim().split(/\s+/);
    if (base.length === 0) return '';
    return base[0] + base.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  };
  React.useEffect(()=>{
    if (adv) return;
    const base = toCamelKey(String(form.labelText||''));
    if (!base) return;
    // key/labelKey sáº½ Ä‘Æ°á»£c Convex Ä‘áº£m báº£o unique khi insert; á»Ÿ UI chá»‰ hiá»ƒn thá»‹ dá»± kiáº¿n
    update('key', base);
    update('labelKey', "ui." + base + ".label");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.labelText, adv]);
  React.useEffect(()=>{
    if (!form.stepId && fallbackStepId) {
      update('stepId', fallbackStepId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackStepId]);
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded shadow-lg w-full max-w-2xl p-4 space-y-3">
        <div className="font-medium">{mode==='add' ? 'ThÃªm cÃ¢u há»i' : 'Sá»­a cÃ¢u há»i'}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2">Step
            <select className="w-full border rounded px-2 py-1" value={form.stepId} onChange={(e)=> update('stepId', e.target.value)}>
              {steps.map((s:any)=> (<option key={stepIdToString(s)} value={stepIdToString(s)}>{s.ui?.labelText ?? s.titleKey}</option>))}
            </select>
          </label>
          <div className="col-span-2 flex items-center gap-2">
            <input id="advToggleQ" type="checkbox" checked={adv} onChange={(e)=> setAdv(e.target.checked)} />
            <label htmlFor="advToggleQ">Allow edit advanced fields</label>
          </div>
          <label>Key
            <input className="w-full border rounded px-2 py-1" value={form.key} onChange={(e)=>update('key', e.target.value)} placeholder="camelCase" readOnly={!adv}/>
          </label>
          <label>Label key
            <input className="w-full border rounded px-2 py-1" value={form.labelKey} onChange={(e)=>update('labelKey', e.target.value)} placeholder="ui.xxx.label" readOnly={!adv}/>
          </label>
          <label>Label (hiá»ƒn thá»‹)
            <input className="w-full border rounded px-2 py-1" value={form.labelText} onChange={(e)=>update('labelText', e.target.value)} placeholder="Nháº­p cÃ¢u há»i hiá»ƒn thá»‹ cho ngÆ°á»i dÃ¹ng"/>
          </label>
          <label>Type
            <select className="w-full border rounded px-2 py-1" value={form.type} onChange={(e)=>update('type', e.target.value)}>
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="radio">radio</option>
              <option value="select">select</option>
              <option value="multi-select">multi-select</option>
              <option value="checkbox">checkbox</option>
              <option value="date">date</option>
              <option value="autocomplete">autocomplete</option>
              <option value="boolean">boolean</option>
              <option value="textarea">textarea</option>
            </select>
          </label>
          <label>Required
            <select className="w-full border rounded px-2 py-1" value={form.required ? '1':'0'} onChange={(e)=>update('required', e.target.value==='1')}>
              <option value="1">CÃ³</option>
              <option value="0">KhÃ´ng</option>
            </select>
          </label>
          {(form.type==='select' || form.type==='radio' || form.type==='multi-select' || form.type==='autocomplete') && (
            <label className="col-span-2">Options (má»—i dÃ²ng: value|labelKey hoáº·c value|labelText hoáº·c value|labelKey|labelText)
              <textarea className="w-full border rounded px-2 py-1 h-28" value={form.optionsText} onChange={(e)=>update('optionsText', e.target.value)} placeholder="Bachelor|Cá»­ nhÃ¢n hoáº·c Bachelor|ui.education.highest.bachelor hoáº·c Bachelor|ui.education.highest.bachelor|Cá»­ nhÃ¢n"/>
              <div className="mt-2 border rounded p-2 space-y-2 bg-muted/20">
                {optList.map((o:any, idx:number)=> (
                  <div key={String(o.value ?? 'opt') + '-' + String(idx)} className="grid grid-cols-12 gap-2 items-center">
                    <input className="col-span-3 border rounded px-2 py-1" value={o.value} onChange={(e)=>{ const arr=[...optList]; arr[idx]={...arr[idx], value:e.target.value}; commitOptions(arr);} } placeholder="value"/>
                    <input className="col-span-4 border rounded px-2 py-1" value={o.labelKey ?? ''} onChange={(e)=>{ const arr=[...optList]; arr[idx]={...arr[idx], labelKey:e.target.value||undefined}; commitOptions(arr);} } placeholder="labelKey (tÃ¹y chá»n)"/>
                    <input className="col-span-4 border rounded px-2 py-1" value={o.labelText ?? ''} onChange={(e)=>{ const arr=[...optList]; arr[idx]={...arr[idx], labelText:e.target.value||undefined}; commitOptions(arr);} } placeholder="labelText (hiá»ƒn thá»‹)"/>
                    <div className="col-span-1 flex gap-1">
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=>{ if(idx>0){ const arr=[...optList]; const it=arr.splice(idx,1)[0]; arr.splice(idx-1,0,it); commitOptions(arr);} }}>â†‘</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=>{ if(idx<optList.length-1){ const arr=[...optList]; const it=arr.splice(idx,1)[0]; arr.splice(idx+1,0,it); commitOptions(arr);} }}>â†“</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded text-red-600" onClick={()=>{ const arr=[...optList]; arr.splice(idx,1); commitOptions(arr); }}>âœ•</button>
                    </div>
                  </div>
                ))}
                <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=>{ commitOptions([...(optList||[]), { value:'', labelText:'' }]); }}>+ Add option</button>
              </div>
            </label>
          )}
          <label>mapTo (tÃ¹y chá»n)
            <input className="w-full border rounded px-2 py-1" value={form.mapTo} onChange={(e)=>update('mapTo', e.target.value)} placeholder="canonicalField"/>
          </label>
          <label>placeholderKey (tÃ¹y chá»n)
            <input className="w-full border rounded px-2 py-1" value={form.placeholderKey} onChange={(e)=>update('placeholderKey', e.target.value)} placeholder="ui.xxx.placeholder"/>
          </label>
          <label>Placeholder (hiá»ƒn thá»‹)
            <input className="w-full border rounded px-2 py-1" value={form.placeholderText} onChange={(e)=>update('placeholderText', e.target.value)} placeholder="Nháº­p placeholder hiá»ƒn thá»‹ cho ngÆ°á»i dÃ¹ng"/>
          </label>
          <label>widget (tÃ¹y chá»n)
            <input className="w-full border rounded px-2 py-1" value={form.widget} onChange={(e)=>update('widget', e.target.value)} placeholder="text|number|radio|select|..."/>
          </label>
          <label>min (number)
            <input className="w-full border rounded px-2 py-1" value={form.min} onChange={(e)=>update('min', e.target.value)} placeholder=""/>
          </label>
          <label>max (number)
            <input className="w-full border rounded px-2 py-1" value={form.max} onChange={(e)=>update('max', e.target.value)} placeholder=""/>
          </label>
          <label className="col-span-2">pattern (regex string)
            <input className="w-full border rounded px-2 py-1" value={form.pattern} onChange={(e)=>update('pattern', e.target.value)} placeholder="^.*$"/>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2" onClick={onClose} disabled={saving}>Há»§y</button>
          <button className="px-3 py-2 rounded bg-primary text-white" disabled={saving} onClick={async ()=>{
            try {
              setSaving(true);
              if (mode==='add'){
                const selectedStepId = normalizeStepId(form.stepId);
                const stepObj = selectedStepId ? findStepById(selectedStepId) : undefined;

                if (!stepObj){
                  console.debug('question-add-save-no-step', { rawStepId: form.stepId, selectedStepId, availableSteps: steps.map((s:any)=> ({ id: stepIdToString(s), rawId: s._id, label: s.ui?.labelText ?? s.titleKey })) });
                  alert('Vui lÃ²ng chá»n Step trÆ°á»›c khi lÆ°u');
                  setSaving(false);
                  return;
                }
                let keyStr = String(form.key||'');
                let labelKeyStr = String(form.labelKey||'');
                if (!keyStr) {
                  const base = toCamelKey(String(form.labelText||''));
                  if (!base) { alert('Thiáº¿u key'); setSaving(false); return; }
                  keyStr = base;
                }
                if (!labelKeyStr) labelKeyStr = "ui." + keyStr + ".label";
                if (!form.type) { alert('Thiáº¿u type'); setSaving(false); return; }
                if (false){ alert('Thiáº¿u stepId/key/labelKey/type'); setSaving(false); return; }
                const payload:any = {
                  formSetId,
                  stepId: stepObj._id,
                  key: keyStr, labelKey: labelKeyStr, type: form.type, required: !!form.required,
                  options: parseOptions(),
                  validation: {
                    min: form.min!=='' ? Number(form.min) : undefined,
                    max: form.max!=='' ? Number(form.max) : undefined,
                    pattern: form.pattern || undefined,
                  },
                ui: { widget: form.widget || undefined, placeholderKey: form.placeholderKey || undefined, placeholderText: form.placeholderText || undefined, labelText: form.labelText || undefined },
                  mapTo: form.mapTo || undefined,
                };
                await onSave(payload);
              } else {
                const patch:any = {
                  stepId: (() => {
                    const selectedStepId = normalizeStepId(form.stepId);
                    if (!selectedStepId) return undefined;
                    const stepObj = findStepById(selectedStepId);
                    return stepObj?._id;
                  })(),
                  key: form.key, labelKey: form.labelKey, type: form.type, required: !!form.required,
                  options: parseOptions(),
                  validation: {
                    min: form.min!=='' ? Number(form.min) : undefined,
                    max: form.max!=='' ? Number(form.max) : undefined,
                    pattern: form.pattern || undefined,
                  },
                  ui: { widget: form.widget || undefined, placeholderKey: form.placeholderKey || undefined, placeholderText: form.placeholderText || undefined, labelText: form.labelText || undefined },
                  mapTo: form.mapTo || undefined,
                };
                await onSave({ patch });
              }
              alert('ÄÃ£ lÆ°u');
              onClose();
            } catch (e:any) {
              console.error('Save question failed', e);
              alert('LÆ°u tháº¥t báº¡i: ' + (e?.message || String(e)));
            } finally {
              setSaving(false);
            }
          }}>LÆ°u</button>
        </div>
      </div>
    </div>
  );
}














