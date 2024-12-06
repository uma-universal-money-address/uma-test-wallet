import { getBackendUrl } from "@/lib/backendUrl";
import { useEffect, useState } from "react";

export interface RawUma {
  user_id: string;
  username: string;
  default: boolean;
}

export interface Uma {
  userId: string;
  username: string;
  default: boolean;
}

export const useUma = () => {
  const [umas, setUmas] = useState<Uma[]>([]);
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
            return res.json() as Promise<{ umas: RawUma[] }>;
          } else {
            throw new Error("Failed to fetch user uma.");
          }
        });
        if (!ignore) {
          setUmas(
            response.umas.map((uma) => ({
              userId: uma.user_id,
              username: uma.username,
              default: uma.default,
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
