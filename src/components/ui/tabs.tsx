import * as React from "react";
import { cn } from "@/lib/utils";

// This is a simplified tabs component implementation
// Similar to other UI components in the project

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

// Internal context for Tabs
const TabsContext = React.createContext<{
  value: string;
  onValueChange?: (value: string) => void;
} | undefined>(undefined);

// Tabs component
const Tabs: React.FC<TabsProps> = ({ 
  defaultValue, 
  value: valueProp, 
  onValueChange, 
  className, 
  children 
}) => {
  const [value, setValue] = React.useState(defaultValue || "");
  
  React.useEffect(() => {
    if (valueProp !== undefined) {
      setValue(valueProp);
    }
  }, [valueProp]);

  const handleValueChange = (newValue: string) => {
    if (valueProp === undefined) {
      setValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const contextValue = React.useMemo(() => ({
    value,
    onValueChange: handleValueChange
  }), [value, handleValueChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <TabsContext.Provider value={contextValue}>
        {children}
      </TabsContext.Provider>
    </div>
  );
};

// TabsList component
const TabsList: React.FC<TabsListProps> = ({ className, children }) => {
  return (
    <div 
      className={cn(
        "flex border-b space-x-1", 
        className
      )}
    >
      {children}
    </div>
  );
};

// TabsTrigger component
const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className, children }) => {
  const context = React.useContext(TabsContext);
  
  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs");
  }

  const isActive = value === context.value;
  
  return (
    <button
      type="button"
      onClick={() => context.onValueChange?.(value)}
      className={cn(
        "px-3 py-2 text-sm font-medium transition-colors border-b-2",
        isActive
          ? "border-primary text-primary" 
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted",
        className
      )}
    >
      {children}
    </button>
  );
};

// TabsContent component
const TabsContent: React.FC<TabsContentProps> = ({ value, className, children }) => {
  const context = React.useContext(TabsContext);
  
  if (!context) {
    throw new Error("TabsContent must be used within Tabs");
  }

  const isActive = value === context.value;
  
  if (!isActive) {
    return null;
  }

  return (
    <div 
      className={cn(
        "min-h-[200px] px-1 pt-4",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsContent, TabsList, TabsTrigger };