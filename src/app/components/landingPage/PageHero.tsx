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
    <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-6 pb-16 pt-40 text-white lg:px-8">
      <div className="mx-auto max-w-6xl">
        <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-sm font-semibold uppercase tracking-wider text-secondary-200">
          {eyebrow}
        </span>
        <h1 className="mt-4 text-[40px] font-heading font-bold leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-100">{description}</p>
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
