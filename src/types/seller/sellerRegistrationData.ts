// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  statusCode: string;
  message: string;
  data: T;
  total?: number;
}


// ==================== EMAIL OTP ====================

export interface EmailOtpSendRequest {
  email: string;
}

export interface EmailOtpVerifyRequest {
  email: string;
  otp: string;
}

// ==================== COORDINATOR EMAIL CHECK ====================

export interface CoordinatorEmailCheckResponse {
  exists: boolean;
}



// ==================== SMS OTP ====================

export interface SMSOtpRequest {
  phone: string;
}

export interface SMSVerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface SMSOtpResponse {
  status: string;
  message: string;
}

// ==================== COORDINATOR PHONE CHECK ====================

export interface CoordinatorPhoneCheckResponse {
  exists: boolean;
}


// ==================== OTP RESPONSE ====================

export interface OtpResponse {
  status: string;
  message: string;
}

// ==================== ADDRESS ====================

export interface TempSellerAddress {
  stateId: number;
  districtId: number;
  talukaId: number;
  city: string;
  street: string;
  buildingNo: string;
  landmark?: string;
  pinCode: string;
}

// ==================== BANK DETAILS ====================

export interface TempSellerBankDetails {
  bankName: string;
  branch: string;
  ifscCode: string;
  accountNumber: string;
  accountHolderName: string;
  bankDocumentFileUrl: string;
}

// ==================== DOCUMENT ====================

export interface TempSellerDocument {
  gstNumber ?: string;
  gstFileUrl ?: string;
  productTypeId: number;
  documentNumber: string;
  documentFileUrl: string;
  licenseIssueDate?: string; 
  licenseExpiryDate?: string;  
  licenseIssuingAuthority?: string; 
}

// ==================== MAIN SELLER REGISTRATION ====================

export interface TempSellerRequest {
  gstNumber ?: string;        
  gstFileUrl ?: string; 
  sellerName: string;
  productTypeId: number[];
  companyTypeId: number;
  sellerTypeId: number;
  phone: string;
  email: string;
  termsAccepted: boolean;
  website?: string;
  address?: TempSellerAddress;
  coordinator?: TempSellerCoordinator;
  bankDetails?: TempSellerBankDetails;
  documents?: TempSellerDocument[];
}

export interface TempSellerResponse {
  tempSellerId: number;
  sellerName: string;
  sellerRequestId: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string | null; // ISO date string
}

// ==================== ADMIN/SELLER LISTING ====================

export interface TempSellerAdminResponse {
  tempSellerId: number;
  tempSellerRequestId: string;
  tempSellerName: string;
  tempSellerEmail: string;
  createdAt: string;
  status: string;
}

// ==================== SELLER APPROVAL ====================

export type SellerApprovalStatus = 'ACCEPT' | 'REJECT' | 'CORRECTION';

export interface SellerApprovalRequest {
  id: number;
  status: SellerApprovalStatus;
  comments: string;
}



// ==================== MASTER DATA TYPES ====================

export interface ProductTypeMaster {
  id: number;
  name: string;
  description?: string;
}

export interface CompanyTypeMaster {
  id: number;
  name: string;
}

export interface SellerTypeMaster {
  id: number;
  name: string;
}

export interface StateMaster {
  id: number;
  name: string;
}

export interface DistrictMaster {
  id: number;
  name: string;
  stateId: number;
}

export interface TalukaMaster {
  id: number;
  name: string;
  districtId: number;
}

// ==================== FORM VALIDATION CONSTANTS ====================

export const SELLER_VALIDATION = {
  PHONE: {
    pattern: '^[0-9]{10}$',
    message: 'Phone must be 10 digits'
  },
  PINCODE: {
    pattern: '^[0-9]{6}$',
    message: 'PIN code must be 6 digits'
  },
  MOBILE: {
    pattern: '^[0-9]{10}$',
    message: 'Mobile must be 10 digits'
  },
  MAX_LENGTHS: {
    SELLER_NAME: 100,
    BANK_NAME: 100,
    BRANCH: 100,
    IFSC: 100,
    ACCOUNT_NUMBER: 100,
    ACCOUNT_HOLDER: 100,
    COORDINATOR_NAME: 100,
    DESIGNATION: 100,
    EMAIL: 100,
    DOCUMENT_NUMBER: 100,
    GST_NUMBER: 100
  }
} as const;

// ==================== EXTENDED TYPES FOR UI/CLIENT USE ====================

/**
 * Extended document interface for UI state that includes File object
 * This is used only on the frontend before upload
 */
export interface TempSellerDocumentWithFile extends Omit<TempSellerDocument, 'documentFileUrl'> {
  documentFile?: File | null;
}

/**
 * Extended bank details interface for UI state that includes File object
 * This is used only on the frontend before upload
 */
export interface TempSellerBankDetailsWithFile extends Omit<TempSellerBankDetails, 'bankDocumentFileUrl'> {
  bankDocumentFile?: File | null;
}

/**
 * Complete form state interface for the seller registration form
 * This includes all UI-specific fields and file objects
 */
export interface TempSellerFormState {
  // Company Information
  sellerName: string;
  companyType: string;
  sellerType: string;
  productTypes: string[]; // Product type names for display
  productTypeIds: number[]; // Product type IDs for submission
  
  // Address
  state: string;
  district: string;
  taluka: string;
  city: string;
  street: string;
  buildingNo: string;
  landmark: string;
  pincode: string;
  
  // Contact
  phone: string;
  email: string;
  website: string;
  
  // Coordinator
  coordinatorName: string;
  coordinatorDesignation: string;
  coordinatorEmail: string;
  coordinatorMobile: string;
  
  // GST
  gstNumber: string;
  gstFile: File | null;
  
  // Licenses
  licenses: Record<string, {
    number: string;
    file: File | null;
    issueDate: Date | null;       
    expiryDate: Date | null;      
    issuingAuthority: string;      
    status: 'Active' | 'Expired';
  }>;
  
  // Bank Details
  bankState: string;
  bankDistrict: string;
  bankName: string;
  branch: string;
  ifscCode: string;
  accountNumber: string;
  accountHolderName: string;
  cancelledChequeFile: File | null;
}

// ==================== SELLER DETAILS RESPONSE (Full) ====================

export interface TempSellerDetailsResponse extends TempSellerResponse {
  address?: TempSellerAddress & {
    stateName?: string;
    districtName?: string;
    talukaName?: string;
  };
  coordinator?: TempSellerCoordinator;
  bankDetails?: TempSellerBankDetails;
  documents?: (TempSellerDocument & {
    productTypeName?: string;
  })[];
  companyTypeName?: string;
  sellerTypeName?: string;
  productTypeNames?: string[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}



export interface TempSellerCoordinator {
  tempSellerCoordinatorId?: number;
  name: string;
  designation: string;
  email: string;
  isEmailVerified?: boolean;
  mobile: string;
  isPhoneVerified?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}





// ==================== SELLER REGISTRATION STATE ====================

export interface SellerRegistrationState {
  // Step management
  currentStep: number;
  
  // Verification status
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Form data
  formData: TempSellerFormState;
  
  // Submission state
  isSubmitting: boolean;
  isSubmitted: boolean;
  submissionError: string | null;
  submissionResponse: TempSellerResponse | null;
  
  // UI state
  isProductDropdownOpen: boolean;
  ifscError: string | null;
}

// ==================== SELLER REGISTRATION HOOK RETURN TYPE ====================

export interface UseSellerRegistrationReturn {
  // State
  currentStep: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  formData: TempSellerFormState;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submissionError: string | null;
  submissionResponse: TempSellerResponse | null;
  isProductDropdownOpen: boolean;
  ifscError: string | null;
  
  // Actions
  setCurrentStep: (step: number) => void;
  setEmailVerified: (verified: boolean) => void;
  setPhoneVerified: (verified: boolean) => void;
  setFormData: (data: Partial<TempSellerFormState>) => void;
  updateFormField: <K extends keyof TempSellerFormState>(
    field: K,
    value: TempSellerFormState[K]
  ) => void;
  setIsProductDropdownOpen: (isOpen: boolean) => void;
  setIfscError: (error: string | null) => void;
  
  // Product type handlers
  handleProductTypeToggle: (productName: string, productId: number) => void;
  handleSelectAllProductTypes: (products: { id: number; name: string }[]) => void;
  
  // License handlers
  updateLicenseNumber: (productName: string, number: string) => void;
  updateLicenseFile: (productName: string, file: File | null) => void;
  
  // File handlers
  setGstFile: (file: File | null) => void;
  setCancelledChequeFile: (file: File | null) => void;
  
  // Form submission
  submitRegistration: () => Promise<TempSellerResponse | undefined>;
  
  // Reset
  resetRegistration: () => void;
}