import { api } from "@/src/utils/api";

const API_BASE = "https://api-test-aggreator.tiameds.ai/api/v1";

// ─── MASTERS ─────────────────────────────────────────────────────────────────

export const getConsumableDeviceCategories = async () => {
  try {
    const response = await api.get("masters/device-categories/consumable");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching consumable device categories:", error);
    if (error instanceof Error) throw new Error(`Error fetching consumable device categories: ${error.message}`);
    throw new Error("An unknown error occurred while fetching consumable device categories.");
  }
};

export const getConsumableDeviceSubCategories = async (categoryId: string | number) => {
  try {
    const response = await api.get(`masters/device-sub-categories/${categoryId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching device subcategories:", error);
    if (error instanceof Error) throw new Error(`Error fetching device subcategories: ${error.message}`);
    throw new Error("An unknown error occurred while fetching device subcategories.");
  }
};

export const getConsumableMaterialTypes = async () => {
  try {
    const response = await api.get("masters/consumable-material-types");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching material types:", error);
    if (error instanceof Error) throw new Error(`Error fetching material types: ${error.message}`);
    throw new Error("An unknown error occurred while fetching material types.");
  }
};

export const getConsumableStorageConditions = async () => {
  try {
    const response = await api.get("masters/storagecondition");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching storage conditions:", error);
    if (error instanceof Error) throw new Error(`Error fetching storage conditions: ${error.message}`);
    throw new Error("An unknown error occurred while fetching storage conditions.");
  }
};

export const getConsumableCountries = async () => {
  try {
    const response = await api.get("masters/countries");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching countries:", error);
    if (error instanceof Error) throw new Error(`Error fetching countries: ${error.message}`);
    throw new Error("An unknown error occurred while fetching countries.");
  }
};

export const getConsumableCertifications = async () => {
  try {
    const response = await api.get("masters/certifications");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching certifications:", error);
    if (error instanceof Error) throw new Error(`Error fetching certifications: ${error.message}`);
    throw new Error("An unknown error occurred while fetching certifications.");
  }
};

export const getConsumablePackTypes = async (categoryId: number = 5) => {
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

export const createConsumableProduct = async (payload: Record<string, unknown>) => {
  try {
    const response = await api.post("products/create", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating consumable product", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.data?.message ??
      error.response?.data?.message ??
      error.message ??
      "Error creating consumable product"
    );
  }
};

// ─── DOCUMENT UPLOADS ─────────────────────────────────────────────────────────

export const uploadConsumableCertificate = async (
  attributeId: string,
  documentId: number,
  file: File,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("documentIds", String(documentId));
    formData.append("certificateFiles", file, file.name);

    const response = await api.post(
      `product-documents/consumable/${attributeId}/certificates`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { success: response.status >= 200 && response.status < 300 };
  } catch (error: any) {
    console.error("Error uploading certificate:", error);
    return {
      success: false,
      message: error.response?.data?.message ?? error.message ?? "Upload failed",
    };
  }
};

export const uploadConsumableBrochure = async (
  attributeId: string,
  file: File,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("brochureFile", file);

    const response = await api.post(
      `product-documents/consumable/${attributeId}/brochure`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { success: response.status >= 200 && response.status < 300 };
  } catch (error: any) {
    console.error("Error uploading brochure:", error);
    return {
      success: false,
      message: error.response?.data?.message ?? error.message ?? "Upload failed",
    };
  }
};