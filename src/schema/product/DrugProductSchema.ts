import { z } from "zod";

export const drugProductSchema = z.object({
  productName: z.string().min(1, "Product Name is required"),

  productCategoryId: z.string().min(1, "Category is required"),

  // therapeuticCategory: z.string().min(1, "Therapeutic Category is required"),

  therapeuticSubcategory: z
    .string()
    .min(1, "Therapeutic Subcategory is required"),

  dosageForm: z.string().min(1, "Dosage Form is required"),

  strength: z
    .string()
    .min(1, "Strength is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Strength must be a number",
    }),

  // molecules: z
  //   .array(
  //     z.object({
  //       moleculeId: z.number().nullable(),
  //       moleculeName: z
  //         .string()
  //         .min(1, "Molecule name is required"),
  //       mechanismOfAction: z.string().optional(),
  //       primaryUse: z.string().optional(),
  //     })
  //   )
  //   .min(1, "At least one molecule is required"),

  warningsPrecautions: z
    .string()
    .min(1, "Warnings & Precautions are required"),

  productDescription: z.string().min(1, "Product Description is required"),

  productMarketingUrl: z
    .string()
    .min(1, "Marketing URL is required"),

  // Packaging
  packagingUnit: z.string().min(1, "Packaging Unit is required"),

  numberOfUnits: z
    .string()
    .min(1, "Number of Units is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),

  packSize: z
    .string()
    .min(1, "Pack Size is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),

  minimumOrderQuantity: z
    .string()
    .min(1, "Minimum Order Quantity is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),

  maximumOrderQuantity: z
    .string()
    .min(1, "Maximum Order Quantity is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),

  // Pricing
  batchLotNumber: z.string().min(1, "Batch Lot Number is required"),

  manufacturerName: z.string().min(1, "Manufacturer Name is required"),

  storageCondition: z.string().min(1, "Storage Condition is required"),

  stockQuantity: z
    .string()
    .min(1, "Stock Quantity is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),

  pricePerUnit: z
    .string()
    .min(1, "Price Per Unit is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),

  mrp: z
    .string()
    .min(1, "MRP is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),

  // finalPrice: z
  //   .string()
  //   .min(1, "Final Price is required")
  //   .refine((val) => !isNaN(Number(val)), {
  //     message: "Must be a number",
  //   }),

  gstPercentage: z
    .string()
    .min(1, "GST % is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),

  discountPercentage: z
    .string()
    .min(1, "GST % is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),

  hsnCode: z
    .string()
    .min(1, "HSN Code is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),
  manufacturingDate: z
    .date()
    .nullable()
    .refine((val) => val !== null, {
      message: "Manufacturing date is required",
    }),

  expiryDate: z
    .date()
    .nullable()
    .refine((val) => val !== null, {
      message: "Expiry date is required",
    }),
});