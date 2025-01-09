"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import { subscribeToPush } from "@/lib/notificationActions";
import { StepButtonProps } from "./Steps";

export const EnableNotifications = () => {
  return (
    <div className="flex flex-col h-full w-full items-center px-8 pb-3"></div>
  );
};

export const EnableNotificationsButtons = ({ onNext }: StepButtonProps) => {
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    const requestRes = await Notification.requestPermission();
    if (requestRes === "granted") {
      try {
        await subscribeToPush();
        onNext();
      } catch (e) {
        toast({
          title: `Failed to subscribe to push notifications: ${e}`,
          variant: "error",
        });
      }
    } else {
      toast({
        title: "You must allow browser notifications to enable this feature",
        variant: "error",
      });
    }
  };

  return (
    <div className="flex flex-col">
      <SandboxButton
        buttonProps={{
          size: "lg",
          onClick: handleEnableNotifications,
        }}
        className="w-full"
      >
        Turn on notifications
      </SandboxButton>
    </div>
  );
};
