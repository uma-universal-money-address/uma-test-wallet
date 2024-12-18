import { getBackendUrl } from "@/lib/backendUrl";
import { useEffect, useState } from "react";

interface RawCurrenciesInfo {
  code: string;
  name: string;
  symbol: string;
  millisatoshi_per_unit: number;
  min_sendable: number;
  max_sendable: number;
  decimals: number;
}

export interface CurrenciesInfo {
  code: string;
  name: string;
  symbol: string;
  millisatoshiPerUnit: number;
  minSendable: number;
  maxSendable: number;
  decimals: number;
}

export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState<CurrenciesInfo[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchCurrencies() {
      setIsLoading(true);
      try {
        const response = await fetch(`${getBackendUrl()}/currencies`, {
          method: "GET",
        }).then((res) => {
          if (res.ok) {
            return res.json() as Promise<RawCurrenciesInfo[]>;
          } else {
            throw new Error("Failed to fetch currencies.");
          }
        });
        if (!ignore) {
          setCurrencies(
            response.map((response) => ({
              code: response.code,
              name: response.name,
              symbol: response.symbol,
              millisatoshiPerUnit: response.millisatoshi_per_unit,
              minSendable: response.min_sendable,
              maxSendable: response.max_sendable,
              decimals: response.decimals,
            })),
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
    fetchCurrencies();
    return () => {
      ignore = true;
    };
  }, []);

  return {
    currencies,
    error,
    isLoading,
  };
};
