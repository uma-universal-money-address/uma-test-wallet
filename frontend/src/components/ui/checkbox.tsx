"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || `checkbox-${generatedId}`;

    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={checkboxId}
          className={cn(
            "h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            className,
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
