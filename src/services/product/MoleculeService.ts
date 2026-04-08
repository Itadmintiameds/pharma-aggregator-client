import { api } from "@/src/utils/api";

export const getAllMolecules = async () => {
  try {
    const response = await api.get('molecules/getAllMolecules');
     return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching Molecules:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Molecules: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Molecules.');
    }
  }
};

export const getMoleculeByName = async (name: string) => {
  try {
    const response = await api.get('molecules/byName', {
      params: { name },
    });
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching Molecule by name:', error);
    if (error instanceof Error) {
      throw new Error(`Error fetching Molecule: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while fetching Molecule.');
    }
  }
};