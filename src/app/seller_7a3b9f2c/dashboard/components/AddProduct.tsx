"use client";

import React, { useState, useEffect } from "react";
import { DrugForm } from "./DrugForm";
import SupplementForm from "./SupplementForm";
import FoodInfantForm from "./FoodInfantForm";
import CosmeticForm from "./CosmeticForm";
import MedicalDevicesForm from "./MedicalDevicesForm";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";

interface ProductType {
  productTypeId: number;
  productTypeName: string;
}

// Scoped to the Add Product page only: tightens the shared form controls (the forms and Dropdown/Input
// components are also used elsewhere, so they are not edited directly).
const COMPACT_FORM_CSS = `
.add-product-compact label { font-size: 13px !important; line-height: 20px !important; font-weight: 600 !important; }
.add-product-compact input:not([type="checkbox"]):not([type="radio"]):not([type="file"]) {
  height: 40px !important; min-height: 40px !important; padding-top: 0 !important; padding-bottom: 0 !important; font-size: 14px !important;
}
.add-product-compact [class*="h-[52px]"] {
  height: 40px !important; min-height: 40px !important; max-height: 40px !important;
  padding-top: 0 !important; padding-bottom: 0 !important; font-size: 14px !important;
}
.add-product-compact textarea { font-size: 14px !important; }
.add-product-compact .h-12 { height: 40px !important; }
.add-product-compact .h-36 { height: 96px !important; }
.add-product-compact .w-13 { width: 40px !important; }
.add-product-compact .text-h4 { font-size: 18px !important; line-height: 26px !important; }
.add-product-compact [class*="rounded-xl"][class*="p-6"] { padding: 16px 20px !important; }
.add-product-compact .grid.pt-6 { padding-top: 14px !important; row-gap: 10px !important; column-gap: 20px !important; }
.add-product-compact .space-y-6 > :not(:last-child) { margin-bottom: 12px !important; }
.add-product-compact .mt-6 { margin-top: 14px !important; }
.add-product-compact [class*="w-35.25"] { font-size: 13px !important; }
/* Outline-only buttons (no fill): any filled primary/secondary button becomes a bordered purple button */
.add-product-compact button[class*="bg-primary-"],
.add-product-compact button[class*="bg-secondary-"],
.add-product-compact button[style*="159, 117, 252"],
.add-product-compact button[style*="75, 0, 130"] {
  background: transparent !important; color: #6C12A9 !important;
  border: 1.5px solid #6C12A9 !important; font-weight: 600 !important;
  transition: background-color .15s ease;
}
.add-product-compact button[class*="bg-primary-"]:hover:not(:disabled),
.add-product-compact button[class*="bg-secondary-"]:hover:not(:disabled),
.add-product-compact button[style*="159, 117, 252"]:hover:not(:disabled),
.add-product-compact button[style*="75, 0, 130"]:hover:not(:disabled) { background: #F8EDFF !important; }
.add-product-compact button[class*="bg-primary-"] img,
.add-product-compact button[class*="bg-secondary-"] img,
.add-product-compact [class*="bg-secondary-800"] img {
  filter: brightness(0) saturate(100%) invert(15%) sepia(95%) saturate(4500%) hue-rotate(274deg) brightness(80%);
}
.add-product-compact button[class*="border-warning-500"] { font-weight: 600 !important; }
.add-product-compact button[class*="border-warning-500"]:hover { background: #FFF1EE !important; }
/* upload icon boxes: soft tint with a border instead of a solid purple block */
.add-product-compact div[class*="bg-secondary-800"] { background: #F8EDFF !important; border-right: 1px solid #D9B8F0; border-radius: 0 !important; }
/* section card + heading */
.add-product-compact [class*="rounded-xl"][class*="p-6"] { box-shadow: 0 1px 2px rgba(16,24,40,.05); border-color: #E3E3E2 !important; }
.add-product-compact .text-h4 { border-left: 4px solid #6C12A9; padding-left: 10px; }
/* action bar */
.add-product-compact form > .flex.justify-between.mt-6 {
  margin-top: 16px !important; padding: 12px 16px; background: #fff; border: 1px solid #E3E3E2; border-radius: 12px;
  position: sticky; bottom: 0; z-index: 5; box-shadow: 0 -2px 8px rgba(16,24,40,.06);
}
/* ---- polish pass ---- */
.add-product-compact input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):focus,
.add-product-compact textarea:focus { border-color: #6C12A9 !important; box-shadow: 0 0 0 3px #F0E1FB !important; outline: none !important; }
.add-product-compact input:not([type="checkbox"]):not([type="radio"]):not([type="file"]),
.add-product-compact textarea { border-color: #D5D5D4 !important; border-radius: 8px !important; background: #fff; }
.add-product-compact [class*="text-h6"] { font-size: 16px !important; line-height: 24px !important; font-weight: 700 !important; border-left: 4px solid #6C12A9; padding-left: 10px; }
.add-product-compact [class*="text-h6"] span { font-size: 16px !important; }
.add-product-compact .h-40 { height: 96px !important; }
.add-product-compact [class*="w-285"] { width: calc(100% - 32px) !important; height: 72px !important; }
.add-product-compact [class*="w-285"] > div > img { width: 28px !important; height: 28px !important; }
.add-product-compact [class*="w-285"] .mt-4 { margin-top: 6px !important; }
.add-product-compact [class*="text-label-l3"] { font-size: 13px !important; }
.add-product-compact [class*="text-label-l2"] { font-size: 12px !important; }
/* Save Draft: replace the (white) icon image with a mask that follows the text colour */
.add-product-compact button img[src*="SaveDraftIcon"] { display: none !important; }
.add-product-compact button:has(img[src*="SaveDraftIcon"])::before {
  content: ""; width: 16px; height: 16px; flex-shrink: 0; background: currentColor;
  -webkit-mask: url(/icons/SaveDraftIcon.svg) center / contain no-repeat; mask: url(/icons/SaveDraftIcon.svg) center / contain no-repeat;
}
/* every action-bar button: same height, padding, type */
.add-product-compact form > div[class*="justify-between"][class*="pb-8"],
.add-product-compact form > .flex.justify-between.mt-6 {
  margin-top: 16px !important; padding: 12px 16px !important; background: #fff; border: 1px solid #E3E3E2; border-radius: 12px;
  position: sticky; bottom: 8px; z-index: 5; box-shadow: 0 -2px 10px rgba(16,24,40,.07); align-items: center;
}
.add-product-compact form > div[class*="justify-between"][class*="pb-8"] button,
.add-product-compact form > .flex.justify-between.mt-6 button {
  height: 38px !important; min-height: 38px !important; width: auto !important; min-width: 104px;
  padding: 0 18px !important; font-size: 13px !important; line-height: 18px !important;
  border-radius: 8px !important; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
}
.add-product-compact form > div[class*="justify-between"][class*="pb-8"] button[style*="159, 117, 252"],
.add-product-compact form > div[class*="justify-between"][class*="pb-8"] button[style*="75, 0, 130"] { border: 1.5px solid #6C12A9 !important; }
.add-product-compact form > div[class*="pb-8"] button[class*="border-red"] { border: 1.5px solid #F04438 !important; color: #D92D20 !important; }
.add-product-compact form > div[class*="pb-8"] { padding-bottom: 12px !important; }
.add-product-compact button:disabled { opacity: .5 !important; cursor: not-allowed; }
/* visible keyboard focus on every button / custom control (Tab navigation) */
.add-product-compact button:focus-visible,
.add-product-compact [role="button"]:focus-visible,
.add-product-compact [role="combobox"]:focus-visible { outline: 2px solid #6C12A9 !important; outline-offset: 2px; }
.add-product-compact input[type="checkbox"]:focus-visible,
.add-product-compact input[type="radio"]:focus-visible { outline: 2px solid #6C12A9; outline-offset: 2px; }
`;

const AddProduct = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableProductTypes, setAvailableProductTypes] = useState<string[]>([]);
  const [productTypeMap, setProductTypeMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const allCategories = [
    "Drugs",
    "Supplements/ Nutraceuticals",
    "Food & Infant Nutrition",
    "Cosmetic & Personal Care",
    "Medical Devices & Equipment",
  ];

  useEffect(() => {
    const fetchSellerProductTypes = async () => {
      try {
        setLoading(true);
        const profile = await sellerProfileService.getCurrentSellerProfile();

        const productTypeNames = profile.productTypes.map(
          (pt: ProductType) => pt.productTypeName
        );

        const mapping: Record<string, number> = {};
        profile.productTypes.forEach((pt: ProductType) => {
          mapping[pt.productTypeName] = pt.productTypeId;
        });

        setProductTypeMap(mapping);
        setAvailableProductTypes(productTypeNames);

        if (productTypeNames.length > 0) {
          setSelectedCategories([productTypeNames[0]]);
          setShowForm(true);
        }
      } catch (error) {
        console.error("Error fetching seller product types:", error);
        setAvailableProductTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProductTypes();
  }, []);

  const handleCategoryClick = (category: string) => {
    if (!availableProductTypes.includes(category)) return;
    setSelectedCategories([category]);
    setShowForm(true);
  };

  const isAvailable = (category: string) => {
    return (
      availableProductTypes.length === 0 ||
      availableProductTypes.includes(category)
    );
  };

  const isSelected = (category: string) => {
    return selectedCategories.includes(category);
  };

  const selectedCategory = selectedCategories[0];

  const getCategoryButtonStyle = (category: string): React.CSSProperties => {
    const available = isAvailable(category);
    const selected = isSelected(category);

    const base: React.CSSProperties = {
      height: 34,
      minHeight: 34,
      borderRadius: 8,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      border: "none",
      cursor: available ? "pointer" : "not-allowed",
      transition: "all 0.2s",
      padding: 0,
    };

    if (selected && available) {
      // Active — border highlight only (no fill)
      return {
        ...base,
        background: "#FFFFFF",
        outline: "2px solid #6C12A9",
        outlineOffset: "-1px",
      };
    }

    if (!available) {
      // Disabled — Tonal with neutral-100 background
      return {
        ...base,
        background: "transparent",
        outline: "1px dashed #D5D5D4",
        outlineOffset: "-1px",
        opacity: 1,
      };
    }

    // Available but not selected — Outline with Secondary-500 border
    return {
      ...base,
      background: "transparent",
      outline: "1px solid #C9B2F5",
      outlineOffset: "-1px",
    };
  };

  const getCategoryLabelStyle = (category: string): React.CSSProperties => {
    const available = isAvailable(category);
    const selected = isSelected(category);

    const base: React.CSSProperties = {
      fontSize: 13,
      fontFamily: "'Open Sans', sans-serif",
      fontWeight: 600,
      lineHeight: "18px",
      wordWrap: "break-word",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    };

    if (selected && available) {
      return { ...base, color: "#6C12A9", fontWeight: 700 };
    }

    if (!available) {
      return {
        ...base,
        color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)",
        opacity: 0.38,
      };
    }

    // Hovered/outline — Secondary-500
    return {
      ...base,
      color: "#6C12A9",
    };
  };

  const getCategoryInnerStyle = (category: string): React.CSSProperties => {
    return {
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 4,
      paddingBottom: 4,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
    };
  };

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 24,
          display: "inline-flex",
        }}
      >
        <div
          style={{
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: 4,
            display: "flex",
          }}
        >
          <div
            style={{
              color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)",
              fontSize: 24,
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 700,
              lineHeight: "32px",
              wordWrap: "break-word",
            }}
          >
            Add Product
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 48,
              paddingBottom: 48,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                borderBottom: "2px solid #9659FD",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="add-product-compact"
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: 14,
        display: "inline-flex",
      }}
    >
      <style>{COMPACT_FORM_CSS}</style>
      <div
        style={{
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 4,
          display: "flex",
        }}
      >
        {/* Title */}
        <div
          style={{
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: 4,
            display: "inline-flex",
          }}
        >
          <div
            style={{
              color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)",
              fontSize: 24,
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 700,
              lineHeight: "32px",
              wordWrap: "break-word",
            }}
          >
            Add Product
          </div>
        </div>

        {/* Category Buttons */}
        <div
          style={{
            alignSelf: "stretch",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: 10,
            display: "inline-flex",
            flexWrap: "wrap",
            marginTop: 10,
          }}
        >
          {allCategories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              disabled={!isAvailable(category)}
              style={getCategoryButtonStyle(category)}
            >
              <div style={getCategoryInnerStyle(category)}>
                <div
                  style={{
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 10,
                    display: "flex",
                  }}
                >
                  <div style={getCategoryLabelStyle(category)}>{category}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form Rendering */}
      {showForm && selectedCategory && (
        <>
          {selectedCategory === "Drugs" && (
            <DrugForm categoryId={productTypeMap["Drugs"]} />
          )}
          {selectedCategory === "Supplements/ Nutraceuticals" && (
            <SupplementForm categoryId={productTypeMap["Supplements/ Nutraceuticals"]} />
          )}
          {selectedCategory === "Food & Infant Nutrition" && (
            <FoodInfantForm />
          )}
          {selectedCategory === "Cosmetic & Personal Care" && (
            <CosmeticForm />
          )}
          {selectedCategory === "Medical Devices & Equipment" && (
            <MedicalDevicesForm />
          )}
        </>
      )}

      {!showForm && availableProductTypes.length === 0 && (
        <div
          style={{
            textAlign: "center",
            paddingTop: 48,
            paddingBottom: 48,
            color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)",
            opacity: 0.5,
            fontFamily: "'Open Sans', sans-serif",
          }}
        >
          <p style={{ fontSize: 18, margin: 0 }}>
            No product types available for your account.
          </p>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            Please contact support to add product types.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddProduct;