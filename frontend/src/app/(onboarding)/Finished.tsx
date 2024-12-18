"use client";

import { SandboxButton } from "@/components/SandboxButton";
import Image from "next/image";
import { StepButtonProps } from "./Steps";

export const Finished = () => {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center px-8 pb-3 gap-6">
      <div>
        <Image
          src="/icons/checkmark-filled.svg"
          alt="Finished"
          width={124}
          height={124}
        />
      </div>

      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-primary text-[22px] font-normal leading-[28px] tracking-[-0.275px]">
          {"You're all set"}
        </h1>
        <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
          You can access your test UMA and funds on any device using your phone
          number.
        </p>
      </div>
    </div>
  );
};

export const FinishedButtons = ({ onNext }: StepButtonProps) => {
  return (
    <div className="flex flex-col gap-[10px]">
      <SandboxButton
        buttonProps={{
          size: "lg",
          onClick: onNext,
        }}
        className="w-full"
      >
        View your UMA
      </SandboxButton>
    </div>
  );
};
