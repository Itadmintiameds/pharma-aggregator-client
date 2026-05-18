import { api } from "@/src/utils/api";
import { CreateProductRequest } from "@/src/types/product/ProductData";
import { AxiosError } from "axios";

export const getProductCategories = async (categoryId: number) => {
  try {
    const response = await api.get(`/productCategory/getProductCategory/${categoryId}`);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("getProductCategories error", error);
    return [];
  }
};

export const getProductSubcategories = async (productCategoryId: number) => {
  try {
    const response = await api.get(`/productCategory/getProductSubcategory/${productCategoryId}`);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("getProductSubcategories error", error);
    return [];
  }
};

export const getAgeGroups = async () => {
  try {
    const response = await api.get("/ageGroup/getAll");
    return response.data?.data ?? [];
  } catch (error) {
    console.error("getAgeGroups error", error);
    return [];
  }
};

export const getProductForms = async () => {
  try {
    const response = await api.get("/productForm/getAll");
    return response.data?.data ?? [];
  } catch (error) {
    console.error("getProductForms error", error);
    return [];
  }
};

export const getCountries = async () => {
  try {
    const response = await api.get("/masters/countries");
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("getCountries error", error);
    return [];
  }
};

export const getStorageConditions = async () => {
  try {
    const response = await api.get("/masters/storagecondition");
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("getStorageConditions error", error);
    return [];
  }
};

export const getPackTypesByCategory = async (categoryId: number) => {
  try {
    const response = await api.get(`/dosage/packType/category/${categoryId}`);
    const array = response.data?.data ?? response.data;
    return Array.isArray(array) ? array : [];
  } catch (error) {
    console.error("getPackTypesByCategory error", error);
    return [];
  }
};

export const getCertificationsByCategoryId = async (categoryId: number) => {
  try {
    const response = await api.get(`/masters/certifications/categoryId/${categoryId}`);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("getCertificationsByCategoryId error", error);
    return [];
  }
};

export const uploadFoodInfantUserManual = async (productAttributeId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/userManual/new/${productAttributeId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error uploading Food/Infant user manual", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message || error.message || "Error uploading user manual"
    );
  }
};

export const createFoodInfantProduct = async (payload: CreateProductRequest) => {
  try {
    const response = await api.post('/products/create', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log("✅ Food/Infant product created successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creating Food/Infant Product');
    console.error('Error message:', error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Response headers:', error.response?.headers);
    
    let errorMessage = 'Error creating Food/Infant product';
    
    if (error.response?.data) {
      const responseData = error.response.data;
      
      if (responseData.message) {
        errorMessage = responseData.message;
      }
      if (responseData.data?.message) {
        errorMessage = responseData.data?.message;
      }
      if (responseData.error) {
        errorMessage = responseData.error;
      }
      
      console.error('Full error response:', JSON.stringify(responseData, null, 2));
    }
    
    throw new Error(errorMessage);
  }
};

export const getFoodInfantAttributes = async (productId: string) => {
  try {
    const response = await api.get(`/products/getById/${productId}`);
    const data = response.data?.data || response.data;
    
    if (data.productAttributeFoodInfants && Array.isArray(data.productAttributeFoodInfants) && data.productAttributeFoodInfants.length > 0) {
      return data.productAttributeFoodInfants[0];
    }
    if (data.productAttributeFoodInfant) {
      return data.productAttributeFoodInfant;
    }
    
    return null;
  } catch (error: any) {
    console.error("Error fetching Food & Infant attributes:", error);
    return null;
  }
};

export const uploadFoodInfantBrochure = async (productAttributeId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("brochureFile", file);
    const response = await api.post(
      `/product-documents/food-infant/${productAttributeId}/brochure`,
      formData
    );
    return response.data;
  } catch (error: any) {
    console.error('Error uploading Food/Infant Brochure', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Error uploading brochure'
    );
  }
};

export const updateFoodInfantBrochureUrl = async (productAttributeId: string, brochureUrl: string) => {
  try {
    const response = await api.patch(`/product-attributes/food-infant/${productAttributeId}/brochure`, {
      productUserManual: brochureUrl
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating brochure URL', error);
    throw new Error(error.response?.data?.message || error.message || 'Error updating brochure URL');
  }
};

// NEW: Upload nutritional information image for Food/Infant products
export const uploadNutritionalInformationImage = async (
  productAttributeId: string,
  categoryId: string | number,
  file: File
) => {
  try {
    const formData = new FormData();
    formData.append('categoryId', String(categoryId));
    formData.append('images', file);
    const response = await api.post(
      `/nutritionalInformationImage/${productAttributeId}`,
      formData
    );
    return response.data;
  } catch (error: any) {
    console.error('Error uploading Nutritional Information Image', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Error uploading Nutritional Information Image'
    );
  }
};








// code dated 15.05.2026 and working code...........

// import { api } from "@/src/utils/api";
// import {  CreateProductRequest } from "@/src/types/product/ProductData";
// import { AxiosError } from "axios";


// export const getProductCategories = async (categoryId: number) => {
//   try {
//     const response = await api.get(`/productCategory/getProductCategory/${categoryId}`);
//     return response.data?.data ?? [];
//   } catch (error) {
//     console.error("getProductCategories error", error);
//     return [];
//   }
// };

// export const getProductSubcategories = async (productCategoryId: number) => {
//   try {
//     const response = await api.get(`/productCategory/getProductSubcategory/${productCategoryId}`);
//     return response.data?.data ?? [];
//   } catch (error) {
//     console.error("getProductSubcategories error", error);
//     return [];
//   }
// };

// export const getAgeGroups = async () => {
//   try {
//     const response = await api.get("/ageGroup/getAll");
//     return response.data?.data ?? [];
//   } catch (error) {
//     console.error("getAgeGroups error", error);
//     return [];
//   }
// };

// export const getProductForms = async () => {
//   try {
//     const response = await api.get("/productForm/getAll");
//     return response.data?.data ?? [];
//   } catch (error) {
//     console.error("getProductForms error", error);
//     return [];
//   }
// };

// export const getCountries = async () => {
//   try {
//     const response = await api.get("/masters/countries");
//     return response.data?.data ?? response.data ?? [];
//   } catch (error) {
//     console.error("getCountries error", error);
//     return [];
//   }
// };

// export const getStorageConditions = async () => {
//   try {
//     const response = await api.get("/masters/storagecondition");
//     return response.data?.data ?? response.data ?? [];
//   } catch (error) {
//     console.error("getStorageConditions error", error);
//     return [];
//   }
// };

// export const getPackTypesByCategory = async (categoryId: number) => {
//   try {
//     const response = await api.get(`/dosage/packType/category/${categoryId}`);
//     const array = response.data?.data ?? response.data;
//     return Array.isArray(array) ? array : [];
//   } catch (error) {
//     console.error("getPackTypesByCategory error", error);
//     return [];
//   }
// };

// export const getCertificationsByCategoryId = async (categoryId: number) => {
//   try {
//     const response = await api.get(`/masters/certifications/categoryId/${categoryId}`);
//     return response.data?.data ?? [];
//   } catch (error) {
//     console.error("getCertificationsByCategoryId error", error);
//     return [];
//   }
// };


// export const uploadFoodInfantUserManual = async (productAttributeId: string, file: File) => {
//   try {
//     const formData = new FormData();
//     formData.append("file", file);

//     const response = await api.post(`/userManual/new/${productAttributeId}`, formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });

//     return response.data;
//   } catch (error: any) {
//     console.error("Error uploading Food/Infant user manual", {
//       message: error.message,
//       response: error.response?.data,
//       status: error.response?.status,
//     });
//     throw new Error(
//       error.response?.data?.message || error.message || "Error uploading user manual"
//     );
//   }
// };


// export const createFoodInfantProduct = async (payload: CreateProductRequest) => {
//   try {
//     const response = await api.post('/products/create', payload, {
//       headers: { 'Content-Type': 'application/json' },
//     });
    
//     console.log("✅ Food/Infant product created successfully:", response.data);
//     return response.data;
//   } catch (error: any) {
//     // Log the full error object
//     console.error('❌ Error creating Food/Infant Product');
//     console.error('Error message:', error.message);
//     console.error('Response status:', error.response?.status);
//     console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
//     console.error('Response headers:', error.response?.headers);
    
//     let errorMessage = 'Error creating Food/Infant product';
    
//     if (error.response?.data) {
//       const responseData = error.response.data;
      
//       if (responseData.message) {
//         errorMessage = responseData.message;
//       }
//       if (responseData.data?.message) {
//         errorMessage = responseData.data?.message;
//       }
//       if (responseData.error) {
//         errorMessage = responseData.error;
//       }
      
//       console.error('Full error response:', JSON.stringify(responseData, null, 2));
//     }
    
//     throw new Error(errorMessage);
//   }
// };


// export const getFoodInfantAttributes = async (productId: string) => {
//   try {
//     const response = await api.get(`/products/getById/${productId}`);
//     const data = response.data?.data || response.data;
    
//     if (data.productAttributeFoodInfants && Array.isArray(data.productAttributeFoodInfants) && data.productAttributeFoodInfants.length > 0) {
//       return data.productAttributeFoodInfants[0];
//     }
//     if (data.productAttributeFoodInfant) {
//       return data.productAttributeFoodInfant;
//     }
    
//     return null;
//   } catch (error: any) {
//     console.error("Error fetching Food & Infant attributes:", error);
//     return null;
//   }
// };


// export const uploadFoodInfantBrochure = async (productAttributeId: string, file: File) => {
//   try {
//     const formData = new FormData();
//     formData.append("brochureFile", file);
//     const response = await api.post(
//       `/product-documents/food-infant/${productAttributeId}/brochure`,
//       formData
//     );
//     return response.data;
//   } catch (error: any) {
//     console.error('Error uploading Food/Infant Brochure', error);
//     throw new Error(
//       error.response?.data?.message || error.message || 'Error uploading brochure'
//     );
//   }
// };

// export const updateFoodInfantBrochureUrl = async (productAttributeId: string, brochureUrl: string) => {
//   try {
//     const response = await api.patch(`/product-attributes/food-infant/${productAttributeId}/brochure`, {
//       productUserManual: brochureUrl
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error('Error updating brochure URL', error);
//     throw new Error(error.response?.data?.message || error.message || 'Error updating brochure URL');
//   }
// };