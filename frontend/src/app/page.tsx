"use client";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { useMediaQuery } from "@/hooks/use-media-query";
import OnboardingStepContextProvider, {
  OnboardingStep,
} from "./(onboarding)/OnboardingStepContextProvider";
import { Steps } from "./(onboarding)/Steps";

export default function Home() {
  const isShortScreen = useMediaQuery("(max-height: 660px)");
  const isMobile = useMediaQuery("(max-width: 479px)");
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <PwaInstallBanner top={isShortScreen && isMobile} />
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
