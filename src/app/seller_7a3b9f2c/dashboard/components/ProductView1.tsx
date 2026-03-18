"use client";

import React, { useState, useEffect } from "react";
import { Heart, Share2 } from "lucide-react";
import { DashboardView } from "@/src/types/seller/dashboard";
import { PiSealCheckLight } from "react-icons/pi";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { SlHandbag, SlReload } from "react-icons/sl";
import { LuShield, LuTruck } from "react-icons/lu";
import { IoIosArrowBack } from "react-icons/io";
import Image from "next/image";
import { getDrugProductById } from "@/src/services/product/ProductService";


interface ProductViewProps {
  productId: string | null;
  setCurrentView: (view: DashboardView) => void;
}

const images = [
  "/assets/images/SellerMed.jpg",
  "/assets/images/SellerMed2.jpg",
  "/assets/images/SellerMed3.jpg",
  "/assets/images/SellerMed4.jpg",
  "/assets/images/SellerMed5.jpg",
];

const ProductView1 = ({ productId, setCurrentView }: ProductViewProps) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedPack, setSelectedPack] = useState(1);
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchProductDetails = async () => {
    if (!productId) return;

    try {
      const response = await getDrugProductById(productId);
      console.log("API Response:", response);

      setProductData(response);

      if (response?.packagingDetails?.minimumOrderQuantity) {
        setQuantity(response.packagingDetails.minimumOrderQuantity);
      }

    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchProductDetails();
}, [productId]);

  // Access data directly from productData
  const product = productData;
  const packaging = productData?.packagingDetails;
  const pricing = productData?.pricingDetails?.[0];

  // Format product name: productName + strength + dosageForm
  const formattedProductName = product
    ? `${product.productName || ''} ${product.strength || ''}mg ${product.dosageForm || ''}`.trim()
    : "";

  // Format description: therapeuticCategory + therapeuticSubcategory
const formattedDescription = "Broad-spectrum antibiotic for bacterial infections";

  // Calculate total price
  const totalPrice = pricing ? pricing.finalPrice * quantity : 0;

  if (!productData || loading) {
    return <div className="w-full bg-white rounded-xl p-6 space-y-8"></div>;
  }

  return (
    <div className="w-full bg-white rounded-xl p-6 space-y-8">

      {/* MAIN SECTION */}

      <div className="grid grid-cols-2 gap-10">

        {/* LEFT SIDE */}

        <div>

          {/* MAIN IMAGE */}

          <div className="relative rounded-xl overflow-hidden w-full h-171 flex items-center justify-center">
            <Image
              src={selectedImage}
              alt="Product Image"
              fill
              className="object-cover rounded-xl"
            />

            <button
              className="absolute left-2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
              onClick={() => {
                const currentIndex = images.indexOf(selectedImage);
                const prevIndex = (currentIndex - 1 + images.length) % images.length;
                setSelectedImage(images[prevIndex]);
              }}
            >
              <IoIosArrowBack size={20} />
            </button>

            <button
              className="absolute right-2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
              onClick={() => {
                const currentIndex = images.indexOf(selectedImage);
                const nextIndex = (currentIndex + 1) % images.length;
                setSelectedImage(images[nextIndex]);
              }}
            >
              <IoIosArrowBack size={20} className="rotate-180" />
            </button>

            {pricing?.discountPercentage && pricing.discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-[#FB2C36] text-white text-sm px-3 py-1 rounded-full">
                {pricing.discountPercentage}% OFF
              </span>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
              <button className="bg-white rounded-full p-2 shadow">
                <Heart size={20} />
              </button>
              <button className="bg-white rounded-full p-2 shadow">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* THUMBNAILS */}
          <div className="flex gap-3 mt-4">
            {images.map((img, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(img)}
                className={`relative h-[127px] w-[127px] rounded-lg cursor-pointer border overflow-hidden ${selectedImage === img
                  ? "border-primary-900"
                  : "border-neutral-200"
                  }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* VERIFIED / SHIPPING / RETURNS */}
          <div className="flex items-center gap-20 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <LuShield size={20} style={{ color: "#00A63E" }} />
              <span className="text-neutral-600">Verified</span>
            </div>

            <div className="flex items-center gap-2">
              <LuTruck size={20} style={{ color: "#155DFC" }} />
              <span className="text-neutral-600">Fast Ship</span>
            </div>

            <div className="flex items-center gap-2">
              <SlReload size={20} style={{ color: "#9810FA" }} />
              <span className="text-neutral-600">Returns</span>
            </div>
          </div>

          {/* ADDITIONAL DISCOUNTS - Static as mentioned */}
          <div className="bg-[#EFF6FF] border-2 border-[#BEDBFF] rounded-lg p-4 mt-4">
            <p className="font-semibold text-[#1C398E] mb-2">
              Additional Discounts Available
            </p>
            <ul className="text-sm text-[#193CB8] list-disc ml-4 space-y-1">
              <li>Corporate buyers: Up to 15% additional discount</li>
              <li>Annual contract: Up to 25% savings</li>
              <li>First-time buyers: Extra ₹10 off on orders above ₹200</li>
            </ul>
          </div>

        </div>

        {/* RIGHT SIDE */}

        <div>

          {/* TAGS - Static as mentioned */}
          <div className="flex gap-2 mb-3">
            <span className="bg-primary-05 text-secondary-700 px-3 py-1 rounded-xl">
              Prescription Required
            </span>
            <span className="bg-success-50 text-success-800 px-3 py-1 rounded-xl flex items-center gap-1">
              <PiSealCheckLight className="text-sm" />
              FDA Approved
            </span>
          </div>

          {/* TITLE */}
          <h1 className="text-[28px] font-semibold mb-2">
            {formattedProductName}
          </h1>

          <p className="text-neutral-700 text-sm mb-4">
            {formattedDescription}
          </p>

          {/* PRICE CARD */}
          <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[28px] font-bold">₹{pricing?.finalPrice?.toFixed(2)}</span>
              <span className="text-[#99A1AF] text-[18px] line-through">
                ₹{pricing?.mrp?.toFixed(2)}
              </span>
              <span className="bg-warning-100 text-warning-600 text-sm px-2 py-1 rounded">
                Save {pricing?.discountPercentage}%
              </span>
            </div>
            <p className="text-sm text-neutral-700 mt-1">
              Price per pack ({packaging?.numberOfUnits} {product?.dosageForm})
            </p>
          </div>

          {/* SPECIAL OFFERS - Static as mentioned */}
          <div className="border border-yellow-300 bg-yellow-50 p-4 rounded-lg mb-6">
            <p className="font-semibold mb-2 text-sm text-neutral-900">Special Offers</p>
            <ul className="text-sm text-neutral-700 list-disc ml-4 space-y-1">
              <li>Buy 5+ packs: Extra 5% off</li>
              <li>Buy 10+ packs: Extra 10% off + Free shipping</li>
              <li>Bulk orders: Additional volume discounts available</li>
            </ul>
          </div>

          {/* PACK SIZE */}
          <h3 className="font-semibold text-[#364153] text-sm mb-3">
            Select Pack Size <span className="text-warning-500">*</span>
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* First Pack - Dynamic */}
            <div
              onClick={() => setSelectedPack(1)}
              className={`relative border rounded-xl p-5 cursor-pointer text-center transition ${selectedPack === 1
                ? "border-2 border-primary-800 bg-secondary-100"
                : "border-2 border-neutral-300"
                }`}
            >
              {selectedPack === 1 && (
                <div className="absolute -top-2 -right-2 bg-purple-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
              <p className="font-semibold text-lg">{packaging?.packSize}mg</p>
              <p className="text-sm font-semibold text-neutral-700">₹{pricing?.mrp?.toFixed(2)}</p>
              <p className="text-sm text-success-700 font-semibold">{pricing?.discountPercentage}% off</p>
            </div>

            {/* Second Pack - Static */}
            <div className="relative border-2 border-neutral-300 rounded-xl p-5 cursor-pointer text-center">
              <p className="font-semibold text-lg">100mg</p>
              <p className="text-sm font-semibold text-neutral-700">₹599</p>
              <p className="text-sm text-success-700 font-semibold">15% off</p>
            </div>

            {/* Third Pack - Static */}
            <div className="relative border-2 border-neutral-300 rounded-xl p-5 cursor-pointer text-center">
              <p className="font-semibold text-lg">200mg</p>
              <p className="text-sm font-semibold text-neutral-700">₹999</p>
              <p className="text-sm text-success-700 font-semibold">20% off</p>
            </div>
          </div>

          {/* PRODUCT DETAILS */}
          <h3 className="text-[16px] mb-3">Product Details</h3>

          <div className="grid grid-cols-3 gap-4 text-sm mb-6">
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Pack Size</p>
              <p className="text-[#101828] text-[16px]">{packaging?.packSize} {product?.dosageForm}</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Min Order (MOQ)</p>
              <p className="text-[#101828] text-[16px]">{packaging?.minimumOrderQuantity} Packs</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Dosage Form</p>
              <p className="text-[#101828] text-[16px]">{product?.dosageForm}</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Manufacturer</p>
              <p className="text-[#101828] text-[16px]">{pricing?.manufacturerName}</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Strength</p>
              <p className="text-[#101828] text-[16px]">{product?.strength}mg</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Max Order</p>
              <p className="text-[#101828] text-[16px]">{packaging?.maximumOrderQuantity} Packs</p>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="mb-6">
            <p className="text-sm text-[#364153] mb-2">
              Quantity (Packs)
            </p>

            <div className="flex items-center gap-4">
              <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
                <button
                  className="px-4 py-2 border-r border-neutral-300 text-neutral-900"
                  onClick={() => setQuantity(Math.max(packaging?.minimumOrderQuantity || 1, quantity - 1))}
                >
                  -
                </button>
                <span className="px-6 flex items-center justify-center">
                  {quantity}
                </span>
                <button
                  className="px-4 py-2 border-l border-neutral-300 text-neutral-900"
                  onClick={() => setQuantity(Math.min(packaging?.maximumOrderQuantity || 1000, quantity + 1))}
                >
                  +
                </button>
              </div>
              <p className="text-sm text-[#4A5565]">
                Total: ₹{totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#6A7282] mt-1">
            Minimum order: {packaging?.minimumOrderQuantity} packs | Maximum: {packaging?.maximumOrderQuantity} packs
          </p>

          {/* BUTTONS - Static */}
          <button className="w-full bg-primary-900 text-white text-[16px] font-semibold py-3 rounded-lg mt-6 flex items-center justify-center gap-2">
            <SlHandbag size={24} />
            Buy Now
          </button>

          <button className="w-full border-2 border-primary-900 text-primary-900 text-[16px] font-semibold py-3 rounded-lg mt-3 flex items-center justify-center gap-2">
            <HiOutlineShoppingCart size={24} />
            Add to Cart
          </button>

        </div>

      </div>

      {/* PRODUCT DESCRIPTION */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">
          Product Description
        </h2>
        <p className="text-sm text-neutral-600 mb-3">
          {product?.productDescription}
        </p>

        {/* <h3 className="font-semibold mt-4 mb-2">Key Features:</h3>
        <ul className="list-disc ml-5 text-sm text-neutral-600 space-y-1">
          <li>Broad-spectrum antibiotic effective against bacterial infections</li>
          <li>High-quality pharmaceutical-grade ingredients</li>
          <li>Manufactured in FDA-approved facility</li>
          <li>Extended shelf life of 24 months</li>
          <li>Easy-to-swallow capsule form</li>
        </ul> */}

        <h3 className="font-semibold mt-4 mb-2">
          Warnings & Precautions:
        </h3>
        <p className="text-sm text-neutral-600">
          {product?.warningsPrecautions}
        </p>
      </div>

    </div>
  );
};

export default ProductView1;