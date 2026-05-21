"use client";

import React from "react";
import Image from "next/image";

const products = [
  {
    name: "Product name",
    sales: "12,429 Sales",
    stock: "135 Stocks Remaining",
    available: true,
    image: "/assets/images/green-glass.jpg"
  },
  {
    name: "Product name",
    sales: "12,429 Sales",
    stock: "135 Stocks Remaining",
    available: true,
    image: "/assets/images/green-glass.jpg"
  },
  {
    name: "Product name",
    sales: "12,429 Sales",
    stock: "135 Stocks Remaining",
    available: true,
    image: "/assets/images/green-glass.jpg"
  },
];

const TopSellingCard = () => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold font-heading text-black">
          Top Selling Product
        </h3>

        <button className="text-sm px-4 py-1.5 border border-neutral-200 rounded-lg bg-white font-body text-neutral-700 hover:bg-neutral-50 shadow-sm transition">
          See All Product
        </button>
      </div>

      <div className="divide-y divide-neutral-100">
        {products.map((product, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-4">
              <Image
                src={product.image}
                alt={product.name}
                width={52}
                height={52}
                className="rounded-md object-cover flex-shrink-0"
              />

              <div className="space-y-0.5">
                <p className="text-sm font-semibold font-heading text-black">
                  {product.name}
                </p>
                <p className="text-xs font-body text-neutral-500">
                  {product.sales}
                </p>
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <p
                className={`text-sm font-medium font-body flex items-center justify-end gap-1 ${
                  product.available ? "text-success-900" : "text-warning-600"
                }`}
              >
                <span className="text-base leading-none">•</span>
                {product.available ? "Available" : "Out of Stock"}
              </p>
              <p className="text-xs font-body text-neutral-600">
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