"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { RequiredCounterpartyField } from "@/hooks/useWalletContext";

interface CheckboxGroupProps {
  options: readonly string[];
  selectedValues: RequiredCounterpartyField[];
  onChange: (values: RequiredCounterpartyField[]) => void;
  disabled?: boolean;
}

const formatFieldLabel = (field: string): string => {
  return field
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export const CheckboxGroup = ({
  options,
  selectedValues,
  onChange,
  disabled,
}: CheckboxGroupProps) => {
  const handleCheckboxChange = (value: string, checked: boolean) => {
    const newValues = checked
      ? [...selectedValues, value as RequiredCounterpartyField]
      : selectedValues.filter((v) => v !== value);
    onChange(newValues);
  };

  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <Checkbox
          key={option}
          label={formatFieldLabel(option)}
          checked={selectedValues.includes(option as RequiredCounterpartyField)}
          onChange={(e) => handleCheckboxChange(option, e.target.checked)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

