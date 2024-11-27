import { type ExchangeRates } from "@/hooks/useExchangeRates";

export const convertCurrency = (
  exchangeRates: ExchangeRates,
  originalAmount: {
    amount: number;
    currencyCode: string;
  },
  currencyCode: string,
) => {
  const exchangeRateOriginalCurrency =
    exchangeRates[originalAmount.currencyCode];
  const exchangeRateNewCurrency = exchangeRates[currencyCode];

  if (originalAmount.currencyCode !== "SAT" && !exchangeRateOriginalCurrency) {
    throw new Error(
      `Exchange rate for ${exchangeRateOriginalCurrency} not found.`,
    );
  }

  if (!exchangeRateNewCurrency) {
    throw new Error(`Exchange rate for ${exchangeRateNewCurrency} not found.`);
  }

  // Convert SAT to BTC and then to the target currency.
  if (originalAmount.currencyCode === "SAT") {
    return (originalAmount.amount / 1e8) * exchangeRateNewCurrency;
  }

  return (
    originalAmount.amount *
    (exchangeRateNewCurrency / exchangeRateOriginalCurrency)
  );
};
