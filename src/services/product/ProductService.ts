import { CreateDrugProductRequest } from "@/src/types/product/ProductData";
import { api } from "@/src/utils/api";
import { AxiosError } from "axios";

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


export const createDrugProduct = async (
  payload: CreateDrugProductRequest
) => {
  try {
    const response = await api.post(
      '/products/create',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;

  } catch (error: any) {
    console.error('Error creating Product', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Error creating Product'
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

    return (
      response.data?.data ||  
      response.data            
    );

  } catch (error: unknown) {
    console.error('Error fetching Product by ID:', error);

    if (error instanceof Error) {
      throw new Error(`Error fetching Product: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Product.');
    }
  }
};


export const deleteProduct = async (productId: string) => {
  try {
    const response = await api.delete(`/products/delete/${productId}`);

    return (
      response.data?.data ||   
      response.data ||         
      null
    );

  } catch (error: unknown) {
    console.error('Error deleting Product:', error);

    if (error instanceof Error) {
      throw new Error(`Error deleting Product: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while deleting Product.');
    }
  }
};


export const uploadProductImages = async (
  productId: string,
  files: File[]
) => {
  try {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file); // 🔥 must match backend
    });

    const response = await api.post(
      `/product-images/${productId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data; // returns array of URLs
  } catch (error: any) {
    console.error("Error uploading images", error);

    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "Error uploading images"
    );
  }
};

//Old 
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

//Old
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

}

//Old
export const editDrugProduct = async (
  productId: string,
  payload: CreateDrugProductRequest
) => {
  const response = await api.put(
    `products/update/${productId}`,
    payload
  );
  return response.data;
};


export const getTherapeuticSubcategory = async (categoryId: string) => {
  try {
    if (!categoryId) throw new Error("Category ID is required");
    const response = await api.get(`products/subcategories/${categoryId}`);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error('Error fetching Category:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Category: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while Category.');
    }
  }
};


export const getDosage = async () => {
  const response = await api.get("/products/dosage");
  return response.data.data; 
};

