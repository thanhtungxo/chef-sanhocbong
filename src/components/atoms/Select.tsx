import * as React from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => (
    <select
      ref={ref}
      className={
        'w-full border border-input bg-background text-foreground rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring ' +
        className
      }
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select'

