import api from "@/src/lib/api";

/* ================= TYPES ================= */

export interface LicenseFileItem {
  file: File;
  licenseName: string;
  documentId?: number; // only for EXISTING documents
}

export interface UploadDocPayload {
  gstFile?: File;
  bankFile?: File;
  licenses?: LicenseFileItem[];
}

/* ================= UPLOAD SERVICE ================= */

export const uploadSellerDocuments = async (
  requestId: number,
  payload: UploadDocPayload
) => {
  try {
    console.log("📡 Uploading documents for request:", requestId);

    const formData = new FormData();
    let hasFile = false;

    /* ================= GST ================= */
    if (payload.gstFile) {
      formData.append("gstFile", payload.gstFile);
      hasFile = true;
    }

    /* ================= BANK ================= */
    if (payload.bankFile) {
      formData.append("bankFile", payload.bankFile);
      hasFile = true;
    }

    /* ================= LICENSES ================= */
    if (payload.licenses && payload.licenses.length > 0) {
      payload.licenses.forEach((license) => {
        // only process if file exists
        if (license.file) {
          // file
          formData.append("licenseFiles", license.file);

          // license name 
          formData.append("licenseNames", license.licenseName);

          // documentId ONLY for existing docs (replacement case)
          if (license.documentId) {
            formData.append("documentIds", String(license.documentId));
          }

          hasFile = true;
        }
      });
    }

    /* ================= SKIP IF NO FILE ================= */
    if (!hasFile) {
      console.log("⚠️ No files to upload. Skipping upload API.");
      return null;
    }

    /* ================= API CALL ================= */
    const response = await api.post(
      `/sellers/${requestId}/documents/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Document upload success:", response.data);

    return response.data;

  } catch (error: any) {
    console.error(
      "❌ Document upload failed:",
      error?.response?.data || error
    );

    //  attach requestId for rollback usage
    throw {
      ...error,
      requestId,
    };
  }
};

/* ================= DELETE REQUEST ================= */

export const deleteUpdateRequest = async (requestId: number) => {
  try {
    console.log(`🗑️ Rolling back request: ${requestId}`);

    await api.delete(`/sellers/pendingSellerId/${requestId}`);

    console.log("✅ Request rollback successful");

  } catch (error: any) {
    console.error(
      "❌ Failed to rollback request:",
      error?.response?.data || error
    );
  }
};