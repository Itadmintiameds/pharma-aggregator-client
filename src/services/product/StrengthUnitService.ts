import { api } from "@/src/utils/api";

export const getStrengthUnitsByCategory = async (categoryId: number) => {
  try {
    const response = await api.get(`/strengthUnit/category/${categoryId}`);
    const array = response.data?.data ?? response.data;
    return Array.isArray(array) ? array : [];
  } catch (error) {
    console.error("getStrengthUnitsByCategory error", error);
    return [];
  }
};

export const getStrengthUnitById = async (strengthUnitId: number) => {
  try {
    if (!strengthUnitId) {
      throw new Error("Strength Unit ID is required");
    }

    const response = await api.get(`/strengthUnit/${strengthUnitId}`);

    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error("Error fetching Strength Unit:", error);

    if (error instanceof Error) {
      throw new Error(`Error fetching Strength Unit: ${error.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while fetching Strength Unit."
      );
    }
  }
};
