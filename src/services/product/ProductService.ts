import { CreateDrugProductRequest } from "@/src/types/product/ProductData";
import { api } from "@/src/utils/api";
import { AxiosError } from "axios";

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

export const getDrugProductList= async () => {
    try {
        
        const response = await api.get('v1/products/getAll');
        // return response.data;
         return (
    response.data?.data?.content || // paginated
    response.data?.data ||           // wrapped
    response.data ||                 // raw array
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


export const getDrugProductById = async (productId: string) => {
    try {
        if (!productId) throw new Error("Product ID is required");
        const response = await api.get(`v1/products/getById/${productId}`);
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
        
        const response = await api.delete(`v1/products/delete/${productId}`);
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

}


// export const editDrugProduct = async (productId: string) => {
//     try {
//         if (!productId) throw new Error("Product ID is required");
//         const response = await api.put(`v1/products/update/${productId}`);
//         return response.data;
//     } catch (error: unknown) {
//         if (error instanceof AxiosError) {
//       if (error.response?.status === 403) {
//         throw new Error("Access denied: You don't have permission");
//       }
//       throw new Error(error.response?.data?.message || "Failed");
//     }
//     throw new Error("Unknown error");
//   }
// };

export const editDrugProduct = async (
  productId: string,
  payload: CreateDrugProductRequest
) => {
  const response = await api.put(
    `v1/products/update/${productId}`,
    payload
  );
  return response.data;
};