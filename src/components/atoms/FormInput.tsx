import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface FormInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  icon?: React.ReactNode
}

export const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, type = 'text', placeholder, icon }) => {
  const id = React.useId()
  return (
    <div className="mb-4 space-y-2 transition-transform duration-150 ease-out focus-within:scale-[1.01]">
      <Label htmlFor={id} className="font-medium">
        {label}
      </Label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-base">
            {icon}
          </span>
        )}
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={(icon ? 'pl-10 ' : '') + 'shadow-sm focus-visible:ring-2 focus-visible:ring-primary/60'}
        />
      </div>
    </div>
  )
}
