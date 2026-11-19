import React, { useEffect, useRef, useState } from "react";
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
    minHeight: "36px",
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
    fontSize: "13px",
  }),

  singleValue: (provided) => ({
    ...provided,
    fontSize: "13px",
    color: "#111827",
  }),

  menu: (provided) => ({
    ...provided,
    minHeight: "36px",
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
    padding: "8px 12px",
    borderBottom: "1px solid #ABACA9",
    cursor: "pointer",
    fontSize: "13px",

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
  editTab?: "additional_discount" | "special_schemes" | null;
  editIndex?: number | null;
};

const AdditionalDiscountType = ({
  categoryId,
  onClose,
  initialData,
  baseDiscountPercentage,
  baseMinimumOrderQuantity,
  onSaveAdditionalDiscount,
  initialSchemesData,
  onSaveSpecialSchemes,
  editTab,
  editIndex,
}: AdditionalDiscountTypeProps) => {
  const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
  const additionalDiscountRef = useRef<AdditionalDiscountNewRef>(null);
  const specialSchemesRef = useRef<SpecialSchemesRef>(null);

  const [alwaysActive, setAlwaysActive] = useState<boolean>(false);

  const options: OptionType[] = [
    { value: "additional_discount", label: "Additional Discount" },

    ...(categoryId === 2 || categoryId === 3 || categoryId === 4
      ? [{ value: "special_schemes", label: "Special Schemes" }]
      : []),
  ];

  useEffect(() => {
    if (editTab) {
      const optionToSelect = options.find((opt) => opt.value === editTab);
      if (optionToSelect) {
        setSelectedOption(optionToSelect);
      }
    }
  }, [editTab]);

  return (
    <>
      <div className="h-[90vh] overflow-y-auto flex flex-col px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-neutral-900">Additional Discount </span>
            <span className="text-xs text-neutral-500">(Quantity-based)</span>
          </div>
          <div className="text-xs text-neutral-500 pb-1">
            Create a time-based discount for bulk purchases
          </div>
          <div className="border-b border-neutral-200"></div>
        </div>

        <div className="flex justify-between items-center w-full">
          <div className="w-full">
            <div className="flex items-center justify-between w-full">
              <div className="mt-2">
                <Select
                  options={options}
                  placeholder="Select Offer Type"
                  styles={customStyles}
                  isSearchable={false}
                  value={selectedOption}
                  onChange={(selected) => setSelectedOption(selected)}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="text-[13px] font-semibold text-neutral-700">Always Active</div>

                <div
                  onClick={() => setAlwaysActive((prev) => !prev)}
                  role="switch"
                  aria-checked={alwaysActive}
                  aria-label="Always Active"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setAlwaysActive((prev) => !prev);
                    }
                  }}
                  className={`w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 ${alwaysActive ? "bg-secondary-700" : "bg-neutral-300"
                    }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-all duration-300 ${alwaysActive ? "translate-x-4" : "translate-x-0"
                      }`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              {selectedOption?.value === "additional_discount" && (
                <AdditionalDiscountNew
                  ref={additionalDiscountRef}
                  initialData={initialData}
                  onSave={onSaveAdditionalDiscount}
                  baseDiscountPercentage={baseDiscountPercentage}
                  baseMinimumOrderQuantity={baseMinimumOrderQuantity}
                  alwaysActive={alwaysActive}
                  setAlwaysActive={setAlwaysActive}
                  editIndex={editIndex}
                />
              )}
              {selectedOption?.value === "special_schemes" && (
                <SpecialSchemes
                  ref={specialSchemesRef}
                  initialData={initialSchemesData}
                  onSave={onSaveSpecialSchemes}
                  alwaysActive={alwaysActive}
                  setAlwaysActive={setAlwaysActive}
                  editIndex={editIndex}
                />
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 px-4 py-2 bg-white">
          <div className="border-t border-neutral-200"></div>

          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="h-9 px-5 rounded-lg border-[1.5px] border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-[13px] font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
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
                className="h-9 px-6 rounded-lg border-[1.5px] border-primary-900 text-primary-900 hover:bg-primary-50 text-[13px] font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
              >
                Submit
              </button>
            ) : (
              <button
                disabled
                className="h-9 px-6 rounded-lg border-[1.5px] border-neutral-200 text-neutral-400 text-[13px] font-semibold cursor-not-allowed"
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
