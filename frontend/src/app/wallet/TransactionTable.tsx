"use client";
import { SandboxAvatar } from "@/components/SandboxAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ExchangeRates, useExchangeRates } from "@/hooks/useExchangeRates";
import { type Transaction, useTransactions } from "@/hooks/useTransactions";
import { useWallets, Wallet } from "@/hooks/useWalletContext";
import { convertCurrency } from "@/lib/convertCurrency";
import React, { useEffect } from "react";

const LoadingTransactionRow = () => {
  return (
    <div className="flex flex-row gap-2 cursor-pointer select-none transition-transform active:scale-95 duration-100">
      <SandboxAvatar size="lg" />
      <div className="flex flex-col gap-[2px] justify-center grow">
        <div className="flex flex-row justify-between gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="flex flex-row justify-between gap-2">
          <Skeleton className="h-[13px] w-10" />
          <Skeleton className="h-[13px] w-8" />
        </div>
      </div>
    </div>
  );
};

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
  const estimateLocaleString = convertCurrency(
    exchangeRates,
    {
      amount: isReceiving
        ? transaction.amountInLowestDenom
        : -transaction.amountInLowestDenom,
      currencyCode: transaction.currencyCode,
    },
    "USD",
  ).toLocaleString("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 8,
  });

  const handleClick = () => {
    console.log("TODO: Open transaction details");
  };

  const amount = isReceiving ? (
    <span className="text-nowrap text-[#19981E]">{`+${transaction.amountInLowestDenom.toLocaleString(
      "en",
      {
        maximumFractionDigits: 8,
      },
    )} sats`}</span>
  ) : (
    <span className="text-nowrap">{`${(-transaction.amountInLowestDenom).toLocaleString(
      "en",
      {
        maximumFractionDigits: 8,
      },
    )} sats`}</span>
  );

  const walletIndex = wallets.findIndex(
    (wallet) => wallet.userId === transaction.userId,
  );

  return (
    <div
      onClick={handleClick}
      className="flex flex-row gap-2 cursor-pointer select-none transition-transform active:scale-95 duration-100"
    >
      <SandboxAvatar
        size="lg"
        sandboxWallet={
          walletIndex >= 0
            ? {
                wallet: wallets[walletIndex],
                number: walletIndex + 1,
              }
            : undefined
        }
      />
      <div className="flex flex-col gap-[2px] justify-center grow">
        <div className="flex flex-row justify-between gap-2">
          <span className="text-primary text-[15px] font-medium leading-[20px] tracking-[-0.187px]">
            {transaction.otherUma}
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
  const { transactions, isLoading, error } = useTransactions();
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

  useEffect(() => {
    const anyError = error || exchangeRatesError || walletsError;
    if (anyError) {
      toast({
        title: `Failed to load transactions table: ${anyError}`,
        variant: "error",
      });
    }
  }, [error, exchangeRatesError, walletsError, toast]);

  let transactionRows: React.ReactNode;
  if (isLoading || isLoadingExchangeRates || isLoadingWallets) {
    transactionRows = [
      <LoadingTransactionRow key="loader-1" />,
      <LoadingTransactionRow key="loader-2" />,
      <LoadingTransactionRow key="loader-3" />,
      <LoadingTransactionRow key="loader-4" />,
      <LoadingTransactionRow key="loader-5" />,
    ];
  } else if (!transactions) {
    return (
      <div className="flex flex-col gap-6 pt-2 pb-4">
        <span className="text-secondary text-[13px] font-normal leading-[18px] tracking-[-0.162px]">
          No transactions
        </span>
      </div>
    );
  } else {
    transactionRows = transactions?.map((transaction) => (
      <TransactionRow
        key={transaction.id}
        transaction={transaction}
        exchangeRates={exchangeRates!}
        wallets={wallets || []}
      />
    ));
  }

  return (
    <div className="flex flex-col grow gap-6 pt-2 pb-4">
      <span className="text-secondary text-[13px] font-semibold leading-[18px] tracking-[-0.162px]">
        Completed
      </span>
      {transactionRows}
    </div>
  );
};
