import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface FormInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}

export const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, type = 'text', placeholder }) => {
  const id = React.useId()
  return (
    <div className="mb-4 space-y-2">
      <Label htmlFor={id} className="font-medium">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
