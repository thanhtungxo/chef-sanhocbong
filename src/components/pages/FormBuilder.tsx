import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { FormPreview } from '@/components/pages/FormPreview';
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
  const createStep = useMutation(api.forms.createStep);
  const updateStep = useMutation(api.forms.updateStep);
  const deleteStep = useMutation(api.forms.deleteStep);
  const reorderSteps = useMutation(api.forms.reorderSteps);
  const createQuestion = useMutation(api.forms.createQuestion);
  const updateQuestion = useMutation(api.forms.updateQuestion);
  const deleteQuestion = useMutation(api.forms.deleteQuestion);
  const reorderQuestions = useMutation(api.forms.reorderQuestions);
  const seedLegacyForm = useMutation(api.forms.seedLegacyForm);

  const [selectedStepId, setSelectedStepId] = React.useState<string | null>(null);
  const [editingQ, setEditingQ] = React.useState<null | { mode: 'add'|'edit'; q?: any }>(null);
  const [dragStepId, setDragStepId] = React.useState<string | null>(null);
  const [dragQuestionId, setDragQuestionId] = React.useState<string | null>(null);

  const steps = active?.steps ?? [];
  const questionsByStep = active?.questionsByStep ?? {};
  const selectedStep = selectedStepId ? steps.find((s: any) => String(s._id.id) === selectedStepId) : null;
  const qSectionRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!selectedStepId && steps.length) setSelectedStepId(String(steps[0]._id.id));
  }, [steps, selectedStepId]);

  const doReorderSteps = async (sid: string, dir: -1 | 1) => {
    const ordered = steps.slice().sort((a: any,b:any)=>a.order-b.order);
    const idx = ordered.findIndex((s:any)=> s._id.id===sid);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= ordered.length) return;
    const swap = ordered[j];
    ordered[j] = ordered[idx];
    ordered[idx] = swap;
    await reorderSteps({ formSetId: active!.formSet._id as any, orderedStepIds: ordered.map((s:any)=> s._id) } as any);
  };

  const moveStep = async (sourceId: string, targetId: string) => {
    const ordered = steps.slice().sort((a:any,b:any)=> a.order-b.order);
    const from = ordered.findIndex((s:any)=> String(s._id.id)===String(sourceId));
    const to = ordered.findIndex((s:any)=> String(s._id.id)===String(targetId));
    if (from < 0 || to < 0 || from === to) return;
    const item = ordered.splice(from,1)[0];
    ordered.splice(to,0,item);
    await reorderSteps({ formSetId: active!.formSet._id as any, orderedStepIds: ordered.map((s:any)=> s._id) } as any);
  };

  const doReorderQuestions = async (qid: string, dir: -1 | 1) => {
    if (!selectedStep) return;
    const list = (questionsByStep[selectedStep._id.id] ?? []).slice().sort((a:any,b:any)=> a.order-b.order);
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
    const list = (questionsByStep[selectedStep._id.id] ?? []).slice().sort((a:any,b:any)=> a.order-b.order);
    const from = list.findIndex((q:any)=> String(q._id.id)===String(sourceQId));
    const to = list.findIndex((q:any)=> String(q._id.id)===String(targetQId));
    if (from < 0 || to < 0 || from === to) return;
    const item = list.splice(from,1)[0];
    list.splice(to,0,item);
    await reorderQuestions({ stepId: selectedStep._id as any, orderedQuestionIds: list.map((q:any)=> q._id) } as any);
  };

  const openAddQuestion = () => setEditingQ({ mode: 'add' });
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
            const name = prompt('Tên Form Set', 'Default') || 'Default';
            const version = prompt('Version', '1.0.0') || '1.0.0';
            await createFormSet({ name, version, activate: true } as any);
            alert('Đã tạo & kích hoạt Form Set');
          }}>Tạo & kích hoạt</button>
          <button type="button" className="px-3 py-2 rounded border" onClick={async ()=>{ await seedLegacyForm({ forceNew: false } as any); alert('Đã seed form Legacy (nếu chưa có).'); }}>Seed Legacy</button>
        </div>
        <div className="mt-2 text-sm">
          {(formSets ?? []).map((fs:any)=> (
            <div key={(fs._id?.id ?? fs._id) + ''} className="flex items-center justify-between py-1">
              <div>
                <span className="font-medium">{fs.name}</span> <span className="text-muted-foreground">(v{fs.version})</span>
                {active?.formSet && active.formSet._id.id===fs._id.id && <span className="ml-2 text-green-600">• active</span>}
              </div>
              <div className="flex gap-2">
                <button type="button" className="px-2 py-1 text-sm border rounded" onClick={async()=>{ await publishFormSet({ formSetId: fs._id } as any); }}>Activate</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {!active?.formSet ? (
        <div className="text-sm text-muted-foreground">Chưa có Form Set active.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Section title={`Steps – ${active.formSet.name} (v${active.formSet.version})`}>
              <div className="space-y-2">
                {(steps ?? []).map((s:any)=> (
                  <div
                    key={(s._id?.id ?? s._id) + '-' + s.order}
                    className={`flex items-center justify-between border rounded px-2 py-1 ${selectedStepId===s._id.id ? 'bg-primary/5 border-primary' : ''}`}
                    draggable
                    onDragStart={()=> setDragStepId(String(s._id.id))}
                    onDragOver={(e)=> e.preventDefault()}
                    onDrop={async ()=>{ if (dragStepId) await moveStep(dragStepId, String(s._id.id)); setDragStepId(null); }}
                  >
                    <div className="flex items-center gap-2">
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> { setSelectedStepId(String(s._id.id)); qSectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>Chọn</button>
                      <span className="font-medium">{t(s.titleKey, s.titleKey)}</span>
                      <span className="text-xs text-muted-foreground">#{s.order}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> doReorderSteps(s._id.id, -1)}>Up</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> doReorderSteps(s._id.id, 1)}>Down</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={async()=>{
                        const titleKey = prompt('Title key', s.titleKey) || s.titleKey;
                        await updateStep({ stepId: s._id, titleKey } as any);
                      }}>Edit</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded text-red-600" onClick={async()=>{ if (confirm('Xóa step và toàn bộ câu hỏi?')) await deleteStep({ stepId: s._id } as any); }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <button type="button" className="px-3 py-2 rounded bg-primary text-white" onClick={async()=>{
                  const titleKey = prompt('Title key', 'ui.step.title') || 'ui.step.title';
                  await createStep({ formSetId: active.formSet._id as any, titleKey } as any);
                }}>Thêm Step</button>
              </div>
            </Section>

            <Section title={`Questions ${selectedStep ? `– ${t(selectedStep.titleKey, selectedStep.titleKey)}`: ''}`}>
              <div ref={qSectionRef} />
              {!selectedStep ? (
                <div className="text-sm text-muted-foreground">Chọn một Step để xem câu hỏi.</div>
              ) : (
                <div className="space-y-2">
                  {((questionsByStep[selectedStep._id.id] ?? []) as any[])
                    .filter((q:any)=> String(q.stepId?.id) === String(selectedStep._id.id))
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
                          <span className="text-xs text-muted-foreground">[{q.key}] • {q.type} • #{q.order}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> doReorderQuestions(q._id.id, -1)}>Up</button>
                          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> doReorderQuestions(q._id.id, 1)}>Down</button>
                          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=> openEditQuestion(q)}>Edit</button>
                          <button type="button" className="px-2 py-1 text-xs border rounded text-red-600" onClick={async()=>{ if (confirm('Xóa câu hỏi?')) await deleteQuestion({ questionId: q._id } as any); }}>Delete</button>
                        </div>
                      </div>
                  ))}
                  <div>
                    <button type="button" className="mt-2 px-3 py-2 rounded bg-primary text-white" onClick={openAddQuestion}>Thêm câu hỏi</button>
                  </div>
                </div>
              )}
            </Section>

            {editingQ && (
              <QuestionEditor
                mode={editingQ.mode}
                steps={steps as any}
                formSetId={active.formSet._id as any}
                question={editingQ.q}
                onClose={()=> setEditingQ(null)}
                onSave={saveQuestion}
              />
            )}
          </div>

          <div className="space-y-6">
            <Section title="Preview">
              <FormPreview active={active as any} />
            </Section>
          </div>
        </div>
      )}
    </div>
  );
};

function QuestionEditor({ mode, steps, formSetId, question, onClose, onSave }: { mode: 'add'|'edit'; steps: any[]; formSetId: any; question?: any; onClose: ()=>void; onSave: (payload: any)=>Promise<void>; }){
  const [form, setForm] = React.useState<any>(()=>{
    if (mode==='edit' && question) {
      return {
        stepId: question.stepId.id,
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
    return { stepId: steps[0]?._id.id ?? '', key: '', labelKey: '', labelText: '', type: 'text', required: false, optionsText: '', mapTo: '', widget: '', placeholderKey: '', placeholderText: '', min: '', max: '', pattern: '' };
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
      // nếu chỉ có 2 phần: nếu phần 2 trông như key i18n (bắt đầu bằng 'ui.'), coi là labelKey; ngược lại coi là labelText
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
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded shadow-lg w-full max-w-2xl p-4 space-y-3">
        <div className="font-medium">{mode==='add' ? 'Thêm câu hỏi' : 'Sửa câu hỏi'}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2">Step
            <select className="w-full border rounded px-2 py-1" value={form.stepId} onChange={(e)=> update('stepId', e.target.value)}>
              {steps.map((s:any)=> (<option key={s._id.id} value={s._id.id}>{s.titleKey}</option>))}
            </select>
          </label>
          {mode==='add' && (
            <label>Key
              <input className="w-full border rounded px-2 py-1" value={form.key} onChange={(e)=>update('key', e.target.value)} placeholder="camelCase"/>
            </label>
          )}
          <label>Label key
            <input className="w-full border rounded px-2 py-1" value={form.labelKey} onChange={(e)=>update('labelKey', e.target.value)} placeholder="ui.xxx.label"/>
          </label>
          <label>Label (hiển thị)
            <input className="w-full border rounded px-2 py-1" value={form.labelText} onChange={(e)=>update('labelText', e.target.value)} placeholder="Nhập câu hỏi hiển thị cho người dùng"/>
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
              <option value="1">Có</option>
              <option value="0">Không</option>
            </select>
          </label>
          {(form.type==='select' || form.type==='radio' || form.type==='multi-select' || form.type==='autocomplete') && (
            <label className="col-span-2">Options (mỗi dòng: value|labelKey hoặc value|labelText hoặc value|labelKey|labelText)
              <textarea className="w-full border rounded px-2 py-1 h-28" value={form.optionsText} onChange={(e)=>update('optionsText', e.target.value)} placeholder="Bachelor|Cử nhân hoặc Bachelor|ui.education.highest.bachelor hoặc Bachelor|ui.education.highest.bachelor|Cử nhân"/>
              <div className="mt-2 border rounded p-2 space-y-2 bg-muted/20">
                {optList.map((o:any, idx:number)=> (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input className="col-span-3 border rounded px-2 py-1" value={o.value} onChange={(e)=>{ const arr=[...optList]; arr[idx]={...arr[idx], value:e.target.value}; commitOptions(arr);} } placeholder="value"/>
                    <input className="col-span-4 border rounded px-2 py-1" value={o.labelKey ?? ''} onChange={(e)=>{ const arr=[...optList]; arr[idx]={...arr[idx], labelKey:e.target.value||undefined}; commitOptions(arr);} } placeholder="labelKey (tùy chọn)"/>
                    <input className="col-span-4 border rounded px-2 py-1" value={o.labelText ?? ''} onChange={(e)=>{ const arr=[...optList]; arr[idx]={...arr[idx], labelText:e.target.value||undefined}; commitOptions(arr);} } placeholder="labelText (hiển thị)"/>
                    <div className="col-span-1 flex gap-1">
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=>{ if(idx>0){ const arr=[...optList]; const it=arr.splice(idx,1)[0]; arr.splice(idx-1,0,it); commitOptions(arr);} }}>↑</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=>{ if(idx<optList.length-1){ const arr=[...optList]; const it=arr.splice(idx,1)[0]; arr.splice(idx+1,0,it); commitOptions(arr);} }}>↓</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded text-red-600" onClick={()=>{ const arr=[...optList]; arr.splice(idx,1); commitOptions(arr); }}>✕</button>
                    </div>
                  </div>
                ))}
                <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=>{ commitOptions([...(optList||[]), { value:'', labelText:'' }]); }}>+ Add option</button>
              </div>
            </label>
          )}
          <label>mapTo (tùy chọn)
            <input className="w-full border rounded px-2 py-1" value={form.mapTo} onChange={(e)=>update('mapTo', e.target.value)} placeholder="canonicalField"/>
          </label>
          <label>placeholderKey (tùy chọn)
            <input className="w-full border rounded px-2 py-1" value={form.placeholderKey} onChange={(e)=>update('placeholderKey', e.target.value)} placeholder="ui.xxx.placeholder"/>
          </label>
          <label>Placeholder (hiển thị)
            <input className="w-full border rounded px-2 py-1" value={form.placeholderText} onChange={(e)=>update('placeholderText', e.target.value)} placeholder="Nhập placeholder hiển thị cho người dùng"/>
          </label>
          <label>widget (tùy chọn)
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
          <button className="px-3 py-2" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="px-3 py-2 rounded bg-primary text-white" disabled={saving} onClick={async ()=>{
            try {
              setSaving(true);
              if (mode==='add'){
                if (!form.stepId || !form.key || !form.labelKey || !form.type){ alert('Thiếu stepId/key/labelKey/type'); setSaving(false); return; }
                const payload:any = {
                  formSetId,
                  stepId: steps.find((s:any)=> String(s._id.id)===String(form.stepId))?._id,
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
                await onSave(payload);
              } else {
                const patch:any = {
                  stepId: form.stepId ? steps.find((s:any)=> String(s._id.id)===String(form.stepId))?._id : undefined,
                  labelKey: form.labelKey, type: form.type, required: !!form.required,
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
              alert('Đã lưu');
              onClose();
            } catch (e:any) {
              console.error('Save question failed', e);
              alert('Lưu thất bại: ' + (e?.message || String(e)));
            } finally {
              setSaving(false);
            }
          }}>Lưu</button>
        </div>
      </div>
    </div>
  );
}
