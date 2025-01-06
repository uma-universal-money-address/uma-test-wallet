"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "./ui/drawer";

interface Props {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}

export const ResponsiveDialog = ({
  children,
  open,
  onOpenChange,
  title,
  description,
}: Props) => {
  const isDesktop = useMediaQuery("(min-width: 480px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </VisuallyHidden>
        <DialogContent className="py-8 px-4">{children}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onClose={() => onOpenChange(false)}>
      <VisuallyHidden>
        <DrawerTitle>{title}</DrawerTitle>
      </VisuallyHidden>
      <DrawerContent className="w-full">{children}</DrawerContent>
    </Drawer>
  );
};
