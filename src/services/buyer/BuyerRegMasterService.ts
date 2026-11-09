import buyerApi from "@/src/lib/buyerApi";

interface ApiResponse<T> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

export interface BuyerTypeResponse {
  buyerTypeId: number;
  buyerTypeName: string;
  buyerTypeAbbreviation: string;
  // Single FK to tbl_document_type_master — every buyer type has exactly one
  // mandatory document type, never a list (see docs/
  // seed_buyer_types_and_document_types.sql and requiredBuyerDocumentCodes()
  // in src/schema/buyer/buyerRegSchema.ts, which mirrors this 1:1 mapping).
  mandatoryDocumentTypeId: number;
  isActive: boolean;
}

export interface StateResponse {
  stateId: number;
  stateName: string;
}

export interface DistrictResponse {
  districtId: number;
  districtName: string;
}

export interface TalukaResponse {
  talukaId: number;
  talukaName: string;
}

// Mirrors DocumentTypeResponseDTO from DocumentTypeMasterController's
// GET /document-types — used to resolve a buyer type's numeric
// mandatoryDocumentTypeId (from BuyerTypeResponse above) into a human label,
// so the wizard never hardcodes a buyer-type-name -> document label mapping.
export interface DocumentTypeResponse {
  documentTypeId: number;
  documentTypeName: string;
  documentTypeCode: string;
  isActive: boolean;
}

// Master-data lookups for the buyer registration wizard. Address dropdowns
// (states/districts/talukas) hit the same generic master endpoints the
// seller wizard already uses — only the axios client differs (buyerApi, not
// api.ts) per CLAUDE.md's two-client separation.
class BuyerRegMasterService {
  async getBuyerTypes(): Promise<BuyerTypeResponse[]> {
    try {
      const response = await buyerApi.get<ApiResponse<BuyerTypeResponse[]>>("/buyer-types");
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      console.error("Error fetching buyer types:", error);
      throw error;
    }
  }

  async getStates(): Promise<StateResponse[]> {
    try {
      const response = await buyerApi.get<ApiResponse<StateResponse[]>>("/states");
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      console.error("Error fetching states:", error);
      throw error;
    }
  }

  async getDistrictsByStateId(stateId: number): Promise<DistrictResponse[]> {
    if (!stateId) return [];
    try {
      const response = await buyerApi.get<ApiResponse<DistrictResponse[]>>(`/districts/state/${stateId}`);
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      console.error(`Error fetching districts for state ${stateId}:`, error);
      throw error;
    }
  }

  async getTalukasByDistrictId(districtId: number): Promise<TalukaResponse[]> {
    if (!districtId) return [];
    try {
      const response = await buyerApi.get<ApiResponse<TalukaResponse[]>>(`/talukas/district/${districtId}`);
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      console.error(`Error fetching talukas for district ${districtId}:`, error);
      throw error;
    }
  }

  async getDocumentTypes(): Promise<DocumentTypeResponse[]> {
    try {
      const response = await buyerApi.get<ApiResponse<DocumentTypeResponse[]>>("/document-types");
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      console.error("Error fetching document types:", error);
      throw error;
    }
  }
}

export const buyerRegMasterService = new BuyerRegMasterService();
