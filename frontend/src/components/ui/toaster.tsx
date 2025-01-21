"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex flex-row gap-2 items-center overflow-x-scroll no-scrollbar">
              {(props.variant === "default" || !props.variant) && (
                <div className="invert min-w-6">
                  <Image
                    src="/icons/checkmark-filled.svg"
                    alt="checkmark"
                    width={24}
                    height={24}
                  />
                </div>
              )}
              {title && (
                <ToastTitle className="text-nowrap">{title}</ToastTitle>
              )}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
