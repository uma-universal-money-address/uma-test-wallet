import { getBackendUrl } from "@/lib/backendUrl";
import { useEffect, useState } from "react";

interface RawWebAuthnCredential {
  id: string;
  credential_id: string;
}

export interface RawLoginMethods {
  webauthn_credentials: RawWebAuthnCredential[];
}

export interface WebAuthnCredential {
  id: string;
  credentialId: string;
  lastUsed?: string;
}

export interface LoginMethods {
  webAuthnCredentials: WebAuthnCredential[];
}

const internalFetchLoginMethods = async (): Promise<RawLoginMethods> => {
  return fetch(`${getBackendUrl()}/user/login_methods`, {
    method: "GET",
    credentials: "include",
  }).then((res) => {
    if (res.ok) {
      return res.json() as Promise<RawLoginMethods>;
    } else {
      throw new Error("Failed to fetch user logged in status.");
    }
  });
};

export const useLoginMethods = () => {
  const [loginMethods, setLoginMethods] = useState<LoginMethods>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchLoginMethods() {
      setIsLoading(true);
      try {
        const response = await internalFetchLoginMethods();
        if (!ignore) {
          setLoginMethods({
            webAuthnCredentials: response.webauthn_credentials.map(
              ({ id, credential_id }) => ({
                id,
                credentialId: credential_id,
              }),
            ),
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
    fetchLoginMethods();
    return () => {
      ignore = true;
    };
  }, []);

  const refresh = async () => {
    try {
      const response = await internalFetchLoginMethods();
      setLoginMethods({
        webAuthnCredentials: response.webauthn_credentials.map(
          ({ id, credential_id }) => ({
            id,
            credentialId: credential_id,
          }),
        ),
      });
    } catch (e: unknown) {
      const error = e as Error;
      setError(error.message);
    }
  };

  return {
    loginMethods,
    error,
    isLoading,
    refresh,
  };
};
