"use client";

import { TestWalletButton } from "@/components/TestWalletButton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { useWallets } from "@/hooks/useWalletContext";
import { getBackendUrl } from "@/lib/backendUrl";
import { convertArrayBuffersToBase64 } from "@/lib/convertArrayBuffersToBase64";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepButtonProps } from "./Steps";

export const Welcome = () => {
  const isShortScreen = useMediaQuery("(max-height: 600px)");
  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <div
        style={{
          padding: isShortScreen ? "16px" : "20px",
        }}
        className="border border-[#DDE3F3] rounded-[34px]"
      >
        <Image
          className="dark:invert"
          src="/uma-test-wallet-icon.svg"
          alt="UMA logo"
          width={isShortScreen ? 120 : 180}
          height={isShortScreen ? 28 : 38}
          priority
        />
      </div>
      <div
        style={{
          paddingTop: isShortScreen ? "20px" : "40px",
        }}
        className="flex flex-col gap-2 items-center text-center"
      >
        <h1 className="text-primary text-[26px] font-bold leading-[34px] tracking-[-0.325px]">
          UMA Test Wallet
        </h1>
        <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px] max-w-[304px]">
          Create a test Universal Money Address (UMA) and simulate sending and
          receiving money on regtest
        </p>
      </div>
    </div>
  );
};

export const WelcomeButtons = ({ onNext }: StepButtonProps) => {
  const router = useRouter();
  const { fetchWallets } = useWallets();
  const { toast } = useToast();
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const { setIsLoggedIn } = useAppState();

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
        fetchWallets();
        setIsLoggedIn(true);
        router.push("/wallet");
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
    <div className="flex flex-col gap-[10px]">
      <TestWalletButton
        buttonProps={{
          variant: "secondary",
          size: "lg",
          onClick: handleLogin,
        }}
        loading={isLoadingLogin}
        className="w-full"
      >
        I already have a test UMA
      </TestWalletButton>
      <TestWalletButton
        buttonProps={{
          size: "lg",
          onClick: onNext,
        }}
        className="w-full"
      >
        Create a new test UMA
      </TestWalletButton>
    </div>
  );
};
