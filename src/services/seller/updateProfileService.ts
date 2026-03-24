import api from '@/src/lib/api';
import { sellerAuthService } from './authService';
import { sellerProfileService } from './sellerProfileService';
import { 
  UpdateSellerProfileRequest,
  UpdateRequestResponse,
  CompanySectionUpdate,
  CoordinatorSectionUpdate,
  GSTSectionUpdate,
  BankSectionUpdate,
  LicenseSectionUpdate,
  UpdateAddressRequest
} from '@/src/types/seller/UpdateProfileData';
import { SellerProfile, SellerDocument } from '@/src/types/seller/SellerProfileData';

class UpdateProfileService {
  private readonly baseUrl = '/sellers';

  /**
   * Transform SellerProfile to UpdateSellerProfileRequest matching backend DTO
   */
  private transformProfileToUpdateRequest(profile: SellerProfile): UpdateSellerProfileRequest {
    // Helper function to format date as YYYY-MM-DD
    const formatDate = (dateString?: string): string => {
      if (!dateString) return '';
      // If it's already in YYYY-MM-DD format, return as is
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
      // If it's ISO string, extract the date part
      if (dateString.includes('T')) return dateString.split('T')[0];
      return dateString;
    };

    return {
      // Seller basic info - all required by backend
      sellerName: profile.sellerName,
      companyTypeId: profile.companyType?.companyTypeId || 0,
      sellerTypeId: profile.sellerType?.sellerTypeId || 0,
      phone: profile.phone,
      email: profile.email,
      website: profile.website || '',
      termsAccepted: profile.termsAccepted,
      
      // Address - all fields required
      address: {
        stateId: profile.address?.state?.stateId || 0,
        districtId: profile.address?.district?.districtId || 0,
        talukaId: profile.address?.taluka?.talukaId || 0,
        city: profile.address?.city || '',
        street: profile.address?.street || '',
        buildingNo: profile.address?.buildingNo || '',
        landmark: profile.address?.landmark || '',
        pinCode: profile.address?.pinCode || ''
      },
      
      // Coordinator - all fields required
      coordinator: {
        name: profile.coordinator?.name || '',
        designation: profile.coordinator?.designation || '',
        email: profile.coordinator?.email || '',
        mobile: profile.coordinator?.mobile || ''
      },
      
      // Bank Details - all fields required
      bankDetails: {
        bankName: profile.bankDetails?.bankName || '',
        branch: profile.bankDetails?.branch || '',
        ifscCode: profile.bankDetails?.ifscCode || '',
        accountNumber: profile.bankDetails?.accountNumber || '',
        accountHolderName: profile.bankDetails?.accountHolderName || '',
        bankDocumentFileUrl: profile.bankDetails?.bankDocumentFileUrl || ''
      },
      
      // GST fields
      gstNumber: profile.sellerGST?.gstNumber || '',
      gstFileUrl: profile.sellerGST?.gstFileUrl || '',
      
      // Documents - include all with proper fields
      documents: profile.documents.map((doc: SellerDocument) => ({
        documentId: doc.sellerDocumentsId, // Include existing ID for updates
        productTypeId: doc.productTypes?.productTypeId || 0,
        documentNumber: doc.documentNumber || '',
        documentFileUrl: doc.documentFileUrl || '',
        licenseIssueDate: formatDate(doc.licenseIssueDate),
        licenseExpiryDate: formatDate(doc.licenseExpiryDate),
        licenseIssuingAuthority: doc.licenseIssuingAuthority || ''
      })),
      
      // Product Types
      productTypeId: profile.productTypes.map(pt => pt.productTypeId)
    };
  }

  /**
   * Get numeric seller ID from profile (fallback if string ID doesn't work)
   */
  private getNumericSellerId(profile: SellerProfile): number | null {
    // Try to get numeric ID from various sources
    if (profile.address?.sellerAddressId) {
      return profile.address.sellerAddressId;
    }
    if (profile.coordinator?.sellerCoordinatorId) {
      return profile.coordinator.sellerCoordinatorId;
    }
    if (profile.bankDetails?.sellerBankDetailsId) {
      return profile.bankDetails.sellerBankDetailsId;
    }
    if (profile.sellerGST?.sellerGstId) {
      return profile.sellerGST.sellerGstId;
    }
    return null;
  }

  /**
   * Request update for seller profile
   * @param updateData - The complete updated profile data
   * @param requestedBy - Email of the person requesting the update
   */
  async requestProfileUpdate(
    updateData: UpdateSellerProfileRequest, 
    requestedBy: string
  ): Promise<UpdateRequestResponse> {
    console.log('📝 Requesting seller profile update');
    
    try {
      const currentUser = sellerAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      
      const profile = await sellerProfileService.getCurrentSellerProfile();
      
      // Try string sellerId first (from controller analysis)
      const sellerId = profile.sellerId;
      
      const token = sellerAuthService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Log the request details for debugging
      console.log('🔍 Request details:', {
        sellerId,
        sellerIdType: typeof sellerId,
        numericId: this.getNumericSellerId(profile),
        requestedBy,
        url: `${this.baseUrl}/${sellerId}/request-update?requestedBy=${encodeURIComponent(requestedBy)}`
      });
      
      console.log('📦 Update payload:', JSON.stringify(updateData, null, 2));
      
      // Validate required fields before sending
      this.validateUpdateRequest(updateData);
      
      const response = await api.put<{ status: string; message: string; data: UpdateRequestResponse }>(
        `${this.baseUrl}/${sellerId}/request-update?requestedBy=${encodeURIComponent(requestedBy)}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Update request response:', {
        status: response.data.status,
        message: response.data.message,
        data: response.data.data
      });
      
      if (response.data.status === "SUCCESS" && response.data.data) {
        console.log('✅ Profile update requested successfully');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to request profile update');
      }
      
    } catch (error: any) {
      console.error('❌ Error requesting profile update:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        data: error.config?.data
      });
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const validationErrors = error.response?.data;
        console.error('Validation errors:', validationErrors);
        throw new Error(this.formatValidationErrors(validationErrors));
      }
      
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update this profile');
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Seller profile not found with ID: ${error.config?.url?.split('/')[3]}`);
      }
      
      throw error;
    }
  }

  /**
   * Validate that all required fields are present
   */
  private validateUpdateRequest(data: UpdateSellerProfileRequest): void {
    const required = [
      'sellerName', 'companyTypeId', 'sellerTypeId', 'phone', 'email', 'termsAccepted'
    ];
    
    const missing = required.filter(field => !data[field as keyof UpdateSellerProfileRequest]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Validate address
    if (!data.address?.stateId || !data.address?.districtId || !data.address?.talukaId) {
      throw new Error('Address state, district, and taluka are required');
    }
    
    // Validate coordinator
    if (!data.coordinator?.name || !data.coordinator?.email || !data.coordinator?.mobile) {
      throw new Error('Coordinator name, email, and mobile are required');
    }
    
    // Validate bank details
    if (!data.bankDetails?.bankName || !data.bankDetails?.ifscCode || !data.bankDetails?.accountNumber) {
      throw new Error('Bank name, IFSC code, and account number are required');
    }
  }

  /**
   * Format validation errors from backend
   */
  private formatValidationErrors(errors: any): string {
    if (typeof errors === 'string') return errors;
    if (errors.message) return errors.message;
    if (Array.isArray(errors)) {
      return errors.map(e => e.message || e).join(', ');
    }
    return 'Validation failed. Please check all required fields.';
  }


 async updateFullProfile(
  updateData: UpdateSellerProfileRequest,
  requestedBy: string
): Promise<UpdateRequestResponse> {
  console.log('📦 Requesting full profile update');
  
  try {
    const currentUser = sellerAuthService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const profile = await sellerProfileService.getCurrentSellerProfile();
    const sellerId = profile.sellerId;
    
    const token = sellerAuthService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    console.log(`📤 Sending full update for seller ID: ${sellerId}`);
    console.log('📦 Update payload:', JSON.stringify(updateData, null, 2));
    
  
    const response = await api.put<{ status: string; message: string; data: UpdateRequestResponse }>(
      `${this.baseUrl}/${sellerId}/request-update?requestedBy=${encodeURIComponent(requestedBy)}`,
      updateData, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Full profile update response:', {
      status: response.data.status,
      message: response.data.message,
      data: response.data.data
    });
    
    if (response.data.status === "SUCCESS") {
      console.log('✅ Full profile update requested successfully');
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to request profile update');
    }
    
  } catch (error: any) {
    console.error('❌ Error in full profile update:', error);
    throw error;
  }
}

  /**
   * Request update for company section
   */
  async updateCompanySection(
    sectionData: CompanySectionUpdate,
    requestedBy: string
  ): Promise<UpdateRequestResponse> {
    console.log('🏢 Requesting company section update');
    
    try {
      const currentProfile = await sellerProfileService.getCurrentSellerProfile();
      const fullUpdateData = this.transformProfileToUpdateRequest(currentProfile);
      
      // Update company fields (only if provided)
      if (sectionData.sellerName !== undefined) fullUpdateData.sellerName = sectionData.sellerName;
      if (sectionData.companyTypeId !== undefined) fullUpdateData.companyTypeId = sectionData.companyTypeId;
      if (sectionData.sellerTypeId !== undefined) fullUpdateData.sellerTypeId = sectionData.sellerTypeId;
      if (sectionData.productTypeId !== undefined) fullUpdateData.productTypeId = sectionData.productTypeId;
      if (sectionData.phone !== undefined) fullUpdateData.phone = sectionData.phone;
      if (sectionData.email !== undefined) fullUpdateData.email = sectionData.email;
      if (sectionData.website !== undefined) fullUpdateData.website = sectionData.website;
      
      // Update address if provided (partial update allowed)
      if (sectionData.address) {
        fullUpdateData.address = {
          ...fullUpdateData.address,
          ...sectionData.address
        };
      }
      
      // Ensure termsAccepted is always true
      fullUpdateData.termsAccepted = true;
      
      return this.requestProfileUpdate(fullUpdateData, requestedBy);
      
    } catch (error) {
      console.error('❌ Error updating company section:', error);
      throw error;
    }
  }

  /**
   * Request update for coordinator section
   */
  async updateCoordinatorSection(
    sectionData: CoordinatorSectionUpdate,
    requestedBy: string
  ): Promise<UpdateRequestResponse> {
    console.log('👤 Requesting coordinator section update');
    
    try {
      const currentProfile = await sellerProfileService.getCurrentSellerProfile();
      const fullUpdateData = this.transformProfileToUpdateRequest(currentProfile);
      
      // Update coordinator fields (partial update allowed)
      fullUpdateData.coordinator = {
        ...fullUpdateData.coordinator,
        ...sectionData
      };
      
      return this.requestProfileUpdate(fullUpdateData, requestedBy);
      
    } catch (error) {
      console.error('❌ Error updating coordinator section:', error);
      throw error;
    }
  }

  /**
   * Request update for GST section
   */
  async updateGSTSection(
    sectionData: GSTSectionUpdate,
    requestedBy: string
  ): Promise<UpdateRequestResponse> {
    console.log('📄 Requesting GST section update');
    
    try {
      const currentProfile = await sellerProfileService.getCurrentSellerProfile();
      const fullUpdateData = this.transformProfileToUpdateRequest(currentProfile);
      
      // Update GST fields (partial update allowed)
      if (sectionData.gstNumber !== undefined) fullUpdateData.gstNumber = sectionData.gstNumber;
      if (sectionData.gstFileUrl !== undefined) fullUpdateData.gstFileUrl = sectionData.gstFileUrl;
      
      return this.requestProfileUpdate(fullUpdateData, requestedBy);
      
    } catch (error) {
      console.error('❌ Error updating GST section:', error);
      throw error;
    }
  }

  /**
   * Request update for bank section
   */
  async updateBankSection(
    sectionData: BankSectionUpdate,
    requestedBy: string
  ): Promise<UpdateRequestResponse> {
    console.log('🏦 Requesting bank section update');
    
    try {
      const currentProfile = await sellerProfileService.getCurrentSellerProfile();
      const fullUpdateData = this.transformProfileToUpdateRequest(currentProfile);
      
      // Update bank fields (partial update allowed)
      fullUpdateData.bankDetails = {
        ...fullUpdateData.bankDetails,
        ...sectionData
      };
      
      return this.requestProfileUpdate(fullUpdateData, requestedBy);
      
    } catch (error) {
      console.error('❌ Error updating bank section:', error);
      throw error;
    }
  }

  /**
   * Request update for a specific license/document
   */
  async updateLicenseSection(
    productTypeId: number,
    sectionData: LicenseSectionUpdate,
    requestedBy: string
  ): Promise<UpdateRequestResponse> {
    console.log(`📋 Requesting license update for product type: ${productTypeId}`);
    
    try {
      const currentProfile = await sellerProfileService.getCurrentSellerProfile();
      const fullUpdateData = this.transformProfileToUpdateRequest(currentProfile);
      
      // Find and update the specific document
      const documentIndex = fullUpdateData.documents.findIndex(
        doc => doc.productTypeId === productTypeId
      );
      
      if (documentIndex !== -1) {
        fullUpdateData.documents[documentIndex] = {
          ...fullUpdateData.documents[documentIndex],
          ...sectionData
        };
      } else {
        // If document doesn't exist
        fullUpdateData.documents.push({
          documentId: undefined, // null for new documents
          productTypeId,
          documentNumber: sectionData.documentNumber || '',
          documentFileUrl: sectionData.documentFileUrl || '',
          licenseIssueDate: sectionData.licenseIssueDate || '',
          licenseExpiryDate: sectionData.licenseExpiryDate || '',
          licenseIssuingAuthority: sectionData.licenseIssuingAuthority || ''
        });
      }
      
      return this.requestProfileUpdate(fullUpdateData, requestedBy);
      
    } catch (error) {
      console.error('❌ Error updating license section:', error);
      throw error;
    }
  }

  /**
   * Get the current user's email for requestedBy field
   */
  getCurrentUserEmail(): string {
    const currentUser = sellerAuthService.getCurrentUser();
    return currentUser?.username || '';
  }

  /**
   * Test the connection with a simple update
   */
  async testConnection(): Promise<boolean> {
    try {
      const profile = await sellerProfileService.getCurrentSellerProfile();
      console.log('✅ Successfully fetched profile:', profile.sellerId);
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

export const updateProfileService = new UpdateProfileService();
