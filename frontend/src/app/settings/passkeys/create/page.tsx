"use client";

import { InfoRow } from "@/components/InfoRow";
import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import { getBackendUrl } from "@/lib/backendUrl";
import { startRegistration } from "@simplewebauthn/browser";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);

  const handleRegister = async () => {
    setIsLoadingRegister(true);
    try {
      const optionsRes = await fetch(
        `${getBackendUrl()}/auth/webauthn_options`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const options = await optionsRes.json();
      const attResp = await startRegistration({ optionsJSON: options });
      const verificationRes = await fetch(
        `${getBackendUrl()}/auth/webauthn_register`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attResp),
        },
      );
      const verification = await verificationRes.json();
      if (verification.success) {
        router.back();
        toast({
          title: "Passkey created",
        });
      } else {
        throw new Error("Failed to register passkey.");
      }
    } catch (e) {
      const error = e as unknown as Error;
      console.error(error);
    } finally {
      setIsLoadingRegister(false);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full w-full overflow-y-scroll no-scrollbar">
      <div className="flex flex-col align-center justify-center h-full w-full">
        <div className="flex flex-col w-full h-full justify-between pt-6">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2 px-8">
              <h1 className="text-primary text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
                Create a passkey
              </h1>
              <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
                Create a passkey to securely access your test UMA and funds
                anytime, anywhere.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-8 w-full py-4 px-8">
              <InfoRow
                icon="/icons/devices.svg"
                title="Test on your other devices"
                description="Use a passkey to log in on other devices for testing and debugging."
              />
              <InfoRow
                icon="/icons/secure.svg"
                title="Seamless, secure access"
                description="Passkeys let you access your test UMA faster and more securely using your face, fingerprint, or hardware key."
              />
            </div>
          </div>
          <div className="w-full p-6">
            <SandboxButton
              buttonProps={{
                size: "lg",
                onClick: handleRegister,
              }}
              loading={isLoadingRegister}
              className="flex flex-row w-full gap-2"
            >
              <Image
                className="invert"
                src="/icons/plus.svg"
                alt="Add"
                width={24}
                height={24}
              />
              Create passkey
            </SandboxButton>
          </div>
        </div>
      </div>
    </div>
  );
}
