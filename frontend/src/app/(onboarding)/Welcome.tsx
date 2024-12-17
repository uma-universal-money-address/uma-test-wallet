"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import { getBackendUrl } from "@/lib/backendUrl";
import { convertArrayBuffersToBase64 } from "@/lib/convertArrayBuffersToBase64";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepButtonProps } from "./Step";

export const Welcome = () => {
  return (
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
  );
};

export const WelcomeButtons = ({ onNext }: StepButtonProps) => {
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
    <div className="flex flex-col gap-[10px]">
      <SandboxButton
        buttonProps={{
          variant: "secondary",
          size: "lg",
          onClick: handleLogin,
        }}
        loading={isLoadingLogin}
        className="w-full"
      >
        I already have a test UMA
      </SandboxButton>
      <SandboxButton
        buttonProps={{
          size: "lg",
          onClick: onNext,
        }}
        className="w-full"
      >
        Create a new test UMA
      </SandboxButton>
    </div>
  );
};
