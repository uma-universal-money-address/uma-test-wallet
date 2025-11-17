"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ name, options, value, onChange, className, disabled }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)}>
        {options.map((option) => {
          const radioId = `${name}-${option.value}`;
          return (
            <div key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                id={radioId}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                className={cn(
                  "h-4 w-4 border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                )}
              />
              <label
                htmlFor={radioId}
                className="text-sm font-normal leading-none cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

export { RadioGroup };

