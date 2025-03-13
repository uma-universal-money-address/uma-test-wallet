"use client";
import { ExampleUma } from "@/components/ExampleUma";
import { ExternalUma } from "@/components/ExternalUma";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UmaInput } from "@/components/UmaInput";
import { useAppState } from "@/hooks/useAppState";
import {
  EXAMPLE_UMA_CONTACTS,
  useContacts,
  type ContactInfo,
} from "@/hooks/useContacts";
import { useDebounce } from "@/hooks/useDebounce";
import { useWallets } from "@/hooks/useWalletContext";
import { getBackendDomain } from "@/lib/backendDomain";
import { getUmaFromUsername } from "@/lib/uma";
import { type UmaLookupResponse } from "@/types/UmaLookupResponse";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo } from "react";
import { Contact } from "./Contact";
import { useSendPaymentContext } from "./SendPaymentContextProvider";
import { lnurlpLookup } from "./umaRequests";

// Check if search has format of an uma with any amount of subdomains (e.g. $test@vasp.com)
const isUmaFormat = (uma: string) => {
  return /^\$?[a-zA-Z0-9\-_.+]+@[a-zA-Z0-9-_.+:]+$/.test(uma);
};

// Helper function to format UMA address with backend domain, this could be helpful if you're also using UMA as identifiers on your own domain but typically isn't needed.
const formatUmaAddress = (uma: string) => {
  if (!uma) return uma;

  // If already contains @, return as is
  if (uma.includes("@")) return uma;

  // Add $ prefix if needed and append backend domain
  return uma.startsWith("$")
    ? `${uma}@${getBackendDomain()}`
    : `$${uma}@${getBackendDomain()}`;
};

export const SelectRecipient = () => {
  const { senderUma, onNext, setReceiverUma, setUmaLookupResponse, setError } =
    useSendPaymentContext();
  const { setIsCreateUmaDialogOpen } = useAppState();
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
    // Get the formatted UMA that includes the domain if needed
    const formattedUma = formatUmaAddress(customReceiverUma);

    const isValid = isUmaFormat(formattedUma);
    if (!isValid && customReceiverUma.length > 0) {
      setCustomReceiverUmaError(
        "Invalid UMA format. It should start with a $ sign, followed by alphanumeric characters and a domain. For example: $abc123@domain.com",
      );
    } else if (
      isValid &&
      !allContacts?.find((contact) => contact.uma === formattedUma)
    ) {
      setIsLoadingSearchResults(true);
      lnurlpLookup(
        senderUma,
        `${formattedUma.startsWith("$") ? "" : "$"}${formattedUma}`,
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

  const handleSearchContacts = (uma: string) => {
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
  };

  const handleChooseUma = async (uma: string) => {
    if (isUmaFormat(customReceiverUma)) {
      return;
    }

    setError(null);
    try {
      const umaLookupResponse = await lnurlpLookup(senderUma, uma);
      setUmaLookupResponse(umaLookupResponse);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error);
      return;
    }
    setReceiverUma(uma);
    onNext();
  };

  const handleUmaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setCustomReceiverUma(newValue);

    // Format the UMA address if needed
    setReceiverUma(formatUmaAddress(newValue));

    setSearchLookupResult(undefined);
    setCustomReceiverUmaError(null);
    handleSearchContacts(newValue);
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
            uma={formatUmaAddress(customReceiverUma)}
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
          <span style={{ color: "#18181b" }}>
            {formatUmaAddress(customReceiverUma)}
          </span>
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
        <div className="flex flex-row justify-between align-center">
          <span className="text-[26px] text-[#18181b] font-bold leading-[34px] tracking-[-0.325px]">
            Send to
          </span>
          <Button
            className="p-2 bg-[#EBEEF2] hover:bg-gray-300 h-[34px] w-[34px] rounded-full"
            onClick={() => setIsCreateUmaDialogOpen(true)}
            variant="icon"
          >
            <Image
              src="/icons/plus.svg"
              alt="Add UMA"
              width={18}
              height={18}
              className="max-w-[18px"
            />
          </Button>
        </div>
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
