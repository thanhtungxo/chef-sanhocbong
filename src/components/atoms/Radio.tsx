import * as React from 'react'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    type="radio"
    className={
      'h-4 w-4 text-primary border-input focus:ring-2 focus:ring-ring rounded-full ' +
      className
    }
    {...props}
  />
))
Radio.displayName = 'Radio'

