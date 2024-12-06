"use client";
import { UmaInput } from "@/components/UmaInput";
import { checkUmaAvailability, createUma } from "@/lib/uma";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uma, setUma] = useState("");
  const [umaError, setUmaError] = useState<string | undefined>();
  const [umaInputMessage, setUmaInputMessage] = useState<string | undefined>();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setUma(newValue);
    setUmaError(undefined);

    if (newValue.length === 0) {
      setUmaInputMessage(undefined);
      setUmaError(undefined);
      return;
    }

    try {
      const succeeded = await checkUmaAvailability(newValue);
      if (!succeeded) {
        setUmaError("UMA username is not available.");
      }
      setUmaInputMessage("UMA username is available.");
    } catch (error) {
      console.error(error);
      setUmaError("Failed to check UMA username availability.");
    }
  };

  const handleSubmit = async () => {
    setUmaError(undefined);
    try {
      const succeeded = await createUma(uma);
      if (!succeeded) {
        setUmaError("Failed to create UMA username.");
      }

      router.push(`/wallet`);
    } catch (error) {
      console.error(error);
      setUmaError("Failed to create UMA username.");
    }
  };

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  });

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-inter)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/uma-sandbox-icon.svg"
          alt="UMA logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-roboto-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <UmaInput
          message={umaInputMessage}
          error={umaError}
          innerRef={inputRef}
          inputProps={{
            placeholder: "you",
            onChange: handleChange,
            value: uma,
          }}
          onEnter={handleSubmit}
          before="$"
          after="@test.uma.me"
        />

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://docs.uma.me"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
    </div>
  );
}
