"use client";
import { Wallet } from "@/hooks/useWalletContext";
import { AVAILABLE_CURRENCIES } from "@/types/Currency";
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
  currencyCode?: string | undefined;
}

const EMPTY_AVATAR = "/empty-avatar.svg";

const getWidthHeight = (size: string) => {
  switch (size) {
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

const getBorderRadius = (size: string) => {
  switch (size) {
    case "sm":
      return 6;
    case "md":
      return 7;
    case "lg":
      return 12;
    default:
      return 12;
  }
};

export const TestWalletAvatar = (props: Props) => {
  const avatarSrc = props.src || EMPTY_AVATAR;
  const size = props.size || "lg";

  const currencyCode = props.currencyCode?.toUpperCase();
  const countryFlag =
    currencyCode && AVAILABLE_CURRENCIES.has(currencyCode) ? (
      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center absolute bottom-[-4px] right-[-4px]">
        <Image
          className="rounded-full"
          src={`/icons/currency_flags/${currencyCode}.svg`}
          alt={currencyCode}
          width={16}
          height={16}
        />
      </div>
    ) : null;

  if (props.ownContact) {
    const pxSize = size === "lg" ? 44 : getWidthHeight(size);
    return (
      <div
        style={{
          transition: "background-color 0.4s",
          backgroundColor: props.ownContact.wallet.color,
          boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
          width: `${pxSize}px`,
          height: `${pxSize}px`,
          minWidth: `${pxSize}px`,
          fontSize: `${getFontSize(size)}px`,
          lineHeight: `${getLineHeight(size)}px`,
          borderRadius: `${getBorderRadius(size)}px`,
          margin: size === "lg" ? "2px" : "0",
        }}
        className="flex items-center justify-center bg-shine relative"
      >
        <span className="text-white items-center flex justify-center font-semibold tracking-[-0.2px]">
          {props.ownContact.number}
          {countryFlag}
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
          minWidth: `${getWidthHeight(size)}px`,
          fontSize: `${getFontSize(size)}px`,
          lineHeight: `${getLineHeight(size)}px`,
        }}
        className="items-center justify-center flex rounded-full bg-primary text-white relative"
      >
        {props.uma[1].toUpperCase()}
        {countryFlag}
      </div>
    );
  }

  if (currencyCode) {
    return (
      <div
        style={{
          boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
          width: `${getWidthHeight(size)}px`,
          height: `${getWidthHeight(size)}px`,
          minWidth: `${getWidthHeight(size)}px`,
          fontSize: `${getFontSize(size)}px`,
          lineHeight: `${getLineHeight(size)}px`,
        }}
        className="items-center justify-center flex rounded-full bg-[#EBEEF2] text-primary relative"
      >
        {currencyCode.slice(0, 2).toUpperCase()}
        {countryFlag}
      </div>
    );
  }

  return (
    <Avatar
      style={{
        boxShadow: props.shadow ? "0px 1px 1px rgba(0, 0, 0, 0.25)" : "",
        width: `${getWidthHeight(size)}px`,
        height: `${getWidthHeight(size)}px`,
        minWidth: `${getWidthHeight(size)}px`,
      }}
    >
      <AvatarImage src={avatarSrc} />
      <AvatarFallback>
        <Skeleton className="w-full h-full rounded-full" />
      </AvatarFallback>
    </Avatar>
  );
};
