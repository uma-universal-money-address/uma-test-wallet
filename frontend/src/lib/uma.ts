import { getBackendUrl } from "./backendUrl";

export const checkUmaAvailability = async (umaUserName: string) => {
  const response = await fetch(`${getBackendUrl()}/uma/${umaUserName}`, {
    method: "GET",
  });
  const json = (await response.json()) as { available: boolean };
  return json.available;
};

export const createUma = async (umaUserName: string) => {
  const response = await fetch(`${getBackendUrl()}/uma`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ uma_user_name: umaUserName }),
  });
  return response.json();
};
