"use client";

import { ExampleContact } from "@/hooks/useContacts";
import { useState } from "react";
import { SandboxAvatar } from "./SandboxAvatar";

export const ExampleUma = ({
  uma,
  exampleContact,
  onClick,
}: {
  uma: string;
  exampleContact: ExampleContact;
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
      <SandboxAvatar size="lg" country={exampleContact} />
      <div className="flex flex-col justify-center h-full gap-1">
        <span className="text-primary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
          {uma}
        </span>
        <span className="text-secondary text-[13px] font-normal leading-[18px] tracking-[-0.162px]">
          Receives {exampleContact.currency.name} (
          {exampleContact.currency.code})
        </span>
      </div>
    </div>
  );
};
