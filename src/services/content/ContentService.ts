import { api } from "@/src/utils/api";

export interface LegalContent {
  contentKey: string;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
}

export const getLegalContent = async (contentKey: string): Promise<LegalContent> => {
  try {
    const response = await api.get(`/content/${contentKey}`);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    console.error(`Error fetching legal content "${contentKey}":`, error);
    if (error instanceof Error) throw new Error(`Error fetching legal content: ${error.message}`);
    throw new Error("An unknown error occurred while fetching legal content.");
  }
};
