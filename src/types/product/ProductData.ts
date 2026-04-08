export interface CreateDrugProductRequest {
  productName: string;
  productDescription: string;
  productMarketingUrl: string;
  warningsPrecautions: string;

  categoryId: number;

  packagingDetails: PackagingData;

  pricingDetails: PricingData[];

  productAttributeDrugs: ProductAttributeDrugData[];
}

export interface ProductAttributeDrugData {
  dosageForm: string; // ✅ instead of dosageId
  therapeuticCategoryId: string;
  therapeuticSubcategoryId: string;

  molecules: {
    moleculeId: number;
    strength: string;
  }[];
}

// export interface ProductAttributeDrugData {
//   dosageId?: number;
//   strength: string;
//   therapeuticCategoryId: string;
//   therapeuticCategory: string;
//   therapeuticSubcategoryId: string;
//   therapeuticSubcategory: string;
//   manufacturerName: string;
//   molecules: MoleculeData[];
// }

export interface PackagingData {
  packId?: number;
  packType: string;
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
  storageCondition: string;
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
  pricingDetails: PricingData[];

}


