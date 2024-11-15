import { getBackendUrl } from "@/lib/backendUrl";
import { useEffect, useState } from "react";

export const useUma = () => {
  const [umas, setUmas] = useState<string>("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUma() {
      setIsLoading(true);
      try {
        const response = await fetch(`${getBackendUrl()}/user/umas`, {
          method: "GET",
          credentials: "include",
        }).then((res) => {
          if (res.ok) {
            return res.json() as Promise<{ umas: string }>;
          } else {
            throw new Error("Failed to fetch user uma.");
          }
        });
        if (!ignore) {
          setUmas(response.umas);
          setIsLoading(false);
        }
      } catch (e: unknown) {
        const error = e as Error;
        setError(error.message);
        setIsLoading(false);
      }
    }

    let ignore = false;
    fetchUma();
    return () => {
      ignore = true;
    };
  }, []);

  return {
    umas,
    error,
    isLoading,
  };
};
