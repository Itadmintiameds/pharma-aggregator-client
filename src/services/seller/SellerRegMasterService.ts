import api from "@/src/lib/api";
import {
  CompanyTypeResponse,
  DistrictResponse,
  ProductTypeResponse,
  SellerTypeResponse,
  StateResponse,
  TalukaResponse,
} from "@/src/types/seller/SellerRegMasterData";


interface ApiResponse<T> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

class SellerRegMasterService {
  // ==================== COMPANY TYPESs ====================
  async getCompanyTypes(): Promise<CompanyTypeResponse[]> {
    try {
      console.log("🔍 Service: Fetching company types...");
      const response = await api.get<ApiResponse<CompanyTypeResponse[]>>('/company-types');
      console.log("🔍 Service: Company types response:", response.data);
      
      const companyTypes = response.data?.data || [];
      console.log("🔍 Service: Extracted company types:", companyTypes);
      console.log("🔍 Service: Company types count:", companyTypes?.length);
      
      return Array.isArray(companyTypes) ? companyTypes : [];
    } catch (error) {
      console.error('❌ Service: Error fetching company types:', error);
      throw error;
    }
  }

  // ==================== PRODUCT TYPES ====================
  async getProductTypes(): Promise<ProductTypeResponse[]> {
    try {
      console.log("🔍 Service: Fetching product types...");
      const response = await api.get<ApiResponse<ProductTypeResponse[]>>('/product-types');
      console.log("🔍 Service: Product types response:", response.data);
      
      const productTypes = response.data?.data || [];
      console.log("🔍 Service: Extracted product types:", productTypes);
      console.log("🔍 Service: Product types count:", productTypes?.length);
      
      return Array.isArray(productTypes) ? productTypes : [];
    } catch (error) {
      console.error('❌ Service: Error fetching product types:', error);
      throw error;
    }
  }

  // ==================== SELLER TYPES ====================
  async getSellerTypes(): Promise<SellerTypeResponse[]> {
    try {
      console.log("🔍 Service: Fetching seller types...");
      const response = await api.get<ApiResponse<SellerTypeResponse[]>>('/seller-types');
      console.log("🔍 Service: Seller types response:", response.data);
      
      const sellerTypes = response.data?.data || [];
      console.log("🔍 Service: Extracted seller types:", sellerTypes);
      console.log("🔍 Service: Seller types count:", sellerTypes?.length);
      
      return Array.isArray(sellerTypes) ? sellerTypes : [];
    } catch (error) {
      console.error('❌ Service: Error fetching seller types:', error);
      throw error;
    }
  }

  // ==================== STATES ====================
  async getStates(): Promise<StateResponse[]> {
    try {
      console.log("🔍 Service: Fetching states...");
      const response = await api.get<ApiResponse<StateResponse[]>>('/states');
      console.log("🔍 Service: States response:", response.data);
      
      const states = response.data?.data || [];
      console.log("🔍 Service: Extracted states:", states);
      console.log("🔍 Service: States count:", states?.length);
      
      return Array.isArray(states) ? states : [];
    } catch (error) {
      console.error('❌ Service: Error fetching states:', error);
      throw error;
    }
  }

  // ==================== DISTRICTS ====================
  async getDistricts(): Promise<DistrictResponse[]> {
    try {
      console.log("🔍 Service: Fetching districts...");
      const response = await api.get<ApiResponse<DistrictResponse[]>>('/districts');
      console.log("🔍 Service: Districts response:", response.data);
      
      const districts = response.data?.data || [];
      console.log("🔍 Service: Extracted districts:", districts);
      console.log("🔍 Service: Districts count:", districts?.length);
      
      return Array.isArray(districts) ? districts : [];
    } catch (error) {
      console.error('❌ Service: Error fetching districts:', error);
      throw error;
    }
  }

  // ==================== TALUKAS ====================
  async getTalukas(): Promise<TalukaResponse[]> {
    try {
      console.log("🔍 Service: Fetching talukas...");
      const response = await api.get<ApiResponse<TalukaResponse[]>>('/talukas');
      console.log("🔍 Service: Talukas response:", response.data);
      
      const talukas = response.data?.data || [];
      console.log("🔍 Service: Extracted talukas:", talukas);
      console.log("🔍 Service: Talukas count:", talukas?.length);
      
      return Array.isArray(talukas) ? talukas : [];
    } catch (error) {
      console.error('❌ Service: Error fetching talukas:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sellerRegMasterService = new SellerRegMasterService();