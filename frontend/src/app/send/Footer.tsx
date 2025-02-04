"use client";

import { SandboxButton } from "@/components/SandboxButton";

interface Props {
  onSubmit: () => void;
  isLoading: boolean;
  buttonText: string;
  disabled?: boolean | undefined;
}

export const Footer = (props: Props) => {
  return (
    <div className="flex flex-col py-6 w-full self-center">
      <SandboxButton
        className="w-full"
        loading={props.isLoading}
        disabled={props.disabled || props.isLoading}
        buttonProps={{
          onClick: props.onSubmit,
        }}
      >
        {props.buttonText}
      </SandboxButton>
    </div>
  );
};
