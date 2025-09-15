// src/components/ScholarshipSelector.tsx

import React from 'react';

interface ScholarshipSelectorProps {
  value: 'aas' | 'chevening';
  onChange: (value: 'aas' | 'chevening') => void;
}

export const ScholarshipSelector: React.FC<ScholarshipSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Chọn loại học bổng:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'aas' | 'chevening')}
        className="border border-gray-300 rounded px-3 py-2 w-full"
      >
        <option value="aas">Australia Awards (AAS)</option>
        <option value="chevening">Chevening</option>
      </select>
    </div>
  );
};

