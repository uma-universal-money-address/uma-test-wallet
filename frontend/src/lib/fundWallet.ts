import { RawWallet } from "@/hooks/useWalletContext";
import { getBackendUrl } from "./backendUrl";

interface FundWalletProps {
  currencyCode?: string | undefined;
  amountInLowestDenom?: number | undefined;
}

export const fundWallet = async (
  walletId: string,
  options: FundWalletProps,
) => {
  const { currencyCode, amountInLowestDenom } = options;

  const body = {
    currencyCode,
    amountInLowestDenom,
  };

  try {
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
    const wallet = await (response.json() as Promise<RawWallet>);
    return {
      id: wallet.id,
      amountInLowestDenom: wallet.amount_in_lowest_denom,
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
