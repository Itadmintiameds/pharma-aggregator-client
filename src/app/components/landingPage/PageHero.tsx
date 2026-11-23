import type { ReactNode } from "react";

/** Shared banner for the public info pages (About, Contact, Careers). Sits below the fixed landing header. */
export default function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-4 pb-10 pt-[9.5rem] text-white lg:px-8">
      <div className="mx-auto max-w-6xl">
        <span className="inline-block rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-secondary-200">
          {eyebrow}
        </span>
        <h1 className="mt-3 text-2xl font-heading font-bold leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-100 sm:text-base">{description}</p>
        {children && <div className="mt-5 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
