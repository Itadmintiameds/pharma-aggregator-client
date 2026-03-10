
import api from '@/src/lib/api';
import { 
  LoginRequest, 
  LoginResponse, 
  ResetPasswordRequest,
  ForgotPasswordRequest,
  EmailOtpSendRequest,
  EmailOtpVerifyRequest,
  OtpResponse,
  ApiResponse,
  ValidateTokenResponse,
  ResetPasswordWithTokenRequest,
  User
} from '@/src/types/seller/authData';

// Cookie helpers
const setCookie = (name: string, value: string, days: number = 1) => {
  if (typeof window === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

class SellerAuthService {
  private readonly authBaseUrl = '/authentication';
  private readonly passwordBaseUrl = '/auth';
  private readonly otpBaseUrl = '/temp-seller/email-otp';

  // ========== AUTHENTICATION ==========
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>(`${this.authBaseUrl}/login`, credentials);
      
      const responseData = response.data;
      
      if (responseData.status === "SUCCESS" && responseData.data) {
        const loginData = responseData.data;
        
        if (loginData.token) {
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('user', JSON.stringify({
            userId: loginData.userId,
            username: loginData.username,
            roles: loginData.roles
          }));
          setCookie('token', loginData.token);
        }
        
        return loginData;
      } else {
        throw new Error(responseData.message || "Login failed");
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // ========== FIRST-TIME PASSWORD RESET (with current password) ==========
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/reset-password`, data);
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // ========== FORGOT PASSWORD FLOW ==========
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/forgot-password`, data);
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async validateResetToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/validate-reset-token`, { token });
      
      console.log("Token validation response:", response.data);
      
      // Check if token is valid based on your response structure
      // Your API returns: { "status": "SUCCESS", "message": "Token is valid", "data": null }
      if (response.data.status === "SUCCESS") {
        return { 
          valid: true,
          // Since email isn't returned, we'll need to get it from localStorage or decode token
        };
      } else {
        return { valid: false };
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false };
    }
  }

  async resetPasswordWithToken(data: ResetPasswordWithTokenRequest): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<ApiResponse<null>>(
        `${this.passwordBaseUrl}/reset-password-with-token`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Reset password with token error:', error);
      throw error;
    }
  }

  // ========== OTP MANAGEMENT ==========
  async sendResetOtp(data: EmailOtpSendRequest): Promise<OtpResponse> {
    try {
      const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/send`, data);
      return response.data;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  }

  async sendOtpToExistingEmail(data: EmailOtpSendRequest): Promise<OtpResponse> {
    try {
      const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/exist/send`, data);
      return response.data;
    } catch (error) {
      console.error('Send OTP to existing email error:', error);
      throw error;
    }
  }

  async verifyOtp(data: EmailOtpVerifyRequest): Promise<OtpResponse> {
    try {
      const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/verify`, data);
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========
  clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('resetEmail');
    deleteCookie('token');
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const sellerAuthService = new SellerAuthService();