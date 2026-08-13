import buyerApi from "@/src/lib/buyerApi";
import { RawTempBuyerDocument } from "@/src/services/buyer/buyerRegistrationService";

export interface LicenseFileItem {
  file: File;
  licenseName: string;
  documentId: number;
}

export interface DocumentUploadRequest {
  orgLogo?: File;
  gstFile?: File;
  panFile?: File;
  licenseFiles?: File[];
  licenseNames?: string[];
  documentIds?: number[];
}

export interface LicenseUploadResult {
  documentId: number;
  documentFileUrl: string;
  documentFileName?: string;
}

export interface DocumentUploadResponseData {
  tempBuyerId: number;
  tempBuyerRequestId: string;
  orgLogoUrl?: string;
  orgLogoFileName?: string;
  gstFileUrl?: string;
  gstFileName?: string;
  panFileUrl?: string;
  panFileName?: string;
  licenseResults?: LicenseUploadResult[];
}

interface SimpleApiResponse<T = null> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

class UploadBuyerRegDocService {
  async uploadDocuments(
    tempBuyerId: number,
    request: {
      orgLogo?: File;
      gstFile?: File;
      panFile?: File;
      licenses?: LicenseFileItem[];
    }
  ): Promise<DocumentUploadResponseData> {
    const formData = new FormData();

    if (request.orgLogo) formData.append("orgLogo", request.orgLogo);
    if (request.gstFile) formData.append("gstFile", request.gstFile);
    if (request.panFile) formData.append("panFile", request.panFile);

    if (request.licenses?.length) {
      request.licenses.forEach((license) => {
        if (!license.documentId) {
          throw new Error(`Missing documentId for ${license.licenseName}`);
        }
      });
      request.licenses.forEach((license) => formData.append("licenseFiles", license.file));
      request.licenses.forEach((license) => formData.append("licenseNames", license.licenseName));
      request.licenses.forEach((license) => formData.append("documentIds", String(license.documentId)));
    }

    const response = await buyerApi.post<SimpleApiResponse<DocumentUploadResponseData>>(
      `/temp-buyers/${tempBuyerId}/documents/upload`,
      formData
    );

    return response.data.data;
  }

  // Buyer has just ONE mandatory license document (unlike seller's
  // per-product-type/per-agreement-code lists), so matching only needs a
  // single documentTypeId lookup — no productTypeName/documentTypeCode
  // disambiguation like uploadSellerRegDocService.prepareLicenseFiles/
  // prepareAgreementFiles needs.
  prepareLicenseFile(
    file: File | null | undefined,
    licenseName: string,
    documentTypeId: number | undefined,
    draftDocuments: RawTempBuyerDocument[]
  ): LicenseFileItem | null {
    if (!file || !documentTypeId) return null;

    const matchingDoc = draftDocuments.find((doc) => doc.documentType?.documentTypeId === documentTypeId);
    const documentId = matchingDoc?.tempBuyerDocumentId ?? matchingDoc?.DocumentsId ?? matchingDoc?.documentId;

    if (!documentId) {
      throw new Error(`No documentId found for document type ${documentTypeId}`);
    }

    return { file, licenseName, documentId };
  }

  async deleteDraftGstFile(tempBuyerId: number): Promise<void> {
    await buyerApi.delete<SimpleApiResponse>(`/temp-buyers/${tempBuyerId}/files/gst`);
  }

  async deleteDraftPanFile(tempBuyerId: number): Promise<void> {
    await buyerApi.delete<SimpleApiResponse>(`/temp-buyers/${tempBuyerId}/files/pan`);
  }

  async deleteDraftOrgLogo(tempBuyerId: number): Promise<void> {
    await buyerApi.delete<SimpleApiResponse>(`/temp-buyers/${tempBuyerId}/files/org-logo`);
  }

  async deleteDraftDocumentFile(tempBuyerId: number, documentId: number): Promise<void> {
    await buyerApi.delete<SimpleApiResponse>(`/temp-buyers/${tempBuyerId}/documents/${documentId}/file`);
  }

  async deleteTempBuyer(tempBuyerId: number): Promise<void> {
    try {
      await buyerApi.delete(`/temp-buyers/${tempBuyerId}`);
    } catch (error) {
      console.error(`Failed to delete temp buyer ${tempBuyerId}:`, error);
    }
  }
}

export const uploadBuyerRegDocService = new UploadBuyerRegDocService();
