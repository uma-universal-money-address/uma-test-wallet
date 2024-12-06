"use client";
import { ExternalUma } from "@/components/ExternalUma";
import { Skeleton } from "@/components/ui/skeleton";
import { UmaInput } from "@/components/UmaInput";
import { useContacts, type ContactInfo } from "@/hooks/useContacts";
import { useDebounce } from "@/hooks/useDebounce";
import { type UmaLookupResponse } from "@/types/UmaLookupResponse";
import React, { useCallback } from "react";
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
    contacts,
    error: errorLoadingContacts,
    isLoading: isLoadingContacts,
  } = useContacts();
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

  const searchUma = useCallback(() => {
    if (
      isUmaFormat(customReceiverUma) &&
      !contacts?.find((contact) => contact.uma === customReceiverUma)
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
  }, [customReceiverUma, contacts, senderUma]);

  useDebounce(searchUma, [customReceiverUma], 1000);

  const handleSearchUma = (uma: string) => {
    setIsLoadingSearchResults(true);

    // First check if any contacts start with the uma
    let matchingContacts: ContactInfo[] = [];
    if (uma.startsWith("$")) {
      matchingContacts =
        contacts?.filter((contact) =>
          contact.uma.startsWith(uma.toLowerCase()),
        ) || [];
    } else {
      matchingContacts =
        contacts?.filter((contact) =>
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

  let restOfContacts: React.ReactNode;
  if (errorLoadingContacts) {
    restOfContacts = (
      <span className="text-error">{`Error loading contacts: ${errorLoadingContacts}`}</span>
    );
  } else if (isLoadingContacts) {
    restOfContacts = <Skeleton className="w-10" />;
  } else if (customReceiverUma) {
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
    restOfContacts = (
      <>
        {contactSearchResults.map((result) => (
          <Contact
            key={result.uma}
            contactInfo={result}
            onClick={() => handleChooseUma(result.uma)}
          />
        ))}
        {searchResultComponent}
      </>
    );
  } else {
    restOfContacts = contacts
      ?.filter((contact) => contact.uma !== senderUma)
      .map((contact) => {
        return (
          <Contact
            key={contact.uma}
            contactInfo={contact}
            onClick={() => handleChooseUma(contact.uma)}
          />
        );
      });
  }

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
        <div className="flex flex-col gap-6">
          {!customReceiverUma && (
            <div className="flex flex-col text-secondary text-[13px] font-semibold leading-[18px] tracking-[-0.162px] space-y-6">
              Example recipients
            </div>
          )}
          <div className="flex flex-col gap-6 pb-6">{restOfContacts}</div>
        </div>
      </div>
    </div>
  );
};
