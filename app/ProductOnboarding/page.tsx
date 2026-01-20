"use client";

import React, { useState } from 'react';
import './product.css';
import ConsumableProductForm from './ConsumableProductForm';
import NonConsumableProductForm from './NonConsumableProductForm';

type ProductType = 'consumable' | 'non-consumable';

export interface BaseFormData {
  // Common fields
  productCategory: string;
  therapeuticCategory: string;
  subCategory: string;
  productName: string;
  productDescription: string;
  warnings: string;
  productImage: File | null;
  
  // Packaging & Order Details
  packagingUnit: string;
  moq: string;
  maxOrderQuantity: string;
  
  // Stock, Pricing & Tax Details
  stockQuantity: string;
  dateOfEntry: string;
  pricePerUnit: string;
  discountPercentage: string;
  gstPercentage: string;
  hsnCode: string;
}

export interface FormErrors {
  [key: string]: string;
}

function ProductOnboarding() {
  const [productType, setProductType] = useState<ProductType>('consumable');

  return (
    <div className="po-seller-register-container">
      {/* Product Type Toggle */}
      <div className="po-product-type-toggle">
        <div className="po-toggle-header">
          <h3>Product Type Selection</h3>
          <p className="po-toggle-subtitle">Select the type of product you want to register</p>
        </div>
        <div className="po-toggle-buttons">
          <button
            type="button"
            className={`po-toggle-btn ${productType === 'consumable' ? 'po-active' : ''}`}
            onClick={() => setProductType('consumable')}
          >
            <i className="fas fa-pills"></i>
            <span>Consumables</span>
            {productType === 'consumable' && <span className="po-badge">Default</span>}
          </button>
          <button
            type="button"
            className={`po-toggle-btn ${productType === 'non-consumable' ? 'po-active' : ''}`}
            onClick={() => setProductType('non-consumable')}
          >
            <i className="fas fa-stethoscope"></i>
            <span>Non-Consumables</span>
          </button>
        </div>
        <div className="po-type-indicator">
          <i className="fas fa-info-circle"></i>
          <span>Currently selected: <strong>{productType === 'consumable' ? 'Consumables (Pharmaceuticals, Drugs)' : 'Non-Consumables (Medical Equipment, Devices)'}</strong></span>
        </div>
      </div>

      <div className="po-header-section">
        <h1 className="po-main-title">
          <i className={`fas fa-${productType === 'consumable' ? 'pills' : 'stethoscope'} po-title-icon`}></i>
          {productType === 'consumable' ? 'Pharmaceutical Product Onboarding' : 'Medical Equipment Onboarding'}
        </h1>
      </div>

      {productType === 'consumable' ? (
        <ConsumableProductForm />
      ) : (
        <NonConsumableProductForm />
      )}
    </div>
  );
}

export default ProductOnboarding;