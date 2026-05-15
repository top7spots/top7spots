import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  tone?: "light" | "dark";
};

export function SectionHeading({ eyebrow, title, children, tone = "light" }: SectionHeadingProps) {
  const isDark = tone === "dark";

  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow ? (
          <p
            className={`mb-2 text-xs font-semibold uppercase tracking-[0.18em] ${
              isDark ? "text-orange-300" : "text-[#1D4ED8]"
            }`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`max-w-2xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl ${
            isDark ? "text-white" : "text-[#111827]"
          }`}
        >
          {title}
        </h2>
      </div>
      {children ? (
        <div className={`max-w-xl text-sm leading-6 ${isDark ? "text-blue-100" : "text-slate-600"}`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
