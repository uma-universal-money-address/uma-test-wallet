"use client";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export const FormSection = ({ title, children }: FormSectionProps) => {
  return (
    <div className="flex flex-col">
      <div className="px-6 pt-5 pb-4">
        <h2 className="text-[16px] font-semibold leading-[21px] tracking-[-0.2px] text-primary">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-4 px-6 pb-5">
        {children}
      </div>
    </div>
  );
};

