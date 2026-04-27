"use client";

import React, { useState, useEffect } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { DashboardView } from "@/src/types/seller/dashboard";
import { PiSealCheckLight } from "react-icons/pi";
import Image from "next/image";
import { getDrugProductById } from "@/src/services/product/ProductService";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

interface ProductViewProps {
  productId: string | null;
  /** Category id passed from ProductList — used for edit routing */
  categoryId?: number | null;
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
  packId?: number;
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
  finalPrice?: number | null;
  sellingPrice?: number;
  mrp?: number;
  discountPercentage?: number;
  manufacturerName?: string;
  batchLotNumber?: string | null;
  manufacturingDate?: string;
  expiryDate?: string | null;
  stockQuantity?: number;
  additionalDiscounts?: AdditionalDiscount[];
  gstPercentage?: string | number;
  hsnCode?: string | number;
  shelfLifeMonths?: number | null;
  dateOfStockEntry?: string;
}

interface AdditionalDiscount {
  additionalDiscountId?: string;
  minimumPurchaseQuantity?: number;
  maximumPurchaseQuantity?: number;
  additionalDiscountPercentage?: number;
  /** API field names */
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  /** legacy field names — fallback */
  startDate?: string;
  endDate?: string;
}

interface CertificateDocument {
  certificationId: number;
  certificateUrl: string;
  certificationName?: string;
  label?: string;
  productCertificateDocumentId?: number;
}

/* ── Non-Consumable (categoryId = 6) ── */
interface NonConsumableAttributes {
  brandName?: string;
  modelName?: string;
  modelNumber?: string;
  warrantyPeriod?: string | number;
  deviceClassification?: string;
  amcAvailability?: boolean;
  serviceAvailability?: boolean;
  keyFeaturesSpecifications?: string;
  udiNumber?: string;
  purpose?: string;
  manufacturerName?: string;
  storageCondition?: string;
  storageConditionName?: string;
  storageConditionId?: number;
  certificateDocuments?: CertificateDocument[];
  brochurePath?: string;
  deviceName?: string;
  deviceSubCategoryName?: string;
  countryName?: string;
  materialTypes?: { materialTypeId: number; materialTypeName: string }[];
  powerSourceName?: string;
}

/* ── Consumable (categoryId = 5) ── */
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
  safetyInstructions?: string;
  dimensionSize?: string;
  materialTypes?: { materialTypeId: number; materialTypeName: string }[];
}

/* ── Drug (categoryId = 1) ── */
interface MoleculeDetail {
  moleculeId?: number;
  moleculeName?: string;
  strength?: string | number;
}

interface DrugAttributeEntry {
  productAttributeId?: string;
  dosageForm?: string;
  therapeuticCategoryId?: string | number;
  therapeuticCategoryName?: string;
  therapeuticSubcategoryId?: string | number;
  therapeuticSubcategoryName?: string;
  drugSchedule?: string;
  mechanismOfAction?: string;
  storageConditionIds?: number[] | null;
  storageConditionName?: string;
  storageCondition?: string;
  primaryUse?: string;
  purpose?: string;
  manufacturerName?: string;
  userManualUrl?: string;
  brochurePath?: string;
  warningsPrecautions?: string;
  productDescription?: string;
  molecules?: MoleculeDetail[];
  /* legacy flat fields */
  molecule1Name?: string;
  molecule1Strength?: string | number;
  molecule2Name?: string;
  molecule2Strength?: string | number;
  shelfLife?: string;
  gstPercentage?: string | number;
  hsnCode?: string;
}

interface ProductApiData {
  productId?: string;
  categoryId?: number;
  productName?: string;
  productDescription?: string;
  warningsPrecautions?: string;
  manufacturerName?: string;
  strength?: string | number;
  dosageForm?: string;
  productImages?: ProductImage[];
  images?: string[];
  imageUrls?: string[];
  packagingDetails?: PackagingDetails | PackagingDetails[];
  pricingDetails?: PricingDetails[];
  productAttributeNonConsumableMedicals?: NonConsumableAttributes[];
  nonConsumableAttributes?: NonConsumableAttributes;
  productAttributeConsumableMedicals?: ConsumableAttributes[];
  productAttributeDrugs?: DrugAttributeEntry[];
  drugAttributes?: DrugAttributeEntry; // legacy
  productMarketingUrl?: string;
  therapeuticCategory?: string;
  therapeuticSubcategory?: string;
  drugSchedule?: string;
  mechanismOfAction?: string;
  gstPercentage?: string | number;
  hsnCode?: string;
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */

const PLACEHOLDER_IMAGE = "/assets/images/SellerMed.jpg";

/**
 * Maps categoryId → DashboardView for that category's edit form.
 * Keep in sync with ProductList's categoryViewMap.
 */
const CATEGORY_EDIT_VIEW: Record<number, DashboardView> = {
  1: "editDrug" as DashboardView,
  2: "editSupplement" as DashboardView,
  3: "editFoodInfant" as DashboardView,
  4: "editCosmetic" as DashboardView,
  5: "editConsumable" as DashboardView,
  6: "editNonConsumable" as DashboardView,
};

/* ─────────────────────────────────────────────────────────
   SHARED STYLES
───────────────────────────────────────────────────────── */

const ROW: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "12px 16px",
  borderBottom: "1px solid #D5D5D4",
  gap: 16,
};

const ROW_LABEL: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 4,
  flex: "1 1 0",
  minWidth: 0,
};

const LABEL_TEXT: React.CSSProperties = {
  color: "#5A5B58",
  fontSize: 16,
  fontFamily: "'Open Sans', sans-serif",
  fontWeight: 600,
  lineHeight: "22px",
  margin: 0,
};

const REQUIRED_STAR: React.CSSProperties = {
  color: "#FF3B3B",
  fontSize: 16,
  fontFamily: "'Open Sans', sans-serif",
  fontWeight: 600,
  lineHeight: "22px",
  flexShrink: 0,
};

const VALUE_TEXT: React.CSSProperties = {
  color: "#3C3D3A",
  fontSize: 16,
  fontFamily: "'Open Sans', sans-serif",
  fontWeight: 400,
  lineHeight: "22px",
  textAlign: "right",
  flex: "1 1 0",
  margin: 0,
};

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */

const FieldRow = ({
  label,
  value,
  required = true,
  valueNode,
  multiline = false,
}: {
  label: string;
  value?: string | number | null;
  required?: boolean;
  valueNode?: React.ReactNode;
  multiline?: boolean;
}) => (
  <div style={{ ...ROW, alignItems: multiline ? "flex-start" : "center" }}>
    <div style={ROW_LABEL}>
      <span style={LABEL_TEXT}>{label}</span>
      {required && <span style={REQUIRED_STAR}>*</span>}
    </div>
    {valueNode ? (
      <div style={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end" }}>
        {valueNode}
      </div>
    ) : (
      <p style={VALUE_TEXT}>{value ?? "—"}</p>
    )}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px solid #D5D5D4" }}>
    <h2
      style={{
        color: "#101828",
        fontSize: 28,
        fontFamily: "'Open Sans', sans-serif",
        fontWeight: 600,
        lineHeight: "32px",
        margin: 0,
      }}
    >
      {children}
    </h2>
  </div>
);

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

/** "650mg" | 650 → "650 mg" */
const formatStrength = (s?: string | number | null): string => {
  if (s == null) return "—";
  const str = String(s).trim();
  const m = str.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z%µ]+)?$/);
  if (m) return `${m[1]} ${m[2] ?? "mg"}`;
  return str;
};

/** Returns null for blank / PENDING / NOT_UPLOADED values */
const validUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const t = url.trim().toUpperCase();
  if (["", "PENDING", "NOT_UPLOADED"].includes(t)) return null;
  return url.trim();
};

const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

const formatDate = (dateStr?: string | null): string => {
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

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */

const ProductView1 = ({
  productId,
  categoryId: categoryIdProp,
  setCurrentView,
}: ProductViewProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [productData, setProductData] = useState<ProductApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);

  /* ── Fetch ── */
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    (async () => {
      try {
        const response = (await getDrugProductById(productId)) as ProductApiData;
        setProductData(response);
      } catch (err) {
        console.error("Error fetching product details:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  /* ── Derived attribute objects ── */
  const packaging: PackagingDetails | undefined = Array.isArray(productData?.packagingDetails)
    ? productData?.packagingDetails[0]
    : productData?.packagingDetails;

  const pricing = productData?.pricingDetails?.[0];

  /** Non-consumable attributes (categoryId 6) */
  const ncAttr: NonConsumableAttributes | null =
    (productData?.productAttributeNonConsumableMedicals ?? []).length > 0
      ? productData!.productAttributeNonConsumableMedicals![0]
      : productData?.nonConsumableAttributes ?? null;

  /** Consumable attributes (categoryId 5) */
  const consAttr: ConsumableAttributes | null =
    (productData?.productAttributeConsumableMedicals ?? []).length > 0
      ? productData!.productAttributeConsumableMedicals![0]
      : null;

  /**
   * Drug attributes (categoryId 1).
   * New API: productAttributeDrugs[]
   * Legacy fallback: drugAttributes object
   */
  const drugEntry: DrugAttributeEntry | null =
    (productData?.productAttributeDrugs ?? []).length > 0
      ? productData!.productAttributeDrugs![0]
      : productData?.drugAttributes ?? null;

  /* ── Category resolution — prefer API data, fallback to prop ── */
  const resolvedCategoryId: number | null =
    productData?.categoryId ?? categoryIdProp ?? null;

  /* ── Molecules (drug) ── */
  const molecules = drugEntry?.molecules ?? [];
  const molecule1 = molecules[0] ?? null;
  const molecule2 = molecules[1] ?? null;

  /* ── Brochure URL (first valid value wins) ── */
  const brochureUrl: string | null =
    validUrl(drugEntry?.brochurePath) ??
    validUrl(drugEntry?.userManualUrl) ??
    validUrl(consAttr?.brochurePath) ??
    validUrl(ncAttr?.brochurePath) ??
    validUrl(productData?.productMarketingUrl);

  /* ── Certificate documents (filter NOT_UPLOADED) ── */
  const certDocs: CertificateDocument[] = [
    ...(ncAttr?.certificateDocuments ?? []),
    ...(consAttr?.certificateDocuments ?? []),
  ].filter((c) => validUrl(c.certificateUrl) !== null);

  /* ── Storage Condition ──
     NonCons API: storageConditionName ✓ (e.g. "Avoid Sunlight")
     Consumable API: storageConditionId present, name NOT in response
       → fall back to "Condition #N" until backend sends name
     Drug API: storageConditionIds array, optional name
  */
  const storageCondition: string | null =
    drugEntry?.storageConditionName ??
    drugEntry?.storageCondition ??
    ncAttr?.storageConditionName ??
    ncAttr?.storageCondition ??
    consAttr?.storageConditionName ??
    consAttr?.storageCondition ??
    (consAttr?.storageConditionId != null
      ? `Condition #${consAttr.storageConditionId}`
      : null) ??
    (ncAttr?.storageConditionId != null
      ? `Condition #${ncAttr.storageConditionId}`
      : null);

  /* ── Field resolutions ── */
  const dosageForm = drugEntry?.dosageForm ?? productData?.dosageForm ?? null;

  const therapeuticCategory =
    drugEntry?.therapeuticCategoryName ??
    productData?.therapeuticCategory ??
    (drugEntry?.therapeuticCategoryId != null
      ? String(drugEntry.therapeuticCategoryId)
      : null);

  const therapeuticSubcategory =
    drugEntry?.therapeuticSubcategoryName ??
    productData?.therapeuticSubcategory ??
    (drugEntry?.therapeuticSubcategoryId != null
      ? String(drugEntry.therapeuticSubcategoryId)
      : null);

  const drugSchedule = drugEntry?.drugSchedule ?? productData?.drugSchedule ?? null;
  const mechanismOfAction =
    drugEntry?.mechanismOfAction ?? productData?.mechanismOfAction ?? null;

  const primaryUse =
    drugEntry?.primaryUse ??
    drugEntry?.purpose ??
    ncAttr?.purpose ??
    consAttr?.purpose ??
    null;

  const manufacturerName =
    drugEntry?.manufacturerName ??
    pricing?.manufacturerName ??
    productData?.manufacturerName ??
    ncAttr?.manufacturerName ??
    consAttr?.manufacturerName ??
    null;

  const warningsPrecautions =
    drugEntry?.warningsPrecautions ?? productData?.warningsPrecautions ?? null;

  const productDescription =
    drugEntry?.productDescription ?? productData?.productDescription ?? null;

  /* GST & HSN live in pricingDetails — not in drugAttributes */
  const gstPercentage =
    pricing?.gstPercentage ?? drugEntry?.gstPercentage ?? productData?.gstPercentage ?? null;
  const hsnCode =
    pricing?.hsnCode ?? drugEntry?.hsnCode ?? productData?.hsnCode ?? null;

  /* Shelf life — pricingDetails.shelfLifeMonths OR consumable string field */
  const shelfLifeDisplay =
    pricing?.shelfLifeMonths != null
      ? `${pricing.shelfLifeMonths} months`
      : consAttr?.shelfLife ?? drugEntry?.shelfLife ?? null;

  /* Additional discounts — API uses effectiveStartDate / effectiveEndDate */
  const additionalDiscounts: AdditionalDiscount[] = (
    pricing?.additionalDiscounts ?? []
  ).filter((d) => d.minimumPurchaseQuantity && d.additionalDiscountPercentage);

  /* Pack size summary */
  const unitsPerPack =
    packaging?.unitPerPack ?? packaging?.unitsPerPack ?? packaging?.numberOfUnits;
  const packSizeDisplay =
    packaging?.numberOfPacks != null && unitsPerPack != null
      ? `${packaging.numberOfPacks} packs × ${unitsPerPack} units = ${(
          packaging.numberOfPacks * unitsPerPack
        ).toLocaleString()} units`
      : null;

  /* Images */
  const resolveProductImages = (data: ProductApiData | null): string[] => {
    if (!data) return [];
    if (Array.isArray(data.productImages)) {
      const urls = data.productImages
        .map((img) => img?.productImage || img?.imageUrl || img?.url || img?.imagePath || "")
        .filter((url) => validUrl(url) !== null);
      if (urls.length) return urls;
    }
    if (Array.isArray(data.images)) {
      const urls = data.images.filter((u) => validUrl(u) !== null);
      if (urls.length) return urls;
    }
    if (Array.isArray(data.imageUrls)) {
      const urls = data.imageUrls.filter((u) => validUrl(u) !== null);
      if (urls.length) return urls;
    }
    return [];
  };

  const productImages = resolveProductImages(productData);
  const displayImages = productImages.length > 0 ? productImages : [PLACEHOLDER_IMAGE];

  /* ── Navigation handlers ── */
  /** Close → always back to dashboard list */
  const handleClose = () => setCurrentView("dashboard" as DashboardView);

  /**
   * Edit → route to the category-specific edit form.
   * categoryId is read from the fetched product data first,
   * then falls back to the prop passed from ProductList.
   */
  const handleEdit = () => {
    const catId = resolvedCategoryId;
    const editView = catId != null ? CATEGORY_EDIT_VIEW[catId] : null;
    setCurrentView(editView ?? ("editDrug" as DashboardView));
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div
        style={{ width: "100%", background: "var(--base-white)", borderRadius: 16, padding: 24 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 256, background: "#F5F5F5", borderRadius: 12 }} />
          <div style={{ height: 24, background: "#F5F5F5", borderRadius: 6, width: "66%" }} />
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div
        style={{
          width: "100%",
          background: "var(--base-white)",
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
          color: "#5A5B58",
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 16,
          fontWeight: 400,
        }}
      >
        Product not found.
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
        background: "var(--base-white)",
        overflow: "hidden",
        borderRadius: 16,
        outline: "1px #D5D5D4 solid",
        outlineOffset: -1,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          alignSelf: "stretch",
          paddingTop: 24,
          background: "var(--base-white)",
          borderBottom: "1px #D5D5D4 solid",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1
            style={{
              color: "black",
              fontSize: 38,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 400,
              lineHeight: "42px",
              margin: 0,
            }}
          >
            Product Preview
          </h1>
          <p
            style={{
              color: "#5A5B58",
              fontSize: 16,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 400,
              lineHeight: "22px",
              margin: 0,
            }}
          >
            Complete product information
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Close → dashboard */}
          <button
            onClick={handleClose}
            style={{
              height: 48,
              minWidth: 108,
              padding: "8px 16px",
              borderRadius: 12,
              outline: "2px #9F75FC solid",
              outlineOffset: -1,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#9F75FC",
              fontSize: 16,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 600,
              lineHeight: "22px",
            }}
          >
            Close
          </button>

          {/* Edit → category-specific edit form */}
          <button
            onClick={handleEdit}
            style={{
              height: 48,
              minWidth: 108,
              padding: "12px 16px",
              background: "var(--primary-900)",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              color: "white",
              fontSize: 16,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 600,
              lineHeight: "22px",
            }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* ── PRODUCT DETAILS ── */}
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid" }}>
          <h2
            style={{
              color: "#101828",
              fontSize: 28,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 600,
              lineHeight: "32px",
              margin: 0,
            }}
          >
            Product Details
          </h2>
        </div>

        {/* ── Images ── */}
        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
          <p
            style={{
              color: "#1E1E1D",
              fontSize: 18,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 600,
              lineHeight: "24px",
              margin: 0,
            }}
          >
            Product Images
          </p>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {displayImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                style={{
                  flex: "1 1 0",
                  height: 276,
                  position: "relative",
                  boxShadow:
                    "0px 2px 4px -2px rgba(0,0,0,0.10), 0px 4px 6px -1px rgba(0,0,0,0.10)",
                  overflow: "hidden",
                  borderRadius: 12,
                  outline:
                    idx === selectedImageIndex ? "2px var(--primary-300) solid" : "none",
                  outlineOffset: -2,
                  cursor: "pointer",
                }}
              >
                <Image
                  src={img}
                  alt={`Product image ${idx + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized={img.startsWith("http")}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                  }}
                />
                {idx === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      padding: "4px 8px",
                      background: "var(--primary-300)",
                      borderRadius: 4,
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        fontSize: 12,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 600,
                        lineHeight: "18px",
                      }}
                    >
                      Primary
                    </span>
                  </div>
                )}
              </div>
            ))}
            {/* Empty placeholder slots to fill up to 4 */}
            {Array.from({ length: Math.max(0, 4 - displayImages.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  flex: "1 1 0",
                  height: 276,
                  borderRadius: 12,
                  background: "#F5F5F5",
                  boxShadow: "0px 1px 2px -1px rgba(0,0,0,0.10)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Two-column fields ── */}
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>

          {/* ── LEFT column ── */}
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <FieldRow label="Product Name" value={productData.productName} multiline />

            {/* ── Drug-specific fields ── */}
            {drugEntry && (
              <>
                <FieldRow label="Therapeutic Category" value={therapeuticCategory} />
                <FieldRow label="Therapeutic Subcategory" value={therapeuticSubcategory} />
                <FieldRow label="Dosage Form (Tablet, Syrup)" value={dosageForm} />

                {/* Molecule 1 — from molecules[0].strength */}
                <div style={{ ...ROW, alignItems: "center" }}>
                  <div style={ROW_LABEL}>
                    <span style={LABEL_TEXT}>Molecule 1:</span>
                    <span style={REQUIRED_STAR}>*</span>
                  </div>
                  <div
                    style={{
                      flex: "1 1 0",
                      display: "flex",
                      gap: 16,
                      justifyContent: "flex-end",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "#3C3D3A",
                        fontSize: 16,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 400,
                        lineHeight: "22px",
                      }}
                    >
                      {molecule1?.moleculeName ?? drugEntry?.molecule1Name ?? "—"}
                    </span>
                    <span
                      style={{
                        color: "#3C3D3A",
                        fontSize: 16,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 700,
                        lineHeight: "22px",
                      }}
                    >
                      {molecule1?.strength != null
                        ? formatStrength(molecule1.strength)
                        : drugEntry?.molecule1Strength != null
                        ? formatStrength(drugEntry.molecule1Strength)
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Molecule 2 — from molecules[1].strength */}
                <div style={{ ...ROW, alignItems: "center" }}>
                  <div style={ROW_LABEL}>
                    <span style={LABEL_TEXT}>Molecule 2</span>
                    <span style={REQUIRED_STAR}>*</span>
                  </div>
                  <div
                    style={{
                      flex: "1 1 0",
                      display: "flex",
                      gap: 16,
                      justifyContent: "flex-end",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "#3C3D3A",
                        fontSize: 16,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 400,
                        lineHeight: "22px",
                      }}
                    >
                      {molecule2?.moleculeName ?? drugEntry?.molecule2Name ?? "—"}
                    </span>
                    <span
                      style={{
                        color: "#3C3D3A",
                        fontSize: 16,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 700,
                        lineHeight: "22px",
                      }}
                    >
                      {molecule2?.strength != null
                        ? formatStrength(molecule2.strength)
                        : drugEntry?.molecule2Strength != null
                        ? formatStrength(drugEntry.molecule2Strength)
                        : "—"}
                    </span>
                  </div>
                </div>

                <FieldRow label="Drug Schedule" value={drugSchedule} />
                <FieldRow
                  label="Mechanism of Action (MoA)"
                  value={mechanismOfAction}
                  multiline
                />
              </>
            )}

            {/* ── Non-Consumable specific fields ── */}
            {ncAttr && (
              <>
                <FieldRow label="Brand Name" value={ncAttr.brandName} />
                <FieldRow label="Model Name" value={ncAttr.modelName} />
                <FieldRow label="Model Number" value={ncAttr.modelNumber} />
                <FieldRow label="Device Classification" value={ncAttr.deviceClassification} />
                <FieldRow label="Device Category" value={ncAttr.deviceName} />
                <FieldRow label="Device Sub-Category" value={ncAttr.deviceSubCategoryName} />
                <FieldRow label="UDI Number" value={ncAttr.udiNumber} />
                <FieldRow
                  label="Warranty Period"
                  value={
                    ncAttr.warrantyPeriod != null ? `${ncAttr.warrantyPeriod} months` : null
                  }
                />
                <FieldRow label="Country of Origin" value={ncAttr.countryName} />
                <FieldRow label="Power Source" value={ncAttr.powerSourceName} />
                <FieldRow
                  label="Material Type"
                  value={ncAttr.materialTypes?.map((m) => m.materialTypeName).join(", ")}
                />
                <FieldRow
                  label="Key Features / Specifications"
                  value={ncAttr.keyFeaturesSpecifications}
                  multiline
                />
              </>
            )}

            {/* ── Consumable specific fields ── */}
            {consAttr && (
              <>
                <FieldRow label="Brand Name" value={consAttr.brandName} />
                <FieldRow label="Sterile / Non-Sterile" value={consAttr.sterileOrNonSterile} />
                <FieldRow label="Disposal / Reusable" value={consAttr.disposalOrReusable} />
                <FieldRow
                  label="Material Type"
                  value={consAttr.materialTypes?.map((m) => m.materialTypeName).join(", ")}
                />
                <FieldRow
                  label="Key Features / Specifications"
                  value={consAttr.keyFeaturesSpecifications}
                  multiline
                />
                <FieldRow
                  label="Safety Instructions"
                  value={consAttr.safetyInstructions}
                  multiline
                />
              </>
            )}

            {/* Storage Condition — universal field shown for all categories */}
            <FieldRow label="Storage Condition" value={storageCondition} multiline />
          </div>

          {/* ── RIGHT column ── */}
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <FieldRow label="Primary Use" value={primaryUse} />
            <FieldRow label="Manufacturer Name" value={manufacturerName} />

            {/* Brochure */}
            <div
              style={{
                padding: "12px 16px 8px",
                borderBottom: "1px #D5D5D4 solid",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={LABEL_TEXT}>Uploaded Product Brochure</span>
                <span style={REQUIRED_STAR}>*</span>
              </div>
              {brochureUrl ? (
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    background: "#F5F5F5",
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  <FileText size={24} color="#3C3D3A" />
                  <span
                    style={{
                      color: "#3C3D3A",
                      fontSize: 16,
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 400,
                      lineHeight: "22px",
                    }}
                  >
                    product-brochure.pdf
                  </span>
                </a>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    background: "#F5F5F5",
                    borderRadius: 8,
                  }}
                >
                  <FileText size={24} color="#3C3D3A" />
                  <span
                    style={{
                      color: "#5A5B58",
                      fontSize: 16,
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 400,
                      lineHeight: "22px",
                    }}
                  >
                    No brochure uploaded
                  </span>
                </div>
              )}
            </div>

            {/* Certificate Documents — rendered when certs exist (non-consumable / consumable) */}
            {certDocs.length > 0 && (
              <div
                style={{
                  padding: "12px 16px 8px",
                  borderBottom: "1px #D5D5D4 solid",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={LABEL_TEXT}>Certificate Documents</span>
                  <span style={REQUIRED_STAR}>*</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {certDocs.map((cert) => (
                    <button
                      key={cert.certificationId}
                      type="button"
                      onClick={() => {
                        setActiveCertDoc(cert);
                        setShowCertModal(true);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        background: "var(--secondary-50, #F3E8FF)",
                        border: "1px solid var(--secondary-200, #D8B4FE)",
                        borderRadius: 9999,
                        cursor: "pointer",
                        fontFamily: "'Open Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--secondary-700, #7E22CE)",
                      }}
                    >
                      <PiSealCheckLight size={14} />
                      {cert.certificationName ?? `Cert ${cert.certificationId}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings & Precautions */}
            <div
              style={{
                padding: "12px 16px 8px",
                borderBottom: "1px #D5D5D4 solid",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={LABEL_TEXT}>Warnings &amp; Precautions</span>
                <span style={REQUIRED_STAR}>*</span>
              </div>
              <p
                style={{
                  color: "#3C3D3A",
                  fontSize: 16,
                  fontFamily: "'Open Sans', sans-serif",
                  fontWeight: 400,
                  lineHeight: "22px",
                  margin: 0,
                }}
              >
                {warningsPrecautions ?? "—"}
              </p>
            </div>

            {/* Product Description */}
            <div
              style={{
                padding: "12px 16px 8px",
                borderBottom: "1px #D5D5D4 solid",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={LABEL_TEXT}>Product Description</span>
                <span style={REQUIRED_STAR}>*</span>
              </div>
              <p
                style={{
                  color: "#3C3D3A",
                  fontSize: 16,
                  fontFamily: "'Open Sans', sans-serif",
                  fontWeight: 400,
                  lineHeight: "22px",
                  margin: 0,
                }}
              >
                {productDescription ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PACKAGING & ORDER DETAILS ── */}
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle>Packaging &amp; Order Details</SectionTitle>
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <FieldRow
              label="Pack Type"
              value={packaging?.packTypeName ?? packaging?.packType}
            />
            <FieldRow
              label="Number of Units per Pack Type"
              value={
                packaging?.numberOfUnits ?? packaging?.unitPerPack ?? packaging?.unitsPerPack
              }
            />
            <FieldRow
              label="Number of Packs"
              value={
                packaging?.numberOfPacks != null ? `${packaging.numberOfPacks} Box` : null
              }
            />
            <FieldRow
              label="Pack Size (No. of packs × No. of Units per pack type)"
              value={packSizeDisplay}
              multiline
            />
          </div>
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "8px", borderBottom: "1px #D5D5D4 solid" }}>
              <span
                style={{
                  color: "#1E1E1D",
                  fontSize: 20,
                  fontFamily: "'Open Sans', sans-serif",
                  fontWeight: 600,
                  lineHeight: "24px",
                }}
              >
                Order Details
              </span>
            </div>
            <FieldRow label="Min Order Qty" value={packaging?.minimumOrderQuantity} />
            <FieldRow label="Max Order Qty" value={packaging?.maximumOrderQuantity} />
          </div>
        </div>
      </div>

      {/* ── BATCH MANAGEMENT + PRICING ── */}
      <div
        style={{ display: "flex", gap: 36, alignItems: "flex-start", alignSelf: "stretch" }}
      >
        {/* Batch Management */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionTitle>Batch Management</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <FieldRow label="Batch Number" value={pricing?.batchLotNumber} />
            <FieldRow
              label="Manufacturing Date"
              value={formatDate(pricing?.manufacturingDate)}
            />
            <FieldRow label="Expiry Date" value={formatDate(pricing?.expiryDate)} />
            <FieldRow
              label="Stock Quantity (in terms of Pack Size)"
              value={
                pricing?.stockQuantity != null
                  ? `${pricing.stockQuantity.toLocaleString()} units`
                  : null
              }
            />
            <FieldRow
              label="Date of Stock Entry"
              value={formatDate(pricing?.dateOfStockEntry)}
            />
            {/* Shelf life from pricingDetails.shelfLifeMonths OR consumable's shelfLife string */}
            <FieldRow label="Shelf Life" value={shelfLifeDisplay} />
          </div>
        </div>

        {/* Pricing */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionTitle>Pricing</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <FieldRow
              label="MRP (per Pack Size)"
              value={
                pricing?.mrp != null ? `₹${pricing.mrp.toLocaleString()}` : null
              }
            />
            <FieldRow
              label="Selling Price (per Pack Size)"
              value={
                pricing?.sellingPrice != null
                  ? `₹${pricing.sellingPrice.toLocaleString()}`
                  : null
              }
            />
            <FieldRow
              label="Discount Percentage"
              value={
                pricing?.discountPercentage != null
                  ? `${pricing.discountPercentage}%`
                  : null
              }
            />

            {/* Additional Discounts */}
            {additionalDiscounts.length > 0 && (
              <>
                <div style={{ padding: "12px 8px 8px" }}>
                  <span
                    style={{
                      color: "#5A5B58",
                      fontSize: 18,
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 600,
                      lineHeight: "24px",
                    }}
                  >
                    Additional Discounts Applied
                  </span>
                </div>
                {additionalDiscounts.map((d, i) => {
                  /* API uses effectiveStartDate / effectiveEndDate — legacy uses startDate/endDate */
                  const startDate = d.effectiveStartDate ?? d.startDate;
                  const endDate = d.effectiveEndDate ?? d.endDate;
                  return (
                    <div
                      key={d.additionalDiscountId ?? i}
                      style={{
                        padding: 12,
                        borderBottom: "1px #D5D5D4 solid",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            color: "#5A5B58",
                            fontSize: 14,
                            fontFamily: "'Open Sans', sans-serif",
                            fontWeight: 400,
                            lineHeight: "20px",
                            margin: 0,
                          }}
                        >
                          Bulk order discount ({d.minimumPurchaseQuantity}
                          {d.maximumPurchaseQuantity
                            ? `-${d.maximumPurchaseQuantity}`
                            : "+"}{" "}
                          units)
                          {startDate && endDate
                            ? `, (${formatDate(startDate)} – ${formatDate(endDate)})`
                            : ""}
                        </p>
                      </div>
                      <span
                        style={{
                          color: "#3C3D3A",
                          fontSize: 16,
                          fontFamily: "'Open Sans', sans-serif",
                          fontWeight: 600,
                          lineHeight: "22px",
                          textAlign: "right",
                          flexShrink: 0,
                          paddingLeft: 16,
                        }}
                      >
                        {d.additionalDiscountPercentage}%
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TAX & BILLING ── */}
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle>TAX &amp; BILLING</SectionTitle>
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 0" }}>
            {/* GST — from pricingDetails[0].gstPercentage */}
            <FieldRow
              label="GST %"
              value={gstPercentage != null ? `${gstPercentage}%` : null}
            />
          </div>
          <div style={{ flex: "1 1 0" }}>
            {/* HSN — from pricingDetails[0].hsnCode */}
            <FieldRow
              label="HSN Code"
              value={hsnCode != null ? String(hsnCode) : null}
            />
          </div>
        </div>
      </div>

      {/* ── CERTIFICATE MODAL ── */}
      {showCertModal && activeCertDoc && (
        <div
          onClick={() => {
            setShowCertModal(false);
            setActiveCertDoc(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.50)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 16,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: 672,
              margin: "0 16px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px #D5D5D4 solid",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "var(--primary-05)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PiSealCheckLight size={20} color="var(--secondary-700)" />
                </div>
                <div>
                  <p
                    style={{
                      color: "#1E1E1D",
                      fontSize: 16,
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 600,
                      lineHeight: "22px",
                      margin: 0,
                    }}
                  >
                    {activeCertDoc.certificationName ??
                      activeCertDoc.label ??
                      `Certificate ${activeCertDoc.certificationId}`}
                  </p>
                  <p
                    style={{
                      color: "#5A5B58",
                      fontSize: 12,
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 400,
                      lineHeight: "18px",
                      margin: 0,
                    }}
                  >
                    Certification Document
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <a
                  href={activeCertDoc.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--secondary-700)",
                    fontSize: 14,
                    fontFamily: "'Open Sans', sans-serif",
                    fontWeight: 600,
                    lineHeight: "20px",
                    textDecoration: "none",
                    padding: "6px 12px",
                    borderRadius: 8,
                  }}
                >
                  <ExternalLink size={14} /> Open
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setShowCertModal(false);
                    setActiveCertDoc(null);
                  }}
                  style={{  
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#5A5B58",
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: "#F5F5F5",
                padding: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
              }}
            >
              {isImageUrl(activeCertDoc.certificateUrl) ? (
                <img
                  src={activeCertDoc.certificateUrl}
                  alt={activeCertDoc.certificationName || "Certificate"}
                  style={{
                    maxWidth: "100%",
                    maxHeight: 600,
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
              ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
                <iframe
                  src={activeCertDoc.certificateUrl}
                  title="Certificate PDF"
                  style={{ width: "100%", height: 560, border: "none", borderRadius: 8 }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    padding: "32px 0",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: "var(--primary-05)",
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={32} color="var(--secondary-700)" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        color: "#1E1E1D",
                        fontSize: 16,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 600,
                        lineHeight: "22px",
                        margin: "0 0 8px",
                      }}
                    >
                      {activeCertDoc.certificationName ??
                        activeCertDoc.label ??
                        `Certificate ${activeCertDoc.certificationId}`}
                    </p>
                    <p
                      style={{
                        color: "#5A5B58",
                        fontSize: 14,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 400,
                        lineHeight: "20px",
                        margin: "0 0 16px",
                      }}
                    >
                      This file cannot be previewed in the browser.
                    </p>
                    <a
                      href={activeCertDoc.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "var(--secondary-700)",
                        color: "white",
                        fontSize: 14,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 600,
                        lineHeight: "20px",
                        padding: "10px 20px",
                        borderRadius: 8,
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={14} /> Open / Download
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Other certs strip */}
            {certDocs.length > 1 && (
              <div
                style={{
                  borderTop: "1px #D5D5D4 solid",
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  overflowX: "auto",
                }}
              >
                <span
                  style={{
                    color: "#5A5B58",
                    fontSize: 12,
                    fontFamily: "'Open Sans', sans-serif",
                    fontWeight: 400,
                    lineHeight: "18px",
                    flexShrink: 0,
                  }}
                >
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
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--secondary-700)",
                        background: "var(--secondary-50)",
                        fontSize: 12,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 600,
                        lineHeight: "18px",
                        padding: "6px 12px",
                        borderRadius: 9999,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <PiSealCheckLight size={12} />
                      {cert.certificationName ??
                        cert.label ??
                        `Cert ${cert.certificationId}`}
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