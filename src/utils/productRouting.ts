// Shared helpers for deciding which seller form/view a product belongs to, and for
// treating placeholder file values from the product-service as "no file".

export type EditViewKey =
  | "editDrug"
  | "editSupplement"
  | "editFoodInfant"
  | "editCosmetic"
  | "editConsumable"
  | "editNonConsumable";

// product-service category ids -> edit route key (the `?category=` query value)
export const CATEGORY_EDIT_KEY: Record<number, EditViewKey> = {
  1: "editDrug",
  2: "editSupplement",
  3: "editFoodInfant",
  4: "editCosmetic",
  5: "editConsumable",
  6: "editNonConsumable",
};

export const EDIT_KEY_CATEGORY: Record<EditViewKey, number> = {
  editDrug: 1,
  editSupplement: 2,
  editFoodInfant: 3,
  editCosmetic: 4,
  editConsumable: 5,
  editNonConsumable: 6,
};

export const isEditViewKey = (v: unknown): v is EditViewKey =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(EDIT_KEY_CATEGORY, v);

const hasItems = (v: unknown) => Array.isArray(v) ? v.length > 0 : !!v;

/**
 * Resolves the category (1-6) of a product API object. Uses `categoryId` when it is a valid
 * category (the API may return it as a string or omit it), otherwise falls back to
 * whichever attribute collection is populated.
 */
export const resolveProductCategoryId = (product: any): number | null => {
  if (!product) return null;
  const n = Number(product.categoryId);
  if (Number.isInteger(n) && n >= 1 && n <= 6) return n;
  if (hasItems(product.productAttributeDrugs)) return 1;
  if (hasItems(product.productAttributeSupplementsOrNutraceuticals)) return 2;
  if (hasItems(product.productAttributeFoodInfants)) return 3;
  if (hasItems(product.productAttributeCosmeticAndPersonalUse)) return 4;
  if (hasItems(product.productAttributeConsumableMedicals)) return 5;
  if (hasItems(product.productAttributeNonConsumableMedicals)) return 6;
  return null;
};

export const editKeyForProduct = (product: any): EditViewKey | null => {
  const id = resolveProductCategoryId(product);
  return id ? CATEGORY_EDIT_KEY[id] : null;
};

export const editUrlFor = (productId: string, key: EditViewKey): string =>
  `/seller_7a3b9f2c/products/edit/${productId}?category=${key}`;

const PLACEHOLDER_FILE_VALUES = ["", "PENDING", "NOT_UPLOADED", "TO_UPLOAD", "NULL", "UNDEFINED"];

/** True when `url` points at a real stored file (not a placeholder status or a blob: preview). */
export const isRealFileUrl = (url: unknown): url is string => {
  if (typeof url !== "string") return false;
  const t = url.trim().toUpperCase();
  return !PLACEHOLDER_FILE_VALUES.includes(t) && !t.startsWith("BLOB:");
};
