"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCallback, useEffect, useState } from "react";

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  validator?: (value: string) => string;
  formatter?: (value: string) => string;
  disabled?: boolean;
  maxLength?: number;
  debounceMs?: number;
}

export const FormInput = ({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  validator,
  formatter,
  disabled,
  maxLength,
  debounceMs = 800,
}: FormInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Update local value when prop changes (e.g., from external source)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    let processedValue = newValue;

    // Apply formatter if provided
    if (formatter) {
      processedValue = formatter(processedValue);
    }

    // Apply maxLength if provided
    if (maxLength && processedValue.length > maxLength) {
      processedValue = processedValue.slice(0, maxLength);
    }

    setLocalValue(processedValue);
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout to call onChange after debounce
    const newTimeoutId = setTimeout(() => {
      // Only call onChange if validation passes
      if (!validator || !validator(processedValue)) {
        onChange(processedValue);
      }
    }, debounceMs);

    setTimeoutId(newTimeoutId);
  };

  const handleBlur = useCallback(() => {
    // Validate on blur
    if (validator) {
      const validationError = validator(localValue);
      setError(validationError);
      
      // Only call onChange on blur if validation passes
      if (!validationError && localValue !== value) {
        onChange(localValue);
      }
    }
    
    onBlur?.();
  }, [localValue, value, validator, onChange, onBlur]);

  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={label}
        className="text-[14px] font-normal leading-[18px] tracking-[-0.175px] text-secondary"
      >
        {label}
      </Label>
      <Input
        id={label}
        type={type}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
      />
      {error && (
        <span className="text-[12px] font-normal leading-[16px] tracking-[-0.15px] text-red-500">
          {error}
        </span>
      )}
    </div>
  );
};

