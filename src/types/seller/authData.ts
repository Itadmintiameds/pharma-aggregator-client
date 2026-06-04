export interface LoginRequest {
  username: string;
  password: string;
}

// Updated to match backend response (accessToken instead of token, added refreshToken)
export interface LoginResponse {
  accessToken: string;   
  refreshToken: string;   
  type: string;
  userId: number;
  username: string;
  roles: string[];
  passwordTemporary: boolean;
  message?: string;
}

// New interface for refresh token request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// New interface for refresh token response
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  type: string;
  userId: number;
  username: string;
  roles: string[];
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
  username?: string; 
  email?: string; 
  otp: string;
}

export interface OtpResponse {
  status: string;
  message: string;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
   count: null | number;
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

export type AuthStep = "login" | "otp" | "resetPassword" | "forgotPassword";

// New interface for logout request
export interface LogoutRequest {
  refreshToken: string;
}

// New interface for session info (optional)
export interface SessionInfo {
  isAuthenticated: boolean;
  accessTokenExpiry: Date | null;
  refreshTokenExpiry: Date | null;
  timeUntilExpiry: number | null; // in milliseconds
  user: User | null;
}









//code dated 03.06.2026 withoput refresh token ....................................

// export interface LoginRequest {
//   username: string;
//   password: string;
// }

// export interface LoginResponse {
//   token: string;
//   type: string;
//   userId: number;
//   username: string;
//   roles: string[];
//   passwordTemporary: boolean;
//   message?: string;
// }

// export interface ResetPasswordRequest {
//   username: string;
//   currentPassword: string;
//   newPassword: string;
// }

// export interface ForgotPasswordRequest {
//   email: string;
// }

// export interface ResetPasswordWithTokenRequest {
//   token: string;
//   newPassword: string;
// }

// // OTP Types
// export interface EmailOtpSendRequest {
//   email: string;
// }

// export interface EmailOtpVerifyRequest {
//   username?: string; 
//   email?: string; 
//   otp: string;
// }

// export interface OtpResponse {
//   status: string;
//   message: string;
// }

// export interface ApiResponse<T> {
//   status: string;
//   message: string;
//   data: T;
// }

// export interface ValidateTokenResponse {
//   valid: boolean;
//   email?: string;
// }

// export interface AuthError {
//   response?: {
//     data?: {
//       message?: string;
//       error?: string;
//       status?: string;
//     };
//     status?: number;
//   };
// }

// export interface User {
//   userId: number;
//   username: string;
//   roles: string[];
//   email?: string;
//   passwordTemporary?: boolean;
// }

// export interface ValidateTokenResponse {
//   valid: boolean;
//   email?: string;
// }

// export interface ResetPasswordWithTokenRequest {
//   token: string;
//   newPassword: string;
// }

// export type AuthStep = "login" | "otp" | "resetPassword" | "forgotPassword";