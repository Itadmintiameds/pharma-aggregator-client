"use client";

import React, { useState, useEffect } from "react";
import { DashboardView } from "@/src/types/seller/dashboard";
import { getDrugProductById } from "@/src/services/product/ProductService";
import { getPackTypeById } from "@/src/services/product/PackType";
import { getStorageConditionById } from "@/src/services/product/StorageCondition";
import {
  getTherapeuticCategory,
  getTherapeuticCategoryById,
  getTherapeuticSubcategory,
  getTherapeuticSubcategoryById,
} from "@/src/services/product/TherapeuticCategoryService";
import { getAllMolecules } from "@/src/services/product/MoleculeService";
import {
  getConsumableDeviceCategories,
  getConsumableDeviceSubCategories,
  getConsumableSpecificationUnitsBySubCategory,
} from "@/src/services/product/ConsumbaleService";
import {
  getCosmeticProductTypes,
  getCosmeticProductSubTypes,
  getCosmeticSkinTypes,
  getCosmeticHairTypes,
  getCosmeticAgeGroups,
  getCosmeticIntendedUseAreas,
  getCosmeticCountries,
  getCosmeticNetQuantityUnits,
} from "@/src/services/product/CosmeticService";
import SupplementDetailsView from "./SupplementDetailsView";
import ConsumableView from "./ConsumableView";
import NonConsumableView from "./NonConsumableView";
import CosmeticPersonalCareView from "./CosmeticView";
import FoodInfantView from "./FoodInfantView";
import { FileText } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

interface ProductViewProps {
  productId: string | null;
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
  effectiveStartDate?: string;
  effectiveEndDate?: string;
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

interface NonConsumableAttributes {
  brandName?: string;
  modelName?: string;
  modelNumber?: string;
  deviceClassification?: string;
  deviceName?: string;
  deviceCategoryName?: string;
  deviceSubCategoryName?: string;
  udiNumber?: string;
  udi?: string;
  purpose?: string;
  keyFeaturesSpecifications?: string;
  safetyInstructions?: string;
  amcAvailability?: boolean;
  serviceAvailability?: boolean;
  amcServiceAvailability?: string;
  warrantyPeriod?: string | number;
  manufacturerName?: string;
  countryName?: string;
  countryOfOrigin?: string;
  storageCondition?: string;
  storageConditionName?: string;
  storageConditionId?: number;
  materialTypes?: { materialTypeId: number; materialTypeName: string }[];
  materialBuildType?: string;
  powerSourceName?: string;
  powerSource?: string;
  certificateDocuments?: CertificateDocument[];
  brochurePath?: string;
  userManualUrl?: string;
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
  safetyInstructions?: string;
  dimensionSize?: string;
  materialTypes?: { materialTypeId: number; materialTypeName: string }[];
  deviceCategoryName?: string;
  deviceSubCategoryName?: string;
  usageType?: string;
  deviceCatId?: number | string;
  deviceSubCatId?: number | string;
}

export interface CosmeticAttributes {
  productType?: string;
  productSubtype?: string;
  productSubType?: string;
  brandName?: string;
  variantName?: string;
  VariantName?: string;
  gender?: string;
  Gender?: string;
  intendedUseArea?: string;
  intendedUseAreas?: string | string[];
  skinHairType?: string;
  skinTypes?: string | string[];
  hairTypes?: string | string[];
  ageGroup?: string;
  netQuantityStrength?: string;
  NetQuantityStrength?: string;
  netQuantity?: string;
  activeIngredients?: string;
  ActiveIngredients?: string;
  productClaims?: string;
  ProductClaims?: string;
  storageCondition?: string;
  storageConditionName?: string;
  storageConditionId?: number;
  manufacturerName?: string;
  countryOfOrigin?: string;
  countryName?: string;
  brochurePath?: string;
  BrochurePath?: string;
  certificateDocuments?: CertificateDocument[];
  productDescription?: string;
  warningsPrecautions?: string;
  WarningsPrecautions?: string;
  // Raw ID fields returned by the API
  productCategoryId?: number;
  productSubcategoryId?: number;
  productTypeId?: number;
  productSubTypeId?: number;
  ageGroupId?: number;
  countryId?: number;
  countryOfOriginId?: number;
  useAreaId?: (number | string)[];
  intendedUseAreaIds?: (number | string)[];
  intendedarea?: (number | string)[];
  skintypeId?: (number | string)[];
  skinTypeIds?: (number | string)[];
  hairType?: (number | string)[];
  hairTypeIds?: (number | string)[];
}

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
  drugAttributes?: DrugAttributeEntry;
  productAttributeSupplementsOrNutraceuticals?: any[];
  productAttributeCosmeticAndPersonalUse?: CosmeticAttributes[];
  productAttributeCosmeticPersonalCare?: CosmeticAttributes[];
  productAttributeCosmetics?: CosmeticAttributes[];
  cosmeticAttributes?: CosmeticAttributes;
  productAttributeFoodInfants?: any[];
  productMarketingUrl?: string;
  therapeuticCategory?: string;
  therapeuticSubcategory?: string;
  drugSchedule?: string;
  mechanismOfAction?: string;
  gstPercentage?: string | number;
  hsnCode?: string;
  specialOffers?: SpecialOffer[];
}

export interface SpecialOffer {
  offerId?: string;
  offerType?: "bogo" | "bulk" | "bundle" | "seasonal" | string;
  title: string;
  description: string;
  validFrom?: string;
  validTo?: string;
  discountPercentage?: number;
  icon?: string;
}

/* ─────────────────────────────────────────────────────────
   RESOLVED LOOKUPS STATE
───────────────────────────────────────────────────────── */

interface ResolvedLookups {
  packTypeName: string | null;
  storageConditionName: string | null;
  therapeuticCategoryName: string | null;
  therapeuticSubcategoryName: string | null;
  moleculeMap: Record<number, string>;
  moleculeDetailMap: Record<
    number,
    { drugSchedule?: string; mechanismOfAction?: string; primaryUse?: string }
  >;
  deviceCategoryName: string | null;
  deviceSubCategoryName: string | null;
  specificationUnitLabel: string | null;
  loading: boolean;
}

const INITIAL_LOOKUPS: ResolvedLookups = {
  packTypeName: null,
  storageConditionName: null,
  therapeuticCategoryName: null,
  therapeuticSubcategoryName: null,
  moleculeMap: {},
  moleculeDetailMap: {},
  deviceCategoryName: null,
  deviceSubCategoryName: null,
  specificationUnitLabel: null,
  loading: false,
};

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */

const PLACEHOLDER_IMAGE = "/assets/images/SellerMed.jpg";

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
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  alignItems: "center",
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
  color: "var(--Colors-Primary-Neutral-pneutral-700, #5A5B58)",
  fontSize: 16,
  fontFamily: "'Work Sans', sans-serif",
  fontWeight: 500,
  lineHeight: "24px",
  wordWrap: "break-word",
  margin: 0,
};

const REQUIRED_STAR: React.CSSProperties = {
  color: "var(--Colors-Warning-warning-500, #FF3B3B)",
  fontSize: 16,
  fontFamily: "'Work Sans', sans-serif",
  fontWeight: 500,
  lineHeight: "24px",
  wordWrap: "break-word",
  flexShrink: 0,
};

const VALUE_TEXT: React.CSSProperties = {
  color: "var(--Colors-Primary-Neutral-pneutral-800, #3C3D3A)",
  fontSize: 16,
  fontFamily: "'Noto Sans', sans-serif",
  fontWeight: 400,
  lineHeight: "24px",
  wordWrap: "break-word",
  textAlign: "right",
  flex: "1 1 0",
  margin: 0,
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

const formatStrength = (s?: string | number | null): string => {
  if (s == null) return "—";
  const str = String(s).trim();
  const m = str.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z%µ]+)?$/);
  if (m) return `${m[1]} ${m[2] ?? "mg"}`;
  return str;
};

const validUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const t = url.trim().toUpperCase();
  if (["", "PENDING", "NOT_UPLOADED"].includes(t)) return null;
  return url.trim();
};

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const toPositiveInt = (val: unknown): number | null => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 && Number.isInteger(n) ? n : null;
};

const resolveProductImages = (data: ProductApiData | null): string[] => {
  if (!data) return [];
  if (Array.isArray(data.productImages)) {
    const urls = data.productImages
      .map(
        (img) =>
          img?.productImage ||
          img?.imageUrl ||
          img?.url ||
          img?.imagePath ||
          "",
      )
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

/**
 * Extract raw cosmetic attributes from the API response.
 * Priority: productAttributeCosmeticAndPersonalUse → productAttributeCosmeticPersonalCare
 *         → productAttributeCosmetics → cosmeticAttributes
 */
const extractCosmeticAttr = (
  data: ProductApiData,
): CosmeticAttributes | null => {
  const arr =
    (data.productAttributeCosmeticAndPersonalUse ?? []).length > 0
      ? data.productAttributeCosmeticAndPersonalUse!
      : (data.productAttributeCosmeticPersonalCare ?? []).length > 0
        ? data.productAttributeCosmeticPersonalCare!
        : (data.productAttributeCosmetics ?? []).length > 0
          ? data.productAttributeCosmetics!
          : null;

  if (arr && arr.length > 0) return arr[0];
  return data.cosmeticAttributes ?? null;
};

/**
 * Convert a master-data API result into {value, label} option pairs,
 * trying multiple possible key names in order.
 */
function toSelectOpts(
  result: PromiseSettledResult<any>,
  valueKeys: string[],
  labelKeys: string[],
): { value: string; label: string }[] {
  if (result.status !== "fulfilled") return [];
  return (result.value as any[])
    .map((item) => {
      const value = valueKeys.map((k) => item[k]).find((v) => v != null);
      const label = labelKeys.map((k) => item[k]).find((v) => v != null);
      return value != null && label != null
        ? { value: String(value), label: String(label) }
        : null;
    })
    .filter(Boolean) as { value: string; label: string }[];
}

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
      <div
        style={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end" }}
      >
        {valueNode}
      </div>
    ) : (
      <p style={VALUE_TEXT}>{value ?? "—"}</p>
    )}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      paddingTop: 8,
      paddingBottom: 8,
      borderBottom: "1px solid #D5D5D4",
    }}
  >
    <h2
      style={{
        color: "#1E1E1D",
        fontSize: 28,
        fontFamily: "'Work Sans', sans-serif",
        fontWeight: 500,
        lineHeight: "36px",
        margin: 0,
      }}
    >
      {children}
    </h2>
  </div>
);

/* ─────────────────────────────────────────────────────────
   SPECIAL OFFERS SECTION
───────────────────────────────────────────────────────── */

const OFFER_COLORS: Record<
  string,
  { bg: string; border: string; titleColor: string; iconBg: string }
> = {
  bogo: {
    bg: "#F0FDF4",
    border: "#86EFAC",
    titleColor: "#15803D",
    iconBg: "#DCFCE7",
  },
  bulk: {
    bg: "#FAF5FF",
    border: "#D8B4FE",
    titleColor: "#7E22CE",
    iconBg: "#F3E8FF",
  },
  bundle: {
    bg: "#FFFBEB",
    border: "#FCD34D",
    titleColor: "#92400E",
    iconBg: "#FEF3C7",
  },
  seasonal: {
    bg: "#EFF6FF",
    border: "#93C5FD",
    titleColor: "#1D4ED8",
    iconBg: "#DBEAFE",
  },
};

const OFFER_ICONS: Record<string, string> = {
  bogo: "🎁",
  bulk: "📦",
  bundle: "🔒",
  seasonal: "🏷️",
};

const SpecialOffersSection = ({ offers }: { offers: SpecialOffer[] }) => {
  if (!offers || offers.length === 0) return null;
  return (
    <div
      style={{
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <SectionTitle>Special Offers &amp; Promotional Schemes</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {offers.map((offer, idx) => {
          const type = offer.offerType ?? "bogo";
          const colors = OFFER_COLORS[type] ?? OFFER_COLORS.bogo;
          const icon = OFFER_ICONS[type] ?? "🎁";
          const validText =
            offer.validFrom && offer.validTo
              ? `Valid: ${formatDate(offer.validFrom)} - ${formatDate(offer.validTo)}`
              : null;
          return (
            <div
              key={offer.offerId ?? idx}
              style={{
                padding: 16,
                background: colors.bg,
                border: `1.5px solid ${colors.border}`,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: colors.iconBg,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  {icon}
                </div>
                <span
                  style={{
                    color: colors.titleColor,
                    fontSize: 16,
                    fontFamily: "'Work Sans', sans-serif",
                    fontWeight: 600,
                    lineHeight: "22px",
                  }}
                >
                  {offer.title}
                </span>
              </div>
              <p
                style={{
                  color: "#3C3D3A",
                  fontSize: 13,
                  fontFamily: "'Noto Sans', sans-serif",
                  fontWeight: 400,
                  lineHeight: "20px",
                  margin: 0,
                }}
              >
                {offer.description}
              </p>
              {validText && (
                <p
                  style={{
                    color: colors.titleColor,
                    fontSize: 12,
                    fontFamily: "'Noto Sans', sans-serif",
                    fontWeight: 400,
                    lineHeight: "18px",
                    margin: 0,
                    opacity: 0.8,
                  }}
                >
                  {validText}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */

const ProductView1 = ({
  productId,
  categoryId: categoryIdProp,
  setCurrentView,
}: ProductViewProps) => {
  const [productData, setProductData] = useState<ProductApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookups, setLookups] = useState<ResolvedLookups>(INITIAL_LOOKUPS);
  // Holds the fully-resolved cosmetic attribute object (IDs → labels)
  const [resolvedCosAttr, setResolvedCosAttr] =
    useState<CosmeticAttributes | null>(null);
  const [cosAttrLoading, setCosAttrLoading] = useState(false);

  /* ── 1. Fetch product ── */
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setLookups(INITIAL_LOOKUPS);
    setResolvedCosAttr(null);
    (async () => {
      try {
        const response = (await getDrugProductById(
          productId,
        )) as ProductApiData;
        setProductData(response);
      } catch (err) {
        console.error("[ProductView] Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  /* ── 2. All secondary lookups — one effect, all parallel ── */
  useEffect(() => {
    if (!productData) return;

    const packaging: PackagingDetails | undefined = Array.isArray(
      productData.packagingDetails,
    )
      ? productData.packagingDetails[0]
      : productData.packagingDetails;

    const drugEntry: DrugAttributeEntry | null =
      (productData.productAttributeDrugs ?? []).length > 0
        ? productData.productAttributeDrugs![0]
        : (productData.drugAttributes ?? null);

    const consAttr: ConsumableAttributes | null =
      (productData.productAttributeConsumableMedicals ?? []).length > 0
        ? productData.productAttributeConsumableMedicals![0]
        : null;

    const ncAttr: NonConsumableAttributes | null =
      (productData.productAttributeNonConsumableMedicals ?? []).length > 0
        ? productData.productAttributeNonConsumableMedicals![0]
        : (productData.nonConsumableAttributes ?? null);

    const cosAttrRaw: CosmeticAttributes | null =
      extractCosmeticAttr(productData);

    setLookups((prev) => ({ ...prev, loading: true }));

    // ── Pack type ──
    const packId = toPositiveInt(packaging?.packId);
    const inlinePackName =
      packaging?.packTypeName?.trim() || packaging?.packType?.trim() || null;

    const fetchPackType = async (): Promise<Partial<ResolvedLookups>> => {
      if (inlinePackName) return { packTypeName: inlinePackName };
      if (packId === null) return {};
      try {
        const data = await getPackTypeById(packId);
        const name = data?.packType ?? data?.packTypeName ?? data?.name ?? null;
        return { packTypeName: name ? String(name).trim() : null };
      } catch {
        return {};
      }
    };

    // ── Storage condition ──
    const inlineStorageName =
      drugEntry?.storageConditionName?.trim() ||
      drugEntry?.storageCondition?.trim() ||
      ncAttr?.storageConditionName?.trim() ||
      ncAttr?.storageCondition?.trim() ||
      consAttr?.storageConditionName?.trim() ||
      consAttr?.storageCondition?.trim() ||
      cosAttrRaw?.storageConditionName?.trim() ||
      cosAttrRaw?.storageCondition?.trim() ||
      null;

    const rawStorageId =
      (consAttr as any)?.storageConditionId ??
      (consAttr as any)?.storageCondition_id ??
      (consAttr as any)?.storage_condition_id ??
      (consAttr as any)?.storageconditionid ??
      ncAttr?.storageConditionId ??
      cosAttrRaw?.storageConditionId ??
      (Array.isArray(drugEntry?.storageConditionIds) &&
      (drugEntry?.storageConditionIds?.length ?? 0) > 0
        ? drugEntry!.storageConditionIds![0]
        : undefined);

    const storageId = toPositiveInt(rawStorageId);

    const fetchStorageCondition = async (): Promise<
      Partial<ResolvedLookups>
    > => {
      if (inlineStorageName) return { storageConditionName: inlineStorageName };
      if (storageId === null) {
        console.warn(
          "[ProductView] storageConditionId missing for product",
          productData?.productId,
          "| consAttr keys:",
          consAttr ? Object.keys(consAttr) : "n/a",
        );
        return {};
      }
      try {
        const data = await getStorageConditionById(storageId);
        const name =
          data?.conditionName ??
          data?.storageConditionName ??
          data?.name ??
          data?.condition ??
          null;
        return { storageConditionName: name ? String(name).trim() : null };
      } catch (e) {
        console.error(
          "[ProductView] fetchStorageCondition failed for id",
          storageId,
          e,
        );
        return {};
      }
    };

    // ── Therapeutic category ──
    const catId = toPositiveInt(drugEntry?.therapeuticCategoryId);

    const inlineCatName =
      drugEntry?.therapeuticCategoryName?.trim() ||
      productData.therapeuticCategory?.trim() ||
      null;

    const fetchTherapeuticCategory = async (): Promise<
      Partial<ResolvedLookups>
    > => {
      if (inlineCatName) {
        return { therapeuticCategoryName: inlineCatName };
      }

      if (catId === null) {
        return {};
      }

      try {
        const data = await getTherapeuticCategoryById(String(catId));

        const categoryData = Array.isArray(data)
          ? data[0]
          : data?.content
            ? data.content
            : data;

        const name =
          categoryData?.therapeuticCategory ||
          categoryData?.therapeuticCategoryName ||
          categoryData?.categoryName ||
          categoryData?.name ||
          null;

        return {
          therapeuticCategoryName: name ? String(name).trim() : null,
        };
      } catch (error) {
        console.error("Failed to fetch therapeutic category:", error);
        return {};
      }
    };
    // ── Therapeutic subcategory ──
    const subId = drugEntry?.therapeuticSubcategoryId;
    const inlineSubName =
      drugEntry?.therapeuticSubcategoryName?.trim() ||
      productData.therapeuticSubcategory?.trim() ||
      null;

    const fetchTherapeuticSubcategory = async (): Promise<
      Partial<ResolvedLookups>
    > => {
      if (inlineSubName) {
        return {
          therapeuticSubcategoryName: inlineSubName,
        };
      }

      // Handle null / undefined
      if (!subId) {
        return {};
      }

      try {
        const data = await getTherapeuticSubcategoryById(String(subId));
        const subcategoryData = Array.isArray(data)
          ? data[0]
          : data?.content
            ? data.content
            : data;

        const name =
          subcategoryData?.therapeuticSubcategory ||
          subcategoryData?.therapeuticSubcategoryName ||
          subcategoryData?.subcategoryName ||
          subcategoryData?.name ||
          null;

        return {
          therapeuticSubcategoryName: name ? String(name).trim() : null,
        };
      } catch (error) {
        console.error("Failed to fetch therapeutic subcategory:", error);
        return {};
      }
    };

    // ── Molecules ──
    const moleculesInEntry = drugEntry?.molecules ?? [];
    const needsMoleculeData =
      drugEntry != null && moleculesInEntry.some((m) => m.moleculeId != null);

    const fetchMolecules = async (): Promise<Partial<ResolvedLookups>> => {
      if (!needsMoleculeData) return {};
      try {
        const allMolecules: any[] = await getAllMolecules();
        const moleculeMap = {} as Record<number, string>;
        const moleculeDetailMap = {} as Record<number, any>;
        (allMolecules ?? []).forEach((m) => {
          if (m.moleculeId != null) {
            moleculeMap[m.moleculeId] = m.moleculeName;
            moleculeDetailMap[m.moleculeId] = {
              drugSchedule: m.drugSchedule,
              mechanismOfAction: m.mechanismOfAction,
              primaryUse: m.primaryUse,
            };
          }
        });
        return { moleculeMap, moleculeDetailMap };
      } catch {
        return {};
      }
    };

    // ── Consumable: device category & subcategory ──
    const inlineDeviceCatName = consAttr?.deviceCategoryName?.trim() || null;
    const inlineDeviceSubCatName =
      consAttr?.deviceSubCategoryName?.trim() || null;
    const deviceCatId = toPositiveInt(consAttr?.deviceCatId);
    const deviceSubCatId = toPositiveInt(consAttr?.deviceSubCatId);

    const fetchDeviceNames = async (): Promise<Partial<ResolvedLookups>> => {
      if (!consAttr) return {};
      let deviceCategoryName: string | null = inlineDeviceCatName;
      let deviceSubCategoryName: string | null = inlineDeviceSubCatName;

      if (!deviceCategoryName && deviceCatId !== null) {
        try {
          const cats: any[] = await getConsumableDeviceCategories();
          const found = cats.find(
            (c) => Number(c.deviceCatId ?? c.id) === deviceCatId,
          );
          if (found)
            deviceCategoryName =
              String(found.deviceName ?? found.name ?? "").trim() || null;
        } catch {
          /* ignore */
        }
      }

      if (
        !deviceSubCategoryName &&
        deviceCatId !== null &&
        deviceSubCatId !== null
      ) {
        try {
          const subCats: any[] = await getConsumableDeviceSubCategories(
            String(deviceCatId),
          );
          const found = subCats.find(
            (s) =>
              Number(s.deviceSubCatId ?? s.subCategoryId ?? s.id) ===
              deviceSubCatId,
          );
          if (found)
            deviceSubCategoryName =
              String(
                found.deviceSubCatName ??
                  found.subCategoryName ??
                  found.name ??
                  "",
              ).trim() || null;
        } catch {
          /* ignore */
        }
      }

      let specificationUnitLabel: string | null = null;
      const specUnitId = toPositiveInt(
        (consAttr as any).deviceSpecificationUnitId,
      );
      if (deviceSubCatId !== null && specUnitId !== null) {
        try {
          const units: any[] =
            await getConsumableSpecificationUnitsBySubCategory(
              String(deviceSubCatId),
            );
          const found = units.find(
            (u) => Number(u.unitId ?? u.id) === specUnitId,
          );
          if (found)
            specificationUnitLabel =
              String(found.unitName ?? found.name ?? "").trim() || null;
        } catch {
          /* ignore */
        }
      }

      return {
        deviceCategoryName,
        deviceSubCategoryName,
        specificationUnitLabel,
      };
    };

    Promise.all([
      fetchPackType(),
      fetchStorageCondition(),
      fetchTherapeuticCategory(),
      fetchTherapeuticSubcategory(),
      fetchMolecules(),
      fetchDeviceNames(),
    ]).then((results) => {
      const merged = results.reduce(
        (acc, partial) => ({ ...acc, ...partial }),
        {} as Partial<ResolvedLookups>,
      );
      setLookups((prev) => ({ ...prev, ...merged, loading: false }));
    });
  }, [productData]);

  /* ── 3. Cosmetic master label resolution ── */
  useEffect(() => {
    if (!productData) return;

    const resolvedCategoryId: number | null =
      productData?.categoryId ?? categoryIdProp ?? null;
    const cosAttrRaw: CosmeticAttributes | null =
      extractCosmeticAttr(productData);

    // Only run for cosmetic products
    const isCosmetic =
      resolvedCategoryId === 4 ||
      (resolvedCategoryId == null && cosAttrRaw !== null);

    if (!isCosmetic || !cosAttrRaw) {
      setResolvedCosAttr(null);
      return;
    }

    setCosAttrLoading(true);

    (async () => {
      try {
        // ── Extract raw IDs from the attribute object (handle every casing variant) ──
        const productTypeIdStr = String(
          (cosAttrRaw as any).productCategoryId ??
            (cosAttrRaw as any).productTypeId ??
            "",
        );
        const productSubTypeIdStr = String(
          (cosAttrRaw as any).productSubcategoryId ??
            (cosAttrRaw as any).productSubTypeId ??
            "",
        );
        const ageGroupIdStr = String((cosAttrRaw as any).ageGroupId ?? "");
        // ageGroupIds is an array of IDs (may include 0 as sentinel); filter those out
        const rawAgeGroupIds: string[] = Array.isArray(
          (cosAttrRaw as any).ageGroupIds,
        )
          ? (cosAttrRaw as any).ageGroupIds
              .filter((v: unknown) => Number(v) > 0)
              .map(String)
          : ageGroupIdStr && ageGroupIdStr !== "0"
            ? [ageGroupIdStr]
            : [];
        const countryIdStr = String(
          (cosAttrRaw as any).countryId ??
            (cosAttrRaw as any).countryOfOriginId ??
            "",
        );

        // Raw array IDs for multi-select fields
        const rawIntendedIds: string[] = (
          (cosAttrRaw as any).intendedUseAreaIds ??
          (cosAttrRaw as any).useAreaId ??
          (cosAttrRaw as any).intendedarea ??
          (cosAttrRaw as any).intendedUseAreas ?? // sometimes already strings, handled below
          []
        )
          .filter(
            (v: any) =>
              typeof v === "number" ||
              (typeof v === "string" && /^\d+$/.test(v)),
          )
          .map(String);

        const rawSkinIds: string[] = (
          (cosAttrRaw as any).skinTypeIds ??
          (cosAttrRaw as any).skintypeId ??
          (cosAttrRaw as any).skinType ??
          (cosAttrRaw as any).skinTypes ??
          []
        )
          .filter(
            (v: any) =>
              typeof v === "number" ||
              (typeof v === "string" && /^\d+$/.test(v)),
          )
          .map(String);

        const rawHairIds: string[] = (
          (cosAttrRaw as any).hairTypeIds ??
          (cosAttrRaw as any).hairType ??
          (cosAttrRaw as any).hairTypes ??
          []
        )
          .filter(
            (v: any) =>
              typeof v === "number" ||
              (typeof v === "string" && /^\d+$/.test(v)),
          )
          .map(String);

        // ── Extract net quantity unit ID ──
        const netQtyUnitIdStr = String(
          (cosAttrRaw as any).unitId ??
            (cosAttrRaw as any).netQuantityUnitId ??
            "",
        );

        // ── Fetch all needed masters in parallel ──
        const [
          productTypesResult,
          skinTypesResult,
          hairTypesResult,
          ageGroupsResult,
          intendedUseAreasResult,
          countriesResult,
          netQtyUnitsResult,
        ] = await Promise.allSettled([
          getCosmeticProductTypes(),
          getCosmeticSkinTypes(),
          getCosmeticHairTypes(),
          getCosmeticAgeGroups(),
          getCosmeticIntendedUseAreas(),
          getCosmeticCountries(),
          getCosmeticNetQuantityUnits(),
        ]);

        // ── Build option lists ──
        const productTypeOpts = toSelectOpts(
          productTypesResult,
          ["categoryId", "productTypeId", "id"],
          ["categoryName", "productTypeName", "name"],
        );
        const ageGroupOpts = toSelectOpts(
          ageGroupsResult,
          ["ageGroupId", "id"],
          ["ageGroupName", "name"],
        );
        const intendedOpts = toSelectOpts(
          intendedUseAreasResult,
          ["useAreaId", "id"],
          ["useAreaName", "name"],
        );
        const skinTypeOpts = toSelectOpts(
          skinTypesResult,
          ["skinTypeId", "id"],
          ["skinTypeName", "name"],
        );
        const hairTypeOpts = toSelectOpts(
          hairTypesResult,
          ["hairTypeId", "id"],
          ["hairTypeName", "name"],
        );
        const countryOpts = toSelectOpts(
          countriesResult,
          ["countryId", "id"],
          ["countryName", "name"],
        );

        // ── Resolve product type label ──
        const productTypeLabel =
          productTypeOpts.find((o) => o.value === productTypeIdStr)?.label ??
          null;

        // ── Resolve sub-type (requires a separate API call with the parent type ID) ──
        let productSubTypeLabel: string | null = null;
        if (productTypeIdStr) {
          try {
            const subTypes = await getCosmeticProductSubTypes(productTypeIdStr);
            const subTypeOpts = (subTypes as any[])
              .map((item) => {
                const value =
                  item.productSubTypeId ??
                  item.subcategoryId ??
                  item.subTypeId ??
                  item.id;
                const label =
                  item.productSubTypeName ??
                  item.subcategoryName ??
                  item.subTypeName ??
                  item.name;
                return value != null && label != null
                  ? { value: String(value), label: String(label) }
                  : null;
              })
              .filter(Boolean) as { value: string; label: string }[];
            productSubTypeLabel =
              subTypeOpts.find((o) => o.value === productSubTypeIdStr)?.label ??
              null;
          } catch {
            // leave null — not critical
          }
        }

        // ── Resolve array fields → comma-separated label strings ──
        const intendedUseArea =
          rawIntendedIds.length > 0
            ? rawIntendedIds
                .map((id) => intendedOpts.find((o) => o.value === id)?.label)
                .filter(Boolean)
                .join(", ")
            : null;

        const skinPart =
          rawSkinIds.length > 0
            ? rawSkinIds
                .map((id) => skinTypeOpts.find((o) => o.value === id)?.label)
                .filter(Boolean)
                .join(", ")
            : null;

        const hairPart =
          rawHairIds.length > 0
            ? rawHairIds
                .map((id) => hairTypeOpts.find((o) => o.value === id)?.label)
                .filter(Boolean)
                .join(", ")
            : null;

        const skinHairType =
          [skinPart, hairPart].filter(Boolean).join(", ") || null;

        // ── Resolve scalar fields that have inconsistent casing in the API ──
        const variantName =
          (cosAttrRaw as any).VariantName ??
          (cosAttrRaw as any).variantName ??
          null;

        const gender =
          (cosAttrRaw as any).Gender ?? (cosAttrRaw as any).gender ?? null;

        const activeIngredients =
          (cosAttrRaw as any).ActiveIngredients ??
          (cosAttrRaw as any).activeIngredients ??
          null;

        const netQtyValue =
          (cosAttrRaw as any).NetQuantityStrength ??
          (cosAttrRaw as any).netQuantityStrength ??
          (cosAttrRaw as any).netQuantity ??
          null;

        const netQtyUnitOpts = toSelectOpts(
          netQtyUnitsResult,
          ["netQuantityUnitId", "unitId", "id"],
          ["unitName", "unit", "name"],
        );
        const netQtyUnitLabel = netQtyUnitIdStr
          ? (netQtyUnitOpts.find((o) => o.value === netQtyUnitIdStr)?.label ??
            null)
          : null;

        const netQuantityStrength =
          netQtyValue != null
            ? [String(netQtyValue), netQtyUnitLabel].filter(Boolean).join(" ")
            : null;

        const productClaims =
          (cosAttrRaw as any).ProductClaims ??
          (cosAttrRaw as any).productClaims ??
          null;

        const warningsPrecautions =
          (cosAttrRaw as any).WarningsPrecautions ??
          (cosAttrRaw as any).warningsPrecautions ??
          null;

        // ── Build fully-resolved attr object ──
        setResolvedCosAttr({
          // Spread raw attr first so nothing is accidentally dropped
          ...cosAttrRaw,
          // Overwrite with resolved label strings
          productType: productTypeLabel ?? cosAttrRaw.productType,
          productSubtype: productSubTypeLabel ?? cosAttrRaw.productSubtype,
          ageGroup:
            (rawAgeGroupIds.length > 0
              ? rawAgeGroupIds
                  .map((id) => ageGroupOpts.find((o) => o.value === id)?.label)
                  .filter(Boolean)
                  .join(", ") || null
              : null) ?? cosAttrRaw.ageGroup,
          intendedUseArea: intendedUseArea ?? cosAttrRaw.intendedUseArea,
          skinHairType: skinHairType ?? cosAttrRaw.skinHairType,
          countryOfOrigin:
            countryOpts.find((o) => o.value === countryIdStr)?.label ??
            cosAttrRaw.countryOfOrigin ??
            cosAttrRaw.countryName,
          // Normalise inconsistently-cased scalar fields
          variantName: variantName ?? cosAttrRaw.variantName,
          gender: gender ?? cosAttrRaw.gender,
          activeIngredients: activeIngredients ?? cosAttrRaw.activeIngredients,
          netQuantityStrength:
            netQuantityStrength ?? cosAttrRaw.netQuantityStrength,
          productClaims: productClaims ?? cosAttrRaw.productClaims,
          warningsPrecautions:
            warningsPrecautions ?? cosAttrRaw.warningsPrecautions,
        });
      } catch (err) {
        console.error(
          "[ProductView] Failed to resolve cosmetic master labels:",
          err,
        );
        // Fallback: pass raw attr so the view at least renders whatever it has
        setResolvedCosAttr(cosAttrRaw);
      } finally {
        setCosAttrLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productData]);

  /* ─────────────────────────────────────────────────────
     DERIVED VALUES
  ───────────────────────────────────────────────────── */

  const packaging: PackagingDetails | undefined = Array.isArray(
    productData?.packagingDetails,
  )
    ? productData?.packagingDetails[0]
    : productData?.packagingDetails;

  const pricing: PricingDetails | undefined = productData?.pricingDetails?.[0];

  const ncAttr: NonConsumableAttributes | null =
    (productData?.productAttributeNonConsumableMedicals ?? []).length > 0
      ? productData!.productAttributeNonConsumableMedicals![0]
      : (productData?.nonConsumableAttributes ?? null);

  const consAttr: ConsumableAttributes | null =
    (productData?.productAttributeConsumableMedicals ?? []).length > 0
      ? productData!.productAttributeConsumableMedicals![0]
      : null;

  const drugEntry: DrugAttributeEntry | null =
    (productData?.productAttributeDrugs ?? []).length > 0
      ? productData!.productAttributeDrugs![0]
      : (productData?.drugAttributes ?? null);

  const suppAttr: any | null =
    (productData?.productAttributeSupplementsOrNutraceuticals ?? []).length > 0
      ? productData!.productAttributeSupplementsOrNutraceuticals![0]
      : null;

  const foodAttr: any | null =
    (productData?.productAttributeFoodInfants ?? []).length > 0
      ? productData!.productAttributeFoodInfants![0]
      : null;

  // Raw cosAttr — used only for category detection; rendered via resolvedCosAttr
  const cosAttrRaw: CosmeticAttributes | null = productData
    ? extractCosmeticAttr(productData)
    : null;

  const resolvedCategoryId: number | null =
    productData?.categoryId ?? categoryIdProp ?? null;

  const isConsumable =
    resolvedCategoryId === 5 ||
    (resolvedCategoryId == null && consAttr !== null);
  const isNonConsumable =
    resolvedCategoryId === 6 ||
    (resolvedCategoryId == null && ncAttr !== null && !isConsumable);
  const isCosmetic =
    resolvedCategoryId === 4 ||
    (resolvedCategoryId == null &&
      cosAttrRaw !== null &&
      !isConsumable &&
      !isNonConsumable);
  const isDrug =
    resolvedCategoryId === 1 ||
    (resolvedCategoryId == null &&
      drugEntry !== null &&
      !isConsumable &&
      !isNonConsumable &&
      !isCosmetic);
  const isSupplement =
    resolvedCategoryId === 2 ||
    (resolvedCategoryId == null &&
      suppAttr !== null &&
      !isConsumable &&
      !isNonConsumable &&
      !isDrug &&
      !isCosmetic);

  const isFoodInfant =
    resolvedCategoryId === 3 ||
    (resolvedCategoryId == null &&
      foodAttr !== null &&
      !isConsumable &&
      !isNonConsumable &&
      !isDrug &&
      !isSupplement &&
      !isCosmetic);

  const primaryMoleculeId: number | null =
    (drugEntry?.molecules ?? [])[0]?.moleculeId ?? null;

  const molecules = (drugEntry?.molecules ?? []).map((m, idx) => {
    const id = m.moleculeId;
    const name =
      m.moleculeName ??
      (id != null ? lookups.moleculeMap[id] : undefined) ??
      (idx === 0 ? drugEntry?.molecule1Name : drugEntry?.molecule2Name) ??
      null;
    const strength =
      m.strength != null
        ? m.strength
        : idx === 0
          ? drugEntry?.molecule1Strength
          : drugEntry?.molecule2Strength;
    return {
      ...m,
      resolvedName: name ?? "—",
      resolvedStrength: formatStrength(strength),
    };
  });

  const moleculesToDisplay =
    molecules.length > 0
      ? molecules
      : ([
          drugEntry?.molecule1Name || drugEntry?.molecule1Strength
            ? {
                resolvedName: drugEntry?.molecule1Name ?? "—",
                resolvedStrength: formatStrength(drugEntry?.molecule1Strength),
              }
            : null,
          drugEntry?.molecule2Name || drugEntry?.molecule2Strength
            ? {
                resolvedName: drugEntry?.molecule2Name ?? "—",
                resolvedStrength: formatStrength(drugEntry?.molecule2Strength),
              }
            : null,
        ].filter(Boolean) as {
          resolvedName: string;
          resolvedStrength: string;
        }[]);

  const drugSchedule =
    drugEntry?.drugSchedule ??
    productData?.drugSchedule ??
    (primaryMoleculeId != null
      ? lookups.moleculeDetailMap[primaryMoleculeId]?.drugSchedule
      : null) ??
    null;

  const mechanismOfAction =
    drugEntry?.mechanismOfAction ??
    productData?.mechanismOfAction ??
    (primaryMoleculeId != null
      ? lookups.moleculeDetailMap[primaryMoleculeId]?.mechanismOfAction
      : null) ??
    null;

  const primaryUse =
    drugEntry?.primaryUse ??
    drugEntry?.purpose ??
    ncAttr?.purpose ??
    suppAttr?.intendedUse ??
    (primaryMoleculeId != null
      ? lookups.moleculeDetailMap[primaryMoleculeId]?.primaryUse
      : null) ??
    null;

  const resolvedPackType =
    lookups.packTypeName ||
    packaging?.packTypeName?.trim() ||
    packaging?.packType?.trim() ||
    (lookups.loading
      ? "Loading…"
      : packaging?.packId != null
        ? `Pack #${packaging.packId}`
        : null);

  const storageCondition: string | null =
    lookups.storageConditionName ??
    drugEntry?.storageConditionName ??
    drugEntry?.storageCondition ??
    ncAttr?.storageConditionName ??
    ncAttr?.storageCondition ??
    consAttr?.storageConditionName ??
    consAttr?.storageCondition ??
    cosAttrRaw?.storageConditionName ??
    cosAttrRaw?.storageCondition ??
    suppAttr?.storageConditionName ??
    suppAttr?.storageCondition ??
    (lookups.loading ? "Loading…" : null);

  const therapeuticCategory =
    lookups.therapeuticCategoryName ??
    drugEntry?.therapeuticCategoryName ??
    productData?.therapeuticCategory ??
    (lookups.loading ? "Loading…" : null);

  const therapeuticSubcategory =
    lookups.therapeuticSubcategoryName ??
    drugEntry?.therapeuticSubcategoryName ??
    productData?.therapeuticSubcategory ??
    (lookups.loading ? "Loading…" : null);

  const dosageForm = drugEntry?.dosageForm ?? productData?.dosageForm ?? null;

  const manufacturerName =
    drugEntry?.manufacturerName ??
    pricing?.manufacturerName ??
    productData?.manufacturerName ??
    ncAttr?.manufacturerName ??
    suppAttr?.manufacturerName ??
    cosAttrRaw?.manufacturerName ??
    null;

  const warningsPrecautions =
    drugEntry?.warningsPrecautions ??
    productData?.warningsPrecautions ??
    suppAttr?.warningsPrecautions ??
    cosAttrRaw?.warningsPrecautions ??
    (cosAttrRaw as any)?.WarningsPrecautions ??
    null;

  const productDescription =
    drugEntry?.productDescription ??
    productData?.productDescription ??
    suppAttr?.productDescription ??
    cosAttrRaw?.productDescription ??
    null;

  const gstPercentage =
    pricing?.gstPercentage ??
    drugEntry?.gstPercentage ??
    productData?.gstPercentage ??
    null;

  const hsnCode =
    pricing?.hsnCode ?? drugEntry?.hsnCode ?? productData?.hsnCode ?? null;

  const shelfLifeDisplay =
    pricing?.shelfLifeMonths != null
      ? `${pricing.shelfLifeMonths} months`
      : (consAttr?.shelfLife ?? drugEntry?.shelfLife ?? null);

  // Batch Aggregation logic: scan all batches for offers
  const additionalDiscounts: AdditionalDiscount[] = (
    productData?.pricingDetails ?? []
  )
    .flatMap((p: any) => p.additionalDiscounts || [])
    .filter(
      (d: any) => d.minimumPurchaseQuantity && d.additionalDiscountPercentage,
    )
    .filter(
      (d: any, index: number, self: any[]) =>
        index ===
        self.findIndex(
          (t) =>
            t.minimumPurchaseQuantity === d.minimumPurchaseQuantity &&
            t.additionalDiscountPercentage === d.additionalDiscountPercentage,
        ),
    );

  const specialSchemes: any[] = (productData?.pricingDetails ?? [])
    .flatMap((p: any) => p.specialSchemes || [])
    .filter((s: any) => s.schemeName);

  const unitsPerPack =
    packaging?.unitPerPack ??
    packaging?.unitsPerPack ??
    packaging?.numberOfUnits;

  const packSizeDisplay =
    packaging?.numberOfPacks != null && unitsPerPack != null
      ? `${packaging.numberOfPacks} packs × ${unitsPerPack} units = ${(
          packaging.numberOfPacks * unitsPerPack
        ).toLocaleString()} units`
      : null;

  const productImages = resolveProductImages(productData);
  const displayImages =
    productImages.length > 0 ? productImages : [PLACEHOLDER_IMAGE];

  const brochureUrl: string | null =
    validUrl(drugEntry?.brochurePath) ??
    validUrl(drugEntry?.userManualUrl) ??
    validUrl(consAttr?.brochurePath) ??
    validUrl(ncAttr?.brochurePath) ??
    validUrl(cosAttrRaw?.brochurePath) ??
    validUrl(suppAttr?.brochurePath) ??
    validUrl(productData?.productMarketingUrl);

  const specialOffers: SpecialOffer[] = productData?.specialOffers ?? [];

  const resolvedDeviceCategoryName: string | null =
    lookups.deviceCategoryName ??
    consAttr?.deviceCategoryName ??
    (lookups.loading ? "Loading…" : null);

  const resolvedDeviceSubCategoryName: string | null =
    lookups.deviceSubCategoryName ??
    consAttr?.deviceSubCategoryName ??
    (lookups.loading ? "Loading…" : null);

  const handleClose = () => setCurrentView("overview" as DashboardView);
  const handleEdit = () => {
    const editView =
      resolvedCategoryId != null
        ? CATEGORY_EDIT_VIEW[resolvedCategoryId]
        : null;
    setCurrentView(editView ?? ("editDrug" as DashboardView));
  };

  /* ─────────────────────────────────────────────────────
     LOADING / EMPTY STATES
  ───────────────────────────────────────────────────── */
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          background: "var(--base-white)",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{ height: 256, background: "#F5F5F5", borderRadius: 12 }}
          />
          <div
            style={{
              height: 24,
              background: "#F5F5F5",
              borderRadius: 6,
              width: "66%",
            }}
          />
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
          fontFamily: "'Noto Sans', sans-serif",
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
        fontFamily: "'Noto Sans', sans-serif",
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
              fontSize: 36,
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 300,
              lineHeight: "44px",
              margin: 0,
            }}
          >
            {productData.productName
              ? `${productData.productName} Preview`
              : "Product Preview"}
          </h1>
          <p
            style={{
              color: "#5A5B58",
              fontSize: 16,
              fontFamily: "'Noto Sans', sans-serif",
              fontWeight: 400,
              lineHeight: "24px",
              margin: 0,
            }}
          >
            Complete product information
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <button
            onClick={handleEdit}
            style={{
              height: 48,
              minWidth: 108,
              padding: "12px 16px",
              background: "var(--Colors-Brand-Primary-800, #6C12A9)",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              color: "white",
              fontSize: 16,
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 500,
              lineHeight: "24px",
            }}
          >
            Edit
          </button>
          <button
            onClick={handleClose}
            style={{
              height: 48,
              minWidth: 108,
              padding: "8px 16px",
              borderRadius: 8,
              outline: "2px var(--Colors-Warning-warning-500, #FF3B3B) solid",
              outlineOffset: -2,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--Colors-Warning-warning-500, #FF3B3B)",
              fontSize: 16,
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 500,
              lineHeight: "24px",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* ── PRODUCT DETAILS — delegated to category-specific views ── */}

      {/* Consumable Medical (category 5) */}
      {isConsumable && (
        <ConsumableView
          productName={productData.productName}
          productDescription={productDescription}
          displayImages={displayImages}
          consAttr={consAttr}
          storageConditionName={storageCondition}
          deviceCategoryName={resolvedDeviceCategoryName}
          deviceSubCategoryName={resolvedDeviceSubCategoryName}
          specificationUnitLabel={lookups.specificationUnitLabel}
          brochureUrl={brochureUrl}
          placeholderImage={PLACEHOLDER_IMAGE}
        />
      )}

      {/* Non-Consumable Medical (category 6) */}
      {isNonConsumable && (
        <NonConsumableView
          productName={productData.productName}
          productDescription={productDescription}
          displayImages={displayImages}
          nonConsAttr={
            ncAttr
              ? {
                  ...ncAttr,
                  safetyInstructions:
                    ncAttr.safetyInstructions ??
                    productData.warningsPrecautions ??
                    undefined,
                }
              : null
          }
          storageConditionName={storageCondition}
          deviceCategoryName={resolvedDeviceCategoryName}
          deviceSubCategoryName={resolvedDeviceSubCategoryName}
          brochureUrl={brochureUrl}
          placeholderImage={PLACEHOLDER_IMAGE}
        />
      )}

      {/* Cosmetic & Personal Care (category 4) */}
      {isCosmetic &&
        (cosAttrLoading ? (
          // Show a subtle inline spinner while master labels are resolving
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "48px 0",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid #E9D5FF",
                borderTopColor: "#4B0082",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <CosmeticPersonalCareView
            productName={productData.productName}
            productDescription={productDescription}
            warningsPrecautions={warningsPrecautions}
            displayImages={displayImages}
            cosAttr={resolvedCosAttr}
            storageConditionName={storageCondition}
            brochureUrl={brochureUrl}
            placeholderImage={PLACEHOLDER_IMAGE}
          />
        ))}

      {/* Drug (category 1) */}
      {isDrug && (
        <div
          style={{
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              paddingTop: 8,
              paddingBottom: 8,
              borderBottom: "1px #D5D5D4 solid",
            }}
          >
            <h2
              style={{
                color: "#1E1E1D",
                fontSize: 28,
                fontFamily: "'Work Sans', sans-serif",
                fontWeight: 500,
                lineHeight: "36px",
                margin: 0,
              }}
            >
              Product Details
            </h2>

            <div className="w-full rounded-xl border border-primary-600 p-4 bg-white mt-4 space-y-3">
              <div className="text-label-l4 font-medium text-pneutral-900">
                Product Images
              </div>

              <div className="grid grid-cols-4 gap-4">
                {displayImages.slice(0, 4).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative h-67.5 overflow-hidden rounded-xl bg-[#F5F5F5]"
                  >
                    <img
                      src={img}
                      alt={`Product image ${idx + 1}`}
                      className="w-67.5 h-67.5 object-cover rounded-xl"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          PLACEHOLDER_IMAGE;
                      }}
                    />

                    {idx === 0 && (
                      <div className="absolute top-3 left-3 w-15 h-6.5 bg-primary-600 text-center rounded-md">
                        <span className="text-white text-xs font-normal">
                          Primary
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {Array.from({
                  length: Math.max(0, 4 - displayImages.length),
                }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="h-67.5 rounded-xl bg-[#F5F5F5]"
                  />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
            <div
              style={{
                flex: "1 1 0",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <FieldRow
                label="Product Name"
                value={productData.productName}
                multiline
              />
              <FieldRow
                label="Therapeutic Category"
                value={therapeuticCategory}
              />
              <FieldRow
                label="Therapeutic Subcategory"
                value={therapeuticSubcategory}
              />
              <FieldRow
                label="Dosage Form (Tablet, Syrup)"
                value={dosageForm}
              />
              {moleculesToDisplay.map((mol, idx) => (
                <div key={idx} style={{ ...ROW, alignItems: "center" }}>
                  <div style={ROW_LABEL}>
                    <span style={LABEL_TEXT}>
                      {moleculesToDisplay.length === 1
                        ? "Molecule"
                        : `Molecule ${idx + 1}`}
                    </span>
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
                    <span style={{ ...VALUE_TEXT, textAlign: "right" }}>
                      {lookups.loading && !mol.resolvedName
                        ? "Loading…"
                        : mol.resolvedName}
                    </span>
                    <span
                      style={{
                        color: "#3C3D3A",
                        fontSize: 16,
                        fontFamily: "'Noto Sans', sans-serif",
                        fontWeight: 700,
                        lineHeight: "24px",
                      }}
                    >
                      {mol.resolvedStrength}
                    </span>
                  </div>
                </div>
              ))}
              <FieldRow label="Drug Schedule" value={drugSchedule} />
              <FieldRow
                label="Mechanism of Action (MoA)"
                value={mechanismOfAction}
                multiline
              />
              <FieldRow
                label="Storage Condition"
                value={storageCondition}
                multiline
              />
            </div>
            <div
              style={{
                flex: "1 1 0",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <FieldRow label="Primary Use" value={primaryUse} />
              <FieldRow label="Manufacturer Name" value={manufacturerName} />

              <div className="px-4 pt-3 pb-2 border-b border-pneutral-200 flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-pneutral-500 text-base font-medium leading-6">
                    Uploaded User Manual
                  </span>

                  <span className="text-warning-500 text-base font-medium leading-6">
                    *
                  </span>
                </div>

                {brochureUrl ? (
                  <a
                    href={brochureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-pneutral-50 rounded-lg no-underline"
                  >
                    <FileText size={24} color="var(--pneutral-800)" />

                    <span className="text-pneutral-800 text-base font-normal leading-[22px] break-all">
                      {decodeURIComponent(
                        brochureUrl.split("/").pop()?.split("?")[0] ||
                          "user-manual.pdf",
                      )}
                    </span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-pneutral-50 rounded-lg">
                    <FileText size={24} color="var(--pneutral-800)" />

                    <span className="text-pneutral-500 text-base font-normal leading-[22px]">
                      No user manual uploaded
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full px-5 py-4 border-b border-[#D5D5D4] flex flex-col items-start gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-pneutral-700 text-base font-normal leading-6">
                    Warnings & Precautions
                  </span>

                  <span className="text-[#FF3B30] text-base">*</span>
                </div>

                <p className="w-full text-left whitespace-pre-wrap text-pneutral-800 text-base font-normal  m-0">
                  {warningsPrecautions ?? "—"}
                </p>
              </div>
              <div className="w-full px-5 py-4 border-b border-[#D5D5D4] flex flex-col items-start gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-pneutral-700 text-base font-normal leading-6">
                    Product Description
                  </span>

                  <span className="text-[#FF3B30] text-base">*</span>
                </div>

                <p className="w-full text-left whitespace-pre-wrap text-pneutral-800 text-base font-normal  m-0">
                  {productDescription ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplement / Nutraceutical (category 2) */}
      {isSupplement && suppAttr && (
        <SupplementDetailsView
          productName={productData.productName}
          productDescription={productDescription}
          warningsPrecautions={warningsPrecautions}
          displayImages={displayImages}
          suppAttr={suppAttr}
          storageConditionName={storageCondition}
          placeholderImage={PLACEHOLDER_IMAGE}
          manufacturerName={manufacturerName}
          brochureUrl={brochureUrl}
          additionalDiscounts={additionalDiscounts}
          specialSchemes={specialSchemes}
        />
      )}

      {/* Food & Infant (category 3) */}
      {isFoodInfant && foodAttr && (
        <FoodInfantView
          productName={productData.productName}
          productDescription={productDescription}
          warningsPrecautions={warningsPrecautions}
          displayImages={displayImages}
          foodAttr={foodAttr}
          brochureUrl={brochureUrl}
          placeholderImage={PLACEHOLDER_IMAGE}
          manufacturerName={manufacturerName}
        />
      )}
      {console.log("FoodAttr from ProductView1:", {
        nutritionalInformation: foodAttr?.nutritionalInformation,
        nutritionalInformationImageUrl:
          foodAttr?.nutritionalInformationImageUrl,
      })}

      {/* ── SPECIAL OFFERS (if any) ── */}
      {specialOffers.length > 0 && (
        <SpecialOffersSection offers={specialOffers} />
      )}

      {/* ── PACKAGING & ORDER DETAILS ── */}
      <div
        style={{
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <SectionTitle>Packaging &amp; Order Details</SectionTitle>
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
          <div
            style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}
          >
            <FieldRow label="Pack Type" value={resolvedPackType} />
            <FieldRow
              label="Number of Units per Pack Type"
              value={
                packaging?.numberOfUnits ??
                packaging?.unitPerPack ??
                packaging?.unitsPerPack
              }
            />
            <FieldRow
              label="Number of Packs"
              value={
                packaging?.numberOfPacks != null
                  ? `${packaging.numberOfPacks} Box`
                  : null
              }
            />
            <FieldRow
              label="Pack Size (No. of packs × No. of Units per pack type)"
              value={packSizeDisplay}
              multiline
            />
          </div>
          <div
            style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}
          >
            <div style={{ padding: "8px", borderBottom: "1px #D5D5D4 solid" }}>
              <span
                style={{
                  color: "#1E1E1D",
                  fontSize: 20,
                  fontFamily: "'Work Sans', sans-serif",
                  fontWeight: 500,
                  lineHeight: "28px",
                }}
              >
                Order Details
              </span>
            </div>
            <FieldRow
              label="Min Order Qty"
              value={packaging?.minimumOrderQuantity}
            />
            <FieldRow
              label="Max Order Qty"
              value={packaging?.maximumOrderQuantity}
            />
          </div>
        </div>
      </div>

      {/* ── BATCH MANAGEMENT + PRICING ── */}
      <div
        style={{
          display: "flex",
          gap: 36,
          alignItems: "flex-start",
          alignSelf: "stretch",
        }}
      >
        {/* Batch Management */}
        <div
          style={{
            flex: "1 1 0",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <SectionTitle>Batch Management</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <FieldRow label="Batch Number" value={pricing?.batchLotNumber} />
            <FieldRow
              label="Manufacturing Date"
              value={formatDate(pricing?.manufacturingDate)}
            />
            <FieldRow
              label="Expiry Date"
              value={formatDate(pricing?.expiryDate)}
            />
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
            <FieldRow label="Shelf Life" value={shelfLifeDisplay} />
          </div>
        </div>

        {/* Pricing */}
        <div
          style={{
            flex: "1 1 0",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
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

            {(additionalDiscounts.length > 0 || specialSchemes.length > 0) && (
              <div
                style={{
                  marginTop: 8,
                  borderBottom: "1px solid #D5D5D4",
                  paddingBottom: 12,
                }}
              >
                <div style={{ padding: "12px 8px 8px" }}>
                  <span
                    style={{
                      color: "#5A5B58",
                      fontSize: 18,
                      fontFamily: "'Work Sans', sans-serif",
                      fontWeight: 500,
                      lineHeight: "24px",
                    }}
                  >
                    Additional Scheme Applied
                  </span>
                </div>
                {additionalDiscounts.map((d, i) => {
                  const startDate = d.effectiveStartDate ?? d.startDate;
                  const endDate = d.effectiveEndDate ?? d.endDate;
                  return (
                    <div
                      key={`discount-${d.additionalDiscountId ?? i}`}
                      style={{
                        padding: 12,
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
                            fontFamily: "'Work Sans', sans-serif",
                            fontWeight: 400,
                            lineHeight: "20px",
                            margin: 0,
                          }}
                        >
                          {`Bulk order discount (${d.minimumPurchaseQuantity}${
                            d.maximumPurchaseQuantity
                              ? `-${d.maximumPurchaseQuantity}`
                              : "+"
                          } units)${
                            startDate && endDate
                              ? `, (${formatDate(startDate)} – ${formatDate(endDate)})`
                              : ""
                          }`}
                        </p>
                      </div>
                      <span
                        style={{
                          color: "#3C3D3A",
                          fontSize: 16,
                          fontFamily: "'Noto Sans', sans-serif",
                          fontWeight: 600,
                          lineHeight: "24px",
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
                {specialSchemes.map((s, i) => {
                  const startDate = s.effectiveStartDate;
                  const endDate = s.effectiveEndDate;
                  return (
                    <div
                      key={`scheme-${s.id ?? i}`}
                      style={{
                        padding: 12,
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
                            fontFamily: "'Work Sans', sans-serif",
                            fontWeight: 400,
                            lineHeight: "20px",
                            margin: 0,
                          }}
                        >
                          {`${s.schemeName}${
                            startDate && endDate
                              ? `, (${formatDate(startDate)} – ${formatDate(endDate)})`
                              : ""
                          }`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TAX & BILLING ── */}
      <div
        style={{
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <SectionTitle>TAX &amp; BILLING</SectionTitle>
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 0" }}>
            <FieldRow
              label="GST %"
              value={gstPercentage != null ? `${gstPercentage}%` : null}
            />
          </div>
          <div style={{ flex: "1 1 0" }}>
            <FieldRow
              label="HSN Code"
              value={hsnCode != null ? String(hsnCode) : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductView1;
