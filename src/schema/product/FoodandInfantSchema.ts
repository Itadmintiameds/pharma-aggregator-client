import { z } from "zod";

const positiveInteger = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^[1-9]\d*$/, "Only positive integers are allowed");

const decimalNumber = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^\d+(\.\d+)?$/, "Only numeric values are allowed");

// Brand Name - only alphabets, numbers, spaces, and hyphens, max 60 characters
const brandNameSchema = z
  .string()
  .trim()
  .min(3, "Brand Name must be at least 3 characters")
  .max(60, "Brand Name must not exceed 60 characters")
  .regex(/^[a-zA-Z0-9\s-]+$/, 
    "Brand Name allows alphabets, numbers, spaces, and hyphens only");

const alphanumericWithSpecialChars = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Maximum 100 characters allowed") 
  .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Invalid characters used");

const descriptionText = z
  .string()
  .trim()
  .min(10, "Product Description must be at least 10 characters")
  .max(1000, "Maximum 1000 characters allowed")
  .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?\n\r]*$/, "Invalid characters used");

const quantityWithMaxLength = z
  .string()
  .trim()
  .min(1, "Required")
  .max(20, "Maximum 20 characters allowed") 
  .regex(/^[a-zA-Z0-9\s]+$/, "Only alphanumeric characters and spaces are allowed");

export const foodInfantSchema = z
  .object({
    productName: z
      .string()
      .min(3, "Product Name must be at least 3 characters")
      .max(150, "Product Name must not exceed 150 characters")
      .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, 
        "Product Name can contain alphanumeric and special characters"),

    productCategory: z.string().min(1, "Product category is required"),
    productSubcategory: z.string().min(1, "Product subcategory is required"),
    brandName: brandNameSchema,
    variantName: z
      .string()
      .trim()
      .max(60, "Variant Name must not exceed 60 characters")
      .optional()
      .transform(val => val === "" ? undefined : val), 
    productForm: z.string().min(1, "Product form is required"),
    netQuantityValue: z
      .string()
      .min(1, "Net Quantity is required")
      .regex(/^\d+(\.\d+)?$/, "Net Quantity must be a positive number"),
    netQuantityUnit: z.string().min(1, "Please select a unit"),
    servingSizeValue: z
      .string()
      .min(1, "Serving Size is required")
      .regex(/^\d+(\.\d+)?$/, "Serving Size must be a positive number"),
    servingSizeUnit: z.string().min(1, "Please select a unit"),
    ageGroup: z.array(z.string()).min(1, "At least one age group is required"),

    dietaryClassification: z
      .string()
      .min(1, "Dietary classification is required")
      .refine((val) => ["veg", "non-veg"].includes(val), {
        message: "Dietary classification must be 'veg' or 'non-veg'",
      }),

    allergenInformation: z
      .string()
      .trim()
      .min(3, "Allergen Information must be at least 3 characters") 
      .max(500, "Maximum 500 characters allowed")
      .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Invalid characters used"),

    nutritionalInfoType: z
      .string()
      .min(1, "Nutritional info type is required")
      .refine((val) => ["as-per-label", "image-upload"].includes(val), {
        message: "Nutritional info type must be 'as-per-label' or 'image-upload'",
      }),

    nutritionalInfoImage: z.any().optional(),
    activeIngredients: z.string().min(1, "Active ingredients are required"),
    additivesPreservatives: z.string().min(1, "Additives/Preservatives are required"),
    productClaims: z.string().min(1, "Product claims are required"),
    storageConditionId: z.union([
      z.string().min(1, "Storage condition is required"),
      z.number().min(1, "Storage condition is required")
    ]).transform(val => String(val)),
    manufacturerName: alphanumericWithSpecialChars,
    countryOfOrigin: z.string().min(1, "Country of origin is required"),
    productDescription: descriptionText,
    warningsPrecautions: descriptionText,
    brochureType: z.string().optional(),
    brochureUrl: z.string().optional(),
    manualFile: z.any().optional(),

    packType: z.string().min(1, "Pack type is required"),
    unitsPerPack: positiveInteger,
    numberOfPacks: positiveInteger,
    packSize: z.string().optional(),
    minimumOrderQuantity: positiveInteger,
    maximumOrderQuantity: positiveInteger,

    batchLotNumber: z
      .string()
      .trim()
      .min(3, "Batch/Lot Number must be at least 3 characters")
      .max(20, "Batch/Lot Number must not exceed 20 characters")
      .regex(/^[a-zA-Z0-9]+$/, "Only alphanumeric characters are allowed"),

    manufacturingDate: z.preprocess(
      (arg) => {
        if (arg instanceof Date && !isNaN(arg.getTime())) return arg;
        if (typeof arg === "string" && arg !== "") return new Date(arg);
        return null;
      },
      z.date().nullable().refine((val) => val !== null, {
        message: "Manufacturing date is required",
      })
    ),

    expiryDate: z.preprocess(
      (arg) => {
        if (arg instanceof Date && !isNaN(arg.getTime())) return arg;
        if (typeof arg === "string" && arg !== "") return new Date(arg);
        return null;
      },
      z.date().nullable().refine((val) => val !== null, {
        message: "Expiry date is required",
      })
    ),

    shelfLifeMonths: z.string().optional(),
    stockQuantity: positiveInteger,
    dateOfStockEntry: z.date(),

    mrp: decimalNumber.refine((val) => Number(val) > 0, { message: "MRP must be greater than 0" }),
    sellingPricePerPack: decimalNumber.refine((val) => Number(val) > 0, { message: "Selling price must be greater than 0" }),
    discountPercentage: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => {
          if (!val || val === "") return true;
          const num = Number(val);
          return !isNaN(num) && num >= 0 && num <= 100;
        },
        { message: "Discount must be between 0 and 100" }
      ),
    additionalDiscountName: z.string().optional(),
    additionalDiscountValue: z.string().optional(),

    gstPercentage: z
      .string()
      .trim()
      .min(1, "GST % is required")
      .regex(/^\d+(\.\d+)?$/, "Only numeric values are allowed")
      .refine((val) => Number(val) >= 0 && Number(val) <= 100, {
        message: "GST must be between 0 and 100",
      }),

    hsnCode: z
      .string()
      .trim()
      .min(1, "HSN Code is required")
      .regex(/^\d+$/, "Only numeric values are allowed")
      .refine((val) => [4, 6, 8].includes(val.length), {
        message: "HSN Code must be 4, 6, or 8 digits only",
      }),

    finalPrice: z.string().optional(),

    images: z
      .array(z.union([z.instanceof(File), z.string()]))
      .min(1, "Product Image is mandatory.")
      .max(5, "Maximum 5 images are allowed")
      .refine(
        (files) =>
          files.every((file) =>
            typeof file === "string" ||
            ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"].includes(file.type)
          ),
        { message: "Only JPG, JPEG, PNG, SVG formats are allowed" }
      )
      .refine(
        (files) =>
          files.every((file) =>
            typeof file === "string" || file.size <= 5 * 1024 * 1024
          ),
        { message: "Each image must be less than 5MB" }
      ),

    certifications: z
      .array(
        z.object({
          certificationId: z.number(),
          certificateFileUrl: z.string().optional(),
          certificateFileName: z.string().optional(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Cross-field validation: Serving Size cannot exceed Net Quantity
    const netQty = Number(data.netQuantityValue);
    const servingSize = Number(data.servingSizeValue);
    if (!isNaN(netQty) && !isNaN(servingSize) && servingSize > netQty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["servingSizeValue"],
        message: "Serving Size cannot exceed Net Quantity",
      });
    }

    // Shelf life validation (cannot exceed 5 years = 60 months)
    if (data.shelfLifeMonths) {
      const shelfLife = Number(data.shelfLifeMonths);
      if (!isNaN(shelfLife) && shelfLife > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["shelfLifeMonths"],
          message: "Shelf life cannot exceed 5 years (60 months)",
        });
      }
    }

    // Manufacturing date validation
    if (data.manufacturingDate) {
      const today = new Date();
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(today.getFullYear() - 3);
      
      if (data.manufacturingDate > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manufacturingDate"],
          message: "Manufacturing date cannot be in the future",
        });
      }
      
      if (data.manufacturingDate < threeYearsAgo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manufacturingDate"],
          message: "Manufacturing date cannot be more than 3 years old",
        });
      }
    }
    
    // Expiry date validation
    if (data.expiryDate) {
      const today = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(today.getMonth() + 3);
      
      if (data.manufacturingDate && data.expiryDate < data.manufacturingDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expiryDate"],
          message: "Expiry date cannot be less than manufacturing date",
        });
      }
      
      if (data.expiryDate < threeMonthsFromNow) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expiryDate"],
          message: "Expiry date must be at least 3 months from today",
        });
      }
    }
  });
  
  
  
  
  
  
  
  // old schema dated 20.05.2026............
  
  // import { z } from "zod";

// const positiveInteger = z
//   .string()
//   .trim()
//   .min(1, "Required")
//   .regex(/^[1-9]\d*$/, "Only positive integers are allowed");

// const decimalNumber = z
//   .string()
//   .trim()
//   .min(1, "Required")
//   .regex(/^\d+(\.\d+)?$/, "Only numeric values are allowed");

// // Updated to match product name schema (allows special characters, min 3, max 150)
// const brandNameSchema = z
//   .string()
//   .trim()
//   .min(3, "Brand Name must be at least 3 characters")
//   .max(150, "Brand Name must not exceed 150 characters")
//   .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, 
//     "Brand Name can contain alphanumeric and special characters");

// const alphanumericWithSpecialChars = z
//   .string()
//   .trim()
//   .min(1, "Required")
//   .max(100, "Maximum 100 characters allowed") 
//   .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Invalid characters used");

// const descriptionText = z
//   .string()
//   .trim()
//   .min(10, "Product Description must be at least 10 characters")
//   .max(1000, "Maximum 1000 characters allowed")
//   .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?\n\r]*$/, "Invalid characters used");

// const quantityWithMaxLength = z
//   .string()
//   .trim()
//   .min(1, "Required")
//   .max(20, "Maximum 20 characters allowed") 
//   .regex(/^[a-zA-Z0-9\s]+$/, "Only alphanumeric characters and spaces are allowed");

// // Helper function to validate dates
// const validateManufacturingDate = (date: Date | null): boolean => {
//   if (!date) return true;
//   const today = new Date();
//   const threeYearsAgo = new Date();
//   threeYearsAgo.setFullYear(today.getFullYear() - 3);
//   return date <= today && date >= threeYearsAgo;
// };

// const validateExpiryDate = (expiryDate: Date | null, manufacturingDate: Date | null): boolean => {
//   if (!expiryDate) return true;
//   const today = new Date();
//   const threeMonthsFromNow = new Date();
//   threeMonthsFromNow.setMonth(today.getMonth() + 3);
  
//   if (manufacturingDate && expiryDate < manufacturingDate) return false;
//   if (expiryDate < threeMonthsFromNow) return false;
//   return true;
// };

// export const foodInfantSchema = z
//   .object({
//     productName: z
//       .string()
//       .min(3, "Product Name must be at least 3 characters")
//       .max(150, "Product Name must not exceed 150 characters")
//       .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, 
//         "Product Name can contain alphanumeric and special characters"),

//     productCategory: z.string().min(1, "Product category is required"),
//     productSubcategory: z.string().min(1, "Product subcategory is required"),
//     brandName: brandNameSchema,
//     variantName: z
//       .string()
//       .trim()
//       .max(60, "Variant Name must not exceed 60 characters")
//       .optional()
//       .transform(val => val === "" ? undefined : val), 
//     productForm: z.string().min(1, "Product form is required"),
//     netQuantity: quantityWithMaxLength,
//     servingSize: quantityWithMaxLength,
//     ageGroup: z.string().min(1, "Age group is required"),

//     dietaryClassification: z
//       .string()
//       .min(1, "Dietary classification is required")
//       .refine((val) => ["veg", "non-veg"].includes(val), {
//         message: "Dietary classification must be 'veg' or 'non-veg'",
//       }),

//     allergenInformation: z
//       .string()
//       .trim()
//       .min(3, "Allergen Information must be at least 3 characters") 
//       .max(500, "Maximum 500 characters allowed")
//       .regex(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Invalid characters used"),

//     nutritionalInfoType: z
//       .string()
//       .min(1, "Nutritional info type is required")
//       .refine((val) => ["as-per-label", "image-upload"].includes(val), {
//         message: "Nutritional info type must be 'as-per-label' or 'image-upload'",
//       }),

//     nutritionalInfoImage: z.any().optional(),
//     activeIngredients: z.string().min(1, "Active ingredients are required"),
//     additivesPreservatives: z.string().min(1, "Additives/Preservatives are required"),
//     productClaims: z.string().min(1, "Product claims are required"),
//     storageConditionId: z.union([
//       z.string().min(1, "Storage condition is required"),
//       z.number().min(1, "Storage condition is required")
//     ]).transform(val => String(val)),
//     manufacturerName: alphanumericWithSpecialChars,
//     countryOfOrigin: z.string().min(1, "Country of origin is required"),
//     productDescription: descriptionText,
//     warningsPrecautions: descriptionText,
//     brochureType: z.string().optional(),
//     brochureUrl: z.string().optional(),
//     manualFile: z.any().optional(),

//     packaging: z.object({
//       packType: z.string().min(1, "Pack type is required"),
//       unitsPerPack: positiveInteger,
//       numberOfPacks: positiveInteger,
//       minimumOrderQuantity: positiveInteger,
//       maximumOrderQuantity: positiveInteger,
//     }).optional(),

//     packType: z.string().min(1, "Pack type is required"),
//     unitsPerPack: positiveInteger,
//     numberOfPacks: positiveInteger,
//     packSize: z.string().optional(),
//     minimumOrderQuantity: positiveInteger,
//     maximumOrderQuantity: positiveInteger,

//     batchLotNumber: z
//       .string()
//       .trim()
//       .min(3, "Batch/Lot Number must be at least 3 characters")
//       .max(20, "Batch/Lot Number must not exceed 20 characters")
//       .regex(/^[a-zA-Z0-9]+$/, "Only alphanumeric characters are allowed"),

//     manufacturingDate: z.preprocess(
//       (arg) => {
//         if (arg instanceof Date && !isNaN(arg.getTime())) return arg;
//         if (typeof arg === "string" && arg !== "") return new Date(arg);
//         return null;
//       },
//       z.date().nullable().refine((val) => val !== null, {
//         message: "Manufacturing date is required",
//       })
//     ),

//     expiryDate: z.preprocess(
//       (arg) => {
//         if (arg instanceof Date && !isNaN(arg.getTime())) return arg;
//         if (typeof arg === "string" && arg !== "") return new Date(arg);
//         return null;
//       },
//       z.date().nullable().refine((val) => val !== null, {
//         message: "Expiry date is required",
//       })
//     ),

//     shelfLifeMonths: z.string().optional(),
//     stockQuantity: positiveInteger,
//     dateOfStockEntry: z.date(),

//     mrp: decimalNumber.refine((val) => Number(val) > 0, { message: "MRP must be greater than 0" }),
//     sellingPricePerPack: decimalNumber.refine((val) => Number(val) > 0, { message: "Selling price must be greater than 0" }),
//     discountPercentage: z
//       .string()
//       .trim()
//       .optional()
//       .refine(
//         (val) => {
//           if (!val || val === "") return true;
//           const num = Number(val);
//           return !isNaN(num) && num >= 0 && num <= 100;
//         },
//         { message: "Discount must be between 0 and 100" }
//       ),
//     additionalDiscountName: z.string().optional(),
//     additionalDiscountValue: z.string().optional(),

//     gstPercentage: z
//       .string()
//       .trim()
//       .min(1, "GST % is required")
//       .regex(/^\d+(\.\d+)?$/, "Only numeric values are allowed")
//       .refine((val) => Number(val) >= 0 && Number(val) <= 100, {
//         message: "GST must be between 0 and 100",
//       }),

//     hsnCode: z
//       .string()
//       .trim()
//       .min(1, "HSN Code is required")
//       .regex(/^\d+$/, "Only numeric values are allowed")
//       .refine((val) => [4, 6, 8].includes(val.length), {
//         message: "HSN Code must be 4, 6, or 8 digits only",
//       }),

//     finalPrice: z.string().optional(),

//     images: z
//       .array(z.union([z.instanceof(File), z.string()]))
//       .min(1, "Product Image is mandatory.")
//       .max(5, "Maximum 5 images are allowed")
//       .refine(
//         (files) =>
//           files.every((file) =>
//             typeof file === "string" ||
//             ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"].includes(file.type)
//           ),
//         { message: "Only JPG, JPEG, PNG, SVG formats are allowed" }
//       )
//       .refine(
//         (files) =>
//           files.every((file) =>
//             typeof file === "string" || file.size <= 5 * 1024 * 1024
//           ),
//         { message: "Each image must be less than 5MB" }
//       ),

//     certifications: z
//       .array(
//         z.object({
//           certificationId: z.number(),
//           certificateFileUrl: z.string().optional(),
//           certificateFileName: z.string().optional(),
//         })
//       )
//       .optional(),
//   })
//   // SuperRefine for cross-field date validations
//   .superRefine((data, ctx) => {
//     // Manufacturing date validation
//     if (data.manufacturingDate) {
//       const today = new Date();
//       const threeYearsAgo = new Date();
//       threeYearsAgo.setFullYear(today.getFullYear() - 3);
      
//       if (data.manufacturingDate > today) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ["manufacturingDate"],
//           message: "Manufacturing date cannot be in the future",
//         });
//       }
      
//       if (data.manufacturingDate < threeYearsAgo) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ["manufacturingDate"],
//           message: "Manufacturing date cannot be more than 3 years old",
//         });
//       }
//     }
    
//     // Expiry date validation
//     if (data.expiryDate) {
//       const today = new Date();
//       const threeMonthsFromNow = new Date();
//       threeMonthsFromNow.setMonth(today.getMonth() + 3);
      
//       if (data.manufacturingDate && data.expiryDate < data.manufacturingDate) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ["expiryDate"],
//           message: "Expiry date cannot be less than manufacturing date",
//         });
//       }
      
//       if (data.expiryDate < threeMonthsFromNow) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ["expiryDate"],
//           message: "Expiry date must be at least 3 months from today",
//         });
//       }
//     }
//   });