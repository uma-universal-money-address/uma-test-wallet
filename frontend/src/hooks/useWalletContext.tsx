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

export const WalletContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [wallets, setWallets] = useState<Wallet[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentWallet, setCurrentWallet } = useAppState();

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
          const defaultWallet =
            response.wallets.find((wallet) => wallet.uma.default) ||
            response.wallets[0];
          if (!currentWallet) {
            setCurrentWallet({
              id: defaultWallet.id,
              amountInLowestDenom: defaultWallet.amount_in_lowest_denom,
              color: RAW_WALLET_COLOR_MAPPING[defaultWallet.color],
              deviceToken: defaultWallet.device_token,
              name: defaultWallet.name,
              uma: {
                userId: defaultWallet.uma.user_id,
                username: defaultWallet.uma.username,
                default: defaultWallet.uma.default,
              },
              currency: defaultWallet.currency,
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
  }, [currentWallet, setCurrentWallet]);

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
