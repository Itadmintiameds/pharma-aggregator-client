import { api } from "@/src/utils/api";
import { getCurrentSellerId } from "@/src/services/product/sellerContext";


/**
 * product-service GET /pricing/validateBatchNumber?batchNumber&sellerId&categoryId
 * answers `true` when the batch number is still FREE for this seller + category.
 * Callers expect `{ exists: boolean }`, so invert it here.
 */
export const validateBatchNumber = async (
  batchLotNumber: string,
  categoryId: number,
): Promise<{ exists: boolean }> => {
  try {
    const sellerId = await getCurrentSellerId();
    const response = await api.get(`/pricing/validateBatchNumber`, {
      params: {
        batchNumber: batchLotNumber,
        sellerId,
        categoryId,
      },
    });

    const available = response.data?.data ?? response.data;
    return { exists: available === false };
  } catch (error: unknown) {
    console.error("Error validating batch number:", error);

    if (error instanceof Error) {
      throw new Error(`Error validating batch number: ${error.message}`);
    }

    throw new Error(
      "An unknown error occurred while validating batch number.",
    );
  }
};

// export const validateBatchNumber = async (batchLotNumber: string) => {
//   try {
//     const response = await api.get(`/pricing/validateBatchNumber`, {
//       params: {
//         batchLotNumber,
//       },
//     });

//     return response.data?.data || response.data || {};
//   } catch (error: unknown) {
//     console.error("Error validating batch number:", error);

//     if (error instanceof Error) {
//       throw new Error(`Error validating batch number: ${error.message}`);
//     } else {
//       throw new Error(
//         "An unknown error occurred while validating batch number.",
//       );
//     }
//   }
// };
