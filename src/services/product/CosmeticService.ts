import { api } from "@/src/utils/api";

// ─── MASTERS ──────────────────────────────────────────────────────────────────

/**
 * Product Types (Category 4 = Cosmetics & Personal Care)
 * GET /productCategory/getProductCategory/4
 */
export const getCosmeticProductTypes = async () => {
  try {
    const response = await api.get("productCategory/getProductCategory/4");
    const rawData = response.data?.data ?? response.data ?? [];

    return rawData.map((item: any) => ({
      categoryId:      item.productCategoryId,
      categoryName:    item.productCategory,
      productTypeId:   item.productCategoryId,
      productTypeName: item.productCategory,
      id:              item.productCategoryId,
      name:            item.productCategory,
    }));
  } catch (error: unknown) {
    console.error("Error fetching cosmetic product types:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching cosmetic product types: ${error.message}`
        : "An unknown error occurred while fetching cosmetic product types.",
    );
  }
};

/**
 * Product Sub-Types filtered by parent product type ID
 * Reuses the same /productCategory/getProductCategory/4 endpoint and filters
 * by productCategoryId to find the matching category's subcategories.
 */
export const getCosmeticProductSubTypes = async (
  productTypeId: string | number,
) => {
  try {
    const response = await api.get("productCategory/getProductCategory/4");
    const categories: any[] = response.data?.data ?? response.data ?? [];

    const category = categories.find(
      (cat: any) => String(cat.productCategoryId) === String(productTypeId),
    );

    if (!category?.productSubcategoryMasters) return [];

    return category.productSubcategoryMasters.map((sub: any) => ({
      productSubTypeId:   sub.productSubcategoryId,
      productSubTypeName: sub.productSubcategory,
      subcategoryId:      sub.productSubcategoryId,
      subcategoryName:    sub.productSubcategory,
      id:                 sub.productSubcategoryId,
      name:               sub.productSubcategory,
    }));
  } catch (error: unknown) {
    console.error("Error fetching cosmetic product sub-types:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching cosmetic product sub-types: ${error.message}`
        : "An unknown error occurred while fetching cosmetic product sub-types.",
    );
  }
};

/**
 * Skin Types master
 * GET /masters/skin-types
 */
export const getCosmeticSkinTypes = async () => {
  try {
    const response = await api.get("masters/skin-types");
    const rawData: any[] = response.data?.data ?? response.data ?? [];

    return rawData.map((item: any) => ({
      ...item,
      // Support whatever key shape the API returns
      skinTypeId:   item.skinTypeId   ?? item.typeId   ?? item.id,
      skinTypeName: item.skinTypeName ?? item.typeName  ?? item.name,
      id:           item.skinTypeId   ?? item.typeId   ?? item.id,
      name:         item.skinTypeName ?? item.typeName  ?? item.name,
    }));
  } catch (error: unknown) {
    console.error("Error fetching skin types:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching skin types: ${error.message}`
        : "An unknown error occurred while fetching skin types.",
    );
  }
};

/**
 * Hair Types master
 * GET /masters/hair-types
 */
export const getCosmeticHairTypes = async () => {
  try {
    const response = await api.get("masters/hair-types");
    const rawData: any[] = response.data?.data ?? response.data ?? [];

    return rawData.map((item: any) => ({
      ...item,
      hairTypeId:   item.hairTypeId   ?? item.typeId   ?? item.id,
      hairTypeName: item.hairTypeName ?? item.typeName  ?? item.name,
      id:           item.hairTypeId   ?? item.typeId   ?? item.id,
      name:         item.hairTypeName ?? item.typeName  ?? item.name,
    }));
  } catch (error: unknown) {
    console.error("Error fetching hair types:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching hair types: ${error.message}`
        : "An unknown error occurred while fetching hair types.",
    );
  }
};

/**
 * Age Groups master
 * GET /ageGroup/getAll
 */
export const getCosmeticAgeGroups = async () => {
  try {
    const response = await api.get("ageGroup/getAll");
    const rawData: any[] = response.data?.data ?? response.data ?? [];

    return rawData.map((item: any) => ({
      ...item,
      ageGroupId:   item.ageGroupId ?? item.id,
      ageGroupName: item.ageGroup   ?? item.ageGroupName ?? item.name,
      id:           item.ageGroupId ?? item.id,
      name:         item.ageGroup   ?? item.ageGroupName ?? item.name,
    }));
  } catch (error: unknown) {
    console.error("Error fetching age groups:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching age groups: ${error.message}`
        : "An unknown error occurred while fetching age groups.",
    );
  }
};

/**
 * Intended Use Areas master
 * GET /masters/intended-use-areas
 */
export const getCosmeticIntendedUseAreas = async () => {
  try {
    const response = await api.get("masters/intended-use-areas");
    const rawData: any[] = response.data?.data ?? response.data ?? [];

    return rawData.map((item: any) => ({
      ...item,
      useAreaId:   item.useAreaId  ?? item.id,
      useAreaName: item.areaName   ?? item.useAreaName ?? item.name,
      id:          item.useAreaId  ?? item.id,
      name:        item.areaName   ?? item.useAreaName ?? item.name,
    }));
  } catch (error: unknown) {
    console.error("Error fetching intended use areas:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching intended use areas: ${error.message}`
        : "An unknown error occurred while fetching intended use areas.",
    );
  }
};

/**
 * Storage Conditions master
 * GET /masters/storagecondition
 */
export const getCosmeticStorageConditions = async () => {
  try {
    const response = await api.get("masters/storagecondition");
    const rawData: any[] = response.data?.data ?? response.data ?? [];

    return rawData.map((item: any) => ({
      ...item,
      storageConditionId: item.storageConditionId ?? item.id,
      conditionName:      item.conditionName      ?? item.name,
      id:                 item.storageConditionId  ?? item.id,
      name:               item.conditionName       ?? item.name,
    }));
  } catch (error: unknown) {
    console.error("Error fetching storage conditions:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching storage conditions: ${error.message}`
        : "An unknown error occurred while fetching storage conditions.",
    );
  }
};

/**
 * Countries master
 * GET /masters/countries
 */
export const getCosmeticCountries = async () => {
  try {
    const response = await api.get("masters/countries");
    const rawData: any[] = response.data?.data ?? response.data ?? [];

    return rawData.map((item: any) => ({
      ...item,
      countryId:   item.countryId   ?? item.id,
      countryName: item.countryName ?? item.name,
      id:          item.countryId   ?? item.id,
      name:        item.countryName ?? item.name,
    }));
  } catch (error: unknown) {
    console.error("Error fetching countries:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching countries: ${error.message}`
        : "An unknown error occurred while fetching countries.",
    );
  }
};

/**
 * Certifications master
 * GET /masters/certifications
 */
export const getCosmeticCertifications = async () => {
  try {
    const response = await api.get("masters/certifications");
    const rawData: any[] = response.data?.data ?? response.data ?? [];

    return rawData.map((item: any) => ({
      ...item,
      certificationId:   item.certificationId   ?? item.id,
      certificationName: item.certificationName ?? item.name,
      id:                item.certificationId   ?? item.id,
      name:              item.certificationName ?? item.name,
    }));
  } catch (error: unknown) {
    console.error("Error fetching certifications:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching certifications: ${error.message}`
        : "An unknown error occurred while fetching certifications.",
    );
  }
};

/**
 * Pack Types filtered by product category
 * GET /dosage/packType/category/:categoryId
 */
export const getCosmeticPackTypes = async (categoryId: number = 4) => {
  try {
    const response = await api.get(`dosage/packType/category/${categoryId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching pack types:", error);
    throw new Error(
      error instanceof Error
        ? `Error fetching pack types: ${error.message}`
        : "An unknown error occurred while fetching pack types.",
    );
  }
};

// ─── PRODUCT CRUD ─────────────────────────────────────────────────────────────

export const createCosmeticProduct = async (
  payload: Record<string, unknown>,
) => {
  try {
    const response = await api.post("products/create", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating cosmetic product", {
      message:  error.message,
      response: error.response?.data,
      status:   error.response?.status,
    });
    throw new Error(
      error.response?.data?.data?.message ??
        error.response?.data?.message ??
        error.message ??
        "Error creating cosmetic product",
    );
  }
};

// ─── DOCUMENT UPLOADS ─────────────────────────────────────────────────────────

/**
 * Upload certificate files for a cosmetic product attribute.
 *
 * The backend expects:
 *   POST /product-documents/cosmetic/:productAttributeId/certificates
 *   FormData: documentIds (one value per file), certificateFiles (one file per documentId)
 *
 * documentId here is the productCertificateDocumentId returned by the create
 * endpoint — NOT the master certificationId.
 */
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
      message:
        error.response?.data?.message ?? error.message ?? "Upload failed",
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
      message:
        error.response?.data?.message ?? error.message ?? "Upload failed",
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

export const getCosmeticCertificationsByCategoryId = async (categoryId: number) => {
  try {
    const response = await api.get(`/masters/certifications/categoryId/${categoryId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching certifications:", error);
    if (error instanceof Error) throw new Error(`Error fetching certifications: ${error.message}`);
    throw new Error("An unknown error occurred while fetching certifications.");
  }
};

/**
 * Net Quantity Units master
 * GET /net-quantity-units/:categoryId
 */
export const getCosmeticNetQuantityUnits = async (categoryId: number = 4) => {
  try {
    const response = await api.get(`net-quantity-units/${categoryId}`);
    const rawData: any[] = response.data?.data ?? response.data ?? [];
    return rawData.map((item: any) => ({
      ...item,
      netQuantityUnitId: item.netQuantityUnitId ?? item.unitId ?? item.id,
      unitName:          item.unitName ?? item.unit ?? item.name,
      id:                item.netQuantityUnitId ?? item.unitId ?? item.id,
      name:              item.unitName ?? item.unit ?? item.name,
    }));
  } catch (error: unknown) {
    console.error("Error fetching net quantity units:", error);
    if (error instanceof Error) throw new Error(`Error fetching net quantity units: ${error.message}`);
    throw new Error("An unknown error occurred while fetching net quantity units.");
  }
};

/**
 * Product Forms master
 * GET /net-quantity-units/productsform
 */
export const getCosmeticProductForms = async () => {
  try {
    const response = await api.get("net-quantity-units/productsform");
    const rawData: any[] = response.data?.data ?? response.data ?? [];
    return rawData.map((item: any) => ({
      ...item,
      productFormId:   item.productFormId ?? item.formId ?? item.id,
      productFormName: item.productFormName ?? item.formName ?? item.productForm ?? item.name,
      id:              item.productFormId ?? item.formId ?? item.id,
      name:            item.productFormName ?? item.formName ?? item.productForm ?? item.name,
    }));
  } catch (error: unknown) {
    console.error("Error fetching product forms:", error);
    if (error instanceof Error) throw new Error(`Error fetching product forms: ${error.message}`);
    throw new Error("An unknown error occurred while fetching product forms.");
  }
};