"use client";

import CategoryButtons from "@/src/app/commonComponents/CategoryButtons";
import React, { useState } from "react";
import { DrugForm } from "./DrugForm";
import SupplementForm from "./SupplementForm";
import FoodInfantForm from "./FoodInfantForm";
import CosmeticForm from "./CosmeticForm";
import MedicalDevicesForm from "./MedicalDevicesForm";



const AddProduct = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleCategorySelect = (categories: string[]) => {
    setSelectedCategories(categories);

    if (categories.length > 0) {
      setShowForm(true);
    }
  };

  const FORM_COMPONENTS: Record<string, React.ReactNode> = {
    "Drugs": <DrugForm />,
    "Supplements / Nutraceuticals": <SupplementForm />,
    "Food & Infant Nutrition": <FoodInfantForm />,
    "Cosmetic & Personal Care": <CosmeticForm />,
    "Medical Devices & Equipment": <MedicalDevicesForm />,
  };

  const selectedCategory = selectedCategories[0]; // single select

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-h2 font-normal">Add Product</div>

        <CategoryButtons onSelect={handleCategorySelect} />

        {!showForm && (
          <div className="flex flex-col items-center mt-20 gap-10">
            <img src="/AddProdImg.svg" className="w-[330px] h-[329px]" />

            <p className="text-p4 font-normal">
              Enter a line here encouraging to start their journey by adding
              products
            </p>
          </div>
        )}
      </div>

      {showForm && selectedCategory && FORM_COMPONENTS[selectedCategory]}
    </div>
  );
};

export default AddProduct;


// import CategoryButtons from "@/src/app/commonComponents/CategoryButtons";
// import React, { useEffect, useState } from "react";

// import { DrugForm } from "./DrugForm";


// const AddProduct = () => {

//   const [showForm, setShowForm] = useState(false);
  
//   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

//   const handleCategorySelect = (categories: string[]) => {
//     setSelectedCategories(categories);

//     // ✅ show ONLY after click
//     if (categories.length > 0) {
//       setShowForm(true);
//     }
//   };


//   return (
//     <div className="flex flex-col gap-5">
//       <div>
//         <div className="text-h2 font-normal">Add Product</div>

//         <CategoryButtons onSelect={handleCategorySelect} />

//         {!showForm && (
//           <div className="flex flex-col items-center mt-20 gap-10">
//             <img src="/AddProdImg.svg" className="w-[330px] h-[329px]" />

//             <p className="text-p4 font-normal">
//               Enter a line here encouraging to start their journey by adding
//               products
//             </p>
//           </div>
//         )}
//       </div>
//       {showForm && (
//        <DrugForm/>
//       )}
//     </div>
//   );
// };

// export default AddProduct;
