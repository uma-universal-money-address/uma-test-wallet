import { getBackendUrl } from "./backendUrl";

export async function getVapidPublicKey(): Promise<
  { public_key: string } | undefined
> {
  try {
    const response = await fetch(
      `${getBackendUrl()}/user/notifications/vapid-public-key`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    if (response.ok) {
      return response.json() as Promise<{ public_key: string }>;
    }
    throw new Error("Failed to fetch VASP public key");
  } catch (error) {
    console.error("Failed to fetch VASP public key:", error);
  }
}

export async function subscribeUser(sub: PushSubscription) {
  try {
    await fetch(`${getBackendUrl()}/user/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        subscription_json: JSON.stringify(sub.toJSON()),
      }),
    });
  } catch (error) {
    console.error("Failed to subscribe user to notifications:", error);
    return {
      success: false,
      error: "Failed to subscribe user to notifications",
    };
  }
  return { success: true };
}

export async function unsubscribeUser() {
  try {
    await fetch(`${getBackendUrl()}/user/notifications/unsubscribe`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to unsubscribe user from notifications:", error);
    return {
      success: false,
      error: "Failed to unsubscribe user from notifications",
    };
  }
  return { success: true };
}

export async function sendNotification(message: string) {
  try {
    await fetch(`${getBackendUrl()}/user/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        title: "Test Notification",
        body: message,
        icon: "/uma-sandbox-icon.png",
      }),
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: "Failed to send notification" };
  }
}

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

export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await registration.pushManager.getSubscription();

  const keyResponse = await getVapidPublicKey();
  if (!keyResponse) {
    throw new Error("Failed to fetch VASP public key");
  }

  const readyRegistration = await navigator.serviceWorker.ready;
  const sub = await readyRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(keyResponse.public_key),
  });
  const subscribeRes = await subscribeUser(sub);
  if (!subscribeRes.success) {
    throw new Error(subscribeRes.error);
  }
}
