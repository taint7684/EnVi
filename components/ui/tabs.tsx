"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
  className?: string;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, onValueChange, defaultValue, orientation = "horizontal", children, ...props }, ref) => {
    const [activeValue, setActiveValue] = React.useState(defaultValue || value);

    React.useEffect(() => {
      setActiveValue(value);
    }, [value]);

    const handleValueChange = (newValue: string) => {
      setActiveValue(newValue);
      onValueChange(newValue);
    };

    return (
      <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
        <div
          ref={ref}
          className={cn("flex flex-col", className)}
          data-orientation={orientation}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, orientation = "horizontal", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
          orientation === "vertical" && "flex-col w-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context?.value === value;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-accent hover:text-accent-foreground",
          disabled && "opacity-50",
          className
        )}
        {...props}
        onClick={() => !disabled && context?.onValueChange(value)}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
}

const TabsContext = React.createContext<{ value: string; onValueChange: (value: string) => void } | null>(null);

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, forceMount, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context?.value === value;

    if (!forceMount && !isActive) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };