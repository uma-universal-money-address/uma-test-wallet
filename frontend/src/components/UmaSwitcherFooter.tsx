"use client";

import { Uma } from "@/hooks/useUma";
import Image from "next/image";
import { Button } from "./ui/button";

interface Props {
  umas: Uma[];
}

export const UmaSwitcherFooter = ({ umas }: Props) => {
  const umaButtons = umas.map((uma, index) => {
    return (
      <Button
        key={uma.username}
        className={`p-2 text-white bg-primary h-8 w-8 rounded-lg ${
          uma.default ? "ring-1 ring-offset-8 ring-[#C0C9D6]" : ""
        }`}
        onClick={() => {
          console.log(`Switching to UMA: ${uma.username}`);
        }}
      >
        {index + 1}
      </Button>
    );
  });

  return (
    <div className="flex flex-row p-4 w-full items-center justify-center gap-4">
      {umaButtons}
      <Button className="p-2 bg-[#EBEEF2] hover:bg-gray-300 h-8 w-8 rounded-lg">
        <Image src="/icons/plus.svg" alt="Add UMA" width={24} height={24} />
      </Button>
    </div>
  );
};
