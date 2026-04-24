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
      height: 40,
      minHeight: 40,
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
      // Pressed / Active — Tonal filled with Secondary-600
      return {
        ...base,
        background: "var(--Colors-Secondary-Secondary-600, #9659FD)",
      };
    }

    if (!available) {
      // Disabled — Tonal with neutral-100 background
      return {
        ...base,
        background: "var(--Colors-Primary-Neutral-pneutral-100, #EAEAE9)",
        opacity: 1,
      };
    }

    // Available but not selected — Outline with Secondary-500 border
    return {
      ...base,
      background: "transparent",
      outline: "2px solid var(--Colors-Secondary-Secondary-500, #9F75FC)",
      outlineOffset: "-1px",
    };
  };

  const getCategoryLabelStyle = (category: string): React.CSSProperties => {
    const available = isAvailable(category);
    const selected = isSelected(category);

    const base: React.CSSProperties = {
      fontSize: 14,
      fontFamily: "'Open Sans', sans-serif",
      fontWeight: 600,
      lineHeight: "20px",
      wordWrap: "break-word",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    };

    if (selected && available) {
      return { ...base, color: "var(--Colors-Shades-white, white)" };
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
      color: "var(--Colors-Secondary-Secondary-500, #9F75FC)",
    };
  };

  const getCategoryInnerStyle = (category: string): React.CSSProperties => {
    return {
      paddingLeft: 12,
      paddingRight: 12,
      paddingTop: 6,
      paddingBottom: 6,
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
              fontSize: 38,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 400,
              lineHeight: "42px",
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
              fontSize: 38,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 400,
              lineHeight: "42px",
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
            gap: 16,
            display: "inline-flex",
            flexWrap: "wrap",
            marginTop: 16,
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
            <SupplementForm />
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