import { z } from "zod";

export const nonconsumableDeviceSchema = z.object({
  // Product Details
  productName: z.string().min(1, "Product Name is required"),
  deviceCategoryId: z.string().min(1, "Device Category is required"),
  brandName: z.string().min(1, "Brand Name is required"),
  materialType: z.string().min(1, "Material Type is required"),
  sizeDimension: z.string().min(1, "Size/Dimension is required"),
  sterileStatus: z.string().min(1, "Sterile status is required"),
  disposableType: z.string().min(1, "Disposable/Reusable status is required"),
  shelfLife: z.string().min(1, "Shelf Life is required"),
  intendedUse: z.string().min(1, "Intended Use is required"),
  keyFeatures: z.string().min(1, "Key Features are required"),
  safetyInstructions: z.string().min(1, "Safety Instructions are required"),
  certifications: z.string().min(1, "Certifications are required"),
  cdscoNumber: z.string().optional(),
  iso13485: z.boolean().default(false),
  ce: z.boolean().default(false),
  bis: z.boolean().default(false),
  countryOfOrigin: z.string().min(1, "Country of Origin is required"),
  manufacturerName: z.string().min(1, "Manufacturer Name is required"),
  productDescription: z.string().min(1, "Product Description is required"),
  storageCondition: z.string().min(1, "Storage Condition is required"),
  productBrochureUrl: z.string().optional(),

  // Packaging Details
  packType: z.string().min(1, "Pack Type is required"),
  unitsPerPack: z
    .string()
    .min(1, "Units per Pack is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),
  numberOfPacks: z
    .string()
    .min(1, "Number of Packs is required")
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

  // Batch & Stock Details
  batchLotNumber: z.string().min(1, "Batch/Lot Number is required"),
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
  stockQuantity: z
    .string()
    .min(1, "Stock Quantity is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),
  dateOfStockEntry: z.date().nullable(),

  // Pricing & Tax Details
  sellingPricePerPack: z
    .string()
    .min(1, "Selling Price per Pack is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),
  mrp: z
    .string()
    .min(1, "MRP is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),
  discountPercentage: z
    .string()
    .min(1, "Discount Percentage is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),
  additionalDiscount: z.string().optional(),
  minimumPurchaseQuantity: z.string().optional(),
  additionalDiscountPercentage: z.string().optional(),
  effectiveStartDate: z.date().nullable(),
  effectiveStartTime: z.string().optional(),
  effectiveEndDate: z.date().nullable(),
  effectiveEndTime: z.string().optional(),
  gstPercentage: z
    .string()
    .min(1, "GST % is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),
  finalPrice: z.string().optional(),
  hsnCode: z
    .string()
    .min(1, "HSN Code is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "Must be a number",
    }),
});