"use client";

import Image from "next/image";
import { EffectCallback, useEffect, useRef } from "react";
import { useOnboardingStepContext } from "./OnboardingStepContextProvider";

function useOnMountUnsafe(effect: EffectCallback) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      effect();
    }
  }, [effect]);
}

export const CreatingTestUmaLoading = () => {
  const { onNext } = useOnboardingStepContext();

  // Prevent from firing twice due to react strict mode in development mode
  useOnMountUnsafe(() => {
    setTimeout(() => {
      onNext();
    }, 1000);
  });

  return (
    <div className="flex flex-col h-full w-full items-center justify-center gap-4 pb-4 px-6">
      <h1 className="text-primary text-[22px] font-normal leading-[28px] tracking-[-0.275px]">
        Creating your test UMA
      </h1>
      <div className="p-5 border border-[#DDE3F3] rounded-[40px]">
        <Image
          src="/wallet-loading-animation.svg"
          alt="Loading animation"
          width={305}
          height={184}
        />
      </div>
      <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
        Mixing you a drink...
      </p>
    </div>
  );
};
