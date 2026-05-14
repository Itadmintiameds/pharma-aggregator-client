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

// Cookie helpers for middleware authentication
const setCookie = (name: string, value: string, days: number = 1) => {
  if (typeof window === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

// Response types for updated API
interface OtpSentResponse {
  message: string;
  username: string;
}

interface LoginApiResponse {
  status: string;
  message: string;
  count: null | number;
  data: OtpSentResponse;
}

interface VerifyOtpApiResponse {
  status: string;
  message: string;
  count: null | number;
  data: LoginResponse;
}

class SellerAuthService {
  private readonly authBaseUrl = '/authentication';
  private readonly passwordBaseUrl = '/auth';
  private readonly otpBaseUrl = '/temp-seller/email-otp';

  // ========== AUTHENTICATION ==========
  // STEP 1: Login - Validates credentials and sends OTP to email
  async login(credentials: LoginRequest): Promise<OtpSentResponse> {
    console.log("=========================================");
    console.log("🔐 [AUTH SERVICE] LOGIN METHOD CALLED");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.authBaseUrl}/login`);
    console.log("📧 Username:", credentials.username);
    console.log("🔑 Password: ***MASKED***");
    console.log("⏰ Timestamp:", new Date().toISOString());
    
    try {
      console.log("📤 Sending POST request to:", `${this.authBaseUrl}/login`);
      const response = await api.post<LoginApiResponse>(`${this.authBaseUrl}/login`, credentials);
      
      console.log("📥 Raw response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      
      const responseData = response.data;
      console.log("📦 Response data:", {
        status: responseData.status,
        message: responseData.message,
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : []
      });
      
      if (responseData.status === "SUCCESS" && responseData.data) {
        // Store username for OTP verification step
        localStorage.setItem('otpUsername', responseData.data.username);
        console.log("✅ Login successful - OTP will be sent");
        console.log("📧 Username stored in localStorage:", responseData.data.username);
        console.log("💬 Server message:", responseData.data.message);
        console.log("=========================================");
        return responseData.data;
      } else {
        const errorMsg = responseData.message || "Login failed";
        console.error("❌ Login failed - invalid response structure");
        console.error("Response status:", responseData.status);
        console.error("Response message:", responseData.message);
        console.error("=========================================");
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("=========================================");
      console.error("❌ [AUTH SERVICE] LOGIN ERROR");
      console.error("=========================================");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error status text:", error.response?.statusText);
      console.error("Error response data:", error.response?.data);
      console.error("=========================================");
      throw error;
    }
  }

  // STEP 2: Verify OTP and get JWT token
async verifyOtp(credentials: EmailOtpVerifyRequest): Promise<LoginResponse> {
  console.log("=========================================");
  console.log("🔐 [AUTH SERVICE] VERIFY OTP METHOD CALLED");
  console.log("=========================================");
  console.log("📡 Endpoint:", `${this.authBaseUrl}/verify-otp`);
  console.log("📧 Username/Email:", credentials.username || credentials.email);
  console.log("🔢 OTP: ***MASKED***");
  console.log("⏰ Timestamp:", new Date().toISOString());
  
  try {
    // Prepare payload for backend - use username if available, otherwise email
    const payload = {
      username: credentials.username || credentials.email,
      otp: credentials.otp
    };
    
    console.log("📤 Sending POST request to:", `${this.authBaseUrl}/verify-otp`);
    const response = await api.post<VerifyOtpApiResponse>(`${this.authBaseUrl}/verify-otp`, payload);
    
    console.log("📥 Raw response received:", {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    const responseData = response.data;
    console.log("📦 Response data:", {
      status: responseData.status,
      message: responseData.message,
      hasData: !!responseData.data,
      dataKeys: responseData.data ? Object.keys(responseData.data) : []
    });
    
    if (responseData.status === "SUCCESS" && responseData.data) {
      const loginData = responseData.data;
      
      console.log("📊 Processing login data:", {
        hasToken: !!loginData.token,
        tokenLength: loginData.token ? loginData.token.length : 0,
        userId: loginData.userId,
        username: loginData.username,
        roles: loginData.roles,
        passwordTemporary: loginData.passwordTemporary,
        message: loginData.message
      });
      
      if (loginData.token) {
        console.log("🔑 TOKEN RECEIVED - Storing in localStorage and cookies");
        
        // Store token in localStorage
        localStorage.setItem('token', loginData.token);
        console.log("✅ Token stored in localStorage");
        
        // Store token in cookie for middleware authentication
        setCookie('token', loginData.token, 1);
        console.log("✅ Token stored in cookie for middleware");
        
        console.log("🔑 Token preview:", `${loginData.token.substring(0, 30)}...`);
        
        // Store user data
        const userData = {
          userId: loginData.userId,
          username: loginData.username,
          roles: loginData.roles,
          passwordTemporary: loginData.passwordTemporary
        };
        localStorage.setItem('user', JSON.stringify(userData));
        console.log("✅ User data stored in localStorage:", userData);
        
        // Store expiration time (24 hours from now)
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
        localStorage.setItem('lastLogin', Date.now().toString());
        console.log("✅ Token expiry set to:", new Date(expiresAt).toISOString());
        
        // Verify storage was successful
        const storedToken = localStorage.getItem('token');
        const cookieToken = getCookie('token');
        console.log("🔍 Verification - Token in localStorage:", !!storedToken);
        console.log("🔍 Verification - Token in cookie:", !!cookieToken);
        console.log("🔍 Verification - User data stored:", !!localStorage.getItem('user'));
        
        if (!storedToken || !cookieToken) {
          console.error("⚠️ WARNING: Token was not stored successfully in both locations!");
        }
      } else {
        console.warn("⚠️ No token received in response data");
      }
      
      console.log("✅ OTP verification successful");
      console.log("=========================================");
      return loginData;
    } else {
      const errorMsg = responseData.message || "OTP verification failed";
      console.error("❌ OTP verification failed - invalid response");
      console.error("Response status:", responseData.status);
      console.error("Response message:", responseData.message);
      console.error("=========================================");
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    console.error("=========================================");
    console.error("❌ [AUTH SERVICE] OTP VERIFICATION ERROR");
    console.error("=========================================");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error status text:", error.response?.statusText);
    console.error("Error response data:", error.response?.data);
    
    // Handle specific error status codes
    if (error.response?.status === 410) {
      console.error("⏰ OTP EXPIRED (410)");
      throw new Error('OTP has expired. Please login again to receive a new OTP.');
    }
    if (error.response?.status === 429) {
      console.error("🚫 TOO MANY ATTEMPTS (429)");
      throw new Error('Too many failed attempts. Please try again later.');
    }
    if (error.response?.status === 401) {
      console.error("🔒 UNAUTHORIZED (401) - Invalid OTP");
    }
    if (error.response?.status === 403) {
      console.error("🔒 FORBIDDEN (403) - Account locked or inactive");
    }
    
    console.error("=========================================");
    throw error;
  }
}

  // ========== LOGOUT ==========
  async logout(redirect: boolean = true): Promise<void> {
    console.log("=========================================");
    console.log("🚪 [AUTH SERVICE] LOGOUT METHOD CALLED");
    console.log("=========================================");
    
    try {
      const token = this.getToken();
      console.log("🔑 Token before logout:", token ? "Present" : "Missing");
      
      if (token) {
        try {
          console.log("📡 Calling logout API...");
          await api.post(
            `${this.authBaseUrl}/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          console.log("✅ Logout API call successful");
        } catch (error: any) {
          console.warn("⚠️ Logout API call failed, clearing local data anyway");
          console.warn("Error:", error.message);
        }
      }
    } catch (error: any) {
      console.error("❌ Error during logout process:", error.message);
    } finally {
      this.clearAuth();
      console.log("🔒 Auth data cleared");
      if (redirect && typeof window !== 'undefined') {
        console.log("🔄 Redirecting to login page");
        window.location.href = '/?showLogin=true';
      }
      console.log("=========================================");
    }
  }

  // Validate session using localStorage
  validateSession(): boolean {
    if (typeof window === 'undefined') {
      console.log("🔍 Session validation - Window undefined, returning false");
      return false;
    }
 
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("🔍 Session validation - No token found, returning false");
      return false;
    }
    
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (expiresAt) {
      const expiryTime = parseInt(expiresAt);
      const now = Date.now();
      
      if (now > expiryTime) {
        console.log("🔍 Session validation - Token expired, clearing auth");
        this.clearAuth();
        return false;
      } else {
        const timeLeft = Math.floor((expiryTime - now) / 1000 / 60);
        console.log(`🔍 Session validation - Token valid, ${timeLeft} minutes remaining`);
      }
    } else {
      console.log("🔍 Session validation - No expiry found, assuming valid");
    }
    
    return true;
  }

  isAuthenticated(): boolean {
    const isAuth = this.validateSession();
    console.log(`🔍 isAuthenticated(): ${isAuth}`);
    return isAuth;
  }

  // ========== PASSWORD MANAGEMENT ==========
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
    console.log("=========================================");
    console.log("🔑 [AUTH SERVICE] RESET PASSWORD METHOD CALLED");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.passwordBaseUrl}/reset-password`);
    console.log("👤 Username:", data.username);
    console.log("🔑 New password: ***MASKED***");
    
    try {
      const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/reset-password`, data);
      console.log("✅ Password reset response:", {
        status: response.data.status,
        message: response.data.message
      });
      console.log("=========================================");
      return response.data;
    } catch (error: any) {
      console.error("❌ Reset password error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      console.error("=========================================");
      throw error;
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    console.log("=========================================");
    console.log("📧 [AUTH SERVICE] FORGOT PASSWORD METHOD CALLED");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.passwordBaseUrl}/forgot-password`);
    console.log("📧 Email:", data.email);
    
    try {
      const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/forgot-password`, data);
      console.log("✅ Forgot password response:", {
        status: response.data.status,
        message: response.data.message
      });
      console.log("=========================================");
      return response.data;
    } catch (error: any) {
      console.error("❌ Forgot password error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      console.error("=========================================");
      throw error;
    }
  }

  async validateResetToken(token: string): Promise<ValidateTokenResponse> {
    console.log("=========================================");
    console.log("✅ [AUTH SERVICE] VALIDATE RESET TOKEN METHOD CALLED");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.passwordBaseUrl}/validate-reset-token`);
    
    try {
      const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/validate-reset-token`, { token });
      
      if (response.data.status === "SUCCESS") {
        console.log("✅ Token is valid");
        console.log("=========================================");
        return { valid: true };
      } else {
        console.log("❌ Token is invalid");
        console.log("=========================================");
        return { valid: false };
      }
    } catch (error: any) {
      console.error("❌ Token validation error:", {
        message: error.message,
        status: error.response?.status
      });
      console.error("=========================================");
      return { valid: false };
    }
  }

  async resetPasswordWithToken(data: ResetPasswordWithTokenRequest): Promise<ApiResponse<null>> {
    console.log("=========================================");
    console.log("🔑 [AUTH SERVICE] RESET PASSWORD WITH TOKEN METHOD CALLED");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.passwordBaseUrl}/reset-password-with-token`);
    
    try {
      const response = await api.post<ApiResponse<null>>(
        `${this.passwordBaseUrl}/reset-password-with-token`,
        data
      );
      console.log("✅ Password reset with token successful");
      console.log("=========================================");
      return response.data;
    } catch (error: any) {
      console.error("❌ Reset password with token error:", {
        message: error.message,
        status: error.response?.status
      });
      console.error("=========================================");
      throw error;
    }
  }

  // ========== OTP MANAGEMENT (For temporary sellers/registration) ==========
  async sendResetOtp(data: EmailOtpSendRequest): Promise<OtpResponse> {
    console.log("=========================================");
    console.log("📧 [AUTH SERVICE] SEND RESET OTP METHOD CALLED");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.otpBaseUrl}/send`);
    console.log("📧 Email:", data.email);
    
    try {
      const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/send`, data);
      console.log("✅ Send OTP response:", response.data);
      console.log("=========================================");
      return response.data;
    } catch (error: any) {
      console.error("❌ Send OTP error:", {
        message: error.message,
        status: error.response?.status
      });
      console.error("=========================================");
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========
  clearAuth(): void {
    console.log("=========================================");
    console.log("🗑️ [AUTH SERVICE] CLEAR AUTH METHOD CALLED");
    console.log("=========================================");
    
    if (typeof window === 'undefined') {
      console.log("Window undefined, skipping cleanup");
      return;
    }
    
    // Log what we're removing
    const beforeToken = localStorage.getItem('token');
    const beforeUser = localStorage.getItem('user');
    const beforeCookie = getCookie('token');
    console.log("📝 Before cleanup:", {
      token: beforeToken ? "Present" : "Missing",
      user: beforeUser ? "Present" : "Missing",
      cookie: beforeCookie ? "Present" : "Missing",
      tokenPreview: beforeToken ? `${beforeToken.substring(0, 30)}...` : null
    });
    
    // Clear all localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('resetEmail');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('lastLogin');
    localStorage.removeItem('otpUsername');
    
    // Delete cookie
    deleteCookie('token');
    
    // Clear session storage if used
    sessionStorage.clear();
    
    // Verify cleanup
    const afterToken = localStorage.getItem('token');
    const afterUser = localStorage.getItem('user');
    const afterCookie = getCookie('token');
    console.log("📝 After cleanup:", {
      token: afterToken ? "Still Present!" : "Removed ✅",
      user: afterUser ? "Still Present!" : "Removed ✅",
      cookie: afterCookie ? "Still Present!" : "Removed ✅"
    });
    console.log("=========================================");
  }

  getToken(): string | null {
    if (typeof window === 'undefined') {
      console.log("🔑 getToken() - Window undefined, returning null");
      return null;
    }
    const token = localStorage.getItem('token');
    console.log(`🔑 getToken() - Token ${token ? "present" : "missing"}`);
    if (token) {
      console.log(`🔑 Token preview: ${token.substring(0, 30)}...`);
    }
    return token;
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') {
      console.log("👤 getCurrentUser() - Window undefined, returning null");
      return null;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("👤 Current user retrieved:", {
          userId: user.userId,
          username: user.username,
          roles: user.roles,
          passwordTemporary: user.passwordTemporary
        });
        return user;
      } catch (e) {
        console.error("❌ Error parsing user data:", e);
        return null;
      }
    }
    console.log("👤 No user data found");
    return null;
  }

  isFirstLogin(): boolean {
    const user = this.getCurrentUser();
    const isFirst = user?.passwordTemporary || false;
    console.log(`🔐 isFirstLogin(): ${isFirst}`);
    return isFirst;
  }

  getSessionExpiryTime(): Date | null {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (expiresAt) {
      const expiryDate = new Date(parseInt(expiresAt));
      console.log(`⏰ Session expiry time: ${expiryDate.toISOString()}`);
      return expiryDate;
    }
    console.log("⏰ No session expiry found");
    return null;
  }

  getSessionTimeRemaining(): number | null {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (expiresAt) {
      const remaining = parseInt(expiresAt) - Date.now();
      const minutesRemaining = Math.floor(remaining / (60 * 1000));
      if (minutesRemaining > 0) {
        console.log(`⏰ Session time remaining: ${minutesRemaining} minutes`);
      } else {
        console.log("⏰ Session has expired");
      }
      return minutesRemaining > 0 ? minutesRemaining : 0;
    }
    console.log("⏰ No session expiry found");
    return null;
  }
}

export const sellerAuthService = new SellerAuthService();











// import api from '@/src/lib/api';
// import { 
//   LoginRequest, 
//   LoginResponse, 
//   ResetPasswordRequest,
//   ForgotPasswordRequest,
//   EmailOtpSendRequest,
//   EmailOtpVerifyRequest,
//   OtpResponse,
//   ApiResponse,
//   ValidateTokenResponse,
//   ResetPasswordWithTokenRequest,
//   User
// } from '@/src/types/seller/authData';

// // Cookie helpers
// const setCookie = (name: string, value: string, days: number = 1) => {
//   if (typeof window === 'undefined') return;
//   const expires = new Date();
//   expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
//   document.cookie = `${name}=${value};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
// };

// const getCookie = (name: string): string | null => {
//   if (typeof window === 'undefined') return null;
//   const nameEQ = name + "=";
//   const ca = document.cookie.split(';');
//   for(let i = 0; i < ca.length; i++) {
//     let c = ca[i];
//     while (c.charAt(0) === ' ') c = c.substring(1, c.length);
//     if (c.indexOf(nameEQ) === 0) {
//       const value = c.substring(nameEQ.length, c.length);
//       return value;
//     }
//   }
//   return null;
// };

// const deleteCookie = (name: string) => {
//   if (typeof window === 'undefined') return;
//   document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
// };

// class SellerAuthService {
//   private readonly authBaseUrl = '/authentication';
//   private readonly passwordBaseUrl = '/auth';
//   private readonly otpBaseUrl = '/temp-seller/email-otp';

//   // ========== AUTHENTICATION ==========
//   async login(credentials: LoginRequest): Promise<LoginResponse> {
//     try {
//       const response = await api.post<ApiResponse<LoginResponse>>(`${this.authBaseUrl}/login`, credentials);
//       const responseData = response.data;
      
//       if (responseData.status === "SUCCESS" && responseData.data) {
//         const loginData = responseData.data;
        
//         if (loginData.token) {
//           localStorage.setItem('token', loginData.token);
//           localStorage.setItem('user', JSON.stringify({
//             userId: loginData.userId,
//             username: loginData.username,
//             roles: loginData.roles,
//             passwordTemporary: loginData.passwordTemporary
//           }));
          
//           // Store expiration time (24 hours from now as default)
//           const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
//           localStorage.setItem('tokenExpiresAt', expiresAt.toString());
//           localStorage.setItem('lastLogin', Date.now().toString());
//           setCookie('token', loginData.token);
//         }
        
//         return loginData;
//       } else {
//         const errorMsg = responseData.message || "Login failed";
//         console.error('❌ Login failed:', errorMsg);
//         throw new Error(errorMsg);
//       }
//     } catch (error: any) {
//       console.error('❌ Login error details:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   }

//   // ========== LOGOUT ==========
//   async logout(redirect: boolean = true): Promise<void> {
//     try {
//       const token = this.getToken();
      
//       if (token) {
//         try {
//           await api.post(
//             `${this.authBaseUrl}/logout`,
//             {},
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`
//               }
//             }
//           );
//         } catch (error: any) {
//         }
//       }
//     } catch (error: any) {
//       console.error('❌ Error during logout process:', error.message);
//     } finally {
//       this.clearAuth();
//       if (redirect && typeof window !== 'undefined') {
//         window.location.href = '/?showLogin=true';
//       }
//     }
//   }

//   validateSession(): boolean {
    
//     if (typeof window === 'undefined') {
//       return false;
//     }
 
//     const token = localStorage.getItem('token');
//     if (!token) {
//       return false;
//     }
    
//     const expiresAt = localStorage.getItem('tokenExpiresAt');
//     if (expiresAt) {
//       const expiryTime = parseInt(expiresAt);
//       const now = Date.now();
      
//       if (now > expiryTime) {
//         this.clearAuth();
//         return false;
//       }
//     } else {
//     }

//     const cookieToken = getCookie('token');
//     if (!cookieToken) {
//       setCookie('token', token);
//     } else {
//     }
    
//     return true;
//   }

//   isAuthenticated(): boolean {
//     const isAuth = this.validateSession();
//     return isAuth;
//   }

//   // ========== FIRST-TIME PASSWORD RESET ==========
//   async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
//     try {
//       const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/reset-password`, data);
//       return response.data;
//     } catch (error: any) {
//       console.error('❌ Reset password error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   }

//   // ========== FORGOT PASSWORD  ==========
//   async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {

//     try {
//       const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/forgot-password`, data);
//       return response.data;
//     } catch (error: any) {
//       console.error('❌ Forgot password error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   }

//   async validateResetToken(token: string): Promise<ValidateTokenResponse> {

//     try {
//       const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/validate-reset-token`, { token });
      
//       if (response.data.status === "SUCCESS") {

//         return { valid: true };
//       } else {
//         return { valid: false };
//       }
//     } catch (error: any) {
//       console.error('❌ Token validation error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       return { valid: false };
//     }
//   }

//   async resetPasswordWithToken(data: ResetPasswordWithTokenRequest): Promise<ApiResponse<null>> {
//     try {
//       const response = await api.post<ApiResponse<null>>(
//         `${this.passwordBaseUrl}/reset-password-with-token`,
//         data
//       );
//       return response.data;
//     } catch (error: any) {
//       console.error('❌ Reset password with token error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   }

//   // ========== OTP MANAGEMENT ==========
//   async sendResetOtp(data: EmailOtpSendRequest): Promise<OtpResponse> {
//     try {
//       const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/send`, data);
//       return response.data;
//     } catch (error: any) {
//       console.error('❌ Send OTP error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   }

//   async sendOtpToExistingEmail(data: EmailOtpSendRequest): Promise<OtpResponse> {
//     try {
//       const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/exist/send`, data);
//       return response.data;
//     } catch (error: any) {
//       console.error('❌ Send OTP to existing email error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   }

//   async verifyOtp(data: EmailOtpVerifyRequest): Promise<OtpResponse> {
//     try {
//       const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/verify`, data);
//       return response.data;
//     } catch (error: any) {
//       console.error('❌ Verify OTP error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   }

//   // ========== UTILITY METHODS ==========
//   clearAuth(): void {
    
//     if (typeof window === 'undefined') return;
    
//     // Log what we're removing
//     const beforeToken = localStorage.getItem('token');
//     const beforeUser = localStorage.getItem('user');
//     console.log('📝 Before cleanup - Token exists:', !!beforeToken, 'User exists:', !!beforeUser);
    
//     // Clear all localStorage items
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     localStorage.removeItem('resetEmail');
//     localStorage.removeItem('tokenExpiresAt');
//     localStorage.removeItem('lastLogin');
    
//     // Clear cookies
//     deleteCookie('token');
    
//     // Clear any session storage if used
//     sessionStorage.clear();
    
//     // Verify cleanup
//     const afterToken = localStorage.getItem('token');
//     const afterUser = localStorage.getItem('user');
//     console.log('📝 After cleanup - Token exists:', !!afterToken, 'User exists:', !!afterUser);
//   }

//   getToken(): string | null {
//     if (typeof window === 'undefined') return null;
//     const token = localStorage.getItem('token');
//     console.log('🔑 getToken():', token ? 'Token present' : 'No token');
//     return token;
//   }

//   getCurrentUser(): User | null {
//     if (typeof window === 'undefined') return null;
//     const userStr = localStorage.getItem('user');
//     if (userStr) {
//       try {
//         const user = JSON.parse(userStr);
//         return user;
//       } catch (e) {
//         console.error('❌ Error parsing user data:', e);
//         return null;
//       }
//     }
//     return null;
//   }

//   // Check if this is first login (password temporary)
//   isFirstLogin(): boolean {
//     const user = this.getCurrentUser();
//     const isFirst = user?.passwordTemporary || false;
//     return isFirst;
//   }

//   // Get session expiry time
//   getSessionExpiryTime(): Date | null {
//     const expiresAt = localStorage.getItem('tokenExpiresAt');
//     if (expiresAt) {
//       return new Date(parseInt(expiresAt));
//     }
//     return null;
//   }

//   // Get time remaining in session 
//   getSessionTimeRemaining(): number | null {
//     const expiresAt = localStorage.getItem('tokenExpiresAt');
//     if (expiresAt) {
//       const remaining = parseInt(expiresAt) - Date.now();
//       const minutesRemaining = Math.floor(remaining / (60 * 1000));
//       return minutesRemaining > 0 ? minutesRemaining : 0;
//     }
//     return null;
//   }
// }

// export const sellerAuthService = new SellerAuthService();

