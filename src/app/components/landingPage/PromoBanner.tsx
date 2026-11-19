"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SLIDES = [
  { image: "/assets/images/slide1.jpg", title: "Medicines at wholesale prices", text: "Compare verified sellers and order in bulk.", href: "/search?sort=price_asc", cta: "Shop now" },
  { image: "/assets/images/slide2.jpg", title: "Fresh stock, every day", text: "See what sellers listed most recently.", href: "/search?sort=newest", cta: "See what is new" },
  { image: "/assets/images/slide3.jpg", title: "Sell on TiaMeds", text: "Reach pharmacies and hospitals across the country.", href: "/seller_7a3b9f2c", cta: "Become a seller" },
];

/** Single promo banner that rotates every 5s, with dots to jump. */
export default function PromoBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];
  return (
    <section aria-label="Promotions" className="relative h-44 overflow-hidden rounded-2xl bg-primary-900 sm:h-56 lg:h-64">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-1000/90 via-primary-900/60 to-transparent" />
      <div className="relative flex h-full max-w-xl flex-col justify-center gap-2 px-6 sm:px-10">
        <h1 className="text-2xl font-bold text-white sm:text-4xl">{slide.title}</h1>
        <p className="text-sm text-white/85 sm:text-base">{slide.text}</p>
        <Link href={slide.href} className="mt-2 w-fit rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-900 hover:bg-primary-50">
          {slide.cta}
        </Link>
      </div>
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50"}`}
          />
        ))}
      </div>
    </section>
  );
}
