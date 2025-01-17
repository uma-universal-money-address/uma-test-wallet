import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { deleteWallet } from "@/lib/deleteWallet";
import OnboardingStepContextProvider, {
  OnboardingStep,
  useOnboardingStepContext,
} from "../app/(onboarding)/OnboardingStepContextProvider";
import { Steps } from "../app/(onboarding)/Steps";

interface Props {
  refreshWallets: () => Promise<void>;
}

export const CreateUmaDialog = ({ refreshWallets }: Props) => {
  const { toast } = useToast();
  const { setIsCreateUmaDialogOpen } = useAppState();

  return (
    <OnboardingStepContextProvider
      stepOrder={[
        OnboardingStep.CreateUma,
        OnboardingStep.CreatingTestUmaLoading,
        OnboardingStep.WalletCustomization,
      ]}
      onFinish={() => {
        setIsCreateUmaDialogOpen(false);
        refreshWallets();
        toast({
          title: "New test UMA created",
        });
      }}
    >
      <CreateUmaDialogInternal>
        <Steps showHeader={false} />
      </CreateUmaDialogInternal>
    </OnboardingStepContextProvider>
  );
};

const CreateUmaDialogInternal = ({ children }: { children: JSX.Element }) => {
  const { isCreateUmaDialogOpen, setIsCreateUmaDialogOpen } = useAppState();
  const { wallet, resetStep } = useOnboardingStepContext();

  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsCreateUmaDialogOpen(isOpen);
    if (!isOpen) {
      // Edge case where the user closes the dialog before the onboarding is finished, delete the wallet
      if (wallet) {
        deleteWallet(wallet.id);
      }

      // Reset the onboarding step
      resetStep();
    }
  };

  return (
    <ResponsiveDialog
      open={isCreateUmaDialogOpen}
      onOpenChange={handleDialogOpenChange}
      title="Create UMA"
      description="Create an UMA"
    >
      {children}
    </ResponsiveDialog>
  );
};
