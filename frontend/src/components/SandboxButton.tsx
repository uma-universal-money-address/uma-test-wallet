"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface Props {
  loading?: boolean;
  disabled?: boolean;
  buttonProps?: ButtonProps;
  className?: string;
  tooltip?: string | undefined;
  children: React.ReactNode;
}

export const SandboxButton = (props: Props) => {
  const button = (
    <Button
      {...props.buttonProps}
      disabled={props.disabled || props.loading}
      className={cn(
        "active:scale-[0.975] transition-transform duration-100 ease-in-out",
        props.className,
      )}
    >
      {props.loading && <Loader2 className="animate-spin" />}
      {props.children}
    </Button>
  );

  return props.tooltip ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{props.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    button
  );
};
