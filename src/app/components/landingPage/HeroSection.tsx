"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Menu,
  ChevronRight,
  ChevronDown,
  ShoppingCart,
} from "lucide-react";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const sliderImages = [
    "/assets/images/medPic.png",
    "/assets/images/med2.png",
    "/assets/images/med3.png",
  ];

  const categories = [
    "Tablet",
    "Capsule",
    "Syrup",
    "Injection",
    "Surgical",
    "Medical Devices",
    "OTC",
    "Ayurvedic",
    "Surgical",
    "Medical Devices",
  ];

  const products = [
    {
      id: 1,
      name: "Cetirizine Tablets",
      brand: "Pharma Brand",
      description: "10mg, Antihistamine, Pack of 10",
      image: "/assets/images/MedicineSample.jpg",
      price: "₹38.00",
      originalPrice: "₹45.00",
    },
    {
      id: 2,
      name: "Paracetamol 500mg",
      brand: "MediCare",
      description: "Pain Relief, Pack of 15",
      image: "/assets/images/MedicineSample.jpg",
      price: "₹28.00",
      originalPrice: "₹35.00",
    },
    {
      id: 3,
      name: "Vitamin D3",
      brand: "HealthPlus",
      description: "Immunity Booster, Pack of 20",
      image: "/assets/images/MedicineSample.jpg",
      price: "₹55.00",
      originalPrice: "₹70.00",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? sliderImages.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col bg-white lg:flex-row gap-3 sm:gap-4 w-full px-3 sm:px-4 mx-auto max-w-[1280px] min-h-[auto] lg:h-[570px]">
      {/* ================= LEFT CATEGORY SIDEBAR ================= */}
      <aside className="w-full lg:w-[240px] xl:w-[280px] bg-neutral-50 rounded-2xl shadow-sm border border-neutral-400 overflow-hidden shrink-0 lg:block hidden">
        <div className="relative flex items-center bg-primary-900 text-white px-3 sm:px-4 py-2.5 sm:py-3 h-[48px] sm:h-[52px]">
          <Menu size={16} className="sm:w-[18px]" />
          <span className="absolute left-1/2 -translate-x-1/2 font-medium text-xs sm:text-sm xl:text-base whitespace-nowrap">
            List Categories
          </span>
          <ChevronDown size={16} className="sm:w-[18px] ml-auto" />
        </div>

        <div className="h-[calc(570px-52px-2px)] flex flex-col">
          {categories.map((item, index) => (
            <div
              key={index}
              className="flex-1 min-h-[44px] flex items-center justify-between px-3 sm:px-4 text-xs sm:text-sm text-neutral-900 hover:bg-primary-800 hover:text-white cursor-pointer border-b last:border-none group"
            >
              <span className="truncate pr-2">{item}</span>
              <ChevronRight
                size={12}
                className="sm:w-[14px] text-neutral-900 group-hover:text-white transition shrink-0"
              />
            </div>
          ))}
        </div>
      </aside>

      {/* ================= RIGHT SECTION ================= */}
      <section className="flex-1 flex flex-col gap-3 sm:gap-4 lg:gap-5 xl:gap-6 min-w-0 w-full lg:w-[calc(100%-240px)] xl:w-[calc(100%-280px)] max-w-full">
        {/* ================= HERO BANNER ================= */}
        <div className="relative h-auto min-h-[280px] sm:min-h-[300px] lg:h-[310px] bg-secondary-50 rounded-2xl px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 lg:py-1 overflow-hidden w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 lg:gap-4 xl:gap-8 w-full">
            <div className="w-full md:w-[380px] lg:w-[400px] xl:w-[430px] text-center md:text-left">
              <h1 className="text-lg sm:text-xl text-black font-bold tracking-wider mb-1">
                TiaMeds
              </h1>

              <h1 className="py-1 sm:py-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-4xl leading-tight text-black">
                India&apos;s First <br className="hidden sm:block" />
                <span className="text-primary-600 font-bold">
                  Compliance-Controlled
                </span>{" "}
                <br className="hidden sm:block" />
                Pharma Marketplace
              </h1>

              <p className="text-black text-xs sm:text-sm lg:text-base leading-relaxed max-w-full mt-2">
                Connecting verified pharma buyers & sellers. AI-powered
                matching, instant quotes, guaranteed compliance, and express
                delivery.
              </p>
            </div>

            <div className="relative w-[280px] sm:w-[320px] md:w-[340px] lg:w-[350px] xl:w-[460px] h-[160px] sm:h-[180px] md:h-[200px] lg:h-[220px] xl:h-[224px]">
              {sliderImages.map((src, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100 z-10" : "opacity-0"
                  }`}
                >
                  <Image
                    src={src}
                    alt={`Slide ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, (max-width: 1024px) 340px, (max-width: 1280px) 350px, 460px"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* HERO CONTROLS */}
          <div className="absolute bottom-2 sm:bottom-4 lg:bottom-5 right-2 sm:right-4 lg:right-5 flex items-center gap-1 sm:gap-2 xl:gap-4 bg-white shadow-md px-3 sm:px-4 xl:px-5 py-1 sm:py-1.5 xl:py-2 rounded-full">
            <button
              onClick={prevSlide}
              className="hover:scale-110 transition p-1"
              aria-label="Previous slide"
            >
              <ArrowLeft size={14} className="sm:w-[16px] xl:w-[20px]" />
            </button>
            <span className="text-xs sm:text-sm font-medium min-w-[45px] text-center">
              {currentSlide + 1} / {sliderImages.length}
            </span>
            <button
              onClick={nextSlide}
              className="hover:scale-110 transition p-1"
              aria-label="Next slide"
            >
              <ArrowRight size={14} className="sm:w-[16px] xl:w-[20px]" />
            </button>
          </div>
        </div>

        {/* ================= AUTO SLIDING PRODUCT CARDS ================= */}
        <div className="relative overflow-hidden px-1 w-full">
          <div className="flex gap-3 sm:gap-4 lg:gap-5 xl:gap-6 product-marquee hover:[animation-play-state:paused]">
            {[...products, ...products].map((product, index) => (
              <div
                key={index}
                className="w-[300px] sm:w-[380px] md:w-[420px] lg:w-[440px] xl:w-[460px] h-[180px] sm:h-[200px] md:h-[210px] lg:h-[220px] xl:h-[224px] bg-white rounded-2xl shadow-sm border border-neutral-200 p-3 sm:p-4 xl:p-6 flex gap-2 sm:gap-3 shrink-0"
              >
                {/* IMAGE */}
                <div className="relative w-[100px] sm:w-[120px] md:w-[130px] lg:w-[140px] xl:w-[151px] h-[120px] sm:h-[140px] md:h-[150px] lg:h-[160px] xl:h-[176px] shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, (max-width: 1024px) 130px, (max-width: 1280px) 140px, 151px"
                  />
                </div>

                {/* CONTENT */}
                <div className="flex flex-col justify-between flex-1 w-[calc(100%-120px)] sm:w-[calc(100%-140px)] md:w-[calc(100%-150px)] lg:w-[calc(100%-160px)] xl:w-[calc(100%-171px)]">
                  <div>
                    <h3 className="text-right text-sm sm:text-base lg:text-lg font-bold text-neutral-800 truncate">
                      {product.brand}
                    </h3>

                    <p className="text-right text-primary-600 font-semibold text-xs sm:text-sm lg:text-base truncate">
                      {product.name}
                    </p>

                    <p className="text-right text-xs sm:text-sm text-gray-500 mt-1 truncate">
                      {product.description}
                    </p>

                    <p className="text-xs text-yellow-500 mt-2 sm:mt-4">
                      ● Limited stock
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 sm:mt-3 lg:mt-4 gap-1 sm:gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                      <span className="line-through text-neutral-900 text-xs whitespace-nowrap">
                        {product.originalPrice}
                      </span>
                      <span className="text-sm sm:text-base lg:text-xl xl:text-2xl font-semibold text-neutral-900 whitespace-nowrap">
                        {product.price}
                      </span>
                    </div>

                    <button className="inline-flex items-center justify-center gap-1 sm:gap-2 bg-primary-600 hover:bg-primary-800 text-white text-xs sm:text-sm px-2 sm:px-3 xl:px-4 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap">
                      <ShoppingCart size={14} className="sm:w-[16px] shrink-0" />
                      <span className="hidden xs:inline">Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MARQUEE ANIMATION */}
        <style jsx>{`
          .product-marquee {
            animation: slideProducts 30s linear infinite;
            width: fit-content;
          }

          @keyframes slideProducts {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-50% - 12px));
            }
          }

          @media (max-width: 640px) {
            .product-marquee {
              animation-duration: 25s;
            }
          }
        `}</style>
      </section>
    </div>
  );
};

export default HeroSection;











// "use client";

// import { useState, useEffect } from "react";
// import Image from "next/image";
// import {
//   ArrowLeft,
//   ArrowRight,
//   Menu,
//   ChevronRight,
//   ChevronDown,
//   ShoppingCart,
// } from "lucide-react";

// const HeroSection = () => {
//   const [currentSlide, setCurrentSlide] = useState(0);

//   const sliderImages = [
//     "/assets/images/medPic.png",
//     "/assets/images/med2.png",
//     "/assets/images/med3.png",
//   ];


//   const categories = [
//     "Tablet",
//     "Capsule",
//     "Syrup",
//     "Injection",
//     "Surgical",
//     "Medical Devices",
//     "OTC",
//     "Ayurvedic",
//     "Surgical",
//     "Medical Devices",
//   ];

//   const products = [
//     {
//       id: 1,
//       name: "Cetirizine Tablets",
//       brand: "Pharma Brand",
//       description: "10mg, Antihistamine, Pack of 10",
//       image: "/assets/images/MedicineSample.jpg",
//       price: "₹38.00",
//       originalPrice: "₹45.00",
//     },
//     {
//       id: 2,
//       name: "Paracetamol 500mg",
//       brand: "MediCare",
//       description: "Pain Relief, Pack of 15",
//       image: "/assets/images/MedicineSample.jpg",
//       price: "₹28.00",
//       originalPrice: "₹35.00",
//     },
//     {
//       id: 3,
//       name: "Vitamin D3",
//       brand: "HealthPlus",
//       description: "Immunity Booster, Pack of 20",
//       image: "/assets/images/MedicineSample.jpg",
//       price: "₹55.00",
//       originalPrice: "₹70.00",
//     },
//   ];


//   const nextSlide = () => {
//     setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
//   };

//   const prevSlide = () => {
//     setCurrentSlide((prev) =>
//       prev === 0 ? sliderImages.length - 1 : prev - 1
//     );
//   };

//   useEffect(() => {
//     const interval = setInterval(nextSlide, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="flex flex-col bg-white lg:flex-row gap-4 xl:gap-6 w-full px-4 lg:px-4 mx-auto max-w-[1280px] h-[570px]">

//       {/* ================= LEFT CATEGORY SIDEBAR ================= */}
//       <aside className="w-full xl:w-[280px]  bg-neutral-50 rounded-2xl shadow-sm border border-neutral-400 overflow-hidden shrink-0">
//         <div className="relative flex items-center bg-primary-900 text-white px-4 py-3 xl:h-[52px] ">
//           <Menu size={18} />
//           <span className="absolute left-1/2 -translate-x-1/2 font-medium text-sm xl:text-base">
//     List Categories
//   </span>
//           <ChevronDown size={18} className="ml-auto" />
//         </div>

//         <div className=" xl:h-[518px] flex flex-col">
//           {categories.map((item, index) => (
//             <div
//               key={index}
//               className="flex-1 flex items-center justify-between px-4 text-xs xl:text-sm text-neutral-900 hover:bg-primary-800 hover:text-white cursor-pointer border-b last:border-none group"
//             >
//               <span>{item}</span>
//               <ChevronRight
//                 size={14}
//                 className="text-neutral-900 group-hover:text-white transition"
//               />
//             </div>
//           ))}
//         </div>
//       </aside>

//       {/* ================= RIGHT SECTION ================= */}
//       <section className="flex-1 flex flex-col gap-4 lg:gap-5 xl:gap-6 min-w-0 max-w-[975px]">

//         {/* ================= HERO BANNER ================= */}
//         <div className="relative h-[310px] bg-secondary-50 rounded-2xl px-12 py-1 overflow-hidden">
//           <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4 xl:gap-8">

//             <div className="max-w-[430px] h-[242px] ">
//               <h1 className="text-xl text-black font-bold tracking-wider h-[22px] ">
//                 TiaMeds
//               </h1>

//               <h1 className=" py-2 sm:text-3xl lg:text-4xl xl:text-4xl  leading-tight text-black">
//                 India&apos;s First <br />
//                 <span className="text-primary-600 font-bold">
//                   Compliance-Controlled
//                 </span>{" "}
//                 Pharma Marketplace
//               </h1>

//               <p className="text-black text-xs sm:text-sm lg:text-base leading-relaxed max-w-auto">
//                 Connecting verified pharma buyers & sellers. AI-powered
//                 matching, instant quotes, guaranteed compliance, and express delivery.
//               </p>
//             </div>

//             <div className="relative w-full lg:w-[350px] xl:w-[460px] h-[200px] sm:h-[240px] lg:h-[220px] xl:h-[224px]">
//               {sliderImages.map((src, index) => (
//                 <div
//                   key={index}
//                   className={`absolute inset-0 transition-opacity duration-700 ${
//                     index === currentSlide ? "opacity-100 z-10" : "opacity-0"
//                   }`}
//                 >
//                   <Image
//                     src={src}
//                     alt={`Slide ${index + 1}`}
//                     fill
//                     className="object-contain"
//                     sizes="(max-width: 1024px) 100vw, 350px"
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* HERO CONTROLS */}
//           <div className="absolute bottom-4 lg:bottom-5 xl:bottom-5 right-4 lg:right-5 xl:right-5 flex items-center gap-2 xl:gap-4 bg-white shadow-md px-4 xl:px-5 py-1 xl:py-2 rounded-full">
//             <button onClick={prevSlide} className="hover:scale-110 transition">
//               <ArrowLeft size={16} className="xl:w-[20px]" />
//             </button>
//             <span className="text-xs lg:text-sm font-medium">
//               {currentSlide + 1} / {sliderImages.length}
//             </span>
//             <button onClick={nextSlide} className="hover:scale-110 transition">
//               <ArrowRight size={16} className="xl:w-[20px]" />
//             </button>
//           </div>
//         </div>

//         {/* ================= AUTO SLIDING PRODUCT CARDS ================= */}
//         <div className="relative overflow-hidden">
//           <div className="flex gap-4 lg:gap-5 xl:gap-6 product-marquee hover:[animation-play-state:paused]">

//             {[...products, ...products].map((product, index) => (
//               <div
//                 key={index}
//                 className="min-w-[460px] xl:min-w-[460px] xl:h-[224px] bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 xl:p-6 flex gap-3"
//               >
//                 {/* IMAGE */}
//                 <div className="relative w-[151px] xl:w-[151px] h-[176px] xl:h-[176px] shrink-0">
//                   <Image
//                     src={product.image}
//                     alt={product.name}
//                     fill
//                     className="object-contain"
//                   />
//                 </div>

//                 {/* CONTENT */}
//                 <div className="flex flex-col justify-between flex-1 w-[250px] xl:w-[250px] xl:h-[176px]">

//                   <div>
//                     <h3 className=" flex justify-end text-base xl:text-lg font-bold text-neutral-800 truncate">
//                       {product.brand}
//                     </h3>

//                     <p className=" flex justify-end text-primary-600 font-semibold text-xs lg:text-sm truncate">
//                       {product.name}
//                     </p>

//                     <p className=" flex justify-end text-xs xl:text-md text-gray-500 mt-1 truncate">
//                       {product.description}
//                     </p>

//                     <p className="text-xs text-yellow-500 mt-4">
//                       ● Limited stock
//                     </p>
//                   </div>

//                   <div className="flex items-center justify-between mt-3 lg:mt-4 gap-2">
//                     <div className="flex flex-col gap-1 xl:flex-row xl:items-center">
//                       <span className="line-through text-neutral-900 text-xs xl:text-sm">
//                         {product.originalPrice}
//                       </span>
//                       <span className="text-base xl:text-2xl font-semibold text-neutral-900">
//                         {product.price}
//                       </span>
//                     </div>

//                     <button className=" inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-800 text-white text-xs xl:text-sm px-3 xl:px-2 py-1.5 xl:py-2 rounded-lg transition whitespace-nowrap">
//                       <ShoppingCart size={16}  className="shrink-0"/>
//                       <span>Buy Now</span>
//                     </button>
//                   </div>

//                 </div>
//               </div>
//             ))}

//           </div>
//         </div>

//         {/* MARQUEE ANIMATION */}
//         <style jsx>{`
//           .product-marquee {
//             animation: slideProducts 30s linear infinite;
//             width: fit-content;
//           }

//           @keyframes slideProducts {
//             0% {
//               transform: translateX(0);
//             }
//             100% {
//               transform: translateX(calc(-50% - 12px));
//             }
//           }
//         `}</style>

//       </section>
//     </div>
//   );
// };

// export default HeroSection;