import { getBackendUrl } from "@/lib/backendUrl";
import { useEffect, useState } from "react";

export interface ContactInfo {
  userId: string;
  name: string;
  uma: string;
}

interface RawContactInfo {
  id: string;
  name: string;
  uma: string;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<ContactInfo[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchContacts() {
      setIsLoading(true);
      try {
        const response = await fetch(`${getBackendUrl()}/user/contacts`, {
          method: "GET",
          credentials: "include",
        }).then((res) => {
          if (res.ok) {
            return res.json() as Promise<RawContactInfo[]>;
          } else {
            throw new Error("Failed to fetch contacts.");
          }
        });
        if (!ignore) {
          setContacts(
            response.map(({ name, uma, id }) => ({
              userId: id,
              name,
              uma,
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
    fetchContacts();
    return () => {
      ignore = true;
    };
  }, []);

  return {
    contacts,
    error,
    isLoading,
  };
};
