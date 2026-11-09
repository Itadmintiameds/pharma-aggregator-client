// The 6 top-level product categories (`tm_category`) shown on the storefront. Same ids the backend uses for
// product.categoryId and the search `categoryId` filter - see categoryMap in
// seller_7a3b9f2c/dashboard/components/ProductList.tsx.
//
// `name` is the label shown to buyers; `facetName` is the category name exactly as product-service stores it
// (tm_category.category_name) and therefore as it appears in the search `categoryName` facet. They differ for
// cosmetics, so counts must be looked up by facetName.
export const STOREFRONT_CATEGORIES = [
  { id: 1, name: "Drugs", facetName: "Drugs" },
  { id: 2, name: "Supplements / Nutraceuticals", facetName: "Supplements / Nutraceuticals" },
  { id: 3, name: "Food & Infant Nutrition", facetName: "Food & Infant Nutrition" },
  { id: 4, name: "Cosmetic & Personal Care", facetName: "Cosmetic & Personal Use" },
  { id: 5, name: "Consumable Medical Devices & Equipment", facetName: "Consumable Medical Devices & Equipment" },
  { id: 6, name: "Non-Consumable Medical Devices & Equipment", facetName: "Non-Consumable Medical Devices & Equipment" },
] as const;
