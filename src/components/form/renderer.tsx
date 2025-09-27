import React from 'react';
import { z } from 'zod';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Radio } from '@/components/atoms/Radio';
import { tOptional } from '@/lib/i18n';

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
      case 'checkbox':
      case 'boolean': {
        const boolish = z.union([z.boolean(), z.literal('true'), z.literal('false'), z.literal(1), z.literal(0)])
          .transform((val) => {
            if (val === true || val === 'true' || val === 1) return true;
            if (val === false || val === 'false' || val === 0) return false;
            return Boolean(val);
          });
        return boolish;
      }
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
  const placeholder = (q?.ui?.placeholderText as string | undefined) ?? tOptional(q?.ui?.placeholderKey);
  switch (q.type) {
    case 'number':
      return (
        <Input {...common} type="number" onChange={(e)=> field.onChange(e)} placeholder={placeholder} />
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {(q.options ?? []).map((opt: any) => {
            const label = opt.labelText ?? tOptional(opt.labelKey);
            if (!label) return null;
            return (
            <label key={opt.value} className="flex items-center gap-2">
              <Radio name={field.name} value={opt.value} checked={field.value === opt.value} onChange={(e)=> field.onChange((e.target as any).value)} />
              <span>{label}</span>
            </label>
          )})}
        </div>
      );
    case 'select':
      return (
        <Select value={field.value ?? ''} onChange={(e)=> field.onChange(e)}>
          <option value="">--</option>
          {(q.options ?? []).map((opt: any)=> {
            const label = opt.labelText ?? tOptional(opt.labelKey);
            if (!label) return null;
            return <option key={opt.value} value={opt.value}>{label}</option>;
          })}
        </Select>
      );
    case 'multi-select':
      return (
        <div className="space-y-2">
          {(q.options ?? []).map((opt: any) => {
            const label = opt.labelText ?? tOptional(opt.labelKey);
            if (!label) return null;
            const selected: string[] = Array.isArray(field.value) ? field.value : [];
            const checked = selected.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-2">
                <input type="checkbox" checked={checked} onChange={(e)=> {
                  const next = e.target.checked ? [...selected, opt.value] : selected.filter(v=>v!==opt.value);
                  field.onChange(next);
                }} />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      );
    case 'checkbox':
    case 'boolean': {
      const optionLabel = (q.options?.[0]?.labelText as string | undefined) ?? tOptional(q.options?.[0]?.labelKey);
      const checked = field.value === true || field.value === 'true' || field.value === 1;
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={checked} onChange={(e)=> field.onChange(e.target.checked)} />
          {optionLabel && <span>{optionLabel}</span>}
        </label>
      );
    }
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
