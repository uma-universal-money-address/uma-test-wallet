import { getBackendUrl } from "@/lib/backendUrl";
import {
  RAW_WALLET_COLOR_MAPPING,
  WalletColor,
} from "@/lib/walletColorMapping";
import { Currency } from "@/types/Currency";
import React, { useEffect, useState } from "react";
import { useAppState } from "./useAppState";
import { RawUma, Uma } from "./useUmaContext";

export type RawWalletColor =
  | "ONE"
  | "TWO"
  | "THREE"
  | "FOUR"
  | "FIVE"
  | "SIX"
  | "SEVEN"
  | "EIGHT"
  | "NINE"
  | "TEN";

export interface Wallet {
  id: string;
  amountInLowestDenom: number;
  color: WalletColor;
  deviceToken: string;
  name: string;
  uma: Uma;
  currency: Currency;
}

interface RawWallet {
  id: string;
  amount_in_lowest_denom: number;
  color: RawWalletColor;
  device_token: string;
  name: string;
  uma: RawUma;
  currency: Currency;
}

export interface WalletContextData {
  wallets: Wallet[] | undefined;
  error?: string;
  isLoading: boolean;
}

const Context = React.createContext<WalletContextData>(null!);

export const fetchWallets = async (): Promise<Wallet[]> => {
  const res = await fetch(`${getBackendUrl()}/user/wallets`, {
    method: "GET",
    credentials: "include",
  });
  if (res.ok) {
    const { wallets } = await (res.json() as Promise<{ wallets: RawWallet[] }>);
    return wallets.map((rawWallet) => ({
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
    }));
  } else {
    throw new Error("Failed to fetch wallets.");
  }
};

export const WalletContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [wallets, setWallets] = useState<Wallet[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentWallet, setCurrentWallet } = useAppState();
  const hasCurrentWallet = !!currentWallet;

  useEffect(() => {
    async function fetchWalletsInternal() {
      setIsLoading(true);
      try {
        const wallets = await fetchWallets();
        if (!ignore) {
          setWallets(wallets);
          const defaultWallet =
            wallets.find((wallet) => wallet.uma.default) || wallets[0];
          if (!hasCurrentWallet) {
            setCurrentWallet(defaultWallet);
          }
          setIsLoading(false);
        }
      } catch (e: unknown) {
        const error = e as Error;
        setError(error.message);
        setIsLoading(false);
      }
    }

    let ignore = false;
    fetchWalletsInternal();
    return () => {
      ignore = true;
    };
  }, [hasCurrentWallet, setCurrentWallet]);

  return (
    <Context.Provider
      value={{
        wallets,
        error,
        isLoading,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useWallets = () => {
  return React.useContext(Context);
};

export default WalletContextProvider;
