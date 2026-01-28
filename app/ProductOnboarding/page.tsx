"use client";

import React, { useState } from 'react';
import './product.css';
import ConsumableProductForm from './ConsumableProductForm';
import NonConsumableProductForm from './NonConsumableProductForm';
import Header from '../components/Header';

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
    <>
      <Header />
      <div className="po-seller-register-container">
        {/* Header Section with Title and Product Type Toggle in one row */}
        <div className="po-header-row">
          <div className="po-title-section ">
            <h1 className="po-main-title ">
              <i className={`fas fa-${productType === 'consumable' ? 'pills' : 'stethoscope'} po-title-icon`}></i>
              {productType === 'consumable' ? 'Pharmaceutical Product Onboarding' : 'Medical Equipment Onboarding'}
            </h1>
          </div>

          <div className="po-product-type-toggle-top">
            <div className="po-toggle-label">
              <i className="fas fa-boxes"></i>
              <span>Product Type:</span>
            </div>
            <div className="po-toggle-buttons-top">
              <button
                type="button"
                className={`po-toggle-btn-top ${productType === 'consumable' ? 'po-active' : ''}`}
                onClick={() => setProductType('consumable')}
              >
                <i className="fas fa-pills"></i>
                <span>Consumables</span>
              </button>
              <button
                type="button"
                className={`po-toggle-btn-top ${productType === 'non-consumable' ? 'po-active' : ''}`}
                onClick={() => setProductType('non-consumable')}
              >
                <i className="fas fa-stethoscope"></i>
                <span>Non-Consumables</span>
              </button>
            </div>
          </div>
        </div>

        {productType === 'consumable' ? (
          <ConsumableProductForm />
        ) : (
          <NonConsumableProductForm />
        )}
      </div>
    </>
  );
}

export default ProductOnboarding;