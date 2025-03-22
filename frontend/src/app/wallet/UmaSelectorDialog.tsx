import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { TestWalletAvatar } from "@/components/TestWalletAvatar";
import { TestWalletButton } from "@/components/TestWalletButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { Wallet } from "@/hooks/useWalletContext";
import { convertToNormalDenomination } from "@/lib/convertToNormalDenomination";
import { getUmaFromUsername } from "@/lib/uma";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MAX_WALLETS } from "../(onboarding)/CreateUma";

interface Props {
  wallets: Wallet[];
}

export const UmaSelectorDialog = ({ wallets }: Props) => {
  const { toast } = useToast();
  const {
    currentWallet,
    setCurrentWallet,
    isUmaSelectorDialogOpen,
    setIsUmaSelectorDialogOpen,
    setIsCreateUmaDialogOpen,
  } = useAppState();

  const handleCreateUma = () => {
    const hasMaxWallets = wallets.length >= MAX_WALLETS;
    if (hasMaxWallets) {
      toast({
        description:
          "You have reached the maximum number of test UMAs for this account",
        variant: "error",
      });
    } else {
      setIsUmaSelectorDialogOpen(false);
      setIsCreateUmaDialogOpen(true);
    }
  };

  const handleChooseWallet = (wallet: Wallet) => {
    setCurrentWallet(wallet);
    setIsUmaSelectorDialogOpen(false);
  };

  return (
    <ResponsiveDialog
      open={isUmaSelectorDialogOpen}
      onOpenChange={setIsUmaSelectorDialogOpen}
      title="Select UMA"
      description="Select an UMA"
    >
      <UmaSelectorDialogContent
        wallets={wallets}
        currentWallet={currentWallet}
        handleCreateUma={handleCreateUma}
        handleChooseWallet={handleChooseWallet}
      />
    </ResponsiveDialog>
  );
};

const UmaSelectorDialogContent = ({
  currentWallet,
  wallets,
  handleCreateUma,
  handleChooseWallet,
}: {
  currentWallet: Wallet | undefined;
  wallets: Wallet[] | undefined;
  handleCreateUma: () => void;
  handleChooseWallet: (wallet: Wallet) => void;
}) => {
  const router = useRouter();

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  const hasMaxWallets = wallets && wallets.length >= MAX_WALLETS;

  return (
    <>
      <div className="flex flex-row w-full justify-between items-center px-6 py-2 min-w-[300px]">
        <span className="text-xl font-semibold leading-[25px] tracking-[-0.25px]">
          Account
        </span>
        <div className="flex flex-row gap-2">
          <Button variant="icon" size="icon" onClick={handleOpenSettings}>
            <Image
              src="/icons/settings.svg"
              alt="Settings"
              width={24}
              height={24}
            />
          </Button>
        </div>
      </div>
      {wallets && currentWallet ? (
        <WalletRows
          currentWallet={currentWallet}
          wallets={wallets}
          handleChooseWallet={handleChooseWallet}
        />
      ) : (
        <div className="flex flex-col items-center text-center w-full py-8 px-6 gap-2">
          <span className="text-[17px] font-normal leading-[22px] tracking-[-.212px]">
            Nothing here yet
          </span>
          <span className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-.187px] w-[250px]">
            {`When you create test UMAs, they'll appear here.`}
          </span>
        </div>
      )}
      <div className="flex flex-col px-6 pt-3 pb-4 gap-[10px]">
        <TestWalletButton
          buttonProps={{
            size: "lg",
            onClick: handleCreateUma,
          }}
          tooltip={
            hasMaxWallets
              ? "You have reached the maximum number of test UMAs for this account"
              : undefined
          }
          className="w-full gap-2 items-center justify-center"
        >
          <Image
            src="/icons/plus.svg"
            alt="plus"
            width={24}
            height={24}
            className="invert"
          />
          Create a new test UMA
        </TestWalletButton>
      </div>
    </>
  );
};

const WalletRows = ({
  currentWallet,
  wallets,
  handleChooseWallet,
}: {
  currentWallet: Wallet;
  wallets: Wallet[];
  handleChooseWallet: (wallet: Wallet) => void;
}) => {
  const { toast } = useToast();
  const handleCopy = (umaAddress: string) => {
    navigator.clipboard.writeText(umaAddress);

    toast({
      description: "Copied to clipboard",
    });
  };

  return (
    <div className="flex flex-col divide-y">
      {wallets.map((wallet, index) => {
        const umaAddress = getUmaFromUsername(wallet.uma.username);
        const isCurrentWallet = wallet.id === currentWallet.id;
        const amount = convertToNormalDenomination(
          wallet.amountInLowestDenom,
          wallet.currency,
        );
        const amountLocaleString = `${Number(amount).toLocaleString("en", {
          maximumFractionDigits: wallet.currency.decimals,
        })} ${wallet.currency.code}`;
        return (
          <div
            key={wallet.id}
            className="flex flex-row justify-between py-5 px-6"
            onClick={() => handleChooseWallet(wallet)}
          >
            <div className="flex flex-row items-center overflow-hidden">
              <div className="pr-4">
                <TestWalletAvatar
                  ownContact={{
                    wallet,
                    number: index + 1,
                  }}
                  size="md"
                />
              </div>
              <div className="flex flex-col gap-[2px] items-start overflow-hidden">
                <span className="text-primary font-normal text-[15px] leading-[20px] tracking-[-0.187px] truncate text-ellipsis">
                  {umaAddress}
                </span>
                <span className="text-secondary font-normal text-[13px] leading-[18px] tracking-[-0.162px]">
                  {amountLocaleString}
                </span>
              </div>
            </div>
            <Button
              variant="icon"
              size="icon"
              onClick={() => handleCopy(umaAddress)}
            >
              <Image
                src={
                  isCurrentWallet
                    ? "/icons/checkmark-2-small.svg"
                    : "/icons/square-behind-square-6.svg"
                }
                alt={isCurrentWallet ? "Checkmark" : "Copy"}
                width={24}
                height={24}
                className={isCurrentWallet ? "" : "opacity-50"}
              />
            </Button>
          </div>
        );
      })}
    </div>
  );
};
