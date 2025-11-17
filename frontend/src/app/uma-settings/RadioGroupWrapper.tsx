"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioOption } from "@/components/ui/radio-group";

interface RadioGroupWrapperProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const RadioGroupWrapper = ({
  label,
  options,
  value,
  onChange,
  disabled,
}: RadioGroupWrapperProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-[14px] font-normal leading-[18px] tracking-[-0.175px] text-secondary">
        {label}
      </Label>
      <RadioGroup
        name={label}
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

