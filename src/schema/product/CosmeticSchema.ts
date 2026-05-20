/**
 * CosmeticSchema.ts
 *
 * Full Zod v4-compatible validation schema for the Cosmetic & Personal Care
 * product form.
 */

import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const positiveInt = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
      message: `${label} must be a positive integer`,
    });

const positiveNumber = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: `${label} must be greater than 0`,
    });

const optionalPercentage = z
  .string()
  .optional()
  .refine(
    (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
    { message: "Must be between 0 and 100" },
  );

const hsnRule = z
  .string()
  .min(1, "HSN code is required")
  .refine((v) => /^\d+$/.test(v.trim()), {
    message: "HSN code must contain numeric digits only",
  })
  .refine((v) => /^\d{4}$|^\d{6}$|^\d{8}$/.test(v.trim()), {
    message: "HSN code must be 4, 6, or 8 digits",
  });

// ─── Certification document (per certification) ───────────────────────────────

export const certificationDocSchema = z.object({
  id: z.string(),
  label: z.string(),
  tagCode: z.string(),
  file: z.instanceof(File).nullable(),
  fileName: z.string(),
  uploading: z.boolean(),
  isUploaded: z.boolean(),
  previewUrl: z.string().nullable(),
  productCertificateDocumentId: z.number(),
  existingUrl: z.string().optional(),
});

export type CertificationDocType = z.infer<typeof certificationDocSchema>;

// ─── Additional discount slab ─────────────────────────────────────────────────

export const additionalDiscountSlabSchema = z.object({
  minimumPurchaseQuantity: z.number().positive(),
  additionalDiscountPercentage: z.number().min(0).max(100),
  effectiveStartDate: z.string(),
  effectiveStartTime: z.string(),
  effectiveEndDate: z.string(),
  effectiveEndTime: z.string(),
});

// ─── Main cosmetic form schema ────────────────────────────────────────────────

export const cosmeticFormSchema = z
  .object({
    // ── Product identity ───────────────────────────────────────────────────
    productName: z
      .string()
      .min(1, "Product name is required")
      .min(3, "Product name must be at least 3 characters")
      .max(150, "Product name must not exceed 150 characters"),

    productTypeId: z.string().min(1, "Product type is required"),

    productSubTypeId: z.string().min(1, "Product sub-type is required"),

    brandName: z
      .string()
      .min(1, "Brand name is required")
      .max(60, "Brand name must not exceed 60 characters"),

    variantName: z
      .string()
      .max(60, "Variant name must not exceed 60 characters")
      .optional()
      .or(z.literal("")),

    gender: z.enum(["male", "female", "unisex"], {
      error: "Gender is required",
    }),

    // ── Multi-select fields ────────────────────────────────────────────────
    selectedIntendedUseAreas: z
      .array(z.string())
      .min(1, "At least one intended use area is required"),

    selectedSkinTypes: z.array(z.string()),

    selectedHairTypes: z.array(z.string()),

    selectedCertifications: z
      .array(certificationDocSchema)
      .min(1, "At least one certification / compliance is required"),

    // ── Composition ────────────────────────────────────────────────────────
    activeIngredients: z.string().min(1, "Active ingredients are required"),

    netQuantity: z
      .string()
      .min(1, "Net quantity is required")
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
        message: "Net quantity must be a positive number",
      }),

    netQuantityUnitId: z.string().min(1, "Net quantity unit is required"),

    productFormId: z.string().min(1, "Product form is required"),

    selectedAgeGroups: z
      .array(z.string())
      .min(1, "At least one age group is required"),

    productClaims: z.string().min(1, "Product claims are required"),

    warningsPrecautions: z
      .string()
      .min(1, "Warnings / precautions are required"),

    productDescription: z
      .string()
      .min(1, "Product description is required")
      .max(1000, "Product description must not exceed 1000 characters"),

    // ── Logistics ──────────────────────────────────────────────────────────
    storageConditionId: z.string().min(1, "Storage condition is required"),

    manufacturerName: z
      .string()
      .min(1, "Manufacturer name is required")
      .max(100, "Manufacturer name must not exceed 100 characters"),

    countryOfOriginId: z.string().min(1, "Country of origin is required"),

    // ── Packaging ──────────────────────────────────────────────────────────
    packTypeId: z.string().min(1, "Pack type is required"),

    unitsPerPack: positiveInt("Number of units per pack"),

    numberOfPacks: positiveInt("Number of packs"),

    packSize: z.string().optional(),

    minimumOrderQuantity: positiveInt("Minimum order quantity"),

    maximumOrderQuantity: positiveInt("Maximum order quantity"),

    // ── Batch / stock ──────────────────────────────────────────────────────
    batchNumber: z
      .string()
      .min(1, "Batch number is required")
      .regex(/^[a-zA-Z0-9]+$/, "Batch number must be alphanumeric only"),

    manufacturingDate: z
      .date({ error: "Manufacturing date is required" })
      .nullable()
      .refine((d) => d !== null, { message: "Manufacturing date is required" }),

    expiryDate: z
      .date({ error: "Expiry date is required" })
      .nullable()
      .refine((d) => d !== null, { message: "Expiry date is required" }),

    stockQuantity: positiveNumber("Stock quantity"),

    dateOfStockEntry: z.date().nullable().optional(),

    // ── Pricing ────────────────────────────────────────────────────────────
    sellingPrice: positiveNumber("Selling price"),

    mrp: positiveNumber("MRP"),

    discountPercentage: optionalPercentage,

    finalPrice: z.string().optional(),

    // ── Tax ────────────────────────────────────────────────────────────────
    gstPercentage: z.string().min(1, "GST percentage is required"),

    hsnCode: hsnRule,
  })
  // ── Cross-field validations ───────────────────────────────────────────────
  .superRefine((data, ctx) => {
    // Manufacturing date must not be in the future
    if (data.manufacturingDate) {
      const todayStr = new Date().toLocaleDateString("en-CA");
      const mfgStr = data.manufacturingDate.toISOString().split("T")[0];
      if (mfgStr > todayStr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manufacturingDate"],
          message: "Manufacturing date cannot be a future date",
        });
      }
    }

    // Expiry date must be after manufacturing date
    if (data.manufacturingDate && data.expiryDate) {
      if (data.expiryDate <= data.manufacturingDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expiryDate"],
          message: "Expiry date must be after manufacturing date",
        });
      }
    }

    // MRP must be >= selling price
    const mrp = parseFloat(data.mrp);
    const selling = parseFloat(data.sellingPrice);
    if (!isNaN(mrp) && !isNaN(selling) && mrp < selling) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mrp"],
        message: "MRP must be ≥ selling price",
      });
    }

    // Max order qty must be >= min order qty
    const minQ = Number(data.minimumOrderQuantity);
    const maxQ = Number(data.maximumOrderQuantity);
    if (!isNaN(minQ) && !isNaN(maxQ) && maxQ < minQ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maximumOrderQuantity"],
        message: "Maximum order quantity must be ≥ minimum order quantity",
      });
    }

    // Every selected certification must have a file or existingUrl
    const missing = data.selectedCertifications.find(
      (c) => !c.file && !c.existingUrl,
    );
    if (missing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedCertifications"],
        message: `Please upload the certificate file for "${missing.label}"`,
      });
    }
  });

// ─── Edit-mode schema (relaxes create-only required fields) ──────────────────

export const cosmeticFormEditSchema = cosmeticFormSchema
  .omit({
    productTypeId: true,
    productSubTypeId: true,
    batchNumber: true,
    manufacturingDate: true,
    expiryDate: true,
    stockQuantity: true,
    packTypeId: true,
    netQuantityUnitId: true,
    productFormId: true,
    selectedAgeGroups: true,
  })
  .extend({
    productTypeId: z.string().optional(),
    productSubTypeId: z.string().optional(),
    batchNumber: z.string().optional(),
    manufacturingDate: z.date().nullable().optional(),
    expiryDate: z.date().nullable().optional(),
    stockQuantity: z.string().optional(),
    packTypeId: z.string().optional(),
    netQuantityUnitId: z.string().optional(),
    productFormId: z.string().optional(),
    selectedAgeGroups: z.array(z.string()).optional(),
  });

// ─── Types ────────────────────────────────────────────────────────────────────

export type CosmeticFormValues = z.infer<typeof cosmeticFormSchema>;
export type CosmeticFormEditValues = z.infer<typeof cosmeticFormEditSchema>;

// ─── Validate helper ─────────────────────────────────────────────────────────

type ErrorMap = Record<string, string>;

/**
 * Flatten Zod v4 safe-parse result into a flat error map.
 */
function flattenZodErrors(
  result: ReturnType<typeof cosmeticFormSchema.safeParse>,
): ErrorMap {
  if (result.success) return {};
  // Zod v4: error.issues (not error.errors)
  const zodError = (result as { success: false; error: z.ZodError }).error;
  // Support both .issues (v4) and .errors (v3 fallback)
  const issues: Array<{ path: Array<string | number>; message: string }> =
    (zodError as unknown as { issues?: typeof issues }).issues ??
    (zodError as unknown as { errors?: typeof issues }).errors ??
    [];

  return issues.reduce<ErrorMap>((acc, issue) => {
    const key = issue.path.join(".");
    if (!acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
}

/**
 * Validate a cosmetic form payload.
 *
 * @param data   Raw form values
 * @param mode   "create" | "edit"
 * @returns      A flat error map. Empty object = valid.
 */
export function validateCosmeticForm(
  data: Record<string, unknown>,
  mode: "create" | "edit" = "create",
): ErrorMap {
  if (mode === "edit") {
    const result = cosmeticFormEditSchema.safeParse(data);
    return flattenZodErrors(
      result as ReturnType<typeof cosmeticFormSchema.safeParse>,
    );
  }
  const result = cosmeticFormSchema.safeParse(data);
  return flattenZodErrors(result);
}