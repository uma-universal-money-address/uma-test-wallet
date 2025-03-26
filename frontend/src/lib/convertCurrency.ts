import { type ExchangeRates } from "@/hooks/useExchangeRates";
import { Currency } from "@/types/Currency";
import { convertToNormalDenomination } from "./convertToNormalDenomination";

export const convertCurrency = (
  exchangeRates: ExchangeRates,
  originalAmount: {
    amount: number;
    currency: Currency;
  },
  currencyCode: string,
) => {
  if (originalAmount.currency.code === currencyCode) {
    return originalAmount.amount;
  }

  const exchangeRateOriginalCurrency =
    exchangeRates[originalAmount.currency.code];
  const exchangeRateNewCurrency = exchangeRates[currencyCode];

  if (currencyCode === "SAT") {
    // Exchange rate is for BTC, so convert to normal denom, convert to BTC, and then multiply by 1e8 to get SAT.
    return (
      (Number(
        convertToNormalDenomination(
          originalAmount.amount,
          originalAmount.currency,
        ),
      ) /
        exchangeRateOriginalCurrency) *
      1e10
    );
  }

  if (originalAmount.currency.code !== "SAT" && !exchangeRateOriginalCurrency) {
    throw new Error(
      `Exchange rate for ${exchangeRateOriginalCurrency} not found.`,
    );
  }

  if (!exchangeRateNewCurrency) {
    throw new Error(`Exchange rate for ${exchangeRateNewCurrency} not found.`);
  }

  // Convert SAT to BTC and then to the target currency.
  if (originalAmount.currency.code === "SAT") {
    return (originalAmount.amount / 1e8) * exchangeRateNewCurrency;
  }

  return (
    originalAmount.amount *
    (exchangeRateNewCurrency / exchangeRateOriginalCurrency)
  );
};
