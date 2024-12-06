"use client";

import { SandboxButton } from "@/components/SandboxButton";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  SendPaymentStep,
  useSendPaymentContext,
} from "./SendPaymentContextProvider";

const HEADER_TEXT_MAPPING: Record<SendPaymentStep, string> = {
  [SendPaymentStep.SelectRecipient]: "",
  [SendPaymentStep.EnterAmount]: "Amount to send",
  [SendPaymentStep.Confirm]: "Preview send",
};

export const Header = () => {
  const router = useRouter();
  const { step, onBack } = useSendPaymentContext();

  const handleBack = () => {
    if (step === SendPaymentStep.SelectRecipient) {
      router.push("/wallet");
      return;
    }

    onBack();
  };

  return (
    <div className="py-4 px-[10px] flex items-center justify-between w-full">
      <SandboxButton
        buttonProps={{
          variant: "icon",
          size: "icon",
          onClick: handleBack,
        }}
      >
        <Image
          src="/icons/chevron-left.svg"
          width={24}
          height={24}
          alt="Back"
        />
      </SandboxButton>
      <span className="text-primary text-center text-[17px] font-normal leading-[22px] tracking-[-0.212px] w-[281px]">
        {HEADER_TEXT_MAPPING[step]}
      </span>
      <div className="w-6" />
    </div>
  );
};
