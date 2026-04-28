import { api } from "@/src/utils/api";


export const getPackTypeById = async (packTypeId: number) => {
  try {
    if (!packTypeId) {
      throw new Error("Pack Type ID is required");
    }

    const response = await api.get(
      `packTypeById/${packTypeId}`
    );

    return response.data?.data ?? response.data;

  } catch (error: unknown) {
    console.error("Error fetching Pack Type:", error);

    if (error instanceof Error) {
      throw new Error(`Error fetching Pack Type: ${error.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while fetching Pack Type."
      );
    }
  }
};