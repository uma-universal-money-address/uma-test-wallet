import { useEffect, useState } from "react";

interface ExchangeRatesResponse {
  data: {
    currency: string;
    rates: Record<string, string>;
  };
}

export type ExchangeRates = Record<string, number>;

export const useExchangeRates = () => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchExchangeRates() {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://api.coinbase.com/v2/exchange-rates?currency=BTC",
          {
            method: "GET",
          },
        ).then((res) => {
          if (res.ok) {
            return res.json() as Promise<ExchangeRatesResponse>;
          } else {
            throw new Error("Failed to fetch exchange rates.");
          }
        });
        if (!ignore) {
          setExchangeRates(
            Object.entries(response.data.rates)
              .map(([currency, rate]) => ({ currency, rate }))
              .reduce((acc, { currency, rate }) => {
                acc[currency] = parseFloat(rate);
                return acc;
              }, {} as ExchangeRates),
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
    fetchExchangeRates();
    return () => {
      ignore = true;
    };
  }, []);

  return {
    exchangeRates,
    error,
    isLoading,
  };
};
