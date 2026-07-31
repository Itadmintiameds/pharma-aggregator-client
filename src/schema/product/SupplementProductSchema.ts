import { z } from "zod";

// ─── Reusable helpers ────────────────────────────────────────────────────────

const positiveInteger = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^[1-9]\d*$/, "Only positive integers are allowed");

const nonNegativeInteger = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^\d+$/, "Only non-negative integers are allowed");

const numericPositive = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^\d+(\.\d+)?$/, "Only numeric values are allowed")
  .refine((val) => Number(val) > 0, { message: "Must be greater than 0" });

// ─── Supplement Product Schema ────────────────────────────────────────────────

const supplementProductBaseSchema = z
  .object({
    // ── Product Details ──────────────────────────────────────────────────────

    productName: z
      .string()
      .trim()
      .min(3, "Product Name must be at least 3 characters")
      .max(150, "Product Name must not exceed 150 characters")
      .regex(
        /^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/,
        "Product Name can contain alphanumeric and special characters"
      ),

    therapeuticCategory: z.string().min(1, "Therapeutic Category is required"),

    therapeuticSubcategory: z
      .string()
      .min(1, "Therapeutic Subcategory is required"),

    brandName: z
      .string()
      .trim()
      .min(1, "Brand Name is required")
      .max(60, "Brand Name must not exceed 60 characters")
      .regex(
        /^[a-zA-Z0-9\s\-]+$/,
        "Brand Name allows alphabets, numbers, spaces, hyphens only"
      ),

    variantName: z
      .string()
      .max(60, "Variant Name must not exceed 60 characters")
      .optional()
      .or(z.literal("")),

    dosageForm: z.string().min(1, "Dosage Form is required"),

    netQuantity: z
      .string()
      .trim()
      .min(1, "Net Quantity is required")
      .max(20, "Net Quantity must not exceed 20 characters")
      .regex(
        /^[a-zA-Z0-9\s]+$/,
        "Net Quantity allows alphanumeric characters only"
      ),

    strength: z
      .string()
      .trim()
      .min(1, "Strength / Composition is required"),

    activeIngredients: z
      .string()
      .trim()
      .min(1, "Active Ingredients is required"),

    excipients: z.string().optional().or(z.literal("")),

    nutritionalInfoType: z
      .string()
      .min(1, "Nutritional Information selection is required"),

    intendedUse: z
      .string()
      .trim()
      .min(10, "Intended Use must be at least 10 characters"),

    ageGroup: z.string().min(1, "Age Group is required"),

    gender: z.string().min(1, "Gender is required"),

    vegNonVeg: z
      .string()
      .min(1, "Veg / Non-Veg Indicator is required")
      .refine((val) => ["Veg", "Non-Veg"].includes(val), {
        message: "Must be either Veg or Non-Veg",
      }),

    allergenInfo: z
      .string()
      .trim()
      .min(3, "Allergen Information must be at least 3 characters"),

    flavour: z.string().min(1, "Flavour is required"),

    productClaims: z
      .string()
      .trim()
      .min(1, "Product Claims is required")
      .regex(
        /^[a-zA-Z0-9\s\-,]+$/,
        "Product Claims allows alphabets, numbers, spaces, hyphens, and commas"
      ),

    warningsPrecautions: z
      .string()
      .trim()
      .min(1, "Warnings / Precautions is required")
      .max(255, "Maximum 255 characters allowed")
      .regex(
        /^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?'\n\r]*$/,
        "Invalid characters used"
      ),

    productDescription: z
      .string()
      .trim()
      .min(10, "Product Description must be at least 10 characters")
      .max(255, "Maximum 255 characters allowed")
      .regex(
        /^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?'\n\r]*$/,
        "Invalid characters used"
      ),

    storageCondition: z.string().min(1, "Storage Condition is required"),

    manufacturerName: z
      .string()
      .trim()
      .min(1, "Manufacturer Name is required")
      .max(100, "Manufacturer Name must not exceed 100 characters")
      .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/,
        "Manufacturer Name can contain alphanumeric and special characters"
      ),

    countryOfOrigin: z.string().min(1, "Country of Origin is required"),

    // ── Packaging ────────────────────────────────────────────────────────────

    packId: z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== null && val !== undefined, {
        message: "Pack Type is required",
      }),

    unitPerPack: positiveInteger,
    numberOfPacks: positiveInteger,

    minimumOrderQuantity: positiveInteger,
    maximumOrderQuantity: positiveInteger,

    // ── Batch / Pricing ──────────────────────────────────────────────────────

    batchLotNumber: z
      .string()
      .trim()
      .min(3, "Batch Number must be at least 3 characters")
      .max(20, "Batch Number must not exceed 20 characters")
      .regex(/^[a-zA-Z0-9]+$/, "Only alphanumeric characters are allowed"),

    manufacturingDate: z
      .date()
      .refine((val) => val instanceof Date && !isNaN(val.getTime()), {
        message: "Manufacturing Date is required",
      }),

    expiryDate: z
      .date()
      .refine((val) => val instanceof Date && !isNaN(val.getTime()), {
        message: "Expiry Date is required",
      }),

    stockQuantity: nonNegativeInteger,

    mrp: numericPositive,

    sellingPrice: numericPositive,

    discountPercentage: z
      .string()
      .trim()
      .refine((val) => val === "" || /^\d+(\.\d+)?$/.test(val), {
        message: "Only numeric values are allowed",
      })
      .refine((val) => val === "" || (Number(val) >= 0 && Number(val) <= 100), {
        message: "Discount must be between 0 and 100",
      }),

    gstPercentage: z
      .string()
      .trim()
      .min(1, "GST % is required")
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number"),

    hsnCode: z
      .string()
      .trim()
      .min(1, "HSN Code is required")
      .regex(/^\d+$/, "Only numeric values are allowed")
      .refine((val) => [4, 6, 8].includes(val.length), {
        message: "HSN Code must be 4, 6, or 8 digits",
      }),

    // ── Images ───────────────────────────────────────────────────────────────
    // (validated separately as File[] state, but typed here for safeParse)
  });

export const supplementProductSchema = supplementProductBaseSchema
  .superRefine((data, ctx) => {
    // Cross-field: maximumOrderQuantity >= minimumOrderQuantity
    const minQty = Number(data.minimumOrderQuantity) || 0;
    const maxQty = Number(data.maximumOrderQuantity) || 0;
    if (maxQty && minQty && maxQty < minQty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maximumOrderQuantity"],
        message: "Max Order Qty must be greater than Min Order Qty",
      });
    }

    // Cross-field: stockQuantity >= minimumOrderQuantity
    const stockQty = Number(data.stockQuantity) || 0;
    if (stockQty && minQty && stockQty < minQty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stockQuantity"],
        message: "Stock Quantity must be greater than or equal to Min Order Qty",
      });
    }

    // Cross-field: sellingPrice < mrp
    const mrp = Number(data.mrp) || 0;
    const selling = Number(data.sellingPrice) || 0;
    if (selling && mrp && selling >= mrp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sellingPrice"],
        message: "Selling Price must be less than MRP",
      });
    }

    // // Cross-field: expiryDate >= manufacturingDate + 3 months
    // if (data.manufacturingDate && data.expiryDate) {
    //   const minExpiry = new Date(data.manufacturingDate);
    //   minExpiry.setMonth(minExpiry.getMonth() + 3);
    //   if (data.expiryDate < minExpiry) {
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       path: ["expiryDate"],
    //       message: "Expiry must be at least 3 months after Manufacturing Date",
    //     });
    //   }
    // }
  });

// Used when adding a product without its packaging (variant) and pricing (batch/stock)
// details — those are attached afterwards from the product view page.
export const supplementProductCreateSchema = supplementProductBaseSchema.omit({
  packId: true,
  unitPerPack: true,
  numberOfPacks: true,
  minimumOrderQuantity: true,
  maximumOrderQuantity: true,
  batchLotNumber: true,
  manufacturingDate: true,
  expiryDate: true,
  stockQuantity: true,
  mrp: true,
  sellingPrice: true,
  discountPercentage: true,
});

export type SupplementProductFormData = z.infer<typeof supplementProductSchema>;
