"use client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

interface Props {
  size?: number | undefined;
  src?: string | undefined;
  externalUma?: string;
  isLoading?: boolean;
  shadow?: boolean;
}

const EMPTY_AVATAR = "/empty-avatar.svg";

export const SandboxAvatar = (props: Props) => {
  const avatarSrc = props.src || EMPTY_AVATAR;
  const size = props.size || 48;

  if (props.externalUma && props.externalUma.length > 1) {
    return (
      <div
        className={`w-[${size}px] h-[${size}px] ${
          props.shadow ? "shadow-lg" : ""
        } items-center justify-center flex rounded-full bg-gray-200`}
      >
        {props.externalUma[1].toUpperCase()}
      </div>
    );
  }

  return (
    <Avatar className={props.shadow ? "shadow-lg" : ""}>
      <AvatarImage src={avatarSrc} width={size} height={size} />
      <AvatarFallback>
        <Skeleton className="w-full h-full rounded-full" />
      </AvatarFallback>
    </Avatar>
  );
};
