"use client";
import { SandboxAvatar } from "@/components/SandboxAvatar";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { ExchangeRates, useExchangeRates } from "@/hooks/useExchangeRates";
import { type Transaction, useTransactions } from "@/hooks/useTransactions";
import { useWallets, Wallet } from "@/hooks/useWalletContext";
import { convertCurrency } from "@/lib/convertCurrency";
import { convertToNormalDenomination } from "@/lib/convertToNormalDenomination";
import { getUmaFromUsername } from "@/lib/uma";
import Image from "next/image";
import { useEffect, useRef } from "react";

const TransactionRow = ({
  transaction,
  exchangeRates,
  wallets,
}: {
  transaction: Transaction;
  exchangeRates: ExchangeRates;
  wallets: Wallet[];
}) => {
  const isReceiving = transaction.amountInLowestDenom > 0;

  let estimate: number;
  let estimateLocaleString: string;
  if (transaction.currency.code === "SAT") {
    estimate = convertCurrency(
      exchangeRates,
      {
        amount: isReceiving
          ? transaction.amountInLowestDenom
          : -transaction.amountInLowestDenom,
        currency: transaction.currency,
      },
      "USD",
    );
    estimateLocaleString = `${estimate.toLocaleString("en", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 8,
    })}`;
  } else {
    estimate = convertCurrency(
      exchangeRates,
      {
        amount: isReceiving
          ? transaction.amountInLowestDenom
          : -transaction.amountInLowestDenom,
        currency: transaction.currency,
      },
      "SAT",
    );
    estimateLocaleString = `${estimate.toLocaleString("en", {
      maximumFractionDigits: 0,
    })} SATS`;
  }

  const handleClick = () => {
    console.log("TODO: Open transaction details");
  };

  const amountInNormalDenom = Number(
    convertToNormalDenomination(
      transaction.amountInLowestDenom,
      transaction.currency,
    ),
  );

  const amount = isReceiving ? (
    <span className="text-nowrap text-[#19981E]">{`+${amountInNormalDenom.toLocaleString(
      "en",
      {
        maximumFractionDigits: 8,
        minimumFractionDigits: transaction.currency.decimals,
      },
    )} ${transaction.currency.code}`}</span>
  ) : (
    <span className="text-nowrap">{`${(-amountInNormalDenom).toLocaleString(
      "en",
      {
        maximumFractionDigits: 8,
        minimumFractionDigits: transaction.currency.decimals,
      },
    )} ${transaction.currency.code}`}</span>
  );

  const walletIndex = wallets.findIndex(
    (wallet) =>
      getUmaFromUsername(wallet.uma.username) === transaction.otherUma,
  );
  const isOwnContact = walletIndex >= 0;
  const isFundingTransaction =
    transaction.otherUma.startsWith("$demo-funding-tx@");

  return (
    <div
      onClick={handleClick}
      className="flex flex-row gap-2 cursor-pointer select-none transition-transform active:scale-95 duration-100"
    >
      {isFundingTransaction ? (
        <div className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-[#C7E7C8]">
          <Image
            src="/icons/green-plus.svg"
            alt="demo funding"
            width={24}
            height={24}
          />
        </div>
      ) : (
        <SandboxAvatar
          size="lg"
          ownContact={
            isOwnContact
              ? {
                  wallet: wallets[walletIndex],
                  number: walletIndex + 1,
                }
              : undefined
          }
          currencyCode={
            isOwnContact ? wallets[walletIndex].currency.code : undefined
          }
        />
      )}
      <div className="flex flex-col gap-[2px] justify-center grow overflow-hidden">
        <div className="flex flex-row justify-between gap-2">
          <span className="text-primary text-[15px] font-medium leading-[20px] tracking-[-0.187px] truncate text-ellipsis">
            {isFundingTransaction ? "Added test funds" : transaction.otherUma}
          </span>
          {amount}
        </div>
        <div className="flex flex-row justify-between gap-2 text-secondary text-[13px] font-normal leading-[18px] tracking-[-0.162px]">
          <span>{transaction.createdAt}</span>
          <span>{estimateLocaleString}</span>
        </div>
      </div>
    </div>
  );
};

export const TransactionTable = () => {
  const { toast } = useToast();
  const { transactions, isLoading, error, refreshTransactions } =
    useTransactions();
  const {
    exchangeRates,
    error: exchangeRatesError,
    isLoading: isLoadingExchangeRates,
  } = useExchangeRates();
  const {
    wallets,
    isLoading: isLoadingWallets,
    error: walletsError,
  } = useWallets();
  const { currentWallet } = useAppState();

  const prevWalletBalanceRef = useRef<number | null>(null);

  useEffect(() => {
    const anyError = error || exchangeRatesError || walletsError;
    if (anyError) {
      toast({
        description: `Failed to load transactions table: ${anyError}`,
        variant: "error",
      });
    }
  }, [error, exchangeRatesError, walletsError, toast]);

  useEffect(() => {
    if (
      !wallets ||
      !refreshTransactions ||
      isLoadingWallets ||
      !currentWallet
    ) {
      return;
    }

    // Find the current wallet in the wallets array
    const wallet = wallets.find((w) => w.id === currentWallet.id);

    if (!wallet) {
      refreshTransactions();
      return;
    }

    // Only check if the current wallet's balance has changed
    const currentBalance = wallet.amountInLowestDenom;

    // Check if this is the first time we're seeing this wallet or if the balance changed
    const hasBalanceChanged =
      prevWalletBalanceRef.current === null ||
      prevWalletBalanceRef.current !== currentBalance;

    // Only refresh transactions if the current wallet's balance has changed
    if (hasBalanceChanged && currentBalance > 0) {
      refreshTransactions();
    }

    // Update the ref with the current wallet's balance
    prevWalletBalanceRef.current = currentBalance;
  }, [wallets, refreshTransactions, isLoadingWallets, currentWallet]);

  const transactionRows = transactions?.map((transaction) => (
    <TransactionRow
      key={transaction.id}
      transaction={transaction}
      exchangeRates={exchangeRates!}
      wallets={wallets || []}
    />
  ));

  return (
    <>
      {!isLoading &&
        !isLoadingWallets &&
        !isLoadingExchangeRates &&
        transactions &&
        exchangeRates &&
        wallets && (
          <div
            className={`flex flex-col grow gap-6 pt-2 animate-[fadeInAndSlideDown_0.5s_ease-in-out_forwards]`}
          >
            <span className="text-secondary text-[13px] font-semibold leading-[18px] tracking-[-0.162px]">
              Completed
            </span>
            {transactionRows}
          </div>
        )}
    </>
  );
};
