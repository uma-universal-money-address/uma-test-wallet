import { Input } from "@/components/ui/input";
import { DetailedHTMLProps, InputHTMLAttributes, KeyboardEvent } from "react";

interface Props {
  inputProps: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
  message?: string;
  before?: string;
  after?: string;
  error?: string | null;
  onEnter?: () => void;
  innerRef?: React.Ref<HTMLInputElement>;
}

export const UmaInput = ({
  message,
  before,
  after,
  inputProps,
  error,
  onEnter,
  innerRef,
}: Props) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      onEnter();
    }
  };

  let bottomText: React.ReactNode = null;
  if (error) {
    bottomText = (
      <span className="block text-sm font-normal text-error mb-1 text-[14px] tracking-[-0.162px] leading-[18px]">
        {error}
      </span>
    );
  } else if (message) {
    bottomText = (
      <span className="block text-sm font-normal text-secondary mb-1 text-[14px] tracking-[-0.162px] leading-[18px]">
        {message}
      </span>
    );
  }

  return (
    <div className="w-full mx-0 gap-8 flex flex-col">
      <div className="relative flex items-center">
        {before ? (
          <span className="absolute text-primary pl-4">{before}</span>
        ) : null}

        <Input
          type="text"
          id="uma-input"
          className={`px-4 py-[14px] w-full ${before ? "pl-[36px]" : ""} ${
            error ? "focus-visible:ring-red-500" : ""
          }`}
          placeholder="Enter amount"
          aria-describedby="input-prefix input-suffix"
          {...inputProps}
          onKeyDown={(e) => {
            if (inputProps.onKeyDown) {
              inputProps.onKeyDown(e);
            }
            handleKeyDown(e);
          }}
          ref={innerRef}
        />

        {after ? (
          <span
            className="absolute right-3 text-primary pointer-events-none"
            id="input-suffix"
          >
            {after}
          </span>
        ) : null}
        <span id="input-prefix" className="sr-only">
          Dollar sign
        </span>
      </div>
      {bottomText}
    </div>
  );
};
