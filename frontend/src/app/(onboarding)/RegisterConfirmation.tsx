"use client";

import { TestWalletButton } from "@/components/TestWalletButton";
import Image from "next/image";
import { StepButtonProps } from "./Steps";

export const RegisterConfirmation = () => {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center px-8 pb-3 gap-6">
      <div className="flex items-center justify-center w-[124px] h-[124px] rounded-full bg-primary">
        <Image
          src="/icons/passkeys.svg"
          alt="Passkey"
          width={40}
          height={40}
          className="invert"
        />
      </div>

      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-primary text-[22px] font-normal leading-[28px] tracking-[-0.275px]">
          Passkey setup complete
        </h1>
        <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
          You can now access your test UMA and funds on any device using your
          passkey.
        </p>
      </div>
    </div>
  );
};

export const RegisterConfirmationButtons = ({ onNext }: StepButtonProps) => {
  return (
    <div className="flex flex-col gap-[10px]">
      <TestWalletButton
        buttonProps={{
          size: "lg",
          onClick: onNext,
        }}
        className="w-full"
      >
        Continue
      </TestWalletButton>
    </div>
  );
};
