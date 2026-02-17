export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  type?: string;
}

export const AVAILABLE_CURRENCIES = new Set([
  "USD",
  "BRL",
  "MXN",
  "GBP",
  "NGN",
  "EUR",
  "PHP",
  "SAT",
  "INR",
]);
