"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UmaSwitcherFooter } from "@/components/UmaSwitcherFooter";
import { useToast } from "@/hooks/use-toast";
import UmaContextProvider, { useUma } from "@/hooks/useUmaContext";
import { getUmaFromUsername } from "@/lib/uma";
import Image from "next/image";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UmaContextProvider>
      <LayoutContent>{children}</LayoutContent>
    </UmaContextProvider>
  );
}

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { umas, isLoading: isLoadingUmas, error } = useUma();
  const defaultUma = umas.find((uma) => uma.default);

  const handleCopy = () => {
    if (isLoadingUmas) {
      return;
    }

    navigator.clipboard.writeText(getUmaFromUsername(defaultUma!.username));
    toast({
      title: "Copied to clipboard",
    });
  };

  useEffect(() => {
    if (error) {
      toast({
        title: `Failed to fetch user uma: ${error}`,
        variant: "error",
      });
    }
  }, [error, toast]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-4 py-[3px]">
        <div className="flex items-center">
          <span className="text-primary text-[15px] font-semibold leading-5 tracking-[-0.187px]">
            {isLoadingUmas || !defaultUma ? (
              <Skeleton className="w-[200px] h-[15px] rounded-full" />
            ) : (
              getUmaFromUsername(defaultUma.username)
            )}
          </span>
        </div>
        <div className="flex items-center">
          <Button variant="icon" size="icon" onClick={handleCopy}>
            <Image
              src="/icons/square-behind-square-6.svg"
              alt="Copy"
              width={24}
              height={24}
            />
          </Button>
          <Button variant="icon" size="icon">
            <Image
              src="/icons/settings-gear-2.svg"
              alt="Settings"
              width={24}
              height={24}
            />
          </Button>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <div className="pt-2 px-4 pb-3 border-[#EBEEF2] border">
        <UmaSwitcherFooter umas={umas} />
      </div>
    </div>
  );
};
