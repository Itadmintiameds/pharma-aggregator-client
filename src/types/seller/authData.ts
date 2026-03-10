export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  roles: string[];
  passwordTemporary: boolean;
  message?: string;
}

export interface ResetPasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordWithTokenRequest {
  token: string;
  newPassword: string;
}

// OTP Types
export interface EmailOtpSendRequest {
  email: string;
}

export interface EmailOtpVerifyRequest {
  email: string;
  otp: string;
}

export interface OtpResponse {
  status: string;
  message: string;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface ValidateTokenResponse {
  valid: boolean;
  email?: string;
}

export interface AuthError {
  response?: {
    data?: {
      message?: string;
      error?: string;
      status?: string;
    };
    status?: number;
  };
}

export interface User {
  userId: number;
  username: string;
  roles: string[];
  email?: string;
  passwordTemporary?: boolean;
}

export interface ValidateTokenResponse {
  valid: boolean;
  email?: string;
}

export interface ResetPasswordWithTokenRequest {
  token: string;
  newPassword: string;
}

export type AuthStep = "login" | "otp" | "resetPassword" | "forgotPassword";