import { CreateDrugProductRequest } from "@/src/types/product/ProductData";
import { api } from "@/src/utils/api";
import { AxiosError } from "axios";

// ─── DRUG ────────────────────────────────────────────────────────────────────

export const getDrugCategory = async () => {
  try {
    const response = await api.get('drugCategory/getAll');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Drug Category:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Drug Category: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Drug Category.');
    }
  }
};

export const getTherapeuticSubcategory = async (therapeuticCategoryId: string) => {
  try {
    if (!therapeuticCategoryId) throw new Error("Category ID is required");
    const response = await api.get(`therapeutic/therapeuticSubcategories/${therapeuticCategoryId}`);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error('Error fetching Subcategory:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Subcategory: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Subcategory.');
    }
  }
};

export const getDosage = async () => {
  try {
    const response = await api.get('dosage/allDosage');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Dosage:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Dosage: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Dosage.');
    }
  }
};

export const getPackTypesByDosageId = async (dosageId: number) => {
  try {
    const response = await api.get(`dosage/packType/${dosageId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Pack Types:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Pack Types: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Pack Types.');
    }
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

export const getMoleculeStrengthByDosage = async (dosageId: number) => {
  try {
    const response = await api.get(`dosageMolecule/strengthFormat/${dosageId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Molecule Strength Format:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Molecule Strength Format: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Molecule Strength Format.');
    }
  }
};

// ─── DEVICE (CONSUMABLE & NON-CONSUMABLE) ────────────────────────────────────

export const getConsumableDeviceCategories = async () => {
  try {
    const response = await api.get("masters/device-categories/consumable");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching consumable device categories:", error);
    if (error instanceof Error) {
      throw new Error(`Error fetching consumable device categories: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while fetching consumable device categories.");
    }
  }
};

export const getNonConsumableDeviceCategories = async () => {
  try {
    const response = await api.get("masters/device-categories/non-consumable");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching non-consumable device categories:", error);
    if (error instanceof Error) {
      throw new Error(`Error fetching non-consumable device categories: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while fetching non-consumable device categories.");
    }
  }
};

export const getDeviceSubCategories = async (categoryId: number | string) => {
  try {
    const response = await api.get(`masters/device-sub-categories/${categoryId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching device subcategories:", error);
    if (error instanceof Error) {
      throw new Error(`Error fetching device subcategories: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while fetching device subcategories.");
    }
  }
};

export const getMaterialTypes = async () => {
  try {
    const response = await api.get("masters/consumable-material-types");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching material types:", error);
    if (error instanceof Error) {
      throw new Error(`Error fetching material types: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while fetching material types.");
    }
  }
};

export const getStorageConditions = async () => {
  try {
    const response = await api.get("masters/storagecondition");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching storage conditions:", error);
    if (error instanceof Error) {
      throw new Error(`Error fetching storage conditions: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while fetching storage conditions.");
    }
  }
};

export const getCountries = async () => {
  try {
    const response = await api.get("masters/countries");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching countries:", error);
    if (error instanceof Error) {
      throw new Error(`Error fetching countries: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while fetching countries.");
    }
  }
};

export const getPackTypes = async () => {
  try {
    const response = await api.get("masters/pack-types");
    return response.data?.data ?? response.data ?? [];
  } catch (error: unknown) {
    console.error("Error fetching pack types:", error);
    if (error instanceof Error) {
      throw new Error(`Error fetching pack types: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while fetching pack types.");
    }
  }
};

// ─── PRODUCT CRUD (old error style) ──────────────────────────────────────────

export const createDrugProduct = async (payload: CreateDrugProductRequest) => {
  try {
    const response = await api.post('/products/create', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating Product', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message || error.message || 'Error creating Product'
    );
  }
};

export const getProductList = async () => {
  try {
    const response = await api.get('/products/getAll');
    return (
      response.data?.data?.content ||
      response.data?.data ||
      response.data?.content ||
      response.data ||
      []
    );
  } catch (error: unknown) {
    console.error('Error fetching Drug Product List:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Drug Product List: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Drug Product List.');
    }
  }
};

export const getProductById = async (productId: string) => {
  try {
    const response = await api.get(`/products/getById/${productId}`);
    return response.data?.data || response.data;
  } catch (error: unknown) {
    console.error('Error fetching Product by ID:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Product: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Product.');
    }
  }
};

export const updateProduct = async (productId: string, payload: CreateDrugProductRequest) => {
  try {
    const response = await api.put(`/products/update/${productId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating Product', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message || error.message || 'Error updating Product'
    );
  }
};

export const deleteProduct = async (productId: string) => {
  try {
    const response = await api.delete(`/products/delete/${productId}`);
    return response.data?.data || response.data || null;
  } catch (error: unknown) {
    console.error('Error deleting Product:', error);
    if (error instanceof Error) {
      throw new Error(`Error deleting Product: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while deleting Product.');
    }
  }
};

export const uploadProductImages = async (productId: string, files: File[]) => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await api.post(`/product-images/${productId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error uploading images", error);
    throw new Error(
      error.response?.data?.message || error.message || "Error uploading images"
    );
  }
};

export const uploadProductUserManual = async (
  productAttributeId: string,
  file: File
) => {
  try {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(
      `/userManual/${productAttributeId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error uploading user manual", error);

    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Error uploading user manual"
    );
  }
};

// ─── LEGACY (kept exactly as old) ────────────────────────────────────────────

export const getDrugProductById = async (productId: string) => {
  try {
    if (!productId) throw new Error("Product ID is required");
    const response = await api.get(`products/getById/${productId}`);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error('Error fetching Product:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Product: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while Product.');
    }
  }
};

export const drugProductDelete = async (productId: string) => {
  try {
    if (!productId) throw new Error("Product ID is required");
    const response = await api.delete(`products/delete/${productId}`);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 403) {
        throw new Error("Access denied: You don't have permission");
      }
      throw new Error(error.response?.data?.message || "Failed");
    }
    throw new Error("Unknown error");
  }
};

export const editDrugProduct = async (productId: string, payload: CreateDrugProductRequest) => {
  const response = await api.put(`products/update/${productId}`, payload);
  return response.data;
};

export const getTherapeuticCategory = async () => {
  try {
    const response = await api.get('therapeutic/therapeuticCategories');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Drug Category:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Drug Category: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Drug Category.');
    }
  }
};