"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { useLoggedIn } from "@/hooks/useLoggedIn";
import { useWallets } from "@/hooks/useWalletContext";
import { getBackendUrl } from "@/lib/backendUrl";
import { convertArrayBuffersToBase64 } from "@/lib/convertArrayBuffersToBase64";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const router = useRouter();
  const { fetchWallets } = useWallets();
  const { toast } = useToast();
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const { isLoggedIn } = useLoggedIn();
  const { setIsLoggedIn, setNotificationsStepCompleted } = useAppState();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/wallet");
    }
  }, [router, isLoggedIn]);

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
          description: "Login method not provided.",
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
          fetchWallets();
          setIsLoggedIn(true);
          // Redirect to wallet page if no next query param
          router.push("/wallet");
          await Notification.requestPermission();
          setNotificationsStepCompleted(true);
        } else {
          router.push(
            `${getBackendUrl()}${path}?redirect_uri=${encodeURIComponent(
              redirectUri,
            )}`,
          );
        }
      } else {
        toast({
          description: "Failed to login.",
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
    <div className="flex flex-col h-full w-full justify-between">
      <div className="flex flex-col h-full w-full items-center justify-center">
        <div className="p-5 border border-[#DDE3F3] rounded-[34px]">
          <Image
            className="dark:invert"
            src="/uma-sandbox-icon.svg"
            alt="UMA logo"
            width={180}
            height={38}
            priority
          />
        </div>
        <div className="flex flex-col gap-2 items-center pt-8 pb-[56px] text-center">
          <h1 className="text-primary text-[26px] font-bold leading-[34px] tracking-[-0.325px]">
            UMA Sandbox
          </h1>
          <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px] max-w-[304px]">
            Create a test Universal Money Address (UMA) and simulate sending and
            receiving money on regtest
          </p>
        </div>
      </div>
      <div className="w-full px-6 pb-4">
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
    </div>
  );
}
