import axios from "axios";
import buyerApi from "@/src/lib/buyerApi";
import {
  BuyerLoginRequest,
  BuyerLoginResponse,
  BuyerOtpVerifyRequest,
  BuyerSignupRequest,
  BuyerOtpSentResponse,
  BuyerResetPasswordRequest,
  BuyerUser,
  ApiResponse,
} from "@/src/types/buyer/authData";

const setCookie = (name: string, value: string, days: number = 1) => {
  if (typeof window === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

type LoginApiResponse = ApiResponse<BuyerOtpSentResponse>;
type VerifyOtpApiResponse = ApiResponse<BuyerLoginResponse>;

class BuyerAuthService {
  private readonly authBaseUrl = "/buyer/authentication";
  private readonly signupBaseUrl = "/buyer/auth/signup";

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.data?.message ||
        error.response?.data?.message ||
        error.message ||
        fallback
      );
    }
    return error instanceof Error ? error.message : fallback;
  }

  // ========== SIGNUP (email + phone + password, email-OTP verified) ==========

  async sendSignupOtp(data: BuyerSignupRequest): Promise<BuyerOtpSentResponse> {
    try {
      const response = await buyerApi.post<LoginApiResponse>(this.signupBaseUrl, data);
      const responseData = response.data;

      if (responseData.status === "SUCCESS" && responseData.data) {
        return responseData.data;
      }
      throw new Error(responseData.message || "Signup failed");
    } catch (error) {
      throw new Error(this.extractErrorMessage(error, "Failed to send OTP. Please try again."));
    }
  }

  // No tokens are issued — the buyer must log in explicitly afterward via login().
  async verifySignupOtp(data: { email: string; otp: string }): Promise<BuyerOtpSentResponse> {
    try {
      const response = await buyerApi.post<LoginApiResponse>(`${this.signupBaseUrl}/verify-otp`, data);
      const responseData = response.data;

      if (responseData.status === "SUCCESS" && responseData.data) {
        return responseData.data;
      }
      throw new Error(responseData.message || "OTP verification failed");
    } catch (error) {
      throw new Error(this.extractErrorMessage(error, "OTP verification failed. Please try again."));
    }
  }

  // ========== LOGIN (password → email OTP → JWT) ==========

  async login(credentials: BuyerLoginRequest): Promise<BuyerOtpSentResponse> {
    try {
      const response = await buyerApi.post<LoginApiResponse>(`${this.authBaseUrl}/login`, credentials);
      const responseData = response.data;

      if (responseData.status === "SUCCESS" && responseData.data) {
        localStorage.setItem("buyerOtpUsername", responseData.data.username);
        return responseData.data;
      }
      throw new Error(responseData.message || "Login failed");
    } catch (error) {
      throw new Error(this.extractErrorMessage(error, "Login failed. Please try again."));
    }
  }

  async verifyOtp(credentials: BuyerOtpVerifyRequest): Promise<BuyerLoginResponse> {
    try {
      const payload = {
        username: credentials.username || credentials.email,
        otp: credentials.otp,
      };

      const response = await buyerApi.post<VerifyOtpApiResponse>(`${this.authBaseUrl}/verify-otp`, payload);
      const responseData = response.data;

      if (responseData.status === "SUCCESS" && responseData.data) {
        const loginData = responseData.data;

        // A temporary password means the account was just auto-provisioned
        // (guest quote-request submission) or reset by support — the buyer
        // must set a real password before we hand out a session. No tokens
        // are stored; the caller routes to the reset-password step instead.
        if (loginData.passwordTemporary) {
          return loginData;
        }

        const userData: BuyerUser = {
          buyerUserId: loginData.buyerUserId,
          username: loginData.username,
          roles: loginData.roles,
          email: loginData.username,
        };
        localStorage.setItem("buyerUser", JSON.stringify(userData));
        localStorage.setItem("buyerLastLogin", Date.now().toString());

        if (loginData.accessToken) {
          localStorage.setItem("buyerAccessToken", loginData.accessToken);
          setCookie("buyerToken", loginData.accessToken, 1);

          try {
            const tokenPayload = JSON.parse(atob(loginData.accessToken.split(".")[1]));
            localStorage.setItem("buyerTokenExpiresAt", (tokenPayload.exp * 1000).toString());
          } catch {
            localStorage.setItem("buyerTokenExpiresAt", (Date.now() + 24 * 60 * 60 * 1000).toString());
          }
        }

        if (loginData.refreshToken) {
          localStorage.setItem("buyerRefreshToken", loginData.refreshToken);
        }

        return loginData;
      }
      throw new Error(responseData.message || "OTP verification failed");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 410) {
          throw new Error("OTP has expired. Please login again to receive a new OTP.");
        }
        if (error.response?.status === 429) {
          throw new Error("Too many failed attempts. Please try again later.");
        }
      }
      throw new Error(this.extractErrorMessage(error, "OTP verification failed. Please try again."));
    }
  }

  async refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem("buyerRefreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await buyerApi.post(`${this.authBaseUrl}/refresh`, { refreshToken });

    if (response.data.accessToken) {
      localStorage.setItem("buyerAccessToken", response.data.accessToken);
      localStorage.setItem("buyerRefreshToken", response.data.refreshToken);
      setCookie("buyerToken", response.data.accessToken, 1);
    }

    return response.data;
  }

  // First-time password reset for a buyer account still holding a temporary
  // password (see verifyOtp's passwordTemporary branch above). No tokens
  // exist yet at this point — the buyer logs in again normally afterward.
  async resetPassword(data: BuyerResetPasswordRequest): Promise<void> {
    try {
      const response = await buyerApi.post<ApiResponse<null>>(`${this.authBaseUrl}/reset-password`, data);
      if (response.data.status !== "SUCCESS") {
        throw new Error(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      throw new Error(this.extractErrorMessage(error, "Failed to reset password. Please try again."));
    }
  }

  async logout(refreshToken?: string): Promise<void> {
    const token = refreshToken || localStorage.getItem("buyerRefreshToken");

    if (token) {
      try {
        await buyerApi.post(`${this.authBaseUrl}/logout`, { refreshToken: token });
      } catch {
        // clear local data anyway
      }
    }

    this.clearAuth();
  }

  clearAuth(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem("buyerAccessToken");
    localStorage.removeItem("buyerRefreshToken");
    localStorage.removeItem("buyerUser");
    localStorage.removeItem("buyerTokenExpiresAt");
    localStorage.removeItem("buyerLastLogin");
    localStorage.removeItem("buyerOtpUsername");

    deleteCookie("buyerToken");

    window.dispatchEvent(new Event("buyer-auth-changed"));
  }

  // Deliberately presence-based, not expiry-based: an expired access token
  // with a still-valid refreshToken is a normal, healthy session — buyerApi.ts's
  // 401 interceptor transparently refreshes it on the next request. Returning
  // false here just because the access token's exp has passed would bounce a
  // perfectly recoverable session to the login modal before that refresh ever
  // gets a chance to run. The session is only actually gone once refreshToken
  // itself is missing or the refresh call fails — both already handled by
  // buyerApi.ts's interceptor, which clears storage and redirects at that point.
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    const accessToken = localStorage.getItem("buyerAccessToken");
    const refreshToken = localStorage.getItem("buyerRefreshToken");
    return !!accessToken && !!refreshToken;
  }

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("buyerAccessToken");
  }

  getCurrentUser(): BuyerUser | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("buyerUser");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}

export const buyerAuthService = new BuyerAuthService();
