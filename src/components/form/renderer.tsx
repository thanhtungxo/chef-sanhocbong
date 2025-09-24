import React from 'react';
import { z } from 'zod';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Radio } from '@/components/atoms/Radio';
import { t } from '@/lib/i18n';

export function buildZodField(q: any): z.ZodTypeAny {
  const required = !!q.required;
  const v = q.validation ?? {};
  const base = (() => {
    switch (q.type) {
      case 'number': {
        let t = z.coerce.number();
        if (typeof v.min === 'number') t = t.min(v.min);
        if (typeof v.max === 'number') t = t.max(v.max);
        return t;
      }
      case 'boolean':
        return z.boolean();
      case 'multi-select': {
        let t = z.array(z.string());
        if (required) t = t.nonempty('Required');
        return t;
      }
      case 'date':
      case 'autocomplete':
      case 'textarea':
      case 'text':
      case 'radio':
      case 'select':
      default: {
        let t = z.string();
        if (typeof v.pattern === 'string' && v.pattern) {
          try { t = t.regex(new RegExp(v.pattern)); } catch {}
        }
        return t;
      }
    }
  })();
  return required ? base : base.optional();
}

export function schemaForStep(questions: any[]): z.ZodSchema<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) shape[q.key] = buildZodField(q);
  return z.object(shape);
}

export function renderField(q: any, field: any, watch: any) {
  const common = { name: field.name, value: field.value ?? '', onBlur: field.onBlur, ref: field.ref } as any;
  const placeholder = t(q?.ui?.placeholderKey, q?.ui?.placeholderKey ?? '');
  switch (q.type) {
    case 'number':
      return (
        <Input {...common} type="number" onChange={(e)=> field.onChange(e)} placeholder={placeholder} />
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {(q.options ?? []).map((opt: any) => (
            <label key={opt.value} className="flex items-center gap-2">
              <Radio name={field.name} value={opt.value} checked={field.value === opt.value} onChange={(e)=> field.onChange((e.target as any).value)} />
              <span>{t(opt.labelKey, opt.labelKey)}</span>
            </label>
          ))}
        </div>
      );
    case 'select':
      return (
        <Select value={field.value ?? ''} onChange={(e)=> field.onChange(e)}>
          <option value="">--</option>
          {(q.options ?? []).map((opt: any)=> (
            <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.labelKey)}</option>
          ))}
        </Select>
      );
    case 'multi-select':
      return (
        <div className="space-y-2">
          {(q.options ?? []).map((opt: any) => {
            const selected: string[] = Array.isArray(field.value) ? field.value : [];
            const checked = selected.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-2">
                <input type="checkbox" checked={checked} onChange={(e)=> {
                  const next = e.target.checked ? [...selected, opt.value] : selected.filter(v=>v!==opt.value);
                  field.onChange(next);
                }} />
                <span>{t(opt.labelKey, opt.labelKey)}</span>
              </label>
            );
          })}
        </div>
      );
    case 'checkbox':
    case 'boolean':
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!field.value} onChange={(e)=> field.onChange(e.target.checked)} />
          <span>{placeholder}</span>
        </label>
      );
    case 'date':
      return (<Input {...common} type="date" onChange={(e)=> field.onChange(e)} placeholder={placeholder} />);
    case 'textarea':
      return (<textarea name={field.name} value={field.value ?? ''} onChange={(e)=> field.onChange((e.target as any).value)} className="w-full border rounded px-3 py-2" placeholder={placeholder} />);
    case 'autocomplete':
    case 'text':
    default:
      return (<Input {...common} type="text" onChange={(e)=> field.onChange(e)} placeholder={placeholder} />);
  }
}
