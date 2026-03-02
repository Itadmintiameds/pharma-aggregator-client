

export interface CompanyTypeResponse {
  companyTypeId: number;
  companyTypeName: string;
  isActive: boolean;
}

export interface DistrictResponse {
  districtId: number;
  stateId: number;
  stateName: string;
  districtCode: string;
  districtName: string;
  isActive: boolean;
}

export interface ProductTypeResponse {
  productTypeId: number;
  productTypeName: string;
  regulatoryCategory: string;
  isActive: boolean;
}

export interface SellerTypeResponse {
  sellerTypeId: number;
  sellerTypeName: string;
  isActive: boolean;
}

export interface StateResponse {
  stateId: number;
  stateCode: string;
  stateName: string;
  isActive: boolean;
}

export interface TalukaResponse {
  talukaId: number;
  stateId: number;
  stateName: string;
  districtId: number;
  districtName: string;
  talukaCode: string;
  talukaName: string;
  isActive: boolean;
}