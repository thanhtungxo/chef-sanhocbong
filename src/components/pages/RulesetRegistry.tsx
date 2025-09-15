import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { t, setLang } from '@/lib/i18n';
import { listAvailableRuleIds } from '@/lib/engine/loader';

export const RulesetRegistry: React.FC = () => {
  const publish = useMutation(api.scholarships.publishRuleset);
  const [scholarshipId, setScholarshipId] = useState<'aas' | 'chevening'>('aas');
  const [version, setVersion] = useState('1.0.0');
  const [json, setJson] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Preview currently active ruleset from DB
  const preview = useQuery(api.scholarships.getActiveRules, { scholarshipId });

  // Available rule IDs discovered on client (from bundled files)
  const availableIds = useMemo(() => listAvailableRuleIds(), []);

  // Language dropdown for preview
  const [uiLang, setUiLang] = useState<"en" | "vi">(() => {
    try {
      const s = localStorage.getItem('lang') as any;
      if (s === 'en' || s === 'vi') return s;
    } catch {}
    return 'en';
  });
  const onChangeLang = (val: "en" | "vi") => {
    setUiLang(val);
    setLang(val);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    try {
      const res = await publish({ scholarshipId, version, json, isActive });
      if ((res as any).ok) {
        setResult('Published successfully');
      } else {
        const issues = (res as any).issues ?? [];
        setResult('Failed to publish: ' + issues.join('; '));
      }
    } catch (err) {
      setResult('Error: ' + String(err));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-xl font-bold mb-4">Ruleset Registry</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Scholarship</label>
          <select value={scholarshipId} onChange={(e) => setScholarshipId(e.target.value as any)} className="border px-3 py-2 rounded w-full">
            <option value="aas">AAS</option>
            <option value="chevening">Chevening</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Version</label>
          <input value={version} onChange={(e) => setVersion(e.target.value)} className="border px-3 py-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rules JSON</label>
          <textarea value={json} onChange={(e) => setJson(e.target.value)} className="border px-3 py-2 rounded w-full h-64 font-mono" placeholder="Paste rules JSON here" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>Set as active</span>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Publish</button>
      </form>
      {result && (
        <div className="mt-4 text-sm text-gray-700">{result}</div>
      )}

      <div className="mt-8 border-t pt-4">
        <h3 className="font-semibold mb-2">Active Ruleset Preview</h3>
        <div className="flex items-center gap-3 mb-3">
          <div>
            <span className="text-sm text-gray-600 mr-2">Language:</span>
            <select
              value={uiLang}
              onChange={(e) => onChangeLang(e.target.value as any)}
              className="border px-2 py-1 rounded text-sm"
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </div>
        </div>
        {!preview ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : (
          <div className="text-sm">
            <div className="mb-2">
              <span className="font-medium">Status:</span>{' '}
              {preview.ok ? (
                <span className="text-green-700">OK</span>
              ) : (
                <span className="text-red-700">Invalid</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div><span className="font-medium">Version:</span> {preview.version ?? '-'}</div>
              <div><span className="font-medium">Rules Count:</span> {preview.rules?.length ?? 0}</div>
            </div>
            {/* Messages preview */}
            {Array.isArray(preview.rules) && preview.rules.length > 0 && (
              <div className="mb-3">
                <div className="font-medium mb-1">Messages ({uiLang}):</div>
                <ul className="list-disc ml-5 space-y-1">
                  {(() => {
                    const seen = new Set<string>();
                    const out: JSX.Element[] = [];
                    const flatten = (node: any) => {
                      if (!node) return;
                      if ('type' in node) {
                        const key = node.messageKey || node.message || node.id;
                        if (!seen.has(key)) {
                          seen.add(key);
                          out.push(<li key={key}>{t(node.messageKey, node.message)}</li>);
                        }
                        return;
                      }
                      if (Array.isArray(node.rules)) node.rules.forEach(flatten);
                    };
                    (preview.rules as any[]).forEach(flatten);
                    return out;
                  })()}
                </ul>
              </div>
            )}
            {preview.issues?.length > 0 && (
              <div className="p-2 rounded bg-yellow-100 text-yellow-800">
                Issues: {preview.issues.join('; ')}
              </div>
            )}
            {preview.json && (
              <details className="mt-3">
                <summary className="cursor-pointer text-blue-700">Show JSON</summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-64 text-xs">
                  {preview.json}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Client-discovered rules for verification */}
      <div className="mt-8 border-t pt-4">
        <h3 className="font-semibold mb-2">Discovered Rule IDs (Client)</h3>
        {availableIds.length === 0 ? (
          <div className="text-sm text-gray-500">No rule files found under types/rules.</div>
        ) : (
          <ul className="list-disc ml-5 text-sm">
            {availableIds.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
