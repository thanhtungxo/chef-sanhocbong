import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const RulesetRegistry: React.FC = () => {
  const publish = useMutation(api.scholarships.publishRuleset);
  const [scholarshipId, setScholarshipId] = useState<'aas' | 'chevening'>('aas');
  const [version, setVersion] = useState('1.0.0');
  const [json, setJson] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
    </div>
  );
};

