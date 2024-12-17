import { RawWallet } from "@/hooks/useWalletContext";
import { getBackendUrl } from "./backendUrl";
import {
  RAW_WALLET_COLOR_MAPPING,
  RAW_WALLET_COLOR_TO_NUMBER_MAPPING,
  WalletColor,
} from "./walletColorMapping";

interface WalletUpdateProps {
  color?: WalletColor | undefined;
  currencyCode?: string | undefined;
}

export const updateWallet = async (
  walletId: string,
  options: WalletUpdateProps,
) => {
  const { color, currencyCode } = options;

  const body = {
    color: color ? RAW_WALLET_COLOR_TO_NUMBER_MAPPING[color] : undefined,
    currencyCode,
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
    const wallet = await (response.json() as Promise<RawWallet>);
    return {
      id: wallet.id,
      amountInLowestDenom: wallet.amount_in_lowest_denom,
      color: RAW_WALLET_COLOR_MAPPING[wallet.color],
      deviceToken: wallet.device_token,
      name: wallet.name,
      uma: {
        userId: wallet.uma.user_id,
        username: wallet.uma.username,
        default: wallet.uma.default,
      },
      currency: wallet.currency,
    };
  } catch (e: unknown) {
    const error = e as Error;
    throw error;
  }
};
