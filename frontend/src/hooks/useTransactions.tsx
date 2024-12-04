import { getBackendUrl } from "@/lib/backendUrl";
import { getUmaFromUsername } from "@/lib/uma";
import { useEffect, useState } from "react";
import { useContacts, type ContactInfo } from "./useContacts";
import { useUma } from "./useUmaContext";

export interface Transaction {
  amountInLowestDenom: number;
  currencyCode: string;
  name: string;
  createdAt: string;
  otherUma: string;
  userId?: string;
}

interface RawTransaction {
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
    const name = contact ? contact.name : otherUma;
    const userId = contact?.userId;
    return {
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
  const { contacts, isLoading: isLoadingContacts } = useContacts();
  const { umas, isLoading: isLoadingUmas } = useUma();

  const [transactions, setTransactions] = useState<Transaction[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const defaultUma = umas.find((uma) => uma.default);

  useEffect(() => {
    async function fetchTransactions(contacts: ContactInfo[], uma: string) {
      setIsLoading(true);
      try {
        const response = await fetch(`${getBackendUrl()}/user/transactions`, {
          method: "GET",
          credentials: "include",
        }).then((res) => {
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
    if (contacts && !isLoadingContacts && defaultUma && !isLoadingUmas) {
      fetchTransactions(contacts, getUmaFromUsername(defaultUma.username));
    }
    return () => {
      ignore = true;
    };
  }, [contacts, defaultUma, isLoadingContacts, isLoadingUmas]);

  return {
    transactions,
    error,
    isLoading,
  };
}
