import { z } from "zod";

const positiveInteger = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^[1-9]\d*$/, "Only positive integers are allowed");

export const drugProductSchema = z.object({

  therapeuticCategory: z
    .string()
    .min(1, "Therapeutic Category is required"),

  therapeuticSubcategory: z
    .string()
    .min(1, "Therapeutic Subcategory is required"),

  productName: z
    .string()
    .min(3, "Product Name must be at least 3 characters")
    .max(150, "Product Name must not exceed 150 characters")
    .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/,
      "Product Name can contain alphanumeric and special characters"
    ),

  dosageId: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null && val !== undefined, {
      message: "Dosage Form is required",
    }),



    
  molecules: z
    .array(
      z.object({
        moleculeId: z
          .union([z.string(), z.number()])
          .transform((val) => Number(val)) // ✅ always number
          .refine((val) => val > 0, {
            message: "Molecule is required",
          }),
        drugSchedule: z.string().min(1),
        mechanismOfAction: z.string().min(1),
        primaryUse: z.string().min(1),
        strength: z.string().min(1),
      })
    )
    .min(1, "At least one molecule is required"),

  manufacturerName: z
    .string()
    .trim()
    .min(1, "Manufacturer Name is required")
    .regex(/^[A-Za-z\s]+$/, "Only alphabets and spaces are allowed"),

  warningsPrecautions: z
    .string()
    .trim()
    .min(1, "Warnings & Precautions are required")
    .max(1000, "Maximum 1000 characters allowed")
    .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?\n\r]*$/,
      "Invalid characters used"
    ),

  productDescription: z
    .string()
    .trim()
    .min(1, "Product Description is required")
    .max(1000, "Maximum 1000 characters allowed")
    .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?\n\r]*$/,
      "Invalid characters used"
    ),


  // Packaging
  packId: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null && val !== undefined, {
      message: "Pack Type is required",
    }),

  unitPerPack: z
    .string()
    .trim()
    .min(1, "Number of Units per Pack Type is required")
    .regex(/^[1-9]\d*$/, "Only positive integers are allowed"),

  numberOfPacks: z
    .string()
    .trim()
    .min(1, "Number of Packs is required")
    .regex(/^[1-9]\d*$/, "Only positive integers are allowed"),


  minimumOrderQuantity: positiveInteger,
  maximumOrderQuantity: positiveInteger,

  // Pricing

  batchLotNumber: z
    .string()
    .trim()
    .min(1, "Batch/Lot Number is required") // Mandatory
    .regex(/^[a-zA-Z0-9]+$/, "Only alphanumeric characters are allowed"),

  manufacturingDate: z
    .date()
    .refine((val) => val instanceof Date && !isNaN(val.getTime()), {
      message: "Manufacturing date is required",
    }),

  expiryDate: z
    .date()
    .refine((val) => val instanceof Date && !isNaN(val.getTime()), {
      message: "Expiry date is required",
    }),

  storageCondition: z
    .string()
    .trim()
    .min(1, "Storage Condition is required"),


  stockQuantity: z
    .string()
    .trim()
    .min(1, "Stock Quantity is required") // Mandatory
    .regex(/^[1-9]\d*$/, "Only positive integers are allowed"),


  sellingPrice: z
    .string()
    .trim()
    .min(1, "Selling Price is required") // Mandatory
    .regex(/^\d+(\.\d+)?$/, "Only numeric values are allowed")
    .refine((val) => Number(val) > 0, {
      message: "Selling Price must be greater than 0",
    }),

  mrp: z
    .string()
    .trim()
    .min(1, "MRP is required") // Mandatory
    .regex(/^\d+(\.\d+)?$/, "Only numeric values are allowed"),

  discountPercentage: z
    .string()
    .trim()
    .min(1, "Discount Percentage is required")
    .regex(/^\d+(\.\d+)?$/, "Only numeric values are allowed") // allows integers & decimals
    .refine((val) => {
      const num = Number(val);
      return num >= 0 && num <= 100;
    }, {
      message: "Discount must be between 0 and 100",
    }),

  gstPercentage: z
    .string()
    .trim()
    .min(1, "GST % is required") // Mandatory
    .regex(/^\d+(\.\d+)?$/, "Must be a valid number"),

  hsnCode: z
    .string()
    .trim()
    .min(1, "HSN Code is required") // Mandatory
    .regex(/^\d+$/, "Only numeric values are allowed"), // Digits only

});

