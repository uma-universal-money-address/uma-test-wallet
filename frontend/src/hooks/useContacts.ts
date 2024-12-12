import { getBackendUrl } from "@/lib/backendUrl";
import { Currency } from "@/types/Currency";
import { useEffect, useState } from "react";

export interface ContactInfo {
  userId: string;
  uma: string;
}

interface RawContactInfo {
  id: string;
  uma: string;
}

interface RawContacts {
  recent_contacts: RawContactInfo[];
  own_umas: RawContactInfo[];
}

export interface ExampleContact {
  umaUserName: string;
  image: string;
  currency: Currency;
}

export const EXAMPLE_UMA_CONTACTS: ExampleContact[] = [
  {
    umaUserName: "usa",
    image: "/icons/usa_flag.svg",
    currency: {
      code: "USD",
      symbol: "$",
      name: "United States dollar",
      decimals: 2,
    },
  },
  {
    umaUserName: "brazil",
    image: "/icons/brazil_flag.svg",
    currency: {
      code: "BRL",
      symbol: "R$",
      name: "Brazilian real",
      decimals: 2,
    },
  },
  {
    umaUserName: "mexico",
    image: "/icons/mexico_flag.svg",
    currency: {
      code: "MXN",
      symbol: "$",
      name: "Mexican peso",
      decimals: 2,
    },
  },
  {
    umaUserName: "philippines",
    image: "/icons/philippines_flag.svg",
    currency: {
      code: "PHP",
      symbol: "₱",
      name: "Philippine peso",
      decimals: 2,
    },
  },
  {
    umaUserName: "eu",
    image: "/icons/eu_flag.svg",
    currency: {
      code: "EUR",
      symbol: "€",
      name: "Euro",
      decimals: 2,
    },
  },
  {
    umaUserName: "nigeria",
    image: "/icons/nigeria_flag.svg",
    currency: {
      code: "NGN",
      symbol: "₦",
      name: "Nigerian naira",
      decimals: 2,
    },
  },
];

export const useContacts = () => {
  const [recentContacts, setRecentContacts] = useState<ContactInfo[]>();
  const [ownUmaContacts, setOwnUmaContacts] = useState<ContactInfo[]>();
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
            return res.json() as Promise<RawContacts>;
          } else {
            throw new Error("Failed to fetch contacts.");
          }
        });
        if (!ignore) {
          setRecentContacts(
            response.recent_contacts.map(({ uma, id }) => ({
              userId: id,
              uma,
            })),
          );
          setOwnUmaContacts(
            response.own_umas.map(({ uma, id }) => ({
              userId: id,
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
    recentContacts,
    ownUmaContacts,
    error,
    isLoading,
  };
};
