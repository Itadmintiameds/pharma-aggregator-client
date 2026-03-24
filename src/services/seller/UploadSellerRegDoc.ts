import api from "@/src/lib/api";
 
 
export interface LicenseFileItem {
  file: File;
  licenseName: string;
  documentId: number;
}
 
export interface DocumentUploadRequest {
  sellerImage?: File;
  gstFile?: File;
  bankFile?: File;
  licenses?: LicenseFileItem[];
}
 
export interface LicenseResult {
  documentFileUrl: string;
  documentId: number;
  licenseName: string;
}
 
export interface DocumentUploadResponse {
  status: string;
  message: string;
  count: null;
  data: {
    bankDocumentFileUrl?: string;
    gstFileUrl?: string;
    licenseResults: LicenseResult[];
    sellerImageUrl?: string;
    tempSellerId: number;
    tempSellerRequestId: string;
  };
}
 
 
class UploadSellerRegDocService {
 
  async uploadDocuments(
    tempSellerId: number,
    request: DocumentUploadRequest
  ): Promise<DocumentUploadResponse> {
    try {
      console.log("📡 Uploading documents for:", tempSellerId);
 
      const formData = new FormData();
 
      if (request.sellerImage) {
        formData.append("sellerImage", request.sellerImage);
      }
 
      if (request.gstFile) {
        formData.append("gstFile", request.gstFile);
      }
 
      if (request.bankFile) {
        formData.append("bankFile", request.bankFile);
      }
 
      if (request.licenses?.length) {
        request.licenses.forEach((license) => {
          if (!license.documentId) {
            throw new Error(` Missing documentId for ${license.licenseName}`);
          }
        });
 
        request.licenses.forEach((license) => {
          formData.append("licenseFiles", license.file);
        });
 
        formData.append(
          "licenseNames",
          request.licenses.map((l) => l.licenseName).join(", ")
        );
 
        formData.append(
          "documentIds",
          request.licenses.map((l) => String(l.documentId)).join(", ")
        );
      }
 
      console.log("📦 FormData:");
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
 
      const response = await api.post<DocumentUploadResponse>(
        `/temp-sellers/${tempSellerId}/documents/upload`,
        formData
      );
 
      console.log("✅ Upload success:", response.data);
 
      return response.data;
 
    } catch (error: any) {
      console.error(
        "❌ Upload failed:",
        error?.response?.data || error
      );
      throw error;
    }
  }
 
  prepareLicenseFiles(
    licenses: Record<string, any>,
    documents: any[]
  ): LicenseFileItem[] {
    const result: LicenseFileItem[] = [];
 
    console.log("📦 Backend documents:", documents);
 
    Object.entries(licenses).forEach(([productName, license]) => {
      if (license?.file) {
 
        const matchingDoc = documents.find(
          (doc) =>
            doc.productTypes?.productTypeName
              ?.trim()
              .toLowerCase() === productName.trim().toLowerCase()
        );
 
        console.log(`🔍 Matching ${productName}:`, matchingDoc);
 
        const documentId = matchingDoc?.DocumentsId;
 
        if (!documentId) {
          throw new Error(`❌ No documentId for ${productName}`);
        }
 
        result.push({
          file: license.file,
          licenseName: productName,
          documentId,
        });
      }
    });
 
    console.log("✅ Final license payload:", result);
 
    return result;
  }

   async deleteTempSeller(tempSellerId: number): Promise<void> {
    try {
      console.log(`📡 Deleting temp seller ${tempSellerId} due to upload failure...`);
      await api.delete(`/temp-sellers/${tempSellerId}`);
      console.log(`✅ Temp seller ${tempSellerId} deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete temp seller ${tempSellerId}:`, error);
    }
  }
}

 
export const uploadSellerRegDocService = new UploadSellerRegDocService();