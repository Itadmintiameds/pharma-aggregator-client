import { BadgeCheck, Truck, Percent, Headset } from "lucide-react";

const POINTS = [
  { Icon: BadgeCheck, title: "Verified suppliers", text: "Every seller is checked before listing" },
  { Icon: Truck, title: "Fast delivery", text: "Direct from seller to your door" },
  { Icon: Percent, title: "Bulk rates", text: "Better prices as quantities grow" },
  { Icon: Headset, title: "Dedicated support", text: "Help with orders, quotes and returns" },
];

export default function TrustStrip() {
  return (
    <section className="my-6 grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      {POINTS.map(({ Icon, title, text }) => (
        <div key={title} className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-800">
            <Icon size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
