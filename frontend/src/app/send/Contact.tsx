"use client";
import { OwnContact, SandboxAvatar } from "@/components/SandboxAvatar";
import { type ContactInfo } from "@/hooks/useContacts";
import { useState } from "react";

interface Props {
  contactInfo: ContactInfo;
  ownContact?: OwnContact | undefined;
  onClick?: () => void;
}

export const Contact = (props: Props) => {
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
      onClick={props.onClick}
      onMouseDown={handlePress}
      onTouchStart={handlePress}
      onMouseUp={handleUnpress}
      onTouchEnd={handleUnpress}
      onMouseLeave={handleUnpress}
    >
      <SandboxAvatar
        size="lg"
        ownContact={props.ownContact}
        uma={props.contactInfo.uma}
      />
      <div className="flex flex-col gap-1 overflow-hidden self-center">
        <span className="text-primary text-[15px] font-medium leading-[20px] tracking-[-0.187px] truncate">
          {props.contactInfo.uma}
        </span>
      </div>
    </div>
  );
};
