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


interface ApiResponseWrapper<T> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

class SellerRegService {
  // ==================== SELLER REGISTRATION ====================

  async createTempSeller(data: TempSellerRequest): Promise<TempSellerResponse> {
    try {
      console.log("📡 Creating temp seller with data:", data);
      
      const response = await api.post<ApiResponseWrapper<TempSellerResponse>>('/temp-sellers', data);
      
      console.log("✅ Raw response:", response);
      console.log("✅ Response data:", response.data);
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

  async getTempSellerById(id: number): Promise<any> {
    try {
      const response = await api.get<ApiResponseWrapper<any>>(`/temp-sellers/${id}`);
      return response.data.data; // Return the unwrapped data
    } catch (error) {
      console.error(`Error fetching temp seller ${id}:`, error);
      throw error;
    }
  }

  // ==================== EMAIL OTP SERVICES ====================

  async sendEmailOtp(data: EmailOtpSendRequest): Promise<OtpResponse> {
    try {
      const response = await api.post<OtpResponse>('/temp-seller/email-otp/send', data);
      return response.data;
    } catch (error) {
      console.error('Error sending email OTP:', error);
      throw error;
    }
  }

async verifyEmailOtp(
  data: EmailOtpVerifyRequest
): Promise<OtpResponse> {
  try {
    const response = await api.post<OtpResponse>(
      "/temp-seller/email-otp/verify",
      data
    );

    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.data?.message ||
      error?.message ||
      "Invalid OTP";

    if (message === "Request processed successfully") {
      return Promise.reject({
        message: "Invalid OTP"
      });
    }

    return Promise.reject({ message });
  }
}



/**
 * Check if coordinator email already exists in the system
 */
async checkCoordinatorEmail(email: string): Promise<boolean> {
  try {
    console.log(`📡 Checking if coordinator email exists: ${email}`);
    
    const response = await api.get<any>('/temp-sellers/coordinator/check-email', {
      params: { email }
    });
    
    console.log("✅ Email check response:", response.data);
    return response.data?.data === true;
  } catch (error) {
    console.error('❌ Error checking coordinator email:', error);
    
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


async sendSMSOtp(data: SMSOtpRequest): Promise<SMSOtpResponse> {
  try {
    const response = await api.post<ApiResponseWrapper<SMSOtpResponse>>('/otp/send', data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error sending SMS OTP:', error);
    
    if (error.response?.data?.data?.message) {
      throw new Error(error.response.data.data.message);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error; 
  }
}

async verifySMSOtp(data: SMSVerifyOtpRequest): Promise<SMSOtpResponse> {
  try {
    const response =
      await api.post<ApiResponseWrapper<SMSOtpResponse>>(
        "/otp/verify",
        data
      );

    const result = response.data?.data; // 👈 IMPORTANT FIX

    if (result?.status === "ERROR") {
      return Promise.reject({
        message: result.message || "Invalid OTP",
      });
    }

    return result; // success case
  } catch (error: any) {
    const message =
      error?.response?.data?.data?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Invalid OTP";

    return Promise.reject({ message });
  }
}
async checkCoordinatorPhone(phone: string): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log(`📡 Checking if coordinator phone exists: ${cleanPhone}`);
    const response = await api.get<any>('/temp-sellers/coordinator/check-phone', {
      params: { mobile: cleanPhone }
    });
    
    console.log("✅ Phone check response:", response.data);
    
    return response.data?.data === true;
  } catch (error) {
    console.error('❌ Error checking coordinator phone:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      
      if (statusCode === 400) {
        throw new Error("Invalid phone number format");
      } else if (statusCode === 429) {
        throw new Error("Too many requests. Please try again later.");
      } else if (statusCode && statusCode >= 500) {
        throw new Error("Server error. Please try again later.");
      }
    }
    
    throw new Error("Failed to check phone availability");
  }
}

 // ==================== DOCUMENT CHECK SERVICES ====================
async checkDocumentExists(documentType: string, documentNumber: string): Promise<boolean> {
  try {
    console.log(`📡 Checking if document exists: ${documentType} - ${documentNumber}`);
    
    // Fix: Use the correct parameter name 'documentnumber' (all lowercase)
    const response = await api.get<any>('/temp-sellers/coordinator/check-document', {
      params: { 
        documentnumber: documentNumber  // Changed from 'documentNumber' to 'documentnumber'
      }
    });
    
    console.log("✅ Document check response:", response.data);
    
    // Adjust response parsing based on actual API response structure
    // If the API returns { exists: true } or { data: true } or just boolean
    return response.data?.data === true || response.data?.exists === true || response.data === true;
  } catch (error: any) {
    console.error('❌ Error checking document:', error);
    
    // Log more details for debugging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Return false on error to not block the user
    return false;
  }
}

// method for GST check
async checkGSTNumber(gstNumber: string): Promise<boolean> {
  try {
    console.log(`📡 Checking if GST number exists: ${gstNumber}`);
    
    const response = await api.get<any>('/temp-sellers/coordinator/check-gstnumber', {
      params: { 
        gstnumber: gstNumber
      }
    });
    
    console.log("✅ GST check response:", response.data);
    return response.data?.data === true || response.data?.exists === true || response.data === true;
  } catch (error: any) {
    console.error('❌ Error checking GST number:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

  // ==================== SELLER APPROVAL ====================

  async approveSeller(data: SellerApprovalRequest): Promise<ApiResponse<any>> {
    try {
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

export const sellerRegService = new SellerRegService();