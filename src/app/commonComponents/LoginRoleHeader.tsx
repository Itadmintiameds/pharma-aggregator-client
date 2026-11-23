import React from "react";
import Link from "next/link";
import { ShoppingBag, Store } from "lucide-react";

type Role = "buyer" | "seller";

const ROLE_STYLE: Record<
  Role,
  { label: string; title: string; hint: string; chip: string; ring: string; icon: React.ReactNode; switchText: string; switchHref: string }
> = {
  buyer: {
    label: "BUYER",
    title: "Buyer Login",
    hint: "Sign in to order medicines, raise quotes and track returns.",
    chip: "bg-primary-100 text-primary-900",
    ring: "border-primary-800",
    icon: <ShoppingBag size={14} aria-hidden />,
    switchText: "Selling on TiaMeds? Go to Seller login",
    switchHref: "/seller_7a3b9f2c",
  },
  seller: {
    label: "SELLER",
    title: "Seller Login",
    hint: "Sign in to manage your products, orders and quotes.",
    chip: "bg-blue-50 text-blue-700",
    ring: "border-blue-600",
    icon: <Store size={14} aria-hidden />,
    switchText: "Buying medicines? Go to Buyer login",
    switchHref: "/buyer_e8d45a1b/login",
  },
};

/**
 * Heading block for the two login popups, so it is always obvious WHICH account you are signing in to:
 * a coloured role chip (purple = buyer, blue = seller), the role in the title, and a one-line hint.
 * `<LoginRoleSwitch>` below gives the matching "wrong login? go to the other one" link.
 */
export function LoginRoleHeader({ role }: { role: Role }) {
  const s = ROLE_STYLE[role];
  return (
    <div className="mb-5 text-center">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider ${s.chip}`}
      >
        {s.icon}
        {s.label} ACCOUNT
      </span>
      <h2 className="mt-2 text-xl font-heading font-bold text-pneutral-900">{s.title}</h2>
      <p className="mt-0.5 text-xs text-neutral-500">{s.hint}</p>
      <div className={`mx-auto mt-3 h-0.5 w-12 rounded-full border-t-2 ${s.ring}`} />
    </div>
  );
}

export function LoginRoleSwitch({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const s = ROLE_STYLE[role];
  return (
    <p className="mt-3 border-t border-neutral-200 pt-3 text-center text-xs text-neutral-600">
      <Link href={s.switchHref} onClick={onNavigate} className="font-semibold text-primary-800 hover:underline">
        {s.switchText} →
      </Link>
    </p>
  );
}
