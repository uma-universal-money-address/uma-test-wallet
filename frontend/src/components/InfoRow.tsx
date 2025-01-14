import Image from "next/image";

interface InfoRowProps {
  icon: string;
  title: string;
  description?: string;
}

export const InfoRow = ({ icon, title, description }: InfoRowProps) => {
  return (
    <div className="flex flex-row items-start justify-start gap-4">
      <Image src={icon} width={32} height={32} alt={title} />
      <div className="flex flex-row w-full items-start justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-primary text-[15px] font-bold leading-[20px] tracking-[-0.187px]">
            {title}
          </span>
          {description && (
            <p className="text-secondary text-[13px] font-normal leading-[18px] tracking-[-0.162px]">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
