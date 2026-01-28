"use client";

import { useEffect, useState } from "react";

const images = [
  "/assets/images/slide1.jpg",
  "/assets/images/slide2.jpg",
  "/assets/images/slide3.jpg",
];

const AUTO_SLIDE_INTERVAL = 2000;

const ImageSlider = () => {
  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  // Auto slide
  useEffect(() => {
    if (isHovering) return;

    const interval = setInterval(nextSlide, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [isHovering]);

  return (
    <div
      className="group relative w-full overflow-hidden rounded-2xl shadow-xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Slider Track */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index + 1}`}
            className="h-[420px] w-full flex-shrink-0 object-cover"
          />
        ))}
      </div>

      {/* Left Button */}
      <button
        onClick={prevSlide}
        className="
          absolute left-6 top-1/2 -translate-y-1/2
          h-12 w-12 rounded-full
          bg-white/30 backdrop-blur-md
          text-2xl text-white
          shadow-lg
          transition-all duration-300
          hover:scale-110 hover:bg-white/50 hover:shadow-2xl
        "
      >
        ‹
      </button>

      {/* Right Button */}
      <button
        onClick={nextSlide}
        className="
          absolute right-6 top-1/2 -translate-y-1/2
          h-12 w-12 rounded-full
          bg-white/30 backdrop-blur-md
          text-2xl text-white
          shadow-lg
          transition-all duration-300
          hover:scale-110 hover:bg-white/50 hover:shadow-2xl
        "
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`
              h-2.5 rounded-full transition-all duration-300
              ${index === current
                ? "w-8 bg-white"
                : "w-2.5 bg-white/50 hover:bg-white"}
            `}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
