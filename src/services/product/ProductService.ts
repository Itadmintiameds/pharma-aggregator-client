import { CreateDrugProductRequest } from "@/src/types/product/ProductData";
import { api } from "@/src/utils/api";

export const getDrugCategory = async () => {
    try {
        
        const response = await api.get('v1/drugCategory/getAll');
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


export const createDrugProduct = async (
  payload: CreateDrugProductRequest
) => {
  try {
    const response = await api.post(
      "v1/products/create",
      payload
    );
    return response.data.data;
  } catch (error: unknown) {
    console.error("Error creating Product", error);
    if (error instanceof Error) {
      throw new Error(`Error creating Product: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while creating Product.");
    }
  }
};
