export interface CreateDrugProductRequest {
  productName: string;
  productDescription: string;
  productMarketingUrl: string;
  warningsPrecautions: string;
  categoryId: number;
  packagingDetails: PackagingData;
  pricingDetails: PricingData[];
  productAttributeDrugs?: ProductAttributeDrugData[];
  productAttributeConsumableMedicals?: ProductAttributeConsumableData[];
  productAttributeNonConsumableMedicals?: ProductAttributeNonConsumableData[];
}

export interface ProductAttributeDrugData {
  productAttributeId?: string;
  dosageForm: string;
  strength: string;
  therapeuticCategoryId: string;
  therapeuticSubcategoryId: string;
  molecules?: { moleculeId: number; strength: string }[];
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
  storageCondition?: string;
  stockQuantity: number;
  sellingPrice: number;
  mrp: number;
  gstPercentage: number;
  discountPercentage: number;
  finalPrice: number;
  hsnCode: number;
  shelfLifeMonths?: number;
  additionalDiscounts: AdditionalDiscountData[];
}

export interface AdditionalDiscountData {
  additionalDiscountId?: string;
  minimumPurchaseQuantity: number;
  additionalDiscountPercentage: number;
  effectiveStartDate: string | null;
  effectiveStartTime: string | null;
  effectiveEndDate: string | null;
  effectiveEndTime: string | null;
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
}