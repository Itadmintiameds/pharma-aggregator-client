import { api } from "@/src/utils/api";

// ─── MASTERS ─────────────────────────────────────────────────────────────────

export const getNonConsumableDeviceCategories = async () => {
  try {
    const response = await api.get("masters/device-categories/non-consumable");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching non-consumable device categories:", error);
    if (error instanceof Error)
      throw new Error(`Error fetching non-consumable device categories: ${error.message}`);
    throw new Error("An unknown error occurred while fetching non-consumable device categories.");
  }
};

export const getNonConsumableDeviceSubCategories = async (categoryId: string | number) => {
  try {
    const response = await api.get(`masters/device-sub-categories/${categoryId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching device subcategories:", error);
    if (error instanceof Error)
      throw new Error(`Error fetching device subcategories: ${error.message}`);
    throw new Error("An unknown error occurred while fetching device subcategories.");
  }
};

export const getNonConsumableMaterialTypes = async () => {
  try {
    const response = await api.get("masters/non-consumable-material-types");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching non-consumable material types:", error);
    if (error instanceof Error)
      throw new Error(`Error fetching non-consumable material types: ${error.message}`);
    throw new Error("An unknown error occurred while fetching non-consumable material types.");
  }
};

export const getNonConsumableStorageConditions = async () => {
  try {
    const response = await api.get("masters/storagecondition");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching storage conditions:", error);
    if (error instanceof Error)
      throw new Error(`Error fetching storage conditions: ${error.message}`);
    throw new Error("An unknown error occurred while fetching storage conditions.");
  }
};

export const getNonConsumableCountries = async () => {
  try {
    const response = await api.get("masters/countries");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching countries:", error);
    if (error instanceof Error)
      throw new Error(`Error fetching countries: ${error.message}`);
    throw new Error("An unknown error occurred while fetching countries.");
  }
};

export const getNonConsumableCertifications = async () => {
  try {
    const response = await api.get("masters/certifications");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching certifications:", error);
    if (error instanceof Error)
      throw new Error(`Error fetching certifications: ${error.message}`);
    throw new Error("An unknown error occurred while fetching certifications.");
  }
};

export const getNonConsumablePackTypes = async (categoryId: number = 6) => {
  try {
    const response = await api.get(`dosage/packType/category/${categoryId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching pack types:", error);
    if (error instanceof Error)
      throw new Error(`Error fetching pack types: ${error.message}`);
    throw new Error("An unknown error occurred while fetching pack types.");
  }
};

export const getNonConsumablePowerSources = async () => {
  try {
    const response = await api.get("masters/power-sources");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching power sources:", error);
    if (error instanceof Error)
      throw new Error(`Error fetching power sources: ${error.message}`);
    throw new Error("An unknown error occurred while fetching power sources.");
  }
};

export const getNonConsumableProductCategories = async () => {
  try {
    const response = await api.get("masters/categories");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.warn("Could not fetch product categories, using fallback categoryId=6:", error);
    return []; // ← return empty array instead of throwing
  }
};

// ─── PRODUCT CRUD ─────────────────────────────────────────────────────────────

export const createNonConsumableProduct = async (payload: Record<string, unknown>) => {
  try {
    const response = await api.post("products/create", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating non-consumable product", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.data?.message ??
      error.response?.data?.message ??
      error.message ??
      "Error creating non-consumable product"
    );
  }
};

// ─── DOCUMENT UPLOADS ─────────────────────────────────────────────────────────

export const uploadNonConsumableCertificate = async (
  attributeId: string,
  documentId: number,
  file: File,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("documentIds", String(documentId));
    formData.append("certificateFiles", file, file.name);

    const response = await api.post(
      `product-documents/non-consumable/${attributeId}/certificates`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { success: response.status >= 200 && response.status < 300 };
  } catch (error: any) {
    console.error("Error uploading non-consumable certificate:", error);
    return {
      success: false,
      message: error.response?.data?.message ?? error.message ?? "Upload failed",
    };
  }
};

export const uploadNonConsumableBrochure = async (
  attributeId: string,
  file: File,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("brochureFile", file);

    const response = await api.post(
      `product-documents/non-consumable/${attributeId}/brochure`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { success: response.status >= 200 && response.status < 300 };
  } catch (error: any) {
    console.error("Error uploading non-consumable brochure:", error);
    return {
      success: false,
      message: error.response?.data?.message ?? error.message ?? "Upload failed",
    };
  }
};


export const getStorageConditionsByCategoryId = async (categoryId: number) => {
  try {
    const response = await api.get(`/storageConditions/${categoryId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Storage Conditions:', error);

    if (error instanceof Error) {
      throw new Error(`Error fetching Storage Conditions: ${error.message}`);
    } else {
      throw new Error(
        'An unknown error occurred while fetching Storage Conditions.'
      );
    }
  }
};

export const getNonConsumableCertificationsByCategoryId = async (categoryId: number) => {
  try {
    const response = await api.get(`/masters/certifications/categoryId/${categoryId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching certifications:", error);
    if (error instanceof Error) throw new Error(`Error fetching certifications: ${error.message}`);
    throw new Error("An unknown error occurred while fetching certifications.");
  }
};

export const getSpecificationUnitsBySubCategory = async (subCategoryId: string | number) => {
  try {
    const response = await api.get(`masters/by-subcategory/${subCategoryId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching specification units:", error);
    if (error instanceof Error)
      throw new Error(`Error fetching specification units: ${error.message}`);
    throw new Error("An unknown error occurred while fetching specification units.");
  }
};