"use client";

import { getSellerProductTypes } from "@/src/services/seller/sellerProfileService";
import { useEffect, useState } from "react";

type Props = {
  onSelect: (selected: string[]) => void;
};

export default function CategoryButtons({ onSelect }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [isClicked, setIsClicked] = useState(false);

  const categories = [
    { name: "Drugs", width: "w-16" },
    { name: "Supplements / Nutraceuticals", width: "w-52" },
    { name: "Food & Infant Nutrition", width: "w-44" },
    { name: "Cosmetic & Personal Care", width: "w-44" },
    { name: "Medical Devices & Equipment", width: "w-52" },
  ];

  const normalize = (str: string) =>
  str
    .toLowerCase()
    .replace(/\s+/g, "")      // remove spaces
    .replace(/\//g, "")       // remove /
    .replace(/&/g, "and")     // convert & → and


  useEffect(() => {
    const fetchProductTypes = async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      try {
        const res = await getSellerProductTypes();

        const backendTypes: string[] = res?.productTypeNames || [];

        console.log("Types-----", backendTypes);

        setAllowedCategories(backendTypes);

        const matched = categories.find((cat) =>
          backendTypes.some((type) => normalize(type) === normalize(cat.name)),
        );

        if (matched) {
          setSelectedCategory(matched.name);
          // onSelect([matched.name]);
        } else {
          setSelectedCategory(null);
          onSelect([]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProductTypes();
  }, []);

  const handleClick = (category: string, isDisabled: boolean) => {
    if (isDisabled) return;

    setSelectedCategory(category);
    setIsClicked(true);

    onSelect([category]);
  };

  return (
    <div className="space-x-4 mt-6">
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.name;
        const isDisabled = !allowedCategories.some(
          (type) => normalize(type) === normalize(cat.name),
        );

        let style = "";

        if (isDisabled) {
          style = "bg-neutral-200 text-neutral-400 cursor-not-allowed";
        }
        // ✅ DEFAULT (before click → BORDER ONLY)
        else if (isActive && !isClicked) {
          style = "border-2 border-[#9F75FC] text-[#9F75FC] bg-white";
        }
        // ✅ AFTER CLICK → FILLED
        else if (isActive && isClicked) {
          style = "bg-[#9F75FC] text-white";
        }
        // ✅ OTHER ENABLED
        else {
          style = "bg-neutral-200 text-neutral-700";
        }

        return (
          <button
            key={cat.name}
            onClick={() => handleClick(cat.name, isDisabled)}
            disabled={isDisabled}
            className={`rounded-lg text-label-l2 font-semibold h-10 ${cat.width} ${style}`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// "use client";
// import { useState } from "react";

// type Props = {
//   onSelect: () => void;
// };

// export default function CategoryButtons({ onSelect }: Props) {
//   const [selectedCategory, setSelectedCategory] = useState("Drugs");
//   const [isClicked, setIsClicked] = useState(false);

//   const categories = [
//     { name: "Drugs", width: "w-16" },
//     { name: "Supplements / Nutraceuticals", width: "w-52" },
//     { name: "Food & Infant Nutrition", width: "w-44" },
//     { name: "Cosmetic & Personal Use", width: "w-44" },
//     { name: "Medical Devices & Equipment", width: "w-52" },
//   ];

//   const handleClick = (category: string) => {
//     setSelectedCategory(category);
//     setIsClicked(true);
//     onSelect();
//   };

//   return (
//     <div className="space-x-4 mt-6">
//       {categories.map((cat) => {
//         let style = "";

//         if (!isClicked && cat.name === "Drugs") {
//           style = "border-2 border-[#9F75FC] text-[#9F75FC] bg-white";
//         } else if (selectedCategory === cat.name && isClicked) {
//           style = "bg-[#9F75FC] text-white";
//         } else {
//           style = "bg-neutral-200 text-neutral-500";
//         }

//         return (
//           <button
//             key={cat.name}
//             onClick={() => handleClick(cat.name)}
//             className={`rounded-lg text-label-l2 font-semibold h-10 cursor-pointer ${cat.width} ${style}`}
//           >
//             {cat.name}
//           </button>
//         );
//       })}
//     </div>
//   );
// }
