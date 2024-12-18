import { getBackendDomain } from "./backendDomain";
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

export const pickRandomUma = async () => {
  const response = await fetch(`${getBackendUrl()}/uma/generate_random_uma`, {
    method: "GET",
  });
  const json = (await response.json()) as {
    uma: string | null;
    error: string | null;
  };
  if (json.error) {
    console.error(json.error);
    return null;
  }
  return json.uma && json.uma.length > 0 ? json.uma : null;
};

export const getUmaFromUsername = (umaUserName: string) => {
  return `$${umaUserName}@${getBackendDomain()}`;
};
