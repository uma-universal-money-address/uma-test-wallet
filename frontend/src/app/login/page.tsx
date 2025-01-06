"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import { getBackendUrl } from "@/lib/backendUrl";
import { convertArrayBuffersToBase64 } from "@/lib/convertArrayBuffersToBase64";
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
            credential: convertArrayBuffersToBase64(
              credential as unknown as Record<string, string | ArrayBuffer>,
            ),
          },
        }),
      });
      const loginData = await loginRes.json();
      if (loginData.success) {
        // Get redirect uri from next query param
        const next = new URLSearchParams(window.location.search).get("next");
        const [path, redirectUri] = next?.split("?redirect_uri=") || [];

        if (!path || !redirectUri) {
          toast({
            title: "Failed to redirect.",
            variant: "error",
          });
        } else {
          router.push(
            `${getBackendUrl()}${path}?redirect_uri=${encodeURIComponent(
              redirectUri,
            )}`,
          );
        }
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
    <div className="flex flex-col h-full items-center justify-center">
      <SandboxButton
        buttonProps={{
          size: "lg",
          onClick: handleLogin,
        }}
        loading={isLoadingLogin}
        className="w-full"
      >
        Login
      </SandboxButton>
    </div>
  );
}
