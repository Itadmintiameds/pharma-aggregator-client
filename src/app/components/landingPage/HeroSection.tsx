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
    <div className="flex flex-col bg-white lg:flex-row gap-4 xl:gap-6 w-full px-4 lg:px-4 mx-auto max-w-[1280px] h-[570px]">

      {/* ================= LEFT CATEGORY SIDEBAR ================= */}
      <aside className="w-full xl:w-[280px]  bg-neutral-50 rounded-2xl shadow-sm border border-neutral-400 overflow-hidden shrink-0">
        <div className="relative flex items-center bg-primary-900 text-white px-4 py-3 xl:h-[52px] ">
          <Menu size={18} />
          <span className="absolute left-1/2 -translate-x-1/2 font-medium text-sm xl:text-base">
    List Categories
  </span>
          <ChevronDown size={18} className="ml-auto" />
        </div>

        <div className=" xl:h-[518px] flex flex-col">
          {categories.map((item, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-between px-4 text-xs xl:text-sm text-neutral-900 hover:bg-primary-800 hover:text-white cursor-pointer border-b last:border-none group"
            >
              <span>{item}</span>
              <ChevronRight
                size={14}
                className="text-neutral-900 group-hover:text-white transition"
              />
            </div>
          ))}
        </div>
      </aside>

      {/* ================= RIGHT SECTION ================= */}
      <section className="flex-1 flex flex-col gap-4 lg:gap-5 xl:gap-6 min-w-0 max-w-[975px]">

        {/* ================= HERO BANNER ================= */}
        <div className="relative h-[310px] bg-secondary-50 rounded-2xl px-12 py-1 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4 xl:gap-8">

            <div className="max-w-[430px] h-[242px] ">
              <h1 className="text-xl text-black font-bold tracking-wider h-[22px] ">
                TiaMeds
              </h1>

              <h1 className=" py-2 sm:text-3xl lg:text-4xl xl:text-4xl  leading-tight text-black">
                India&apos;s First <br />
                <span className="text-primary-600 font-bold">
                  Compliance-Controlled
                </span>{" "}
                Pharma Marketplace
              </h1>

              <p className="text-black text-xs sm:text-sm lg:text-base leading-relaxed max-w-auto">
                Connecting verified pharma buyers & sellers. AI-powered
                matching, instant quotes, guaranteed compliance, and express delivery.
              </p>
            </div>

            <div className="relative w-full lg:w-[350px] xl:w-[460px] h-[200px] sm:h-[240px] lg:h-[220px] xl:h-[224px]">
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
                    sizes="(max-width: 1024px) 100vw, 350px"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* HERO CONTROLS */}
          <div className="absolute bottom-4 lg:bottom-5 xl:bottom-5 right-4 lg:right-5 xl:right-5 flex items-center gap-2 xl:gap-4 bg-white shadow-md px-4 xl:px-5 py-1 xl:py-2 rounded-full">
            <button onClick={prevSlide} className="hover:scale-110 transition">
              <ArrowLeft size={16} className="xl:w-[20px]" />
            </button>
            <span className="text-xs lg:text-sm font-medium">
              {currentSlide + 1} / {sliderImages.length}
            </span>
            <button onClick={nextSlide} className="hover:scale-110 transition">
              <ArrowRight size={16} className="xl:w-[20px]" />
            </button>
          </div>
        </div>

        {/* ================= AUTO SLIDING PRODUCT CARDS ================= */}
        <div className="relative overflow-hidden">
          <div className="flex gap-4 lg:gap-5 xl:gap-6 product-marquee hover:[animation-play-state:paused]">

            {[...products, ...products].map((product, index) => (
              <div
                key={index}
                className="min-w-[460px] xl:min-w-[460px] xl:h-[224px] bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 xl:p-6 flex gap-3"
              >
                {/* IMAGE */}
                <div className="relative w-[151px] xl:w-[151px] h-[176px] xl:h-[176px] shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* CONTENT */}
                <div className="flex flex-col justify-between flex-1 w-[250px] xl:w-[250px] xl:h-[176px]">

                  <div>
                    <h3 className=" flex justify-end text-base xl:text-lg font-bold text-neutral-800 truncate">
                      {product.brand}
                    </h3>

                    <p className=" flex justify-end text-primary-600 font-semibold text-xs lg:text-sm truncate">
                      {product.name}
                    </p>

                    <p className=" flex justify-end text-xs xl:text-md text-gray-500 mt-1 truncate">
                      {product.description}
                    </p>

                    <p className="text-xs text-yellow-500 mt-4">
                      ● Limited stock
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 lg:mt-4 gap-2">
                    <div className="flex flex-col gap-1 xl:flex-row xl:items-center">
                      <span className="line-through text-neutral-900 text-xs xl:text-sm">
                        {product.originalPrice}
                      </span>
                      <span className="text-base xl:text-2xl font-semibold text-neutral-900">
                        {product.price}
                      </span>
                    </div>

                    <button className=" inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-800 text-white text-xs xl:text-sm px-3 xl:px-2 py-1.5 xl:py-2 rounded-lg transition whitespace-nowrap">
                      <ShoppingCart size={16}  className="shrink-0"/>
                      <span>Buy Now</span>
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
        `}</style>

      </section>
    </div>
  );
};

export default HeroSection;












// this is the original code without global css and new design........

// 'use client'

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import Image from 'next/image';

// const HeroSection = () => {
//   const [currentSlide, setCurrentSlide] = useState(0)
  
//   const sliderImages = [
//     "/assets/images/slide1.jpg",
//     "/assets/images/slide2.jpg",
//     "/assets/images/slide3.jpg",
//   ]

//   const stats = [
//     { value: "₹2.5B+", label: "Daily Volume" },
//     { value: "50K+", label: "Products" },
//     { value: "24X7", label: "Online Business" },
//     { value: "99.9%", label: "Uptime" },
//   ]

//   const trendingProducts = [
//     {
//       category: "Analgesic",
//       tag: "Trending #1",
//       discount: "-15% OFF",
//       name: "Paracetamol 500mg",
//       company: "MediCorp Pharma",
//       rating: 4.8,
//       reviews: "2.1k reviews",
//       price: "₹12.50",
//       originalPrice: "₹14.37",
//       delivery: "FREE Delivery",
//       stars: 5
//     }
//   ]

//   const nextSlide = () => {
//     setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
//   }

//   const prevSlide = () => {
//     setCurrentSlide((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1))
//   }

//   // Auto slide
//   useEffect(() => {
//     const interval = setInterval(nextSlide, 5000)
//     return () => clearInterval(interval)
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   return (
//     <div className="relative overflow-hidden">
//       {/* Background Pattern */}
//       <div className="absolute inset-0 bg-linear-to-br from-primary-50 via-white to-secondary-50 opacity-50"></div>
      
//       <div className="relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
//         <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 lg:py-20">
          
//           {/* Left Column - Content */}
//           <div className="space-y-8">
//             {/* Main Heading */}
//             <div className="space-y-6">
//               <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
//                 India&apos;s Largest
//                 <span className="block text-primary-600">Pharma Marketplace</span>
//               </h1>
              
//               <p className="text-lg md:text-xl text-neutral-600 max-w-2xl leading-relaxed">
//                 Connecting verified pharma buyers & sellers. AI-powered matching, 
//                 instant quotes, guaranteed compliance, and express delivery across India.
//               </p>
//             </div>

//             {/* CTA Buttons */}
//             <div className="flex flex-col sm:flex-row gap-4">
//               <Link
//                 href="/seller_7a3b9f2c"
//                 className="inline-block"
//               >
//                 <button className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto">
//                   <span className="flex items-center justify-center">
//                     Start Selling Now
//                     <svg 
//                       className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" 
//                       fill="none" 
//                       stroke="currentColor" 
//                       viewBox="0 0 24 24"
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//                     </svg>
//                   </span>
//                   <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
//                 </button>
//               </Link>

//               <Link
//                 href="/buyer_e8d45a1b"
//                 className="inline-block"
//               >
//                 <button className="group relative px-8 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto">
//                   <span className="flex items-center justify-center">
//                     Browse Products
//                     <svg 
//                       className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" 
//                       fill="none" 
//                       stroke="currentColor" 
//                       viewBox="0 0 24 24"
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//                     </svg>
//                   </span>
//                   <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
//                 </button>
//               </Link>
//             </div>

//             {/* Stats Grid */}
//             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
//               {stats.map((stat, index) => (
//                 <div 
//                   key={index} 
//                   className="bg-white p-4 rounded-xl shadow-md border border-neutral-100 hover:shadow-lg transition-shadow"
//                 >
//                   <div className="text-2xl font-bold text-primary-700">{stat.value}</div>
//                   <div className="text-sm text-neutral-600 mt-1">{stat.label}</div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Right Column - Slider & Product Card */}
//           <div className="space-y-8">
//             {/* Image Slider */}
//             <div className="relative rounded-2xl overflow-hidden shadow-2xl">
//               <div className="relative h-64 md:h-80 lg:h-96">
//                 {sliderImages.map((src, index) => (
//                   <div
//                     key={index}
//                     className={`absolute inset-0 transition-opacity duration-700 ${
//                       index === currentSlide ? 'opacity-100' : 'opacity-0'
//                     }`}
//                   >
//                      <Image
//                       src={src}
//                       alt={`Slide ${index + 1}`}
//                       fill
//                       sizes="(max-width: 768px) 100vw, 50vw"
//                       className="object-cover"
//                       priority={index === 0}
//                     />
//                   </div>
//                 ))}
                
//                 {/* Navigation Arrows */}
//                 <button
//                   onClick={prevSlide}
//                   className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
//                 >
//                   <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                   </svg>
//                 </button>
                
//                 <button
//                   onClick={nextSlide}
//                   className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
//                 >
//                   <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                   </svg>
//                 </button>
                
//                 {/* Dots Indicator */}
//                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
//                   {sliderImages.map((_, index) => (
//                     <button
//                       key={index}
//                       onClick={() => setCurrentSlide(index)}
//                       className={`w-2 h-2 rounded-full transition-all ${
//                         index === currentSlide 
//                           ? 'w-6 bg-white' 
//                           : 'bg-white/50 hover:bg-white/80'
//                       }`}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Trending Product Card */}
//             {trendingProducts.map((product, index) => (
//               <div key={index} className="bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
//                 {/* Product Header */}
//                 <div className="bg-linear-to-r from-primary-500 to-primary-600 px-6 py-3">
//                   <div className="flex justify-between items-center">
//                     <div className="text-white font-bold text-lg">{product.category}</div>
//                     <div className="flex items-center gap-3">
//                       <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
//                         {product.tag}
//                       </span>
//                       <span className="bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-bold">
//                         {product.discount}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Product Details */}
//                 <div className="p-6">
//                   <h3 className="text-xl font-bold text-neutral-900">{product.name}</h3>
//                   <p className="text-neutral-600 text-sm mt-1">{product.company}</p>
                  
//                   {/* Rating */}
//                   <div className="flex items-center gap-2 mt-3">
//                     <div className="flex">
//                       {[...Array(product.stars)].map((_, i) => (
//                         <span key={i} className="text-yellow-400">★</span>
//                       ))}
//                     </div>
//                     <span className="text-neutral-700 font-medium">{product.rating}</span>
//                     <span className="text-neutral-500 text-sm">({product.reviews})</span>
//                   </div>

//                   {/* Price & Delivery */}
//                   <div className="flex items-center justify-between mt-6">
//                     <div>
//                       <div className="flex items-baseline gap-2">
//                         <span className="text-2xl font-bold text-primary-700">{product.price}</span>
//                         <span className="text-neutral-400 line-through">{product.originalPrice}</span>
//                       </div>
//                       <div className="text-green-600 font-medium text-sm mt-1">
//                         {product.delivery}
//                       </div>
//                     </div>
                    
//                     <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
//                       Add to Cart
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* AI Assistant Badge - Updated with your colors */}
//       <div className="fixed bottom-8 right-8 z-40">
//         <div className="relative group">
//           <div className="absolute -inset-1 bg-tertiary-300 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
//           <button className="relative w-14 h-14 bg-linear-to-br from-tertiary-500 to-tertiary-700 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow">
//             <div className="w-2 h-2 bg-success-200 rounded-full absolute top-3 right-3 animate-pulse"></div>
//             <span className="text-white font-bold text-lg">Ti</span>
//           </button>
//           <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
//             <span className="text-sm font-medium text-neutral-700">your AI Assistant</span>
//             <div className="flex items-center gap-1 text-xs text-success-300">
//               <div className="w-1.5 h-1.5 bg-success-300 rounded-full animate-pulse"></div>
//               Online
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default HeroSection;