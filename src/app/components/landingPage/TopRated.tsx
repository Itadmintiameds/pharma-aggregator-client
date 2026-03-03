'use client';

import Image from 'next/image'
import { FaShoppingCart } from 'react-icons/fa'

const TopRated = () => {
  const deals = [
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
      name: "Cetirizine Tablets",
      brand: "Pharma Brand",
      description: "10mg, Antihistamine, Pack of 10",
      image: "/assets/images/MedicineSample.jpg",
      price: "₹38.00",
      originalPrice: "₹45.00",
    },
    {
      id: 3,
      name: "Cetirizine Tablets",
      brand: "Pharma Brand",
      description: "10mg, Antihistamine, Pack of 10",
      image: "/assets/images/MedicineSample.jpg",
      price: "₹38.00",
      originalPrice: "₹45.00",
    },
    {
      id: 4,
      name: "Cetirizine Tablets",
      brand: "Pharma Brand",
      description: "10mg, Antihistamine, Pack of 10",
      image: "/assets/images/MedicineSample.jpg",
      price: "₹38.00",
      originalPrice: "₹45.00",
    },
  ]

  return (
    <div className="py-14 bg-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        
        <h2 className="text-3xl font-semibold text-gray-800 mb-10">
          Top Rated
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {deals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>
    </div>
  )
}

export default TopRated;


// ================= PRODUCT CARD =================

const ProductCard = ({ product }: any) => {
  return (
    <div className="
      group
      relative
      bg-white
      rounded-3xl
      shadow-md
      hover:shadow-2xl
      hover:-translate-y-2
      transition-all
      duration-300
      p-4
      overflow-hidden
      flex
      flex-col
    ">
      {/* Container that moves up on hover */}
      <div className="transition-transform duration-500 flex-1">
        {/* Product Image (height shrinks only, width fixed) */}
        <div className="flex justify-center mb-4">
          <div className="
            h-[200px]
            overflow-hidden
            transition-all duration-500 ease-in-out
            group-hover:h-[170px]
          ">
            <Image
              src={product.image}
              alt={product.name}
              width={200}
              height={200}
              className="w-full h-full object-contain transition-transform duration-500 ease-in-out group-hover:-translate-y-1"
            />
          </div>
        </div>

        {/* Brand + Name row with expandable cart button */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
            <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          </div>

          {/* Cart button that expands to "Add to Cart" on hover */}
          <button className="
            flex items-center justify-center gap-2
            bg-primary-700 hover:bg-purple-800
            text-white
            rounded-xl
            transition-all duration-500 ease-in-out
            w-10 h-10
            group-hover:w-auto group-hover:px-4
            overflow-hidden
            shrink-0
            z-10
          "
          >
            <FaShoppingCart className="shrink-0 text-sm" />
            <span className="
              text-sm whitespace-nowrap font-medium
              opacity-0 group-hover:opacity-100
              transition-opacity duration-500 ease-in-out
            ">
              Add to Cart
            </span>
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 mt-1 mb-2">{product.description}</p>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-900">{product.price}</span>
          <span className="text-gray-400 line-through text-sm">{product.originalPrice}</span>
        </div>
      </div>

      {/* Bottom section (Buy Now + Limited) – fades in from bottom */}
      <div className="
        absolute
        bottom-0 left-0
        w-full px-6 pb-4
        opacity-0 translate-y-4
        group-hover:opacity-100 group-hover:translate-y-0
        transition-all duration-500 ease-in-out
        z-10
      ">
        <div className="flex items-center justify-between bg-white pt-2">
          <button className="
            border border-purple-700 text-purple-700
            px-5 py-2.5 rounded-xl text-sm font-medium
            hover:bg-purple-50 transition-colors duration-300
            bg-white shadow-sm
          ">
            Buy Now
          </button>
          <span className="text-sm text-gray-500 flex items-center bg-white/80 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
            Limited
          </span>
        </div>
      </div>

      {/* Subtle gradient overlay for better text readability */}
      <div className="
        absolute inset-x-0 bottom-0 h-16
        bg-gradient-to-t from-white via-white/80 to-transparent
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500 ease-in-out
        pointer-events-none
      "></div>
    </div>
  )
}