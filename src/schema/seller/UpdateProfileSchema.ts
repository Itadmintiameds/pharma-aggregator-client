import { z } from "zod";

// ========== ADDRESS SCHEMA ==========
export const updateAddressSchema = z.object({
  stateId: z.number().optional(),
  districtId: z.number().optional(),
  talukaId: z.number().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  buildingNo: z.string().optional(),
  landmark: z.string().optional(),
  pinCode: z.string()
    .length(6, "Pin code must be 6 digits")
    .regex(/^\d+$/, "Pin code must contain only digits")
    .optional(),
}).refine(
  (data) => {
    // If any address field is provided, validate all required fields
    const hasAnyField = Object.values(data).some(val => val !== undefined && val !== '');
    if (!hasAnyField) return true;
    
    // Check required fields
    return !!(
      data.stateId &&
      data.districtId &&
      data.talukaId &&
      data.city &&
      data.street &&
      data.buildingNo &&
      data.pinCode
    );
  },
  { message: "All address fields are required when updating address" }
);

// ========== COMPANY SECTION SCHEMA ==========
export const updateCompanySchema = z.object({
  sellerName: z.string().min(1, "Seller name is required").optional(),
  companyTypeId: z.number().min(1, "Company type is required").optional(),
  sellerTypeId: z.number().min(1, "Seller type is required").optional(),
  productTypeId: z.array(z.number()).min(1, "At least one product type is required").optional(),
  phone: z.string()
    .length(10, "Phone must be 10 digits")
    .regex(/^\d+$/, "Phone must contain only digits")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal('')),
  address: updateAddressSchema.optional(),
}).refine(
  (data) => {
    // If any company field is provided, at least one must be valid
    const hasAnyField = Object.values(data).some(val => 
      val !== undefined && 
      val !== '' && 
      (Array.isArray(val) ? val.length > 0 : true)
    );
    return hasAnyField;
  },
  { message: "At least one company field must be provided for update" }
);

// ========== COORDINATOR SECTION SCHEMA ==========
export const updateCoordinatorSchema = z.object({
  name: z.string().min(1, "Coordinator name is required").optional(),
  designation: z.string().min(1, "Designation is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  mobile: z.string()
    .length(10, "Mobile must be 10 digits")
    .regex(/^\d+$/, "Mobile must contain only digits")
    .optional(),
}).refine(
  (data) => {
    // If any coordinator field is provided, validate all required fields
    const hasAnyField = Object.values(data).some(val => val !== undefined && val !== '');
    if (!hasAnyField) return true;
    
    // When updating coordinator, all fields should be provided
    return !!(
      data.name &&
      data.designation &&
      data.email &&
      data.mobile
    );
  },
  { message: "All coordinator fields are required when updating coordinator" }
);

// ========== LICENSE SCHEMA ==========
export const updateLicenseSchema = z.object({
  documentNumber: z.string().min(1, "License number is required").optional(),
  documentFileUrl: z.string().url("Invalid file URL").optional(),
  licenseIssueDate: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
  licenseIssuingAuthority: z.string().min(1, "Issuing authority is required").optional(),
}).refine(
  (data) => {
    // Date validation if both dates are provided
    if (data.licenseIssueDate && data.licenseExpiryDate) {
      const issueDate = new Date(data.licenseIssueDate);
      const expiryDate = new Date(data.licenseExpiryDate);
      return issueDate <= expiryDate;
    }
    return true;
  },
  { message: "Issue date cannot be later than expiry date" }
).refine(
  (data) => {
    // If any license field is provided, all should be provided
    const hasAnyField = Object.values(data).some(val => val !== undefined && val !== '');
    if (!hasAnyField) return true;
    
    return !!(
      data.documentNumber &&
      data.licenseIssuingAuthority
    );
  },
  { message: "License number and issuing authority are required when updating license" }
);

// ========== GST SECTION SCHEMA ==========
export const updateGSTSchema = z.object({
  gstNumber: z.string()
    .length(15, "GST number must be 15 characters")
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
      "Invalid GST number format"
    )
    .optional(),
  gstFileUrl: z.string().url("Invalid file URL").optional(),
}).refine(
  (data) => {
    // If any GST field is provided, both should be provided
    const hasAnyField = Object.values(data).some(val => val !== undefined && val !== '');
    if (!hasAnyField) return true;
    
    return !!(data.gstNumber && data.gstFileUrl);
  },
  { message: "Both GST number and certificate are required when updating GST" }
);

// ========== BANK SECTION SCHEMA ==========
export const updateBankSchema = z.object({
  bankName: z.string().min(1, "Bank name is required").optional(),
  branch: z.string().min(1, "Branch is required").optional(),
  ifscCode: z.string()
    .length(11, "IFSC code must be 11 characters")
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format")
    .optional(),
  accountNumber: z.string()
    .regex(/^\d{9,18}$/, "Account number must be 9 to 18 digits")
    .optional(),
  accountHolderName: z.string().min(1, "Account holder name is required").optional(),
  bankDocumentFileUrl: z.string().url("Invalid file URL").optional(),
}).refine(
  (data) => {
    // If any bank field is provided, all required fields should be provided
    const hasAnyField = Object.values(data).some(val => val !== undefined && val !== '');
    if (!hasAnyField) return true;
    
    return !!(
      data.bankName &&
      data.branch &&
      data.ifscCode &&
      data.accountNumber &&
      data.accountHolderName &&
      data.bankDocumentFileUrl
    );
  },
  { message: "All bank fields are required when updating bank details" }
);

// ========== COMPLETE UPDATE SCHEMA ==========
export const completeUpdateSchema = z.object({
  sellerName: z.string().min(1, "Seller name is required").optional(),
  productTypeId: z.array(z.number()).min(1, "At least one product type is required").optional(),
  companyTypeId: z.number().min(1, "Company type is required").optional(),
  sellerTypeId: z.number().min(1, "Seller type is required").optional(),
  phone: z.string()
    .length(10, "Phone must be 10 digits")
    .regex(/^\d+$/, "Phone must contain only digits")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
  termsAccepted: z.boolean().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal('')),
  address: updateAddressSchema.optional(),
  coordinator: updateCoordinatorSchema.optional(),
  bankDetails: updateBankSchema.optional(),
  gstNumber: z.string()
    .length(15, "GST number must be 15 characters")
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
      "Invalid GST number format"
    )
    .optional(),
  gstFileUrl: z.string().url("Invalid file URL").optional(),
  documents: z.array(updateLicenseSchema).optional(),
}).refine(
  (data) => {
    // At least one field must be provided for update
    const hasAnyField = Object.values(data).some(val => 
      val !== undefined && 
      val !== '' && 
      (Array.isArray(val) ? val.length > 0 : true) &&
      typeof val !== 'boolean' // Skip termsAccepted for this check
    );
    return hasAnyField;
  },
  { message: "At least one field must be provided for update" }
);

// ========== HELPER FUNCTION TO VALIDATE SECTION ==========
export function validateSection(
  section: string, 
  data: any
): { success: boolean; error?: string } {
  try {
    switch (section) {
      case 'company':
        updateCompanySchema.parse(data);
        break;
      case 'coordinator':
        updateCoordinatorSchema.parse(data);
        break;
      case 'gst':
        updateGSTSchema.parse(data);
        break;
      case 'bank':
        updateBankSchema.parse(data);
        break;
      case 'license':
        updateLicenseSchema.parse(data);
        break;
      default:
        return { success: false, error: 'Invalid section' };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues[0]?.message || 'Validation failed' 
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

// ========== TYPE EXPORTS ==========
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type UpdateCoordinatorInput = z.infer<typeof updateCoordinatorSchema>;
export type UpdateLicenseInput = z.infer<typeof updateLicenseSchema>;
export type UpdateGSTInput = z.infer<typeof updateGSTSchema>;
export type UpdateBankInput = z.infer<typeof updateBankSchema>;
export type CompleteUpdateInput = z.infer<typeof completeUpdateSchema>;