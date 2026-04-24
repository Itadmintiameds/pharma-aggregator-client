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

/* ─────────────────── Types (unchanged) ─────────────────── */

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

/* ─────────────────── Constants ─────────────────── */

const PLACEHOLDER_IMAGE = "/assets/images/SellerMed.jpg";

/* ─────────────────── Design tokens (from Figma spec) ─────────────────── */
// Primary
const C_PNEUTRAL_50  = "#F9F9F8";
const C_PNEUTRAL_200 = "#D5D5D4";
const C_PNEUTRAL_300 = "#C0C1BE";
const C_PNEUTRAL_500 = "#969793";
const C_PNEUTRAL_600 = "#787975";
const C_PNEUTRAL_700 = "#5A5B58";
const C_PNEUTRAL_800 = "#3C3D3A";
const C_PNEUTRAL_900 = "#1E1E1D";
// Secondary / brand purple
const C_SECONDARY_50  = "#F8F5FF";
const C_SECONDARY_700 = "#7D32FC";
const C_SECONDARY_800 = "#4307A9";
const C_PRIMARY_05    = "#E4D6FB";
const C_PRIMARY_900   = "#4C0080";
// Success
const C_SUCCESS_50  = "#DCF7CB";
const C_SUCCESS_800 = "#409600";
// Warning / danger
const C_WARNING_100 = "#FBD7D7";
const C_WARNING_600 = "#BA2C2C";
// Misc
const C_WHITE       = "#FFFFFF";
const C_RED_BADGE   = "#FB2C36";
const C_BORDER      = "#E5E7EB";

/* Font stacks */
const FONT_OPEN_SANS = "'Open Sans', sans-serif";
const FONT_INTER     = "'Inter', sans-serif";

/* ─────────────────── Component ─────────────────── */

const ProductView1 = ({ productId, setCurrentView }: ProductViewProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity]                     = useState(1);
  const [productData, setProductData]               = useState<ProductApiData | null>(null);
  const [loading, setLoading]                       = useState(true);
  const [pincode, setPincode]                       = useState("");
  const [showCertModal, setShowCertModal]           = useState(false);
  const [activeCertDoc, setActiveCertDoc]           = useState<CertificateDocument | null>(null);
  const [showBrochureAccordion, setShowBrochureAccordion] = useState(false);

  /* ── helpers (unchanged logic) ── */
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

  const getBrochureUrl = (data: ProductApiData | null): string | null => {
    if (!data) return null;
    const consumableAttrs = data.productAttributeConsumableMedicals?.[0];
    if (consumableAttrs?.brochurePath && consumableAttrs.brochurePath !== "PENDING")
      return consumableAttrs.brochurePath;
    const ncAttributes = data.productAttributeNonConsumableMedicals?.[0] ?? data.nonConsumableAttributes;
    if (ncAttributes?.brochurePath && ncAttributes.brochurePath !== "PENDING")
      return ncAttributes.brochurePath;
    if (data.productMarketingUrl && data.productMarketingUrl !== "PENDING")
      return data.productMarketingUrl;
    return null;
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      try {
        const response = await getDrugProductById(productId) as ProductApiData;
        setProductData(response);
        const images = resolveProductImages(response);
        if (images.length > 0) setSelectedImageIndex(0);
        if (response?.packagingDetails?.minimumOrderQuantity)
          setQuantity(response.packagingDetails.minimumOrderQuantity);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [productId]);

  const packaging        = productData?.packagingDetails;
  const pricing          = productData?.pricingDetails?.[0];
  const ncAttributes     = productData?.productAttributeNonConsumableMedicals?.[0] ?? productData?.nonConsumableAttributes ?? null;
  const consumableAttrs  = productData?.productAttributeConsumableMedicals?.[0] ?? null;

  const certDocs: CertificateDocument[] = [
    ...(ncAttributes?.certificateDocuments ?? []),
    ...(consumableAttrs?.certificateDocuments ?? []),
  ].filter((c) => c.certificateUrl && c.certificateUrl !== "PENDING");

  const brochureUrl           = getBrochureUrl(productData);
  const productImages         = resolveProductImages(productData);
  const displayImages         = productImages.length > 0 ? productImages : [PLACEHOLDER_IMAGE];
  const selectedImage         = displayImages[selectedImageIndex] ?? PLACEHOLDER_IMAGE;
  const formattedProductName  = productData?.productName || "Product Name";
  const productDescription    = ncAttributes?.purpose || consumableAttrs?.purpose || productData?.productDescription;
  const totalPrice            = pricing?.finalPrice != null ? pricing.finalPrice * quantity : 0;
  const additionalDiscounts   = pricing?.additionalDiscounts?.filter(
    (d) => d.minimumPurchaseQuantity && d.additionalDiscountPercentage,
  ) ?? [];
  const storageConditionName  =
    ncAttributes?.storageConditionName || ncAttributes?.storageCondition ||
    consumableAttrs?.storageConditionName || consumableAttrs?.storageCondition || null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { return dateStr; }
  };

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  const isPdfUrl   = (url: string) => /\.pdf(\?.*)?$/i.test(url);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ width: "100%", background: C_WHITE, borderRadius: 10, padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 256, background: C_PNEUTRAL_50, borderRadius: 10 }} />
          <div style={{ height: 24, background: C_PNEUTRAL_50, borderRadius: 6, width: "66%" }} />
          <div style={{ height: 16, background: C_PNEUTRAL_50, borderRadius: 6, width: "50%" }} />
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div style={{
        width: "100%", background: C_WHITE, borderRadius: 10, padding: 24,
        textAlign: "center", color: C_PNEUTRAL_500, fontFamily: FONT_OPEN_SANS, fontSize: 16,
      }}>
        Product not found.
      </div>
    );
  }

  /* ─────────────────── Render ─────────────────── */
  return (
    <div style={{
      width: "100%",
      paddingBottom: 32,
      background: C_PNEUTRAL_50,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 32,
      fontFamily: FONT_OPEN_SANS,
    }}>

      {/* ── Main card ── */}
      <div style={{
        width: 1216,
        background: C_WHITE,
        boxShadow: "0px 1px 3px rgba(0,0,0,0.10), 0px 1px 2px -1px rgba(0,0,0,0.10)",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Top two-column section */}
        <div style={{ padding: 32, display: "flex", gap: 32, alignItems: "flex-start" }}>

          {/* ════ LEFT COLUMN ════ */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Main image */}
            <div style={{
              width: 560, height: 684,
              position: "relative",
              background: "#F3F4F6",
              borderRadius: 10,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Image
                src={selectedImage}
                alt="Product Image"
                fill
                style={{ objectFit: "cover", borderRadius: 10 }}
                unoptimized={selectedImage.startsWith("http")}
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
              />

              {/* Prev / Next arrows */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((p) => (p - 1 + displayImages.length) % displayImages.length)}
                    style={{
                      position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                      background: "rgba(255,255,255,0.90)", borderRadius: "50%",
                      width: 36, height: 36, border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.10), 0px 4px 6px -4px rgba(0,0,0,0.10)",
                      zIndex: 10,
                    }}
                  >
                    <IoIosArrowBack size={20} color="#364153" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((p) => (p + 1) % displayImages.length)}
                    style={{
                      position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                      background: "rgba(255,255,255,0.90)", borderRadius: "50%",
                      width: 36, height: 36, border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.10), 0px 4px 6px -4px rgba(0,0,0,0.10)",
                      zIndex: 10,
                    }}
                  >
                    <IoIosArrowBack size={20} color="#364153" style={{ transform: "rotate(180deg)" }} />
                  </button>
                </>
              )}

              {/* Discount badge */}
              {pricing?.discountPercentage != null && pricing.discountPercentage > 0 && (
                <span style={{
                  position: "absolute", left: 16, top: 20,
                  background: C_RED_BADGE,
                  color: C_WHITE, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 400, lineHeight: "20px",
                  padding: "4px 12px", borderRadius: 9999, zIndex: 10,
                }}>
                  {pricing.discountPercentage}% OFF
                </span>
              )}

              {/* Wish / Share icons */}
              <div style={{
                position: "absolute", top: 16, right: 16,
                display: "flex", gap: 8, zIndex: 10,
              }}>
                {[<Heart size={20} key="heart" />, <Share2 size={20} key="share" />].map((icon, i) => (
                  <button key={i} style={{
                    background: "rgba(255,255,255,0.90)", borderRadius: "50%",
                    width: 36, height: 36, border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.10), 0px 4px 6px -4px rgba(0,0,0,0.10)",
                    color: "#364153",
                  }}>{icon}</button>
                ))}
              </div>
            </div>

            {/* Thumbnail strip */}
            {displayImages.length > 1 && (
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
                {displayImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: 127, height: 127, borderRadius: 10,
                      background: "#F3F4F6", overflow: "hidden",
                      flexShrink: 0, cursor: "pointer", position: "relative",
                      outline: selectedImageIndex === idx ? `2px solid #2B7FFF` : "2px solid transparent",
                      outlineOffset: -2,
                    }}
                  >
                    <Image
                      src={img} alt={`Thumbnail ${idx + 1}`} fill
                      style={{ objectFit: "cover", borderRadius: 10 }}
                      unoptimized={img.startsWith("http")}
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Trust badges */}
            {/* <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
              {[
                { icon: <LuShield size={20} color="#00A63E" />, label: "Verified" },
                { icon: <LuTruck size={20} color="#155DFC" />, label: "Fast Ship" },
                { icon: <SlReload size={20} color="#9810FA" />, label: "Returns" },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {icon}
                  <span style={{
                    color: C_PNEUTRAL_600, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                    fontWeight: 400, lineHeight: "20px",
                  }}>{label}</span>
                </div>
              ))}
            </div> */}

            {/* Brochure accordion */}
            {brochureUrl && (
              <div style={{
                borderRadius: 8, overflow: "hidden",
                outline: `1px ${C_PNEUTRAL_200} solid`, outlineOffset: -1,
                background: C_SECONDARY_50,
              }}>
                <button
                  type="button"
                  onClick={() => setShowBrochureAccordion((p) => !p)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16, background: "transparent", border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span style={{
                    color: C_PNEUTRAL_900, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                    fontWeight: 600, lineHeight: "22px",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    {/* <FileText size={16} color={C_SECONDARY_700} /> */}
                    Product URL/User Manual
                  </span>
                  <ChevronDown
                    size={20} color={C_PNEUTRAL_800}
                    style={{ transform: showBrochureAccordion ? "rotate(180deg)" : "none", transition: "transform .2s" }}
                  />
                </button>
                {showBrochureAccordion && (
                  <div style={{
                    borderTop: `1px ${C_PNEUTRAL_200} solid`,
                    padding: "8px 16px 12px",
                  }}>
                    <a href={brochureUrl} target="_blank" rel="noreferrer" style={{
                      display: "flex", alignItems: "center", gap: 6,
                      color: C_SECONDARY_700, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                      fontWeight: 400, lineHeight: "20px", textDecoration: "none",
                    }}>
                      <ExternalLink size={14} />
                      View / Download Brochure
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Tags row */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* Prescription badge */}
              <span style={{
                padding: "4px 8px", background: C_PRIMARY_05, borderRadius: 8,
                color: C_SECONDARY_700, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "22px",
              }}>
                Prescription Required
              </span>

              {/* Cert badges / FDA fallback */}
              {certDocs.length > 0 ? (
                certDocs.map((cert) => (
                  <button
                    key={cert.certificationId}
                    type="button"
                    onClick={() => { setActiveCertDoc(cert); setShowCertModal(true); }}
                    style={{
                      padding: "4px 8px", background: C_SUCCESS_50, borderRadius: 8,
                      color: C_SUCCESS_800, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                      fontWeight: 400, lineHeight: "22px",
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <PiSealCheckLight />
                    {cert.certificationName || cert.label || `Certificate ${cert.certificationId}`}
                  </button>
                ))
              ) : ncAttributes?.deviceClassification ? (
                <span style={{
                  padding: "4px 8px", background: C_SUCCESS_50, borderRadius: 8,
                  color: C_SUCCESS_800, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 400, lineHeight: "22px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <PiSealCheckLight /> FDA Approved
                </span>
              ) : (
                <span style={{
                  padding: "4px 8px", background: C_SUCCESS_50, borderRadius: 8,
                  color: C_SUCCESS_800, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 400, lineHeight: "22px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <PiSealCheckLight /> FDA Approved
                </span>
              )}

              {ncAttributes?.amcAvailability && (
                <span style={{
                  padding: "4px 8px", background: C_PRIMARY_05, borderRadius: 8,
                  color: C_SECONDARY_700, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 400, lineHeight: "22px",
                }}>AMC Available</span>
              )}
              {ncAttributes?.deviceClassification && (
                <span style={{
                  padding: "4px 8px", background: C_PNEUTRAL_50, borderRadius: 8,
                  color: C_PNEUTRAL_700, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 400, lineHeight: "22px",
                }}>
                  {ncAttributes.deviceClassification}
                </span>
              )}
            </div>

            {/* Product name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h1 style={{
                color: C_PNEUTRAL_900, fontSize: 28, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "32px", margin: 0,
              }}>
                {formattedProductName}
              </h1>

              {/* Model / subtitle */}
              {/* {(ncAttributes?.modelNumber || ncAttributes?.modelName) && (
                <p style={{
                  color: C_PNEUTRAL_700, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 400, lineHeight: "20px", margin: 0,
                }}>
                  {ncAttributes.modelName && `Model: ${ncAttributes.modelName}`}
                  {ncAttributes.modelNumber && ` | No: ${ncAttributes.modelNumber}`}
                  {ncAttributes.warrantyPeriod && ` | Warranty: ${ncAttributes.warrantyPeriod} months`}
                </p>
              )} */}

              {/* MoA line */}
              <p style={{
                color: C_PNEUTRAL_700, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "20px", margin: 0, paddingTop: 4,
              }}>
                {/* Mechanism of Action placeholder, kept as-is from spec */}
                {productDescription}
              </p>
            </div>

            {/* Price card */}
            <div style={{
              padding: 16, background: C_PNEUTRAL_50, borderRadius: 10,
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                <span style={{
                  color: C_PNEUTRAL_900, fontSize: 28, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 400, lineHeight: "32px",
                }}>
                  ₹{pricing?.finalPrice?.toFixed(2) ?? "—"}
                </span>
                {pricing?.mrp && (
                  <span style={{
                    color: C_PNEUTRAL_600, fontSize: 18, fontFamily: FONT_OPEN_SANS,
                    fontWeight: 400, lineHeight: "24px", textDecoration: "line-through",
                  }}>
                    ₹{pricing.mrp.toFixed(2)}
                  </span>
                )}
                {pricing?.discountPercentage != null && pricing.discountPercentage > 0 && (
                  <span style={{
                    padding: "4px 8px", background: C_WARNING_100, borderRadius: 8,
                    color: C_WARNING_600, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                    fontWeight: 400, lineHeight: "22px",
                  }}>
                    Save {pricing.discountPercentage}%
                  </span>
                )}
              </div>
              <p style={{
                color: C_PNEUTRAL_700, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "20px", margin: 0,
              }}>
                Price per pack 
                {/* (
                {packaging?.unitPerPack ?? packaging?.unitsPerPack ?? packaging?.numberOfUnits ?? "?"}{" "}
                {productData?.dosageForm || "units"}) */}
              </p>
            </div>

            {/* Packaging details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{
                color: C_PNEUTRAL_900, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "22px", margin: 0,
              }}>
                Packaging Details
              </p>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}>
                {[
                  { label: "Packaging Unit",       value: packaging?.packType ?? packaging?.packTypeName ?? "—" },
                  { label: "Dosage Form",           value: productData?.dosageForm ?? ncAttributes?.deviceClassification ?? "—" },
                  { label: "No. of Units per Strip",value: packaging?.unitPerPack ?? packaging?.unitsPerPack ?? "—" },
                  { label: "No. of Strips per Pack",value: packaging?.numberOfPacks ?? "—" },
                  { label: "Strength per Unit",     value: productData?.strength ? `${productData.strength}mg` : "—" },
                  { label: "Storage Condition",     value: storageConditionName ?? "—" },
                  { label: "Batch / Lot Number",    value: pricing?.batchLotNumber ?? "—" },
                  { label: "Manufacturing Date",    value: formatDate(pricing?.manufacturingDate) },
                  { label: "Expiry Date",           value: formatDate(pricing?.expiryDate) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    padding: 12, background: C_PNEUTRAL_50, borderRadius: 10,
                    display: "flex", flexDirection: "column", gap: 4,
                  }}>
                    <p style={{
                      color: "#6A7282", fontSize: 12, fontFamily: FONT_OPEN_SANS,
                      fontWeight: 400, lineHeight: "18px", margin: 0,
                    }}>{label}</p>
                    <p style={{
                      color: "#101828", fontSize: 14, fontFamily: FONT_OPEN_SANS,
                      fontWeight: 600, lineHeight: "20px", margin: 0,
                    }}>{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional discounts */}
            {additionalDiscounts.length > 0 && (
              <div style={{
                padding: 16, background: C_SECONDARY_50, borderRadius: 10,
                outline: `1px ${C_PRIMARY_05} solid`, outlineOffset: -1,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <p style={{
                  color: C_SECONDARY_800, fontSize: 13.2, fontFamily: FONT_INTER,
                  fontWeight: 400, lineHeight: "20px", margin: 0,
                }}>
                  Additional Discounts Available
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {additionalDiscounts.map((d, i) => (
                    <p key={`qty-${i}`} style={{
                      color: C_SECONDARY_700, fontSize: 12, fontFamily: FONT_OPEN_SANS,
                      fontWeight: 400, lineHeight: "18px", margin: 0,
                    }}>
                      Minimum Purchase Quantity - {d.minimumPurchaseQuantity} Packs
                    </p>
                  ))}
                  {additionalDiscounts.map((d, i) => (
                    <p key={`disc-${i}`} style={{
                      color: C_SECONDARY_700, fontSize: 12, fontFamily: FONT_OPEN_SANS,
                      fontWeight: 400, lineHeight: "18px", margin: 0,
                    }}>
                      Discount percentage - {d.additionalDiscountPercentage}%
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Check availability */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <div style={{
                minHeight: 40, padding: "6px 12px",
                background: C_WHITE, borderRadius: 8,
                outline: `1px ${C_PNEUTRAL_500} solid`, outlineOffset: -1,
              }}>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="560079"
                  style={{
                    border: "none", outline: "none", background: "transparent",
                    color: C_PNEUTRAL_500, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                    fontWeight: 300, lineHeight: "20px", width: 80,
                  }}
                />
              </div>
              <button
                type="button"
                style={{
                  height: 40, minHeight: 40,
                  padding: "6px 12px", background: "#9F75FC",
                  borderRadius: 8, border: "none", cursor: "pointer",
                  color: C_WHITE, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 600, lineHeight: "20px",
                }}
              >
                Check Availability
              </button>
            </div>

            {/* Quantity + total */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{
                color: "#364153", fontSize: 14, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "20px", margin: 0,
              }}>
                Quantity (Packs)
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Stepper */}
                <div style={{
                  borderRadius: 10, outline: `1px ${C_PNEUTRAL_300} solid`, outlineOffset: -1,
                  display: "flex", alignItems: "center", overflow: "hidden",
                }}>
                  <button
                    onClick={() => setQuantity(Math.max(packaging?.minimumOrderQuantity || 1, quantity - 1))}
                    style={{
                      padding: 12, background: C_WHITE, border: "none",
                      borderRight: `1px ${C_PNEUTRAL_300} solid`, cursor: "pointer",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20"><path d="M4 10h12" stroke={C_PNEUTRAL_800} strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                  <div style={{
                    width: 80, paddingTop: 12, paddingBottom: 12,
                    borderLeft: `1px ${C_PNEUTRAL_300} solid`,
                    borderRight: `1px ${C_PNEUTRAL_300} solid`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      color: C_PNEUTRAL_900, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                      fontWeight: 600, lineHeight: "22px",
                    }}>
                      {quantity}
                    </span>
                  </div>
                  <button
                    onClick={() => setQuantity(Math.min(packaging?.maximumOrderQuantity || 1000, quantity + 1))}
                    style={{
                      padding: 12, background: C_WHITE, border: "none",
                      borderLeft: `1px ${C_PNEUTRAL_300} solid`, cursor: "pointer",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20">
                      <path d="M4 10h12M10 4v12" stroke={C_PNEUTRAL_800} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <span style={{
                  color: "#4A5565", fontSize: 14, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 600, lineHeight: "20px",
                }}>
                  Total: ₹{totalPrice.toFixed(2)}
                </span>
              </div>
              <p style={{
                color: "#6A7282", fontSize: 12, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "18px", paddingTop: 7, margin: 0,
              }}>
                Minimum order: {packaging?.minimumOrderQuantity ?? "—"} packs | Maximum: {packaging?.maximumOrderQuantity ?? "—"} packs
              </p>
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              {/* Buy Now */}
              <button style={{
                flex: 1, height: 56, minHeight: 56, minWidth: 130,
                background: "#4B0082", borderRadius: 12, border: "none", cursor: "pointer",
                color: C_WHITE, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                fontWeight: 600, lineHeight: "22px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <SlHandbag size={24} />
                Buy Now
              </button>
              {/* Add to Cart */}
              <button style={{
                flex: 1, height: 56, minHeight: 56, minWidth: 130,
                background: "transparent", borderRadius: 12, cursor: "pointer",
                outline: `3px ${C_PRIMARY_900} solid`, outlineOffset: -1.5,
                border: "none",
                color: C_PRIMARY_900, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                fontWeight: 600, lineHeight: "22px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <HiOutlineShoppingCart size={24} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* ── Product description section ── */}
        <div style={{
          borderTop: `1px ${C_BORDER} solid`,
          padding: "32px 32px 48px",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 style={{
                color: "#101828", fontSize: 18, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "24px", margin: 0,
              }}>
                Product Description
              </h2>
              <p style={{
                color: "#4A5565", fontSize: 16, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "22px", margin: 0,
              }}>
                {productData?.productDescription}
              </p>
            </div>

            {/* Spacer */}
            <div style={{ height: 24 }} />

            {/* Warnings */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 style={{
                color: "#101828", fontSize: 18, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "24px", margin: 0,
              }}>
                Warnings &amp; Precautions:
              </h2>
              <p style={{
                color: "#4A5565", fontSize: 16, fontFamily: FONT_OPEN_SANS,
                fontWeight: 400, lineHeight: "22px", margin: 0,
              }}>
                {productData?.warningsPrecautions}
              </p>
            </div>

            {ncAttributes?.udiNumber && (
              <p style={{
                color: C_PNEUTRAL_500, fontSize: 12, fontFamily: FONT_OPEN_SANS,
                fontWeight: 300, lineHeight: "18px", marginTop: 8,
              }}>
                UDI / Serial: {ncAttributes.udiNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Certificate modal (unchanged logic, styled) ── */}
      {showCertModal && activeCertDoc && (
        <div
          onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.50)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C_WHITE, borderRadius: 16,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              width: "100%", maxWidth: 672, margin: "0 16px",
              overflow: "hidden", display: "flex", flexDirection: "column",
              maxHeight: "90vh",
            }}
          >
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 24px", borderBottom: `1px ${C_BORDER} solid`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, background: C_PRIMARY_05,
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <PiSealCheckLight size={20} color={C_SECONDARY_700} />
                </div>
                <div>
                  <p style={{
                    color: C_PNEUTRAL_900, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                    fontWeight: 600, lineHeight: "22px", margin: 0,
                  }}>
                    {activeCertDoc.certificationName || activeCertDoc.label || `Certificate ${activeCertDoc.certificationId}`}
                  </p>
                  <p style={{
                    color: C_PNEUTRAL_500, fontSize: 12, fontFamily: FONT_OPEN_SANS,
                    fontWeight: 400, lineHeight: "18px", margin: 0,
                  }}>
                    Certification Document
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <a href={activeCertDoc.certificateUrl} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 6,
                  color: C_SECONDARY_700, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 600, lineHeight: "20px", textDecoration: "none",
                  padding: "6px 12px", borderRadius: 8,
                }}>
                  <ExternalLink size={14} /> Open
                </a>
                <button
                  type="button"
                  onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "none",
                    background: "transparent", cursor: "pointer",
                    color: C_PNEUTRAL_500, fontSize: 20, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div style={{
              flex: 1, overflowY: "auto", background: C_PNEUTRAL_50,
              padding: 16, display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: 400,
            }}>
              {isImageUrl(activeCertDoc.certificateUrl) ? (
                <img
                  src={activeCertDoc.certificateUrl}
                  alt={activeCertDoc.certificationName || "Certificate"}
                  style={{ maxWidth: "100%", maxHeight: 600, objectFit: "contain", borderRadius: 8 }}
                />
              ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
                <iframe
                  src={activeCertDoc.certificateUrl}
                  title="Certificate PDF"
                  style={{ width: "100%", height: 560, border: "none", borderRadius: 8 }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0" }}>
                  <div style={{
                    width: 64, height: 64, background: C_PRIMARY_05, borderRadius: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <FileText size={32} color={C_SECONDARY_700} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{
                      color: C_PNEUTRAL_900, fontSize: 16, fontFamily: FONT_OPEN_SANS,
                      fontWeight: 600, lineHeight: "22px", margin: "0 0 8px",
                    }}>
                      {activeCertDoc.certificationName || activeCertDoc.label || `Certificate ${activeCertDoc.certificationId}`}
                    </p>
                    <p style={{
                      color: C_PNEUTRAL_500, fontSize: 14, fontFamily: FONT_OPEN_SANS,
                      fontWeight: 400, lineHeight: "20px", margin: "0 0 16px",
                    }}>
                      This file cannot be previewed in the browser.
                    </p>
                    <a href={activeCertDoc.certificateUrl} target="_blank" rel="noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: C_SECONDARY_700, color: C_WHITE,
                      fontSize: 14, fontFamily: FONT_OPEN_SANS, fontWeight: 600,
                      lineHeight: "20px", padding: "10px 20px", borderRadius: 8,
                      textDecoration: "none",
                    }}>
                      <ExternalLink size={14} /> Open / Download
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer quick-switch */}
            {certDocs.length > 1 && (
              <div style={{
                borderTop: `1px ${C_BORDER} solid`,
                padding: "12px 24px", display: "flex", alignItems: "center",
                gap: 8, overflowX: "auto",
              }}>
                <span style={{
                  color: C_PNEUTRAL_500, fontSize: 12, fontFamily: FONT_OPEN_SANS,
                  fontWeight: 400, lineHeight: "18px", flexShrink: 0,
                }}>
                  Other certs:
                </span>
                {certDocs
                  .filter((c) => c.certificationId !== activeCertDoc.certificationId)
                  .map((cert) => (
                    <button
                      key={cert.certificationId}
                      type="button"
                      onClick={() => setActiveCertDoc(cert)}
                      style={{
                        flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                        color: C_SECONDARY_700, background: C_SECONDARY_50,
                        fontSize: 12, fontFamily: FONT_OPEN_SANS, fontWeight: 600,
                        lineHeight: "18px", padding: "6px 12px", borderRadius: 9999,
                        border: "none", cursor: "pointer",
                      }}
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