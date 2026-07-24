import { z } from "zod";

// Helper regex to prevent consecutive spaces (allows single spaces between words)
const noConsecutiveSpaces = /^(?!.*\s{2,})/;

// Helper for optional fields to prevent consecutive spaces
const optionalNoConsecutiveSpaces = (fieldName: string) => 
  z.string()
    .optional()
    .refine(val => !val || !/\s{2,}/.test(val), {
      message: `${fieldName} should not contain consecutive spaces`
    });

// Classifies a seller type name into one of the 4 known onboarding categories.
// Deliberately a plain helper rather than a config-driven rules engine — these
// 4 seller types are fixed/compliance-driven, not expected to change often.
export type SellerTypeCategory = "MANUFACTURER" | "WHITE_LABELING" | "DISTRIBUTOR" | "PCD";

export function classifySellerType(sellerTypeName: string | undefined): SellerTypeCategory {
  const name = (sellerTypeName ?? "").toUpperCase();
  if (name.includes("WHITE LABEL") || name.includes("MARKETER")) return "WHITE_LABELING";
  if (name.includes("DISTRIBUTOR")) return "DISTRIBUTOR";
  if (name.includes("PCD")) return "PCD";
  return "MANUFACTURER";
}

// Step 1: Company Information
export const step1Schema = z.object({
  sellerName: z.string()
    .min(1, "Seller name is required")
    .regex(noConsecutiveSpaces, "Seller name should not contain consecutive spaces"),
  companyTypeId: z.number().min(1, "Company type is required"),
  sellerTypeId: z.number().min(1, "Seller type is required"),
  // Carried alongside sellerTypeId purely to drive the conditional checks below
  // (Parent Manufacturer Name / Brand Owner Name applicability by type).
  sellerTypeName: z.string().optional(),
  parentManufacturerName: z.string().optional(),
  brandOwnerName: z.string().optional(),
  productTypeIds: z.array(z.number()).min(1, "At least one product type is required"),
  stateId: z.number().min(1, "State is required"),
  districtId: z.number().min(1, "District is required"),
  talukaId: z.number().min(1, "Taluka is required"),
  city: z.string()
    .min(1, "City is required")
    .regex(noConsecutiveSpaces, "City should not contain consecutive spaces"),
  street: z.string()
    .min(1, "Street is required")
    .regex(noConsecutiveSpaces, "Street should not contain consecutive spaces"),
  buildingNo: z.string()
    .min(1, "Building number is required")
    .regex(noConsecutiveSpaces, "Building number should not contain consecutive spaces"),
  pincode: z.string().length(6, "Pin code must be 6 digits only"),
  phone: z.string().length(10, "Phone must be 10 digits only"),
  email: z.string().email("Invalid email format"),
  // Optional fields
  landmark: optionalNoConsecutiveSpaces("Landmark"),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  companyRegistrationCertificateFile: z.instanceof(File, { message: "Company Registration Certificate is required" }),
}).superRefine((data, ctx) => {
  const category = classifySellerType(data.sellerTypeName);
  if (category === "PCD" && !data.parentManufacturerName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["parentManufacturerName"],
      message: "Parent Manufacturer Name is required for PCD sellers",
    });
  }
});

// Step 2: Coordinator Information
export const step2Schema = z.object({
  coordinatorName: z.string()
    .min(1, "Coordinator name is required")
    .regex(noConsecutiveSpaces, "Coordinator name should not contain consecutive spaces"),
  coordinatorDesignation: z.string()
    .min(1, "Coordinator designation is required")
    .regex(noConsecutiveSpaces, "Coordinator designation should not contain consecutive spaces"),
  coordinatorEmail: z.string().email("Invalid email format"),
  coordinatorMobile: z.string()
    .length(10, "Mobile must be 10 digits only")
    .regex(/^\d+$/, "Mobile number must contain only digits"),
  authorizationLetterFile: z.instanceof(File, { message: "Authorization letter is required" }),
});

// License validation schema
export const licenseSchema = z.object({
  number: z.string().min(1, "License number is required"),
  file: z.instanceof(File, { message: "License file is required" }),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  issuingAuthority: z
    .string()
    .min(1, "Issuing authority is required")
    .regex(
      /^[a-zA-Z0-9\s]+$/,
      "Issuing authority should only contain alphanumeric characters and spaces"
    ),
  status: z.string(),
}).refine(
  (data) => {
    if (!data.issueDate || !data.expiryDate) return true;
    const issueDate = new Date(data.issueDate);
    const expiryDate = new Date(data.expiryDate);
    return issueDate <= expiryDate;
  },
  { message: "Issue date cannot be later than expiry date" }
);

// Agreement document validation schema (Brand Owner/White Labeling/Distribution/
// PCD Agreement). Agreement Number is optional (per requirement spec — only the
// document file, issue date, and expiry date are consistently mandatory).
export const agreementSchema = z.object({
  number: z.string().optional(),
  file: z.instanceof(File, { message: "Agreement document is required" }),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

// Which agreement document type codes are mandatory for a given seller type.
// Codes match tbl_document_type_master.document_type_code on the backend.
export function requiredAgreementCodes(category: SellerTypeCategory): string[] {
  switch (category) {
    case "WHITE_LABELING":
      return ["BRAND_OWNER_AGREEMENT", "WHITE_LABELING_AGREEMENT"];
    case "DISTRIBUTOR":
      return ["DISTRIBUTION_AGREEMENT"];
    case "PCD":
      return ["PCD_AGREEMENT"];
    default:
      return [];
  }
}

// Documents that are mandatory for a seller type in ADDITION to the agreement
// codes above — e.g. Manufacturer's GMP/WHO-GMP Certificate, White Labeling's
// Trademark Certificate. Stored in the same formData.agreements record (same
// shape: number/file/issueDate/expiryDate), just a different set of required
// keys, since these share the exact same upload shape.
export function mandatoryExtraDocumentCodes(category: SellerTypeCategory): string[] {
  switch (category) {
    case "MANUFACTURER":
      return ["GMP_WHO_GMP_CERTIFICATE"];
    case "WHITE_LABELING":
      return ["TRADEMARK_CERTIFICATE"];
    default:
      return [];
  }
}

// Maps a selected product type name to the Import Licence document code it
// unlocks. Uses the same substring matching as getLicenseName() in
// DocumentForm.tsx so a product like "Cosmetics" or "Medical Devices" lines
// up with the same category everywhere. Null entries (e.g. IEC, which is a
// general Import Export Code cert not tied to one product category) are
// handled separately in optionalExtraDocumentCodes().
function importLicenceCodeForProductType(productName: string): string | null {
  const name = productName.toLowerCase();
  if (name.includes("drug")) return "DRUG_IMPORT_LICENCE";
  if (name.includes("cosmetic")) return "COSMETIC_IMPORT_LICENCE";
  if (name.includes("medical device")) return "MEDICAL_DEVICE_IMPORT_LICENCE";
  if (name.includes("food") || name.includes("supplement") || name.includes("nutraceutical") || name.includes("nutrition")) {
    return "FSSAI_IMPORT_LICENCE";
  }
  return null;
}

// Documents a seller MAY attach but is never required to, per the requirement
// spec's "Recommended"/"Optional" rows. Trademark Certificate is optional (not
// mandatory) for Manufacturer/Distributor; Distribution Agreement is optional
// for White Labeling (it's mandatory only for Distributor). PCD has no
// optional Trademark Certificate slot — it's Not Applicable for PCD.
//
// The per-product Import Licences (Drug/FSSAI/Cosmetic/Medical Device) are
// only offered when the matching product type was selected in Step 1 —
// e.g. Drug Import Licence only appears if "Drugs" is among productTypes.
// IEC Certificate (the general Import Export Code) is offered whenever any
// import-eligible product type is selected, since it isn't product-specific.
export function optionalExtraDocumentCodes(category: SellerTypeCategory, productTypes: string[] = []): string[] {
  const applicableImportLicences = Array.from(
    new Set(
      productTypes
        .map(importLicenceCodeForProductType)
        .filter((code): code is string => code !== null)
    )
  );
  const common = applicableImportLicences.length > 0
    ? ["IEC_CERTIFICATE", ...applicableImportLicences]
    : [];
  switch (category) {
    case "MANUFACTURER":
    case "DISTRIBUTOR":
      return [...common, "TRADEMARK_CERTIFICATE"];
    case "WHITE_LABELING":
      return [...common, "DISTRIBUTION_AGREEMENT"];
    default:
      return common;
  }
}

// Human-readable label for a document type code, used by the UI when
// rendering agreement/extra-document upload blocks.
export function documentTypeLabel(code: string): string {
  const labels: Record<string, string> = {
    BRAND_OWNER_AGREEMENT: "Brand Owner Agreement",
    WHITE_LABELING_AGREEMENT: "White Labeling Agreement",
    DISTRIBUTION_AGREEMENT: "Distribution Agreement",
    PCD_AGREEMENT: "PCD Agreement",
    GMP_WHO_GMP_CERTIFICATE: "GMP / WHO-GMP Certificate",
    TRADEMARK_CERTIFICATE: "Trademark Certificate",
    IEC_CERTIFICATE: "IEC Certificate",
    DRUG_IMPORT_LICENCE: "Drug Import Licence",
    FSSAI_IMPORT_LICENCE: "FSSAI Import Licence",
    COSMETIC_IMPORT_LICENCE: "Cosmetic Import Licence",
    MEDICAL_DEVICE_IMPORT_LICENCE: "Medical Device Import Licence",
  };
  return labels[code] ?? code;
}

// Step 3: Documents
export const step3Schema = (productTypes: string[], sellerTypeName?: string) =>
  z.object({
    gstNumber: z
      .string()
      .trim()
      .toUpperCase()
      .length(15, "GST number must be 15 characters")
      .regex(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
        "Invalid GST number format"
      ),
    gstFile: z.instanceof(File, { message: "GST certificate is required" }),
    licenses: z.record(
      z.string(),
      licenseSchema
    ).refine(
      (licenses) => productTypes.every(pt => {
        const license = licenses[pt];
        return license &&
          license.number &&
          license.file &&
          license.issueDate &&
          license.expiryDate &&
          license.issuingAuthority;
      }),
      { message: "All license details must be provided" }
    ),
    agreements: z.record(
      z.string(),
      agreementSchema
    ).refine(
      (agreements) => {
        const category = classifySellerType(sellerTypeName);
        const requiredCodes = [
          ...requiredAgreementCodes(category),
          ...mandatoryExtraDocumentCodes(category),
        ];
        return requiredCodes.every(code => agreements[code] && agreements[code].file);
      },
      { message: "All required agreement/compliance documents must be provided" }
    ),
  });

// Step 4: Bank Details
// export const step4Schema = z.object({
//   accountNumber: z.string()
//     .regex(/^\d{9,18}$/, "Account number must be 9 to 18 digits"),
//   accountHolderName: z.string()
//     .min(1, "Account holder name is required")
//     .regex(/^(?!.*\s{2,})[A-Za-z\s]+$/, "Account holder name should not contain consecutive spaces and only alphabets"),
//   ifscCode: z.string().length(11, "IFSC code must be 11 characters"),
//   cancelledChequeFile: z.instanceof(File, { message: "Cancelled cheque is required" }),
// });
export const step4Schema = z.object({
  accountNumber: z.string()
    .regex(/^\d{9,18}$/, "Account number must be 9 to 18 digits"),
  accountHolderName: z.string()
    .min(1, "Account holder name is required")
    .regex(/^(?!.*\s{2,})/, "Account holder name should not contain consecutive spaces")
    .regex(/^[A-Za-z\s\-.&]+$/, "Account holder name can only contain letters, spaces, hyphens (-), dots (.), and ampersands (&)"),
  ifscCode: z.string().length(11, "IFSC code must be 11 characters"),
  bankStateId: z.number().min(1, "State is required"),
  bankDistrictId: z.number().min(1, "District is required"),
  bankTalukaId: z.number().min(1, "Taluka is required"),
  cancelledChequeFile: z.instanceof(File, { message: "Cancelled cheque is required" }),
});

export const fullFormSchema = step1Schema.merge(step2Schema).merge(step4Schema).extend({});