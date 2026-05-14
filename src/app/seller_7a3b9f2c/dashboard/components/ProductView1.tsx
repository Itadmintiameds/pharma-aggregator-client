"use client";

import React, { useState, useEffect } from "react";
import { DashboardView } from "@/src/types/seller/dashboard";
import { getDrugProductById } from "@/src/services/product/ProductService";
import { getPackTypeById } from "@/src/services/product/PackType";
import { getStorageConditionById } from "@/src/services/product/StorageCondition";
import {
  getTherapeuticCategoryById,
  getTherapeuticSubcategoryById,
} from "@/src/services/product/TherapeuticCategoryService";
import { getAllMolecules } from "@/src/services/product/MoleculeService";
import {
  getConsumableDeviceCategories,
  getConsumableDeviceSubCategories,
} from "@/src/services/product/ConsumbaleService";
import SupplementDetailsView from "./SupplementDetailsView";
import ConsumableView from "./ConsumableView";
import CosmeticPersonalCareView from "./CosmeticView";

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
  // Raw IDs returned by API — used for lookup
  deviceCatId?: number | string;
  deviceSubCatId?: number | string;
}

export interface CosmeticAttributes {
  productType?: string;
  productSubtype?: string;
  productSubType?: string;
  brandName?: string;
  variantName?: string;
  gender?: string;
  intendedUseArea?: string;
  intendedUseAreas?: string | string[];
  skinHairType?: string;
  skinTypes?: string | string[];
  hairTypes?: string | string[];
  ageGroup?: string;
  netQuantityStrength?: string;
  netQuantity?: string;
  activeIngredients?: string;
  productClaims?: string;
  storageCondition?: string;
  storageConditionName?: string;
  storageConditionId?: number;
  manufacturerName?: string;
  countryOfOrigin?: string;
  countryName?: string;
  brochurePath?: string;
  certificateDocuments?: CertificateDocument[];
  productDescription?: string;
  warningsPrecautions?: string;
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
  // The API may return any of these keys for cosmetic attributes:
  productAttributeCosmeticAndPersonalUse?: CosmeticAttributes[];
  productAttributeCosmeticPersonalCare?: CosmeticAttributes[];
  productAttributeCosmetics?: CosmeticAttributes[];
  cosmeticAttributes?: CosmeticAttributes;
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
  // Consumable device names resolved from IDs
  deviceCategoryName: string | null;
  deviceSubCategoryName: string | null;
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
      day: "2-digit",
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

/**
 * Extract cosmetic attributes from API response.
 * The API may return them under different keys depending on the backend version.
 * Priority mirrors CosmeticForm: productAttributeCosmeticAndPersonalUse first.
 */
const extractCosmeticAttr = (data: ProductApiData): CosmeticAttributes | null => {
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

const OFFER_COLORS: Record<string, { bg: string; border: string; titleColor: string; iconBg: string }> = {
  bogo: { bg: "#F0FDF4", border: "#86EFAC", titleColor: "#15803D", iconBg: "#DCFCE7" },
  bulk: { bg: "#FAF5FF", border: "#D8B4FE", titleColor: "#7E22CE", iconBg: "#F3E8FF" },
  bundle: { bg: "#FFFBEB", border: "#FCD34D", titleColor: "#92400E", iconBg: "#FEF3C7" },
  seasonal: { bg: "#EFF6FF", border: "#93C5FD", titleColor: "#1D4ED8", iconBg: "#DBEAFE" },
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
    <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionTitle>Special Offers &amp; Promotional Schemes</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
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
              <p style={{ color: "#3C3D3A", fontSize: 13, fontFamily: "'Noto Sans', sans-serif", fontWeight: 400, lineHeight: "20px", margin: 0 }}>
                {offer.description}
              </p>
              {validText && (
                <p style={{ color: colors.titleColor, fontSize: 12, fontFamily: "'Noto Sans', sans-serif", fontWeight: 400, lineHeight: "18px", margin: 0, opacity: 0.8 }}>
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

  /* ── 1. Fetch product ── */
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setLookups(INITIAL_LOOKUPS);
    (async () => {
      try {
        const response = (await getDrugProductById(productId)) as ProductApiData;
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

    const packaging: PackagingDetails | undefined = Array.isArray(productData.packagingDetails)
      ? productData.packagingDetails[0]
      : productData.packagingDetails;

    const drugEntry: DrugAttributeEntry | null =
      (productData.productAttributeDrugs ?? []).length > 0
        ? productData.productAttributeDrugs![0]
        : productData.drugAttributes ?? null;

    const consAttr: ConsumableAttributes | null =
      (productData.productAttributeConsumableMedicals ?? []).length > 0
        ? productData.productAttributeConsumableMedicals![0]
        : null;

    const ncAttr: NonConsumableAttributes | null =
      (productData.productAttributeNonConsumableMedicals ?? []).length > 0
        ? productData.productAttributeNonConsumableMedicals![0]
        : productData.nonConsumableAttributes ?? null;

    // Use the unified extractor so we get the right attribute regardless of API key
    const cosAttr: CosmeticAttributes | null = extractCosmeticAttr(productData);

    setLookups((prev) => ({ ...prev, loading: true }));

    // ── Pack type ──
    const packId = toPositiveInt(packaging?.packId);
    const inlinePackName = packaging?.packTypeName?.trim() || packaging?.packType?.trim() || null;

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
      cosAttr?.storageConditionName?.trim() ||
      cosAttr?.storageCondition?.trim() ||
      null;

    const rawStorageId =
      consAttr?.storageConditionId ??
      ncAttr?.storageConditionId ??
      cosAttr?.storageConditionId ??
      (Array.isArray(drugEntry?.storageConditionIds) &&
      (drugEntry?.storageConditionIds?.length ?? 0) > 0
        ? drugEntry!.storageConditionIds![0]
        : undefined);
    const storageId = toPositiveInt(rawStorageId);

    const fetchStorageCondition = async (): Promise<Partial<ResolvedLookups>> => {
      if (inlineStorageName) return { storageConditionName: inlineStorageName };
      if (storageId === null) return {};
      try {
        const data = await getStorageConditionById(storageId);
        const name =
          data?.conditionName ?? data?.storageConditionName ?? data?.name ?? data?.condition ?? null;
        return { storageConditionName: name ? String(name).trim() : null };
      } catch {
        return {};
      }
    };

    // ── Therapeutic category ──
    const catId = toPositiveInt(drugEntry?.therapeuticCategoryId);
    const inlineCatName = drugEntry?.therapeuticCategoryName?.trim() || productData.therapeuticCategory?.trim() || null;

    const fetchTherapeuticCategory = async (): Promise<Partial<ResolvedLookups>> => {
      if (inlineCatName) return { therapeuticCategoryName: inlineCatName };
      if (!drugEntry || catId === null) return {};
      try {
        const data = await getTherapeuticCategoryById(String(catId));
        const name =
          data?.therapeuticCategory ?? data?.therapeuticCategoryName ?? data?.categoryName ?? data?.name ?? null;
        return { therapeuticCategoryName: name ? String(name).trim() : null };
      } catch {
        return {};
      }
    };

    // ── Therapeutic subcategory ──
    const subId = toPositiveInt(drugEntry?.therapeuticSubcategoryId);
    const inlineSubName = drugEntry?.therapeuticSubcategoryName?.trim() || productData.therapeuticSubcategory?.trim() || null;

    const fetchTherapeuticSubcategory = async (): Promise<Partial<ResolvedLookups>> => {
      if (inlineSubName) return { therapeuticSubcategoryName: inlineSubName };
      if (!drugEntry || subId === null) return {};
      try {
        const data = await getTherapeuticSubcategoryById(String(subId));
        const name =
          data?.therapeuticSubcategory ?? data?.therapeuticSubcategoryName ?? data?.subcategoryName ?? data?.name ?? null;
        return { therapeuticSubcategoryName: name ? String(name).trim() : null };
      } catch {
        return {};
      }
    };

    // ── Molecules ──
    const moleculesInEntry = drugEntry?.molecules ?? [];
    const needsMoleculeData = drugEntry != null && moleculesInEntry.some((m) => m.moleculeId != null);

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
    // First try inline name fields on the attribute object, then fall back to ID lookup.
    const inlineDeviceCatName =
      consAttr?.deviceCategoryName?.trim() || null;
    const inlineDeviceSubCatName =
      consAttr?.deviceSubCategoryName?.trim() || null;

    const deviceCatId = toPositiveInt(consAttr?.deviceCatId);
    const deviceSubCatId = toPositiveInt(consAttr?.deviceSubCatId);

    const fetchDeviceNames = async (): Promise<Partial<ResolvedLookups>> => {
      if (!consAttr) return {};

      let deviceCategoryName: string | null = inlineDeviceCatName;
      let deviceSubCategoryName: string | null = inlineDeviceSubCatName;

      // Look up category name from ID if we don't have the inline name
      if (!deviceCategoryName && deviceCatId !== null) {
        try {
          const cats: any[] = await getConsumableDeviceCategories();
          const found = cats.find(
            (c) =>
              Number(c.deviceCatId ?? c.id) === deviceCatId,
          );
          if (found) {
            deviceCategoryName =
              String(found.deviceName ?? found.name ?? "").trim() || null;
          }
        } catch {
          // ignore — leave as null
        }
      }

      // Look up subcategory name from ID if we don't have the inline name
      if (!deviceSubCategoryName && deviceCatId !== null && deviceSubCatId !== null) {
        try {
          const subCats: any[] = await getConsumableDeviceSubCategories(
            String(deviceCatId),
          );
          const found = subCats.find(
            (s) =>
              Number(s.deviceSubCatId ?? s.subCategoryId ?? s.id) === deviceSubCatId,
          );
          if (found) {
            deviceSubCategoryName =
              String(
                found.deviceSubCatName ?? found.subCategoryName ?? found.name ?? "",
              ).trim() || null;
          }
        } catch {
          // ignore — leave as null
        }
      }

      return { deviceCategoryName, deviceSubCategoryName };
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

  /* ─────────────────────────────────────────────────────
     DERIVED VALUES
  ───────────────────────────────────────────────────── */

  const packaging: PackagingDetails | undefined = Array.isArray(productData?.packagingDetails)
    ? productData?.packagingDetails[0]
    : productData?.packagingDetails;

  const pricing: PricingDetails | undefined = productData?.pricingDetails?.[0];

  const ncAttr: NonConsumableAttributes | null =
    (productData?.productAttributeNonConsumableMedicals ?? []).length > 0
      ? productData!.productAttributeNonConsumableMedicals![0]
      : productData?.nonConsumableAttributes ?? null;

  const consAttr: ConsumableAttributes | null =
    (productData?.productAttributeConsumableMedicals ?? []).length > 0
      ? productData!.productAttributeConsumableMedicals![0]
      : null;

  const drugEntry: DrugAttributeEntry | null =
    (productData?.productAttributeDrugs ?? []).length > 0
      ? productData!.productAttributeDrugs![0]
      : productData?.drugAttributes ?? null;

  const suppAttr: any | null =
    (productData?.productAttributeSupplementsOrNutraceuticals ?? []).length > 0
      ? productData!.productAttributeSupplementsOrNutraceuticals![0]
      : null;

  // Use the unified extractor — same priority as CosmeticForm
  const cosAttr: CosmeticAttributes | null = productData
    ? extractCosmeticAttr(productData)
    : null;

  const resolvedCategoryId: number | null = productData?.categoryId ?? categoryIdProp ?? null;

  // Category detection: explicit categoryId takes precedence; fall back to attribute presence
  const isConsumable =
    resolvedCategoryId === 5 ||
    (resolvedCategoryId == null && consAttr !== null);
  const isNonConsumable =
    resolvedCategoryId === 6 ||
    (resolvedCategoryId == null && ncAttr !== null && !isConsumable);
  const isCosmetic =
    resolvedCategoryId === 4 ||
    (resolvedCategoryId == null && cosAttr !== null && !isConsumable && !isNonConsumable);
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

  const primaryMoleculeId: number | null = (drugEntry?.molecules ?? [])[0]?.moleculeId ?? null;

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
    return { ...m, resolvedName: name ?? "—", resolvedStrength: formatStrength(strength) };
  });

  const moleculesToDisplay =
    molecules.length > 0
      ? molecules
      : (
          [
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
          ].filter(Boolean) as { resolvedName: string; resolvedStrength: string }[]
        );

  const drugSchedule =
    drugEntry?.drugSchedule ??
    productData?.drugSchedule ??
    (primaryMoleculeId != null ? lookups.moleculeDetailMap[primaryMoleculeId]?.drugSchedule : null) ??
    null;

  const mechanismOfAction =
    drugEntry?.mechanismOfAction ??
    productData?.mechanismOfAction ??
    (primaryMoleculeId != null ? lookups.moleculeDetailMap[primaryMoleculeId]?.mechanismOfAction : null) ??
    null;

  const primaryUse =
    drugEntry?.primaryUse ??
    drugEntry?.purpose ??
    ncAttr?.purpose ??
    suppAttr?.intendedUse ??
    (primaryMoleculeId != null ? lookups.moleculeDetailMap[primaryMoleculeId]?.primaryUse : null) ??
    null;

  const resolvedPackType =
    lookups.packTypeName ||
    packaging?.packTypeName?.trim() ||
    packaging?.packType?.trim() ||
    (lookups.loading ? "Loading…" : packaging?.packId != null ? `Pack #${packaging.packId}` : null);

  const storageCondition: string | null =
    lookups.storageConditionName ??
    drugEntry?.storageConditionName ??
    drugEntry?.storageCondition ??
    ncAttr?.storageConditionName ??
    ncAttr?.storageCondition ??
    consAttr?.storageConditionName ??
    consAttr?.storageCondition ??
    cosAttr?.storageConditionName ??
    cosAttr?.storageCondition ??
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
    cosAttr?.manufacturerName ??
    null;

  const warningsPrecautions =
    drugEntry?.warningsPrecautions ??
    productData?.warningsPrecautions ??
    suppAttr?.warningsPrecautions ??
    cosAttr?.warningsPrecautions ??
    null;

  const productDescription =
    drugEntry?.productDescription ??
    productData?.productDescription ??
    suppAttr?.productDescription ??
    cosAttr?.productDescription ??
    null;

  const gstPercentage =
    pricing?.gstPercentage ?? drugEntry?.gstPercentage ?? productData?.gstPercentage ?? null;

  const hsnCode = pricing?.hsnCode ?? drugEntry?.hsnCode ?? productData?.hsnCode ?? null;

  const shelfLifeDisplay =
    pricing?.shelfLifeMonths != null
      ? `${pricing.shelfLifeMonths} months`
      : consAttr?.shelfLife ?? drugEntry?.shelfLife ?? null;

  const additionalDiscounts: AdditionalDiscount[] = (pricing?.additionalDiscounts ?? []).filter(
    (d) => d.minimumPurchaseQuantity && d.additionalDiscountPercentage,
  );

  const unitsPerPack = packaging?.unitPerPack ?? packaging?.unitsPerPack ?? packaging?.numberOfUnits;

  const packSizeDisplay =
    packaging?.numberOfPacks != null && unitsPerPack != null
      ? `${packaging.numberOfPacks} packs × ${unitsPerPack} units = ${(
          packaging.numberOfPacks * unitsPerPack
        ).toLocaleString()} units`
      : null;

  const productImages = resolveProductImages(productData);
  const displayImages = productImages.length > 0 ? productImages : [PLACEHOLDER_IMAGE];

  const brochureUrl: string | null =
    validUrl(drugEntry?.brochurePath) ??
    validUrl(drugEntry?.userManualUrl) ??
    validUrl(consAttr?.brochurePath) ??
    validUrl(ncAttr?.brochurePath) ??
    validUrl(cosAttr?.brochurePath) ??
    validUrl(suppAttr?.brochurePath) ??
    validUrl(productData?.productMarketingUrl);

  const specialOffers: SpecialOffer[] = productData?.specialOffers ?? [];

  // Resolved device names for ConsumableView
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
    const editView = resolvedCategoryId != null ? CATEGORY_EDIT_VIEW[resolvedCategoryId] : null;
    setCurrentView(editView ?? ("editDrug" as DashboardView));
  };

  /* ─────────────────────────────────────────────────────
     LOADING / EMPTY STATES
  ───────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={{ width: "100%", background: "var(--base-white)", borderRadius: 16, padding: 24 }}>
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
            {productData.productName ? `${productData.productName} Preview` : "Product Preview"}
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
          brochureUrl={brochureUrl}
          placeholderImage={PLACEHOLDER_IMAGE}
        />
      )}

      {/* Cosmetic & Personal Care (category 4) */}
      {isCosmetic && (
        <CosmeticPersonalCareView
          productName={productData.productName}
          productDescription={productDescription}
          warningsPrecautions={warningsPrecautions}
          displayImages={displayImages}
          cosAttr={cosAttr}
          storageConditionName={storageCondition}
          brochureUrl={brochureUrl}
          placeholderImage={PLACEHOLDER_IMAGE}
        />
      )}

      {/* Drug (category 1) */}
      {isDrug && (
        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid" }}>
            <h2 style={{ color: "#1E1E1D", fontSize: 28, fontFamily: "'Work Sans', sans-serif", fontWeight: 500, lineHeight: "36px", margin: 0 }}>
              Product Details
            </h2>
          </div>
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="Product Name" value={productData.productName} multiline />
              <FieldRow label="Therapeutic Category" value={therapeuticCategory} />
              <FieldRow label="Therapeutic Subcategory" value={therapeuticSubcategory} />
              <FieldRow label="Dosage Form (Tablet, Syrup)" value={dosageForm} />
              {moleculesToDisplay.map((mol, idx) => (
                <div key={idx} style={{ ...ROW, alignItems: "center" }}>
                  <div style={ROW_LABEL}>
                    <span style={LABEL_TEXT}>{moleculesToDisplay.length === 1 ? "Molecule" : `Molecule ${idx + 1}`}</span>
                    <span style={REQUIRED_STAR}>*</span>
                  </div>
                  <div style={{ flex: "1 1 0", display: "flex", gap: 16, justifyContent: "flex-end", alignItems: "center" }}>
                    <span style={{ ...VALUE_TEXT, textAlign: "right" }}>
                      {lookups.loading && !mol.resolvedName ? "Loading…" : mol.resolvedName}
                    </span>
                    <span style={{ color: "#3C3D3A", fontSize: 16, fontFamily: "'Noto Sans', sans-serif", fontWeight: 700, lineHeight: "24px" }}>
                      {mol.resolvedStrength}
                    </span>
                  </div>
                </div>
              ))}
              <FieldRow label="Drug Schedule" value={drugSchedule} />
              <FieldRow label="Mechanism of Action (MoA)" value={mechanismOfAction} multiline />
              <FieldRow label="Storage Condition" value={storageCondition} multiline />
            </div>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="Primary Use" value={primaryUse} />
              <FieldRow label="Manufacturer Name" value={manufacturerName} />
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
        />
      )}

      {/* ── SPECIAL OFFERS (if any) ── */}
      {specialOffers.length > 0 && <SpecialOffersSection offers={specialOffers} />}

      {/* ── PACKAGING & ORDER DETAILS ── */}
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle>Packaging &amp; Order Details</SectionTitle>
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <FieldRow label="Pack Type" value={resolvedPackType} />
            <FieldRow
              label="Number of Units per Pack Type"
              value={packaging?.numberOfUnits ?? packaging?.unitPerPack ?? packaging?.unitsPerPack}
            />
            <FieldRow
              label="Number of Packs"
              value={packaging?.numberOfPacks != null ? `${packaging.numberOfPacks} Box` : null}
            />
            <FieldRow
              label="Pack Size (No. of packs × No. of Units per pack type)"
              value={packSizeDisplay}
              multiline
            />
          </div>
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "8px", borderBottom: "1px #D5D5D4 solid" }}>
              <span style={{ color: "#1E1E1D", fontSize: 20, fontFamily: "'Work Sans', sans-serif", fontWeight: 500, lineHeight: "28px" }}>
                Order Details
              </span>
            </div>
            <FieldRow label="Min Order Qty" value={packaging?.minimumOrderQuantity} />
            <FieldRow label="Max Order Qty" value={packaging?.maximumOrderQuantity} />
          </div>
        </div>
      </div>

      {/* ── BATCH MANAGEMENT + PRICING ── */}
      <div style={{ display: "flex", gap: 36, alignItems: "flex-start", alignSelf: "stretch" }}>
        {/* Batch Management */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionTitle>Batch Management</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <FieldRow label="Batch Number" value={pricing?.batchLotNumber} />
            <FieldRow label="Manufacturing Date" value={formatDate(pricing?.manufacturingDate)} />
            <FieldRow label="Expiry Date" value={formatDate(pricing?.expiryDate)} />
            <FieldRow
              label="Stock Quantity (in terms of Pack Size)"
              value={pricing?.stockQuantity != null ? `${pricing.stockQuantity.toLocaleString()} units` : null}
            />
            <FieldRow label="Date of Stock Entry" value={formatDate(pricing?.dateOfStockEntry)} />
            <FieldRow label="Shelf Life" value={shelfLifeDisplay} />
          </div>
        </div>

        {/* Pricing */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionTitle>Pricing</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <FieldRow
              label="MRP (per Pack Size)"
              value={pricing?.mrp != null ? `₹${pricing.mrp.toLocaleString()}` : null}
            />
            <FieldRow
              label="Selling Price (per Pack Size)"
              value={pricing?.sellingPrice != null ? `₹${pricing.sellingPrice.toLocaleString()}` : null}
            />
            <FieldRow
              label="Discount Percentage"
              value={pricing?.discountPercentage != null ? `${pricing.discountPercentage}%` : null}
            />

            {additionalDiscounts.length > 0 && (
              <>
                <div style={{ padding: "12px 8px 8px" }}>
                  <span style={{ color: "#5A5B58", fontSize: 18, fontFamily: "'Work Sans', sans-serif", fontWeight: 500, lineHeight: "24px" }}>
                    Additional Scheme Applied
                  </span>
                </div>
                {additionalDiscounts.map((d, i) => {
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
                        <p style={{ color: "#5A5B58", fontSize: 14, fontFamily: "'Work Sans', sans-serif", fontWeight: 400, lineHeight: "20px", margin: 0 }}>
                          {`Bulk order discount (${d.minimumPurchaseQuantity}${d.maximumPurchaseQuantity ? `-${d.maximumPurchaseQuantity}` : "+"} units)${
                            startDate && endDate ? `, (${formatDate(startDate)} – ${formatDate(endDate)})` : ""
                          }`}
                        </p>
                      </div>
                      <span style={{ color: "#3C3D3A", fontSize: 16, fontFamily: "'Noto Sans', sans-serif", fontWeight: 600, lineHeight: "24px", textAlign: "right", flexShrink: 0, paddingLeft: 16 }}>
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
            <FieldRow label="GST %" value={gstPercentage != null ? `${gstPercentage}%` : null} />
          </div>
          <div style={{ flex: "1 1 0" }}>
            <FieldRow label="HSN Code" value={hsnCode != null ? String(hsnCode) : null} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductView1;