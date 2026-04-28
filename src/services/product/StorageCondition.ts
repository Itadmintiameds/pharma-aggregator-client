import { api } from "@/src/utils/api";

export const getStorageConditionById = async (storageConditionId: number) => {
  try {
    if (!storageConditionId) {
      throw new Error("Storage Condition ID is required");
    }

    const response = await api.get(
      `storageConditionsById/${storageConditionId}`
    );

    return response.data?.data ?? response.data;

  } catch (error: unknown) {
    console.error("Error fetching Storage Condition:", error);

    if (error instanceof Error) {
      throw new Error(`Error fetching Storage Condition: ${error.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while fetching Storage Condition."
      );
    }
  }
};