"use client";
import { Wallet } from "@/hooks/useWalletContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

interface SandboxWallet {
  wallet: Wallet;
  number: number;
}

interface Props {
  size?: "xs" | "sm" | "md" | "lg" | undefined;
  src?: string | undefined;
  externalUma?: string;
  isLoading?: boolean;
  shadow?: boolean;
  /**
   * If this is set, the avatar will show the wallet number and color of the wallet instead of the avatar image.
   */
  sandboxWallet?: SandboxWallet | undefined;
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

  if (props.sandboxWallet) {
    return (
      <div
        style={{
          backgroundColor: props.sandboxWallet.wallet.color,
          boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
          width: `${getWidthHeight(size)}px`,
          height: `${getWidthHeight(size)}px`,
          fontSize: `${getFontSize(size)}px`,
          lineHeight: `${getLineHeight(size)}px`,
        }}
        className="border rounded-xl flex items-center justify-center bg-shine"
      >
        <span className="text-white items-center flex justify-center font-semibold tracking-[-0.2px]">
          {props.sandboxWallet.number}
        </span>
      </div>
    );
  }

  if (props.externalUma && props.externalUma.length > 1) {
    return (
      <div
        style={{
          boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
          width: `${getWidthHeight(size)}px`,
          height: `${getWidthHeight(size)}px`,
          fontSize: `${getFontSize(size)}px`,
          lineHeight: `${getLineHeight(size)}px`,
        }}
        className="items-center justify-center flex rounded-xl bg-primary"
      >
        {props.externalUma[1].toUpperCase()}
      </div>
    );
  }

  return (
    <Avatar
      style={{
        boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
      }}
    >
      <AvatarImage
        src={avatarSrc}
        width={getWidthHeight(size)}
        height={getWidthHeight(size)}
      />
      <AvatarFallback>
        <Skeleton className="w-full h-full rounded-full" />
      </AvatarFallback>
    </Avatar>
  );
};
