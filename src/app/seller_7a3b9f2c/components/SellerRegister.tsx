"use client";
import React, { useState, useEffect, useRef } from "react";
import OtpVerification from "./OtpVerification";
import Header from "@/src/app/components/Header";
import { useRouter } from "next/navigation"; 

const IFSC_API = "https://ifsc.razorpay.com";
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const PRODUCT_TYPES = [
  {
    id: "drugs",
    name: "Drugs",
    licenseLabel: "Drug Manufacturing License",
    licensePlaceholder: "Enter drug manufacturing license number"
  },
  {
    id: "supplements",
    name: "Supplements/ Nutraceuticals",
    licenseLabel: "FSSAI License",
    licensePlaceholder: "Enter FSSAI license number"
  },
  {
    id: "food",
    name: "Food & Infant Nutrition",
    licenseLabel: "FSSAI License",
    licensePlaceholder: "Enter FSSAI license number"
  },
  {
    id: "cosmetic",
    name: "Cosmetic & Personal Care",
    licenseLabel: "CDSCO License",
    licensePlaceholder: "Enter CDSCO license number"
  },
  {
    id: "medical",
    name: "Medical Devices & Equipment",
    licenseLabel: "Medical Device License",
    licensePlaceholder: "Enter medical device license number"
  }
];

// interface SellerRegisterProps {
//   onBackToDashboard?: () => void;
// }

export default function SellerRegister(
  // { onBackToDashboard }: SellerRegisterProps
) 
  {
  const [step, setStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [ifscError, setIfscError] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle IFSC code change and auto-fill bank details
  const handleIfscChange = async (value: string) => {
    const ifsc = value.toUpperCase();

    setForm(prev => ({
      ...prev,
      ifscCode: ifsc
    }));

    setIfscError("");

    // Reset autofill if incomplete
    if (ifsc.length !== 11) {
      setForm(prev => ({
        ...prev,
        bankName: "",
        branch: "",
        bankState: "",
        bankDistrict: ""
      }));
      return;
    }

    if (!IFSC_REGEX.test(ifsc)) {
      setIfscError("Invalid IFSC format");
      return;
    }

    try {
      const res = await fetch(`${IFSC_API}/${ifsc}`);
      if (!res.ok) throw new Error();

      const data = await res.json();

      setForm(prev => ({
        ...prev,
        bankName: data.BANK || "",
        branch: data.BRANCH || "",
        bankState: data.STATE || "",
        bankDistrict: data.DISTRICT || data.CITY || ""
      }));
    } catch {
      setIfscError("Invalid IFSC Code");
      setForm(prev => ({
        ...prev,
        bankName: "",
        branch: "",
        bankState: "",
        bankDistrict: ""
      }));
    }
  };

  const [form, setForm] = useState({
    sellerName: "",
    companyType: "",
    sellerType: "",
    productTypes: [] as string[],
    state: "",
    district: "",
    taluka: "",
    city: "",
    street: "",
    buildingNo: "",
    landmark: "",
    pincode: "",
    phone: "",
    email: "",
    website: "",
    coordinatorName: "",
    coordinatorDesignation: "",
    coordinatorEmail: "",
    coordinatorMobile: "",
    gstNumber: "",
    gstFile: null as File | null,
    licenses: {} as Record<string, {
      number: string;
      file: File | null;
    }>,
    bankState: "",
    bankDistrict: "",
    bankName: "",
    branch: "",
    ifscCode: "",
    accountNumber: "",
    accountHolderName: "",
    cancelledChequeFile: null as File | null,
  });

  const handleChange = (e: any) => {
    const { id, value, files, type } = e.target;
    
    if (type === 'file' && files && files[0]) {
      if (id.startsWith('licenseFile-')) {
        const licenseId = id.replace('licenseFile-', '');
        setForm(prev => ({
          ...prev,
          licenses: {
            ...prev.licenses,
            [licenseId]: {
              ...prev.licenses[licenseId],
              file: files[0]
            }
          }
        }));
      } else {
        setForm(prev => ({ ...prev, [id]: files[0] }));
      }
    } else if (id.startsWith('licenseNumber-')) {
      const licenseId = id.replace('licenseNumber-', '');
      setForm(prev => ({
        ...prev,
        licenses: {
          ...prev.licenses,
          [licenseId]: {
            ...prev.licenses[licenseId],
            number: value
          }
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [id]: value }));
    }
  };

  // Handle product type selection with checkboxes
  const handleProductTypeToggle = (productValue: string) => {
    setForm(prev => {
      let newProductTypes;
      const newLicenses = { ...prev.licenses };
      
      if (prev.productTypes.includes(productValue)) {
        newProductTypes = prev.productTypes.filter(type => type !== productValue);
        if (newLicenses[productValue]) {
          delete newLicenses[productValue];
        }
      } else {
        newProductTypes = [...prev.productTypes, productValue];
        newLicenses[productValue] = {
          number: "",
          file: null
        };
      }
      
      return {
        ...prev,
        productTypes: newProductTypes,
        licenses: newLicenses
      };
    });
  };

  // Function to allow only alphabets and spaces
  const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z\s,'.-]/g, '');
    setForm(prev => ({
      ...prev,
      [fieldName]: filteredValue
    }));
  };

  // Function to validate key press for alphabets only
  const handleAlphabetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    const isValidKey = /^[a-zA-Z\s,'.-]$/.test(key);
    if (!isValidKey && key !== 'Backspace' && key !== 'Delete' && key !== 'Tab' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
      e.preventDefault();
    }
  };

  // Function to allow only numbers
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, maxLength?: number) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength);
    }
    
    setForm(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Coordinator verification handlers
  const handleCoordinatorEmailChange = (value: string) => {
    setForm(prev => ({ ...prev, coordinatorEmail: value }));
  };

  const handleCoordinatorMobileChange = (value: string) => {
    setForm(prev => ({ ...prev, coordinatorMobile: value }));
  };

  // Get license label and placeholder for a product type
  const getLicenseInfo = (productType: string) => {
    const product = PRODUCT_TYPES.find(p => p.name === productType);
    return {
      label: product?.licenseLabel || `${productType} License`,
      placeholder: product?.licensePlaceholder || `Enter ${productType} license number`
    };
  };

  const next = (e: any) => {
    e.preventDefault();

    if (step === 1) {
      if (!form.sellerName || !form.companyType || !form.sellerType || 
          form.productTypes.length === 0 ||
          !form.phone || !form.email || !form.state || !form.district || 
          !form.taluka || !form.city || !form.pincode) {
        alert("Please fill all required company information fields.");
        return;
      }
      
      if (!/^\d{6}$/.test(form.pincode)) {
        alert("Please enter a valid 6-digit PIN code.");
        return;
      }

      if (!/^\d{10}$/.test(form.phone)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        alert("Please enter a valid email address.");
        return;
      }
    }

    if (step === 2) {
      if (!form.coordinatorName || !form.coordinatorDesignation || 
          !form.coordinatorEmail || !form.coordinatorMobile) {
        alert("Please fill all coordinator details.");
        return;
      }

      if (!emailVerified || !phoneVerified) {
        alert("Please verify both Email and Mobile OTP before proceeding.");
        return;
      }
    }

    if (step === 3) {
      if (!form.gstNumber || !form.gstFile) {
        alert("Please fill GST fields and upload required file.");
        return;
      }
      
      let allLicensesValid = true;
      const missingLicenses: string[] = [];
      
      form.productTypes.forEach(productType => {
        const license = form.licenses[productType];
        if (!license || !license.number || !license.file) {
          allLicensesValid = false;
          missingLicenses.push(productType);
        }
      });
      
      if (!allLicensesValid) {
        alert(`Please fill all license fields for: ${missingLicenses.join(', ')}`);
        return;
      }
    }

    if (step === 4) {
  if (!form.accountNumber || !form.accountHolderName || !form.ifscCode || !form.cancelledChequeFile) {
    alert("Please fill all bank account details and upload cancelled cheque.");
    return;
  }

  if (ifscError) {
    alert("Please fix IFSC code error before proceeding.");
    return;
  }
}

    if (step < 5) {
      setStep(step + 1);
    } else {
      console.log("Form submitted:", form);
      setApplicationId(`SR-${Date.now().toString().slice(-8)}`);
      setShowSuccessModal(true);
    }
  };

  const back = (e: any) => {
    e.preventDefault();
    if (step > 1) setStep(step - 1);
  };

  // const handleBackToDashboard = () => {
  //   if (onBackToDashboard) {
  //     onBackToDashboard();
  //   }
  // };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    router.push("/");
  };

  const stepData = [
    {
      title: "Company",
      icon: "bi-building",
      activeIcon: "bi-building-fill",
      description: "Provide Your Company Details"
    },
    {
      title: "Coordinator",
      icon: "bi-person-badge",
      activeIcon: "bi-person-badge-fill",
      description: "Add Coordinator Information and Verify"
    },
    {
      title: "Documents",
      icon: "bi-file-earmark-lock",
      activeIcon: "bi-file-earmark-lock-fill",
      description: "Upload Required Compliance Documents"
    },
    {
      title: "Bank",
      icon: "bi-bank",
      activeIcon: "bi-bank2",
      description: "Enter Bank Account Details"
    },
    {
      title: "Review",
      icon: "bi-shield-check",
      activeIcon: "bi-shield-check",
      description: "Review Summary"
    }
  ];

  return (
    <div className="bg-primary-100 min-h-screen">
      <Header />

      {showSuccessModal && (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-90% max-w-500 animate-fadeIn">
            <div className="bg-primary-100 rounded-2xl shadow-xl overflow-hidden">
              {/* <div className="bg-linear-to-r from-primary-700 to-primary-600 p-4 text-center text-white relative"> */}
              <div className="bg-linear-to-r from-tertiary-600 to-tertiary-500 p-4 text-center text-white relative">
                <div className="text-4xl mb-2 animate-bounce">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <h3 className="text-xl font-bold">Application Submitted Successfully!</h3>
              </div>
              
              <div className="p-4">
                <p className="text-neutral-700 text-center text-base leading-relaxed mb-6">
                  Your seller registration application has been submitted successfully. 
                  Our team will review your application and contact you within 3-5 business days.
                </p>
                
                <div className=" rounded-xl p-6 mt-6">
                  <div className="flex items-center mb-2">
                    <i className="bi bi-clock text-primary-700 text-xl mr-3"></i>
                    <span>Application ID: <strong className="text-neutral-900">{applicationId}</strong></span>
                  </div>
                  <div className="flex items-center mb-3">
                    <i className="bi bi-calendar-check text-primary-700 text-xl mr-3"></i>
                    <span>Submitted on: <strong className="text-neutral-900">{new Date().toLocaleDateString('en-IN')}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <i className="bi bi-envelope text-primary-700 text-xl mr-3"></i>
                    <span>Confirmation sent to: <strong className="text-neutral-900">{form.email}</strong></span>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-4 bg-neutral-100 border-t border-neutral-200 flex justify-center gap-4">
                <button 
                  className="px-6 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all flex items-center shadow-md hover:shadow-lg"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
                {/* <button 
                  className="px-6 py-3 bg-white text-primary-700 border-2 border-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
                  onClick={handleCloseModal}
                >
                  Close
                </button> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Hero and Stepper Section */}
      <div className="sticky top-0 z-40 bg-primary-100 pt-2">
        <div className="mb-1 mx-4 md:mx-10">
          {/* Hero Section */}
          <div className="mb-6 mt-2">
            <div className="bg-linear-to-r from-primary-600 to-primary-800 rounded-xl p-4 text-white">
              <div className="flex flex-col md:flex-row items-center justify-center">
                <div className="flex items-center mb-2 md:mb-0">
                  <div className="w-6 h-6 mr-3 flex items-center justify-center">
                    <i className="bi bi-building text-white text-xl"></i>
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold">Seller Registration</h2>
                    <p className="text-primary-200 text-sm">Register Your Business Here!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="mb-2">
            <div className="relative">
              <div className="flex justify-between">
                {stepData.map((stepInfo, index) => {
                  const stepNumber = index + 1;
                  const isActive = step === stepNumber;
                  const isCompleted = step > stepNumber;
                  const isClickable = isCompleted || stepNumber === 1;

                  return (
                    <div
                      key={index}
                      className={`flex flex-col items-center relative ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{ width: `${100 / stepData.length}%` }}
                      onClick={() => isClickable && setStep(stepNumber)}
                    >
                      {/* Connector line */}
                      {index < stepData.length - 1 && (
                        <div className="absolute top-6 left-1/2 w-full h-1.5 bg-neutral-200">
                          <div
                            className={`h-full transition-all duration-300 ${isCompleted ? 'bg-linear-to-r from-success-300 to-primary-600' : 'bg-transparent'}`}
                            style={{ width: isCompleted ? '100%' : '0%' }}
                          ></div>
                        </div>
                      )}

                      {/* Step indicator */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 z-10 transition-all duration-300 ${
                          isActive
                            ? 'bg-primary-600 text-white shadow-lg border-2 border-white'
                            : isCompleted
                            ? 'bg-success-300 text-white'
                            : 'bg-white text-neutral-600 border-2 border-neutral-200'
                        }`}
                      >
                        {isCompleted ? (
                          <i className="bi bi-check-circle-fill text-xl"></i>
                        ) : (
                          <i className={`bi ${isActive ? stepInfo.activeIcon : stepInfo.icon} text-lg`}></i>
                        )}
                      </div>

                      {/* Step label */}
                      <div className="text-center">
                        <p className={`text-sm font-bold ${isActive ? 'text-primary-600 font-bold' : isCompleted ? 'text-success-300' : 'text-neutral-900'}`}>
                          {stepInfo.title}
                        </p>
                        <p className="text-sm text-neutral-700">{stepInfo.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="mx-4 md:mx-10 pb-6">
        <form onSubmit={next}>
          {/* STEP 1: Company Information */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-6 md:p-6 mb-6">
              <div className="mb-6">
                {/* <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-3 shadow-md">
                    <i className="bi bi-building text-white text-xl"></i>
                  </div>
                  <h4 className="text-xl font-bold text-neutral-900 mb-2">
                    Company Basic Information
                  </h4>
                </div> */}

                <div className="space-y-5">
                  {/* Company Name and Company Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="sellerName" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-building"></i>
                        Seller Name/Company Name: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="sellerName"
                        name="sellerName"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter your company name"
                        required
                        value={form.sellerName}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'sellerName')}
                      />
                    </div>
                    <div>
                      <label htmlFor="companyType" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-diagram-3"></i>
                        Company Type: <span className="text-error-300">*</span>
                      </label>
                      <select
                        id="companyType"
                        name="companyType"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
                        required
                        value={form.companyType}
                        onChange={handleChange}
                      >
                        <option value="">-- Select Company Type --</option>
                        <option value="Private Limited Company">Private Limited Company</option>
                        <option value="Public Limited Company">Public Limited Company</option>
                        <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                        <option value="Section 8 Company">Section 8 Company</option>
                        <option value="Producer Company">Producer Company</option>
                        <option value="Nidhi Company">Nidhi Company</option>
                        <option value="Government Company">Government Company</option>
                        <option value="Foreign Company">Foreign Company</option>
                        <option value="Holding Company">Holding Company</option>
                        <option value="Subsidiary Company">Subsidiary Company</option>
                        <option value="Associate Company">Associate Company</option>
                        <option value="Dormant Company">Dormant Company</option>
                      </select>
                    </div>
                  </div>

                  {/* Seller Type and Product Types */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="sellerType" className="block mb-2 text-sm font-semibold text-primary-700">
                        Seller Type <span className="text-error-300">*</span>
                      </label>
                      <select
                        id="sellerType"
                        name="sellerType"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
                        value={form.sellerType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select Seller Type --</option>
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="White Labelling Company/ Marketer">White Labelling Company/ Marketer</option>
                        <option value="Distributor">Distributor</option>
                        <option value="PCD">PCD</option>
                      </select>
                    </div>

                    <div>
  <label className="block mb-2 text-sm font-semibold text-primary-700">
    Product Type(s) <span className="text-error-300">*</span>
  </label>
  
  <div className="relative" ref={productDropdownRef}>
    <div 
      className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 cursor-pointer flex justify-between items-center hover:border-primary-300 transition-all"
      onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
    >
      <span className={form.productTypes.length === 0 ? "text-neutral-500" : "text-neutral-900"}>
        {form.productTypes.length > 0 
          ? `${form.productTypes.length} product type(s) selected`
          : "Select product types"}
      </span>
      <i className={`bi ${isProductDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'} text-primary-600`}></i>
    </div>
    
    {isProductDropdownOpen && (
      <div className="absolute top-full mt-1 w-full bg-white border-2 border-primary-200 rounded-xl shadow-xl z-50">
        <div className="p-2 border-b border-primary-100">
          <p className="text-sm text-neutral-600 font-medium">Select product types:</p>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {/* Select All option */}
          <div 
            className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100"
            onClick={(e) => {
              e.stopPropagation();
              const allProductNames = PRODUCT_TYPES.map(p => p.name);
              const areAllSelected = allProductNames.length === form.productTypes.length;
              
              if (areAllSelected) {
                // If all are selected, deselect all
                setForm(prev => ({
                  ...prev,
                  productTypes: [],
                  licenses: {}
                }));
              } else {
                // If not all are selected, select all
                const newLicenses: Record<string, { number: string; file: File | null }> = {};
                allProductNames.forEach(productName => {
                  newLicenses[productName] = {
                    number: "",
                    file: null
                  };
                });
                
                setForm(prev => ({
                  ...prev,
                  productTypes: allProductNames,
                  licenses: newLicenses
                }));
              }
            }}
          >
            <input
              type="checkbox"
              id="select-all"
              checked={form.productTypes.length === PRODUCT_TYPES.length}
              onChange={() => {}}
              className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
            />
            <label 
              htmlFor="select-all"
              className="ml-3 text-sm font-medium text-primary-700 cursor-pointer"
            >
              Select All
            </label>
          </div>
          
          {/* Individual product options */}
          {PRODUCT_TYPES.map((product, index) => (
            <div 
              key={index}
              className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100 last:border-b-0"
              onClick={(e) => {
                e.stopPropagation();
                handleProductTypeToggle(product.name);
              }}
            >
              <input
                type="checkbox"
                id={`product-${index}`}
                checked={form.productTypes.includes(product.name)}
                onChange={() => {}}
                className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
              />
              <label 
                htmlFor={`product-${index}`}
                className="ml-3 text-sm text-neutral-900 cursor-pointer"
              >
                {product.name}
              </label>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-primary-100 bg-primary-50">
          <p className="text-xs text-neutral-500">
            {form.productTypes.length} of {PRODUCT_TYPES.length} selected
          </p>
        </div>
      </div>
    )}
  </div>
  
  {form.productTypes.length > 0 && (
    <div className="mt-2">
      <p className="text-sm text-success-300">
        <i className="bi bi-check-circle-fill mr-1"></i>
        Selected: {form.productTypes.join(", ")}
      </p>
    </div>
  )}
  
  {form.productTypes.length === 0 && (
    <p className="mt-1 text-sm text-neutral-500">
      <i className="bi bi-info-circle mr-1"></i>
      Click to select product types
    </p>
  )}
</div>
                  </div>

                  {/* Address Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="state" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-geo-alt"></i>State: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter state"
                        required
                        value={form.state}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'state')}
                      />
                    </div>
                    <div>
                      <label htmlFor="district" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-geo"></i>District: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="district"
                        name="district"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter district"
                        required
                        value={form.district}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'district')}
                      />
                    </div>
                    <div>
                      <label htmlFor="taluka" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-map"></i>Taluka: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="taluka"
                        name="taluka"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter taluka"
                        required
                        value={form.taluka}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'taluka')}
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-geo-fill"></i>City/Town/Village: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter city/town/village"
                        required
                        value={form.city}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'city')}
                      />
                    </div>
                    <div>
                      <label htmlFor="street" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-signpost"></i>Street/Road/Lane: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter street/road/lane"
                        required
                        value={form.street}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'street')}
                      />
                    </div>
                    <div>
                      <label htmlFor="buildingNo" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-house-door"></i>Building/House No: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="buildingNo"
                        name="buildingNo"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter building/house no"
                        required
                        value={form.buildingNo}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="landmark" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-geo"></i>Landmark:
                      </label>
                      <input
                        type="text"
                        id="landmark"
                        name="landmark"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter landmark (optional)"
                        value={form.landmark}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="pincode" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-pin-map"></i>Pin Code: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter 6-digit pin code"
                        required
                        maxLength={6}
                        value={form.pincode}
                        onChange={(e) => handleNumericInput(e, 'pincode', 6)}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-telephone"></i>Company Phone: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter company phone"
                        required
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) => handleNumericInput(e, 'phone', 10)}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-envelope"></i>Company Email ID: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter company email"
                        required
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="website" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-globe"></i>Company Website (Optional):
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter company website"
                        value={form.website}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Coordinator Details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
              <div className="mb-6">
                <div className="text-center mb-6">
                  {/* <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-3 shadow-md">
                    <i className="bi bi-person-badge text-white text-xl"></i>
                  </div>
                  <h4 className="text-xl font-bold text-neutral-900 mb-2">
                    Company Coordinator Details
                  </h4> */}
                  {(!emailVerified || !phoneVerified) && (
                    <div className="mt-3 p-3 bg-warning-100 border border-warning-200 rounded-xl text-warning-800 text-sm inline-flex items-center">
                      <i className="bi bi-exclamation-triangle mr-2"></i>
                      Please verify both Email and Mobile OTP to proceed
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="coordinatorName" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-person"></i>Coordinator Name: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="coordinatorName"
                        name="coordinatorName"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter coordinator name"
                        required
                        value={form.coordinatorName}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'coordinatorName')}
                      />
                    </div>
                    <div>
                      <label htmlFor="coordinatorDesignation" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-briefcase"></i>Coordinator Designation: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="coordinatorDesignation"
                        name="coordinatorDesignation"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter designation"
                        required
                        value={form.coordinatorDesignation}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'coordinatorDesignation')}
                      />
                    </div>
                  </div>

                  {/* Coordinator Email and Mobile Verification */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <OtpVerification
                        label="Email"
                        value={form.coordinatorEmail}
                        onChange={handleCoordinatorEmailChange}
                        onVerified={() => setEmailVerified(true)}
                        verified={emailVerified}
                      />
                    </div>
                    <div>
                      <OtpVerification
                        label="Mobile"
                        value={form.coordinatorMobile}
                        onChange={handleCoordinatorMobileChange}
                        onVerified={() => setPhoneVerified(true)}
                        verified={phoneVerified}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Documents */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
              <div className="mb-6">
                {/* <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-3 shadow-md">
                    <i className="bi bi-file-earmark-lock text-white text-xl"></i>
                  </div>
                  <h4 className="text-xl font-bold text-neutral-900 mb-2">
                    Document Upload
                  </h4>
                  <p className="text-neutral-600 text-sm">
                    Required documents based on your selected product types
                  </p>
                </div> */}

                {/* GST Certificate Section */}
                <div className="mb-2">
                  <div className="bg-primary-50 rounded-xl p-1 mb-2">
                    <h3 className="text-lg font-semibold text-primary-700 flex items-center">
                      <i className="bi bi-file-earmark-text mr-2"></i>GSTIN Certificate
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="gstNumber" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-hash"></i>GST Number: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="text"
                        id="gstNumber"
                        name="gstNumber"
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Enter GST number"
                        required
                        value={form.gstNumber}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="gstFile" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                        <i className="bi bi-upload"></i>GST Certificate: <span className="text-error-300">*</span>
                      </label>
                      <input
                        type="file"
                        id="gstFile"
                        name="gstFile"
                        className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                        onChange={handleChange}
                      />
                      {form.gstFile && (
                        <p className="mt-2 text-sm text-success-300">
                          <i className="bi bi-check-circle-fill mr-1"></i>
                          File selected: {form.gstFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic License Sections */}
                {form.productTypes.map((productType, index) => {
                  const licenseInfo = getLicenseInfo(productType);
                  const licenseData = form.licenses[productType] || { number: "", file: null };
                  
                  return (
                    <div key={productType} className="mb-4">
                      <div className="bg-primary-50 rounded-xl p-2 mb-2">
                        <h3 className="text-lg font-semibold text-primary-700 flex items-center">
                          <i className="bi bi-prescription2 mr-2"></i>{licenseInfo.label}
                          <span className="ml-2 text-sm font-normal text-neutral-600">
                            (Required for: {productType})
                          </span>
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label 
                            htmlFor={`licenseNumber-${productType}`} 
                            className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                          >
                            <i className="bi bi-hash"></i>{licenseInfo.label} Number: 
                            <span className="text-error-300">*</span>
                          </label>
                          <input
                            type="text"
                            id={`licenseNumber-${productType}`}
                            name={`licenseNumber-${productType}`}
                            className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                            placeholder={licenseInfo.placeholder}
                            required
                            value={licenseData.number}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label 
                            htmlFor={`licenseFile-${productType}`} 
                            className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                          >
                            <i className="bi bi-upload"></i>{licenseInfo.label} File Upload: 
                            <span className="text-error-300">*</span>
                          </label>
                          <input
                            type="file"
                            id={`licenseFile-${productType}`}
                            name={`licenseFile-${productType}`}
                            className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
                            accept=".pdf,.jpg,.jpeg,.png"
                            required
                            onChange={handleChange}
                          />
                          {licenseData.file && (
                            <p className="mt-2 text-sm text-success-300">
                              <i className="bi bi-check-circle-fill mr-1"></i>
                              File selected: {licenseData.file.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Warning if no product types selected */}
                {form.productTypes.length === 0 && (
                  <div className="mt-6 p-4 bg-warning-100 border border-warning-200 rounded-xl">
                    <div className="flex items-center">
                      <i className="bi bi-exclamation-triangle text-warning-800 text-xl mr-3"></i>
                      <div>
                        <p className="text-warning-800 font-medium">No product types selected</p>
                        <p className="text-warning-700 text-sm mt-1">
                          Please go back to Step 1 and select at least one product type.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Bank Details */}
         {/* STEP 4: Bank Details */}
{step === 4 && (
  <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
    <div className="mb-6">
      {/* <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-3 shadow-md">
          <i className="bi bi-bank text-white text-xl"></i>
        </div>
        <h4 className="text-xl font-bold text-neutral-900 mb-2">
          Bank Account Details
        </h4>
        <p className="text-neutral-600 text-sm">
          IFSC based auto-verification
        </p>
      </div> */}

      <div className="space-y-6">
        {/* Account Number and Holder Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="accountNumber" className="block mb-2 text-sm font-semibold text-primary-700">
              Account Number <span className="text-error-300">*</span>
            </label>
            <input
              type="text"
              id="accountNumber"
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
              value={form.accountNumber}
              onChange={handleChange}
              placeholder="Enter account number"
              required
            />
          </div>

          <div>
            <label htmlFor="accountHolderName" className="block mb-2 text-sm font-semibold text-primary-700">
              Account Holder Name <span className="text-error-300">*</span>
            </label>
            <input
              type="text"
              id="accountHolderName"
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
              value={form.accountHolderName}
              onChange={(e) => handleAlphabetInput(e, "accountHolderName")}
              onKeyPress={handleAlphabetKeyPress}
              placeholder="As per bank records"
              required
            />
          </div>
        </div>

        {/* IFSC Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="ifscCode" className="block mb-2 text-sm font-semibold text-primary-700">
              IFSC Code <span className="text-error-300">*</span>
            </label>
            <input
              type="text"
              id="ifscCode"
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all uppercase"
              maxLength={11}
              value={form.ifscCode}
              onChange={(e) => handleIfscChange(e.target.value)}
              placeholder="SBIN0005943"
              required
            />
            {ifscError && (
              <p className="mt-1 text-sm text-error-300">{ifscError}</p>
            )}
          </div>
          
          {/* Cancelled Cheque Upload */}
          <div>
            <label htmlFor="cancelledChequeFile" className="block mb-2 text-sm font-semibold text-primary-700">
              Cancelled Cheque / Bank Details Proof <span className="text-error-300">*</span>
            </label>
            <input
              type="file"
              id="cancelledChequeFile"
              name="cancelledChequeFile"
              className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              onChange={handleChange}
            />
            {form.cancelledChequeFile && (
              <p className="mt-2 text-sm text-success-300">
                <i className="bi bi-check-circle-fill mr-1"></i>
                File selected: {form.cancelledChequeFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Auto-filled Bank Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-sm font-semibold text-primary-700">Bank Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
              value={form.bankName}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-primary-700">Branch</label>
            <input
              type="text"
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
              value={form.branch}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-primary-700">State</label>
            <input
              type="text"
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
              value={form.bankState}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-primary-700">District</label>
            <input
              type="text"
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
              value={form.bankDistrict}
              disabled
              readOnly
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-xl">
          <div className="flex">
            <i className="bi bi-shield-check text-primary-700 text-2xl mr-4"></i>
            <div>
              <h6 className="font-bold text-primary-800 mb-1">Security Assurance</h6>
              <p className="text-sm text-neutral-700">
                Your bank details are encrypted and stored securely.
                We follow PCI-DSS compliance standards for financial data protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-4 md:p-6 mb-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="bi bi-shield-check text-white text-2xl"></i>
                </div>
                <h4 className="text-2xl font-bold bg-linear-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                  Final Submission Summary
                </h4>
                <p className="text-neutral-600 mt-2">Please review all details before final submission</p>
              </div>

              {/* Company Section */}
              <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
                <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
                  <i className="bi bi-building mr-2"></i> Company Details
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Company Name", value: form.sellerName },
                    { label: "Company Type", value: form.companyType },
                    { label: "Seller Type", value: form.sellerType },
                    { label: "Product Type(s)", value: form.productTypes.join(", ") },
                    { label: "State", value: form.state },
                    { label: "District", value: form.district },
                    { label: "Taluka", value: form.taluka },
                    { label: "City/Town/Village", value: form.city },
                    { label: "Street/Road/Lane", value: form.street },
                    { label: "Building/House No", value: form.buildingNo },
                    { label: "Landmark", value: form.landmark || "N/A" },
                    { label: "Pin Code", value: form.pincode },
                    { label: "Phone", value: form.phone },
                    { label: "Email", value: form.email },
                    { label: "Website", value: form.website || "N/A" }
                  ].map((item, index) => (
                    <div key={index}>
                      <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                        {item.label}
                      </span>
                      <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!item.value || (item.value === "N/A" && item.label === "Landmark") || (item.value === "N/A" && item.label === "Website") ? "text-neutral-500" : "text-neutral-900"}`}>
                        {item.value || "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coordinator Section */}
              <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
                <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
                  <i className="bi bi-person-badge mr-2"></i> Coordinator Details
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Name", value: form.coordinatorName },
                    { label: "Designation", value: form.coordinatorDesignation },
                    { 
                      label: "Email", 
                      value: form.coordinatorEmail,
                      verified: emailVerified
                    },
                    { 
                      label: "Mobile", 
                      value: form.coordinatorMobile,
                      verified: phoneVerified
                    }
                  ].map((item, index) => (
                    <div key={index}>
                      <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                        {item.label}
                      </span>
                      <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!item.value ? "text-error-300" : "text-neutral-900"}`}>
                        {item.value || "Not provided"}
                        {item.verified !== undefined && item.value && (
                          <span className={`ml-2 px-2 py-1 text-xs rounded ${item.verified ? 'bg-success-100 text-success-300' : 'bg-warning-100 text-warning-300'}`}>
                            {item.verified ? "✔ Verified" : "Not verified"}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents Section */}
              <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
                <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
                  <i className="bi bi-file-earmark-lock mr-2"></i> Compliance Documents
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GST Details */}
                  <div>
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                      GST Number
                    </span>
                    <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!form.gstNumber ? "text-error-300" : "text-neutral-900"}`}>
                      {form.gstNumber || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                      GST Certificate
                    </span>
                    <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!form.gstFile ? "text-error-300" : "text-neutral-900"}`}>
                      {form.gstFile ? (
                        <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                          <i className="bi bi-file-earmark-pdf mr-2"></i>
                          {form.gstFile.name}
                        </span>
                      ) : "Not uploaded"}
                    </p>
                  </div>
                  
                  {/* Dynamic License Fields */}
                  {form.productTypes.map(productType => {
                    const licenseInfo = getLicenseInfo(productType);
                    const licenseData = form.licenses[productType];
                    
                    return (
                      <React.Fragment key={productType}>
                        <div>
                          <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                            {licenseInfo.label} for {productType}
                          </span>
                          <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!licenseData?.number ? "text-error-300" : "text-neutral-900"}`}>
                            {licenseData?.number || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                            {licenseInfo.label} File
                          </span>
                          <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!licenseData?.file ? "text-error-300" : "text-neutral-900"}`}>
                            {licenseData?.file ? (
                              <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                                <i className="bi bi-file-earmark-pdf mr-2"></i>
                                {licenseData.file.name}
                              </span>
                            ) : "Not uploaded"}
                          </p>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Bank Details Section */}
<div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
  <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
    <i className="bi bi-bank mr-2"></i> Bank Account Details
  </h6>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[
      { label: "Bank Name", value: form.bankName },
      { label: "Branch", value: form.branch },
      { label: "State", value: form.bankState },
      { label: "District", value: form.bankDistrict },
      { label: "IFSC Code", value: form.ifscCode },
      { label: "Account Number", value: form.accountNumber ? "****" + form.accountNumber.slice(-4) : "" },
      { label: "Account Holder Name", value: form.accountHolderName },
      { 
        label: "Cancelled Cheque", 
        value: form.cancelledChequeFile ? (
          <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
            <i className="bi bi-file-earmark-pdf mr-2"></i>
            {form.cancelledChequeFile.name}
          </span>
        ) : "Not uploaded"
      }
    ].map((item, index) => (
      <div key={index}>
        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
          {item.label}
        </span>
        <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!item.value || item.value === "Not uploaded" ? "text-error-300" : "text-neutral-900"}`}>
          {item.value || "Not provided"}
        </p>
      </div>
    ))}
  </div>
</div>

              {/* Validation Summary */}
              <div className="p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
                <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
                  <i className="bi bi-clipboard-check mr-2"></i> Validation Summary
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Company Info",
                      complete: form.sellerName && form.pincode && form.productTypes.length > 0
                    },
                    {
                      label: "Verification",
                      complete: emailVerified && phoneVerified
                    },
                    {
                      label: "GST Document",
                      complete: !!form.gstFile
                    },
                    {
                      label: "Product Licenses",
                      complete: form.productTypes.length > 0 && form.productTypes.every(pt => form.licenses[pt]?.number && form.licenses[pt]?.file)
                    },
                    {
                      label: "Bank Details",
                      complete: form.ifscCode && form.accountNumber && form.cancelledChequeFile
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <i className={`bi ${item.complete ? 'bi-check-circle-fill text-success-300' : 'bi-x-circle-fill text-error-300'} text-lg mr-3`}></i>
                      <span className="text-sm font-medium text-neutral-700">
                        {item.label}: {item.complete ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

{/* Navigation Buttons */}
<div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t border-neutral-200 gap-4">
  {step > 1 && (
    <button
      type="button"
      onClick={back}
      className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto"
    >
      <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
        <i className="bi bi-arrow-left mr-2"></i> Back
      </span>
      <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
    </button>
  )}
  
  {/* Using justify-end on the container */}
  <div className="w-full md:w-auto md:ml-auto flex justify-end">
    <button
      type="submit"
      className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto"
    >
      <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
        {step < 5 ? (
          <>
            Continue <i className="bi bi-arrow-right ml-2"></i>
          </>
        ) : (
          <>
            <i className="bi bi-check-circle mr-2"></i> Submit Application
          </>
        )}
      </span>
      <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
    </button>
  </div>
</div>
        </form>
      </div>
    </div>
  );
}














// original code .....................
// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import OtpVerification from "./OtpVerification";
// import Header from "@/src/app/components/Header";
// import { useRouter } from "next/navigation"; 

// const IFSC_API = "https://ifsc.razorpay.com";
// const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// const PRODUCT_TYPES = [
//   {
//     id: "drugs",
//     name: "Drugs",
//     licenseLabel: "Drug Manufacturing License",
//     licensePlaceholder: "Enter drug manufacturing license number"
//   },
//   {
//     id: "supplements",
//     name: "Supplements/ Nutraceuticals",
//     licenseLabel: "FSSAI License",
//     licensePlaceholder: "Enter FSSAI license number"
//   },
//   {
//     id: "food",
//     name: "Food & Infant Nutrition",
//     licenseLabel: "FSSAI License",
//     licensePlaceholder: "Enter FSSAI license number"
//   },
//   {
//     id: "cosmetic",
//     name: "Cosmetic & Personal Care",
//     licenseLabel: "CDSCO License",
//     licensePlaceholder: "Enter CDSCO license number"
//   },
//   {
//     id: "medical",
//     name: "Medical Devices & Equipment",
//     licenseLabel: "Medical Device License",
//     licensePlaceholder: "Enter medical device license number"
//   }
// ];

// // interface SellerRegisterProps {
// //   onBackToDashboard?: () => void;
// // }

// export default function SellerRegister(
//   // { onBackToDashboard }: SellerRegisterProps
// ) 
//   {
//   const [step, setStep] = useState(1);
//   const [emailVerified, setEmailVerified] = useState(false);
//   const [phoneVerified, setPhoneVerified] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [applicationId, setApplicationId] = useState("");
//   const [ifscError, setIfscError] = useState("");
//   const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
//   const productDropdownRef = useRef<HTMLDivElement>(null);
//   const router = useRouter();
  
//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
//         setIsProductDropdownOpen(false);
//       }
//     };
    
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Handle IFSC code change and auto-fill bank details
//   const handleIfscChange = async (value: string) => {
//     const ifsc = value.toUpperCase();

//     setForm(prev => ({
//       ...prev,
//       ifscCode: ifsc
//     }));

//     setIfscError("");

//     // Reset autofill if incomplete
//     if (ifsc.length !== 11) {
//       setForm(prev => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: ""
//       }));
//       return;
//     }

//     if (!IFSC_REGEX.test(ifsc)) {
//       setIfscError("Invalid IFSC format");
//       return;
//     }

//     try {
//       const res = await fetch(`${IFSC_API}/${ifsc}`);
//       if (!res.ok) throw new Error();

//       const data = await res.json();

//       setForm(prev => ({
//         ...prev,
//         bankName: data.BANK || "",
//         branch: data.BRANCH || "",
//         bankState: data.STATE || "",
//         bankDistrict: data.DISTRICT || data.CITY || ""
//       }));
//     } catch {
//       setIfscError("Invalid IFSC Code");
//       setForm(prev => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: ""
//       }));
//     }
//   };

//   const [form, setForm] = useState({
//     sellerName: "",
//     companyType: "",
//     sellerType: "",
//     productTypes: [] as string[],
//     state: "",
//     district: "",
//     taluka: "",
//     city: "",
//     street: "",
//     buildingNo: "",
//     landmark: "",
//     pincode: "",
//     phone: "",
//     email: "",
//     website: "",
//     coordinatorName: "",
//     coordinatorDesignation: "",
//     coordinatorEmail: "",
//     coordinatorMobile: "",
//     gstNumber: "",
//     gstFile: null as File | null,
//     licenses: {} as Record<string, {
//       number: string;
//       file: File | null;
//     }>,
//     bankState: "",
//     bankDistrict: "",
//     bankName: "",
//     branch: "",
//     ifscCode: "",
//     accountNumber: "",
//     accountHolderName: "",
//     cancelledChequeFile: null as File | null,
//   });

//   const handleChange = (e: any) => {
//     const { id, value, files, type } = e.target;
    
//     if (type === 'file' && files && files[0]) {
//       if (id.startsWith('licenseFile-')) {
//         const licenseId = id.replace('licenseFile-', '');
//         setForm(prev => ({
//           ...prev,
//           licenses: {
//             ...prev.licenses,
//             [licenseId]: {
//               ...prev.licenses[licenseId],
//               file: files[0]
//             }
//           }
//         }));
//       } else {
//         setForm(prev => ({ ...prev, [id]: files[0] }));
//       }
//     } else if (id.startsWith('licenseNumber-')) {
//       const licenseId = id.replace('licenseNumber-', '');
//       setForm(prev => ({
//         ...prev,
//         licenses: {
//           ...prev.licenses,
//           [licenseId]: {
//             ...prev.licenses[licenseId],
//             number: value
//           }
//         }
//       }));
//     } else {
//       setForm(prev => ({ ...prev, [id]: value }));
//     }
//   };

//   // Handle product type selection with checkboxes
//   const handleProductTypeToggle = (productValue: string) => {
//     setForm(prev => {
//       let newProductTypes;
//       const newLicenses = { ...prev.licenses };
      
//       if (prev.productTypes.includes(productValue)) {
//         newProductTypes = prev.productTypes.filter(type => type !== productValue);
//         if (newLicenses[productValue]) {
//           delete newLicenses[productValue];
//         }
//       } else {
//         newProductTypes = [...prev.productTypes, productValue];
//         newLicenses[productValue] = {
//           number: "",
//           file: null
//         };
//       }
      
//       return {
//         ...prev,
//         productTypes: newProductTypes,
//         licenses: newLicenses
//       };
//     });
//   };

//   // Function to allow only alphabets and spaces
//   const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
//     const value = e.target.value;
//     const filteredValue = value.replace(/[^a-zA-Z\s,'.-]/g, '');
//     setForm(prev => ({
//       ...prev,
//       [fieldName]: filteredValue
//     }));
//   };

//   // Function to validate key press for alphabets only
//   const handleAlphabetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const key = e.key;
//     const isValidKey = /^[a-zA-Z\s,'.-]$/.test(key);
//     if (!isValidKey && key !== 'Backspace' && key !== 'Delete' && key !== 'Tab' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
//       e.preventDefault();
//     }
//   };

//   // Function to allow only numbers
//   const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, maxLength?: number) => {
//     let value = e.target.value.replace(/\D/g, '');
    
//     if (maxLength && value.length > maxLength) {
//       value = value.substring(0, maxLength);
//     }
    
//     setForm(prev => ({
//       ...prev,
//       [fieldName]: value
//     }));
//   };

//   // Coordinator verification handlers
//   const handleCoordinatorEmailChange = (value: string) => {
//     setForm(prev => ({ ...prev, coordinatorEmail: value }));
//   };

//   const handleCoordinatorMobileChange = (value: string) => {
//     setForm(prev => ({ ...prev, coordinatorMobile: value }));
//   };

//   // Get license label and placeholder for a product type
//   const getLicenseInfo = (productType: string) => {
//     const product = PRODUCT_TYPES.find(p => p.name === productType);
//     return {
//       label: product?.licenseLabel || `${productType} License`,
//       placeholder: product?.licensePlaceholder || `Enter ${productType} license number`
//     };
//   };

//   const next = (e: any) => {
//     e.preventDefault();

//     if (step === 1) {
//       if (!form.sellerName || !form.companyType || !form.sellerType || 
//           form.productTypes.length === 0 ||
//           !form.phone || !form.email || !form.state || !form.district || 
//           !form.taluka || !form.city || !form.pincode) {
//         alert("Please fill all required company information fields.");
//         return;
//       }
      
//       if (!/^\d{6}$/.test(form.pincode)) {
//         alert("Please enter a valid 6-digit PIN code.");
//         return;
//       }

//       if (!/^\d{10}$/.test(form.phone)) {
//         alert("Please enter a valid 10-digit phone number.");
//         return;
//       }

//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(form.email)) {
//         alert("Please enter a valid email address.");
//         return;
//       }
//     }

//     if (step === 2) {
//       if (!form.coordinatorName || !form.coordinatorDesignation || 
//           !form.coordinatorEmail || !form.coordinatorMobile) {
//         alert("Please fill all coordinator details.");
//         return;
//       }

//       if (!emailVerified || !phoneVerified) {
//         alert("Please verify both Email and Mobile OTP before proceeding.");
//         return;
//       }
//     }

//     if (step === 3) {
//       if (!form.gstNumber || !form.gstFile) {
//         alert("Please fill GST fields and upload required file.");
//         return;
//       }
      
//       let allLicensesValid = true;
//       const missingLicenses: string[] = [];
      
//       form.productTypes.forEach(productType => {
//         const license = form.licenses[productType];
//         if (!license || !license.number || !license.file) {
//           allLicensesValid = false;
//           missingLicenses.push(productType);
//         }
//       });
      
//       if (!allLicensesValid) {
//         alert(`Please fill all license fields for: ${missingLicenses.join(', ')}`);
//         return;
//       }
//     }

//     if (step === 4) {
//   if (!form.accountNumber || !form.accountHolderName || !form.ifscCode || !form.cancelledChequeFile) {
//     alert("Please fill all bank account details and upload cancelled cheque.");
//     return;
//   }

//   if (ifscError) {
//     alert("Please fix IFSC code error before proceeding.");
//     return;
//   }
// }

//     if (step < 5) {
//       setStep(step + 1);
//     } else {
//       console.log("Form submitted:", form);
//       setApplicationId(`SR-${Date.now().toString().slice(-8)}`);
//       setShowSuccessModal(true);
//     }
//   };

//   const back = (e: any) => {
//     e.preventDefault();
//     if (step > 1) setStep(step - 1);
//   };

//   // const handleBackToDashboard = () => {
//   //   if (onBackToDashboard) {
//   //     onBackToDashboard();
//   //   }
//   // };

//   const handleCloseModal = () => {
//     setShowSuccessModal(false);
//     router.push("/");
//   };

//   const stepData = [
//     {
//       title: "Company",
//       icon: "bi-building",
//       activeIcon: "bi-building-fill",
//       description: "Provide Your Company Details"
//     },
//     {
//       title: "Coordinator",
//       icon: "bi-person-badge",
//       activeIcon: "bi-person-badge-fill",
//       description: "Add Coordinator Information and Verify"
//     },
//     {
//       title: "Documents",
//       icon: "bi-file-earmark-lock",
//       activeIcon: "bi-file-earmark-lock-fill",
//       description: "Upload Required Compliance Documents"
//     },
//     {
//       title: "Bank",
//       icon: "bi-bank",
//       activeIcon: "bi-bank2",
//       description: "Enter Bank Account Details"
//     },
//     {
//       title: "Review",
//       icon: "bi-shield-check",
//       activeIcon: "bi-shield-check",
//       description: "Review Summary"
//     }
//   ];

//   return (
//     <div className="bg-primary-100 min-h-screen">
//       <Header />

//       {showSuccessModal && (
//         <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50">
//           <div className="w-90% max-w-500 animate-fadeIn">
//             <div className="bg-primary-100 rounded-2xl shadow-xl overflow-hidden">
//               {/* <div className="bg-linear-to-r from-primary-700 to-primary-600 p-4 text-center text-white relative"> */}
//               <div className="bg-linear-to-r from-tertiary-600 to-tertiary-500 p-4 text-center text-white relative">
//                 <div className="text-4xl mb-2 animate-bounce">
//                   <i className="bi bi-check-circle-fill"></i>
//                 </div>
//                 <h3 className="text-xl font-bold">Application Submitted Successfully!</h3>
//               </div>
              
//               <div className="p-4">
//                 <p className="text-neutral-700 text-center text-base leading-relaxed mb-6">
//                   Your seller registration application has been submitted successfully. 
//                   Our team will review your application and contact you within 3-5 business days.
//                 </p>
                
//                 <div className=" rounded-xl p-6 mt-6">
//                   <div className="flex items-center mb-2">
//                     <i className="bi bi-clock text-primary-700 text-xl mr-3"></i>
//                     <span>Application ID: <strong className="text-neutral-900">{applicationId}</strong></span>
//                   </div>
//                   <div className="flex items-center mb-3">
//                     <i className="bi bi-calendar-check text-primary-700 text-xl mr-3"></i>
//                     <span>Submitted on: <strong className="text-neutral-900">{new Date().toLocaleDateString('en-IN')}</strong></span>
//                   </div>
//                   <div className="flex items-center">
//                     <i className="bi bi-envelope text-primary-700 text-xl mr-3"></i>
//                     <span>Confirmation sent to: <strong className="text-neutral-900">{form.email}</strong></span>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="px-8 py-4 bg-neutral-100 border-t border-neutral-200 flex justify-center gap-4">
//                 <button 
//                   className="px-6 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all flex items-center shadow-md hover:shadow-lg"
//                   onClick={handleCloseModal}
//                 >
//                   Close
//                 </button>
//                 {/* <button 
//                   className="px-6 py-3 bg-white text-primary-700 border-2 border-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
//                   onClick={handleCloseModal}
//                 >
//                   Close
//                 </button> */}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="mb-1 mx-4 md:mx-10">
// {/* Hero Section */}
// <div className="mb-6 mt-2">
//   <div className="bg-linear-to-r from-primary-600 to-primary-800 rounded-xl p-4 text-white">
//     <div className="flex flex-col md:flex-row items-center justify-center">
//       <div className="flex items-center mb-2 md:mb-0">
//         <div className="w-6 h-6 mr-3 flex items-center justify-center">
//           <i className="bi bi-building text-white text-xl"></i>
//         </div>
//         <div className="text-center md:text-left">
//           <h2 className="text-xl font-bold">Seller Registration</h2>
//           <p className="text-primary-200 text-sm">Register Your Business Here!</p>
//         </div>
//       </div>
//     </div>
//   </div>
// </div>

//         {/* Stepper  */}
//         <div className="mb-2">
//           <div className="relative">
//             <div className="flex justify-between">
//               {stepData.map((stepInfo, index) => {
//                 const stepNumber = index + 1;
//                 const isActive = step === stepNumber;
//                 const isCompleted = step > stepNumber;
//                 const isClickable = isCompleted || stepNumber === 1;

//                 return (
//                   <div
//                     key={index}
//                     className={`flex flex-col items-center relative ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
//                     style={{ width: `${100 / stepData.length}%` }}
//                     onClick={() => isClickable && setStep(stepNumber)}
//                   >
//                     {/* Connector line */}
//                     {index < stepData.length - 1 && (
//                       <div className="absolute top-6 left-1/2 w-full h-1.5 bg-neutral-200">
//                         <div
//                           className={`h-full transition-all duration-300 ${isCompleted ? 'bg-linear-to-r from-success-300 to-primary-600' : 'bg-transparent'}`}
//                           style={{ width: isCompleted ? '100%' : '0%' }}
//                         ></div>
//                       </div>
//                     )}

//                     {/* Step indicator */}
//                     <div
//                       className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 z-10 transition-all duration-300 ${
//                         isActive
//                           ? 'bg-primary-600 text-white shadow-lg border-2 border-white'
//                           : isCompleted
//                           ? 'bg-success-300 text-white'
//                           : 'bg-white text-neutral-600 border-2 border-neutral-200'
//                       }`}
//                     >
//                       {isCompleted ? (
//                         <i className="bi bi-check-circle-fill text-xl"></i>
//                       ) : (
//                         <i className={`bi ${isActive ? stepInfo.activeIcon : stepInfo.icon} text-lg`}></i>
//                       )}
//                     </div>

//                     {/* Step label */}
//                     <div className="text-center">
//                       <p className={`text-sm font-bold ${isActive ? 'text-primary-600 font-bold' : isCompleted ? 'text-success-300' : 'text-neutral-900'}`}>
//                         {stepInfo.title}
//                       </p>
//                       <p className="text-sm text-neutral-700 ">{stepInfo.description}</p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Current step status */}
//           {/* <div className="mt-6 text-center">
//             <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
//               <i className={`bi ${stepData[step - 1].activeIcon} mr-2`}></i>
//               Step {step}: {stepData[step - 1].title}
//             </span>
//             <p className="text-sm text-neutral-600 mt-2">
//               {step === 1 && "Provide your company details"}
//               {step === 2 && "Add coordinator information and verify"}
//               {step === 3 && "Upload required compliance documents"}
//               {step === 4 && "Enter bank account details"}
//               {step === 5 && "Review all information before submission"}
//             </p>
//           </div> */}
//         </div>

//         <form onSubmit={next}>
//           {/* STEP 1: Company Information */}
//           {step === 1 && (
//             <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-6 md:p-6 mb-6">
//               <div className="mb-6">
//                 {/* <div className="text-center mb-6">
//                   <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-3 shadow-md">
//                     <i className="bi bi-building text-white text-xl"></i>
//                   </div>
//                   <h4 className="text-xl font-bold text-neutral-900 mb-2">
//                     Company Basic Information
//                   </h4>
//                 </div> */}

//                 <div className="space-y-5">
//                   {/* Company Name and Company Type */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label htmlFor="sellerName" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-building"></i>
//                         Seller Name/Company Name: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="sellerName"
//                         name="sellerName"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter your company name"
//                         required
//                         value={form.sellerName}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'sellerName')}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="companyType" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-diagram-3"></i>
//                         Company Type: <span className="text-error-300">*</span>
//                       </label>
//                       <select
//                         id="companyType"
//                         name="companyType"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                         required
//                         value={form.companyType}
//                         onChange={handleChange}
//                       >
//                         <option value="">-- Select Company Type --</option>
//                         <option value="Private Limited Company">Private Limited Company</option>
//                         <option value="Public Limited Company">Public Limited Company</option>
//                         <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
//                         <option value="Proprietorship">Proprietorship</option>
//                         <option value="One Person Company (OPC)">One Person Company (OPC)</option>
//                         <option value="Section 8 Company">Section 8 Company</option>
//                         <option value="Producer Company">Producer Company</option>
//                         <option value="Nidhi Company">Nidhi Company</option>
//                         <option value="Government Company">Government Company</option>
//                         <option value="Foreign Company">Foreign Company</option>
//                         <option value="Holding Company">Holding Company</option>
//                         <option value="Subsidiary Company">Subsidiary Company</option>
//                         <option value="Associate Company">Associate Company</option>
//                         <option value="Dormant Company">Dormant Company</option>
//                       </select>
//                     </div>
//                   </div>

//                   {/* Seller Type and Product Types */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label htmlFor="sellerType" className="block mb-2 text-sm font-semibold text-primary-700">
//                         Seller Type <span className="text-error-300">*</span>
//                       </label>
//                       <select
//                         id="sellerType"
//                         name="sellerType"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                         value={form.sellerType}
//                         onChange={handleChange}
//                         required
//                       >
//                         <option value="">-- Select Seller Type --</option>
//                         <option value="Manufacturer">Manufacturer</option>
//                         <option value="White Labelling Company/ Marketer">White Labelling Company/ Marketer</option>
//                         <option value="Distributor">Distributor</option>
//                         <option value="PCD">PCD</option>
//                       </select>
//                     </div>

//                     <div>
//   <label className="block mb-2 text-sm font-semibold text-primary-700">
//     Product Type(s) <span className="text-error-300">*</span>
//   </label>
  
//   <div className="relative" ref={productDropdownRef}>
//     <div 
//       className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 cursor-pointer flex justify-between items-center hover:border-primary-300 transition-all"
//       onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
//     >
//       <span className={form.productTypes.length === 0 ? "text-neutral-500" : "text-neutral-900"}>
//         {form.productTypes.length > 0 
//           ? `${form.productTypes.length} product type(s) selected`
//           : "Select product types"}
//       </span>
//       <i className={`bi ${isProductDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'} text-primary-600`}></i>
//     </div>
    
//     {isProductDropdownOpen && (
//       <div className="absolute top-full mt-1 w-full bg-white border-2 border-primary-200 rounded-xl shadow-xl z-50">
//         <div className="p-2 border-b border-primary-100">
//           <p className="text-sm text-neutral-600 font-medium">Select product types:</p>
//         </div>
//         <div className="max-h-60 overflow-y-auto">
//           {/* Select All option */}
//           <div 
//             className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100"
//             onClick={(e) => {
//               e.stopPropagation();
//               const allProductNames = PRODUCT_TYPES.map(p => p.name);
//               const areAllSelected = allProductNames.length === form.productTypes.length;
              
//               if (areAllSelected) {
//                 // If all are selected, deselect all
//                 setForm(prev => ({
//                   ...prev,
//                   productTypes: [],
//                   licenses: {}
//                 }));
//               } else {
//                 // If not all are selected, select all
//                 const newLicenses: Record<string, { number: string; file: File | null }> = {};
//                 allProductNames.forEach(productName => {
//                   newLicenses[productName] = {
//                     number: "",
//                     file: null
//                   };
//                 });
                
//                 setForm(prev => ({
//                   ...prev,
//                   productTypes: allProductNames,
//                   licenses: newLicenses
//                 }));
//               }
//             }}
//           >
//             <input
//               type="checkbox"
//               id="select-all"
//               checked={form.productTypes.length === PRODUCT_TYPES.length}
//               onChange={() => {}}
//               className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
//             />
//             <label 
//               htmlFor="select-all"
//               className="ml-3 text-sm font-medium text-primary-700 cursor-pointer"
//             >
//               Select All
//             </label>
//           </div>
          
//           {/* Individual product options */}
//           {PRODUCT_TYPES.map((product, index) => (
//             <div 
//               key={index}
//               className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100 last:border-b-0"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleProductTypeToggle(product.name);
//               }}
//             >
//               <input
//                 type="checkbox"
//                 id={`product-${index}`}
//                 checked={form.productTypes.includes(product.name)}
//                 onChange={() => {}}
//                 className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
//               />
//               <label 
//                 htmlFor={`product-${index}`}
//                 className="ml-3 text-sm text-neutral-900 cursor-pointer"
//               >
//                 {product.name}
//               </label>
//             </div>
//           ))}
//         </div>
//         <div className="p-2 border-t border-primary-100 bg-primary-50">
//           <p className="text-xs text-neutral-500">
//             {form.productTypes.length} of {PRODUCT_TYPES.length} selected
//           </p>
//         </div>
//       </div>
//     )}
//   </div>
  
//   {form.productTypes.length > 0 && (
//     <div className="mt-2">
//       <p className="text-sm text-success-300">
//         <i className="bi bi-check-circle-fill mr-1"></i>
//         Selected: {form.productTypes.join(", ")}
//       </p>
//     </div>
//   )}
  
//   {form.productTypes.length === 0 && (
//     <p className="mt-1 text-sm text-neutral-500">
//       <i className="bi bi-info-circle mr-1"></i>
//       Click to select product types
//     </p>
//   )}
// </div>
//                   </div>

//                   {/* Address Fields */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label htmlFor="state" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-geo-alt"></i>State: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="state"
//                         name="state"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter state"
//                         required
//                         value={form.state}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'state')}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="district" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-geo"></i>District: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="district"
//                         name="district"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter district"
//                         required
//                         value={form.district}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'district')}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="taluka" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-map"></i>Taluka: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="taluka"
//                         name="taluka"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter taluka"
//                         required
//                         value={form.taluka}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'taluka')}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="city" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-geo-fill"></i>City/Town/Village: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="city"
//                         name="city"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter city/town/village"
//                         required
//                         value={form.city}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'city')}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="street" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-signpost"></i>Street/Road/Lane: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="street"
//                         name="street"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter street/road/lane"
//                         required
//                         value={form.street}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'street')}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="buildingNo" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-house-door"></i>Building/House No: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="buildingNo"
//                         name="buildingNo"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter building/house no"
//                         required
//                         value={form.buildingNo}
//                         onChange={handleChange}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="landmark" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-geo"></i>Landmark:
//                       </label>
//                       <input
//                         type="text"
//                         id="landmark"
//                         name="landmark"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter landmark (optional)"
//                         value={form.landmark}
//                         onChange={handleChange}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="pincode" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-pin-map"></i>Pin Code: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="pincode"
//                         name="pincode"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter 6-digit pin code"
//                         required
//                         maxLength={6}
//                         value={form.pincode}
//                         onChange={(e) => handleNumericInput(e, 'pincode', 6)}
//                       />
//                     </div>
//                   </div>

//                   {/* Contact Information */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label htmlFor="phone" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-telephone"></i>Company Phone: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="tel"
//                         id="phone"
//                         name="phone"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter company phone"
//                         required
//                         maxLength={10}
//                         value={form.phone}
//                         onChange={(e) => handleNumericInput(e, 'phone', 10)}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="email" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-envelope"></i>Company Email ID: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="email"
//                         id="email"
//                         name="email"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter company email"
//                         required
//                         value={form.email}
//                         onChange={handleChange}
//                       />
//                     </div>
//                     <div className="md:col-span-2">
//                       <label htmlFor="website" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-globe"></i>Company Website (Optional):
//                       </label>
//                       <input
//                         type="url"
//                         id="website"
//                         name="website"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter company website"
//                         value={form.website}
//                         onChange={handleChange}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* STEP 2: Coordinator Details */}
//           {step === 2 && (
//             <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
//               <div className="mb-6">
//                 <div className="text-center mb-6">
//                   {/* <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-3 shadow-md">
//                     <i className="bi bi-person-badge text-white text-xl"></i>
//                   </div>
//                   <h4 className="text-xl font-bold text-neutral-900 mb-2">
//                     Company Coordinator Details
//                   </h4> */}
//                   {(!emailVerified || !phoneVerified) && (
//                     <div className="mt-3 p-3 bg-warning-100 border border-warning-200 rounded-xl text-warning-800 text-sm inline-flex items-center">
//                       <i className="bi bi-exclamation-triangle mr-2"></i>
//                       Please verify both Email and Mobile OTP to proceed
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-5">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label htmlFor="coordinatorName" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-person"></i>Coordinator Name: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="coordinatorName"
//                         name="coordinatorName"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter coordinator name"
//                         required
//                         value={form.coordinatorName}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'coordinatorName')}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="coordinatorDesignation" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-briefcase"></i>Coordinator Designation: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="coordinatorDesignation"
//                         name="coordinatorDesignation"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter designation"
//                         required
//                         value={form.coordinatorDesignation}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'coordinatorDesignation')}
//                       />
//                     </div>
//                   </div>

//                   {/* Coordinator Email and Mobile Verification */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <OtpVerification
//                         label="Email"
//                         value={form.coordinatorEmail}
//                         onChange={handleCoordinatorEmailChange}
//                         onVerified={() => setEmailVerified(true)}
//                         verified={emailVerified}
//                       />
//                     </div>
//                     <div>
//                       <OtpVerification
//                         label="Mobile"
//                         value={form.coordinatorMobile}
//                         onChange={handleCoordinatorMobileChange}
//                         onVerified={() => setPhoneVerified(true)}
//                         verified={phoneVerified}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* STEP 3: Documents */}
//           {step === 3 && (
//             <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
//               <div className="mb-6">
//                 {/* <div className="text-center mb-6">
//                   <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-3 shadow-md">
//                     <i className="bi bi-file-earmark-lock text-white text-xl"></i>
//                   </div>
//                   <h4 className="text-xl font-bold text-neutral-900 mb-2">
//                     Document Upload
//                   </h4>
//                   <p className="text-neutral-600 text-sm">
//                     Required documents based on your selected product types
//                   </p>
//                 </div> */}

//                 {/* GST Certificate Section */}
//                 <div className="mb-2">
//                   <div className="bg-primary-50 rounded-xl p-1 mb-2">
//                     <h3 className="text-lg font-semibold text-primary-700 flex items-center">
//                       <i className="bi bi-file-earmark-text mr-2"></i>GSTIN Certificate
//                     </h3>
//                   </div>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label htmlFor="gstNumber" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-hash"></i>GST Number: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="gstNumber"
//                         name="gstNumber"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter GST number"
//                         required
//                         value={form.gstNumber}
//                         onChange={handleChange}
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="gstFile" className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                         <i className="bi bi-upload"></i>GST Certificate: <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="file"
//                         id="gstFile"
//                         name="gstFile"
//                         className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
//                         accept=".pdf,.jpg,.jpeg,.png"
//                         required
//                         onChange={handleChange}
//                       />
//                       {form.gstFile && (
//                         <p className="mt-2 text-sm text-success-300">
//                           <i className="bi bi-check-circle-fill mr-1"></i>
//                           File selected: {form.gstFile.name}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Dynamic License Sections */}
//                 {form.productTypes.map((productType, index) => {
//                   const licenseInfo = getLicenseInfo(productType);
//                   const licenseData = form.licenses[productType] || { number: "", file: null };
                  
//                   return (
//                     <div key={productType} className="mb-4">
//                       <div className="bg-primary-50 rounded-xl p-2 mb-2">
//                         <h3 className="text-lg font-semibold text-primary-700 flex items-center">
//                           <i className="bi bi-prescription2 mr-2"></i>{licenseInfo.label}
//                           <span className="ml-2 text-sm font-normal text-neutral-600">
//                             (Required for: {productType})
//                           </span>
//                         </h3>
//                       </div>

//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         <div>
//                           <label 
//                             htmlFor={`licenseNumber-${productType}`} 
//                             className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                           >
//                             <i className="bi bi-hash"></i>{licenseInfo.label} Number: 
//                             <span className="text-error-300">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             id={`licenseNumber-${productType}`}
//                             name={`licenseNumber-${productType}`}
//                             className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                             placeholder={licenseInfo.placeholder}
//                             required
//                             value={licenseData.number}
//                             onChange={handleChange}
//                           />
//                         </div>
//                         <div>
//                           <label 
//                             htmlFor={`licenseFile-${productType}`} 
//                             className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                           >
//                             <i className="bi bi-upload"></i>{licenseInfo.label} File Upload: 
//                             <span className="text-error-300">*</span>
//                           </label>
//                           <input
//                             type="file"
//                             id={`licenseFile-${productType}`}
//                             name={`licenseFile-${productType}`}
//                             className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
//                             accept=".pdf,.jpg,.jpeg,.png"
//                             required
//                             onChange={handleChange}
//                           />
//                           {licenseData.file && (
//                             <p className="mt-2 text-sm text-success-300">
//                               <i className="bi bi-check-circle-fill mr-1"></i>
//                               File selected: {licenseData.file.name}
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}

//                 {/* Warning if no product types selected */}
//                 {form.productTypes.length === 0 && (
//                   <div className="mt-6 p-4 bg-warning-100 border border-warning-200 rounded-xl">
//                     <div className="flex items-center">
//                       <i className="bi bi-exclamation-triangle text-warning-800 text-xl mr-3"></i>
//                       <div>
//                         <p className="text-warning-800 font-medium">No product types selected</p>
//                         <p className="text-warning-700 text-sm mt-1">
//                           Please go back to Step 1 and select at least one product type.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* STEP 4: Bank Details */}
//          {/* STEP 4: Bank Details */}
// {step === 4 && (
//   <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
//     <div className="mb-6">
//       {/* <div className="text-center mb-6">
//         <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-3 shadow-md">
//           <i className="bi bi-bank text-white text-xl"></i>
//         </div>
//         <h4 className="text-xl font-bold text-neutral-900 mb-2">
//           Bank Account Details
//         </h4>
//         <p className="text-neutral-600 text-sm">
//           IFSC based auto-verification
//         </p>
//       </div> */}

//       <div className="space-y-6">
//         {/* Account Number and Holder Name */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label htmlFor="accountNumber" className="block mb-2 text-sm font-semibold text-primary-700">
//               Account Number <span className="text-error-300">*</span>
//             </label>
//             <input
//               type="text"
//               id="accountNumber"
//               className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//               value={form.accountNumber}
//               onChange={handleChange}
//               placeholder="Enter account number"
//               required
//             />
//           </div>

//           <div>
//             <label htmlFor="accountHolderName" className="block mb-2 text-sm font-semibold text-primary-700">
//               Account Holder Name <span className="text-error-300">*</span>
//             </label>
//             <input
//               type="text"
//               id="accountHolderName"
//               className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//               value={form.accountHolderName}
//               onChange={(e) => handleAlphabetInput(e, "accountHolderName")}
//               onKeyPress={handleAlphabetKeyPress}
//               placeholder="As per bank records"
//               required
//             />
//           </div>
//         </div>

//         {/* IFSC Code */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label htmlFor="ifscCode" className="block mb-2 text-sm font-semibold text-primary-700">
//               IFSC Code <span className="text-error-300">*</span>
//             </label>
//             <input
//               type="text"
//               id="ifscCode"
//               className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all uppercase"
//               maxLength={11}
//               value={form.ifscCode}
//               onChange={(e) => handleIfscChange(e.target.value)}
//               placeholder="SBIN0005943"
//               required
//             />
//             {ifscError && (
//               <p className="mt-1 text-sm text-error-300">{ifscError}</p>
//             )}
//           </div>
          
//           {/* Cancelled Cheque Upload */}
//           <div>
//             <label htmlFor="cancelledChequeFile" className="block mb-2 text-sm font-semibold text-primary-700">
//               Cancelled Cheque / Bank Details Proof <span className="text-error-300">*</span>
//             </label>
//             <input
//               type="file"
//               id="cancelledChequeFile"
//               name="cancelledChequeFile"
//               className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
//               accept=".pdf,.jpg,.jpeg,.png"
//               required
//               onChange={handleChange}
//             />
//             {form.cancelledChequeFile && (
//               <p className="mt-2 text-sm text-success-300">
//                 <i className="bi bi-check-circle-fill mr-1"></i>
//                 File selected: {form.cancelledChequeFile.name}
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Auto-filled Bank Details */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block mb-2 text-sm font-semibold text-primary-700">Bank Name</label>
//             <input
//               type="text"
//               className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//               value={form.bankName}
//               disabled
//               readOnly
//             />
//           </div>

//           <div>
//             <label className="block mb-2 text-sm font-semibold text-primary-700">Branch</label>
//             <input
//               type="text"
//               className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//               value={form.branch}
//               disabled
//               readOnly
//             />
//           </div>

//           <div>
//             <label className="block mb-2 text-sm font-semibold text-primary-700">State</label>
//             <input
//               type="text"
//               className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//               value={form.bankState}
//               disabled
//               readOnly
//             />
//           </div>

//           <div>
//             <label className="block mb-2 text-sm font-semibold text-primary-700">District</label>
//             <input
//               type="text"
//               className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//               value={form.bankDistrict}
//               disabled
//               readOnly
//             />
//           </div>
//         </div>

//         {/* Security Notice */}
//         <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-xl">
//           <div className="flex">
//             <i className="bi bi-shield-check text-primary-700 text-2xl mr-4"></i>
//             <div>
//               <h6 className="font-bold text-primary-800 mb-1">Security Assurance</h6>
//               <p className="text-sm text-neutral-700">
//                 Your bank details are encrypted and stored securely.
//                 We follow PCI-DSS compliance standards for financial data protection.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// )}

//           {/* STEP 5: Review */}
//           {step === 5 && (
//             <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-4 md:p-6 mb-6">
//               <div className="text-center mb-8">
//                 <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
//                   <i className="bi bi-shield-check text-white text-2xl"></i>
//                 </div>
//                 <h4 className="text-2xl font-bold bg-linear-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
//                   Final Submission Summary
//                 </h4>
//                 <p className="text-neutral-600 mt-2">Please review all details before final submission</p>
//               </div>

//               {/* Company Section */}
//               <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                 <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                   <i className="bi bi-building mr-2"></i> Company Details
//                 </h6>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {[
//                     { label: "Company Name", value: form.sellerName },
//                     { label: "Company Type", value: form.companyType },
//                     { label: "Seller Type", value: form.sellerType },
//                     { label: "Product Type(s)", value: form.productTypes.join(", ") },
//                     { label: "State", value: form.state },
//                     { label: "District", value: form.district },
//                     { label: "Taluka", value: form.taluka },
//                     { label: "City/Town/Village", value: form.city },
//                     { label: "Street/Road/Lane", value: form.street },
//                     { label: "Building/House No", value: form.buildingNo },
//                     { label: "Landmark", value: form.landmark || "N/A" },
//                     { label: "Pin Code", value: form.pincode },
//                     { label: "Phone", value: form.phone },
//                     { label: "Email", value: form.email },
//                     { label: "Website", value: form.website || "N/A" }
//                   ].map((item, index) => (
//                     <div key={index}>
//                       <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                         {item.label}
//                       </span>
//                       <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!item.value || (item.value === "N/A" && item.label === "Landmark") || (item.value === "N/A" && item.label === "Website") ? "text-neutral-500" : "text-neutral-900"}`}>
//                         {item.value || "Not provided"}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Coordinator Section */}
//               <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                 <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                   <i className="bi bi-person-badge mr-2"></i> Coordinator Details
//                 </h6>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {[
//                     { label: "Name", value: form.coordinatorName },
//                     { label: "Designation", value: form.coordinatorDesignation },
//                     { 
//                       label: "Email", 
//                       value: form.coordinatorEmail,
//                       verified: emailVerified
//                     },
//                     { 
//                       label: "Mobile", 
//                       value: form.coordinatorMobile,
//                       verified: phoneVerified
//                     }
//                   ].map((item, index) => (
//                     <div key={index}>
//                       <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                         {item.label}
//                       </span>
//                       <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!item.value ? "text-error-300" : "text-neutral-900"}`}>
//                         {item.value || "Not provided"}
//                         {item.verified !== undefined && item.value && (
//                           <span className={`ml-2 px-2 py-1 text-xs rounded ${item.verified ? 'bg-success-100 text-success-300' : 'bg-warning-100 text-warning-300'}`}>
//                             {item.verified ? "✔ Verified" : "Not verified"}
//                           </span>
//                         )}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Documents Section */}
//               <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                 <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                   <i className="bi bi-file-earmark-lock mr-2"></i> Compliance Documents
//                 </h6>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {/* GST Details */}
//                   <div>
//                     <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                       GST Number
//                     </span>
//                     <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!form.gstNumber ? "text-error-300" : "text-neutral-900"}`}>
//                       {form.gstNumber || "Not provided"}
//                     </p>
//                   </div>
//                   <div>
//                     <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                       GST Certificate
//                     </span>
//                     <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!form.gstFile ? "text-error-300" : "text-neutral-900"}`}>
//                       {form.gstFile ? (
//                         <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
//                           <i className="bi bi-file-earmark-pdf mr-2"></i>
//                           {form.gstFile.name}
//                         </span>
//                       ) : "Not uploaded"}
//                     </p>
//                   </div>
                  
//                   {/* Dynamic License Fields */}
//                   {form.productTypes.map(productType => {
//                     const licenseInfo = getLicenseInfo(productType);
//                     const licenseData = form.licenses[productType];
                    
//                     return (
//                       <React.Fragment key={productType}>
//                         <div>
//                           <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                             {licenseInfo.label} for {productType}
//                           </span>
//                           <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!licenseData?.number ? "text-error-300" : "text-neutral-900"}`}>
//                             {licenseData?.number || "Not provided"}
//                           </p>
//                         </div>
//                         <div>
//                           <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                             {licenseInfo.label} File
//                           </span>
//                           <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!licenseData?.file ? "text-error-300" : "text-neutral-900"}`}>
//                             {licenseData?.file ? (
//                               <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
//                                 <i className="bi bi-file-earmark-pdf mr-2"></i>
//                                 {licenseData.file.name}
//                               </span>
//                             ) : "Not uploaded"}
//                           </p>
//                         </div>
//                       </React.Fragment>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Bank Details Section */}
//               {/* Bank Details Section */}
// <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//   <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//     <i className="bi bi-bank mr-2"></i> Bank Account Details
//   </h6>
//   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//     {[
//       { label: "Bank Name", value: form.bankName },
//       { label: "Branch", value: form.branch },
//       { label: "State", value: form.bankState },
//       { label: "District", value: form.bankDistrict },
//       { label: "IFSC Code", value: form.ifscCode },
//       { label: "Account Number", value: form.accountNumber ? "****" + form.accountNumber.slice(-4) : "" },
//       { label: "Account Holder Name", value: form.accountHolderName },
//       { 
//         label: "Cancelled Cheque", 
//         value: form.cancelledChequeFile ? (
//           <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
//             <i className="bi bi-file-earmark-pdf mr-2"></i>
//             {form.cancelledChequeFile.name}
//           </span>
//         ) : "Not uploaded"
//       }
//     ].map((item, index) => (
//       <div key={index}>
//         <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//           {item.label}
//         </span>
//         <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${!item.value || item.value === "Not uploaded" ? "text-error-300" : "text-neutral-900"}`}>
//           {item.value || "Not provided"}
//         </p>
//       </div>
//     ))}
//   </div>
// </div>

//               {/* Validation Summary */}
//               <div className="p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                 <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                   <i className="bi bi-clipboard-check mr-2"></i> Validation Summary
//                 </h6>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {[
//                     {
//                       label: "Company Info",
//                       complete: form.sellerName && form.pincode && form.productTypes.length > 0
//                     },
//                     {
//                       label: "Verification",
//                       complete: emailVerified && phoneVerified
//                     },
//                     {
//                       label: "GST Document",
//                       complete: !!form.gstFile
//                     },
//                     {
//                       label: "Product Licenses",
//                       complete: form.productTypes.length > 0 && form.productTypes.every(pt => form.licenses[pt]?.number && form.licenses[pt]?.file)
//                     },
//                     {
//                       label: "Bank Details",
//                       complete: form.ifscCode && form.accountNumber && form.cancelledChequeFile
//                     }
//                   ].map((item, index) => (
//                     <div key={index} className="flex items-center">
//                       <i className={`bi ${item.complete ? 'bi-check-circle-fill text-success-300' : 'bi-x-circle-fill text-error-300'} text-lg mr-3`}></i>
//                       <span className="text-sm font-medium text-neutral-700">
//                         {item.label}: {item.complete ? 'Complete' : 'Incomplete'}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

// {/* Navigation Buttons */}
// <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t border-neutral-200 gap-4">
//   {step > 1 && (
//     <button
//       type="button"
//       onClick={back}
//       className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto"
//     >
//       <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
//         <i className="bi bi-arrow-left mr-2"></i> Back
//       </span>
//       <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//     </button>
//   )}
  
//   {/* Using justify-end on the container */}
//   <div className="w-full md:w-auto md:ml-auto flex justify-end">
//     <button
//       type="submit"
//       className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto"
//     >
//       <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
//         {step < 5 ? (
//           <>
//             Continue <i className="bi bi-arrow-right ml-2"></i>
//           </>
//         ) : (
//           <>
//             <i className="bi bi-check-circle mr-2"></i> Submit Application
//           </>
//         )}
//       </span>
//       <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//     </button>
//   </div>
// </div>
//         </form>
//       </div>
//     </div>
//   );
// }