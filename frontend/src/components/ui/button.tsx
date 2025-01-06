import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 px-5",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 px-5",
        destructiveOutline:
          "border border-input bg-background hover:bg-destructive text-destructive hover:text-destructive-foreground px-5",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground px-5",
        secondary:
          "bg-[#EBEEF2] text-secondary-foreground hover:bg-secondary/80 px-5",
        transparent: "hover:bg-accent hover:text-accent-foreground px-5",
        ghost: "",
        link: "text-primary underline-offset-4 hover:underline",
        icon: "hover:bg-accent",
        installPrompt: "text-primary bg-[#0068C9] rounded-full px-[10px]",
      },
      size: {
        default: "h-[50px] py-[14.5px]",
        sm: "h-[46px] py-[12.5px]",
        tiny: "h-[26px] py-0 px-[10px]",
        lg: "h-[50px] py-[14.5px]",
        icon: "h-10 w-10 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
