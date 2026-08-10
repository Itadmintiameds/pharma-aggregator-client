"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Globe, ChevronDown, AlertCircle } from "lucide-react";
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
import { classifySellerType } from "@/src/schema/seller/sellerRegSchema";
import { isRealFileUrl } from "@/src/utils/sellerRegFiles";
import UploadedFileChip from "./UploadedFileChip";
import FormInput from "./FormInput";

interface Props {
  formData: any;
  errors: Record<string, string>;
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
  onDeleteCompanyRegistrationCertificate: () => void;
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

function DropdownSearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="p-2 border-b border-neutral-200 sticky top-0 bg-white">
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg border border-neutral-300 text-p4 font-body font-regular text-pneutral-900 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-200"
      />
    </div>
  );
}

export default function CompanyForm({
  formData,
  errors,
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
  onDeleteCompanyRegistrationCertificate,
  setIsProductDropdownOpen,
  prevStep,
  nextStep,
}: Props) {

  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [selectedCompanyCountryCode, setSelectedCompanyCountryCode] = useState("+91");
  const [isCompanyPhoneDropdownOpen, setIsCompanyPhoneDropdownOpen] = useState(false);
  const [companyPhoneError, setCompanyPhoneError] = useState("");
  // Inline feedback for a rejected keystroke on the landmark field - shown
  // until the next valid keystroke or blur, same convention as the other
  // transient format errors on this step.
  const [landmarkFormatError, setLandmarkFormatError] = useState<string>("");

  // State for custom dropdowns
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const companyDropdownRef = React.useRef<HTMLDivElement>(null);
  const sellerDropdownRef = React.useRef<HTMLDivElement>(null);
  const stateDropdownRef = React.useRef<HTMLDivElement>(null);
  const districtDropdownRef = React.useRef<HTMLDivElement>(null);
  const talukaDropdownRef = React.useRef<HTMLDivElement>(null);
  const companyPhoneDropdownRef = React.useRef<HTMLDivElement>(null);

  // Search terms for dropdown filtering. `dropdownSearch` is shared by the
  // single-select dropdowns since only one of them (openDropdown) can be open
  // at a time; the product multi-select and phone country picker have their
  // own state since they can be open independently of `openDropdown`.
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [phoneCountrySearch, setPhoneCountrySearch] = useState("");

  React.useEffect(() => {
    setDropdownSearch("");
  }, [openDropdown]);

  React.useEffect(() => {
    if (!isProductDropdownOpen) setProductSearch("");
  }, [isProductDropdownOpen]);

  React.useEffect(() => {
    if (!isCompanyPhoneDropdownOpen) setPhoneCountrySearch("");
  }, [isCompanyPhoneDropdownOpen]);

  const filteredCompanyTypes = companyTypes
    .filter((type) =>
      type.companyTypeName.toLowerCase().includes(dropdownSearch.toLowerCase())
    )
    .sort((a, b) => a.companyTypeName.localeCompare(b.companyTypeName));
  const filteredSellerTypes = sellerTypes
    .filter((type) => type.isActive)
    .filter((type) => type.sellerTypeName.toLowerCase().includes(dropdownSearch.toLowerCase()))
    .sort((a, b) => a.sellerTypeName.localeCompare(b.sellerTypeName));
  const filteredStates = states
    .filter((state) =>
      state.stateName.toLowerCase().includes(dropdownSearch.toLowerCase())
    )
    .sort((a, b) => a.stateName.localeCompare(b.stateName));
  const filteredDistricts = districts
    .filter((district) =>
      district.districtName.toLowerCase().includes(dropdownSearch.toLowerCase())
    )
    .sort((a, b) => a.districtName.localeCompare(b.districtName));
  const filteredTalukas = talukas
    .filter((taluka) =>
      taluka.talukaName.toLowerCase().includes(dropdownSearch.toLowerCase())
    )
    .sort((a, b) => a.talukaName.localeCompare(b.talukaName));
  const filteredProductTypes = productTypes
    .filter((product) =>
      product.productTypeName.toLowerCase().includes(productSearch.toLowerCase())
    )
    .sort((a, b) => a.productTypeName.localeCompare(b.productTypeName));
  const filteredCompanyCountryCodes = companyCountryCodes
    .filter(
      (country) =>
        country.country.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
        country.code.includes(phoneCountrySearch)
    )
    .sort((a, b) => a.country.localeCompare(b.country));

  // Skip auto-closing a dropdown when focus is moving to an element still
  // inside its container (e.g. the search input) — the click-outside
  // listener above is what actually closes it on a real outside click.
  const handleDropdownBlur = (
    e: React.FocusEvent<HTMLDivElement>,
    name: string,
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => {
    const nextFocus = e.relatedTarget as Node | null;
    if (containerRef.current && nextFocus && containerRef.current.contains(nextFocus)) {
      return;
    }
    setTimeout(() => {
      setOpenDropdown((current) => (current === name ? null : current));
    }, 150);
  };


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

  // Drives the conditional Parent Manufacturer Name / Brand Owner Name fields
  // below. Reuses formData.sellerType (already tracked seller type display
  // name) rather than threading a new prop.
  const sellerTypeCategory = classifySellerType(formData.sellerType);

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

  // Custom dropdown divs have no native keyboard behavior. Enter/Space opens
  // them like a real select; the closing setTimeout (not an immediate close)
  // lets an option's onClick fire before the option list unmounts on blur,
  // since Tab/mouse-click-away both blur the div before the option's click
  // event would otherwise land on a removed node.
  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, name: string, enabled = true) => {
    if (!enabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenDropdown(openDropdown === name ? null : name);
    } else if (e.key === "Escape") {
      setOpenDropdown(null);
    }
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
          <FormInput
            label="Seller Name / Company Name:"
            required
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
            leftIcon={<HiOutlineUserGroup className="w-5 h-5" />}
            error={errors.sellerName}
          />

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
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'company'}
                className={`w-full h-13 pl-10 pr-4 border rounded-xl bg-white cursor-pointer flex justify-between items-center focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${errors.companyTypeId ? "border-red-500" : "border-neutral-500"}`}
                onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'company')}
                onBlur={(e) => handleDropdownBlur(e, 'company', companyDropdownRef)}
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
                  <DropdownSearchInput value={dropdownSearch} onChange={setDropdownSearch} placeholder="Search company type..." />
                  <div className="max-h-60 overflow-y-auto">
                    {filteredCompanyTypes.length === 0 && (
                      <div className="px-4 py-2 text-p4 font-body font-regular text-pneutral-500">No results found</div>
                    )}
                    {filteredCompanyTypes.map((type) => (
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
            {errors.companyTypeId && (
              <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                <span>{errors.companyTypeId}</span>
              </p>
            )}
          </div>

          {/* Row 2: Company Registration Certificate Upload | Seller Type */}
<div className="flex flex-col gap-1">
  <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
    Company Type Certificate
    <span className="text-warning-500 font-semibold ml-1">*</span>
  </label>

  {/* Hidden File Input - placed above the icon div. Stays mounted even in the
      "already uploaded" state below so the chip's Edit button can trigger it
      to pick a replacement. */}
  <input
    id="company-reg-upload"
    type="file"
    onChange={handleCompanyRegUpload}
    accept=".pdf,.jpg,.jpeg,.png"
    className="hidden"
    disabled={uploading}
  />

  {!formData.companyRegistrationCertificateFile && isRealFileUrl(formData.companyRegistrationCertificateUrl) ? (
    <UploadedFileChip
      url={formData.companyRegistrationCertificateUrl}
      fileName={formData.companyRegistrationCertificateFileName}
      inputId="company-reg-upload"
      onDelete={onDeleteCompanyRegistrationCertificate}
    />
  ) : (
  <div
    tabIndex={uploading ? -1 : 0}
    role="button"
    aria-label="Upload Company Type Certificate"
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        document.getElementById("company-reg-upload")?.click();
      }
    }}
    className={`flex items-center h-13 border rounded-xl overflow-hidden bg-white cursor-pointer focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${
      errors.companyRegistrationCertificateFile ? "border-red-500" : "border-neutral-500"
    }`}
    onClick={() => document.getElementById("company-reg-upload")?.click()}
  >
    {/* Upload Icon Box - with border on all sides */}
    <div
      className="w-13 h-full bg-secondary-800 flex items-center justify-center shrink-0"
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
      className="flex-1 h-full bg-white flex items-center px-3"
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
  )}
  {errors.companyRegistrationCertificateFile && (
    <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
      <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
      <span>{errors.companyRegistrationCertificateFile}</span>
    </p>
  )}
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
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'seller'}
                className={`w-full h-13 pl-10 pr-4 border rounded-xl bg-white cursor-pointer flex justify-between items-center focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${errors.sellerTypeId ? "border-red-500" : "border-neutral-500"}`}
                onClick={() => setOpenDropdown(openDropdown === 'seller' ? null : 'seller')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'seller')}
                onBlur={(e) => handleDropdownBlur(e, 'seller', sellerDropdownRef)}
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
                  <DropdownSearchInput value={dropdownSearch} onChange={setDropdownSearch} placeholder="Search seller type..." />
                  <div className="max-h-60 overflow-y-auto">
                    {filteredSellerTypes.length === 0 && (
                      <div className="px-4 py-2 text-p4 font-body font-regular text-pneutral-500">No results found</div>
                    )}
                    {filteredSellerTypes.map((type) => (
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
            {errors.sellerTypeId && (
              <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                <span>{errors.sellerTypeId}</span>
              </p>
            )}
          </div>

          {/* Row 2.5: Parent Manufacturer Name | Brand Owner Name - shown based on seller type */}
          {sellerTypeCategory === "PCD" && (
            <FormInput
              label="Parent Manufacturer Name:"
              required
              type="text"
              name="parentManufacturerName"
              autoComplete="off"
              value={formData.parentManufacturerName || ""}
              onChange={(e) => {
                let value = e.target.value;
                value = value.replace(/\s{2,}/g, ' ');
                if (value.length <= 100) {
                  const syntheticEvent = {
                    ...e,
                    target: { ...e.target, name: "parentManufacturerName", value }
                  };
                  onChange(syntheticEvent);
                }
              }}
              maxLength={100}
              placeholder="Enter Parent Manufacturer Name"
              error={errors.parentManufacturerName}
            />
          )}

          {sellerTypeCategory === "WHITE_LABELING" && (
            <>
              <FormInput
                label="Parent Manufacturer Name (optional):"
                type="text"
                name="parentManufacturerName"
                autoComplete="off"
                value={formData.parentManufacturerName || ""}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\s{2,}/g, ' ');
                  if (value.length <= 100) {
                    const syntheticEvent = {
                      ...e,
                      target: { ...e.target, name: "parentManufacturerName", value }
                    };
                    onChange(syntheticEvent);
                  }
                }}
                maxLength={100}
                placeholder="Enter Parent Manufacturer Name"
                error={errors.parentManufacturerName}
              />

              <FormInput
                label="Brand Owner Name (optional):"
                type="text"
                name="brandOwnerName"
                autoComplete="off"
                value={formData.brandOwnerName || ""}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\s{2,}/g, ' ');
                  if (value.length <= 100) {
                    const syntheticEvent = {
                      ...e,
                      target: { ...e.target, name: "brandOwnerName", value }
                    };
                    onChange(syntheticEvent);
                  }
                }}
                maxLength={100}
                placeholder="Enter Brand Owner Name"
                error={errors.brandOwnerName}
              />
            </>
          )}

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
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isProductDropdownOpen}
                className={`w-full h-13 pl-10 pr-4 border rounded-xl bg-white cursor-pointer flex justify-between items-center focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${errors.productTypeIds ? "border-red-500" : "border-neutral-500"}`}
                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsProductDropdownOpen(!isProductDropdownOpen);
                  } else if (e.key === "Escape") {
                    setIsProductDropdownOpen(false);
                  }
                }}
                onBlur={(e) => {
                  const nextFocus = e.relatedTarget as Node | null;
                  if (productDropdownRef.current && nextFocus && productDropdownRef.current.contains(nextFocus)) {
                    return;
                  }
                  setTimeout(() => setIsProductDropdownOpen(false), 150);
                }}
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
                  <DropdownSearchInput value={productSearch} onChange={setProductSearch} placeholder="Search product types..." />
                  <div className="max-h-60 overflow-y-auto">
                    {productSearch === "" && productTypes.length > 0 && (
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

                    {filteredProductTypes.length === 0 && (
                      <div className="px-4 py-2 text-p4 font-body font-regular text-pneutral-500">No results found</div>
                    )}

                    {filteredProductTypes.map((product) => (
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
            {errors.productTypeIds && (
              <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                <span>{errors.productTypeIds}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              State:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={stateDropdownRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <div
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'state'}
                className={`w-full h-13 pl-10 pr-4 border rounded-xl bg-white cursor-pointer flex justify-between items-center focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${errors.stateId ? "border-red-500" : "border-neutral-500"}`}
                onClick={() => setOpenDropdown(openDropdown === 'state' ? null : 'state')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'state')}
                onBlur={(e) => handleDropdownBlur(e, 'state', stateDropdownRef)}
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
                  <DropdownSearchInput value={dropdownSearch} onChange={setDropdownSearch} placeholder="Search state..." />
                  <div className="max-h-60 overflow-y-auto">
                    {filteredStates.length === 0 && (
                      <div className="px-4 py-2 text-p4 font-body font-regular text-pneutral-500">No results found</div>
                    )}
                    {filteredStates.map((state) => (
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
            {errors.stateId && (
              <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                <span>{errors.stateId}</span>
              </p>
            )}
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
                tabIndex={formData.stateId ? 0 : -1}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'district'}
                className={`w-full h-13 pl-10 pr-4 border rounded-xl flex justify-between items-center focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${
                  errors.districtId ? "border-red-500" : "border-neutral-500"
                } ${formData.stateId ? "cursor-pointer bg-white" : "cursor-not-allowed bg-neutral-100"}`}
                onClick={() => formData.stateId && setOpenDropdown(openDropdown === 'district' ? null : 'district')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'district', !!formData.stateId)}
                onBlur={(e) => handleDropdownBlur(e, 'district', districtDropdownRef)}
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
                  <DropdownSearchInput value={dropdownSearch} onChange={setDropdownSearch} placeholder="Search district..." />
                  <div className="max-h-60 overflow-y-auto">
                    {filteredDistricts.length === 0 && (
                      <div className="px-4 py-2 text-p4 font-body font-regular text-pneutral-500">No results found</div>
                    )}
                    {filteredDistricts.map((district) => (
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
            {errors.districtId && (
              <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                <span>{errors.districtId}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
              Taluka:
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={talukaDropdownRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <div
                tabIndex={formData.districtId ? 0 : -1}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'taluka'}
                className={`w-full h-13 pl-10 pr-4 border rounded-xl flex justify-between items-center focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${
                  errors.talukaId ? "border-red-500" : "border-neutral-500"
                } ${formData.districtId ? "cursor-pointer bg-white" : "cursor-not-allowed bg-neutral-100"}`}
                onClick={() => formData.districtId && setOpenDropdown(openDropdown === 'taluka' ? null : 'taluka')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'taluka', !!formData.districtId)}
                onBlur={(e) => handleDropdownBlur(e, 'taluka', talukaDropdownRef)}
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
                  <DropdownSearchInput value={dropdownSearch} onChange={setDropdownSearch} placeholder="Search taluka..." />
                  <div className="max-h-60 overflow-y-auto">
                    {filteredTalukas.length === 0 && (
                      <div className="px-4 py-2 text-p4 font-body font-regular text-pneutral-500">No results found</div>
                    )}
                    {filteredTalukas.map((taluka) => (
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
            {errors.talukaId && (
              <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                <span>{errors.talukaId}</span>
              </p>
            )}
          </div>

          {/* Row 5: City | Building No. */}
          <FormInput
            label="City / Town / Village:"
            required
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
            leftIcon={<MapPin className="w-5 h-5" />}
            error={errors.city}
          />

          <FormInput
            label="Building No./House No.:"
            required
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
            leftIcon={<MapPin className="w-5 h-5" />}
            error={errors.buildingNo}
          />

          {/* Row 6: Street | Pincode */}
          <FormInput
            label="Street / Road / Lane:"
            required
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
            leftIcon={<MapPin className="w-5 h-5" />}
            error={errors.street}
          />

          <FormInput
            label="Pin Code:"
            required
            type="text"
            name="pincode"
            autoComplete="new-password"
            value={formData.pincode}
            onChange={(e) => onNumericInput(e, "pincode", 6)}
            placeholder="Enter 6-Digit Pincode"
            maxLength={6}
            leftIcon={<MapPin className="w-5 h-5" />}
            error={errors.pincode}
          />

          {/* Row 7: Landmark | Company Phone */}
          <FormInput
            label="Landmark (optional):"
            type="text"
            name="landmark"
            autoComplete="off"
            value={formData.landmark}
            onChange={(e) => {
              let value = e.target.value;
              value = value.replace(/\s{2,}/g, ' ');
              const allowedChars = /^[a-zA-Z0-9\s]*$/;
              if (value.length <= 100 && (value === "" || allowedChars.test(value))) {
                setLandmarkFormatError("");
                const syntheticEvent = {
                  ...e,
                  target: { ...e.target, name: "landmark", value }
                };
                onChange(syntheticEvent);
              } else {
                setLandmarkFormatError("Landmark should only contain letters, numbers, and spaces");
              }
            }}
            onBlur={() => setLandmarkFormatError("")}
            maxLength={100}
            placeholder="Enter Landmark"
            error={errors.landmark || landmarkFormatError}
          />

          <FormInput
            label="Company Website (Optional):"
            type="text"
            name="website"
            autoComplete="off"
            value={formData.website}
            onChange={onChange}
            placeholder="https://example.com"
            leftIcon={<Globe className="w-5 h-5" />}
            error={errors.website}
          />

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
                    className={`h-13 px-2 pl-10 pr-2 rounded-l-xl border border-r-0 bg-white flex items-center gap-1 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${
                      (errors.phone || companyPhoneError) ? "border-red-500" : "border-neutral-500"
                    }`}
                  >
                    <span className="text-p4 font-body font-regular text-pneutral-900">{selectedCompanyCountryCode}</span>
                    <ChevronDown className="w-4 h-4 text-pneutral-900" />
                  </button>

                  {isCompanyPhoneDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsCompanyPhoneDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                        <DropdownSearchInput value={phoneCountrySearch} onChange={setPhoneCountrySearch} placeholder="Search country..." />
                        {filteredCompanyCountryCodes.length === 0 && (
                          <div className="px-3 py-2.5 text-p4 font-body font-regular text-pneutral-500">No results found</div>
                        )}
                        {filteredCompanyCountryCodes.map((country) => (
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

                <FormInput
                  containerClassName="flex-1"
                  inputClassName="rounded-l-none! rounded-r-xl! pl-4!"
                  type="tel"
                  name="phone"
                  autoComplete="new-password"
                  value={formData.phone}
                  onChange={handleCompanyPhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  onPaste={handlePhonePaste}
                  onBlur={() => setCompanyPhoneError("")}
                  placeholder={getPlaceholder()}
                  maxLength={getMaxLength()}
                  error={errors.phone || companyPhoneError}
                  hideMessage
                />
              </div>
            </div>
            {(errors.phone || companyPhoneError) && (
              <p className="text-p2 font-body font-regular text-red-500 flex items-start mt-1">
                <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                <span>{errors.phone || companyPhoneError}</span>
              </p>
            )}
          </div>

          {/* Row 8: Company Email */}
          <FormInput
            label="Company Email ID:"
            required
            type="email"
            name="email"
            autoComplete="new-password"
            value={formData.email}
            onChange={onChange}
            placeholder="Enter Company Email ID"
            leftIcon={<Mail className="w-5 h-5" />}
            error={errors.email}
          />

        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-10">
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold"
          >
            Back
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