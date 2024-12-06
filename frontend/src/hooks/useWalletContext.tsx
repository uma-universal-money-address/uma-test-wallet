import { getBackendUrl } from "@/lib/backendUrl";
import {
  RAW_WALLET_COLOR_MAPPING,
  WalletColor,
} from "@/lib/walletColorMapping";
import { Currency } from "@/types/Currency";
import React, { useEffect, useState } from "react";
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
  userId: string;
  amountInLowestDenom: number;
  color: WalletColor;
  deviceToken: string;
  name: string;
  uma: Uma;
  currency: Currency;
}

interface RawWallet {
  id: string;
  user_id: string;
  amount_in_lowest_denom: number;
  color: RawWalletColor;
  device_token: string;
  name: string;
  uma: RawUma;
  currency: Currency;
}

export interface WalletContextData {
  wallets: Wallet[] | undefined;
  currentWallet: Wallet | undefined;
  error?: string;
  isLoading: boolean;
}

const Context = React.createContext<WalletContextData>(null!);

export const WalletContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [wallets, setWallets] = useState<Wallet[]>();
  const [currentWallet, setCurrentWallet] = useState<Wallet>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchWallets() {
      setIsLoading(true);
      try {
        const response = await fetch(`${getBackendUrl()}/user/wallets`, {
          method: "GET",
          credentials: "include",
        }).then((res) => {
          if (res.ok) {
            return res.json() as Promise<{ wallets: RawWallet[] }>;
          } else {
            throw new Error("Failed to fetch wallets.");
          }
        });
        if (!ignore) {
          setWallets(
            response.wallets.map((rawWallet) => ({
              id: rawWallet.id,
              userId: rawWallet.user_id,
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
            })),
          );
          const currentWallet =
            response.wallets.find((wallet) => wallet.uma.default) ||
            response.wallets[0];
          if (currentWallet) {
            setCurrentWallet({
              id: currentWallet.id,
              userId: currentWallet.user_id,
              amountInLowestDenom: currentWallet.amount_in_lowest_denom,
              color: RAW_WALLET_COLOR_MAPPING[currentWallet.color],
              deviceToken: currentWallet.device_token,
              name: currentWallet.name,
              uma: {
                userId: currentWallet.uma.user_id,
                username: currentWallet.uma.username,
                default: currentWallet.uma.default,
              },
              currency: currentWallet.currency,
            });
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
    fetchWallets();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Context.Provider value={{ wallets, currentWallet, error, isLoading }}>
      {children}
    </Context.Provider>
  );
};

export const useWallets = () => {
  return React.useContext(Context);
};

export default WalletContextProvider;
