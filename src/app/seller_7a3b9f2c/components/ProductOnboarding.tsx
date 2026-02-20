"use client";

import React, { useState } from 'react';
import ConsumableProductForm from './ConsumableProductForm';
import NonConsumableProductForm from './NonConsumableProductForm';
import Header from '@/src/app/components/Header';

type ProductType = 'consumable' | 'non-consumable';

// Export these interfaces/types
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

interface ProductOnboardingProps {
  onBackToDashboard?: () => void;
}

export default function ProductOnboarding({ onBackToDashboard }: ProductOnboardingProps) {
  const [productType, setProductType] = useState<ProductType>('consumable');

  const handleBack = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  return (
    <>
      <Header />
      
      <div className="container mt-3 ml-10">
        <button 
          onClick={handleBack}
          className="mb-3 px-4 py-2 bg-[#f3ecf8] border border-[#751bb5] text-[#751bb5] rounded-lg hover:bg-[#751bb5] hover:text-white transition"
        >
          <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
        </button>
      </div>
      
      <div className="po-seller-register-container ml-10 mr-10">
        <div className="po-header-row">
          <div className="po-title-section">
            <h1 className="po-main-title">
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
          <ConsumableProductForm  />
        ) : (
          <NonConsumableProductForm  />
        )}
      </div>
    </>
  );
}





// "use client";

// import React, { useState } from 'react';
// import ConsumableProductForm from './ConsumableProductForm';
// import NonConsumableProductForm from './NonConsumableProductForm';
// import Header from '@/src/app/components/Header';

// type ProductType = 'consumable' | 'non-consumable';

// export interface BaseFormData {
//   // Common fields
//   productCategory: string;
//   therapeuticCategory: string;
//   subCategory: string;
//   productName: string;
//   productDescription: string;
//   warnings: string;
//   productImage: File | null;
//   // Packaging & Order Details
//   packagingUnit: string;
//   moq: string;
//   maxOrderQuantity: string;
//   // Stock, Pricing & Tax Details
//   stockQuantity: string;
//   dateOfEntry: string;
//   pricePerUnit: string;
//   discountPercentage: string;
//   gstPercentage: string;
//   hsnCode: string;
// }

// export interface FormErrors {
//   [key: string]: string;
// }

// export default function ProductOnboarding() {
//   const [productType, setProductType] = useState<ProductType>('consumable');

//   return (
//     <>
//       <Header />
//       <div className="po-seller-register-container">
//         <div className="po-header-row">
//           <div className="po-title-section ">
//             <h1 className="po-main-title ">
//               <i className={`fas fa-${productType === 'consumable' ? 'pills' : 'stethoscope'} po-title-icon`}></i>
//               {productType === 'consumable' ? 'Pharmaceutical Product Onboarding' : 'Medical Equipment Onboarding'}
//             </h1>
//           </div>
//           <div className="po-product-type-toggle-top">
//             <div className="po-toggle-label">
//               <i className="fas fa-boxes"></i>
//               <span>Product Type:</span>
//             </div>
//             <div className="po-toggle-buttons-top">
//               <button
//                 type="button"
//                 className={`po-toggle-btn-top ${productType === 'consumable' ? 'po-active' : ''}`}
//                 onClick={() => setProductType('consumable')}
//               >
//                 <i className="fas fa-pills"></i>
//                 <span>Consumables</span>
//               </button>
//               <button
//                 type="button"
//                 className={`po-toggle-btn-top ${productType === 'non-consumable' ? 'po-active' : ''}`}
//                 onClick={() => setProductType('non-consumable')}
//               >
//                 <i className="fas fa-stethoscope"></i>
//                 <span>Non-Consumables</span>
//               </button>
//             </div>
//           </div>
//         </div>
//         {productType === 'consumable' ? (
//           <ConsumableProductForm />
//         ) : (
//           <NonConsumableProductForm />
//         )}
//       </div>
//     </>
//   );
// }
