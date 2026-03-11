"use client";
import { useState } from "react";

type Props = {
  onSelect: () => void;
};

export default function CategoryButtons({ onSelect }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("Drugs");
  const [isClicked, setIsClicked] = useState(false);

  const categories = [
    { name: "Drugs", width: "w-16" },
    { name: "Supplements / Nutraceuticals", width: "w-52" },
    { name: "Food & Infant Nutrition", width: "w-44" },
    { name: "Cosmetic & Personal Use", width: "w-44" },
    { name: "Medical Devices & Equipment", width: "w-52" },
  ];

  const handleClick = (category: string) => {
    setSelectedCategory(category);
    setIsClicked(true);
    onSelect();  
  };

  return (
    <div className="space-x-4 mt-6">
      {categories.map((cat) => {
        let style = "";

        if (!isClicked && cat.name === "Drugs") {
          style = "border-2 border-[#9F75FC] text-[#9F75FC] bg-white";
        } else if (selectedCategory === cat.name && isClicked) {
          style = "bg-[#9F75FC] text-white";
        } else {
          style = "bg-neutral-200 text-neutral-500";
        }

        return (
          <button
            key={cat.name}
            onClick={() => handleClick(cat.name)}
            className={`rounded-lg text-label-l2 font-semibold h-10 cursor-pointer ${cat.width} ${style}`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}