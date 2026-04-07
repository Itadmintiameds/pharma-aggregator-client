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
  const [loading, setLoading] = useState(true);

  const allCategories = [
    "Drugs",
    "Supplements / Nutraceuticals",
    "Food & Infant Nutrition",
    "Cosmetic & Personal Care",
    "Medical Devices & Equipment",
  ];

  useEffect(() => {
    const fetchSellerProductTypes = async () => {
      try {
        setLoading(true);
        const profile = await sellerProfileService.getCurrentSellerProfile();
        
        // Extract product type names from seller profile
        const productTypeNames = profile.productTypes.map(
          (pt: ProductType) => pt.productTypeName
        );
        
        console.log('Available product types for seller:', productTypeNames);
        setAvailableProductTypes(productTypeNames);
        
        // Auto-select and show the first available form
        if (productTypeNames.length > 0) {
          setSelectedCategories([productTypeNames[0]]);
          setShowForm(true);
        }
      } catch (error) {
        console.error('Error fetching seller product types:', error);
        // Fallback to empty array if there's an error
        setAvailableProductTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProductTypes();
  }, []);

  const handleCategoryClick = (category: string) => {
    // Check if category is available
    if (!availableProductTypes.includes(category)) {
      return; // Don't allow selection of unavailable categories
    }

    // Single select - replace current selection
    setSelectedCategories([category]);
    setShowForm(true);
  };

  const isAvailable = (category: string) => {
    return availableProductTypes.length === 0 || availableProductTypes.includes(category);
  };

  const isSelected = (category: string) => {
    return selectedCategories.includes(category);
  };

  const FORM_COMPONENTS: Record<string, React.ReactNode> = {
    "Drugs": <DrugForm />,
    "Supplements / Nutraceuticals": <SupplementForm />,
    "Food & Infant Nutrition": <FoodInfantForm />,
    "Cosmetic & Personal Care": <CosmeticForm />,
    "Medical Devices & Equipment": <MedicalDevicesForm />,
  };

  const selectedCategory = selectedCategories[0]; // single select

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-h2 font-normal">Add Product</div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-h2 font-normal">Add Product</div>

        {/* Category Buttons - Integrated directly */}
        <div className="flex flex-wrap gap-3 mt-4">
          {allCategories.map((category) => {
            const available = isAvailable(category);
            const selected = isSelected(category);

            return (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                disabled={!available}
                className={`
                  px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  ${
                    selected && available
                      ? "bg-purple-600 text-white shadow-md hover:bg-purple-700"
                      : available
                      ? "bg-purple-50 text-purple-700 border-2 border-purple-200 hover:bg-purple-100 hover:border-purple-300"
                      : "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed opacity-60"
                  }
                `}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {showForm && selectedCategory && FORM_COMPONENTS[selectedCategory]}
      
      {!showForm && availableProductTypes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No product types available for your account.</p>
          <p className="text-sm mt-2">Please contact support to add product types.</p>
        </div>
      )}
    </div>
  );
};

export default AddProduct;