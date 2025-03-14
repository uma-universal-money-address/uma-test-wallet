import { getBackendUrl } from "@/lib/backendUrl";
import { getUmaFromUsername } from "@/lib/uma";
import { Currency } from "@/types/Currency";
import { useCallback, useEffect, useState } from "react";
import { useAppState } from "./useAppState";
import { useContacts, type ContactInfo } from "./useContacts";
import { CurrenciesInfo, useCurrencies } from "./useCurrencies";
import { useWallets } from "./useWalletContext";

export interface Transaction {
  id: string;
  amountInLowestDenom: number;
  currency: Currency;
  name: string;
  createdAt: string;
  otherUma: string;
  userId?: string;
}

interface RawTransaction {
  id: string;
  amountInLowestDenom: number;
  currencyCode: string;
  senderUma: string;
  receiverUma: string;
  createdAt: string;
}

const hydrateTransactions = (
  rawTransactions: RawTransaction[],
  contacts: ContactInfo[],
  uma: string,
  currencies: CurrenciesInfo[],
): Transaction[] => {
  return rawTransactions.map((rawTransaction) => {
    const isSender = rawTransaction.senderUma === uma;
    const otherUma = isSender
      ? rawTransaction.receiverUma
      : rawTransaction.senderUma;
    const contact = contacts.find((contact) => contact.uma === otherUma);
    const name = otherUma;
    const userId = contact?.userId;

    const currency = currencies.find(
      (currency) => currency.code === rawTransaction.currencyCode,
    );

    if (!currency) {
      throw new Error("Currency not found.");
    }

    return {
      id: rawTransaction.id,
      amountInLowestDenom: rawTransaction.amountInLowestDenom,
      currency: {
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name,
        decimals: currency.decimals,
      },
      name,
      createdAt: new Date(
        Date.parse(rawTransaction.createdAt),
      ).toLocaleString(),
      userId,
      otherUma,
    };
  });
};

export function useTransactions() {
  const {
    recentContacts,
    ownUmaContacts,
    isLoading: isLoadingContacts,
  } = useContacts();
  const { isLoading: isLoadingWallets } = useWallets();
  const { currencies, isLoading: isLoadingCurrencies } = useCurrencies();
  const { currentWallet } = useAppState();

  const [transactions, setTransactions] = useState<Transaction[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Create a function to fetch transactions that can be called externally
  const refreshTransactions = useCallback(async () => {
    if (
      !recentContacts ||
      !ownUmaContacts ||
      isLoadingContacts ||
      !currentWallet ||
      isLoadingWallets ||
      !currencies ||
      isLoadingCurrencies
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const uma = getUmaFromUsername(currentWallet.uma.username);
      const response = await fetch(
        `${getBackendUrl()}/user/transactions?uma=${uma}`,
        {
          method: "GET",
          credentials: "include",
        },
      ).then((res) => {
        if (res.ok) {
          return res.json() as Promise<RawTransaction[]>;
        } else {
          throw new Error("Failed to fetch transactions.");
        }
      });

      const newTransactions = hydrateTransactions(
        response,
        [...recentContacts, ...ownUmaContacts],
        uma,
        currencies,
      );

      setTransactions(newTransactions);

      setIsLoading(false);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error.message);
      setIsLoading(false);
    }
  }, [
    recentContacts,
    ownUmaContacts,
    currentWallet,
    currencies,
    isLoadingContacts,
    isLoadingWallets,
    isLoadingCurrencies,
  ]);

  useEffect(() => {
    if (
      recentContacts &&
      ownUmaContacts &&
      !isLoadingContacts &&
      currentWallet &&
      !isLoadingWallets &&
      currencies &&
      !isLoadingCurrencies
    ) {
      refreshTransactions();
    }
  }, [
    recentContacts,
    ownUmaContacts,
    currentWallet,
    currencies,
    isLoadingContacts,
    isLoadingWallets,
    isLoadingCurrencies,
    refreshTransactions,
  ]);

  return {
    transactions,
    error,
    isLoading,
    refreshTransactions, // Export the refresh function
  };
}
