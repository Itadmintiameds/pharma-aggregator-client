export interface CreateDrugProductRequest {
  productName: string;
  productDescription: string;
  productMarketingUrl: string;
  warningsPrecautions: string;

  categoryId: number;

  molecules: MoleculeData[];

  packagingDetails: PackagingData;

  pricingDetails: PricingData[];

  productAttributeDrugs: ProductAttributeDrugData[];
}


export interface ProductAttributeDrugData {
  dosageForm: string;
  strength: string;
  therapeuticCategoryId: string;
  therapeuticSubcategoryId: string;
}

export interface PackagingData {
  packagingUnit: string;
  numberOfUnits: number;
  packSize: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
}


export interface PricingData {
  pricingId?: string;
  batchLotNumber: string;
  manufacturerName: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  storageCondition: string;
  stockQuantity: number;
  pricePerUnit: number;
  mrp: number;
  gstPercentage: number;
  discountPercentage: number;
  minimumPurchaseQuantity: number;
  additionalDiscount: number;
  finalPrice: number;
  hsnCode: number;
}


export interface MoleculeData {
  moleculeId: number;
}

export interface ProductListData {
  productId: string;
  productName: string;
  categoryName?: string;
  pricingDetails: PricingData[];

}


