import * as React from 'react'
import { Input as ShadcnInput } from '@/components/ui/input'

export interface InputProps extends React.ComponentProps<'input'> {}

// Atom-level Input that wraps shadcn/ui Input to keep our folder structure.
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange, placeholder, type = 'text', className, ...rest }, ref) => {
    return (
      <ShadcnInput
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        {...rest}
      />
    )
  }
)
Input.displayName = 'Input'

