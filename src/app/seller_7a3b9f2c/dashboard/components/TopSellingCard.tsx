"use client";

import React from "react";
import Image from "next/image";

const products = [
  {
    name: "Product name",
    sales: "12,429 Sales",
    stock: "135 Stocks Remaining",
    available: true,
    image: "/assets/images/plavix.jpg"
  },
  {
    name: "Product name",
    sales: "12,429 Sales",
    stock: "135 Stocks Remaining",
    available: true,
    image: "/assets/images/plavix.jpg"
  },
  {
    name: "Product name",
    sales: "12,429 Sales",
    stock: "135 Stocks Remaining",
    available: true,
    image: "/assets/images/plavix.jpg"
  },
  {
    name: "Product name",
    sales: "12,429 Sales",
    stock: "135 Stocks Remaining",
    available: true,
    image: "/assets/images/plavix.jpg"
  }
];

const TopSellingCard = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-black">
          Top Selling Product
        </h3>

        <button className="text-sm px-4 py-1.5 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-primary-50">
          See All Product
        </button>
      </div>

      <div className="space-y-6">
        {products.map((product, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-neutral-100 pb-4 last:border-0"
          >
            <div className="flex items-center gap-4">

              <Image
                src={product.image}
                alt={product.name}
                width={48}
                height={48}
                className="rounded-sm object-cover"
              />

              <div className="space-y-1">
                <p className="text-sm font-medium text-black">
                  {product.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {product.sales}
                </p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <p
                className={`text-sm font-medium ${product.available
                  ? "text-success-1000"
                  : "text-warning-600"
                  }`}
              >
                {product.available ? "Available" : "Out of Stock"}
              </p>
              <p className="text-xs text-black">
                {product.stock}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSellingCard;