import { Wallet } from "@/hooks/useWalletContext";
import { UmaError } from "@/types/UmaError";
import { getBackendDomain } from "./backendDomain";
import { getBackendUrl } from "./backendUrl";
import { RAW_WALLET_COLOR_MAPPING } from "./walletColorMapping";

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
  return {
    id: rawWallet.id,
    amountInLowestDenom: rawWallet.amount_in_lowest_denom,
    color: RAW_WALLET_COLOR_MAPPING[rawWallet.color],
    deviceToken: rawWallet.device_token,
    name: rawWallet.name,
    uma: {
      userId: rawWallet.uma.user_id,
      username: rawWallet.uma.username,
      default: rawWallet.uma.default,
    },
    currency: rawWallet.currency,
  };
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
