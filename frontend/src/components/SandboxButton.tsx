"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button, ButtonProps } from "./ui/button";

interface Props {
  loading?: boolean;
  disabled?: boolean;
  buttonProps?: ButtonProps;
  className?: string;
  children: React.ReactNode;
}

export const SandboxButton = (props: Props) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
  };

  const handleUnpress = () => {
    setIsPressed(false);
  };

  return (
    <Button
      {...props.buttonProps}
      disabled={props.disabled || props.loading}
      onMouseDown={handlePress}
      onTouchStart={handlePress}
      onMouseUp={handleUnpress}
      onTouchEnd={handleUnpress}
      onMouseLeave={handleUnpress}
      className={cn(
        cva(
          `${
            isPressed
              ? "scale-[0.975] transition-transform duration-100 ease-in-out"
              : ""
          } select-none tap-highlight-transparent`,
        ),
        props.className,
      )}
    >
      {props.loading && <Loader2 className="animate-spin" />}
      {props.children}
    </Button>
  );
};
