import { type Currency } from "@/types/Currency";

export const convertToNormalDenomination = (
  amount: number,
  currency: Currency,
) => {
  return (amount / Math.pow(10, currency.decimals)).toFixed(currency.decimals);
};
