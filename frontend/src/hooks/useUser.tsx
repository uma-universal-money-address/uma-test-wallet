import { getBackendUrl } from "@/lib/backendUrl";
import { useEffect, useState } from "react";

export interface RawUser {
  id: string;
  google_id: string;
  webauthn_id: string;
}

export interface User {
  id: string;
  googleId: string;
  webauthnId: string;
}

export const useUser = () => {
  const [user, setUser] = useState<User>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUser() {
      setIsLoading(true);
      try {
        const response = await fetch(`${getBackendUrl()}/user`, {
          method: "GET",
          credentials: "include",
        }).then((res) => {
          if (res.ok) {
            return res.json() as Promise<RawUser>;
          } else {
            throw new Error("Failed to fetch user user.");
          }
        });
        if (!ignore) {
          setUser({
            id: response.id,
            googleId: response.google_id,
            webauthnId: response.webauthn_id,
          });
          setIsLoading(false);
        }
      } catch (e: unknown) {
        const error = e as Error;
        setError(error.message);
        setIsLoading(false);
      }
    }

    let ignore = false;
    fetchUser();
    return () => {
      ignore = true;
    };
  }, []);

  return {
    user,
    error,
    isLoading,
  };
};
