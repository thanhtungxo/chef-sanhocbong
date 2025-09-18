import * as React from 'react'
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type NativeChangeEvent = { target: { value: string } }

export interface SelectProps {
  value?: string
  onChange?: (e: NativeChangeEvent) => void
  placeholder?: string
  className?: string
  children: React.ReactNode // expects <option value>text</option>
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ value, onChange, placeholder, className, children }, ref) => {
    // Extract options and detect a placeholder <option value=""> if present
    const allChildren = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement[]
    const placeholderOption = allChildren.find((opt) => (opt.props as any)?.value === '')
    const resolvedPlaceholder = placeholder ?? (placeholderOption ? String(placeholderOption.props.children) : 'Select…')
    const options = allChildren.filter((opt) => (opt.props as any)?.value !== '' && (opt.props as any)?.value != null)

    const handleValueChange = (val: string) => {
      onChange?.({ target: { value: val } })
    }

    // Radix Select treats undefined as "no selection"; empty string is not allowed for item values
    const uiValue = value && value.length > 0 ? value : undefined

    return (
      <UISelect value={uiValue} onValueChange={handleValueChange}>
        <SelectTrigger ref={ref as any} className={className}>
          <SelectValue placeholder={resolvedPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt, i) => (
            <SelectItem key={i} value={String((opt.props as any).value)}>
              {opt.props.children}
            </SelectItem>
          ))}
        </SelectContent>
      </UISelect>
    )
  }
)
Select.displayName = 'Select'
