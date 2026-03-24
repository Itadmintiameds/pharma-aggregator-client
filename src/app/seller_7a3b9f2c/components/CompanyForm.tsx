"use client";

import React from "react";
import { MapPin, Phone, Mail, Globe, ChevronDown } from "lucide-react";
import { HiOutlineUserGroup } from "react-icons/hi2";
import {
  CompanyTypeResponse,
  SellerTypeResponse,
  ProductTypeResponse,
  StateResponse,
  DistrictResponse,
  TalukaResponse,
} from "@/src/types/seller/SellerRegMasterData";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  formData: any;
  companyTypes: CompanyTypeResponse[];
  sellerTypes: SellerTypeResponse[];
  productTypes: ProductTypeResponse[];
  states: StateResponse[];
  districts: DistrictResponse[];
  talukas: TalukaResponse[];
  loadingStates: any;
  isProductDropdownOpen: boolean;
  productDropdownRef: React.RefObject<HTMLDivElement | null>;
  onCompanyTypeChange: (selected: any) => void;
  onSellerTypeChange: (selected: any) => void;
  onStateChange: (selected: any) => void;
  onDistrictChange: (selected: any) => void;
  onTalukaChange: (selected: any) => void;
  onProductToggle: (product: ProductTypeResponse) => void;
  onSelectAll: () => void;
  onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onNumericInput: (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setIsProductDropdownOpen: (open: boolean) => void;
  prevStep: () => void;
  nextStep: () => void;
}

export default function CompanyForm({
  formData,
  companyTypes,
  sellerTypes,
  productTypes,
  states,
  districts,
  talukas,
  loadingStates,
  isProductDropdownOpen,
  productDropdownRef,
  onCompanyTypeChange,
  onSellerTypeChange,
  onStateChange,
  onDistrictChange,
  onTalukaChange,
  onProductToggle,
  onSelectAll,
  onAlphabetInput,
  onNumericInput,
  onChange,
  setIsProductDropdownOpen,
  prevStep,
  nextStep,
}: Props) {

  const router = useRouter();

  // State for custom dropdowns
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const companyDropdownRef = React.useRef<HTMLDivElement>(null);
  const sellerDropdownRef = React.useRef<HTMLDivElement>(null);
  const stateDropdownRef = React.useRef<HTMLDivElement>(null);
  const districtDropdownRef = React.useRef<HTMLDivElement>(null);
  const talukaDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === 'company') setOpenDropdown(null);
      }
      if (sellerDropdownRef.current && !sellerDropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === 'seller') setOpenDropdown(null);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === 'state') setOpenDropdown(null);
      }
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === 'district') setOpenDropdown(null);
      }
      if (talukaDropdownRef.current && !talukaDropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === 'taluka') setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Get selected label for custom dropdowns
  const getSelectedCompanyLabel = () => {
    const selected = companyTypes.find(c => c.companyTypeId === formData.companyTypeId);
    return selected?.companyTypeName || "";
  };

  const getSelectedSellerLabel = () => {
    const selected = sellerTypes.find(s => s.sellerTypeId === formData.sellerTypeId);
    return selected?.sellerTypeName || "";
  };

  const getSelectedStateLabel = () => {
    const selected = states.find(s => s.stateId === formData.stateId);
    return selected?.stateName || "";
  };

  const getSelectedDistrictLabel = () => {
    const selected = districts.find(d => d.districtId === formData.districtId);
    return selected?.districtName || "";
  };

  const getSelectedTalukaLabel = () => {
    const selected = talukas.find(t => t.talukaId === formData.talukaId);
    return selected?.talukaName || "";
  };

  // Convert master data to react-select options
  const companyTypeOptions = companyTypes.map(type => ({
    value: type.companyTypeId.toString(),
    label: type.companyTypeName
  }))

  const sellerTypeOptions = sellerTypes.map(type => ({
    value: type.sellerTypeId.toString(),
    label: type.sellerTypeName
  }))

  const productTypeOptions = productTypes.map(type => ({
    value: type.productTypeId.toString(),
    label: type.regulatoryCategory
      ? `${type.productTypeName} (${type.regulatoryCategory})`
      : type.productTypeName
  }))

  const stateOptions = states.map(state => ({
    value: state.stateId.toString(),
    label: state.stateName
  }))

  const districtOptions = districts.map(district => ({
    value: district.districtId.toString(),
    label: district.districtName
  }))

  const talukaOptions = talukas.map(taluka => ({
    value: taluka.talukaId.toString(),
    label: taluka.talukaName
  }))

  const portalTarget =
    typeof window !== "undefined" ? document.body : null;

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      height: "48px",
      minHeight: "48px",
      borderRadius: "16px",
      borderColor: state.isFocused ? "#4B0082" : "#737373",
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": {
        borderColor: "#4B0082",
      },
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "0 16px",
      cursor: "pointer",
      height: "48px",
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: "48px",
      cursor: "pointer",
    }),
    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused ? "#4B0082" : "#737373",
      cursor: "pointer",
      "&:hover": {
        color: "#4B0082",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#4B0082"
        : state.isFocused
          ? "#F3E8FF"
          : "white",
      color: state.isSelected ? "white" : "#1E1E1E",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#4B0082",
        color: "white",
      },
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#A3A3A3",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#1E1E1E",
    }),
    input: (base: any) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
  }

  const selectWithIconStyles = {
    ...selectStyles,
    control: (base: any, state: any) => ({
      ...selectStyles.control(base, state),
      paddingLeft: "30px",
    }),
  }

  return (
    <div className="flex flex-col gap-5 bg-white">
      {/* Header Section */}
      <div className="text-black">
        <div className="text-h3 font-semibold">Company Details</div>
        <div className="text-label-l3 mt-1">
          Please ensure the Company Name matches your GST and Drug License exactly.
        </div>
      </div>

      {/* Company Details Section */}
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
          {/* Company Name */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Seller Name / Company Name
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="sellerName"
                value={formData.sellerName}
                onChange={(e) => onAlphabetInput(e, "sellerName")}
                placeholder="Enter Your Name/Company Name"
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500  focus:outline-none focus:ring-0 text-label-l2"
              />
            </div>
          </div>

          {/* Company Type - Custom Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Company Type
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={companyDropdownRef}>
              <Image
                src="/icons/companytype1.jpg"
                alt="Company Type"
                width={20}
                height={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
              />
              <div
                className="w-full h-12 pl-10 pr-4 border border-neutral-500 rounded-2xl bg-white cursor-pointer flex justify-between items-center hover:border-[#4B0082] transition-all"
                onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
              >
                <span className={!getSelectedCompanyLabel() ? "text-neutral-500" : "text-neutral-900"}>
                  {loadingStates.companyTypes
                    ? "Loading..."
                    : getSelectedCompanyLabel() || "Select Company Type"}
                </span>
                <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${openDropdown === 'company' ? 'rotate-180' : ''}`} />
              </div>

              {openDropdown === 'company' && !loadingStates.companyTypes && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  <div className="max-h-60 overflow-y-auto">
                    {companyTypes.map((type) => (
                      <div
                        key={type.companyTypeId}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                        onClick={() => {
                          onCompanyTypeChange({ value: type.companyTypeId.toString(), label: type.companyTypeName });
                          setOpenDropdown(null);
                        }}
                      >
                        <span className="text-sm text-neutral-900">
                          {type.companyTypeName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seller Type - Custom Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Seller Type
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={sellerDropdownRef}>
              <Image
                src="/icons/sellertype1.jpg"
                alt="Seller Type"
                width={20}
                height={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
              />
              <div
                className="w-full h-12 pl-10 pr-4 border border-neutral-500 rounded-2xl bg-white cursor-pointer flex justify-between items-center hover:border-[#4B0082] transition-all"
                onClick={() => setOpenDropdown(openDropdown === 'seller' ? null : 'seller')}
              >
                <span className={!getSelectedSellerLabel() ? "text-neutral-500" : "text-neutral-900"}>
                  {loadingStates.sellerTypes
                    ? "Loading..."
                    : getSelectedSellerLabel() || "Select Seller Type"}
                </span>
                <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${openDropdown === 'seller' ? 'rotate-180' : ''}`} />
              </div>

              {openDropdown === 'seller' && !loadingStates.sellerTypes && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  <div className="max-h-60 overflow-y-auto">
                    {sellerTypes.map((type) => (
                      <div
                        key={type.sellerTypeId}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                        onClick={() => {
                          onSellerTypeChange({ value: type.sellerTypeId.toString(), label: type.sellerTypeName });
                          setOpenDropdown(null);
                        }}
                      >
                        <span className="text-sm text-neutral-900">
                          {type.sellerTypeName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Types - Custom Multi-Select with dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Product Type(s)
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={productDropdownRef}>
              <Image
                src="/icons/producttype1.jpg"
                alt="Product Type"
                width={20}
                height={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
              />
              <div
                className="w-full h-12 pl-10 pr-4 border border-neutral-500 rounded-2xl bg-white cursor-pointer flex justify-between items-center hover:border-[#4B0082] transition-all"
                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
              >
                <span className={formData.productTypes.length === 0 ? "text-neutral-500" : "text-neutral-900"}>
                  {loadingStates.productTypes
                    ? "Loading product types..."
                    : formData.productTypes.length > 0
                      ? `${formData.productTypes.length} product type(s) selected`
                      : "Select Product Types"}
                </span>
                <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isProductDropdownOpen && !loadingStates.productTypes && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  <div className="max-h-60 overflow-y-auto">
                    {/* Select All */}
                    {productTypes.length > 0 && (
                      <div
                        className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200"
                        onClick={onSelectAll}
                      >
                        <input
                          type="checkbox"
                          checked={productTypes.length > 0 && formData.productTypes.length === productTypes.length}
                          onChange={() => { }}
                          className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
                        />
                        <label className="ml-3 text-sm font-medium text-[#4B0082] cursor-pointer">
                          Select All
                        </label>
                      </div>
                    )}

                    {/* Individual Products */}
                    {productTypes.map((product) => (
                      <div
                        key={product.productTypeId}
                        className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                        onClick={() => onProductToggle(product)}
                      >
                        <input
                          type="checkbox"
                          checked={formData.productTypeIds.includes(product.productTypeId)}
                          onChange={() => { }}
                          className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
                        />
                        <label className="ml-3 text-sm text-neutral-900 cursor-pointer">
                          {product.productTypeName}
                          {product.regulatoryCategory && (
                            <span className="ml-2 text-xs text-[#4B0082]">
                              ({product.regulatoryCategory})
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* {formData.productTypes.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-green-600">
                  <i className="bi bi-check-circle-fill mr-1"></i>
                  Selected: {formData.productTypes.join(", ")}
                </p>
              </div>
            )} */}
          </div>
        </div>
      </div>

      {/* Address Fields */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {/* State - Custom Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            State
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <div className="relative" ref={stateDropdownRef}>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" />
            <div
              className="w-full h-12 pl-10 pr-4 border border-neutral-500 rounded-2xl bg-white cursor-pointer flex justify-between items-center hover:border-[#4B0082] transition-all"
              onClick={() => setOpenDropdown(openDropdown === 'state' ? null : 'state')}
            >
              <span className={!getSelectedStateLabel() ? "text-neutral-500" : "text-neutral-900"}>
                {loadingStates.states
                  ? "Loading..."
                  : getSelectedStateLabel() || "Select State"}
              </span>
              <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${openDropdown === 'state' ? 'rotate-180' : ''}`} />
            </div>

            {openDropdown === 'state' && !loadingStates.states && (
              <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="max-h-60 overflow-y-auto">
                  {states.map((state) => (
                    <div
                      key={state.stateId}
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                      onClick={() => {
                        onStateChange({ value: state.stateId.toString(), label: state.stateName });
                        setOpenDropdown(null);
                      }}
                    >
                      <span className="text-sm text-neutral-900">
                        {state.stateName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* District - Custom Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            District
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <div className="relative" ref={districtDropdownRef}>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" />
            <div
              className={`w-full h-12 pl-10 pr-4 border border-neutral-500 rounded-2xl bg-white flex justify-between items-center ${formData.stateId ? 'cursor-pointer hover:border-[#4B0082]' : 'cursor-not-allowed bg-gray-50'}`}
              onClick={() => formData.stateId && setOpenDropdown(openDropdown === 'district' ? null : 'district')}
            >
              <span className={!getSelectedDistrictLabel() ? "text-neutral-500" : "text-neutral-900"}>
                {loadingStates.districts
                  ? "Loading..."
                  : getSelectedDistrictLabel() || "Select District"}
              </span>
              {formData.stateId && (
                <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${openDropdown === 'district' ? 'rotate-180' : ''}`} />
              )}
            </div>

            {openDropdown === 'district' && !loadingStates.districts && formData.stateId && (
              <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="max-h-60 overflow-y-auto">
                  {districts.map((district) => (
                    <div
                      key={district.districtId}
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                      onClick={() => {
                        onDistrictChange({ value: district.districtId.toString(), label: district.districtName });
                        setOpenDropdown(null);
                      }}
                    >
                      <span className="text-sm text-neutral-900">
                        {district.districtName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Taluka - Custom Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            Taluka
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <div className="relative" ref={talukaDropdownRef}>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" />
            <div
              className={`w-full h-12 pl-10 pr-4 border border-neutral-500 rounded-2xl bg-white flex justify-between items-center ${formData.districtId ? 'cursor-pointer hover:border-[#4B0082]' : 'cursor-not-allowed bg-gray-50'}`}
              onClick={() => formData.districtId && setOpenDropdown(openDropdown === 'taluka' ? null : 'taluka')}
            >
              <span className={!getSelectedTalukaLabel() ? "text-neutral-500" : "text-neutral-900"}>
                {loadingStates.talukas
                  ? "Loading..."
                  : getSelectedTalukaLabel() || "Select Taluka"}
              </span>
              {formData.districtId && (
                <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${openDropdown === 'taluka' ? 'rotate-180' : ''}`} />
              )}
            </div>

            {openDropdown === 'taluka' && !loadingStates.talukas && formData.districtId && (
              <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="max-h-60 overflow-y-auto">
                  {talukas.map((taluka) => (
                    <div
                      key={taluka.talukaId}
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                      onClick={() => {
                        onTalukaChange({ value: taluka.talukaId.toString(), label: taluka.talukaName });
                        setOpenDropdown(null);
                      }}
                    >
                      <span className="text-sm text-neutral-900">
                        {taluka.talukaName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* City */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            City / Town / Village
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={(e) => onAlphabetInput(e, "city")}
              placeholder="Enter City/Town/Village"
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
            />
          </div>
        </div>

        {/* Street */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            Street / Area / Road
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={(e) => onAlphabetInput(e, "street")}
              placeholder="Enter Street/Area/Road"
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
            />
          </div>
        </div>

        {/* Building/House No */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            Building / House No.
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2  w-5 h-5" />
            <input
              type="text"
              name="buildingNo"
              value={formData.buildingNo}
              onChange={onChange}
              placeholder="Enter Building/House No."
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
            />
          </div>
        </div>

        {/* Pincode */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            Pin Code
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={(e) => onNumericInput(e, "pincode", 6)}
              placeholder="Enter 6-Digit Pincode"
              maxLength={6}
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
            />
          </div>
        </div>

        {/* Landmark */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            Landmark
          </label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={onChange}
            placeholder="Enter Landmark"
            className="w-full h-12 px-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
          />
        </div>
      </div>

      {/* Contact Fields */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {/* Phone */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            Company Phone
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => onNumericInput(e, "phone", 10)}
              placeholder="Enter Company Phone"
              maxLength={10}
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            Company Email
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="Enter Company Email ID"
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
            />
          </div>
        </div>

        {/* Website */}
        <div className="flex flex-col gap-1">
          <label className="text-label-l3 text-neutral-700 font-semibold">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={onChange}
              placeholder="URL:\\"
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
            />
          </div>
        </div>
      </div>

      {/* Buttons - Updated to match DocumentForm styling */}
      <div className="flex justify-between mt-10">
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold">
            Cancel
          </button>

          {/* <button className="flex h-12 px-6 py-3 justify-center items-center gap-2 rounded-md bg-[#9F75FC] text-white font-semibold hover:bg-[#B08DFC] transition">
            <Image
              src="/icons/savedrafticon.png"
              alt="Save Draft"
              width={18}
              height={18}
            />
            Save Draft
          </button> */}
        </div>

        <div className="flex gap-4">
          {/* <button
            onClick={prevStep}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold hover:neutral-500 hover:text-neutral-500 transition"
          >
            <Image
              src="/icons/backbuttonicon.png"
              alt="Back"
              width={18}
              height={18}
            />
            Back
          </button> */}

          <button
            onClick={nextStep}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-900 text-primary-900 font-semibold hover:border-primary-100 transition"
          >
            Continue
            <Image
              src="/icons/arrowForward.png"
              alt="Continue"
              width={20}
              height={20}
            />
          </button>
        </div>
      </div>
    </div>
  );
}














// codes before bug sheet fixed.................

// "use client";

// import React from "react";
// import { MapPin, Phone, Mail, Globe, ChevronDown } from "lucide-react";
// import { HiOutlineUserGroup } from "react-icons/hi2";
// import Select from "react-select";
// import {
//   CompanyTypeResponse,
//   SellerTypeResponse,
//   ProductTypeResponse,
//   StateResponse,
//   DistrictResponse,
//   TalukaResponse,
// } from "@/src/types/seller/SellerRegMasterData";
// import Image from "next/image";
// import { useRouter } from "next/navigation";

// interface Props {
//   formData: any;
//   companyTypes: CompanyTypeResponse[];
//   sellerTypes: SellerTypeResponse[];
//   productTypes: ProductTypeResponse[];
//   states: StateResponse[];
//   districts: DistrictResponse[];
//   talukas: TalukaResponse[];
//   loadingStates: any;
//   isProductDropdownOpen: boolean;
//   productDropdownRef: React.RefObject<HTMLDivElement | null>;
//   onCompanyTypeChange: (selected: any) => void;
//   onSellerTypeChange: (selected: any) => void;
//   onStateChange: (selected: any) => void;
//   onDistrictChange: (selected: any) => void;
//   onTalukaChange: (selected: any) => void;
//   onProductToggle: (product: ProductTypeResponse) => void;
//   onSelectAll: () => void;
//   onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
//   onNumericInput: (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => void;
//   onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
//   setIsProductDropdownOpen: (open: boolean) => void;
//   prevStep: () => void;
//   nextStep: () => void;
// }

// export default function CompanyForm({
//   formData,
//   companyTypes,
//   sellerTypes,
//   productTypes,
//   states,
//   districts,
//   talukas,
//   loadingStates,
//   isProductDropdownOpen,
//   productDropdownRef,
//   onCompanyTypeChange,
//   onSellerTypeChange,
//   onStateChange,
//   onDistrictChange,
//   onTalukaChange,
//   onProductToggle,
//   onSelectAll,
//   onAlphabetInput,
//   onNumericInput,
//   onChange,
//   setIsProductDropdownOpen,
//   prevStep,
//   nextStep,
// }: Props) {

//   const router = useRouter();

//   // Convert master data to react-select options
//   const companyTypeOptions = companyTypes.map(type => ({
//     value: type.companyTypeId.toString(),
//     label: type.companyTypeName
//   }))

//   const sellerTypeOptions = sellerTypes.map(type => ({
//     value: type.sellerTypeId.toString(),
//     label: type.sellerTypeName
//   }))

//   const productTypeOptions = productTypes.map(type => ({
//     value: type.productTypeId.toString(),
//     label: type.regulatoryCategory
//       ? `${type.productTypeName} (${type.regulatoryCategory})`
//       : type.productTypeName
//   }))

//   const stateOptions = states.map(state => ({
//     value: state.stateId.toString(),
//     label: state.stateName
//   }))

//   const districtOptions = districts.map(district => ({
//     value: district.districtId.toString(),
//     label: district.districtName
//   }))

//   const talukaOptions = talukas.map(taluka => ({
//     value: taluka.talukaId.toString(),
//     label: taluka.talukaName
//   }))

//   const portalTarget =
//     typeof window !== "undefined" ? document.body : null;

//   const selectStyles = {
//     control: (base: any, state: any) => ({
//       ...base,
//       height: "48px",
//       minHeight: "48px",
//       borderRadius: "16px",
//       borderColor: state.isFocused ? "#4B0082" : "#737373",
//       boxShadow: "none",
//       cursor: "pointer",
//       "&:hover": {
//         borderColor: "#4B0082",
//       },
//     }),
//     menuPortal: (base: any) => ({
//       ...base,
//       zIndex: 9999,
//     }),
//     valueContainer: (base: any) => ({
//       ...base,
//       padding: "0 16px",
//       cursor: "pointer",
//       height: "48px",
//     }),
//     indicatorsContainer: (base: any) => ({
//       ...base,
//       height: "48px",
//       cursor: "pointer",
//     }),
//     dropdownIndicator: (base: any, state: any) => ({
//       ...base,
//       color: state.isFocused ? "#4B0082" : "#737373",
//       cursor: "pointer",
//       "&:hover": {
//         color: "#4B0082",
//       },
//     }),
//     option: (base: any, state: any) => ({
//       ...base,
//       backgroundColor: state.isSelected
//         ? "#4B0082"
//         : state.isFocused
//           ? "#F3E8FF"
//           : "white",
//       color: state.isSelected ? "white" : "#1E1E1E",
//       cursor: "pointer",
//       "&:active": {
//         backgroundColor: "#4B0082",
//         color: "white",
//       },
//     }),
//     placeholder: (base: any) => ({
//       ...base,
//       color: "#A3A3A3",
//     }),
//     singleValue: (base: any) => ({
//       ...base,
//       color: "#1E1E1E",
//     }),
//     input: (base: any) => ({
//       ...base,
//       margin: 0,
//       padding: 0,
//     }),
//   }

//   const selectWithIconStyles = {
//     ...selectStyles,
//     control: (base: any, state: any) => ({
//       ...selectStyles.control(base, state),
//       paddingLeft: "30px",
//     }),
//   }

//   return (
//     <div className="flex flex-col gap-5 bg-white">
//       {/* Header Section */}
//       <div className="text-black">
//         <div className="text-h3 font-semibold">Company Details</div>
//         <div className="text-label-l3 mt-1">
//           Please ensure the Company Name matches your GST and Drug License exactly.
//         </div>
//       </div>

//       {/* Company Details Section */}
//       <div>
//         <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
//           {/* Company Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Seller Name / Company Name
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="text"
//                 name="sellerName"
//                 value={formData.sellerName}
//                 onChange={(e) => onAlphabetInput(e, "sellerName")}
//                 placeholder="Enter Your Name/Company Name"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500  focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Company Type */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Company Type
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>

//             <div className="relative">

//               {/* Icon */}
//               <Image
//                 src="/icons/companytype1.jpg"
//                 alt="Company Type"
//                 width={20}
//                 height={20}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-black"
//               />

//               <Select
//                 options={companyTypeOptions}
//                 menuPortalTarget={portalTarget}
//                 value={
//                   companyTypeOptions.find(
//                     (opt) => parseInt(opt.value) === formData.companyTypeId
//                   ) || null
//                 }
//                 onChange={onCompanyTypeChange}
//                 placeholder={
//                   loadingStates.companyTypes
//                     ? "Loading..."
//                     : "Select Company Type"
//                 }
//                 isLoading={loadingStates.companyTypes}
//                 isDisabled={loadingStates.companyTypes}
//                 theme={(theme) => ({
//                   ...theme,
//                   colors: {
//                     ...theme.colors,
//                     primary: "#4B0082",
//                     primary25: "#F3E8FF",
//                     primary50: "#E9D5FF",
//                   },
//                 })}
//                 styles={{
//                   ...selectStyles,
//                   control: (base: any, state: any) => ({
//                     ...selectStyles.control(base, state),
//                     paddingLeft: "30px", // space for icon
//                   }),
//                 }}
//               />
//             </div>
//           </div>

//           {/* Seller Type */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Seller Type
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>

//             <div className="relative">

//               {/* Icon */}
//               <Image
//                 src="/icons/sellertype1.jpg"
//                 alt="Seller Type"
//                 width={20}
//                 height={20}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
//               />

//               <Select
//                 options={sellerTypeOptions}
//                 value={
//                   sellerTypeOptions.find(
//                     (opt) => parseInt(opt.value) === formData.sellerTypeId
//                   ) || null
//                 }
//                 onChange={onSellerTypeChange}
//                 menuPortalTarget={typeof window !== "undefined" ? document.body : null}
//                 placeholder={
//                   loadingStates.sellerTypes
//                     ? "Loading..."
//                     : "Select Seller Type"
//                 }
//                 isLoading={loadingStates.sellerTypes}
//                 isDisabled={loadingStates.sellerTypes}
//                 theme={(theme) => ({
//                   ...theme,
//                   colors: {
//                     ...theme.colors,
//                     primary: "#4B0082",
//                     primary25: "#F3E8FF",
//                     primary50: "#E9D5FF",
//                   },
//                 })}
//                 styles={{
//                   ...selectStyles,
//                   control: (base: any, state: any) => ({
//                     ...selectStyles.control(base, state),
//                     paddingLeft: "30px",
//                   }),
//                 }}
//               />
//             </div>
//           </div>

//           {/* Product Types - Custom Multi-Select with dropdown */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Product Type(s)
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative" ref={productDropdownRef}>
//               <Image
//                 src="/icons/producttype1.jpg"
//                 alt="Product Type"
//                 width={20}
//                 height={20}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
//               />
//               <div
//                 className="w-full h-12 pl-10 pr-4 border border-neutral-500 rounded-2xl bg-white cursor-pointer flex justify-between items-center hover:border-[#4B0082] transition-all"
//                 onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
//               >
//                 <span className={formData.productTypes.length === 0 ? "text-neutral-500" : "text-neutral-900"}>
//                   {loadingStates.productTypes
//                     ? "Loading product types..."
//                     : formData.productTypes.length > 0
//                       ? `${formData.productTypes.length} product type(s) selected`
//                       : "Select Product Types"}
//                 </span>
//                 <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
//               </div>

//               {isProductDropdownOpen && !loadingStates.productTypes && (
//                 <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
//                   {/* <div className="p-2 border-b border-neutral-200 sticky top-0 bg-white">
//                     <p className="text-sm text-neutral-600 font-medium">
//                       Select product types:
//                     </p>
//                   </div> */}
//                   <div className="max-h-60 overflow-y-auto">
//                     {/* Select All */}
//                     {productTypes.length > 0 && (
//                       <div
//                         className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200"
//                         onClick={onSelectAll}
//                       >
//                         <input
//                           type="checkbox"
//                           checked={productTypes.length > 0 && formData.productTypes.length === productTypes.length}
//                           onChange={() => { }}
//                           className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
//                         />
//                         <label className="ml-3 text-sm font-medium text-[#4B0082] cursor-pointer">
//                           Select All
//                         </label>
//                       </div>
//                     )}

//                     {/* Individual Products */}
//                     {productTypes.map((product) => (
//                       <div
//                         key={product.productTypeId}
//                         className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
//                         onClick={() => onProductToggle(product)}
//                       >
//                         <input
//                           type="checkbox"
//                           checked={formData.productTypeIds.includes(product.productTypeId)}
//                           onChange={() => { }}
//                           className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
//                         />
//                         <label className="ml-3 text-sm text-neutral-900 cursor-pointer">
//                           {product.productTypeName}
//                           {product.regulatoryCategory && (
//                             <span className="ml-2 text-xs text-[#4B0082]">
//                               ({product.regulatoryCategory})
//                             </span>
//                           )}
//                         </label>
//                       </div>
//                     ))}
//                   </div>
//                   {/* <div className="p-2 border-t border-neutral-200 bg-purple-50 sticky bottom-0">
//                     <p className="text-xs text-neutral-600">
//                       {formData.productTypes.length} of {productTypes.length} selected
//                     </p>
//                   </div> */}
//                 </div>
//               )}
//             </div>
//             {formData.productTypes.length > 0 && (
//               <div className="mt-2">
//                 <p className="text-sm text-green-600">
//                   <i className="bi bi-check-circle-fill mr-1"></i>
//                   Selected: {formData.productTypes.join(", ")}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Address Fields */}
//       <div className="grid grid-cols-2 gap-x-6 gap-y-3">
//         {/* State */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             State
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>
//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" />
//             <Select
//               options={stateOptions}
//               value={stateOptions.find(opt => parseInt(opt.value) === formData.stateId) || null}
//               menuPortalTarget={portalTarget}
//               onChange={onStateChange}
//               placeholder={loadingStates.states ? "Loading..." : "Select State"}
//               isLoading={loadingStates.states}
//               isDisabled={loadingStates.states}
//               theme={(theme) => ({
//                 ...theme,
//                 colors: {
//                   ...theme.colors,
//                   primary: "#4B0082",
//                   primary25: "#F3E8FF",
//                   primary50: "#E9D5FF",
//                 },
//               })}
//               styles={selectWithIconStyles}
//             />
//           </div>
//         </div>

//         {/* District */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             District
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>

//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" />

//             <Select
//               options={districtOptions}
//               value={districtOptions.find(opt => parseInt(opt.value) === formData.districtId) || null}
//               onChange={onDistrictChange}
//               menuPortalTarget={portalTarget}
//               placeholder={loadingStates.districts ? "Loading..." : "Select District"}
//               isLoading={loadingStates.districts}
//               isDisabled={!formData.stateId || loadingStates.districts}
//               theme={(theme) => ({
//                 ...theme,
//                 colors: {
//                   ...theme.colors,
//                   primary: "#4B0082",
//                   primary25: "#F3E8FF",
//                   primary50: "#E9D5FF",
//                 },
//               })}
//               styles={{
//                 ...selectWithIconStyles,
//                 menuPortal: (base: any) => ({
//                   ...base,
//                   zIndex: 9999,
//                 }),
//                 menu: (base: any) => ({
//                   ...base,
//                   zIndex: 9999,
//                 }),
//               }}
//             />
//           </div>
//         </div>

//         {/* Taluka */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             Taluka
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>

//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" />

//             <Select
//               options={talukaOptions}
//               value={talukaOptions.find(opt => parseInt(opt.value) === formData.talukaId) || null}
//               onChange={onTalukaChange}
//               menuPortalTarget={portalTarget}
//               placeholder={loadingStates.talukas ? "Loading..." : "Select Taluka"}
//               isLoading={loadingStates.talukas}
//               isDisabled={!formData.districtId || loadingStates.talukas}
//               theme={(theme) => ({
//                 ...theme,
//                 colors: {
//                   ...theme.colors,
//                   primary: "#4B0082",
//                   primary25: "#F3E8FF",
//                   primary50: "#E9D5FF",
//                 },
//               })}
//               styles={selectWithIconStyles}
//             />
//           </div>
//         </div>

//         {/* City */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             City / Town / Village
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>

//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

//             <input
//               type="text"
//               name="city"
//               value={formData.city}
//               onChange={(e) => onAlphabetInput(e, "city")}
//               placeholder="Enter City/Town/Village"
//               className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//             />
//           </div>
//         </div>

//         {/* Street */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             Street / Area / Road
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>

//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

//             <input
//               type="text"
//               name="street"
//               value={formData.street}
//               onChange={(e) => onAlphabetInput(e, "street")}
//               placeholder="Enter Street/Area/Road"
//               className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//             />
//           </div>
//         </div>

//         {/* Building/House No */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             Building / House No.
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>
//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2  w-5 h-5" />
//             <input
//               type="text"
//               name="buildingNo"
//               value={formData.buildingNo}
//               onChange={onChange}
//               placeholder="Enter Building/House No."
//               className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//             />
//           </div>
//         </div>

//         {/* Pincode */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             Pin Code
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>

//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

//             <input
//               type="text"
//               name="pincode"
//               value={formData.pincode}
//               onChange={(e) => onNumericInput(e, "pincode", 6)}
//               placeholder="Enter 6-Digit Pincode"
//               maxLength={6}
//               className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//             />
//           </div>
//         </div>

//         {/* Landmark */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             Landmark
//           </label>
//           <input
//             type="text"
//             name="landmark"
//             value={formData.landmark}
//             onChange={onChange}
//             placeholder="Enter Landmark"
//             className="w-full h-12 px-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//           />
//         </div>
//       </div>

//       {/* Contact Fields */}
//       <div className="grid grid-cols-2 gap-x-6 gap-y-3">
//         {/* Phone */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             Company Phone
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>
//           <div className="relative">
//             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//             <input
//               type="tel"
//               name="phone"
//               value={formData.phone}
//               onChange={(e) => onNumericInput(e, "phone", 10)}
//               placeholder="Enter Company Phone"
//               maxLength={10}
//               className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//             />
//           </div>
//         </div>

//         {/* Email */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             Company Email
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>
//           <div className="relative">
//             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={onChange}
//               placeholder="Enter Company Email ID"
//               className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//             />
//           </div>
//         </div>

//         {/* Website */}
//         <div className="flex flex-col gap-1">
//           <label className="text-label-l3 text-neutral-700 font-semibold">
//             Website
//           </label>
//           <div className="relative">
//             <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//             <input
//               type="text"
//               name="website"
//               value={formData.website}
//               onChange={onChange}
//               placeholder="URL:\\"
//               className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Buttons - Updated to match DocumentForm styling */}
//       <div className="flex justify-between mt-10">
//         <div className="flex gap-4">
//           <button
//             onClick={() => router.push("/")}
//             className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold">
//             Cancel
//           </button>

//           {/* <button className="flex h-12 px-6 py-3 justify-center items-center gap-2 rounded-md bg-[#9F75FC] text-white font-semibold hover:bg-[#B08DFC] transition">
//             <Image
//               src="/icons/savedrafticon.png"
//               alt="Save Draft"
//               width={18}
//               height={18}
//             />
//             Save Draft
//           </button> */}
//         </div>

//         <div className="flex gap-4">
//           {/* <button
//             onClick={prevStep}
//             className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold hover:neutral-500 hover:text-neutral-500 transition"
//           >
//             <Image
//               src="/icons/backbuttonicon.png"
//               alt="Back"
//               width={18}
//               height={18}
//             />
//             Back
//           </button> */}

//           <button
//             onClick={nextStep}
//             className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-900 text-primary-900 font-semibold hover:border-primary-100 transition"
//           >
//             Continue
//             <Image
//               src="/icons/arrowForward.png"
//               alt="Continue"
//               width={20}
//               height={20}
//             />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
