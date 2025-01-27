"use client";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import OnboardingStepContextProvider, {
  OnboardingStep,
} from "./(onboarding)/OnboardingStepContextProvider";
import { Steps } from "./(onboarding)/Steps";

export default function Home() {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <PwaInstallBanner />
      <OnboardingStepContextProvider
        stepOrder={[
          OnboardingStep.Welcome,
          OnboardingStep.CreateUma,
          OnboardingStep.CreatingTestUmaLoading,
          OnboardingStep.WalletCustomization,
          OnboardingStep.Register,
          OnboardingStep.EnableNotifications,
          OnboardingStep.Finished,
        ]}
      >
        <Steps showHeader />
      </OnboardingStepContextProvider>
    </div>
  );
}
