import { CreateDrugProductRequest } from "@/src/types/product/ProductData";
import { api } from "@/src/utils/api";
import { AxiosError } from "axios";

// ─── DRUG ────────────────────────────────────────────────────────────────────

export const getDrugCategory = async () => {
  try {
    const response = await api.get("drugCategory/getAll");
    return response.data.data;
  } catch (error: unknown) {
    console.error("Error fetching Drug Category:", error);
    throw new Error("An unknown error occurred while fetching Drug Category.");
  }
};

export const getTherapeuticSubcategory = async (
  therapeuticCategoryId: string
) => {
  try {
    if (!therapeuticCategoryId) throw new Error("Category ID is required");
    const response = await api.get(
      `therapeutic/therapeuticSubcategories/${therapeuticCategoryId}`
    );
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error("Error fetching Subcategory:", error);
    throw new Error("An unknown error occurred while fetching Subcategory.");
  }
};

export const getDosage = async () => {
  try {
    const response = await api.get("dosage/allDosage");
    return response.data.data;
  } catch (error: unknown) {
    console.error("Error fetching Dosage:", error);
    throw new Error("An unknown error occurred while fetching Dosage.");
  }
};

export const getPackTypesByDosageId = async (dosageId: number) => {
  try {
    const response = await api.get(`dosage/packType/${dosageId}`);
    return response.data.data;
  } catch (error: unknown) {
    throw new Error("An unknown error occurred while fetching Pack Types.");
  }
};

export const getMoleculeStrengthByDosage = async (dosageId: number) => {
  try {
    const response = await api.get(`dosageMolecule/strengthFormat/${dosageId}`);
    return response.data.data;
  } catch (error: unknown) {
    throw new Error(
      "An unknown error occurred while fetching Molecule Strength."
    );
  }
};

// ─── DEVICE (CONSUMABLE & NON-CONSUMABLE) ────────────────────────────────────

export const getConsumableDeviceCategories = async () => {
  try {
    const response = await api.get("masters/device-categories/consumable");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching consumable device categories:", error);
    throw new Error("Failed to fetch consumable device categories.");
  }
};

export const getNonConsumableDeviceCategories = async () => {
  try {
    const response = await api.get("masters/device-categories/non-consumable");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching non-consumable device categories:", error);
    throw new Error("Failed to fetch non-consumable device categories.");
  }
};

export const getDeviceSubCategories = async (
  categoryId: number | string
) => {
  try {
    const response = await api.get(
      `masters/device-sub-categories/${categoryId}`
    );
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching device subcategories:", error);
    throw new Error("Failed to fetch device subcategories.");
  }
};

export const getMaterialTypes = async () => {
  try {
    const response = await api.get("masters/consumable-material-types");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching material types:", error);
    throw new Error("Failed to fetch material types.");
  }
};

export const getStorageConditions = async () => {
  try {
    const response = await api.get("masters/storagecondition");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching storage conditions:", error);
    throw new Error("Failed to fetch storage conditions.");
  }
};

export const getCountries = async () => {
  try {
    const response = await api.get("masters/countries");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching countries:", error);
    throw new Error("Failed to fetch countries.");
  }
};

export const getPackTypes = async () => {
  try {
    const response = await api.get("masters/pack-types");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching pack types:", error);
    throw new Error("Failed to fetch pack types.");
  }
};

// ─── PRODUCT CRUD ─────────────────────────────────────────────────────────────

export const createDrugProduct = async (
  payload: CreateDrugProductRequest
) => {
  try {
    const response = await api.post("/products/create", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating Product", error);
    throw new Error(
      error.response?.data?.message || error.message || "Error creating Product"
    );
  }
};

export const getProductList = async () => {
  try {
    const response = await api.get("/products/getAll");
    return (
      response.data?.data?.content ||
      response.data?.data ||
      response.data?.content ||
      response.data ||
      []
    );
  } catch (error: unknown) {
    throw new Error("An unknown error occurred while fetching Product List.");
  }
};

export const getProductById = async (productId: string) => {
  try {
    const response = await api.get(`/products/getById/${productId}`);
    return response.data?.data || response.data;
  } catch (error: unknown) {
    throw new Error("An unknown error occurred while fetching Product.");
  }
};

export const updateProduct = async (
  productId: string,
  payload: CreateDrugProductRequest
) => {
  try {
    const response = await api.put(`/products/update/${productId}`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating Product", error);
    throw new Error(
      error.response?.data?.message || error.message || "Error updating Product"
    );
  }
};

export const deleteProduct = async (productId: string) => {
  try {
    const response = await api.delete(`/products/delete/${productId}`);
    return response.data?.data || response.data || null;
  } catch (error: unknown) {
    throw new Error("An unknown error occurred while deleting Product.");
  }
};

export const uploadProductImages = async (
  productId: string,
  files: File[]
) => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await api.post(`/product-images/${productId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Error uploading images"
    );
  }
};

// ─── LEGACY (kept for backward compat) ───────────────────────────────────────

export const getDrugProductById = async (productId: string) => {
  try {
    if (!productId) throw new Error("Product ID is required");
    const response = await api.get(`products/getById/${productId}`);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    throw new Error("An unknown error occurred while fetching Product.");
  }
};

export const drugProductDelete = async (productId: string) => {
  try {
    if (!productId) throw new Error("Product ID is required");
    const response = await api.delete(`products/delete/${productId}`);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 403)
        throw new Error("Access denied: You don't have permission");
      throw new Error(error.response?.data?.message || "Failed");
    }
    throw new Error("Unknown error");
  }
};

export const editDrugProduct = async (
  productId: string,
  payload: CreateDrugProductRequest
) => {
  const response = await api.put(`products/update/${productId}`, payload);
  return response.data;
};

export const getTherapeuticCategory = async () => {
  try {
    const response = await api.get("therapeutic/therapeuticCategories");
    return response.data.data;
  } catch (error: unknown) {
    throw new Error("An unknown error occurred while fetching Therapeutic Category.");
  }
};