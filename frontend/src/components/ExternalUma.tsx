"use client";

import Image from "next/image";
import { useState } from "react";
import { SandboxAvatar } from "./SandboxAvatar";

export const ExternalUma = ({
  uma,
  onClick,
}: {
  uma: string;
  onClick: () => void;
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
  };

  const handleUnpress = () => {
    setIsPressed(false);
  };

  return (
    <div
      className={`flex flex-row gap-[14px] items-start w-full ${
        isPressed ? "scale-[0.975]" : ""
      } transition-transform duration-100 ease-in-out select-none tap-highlight-transparent`}
      onClick={onClick}
      onMouseDown={handlePress}
      onTouchStart={handlePress}
      onMouseUp={handleUnpress}
      onTouchEnd={handleUnpress}
      onMouseLeave={handleUnpress}
    >
      <SandboxAvatar uma={uma} size="lg" />
      <div className="flex flex-row items-center justify-center h-full gap-[6px] overflow-hidden">
        <span className="text-primary text-[15px] font-normal leading-[20px] tracking-[-0.187px] truncate">
          {uma}
        </span>
        <Image alt="uma" src="/uma.svg" width={28} height={12} />
      </div>
    </div>
  );
};
