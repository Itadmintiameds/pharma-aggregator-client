import { api } from "@/src/utils/api";

export const getSupplementAgeGroups = async () => {
  try {
    const response = await api.get('ageGroup/getAll');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Supplement Age Groups:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Supplement Age Groups: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Supplement Age Groups.');
    }
  }
};

export const getSupplementDosageForms = async (categoryId: string | number) => {
  try {
    if (!categoryId) throw new Error("Category ID is required");
    const response = await api.get(`dosage/categoryId/${categoryId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Supplement Dosage Forms:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Supplement Dosage Forms: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Supplement Dosage Forms.');
    }
  }
};

export const getSupplementFlavours = async () => {
  try {
    const response = await api.get('flavours');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Supplement Flavours:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Supplement Flavours: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Supplement Flavours.');
    }
  }
};

export const getSupplementStorageConditions = async (categoryId: string | number) => {
  try {
    if (!categoryId) throw new Error("Category ID is required");
    const response = await api.get(`storageConditions/${categoryId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Supplement Storage Conditions:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Supplement Storage Conditions: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Supplement Storage Conditions.');
    }
  }
};

export const getSupplementCertifications = async (categoryId: string | number) => {
  try {
    if (!categoryId) throw new Error("Category ID is required");
    const response = await api.get(`masters/certifications/categoryId/${categoryId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Supplement Certifications:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Supplement Certifications: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Supplement Certifications.');
    }
  }
};

/*
export const getSupplementTherapeuticCategory = async (categoryId: string | number) => {
  try {
    if (!categoryId) throw new Error("Category ID is required");
    const response = await api.get(`therapeutic/therapeuticCategories/categoryId/${categoryId}`);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error('Error fetching Supplement Therapeutic Category:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Supplement Therapeutic Category: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Supplement Therapeutic Category.');
    }
  }
};

export const getSupplementTherapeuticSubcategory = async (categoryId: string | number) => {
  try {
    if (!categoryId) throw new Error("Category ID is required");
    const response = await api.get(`therapeutic/therapeuticSubcategories/${categoryId}`);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error('Error fetching Supplement Therapeutic Subcategory:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Supplement Therapeutic Subcategory: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Supplement Therapeutic Subcategory.');
    }
  }
};
*/
export const getCountries = async () => {
  try {
    const response = await api.get('masters/countries');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Countries:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Countries: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Countries.');
    }
  }
};

export const getSupplementPackTypes = async (dosageId: string | number) => {
  try {
    if (!dosageId) throw new Error("Dosage ID is required");
    const response = await api.get(`dosage/packType/${dosageId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Supplement Pack Types:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Supplement Pack Types: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Supplement Pack Types.');
    }
  }
};
