import React, { useRef, useState } from "react";
import Select, { StylesConfig } from "react-select";
import AdditionalDiscountNew, {
  AdditionalDiscountNewRef,
} from "./AdditionalDiscountNew";
import SpecialSchemes, { SpecialSchemesRef } from "./SpecialSchemes";
import {
  AdditionalDiscountData,
  SpecialSchemesData,
} from "@/src/types/product/ProductData";

type OptionType = {
  value: string;
  label: string;
};

// const options: OptionType[] = [
//   { value: "additional_discount", label: "Additional Discount" },
//   { value: "special_schemes", label: "Special Schemes" },
// ];

const customStyles: StylesConfig<OptionType, false> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "48px",
    width: "204px",
    borderRadius: "8px",
    borderColor: state.isFocused ? "#BF6BFF" : "#D5D5D4",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(168, 85, 247, 0.15)" : "none",
    "&:hover": {
      borderColor: "#BF6BFF",
    },
    paddingLeft: "4px",
    cursor: "pointer",
  }),

  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
    fontSize: "16px",
  }),

  singleValue: (provided) => ({
    ...provided,
    fontSize: "16px",
    color: "#111827",
  }),

  menu: (provided) => ({
    ...provided,
    minHeight: "48px",
    width: "204px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #D5D5D4",
    boxShadow: "none",
    marginTop: "4px",
  }),

  menuList: (provided) => ({
    ...provided,
    padding: 0,
    // backgroundColor: "#f5f5f5",
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: "#ffffff",
    color: "#111827",
    padding: "14px 16px",
    borderBottom: "1px solid #ABACA9",
    cursor: "pointer",
    fontSize: "16px",

    "&:hover": {
      backgroundColor: "#EBCEFF",
    },
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),
};

type AdditionalDiscountTypeProps = {
  onClose: () => void;
  categoryId?: number;
  initialData: AdditionalDiscountData[];
  baseDiscountPercentage: number;
  baseMinimumOrderQuantity: number;
  onSaveAdditionalDiscount: (data: AdditionalDiscountData[]) => void;
  initialSchemesData?: SpecialSchemesData[];
  onSaveSpecialSchemes?: (data: SpecialSchemesData[]) => void;
};

const AdditionalDiscountType = ({
  onClose,
  categoryId,
  initialData,
  baseDiscountPercentage,
  baseMinimumOrderQuantity,
  onSaveAdditionalDiscount,
  initialSchemesData,
  onSaveSpecialSchemes,
}: AdditionalDiscountTypeProps) => {
  const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
  const additionalDiscountRef = useRef<AdditionalDiscountNewRef>(null);
  const specialSchemesRef = useRef<SpecialSchemesRef>(null);
  const [alwaysActive, setAlwaysActive] = useState(false);

  const options: OptionType[] = [
    { value: "additional_discount", label: "Additional Discount" },

    ...(categoryId === 2 || categoryId === 3 || categoryId === 4
      ? [{ value: "special_schemes", label: "Special Schemes" }]
      : []),
  ];
  
  return (
    <>
    <div className="p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-h6 font-normal">Additional Discount </span>
          <span className="text-label-l3 font-normal">(Quantity-based)</span>
        </div>
        <div className="text-p3 font-normal">
          Create a time-based discount for bulk purchases
        </div>
        <div className="border-b border-pneutral-200"></div>
      </div>

      <div className="flex justify-between items-center w-full">
        <div className="w-full">
          <div className="flex items-center justify-between w-full">
            <div className="mt-4">
              <Select
                options={options}
                placeholder="Select Offer Type"
                styles={customStyles}
                isSearchable={false}
                value={selectedOption}
                onChange={(selected) => setSelectedOption(selected)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-label-l font-normal">Always Active</div>

              <div
                onClick={() => setAlwaysActive((prev) => !prev)}
                className={`w-13 h-7 rounded-full flex items-center px-0.5 cursor-pointer transition-all duration-300 ${
                  alwaysActive ? "bg-secondary-700" : "bg-pneutral-200"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${
                    alwaysActive ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* <div className="flex items-center gap-3">
              <div className="text-label-l font-normal">Always Active</div>

              <div className="w-13 h-7 bg-pneutral-200 rounded-full flex items-center px-0 cursor-pointer">
                <div className="w-7 h-7 bg- bg-pneutral-400 rounded-full mr-1"></div>
              </div>
            </div> */}
          </div>

          <div className="mt-6">
            {selectedOption?.value === "additional_discount" && (
              <AdditionalDiscountNew
                ref={additionalDiscountRef}
                initialData={initialData}
                baseDiscountPercentage={baseDiscountPercentage}
                baseMinimumOrderQuantity={baseMinimumOrderQuantity}
                onSave={onSaveAdditionalDiscount}
                alwaysActive={alwaysActive}
              />
            )}
            {selectedOption?.value === "special_schemes" && (
              <SpecialSchemes
                ref={specialSchemesRef}
                initialData={initialSchemesData}
                onSave={onSaveSpecialSchemes}
                alwaysActive={alwaysActive}
              />
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 px-5 py-6">
        <div className="border-t border-neutral-200"></div>

        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="w-27 h-10 rounded-lg border-2 border-warning-500 text-warning-500 font-medium text-label-l3 cursor-pointer"
          >
            Cancel
          </button>
          {selectedOption ? (
            <button
              onClick={() => {
                if (selectedOption?.value === "additional_discount") {
                  additionalDiscountRef.current?.submitForm();
                }

                if (selectedOption?.value === "special_schemes") {
                  specialSchemesRef.current?.submitForm();
                }
              }}
              className="w-33.25 h-10 bg-[#4B0082] rounded-lg text-white font-medium text-label-l3 cursor-pointer"
            >
              Submit
            </button>
          ) : (
            <button
              disabled
              className="w-33.25 h-10 bg-primary-200 rounded-lg text-sneutral-300 font-medium text-label-l3 cursor-not-allowed"
            >
              Submit
            </button>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default AdditionalDiscountType;
