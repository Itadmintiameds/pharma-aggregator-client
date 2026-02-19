import { api } from "@/src/utils/api";

export const getMoleculeDesc = async (moleculeName: string) => {
    try {
        
        const response = await api.get('v1/molecules/by-name', {
            params: { name: moleculeName },
        });
        return response.data.data;
    } catch (error: unknown) {
        console.error('Error fetching Molecule Desc:', error);
        if (error instanceof Error) {
            throw new Error(`Error fetching Molecule Desc: ${error.message}`);
        } else {
            throw new Error('An unknown error occurred while fetching Molecule Desc.');
        }
    }
};