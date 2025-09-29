import * as React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const Separator: React.FC<SeparatorProps> = ({ 
  className, 
  orientation = 'horizontal' 
}) => {
  return (
    <div
      className={cn(
        "shrink-0 bg-border",
        orientation === 'horizontal' 
          ? "h-[1px] w-full"
          : "h-full w-[1px]",
        className
      )}
      aria-hidden="true"
    />
  );
};

// Export with displayName for better debugging
Separator.displayName = 'Separator';

export { Separator };