import { z } from "zod";

// Prevents "a  b" style double-space typos in free-text fields.
const noConsecutiveSpaces = /^(?!.*\s{2,})/;

// Accepts either a freshly-picked File OR a non-empty string (an
// already-uploaded file's URL, restored on a resumed draft — see
// isRealFileUrl in src/utils/sellerRegFiles.ts, reused as-is by the buyer
// wizard). Deliberately duplicated here rather than imported from
// src/schema/seller/sellerRegSchema.ts — buyer and seller schemas must not
// cross-import (see CLAUDE.md's obfuscated-slug role separation).
export const fileOrUploadedUrl = (message: string) =>
  z.any().refine(
    (val) => val instanceof File || (typeof val === "string" && val.trim().length > 0),
    { message }
  );

// ==========================================================================
// Step 1: Terms & Conditions
// ==========================================================================
export const buyerTermsSchema = z.object({
  acceptedTerms: z.literal(true, {
    message: "You must accept the Terms & Conditions to continue",
  }),
});

// ==========================================================================
// Step 1: Organization Details
// ==========================================================================
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const orgDetailsSchema = z.object({
  organizationName: z
    .string()
    .min(1, "Organization name is required")
    .max(150, "Organization name cannot exceed 150 characters")
    .regex(noConsecutiveSpaces, "Organization name should not contain consecutive spaces"),
  buyerTypeId: z.number().min(1, "Buyer type is required"),
  stateId: z.number().min(1, "State is required"),
  districtId: z.number().min(1, "District is required"),
  talukaId: z.number().min(1, "Taluka is required"),
  city: z.string().min(1, "City is required").regex(noConsecutiveSpaces, "City should not contain consecutive spaces"),
  street: z.string().min(1, "Street is required").regex(noConsecutiveSpaces, "Street should not contain consecutive spaces"),
  buildingNo: z.string().min(1, "Building number is required"),
  landmark: z.string().optional(),
  pinCode: z.string().regex(/^[0-9]{6}$/, "PIN code must be 6 digits"),
});

// ==========================================================================
// Step 3: Contact Details
// ==========================================================================
export const contactDetailsSchema = z
  .object({
    name: z
      .string()
      .min(1, "Full name is required")
      .max(100, "Name cannot exceed 100 characters")
      .regex(/^[A-Za-z\s]+$/, "Name should only contain letters and spaces"),
    designation: z.string().min(1, "Designation is required").max(100, "Designation cannot exceed 100 characters"),
    email: z.string().email("Invalid email format").max(100, "Email cannot exceed 100 characters"),
    mobile: z
      .string()
      .length(10, "Mobile must be 10 digits")
      .regex(/^\d+$/, "Mobile number must contain only digits"),
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
  })
  .refine((data) => data.emailVerified, {
    message: "Please verify your email before continuing",
    path: ["emailVerified"],
  })
  .refine((data) => data.phoneVerified, {
    message: "Please verify your mobile number before continuing",
    path: ["phoneVerified"],
  });

// ==========================================================================
// Step 3: Compliance Details — buyer-type-mandatory document mapping
// ==========================================================================
// Every buyer type maps to exactly ONE mandatory document type via
// tbl_buyer_type_master.mandatory_document_type_id — a single FK
// (BuyerTypeMaster#mandatoryDocumentTypeId, a @ManyToOne, not a list), so
// there is no "one of two documents" ambiguity for Clinic or anyone else to
// resolve here. That id is read directly off the buyer type selected in
// Step 2 (BuyerTypeResponse.mandatoryDocumentTypeId from GET /buyer-types) —
// deliberately NOT a hardcoded buyer-type-name -> document-code map, since
// that would silently drift from whatever admins configure server-side.

// Returns the single mandatory document type id for the selected buyer
// type, or an empty array if none is selected yet. Kept as an array (rather
// than a nullable single value) so call sites that do `ids.every(...)` /
// `ids.map(...)` don't need a separate null-check branch just because
// there's currently only ever zero or one entry. The id is used as-is
// (stringified) as the key into formData.documents — callers that need a
// human label look it up via the buyer type's mandatoryDocumentTypeId
// against the GET /document-types list themselves (see DocumentsForm.tsx /
// ReviewForm.tsx), rather than through a hardcoded label table here.
export function requiredBuyerDocumentCodes(mandatoryDocumentTypeId?: number | null): string[] {
  return mandatoryDocumentTypeId ? [String(mandatoryDocumentTypeId)] : [];
}

// Per-document upload row (mandatory buyer-type document, keyed by its
// document type id in formData.documents).
export const buyerLicenseSchema = z.object({
  number: z.string().min(1, "Document number is required"),
  file: fileOrUploadedUrl("Document file is required"),
  issueDate: z.string().optional(),
  expiryDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const expiry = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        return expiry >= today;
      },
      { message: "Expiry date cannot be in the past" }
    ),
});

// Step 4 schema factory — parameterized by the currently-selected buyer
// type's mandatoryDocumentTypeId so that single mandatory document is
// enforced as required; every other document row (GST certificate/PAN
// card/org logo) is optional and validated purely at the file level
// (see gstFile/panFile/orgLogo below), not through this record.
export function documentsSchema(mandatoryDocumentTypeId?: number | null) {
  const requiredCodes = requiredBuyerDocumentCodes(mandatoryDocumentTypeId);

  return z.object({
    documents: z.record(z.string(), buyerLicenseSchema).refine(
      (documents) =>
        requiredCodes.every((code) => {
          const doc = documents[code];
          return !!doc && !!doc.number?.trim() && !!doc.file;
        }),
      { message: "Please provide the mandatory document for your buyer type" }
    ),
  });
}

// GST/PAN numbers now live on the Compliance Details step (accordion,
// alongside the mandatory license and optional org logo) rather than
// Organization Details — exactly one of the two is required, mirroring
// TempBuyerServiceImpl's server-side rule (PAN required when GST is blank).
export const gstOrPanSchema = z
  .object({
    gstNumber: z.string().trim().toUpperCase().optional().or(z.literal("")),
    panNumber: z.string().trim().toUpperCase().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const gst = data.gstNumber?.trim() ?? "";
    const pan = data.panNumber?.trim() ?? "";

    if (!gst && !pan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["panNumber"],
        message: "PAN number is required when GST number is not provided",
      });
    }

    if (gst && !gstRegex.test(gst)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gstNumber"], message: "Invalid GST number format" });
    }

    if (pan && !panRegex.test(pan)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["panNumber"], message: "Invalid PAN number format" });
    }
  });
