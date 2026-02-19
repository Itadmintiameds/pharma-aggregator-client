import api from "@/src/lib/api";;
import axios from 'axios';


import {
  TempSellerRequest,
  TempSellerResponse,
  TempSellerAdminResponse,
  ApiResponse,
  EmailOtpSendRequest,
  EmailOtpVerifyRequest,
  OtpResponse,
  SMSOtpRequest,
  SMSVerifyOtpRequest,
  SMSOtpResponse,
  SellerApprovalRequest,
} from "@/src/types/seller/sellerRegistrationData";

// Define the API response wrapper interface
interface ApiResponseWrapper<T> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

class SellerRegService {
  // ==================== SELLER REGISTRATION ====================

  /**
   * Create a new temporary seller registration
   * POST /api/v1/temp-sellers
   */
  async createTempSeller(data: TempSellerRequest): Promise<TempSellerResponse> {
    try {
      console.log("📡 Creating temp seller with data:", data);
      
      const response = await api.post<ApiResponseWrapper<TempSellerResponse>>('/temp-sellers', data);
      
      console.log("✅ Raw response:", response);
      console.log("✅ Response data:", response.data);
      
      // Extract the actual seller data from the wrapped response
      const sellerData = response.data?.data;
      
      if (!sellerData) {
        throw new Error("No data received from server");
      }
      
      console.log("✅ Extracted seller data:", sellerData);
      console.log("✅ Application ID:", sellerData.sellerRequestId);
      
      return sellerData;
    } catch (error) {
      console.error('❌ Error creating temp seller:', error);
      throw error;
    }
  }

  /**
   * Get all temporary sellers (Admin only)
   * GET /api/v1/temp-sellers
   */
  async getAllTempSellers(): Promise<ApiResponse<TempSellerAdminResponse[]>> {
    try {
      const response = await api.get<ApiResponseWrapper<TempSellerAdminResponse[]>>('/temp-sellers');
      // Return in the format your component expects
      return {
        statusCode: response.data.status,
        message: response.data.message,
        data: response.data.data || [],
        total: response.data.count || 0
      };
    } catch (error) {
      console.error('Error fetching temp sellers:', error);
      throw error;
    }
  }

  /**
   * Get temporary seller by ID
   * GET /api/v1/temp-sellers/{id}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getTempSellerById(id: number): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.get<ApiResponseWrapper<any>>(`/temp-sellers/${id}`);
      return response.data.data; // Return the unwrapped data
    } catch (error) {
      console.error(`Error fetching temp seller ${id}:`, error);
      throw error;
    }
  }

  // ==================== EMAIL OTP SERVICES ====================

  /**
   * Send OTP to email for verification
   * POST /api/v1/temp-seller/email-otp/send
   */
  async sendEmailOtp(data: EmailOtpSendRequest): Promise<OtpResponse> {
    try {
      const response = await api.post<OtpResponse>('/temp-seller/email-otp/send', data);
      return response.data;
    } catch (error) {
      console.error('Error sending email OTP:', error);
      throw error;
    }
  }

  /**
   * Verify email OTP
   * POST /api/v1/temp-seller/email-otp/verify
   */
  async verifyEmailOtp(data: EmailOtpVerifyRequest): Promise<OtpResponse> {
    try {
      const response = await api.post<OtpResponse>('/temp-seller/email-otp/verify', data);
      return response.data;
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      throw error;
    }
  }



/**
 * Check if coordinator email already exists in the system
 * GET /api/v1/temp-sellers/coordinator/check-email?email={email}
 */
async checkCoordinatorEmail(email: string): Promise<boolean> {
  try {
    console.log(`📡 Checking if coordinator email exists: ${email}`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<any>('/temp-sellers/coordinator/check-email', {
      params: { email }
    });
    
    console.log("✅ Email check response:", response.data);
    
    // The response structure is: { status, message, count, data }
    // The actual boolean value is in response.data.data
    return response.data?.data === true;
  } catch (error) {
    console.error('❌ Error checking coordinator email:', error);
    
    // Handle different error scenarios
     if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      
      if (statusCode === 400) {
        throw new Error("Invalid email format");
      } else if (statusCode === 429) {
        throw new Error("Too many requests. Please try again later.");
      } else if (statusCode && statusCode >= 500) {
        throw new Error("Server error. Please try again later.");
      }
    }
    
    throw new Error("Failed to check email availability");
  }
}

  // ==================== SMS OTP SERVICES ====================

//   /**
//    * Send OTP to phone via SMS
//    */


async sendSMSOtp(data: SMSOtpRequest): Promise<SMSOtpResponse> {
  try {
    const response = await api.post<ApiResponseWrapper<SMSOtpResponse>>('/otp/send', data);
    // If successful, return the inner data
    return response.data.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Error sending SMS OTP:', error);
    
    // Extract nested error message if available
    if (error.response?.data?.data?.message) {
      throw new Error(error.response.data.data.message);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error; // fallback
  }
}

async verifySMSOtp(data: SMSVerifyOtpRequest): Promise<SMSOtpResponse> {
  try {
    const response = await api.post<ApiResponseWrapper<SMSOtpResponse>>('/otp/verify', data);
    return response.data.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Error verifying SMS OTP:', error);
    
    if (error.response?.data?.data?.message) {
      throw new Error(error.response.data.data.message);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

  // ==================== SELLER APPROVAL ====================

  /**
   * Approve/Reject/Request correction for seller
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async approveSeller(data: SellerApprovalRequest): Promise<ApiResponse<any>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.post<ApiResponseWrapper<any>>('/admin/seller-approval', data);
      return {
        statusCode: response.data.status,
        message: response.data.message,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error approving seller:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sellerRegService = new SellerRegService();