import api from '@/src/lib/api';
import { sellerAuthService } from './authService';
import { 
  SellerProfile, 
  ApiResponse,
  ProfileState,
  SellerDocument
} from '@/src/types/seller/SellerProfileData';

class SellerProfileService {
  private readonly baseUrl = '/sellers';
  
  /**
   * Get seller profile by user ID
   * @param userId - The user ID from the auth data
   */
  async getProfileByUserId(userId: number): Promise<SellerProfile> {
    console.log(`👤 Fetching seller profile for user ID: ${userId}`);
    
    try {
      // Check if user is authenticated
      const token = sellerAuthService.getToken();
      if (!token) {
        console.error('❌ No authentication token found');
        throw new Error('Not authenticated');
      }
      
      console.log('🔑 Token found, making API request');
      
      const response = await api.get<ApiResponse<SellerProfile>>(
        `${this.baseUrl}/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Profile API response received:', {
        status: response.data.status,
        message: response.data.message,
        hasData: !!response.data.data
      });
      
      // Check if response is successful
      if (response.data.status === "SUCCESS" && response.data.data) {
        console.log('✅ Profile data fetched successfully for:', response.data.data.sellerName);
        
        // Log some key details for debugging
        const profile = response.data.data;
        console.log('📊 Profile summary:', {
          sellerId: profile.sellerId,
          sellerName: profile.sellerName,
          email: profile.email,
          phone: profile.phone,
          status: profile.status,
          address: `${profile.address.city}, ${profile.address.state.stateName}`,
          coordinator: profile.coordinator.name,
          documentsCount: profile.documents.length,
          productTypesCount: profile.productTypes.length
        });
        
        return profile;
      } else {
        const errorMsg = response.data.message || 'Failed to fetch profile';
        console.error('❌ Profile fetch failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching seller profile:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId: userId
      });
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.log('🔒 Unauthorized - clearing auth and redirecting');
        sellerAuthService.clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/?showLogin=true&sessionExpired=true';
        }
        throw new Error('Session expired. Please login again.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this profile');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Seller profile not found');
      }
      
      throw error;
    }
  }

  async refreshProfile(): Promise<SellerProfile> {
  console.log('🔄 Refreshing seller profile');
  
  // Clear any cached data if you have caching
  const profile = await this.getCurrentSellerProfile();
  
  // You could also emit an event that profile was refreshed
  // eventEmitter.emit('profileRefreshed', profile);
  
  return profile;
}
  
  /**
   * Get current seller profile using the logged-in user's ID
   */
  async getCurrentSellerProfile(): Promise<SellerProfile> {
    console.log('👤 Fetching current seller profile');
    
    // Get current user from auth service
    const currentUser = sellerAuthService.getCurrentUser();
    
    if (!currentUser) {
      console.error('❌ No current user found');
      throw new Error('No user logged in');
    }
    
    if (!currentUser.userId) {
      console.error('❌ User ID not found in current user data');
      throw new Error('User ID not available');
    }
    
    console.log(`👤 Current user ID: ${currentUser.userId}, username: ${currentUser.username}`);
    
    return this.getProfileByUserId(currentUser.userId);
  }
  
  /**
   * Update seller profile (if you have an update endpoint)
   * This is a placeholder - add actual endpoint when available
   */
  async updateProfile(profileData: Partial<SellerProfile>): Promise<SellerProfile> {
    console.log('📝 Updating seller profile');
    
    try {
      const currentUser = sellerAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      
      const token = sellerAuthService.getToken();
      
      // Replace with your actual update endpoint
      const response = await api.put<ApiResponse<SellerProfile>>(
        `${this.baseUrl}/${currentUser.userId}`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "SUCCESS" && response.data.data) {
        console.log('✅ Profile updated successfully');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
      
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  }
  
  /**
   * Get profile state for components (loading, error, data)
   * Useful for React components
   */
  getInitialProfileState(): ProfileState {
    return {
      profile: null,
      isLoading: false,
      error: null
    };
  }
  
  /**
   * Check if profile is complete (useful for profile completion checks)
   */
  isProfileComplete(profile: SellerProfile): {
    isComplete: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];
    
    if (!profile.sellerName) missingFields.push('sellerName');
    if (!profile.phone) missingFields.push('phone');
    if (!profile.email) missingFields.push('email');
    if (!profile.address) missingFields.push('address');
    if (!profile.bankDetails) missingFields.push('bankDetails');
    if (!profile.sellerGST) missingFields.push('gstDetails');
    if (profile.documents.length === 0) missingFields.push('documents');
    
    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }
  
  /**
   * Format address from profile for display
   */
  formatAddress(profile: SellerProfile): string {
    const addr = profile.address;
    if (!addr) return 'Address not available';
    
    const parts = [
      addr.buildingNo,
      addr.street,
      addr.landmark,
      addr.city,
      addr.district?.districtName,
      addr.state?.stateName,
      addr.pinCode
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  }
  
  /**
   * Get primary document for a specific product type
   */
  getDocumentForProductType(profile: SellerProfile, productTypeId: number): SellerDocument | undefined {
    return profile.documents.find(doc => doc.productTypes?.productTypeId === productTypeId);
  }
  
  /**
   * Check if profile has a specific product type
   */
  hasProductType(profile: SellerProfile, productTypeId: number): boolean {
    return profile.productTypes.some(pt => pt.productTypeId === productTypeId);
  }
}

// Create and export a singleton instance
export const sellerProfileService = new SellerProfileService();


export const getSellerProductTypes = async () => {
  try {
    const response = await api.get("/sellers/product-types"); 
    return response.data.data;
  } catch (error: unknown) {
    console.error("Error fetching Product Types:", error);

    if (error instanceof Error) {
      throw new Error(`Error fetching Product Types: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while fetching Product Types.");
    }
  }
};