"use client";

import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useUma } from "@/hooks/useUmaContext";
import { getUmaFromUsername } from "@/lib/uma";
import { useEffect } from "react";

export default function Page() {
  const { toast } = useToast();
  const { umas, isLoading: isLoadingUmas, error } = useUma();
  const defaultUma = umas.find((uma) => uma.default);

  useEffect(() => {
    if (error) {
      toast({
        title: `Failed to fetch user uma: ${error}`,
        variant: "error",
      });
    }
  }, [error, toast]);

  return (
    <div className="pt-2 px-6 pb-4">
      <Wallet
        uma={defaultUma ? getUmaFromUsername(defaultUma?.username) : undefined}
        isLoading={isLoadingUmas}
      />
    </div>
  );
}
