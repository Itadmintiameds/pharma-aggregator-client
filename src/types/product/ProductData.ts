export interface ProductData {
  productId: string;
  productCategoryId: string;
  productName: string;
  therapeuticCategory: string;
  therapeuticSubcategory: string;
  dosageForm: string;
  strength: number;
  warningsPrecautions: string;
  productDescription: string;
  productMarketingUrl: string;
}


export interface PackagingData {
  packagingUnit: string;
  numberOfUnits: number;
  packSize: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
}


export interface PricingData {
  batchLotNumber: string;
  manufacturerName: string;
   manufacturingDate: string | null; 
  expiryDate: string | null;    
  storageCondition: string;
  stockQuantity: number;
  pricePerUnit: number;
  mrp: number;
  discountPercentage: number;
  gstPercentage: number;
  hsnCode: number;
}

export interface CreateDrugProductRequest {
  product: ProductData;
  packagingDetails: PackagingData;
  pricingDetails: PricingData[];
  moleculeIds: number[];
}
