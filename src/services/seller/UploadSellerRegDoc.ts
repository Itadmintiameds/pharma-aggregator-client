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
  companyRegistrationCertificate?: File;
  // Authorization letter (Coordinator step) - same singular-file pattern as
  // companyRegistrationCertificate.
  authorizationLetter?: File;
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
      if (request.companyRegistrationCertificate) {
  formData.append("companyRegistrationCertificate", request.companyRegistrationCertificate);
}

      if (request.authorizationLetter) {
        formData.append("authorizationLetter", request.authorizationLetter);
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

  // Builds LicenseFileItem[] for seller-level agreement documents (Brand Owner
  // Agreement, White Labeling Agreement, Distribution Agreement, PCD Agreement).
  // These are uploaded through the SAME licenseFiles/licenseNames/documentIds
  // convention as per-product licenses - the backend attaches by documentId
  // regardless of whether the row is a licence or an agreement. Matching is
  // done by documentTypeId (agreement rows have no productTypeId), unlike
  // per-product licenses which are matched by productTypeName above.
  prepareAgreementFiles(
    agreements: Record<string, { number: string; file: File | null; issueDate: Date | null; expiryDate: Date | null }>,
    documents: Array<{ productTypes?: unknown; documentType?: { documentTypeId?: number }; DocumentsId?: number; documentId?: number }>,
    documentTypeIdByCode: Record<string, number>
  ): LicenseFileItem[] {
    const result: LicenseFileItem[] = [];

    console.log("📦 Backend documents (for agreement matching):", documents);

    Object.entries(agreements).forEach(([code, agreement]) => {
      if (!agreement?.file) return;

      const targetDocumentTypeId = documentTypeIdByCode[code];

      // The backend serializes the raw TempSeller entity here (not a flat
      // DTO), so productType/documentType come back as nested objects — same
      // as doc.productTypes?.productTypeName above in prepareLicenseFiles.
      const matchingDoc = documents.find(
        (doc) =>
          !doc.productTypes &&
          doc.documentType?.documentTypeId === targetDocumentTypeId
      );

      console.log(`🔍 Matching agreement ${code}:`, matchingDoc);

      const documentId = matchingDoc?.DocumentsId ?? matchingDoc?.documentId;

      if (!documentId) {
        throw new Error(`❌ No documentId for agreement ${code}`);
      }

      result.push({
        file: agreement.file,
        licenseName: code,
        documentId,
      });
    });

    console.log("✅ Final agreement payload:", result);

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