"use client";

import { TestWalletAvatar } from "@/components/TestWalletAvatar";
import { TestWalletButton } from "@/components/TestWalletButton";
import { useAppState } from "@/hooks/useAppState";
import { useWallets, Wallet } from "@/hooks/useWalletContext";
import { getUmaFromUsername } from "@/lib/uma";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const SidebarSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <section className="flex flex-col gap-2 w-full items-start px-2">
      <span className="px-4 text-[13px] w-full font-semibold leading-[18px] tracking-[-0.162px] text-secondary">
        {title}
      </span>
      <div className="flex flex-col w-full">{children}</div>
    </section>
  );
};

const ResourceButton = ({
  iconSrc,
  iconAlt,
  text,
  url,
}: {
  iconSrc: string;
  iconAlt: string;
  text: string;
  url: string;
}) => {
  return (
    <TestWalletButton
      buttonProps={{
        variant: "ghost",
        size: "sidebar",
        onClick: () => window.open(url),
      }}
      className="px-[16px] text-left"
    >
      <div className="flex flex-row items-center w-full gap-2">
        <div className="flex items-center justify-center">
          <Image
            src={iconSrc}
            alt={iconAlt}
            width={24}
            height={24}
            className="opacity-60"
          />
        </div>
        <span className="text-[15px] font-semibold leading-[20px] tracking-[-0.187px] text-secondary">
          {text}
        </span>
      </div>
    </TestWalletButton>
  );
};

export const Sidebar = () => {
  const router = useRouter();
  const { wallets, error: walletsError } = useWallets();
  const {
    currentWallet,
    setCurrentWallet,
    setIsCreateUmaDialogOpen,
    isLoggedIn,
  } = useAppState();

  useEffect(() => {
    if (walletsError) {
      console.error(`Failed to load sidebar: ${walletsError}`);
    }
  }, [walletsError]);

  const handleChooseWallet = (wallet: Wallet) => {
    setCurrentWallet(wallet);
    router.push("/wallet");
  };

  let walletButtons: JSX.Element[] = [];
  if (wallets && currentWallet) {
    walletButtons = wallets.map((wallet, index) => {
      return (
        <TestWalletButton
          key={wallet.id}
          className={`overflow-hidden justify-start ${
            wallet.id === currentWallet.id ? "bg-[#F2F3F5]" : ""
          }`}
          buttonProps={{
            variant: "sidebar",
            size: "sidebar",
            onClick: () => handleChooseWallet(wallet),
          }}
        >
          <TestWalletAvatar
            ownContact={{
              wallet,
              number: index + 1,
            }}
            size="sm"
          />
          <span className="truncate">
            {getUmaFromUsername(wallet.uma.username)}
          </span>
        </TestWalletButton>
      );
    });
  }

  return (
    <div className="flex flex-col justify-between w-[280px] h-full bg-background pt-[28px] pb-[12px] border-r border-r-[#EBEEF2]">
      <section className="flex flex-col gap-12">
        <div className="flex flex-row items-center gap-[6px] pl-[24px]">
          <Image
            src="/icons/uma-outline.svg"
            alt="Logo"
            width={41.25}
            height={18}
          />
          <span className="text-primary text-[16px] font-bold leading-[24px] tracking-[-0.32px]">
            Test Wallet
          </span>
        </div>
        <section className="flex flex-col gap-10">
          {isLoggedIn && (
            <SidebarSection title="Your test UMAs">
              {walletButtons}
              <TestWalletButton
                buttonProps={{
                  variant: "ghost",
                  size: "sidebar",
                  onClick: () => {
                    setIsCreateUmaDialogOpen(true);
                    router.push("/wallet");
                  },
                }}
                className="px-[16px] text-left"
              >
                <div className="flex flex-row items-center w-full gap-2">
                  <div className="flex items-center justify-center bg-[#EBEEF2] rounded">
                    <Image
                      src="/icons/plus.svg"
                      alt="Add UMA"
                      width={24}
                      height={24}
                      className="opacity-50"
                    />
                  </div>
                  <span className="text-[15px] font-semibold leading-[20px] tracking-[-0.187px] text-secondary">
                    New test UMA
                  </span>
                </div>
              </TestWalletButton>
            </SidebarSection>
          )}
          <SidebarSection title="Resources">
            <div className="flex flex-col">
              <ResourceButton
                iconSrc="/icons/playground.svg"
                iconAlt="Playground"
                text="UMA Playground"
                url="https://playground.uma.me"
              />
              <ResourceButton
                iconSrc="/icons/book.svg"
                iconAlt="Docs"
                text="View docs"
                url="https://docs.uma.me"
              />
              <ResourceButton
                iconSrc="/icons/github.svg"
                iconAlt="GitHub"
                text="GitHub"
                url="https://github.com/uma-universal-money-address/uma-test-wallet"
              />
            </div>
          </SidebarSection>
        </section>
      </section>
      {isLoggedIn && (
        <TestWalletButton
          buttonProps={{
            variant: "ghost",
            size: "sidebar",
            onClick: () => router.push("/settings"),
          }}
        >
          <div className="flex flex-row items-center w-full gap-2">
            <Image
              src="/icons/settings-gear-2.svg"
              alt="Settings"
              width={24}
              height={24}
              className="opacity-50"
            />
            <span className="text-[15px] font-semibold leading-[20px] tracking-[-0.187px] text-secondary">
              Account settings
            </span>
          </div>
        </TestWalletButton>
      )}
    </div>
  );
};
