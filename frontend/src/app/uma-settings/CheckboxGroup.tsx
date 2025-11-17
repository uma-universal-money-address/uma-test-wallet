"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface CheckboxGroupProps<T extends string> {
  options: readonly T[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
  disabled?: boolean;
}

const formatFieldLabel = (field: string): string => {
  return field
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export const CheckboxGroup = <T extends string>({
  options,
  selectedValues,
  onChange,
  disabled,
}: CheckboxGroupProps<T>) => {
  const handleCheckboxChange = (value: T, checked: boolean) => {
    const newValues = checked
      ? [...selectedValues, value]
      : selectedValues.filter((v) => v !== value);
    onChange(newValues);
  };

  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <Checkbox
          key={option}
          label={formatFieldLabel(option)}
          checked={selectedValues.includes(option)}
          onChange={(e) => handleCheckboxChange(option, e.target.checked)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

