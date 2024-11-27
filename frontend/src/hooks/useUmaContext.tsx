"use client";
import { getBackendUrl } from "@/lib/backendUrl";
import { fetchWithRedirect } from "@/lib/fetchWithRedirect";
import React, { useEffect, useState } from "react";

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

export interface UmaContextData {
  umas: Uma[];
  error?: string;
  isLoading: boolean;
}

const Context = React.createContext<UmaContextData>(null!);

export const UmaContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [umas, setUmas] = useState<Uma[]>([]);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUma() {
      setIsLoading(true);
      try {
        const response = await fetchWithRedirect(
          `${getBackendUrl()}/user/umas`,
          {
            method: "GET",
            credentials: "include",
          },
        ).then((res) => {
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

  return (
    <Context.Provider value={{ umas, error, isLoading }}>
      {children}
    </Context.Provider>
  );
};

export const useUma = () => {
  return React.useContext(Context);
};

export default UmaContextProvider;
