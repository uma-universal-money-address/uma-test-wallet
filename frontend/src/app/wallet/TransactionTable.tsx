"use client";
import { SandboxAvatar } from "@/components/SandboxAvatar";
import { useToast } from "@/hooks/use-toast";
import { ExchangeRates, useExchangeRates } from "@/hooks/useExchangeRates";
import { type Transaction, useTransactions } from "@/hooks/useTransactions";
import { useWallets, Wallet } from "@/hooks/useWalletContext";
import { convertCurrency } from "@/lib/convertCurrency";
import { convertToNormalDenomination } from "@/lib/convertToNormalDenomination";
import { getUmaFromUsername } from "@/lib/uma";
import { useEffect } from "react";

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
    })} sats`;
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

  return (
    <div
      onClick={handleClick}
      className="flex flex-row gap-2 cursor-pointer select-none transition-transform active:scale-95 duration-100"
    >
      <SandboxAvatar
        size="lg"
        ownContact={
          walletIndex >= 0
            ? {
                wallet: wallets[walletIndex],
                number: walletIndex + 1,
              }
            : undefined
        }
      />
      <div className="flex flex-col gap-[2px] justify-center grow overflow-hidden">
        <div className="flex flex-row justify-between gap-2">
          <span className="text-primary text-[15px] font-medium leading-[20px] tracking-[-0.187px] truncate text-ellipsis">
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
          <div className="flex flex-col grow gap-6 pt-2 animate-[fadeInAndSlideDown_0.5s_ease-in-out_forwards]">
            <span className="text-secondary text-[13px] font-semibold leading-[18px] tracking-[-0.162px]">
              Completed
            </span>
            {transactionRows}
          </div>
        )}
    </>
  );
};
