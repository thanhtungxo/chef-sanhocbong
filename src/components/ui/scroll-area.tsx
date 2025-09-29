import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}

const ScrollArea: React.FC<ScrollAreaProps> = ({ className, children }) => {
  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 overflow-auto">
        {children}
      </div>
    </div>
  );
};

// Export with displayName for better debugging
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };