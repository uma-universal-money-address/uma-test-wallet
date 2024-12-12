"use client";
import { ExampleContact } from "@/hooks/useContacts";
import { Wallet } from "@/hooks/useWalletContext";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

export interface OwnContact {
  wallet: Wallet;
  number: number;
}

interface Props {
  size?: "xs" | "sm" | "md" | "lg" | undefined;
  src?: string | undefined;
  uma?: string | undefined;
  isLoading?: boolean;
  shadow?: boolean;
  /**
   * If this is set, the avatar will show the wallet number and color of the wallet instead of the avatar image.
   */
  ownContact?: OwnContact | undefined;
  country?: ExampleContact | undefined;
}

const EMPTY_AVATAR = "/empty-avatar.svg";

const getWidthHeight = (size: string) => {
  switch (size) {
    case "xs":
      return 16;
    case "sm":
      return 24;
    case "md":
      return 32;
    case "lg":
      return 48;
    default:
      return 48;
  }
};

const getFontSize = (size: string) => {
  switch (size) {
    case "xs":
      return 8;
    case "sm":
      return 12;
    case "md":
      return 14;
    case "lg":
      return 16;
    default:
      return 16;
  }
};

const getLineHeight = (size: string) => {
  switch (size) {
    case "xs":
      return 11;
    case "sm":
      return 14;
    case "md":
      return 16;
    case "lg":
      return 21;
    default:
      return 21;
  }
};

export const SandboxAvatar = (props: Props) => {
  const avatarSrc = props.src || EMPTY_AVATAR;
  const size = props.size || "lg";

  if (props.ownContact) {
    return (
      <div
        style={{
          backgroundColor: props.ownContact.wallet.color,
          boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
          width: `${getWidthHeight(size)}px`,
          height: `${getWidthHeight(size)}px`,
          fontSize: `${getFontSize(size)}px`,
          lineHeight: `${getLineHeight(size)}px`,
        }}
        className="border rounded-xl flex items-center justify-center bg-shine"
      >
        <span className="text-white items-center flex justify-center font-semibold tracking-[-0.2px]">
          {props.ownContact.number}
        </span>
      </div>
    );
  }

  if (props.uma && props.uma.length > 1) {
    return (
      <div
        style={{
          boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
          width: `${getWidthHeight(size)}px`,
          height: `${getWidthHeight(size)}px`,
          fontSize: `${getFontSize(size)}px`,
          lineHeight: `${getLineHeight(size)}px`,
        }}
        className="items-center justify-center flex rounded-full bg-primary text-white"
      >
        {props.uma[1].toUpperCase()}
      </div>
    );
  }

  if (props.country) {
    return (
      <div
        style={{
          boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
          width: `${getWidthHeight(size)}px`,
          height: `${getWidthHeight(size)}px`,
          fontSize: `${getFontSize(size)}px`,
          lineHeight: `${getLineHeight(size)}px`,
        }}
        className="items-center justify-center flex rounded-full bg-[#EBEEF2] text-primary relative"
      >
        {props.country.currency.code.slice(0, 2).toUpperCase()}
        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center absolute bottom-[-2px] right-[-2px]">
          <Image
            className="rounded-full"
            src={props.country.image}
            alt={props.country.currency.code}
            width={16}
            height={16}
          />
        </div>
      </div>
    );
  }

  return (
    <Avatar
      style={{
        boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
        width: `${getWidthHeight(size)}px`,
        height: `${getWidthHeight(size)}px`,
      }}
    >
      <AvatarImage src={avatarSrc} />
      <AvatarFallback>
        <Skeleton className="w-full h-full rounded-full" />
      </AvatarFallback>
    </Avatar>
  );
};
