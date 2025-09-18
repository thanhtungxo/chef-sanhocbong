import * as React from 'react'
import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from '@/components/ui/button'

export interface ButtonProps extends ShadcnButtonProps {}

// Atom-level Button wrapper to preserve project structure and props.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, onClick, disabled, type = 'button', className, ...rest }, ref) => {
    return (
      <ShadcnButton
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={className}
        {...rest}
      >
        {children}
      </ShadcnButton>
    )
  }
)
Button.displayName = 'Button'

