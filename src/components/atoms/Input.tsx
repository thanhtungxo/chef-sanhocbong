import * as React from 'react'
import { Input as ShadcnInput } from '@/components/ui/input'

export interface InputProps extends React.ComponentProps<'input'> {}

// Atom-level Input that wraps shadcn/ui Input to keep our folder structure.
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange, placeholder, type = 'text', className = '', ...rest }, ref) => {
    const baseClasses = [
      'transition-all duration-200',
      // Focus glow brand color
      'focus:ring-2 focus:ring-offset-2 focus:ring-[#3a7bd5] focus:border-[#3a7bd5]',
      // Dark mode focus
      'dark:focus:ring-[#fdbb2d] dark:focus:border-[#fdbb2d]',
      // Invalid shake animation via aria-invalid
      'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500 aria-[invalid=true]:animate-shake'
    ].join(' ')

    return (
      <ShadcnInput
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${baseClasses} ${className}`}
        {...rest}
      />
    )
  }
)
Input.displayName = 'Input'

