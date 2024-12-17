import { Wallet } from "@/hooks/useWalletContext";
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

export const getUmaFromUsername = (umaUserName: string) => {
  return `$${umaUserName}@${getBackendDomain()}`;
};
