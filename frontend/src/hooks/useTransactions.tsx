import { getBackendUrl } from "@/lib/backendUrl";
import { getUmaFromUsername } from "@/lib/uma";
import { Currency } from "@/types/Currency";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function fetchTransactions(
      contacts: ContactInfo[],
      uma: string,
      currencies: CurrenciesInfo[],
    ) {
      setIsLoading(true);
      try {
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
        if (!ignore) {
          setTransactions(
            hydrateTransactions(response, contacts, uma, currencies),
          );
          setIsLoading(false);
        }
      } catch (e: unknown) {
        const error = e as Error;
        setError(error.message);
        setIsLoading(false);
      }
    }

    let ignore = false;
    if (
      recentContacts &&
      ownUmaContacts &&
      !isLoadingContacts &&
      currentWallet &&
      !isLoadingWallets &&
      currencies &&
      !isLoadingCurrencies
    ) {
      fetchTransactions(
        [...recentContacts, ...ownUmaContacts],
        getUmaFromUsername(currentWallet.uma.username),
        currencies,
      );
    }
    return () => {
      ignore = true;
    };
  }, [
    recentContacts,
    ownUmaContacts,
    currentWallet,
    currencies,
    isLoadingContacts,
    isLoadingWallets,
    isLoadingCurrencies,
  ]);

  return {
    transactions,
    error,
    isLoading,
  };
}
