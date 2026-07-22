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
  companyRegistrationCertificate?: File;
  sellerImage?: File;
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

    /* ================= COMPANY REGISTRATION CERTIFICATE ================= */
    if (payload.companyRegistrationCertificate) {
      formData.append("companyRegistrationCertificate", payload.companyRegistrationCertificate);
      hasFile = true;
    }

    /* ================= BANK ================= */
    if (payload.bankFile) {
      formData.append("bankFile", payload.bankFile);
      hasFile = true;
    }

    /* ================= SELLER IMAGE / LOGO ================= */
    // NOTE: backend does not yet accept a `sellerImage` part on this endpoint
    // (only the temp-seller registration upload does) - this is sent in
    // anticipation of that support being added; until then it is a no-op.
    if (payload.sellerImage) {
      formData.append("sellerImage", payload.sellerImage);
      hasFile = true;
    }

    /* ================= LICENSES ================= */
    if (payload.licenses && payload.licenses.length > 0) {
      // Send all license files as an array under the same key
      const licenseFiles: File[] = [];
      const licenseNames: string[] = [];
      const documentIds: string[] = [];

      payload.licenses.forEach((license) => {
        if (license.file) {
          licenseFiles.push(license.file);
          licenseNames.push(license.licenseName);
          // Always send documentId - if not present, send empty string or "0"
          documentIds.push(license.documentId ? String(license.documentId) : "");
          hasFile = true;
        }
      });

      // Append all files with the same key "licenseFiles"
      licenseFiles.forEach((file) => {
        formData.append("licenseFiles", file);
      });

      // Append licenseNames as a comma-separated string OR as array
      // The backend expects List<String> so it can parse comma-separated values
      formData.append("licenseNames", licenseNames.join(","));

      // Append documentIds as a comma-separated string
      formData.append("documentIds", documentIds.join(","));
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

    // attach requestId for rollback usage
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














// service dated 25.05.2026................
// import api from "@/src/lib/api";

// /* ================= TYPES ================= */

// export interface LicenseFileItem {
//   file: File;
//   licenseName: string;
//   documentId?: number; // only for EXISTING documents
// }

// export interface UploadDocPayload {
//   gstFile?: File;
//   bankFile?: File;
//    companyRegistrationCertificate?: File;
//   licenses?: LicenseFileItem[];
// }

// /* ================= UPLOAD SERVICE ================= */

// export const uploadSellerDocuments = async (
//   requestId: number,
//   payload: UploadDocPayload
// ) => {
//   try {
//     console.log("📡 Uploading documents for request:", requestId);

//     const formData = new FormData();
//     let hasFile = false;

//     /* ================= GST ================= */
//     if (payload.gstFile) {
//       formData.append("gstFile", payload.gstFile);
//       hasFile = true;
//     }

//     /* ================= COMPANY REGISTRATION CERTIFICATE ================= */
// if (payload.companyRegistrationCertificate) {
//   formData.append("companyRegistrationCertificate", payload.companyRegistrationCertificate);
//   hasFile = true;
// }

//     /* ================= BANK ================= */
//     if (payload.bankFile) {
//       formData.append("bankFile", payload.bankFile);
//       hasFile = true;
//     }

//     /* ================= LICENSES ================= */
//     if (payload.licenses && payload.licenses.length > 0) {
//       payload.licenses.forEach((license) => {
//         // only process if file exists
//         if (license.file) {
//           // file
//           formData.append("licenseFiles", license.file);

//           // license name 
//           formData.append("licenseNames", license.licenseName);

//           // documentId ONLY for existing docs (replacement case)
//           if (license.documentId) {
//             formData.append("documentIds", String(license.documentId));
//           }

//           hasFile = true;
//         }
//       });
//     }

//     /* ================= SKIP IF NO FILE ================= */
//     if (!hasFile) {
//       console.log("⚠️ No files to upload. Skipping upload API.");
//       return null;
//     }

//     /* ================= API CALL ================= */
//     const response = await api.post(
//       `/sellers/${requestId}/documents/upload`,
//       formData,
//       {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       }
//     );

//     console.log("✅ Document upload success:", response.data);

//     return response.data;

//   } catch (error: any) {
//     console.error(
//       "❌ Document upload failed:",
//       error?.response?.data || error
//     );

//     //  attach requestId for rollback usage
//     throw {
//       ...error,
//       requestId,
//     };
//   }
// };

// /* ================= DELETE REQUEST ================= */

// export const deleteUpdateRequest = async (requestId: number) => {
//   try {
//     console.log(`🗑️ Rolling back request: ${requestId}`);

//     await api.delete(`/sellers/pendingSellerId/${requestId}`);

//     console.log("✅ Request rollback successful");

//   } catch (error: any) {
//     console.error(
//       "❌ Failed to rollback request:",
//       error?.response?.data || error
//     );
//   }
// };