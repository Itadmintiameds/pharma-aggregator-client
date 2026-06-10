export interface CreateDrugProductRequest {
  productName: string;
  productDescription: string;
  warningsPrecautions: string;
  categoryId: number;
  packagingDetails: PackagingData[];
  pricingDetails: PricingData[];
  productAttributeDrugs?: ProductAttributeDrugData[];
  productAttributeConsumableMedicals?: ProductAttributeConsumableData[];
  productAttributeNonConsumableMedicals?: ProductAttributeNonConsumableData[];
}

export interface CreateProductRequest {
  productName: string;
  productDescription: string;
  warningsPrecautions: string;
  manufacturerName?: string;
  categoryId: number;
  packagingDetails: PackagingData[];
  pricingDetails: PricingData[];
  productAttributeFoodInfants?: ProductAttributeFoodInfantData[];
  retainedImageUrls?: string[];
}

export interface UnitOption {
  unitId: number;
  unitName: string;
  unitCode: string;
}
export interface ProductAttributeFoodInfantData {
  productAttributeId?: string;
  productCategoryId: number;
  productSubcategoryId: number;
  brandName: string;
  variantName: string;
  productFormId: number;
  netQuantity: number;
  unitId: number;
  servingSize?: number | null;  
  servingSizeUnitId?: number | null; 
  ageGroupId: number;
  vegNonvegIndicator: "veg" | "non-veg";  
  allergenInformation: string;
  nutritionalInformation: string;  
  nutritionalInformationImageUrl?: string | null;  
  activeIngredients: string;
  additivesPreservatives: string;
  productClaims: string;
  storageConditionId: number;  
  countryId: number;  
  // certificationIds: number[];
  certificationIds?: number[];      
  certificateDocuments?: Array<{         
    certificationId: number;
    certificateUrl: string;
  }>;  
  productUserManual?: string | null;  
  createdBy?: string;
  modifiedBy?: string;
  createdDate?: string;
  modifiedDate?: string;
}

export interface ProductAttributeDrugData {
  productAttributeId?: string;
  dosageForm: string;
  strength: string;
  therapeuticCategoryId: string;
  therapeuticSubcategoryId: string;
  molecules?: { moleculeId: number; strength: string }[];
  storageConditionIds: number[];
}

export interface ProductAttributeConsumableData {
  productAttributeId?: string;
  brandName: string;
  deviceCatId: number;
  deviceSubCatId: number;
  dimensionSize: string;
  disposalOrReusable: string;
  keyFeaturesSpecifications: string;
  materialTypeId: number[];
  purpose: string;
  safetyInstructions: string;
  shelfLife: string;
  sterileOrNonSterile: string;
  storageConditionId: number;
  countryId: number;
  manufacturerName: string;
  productBrochureUrl?: string;
}

export interface ProductAttributeNonConsumableData {
  productAttributeId?: string;
  brandName: string;
  deviceCategoryId: number;
  deviceSubCategoryId: number;
  modelName: string;
  modelNumber: string;
  keyFeaturesSpecifications: string;
  materialTypeIds: number[];
  purpose: string;
  powerSourceId: number;
  storageConditionId: number;
  countryId: number;
  manufacturerName: string;
  warrantyPeriod: string;
  udiNumber: string;
  serviceAvailability: boolean;
}

export interface PackagingData {
  packagingId?: string;
  packId?: number;
  packType?: string;
  packTypeUnit?: string;
  unitPerPack: number;
  numberOfPacks: number;
  packSize: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
}

export interface PricingData {
  pricingId?: string;
  batchLotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  dateOfStockEntry: string | null;
  stockQuantity: number;
  sellingPrice: number;
  mrp: number;
  gstPercentage: number;
  discountPercentage: number;
  finalPrice: number;
  hsnCode: number;
  shelfLifeMonths?: number;
  additionalDiscounts: AdditionalDiscountData[];
  specialSchemes?: SpecialSchemesData[];
}

export interface AdditionalDiscountData {
  additionalDiscountId?: string;
  minimumPurchaseQuantity: number;
  additionalDiscountPercentage: number;
  discountPercentage?: number;
  effectiveStartDate: string | null;
  effectiveStartTime: string | null;
  effectiveEndDate: string | null;
  effectiveEndTime: string | null;
  isSelected?: boolean;
  displayOffer?: boolean;
}

export interface SpecialSchemesData {
  specialSchemesId?: string;
  schemeName: string;
  schemeType: string;
  buyQuantity: number;
  freeQuantity: number;
  effectiveStartDate: string | null;
  effectiveStartTime: string | null;
  effectiveEndDate: string | null;
  effectiveEndTime: string | null;
  isSelected?: boolean;
  displayOfferScheme?: boolean;
}

export interface MoleculeData {
  moleculeId: string;
  moleculeName: string;
  drugSchedule: string;
  mechanismOfAction: string;
  primaryUse: string;
  strength: string;
}

export interface ProductListData {
  productId: string;
  productName: string;
  categoryName?: string;
  categoryId?: number;
  pricingDetails: PricingData[];
  productImages?: {
    productImage: string;
    productImageId: string;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW (consumable & non‑consumable device attributes)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductAttributeConsumableData {
  productAttributeId?: string;
  brandName: string;
  deviceCatId: number;
  deviceSubCatId: number;
  dimensionSize: string;
  disposalOrReusable: string;
  keyFeaturesSpecifications: string;
  materialTypeId: number[];
  purpose: string;
  safetyInstructions: string;
  shelfLife: string;
  sterileOrNonSterile: string;
  storageConditionId: number;
  countryId: number;
  manufacturerName: string;
  productBrochureUrl?: string;
}

export interface ProductAttributeNonConsumableData {
  productAttributeId?: string;
  brandName: string;
  deviceCategoryId: number;
  deviceSubCategoryId: number;
  modelName: string;
  modelNumber: string;
  keyFeaturesSpecifications: string;
  materialTypeIds: number[];
  purpose: string;
  powerSourceId: number;
  storageConditionId: number;
  countryId: number;
  manufacturerName: string;
  warrantyPeriod: string;
  udiNumber: string;
  serviceAvailability: boolean;
}

export interface ProductCertificateDocumentDto {
  productCertificateDocumentId?: number;
  certificationId: number;
  certificationName?: string;
  certificateUrl?: string;
  documentType?: string;
}