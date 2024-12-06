import { getBackendUrl } from "@/lib/backendUrl";
import { fetchWithRedirect } from "@/lib/fetchWithRedirect";
import { Currency } from "@/types/Currency";
import { useEffect, useState } from "react";

export interface RawBalance {
  amount_in_lowest_denom: number;
  currency: Currency;
}

export interface Balance {
  amountInLowestDenom: number;
  currency: Currency;
}

export const useBalance = ({ uma }: { uma: string | undefined }) => {
  const [balance, setBalance] = useState<Balance>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchBalance() {
      if (!uma) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetchWithRedirect(
          `${getBackendUrl()}/user/balance?uma=${uma}`,
          {
            method: "GET",
            credentials: "include",
          },
        ).then((res) => {
          if (res.ok) {
            return res.json() as Promise<RawBalance>;
          } else {
            throw new Error("Failed to fetch user balance.");
          }
        });
        if (!ignore) {
          setBalance({
            amountInLowestDenom: response.amount_in_lowest_denom,
            currency: response.currency,
          });
          setIsLoading(false);
        }
      } catch (e: unknown) {
        const error = e as Error;
        setError(error.message);
        setIsLoading(false);
      }
    }

    let ignore = false;
    fetchBalance();
    return () => {
      ignore = true;
    };
  }, [uma]);

  return {
    balance,
    error,
    isLoading,
  };
};
