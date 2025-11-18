import {
  mapRawWalletToWallet,
  RawWallet,
  Wallet,
} from "@/hooks/useWalletContext";
import { getBackendUrl } from "./backendUrl";

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
  return mapRawWalletToWallet(rawWallet);
};
