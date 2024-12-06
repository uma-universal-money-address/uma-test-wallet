"use client";

import Image from "next/image";
import { SandboxAvatar } from "./SandboxAvatar";

export const ExternalUma = ({
  uma,
  onClick,
}: {
  uma: string;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className="flex flex-row gap-[14px] align-start w-full"
    >
      <SandboxAvatar externalUma={uma} size="lg" />
      <div className="flex flex-row items-center justify-center h-full gap-[6px]">
        <span className="text-primary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
          {uma}
        </span>
        <Image alt="uma" src="/uma.svg" width={28} height={12} />
      </div>
    </div>
  );
};
