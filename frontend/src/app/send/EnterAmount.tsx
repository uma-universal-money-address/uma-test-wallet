"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { convertCurrency } from "@/lib/convertCurrency";
import { convertToLowestDenomination } from "@/lib/convertToLowestDenomination";
import { type Currency } from "@/types/Currency";
import assert from "assert";
import React, { useEffect, useState, type KeyboardEvent } from "react";
import { Footer } from "./Footer";
import { useSendPaymentContext } from "./SendPaymentContextProvider";
import { createPayreq } from "./umaRequests";

export const EnterAmount = () => {
  const {
    onNext,
    amount,
    setAmount,
    umaLookupResponse,
    isLoading,
    setUmaPayreqResponse,
    setIsLoading,
    setError,
  } = useSendPaymentContext();
  const [convertedToUsd, setConvertedToUsd] = useState<number>(0);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    umaLookupResponse!.receiverCurrencies[0],
  );
  const [inputAmountString, setInputAmountString] = useState<string>(
    amount.toString(),
  );

  const hasAmount = amount > 0;

  const {
    exchangeRates,
    error: exchangeRatesError,
    isLoading: isLoadingExchangeRates,
  } = useExchangeRates();

  useEffect(() => {
    if (!isLoadingExchangeRates && !exchangeRatesError && exchangeRates) {
      setConvertedToUsd(
        convertCurrency(
          exchangeRates,
          { amount, currencyCode: selectedCurrency.code },
          "USD",
        ),
      );
    }
  }, [
    exchangeRates,
    isLoadingExchangeRates,
    exchangeRatesError,
    amount,
    selectedCurrency,
  ]);

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
  };

  const handleAmountChange = (amount: number) => {
    const newAmount = amount || 0;
    setAmount(newAmount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmountString = e.target.value;

    // Only allow numbers and decimal points
    if (!/^[\d.]*$/.test(newAmountString)) {
      return;
    }

    // Default to 0 when input is empty
    if (newAmountString === "") {
      setInputAmountString("0");
      return handleAmountChange(0);
    }

    // Only allow 1 decimal point
    if (newAmountString.indexOf(".") !== newAmountString.lastIndexOf(".")) {
      return;
    }

    // If there is a decimal point, ensure the input does not have more than the currency's allowed
    // number of decimals
    const decimalIndex = newAmountString.indexOf(".");
    const decimalPlacesAfterPoint = newAmountString.length - 1 - decimalIndex;
    if (selectedCurrency.decimals > 0 && decimalIndex > -1) {
      const numbersLeftOfDecimal = newAmountString.substring(0, decimalIndex);
      const newDecimalIndex =
        decimalIndex +
        Math.max(0, decimalPlacesAfterPoint - selectedCurrency.decimals) +
        1;
      const decimalNumbersToMove = newAmountString.substring(
        decimalIndex + 1,
        newDecimalIndex,
      );
      const newDecimalNumbers = newAmountString.substring(
        newDecimalIndex,
        newAmountString.length,
      );
      const updatedAmountString = `${Number(
        `${numbersLeftOfDecimal}${decimalNumbersToMove}`,
      )}.${newDecimalNumbers}`;
      setInputAmountString(updatedAmountString);
      handleAmountChange(Number(updatedAmountString));
    } else {
      setInputAmountString(`${Number(newAmountString)}`);
      handleAmountChange(Number(newAmountString));
    }
  };

  const handleKeyboard = (e: KeyboardEvent) => {
    if (e.key === "Enter" && hasAmount) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      assert(umaLookupResponse);
      const lowestDenominationAmount = convertToLowestDenomination(
        amount,
        selectedCurrency,
      );
      const payreqResponse = await createPayreq(
        umaLookupResponse.callbackUuid,
        lowestDenominationAmount,
        selectedCurrency.code,
      );
      setUmaPayreqResponse(payreqResponse);
      setIsLoading(false);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error);
      setIsLoading(false);
      return;
    }

    onNext();
  };

  const conversionString = `${convertedToUsd.toLocaleString("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 8,
  })} USD`;

  const receiverCurrencies = umaLookupResponse?.receiverCurrencies || [];
  let currencyChooser: React.ReactNode;
  if (receiverCurrencies.length > 1) {
    currencyChooser = (
      <DropdownMenu>
        <DropdownMenuTrigger>{selectedCurrency.code}</DropdownMenuTrigger>
        <DropdownMenuContent>
          {receiverCurrencies.map((currency) => (
            <DropdownMenuItem
              key={currency.code}
              onClick={() => handleCurrencyChange(currency)}
            >
              {currency.code}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } else if (receiverCurrencies.length === 0) {
    currencyChooser = <div>Missing receiver currencies</div>;
  } else {
    const currencyCode = receiverCurrencies[0].code.toUpperCase();
    if (currencyCode === "SAT") {
      currencyChooser = "sats";
    } else {
      currencyChooser = currencyCode;
    }
  }

  return (
    <div className="flex flex-col items-center h-full px-8 justify-between">
      <div className="flex flex-col items-center justify-center grow">
        <span className="text-primary text-[15px] font-semibol leading-[20px] tracking-[-0.187px] mb-[2px]">
          {currencyChooser}
        </span>
        <div className="max-w-full">
          <input
            className="w-full overflow-hidden text-primary text-center text-ellipsis text-[120px] font-light leading-[1] tracking-[-4.8px] mb-6 focus-visible:outline-none"
            type="text"
            inputMode="decimal"
            value={inputAmountString}
            onChange={handleInputChange}
            onKeyDown={handleKeyboard}
          />
        </div>
        <div className="flex justify-center items-center gap-1 px-4 py-1.5 text-primary text-[15px] font-normal leading-[20px] tracking-[-0.187px] rounded-full bg-[#ebeef2]">
          {conversionString}
        </div>
      </div>
      <Footer
        onSubmit={handleSubmit}
        isLoading={isLoading}
        buttonText="Preview"
        disabled={!hasAmount}
      />
    </div>
  );
};
