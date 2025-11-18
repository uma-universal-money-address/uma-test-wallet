import { mapRawWalletToWallet, Wallet } from "@/hooks/useWalletContext";
import { UmaError } from "@/types/UmaError";
import { getBackendDomain } from "./backendDomain";
import { getBackendUrl } from "./backendUrl";

export const checkUmaAvailability = async (umaUserName: string) => {
  const response = await fetch(`${getBackendUrl()}/uma/${umaUserName}`, {
    method: "GET",
  });
  const json = (await response.json()) as { available: boolean };
  return json.available;
};

export const createUma = async (umaUserName: string): Promise<Wallet> => {
  const response = await fetch(`${getBackendUrl()}/uma`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ uma_user_name: umaUserName }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new UmaError(error.reason || "Failed to create UMA username.", error);
  }
  const rawWallet = await response.json();
  return mapRawWalletToWallet(rawWallet);
};

export const pickRandomUma = async () => {
  const response = await fetch(`${getBackendUrl()}/uma/generate_random_uma`, {
    method: "GET",
  });
  const { uma, error } = (await response.json()) as {
    uma?: string;
    error?: string;
  };

  if (error) {
    throw new Error(error);
  } else if (!uma) {
    throw new Error("Empty UMA response.");
  }

  return uma;
};

export const getUmaFromUsername = (umaUserName: string) => {
  return `$${umaUserName}@${getBackendDomain()}`;
};
