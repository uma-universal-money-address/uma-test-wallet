"use client";

import { useToast } from "@/hooks/use-toast";
import { subscribeToPush } from "@/lib/notificationActions";
import { useEffect } from "react";

export function PushNotificationManager() {
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        if (Notification.permission === "denied") {
          console.log("Permission for push notifications denied");
          return;
        } else if (Notification.permission === "default") {
          console.log("Has not requested permission for push notifications");
        }

        try {
          await subscribeToPush();
        } catch (error: unknown) {
          const e = error as Error;
          console.error("Failed to subscribe to push notifications", e);
          toast({
            title: "Failed to subscribe to push notifications",
            description: e.message,
            variant: "error",
          });
        }
        console.log("Push notifications registered");
      } else {
        console.log("Push notifications not supported in this browser");
      }
    })();
  }, [toast]);

  return <></>;
}
