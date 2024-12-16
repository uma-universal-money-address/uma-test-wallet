"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import {
  getVapidPublicKey,
  sendNotification,
  subscribeUser,
  unsubscribeUser,
} from "@/lib/notificationActions";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    const keyResponse = await getVapidPublicKey();
    if (!keyResponse) {
      toast({
        title: "Failed to fetch VASP public key",
        variant: "error",
      });
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyResponse.public_key),
    });
    setSubscription(sub);
    const subscribeRes = await subscribeUser(sub);
    if (!subscribeRes.success) {
      toast({
        title: subscribeRes.error,
        variant: "error",
      });
    }
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe();
    setSubscription(null);
    const unsubscribeRes = await unsubscribeUser();
    if (!unsubscribeRes.success) {
      toast({
        title: unsubscribeRes.error,
        variant: "error",
      });
    }
  }

  async function sendTestNotification() {
    if (subscription) {
      const notificationRes = await sendNotification(message);

      if (notificationRes.success) {
        setMessage("");
      } else {
        toast({
          title: notificationRes.error,
          variant: "error",
        });
      }
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  return (
    <div>
      <h3>Push Notifications</h3>
      {subscription ? (
        <>
          <p>You are subscribed to push notifications.</p>
          <SandboxButton buttonProps={{ onClick: unsubscribeFromPush }}>
            Unsubscribe
          </SandboxButton>
          <input
            type="text"
            placeholder="Enter notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <SandboxButton buttonProps={{ onClick: sendTestNotification }}>
            Send Test
          </SandboxButton>
        </>
      ) : (
        <>
          <p>You are not subscribed to push notifications.</p>
          <SandboxButton buttonProps={{ onClick: subscribeToPush }}>
            Subscribe
          </SandboxButton>
        </>
      )}
    </div>
  );
}
