"use client";
import Image from "next/image";
import { Button } from "./ui/button";

export const Wallet = () => {
  return (
    <div className="flex flex-col text-gray-50 bg-primary gap-6 rounded-3xl shadow-[0px_0px_0px_1px_rgba(0, 0, 0, 0.06), 0px_1px_1px_-0.5px_rgba(0, 0, 0, 0.06), 0px_3px_3px_-1.5px_rgba(0, 0, 0, 0.06), 0px_6px_6px_-3px_rgba(0, 0, 0, 0.06), 0px_12px_12px_-6px_rgba(0, 0, 0, 0.06), 0px_24px_24px_-12px_rgba(0, 0, 0, 0.06);]">
      <div className="flex flex-row items-center text-white opacity-50 justify-between pl-8 pr-[22px] pt-[17px]">
        <span className="text-white">Balance</span>
        <Button variant="ghost">
          <Image
            alt="Plus"
            src="/icons/plus.svg"
            className="invert"
            width={24}
            height={24}
          />
          Add Funds
        </Button>
      </div>
      <div className="flex flex-col gap-2.5 px-8">
        <div className="flex flex-row items-end gap-1">
          <div className="text-5xl font-light leading-[48px] tracking-[-1.92px]">
            Balance
          </div>
          <div className="text-[15px] font-semibold leading-[20px] tracking-[-0.187px]">
            Currency
          </div>
        </div>
        <div className="flex flex-row opacity-50">About Balance Currency</div>
      </div>
      <div className="flex flex-row items-center justify-between px-6 pb-6">
        <Button className="w-full text-white bg-white/[0.12] hover:bg-white/[0.2]">
          Send
        </Button>
      </div>
    </div>
  );
};
