import * as React from 'react'
import { Progress as ShadcnProgress } from '@/components/ui/progress'

export interface ProgressProps extends React.ComponentProps<typeof ShadcnProgress> {}

export const Progress: React.FC<ProgressProps> = (props) => {
  return <ShadcnProgress {...props} />
}

