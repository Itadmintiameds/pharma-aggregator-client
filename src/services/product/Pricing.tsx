import { api } from "@/src/utils/api";

export const validateBatchNumber = async (batchLotNumber: string) => {
  try {
    const response = await api.get(`/pricing/validateBatchNumber`, {
      params: {
        batchLotNumber,
      },
    });

    return response.data?.data || response.data || {};
  } catch (error: unknown) {
    console.error("Error validating batch number:", error);

    if (error instanceof Error) {
      throw new Error(`Error validating batch number: ${error.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while validating batch number.",
      );
    }
  }
};
