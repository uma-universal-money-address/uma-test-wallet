"use client";

import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { Wallet } from "@/hooks/useWalletContext";
import { convertToNormalDenomination } from "@/lib/convertToNormalDenomination";
import { getUmaFromUsername } from "@/lib/uma";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SandboxAvatar } from "./SandboxAvatar";
import { SandboxButton } from "./SandboxButton";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

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
      title: "Copied to clipboard",
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
            <DrawerClose className="flex flex-row items-center">
              <div className="pr-4">
                <SandboxAvatar
                  ownContact={{
                    wallet,
                    number: index + 1,
                  }}
                  size="md"
                />
              </div>
              <div className="flex flex-col gap-[2px] items-start">
                <span className="text-primary font-normal text-[15px] leading-[20px] tracking-[-0.187px]">
                  {umaAddress}
                </span>
                <span className="text-secondary font-normal text-[13px] leading-[18px] tracking-[-0.162px]">
                  {amountLocaleString}
                </span>
              </div>
            </DrawerClose>
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

interface Props {
  wallets: Wallet[];
}

export const UmaSwitcherFooter = ({ wallets }: Props) => {
  const router = useRouter();
  const { currentWallet, setCurrentWallet } = useAppState();

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  const handleCreateUma = () => {};

  const handleChooseWallet = (wallet: Wallet) => {
    setCurrentWallet(wallet);
  };

  let walletButtons: JSX.Element[] = [];
  if (wallets && currentWallet) {
    walletButtons = wallets.map((wallet, index) => {
      return (
        <div
          key={wallet.id}
          className={`
            animate-[fadeInAndSlideUp_0.5s_ease-in-out_forwards]
            transition-transform active:scale-95 duration-100
            ${
              wallet.id === currentWallet.id
                ? "ring-1 ring-offset-8 ring-[#C0C9D6] rounded-xl"
                : ""
            }`}
          onClick={() => handleChooseWallet(wallet)}
        >
          <SandboxAvatar
            ownContact={{
              wallet,
              number: index + 1,
            }}
            size="md"
          />
        </div>
      );
    });
  }

  return (
    <div className="flex flex-row p-4 w-full items-center justify-center gap-4">
      {walletButtons}
      {currentWallet && wallets && (
        <Drawer>
          <DrawerTrigger asChild>
            <Button className="p-2 bg-[#EBEEF2] hover:bg-gray-300 h-8 w-8 rounded-lg">
              <Image
                src="/icons/plus.svg"
                alt="Add UMA"
                width={24}
                height={24}
              />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-full">
            <DrawerHeader className="">
              <DrawerTitle className="flex flex-row w-full py-2">
                <div className="flex flex-row w-full justify-between items-center">
                  <span className="text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
                    Account
                  </span>
                  <Button
                    variant="icon"
                    size="icon"
                    onClick={handleOpenSettings}
                  >
                    <Image
                      src="/icons/settings.svg"
                      alt="Settings"
                      width={24}
                      height={24}
                    />
                  </Button>
                </div>
              </DrawerTitle>
            </DrawerHeader>
            <WalletRows
              currentWallet={currentWallet}
              wallets={wallets}
              handleChooseWallet={handleChooseWallet}
            />
            <div className="flex flex-col px-6 pb-12 gap-[10px]">
              <SandboxButton
                buttonProps={{
                  size: "lg",
                  onClick: handleCreateUma,
                }}
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
              </SandboxButton>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};
