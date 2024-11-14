import { useState } from "react";

export const useUma = () => {
  const [uma, setUma] = useState<string>("");

  return {
    uma,
    setUma,
  };
};
