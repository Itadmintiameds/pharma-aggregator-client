import { api } from "@/src/utils/api";

const API_BASE = "https://api-test-aggreator.tiameds.ai/api/v1";

// ─── MASTERS ──────────────────────────────────────────────────────────────────

export const getCosmeticProductTypes = async () => {
  try {
    const response = await api.get("masters/cosmetic-product-types");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching cosmetic product types:", error);
    if (error instanceof Error) throw new Error(`Error fetching cosmetic product types: ${error.message}`);
    throw new Error("An unknown error occurred while fetching cosmetic product types.");
  }
};

export const getCosmeticProductSubTypes = async (productTypeId: string | number) => {
  try {
    const response = await api.get(`masters/cosmetic-product-sub-types/${productTypeId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching cosmetic product sub-types:", error);
    if (error instanceof Error) throw new Error(`Error fetching cosmetic product sub-types: ${error.message}`);
    throw new Error("An unknown error occurred while fetching cosmetic product sub-types.");
  }
};

export const getCosmeticSkinTypes = async () => {
  try {
    const response = await api.get("masters/skin-types");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching skin types:", error);
    if (error instanceof Error) throw new Error(`Error fetching skin types: ${error.message}`);
    throw new Error("An unknown error occurred while fetching skin types.");
  }
};

export const getCosmeticHairTypes = async () => {
  try {
    const response = await api.get("masters/hair-types");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching hair types:", error);
    if (error instanceof Error) throw new Error(`Error fetching hair types: ${error.message}`);
    throw new Error("An unknown error occurred while fetching hair types.");
  }
};

export const getCosmeticAgeGroups = async () => {
  try {
    const response = await api.get("masters/age-groups/getAll");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching age groups:", error);
    if (error instanceof Error) throw new Error(`Error fetching age groups: ${error.message}`);
    throw new Error("An unknown error occurred while fetching age groups.");
  }
};

export const getCosmeticIntendedUseAreas = async () => {
  try {
    const response = await api.get("masters/intended-use-areas");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching intended use areas:", error);
    if (error instanceof Error) throw new Error(`Error fetching intended use areas: ${error.message}`);
    throw new Error("An unknown error occurred while fetching intended use areas.");
  }
};

export const getCosmeticStorageConditions = async () => {
  try {
    const response = await api.get("masters/storagecondition");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching storage conditions:", error);
    if (error instanceof Error) throw new Error(`Error fetching storage conditions: ${error.message}`);
    throw new Error("An unknown error occurred while fetching storage conditions.");
  }
};

export const getCosmeticCountries = async () => {
  try {
    const response = await api.get("masters/countries");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching countries:", error);
    if (error instanceof Error) throw new Error(`Error fetching countries: ${error.message}`);
    throw new Error("An unknown error occurred while fetching countries.");
  }
};

export const getCosmeticCertifications = async () => {
  try {
    const response = await api.get("masters/certifications");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching certifications:", error);
    if (error instanceof Error) throw new Error(`Error fetching certifications: ${error.message}`);
    throw new Error("An unknown error occurred while fetching certifications.");
  }
};

export const getCosmeticPackTypes = async (categoryId: number = 4) => {
  try {
    const response = await api.get(`dosage/packType/category/${categoryId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching pack types:", error);
    if (error instanceof Error) throw new Error(`Error fetching pack types: ${error.message}`);
    throw new Error("An unknown error occurred while fetching pack types.");
  }
};

// ─── PRODUCT CRUD ─────────────────────────────────────────────────────────────

export const createCosmeticProduct = async (payload: Record<string, unknown>) => {
  try {
    const response = await api.post("products/create", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating cosmetic product", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.data?.message ??
      error.response?.data?.message ??
      error.message ??
      "Error creating cosmetic product"
    );
  }
};

// ─── DOCUMENT UPLOADS ─────────────────────────────────────────────────────────

export const uploadCosmeticCertificate = async (
  productAttributeId: string,
  documentId: number,
  file: File,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("documentIds", String(documentId));
    formData.append("certificateFiles", file, file.name);

    const response = await api.post(
      `product-documents/cosmetic/${productAttributeId}/certificates`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { success: response.status >= 200 && response.status < 300 };
  } catch (error: any) {
    console.error("Error uploading cosmetic certificate:", error);
    return {
      success: false,
      message: error.response?.data?.message ?? error.message ?? "Upload failed",
    };
  }
};

export const uploadCosmeticBrochure = async (
  productAttributeId: string,
  file: File,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("brochureFile", file);

    const response = await api.post(
      `product-documents/cosmetic/${productAttributeId}/brochure`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { success: response.status >= 200 && response.status < 300 };
  } catch (error: any) {
    console.error("Error uploading cosmetic brochure:", error);
    return {
      success: false,
      message: error.response?.data?.message ?? error.message ?? "Upload failed",
    };
  }
};