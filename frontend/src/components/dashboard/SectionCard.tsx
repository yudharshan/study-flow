import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}