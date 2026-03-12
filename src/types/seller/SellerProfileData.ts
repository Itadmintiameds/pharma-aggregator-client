// ========== ADDRESS RELATED TYPES ==========
export interface State {
  stateId: number;
  stateName: string;
  stateCode: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface District {
  districtId: number;
  districtName: string;
  districtCode: string;
  isActive: boolean;
  state: State;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface Taluka {
  talukaId: number;
  talukaName: string;
  talukaCode: string;
  isActive: boolean;
  district: District;
  state: State;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface Address {
  sellerAddressId: number;
  buildingNo: string;
  street: string;
  landmark: string;
  city: string;
  pinCode: string;
  district: District;
  taluka: Taluka;
  state: State;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ========== COORDINATOR TYPE ==========
export interface Coordinator {
  sellerCoordinatorId: number;
  name: string;
  designation: string;
  email: string;
  mobile: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ========== BANK DETAILS TYPE ==========
export interface BankDetails {
  sellerBankDetailsId: number;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  ifscCode: string;
  bankDocumentFileUrl: string;
  bankDocumentVerified: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ========== GST DETAILS TYPE ==========
export interface SellerGST {
  sellerGstId: number;
  gstNumber: string;
  gstFileUrl: string;
  gstVerified: boolean;
}

// ========== PRODUCT TYPE ==========
export interface ProductType {
  productTypeId: number;
  productTypeName: string;
  regulatoryCategory: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ========== DOCUMENT TYPE ==========
export interface SellerDocument {
  sellerDocumentsId: number;
  documentNumber: string;
  documentFileUrl: string;
  documentVerified: boolean;
  productTypes: ProductType;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ========== COMPANY TYPE ==========
export interface CompanyType {
  companyTypeId: number;
  companyTypeName: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ========== SELLER TYPE ==========
export interface SellerType {
  sellerTypeId: number;
  sellerTypeName: string;
  sellerTypeAbbreviation: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ========== USER ROLE TYPE ==========
export interface Role {
  roleId: number;
  roleName: string;
  roleDescription: string;
  createdAt: string;
  active: boolean;
}

// ========== USER TYPE ==========
export interface User {
  userId: number;
  username: string;
  passwordHash?: string; // Optional as we may not need to expose
  failedLoginAttempts: number;
  lastLoginAt: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: string | null;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
  accountLocked: boolean;
  active: boolean;
  passwordTemporary: boolean;
}

// ========== MAIN SELLER PROFILE TYPE ==========
export interface SellerProfile {
  sellerId: string;
  sellerName: string;
  phone: string;
  email: string;
  website: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'; 
  termsAccepted: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  
  // Nested objects
  address: Address;
  coordinator: Coordinator;
  bankDetails: BankDetails;
  sellerGST: SellerGST;
  documents: SellerDocument[];
  productTypes: ProductType[];
  companyType: CompanyType;
  sellerType: SellerType;
  user: User;
}

// ========== API RESPONSE TYPE ==========
export interface ApiResponse<T> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

// ========== PROFILE STATE TYPE ==========
export interface ProfileState {
  profile: SellerProfile | null;
  isLoading: boolean;
  error: string | null;
}

// ========== ENUMS FOR STATUS TYPES ==========
export enum SellerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum DocumentVerificationStatus {
  VERIFIED = 'VERIFIED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}