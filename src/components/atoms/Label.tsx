import * as React from 'react'
import { Label as ShadcnLabel } from '@/components/ui/label'

export interface LabelProps extends React.ComponentProps<'label'> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, ...rest }, ref) => (
    <ShadcnLabel ref={ref} className={className} {...rest}>
      {children}
    </ShadcnLabel>
  )
)
Label.displayName = 'Label'

