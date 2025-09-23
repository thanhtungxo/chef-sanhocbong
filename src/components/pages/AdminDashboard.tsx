import React from 'react';
import { RulesetRegistry } from '@/components/pages/RulesetRegistry';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { FormPreview } from '@/components/pages/FormPreview';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 -mb-px border-b-2 ${active ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}

export const AdminDashboard: React.FC = () => {
  const [tab, setTab] = React.useState<'scholarships' | 'forms'>('scholarships');
  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 py-10">
      <div className="flex gap-4 border-b">
        <TabButton active={tab === 'scholarships'} onClick={() => setTab('scholarships')}>Học Bổng</TabButton>
        <TabButton active={tab === 'forms'} onClick={() => setTab('forms')}>Câu hỏi form</TabButton>
      </div>
      {tab === 'scholarships' ? (
        <RulesetRegistry />
      ) : (
        <FormBuilderBoundary>
          <FormBuilder />
        </FormBuilderBoundary>
      )}
    </div>
  );
};

class FormBuilderBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }>{
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, message: String(error?.message ?? error) }; }
  componentDidCatch(error: any) { console.error('FormBuilder error:', error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded border bg-red-50 text-red-700 p-4 text-sm">
          <div className="font-medium mb-1">Không tải được Form Builder</div>
          <p>{this.state.message}</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Đảm bảo đã chạy Convex dev hoặc deploy các hàm mới:</li>
          </ol>
          <pre className="bg-white border rounded p-2 mt-2 text-xs">npx convex dev
npx convex codegen
# hoặc deploy: npx convex deploy</pre>
          <p className="mt-2">Sau đó reload lại trang admin.</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const FormBuilder: React.FC = () => {
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

  const [selectedStepId, setSelectedStepId] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<null | { mode: 'add'|'edit'; question?: any }>(null);

  return (
    <div className="space-y-6">
      <div className="rounded border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Form Builder (beta)</h2>
        <p className="text-sm text-muted-foreground">
          Quản lý cấu trúc form động. Thêm/sửa/di chuyển/xóa Steps & Câu hỏi. Kéo‑thả sẽ bổ sung sau, hiện hỗ trợ Up/Down.
        </p>
      </div>

      <div className="rounded border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Form Sets</h3>
          <button
            className="px-3 py-2 rounded bg-primary text-white"
            onClick={async () => {
              const name = prompt('Tên Form Set', 'Default');
              if (!name) return;
              const version = prompt('Version', '1.0.0') ?? '1.0.0';
              await createFormSet({ name, version, activate: true } as any);
              alert('Đã tạo & kích hoạt Form Set');
            }}
          >
            Tạo & kích hoạt Form Set
          </button>
        </div>
        {!formSets ? (
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        ) : formSets.length === 0 ? (
          <div className="text-sm text-muted-foreground">Chưa có Form Set nào.</div>
        ) : (
          <ul className="text-sm list-disc ml-5">
            {formSets.map((fs: any) => (
              <li key={fs._id.id} className="flex items-center gap-2">
                <span>{fs.name} — v{fs.version} {fs.isActive ? '(active)' : ''}</span>
                {!fs.isActive && (
                  <button className="text-blue-600 underline" onClick={async ()=>{ await publishFormSet({ formSetId: fs._id }); alert('Đã kích hoạt'); }}>Kích hoạt</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded border bg-white p-4 space-y-4">
        <h3 className="font-medium">Form đang kích hoạt</h3>
        {!active ? (
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        ) : !active?.formSet ? (
          <div className="text-sm text-muted-foreground">Chưa có Form Set nào active.</div>
        ) : (
          <div className="grid md:grid-cols-[260px_1fr] gap-4">
            {/* Steps sidebar */}
            <div className="border rounded p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Steps</span>
                <button className="text-blue-600 text-sm" onClick={async ()=>{
                  const titleKey = prompt('Key tiêu đề step', 'ui.step.new');
                  if (!titleKey) return;
                  await createStep({ formSetId: active.formSet._id, titleKey } as any);
                  alert('Đã tạo step');
                }}>+ Thêm</button>
              </div>
              <ul className="space-y-1">
                {(active.steps ?? []).sort((a:any,b:any)=>a.order-b.order).map((s: any, idx: number, arr: any[]) => (
                  <li key={s._id.id} className={`p-2 rounded cursor-pointer ${selectedStepId===s._id.id ? 'bg-primary/10' : 'hover:bg-muted'}`} onClick={()=>setSelectedStepId(s._id.id)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <div className="font-medium">{s.titleKey}</div>
                        <div className="text-xs text-muted-foreground">order {s.order} — {(active.questionsByStep?.[s._id.id] ?? []).length} câu hỏi</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="text-xs" disabled={idx===0} onClick={async (e)=>{ e.stopPropagation(); const ids = arr.map((x:any)=>x._id); const tmp=[...ids]; [tmp[idx-1], tmp[idx]] = [tmp[idx], tmp[idx-1]]; await reorderSteps({ formSetId: active.formSet._id, orderedStepIds: tmp } as any); }}>↑</button>
                        <button className="text-xs" disabled={idx===arr.length-1} onClick={async (e)=>{ e.stopPropagation(); const ids = arr.map((x:any)=>x._id); const tmp=[...ids]; [tmp[idx+1], tmp[idx]] = [tmp[idx], tmp[idx+1]]; await reorderSteps({ formSetId: active.formSet._id, orderedStepIds: tmp } as any); }}>↓</button>
                        <button className="text-xs" onClick={async (e)=>{ e.stopPropagation(); const nk = prompt('Sửa key tiêu đề', s.titleKey) || s.titleKey; await updateStep({ stepId: s._id, titleKey: nk } as any); }}>Sửa</button>
                        <button className="text-xs text-red-600" onClick={async (e)=>{ e.stopPropagation(); if(confirm('Xóa step và toàn bộ câu hỏi?')){ await deleteStep({ stepId: s._id } as any); if(selectedStepId===s._id.id) setSelectedStepId(null); } }}>Xóa</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions panel */}
            <div className="border rounded p-3 space-y-4">
              {!selectedStepId ? (
                <div className="text-sm text-muted-foreground">Chọn một step để quản lý câu hỏi.</div>
              ) : (
                <QuestionsPanel
                  stepId={selectedStepId}
                  steps={(active.steps ?? []).sort((a:any,b:any)=>a.order-b.order)}
                  questions={(active.questionsByStep?.[selectedStepId] ?? []).sort((a:any,b:any)=>a.order-b.order)}
                  onAdd={()=> setEditing({ mode:'add' })}
                  onEdit={(q:any)=> setEditing({ mode:'edit', question: q })}
                  onReorder={async (ordered: any[])=>{ const stepObj = (active.steps ?? []).find((s:any)=>s._id.id===selectedStepId)?._id; await reorderQuestions({ stepId: stepObj, orderedQuestionIds: ordered.map((q:any)=>q._id) } as any); }}
                  onMove={async (qid:any, newStep:any)=>{ await updateQuestion({ questionId: qid, patch: { stepId: newStep } } as any); }}
                  onDelete={async (qid:any)=>{ if(confirm('Xóa câu hỏi này?')) await deleteQuestion({ questionId: qid } as any); }}
                />
              )}
              <div>
                <h4 className="font-medium mb-2">Preview</h4>
                <FormPreview active={active} />
              </div>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <QuestionEditor
          mode={editing.mode}
          steps={active?.steps ?? []}
          currentStepId={selectedStepId}
          formSetId={active?.formSet?._id}
          initial={editing.question}
          onClose={()=> setEditing(null)}
          onSave={async (payload:any)=>{
            if(editing.mode==='add'){
              await createQuestion(payload);
            } else if (editing.question){
              await updateQuestion({ questionId: editing.question._id, patch: payload.patch } as any);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

function QuestionsPanel({ stepId, steps, questions, onAdd, onEdit, onReorder, onMove, onDelete }:{ stepId:string; steps:any[]; questions:any[]; onAdd:()=>void; onEdit:(q:any)=>void; onReorder:(ordered:any[])=>Promise<void>; onMove:(qid:any, newStep:any)=>Promise<void>; onDelete:(qid:any)=>Promise<void>; }){
  const moveUp = async (idx:number) => {
    if (idx<=0) return; const tmp=[...questions]; [tmp[idx-1], tmp[idx]]=[tmp[idx], tmp[idx-1]]; await onReorder(tmp);
  };
  const moveDown = async (idx:number) => {
    if (idx>=questions.length-1) return; const tmp=[...questions]; [tmp[idx+1], tmp[idx]]=[tmp[idx], tmp[idx+1]]; await onReorder(tmp);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Câu hỏi</h4>
        <button className="px-3 py-2 rounded bg-primary text-white" onClick={onAdd}>+ Thêm câu hỏi</button>
      </div>
      {questions.length===0 ? (
        <div className="text-sm text-muted-foreground">Chưa có câu hỏi nào.</div>
      ) : (
        <ul className="divide-y">
          {questions.map((q:any, idx:number)=> (
            <li key={q._id.id} className="py-2 flex items-center gap-3">
              <div className="min-w-[140px] font-mono text-xs">{q.key}</div>
              <div className="text-sm">{q.labelKey}</div>
              <div className="text-xs text-muted-foreground">{q.type}{q.required?' *':''}</div>
              <div className="ml-auto flex items-center gap-2">
                <button className="text-xs" disabled={idx===0} onClick={()=>moveUp(idx)}>↑</button>
                <button className="text-xs" disabled={idx===questions.length-1} onClick={()=>moveDown(idx)}>↓</button>
                <select className="text-xs border rounded px-1 py-0.5" value={stepId} onChange={async (e)=>{ const newStep = steps.find((s:any)=>s._id.id===e.target.value)?._id; await onMove(q._id, newStep); }}>
                  {steps.map((s:any)=> (<option key={s._id.id} value={s._id.id}>{s.titleKey}</option>))}
                </select>
                <button className="text-xs text-blue-600" onClick={()=>onEdit(q)}>Sửa</button>
                <button className="text-xs text-red-600" onClick={()=>onDelete(q._id)}>Xóa</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuestionEditor({ mode, steps, currentStepId, formSetId, initial, onClose, onSave }:{ mode:'add'|'edit'; steps:any[]; currentStepId:string|null; formSetId:any; initial?:any; onClose:()=>void; onSave:(payload:any)=>Promise<void>; }){
  const [form, setForm] = React.useState<any>(()=> initial ? ({
    stepId: initial.stepId?.id ?? currentStepId,
    key: initial.key, labelKey: initial.labelKey, type: initial.type, required: !!initial.required,
    optionsText: (initial.options??[]).map((o:any)=>`${o.value}|${o.labelKey}`).join('\n'),
    mapTo: initial.mapTo ?? '', placeholderKey: initial.ui?.placeholderKey ?? '', widget: initial.ui?.widget ?? '',
    min: initial.validation?.min ?? '', max: initial.validation?.max ?? '', pattern: initial.validation?.pattern ?? '',
  }) : ({ stepId: currentStepId, key:'', labelKey:'', type:'text', required: true, optionsText:'', mapTo:'', placeholderKey:'', widget:'', min:'', max:'', pattern:'' }));
  const update = (k:string,v:any)=> setForm((p:any)=>({ ...p, [k]: v }));
  const parseOptions = () => form.optionsText.split('\n').map((l:string)=>l.trim()).filter(Boolean).map((l:string)=>{ const [v,lk] = l.split('|'); return { value: (v??'').trim(), labelKey: (lk??'').trim() }; });
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-[600px] max-w-[95vw] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{mode==='add'?'Thêm câu hỏi':'Sửa câu hỏi'}</h4>
          <button onClick={onClose} className="text-sm">Đóng</button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-1">Step
            <select className="w-full border rounded px-2 py-1" value={form.stepId ?? ''} onChange={(e)=>update('stepId', e.target.value)}>
              {steps.map((s:any)=> (<option key={s._id.id} value={s._id.id}>{s.titleKey}</option>))}
            </select>
          </label>
          <label>Key
            <input className="w-full border rounded px-2 py-1" value={form.key} onChange={(e)=>update('key', e.target.value)} placeholder="camelCase"/>
          </label>
          <label>Label key
            <input className="w-full border rounded px-2 py-1" value={form.labelKey} onChange={(e)=>update('labelKey', e.target.value)} placeholder="ui.xxx.label"/>
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
            <label className="col-span-2">Options (mỗi dòng: value|labelKey)
              <textarea className="w-full border rounded px-2 py-1 h-28" value={form.optionsText} onChange={(e)=>update('optionsText', e.target.value)} placeholder="vn|ui.country.vn"/>
            </label>
          )}
          <label>mapTo (tùy chọn)
            <input className="w-full border rounded px-2 py-1" value={form.mapTo} onChange={(e)=>update('mapTo', e.target.value)} placeholder="canonicalField"/>
          </label>
          <label>placeholderKey (tùy chọn)
            <input className="w-full border rounded px-2 py-1" value={form.placeholderKey} onChange={(e)=>update('placeholderKey', e.target.value)} placeholder="ui.xxx.placeholder"/>
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
          <button className="px-3 py-2" onClick={onClose}>Hủy</button>
          <button className="px-3 py-2 rounded bg-primary text-white" onClick={async ()=>{
            if (mode==='add'){
              if (!form.stepId || !form.key || !form.labelKey || !form.type){ alert('Thiếu stepId/key/labelKey/type'); return; }
              const payload:any = {
                formSetId,
                stepId: steps.find((s:any)=>s._id.id===form.stepId)?._id,
                key: form.key, labelKey: form.labelKey, type: form.type, required: !!form.required,
                options: parseOptions(),
                validation: {
                  min: form.min!=='' ? Number(form.min) : undefined,
                  max: form.max!=='' ? Number(form.max) : undefined,
                  pattern: form.pattern || undefined,
                },
                ui: { widget: form.widget || undefined, placeholderKey: form.placeholderKey || undefined },
                mapTo: form.mapTo || undefined,
              };
              await onSave(payload);
            } else {
              const patch:any = {
                stepId: form.stepId ? steps.find((s:any)=>s._id.id===form.stepId)?._id : undefined,
                labelKey: form.labelKey, type: form.type, required: !!form.required,
                options: parseOptions(),
                validation: {
                  min: form.min!=='' ? Number(form.min) : undefined,
                  max: form.max!=='' ? Number(form.max) : undefined,
                  pattern: form.pattern || undefined,
                },
                ui: { widget: form.widget || undefined, placeholderKey: form.placeholderKey || undefined },
                mapTo: form.mapTo || undefined,
              };
              await onSave({ patch });
            }
          }}>Lưu</button>
        </div>
      </div>
    </div>
  );
}
