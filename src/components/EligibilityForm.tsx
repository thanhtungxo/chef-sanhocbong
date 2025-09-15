// src/components/EligibilityForm.tsx

import React, { useState } from 'react';

export interface Rule {
  id: string;
  label: string;
  type: 'yesno' | 'select' | 'text';
  options?: string[];
}

interface EligibilityFormProps {
  rules: Rule[];
  onSubmit: (answers: Record<string, string>) => void;
}

export const EligibilityForm: React.FC<EligibilityFormProps> = ({
  rules,
  onSubmit,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {rules.map((rule) => (
        <div key={rule.id} className="mb-2">
          <label className="block font-medium mb-1">{rule.label}</label>
          {rule.type === 'yesno' && (
            <select
              onChange={(e) => handleChange(rule.id, e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full"
            >
              <option value="">-- Chọn --</option>
              <option value="yes">Có</option>
              <option value="no">Không</option>
            </select>
          )}
          {rule.type === 'select' && rule.options && (
            <select
              onChange={(e) => handleChange(rule.id, e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full"
            >
              <option value="">-- Chọn --</option>
              {rule.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {rule.type === 'text' && (
            <input
              type="text"
              onChange={(e) => handleChange(rule.id, e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Kiểm tra điều kiện
      </button>
    </form>
  );
};

