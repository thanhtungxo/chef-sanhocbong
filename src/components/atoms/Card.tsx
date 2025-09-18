import * as React from 'react'
import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardContent as ShadcnCardContent,
  CardFooter as ShadcnCardFooter,
  CardTitle as ShadcnCardTitle,
  CardDescription as ShadcnCardDescription,
} from '@/components/ui/card'

export const Card: React.FC<React.ComponentProps<'div'>> = ({ children, ...props }) => (
  <ShadcnCard {...props}>{children}</ShadcnCard>
)

export const CardHeader: React.FC<React.ComponentProps<'div'>> = ({ children, ...props }) => (
  <ShadcnCardHeader {...props}>{children}</ShadcnCardHeader>
)

export const CardContent: React.FC<React.ComponentProps<'div'>> = ({ children, ...props }) => (
  <ShadcnCardContent {...props}>{children}</ShadcnCardContent>
)

export const CardFooter: React.FC<React.ComponentProps<'div'>> = ({ children, ...props }) => (
  <ShadcnCardFooter {...props}>{children}</ShadcnCardFooter>
)

export const CardTitle: React.FC<React.ComponentProps<'div'>> = ({ children, ...props }) => (
  <ShadcnCardTitle {...props}>{children}</ShadcnCardTitle>
)

export const CardDescription: React.FC<React.ComponentProps<'div'>> = ({ children, ...props }) => (
  <ShadcnCardDescription {...props}>{children}</ShadcnCardDescription>
)

