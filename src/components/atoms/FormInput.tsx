import React from 'react';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, type = 'text' }) => {
  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border px-3 py-2 w-full rounded"
      />
    </div>
  );
};
