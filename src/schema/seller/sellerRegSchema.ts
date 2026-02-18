import { z } from "zod";

// Step 1: Company Information
export const step1Schema = z.object({
  sellerName: z.string().min(1, "Seller name is required"),
  companyTypeId: z.number().min(1, "Company type is required"),
  sellerTypeId: z.number().min(1, "Seller type is required"),
  productTypeIds: z.array(z.number()).min(1, "At least one product type is required"),
  stateId: z.number().min(1, "State is required"),
  districtId: z.number().min(1, "District is required"),
  talukaId: z.number().min(1, "Taluka is required"),
  city: z.string().min(1, "City is required"),
  street: z.string().min(1, "Street is required"),
  buildingNo: z.string().min(1, "Building number is required"),
  pincode: z.string().length(6, "Pin code must be 6 digits only"),
  phone: z.string().length(10, "Phone must be 10 digits only"),
  email: z.string().email("Invalid email format"),
  // Optional fields
  landmark: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

// Step 2: Coordinator Information (partial - verification flags handled separately)
export const step2Schema = z.object({
  coordinatorName: z.string().min(1, "Coordinator name is required"),
  coordinatorDesignation: z.string().min(1, "Coordinator designation is required"),
  coordinatorEmail: z.string().email("Invalid email format"),
  coordinatorMobile: z.string().length(10, "Mobile must be 10 digits only"),
});

// License validation schema
export const licenseSchema = z.object({
  number: z.string().min(1, "License number is required"),
  file: z.instanceof(File, { message: "License file is required" }),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  issuingAuthority: z.string().min(1, "Issuing authority is required"),
  status: z.string(), // Auto-calculated, not validated
}).refine(
  (data) => {
    if (!data.issueDate || !data.expiryDate) return true;
    const issueDate = new Date(data.issueDate);
    const expiryDate = new Date(data.expiryDate);
    return issueDate <= expiryDate;
  },
  { message: "Issue date cannot be later than expiry date" }
);

// Step 3: Documents
export const step3Schema = (productTypes: string[]) =>
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
  });

// Step 4: Bank Details
export const step4Schema = z.object({
  accountNumber: z.string().regex(/^\d{9,18}$/, "Account number must be 9 to 18 digits"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  ifscCode: z.string().length(11, "IFSC code must be 11 characters"),
  cancelledChequeFile: z.instanceof(File, { message: "Cancelled cheque is required" }),
});


export const fullFormSchema = step1Schema.merge(step2Schema).merge(step4Schema).extend({
});