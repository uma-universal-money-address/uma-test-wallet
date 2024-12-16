import { getBackendUrl } from "@/lib/backendUrl";
import { getUmaFromUsername } from "@/lib/uma";
import { useEffect, useState } from "react";
import { useAppState } from "./useAppState";
import { useContacts, type ContactInfo } from "./useContacts";
import { useWallets } from "./useWalletContext";

export interface Transaction {
  id: string;
  amountInLowestDenom: number;
  currencyCode: string;
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
): Transaction[] => {
  return rawTransactions.map((rawTransaction) => {
    const isSender = rawTransaction.senderUma === uma;
    const otherUma = isSender
      ? rawTransaction.receiverUma
      : rawTransaction.senderUma;
    const contact = contacts.find((contact) => contact.uma === otherUma);
    const name = otherUma;
    const userId = contact?.userId;
    return {
      id: rawTransaction.id,
      amountInLowestDenom: rawTransaction.amountInLowestDenom,
      currencyCode: rawTransaction.currencyCode,
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
  const { currentWallet } = useAppState();

  const [transactions, setTransactions] = useState<Transaction[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchTransactions(contacts: ContactInfo[], uma: string) {
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
          setTransactions(hydrateTransactions(response, contacts, uma));
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
      !isLoadingWallets
    ) {
      fetchTransactions(
        [...recentContacts, ...ownUmaContacts],
        getUmaFromUsername(currentWallet.uma.username),
      );
    }
    return () => {
      ignore = true;
    };
  }, [
    recentContacts,
    ownUmaContacts,
    currentWallet,
    isLoadingContacts,
    isLoadingWallets,
  ]);

  return {
    transactions,
    error,
    isLoading,
  };
}
