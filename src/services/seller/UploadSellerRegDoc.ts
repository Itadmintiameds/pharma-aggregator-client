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
  // Real original filename for this license/agreement document, alongside
  // documentFileUrl. Optional so older backend responses that omit it don't
  // break typing.
  documentFileName?: string;
  documentId: number;
  licenseName: string;
}

export interface DocumentUploadResponse {
  status: string;
  message: string;
  count: null;
  data: {
    bankDocumentFileUrl?: string;
    bankDocumentFileName?: string;
    gstFileUrl?: string;
    gstFileName?: string;
    // Not confirmed present on every backend build yet — companyRegistrationCertificate
    // and authorizationLetter are uploaded through this same endpoint (see
    // request fields above), so the backend is expected to echo their URLs
    // back the same way it does for gstFileUrl/bankDocumentFileUrl. Optional
    // so older backend responses that omit them don't break typing.
    companyRegistrationCertificateUrl?: string;
    companyRegistrationCertificateFileName?: string;
    authorizationLetterUrl?: string;
    authorizationLetterFileName?: string;
    licenseResults: LicenseResult[];
    sellerImageUrl?: string;
    tempSellerId: number;
    tempSellerRequestId: string;
  };
}

interface SimpleApiResponse<T = null> {
  status: string;
  message: string;
  count: number | null;
  data: T;
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
      // DTO), so documentType comes back as a nested object — same as
      // doc.productTypes?.productTypeName above in prepareLicenseFiles.
      // documentType alone is the correct discriminator: agreement/compliance
      // rows point productTypes at a reserved placeholder (never null), so
      // that field can no longer be used to tell licences and agreements apart.
      const matchingDoc = documents.find(
        (doc) => doc.documentType?.documentTypeId === targetDocumentTypeId
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

  // ==================== DRAFT FILE DELETION ====================
  // Counterpart to uploadDocuments() for the "already uploaded — View /
  // Delete" branch: lets a seller remove a file they uploaded during an
  // earlier Save Draft so they can re-pick a different one. Unlike
  // deleteTempSeller (which nukes the whole row on a failed final submit),
  // these only clear a single file/document reference and re-throw on
  // failure so the caller can show an error toast without touching the rest
  // of the saved draft.

  async deleteDraftCompanyRegistrationCertificate(tempSellerId: number): Promise<void> {
    try {
      console.log(`📡 Deleting company registration certificate for temp seller ${tempSellerId}...`);
      await api.delete<SimpleApiResponse>(
        `/temp-sellers/${tempSellerId}/files/company-registration-certificate`
      );
      console.log(`✅ Company registration certificate deleted for temp seller ${tempSellerId}`);
    } catch (error) {
      console.error(`❌ Failed to delete company registration certificate for temp seller ${tempSellerId}:`, error);
      throw error;
    }
  }

  async deleteDraftGstFile(tempSellerId: number): Promise<void> {
    try {
      console.log(`📡 Deleting GST file for temp seller ${tempSellerId}...`);
      await api.delete<SimpleApiResponse>(`/temp-sellers/${tempSellerId}/files/gst`);
      console.log(`✅ GST file deleted for temp seller ${tempSellerId}`);
    } catch (error) {
      console.error(`❌ Failed to delete GST file for temp seller ${tempSellerId}:`, error);
      throw error;
    }
  }

  async deleteDraftAuthorizationLetter(tempSellerId: number): Promise<void> {
    try {
      console.log(`📡 Deleting authorization letter for temp seller ${tempSellerId}...`);
      await api.delete<SimpleApiResponse>(
        `/temp-sellers/${tempSellerId}/files/authorization-letter`
      );
      console.log(`✅ Authorization letter deleted for temp seller ${tempSellerId}`);
    } catch (error) {
      console.error(`❌ Failed to delete authorization letter for temp seller ${tempSellerId}:`, error);
      throw error;
    }
  }

  async deleteDraftBankDocument(tempSellerId: number): Promise<void> {
    try {
      console.log(`📡 Deleting bank document for temp seller ${tempSellerId}...`);
      await api.delete<SimpleApiResponse>(`/temp-sellers/${tempSellerId}/files/bank-document`);
      console.log(`✅ Bank document deleted for temp seller ${tempSellerId}`);
    } catch (error) {
      console.error(`❌ Failed to delete bank document for temp seller ${tempSellerId}:`, error);
      throw error;
    }
  }

  // Covers both per-product license files and seller-type agreement files —
  // same underlying TempSellerDocument row, only the documentId differs.
  async deleteDraftDocumentFile(tempSellerId: number, documentId: number): Promise<void> {
    try {
      console.log(`📡 Deleting document ${documentId} file for temp seller ${tempSellerId}...`);
      await api.delete<SimpleApiResponse>(
        `/temp-sellers/${tempSellerId}/documents/${documentId}/file`
      );
      console.log(`✅ Document ${documentId} file deleted for temp seller ${tempSellerId}`);
    } catch (error) {
      console.error(`❌ Failed to delete document ${documentId} file for temp seller ${tempSellerId}:`, error);
      throw error;
    }
  }
}

 
export const uploadSellerRegDocService = new UploadSellerRegDocService();