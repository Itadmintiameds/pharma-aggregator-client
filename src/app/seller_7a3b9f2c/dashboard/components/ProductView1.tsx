"use client";

import React, { useState, useEffect } from "react";
import { Heart, Share2, FileText, ExternalLink } from "lucide-react";
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

// API response types
interface ProductImage {
  productImage?: string;
  imageUrl?: string;
  url?: string;
  imagePath?: string;
}

interface PackagingDetails {
  packSize?: number;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  unitPerPack?: number;
  unitsPerPack?: number;
  numberOfUnits?: number;
}

interface PricingDetails {
  finalPrice?: number;
  mrp?: number;
  discountPercentage?: number;
  manufacturerName?: string;
}

interface NonConsumableAttributes {
  brandName?: string;
  modelName?: string;
  modelNumber?: string;
  warrantyPeriod?: string | number;
  deviceClassification?: string;
  amcAvailability?: boolean;
  keyFeaturesSpecifications?: string;
  udiNumber?: string;
  purpose?: string;
  manufacturerName?: string;
}

interface CertificateDocument {
  certificationId: number;
  certificateUrl: string;
  certificationName?: string;
  label?: string;
}

interface ConsumableAttributes {
  brochurePath?: string;
  brochureType?: string;
  certificateDocuments?: CertificateDocument[];
  keyFeaturesSpecifications?: string;
  storageConditionId?: number;
  storageCondition?: string;
  purpose?: string;
  brandName?: string;
  manufacturerName?: string;
  sterileOrNonSterile?: string;
  disposalOrReusable?: string;
  shelfLife?: string;
}

interface ProductApiData {
  productName?: string;
  productDescription?: string;
  warningsPrecautions?: string;
  manufacturerName?: string;
  strength?: string | number;
  dosageForm?: string;
  productImages?: ProductImage[];
  images?: string[];
  imageUrls?: string[];
  packagingDetails?: PackagingDetails;
  pricingDetails?: PricingDetails[];
  productAttributeNonConsumableMedicals?: NonConsumableAttributes[];
  nonConsumableAttributes?: NonConsumableAttributes;
  productAttributeConsumableMedicals?: ConsumableAttributes[];
}

const PLACEHOLDER_IMAGE = "/assets/images/SellerMed.jpg";

const ProductView1 = ({ productId, setCurrentView }: ProductViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string>(PLACEHOLDER_IMAGE);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPack, setSelectedPack] = useState(1);
  const [productData, setProductData] = useState<ProductApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayImages, setDisplayImages] = useState<string[]>([PLACEHOLDER_IMAGE]);

  const resolveProductImages = (data: ProductApiData | null): string[] => {
    if (!data) return [];
    if (Array.isArray(data.productImages)) {
      const urls = data.productImages
        .map((img) => img?.productImage || img?.imageUrl || img?.url || img?.imagePath || "")
        .filter((url) => url && url !== "PENDING" && url.startsWith("http"));
      if (urls.length > 0) return urls;
    }
    if (Array.isArray(data.images)) {
      const urls = data.images.filter((url) => url && url !== "PENDING" && url.startsWith("http"));
      if (urls.length > 0) return urls;
    }
    if (Array.isArray(data.imageUrls)) {
      const urls = data.imageUrls.filter((url) => url && url !== "PENDING" && url.startsWith("http"));
      if (urls.length > 0) return urls;
    }
    return [];
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      try {
        const response = (await getDrugProductById(productId)) as ProductApiData;
        setProductData(response);
        const images = resolveProductImages(response);
        if (images.length > 0) {
          setDisplayImages(images);
          setSelectedImage(images[0]);
        }
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

  const packaging = productData?.packagingDetails;
  const pricing = productData?.pricingDetails?.[0];
  const attributes =
    productData?.productAttributeNonConsumableMedicals?.[0] ??
    productData?.nonConsumableAttributes ??
    null;

  const consumableAttrs = productData?.productAttributeConsumableMedicals?.[0] ?? null;
  const brochureUrl =
    consumableAttrs?.brochurePath &&
    consumableAttrs.brochurePath !== "PENDING" &&
    consumableAttrs.brochurePath.startsWith("http")
      ? consumableAttrs.brochurePath
      : null;

  // Valid certificate documents
  const certDocs: CertificateDocument[] = (consumableAttrs?.certificateDocuments ?? []).filter(
    (c) => c.certificateUrl && c.certificateUrl !== "PENDING" && c.certificateUrl.startsWith("http")
  );

  const formattedProductName = productData
    ? attributes?.brandName
      ? `${productData.productName || ""} — ${attributes.brandName} ${attributes.modelName ? `(${attributes.modelName})` : ""}`
      : `${productData.productName || ""} ${productData.strength || ""}mg ${productData.dosageForm || ""}`.trim()
    : "";

  const productDescription = attributes?.purpose || productData?.productDescription;
  const totalPrice = pricing?.finalPrice != null ? pricing.finalPrice * quantity : 0;

  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-neutral-100 rounded-xl" />
          <div className="h-6 bg-neutral-100 rounded w-2/3" />
          <div className="h-4 bg-neutral-100 rounded w-1/2" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="h-32 bg-neutral-100 rounded" />
            <div className="h-32 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="w-full bg-white rounded-xl p-6 text-center text-neutral-500">
        Product not found.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl p-6 space-y-8">
      <div className="grid grid-cols-2 gap-10">
        {/* LEFT SIDE - Images */}
        <div>
          <div className="relative rounded-xl overflow-hidden w-full h-171 flex items-center justify-center bg-neutral-50">
            <Image
              src={selectedImage}
              alt="Product Image"
              fill
              className="object-cover rounded-xl"
              unoptimized={selectedImage.startsWith("http")}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = PLACEHOLDER_IMAGE;
              }}
            />
            {displayImages.length > 1 && (
              <>
                <button
                  className="absolute left-2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
                  onClick={() => {
                    const newIndex = (selectedImageIndex - 1 + displayImages.length) % displayImages.length;
                    setSelectedImageIndex(newIndex);
                    setSelectedImage(displayImages[newIndex]);
                  }}
                >
                  <IoIosArrowBack size={20} />
                </button>
                <button
                  className="absolute right-2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
                  onClick={() => {
                    const newIndex = (selectedImageIndex + 1) % displayImages.length;
                    setSelectedImageIndex(newIndex);
                    setSelectedImage(displayImages[newIndex]);
                  }}
                >
                  <IoIosArrowBack size={20} className="rotate-180" />
                </button>
              </>
            )}
            {pricing?.discountPercentage != null && pricing.discountPercentage > 0 && (
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

          {/* Thumbnails */}
          <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
            {displayImages.map((img, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedImageIndex(index);
                  setSelectedImage(img);
                }}
                className={`relative h-[127px] w-[127px] rounded-lg cursor-pointer border overflow-hidden flex-shrink-0 ${
                  selectedImage === img ? "border-primary-900 border-2" : "border-neutral-200"
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                  unoptimized={img.startsWith("http")}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
            ))}
          </div>

          {/* Verified / Fast Ship / Returns */}
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

          {/* Additional Discounts */}
          <div className="bg-[#EFF6FF] border-2 border-[#BEDBFF] rounded-lg p-4 mt-4">
            <p className="font-semibold text-[#1C398E] mb-2">Additional Discounts Available</p>
            <ul className="text-sm text-[#193CB8] list-disc ml-4 space-y-1">
              <li>Corporate buyers: Up to 15% additional discount</li>
              <li>Annual contract: Up to 25% savings</li>
              <li>First-time buyers: Extra ₹10 off on orders above ₹200</li>
            </ul>
          </div>

          {/* Product URL / User Manual (Brochure) */}
          {brochureUrl && (
            <div className="border border-neutral-200 rounded-xl mt-4 overflow-hidden">
              <a
                href={brochureUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 transition"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                  <FileText size={16} className="text-purple-600" />
                  Product URL / User Manual
                </div>
                <ExternalLink size={16} className="text-neutral-400" />
              </a>
            </div>
          )}

          {/* Certifications & Compliance - directly below brochure, same design */}
          {certDocs.length > 0 && (
            <div className="border border-neutral-200 rounded-xl mt-4 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                  <PiSealCheckLight size={16} className="text-purple-600" />
                  Certifications & Compliance
                </div>
              </div>
              <div className="divide-y divide-neutral-100">
                {certDocs.map((cert) => (
                  <a
                    key={cert.certificationId}
                    href={cert.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition"
                  >
                    <span className="text-sm text-neutral-700">
                      {cert.certificationName || cert.label || `Certificate ${cert.certificationId}`}
                    </span>
                    <ExternalLink size={14} className="text-neutral-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - unchanged from old UI */}
        <div>
          {/* Tags */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {attributes?.amcAvailability && (
              <span className="bg-primary-05 text-secondary-700 px-3 py-1 rounded-xl text-sm">AMC Available</span>
            )}
            <span className="bg-primary-05 text-secondary-700 px-3 py-1 rounded-xl text-sm">
              Prescription Required
            </span>
            <span className="bg-success-50 text-success-800 px-3 py-1 rounded-xl flex items-center gap-1 text-sm">
              <PiSealCheckLight className="text-sm" />
              {attributes?.deviceClassification ? "Verified Device" : "FDA Approved"}
            </span>
            {attributes?.deviceClassification && (
              <span className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-xl text-sm">
                {attributes.deviceClassification}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[28px] font-semibold mb-2">{formattedProductName}</h1>

          {/* Subtitle */}
          {attributes?.modelNumber && (
            <p className="text-neutral-500 text-sm mb-2">
              Model: {attributes.modelNumber} | Warranty: {attributes.warrantyPeriod} months
            </p>
          )}

          <p className="text-neutral-700 text-sm mb-4">{productDescription}</p>

          {/* Price Card */}
          <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[28px] font-bold">₹{pricing?.finalPrice?.toFixed(2)}</span>
              <span className="text-[#99A1AF] text-[18px] line-through">
                ₹{pricing?.mrp?.toFixed(2)}
              </span>
              {pricing?.discountPercentage != null && pricing.discountPercentage > 0 && (
                <span className="bg-warning-100 text-warning-600 text-sm px-2 py-1 rounded">
                  Save {pricing.discountPercentage}%
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-700 mt-1">
              Price per pack ({packaging?.numberOfUnits || packaging?.unitPerPack || packaging?.unitsPerPack || "?"}{" "}
              {productData?.dosageForm || "units"})
            </p>
          </div>

          {/* Special Offers */}
          <div className="border border-yellow-300 bg-yellow-50 p-4 rounded-lg mb-6">
            <p className="font-semibold mb-2 text-sm text-neutral-900">Special Offers</p>
            <ul className="text-sm text-neutral-700 list-disc ml-4 space-y-1">
              <li>Buy 5+ packs: Extra 5% off</li>
              <li>Buy 10+ packs: Extra 10% off + Free shipping</li>
              <li>Bulk orders: Additional volume discounts available</li>
            </ul>
          </div>

          {/* Pack Size Selector */}
          <h3 className="font-semibold text-[#364153] text-sm mb-3">
            Select Pack Size <span className="text-warning-500">*</span>
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div
              onClick={() => setSelectedPack(1)}
              className={`relative border rounded-xl p-5 cursor-pointer text-center transition ${
                selectedPack === 1 ? "border-2 border-primary-800 bg-secondary-100" : "border-2 border-neutral-300"
              }`}
            >
              {selectedPack === 1 && (
                <div className="absolute -top-2 -right-2 bg-purple-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
              <p className="font-semibold text-lg">{packaging?.packSize ?? "—"}mg</p>
              <p className="text-sm font-semibold text-neutral-700">₹{pricing?.mrp?.toFixed(2)}</p>
              <p className="text-sm text-success-700 font-semibold">{pricing?.discountPercentage ?? 0}% off</p>
            </div>
            <div className="relative border-2 border-neutral-300 rounded-xl p-5 cursor-pointer text-center">
              <p className="font-semibold text-lg">100mg</p>
              <p className="text-sm font-semibold text-neutral-700">₹599</p>
              <p className="text-sm text-success-700 font-semibold">15% off</p>
            </div>
            <div className="relative border-2 border-neutral-300 rounded-xl p-5 cursor-pointer text-center">
              <p className="font-semibold text-lg">200mg</p>
              <p className="text-sm font-semibold text-neutral-700">₹999</p>
              <p className="text-sm text-success-700 font-semibold">20% off</p>
            </div>
          </div>

          {/* Product Details Grid */}
          <h3 className="text-[16px] mb-3 font-semibold">Product Details</h3>
          <div className="grid grid-cols-3 gap-4 text-sm mb-6">
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Pack Size</p>
              <p className="text-[#101828] text-[16px]">{packaging?.packSize ?? "—"} {productData?.dosageForm}</p>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Min Order (MOQ)</p>
              <p className="text-[#101828] text-[16px]">{packaging?.minimumOrderQuantity ?? "—"} Packs</p>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Units per Pack</p>
              <p className="text-[#101828] text-[16px]">
                {packaging?.unitPerPack ?? packaging?.unitsPerPack ?? packaging?.numberOfUnits ?? "—"}
              </p>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Manufacturer</p>
              <p className="text-[#101828] text-[16px] truncate">
                {attributes?.manufacturerName || pricing?.manufacturerName || productData?.manufacturerName || "—"}
              </p>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Dosage Form / Type</p>
              <p className="text-[#101828] text-[16px]">{productData?.dosageForm || attributes?.deviceClassification || "—"}</p>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Max Order</p>
              <p className="text-[#101828] text-[16px]">{packaging?.maximumOrderQuantity ?? "—"} Packs</p>
            </div>
            {productData?.strength && (
              <div className="bg-[#F9FAFB] rounded-lg p-3">
                <p className="text-[#6A7282] text-xs">Strength</p>
                <p className="text-[#101828] text-[16px]">{productData.strength}mg</p>
              </div>
            )}
            {attributes?.warrantyPeriod && (
              <div className="bg-[#F9FAFB] rounded-lg p-3">
                <p className="text-[#6A7282] text-xs">Warranty</p>
                <p className="text-[#101828] text-[16px]">{attributes.warrantyPeriod} months</p>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-sm text-[#364153] mb-2">Quantity (Packs)</p>
            <div className="flex items-center gap-4">
              <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
                <button
                  className="px-4 py-2 border-r border-neutral-300 text-neutral-900"
                  onClick={() =>
                    setQuantity(Math.max(packaging?.minimumOrderQuantity || 1, quantity - 1))
                  }
                >
                  -
                </button>
                <span className="px-6 flex items-center justify-center">{quantity}</span>
                <button
                  className="px-4 py-2 border-l border-neutral-300 text-neutral-900"
                  onClick={() =>
                    setQuantity(Math.min(packaging?.maximumOrderQuantity || 1000, quantity + 1))
                  }
                >
                  +
                </button>
              </div>
              <p className="text-sm text-[#4A5565]">Total: ₹{totalPrice.toFixed(2)}</p>
            </div>
            <p className="text-xs text-[#6A7282] mt-1">
              Minimum order: {packaging?.minimumOrderQuantity} packs | Maximum: {packaging?.maximumOrderQuantity} packs
            </p>
          </div>

          {/* Buttons */}
          <button className="w-full bg-primary-900 text-white text-[16px] font-semibold py-3 rounded-lg mt-2 flex items-center justify-center gap-2">
            <SlHandbag size={24} />
            Buy Now
          </button>
          <button className="w-full border-2 border-primary-900 text-primary-900 text-[16px] font-semibold py-3 rounded-lg mt-3 flex items-center justify-center gap-2">
            <HiOutlineShoppingCart size={24} />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Product Description (unchanged) */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">Product Description</h2>
        <p className="text-sm text-neutral-600 mb-4">{productData?.productDescription}</p>
        {attributes?.keyFeaturesSpecifications && (
          <>
            <h3 className="font-semibold mt-4 mb-2">Key Features / Specifications</h3>
            <p className="text-sm text-neutral-600 whitespace-pre-line">{attributes.keyFeaturesSpecifications}</p>
          </>
        )}
        <h3 className="font-semibold mt-4 mb-2">Warnings & Precautions</h3>
        <p className="text-sm text-neutral-600">{productData?.warningsPrecautions}</p>
        {attributes?.udiNumber && (
          <p className="text-xs text-neutral-400 mt-4">UDI / Serial: {attributes.udiNumber}</p>
        )}
      </div>
    </div>
  );
};

export default ProductView1;