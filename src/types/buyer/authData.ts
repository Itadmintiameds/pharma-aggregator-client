export interface BuyerLoginRequest {
  username: string;
  password: string;
}

export interface BuyerLoginResponse {
  accessToken: string;
  refreshToken: string;
  type: string;
  buyerUserId: number;
  username: string;
  roles: string[];
  message?: string;
}

export interface BuyerSignupRequest {
  email: string;
  phone: string;
  password: string;
}

export interface BuyerOtpVerifyRequest {
  username?: string;
  email?: string;
  otp: string;
}

export interface BuyerOtpSentResponse {
  message: string;
  username: string;
}

export interface BuyerUser {
  buyerUserId: number;
  username: string;
  roles: string[];
  email?: string;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  count: null | number;
  data: T;
}

export type BuyerAuthStep = "LOGIN" | "OTP" | "SIGNUP";
