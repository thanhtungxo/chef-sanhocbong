import * as React from 'react'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    type="radio"
    className={[
      'h-4 w-4 rounded-full border-input',
      'transition-transform duration-200 ease-out',
      'focus:ring-2 focus:ring-[#3a7bd5] dark:focus:ring-[#fdbb2d]',
      'checked:scale-110 checked:shadow-[0_0_0_3px_rgba(58,123,213,0.3)] dark:checked:shadow-[0_0_0_3px_rgba(253,187,45,0.3)]',
      'hover:scale-105 hover:shadow-sm',
      className
    ].join(' ')}
    {...props}
  />
))
Radio.displayName = 'Radio'

