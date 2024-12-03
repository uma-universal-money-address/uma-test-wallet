"use client";

export const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 bg-white flex justify-center items-center opacity-0 z-[9999] animate-[fadeIn_0.5s_ease-in-out_forwards] animation-delay-500">
      <div className="border-2 border-white border-t-black rounded-full w-[50px] h-[50px] animate-[spin_1s_linear_infinite]" />
    </div>
  );
};
