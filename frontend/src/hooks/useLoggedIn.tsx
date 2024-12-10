import { getBackendUrl } from "@/lib/backendUrl";
import { useEffect, useState } from "react";

export interface RawLoggedIn {
  logged_in: boolean;
}

export interface LoggedIn {
  loggedIn: boolean;
}

export const useLoggedIn = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchLoggedIn() {
      setIsLoading(true);
      try {
        const response = await fetch(`${getBackendUrl()}/auth/logged_in`, {
          method: "GET",
          credentials: "include",
        }).then((res) => {
          if (res.ok) {
            return res.json() as Promise<RawLoggedIn>;
          } else {
            throw new Error("Failed to fetch user logged in status.");
          }
        });
        if (!ignore) {
          setIsLoggedIn(response.logged_in);
          setIsLoading(false);
        }
      } catch (e: unknown) {
        const error = e as Error;
        setError(error.message);
        setIsLoading(false);
      }
    }

    let ignore = false;
    fetchLoggedIn();
    return () => {
      ignore = true;
    };
  }, []);

  return {
    isLoggedIn,
    error,
    isLoading,
  };
};
