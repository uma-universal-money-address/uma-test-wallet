import { Currency } from "@/types/Currency";
import { getBackendUrl } from "./backendUrl";
import {
  RAW_WALLET_COLOR_TO_NUMBER_MAPPING,
  WalletColor,
} from "./walletColorMapping";

interface WalletUpdateProps {
  color?: WalletColor;
  currency?: Currency;
}

export const updateWallet = async (
  walletId: string,
  options: WalletUpdateProps,
) => {
  const { color, currency } = options;

  const body = {
    color: color ? RAW_WALLET_COLOR_TO_NUMBER_MAPPING[color] : undefined,
    currency,
  };

  try {
    const response = await fetch(`${getBackendUrl()}/user/wallet/${walletId}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("Failed to update wallet.");
    }
    return response.json();
  } catch (e: unknown) {
    const error = e as Error;
    throw error;
  }
};
