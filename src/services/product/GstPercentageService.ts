import { api } from "@/src/utils/api";

export const getGstPercentages = async () => {
  try {
    const response = await api.get('/gst-percentages');

    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching GST Percentages:', error);

    if (error instanceof Error) {
      throw new Error(
        `Error fetching GST Percentages: ${error.message}`
      );
    } else {
      throw new Error(
        'An unknown error occurred while fetching GST Percentages.'
      );
    }
  }
};
