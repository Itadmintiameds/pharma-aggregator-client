import axios from "axios";
import buyerApi from "@/src/lib/buyerApi";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

interface ApiResponseWrapper<T> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

export interface TempBuyerAddressPayload {
  stateId?: number;
  districtId?: number;
  talukaId?: number;
  city?: string;
  street?: string;
  buildingNo?: string;
  landmark?: string;
  pinCode?: string;
}

export interface TempBuyerContactPayload {
  name?: string;
  designation?: string;
  email?: string;
  mobile?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface TempBuyerDocumentPayload {
  documentTypeId?: number;
  documentNumber?: string;
  documentFileUrl?: string;
  isDocumentVerified?: boolean;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  licenseIssuingAuthority?: string;
}

// Same field set for both the draft (TempBuyerDraftRequestDTO, zero
// validation) and the finalize/create (TempBuyerRequestDTO, validated)
// endpoints — the backend DTOs are structurally identical, only the
// server-side validation differs, so one payload type covers both.
export interface TempBuyerPayload {
  organizationName?: string;
  buyerTypeId?: number;
  termsAccepted?: boolean;
  // Required explicit field — BuyerUser has no Spring Security principal
  // wired up yet, so it can't be resolved from the SecurityContext the way
  // TempSellerServiceImpl resolves the seller. withBuyerUserId() below fills
  // this in automatically from buyerAuthService if the caller omits it.
  buyerUserId?: number;
  orgLogoUrl?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: TempBuyerAddressPayload;
  contact?: TempBuyerContactPayload;
  documents?: TempBuyerDocumentPayload[];
}

// Raw TempBuyer JPA entity as returned (wrapped in ApiResponse) by
// GET /temp-buyers/{id} and GET /temp-buyers/user/{userId} — nested master
// references (address.state/district/taluka, documents[].documentType,
// buyerType) come back as full nested objects, not flat ids/names, mirroring
// TempSeller's equivalent raw-entity shape (see SellerRegister.tsx's
// DraftDocumentRow comment for the seller-side precedent of this exact
// mismatch between the draft-resume GET and the flat request DTOs above).
//
// The entity's real PK field is `tempBuyerDocumentId` (unlike seller's
// TempSellerDocument, which was deliberately NOT given that same odd
// "DocumentsId" capitalization quirk for buyer — see TempBuyerDocument.java)
// — confirmed against entity/temp/buyer/TempBuyerDocument.java. DocumentsId/
// documentId are kept only as defensive fallbacks in case a future backend
// change renames the field; they never actually populate today.
export interface RawTempBuyerDocument {
  tempBuyerDocumentId?: number;
  DocumentsId?: number;
  documentId?: number;
  documentType?: { documentTypeId?: number; documentTypeCode?: string; documentTypeName?: string };
  documentNumber?: string;
  documentFileUrl?: string;
  documentFileName?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  licenseIssuingAuthority?: string;
}

export interface RawTempBuyer {
  tempBuyerId?: number;
  tempBuyerRequestId?: string;
  status?: string;
  organizationName?: string;
  buyerType?: { buyerTypeId?: number; buyerTypeName?: string; mandatoryDocumentTypeId?: number };
  gstNumber?: string;
  panNumber?: string;
  orgLogoUrl?: string;
  address?: {
    state?: { stateId?: number; stateName?: string };
    district?: { districtId?: number; districtName?: string };
    taluka?: { talukaId?: number; talukaName?: string };
    city?: string;
    street?: string;
    buildingNo?: string;
    landmark?: string;
    pinCode?: string;
  };
  contact?: {
    name?: string;
    designation?: string;
    email?: string;
    mobile?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };
  documents?: RawTempBuyerDocument[];
}

// Response returned by create/update/finalize (NOT by get-by-id/get-by-user,
// which return the raw entity above).
export interface TempBuyerResponse {
  tempBuyerId: number;
  organizationName: string;
  tempBuyerRequestId: string;
  status: string;
  createdAt?: string;
  documents?: Array<{ documentId: number; documentTypeName: string }>;
}

class BuyerRegistrationService {
  private currentBuyerUserId(): number | undefined {
    return buyerAuthService.getCurrentUser()?.buyerUserId;
  }

  // Every draft/finalize call body must carry an explicit buyerUserId (no
  // SecurityContext resolution for BuyerUser yet) — fill it in from the
  // logged-in buyer's stored user object unless the caller already set one.
  private withBuyerUserId<T extends { buyerUserId?: number }>(data: T): T {
    return { ...data, buyerUserId: data.buyerUserId ?? this.currentBuyerUserId() };
  }

  async createDraftTempBuyer(data: TempBuyerPayload): Promise<TempBuyerResponse> {
    const response = await buyerApi.post<ApiResponseWrapper<TempBuyerResponse>>(
      "/temp-buyers/draft",
      this.withBuyerUserId(data)
    );
    return response.data.data;
  }

  async updateDraftTempBuyer(id: number, data: TempBuyerPayload): Promise<TempBuyerResponse> {
    const response = await buyerApi.put<ApiResponseWrapper<TempBuyerResponse>>(
      `/temp-buyers/draft/${id}`,
      this.withBuyerUserId(data)
    );
    return response.data.data;
  }

  async finalizeDraftTempBuyer(id: number, data: TempBuyerPayload): Promise<TempBuyerResponse> {
    const response = await buyerApi.post<ApiResponseWrapper<TempBuyerResponse>>(
      `/temp-buyers/draft/${id}/finalize`,
      this.withBuyerUserId(data)
    );
    return response.data.data;
  }

  async getTempBuyerByUserId(buyerUserId: number): Promise<RawTempBuyer> {
    try {
      const response = await buyerApi.get<ApiResponseWrapper<RawTempBuyer>>(`/temp-buyers/user/${buyerUserId}`);
      return response.data.data;
    } catch (error) {
      // 404 just means this buyer never started a registration — an
      // expected "nothing to resume" case, not a real error.
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`No temp buyer yet for user ${buyerUserId}`);
      }
      throw error;
    }
  }

  async getTempBuyerById(id: number): Promise<RawTempBuyer> {
    const response = await buyerApi.get<ApiResponseWrapper<RawTempBuyer>>(`/temp-buyers/${id}`);
    return response.data.data;
  }

  async deleteTempBuyer(id: number): Promise<void> {
    await buyerApi.delete(`/temp-buyers/${id}`);
  }

  // These four uniqueness-check endpoints return a bare Boolean body (not an
  // ApiResponse-wrapped object) — see TempBuyerController#checkEmailExists etc.
  async checkEmailUnique(email: string, tempBuyerId?: number | null): Promise<boolean> {
    const response = await buyerApi.get<boolean>("/temp-buyers/contact/check-email", {
      params: { email, tempBuyerId: tempBuyerId ?? undefined },
    });
    return response.data === true;
  }

  async checkMobileUnique(mobile: string, tempBuyerId?: number | null): Promise<boolean> {
    const response = await buyerApi.get<boolean>("/temp-buyers/contact/check-phone", {
      params: { mobile, tempBuyerId: tempBuyerId ?? undefined },
    });
    return response.data === true;
  }

  async checkGSTNumber(gstNumber: string): Promise<boolean> {
    const response = await buyerApi.get<boolean>("/temp-buyers/contact/check-gstnumber", {
      params: { gstnumber: gstNumber },
    });
    return response.data === true;
  }

  async checkPANNumber(panNumber: string): Promise<boolean> {
    const response = await buyerApi.get<boolean>("/temp-buyers/contact/check-pannumber", {
      params: { pannumber: panNumber },
    });
    return response.data === true;
  }

  // ==================== CONTACT OTP (Step 3) ====================
  // TempBuyerController exposes no dedicated OTP endpoints for registration-
  // contact verification, so this reuses the same two generic OTP backends
  // the seller wizard already calls (see sellerRegistrationService):
  //   - email -> /temp-seller/email-otp/send + /verify (TempSellerEmailOtp
  //     is a generic {email, otp, expiryTime, verified} table with no FK to
  //     any seller row, so despite the package name it isn't seller-scoped)
  //   - phone -> /otp/send + /verify (Twilio-backed, SMSOtpRequestDTO only
  //     has a `phone` field — this is the SMS-only endpoint; it does not
  //     accept `email`, so email must NOT be routed through it)
  // The two endpoints also respond with different shapes (confirmed against
  // sellerRegistrationService's own parsing): email-otp/verify returns the
  // flat OtpResponseDTO {status, message} directly, while /otp/verify's
  // response is wrapped one level deeper as {data: {status, message}}.
  async sendContactOtp(identifier: string, channel: "email" | "phone"): Promise<void> {
    if (channel === "email") {
      await buyerApi.post("/temp-seller/email-otp/send", { email: identifier });
    } else {
      await buyerApi.post("/otp/send", { phone: identifier });
    }
  }

  async verifyContactOtp(identifier: string, otp: string, channel: "email" | "phone"): Promise<void> {
    if (channel === "email") {
      const response = await buyerApi.post<{ status?: string; message?: string }>(
        "/temp-seller/email-otp/verify",
        { email: identifier, otp }
      );
      if (response.data?.status === "ERROR") {
        throw new Error(response.data.message || "Invalid OTP");
      }
      return;
    }

    const response = await buyerApi.post<ApiResponseWrapper<{ status?: string; message?: string }>>(
      "/otp/verify",
      { phone: identifier, otp }
    );
    if (response.data?.data?.status === "ERROR") {
      throw new Error(response.data.data.message || "Invalid OTP");
    }
  }
}

export const buyerRegistrationService = new BuyerRegistrationService();
