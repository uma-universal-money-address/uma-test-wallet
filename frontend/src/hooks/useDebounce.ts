import { useEffect, useState } from "react";

export const useDebounce = <T>(func: () => T, deps: any[], delayMs: number) => {
  const [result, setResult] = useState(func);

  useEffect(() => {
    const handler = setTimeout(() => {
      setResult(func);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [...deps, func, delayMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
};
