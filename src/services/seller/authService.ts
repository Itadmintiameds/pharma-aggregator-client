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

const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const value = c.substring(nameEQ.length, c.length);
      return value;
    }
  }
  return null;
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
            roles: loginData.roles,
            passwordTemporary: loginData.passwordTemporary
          }));
          
          // Store expiration time (24 hours from now as default)
          const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
          localStorage.setItem('tokenExpiresAt', expiresAt.toString());
          localStorage.setItem('lastLogin', Date.now().toString());
          setCookie('token', loginData.token);
        }
        
        return loginData;
      } else {
        const errorMsg = responseData.message || "Login failed";
        console.error('❌ Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // ========== LOGOUT ==========
  async logout(redirect: boolean = true): Promise<void> {
    try {
      const token = this.getToken();
      
      if (token) {
        try {
          await api.post(
            `${this.authBaseUrl}/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        } catch (error: any) {
        }
      }
    } catch (error: any) {
      console.error('❌ Error during logout process:', error.message);
    } finally {
      this.clearAuth();
      if (redirect && typeof window !== 'undefined') {
        window.location.href = '/?showLogin=true';
      }
    }
  }

  validateSession(): boolean {
    
    if (typeof window === 'undefined') {
      return false;
    }
 
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (expiresAt) {
      const expiryTime = parseInt(expiresAt);
      const now = Date.now();
      
      if (now > expiryTime) {
        this.clearAuth();
        return false;
      }
    } else {
    }

    const cookieToken = getCookie('token');
    if (!cookieToken) {
      setCookie('token', token);
    } else {
    }
    
    return true;
  }

  isAuthenticated(): boolean {
    const isAuth = this.validateSession();
    return isAuth;
  }

  // ========== FIRST-TIME PASSWORD RESET ==========
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/reset-password`, data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Reset password error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // ========== FORGOT PASSWORD  ==========
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {

    try {
      const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/forgot-password`, data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Forgot password error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async validateResetToken(token: string): Promise<ValidateTokenResponse> {

    try {
      const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/validate-reset-token`, { token });
      
      if (response.data.status === "SUCCESS") {

        return { valid: true };
      } else {
        return { valid: false };
      }
    } catch (error: any) {
      console.error('❌ Token validation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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
    } catch (error: any) {
      console.error('❌ Reset password with token error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // ========== OTP MANAGEMENT ==========
  async sendResetOtp(data: EmailOtpSendRequest): Promise<OtpResponse> {
    try {
      const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/send`, data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Send OTP error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async sendOtpToExistingEmail(data: EmailOtpSendRequest): Promise<OtpResponse> {
    try {
      const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/exist/send`, data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Send OTP to existing email error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async verifyOtp(data: EmailOtpVerifyRequest): Promise<OtpResponse> {
    try {
      const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/verify`, data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Verify OTP error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========
  clearAuth(): void {
    
    if (typeof window === 'undefined') return;
    
    // Log what we're removing
    const beforeToken = localStorage.getItem('token');
    const beforeUser = localStorage.getItem('user');
    console.log('📝 Before cleanup - Token exists:', !!beforeToken, 'User exists:', !!beforeUser);
    
    // Clear all localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('resetEmail');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('lastLogin');
    
    // Clear cookies
    deleteCookie('token');
    
    // Clear any session storage if used
    sessionStorage.clear();
    
    // Verify cleanup
    const afterToken = localStorage.getItem('token');
    const afterUser = localStorage.getItem('user');
    console.log('📝 After cleanup - Token exists:', !!afterToken, 'User exists:', !!afterUser);
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    console.log('🔑 getToken():', token ? 'Token present' : 'No token');
    return token;
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user;
      } catch (e) {
        console.error('❌ Error parsing user data:', e);
        return null;
      }
    }
    return null;
  }

  // Check if this is first login (password temporary)
  isFirstLogin(): boolean {
    const user = this.getCurrentUser();
    const isFirst = user?.passwordTemporary || false;
    return isFirst;
  }

  // Get session expiry time
  getSessionExpiryTime(): Date | null {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (expiresAt) {
      return new Date(parseInt(expiresAt));
    }
    return null;
  }

  // Get time remaining in session 
  getSessionTimeRemaining(): number | null {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (expiresAt) {
      const remaining = parseInt(expiresAt) - Date.now();
      const minutesRemaining = Math.floor(remaining / (60 * 1000));
      return minutesRemaining > 0 ? minutesRemaining : 0;
    }
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
//   console.log(`📝 Cookie set: ${name}=${value.substring(0, 10)}... (expires in ${days} days)`);
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
//       console.log(`📝 Cookie retrieved: ${name}=${value.substring(0, 10)}...`);
//       return value;
//     }
//   }
//   console.log(`📝 Cookie not found: ${name}`);
//   return null;
// };

// const deleteCookie = (name: string) => {
//   if (typeof window === 'undefined') return;
//   document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
//   console.log(`📝 Cookie deleted: ${name}`);
// };

// class SellerAuthService {
//   private readonly authBaseUrl = '/authentication';
//   private readonly passwordBaseUrl = '/auth';
//   private readonly otpBaseUrl = '/temp-seller/email-otp';

//   // ========== AUTHENTICATION ==========
//   async login(credentials: LoginRequest): Promise<LoginResponse> {
//     console.log('🔐 Login attempt for username:', credentials.username);
//     try {
//       const response = await api.post<ApiResponse<LoginResponse>>(`${this.authBaseUrl}/login`, credentials);
      
//       const responseData = response.data;
//       console.log('🔐 Login response:', responseData);
      
//       if (responseData.status === "SUCCESS" && responseData.data) {
//         const loginData = responseData.data;
        
//         if (loginData.token) {
//           console.log('✅ Login successful, storing token');
          
//           // Store in localStorage
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
          
//           console.log('📝 Token stored in localStorage, expires at:', new Date(expiresAt).toLocaleString());
          
//           // Set cookie for middleware
//           setCookie('token', loginData.token);
          
//           console.log('👤 User data:', {
//             userId: loginData.userId,
//             username: loginData.username,
//             roles: loginData.roles,
//             isTemporaryPassword: loginData.passwordTemporary
//           });
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
//     console.log('🚪 Logout initiated');
//     try {
//       const token = this.getToken();
      
//       if (token) {
//         try {
//           console.log('📤 Calling logout endpoint');
//           await api.post(
//             `${this.authBaseUrl}/logout`,
//             {},
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`
//               }
//             }
//           );
//           console.log('✅ Logout endpoint called successfully');
//         } catch (error: any) {
//           // Silently fail if logout endpoint doesn't exist
//           console.log('⚠️ Logout endpoint not available or error:', error.message);
//         }
//       }
//     } catch (error: any) {
//       console.error('❌ Error during logout process:', error.message);
//     } finally {
//       this.clearAuth();
//       console.log('🧹 Auth data cleared');
      
//       // Redirect to home with login modal
//       if (redirect && typeof window !== 'undefined') {
//         console.log('🔄 Redirecting to login page');
//         window.location.href = '/?showLogin=true';
//       }
//     }
//   }

//   // ========== SESSION MANAGEMENT ==========
//   validateSession(): boolean {
//     console.log('🔍 Validating session...');
    
//     if (typeof window === 'undefined') {
//       console.log('🔍 Server-side, skipping validation');
//       return false;
//     }
    
//     // Check if token exists
//     const token = localStorage.getItem('token');
//     if (!token) {
//       console.log('❌ No token found in localStorage');
//       return false;
//     }
//     console.log('✅ Token found in localStorage');
    
//     // Check if token is expired based on stored expiration
//     const expiresAt = localStorage.getItem('tokenExpiresAt');
//     if (expiresAt) {
//       const expiryTime = parseInt(expiresAt);
//       const now = Date.now();
//       console.log('⏰ Token expiry:', new Date(expiryTime).toLocaleString());
//       console.log('⏰ Current time:', new Date(now).toLocaleString());
      
//       if (now > expiryTime) {
//         console.log('❌ Token has expired');
//         this.clearAuth();
//         return false;
//       }
//       console.log('✅ Token still valid');
//     } else {
//       console.log('⚠️ No expiry time found in localStorage');
//     }
    
//     // Check cookie consistency
//     const cookieToken = getCookie('token');
//     if (!cookieToken) {
//       console.log('⚠️ Token missing from cookie, but present in localStorage - restoring cookie');
//       setCookie('token', token);
//     } else {
//       console.log('✅ Cookie token present');
//     }
    
//     return true;
//   }

//   isAuthenticated(): boolean {
//     const isAuth = this.validateSession();
//     console.log('🔐 isAuthenticated():', isAuth);
//     return isAuth;
//   }

//   // ========== FIRST-TIME PASSWORD RESET (with current password) ==========
//   async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
//     console.log('🔄 Resetting password for username:', data.username);
//     try {
//       const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/reset-password`, data);
//       console.log('🔄 Reset password response:', response.data);
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

//   // ========== FORGOT PASSWORD FLOW ==========
//   async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
//     console.log('🔑 Forgot password request for email:', data.email);
//     try {
//       const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/forgot-password`, data);
//       console.log('🔑 Forgot password response:', response.data);
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
//     console.log('🔑 Validating reset token:', token.substring(0, 10) + '...');
//     try {
//       const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/validate-reset-token`, { token });
      
//       console.log("🔑 Token validation response:", response.data);
      
//       if (response.data.status === "SUCCESS") {
//         console.log('✅ Reset token is valid');
//         return { valid: true };
//       } else {
//         console.log('❌ Reset token is invalid');
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
//     console.log('🔄 Resetting password with token');
//     try {
//       const response = await api.post<ApiResponse<null>>(
//         `${this.passwordBaseUrl}/reset-password-with-token`,
//         data
//       );
//       console.log('🔄 Reset password with token response:', response.data);
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
//     console.log('📱 Sending reset OTP to email:', data.email);
//     try {
//       const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/send`, data);
//       console.log('📱 Send OTP response:', response.data);
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
//     console.log('📱 Sending OTP to existing email:', data.email);
//     try {
//       const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/exist/send`, data);
//       console.log('📱 Send OTP to existing email response:', response.data);
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
//     console.log('📱 Verifying OTP for email:', data.email);
//     try {
//       const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/verify`, data);
//       console.log('📱 Verify OTP response:', response.data);
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
//     console.log('🧹 Clearing all auth data');
    
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
//         console.log('👤 Current user:', user.username);
//         return user;
//       } catch (e) {
//         console.error('❌ Error parsing user data:', e);
//         return null;
//       }
//     }
//     console.log('👤 No user found');
//     return null;
//   }

//   // Check if this is first login (password temporary)
//   isFirstLogin(): boolean {
//     const user = this.getCurrentUser();
//     const isFirst = user?.passwordTemporary || false;
//     console.log('🔐 isFirstLogin():', isFirst);
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

//   // Get time remaining in session (minutes)
//   getSessionTimeRemaining(): number | null {
//     const expiresAt = localStorage.getItem('tokenExpiresAt');
//     if (expiresAt) {
//       const remaining = parseInt(expiresAt) - Date.now();
//       const minutesRemaining = Math.floor(remaining / (60 * 1000));
//       console.log('⏰ Session minutes remaining:', minutesRemaining);
//       return minutesRemaining > 0 ? minutesRemaining : 0;
//     }
//     return null;
//   }
// }

// export const sellerAuthService = new SellerAuthService();