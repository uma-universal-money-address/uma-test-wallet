"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import { getBackendUrl } from "@/lib/backendUrl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);

  const handleLogin = async () => {
    setIsLoadingLogin(true);

    try {
      const prepRes = await fetch(
        `${getBackendUrl()}/auth/webauthn_prepare_login`,
        {
          method: "POST",
        },
      );
      const prepData = (await prepRes.json()) as {
        challenge_id: string;
        options: {
          allowCredentials: [];
          challenge: string;
          rpId: string;
          timeout: number;
        };
      };

      const credential = await navigator.credentials.get({
        publicKey: {
          ...prepData.options,
          challenge: Uint8Array.from(prepData.options.challenge, (c) =>
            c.charCodeAt(0),
          ),
        },
      });
      if (!credential) {
        toast({
          title: "Login method not provided.",
          variant: "error",
        });
        setIsLoadingLogin(false);
        return;
      }

      const loginRes = await fetch(`${getBackendUrl()}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webauthn: {
            challenge_id: prepData.challenge_id,
            credential,
          },
        }),
      });
      const loginData = await loginRes.json();
      if (loginData.success) {
        router.push("/wallet");
      } else {
        toast({
          title: "Failed to login.",
          variant: "error",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingLogin(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold">Welcome to UMA sandbox</h1>
      <SandboxButton
        loading={isLoadingLogin}
        buttonProps={{ onClick: handleLogin }}
      >
        Login
      </SandboxButton>
    </div>
  );
}
