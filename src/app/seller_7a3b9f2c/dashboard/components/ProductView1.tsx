"use client";

import React, { useState, useEffect } from "react";
import { Heart, Share2, FileText, ExternalLink, ChevronDown } from "lucide-react";
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

interface ProductImage {
  productImage?: string;
  imageUrl?: string;
  url?: string;
  imagePath?: string;
}

interface PackagingDetails {
  packSize?: number;
  packType?: string;
  packTypeName?: string;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  unitPerPack?: number;
  unitsPerPack?: number;
  numberOfUnits?: number;
  numberOfPacks?: number;
}

interface PricingDetails {
  finalPrice?: number;
  mrp?: number;
  discountPercentage?: number;
  manufacturerName?: string;
  batchLotNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  stockQuantity?: number;
  additionalDiscounts?: AdditionalDiscount[];
}

interface AdditionalDiscount {
  minimumPurchaseQuantity?: number;
  additionalDiscountPercentage?: number;
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
  storageCondition?: string;
  storageConditionName?: string;
  certificateDocuments?: CertificateDocument[];
  brochurePath?: string;
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
  storageConditionName?: string;
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
  productMarketingUrl?: string;
}

const PLACEHOLDER_IMAGE = "/assets/images/SellerMed.jpg";

const ProductView1 = ({ productId, setCurrentView }: ProductViewProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [productData, setProductData] = useState<ProductApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pincode, setPincode] = useState("");
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);
  const [showBrochureAccordion, setShowBrochureAccordion] = useState(false);

  // FIXED: More flexible image resolver that doesn't strictly require http://
  const resolveProductImages = (data: ProductApiData | null): string[] => {
    if (!data) return [];
    
    if (Array.isArray(data.productImages)) {
      const urls = data.productImages
        .map((img) => img?.productImage || img?.imageUrl || img?.url || img?.imagePath || "")
        .filter((url) => url && url !== "PENDING");
      if (urls.length > 0) return urls;
    }
    
    if (Array.isArray(data.images)) {
      const urls = data.images.filter((url) => url && url !== "PENDING");
      if (urls.length > 0) return urls;
    }
    
    if (Array.isArray(data.imageUrls)) {
      const urls = data.imageUrls.filter((url) => url && url !== "PENDING");
      if (urls.length > 0) return urls;
    }
    
    return [];
  };

  // FIXED: Get brochure URL from both consumable and non-consumable
  const getBrochureUrl = (data: ProductApiData | null): string | null => {
    if (!data) return null;
    
    // Check consumable attributes
    const consumableAttrs = data.productAttributeConsumableMedicals?.[0];
    if (consumableAttrs?.brochurePath && consumableAttrs.brochurePath !== "PENDING") {
      return consumableAttrs.brochurePath;
    }
    
    // Check non-consumable attributes
    const ncAttributes = data.productAttributeNonConsumableMedicals?.[0] ?? data.nonConsumableAttributes;
    if (ncAttributes?.brochurePath && ncAttributes.brochurePath !== "PENDING") {
      return ncAttributes.brochurePath;
    }
    
    // Also check productMarketingUrl
    if (data.productMarketingUrl && data.productMarketingUrl !== "PENDING") {
      return data.productMarketingUrl;
    }
    
    return null;
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      try {
        const response = await getDrugProductById(productId) as ProductApiData;
        setProductData(response);
        
        // Set images
        const images = resolveProductImages(response);
        if (images.length > 0) {
          setSelectedImageIndex(0);
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

  // Non-consumable attributes
  const ncAttributes = productData?.productAttributeNonConsumableMedicals?.[0] ??
    productData?.nonConsumableAttributes ?? null;

  // Consumable attributes
  const consumableAttrs = productData?.productAttributeConsumableMedicals?.[0] ?? null;

  // FIXED: Merge cert docs from both consumable and non-consumable
  const certDocs: CertificateDocument[] = [
    ...(ncAttributes?.certificateDocuments ?? []),
    ...(consumableAttrs?.certificateDocuments ?? []),
  ].filter((c) => c.certificateUrl && c.certificateUrl !== "PENDING");

  const brochureUrl = getBrochureUrl(productData);

  const productImages = resolveProductImages(productData);
  const displayImages = productImages.length > 0 ? productImages : [PLACEHOLDER_IMAGE];
  const selectedImage = displayImages[selectedImageIndex] ?? PLACEHOLDER_IMAGE;

  const formattedProductName = productData?.productName || "Product Name";
  const productDescription = ncAttributes?.purpose || consumableAttrs?.purpose || productData?.productDescription;
  const totalPrice = pricing?.finalPrice != null ? pricing.finalPrice * quantity : 0;

  const additionalDiscounts = pricing?.additionalDiscounts?.filter(
    (d) => d.minimumPurchaseQuantity && d.additionalDiscountPercentage
  ) ?? [];

  const storageConditionName = ncAttributes?.storageConditionName ||
    ncAttributes?.storageCondition ||
    consumableAttrs?.storageConditionName ||
    consumableAttrs?.storageCondition ||
    null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper: determine cert file type from URL
  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

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
          <div className="relative rounded-xl overflow-hidden w-full h-[430px] flex items-center justify-center bg-neutral-50">
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-100 z-10"
                  onClick={() => setSelectedImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)}
                >
                  <IoIosArrowBack size={20} />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-100 z-10"
                  onClick={() => setSelectedImageIndex((prev) => (prev + 1) % displayImages.length)}
                >
                  <IoIosArrowBack size={20} className="rotate-180" />
                </button>
              </>
            )}

            {pricing?.discountPercentage != null && pricing.discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-[#FB2C36] text-white text-sm px-3 py-1 rounded-full z-10">
                {pricing.discountPercentage}% OFF
              </span>
            )}

            {displayImages.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
                {selectedImageIndex + 1} / {displayImages.length}
              </span>
            )}

            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button className="bg-white rounded-full p-2 shadow hover:bg-gray-50 transition">
                <Heart size={20} />
              </button>
              <button className="bg-white rounded-full p-2 shadow hover:bg-gray-50 transition">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {displayImages.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {displayImages.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative h-[80px] w-[80px] rounded-lg cursor-pointer border overflow-hidden flex-shrink-0 transition ${
                    selectedImageIndex === index
                      ? "border-primary-900 border-2"
                      : "border-neutral-200 hover:border-neutral-400"
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
          )}

          <div className="flex items-center gap-12 mt-5 text-sm">
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

          {/* FIXED: Product URL / User Manual accordion - Now shows for BOTH types */}
          {brochureUrl && (
            <div className="border border-neutral-200 rounded-xl mt-4 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBrochureAccordion((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                  <FileText size={16} className="text-purple-600" />
                  Product Brochure / User Manual
                </div>
                <ChevronDown
                  size={18}
                  className={`text-neutral-400 transition-transform ${showBrochureAccordion ? "rotate-180" : ""}`}
                />
              </button>
              {showBrochureAccordion && (
                <div className="px-4 pb-3 pt-1 border-t border-neutral-100">
                  <a
                    href={brochureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900 hover:underline transition"
                  >
                    <ExternalLink size={14} />
                    View / Download Brochure
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div>
          {/* Tags with Certifications */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="bg-primary-05 text-secondary-700 px-3 py-1 rounded-xl text-sm">
              Prescription Required
            </span>

            {/* FIXED: Certification tags - now clickable */}
            {certDocs.length > 0 ? (
              certDocs.map((cert) => (
                <button
                  key={cert.certificationId}
                  type="button"
                  onClick={() => {
                    setActiveCertDoc(cert);
                    setShowCertModal(true);
                  }}
                  className="bg-success-50 text-success-800 px-3 py-1 rounded-xl flex items-center gap-1 text-sm hover:bg-success-100 hover:text-success-900 transition cursor-pointer"
                >
                  <PiSealCheckLight className="text-sm" />
                  {cert.certificationName || cert.label || `Certificate ${cert.certificationId}`}
                </button>
              ))
            ) : (
              /* Fallback if no certs */
              ncAttributes?.deviceClassification ? (
                <span className="bg-success-50 text-success-800 px-3 py-1 rounded-xl flex items-center gap-1 text-sm">
                  <PiSealCheckLight className="text-sm" />
                  Verified Device
                </span>
              ) : null
            )}

            {ncAttributes?.amcAvailability && (
              <span className="bg-primary-05 text-secondary-700 px-3 py-1 rounded-xl text-sm">
                AMC Available
              </span>
            )}
            {ncAttributes?.deviceClassification && (
              <span className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-xl text-sm">
                {ncAttributes.deviceClassification}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[28px] font-semibold mb-1">{formattedProductName}</h1>

          {/* Subtitle */}
          {(ncAttributes?.modelNumber || ncAttributes?.modelName) && (
            <p className="text-neutral-500 text-sm mb-2">
              {ncAttributes.modelName && `Model: ${ncAttributes.modelName}`}
              {ncAttributes.modelNumber && ` | No: ${ncAttributes.modelNumber}`}
              {ncAttributes.warrantyPeriod && ` | Warranty: ${ncAttributes.warrantyPeriod} months`}
            </p>
          )}

          <p className="text-neutral-700 text-sm mb-4">{productDescription}</p>

          {/* Price Card */}
          <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[28px] font-bold">
                ₹{pricing?.finalPrice?.toFixed(2) ?? "—"}
              </span>
              {pricing?.mrp && (
                <span className="text-[#99A1AF] text-[18px] line-through">
                  ₹{pricing.mrp.toFixed(2)}
                </span>
              )}
              {pricing?.discountPercentage != null && pricing.discountPercentage > 0 && (
                <span className="bg-warning-100 text-warning-600 text-sm px-2 py-1 rounded">
                  Save {pricing.discountPercentage}%
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-700 mt-1">
              Price per pack (
              {packaging?.unitPerPack ??
                packaging?.unitsPerPack ??
                packaging?.numberOfUnits ??
                "?"}{" "}
              {productData?.dosageForm || "units"})
            </p>
          </div>

          {/* Packaging Details */}
          <h3 className="font-semibold text-[15px] mb-3 text-neutral-900">Packaging Details</h3>
          <div className="border border-neutral-200 rounded-xl overflow-hidden mb-4">
            <div className="grid grid-cols-3 divide-x divide-y divide-neutral-200">
              <div className="p-3">
                <p className="text-xs text-[#6A7282]">Packaging Unit</p>
                <p className="text-[14px] font-medium text-[#101828] mt-1">
                  {packaging?.packType ?? packaging?.packTypeName ?? "—"}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[#6A7282]">Dosage Form</p>
                <p className="text-[14px] font-medium text-[#101828] mt-1">
                  {productData?.dosageForm ?? ncAttributes?.deviceClassification ?? "—"}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[#6A7282]">No. of Units per Strip</p>
                <p className="text-[14px] font-medium text-[#101828] mt-1">
                  {packaging?.unitPerPack ?? packaging?.unitsPerPack ?? "—"}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[#6A7282]">No. of Strips per Pack</p>
                <p className="text-[14px] font-medium text-[#101828] mt-1">
                  {packaging?.numberOfPacks ?? "—"}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[#6A7282]">Strength per Unit</p>
                <p className="text-[14px] font-medium text-[#101828] mt-1">
                  {productData?.strength ? `${productData.strength}mg` : "—"}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[#6A7282]">Storage Condition</p>
                <p className="text-[14px] font-medium text-[#101828] mt-1">
                  {storageConditionName ?? "—"}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[#6A7282]">Batch / Lot Number</p>
                <p className="text-[14px] font-medium text-[#101828] mt-1">
                  {pricing?.batchLotNumber ?? "—"}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[#6A7282]">Manufacturing Date</p>
                <p className="text-[14px] font-medium text-[#101828] mt-1">
                  {formatDate(pricing?.manufacturingDate)}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[#6A7282]">Expiry Date</p>
                <p className="text-[14px] font-medium text-[#101828] mt-1">
                  {formatDate(pricing?.expiryDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Discounts */}
          {additionalDiscounts.length > 0 && (
            <div className="border border-[#C4B5FD] bg-[#FAF5FF] rounded-lg p-4 mb-4">
              <p className="font-semibold text-[#6D28D9] mb-2 text-sm">
                Additional Discounts Available
              </p>
              <div className="space-y-1">
                {additionalDiscounts.map((d, i) => (
                  <p key={i} className="text-sm text-[#7C3AED]">
                    Minimum Purchase Quantity - {d.minimumPurchaseQuantity} Packs
                  </p>
                ))}
                {additionalDiscounts.map((d, i) => (
                  <p key={`disc-${i}`} className="text-sm text-[#7C3AED]">
                    Discount percentage - {d.additionalDiscountPercentage}%
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Check Availability */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter pincode"
              className="border border-neutral-300 rounded-lg px-4 py-2 text-sm w-32 focus:outline-none focus:border-[#4B0082]"
            />
            <button
              type="button"
              className="bg-[#4B0082] hover:bg-purple-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
            >
              Check Availability
            </button>
          </div>

          {/* Quantity */}
          <div className="mb-5">
            <p className="text-sm text-[#364153] mb-2 font-medium">Quantity (Packs)</p>
            <div className="flex items-center gap-4">
              <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
                <button
                  className="px-4 py-2 border-r border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition"
                  onClick={() => setQuantity(Math.max(packaging?.minimumOrderQuantity || 1, quantity - 1))}
                >
                  -
                </button>
                <span className="px-6 flex items-center justify-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  className="px-4 py-2 border-l border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition"
                  onClick={() => setQuantity(Math.min(packaging?.maximumOrderQuantity || 1000, quantity + 1))}
                >
                  +
                </button>
              </div>
              <p className="text-sm text-[#4A5565]">Total: ₹{totalPrice.toFixed(2)}</p>
            </div>
            <p className="text-xs text-[#6A7282] mt-1">
              Minimum order: {packaging?.minimumOrderQuantity ?? "—"} packs | Maximum:{" "}
              {packaging?.maximumOrderQuantity ?? "—"} packs
            </p>
          </div>

          {/* Buttons */}
          <button className="w-full bg-primary-900 text-white text-[16px] font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-900 transition">
            <SlHandbag size={24} />
            Buy Now
          </button>
          <button className="w-full border-2 border-primary-900 text-primary-900 text-[16px] font-semibold py-3 rounded-lg mt-3 flex items-center justify-center gap-2 hover:bg-purple-50 transition">
            <HiOutlineShoppingCart size={24} />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Product Description */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">Product Description</h2>
        <p className="text-sm text-neutral-600 mb-4">{productData?.productDescription}</p>
        {(ncAttributes?.keyFeaturesSpecifications || consumableAttrs?.keyFeaturesSpecifications) && (
          <>
            <h3 className="font-semibold mt-4 mb-2">Key Features / Specifications</h3>
            <p className="text-sm text-neutral-600 whitespace-pre-line">
              {ncAttributes?.keyFeaturesSpecifications || consumableAttrs?.keyFeaturesSpecifications}
            </p>
          </>
        )}
        <h3 className="font-semibold mt-4 mb-2">Warnings & Precautions</h3>
        <p className="text-sm text-neutral-600">{productData?.warningsPrecautions}</p>
        {ncAttributes?.udiNumber && (
          <p className="text-xs text-neutral-400 mt-4">UDI / Serial: {ncAttributes.udiNumber}</p>
        )}
      </div>

      {/* Certification Viewer Modal */}
      {showCertModal && activeCertDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setShowCertModal(false);
            setActiveCertDoc(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <PiSealCheckLight size={20} className="text-purple-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-base">
                    {activeCertDoc.certificationName || activeCertDoc.label || `Certificate ${activeCertDoc.certificationId}`}
                  </h3>
                  <p className="text-xs text-neutral-400">Certification Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeCertDoc.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-purple-700 hover:text-purple-900 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition"
                >
                  <ExternalLink size={14} />
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setShowCertModal(false);
                    setActiveCertDoc(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-700 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-auto bg-neutral-50 p-4 flex items-center justify-center min-h-[400px]">
              {isImageUrl(activeCertDoc.certificateUrl) ? (
                <img
                  src={activeCertDoc.certificateUrl}
                  alt={activeCertDoc.certificationName || activeCertDoc.label || "Certificate"}
                  className="max-w-full max-h-[600px] object-contain rounded-lg shadow"
                />
              ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
                <iframe
                  src={activeCertDoc.certificateUrl}
                  title={activeCertDoc.certificationName || "Certificate PDF"}
                  className="w-full rounded-lg"
                  style={{ height: "560px", border: "none" }}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <FileText size={32} className="text-purple-700" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-neutral-800 mb-1">
                      {activeCertDoc.certificationName || activeCertDoc.label || `Certificate ${activeCertDoc.certificationId}`}
                    </p>
                    <p className="text-sm text-neutral-500 mb-4">
                      This file cannot be previewed in the browser.
                    </p>
                    <a
                      href={activeCertDoc.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                    >
                      <ExternalLink size={14} />
                      Open / Download
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer: other certs quick-switch */}
            {certDocs.length > 1 && (
              <div className="border-t border-neutral-100 px-6 py-3 flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-neutral-400 flex-shrink-0">Other certs:</span>
                {certDocs
                  .filter((c) => c.certificationId !== activeCertDoc.certificationId)
                  .map((cert) => (
                    <button
                      key={cert.certificationId}
                      type="button"
                      onClick={() => setActiveCertDoc(cert)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition font-medium"
                    >
                      <PiSealCheckLight size={12} />
                      {cert.certificationName || cert.label || `Cert ${cert.certificationId}`}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductView1;