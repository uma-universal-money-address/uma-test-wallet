// TODO: Probably need a better way to do this. Unless we want to manually add flags for every supported currency
const CURRENCY_FLAG_MAPPING: Record<string, string> = {
  USD: "/icons/usa_flag.svg",
  EUR: "/icons/eu_flag.svg",
  BRL: "/icons/brazil_flag.svg",
  MXN: "/icons/mexico_flag.svg",
  PHP: "/icons/philippines_flag.svg",
  NGN: "/icons/nigeria_flag.svg",
};

export const getCurrencyFlagFromCode = (code: string) => {
  return CURRENCY_FLAG_MAPPING[code as keyof typeof CURRENCY_FLAG_MAPPING];
};

export const flagExists = (code: string) => {
  return (
    CURRENCY_FLAG_MAPPING[code as keyof typeof CURRENCY_FLAG_MAPPING] !==
    undefined
  );
};
