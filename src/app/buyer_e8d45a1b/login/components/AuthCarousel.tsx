"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Mirrors the carousel used in the seller login modal (src/app/modals/LoginModals/LoginModals.tsx)
// so the buyer login page's left panel looks identical.
const carouselSlides = [
  {
    id: 1,
    image: "/icons/imagechart1.png",
    title: "Boost Sales by 50%",
    description: "Drive up to 50% more sales through better call efficiency and territory coverage.1",
    imageBgColor: "bg-neutral-50",
    textBgColor: "bg-neutral-50",
    dotColor: "bg-purple-600",
  },
  {
    id: 2,
    image: "/icons/login2.png",
    title: "Data-Driven Management",
    description: "Gain instant insights from live dashboards and make faster, smarter field decisions.",
    imageBgColor: "bg-gradient-to-b from-secondary-200 to-secondary-900",
    textBgColor: "bg-secondary-100",
    dotColor: "bg-purple-600",
  },
  {
    id: 3,
    image: "/icons/login3.png",
    title: "Cut Costs by 30%+",
    description: "Go digital eliminate paper, manual entry, and printing to slash admin overheads.",
    imageBgColor: "bg-yellow-400",
    textBgColor: "bg-yellow-50",
    dotColor: "bg-purple-600",
  },
  {
    id: 4,
    image: "/icons/login4.png",
    title: "Instant Approvals & Insights",
    description: "Approve tours and expenses in minutes, not weeks, with automated workflows.",
    imageBgColor: "bg-warning-200",
    textBgColor: "bg-warning-50",
    dotColor: "bg-purple-600",
  },
  {
    id: 5,
    image: "/icons/login5.png",
    title: "100% Compliance & Visibility",
    description: "Maintain GPS-verified, audit-ready records and track your entire supply chain in real time.",
    imageBgColor: "bg-neutral-400",
    textBgColor: "bg-neutral-50",
    dotColor: "bg-purple-600",
  },
  {
    id: 6,
    image: "/icons/login6.png",
    title: "Empower Reps on the Field",
    description: "Work offline or online, file DCRs in minutes, and get paid faster with automated claims.",
    imageBgColor: "bg-primary-10",
    textBgColor: "bg-secondary-100",
    dotColor: "bg-purple-600",
  },
];

export default function AuthCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
      }, 2000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying]);

  const slide = carouselSlides[currentSlide];

  return (
    <div
      className="w-1/2 flex flex-col items-center justify-center h-full relative"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="relative w-full flex items-center justify-center">
        <div className="flex items-center justify-center transition-all duration-500">
          <div className={`relative w-[187px] h-[252px] ${slide.imageBgColor} backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center overflow-hidden transition-colors duration-500`}>
            <Image
              src={slide.image}
              alt={`Slide ${currentSlide + 1}`}
              width={187}
              height={252}
              className="object-contain transition-all duration-500"
            />
          </div>

          <div className={`w-[187px] h-[200px] ${slide.textBgColor} rounded-r-lg shadow-md p-6 flex flex-col justify-center transition-colors duration-500`}>
            <h2 className="text-neutral-800 font-bold text-xl leading-snug">{slide.title}</h2>
            <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{slide.description}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 flex gap-2">
        {carouselSlides.map((s, index) => (
          <button
            key={s.id}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-200 ${
              index === currentSlide
                ? `w-6 h-2 ${s.dotColor} rounded-full`
                : "w-2 h-2 bg-neutral-300 rounded-full hover:bg-primary-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
