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
