import { RawWallet, Wallet } from "@/hooks/useWalletContext";
import { getBackendUrl } from "./backendUrl";
import { RAW_WALLET_COLOR_MAPPING } from "./walletColorMapping";

interface FundWalletProps {
  currencyCode?: string | undefined;
  amountInLowestDenom?: number | undefined;
}

export const fundWallet = async (
  walletId: string,
  options: FundWalletProps,
): Promise<Wallet> => {
  const { currencyCode, amountInLowestDenom } = options;

  const body = {
    currencyCode,
    amountInLowestDenom,
  };

  const response = await fetch(
    `${getBackendUrl()}/user/wallet/fund/${walletId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to update wallet.");
  }
  const rawWallet = await (response.json() as Promise<RawWallet>);
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
