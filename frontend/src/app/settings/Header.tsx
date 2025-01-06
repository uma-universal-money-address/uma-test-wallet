"use client";

import { SandboxButton } from "@/components/SandboxButton";
import Image from "next/image";
import { useRouter } from "next/navigation";

export const Header = () => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
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
      <div className="w-6" />
    </div>
  );
};
