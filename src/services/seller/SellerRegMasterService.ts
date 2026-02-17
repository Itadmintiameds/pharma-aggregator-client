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
  // ==================== COMPANY TYPES ====================
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
      // New endpoint: /districts/state
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

  // ==================== DISTRICTS BY STATE ID ====================
  /**
   * Fetch districts for a specific state
   * GET /districts?stateId={stateId}
   */
  async getDistrictsByStateId(stateId: number): Promise<DistrictResponse[]> {
    try {
      console.log(`🔍 Service: Fetching districts for stateId: ${stateId}...`);
      // You need to confirm the exact endpoint - this is a common pattern
      const response = await api.get<ApiResponse<DistrictResponse[]>>(`/districts?stateId=${stateId}`);
      console.log("🔍 Service: Districts response:", response.data);
      
      const districts = response.data?.data || [];
      console.log("🔍 Service: Extracted districts:", districts);
      console.log("🔍 Service: Districts count:", districts?.length);
      
      return Array.isArray(districts) ? districts : [];
    } catch (error) {
      console.error(`❌ Service: Error fetching districts for state ${stateId}:`, error);
      throw error;
    }
  }

  // ==================== TALUKAS BY DISTRICT ID ====================
  /**
   * Fetch talukas for a specific district
   * GET /talukas?districtId={districtId}
   */
  async getTalukasByDistrictId(districtId: number): Promise<TalukaResponse[]> {
    try {
      console.log(`🔍 Service: Fetching talukas for districtId: ${districtId}...`);
      // You need to confirm the exact endpoint - this is a common pattern
      const response = await api.get<ApiResponse<TalukaResponse[]>>(`/talukas?districtId=${districtId}`);
      console.log("🔍 Service: Talukas response:", response.data);
      
      const talukas = response.data?.data || [];
      console.log("🔍 Service: Extracted talukas:", talukas);
      console.log("🔍 Service: Talukas count:", talukas?.length);
      
      return Array.isArray(talukas) ? talukas : [];
    } catch (error) {
      console.error(`❌ Service: Error fetching talukas for district ${districtId}:`, error);
      throw error;
    }
  }

  // ==================== LEGACY METHODS (Optional - keep if needed) ====================
  // These are inefficient but kept for backward compatibility
  
  async getDistricts(): Promise<DistrictResponse[]> {
    console.warn("⚠️ Warning: Using inefficient getAllDistricts() - consider using getDistrictsByStateId() instead");
    try {
      const response = await api.get<ApiResponse<DistrictResponse[]>>('/districts');
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      console.error('❌ Service: Error fetching all districts:', error);
      throw error;
    }
  }

  async getTalukas(): Promise<TalukaResponse[]> {
    console.warn("⚠️ Warning: Using inefficient getAllTalukas() - consider using getTalukasByDistrictId() instead");
    try {
      const response = await api.get<ApiResponse<TalukaResponse[]>>('/talukas');
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      console.error('❌ Service: Error fetching all talukas:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sellerRegMasterService = new SellerRegMasterService();










// import api from "@/src/lib/api";
// import {
//   CompanyTypeResponse,
//   DistrictResponse,
//   ProductTypeResponse,
//   SellerTypeResponse,
//   StateResponse,
//   TalukaResponse,
// } from "@/src/types/seller/SellerRegMasterData";


// interface ApiResponse<T> {
//   status: string;
//   message: string;
//   count: number | null;
//   data: T;
// }

// class SellerRegMasterService {
//   // ==================== COMPANY TYPESs ====================
//   async getCompanyTypes(): Promise<CompanyTypeResponse[]> {
//     try {
//       console.log("🔍 Service: Fetching company types...");
//       const response = await api.get<ApiResponse<CompanyTypeResponse[]>>('/company-types');
//       console.log("🔍 Service: Company types response:", response.data);
      
//       const companyTypes = response.data?.data || [];
//       console.log("🔍 Service: Extracted company types:", companyTypes);
//       console.log("🔍 Service: Company types count:", companyTypes?.length);
      
//       return Array.isArray(companyTypes) ? companyTypes : [];
//     } catch (error) {
//       console.error('❌ Service: Error fetching company types:', error);
//       throw error;
//     }
//   }

//   // ==================== PRODUCT TYPES ====================
//   async getProductTypes(): Promise<ProductTypeResponse[]> {
//     try {
//       console.log("🔍 Service: Fetching product types...");
//       const response = await api.get<ApiResponse<ProductTypeResponse[]>>('/product-types');
//       console.log("🔍 Service: Product types response:", response.data);
      
//       const productTypes = response.data?.data || [];
//       console.log("🔍 Service: Extracted product types:", productTypes);
//       console.log("🔍 Service: Product types count:", productTypes?.length);
      
//       return Array.isArray(productTypes) ? productTypes : [];
//     } catch (error) {
//       console.error('❌ Service: Error fetching product types:', error);
//       throw error;
//     }
//   }

//   // ==================== SELLER TYPES ====================
//   async getSellerTypes(): Promise<SellerTypeResponse[]> {
//     try {
//       console.log("🔍 Service: Fetching seller types...");
//       const response = await api.get<ApiResponse<SellerTypeResponse[]>>('/seller-types');
//       console.log("🔍 Service: Seller types response:", response.data);
      
//       const sellerTypes = response.data?.data || [];
//       console.log("🔍 Service: Extracted seller types:", sellerTypes);
//       console.log("🔍 Service: Seller types count:", sellerTypes?.length);
      
//       return Array.isArray(sellerTypes) ? sellerTypes : [];
//     } catch (error) {
//       console.error('❌ Service: Error fetching seller types:', error);
//       throw error;
//     }
//   }

//   // ==================== STATES ====================
//   async getStates(): Promise<StateResponse[]> {
//     try {
//       console.log("🔍 Service: Fetching states...");
//       const response = await api.get<ApiResponse<StateResponse[]>>('/districts/state');
//       console.log("🔍 Service: States response:", response.data);
      
//       const states = response.data?.data || [];
//       console.log("🔍 Service: Extracted states:", states);
//       console.log("🔍 Service: States count:", states?.length);
      
//       return Array.isArray(states) ? states : [];
//     } catch (error) {
//       console.error('❌ Service: Error fetching states:', error);
//       throw error;
//     }
//   }

//   // ==================== DISTRICTS ====================
//   async getDistricts(): Promise<DistrictResponse[]> {
//     try {
//       console.log("🔍 Service: Fetching districts...");
//       const response = await api.get<ApiResponse<DistrictResponse[]>>('/districts');
//       console.log("🔍 Service: Districts response:", response.data);
      
//       const districts = response.data?.data || [];
//       console.log("🔍 Service: Extracted districts:", districts);
//       console.log("🔍 Service: Districts count:", districts?.length);
      
//       return Array.isArray(districts) ? districts : [];
//     } catch (error) {
//       console.error('❌ Service: Error fetching districts:', error);
//       throw error;
//     }
//   }

//   // ==================== TALUKAS ====================
//   async getTalukas(): Promise<TalukaResponse[]> {
//     try {
//       console.log("🔍 Service: Fetching talukas...");
//       const response = await api.get<ApiResponse<TalukaResponse[]>>('/talukas');
//       console.log("🔍 Service: Talukas response:", response.data);
      
//       const talukas = response.data?.data || [];
//       console.log("🔍 Service: Extracted talukas:", talukas);
//       console.log("🔍 Service: Talukas count:", talukas?.length);
      
//       return Array.isArray(talukas) ? talukas : [];
//     } catch (error) {
//       console.error('❌ Service: Error fetching talukas:', error);
//       throw error;
//     }
//   }
// }

// // Export singleton instance
// export const sellerRegMasterService = new SellerRegMasterService();