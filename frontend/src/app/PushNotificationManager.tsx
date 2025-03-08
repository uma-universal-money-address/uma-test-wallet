"use client";

import { useToast } from "@/hooks/use-toast";
import { useWallets } from "@/hooks/useWalletContext";
import { subscribeToPush } from "@/lib/notificationActions";
import { useEffect, useRef } from "react";

export function PushNotificationManager() {
  const { toast } = useToast();
  const { wallets } = useWallets();
  const hasAttemptedSubscription = useRef(false);

  useEffect(() => {
    const notificationsStepCompleted = localStorage.getItem(
      "notifications-step-completed",
    );

    if (
      wallets &&
      wallets.length > 0 &&
      notificationsStepCompleted == undefined
    ) {
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
            hasAttemptedSubscription.current = true;
            console.log("Push notifications registered");
          } catch (error: unknown) {
            const e = error as Error;
            console.error("Failed to subscribe to push notifications", e);
            toast({
              description: "Failed to subscribe to push notifications",
              variant: "error",
            });
          }
        } else {
          console.log("Push notifications not supported in this browser");
        }
      })();
    }
  }, [toast, wallets]);

  return <></>;
}
