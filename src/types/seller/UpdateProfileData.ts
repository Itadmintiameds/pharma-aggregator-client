export interface UpdateAddressRequest {
  stateId: number;
  districtId: number;
  talukaId: number;
  city: string;
  street: string;
  buildingNo: string;
  landmark: string;
  pinCode: string;
}

export interface UpdateCoordinatorRequest {
  name: string;
  designation: string;
  email: string;
  mobile: string;
}

export interface UpdateBankDetailsRequest {
  bankName: string;
  branch: string;
  ifscCode: string;
  accountNumber: string;
  accountHolderName: string;
  // bankDocumentFileUrl: string;
   bankDocumentFileUrl: string | 'PENDING';
}

export interface UpdateDocumentRequest {
  documentId?: number; 
  productTypeId: number;
  documentNumber: string;
  documentFileUrl: string | 'PENDING';
  licenseIssueDate: string;
  licenseExpiryDate: string;
  licenseIssuingAuthority: string;
  licenseStatus: 'Active' | 'InActive';
}

export interface UpdateSellerProfileRequest {
  sellerName: string;
  productTypeId: number[];
  companyTypeId: number;
  sellerTypeId: number;
  phone: string;
  email: string;
  termsAccepted: boolean;
  website: string;
  address: UpdateAddressRequest;
  coordinator: UpdateCoordinatorRequest;
  bankDetails: UpdateBankDetailsRequest;
  gstNumber: string;
  // gstFileUrl: string;
  gstFileUrl: string | 'PENDING';
  companyRegistrationCertificateUrl: string | 'PENDING';
  documents: UpdateDocumentRequest[];
}

// ========== UPDATE RESPONSE TYPE ==========

export interface UpdateRequestResponse {
  status: string;
  pendingSellerId: number;
  sellerId: string;
  sellerName?: string;
  phone?: string;
  email?: string;
  productTypeId?: number[];
  companyTypeId?: number;
  sellerTypeId?: number;
  termsAccepted?: boolean;
  website?: string;
  address?: UpdateAddressRequest;
  coordinator?: UpdateCoordinatorRequest;
  bankDetails?: UpdateBankDetailsRequest;
  gstNumber?: string;
  gstFileUrl?: string;
  documents?: Array<{
    pendingSellerDocumentId: number;
    productTypeId: number;
    productTypeName: string;
    documentNumber: string;
    documentFileUrl: string;
    licenseIssueDate?: string;
    licenseExpiryDate?: string;
    licenseIssuingAuthority?: string;
  }>;
  message?: string;
}


// this interface is require , dont delete it.........

// export interface UpdateRequestResponse {
//   status: string;
//   message: string;
//   data: {
//     pendingSellerId: number;  
//     sellerId: string;
//     sellerName?: string;
//     phone?: string;
//     email?: string;
//     productTypeId?: number[];
//     companyTypeId?: number;
//     sellerTypeId?: number;
//     termsAccepted?: boolean;
//     website?: string;
//     address?: UpdateAddressRequest;
//     coordinator?: UpdateCoordinatorRequest;
//     bankDetails?: UpdateBankDetailsRequest;
//     gstNumber?: string;
//     gstFileUrl?: string;
//     documents?: any[];
//   };
// }

// ========== SECTION UPDATE TYPES ==========

export interface CompanySectionUpdate {
  sellerName?: string;
  productTypeId?: number[];
  companyTypeId?: number;
  sellerTypeId?: number;
  phone?: string;
  email?: string;
  website?: string;
  address?: Partial<UpdateAddressRequest>;
}

export interface CoordinatorSectionUpdate {
  name?: string;
  designation?: string;
  email?: string;
  mobile?: string;
}

export interface LicenseSectionUpdate {
  documentNumber?: string;
  documentFileUrl?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  licenseIssuingAuthority?: string;
}

export interface GSTSectionUpdate {
  gstNumber?: string;
 gstFileUrl?: string | 'PENDING';
}

export interface BankSectionUpdate {
  bankName?: string;
  branch?: string;
  ifscCode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  // bankDocumentFileUrl?: string;
  bankDocumentFileUrl?: string | 'PENDING';
}