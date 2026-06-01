"use client";

import React, { useState } from "react";
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
import { toast } from "react-toastify";

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
  onCompanyRegFileChange: (file: File | null) => void;
  setIsProductDropdownOpen: (open: boolean) => void;
  prevStep: () => void;
  nextStep: () => void;
}

// Country codes data for company phone with validation rules
const companyCountryCodes = [
  {
    code: "+91",
    country: "India",
    flag: "🇮🇳",
    validate: (value: string) => {
      if (value.length !== 10) return "Mobile number must be exactly 10 digits";
      if (!/^[6-9]/.test(value)) return "Indian mobile number must start with 6, 7, 8, or 9";
      return null;
    }
  },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸", validate: (value: string) => null },
  { code: "+44", country: "UK", flag: "🇬🇧", validate: (value: string) => null },
  { code: "+61", country: "Australia", flag: "🇦🇺", validate: (value: string) => null },
  { code: "+971", country: "UAE", flag: "🇦🇪", validate: (value: string) => null },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", validate: (value: string) => null },
  { code: "+20", country: "Egypt", flag: "🇪🇬", validate: (value: string) => null },
];

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
  onCompanyRegFileChange,
  setIsProductDropdownOpen,
  prevStep,
  nextStep,
}: Props) {

  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [selectedCompanyCountryCode, setSelectedCompanyCountryCode] = useState("+91");
  const [isCompanyPhoneDropdownOpen, setIsCompanyPhoneDropdownOpen] = useState(false);
  const [companyPhoneError, setCompanyPhoneError] = useState("");

  // State for custom dropdowns
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const companyDropdownRef = React.useRef<HTMLDivElement>(null);
  const sellerDropdownRef = React.useRef<HTMLDivElement>(null);
  const stateDropdownRef = React.useRef<HTMLDivElement>(null);
  const districtDropdownRef = React.useRef<HTMLDivElement>(null);
  const talukaDropdownRef = React.useRef<HTMLDivElement>(null);
  const companyPhoneDropdownRef = React.useRef<HTMLDivElement>(null);

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
      if (companyPhoneDropdownRef.current && !companyPhoneDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyPhoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const handleCompanyRegUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
        return;
      }

      setUploading(true);
      toast.info("Uploading company registration certificate...");

      setTimeout(() => {
        onCompanyRegFileChange(file);
        setUploading(false);
        toast.success("Company registration certificate uploaded");
      }, 1000);
    }
  };

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

  const handleCompanyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (selectedCompanyCountryCode === "+91") {
      value = value.replace(/\D/g, '');

      if (value.length === 1 && !/^[6-9]$/.test(value)) {
        return;
      }

      if (value.length <= 10) {
        const selectedCountry = companyCountryCodes.find(c => c.code === selectedCompanyCountryCode);
        if (selectedCountry && selectedCountry.validate) {
          const error = selectedCountry.validate(value);
          setCompanyPhoneError(error || "");
        }

        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            name: "phone",
            value: value
          }
        };
        onNumericInput(syntheticEvent, "phone", 10);
      }
    } else {
      value = value.replace(/\D/g, '');
      if (value.length <= 15) {
        setCompanyPhoneError("");
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            name: "phone",
            value: value
          }
        };
        onNumericInput(syntheticEvent, "phone", 15);
      }
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (selectedCompanyCountryCode === "+91") {
      const currentValue = formData.phone || "";
      if (currentValue.length === 0) {
        const key = e.key;
        if (/^[0-5]$/.test(key)) {
          e.preventDefault();
        }
      }
    }
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    let cleanedText = pastedText.replace(/\D/g, '');

    if (selectedCompanyCountryCode === "+91") {
      if (cleanedText.length > 0) {
        if (!/^[6-9]/.test(cleanedText)) {
          cleanedText = '';
        } else {
          cleanedText = cleanedText.substring(0, 10);
        }
      }
    } else {
      cleanedText = cleanedText.substring(0, 15);
    }

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: "phone",
        value: cleanedText
      }
    } as any;
    handleCompanyPhoneChange(syntheticEvent);
  };

  const getMaxLength = () => {
    if (selectedCompanyCountryCode === "+91") return 10;
    return 15;
  };

  const getPlaceholder = () => {
    if (selectedCompanyCountryCode === "+91") return "Enter 10-digit mobile number";
    return "Enter phone number";
  };

  return (
    <div className="flex flex-col gap-5 bg-white">
      {/* Header Section */}
      <div className="text-black">
        <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
          Company Details
        </div>
        <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
          Please ensure the Company Name matches your GST and Drug License exactly.
        </div>
      </div>

      {/* Company Details Section */}
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
          {/* Row 1: Company Name | Company Type */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Seller Name / Company Name:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <input
                type="text"
                name="sellerName"
                autoComplete="off"
                value={formData.sellerName}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\s{2,}/g, ' ');
                  if (value.length <= 60) {
                    const syntheticEvent = {
                      ...e,
                      target: { ...e.target, name: "sellerName", value }
                    };
                    onChange(syntheticEvent);
                  }
                }}
                maxLength={60}
                placeholder="Enter Your Name/Company Name"
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Company Type:
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
                className="w-full h-13 pl-10 pr-4 border border-neutral-500 rounded-xl bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
              >
                <span className={!getSelectedCompanyLabel() ? "text-p4 font-body font-regular text-pneutral-500" : "text-p4 font-body font-regular text-pneutral-900"}>
                  {loadingStates.companyTypes
                    ? "Loading..."
                    : getSelectedCompanyLabel() || "Select Company Type"}
                </span>
                <ChevronDown className={`w-5 h-5 text-pneutral-900 transition-transform ${openDropdown === 'company' ? 'rotate-180' : ''}`} />
              </div>

              {openDropdown === 'company' && !loadingStates.companyTypes && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
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
                        <span className="text-p4 font-body font-regular text-pneutral-900">
                          {type.companyTypeName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Company Registration Certificate Upload | Seller Type */}
<div className="flex flex-col gap-1">
  <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
    Company Type Certificate
    <span className="text-warning-500 font-semibold ml-1">*</span>
  </label>

  {/* Hidden File Input - placed above the icon div */}
  <input
    id="company-reg-upload"
    type="file"
    onChange={handleCompanyRegUpload}
    accept=".pdf,.jpg,.jpeg,.png"
    className="hidden"
    disabled={uploading}
  />

  <div className="flex items-center h-[52px] border border-neutral-500 rounded-xl overflow-hidden bg-white">
    {/* Upload Icon Box - with border on all sides */}
    <div 
      className="w-13 h-full bg-secondary-800 flex items-center justify-center shrink-0"
      onClick={() => document.getElementById("company-reg-upload")?.click()}
    >
      <Image
        src="/icons/upload.png"
        alt="Upload"
        width={18}
        height={18}
        className="brightness-0 invert"
      />
    </div>

    {/* Content Area - with border on top, right, bottom (no left border to avoid double border) */}
    <div
      className="flex-1 h-full bg-white flex items-center cursor-pointer px-3"
      onClick={() => document.getElementById("company-reg-upload")?.click()}
    >
      <div className="flex-1 flex items-center min-w-0">
        {uploading ? (
          <span className="text-p4 font-body font-regular text-pneutral-500">
            Uploading...
          </span>
        ) : formData.companyRegistrationCertificateFile?.name ? (
          <div
            className="flex items-center gap-2 bg-sneutral-800 rounded-md px-3 py-1 max-w-fit"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-p4 font-body font-regular text-white truncate max-w-[120px]">
              {formData.companyRegistrationCertificateFile.name}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCompanyRegFileChange(null);
                const fileInput = document.getElementById(
                  "company-reg-upload"
                ) as HTMLInputElement;
                if (fileInput) fileInput.value = "";
              }}
              className="shrink-0"
              aria-label="Remove file"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <span className="text-p4 font-body font-regular text-pneutral-500">
            Upload the Certificate
          </span>
        )}
      </div>
    </div>
  </div>
</div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Seller Type:
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
                className="w-full h-13 pl-10 pr-4 border border-neutral-500 rounded-xl bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setOpenDropdown(openDropdown === 'seller' ? null : 'seller')}
              >
                <span className={!getSelectedSellerLabel() ? "text-p4 font-body font-regular text-pneutral-500" : "text-p4 font-body font-regular text-pneutral-900"}>
                  {loadingStates.sellerTypes
                    ? "Loading..."
                    : getSelectedSellerLabel() || "Select Seller Type"}
                </span>
                <ChevronDown className={`w-5 h-5 text-pneutral-900 transition-transform ${openDropdown === 'seller' ? 'rotate-180' : ''}`} />
              </div>

              {openDropdown === 'seller' && !loadingStates.sellerTypes && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
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
                        <span className="text-p4 font-body font-regular text-pneutral-900">
                          {type.sellerTypeName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Product Types | State */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Product Type(s):
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
                className="w-full h-13 pl-10 pr-4 border border-neutral-500 rounded-xl bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
              >
                <span className={formData.productTypes.length === 0 ? "text-p4 font-body font-regular text-pneutral-500" : "text-p4 font-body font-regular text-pneutral-900"}>
                  {loadingStates.productTypes
                    ? "Loading product types..."
                    : formData.productTypes.length > 0
                      ? `${formData.productTypes.length} product type(s) selected`
                      : "Select Product Types"}
                </span>
                <ChevronDown className={`w-5 h-5 text-pneutral-900 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isProductDropdownOpen && !loadingStates.productTypes && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  <div className="max-h-60 overflow-y-auto">
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
                        <label className="ml-3 text-p4 font-body font-regular text-[#4B0082] cursor-pointer">
                          Select All
                        </label>
                      </div>
                    )}

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
                        <label className="ml-3 text-p4 font-body font-regular text-pneutral-900 cursor-pointer">
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
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              State:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={stateDropdownRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <div
                className="w-full h-13 pl-10 pr-4 border border-neutral-500 rounded-xl bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setOpenDropdown(openDropdown === 'state' ? null : 'state')}
              >
                <span className={!getSelectedStateLabel() ? "text-p4 font-body font-regular text-pneutral-500" : "text-p4 font-body font-regular text-pneutral-900"}>
                  {loadingStates.states
                    ? "Loading..."
                    : getSelectedStateLabel() || "Select State"}
                </span>
                <ChevronDown className={`w-5 h-5 text-pneutral-900 transition-transform ${openDropdown === 'state' ? 'rotate-180' : ''}`} />
              </div>

              {openDropdown === 'state' && !loadingStates.states && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
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
                        <span className="text-p4 font-body font-regular text-pneutral-900">
                          {state.stateName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: District | Taluka */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              District:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={districtDropdownRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <div
                className={`w-full h-13 pl-10 pr-4 border border-neutral-500 rounded-xl bg-white flex justify-between items-center ${formData.stateId ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-50'}`}
                onClick={() => formData.stateId && setOpenDropdown(openDropdown === 'district' ? null : 'district')}
              >
                <span className={!getSelectedDistrictLabel() ? "text-p4 font-body font-regular text-pneutral-500" : "text-p4 font-body font-regular text-pneutral-900"}>
                  {loadingStates.districts
                    ? "Loading..."
                    : getSelectedDistrictLabel() || "Select District"}
                </span>
                {formData.stateId && (
                  <ChevronDown className={`w-5 h-5 text-pneutral-900 transition-transform ${openDropdown === 'district' ? 'rotate-180' : ''}`} />
                )}
              </div>

              {openDropdown === 'district' && !loadingStates.districts && formData.stateId && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
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
                        <span className="text-p4 font-body font-regular text-pneutral-900">
                          {district.districtName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Taluka:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={talukaDropdownRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <div
                className={`w-full h-13 pl-10 pr-4 border border-neutral-500 rounded-xl bg-white flex justify-between items-center ${formData.districtId ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-50'}`}
                onClick={() => formData.districtId && setOpenDropdown(openDropdown === 'taluka' ? null : 'taluka')}
              >
                <span className={!getSelectedTalukaLabel() ? "text-p4 font-body font-regular text-pneutral-500" : "text-p4 font-body font-regular text-pneutral-900"}>
                  {loadingStates.talukas
                    ? "Loading..."
                    : getSelectedTalukaLabel() || "Select Taluka"}
                </span>
                {formData.districtId && (
                  <ChevronDown className={`w-5 h-5 text-pneutral-900 transition-transform ${openDropdown === 'taluka' ? 'rotate-180' : ''}`} />
                )}
              </div>

              {openDropdown === 'taluka' && !loadingStates.talukas && formData.districtId && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
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
                        <span className="text-p4 font-body font-regular text-pneutral-900">
                          {taluka.talukaName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 5: City | Building No. */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              City / Town / Village:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <input
                type="text"
                name="city"
                autoComplete="new-password"
                value={formData.city}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\s{2,}/g, ' ');
                  if (value.length <= 100) {
                    const syntheticEvent = {
                      ...e,
                      target: { ...e.target, name: "city", value }
                    };
                    onChange(syntheticEvent);
                  }
                }}
                maxLength={100}
                placeholder="Enter City/Town/Village"
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Building No./House No.:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <input
                type="text"
                name="buildingNo"
                autoComplete="off"
                value={formData.buildingNo}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\s{2,}/g, ' ');
                  if (value.length <= 50) {
                    const syntheticEvent = {
                      ...e,
                      target: { ...e.target, name: "buildingNo", value }
                    };
                    onChange(syntheticEvent);
                  }
                }}
                maxLength={50}
                placeholder="Enter Building/House No."
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
              />
            </div>
          </div>

          {/* Row 6: Street | Pincode */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Street / Road / Lane:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <input
                type="text"
                name="street"
                autoComplete="off"
                value={formData.street}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\s{2,}/g, ' ');
                  if (value.length <= 100) {
                    const syntheticEvent = {
                      ...e,
                      target: { ...e.target, name: "street", value }
                    };
                    onChange(syntheticEvent);
                  }
                }}
                maxLength={100}
                placeholder="Enter Street/Area/Road"
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Pin Code:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <input
                type="text"
                name="pincode"
                autoComplete="new-password"
                value={formData.pincode}
                onChange={(e) => onNumericInput(e, "pincode", 6)}
                placeholder="Enter 6-Digit Pincode"
                maxLength={6}
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
              />
            </div>
          </div>

          {/* Row 7: Landmark | Company Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Landmark (optional):
            </label>
            <input
              type="text"
              name="landmark"
              autoComplete="off"
              value={formData.landmark}
              onChange={(e) => {
                let value = e.target.value;
                value = value.replace(/\s{2,}/g, ' ');
                const allowedChars = /^[a-zA-Z0-9\s]*$/;
                if (value.length <= 100 && (value === "" || allowedChars.test(value))) {
                  const syntheticEvent = {
                    ...e,
                    target: { ...e.target, name: "landmark", value }
                  };
                  onChange(syntheticEvent);
                }
              }}
              maxLength={100}
              placeholder="Enter Landmark"
              className="w-full h-13 px-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Company Website (Optional):
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <input
                type="text"
                name="website"
                autoComplete="off"
                value={formData.website}
                onChange={onChange}
                placeholder="https://example.com"
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Company Phone:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={companyPhoneDropdownRef}>
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900 z-10" />
              <div className="flex">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCompanyPhoneDropdownOpen(!isCompanyPhoneDropdownOpen)}
                    className="h-13 px-2 pl-10 pr-2 rounded-l-md border border-r-0 border-neutral-500 bg-white flex items-center gap-1 focus:outline-none"
                  >
                    <span className="text-p4 font-body font-regular text-pneutral-900">{selectedCompanyCountryCode}</span>
                    <ChevronDown className="w-4 h-4 text-pneutral-900" />
                  </button>

                  {isCompanyPhoneDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsCompanyPhoneDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-neutral-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                        {companyCountryCodes.map((country) => (
                          <button
                            key={country.code}
                            onClick={() => {
                              setSelectedCompanyCountryCode(country.code);
                              setCompanyPhoneError("");
                              const syntheticEvent = {
                                target: {
                                  name: "phone",
                                  value: ""
                                }
                              } as any;
                              onNumericInput(syntheticEvent, "phone", country.code === "+91" ? 10 : 15);
                              setIsCompanyPhoneDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2.5 text-left hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span className="text-p4 font-body font-semibold text-pneutral-900">{country.code}</span>
                            <span className="text-p2 font-body font-regular text-pneutral-500">{country.country}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <input
                  type="tel"
                  name="phone"
                  autoComplete="new-password"
                  value={formData.phone}
                  onChange={handleCompanyPhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  onPaste={handlePhonePaste}
                  placeholder={getPlaceholder()}
                  maxLength={getMaxLength()}
                  className={`flex-1 h-13 px-4 pr-4 rounded-r-md border focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500 ${companyPhoneError ? 'border-red-500' : 'border-neutral-500'}`}
                />
              </div>
              {companyPhoneError && (
                <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                  <span className="mr-1">⚠️</span>
                  <span>{companyPhoneError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 8: Company Email */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Company Email ID:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <input
                type="email"
                name="email"
                autoComplete="new-password"
                value={formData.email}
                onChange={onChange}
                placeholder="Enter Company Email ID"
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
              />
            </div>
          </div>

          
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-10">
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={nextStep}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-800 text-primary-800 font-semibold"
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