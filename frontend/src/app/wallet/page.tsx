"use client";

import { Wallet } from "@/components/Wallet";
import { useUma } from "@/hooks/useUmaContext";

export default function Page() {
  const { umas, isLoading: isLoadingUmas } = useUma();
  const defaultUma = umas.find((uma) => uma.default);
  return (
    <div className="pt-2 px-6 pb-4">
      <Wallet uma={defaultUma?.username} isLoading={isLoadingUmas} />
    </div>
  );
}
