import { api } from "@/src/utils/api";

export const getTherapeuticCategoryById = async (therapeuticCategoryId: string) => {
  try {
    if (!therapeuticCategoryId) {
      throw new Error("Therapeutic Category ID is required");
    }

    const response = await api.get(
      `therapeutic/therapeuticCategoriesById/${therapeuticCategoryId}`
    );

    return response.data?.data ?? response.data;

  } catch (error: unknown) {
    console.error("Error fetching Therapeutic Category:", error);

    if (error instanceof Error) {
      throw new Error(`Error fetching Therapeutic Category: ${error.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while fetching Therapeutic Category."
      );
    }
  }
};


export const getTherapeuticSubcategoryById = async (therapeuticSubcategoryId: string) => {
  try {
    if (!therapeuticSubcategoryId) {
      throw new Error("Therapeutic Subcategory ID is required");
    }

    const response = await api.get(
      `therapeutic/therapeuticSubcategoriesById/${therapeuticSubcategoryId}`
    );

    return response.data?.data ?? response.data;

  } catch (error: unknown) {
    console.error("Error fetching Therapeutic Subcategory:", error);

    if (error instanceof Error) {
      throw new Error(`Error fetching Therapeutic Subcategory: ${error.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while fetching Therapeutic Subcategory."
      );
    }
  }
};

export const getTherapeuticCategory = async (categoryId: string | number) => {
  try {
    if (!categoryId) throw new Error("Category ID is required");
    const response = await api.get(`therapeutic/therapeuticCategories/categoryId/${categoryId}`);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error('Error fetching Therapeutic Category:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Therapeutic Category: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Therapeutic Category.');
    }
  }
};

export const getTherapeuticSubcategory = async (categoryId: string | number) => {
  try {
    if (!categoryId) throw new Error("Category ID is required");
    const response = await api.get(`therapeutic/therapeuticSubcategories/${categoryId}`);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error('Error fetching Therapeutic Subcategory:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Therapeutic Subcategory: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Therapeutic Subcategory.');
    }
  }
};