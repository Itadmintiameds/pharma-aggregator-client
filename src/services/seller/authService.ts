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
  User,
  ForgotPasswordOtpRequest,
  ForgotPasswordOtpResponse,
  VerifyForgotPasswordOtpRequest,
  VerifyForgotPasswordOtpResponse
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

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  type: string;
  userId: number;
  username: string;
  roles: string[];
}

class SellerAuthService {
  private readonly authBaseUrl = '/authentication';
  private readonly passwordBaseUrl = '/auth';
  private readonly otpBaseUrl = '/temp-seller/email-otp';
  
  // For preventing multiple refresh attempts
  private isRefreshing = false;
  private refreshPromiseResolvers: ((value: boolean) => void)[] = [];

  // ========== TOKEN MANAGEMENT ==========
  
  /**
   * Decode JWT token to get payload
   */
  private decodeToken(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Get access token expiry time in milliseconds
   */
  getTokenExpiryTime(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    const decoded = this.decodeToken(token);
    if (decoded && decoded.exp) {
      return decoded.exp * 1000; // Convert to milliseconds
    }
    return null;
  }

  /**
   * Get refresh token expiry time from localStorage
   */
  getRefreshTokenExpiryTime(): number | null {
    const refreshTokenExpiry = localStorage.getItem('refreshTokenExpiresAt');
    if (refreshTokenExpiry) {
      return parseInt(refreshTokenExpiry);
    }
    return null;
  }

  /**
   * Check if access token needs refresh (expires within X minutes)
   */
  needsRefresh(minutesThreshold: number = 5): boolean {
    const expiryTime = this.getTokenExpiryTime();
    if (!expiryTime) return false;
    
    const timeUntilExpiry = expiryTime - Date.now();
    const thresholdMs = minutesThreshold * 60 * 1000;
    
    return timeUntilExpiry < thresholdMs && timeUntilExpiry > 0;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiryTime = this.getTokenExpiryTime();
    if (!expiryTime) return true;
    return Date.now() >= expiryTime;
  }

  /**
   * Get time until token expires in milliseconds
   */
  getTimeUntilExpiry(): number | null {
    const expiryTime = this.getTokenExpiryTime();
    if (!expiryTime) return null;
    return Math.max(0, expiryTime - Date.now());
  }

  /**
   * Store tokens after login or refresh
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    console.log("💾 Storing tokens...");
    
    // Store in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Decode and store access token expiry
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
      console.log(`📅 Access token expires at: ${new Date(expiresAt).toISOString()}`);
      
      // Estimate refresh token expiry (usually longer, e.g., 7 days)
      const refreshExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days default
      localStorage.setItem('refreshTokenExpiresAt', refreshExpiresAt.toString());
    } catch (error) {
      console.error("Error decoding token:", error);
    }
    
    // Store in cookie for middleware
    setCookie('token', accessToken, 1);
    
    console.log("✅ Tokens stored successfully");
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.log('❌ No refresh token available');
      return false;
    }
    
    // Check if refresh token is expired
    const refreshExpiry = this.getRefreshTokenExpiryTime();
    if (refreshExpiry && Date.now() >= refreshExpiry) {
      console.log('❌ Refresh token expired');
      this.clearAuth();
      return false;
    }
    
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      console.log('🔄 Refresh already in progress, waiting...');
      return new Promise((resolve) => {
        this.refreshPromiseResolvers.push(resolve);
      });
    }
    
    this.isRefreshing = true;
    console.log('🔄 Attempting to refresh access token...');
    
    try {
      const response = await api.post<RefreshTokenResponse>(`${this.authBaseUrl}/refresh`, { 
        refreshToken: refreshToken 
      });
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      if (accessToken && newRefreshToken) {
        this.storeTokens(accessToken, newRefreshToken);
        console.log('✅ Token refresh successful');
        
        // Resolve any waiting promises
        const resolvers = [...this.refreshPromiseResolvers];
        this.refreshPromiseResolvers = [];
        resolvers.forEach(resolve => resolve(true));
        
        this.isRefreshing = false;
        return true;
      } else {
        console.error('❌ Refresh response missing tokens');
        this.isRefreshing = false;
        return false;
      }
    } catch (error: any) {
      console.error('❌ Token refresh failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // If refresh fails, clear everything and force logout
      this.clearAuth();
      
      // Reject waiting promises
      const resolvers = [...this.refreshPromiseResolvers];
      this.refreshPromiseResolvers = [];
      resolvers.forEach(resolve => resolve(false));
      
      this.isRefreshing = false;
      return false;
    }
  }

  // ========== AUTHENTICATION ==========
  
  /**
   * STEP 1: Login - Validates credentials and sends OTP to email
   */
  async login(credentials: LoginRequest): Promise<OtpSentResponse> {
    console.log("=========================================");
    console.log("🔐 [AUTH SERVICE] LOGIN METHOD CALLED");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.authBaseUrl}/login`);
    console.log("📧 Username:", credentials.username);
    console.log("⏰ Timestamp:", new Date().toISOString());
    
    try {
      const response = await api.post<LoginApiResponse>(`${this.authBaseUrl}/login`, credentials);
      
      const responseData = response.data;
      
      if (responseData.status === "SUCCESS" && responseData.data) {
        // Store username for OTP verification step
        localStorage.setItem('otpUsername', responseData.data.username);
        console.log("✅ Login successful - OTP will be sent");
        console.log("=========================================");
        return responseData.data;
      } else {
        const errorMsg = responseData.message || "Login failed";
        console.error("❌ Login failed - invalid response structure");
        console.error("=========================================");
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("=========================================");
      console.error("❌ [AUTH SERVICE] LOGIN ERROR");
      console.error("=========================================");
      console.error("Error message:", error.message);
      console.error("Error status:", error.response?.status);
      console.error("=========================================");
      throw error;
    }
  }

  /**
   * STEP 2: Verify OTP and get JWT tokens (access + refresh)
   */
  async verifyOtp(credentials: EmailOtpVerifyRequest): Promise<LoginResponse> {
    try {
      // Prepare payload for backend - use username if available, otherwise email
      const payload = {
        username: credentials.username || credentials.email,
        otp: credentials.otp
      };
      
      const response = await api.post<VerifyOtpApiResponse>(`${this.authBaseUrl}/verify-otp`, payload);
      
      const responseData = response.data;
      
      if (responseData.status === "SUCCESS" && responseData.data) {
        const loginData = responseData.data;
        
        // Store user data (always needed)
        const userData = {
          userId: loginData.userId,
          username: loginData.username,
          roles: loginData.roles,
          passwordTemporary: loginData.passwordTemporary
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('lastLogin', Date.now().toString());
        
        // Check if this is a first-time login (temporary password)
        const isFirstTimeLogin = loginData.passwordTemporary === true;
        
        if (!isFirstTimeLogin) {
          // ✅ Regular login - Store tokens
          if (loginData.accessToken) {
            // Store access token in localStorage
            localStorage.setItem('accessToken', loginData.accessToken);
            // Store token in cookie for middleware authentication
            setCookie('token', loginData.accessToken, 1);
          }
          
          // Store refresh token
          if (loginData.refreshToken) {
            localStorage.setItem('refreshToken', loginData.refreshToken);
          }
          
          // Set token expiry info (decode JWT to get expiry)
          if (loginData.accessToken) {
            try {
              const tokenPayload = JSON.parse(atob(loginData.accessToken.split('.')[1]));
              const expiresAt = tokenPayload.exp * 1000; // Convert to milliseconds
              localStorage.setItem('tokenExpiresAt', expiresAt.toString());
            } catch (e) {
              console.error("❌ Failed to decode token", e);
              // Fallback: set expiry to 24 hours from now
              const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
              localStorage.setItem('tokenExpiresAt', expiresAt.toString());
            }
          }
          
          // Verify storage was successful
          const storedToken = localStorage.getItem('accessToken');
          const cookieToken = getCookie('token');
          
          if (!storedToken || !cookieToken) {
            console.error("⚠️ WARNING: Token was not stored successfully in both locations!");
          }
        } else {
          // ✅ First-time login - Do NOT store tokens
          // Clear any existing tokens just in case
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenExpiresAt');
          deleteCookie('token');
        }
        
        return loginData;
      } else {
        const errorMsg = responseData.message || "OTP verification failed";
        console.error("❌ OTP verification failed - invalid response");
        console.error("Response status:", responseData.status);
        console.error("Response message:", responseData.message);
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

  // Add refresh method
  async refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await api.post(`${this.authBaseUrl}/refresh`, { refreshToken });
      
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        setCookie('token', response.data.accessToken, 1);
        
        // Update expiry
        try {
          const tokenPayload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
          localStorage.setItem('tokenExpiresAt', (tokenPayload.exp * 1000).toString());
        } catch (e) {
          console.error('Failed to decode token', e);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Refresh token failed:', error);
      throw error;
    }
  }

  // ========== LOGOUT ==========
  
  /**
   * Logout - Revoke refresh token and clear all auth data
   */
  async logout(refreshToken?: string): Promise<void> {
    console.log("=========================================");
    console.log("🚪 [AUTH SERVICE] LOGOUT METHOD CALLED");
    console.log("=========================================");
    
    const token = refreshToken || localStorage.getItem('refreshToken');
    
    if (token) {
      try {
        console.log("📡 Calling logout API to revoke refresh token...");
        await api.post(`${this.authBaseUrl}/logout`, { refreshToken: token });
        console.log("✅ Logout API call successful");
      } catch (error: any) {
        console.warn("⚠️ Logout API call failed, clearing local data anyway");
        console.warn("Error:", error.message);
      }
    } else {
      console.log("No refresh token found, skipping API logout");
    }
    
    this.clearAuth();
    console.log("🔒 Auth data cleared");
    console.log("=========================================");
  }

  /**
   * Clear all authentication data from storage
   */
  clearAuth(): void {
    console.log("🗑️ [AUTH SERVICE] CLEAR AUTH METHOD CALLED");
    
    if (typeof window === 'undefined') {
      console.log("Window undefined, skipping cleanup");
      return;
    }
    
    // Log what we're removing
    const beforeAccessToken = localStorage.getItem('accessToken');
    const beforeRefreshToken = localStorage.getItem('refreshToken');
    const beforeUser = localStorage.getItem('user');
    const beforeCookie = getCookie('token');
    
    console.log("📝 Before cleanup:", {
      accessToken: beforeAccessToken ? "Present" : "Missing",
      refreshToken: beforeRefreshToken ? "Present" : "Missing",
      user: beforeUser ? "Present" : "Missing",
      cookie: beforeCookie ? "Present" : "Missing"
    });
    
    // Clear all localStorage items
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('resetEmail');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('refreshTokenExpiresAt');
    localStorage.removeItem('lastLogin');
    localStorage.removeItem('otpUsername');
    
    // Delete cookie
    deleteCookie('token');
    
    // Clear session storage if used
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear sessionStorage:", e);
    }
    
    // Verify cleanup
    const afterAccessToken = localStorage.getItem('accessToken');
    const afterRefreshToken = localStorage.getItem('refreshToken');
    const afterUser = localStorage.getItem('user');
    const afterCookie = getCookie('token');
    
    console.log("📝 After cleanup:", {
      accessToken: afterAccessToken ? "Still Present!" : "Removed ✅",
      refreshToken: afterRefreshToken ? "Still Present!" : "Removed ✅",
      user: afterUser ? "Still Present!" : "Removed ✅",
      cookie: afterCookie ? "Still Present!" : "Removed ✅"
    });
  }

  // ========== SESSION VALIDATION ==========
  
  /**
   * Validate session using tokens
   */
  validateSession(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!accessToken || !refreshToken) {
      console.log("🔍 Session validation - Missing tokens");
      return false;
    }
    
    // Check if token is expired
    if (this.isTokenExpired()) {
      console.log("🔍 Session validation - Access token expired");
      
      // Check if refresh token is still valid
      const refreshExpiry = this.getRefreshTokenExpiryTime();
      if (refreshExpiry && Date.now() < refreshExpiry) {
        console.log("🔍 Refresh token still valid, can refresh");
        return true; // Session can be restored via refresh
      }
      
      console.log("🔍 Session validation - Refresh token also expired");
      this.clearAuth();
      return false;
    }
    
    const timeLeft = this.getTimeUntilExpiry();
    if (timeLeft) {
      const minutesLeft = Math.floor(timeLeft / 1000 / 60);
      console.log(`🔍 Session validation - Token valid, ${minutesLeft} minutes remaining`);
    }
    
    return true;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const isAuth = this.validateSession();
    console.log(`🔍 isAuthenticated(): ${isAuth}`);
    return isAuth;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log(`🔑 Access token present (${token.substring(0, 30)}...)`);
    }
    return token;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const token = localStorage.getItem('refreshToken');
    if (token) {
      console.log(`🔑 Refresh token present (${token.substring(0, 30)}...)`);
    }
    return token;
  }

  /**
   * Get current user data
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') {
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

  /**
   * Check if this is first login (password temporary)
   */
  isFirstLogin(): boolean {
    const user = this.getCurrentUser();
    const isFirst = user?.passwordTemporary || false;
    console.log(`🔐 isFirstLogin(): ${isFirst}`);
    return isFirst;
  }

  /**
   * Get session expiry time
   */
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

  /**
   * Get session time remaining in minutes
   */
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

  // ========== PASSWORD MANAGEMENT ==========
  
  /**
   * Reset password using current password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
    console.log("=========================================");
    console.log("🔑 [AUTH SERVICE] RESET PASSWORD METHOD CALLED");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.passwordBaseUrl}/reset-password`);
    console.log("👤 Username:", data.username);
    
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

  /**
   * Forgot password - send reset link to email
   */
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

  /**
   * Validate reset token for password reset
   */
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

  /**
   * Reset password using token (from email link)
   */
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
  
  /**
   * Send OTP for email verification
   */
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

  // ========== FORGOT PASSWORD WITH OTP ==========

  /**
   * STEP 1: Forgot Password - Send OTP to email
   */
  async forgotPasswordSendOtp(data: ForgotPasswordOtpRequest): Promise<ForgotPasswordOtpResponse> {
    console.log("=========================================");
    console.log("📧 [AUTH SERVICE] FORGOT PASSWORD SEND OTP");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.passwordBaseUrl}/forgot-password`);
    console.log("📧 Email:", data.email);
    
    try {
      const response = await api.post<ForgotPasswordOtpResponse>(
        `${this.passwordBaseUrl}/forgot-password`, 
        data
      );
      
      console.log("✅ OTP sent successfully:", {
        status: response.data.status,
        message: response.data.data?.message
      });
      console.log("=========================================");
      return response.data;
    } catch (error: any) {
      console.error("❌ Forgot password send OTP error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      console.error("=========================================");
      throw error;
    }
  }

  /**
   * STEP 2: Forgot Password - Verify OTP and get reset token
   */
  async verifyForgotPasswordOtp(data: VerifyForgotPasswordOtpRequest): Promise<string> {
    console.log("=========================================");
    console.log("🔐 [AUTH SERVICE] VERIFY FORGOT PASSWORD OTP");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.passwordBaseUrl}/verify-otp`);
    console.log("📧 Email:", data.email);
    console.log("🔢 OTP: ***MASKED***");
    
    try {
      const response = await api.post<VerifyForgotPasswordOtpResponse>(
        `${this.passwordBaseUrl}/verify-otp`, 
        data
      );
      
      console.log("✅ OTP verified successfully");
      
      // Extract reset token from response
      const resetToken = response.data?.data?.data?.resetToken;
      
      if (!resetToken) {
        console.error("❌ No reset token received in response");
        throw new Error("No reset token received");
      }
      
      console.log("🔑 Reset token received:", `${resetToken.substring(0, 20)}...`);
      console.log("=========================================");
      
      return resetToken;
    } catch (error: any) {
      console.error("=========================================");
      console.error("❌ VERIFY FORGOT PASSWORD OTP ERROR");
      console.error("=========================================");
      console.error("Error message:", error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error response data:", error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 410) {
        throw new Error('OTP has expired. Please request a new OTP.');
      }
      if (error.response?.status === 429) {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid OTP. Please try again.');
      }
      
      console.error("=========================================");
      throw error;
    }
  }

  /**
   * STEP 3: Forgot Password - Reset password using token
   */
  async resetForgottenPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
    console.log("=========================================");
    console.log("🔑 [AUTH SERVICE] RESET FORGOTTEN PASSWORD");
    console.log("=========================================");
    console.log("📡 Endpoint:", `${this.passwordBaseUrl}/reset-password-with-token`);
    
    try {
      const response = await api.post<ApiResponse<null>>(
        `${this.passwordBaseUrl}/reset-password-with-token`,
        { token, newPassword }
      );
      
      console.log("✅ Password reset successful:", {
        status: response.data.status,
        message: response.data.message
      });
      console.log("=========================================");
      return response.data;
    } catch (error: any) {
      console.error("❌ Reset forgotten password error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      console.error("=========================================");
      throw error;
    }
  }

  // ========== COMPATIBILITY METHODS (For existing code that expects 'token') ==========
  
  /**
   * @deprecated Use getAccessToken() instead
   */
  getToken(): string | null {
    return this.getAccessToken();
  }
}

export const sellerAuthService = new SellerAuthService();







// code without forget password ..05.06.2026
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

// // Cookie helpers for middleware authentication
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
//       return c.substring(nameEQ.length, c.length);
//     }
//   }
//   return null;
// };

// const deleteCookie = (name: string) => {
//   if (typeof window === 'undefined') return;
//   document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
// };

// // Response types for updated API
// interface OtpSentResponse {
//   message: string;
//   username: string;
// }

// interface LoginApiResponse {
//   status: string;
//   message: string;
//   count: null | number;
//   data: OtpSentResponse;
// }

// interface VerifyOtpApiResponse {
//   status: string;
//   message: string;
//   count: null | number;
//   data: LoginResponse;
// }

// interface RefreshTokenResponse {
//   accessToken: string;
//   refreshToken: string;
//   type: string;
//   userId: number;
//   username: string;
//   roles: string[];
// }

// class SellerAuthService {
//   private readonly authBaseUrl = '/authentication';
//   private readonly passwordBaseUrl = '/auth';
//   private readonly otpBaseUrl = '/temp-seller/email-otp';
  
//   // For preventing multiple refresh attempts
//   private isRefreshing = false;
//   private refreshPromiseResolvers: ((value: boolean) => void)[] = [];

//   // ========== TOKEN MANAGEMENT ==========
  
//   /**
//    * Decode JWT token to get payload
//    */
//   private decodeToken(token: string): any | null {
//     try {
//       const parts = token.split('.');
//       if (parts.length !== 3) {
//         console.error('Invalid token format');
//         return null;
//       }
//       const payload = parts[1];
//       const decoded = JSON.parse(atob(payload));
//       return decoded;
//     } catch (error) {
//       console.error('Failed to decode token:', error);
//       return null;
//     }
//   }

//   /**
//    * Get access token expiry time in milliseconds
//    */
//   getTokenExpiryTime(): number | null {
//     const token = this.getAccessToken();
//     if (!token) return null;
    
//     const decoded = this.decodeToken(token);
//     if (decoded && decoded.exp) {
//       return decoded.exp * 1000; // Convert to milliseconds
//     }
//     return null;
//   }

//   /**
//    * Get refresh token expiry time from localStorage
//    */
//   getRefreshTokenExpiryTime(): number | null {
//     const refreshTokenExpiry = localStorage.getItem('refreshTokenExpiresAt');
//     if (refreshTokenExpiry) {
//       return parseInt(refreshTokenExpiry);
//     }
//     return null;
//   }

//   /**
//    * Check if access token needs refresh (expires within X minutes)
//    */
//   needsRefresh(minutesThreshold: number = 5): boolean {
//     const expiryTime = this.getTokenExpiryTime();
//     if (!expiryTime) return false;
    
//     const timeUntilExpiry = expiryTime - Date.now();
//     const thresholdMs = minutesThreshold * 60 * 1000;
    
//     return timeUntilExpiry < thresholdMs && timeUntilExpiry > 0;
//   }

//   /**
//    * Check if token is expired
//    */
//   isTokenExpired(): boolean {
//     const expiryTime = this.getTokenExpiryTime();
//     if (!expiryTime) return true;
//     return Date.now() >= expiryTime;
//   }

//   /**
//    * Get time until token expires in milliseconds
//    */
//   getTimeUntilExpiry(): number | null {
//     const expiryTime = this.getTokenExpiryTime();
//     if (!expiryTime) return null;
//     return Math.max(0, expiryTime - Date.now());
//   }

//   /**
//    * Store tokens after login or refresh
//    */
// private storeTokens(accessToken: string, refreshToken: string): void {
//   console.log("💾 Storing tokens...");
  
//   // Store in localStorage
//   localStorage.setItem('accessToken', accessToken);
//   localStorage.setItem('refreshToken', refreshToken);
  
//   // Decode and store access token expiry
//   try {
//     const payload = JSON.parse(atob(accessToken.split('.')[1]));
//     const expiresAt = payload.exp * 1000;
//     localStorage.setItem('tokenExpiresAt', expiresAt.toString());
//     console.log(`📅 Access token expires at: ${new Date(expiresAt).toISOString()}`);
    
//     // Estimate refresh token expiry (usually longer, e.g., 7 days)
//     // If your backend doesn't return refresh token expiry, set a default
//     const refreshExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days default
//     localStorage.setItem('refreshTokenExpiresAt', refreshExpiresAt.toString());
//   } catch (error) {
//     console.error("Error decoding token:", error);
//   }
  
//   // Store in cookie for middleware
//   setCookie('token', accessToken, 1);
  
//   console.log("✅ Tokens stored successfully");
// }
//   /**
//    * Refresh access token using refresh token
//    */
//   async refreshAccessToken(): Promise<boolean> {
//     const refreshToken = localStorage.getItem('refreshToken');
    
//     if (!refreshToken) {
//       console.log('❌ No refresh token available');
//       return false;
//     }
    
//     // Check if refresh token is expired
//     const refreshExpiry = this.getRefreshTokenExpiryTime();
//     if (refreshExpiry && Date.now() >= refreshExpiry) {
//       console.log('❌ Refresh token expired');
//       this.clearAuth();
//       return false;
//     }
    
//     // Prevent multiple simultaneous refresh attempts
//     if (this.isRefreshing) {
//       console.log('🔄 Refresh already in progress, waiting...');
//       return new Promise((resolve) => {
//         this.refreshPromiseResolvers.push(resolve);
//       });
//     }
    
//     this.isRefreshing = true;
//     console.log('🔄 Attempting to refresh access token...');
    
//     try {
//       const response = await api.post<RefreshTokenResponse>(`${this.authBaseUrl}/refresh`, { 
//         refreshToken: refreshToken 
//       });
      
//       const { accessToken, refreshToken: newRefreshToken } = response.data;
      
//       if (accessToken && newRefreshToken) {
//         this.storeTokens(accessToken, newRefreshToken);
//         console.log('✅ Token refresh successful');
        
//         // Resolve any waiting promises
//         const resolvers = [...this.refreshPromiseResolvers];
//         this.refreshPromiseResolvers = [];
//         resolvers.forEach(resolve => resolve(true));
        
//         this.isRefreshing = false;
//         return true;
//       } else {
//         console.error('❌ Refresh response missing tokens');
//         this.isRefreshing = false;
//         return false;
//       }
//     } catch (error: any) {
//       console.error('❌ Token refresh failed:', {
//         message: error.message,
//         status: error.response?.status,
//         data: error.response?.data
//       });
      
//       // If refresh fails, clear everything and force logout
//       this.clearAuth();
      
//       // Reject waiting promises
//       const resolvers = [...this.refreshPromiseResolvers];
//       this.refreshPromiseResolvers = [];
//       resolvers.forEach(resolve => resolve(false));
      
//       this.isRefreshing = false;
//       return false;
//     }
//   }

//   // ========== AUTHENTICATION ==========
  
//   /**
//    * STEP 1: Login - Validates credentials and sends OTP to email
//    */
//   async login(credentials: LoginRequest): Promise<OtpSentResponse> {
//     console.log("=========================================");
//     console.log("🔐 [AUTH SERVICE] LOGIN METHOD CALLED");
//     console.log("=========================================");
//     console.log("📡 Endpoint:", `${this.authBaseUrl}/login`);
//     console.log("📧 Username:", credentials.username);
//     console.log("⏰ Timestamp:", new Date().toISOString());
    
//     try {
//       const response = await api.post<LoginApiResponse>(`${this.authBaseUrl}/login`, credentials);
      
//       const responseData = response.data;
      
//       if (responseData.status === "SUCCESS" && responseData.data) {
//         // Store username for OTP verification step
//         localStorage.setItem('otpUsername', responseData.data.username);
//         console.log("✅ Login successful - OTP will be sent");
//         console.log("=========================================");
//         return responseData.data;
//       } else {
//         const errorMsg = responseData.message || "Login failed";
//         console.error("❌ Login failed - invalid response structure");
//         console.error("=========================================");
//         throw new Error(errorMsg);
//       }
//     } catch (error: any) {
//       console.error("=========================================");
//       console.error("❌ [AUTH SERVICE] LOGIN ERROR");
//       console.error("=========================================");
//       console.error("Error message:", error.message);
//       console.error("Error status:", error.response?.status);
//       console.error("=========================================");
//       throw error;
//     }
//   }

//   /**
//    * STEP 2: Verify OTP and get JWT tokens (access + refresh)
//    */
// // Update the verifyOtp method in your authService.ts

// // async verifyOtp(credentials: EmailOtpVerifyRequest): Promise<LoginResponse> {
// //   try {
// //     const payload = {
// //       username: credentials.username || credentials.email,
// //       otp: credentials.otp
// //     };
    
// //     const response = await api.post<VerifyOtpApiResponse>(`${this.authBaseUrl}/verify-otp`, payload);
// //     const responseData = response.data;
    
// //     if (responseData.status === "SUCCESS" && responseData.data) {
// //       const loginData = responseData.data;
      
// //       // ✅ Store access token
// //       if (loginData.accessToken) {
// //         localStorage.setItem('accessToken', loginData.accessToken);
// //         setCookie('token', loginData.accessToken, 1); // For middleware
// //       }
      
// //       // ✅ Store refresh token
// //       if (loginData.refreshToken) {
// //         localStorage.setItem('refreshToken', loginData.refreshToken);
// //       }
      
// //       // Store user data
// //       const userData = {
// //         userId: loginData.userId,
// //         username: loginData.username,
// //         roles: loginData.roles,
// //         passwordTemporary: loginData.passwordTemporary
// //       };
// //       localStorage.setItem('user', JSON.stringify(userData));
// //       localStorage.setItem('lastLogin', Date.now().toString());
      
// //       // Set token expiry info (decode JWT to get expiry)
// //       try {
// //         const tokenPayload = JSON.parse(atob(loginData.accessToken.split('.')[1]));
// //         localStorage.setItem('tokenExpiresAt', (tokenPayload.exp * 1000).toString());
// //       } catch (e) {
// //         console.error('Failed to decode token', e);
// //       }
      
// //       return loginData;
// //     } else {
// //       throw new Error(responseData.message || "OTP verification failed");
// //     }
// //   } catch (error) {
// //     console.error("OTP verification error:", error);
// //     throw error;
// //   }
// // }

// async verifyOtp(credentials: EmailOtpVerifyRequest): Promise<LoginResponse> {
//   // console.log("=========================================");
//   // console.log("🔐 [AUTH SERVICE] VERIFY OTP METHOD CALLED");
//   // console.log("=========================================");
  
//   try {
//     // Prepare payload for backend - use username if available, otherwise email
//     const payload = {
//       username: credentials.username || credentials.email,
//       otp: credentials.otp
//     };
    
//     // console.log("📤 Sending POST request to:", `${this.authBaseUrl}/verify-otp`);
//     const response = await api.post<VerifyOtpApiResponse>(`${this.authBaseUrl}/verify-otp`, payload);
    
//     const responseData = response.data;
    
//     if (responseData.status === "SUCCESS" && responseData.data) {
//       const loginData = responseData.data;
      
//       // Store user data (always needed)
//       const userData = {
//         userId: loginData.userId,
//         username: loginData.username,
//         roles: loginData.roles,
//         passwordTemporary: loginData.passwordTemporary
//       };
//       localStorage.setItem('user', JSON.stringify(userData));
//       localStorage.setItem('lastLogin', Date.now().toString());
      
//       // Check if this is a first-time login (temporary password)
//       const isFirstTimeLogin = loginData.passwordTemporary === true;
      
//       if (!isFirstTimeLogin) {
//         // ✅ Regular login - Store tokens
//         if (loginData.accessToken) {
//           // Store access token in localStorage
//           localStorage.setItem('accessToken', loginData.accessToken);
//           // Store token in cookie for middleware authentication
//           setCookie('token', loginData.accessToken, 1);
//           // console.log("✅ Access token stored in localStorage and cookie");
//         }
        
//         // Store refresh token
//         if (loginData.refreshToken) {
//           localStorage.setItem('refreshToken', loginData.refreshToken);
//           // console.log("✅ Refresh token stored in localStorage");
//         }
        
//         // Set token expiry info (decode JWT to get expiry)
//         if (loginData.accessToken) {
//           try {
//             const tokenPayload = JSON.parse(atob(loginData.accessToken.split('.')[1]));
//             const expiresAt = tokenPayload.exp * 1000; // Convert to milliseconds
//             localStorage.setItem('tokenExpiresAt', expiresAt.toString());
//             // console.log("✅ Token expiry set to:", new Date(expiresAt).toISOString());
//           } catch (e) {
//             console.error("❌ Failed to decode token", e);
//             // Fallback: set expiry to 24 hours from now
//             const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
//             localStorage.setItem('tokenExpiresAt', expiresAt.toString());
//           }
//         }
        
//         // Verify storage was successful
//         const storedToken = localStorage.getItem('accessToken');
//         const cookieToken = getCookie('token');
        
//         if (!storedToken || !cookieToken) {
//           console.error("⚠️ WARNING: Token was not stored successfully in both locations!");
//         }
        
//         // console.log("✅ Regular login - Tokens stored successfully");
//       } else {
//         // ✅ First-time login - Do NOT store tokens
//         // Clear any existing tokens just in case
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         localStorage.removeItem('tokenExpiresAt');
//         deleteCookie('token');
        
//         // console.log("🆕 First-time login detected - No tokens stored. User must reset password.");
//       }
      
//       // console.log("✅ OTP verification successful");
//       // console.log("=========================================");
//       return loginData;
//     } else {
//       const errorMsg = responseData.message || "OTP verification failed";
//       console.error("❌ OTP verification failed - invalid response");
//       console.error("Response status:", responseData.status);
//       console.error("Response message:", responseData.message);
//       console.error("=========================================");
//       throw new Error(errorMsg);
//     }
//   } catch (error: any) {
//     console.error("=========================================");
//     console.error("❌ [AUTH SERVICE] OTP VERIFICATION ERROR");
//     console.error("=========================================");
//     console.error("Error name:", error.name);
//     console.error("Error message:", error.message);
//     console.error("Error status:", error.response?.status);
//     console.error("Error status text:", error.response?.statusText);
//     console.error("Error response data:", error.response?.data);
    
//     // Handle specific error status codes
//     if (error.response?.status === 410) {
//       console.error("⏰ OTP EXPIRED (410)");
//       throw new Error('OTP has expired. Please login again to receive a new OTP.');
//     }
//     if (error.response?.status === 429) {
//       console.error("🚫 TOO MANY ATTEMPTS (429)");
//       throw new Error('Too many failed attempts. Please try again later.');
//     }
//     if (error.response?.status === 401) {
//       console.error("🔒 UNAUTHORIZED (401) - Invalid OTP");
//     }
//     if (error.response?.status === 403) {
//       console.error("🔒 FORBIDDEN (403) - Account locked or inactive");
//     }
    
//     console.error("=========================================");
//     throw error;
//   }
// }

// // Add refresh method
// async refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
//   const refreshToken = localStorage.getItem('refreshToken');
//   if (!refreshToken) {
//     throw new Error('No refresh token available');
//   }
  
//   try {
//     const response = await api.post(`${this.authBaseUrl}/refresh`, { refreshToken });
    
//     if (response.data.accessToken) {
//       localStorage.setItem('accessToken', response.data.accessToken);
//       localStorage.setItem('refreshToken', response.data.refreshToken);
//       setCookie('token', response.data.accessToken, 1);
      
//       // Update expiry
//       try {
//         const tokenPayload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
//         localStorage.setItem('tokenExpiresAt', (tokenPayload.exp * 1000).toString());
//       } catch (e) {
//         console.error('Failed to decode token', e);
//       }
//     }
    
//     return response.data;
//   } catch (error) {
//     console.error('Refresh token failed:', error);
//     throw error;
//   }
// }

// // Update logout method
// // async logout(refreshToken: string): Promise<void> {
// //   try {
// //     await api.post(`${this.authBaseUrl}/logout`, { refreshToken });
// //   } catch (error) {
// //     console.error('Logout API error:', error);
// //   } finally {
// //     this.clearAuth();
// //   }
// // }

// // Update clearAuth
// // clearAuth(): void {
// //   if (typeof window === 'undefined') return;
  
// //   localStorage.removeItem('accessToken');
// //   localStorage.removeItem('refreshToken');
// //   localStorage.removeItem('user');
// //   localStorage.removeItem('tokenExpiresAt');
// //   localStorage.removeItem('lastLogin');
// //   localStorage.removeItem('otpUsername');
  
// //   deleteCookie('token');
// //   sessionStorage.clear();
// // }

//   // ========== LOGOUT ==========
  
//   /**
//    * Logout - Revoke refresh token and clear all auth data
//    */
//   async logout(refreshToken?: string): Promise<void> {
//     console.log("=========================================");
//     console.log("🚪 [AUTH SERVICE] LOGOUT METHOD CALLED");
//     console.log("=========================================");
    
//     const token = refreshToken || localStorage.getItem('refreshToken');
    
//     if (token) {
//       try {
//         console.log("📡 Calling logout API to revoke refresh token...");
//         await api.post(`${this.authBaseUrl}/logout`, { refreshToken: token });
//         console.log("✅ Logout API call successful");
//       } catch (error: any) {
//         console.warn("⚠️ Logout API call failed, clearing local data anyway");
//         console.warn("Error:", error.message);
//       }
//     } else {
//       console.log("No refresh token found, skipping API logout");
//     }
    
//     this.clearAuth();
//     console.log("🔒 Auth data cleared");
//     console.log("=========================================");
//   }

//   /**
//    * Clear all authentication data from storage
//    */
//   clearAuth(): void {
//     console.log("🗑️ [AUTH SERVICE] CLEAR AUTH METHOD CALLED");
    
//     if (typeof window === 'undefined') {
//       console.log("Window undefined, skipping cleanup");
//       return;
//     }
    
//     // Log what we're removing
//     const beforeAccessToken = localStorage.getItem('accessToken');
//     const beforeRefreshToken = localStorage.getItem('refreshToken');
//     const beforeUser = localStorage.getItem('user');
//     const beforeCookie = getCookie('token');
    
//     console.log("📝 Before cleanup:", {
//       accessToken: beforeAccessToken ? "Present" : "Missing",
//       refreshToken: beforeRefreshToken ? "Present" : "Missing",
//       user: beforeUser ? "Present" : "Missing",
//       cookie: beforeCookie ? "Present" : "Missing"
//     });
    
//     // Clear all localStorage items
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('refreshToken');
//     localStorage.removeItem('user');
//     localStorage.removeItem('resetEmail');
//     localStorage.removeItem('tokenExpiresAt');
//     localStorage.removeItem('refreshTokenExpiresAt');
//     localStorage.removeItem('lastLogin');
//     localStorage.removeItem('otpUsername');
    
//     // Delete cookie
//     deleteCookie('token');
    
//     // Clear session storage if used
//     try {
//       sessionStorage.clear();
//     } catch (e) {
//       console.warn("Could not clear sessionStorage:", e);
//     }
    
//     // Verify cleanup
//     const afterAccessToken = localStorage.getItem('accessToken');
//     const afterRefreshToken = localStorage.getItem('refreshToken');
//     const afterUser = localStorage.getItem('user');
//     const afterCookie = getCookie('token');
    
//     console.log("📝 After cleanup:", {
//       accessToken: afterAccessToken ? "Still Present!" : "Removed ✅",
//       refreshToken: afterRefreshToken ? "Still Present!" : "Removed ✅",
//       user: afterUser ? "Still Present!" : "Removed ✅",
//       cookie: afterCookie ? "Still Present!" : "Removed ✅"
//     });
//   }

//   // ========== SESSION VALIDATION ==========
  
//   /**
//    * Validate session using tokens
//    */
//   validateSession(): boolean {
//     if (typeof window === 'undefined') {
//       return false;
//     }
    
//     const accessToken = localStorage.getItem('accessToken');
//     const refreshToken = localStorage.getItem('refreshToken');
    
//     if (!accessToken || !refreshToken) {
//       console.log("🔍 Session validation - Missing tokens");
//       return false;
//     }
    
//     // Check if token is expired
//     if (this.isTokenExpired()) {
//       console.log("🔍 Session validation - Access token expired");
      
//       // Check if refresh token is still valid
//       const refreshExpiry = this.getRefreshTokenExpiryTime();
//       if (refreshExpiry && Date.now() < refreshExpiry) {
//         console.log("🔍 Refresh token still valid, can refresh");
//         // Don't auto-refresh here to avoid recursive calls
//         return true; // Session can be restored via refresh
//       }
      
//       console.log("🔍 Session validation - Refresh token also expired");
//       this.clearAuth();
//       return false;
//     }
    
//     const timeLeft = this.getTimeUntilExpiry();
//     if (timeLeft) {
//       const minutesLeft = Math.floor(timeLeft / 1000 / 60);
//       console.log(`🔍 Session validation - Token valid, ${minutesLeft} minutes remaining`);
//     }
    
//     return true;
//   }

//   /**
//    * Check if user is authenticated
//    */
//   isAuthenticated(): boolean {
//     const isAuth = this.validateSession();
//     console.log(`🔍 isAuthenticated(): ${isAuth}`);
//     return isAuth;
//   }

//   /**
//    * Get current access token
//    */
//   getAccessToken(): string | null {
//     if (typeof window === 'undefined') {
//       return null;
//     }
//     const token = localStorage.getItem('accessToken');
//     if (token) {
//       console.log(`🔑 Access token present (${token.substring(0, 30)}...)`);
//     }
//     return token;
//   }

//   /**
//    * Get current refresh token
//    */
//   getRefreshToken(): string | null {
//     if (typeof window === 'undefined') {
//       return null;
//     }
//     const token = localStorage.getItem('refreshToken');
//     if (token) {
//       console.log(`🔑 Refresh token present (${token.substring(0, 30)}...)`);
//     }
//     return token;
//   }

//   /**
//    * Get current user data
//    */
//   getCurrentUser(): User | null {
//     if (typeof window === 'undefined') {
//       return null;
//     }
//     const userStr = localStorage.getItem('user');
//     if (userStr) {
//       try {
//         const user = JSON.parse(userStr);
//         console.log("👤 Current user retrieved:", {
//           userId: user.userId,
//           username: user.username,
//           roles: user.roles,
//           passwordTemporary: user.passwordTemporary
//         });
//         return user;
//       } catch (e) {
//         console.error("❌ Error parsing user data:", e);
//         return null;
//       }
//     }
//     console.log("👤 No user data found");
//     return null;
//   }

//   /**
//    * Check if this is first login (password temporary)
//    */
//   isFirstLogin(): boolean {
//     const user = this.getCurrentUser();
//     const isFirst = user?.passwordTemporary || false;
//     console.log(`🔐 isFirstLogin(): ${isFirst}`);
//     return isFirst;
//   }

//   /**
//    * Get session expiry time
//    */
//   getSessionExpiryTime(): Date | null {
//     const expiresAt = localStorage.getItem('tokenExpiresAt');
//     if (expiresAt) {
//       const expiryDate = new Date(parseInt(expiresAt));
//       console.log(`⏰ Session expiry time: ${expiryDate.toISOString()}`);
//       return expiryDate;
//     }
//     console.log("⏰ No session expiry found");
//     return null;
//   }

//   /**
//    * Get session time remaining in minutes
//    */
//   getSessionTimeRemaining(): number | null {
//     const expiresAt = localStorage.getItem('tokenExpiresAt');
//     if (expiresAt) {
//       const remaining = parseInt(expiresAt) - Date.now();
//       const minutesRemaining = Math.floor(remaining / (60 * 1000));
//       if (minutesRemaining > 0) {
//         console.log(`⏰ Session time remaining: ${minutesRemaining} minutes`);
//       } else {
//         console.log("⏰ Session has expired");
//       }
//       return minutesRemaining > 0 ? minutesRemaining : 0;
//     }
//     console.log("⏰ No session expiry found");
//     return null;
//   }

//   // ========== PASSWORD MANAGEMENT ==========
  
//   /**
//    * Reset password using current password
//    */
//   async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
//     console.log("=========================================");
//     console.log("🔑 [AUTH SERVICE] RESET PASSWORD METHOD CALLED");
//     console.log("=========================================");
//     console.log("📡 Endpoint:", `${this.passwordBaseUrl}/reset-password`);
//     console.log("👤 Username:", data.username);
    
//     try {
//       const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/reset-password`, data);
//       console.log("✅ Password reset response:", {
//         status: response.data.status,
//         message: response.data.message
//       });
//       console.log("=========================================");
//       return response.data;
//     } catch (error: any) {
//       console.error("❌ Reset password error:", {
//         message: error.message,
//         status: error.response?.status,
//         data: error.response?.data
//       });
//       console.error("=========================================");
//       throw error;
//     }
//   }

//   /**
//    * Forgot password - send reset link to email
//    */
//   async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
//     console.log("=========================================");
//     console.log("📧 [AUTH SERVICE] FORGOT PASSWORD METHOD CALLED");
//     console.log("=========================================");
//     console.log("📡 Endpoint:", `${this.passwordBaseUrl}/forgot-password`);
//     console.log("📧 Email:", data.email);
    
//     try {
//       const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/forgot-password`, data);
//       console.log("✅ Forgot password response:", {
//         status: response.data.status,
//         message: response.data.message
//       });
//       console.log("=========================================");
//       return response.data;
//     } catch (error: any) {
//       console.error("❌ Forgot password error:", {
//         message: error.message,
//         status: error.response?.status,
//         data: error.response?.data
//       });
//       console.error("=========================================");
//       throw error;
//     }
//   }

//   /**
//    * Validate reset token for password reset
//    */
//   async validateResetToken(token: string): Promise<ValidateTokenResponse> {
//     console.log("=========================================");
//     console.log("✅ [AUTH SERVICE] VALIDATE RESET TOKEN METHOD CALLED");
//     console.log("=========================================");
//     console.log("📡 Endpoint:", `${this.passwordBaseUrl}/validate-reset-token`);
    
//     try {
//       const response = await api.post<ApiResponse<null>>(`${this.passwordBaseUrl}/validate-reset-token`, { token });
      
//       if (response.data.status === "SUCCESS") {
//         console.log("✅ Token is valid");
//         console.log("=========================================");
//         return { valid: true };
//       } else {
//         console.log("❌ Token is invalid");
//         console.log("=========================================");
//         return { valid: false };
//       }
//     } catch (error: any) {
//       console.error("❌ Token validation error:", {
//         message: error.message,
//         status: error.response?.status
//       });
//       console.error("=========================================");
//       return { valid: false };
//     }
//   }

//   /**
//    * Reset password using token (from email link)
//    */
//   async resetPasswordWithToken(data: ResetPasswordWithTokenRequest): Promise<ApiResponse<null>> {
//     console.log("=========================================");
//     console.log("🔑 [AUTH SERVICE] RESET PASSWORD WITH TOKEN METHOD CALLED");
//     console.log("=========================================");
//     console.log("📡 Endpoint:", `${this.passwordBaseUrl}/reset-password-with-token`);
    
//     try {
//       const response = await api.post<ApiResponse<null>>(
//         `${this.passwordBaseUrl}/reset-password-with-token`,
//         data
//       );
//       console.log("✅ Password reset with token successful");
//       console.log("=========================================");
//       return response.data;
//     } catch (error: any) {
//       console.error("❌ Reset password with token error:", {
//         message: error.message,
//         status: error.response?.status
//       });
//       console.error("=========================================");
//       throw error;
//     }
//   }

//   // ========== OTP MANAGEMENT (For temporary sellers/registration) ==========
  
//   /**
//    * Send OTP for email verification
//    */
//   async sendResetOtp(data: EmailOtpSendRequest): Promise<OtpResponse> {
//     console.log("=========================================");
//     console.log("📧 [AUTH SERVICE] SEND RESET OTP METHOD CALLED");
//     console.log("=========================================");
//     console.log("📡 Endpoint:", `${this.otpBaseUrl}/send`);
//     console.log("📧 Email:", data.email);
    
//     try {
//       const response = await api.post<OtpResponse>(`${this.otpBaseUrl}/send`, data);
//       console.log("✅ Send OTP response:", response.data);
//       console.log("=========================================");
//       return response.data;
//     } catch (error: any) {
//       console.error("❌ Send OTP error:", {
//         message: error.message,
//         status: error.response?.status
//       });
//       console.error("=========================================");
//       throw error;
//     }
//   }

//   // ========== COMPATIBILITY METHODS (For existing code that expects 'token') ==========
  
//   /**
//    * @deprecated Use getAccessToken() instead
//    */
//   getToken(): string | null {
//     return this.getAccessToken();
//   }
// }


// export const sellerAuthService = new SellerAuthService();