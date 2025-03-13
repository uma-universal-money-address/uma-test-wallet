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
import { useEffect, useRef, useState } from "react";

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

  // Track whether this is the initial load or a refresh
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Track when to animate the transaction list
  const [shouldAnimate, setShouldAnimate] = useState(true);
  // Store previous transactions to compare
  const prevTransactionsRef = useRef<Transaction[] | null>(null);
  // Store previous wallet balances to compare
  const prevWalletBalancesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const anyError = error || exchangeRatesError || walletsError;
    if (anyError) {
      toast({
        description: `Failed to load transactions table: ${anyError}`,
        variant: "error",
      });
    }
  }, [error, exchangeRatesError, walletsError, toast]);

  // Check if wallet has changed and set animation accordingly
  useEffect(() => {
    if (currentWallet) {
      // If the wallet ID has changed, we should animate
      if (prevTransactionsRef.current === null || !transactions) {
        // Initial load or no transactions yet
        setShouldAnimate(true);
      }
    }
  }, [currentWallet, transactions]);

  // Check if transactions have changed and animate if they have
  useEffect(() => {
    if (!transactions || isLoading) return;

    // If this is the first load, we've already set shouldAnimate to true
    if (!prevTransactionsRef.current) {
      prevTransactionsRef.current = transactions;
      return;
    }

    // Check if transactions have changed
    const prevTransactions = prevTransactionsRef.current;
    const hasTransactionsChanged =
      prevTransactions.length !== transactions.length ||
      JSON.stringify(prevTransactions.map((t) => t.id)) !==
        JSON.stringify(transactions.map((t) => t.id));

    if (hasTransactionsChanged) {
      setShouldAnimate(true);
      prevTransactionsRef.current = transactions;
    }
  }, [transactions, isLoading]);

  // Optimize the useEffect to only refresh when wallet balances change
  useEffect(() => {
    if (!wallets || !refreshTransactions || isLoadingWallets) {
      return;
    }

    // Check if wallet balances have changed
    const currentBalances: Record<string, number> = {};
    let hasBalanceChanged = false;

    wallets.forEach((wallet) => {
      const walletId = wallet.id;
      const balance = wallet.amountInLowestDenom;
      currentBalances[walletId] = balance;

      // Check if this wallet's balance has changed
      if (prevWalletBalancesRef.current[walletId] !== balance) {
        hasBalanceChanged = true;
      }
    });

    // Also check if wallets were added or removed
    if (
      Object.keys(prevWalletBalancesRef.current).length !==
      Object.keys(currentBalances).length
    ) {
      hasBalanceChanged = true;
    }

    // Only refresh transactions if balances have changed
    if (hasBalanceChanged) {
      refreshTransactions();
    }

    // Update the ref with current balances
    prevWalletBalancesRef.current = currentBalances;
  }, [wallets, refreshTransactions, isLoadingWallets]);

  // Set animation state to false after the first successful load
  useEffect(() => {
    if (transactions && !isLoading && isInitialLoad) {
      // After the first successful load, mark that we're no longer in initial load
      setIsInitialLoad(false);
    }
  }, [transactions, isLoading, isInitialLoad]);

  // Reset animation state after animation completes
  useEffect(() => {
    if (shouldAnimate && transactions && !isLoading) {
      // Animation duration is 0.5s, so we reset after that
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, transactions, isLoading]);

  const transactionRows = transactions?.map((transaction) => (
    <TransactionRow
      key={transaction.id}
      transaction={transaction}
      exchangeRates={exchangeRates!}
      wallets={wallets || []}
    />
  ));

  // Check if we have all the data needed to render
  const canRender =
    !isLoading &&
    !isLoadingWallets &&
    !isLoadingExchangeRates &&
    transactions &&
    exchangeRates &&
    wallets;

  // Animation class based on shouldAnimate state
  const animationClass = shouldAnimate
    ? "animate-[fadeInAndSlideDown_0.5s_ease-in-out_forwards]"
    : "";

  if (!canRender) {
    return null;
  }

  return (
    <div className={`flex flex-col grow gap-6 pt-2 ${animationClass}`}>
      <span className="text-secondary text-[13px] font-semibold leading-[18px] tracking-[-0.162px]">
        Completed
      </span>
      {transactionRows}
    </div>
  );
};
