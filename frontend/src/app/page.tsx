"use client";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { useLoggedIn } from "@/hooks/useLoggedIn";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import OnboardingStepContextProvider, {
  OnboardingStep,
} from "./(onboarding)/OnboardingStepContextProvider";
import { Steps } from "./(onboarding)/Steps";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useLoggedIn();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/wallet");
    }
  }, [router, isLoggedIn]);

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <PwaInstallBanner />
      <OnboardingStepContextProvider
        stepOrder={[
          OnboardingStep.Welcome,
          OnboardingStep.CreateUma,
          OnboardingStep.CreatingTestUmaLoading,
          OnboardingStep.WalletCustomization,
          OnboardingStep.EnableNotifications,
          OnboardingStep.Finished,
        ]}
        onFinish={() => router.push("/wallet")}
      >
        <Steps showHeader />
      </OnboardingStepContextProvider>
    </div>
  );
}
