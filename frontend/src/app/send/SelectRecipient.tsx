"use client";
import { ExampleUma } from "@/components/ExampleUma";
import { ExternalUma } from "@/components/ExternalUma";
import { Skeleton } from "@/components/ui/skeleton";
import { UmaInput } from "@/components/UmaInput";
import {
  EXAMPLE_UMA_CONTACTS,
  useContacts,
  type ContactInfo,
} from "@/hooks/useContacts";
import { useDebounce } from "@/hooks/useDebounce";
import { useWallets } from "@/hooks/useWalletContext";
import { getUmaFromUsername } from "@/lib/uma";
import { type UmaLookupResponse } from "@/types/UmaLookupResponse";
import React, { useCallback, useEffect, useMemo } from "react";
import { Contact } from "./Contact";
import { useSendPaymentContext } from "./SendPaymentContextProvider";
import { lnurlpLookup } from "./umaRequests";

// Check if search has format of an uma with any amount of subdomains (e.g. $test@vasp.com)
const isUmaFormat = (uma: string) => {
  return /^\$?[a-zA-Z0-9\-_.+]+@([a-zA-Z0-9-_.+:]+\.)+[a-zA-Z0-9:]+$/.test(uma);
};

export const SelectRecipient = () => {
  const {
    senderUma,
    onNext,
    setReceiverUma,
    setUmaLookupResponse,
    setError,
    setIsLoading,
  } = useSendPaymentContext();
  const {
    recentContacts,
    ownUmaContacts,
    error: errorLoadingContacts,
    isLoading: isLoadingContacts,
  } = useContacts();
  const {
    wallets,
    isLoading: isLoadingWallets,
    error: walletsError,
  } = useWallets();
  const [customReceiverUma, setCustomReceiverUma] = React.useState("");
  const [customReceiverUmaError, setCustomReceiverUmaError] = React.useState<
    string | null
  >();
  const [isLoadingSearchResults, setIsLoadingSearchResults] =
    React.useState(false);
  const [contactSearchResults, setContactSearchResults] = React.useState<
    ContactInfo[]
  >([]);
  const [searchLookupResult, setSearchLookupResult] = React.useState<
    UmaLookupResponse | null | undefined
  >();

  const allContacts = useMemo(() => {
    return recentContacts && ownUmaContacts
      ? [...recentContacts, ...ownUmaContacts].filter(
          (contact) => contact.uma !== senderUma,
        )
      : [];
  }, [recentContacts, ownUmaContacts, senderUma]);

  const recentContactsFiltered = recentContacts?.filter(
    (contact) => contact.uma !== senderUma,
  );
  const ownUmaContactsFiltered = ownUmaContacts?.filter(
    (contact) => contact.uma !== senderUma,
  );

  useEffect(() => {
    const error = errorLoadingContacts || walletsError;
    if (error) {
      setError(new Error(error));
    }
  }, [errorLoadingContacts, walletsError, setError]);

  const searchUma = useCallback(() => {
    if (
      isUmaFormat(customReceiverUma) &&
      !allContacts?.find((contact) => contact.uma === customReceiverUma)
    ) {
      setIsLoadingSearchResults(true);
      lnurlpLookup(
        senderUma,
        `${customReceiverUma.startsWith("$") ? "" : "$"}${customReceiverUma}`,
      )
        .then((response) => {
          setSearchLookupResult(response);
        })
        .catch((e) => {
          console.error("Failed to lookup UMA", e);
          // Assume for now that the UMA just doesn't exist.
          setSearchLookupResult(null);
        })
        .finally(() => {
          setIsLoadingSearchResults(false);
        });
    }
  }, [customReceiverUma, allContacts, senderUma]);

  useDebounce(searchUma, [customReceiverUma], 1000);

  const handleSearchUma = (uma: string) => {
    setIsLoadingSearchResults(true);

    // First check if any contacts start with the uma
    let matchingContacts: ContactInfo[] = [];
    if (uma.startsWith("$")) {
      matchingContacts =
        allContacts?.filter((contact) =>
          contact.uma.startsWith(uma.toLowerCase()),
        ) || [];
    } else {
      matchingContacts =
        allContacts?.filter((contact) =>
          contact.uma.startsWith(`$${uma.toLowerCase()}`),
        ) || [];
    }

    // Show any matching contacts
    setContactSearchResults(matchingContacts);

    setIsLoadingSearchResults(false);
  };

  const handleChooseUma = async (uma: string) => {
    if (isUmaFormat(customReceiverUma)) {
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const umaLookupResponse = await lnurlpLookup(senderUma, uma);
      setUmaLookupResponse(umaLookupResponse);
      setIsLoading(false);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error);
      setIsLoading(false);
      return;
    }
    setReceiverUma(uma);
    onNext();
  };

  const handleUmaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setCustomReceiverUma(newValue);
    setReceiverUma(newValue);
    setSearchLookupResult(undefined);

    const isValid = new RegExp(
      "^\\$?[a-zA-Z0-9-_.+]*(@[a-zA-Z0-9-_.+\\:]*)?$",
    ).test(newValue);
    if (!isValid) {
      setCustomReceiverUmaError(
        "Invalid UMA format. It should start with a $ sign, followed by alphanumeric characters and a domain. For example: $abc123@domain.com",
      );
    } else {
      setCustomReceiverUmaError(null);
    }

    handleSearchUma(newValue);
  };

  let searchedContactsSection: React.ReactNode;
  let recentContactsSection: React.ReactNode;
  let ownUmaContactsSection: React.ReactNode;
  if (customReceiverUma) {
    let searchResultComponent: React.ReactNode;
    if (isLoadingSearchResults) {
      searchResultComponent = <Skeleton className="w-10" />;
    } else if (searchLookupResult) {
      searchResultComponent = (
        <>
          <span className="text-secondary text-[13px] font-semibold leading-[18px] tracking-[-0.162px]">
            Matched
          </span>
          <ExternalUma
            uma={customReceiverUma}
            onClick={() => {
              setUmaLookupResponse(searchLookupResult);
              onNext();
            }}
          />
        </>
      );
    } else if (
      contactSearchResults.length === 0 &&
      searchLookupResult === null
    ) {
      searchResultComponent = (
        <span>
          {`No one found for `}
          <span style={{ color: "#18181b" }}>{customReceiverUma}</span>
        </span>
      );
    }

    if (wallets) {
      searchedContactsSection = (
        <>
          {contactSearchResults.map((result) => {
            const walletIndex = wallets.findIndex(
              (wallet) =>
                getUmaFromUsername(wallet.uma.username) === result.uma,
            );
            return (
              <Contact
                key={result.uma}
                contactInfo={result}
                ownContact={
                  walletIndex >= 0
                    ? {
                        wallet: wallets[walletIndex],
                        number: walletIndex + 1,
                      }
                    : undefined
                }
                onClick={() => handleChooseUma(result.uma)}
              />
            );
          })}
          {searchResultComponent}
        </>
      );
    }
  } else if (wallets) {
    recentContactsSection = (
      <>
        <div className="flex flex-col text-secondary text-[13px] font-semibold leading-[18px] tracking-[-0.162px] space-y-6">
          Recent contacts
        </div>
        {recentContactsFiltered?.map((contact) => {
          return (
            <Contact
              key={contact.uma}
              contactInfo={contact}
              onClick={() => handleChooseUma(contact.uma)}
            />
          );
        })}
      </>
    );
    ownUmaContactsSection = (
      <>
        <div className="flex flex-col text-secondary text-[13px] font-semibold leading-[18px] tracking-[-0.162px] space-y-6">
          Your test UMAs
        </div>
        {ownUmaContactsFiltered?.map((contact) => {
          const walletIndex = wallets.findIndex(
            (wallet) => getUmaFromUsername(wallet.uma.username) === contact.uma,
          );
          return (
            <Contact
              key={contact.uma}
              contactInfo={contact}
              ownContact={
                walletIndex >= 0
                  ? {
                      wallet: wallets[walletIndex],
                      number: walletIndex + 1,
                    }
                  : undefined
              }
              onClick={() => handleChooseUma(contact.uma)}
            />
          );
        })}
      </>
    );
  }

  const exampleUmaContactsSection = (
    <>
      <div className="flex flex-col text-secondary text-[13px] font-semibold leading-[18px] tracking-[-0.162px] space-y-6">
        Example UMAs
      </div>
      {EXAMPLE_UMA_CONTACTS.map((exampleContact) => {
        const uma = getUmaFromUsername(exampleContact.umaUserName);
        return (
          <ExampleUma
            key={exampleContact.umaUserName}
            uma={uma}
            exampleContact={exampleContact}
            onClick={() => handleChooseUma(uma)}
          />
        );
      })}
    </>
  );

  return (
    <div className="flex flex-col align-start py-4 px-8 h-full">
      <div className="flex flex-col w-full grow">
        <span className="text-[26px] text-[#18181b] font-bold leading-[34px] tracking-[-0.325px]">
          Send to
        </span>
        <div className="flex justify-between gap-4 w-full mt-4 mb-6">
          <UmaInput
            inputProps={{
              width: "100%",
              placeholder: "Enter UMA",
              onChange: handleUmaChange,
              value: customReceiverUma,
            }}
            error={customReceiverUmaError}
          />
        </div>
        {/* Face section in while sliding down upon loading */}
        {!isLoadingContacts && !isLoadingWallets && (
          <div className="flex flex-col gap-6 pb-6 animate-[fadeInAndSlideDown_0.5s_ease-in-out_forwards]">
            {searchedContactsSection}

            {!customReceiverUma && (
              <>
                {recentContactsFiltered &&
                  recentContactsFiltered.length > 0 &&
                  recentContactsSection}
                {ownUmaContactsFiltered &&
                  ownUmaContactsFiltered.length > 0 &&
                  ownUmaContactsSection}
                {exampleUmaContactsSection}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
