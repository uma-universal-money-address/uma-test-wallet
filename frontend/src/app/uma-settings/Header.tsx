"use client";

import { TestWalletButton } from "@/components/TestWalletButton";
import Image from "next/image";
import { useRouter } from "next/navigation";

export const Header = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push("/wallet");
  };

  return (
    <div className="py-4 px-[10px] flex items-center justify-between w-full">
      <div className="w-6" />
      <span className="text-primary text-[17px] font-normal leading-[22px] tracking-[-0.212px]">
        Test UMA settings
      </span>
      <TestWalletButton
        buttonProps={{
          variant: "icon",
          size: "icon",
          onClick: handleBack,
        }}
      >
        <Image src="/icons/close.svg" width={24} height={24} alt="Close" />
      </TestWalletButton>
    </div>
  );
};
