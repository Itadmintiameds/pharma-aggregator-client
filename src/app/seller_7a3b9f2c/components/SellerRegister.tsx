"use client";
import React, { useState, useEffect, useRef } from "react";
import OtpVerification from "./OtpVerification";
import Header from "@/src/app/components/Header";

const IFSC_API = "https://ifsc.razorpay.com";
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Product type options with their corresponding license types
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

interface SellerRegisterProps {
  onBackToDashboard?: () => void;
}

export default function SellerRegister({ onBackToDashboard }: SellerRegisterProps) {
  const [step, setStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [ifscError, setIfscError] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  
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
    productTypes: [] as string[], // Changed to array for multi-select
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
    // Coordinator fields
    coordinatorName: "",
    coordinatorDesignation: "",
    coordinatorEmail: "",
    coordinatorMobile: "",
    // Document fields
    gstNumber: "",
    gstFile: null as File | null,
    // Dynamic license fields based on product types
    licenses: {} as Record<string, {
      number: string;
      file: File | null;
    }>,
    // Bank fields
    bankState: "",
    bankDistrict: "",
    bankName: "",
    branch: "",
    ifscCode: "",
    accountNumber: "",
    accountHolderName: "",
  });

  const handleChange = (e: any) => {
    const { id, value, files, type } = e.target;
    
    if (type === 'file' && files && files[0]) {
      // Check if this is a dynamic license file upload
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
      // Handle dynamic license number input
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
        // Remove if already selected
        newProductTypes = prev.productTypes.filter(type => type !== productValue);
        // Remove the corresponding license entry if it exists
        if (newLicenses[productValue]) {
          delete newLicenses[productValue];
        }
      } else {
        // Add if not selected
        newProductTypes = [...prev.productTypes, productValue];
        // Add empty license entry for this product type
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
      // Validation for Step 1
      if (!form.sellerName || !form.companyType || !form.sellerType || 
          form.productTypes.length === 0 ||
          !form.phone || !form.email || !form.state || !form.district || 
          !form.taluka || !form.city || !form.pincode) {
        alert("Please fill all required company information fields.");
        return;
      }
      
      // Validate pincode format
      if (!/^\d{6}$/.test(form.pincode)) {
        alert("Please enter a valid 6-digit PIN code.");
        return;
      }

      // Validate phone number
      if (!/^\d{10}$/.test(form.phone)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
      }

      // Validate email
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
      // Validate GST fields
      if (!form.gstNumber || !form.gstFile) {
        alert("Please fill GST fields and upload required file.");
        return;
      }
      
      // Validate dynamic license fields based on selected product types
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
      if (!form.accountNumber || !form.accountHolderName || !form.ifscCode) {
        alert("Please fill all bank account details.");
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

  const handleBackToDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    handleBackToDashboard();
  };

  const stepData = [
    {
      title: "Company",
      icon: "bi-building",
      activeIcon: "bi-building-fill",
      description: "Basic Information"
    },
    {
      title: "Coordinator",
      icon: "bi-person-badge",
      activeIcon: "bi-person-badge-fill",
      description: "Contact Details"
    },
    {
      title: "Documents",
      icon: "bi-file-earmark-lock",
      activeIcon: "bi-file-earmark-lock-fill",
      description: "Upload Files"
    },
    {
      title: "Bank",
      icon: "bi-bank",
      activeIcon: "bi-bank2",
      description: "Account Details"
    },
    {
      title: "Review",
      icon: "bi-shield-check",
      activeIcon: "bi-shield-check",
      description: "Final Verification"
    }
  ];

  return (
    <div className="phsr-root bg-[#F3ECF8]">
      <Header />
      
      <div className="container mt-3 ml-10">
        <button 
          onClick={handleBackToDashboard}
          className="phsr-btn-back mb-3 px-4 py-2 bg-[#f3ecf8] border border-[#751bb5] text-[#751bb5] rounded-lg hover:bg-[#751bb5] hover:text-white transition"
        >
          <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
        </button>
      </div>

      {showSuccessModal && (
        <div className="phsr-modal-overlay">
          <div className="phsr-modal-container">
            <div className="phsr-modal-content">
              <div className="phsr-modal-header">
                <div className="phsr-modal-icon">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <h3 className="phsr-modal-title">Application Submitted Successfully!</h3>
              </div>
              
              <div className="phsr-modal-body">
                <p className="phsr-modal-message">
                  Your seller registration application has been submitted successfully. 
                  Our team will review your application and contact you within 3-5 business days.
                </p>
                
                <div className="phsr-modal-details">
                  <div className="phsr-modal-detail-item">
                    <i className="bi bi-clock me-2"></i>
                    <span>Application ID: <strong>{applicationId}</strong></span>
                  </div>
                  <div className="phsr-modal-detail-item">
                    <i className="bi bi-calendar-check me-2"></i>
                    <span>Submitted on: <strong>{new Date().toLocaleDateString('en-IN')}</strong></span>
                  </div>
                  <div className="phsr-modal-detail-item">
                    <i className="bi bi-envelope me-2"></i>
                    <span>Confirmation sent to: <strong>{form.email}</strong></span>
                  </div>
                </div>
              </div>
              
              <div className="phsr-modal-footer">
                <button 
                  className="phsr-modal-btn phsr-modal-btn-primary"
                  onClick={handleCloseModal}
                >
                  <i className="bi bi-house me-2"></i> Go to Dashboard
                </button>
                <button 
                  className="phsr-modal-btn phsr-modal-btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="phsr-container mt-2 mb-5 ml-10 mr-10">
        <div className="phsr-onboarding-hero-sm phsr-mb-4">
          <div className="phsr-hero-glass-sm d-flex align-items-center justify-content-between px-4">
            <div className="text-center grow mt-3">
              <h2 className="fw-bold phsr-gradient-text-sm mb-1 text-[#9A6AFF]">
                Seller Registration
              </h2>
            </div>
          </div>
        </div>

        {/* Updated Stepper with Icons */}
        <div className="phsr-stepper-container phsr-mb-4" style={{ fontSize: '0.85rem' }}>
          <div className="phsr-stepper-steps">
            {stepData.map((stepInfo, index) => {
              const stepNumber = index + 1;
              const isActive = step === stepNumber;
              const isCompleted = step > stepNumber;

              return (
                <div
                  key={index}
                  className={`phsr-stepper-step position-relative ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => {
                    if (isCompleted || stepNumber === 1) {
                      setStep(stepNumber);
                    }
                  }}
                  style={{ 
                    cursor: isCompleted || stepNumber === 1 ? 'pointer' : 'default',
                    padding: '0.5rem 0'
                  }}
                >
                  {index < stepData.length - 1 && (
                    <div className="phsr-step-connector">
                      <div
                        className={`phsr-connector-line ${step > stepNumber ? 'completed' : ''}`}
                        style={{ height: '2px' }}
                      ></div>
                    </div>
                  )}

                  <div className="phsr-step-indicator" style={{ 
                    width: '32px', 
                    height: '32px',
                    fontSize: '1rem'
                  }}>
                    {isCompleted ? (
                      <div className="phsr-step-icon-completed">
                        <i className="bi bi-check-circle-fill text-success"></i>
                      </div>
                    ) : (
                      <div className={`phsr-step-icon ${isActive ? 'active' : ''}`}>
                        <i className={`bi ${isActive ? stepInfo.activeIcon : stepInfo.icon}`}></i>
                      </div>
                    )}
                  </div>

                  <div className="phsr-step-content" style={{ marginLeft: '8px' }}>
                    <h6 className={`phsr-step-title ${isActive ? 'text-primary fw-bold' : ''} ${isCompleted ? 'text-success' : ''}`}
                      style={{ fontSize: '0.85rem', marginBottom: '2px', fontWeight: isActive ? '600' : '500' }}>
                      {stepInfo.title}
                    </h6>
                    <small className="phsr-step-description" style={{ fontSize: '0.75rem' }}>
                      {stepInfo.description}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="phsr-current-step-status phsr-mt-3 text-center">
            <span className="badge bg-primary rounded-pill px-2 py-1" style={{ fontSize: '0.8rem' }}>
              <i className={`bi ${stepData[step - 1].activeIcon} me-1`}></i>
              Step {step}: {stepData[step - 1].title}
            </span>
            <small className="d-block phsr-mt-1 phsr-text-muted" style={{ fontSize: '0.8rem' }}>
              {step === 1 && "Provide your company details"}
              {step === 2 && "Add coordinator information and verify"}
              {step === 3 && "Upload required compliance documents"}
              {step === 4 && "Enter bank account details"}
              {step === 5 && "Review all information before submission"}
            </small>
          </div>
        </div>

        <form onSubmit={next}>
          {/* STEP 1: Company Information */}
          {step === 1 && (
            <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
              <div className="phsr-card phsr-mb-4 shadow-sm">
                <div className="phsr-card-header text-center" style={{ padding: '0.75rem 1rem' }}>
                  <div className="phsr-header-icon" style={{ height: '28px', width: '28px' }}>
                    <i className="bi bi-building"></i>
                  </div>
                  <h4 className="phsr-mb-0 phsr-header-text" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    Seller Company Information
                  </h4>
                </div>

                <div className="card-body phsr-p-4">
                  {/* Company Name and Company Type */}
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="sellerName" className="phsr-form-label">
                        <i className="bi bi-building me-2"></i>Seller Name/Company Name: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="sellerName"
                        name="sellerName"
                        className="phsr-input"
                        placeholder="Enter your company name"
                        required
                        value={form.sellerName}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'sellerName')}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="companyType" className="phsr-form-label">
                        <i className="bi bi-diagram-3 me-2"></i>Company Type: <span className="phsr-required">*</span>
                      </label>
                      <select
                        id="companyType"
                        name="companyType"
                        className="phsr-form-select"
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
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="sellerType" className="phsr-form-label">
                        Seller Type <span className="phsr-required">*</span>
                      </label>
                      <select
                        id="sellerType"
                        name="sellerType"
                        className="phsr-form-select"
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

                    <div className="phsr-col-md-6">
                      <label className="phsr-form-label">
                        Product Type(s) <span className="phsr-required">*</span>
                      </label>
                      
                      {/* Checkbox Dropdown Input */}
                      <div className="position-relative" ref={productDropdownRef}>
                        <div 
                          className="phsr-input"
                          onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                          style={{ 
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'relative',
                            zIndex: 1
                          }}
                        >
                          <span className={form.productTypes.length === 0 ? "phsr-text-muted" : ""}>
                            {form.productTypes.length > 0 
                              ? `${form.productTypes.length} product type(s) selected`
                              : "Select product types"}
                          </span>
                          <i className={`bi ${isProductDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                        </div>
                        
                        {/* Checkbox Dropdown */}
                        {isProductDropdownOpen && (
                          <div className="position-absolute w-100" style={{ 
                            zIndex: 1050,
                            top: '100%',
                            left: 0,
                            marginTop: '2px'
                          }}>
                            <div className="phsr-checkbox-dropdown">
                              <div className="phsr-checkbox-dropdown-header">
                                <small className="phsr-text-muted">Select product types:</small>
                              </div>
                              <div className="phsr-checkbox-options">
                                {PRODUCT_TYPES.map((product, index) => (
                                  <div 
                                    key={index}
                                    className="phsr-checkbox-option"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProductTypeToggle(product.name);
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      id={`product-${index}`}
                                      checked={form.productTypes.includes(product.name)}
                                      onChange={() => {}} // Handled by parent div click
                                      className="phsr-checkbox-input"
                                    />
                                    <label 
                                      htmlFor={`product-${index}`}
                                      className="phsr-checkbox-label"
                                    >
                                      {product.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="phsr-checkbox-dropdown-footer">
                                <small className="phsr-text-muted">
                                  {form.productTypes.length} of {PRODUCT_TYPES.length} selected
                                </small>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Selected Product Types Display */}
                      {form.productTypes.length > 0 && (
                        <div className="phsr-mt-2">
                          <small className="phsr-text-success">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            Selected: {form.productTypes.join(", ")}
                          </small>
                        </div>
                      )}
                      
                      {form.productTypes.length === 0 && (
                        <small className="phsr-text-muted d-block phsr-mt-1">
                          <i className="bi bi-info-circle me-1"></i>
                          Click to select product types
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Address Fields */}
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="state" className="phsr-form-label">
                        <i className="bi bi-geo-alt me-2"></i>State: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        className="phsr-input"
                        placeholder="Enter state"
                        required
                        value={form.state}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'state')}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="district" className="phsr-form-label">
                        <i className="bi bi-geo me-2"></i>District: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="district"
                        name="district"
                        className="phsr-input"
                        placeholder="Enter district"
                        required
                        value={form.district}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'district')}
                      />
                    </div>
                  </div>

                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="taluka" className="phsr-form-label">
                        <i className="bi bi-map me-2"></i>Taluka: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="taluka"
                        name="taluka"
                        className="phsr-input"
                        placeholder="Enter taluka"
                        required
                        value={form.taluka}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'taluka')}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="city" className="phsr-form-label">
                        <i className="bi bi-geo-fill me-2"></i>City/Town/Village: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        className="phsr-input"
                        placeholder="Enter city/town/village"
                        required
                        value={form.city}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'city')}
                      />
                    </div>
                  </div>

                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="street" className="phsr-form-label">
                        <i className="bi bi-signpost me-2"></i>Street/Road/Lane: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        className="phsr-input"
                        placeholder="Enter street/road/lane"
                        required
                        value={form.street}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'street')}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="buildingNo" className="phsr-form-label">
                        <i className="bi bi-house-door me-2"></i>Building/House No: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="buildingNo"
                        name="buildingNo"
                        className="phsr-input"
                        placeholder="Enter building/house no"
                        required
                        value={form.buildingNo}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="landmark" className="phsr-form-label">
                        <i className="bi bi-geo me-2"></i>Landmark:
                      </label>
                      <input
                        type="text"
                        id="landmark"
                        name="landmark"
                        className="phsr-input"
                        placeholder="Enter landmark (optional)"
                        value={form.landmark}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="pincode" className="phsr-form-label">
                        <i className="bi bi-pin-map me-2"></i>Pin Code: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        className="phsr-input"
                        placeholder="Enter 6-digit pin code"
                        required
                        maxLength={6}
                        value={form.pincode}
                        onChange={(e) => handleNumericInput(e, 'pincode', 6)}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="phone" className="phsr-form-label">
                        <i className="bi bi-telephone me-2"></i>Company Phone: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="phsr-input"
                        placeholder="Enter company phone"
                        required
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) => handleNumericInput(e, 'phone', 10)}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="email" className="phsr-form-label">
                        <i className="bi bi-envelope me-2"></i>Company Email ID: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="phsr-input"
                        placeholder="Enter company email"
                        required
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="phsr-row">
                    <div className="phsr-col-md-12">
                      <label htmlFor="website" className="phsr-form-label">
                        <i className="bi bi-globe me-2"></i>Company Website (Optional):
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        className="phsr-input"
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
            <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
              <div className="phsr-card phsr-mb-4 shadow-sm">
                <div className="phsr-card-header text-center" style={{ padding: '0.75rem 1rem' }}>
                  <div className="phsr-header-icon" style={{ height: '28px', width: '28px' }}>
                    <i className="bi bi-person-badge"></i>
                  </div>
                  <h4 className="phsr-mb-0 phsr-header-text" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    Company Coordinator Details
                  </h4>
                  {(!emailVerified || !phoneVerified) && (
                    <small className="phsr-verification-warning d-block phsr-mt-2">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Please verify both Email and Mobile OTP to proceed
                    </small>
                  )}
                </div>
                <div className="card-body phsr-p-4">
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="coordinatorName" className="phsr-form-label">
                        <i className="bi bi-person me-2"></i>Coordinator Name: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="coordinatorName"
                        name="coordinatorName"
                        className="phsr-input"
                        placeholder="Enter coordinator name"
                        required
                        value={form.coordinatorName}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'coordinatorName')}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="coordinatorDesignation" className="phsr-form-label">
                        <i className="bi bi-briefcase me-2"></i>Coordinator Designation: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="coordinatorDesignation"
                        name="coordinatorDesignation"
                        className="phsr-input"
                        placeholder="Enter designation"
                        required
                        value={form.coordinatorDesignation}
                        onKeyPress={handleAlphabetKeyPress}
                        onChange={(e) => handleAlphabetInput(e, 'coordinatorDesignation')}
                      />
                    </div>
                  </div>

                  <div className="phsr-row">
                    <div className="phsr-col-md-6">
                      <OtpVerification
                        label="Email"
                        value={form.coordinatorEmail}
                        onChange={handleCoordinatorEmailChange}
                        onVerified={() => setEmailVerified(true)}
                        verified={emailVerified}
                      />
                    </div>
                    <div className="phsr-col-md-6">
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

          {/* STEP 3: Documents - Dynamic based on selected product types */}
          {step === 3 && (
            <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
              <div className="phsr-card phsr-mb-4 shadow-sm">
                <div className="phsr-card-header text-center" style={{ padding: '0.75rem 1rem' }}>
                  <div className="phsr-header-icon" style={{ height: '28px', width: '28px' }}>
                    <i className="bi bi-file-earmark-lock"></i>
                  </div>
                  <h4 className="phsr-mb-0 phsr-header-text" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    Document Upload
                  </h4>
                  <small className="phsr-text-muted">
                    Required documents based on your selected product types
                  </small>
                </div>
                
                {/* GST Certificate Section */}
                <div className="phsr-card-header text-dark bg-light text-center" style={{ padding: '0.75rem 1rem' }}>
                  <h3 className="phsr-mb-0 phsr-section-title" style={{ fontSize: '1rem' }}>
                    <i className="bi bi-file-earmark-text me-2"></i>GSTIN Certificate
                  </h3>
                </div>
                <div className="card-body phsr-p-4">
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="gstNumber" className="phsr-form-label">
                        <i className="bi bi-hash me-2"></i>GST Number: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="gstNumber"
                        name="gstNumber"
                        className="phsr-input"
                        placeholder="Enter GST number"
                        required
                        value={form.gstNumber}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="gstFile" className="phsr-form-label">
                        <i className="bi bi-upload me-2"></i>GST Certificate: <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="file"
                        id="gstFile"
                        name="gstFile"
                        className="phsr-file-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                        onChange={handleChange}
                      />
                      {form.gstFile && (
                        <small className="phsr-text-success phsr-mt-1 phsr-d-block">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          File selected: {form.gstFile.name}
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic License Sections based on selected product types */}
                {form.productTypes.map((productType, index) => {
                  const licenseInfo = getLicenseInfo(productType);
                  const licenseData = form.licenses[productType] || { number: "", file: null };
                  
                  return (
                    <div key={productType}>
                      <div className="phsr-card-header text-dark bg-light text-center phsr-mb-3" style={{ padding: '0.75rem 1rem' }}>
                        <h3 className="phsr-mb-0 phsr-section-title" style={{ fontSize: '1rem' }}>
                          <i className="bi bi-prescription2 me-2"></i>{licenseInfo.label}
                          <small className="d-block phsr-mt-1 phsr-text-muted">
                            Required for: {productType}
                          </small>
                        </h3>
                      </div>

                      <div className="phsr-row phsr-mb-3 phsr-p-4">
                        <div className="phsr-col-md-6">
                          <label 
                            htmlFor={`licenseNumber-${productType}`} 
                            className="phsr-form-label"
                          >
                            <i className="bi bi-hash me-2"></i>{licenseInfo.label} Number: 
                            <span className="phsr-required">*</span>
                          </label>
                          <input
                            type="text"
                            id={`licenseNumber-${productType}`}
                            name={`licenseNumber-${productType}`}
                            className="phsr-input"
                            placeholder={licenseInfo.placeholder}
                            required
                            value={licenseData.number}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="phsr-col-md-6">
                          <label 
                            htmlFor={`licenseFile-${productType}`} 
                            className="phsr-form-label"
                          >
                            <i className="bi bi-upload me-2"></i>{licenseInfo.label} File Upload: 
                            <span className="phsr-required">*</span>
                          </label>
                          <input
                            type="file"
                            id={`licenseFile-${productType}`}
                            name={`licenseFile-${productType}`}
                            className="phsr-file-input"
                            accept=".pdf,.jpg,.jpeg,.png"
                            required
                            onChange={handleChange}
                          />
                          {licenseData.file && (
                            <small className="phsr-text-success phsr-mt-1 phsr-d-block">
                              <i className="bi bi-check-circle-fill me-1"></i>
                              File selected: {licenseData.file.name}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Warning if no product types selected */}
                {form.productTypes.length === 0 && (
                  <div className="phsr-alert phsr-alert-warning phsr-mt-4 phsr-p-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    No product types selected. Please go back to Step 1 and select at least one product type.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Bank Details with IFSC auto-fill */}
          {step === 4 && (
            <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
              <div className="phsr-card shadow-sm">
                <div className="phsr-card-header text-center" style={{ padding: '0.75rem 1rem' }}>
                  <div className="phsr-header-icon" style={{ height: '28px', width: '28px' }}>
                    <i className="bi bi-bank"></i>
                  </div>
                  <h4 className="phsr-mb-0 phsr-header-text" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    Bank Account Details
                  </h4>
                  <small className="text-muted">
                    IFSC based auto-verification
                  </small>
                </div>

                <div className="card-body phsr-p-4">
                  {/* Account Number and Holder Name */}
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="accountNumber" className="phsr-form-label">
                        Account Number <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        className="phsr-input"
                        value={form.accountNumber}
                        onChange={handleChange}
                        placeholder="Enter account number"
                        required
                      />
                    </div>

                    <div className="phsr-col-md-6">
                      <label htmlFor="accountHolderName" className="phsr-form-label">
                        Account Holder Name <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="accountHolderName"
                        className="phsr-input"
                        value={form.accountHolderName}
                        onChange={(e) => handleAlphabetInput(e, "accountHolderName")}
                        onKeyPress={handleAlphabetKeyPress}
                        placeholder="As per bank records"
                        required
                      />
                    </div>
                  </div>

                  {/* IFSC Code */}
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="ifscCode" className="phsr-form-label">
                        IFSC Code <span className="phsr-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="ifscCode"
                        className="phsr-input"
                        maxLength={11}
                        value={form.ifscCode}
                        onChange={(e) => handleIfscChange(e.target.value)}
                        placeholder="SBIN0005943"
                        style={{ textTransform: "uppercase" }}
                        required
                      />
                      {ifscError && (
                        <small className="text-danger">{ifscError}</small>
                      )}
                    </div>
                  </div>

                  {/* Auto-filled Bank Details */}
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label className="phsr-form-label">Bank Name</label>
                      <input
                        type="text"
                        className="phsr-input"
                        value={form.bankName}
                        disabled
                        readOnly
                      />
                    </div>

                    <div className="phsr-col-md-6">
                      <label className="phsr-form-label">Branch</label>
                      <input
                        type="text"
                        className="phsr-input"
                        value={form.branch}
                        disabled
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="phsr-row">
                    <div className="phsr-col-md-6">
                      <label className="phsr-form-label">State</label>
                      <input
                        type="text"
                        className="phsr-input"
                        value={form.bankState}
                        disabled
                        readOnly
                      />
                    </div>

                    <div className="phsr-col-md-6">
                      <label className="phsr-form-label">District</label>
                      <input
                        type="text"
                        className="phsr-input"
                        value={form.bankDistrict}
                        disabled
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="alert alert-info phsr-mt-4">
                    <div className="d-flex">
                      <i className="bi bi-shield-check me-3 fs-4"></i>
                      <div>
                        <h6 className="alert-heading phsr-mb-1">Security Assurance</h6>
                        <small className="phsr-mb-0">
                          Your bank details are encrypted and stored securely.
                          We follow PCI-DSS compliance standards for financial data protection.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review - Updated with dynamic license fields */}
          {step === 5 && (
            <div className="phsr-final-review-card">
              <div className="text-center phsr-mb-4">
                <div className="phsr-review-check-icon">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h4 className="fw-bold phsr-gradient-text-sm">
                  Final Verification Summary
                </h4>
                <small className="phsr-text-muted">Please review all details before final submission</small>
              </div>

              {/* Company Section */}
              <div className="phsr-review-section">
                <h6 className="phsr-review-section-title">
                  <i className="bi bi-building me-2"></i> Company Details
                </h6>
                <div className="phsr-row">
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Company Name</span>
                    <p className={`phsr-review-field-value ${!form.sellerName ? "phsr-text-danger" : ""}`}>
                      {form.sellerName || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Company Type</span>
                    <p className={`phsr-review-field-value ${!form.companyType ? "phsr-text-danger" : ""}`}>
                      {form.companyType || "Not selected"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Seller Type</span>
                    <p className={`phsr-review-field-value ${!form.sellerType ? "phsr-text-danger" : ""}`}>
                      {form.sellerType || "Not selected"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Product Type(s)</span>
                    <p className={`phsr-review-field-value ${form.productTypes.length === 0 ? "phsr-text-danger" : ""}`}>
                      {form.productTypes.length > 0 
                        ? form.productTypes.join(", ") 
                        : "Not selected"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">State</span>
                    <p className={`phsr-review-field-value ${!form.state ? "phsr-text-danger" : ""}`}>
                      {form.state || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">District</span>
                    <p className={`phsr-review-field-value ${!form.district ? "phsr-text-danger" : ""}`}>
                      {form.district || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Taluka</span>
                    <p className={`phsr-review-field-value ${!form.taluka ? "phsr-text-danger" : ""}`}>
                      {form.taluka || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">City/Town/Village</span>
                    <p className={`phsr-review-field-value ${!form.city ? "phsr-text-danger" : ""}`}>
                      {form.city || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Street/Road/Lane</span>
                    <p className={`phsr-review-field-value ${!form.street ? "phsr-text-danger" : ""}`}>
                      {form.street || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Building/House No</span>
                    <p className={`phsr-review-field-value ${!form.buildingNo ? "phsr-text-danger" : ""}`}>
                      {form.buildingNo || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Landmark</span>
                    <p className={`phsr-review-field-value ${!form.landmark ? "phsr-text-muted" : ""}`}>
                      {form.landmark || "N/A"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Pin Code</span>
                    <p className={`phsr-review-field-value ${!form.pincode ? "phsr-text-danger" : ""}`}>
                      {form.pincode || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Phone</span>
                    <p className={`phsr-review-field-value ${!form.phone ? "phsr-text-danger" : ""}`}>
                      {form.phone || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Email</span>
                    <p className={`phsr-review-field-value ${!form.email ? "phsr-text-danger" : ""}`}>
                      {form.email || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Website</span>
                    <p className={`phsr-review-field-value ${!form.website ? "phsr-text-muted" : ""}`}>
                      {form.website || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coordinator Section */}
              <div className="phsr-review-section">
                <h6 className="phsr-review-section-title">
                  <i className="bi bi-person-badge me-2"></i> Coordinator Details
                </h6>
                <div className="phsr-row">
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Name</span>
                    <p className={`phsr-review-field-value ${!form.coordinatorName ? "phsr-text-danger" : ""}`}>
                      {form.coordinatorName || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Designation</span>
                    <p className={`phsr-review-field-value ${!form.coordinatorDesignation ? "phsr-text-danger" : ""}`}>
                      {form.coordinatorDesignation || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Email</span>
                    <p className={`phsr-review-field-value ${!form.coordinatorEmail ? "phsr-text-danger" : ""}`}>
                      {form.coordinatorEmail || "Not provided"}
                      {emailVerified && <span className="phsr-verified-badge">✔ Verified</span>}
                      {!emailVerified && form.coordinatorEmail && <span className="phsr-text-warning"> (Not verified)</span>}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Mobile</span>
                    <p className={`phsr-review-field-value ${!form.coordinatorMobile ? "phsr-text-danger" : ""}`}>
                      {form.coordinatorMobile || "Not provided"}
                      {phoneVerified && <span className="phsr-verified-badge">✔ Verified</span>}
                      {!phoneVerified && form.coordinatorMobile && <span className="phsr-text-warning"> (Not verified)</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents Section - Updated with dynamic licenses */}
              <div className="phsr-review-section">
                <h6 className="phsr-review-section-title">
                  <i className="bi bi-file-earmark-lock me-2"></i> Compliance Documents
                </h6>
                <div className="phsr-row">
                  {/* GST Details */}
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">GST Number</span>
                    <p className={`phsr-review-field-value ${!form.gstNumber ? "phsr-text-danger" : ""}`}>
                      {form.gstNumber || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">GST Certificate</span>
                    <p className={`phsr-review-field-value ${!form.gstFile ? "phsr-text-danger" : ""}`}>
                      {form.gstFile ? (
                        <span className="phsr-file-pill">
                          <i className="bi bi-file-earmark-pdf me-1"></i>
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
                        <div className="phsr-col-md-6">
                          <span className="phsr-review-field-label">
                            {licenseInfo.label} for {productType}
                          </span>
                          <p className={`phsr-review-field-value ${!licenseData?.number ? "phsr-text-danger" : ""}`}>
                            {licenseData?.number || "Not provided"}
                          </p>
                        </div>
                        <div className="phsr-col-md-6">
                          <span className="phsr-review-field-label">
                            {licenseInfo.label} File
                          </span>
                          <p className={`phsr-review-field-value ${!licenseData?.file ? "phsr-text-danger" : ""}`}>
                            {licenseData?.file ? (
                              <span className="phsr-file-pill">
                                <i className="bi bi-file-earmark-pdf me-1"></i>
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
              <div className="phsr-review-section">
                <h6 className="phsr-review-section-title">
                  <i className="bi bi-bank me-2"></i> Bank Account Details
                </h6>
                <div className="phsr-row">
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Bank Name</span>
                    <p className={`phsr-review-field-value ${!form.bankName ? "phsr-text-danger" : ""}`}>
                      {form.bankName || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Branch</span>
                    <p className={`phsr-review-field-value ${!form.branch ? "phsr-text-danger" : ""}`}>
                      {form.branch || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">State</span>
                    <p className={`phsr-review-field-value ${!form.bankState ? "phsr-text-danger" : ""}`}>
                      {form.bankState || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">District</span>
                    <p className={`phsr-review-field-value ${!form.bankDistrict ? "phsr-text-danger" : ""}`}>
                      {form.bankDistrict || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">IFSC Code</span>
                    <p className={`phsr-review-field-value ${!form.ifscCode ? "phsr-text-danger" : ""}`}>
                      {form.ifscCode || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Account Number</span>
                    <p className={`phsr-review-field-value ${!form.accountNumber ? "phsr-text-danger" : ""}`}>
                      {form.accountNumber ? "****" + form.accountNumber.slice(-4) : "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Account Holder Name</span>
                    <p className={`phsr-review-field-value ${!form.accountHolderName ? "phsr-text-danger" : ""}`}>
                      {form.accountHolderName || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Validation Summary - Updated */}
              <div className="phsr-validation-summary">
                <h6 className="phsr-mb-2">
                  <i className="bi bi-clipboard-check me-2"></i>Validation Summary
                </h6>
                <div className="phsr-row">
                  <div className="phsr-col-md-6">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className={`bi ${form.sellerName && form.pincode && form.productTypes.length > 0 ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
                      Company Info: {form.sellerName && form.pincode && form.productTypes.length > 0 ? 'Complete' : 'Incomplete'}
                    </small>
                  </div>
                  <div className="phsr-col-md-6">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className={`bi ${emailVerified && phoneVerified ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
                      Verification: {emailVerified && phoneVerified ? 'Complete' : 'Pending'}
                    </small>
                  </div>
                  <div className="phsr-col-md-6">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className={`bi ${form.gstFile ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
                      GST Document: {form.gstFile ? 'Complete' : 'Incomplete'}
                    </small>
                  </div>
                  <div className="phsr-col-md-6">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className={`bi ${form.productTypes.length > 0 && form.productTypes.every(pt => form.licenses[pt]?.number && form.licenses[pt]?.file) ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
                      Product Licenses: {form.productTypes.length > 0 && form.productTypes.every(pt => form.licenses[pt]?.number && form.licenses[pt]?.file) ? 'Complete' : 'Incomplete'}
                    </small>
                  </div>
                  <div className="phsr-col-md-6">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className={`bi ${form.ifscCode && form.accountNumber ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
                      Bank Details: {form.ifscCode && form.accountNumber ? 'Complete' : 'Incomplete'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="phsr-button-group">
            {step > 1 && (
              <button type="button" className="phsr-btn-back" onClick={back}>
                <i className="bi bi-arrow-left me-2"></i> Back
              </button>
            )}

            <button type="submit" className="phsr-btn-next ms-auto">
              {step < 5 ? (
                <>
                  Continue <i className="bi bi-arrow-right ms-2"></i>
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i> Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




























// "use client";
// import React, { useState } from "react";
// import OtpVerification from "./OtpVerification";
// import Header from "@/src/app/components/Header";

// interface SellerRegisterProps {
//   onBackToDashboard?: () => void;
// }

// export default function SellerRegister({ onBackToDashboard }: SellerRegisterProps) {
//   const [step, setStep] = useState(1);
//   const [emailVerified, setEmailVerified] = useState(false);
//   const [phoneVerified, setPhoneVerified] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [applicationId, setApplicationId] = useState("");

//   const [form, setForm] = useState({
//     sellerName: "",
//     companyType: "",
//     phone: "",
//     email: "",
//     website: "",
//     state: "",
//     district: "",
//     taluka: "",
//     city: "",
//     street: "",
//     buildingNo: "",
//     landmark: "",
//     pincode: "",
//     coordinatorName: "",
//     coordinatorDesignation: "",
//     coordinatorEmail: "",
//     coordinatorMobile: "",
//     gstNumber: "",
//     gstFile: null as File | null,
//     licenseNumber: "",
//     licenseFile: null as File | null,
//     bankState: "",
//     bankDistrict: "",
//     bankTaluka: "",
//     bankName: "",
//     branch: "",
//     ifscCode: "",
//     accountNumber: "",
//     accountHolderName: "",
//   });

//   const handleChange = (e: any) => {
//     const { id, value, files } = e.target;
//     if (files && files[0]) {
//       setForm(prev => ({ ...prev, [id]: files[0] }));
//     } else {
//       setForm(prev => ({ ...prev, [id]: value }));
//     }
//   };

//   const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
//     const value = e.target.value;
//     const filteredValue = value.replace(/[^a-zA-Z\s,'.-]/g, '');
//     setForm(prev => ({
//       ...prev,
//       [fieldName]: filteredValue
//     }));
//   };

//   const handleAlphabetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const key = e.key;
//     const isValidKey = /^[a-zA-Z\s,'.-]$/.test(key);
//     if (!isValidKey && key !== 'Backspace' && key !== 'Delete' && key !== 'Tab' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
//       e.preventDefault();
//     }
//   };

//   const handleCoordinatorEmailChange = (value: string) => {
//     setForm(prev => ({ ...prev, coordinatorEmail: value }));
//   };

//   const handleCoordinatorMobileChange = (value: string) => {
//     setForm(prev => ({ ...prev, coordinatorMobile: value }));
//   };

//   const next = (e: any) => {
//     e.preventDefault();

//     if (step === 1) {
//       if (!form.sellerName || !form.companyType || !form.phone || !form.email || 
//           !form.state || !form.district || !form.taluka || !form.city || 
//           !form.street || !form.buildingNo || !form.pincode) {
//         alert("Please fill all required company information fields.");
//         return;
//       }
      
//       if (!/^\d{6}$/.test(form.pincode)) {
//         alert("Please enter a valid 6-digit PIN code.");
//         return;
//       }
//     }

//     if (step === 2) {
//       if (!form.coordinatorName || !form.coordinatorDesignation) {
//         alert("Please fill coordinator name and designation.");
//         return;
//       }

//       if (!emailVerified || !phoneVerified) {
//         alert("Please verify both Email and Mobile OTP before proceeding.");
//         return;
//       }
//     }

//     if (step === 3) {
//       if (!form.gstNumber || !form.gstFile || !form.licenseNumber || !form.licenseFile) {
//         alert("Please fill all document fields and upload required files.");
//         return;
//       }
//     }

//     if (step === 4) {
//       if (!form.bankState || !form.bankDistrict || !form.bankTaluka || !form.bankName ||
//         !form.branch || !form.ifscCode || !form.accountNumber || !form.accountHolderName) {
//         alert("Please fill all required bank details fields.");
//         return;
//       }

//       if (form.ifscCode.length !== 11) {
//         alert("IFSC Code must be 11 characters long.");
//         return;
//       }

//       if (form.accountNumber.length < 9 || !/^\d+$/.test(form.accountNumber)) {
//         alert("Please enter a valid account number (minimum 9 digits).");
//         return;
//       }
//     }

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

//   const handleBackToDashboard = () => {
//     if (onBackToDashboard) {
//       onBackToDashboard();
//     }
//   };

//   const handleCloseModal = () => {
//     setShowSuccessModal(false);
//     handleBackToDashboard();
//   };

//   const stepData = [
//     {
//       title: "Company",
//       icon: "bi-building",
//       description: "Basic Information"
//     },
//     {
//       title: "Coordinator",
//       icon: "bi-person-badge",
//       description: "Contact Details"
//     },
//     {
//       title: "Documents",
//       icon: "bi-file-earmark-lock",
//       description: "Upload Files"
//     },
//     {
//       title: "Bank",
//       icon: "bi-bank",
//       description: "Account Details"
//     },
//     {
//       title: "Review",
//       icon: "bi-shield-check",
//       description: "Final Verification"
//     }
//   ];

//   return (
//     <div className="phsr-root bg-[#F3ECF8]">
//       <Header />
      
//       <div className="container mt-3 ml-10">
//         <button 
//           onClick={handleBackToDashboard}
//           className="phsr-btn-back mb-3 px-4 py-2 bg-[#f3ecf8] border border-[#751bb5] text-[#751bb5] rounded-lg hover:bg-[#751bb5] hover:text-white transition"
//         >
//           <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
//         </button>
//       </div>

//       {showSuccessModal && (
//         <div className="phsr-modal-overlay">
//           <div className="phsr-modal-container">
//             <div className="phsr-modal-content">
//               <div className="phsr-modal-header">
//                 <div className="phsr-modal-icon">
//                   <i className="bi bi-check-circle-fill"></i>
//                 </div>
//                 <h3 className="phsr-modal-title">Application Submitted Successfully!</h3>
//               </div>
              
//               <div className="phsr-modal-body">
//                 <p className="phsr-modal-message">
//                   Your seller registration application has been submitted successfully. 
//                   Our team will review your application and contact you within 3-5 business days.
//                 </p>
                
//                 <div className="phsr-modal-details">
//                   <div className="phsr-modal-detail-item">
//                     <i className="bi bi-clock me-2"></i>
//                     <span>Application ID: <strong>{applicationId}</strong></span>
//                   </div>
//                   <div className="phsr-modal-detail-item">
//                     <i className="bi bi-calendar-check me-2"></i>
//                     <span>Submitted on: <strong>{new Date().toLocaleDateString('en-IN')}</strong></span>
//                   </div>
//                   <div className="phsr-modal-detail-item">
//                     <i className="bi bi-envelope me-2"></i>
//                     <span>Confirmation sent to: <strong>{form.email}</strong></span>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="phsr-modal-footer">
//                 <button 
//                   className="phsr-modal-btn phsr-modal-btn-primary"
//                   onClick={handleCloseModal}
//                 >
//                   <i className="bi bi-house me-2"></i> Go to Dashboard
//                 </button>
//                 <button 
//                   className="phsr-modal-btn phsr-modal-btn-secondary"
//                   onClick={handleCloseModal}
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="phsr-container mt-2 mb-5 ml-10 mr-10">
//         <div className="phsr-onboarding-hero-sm phsr-mb-4">
//           <div className="phsr-hero-glass-sm d-flex align-items-center justify-content-between px-4">
//             <div className="text-center grow mt-3">
//               <h2 className="fw-bold phsr-gradient-text-sm mb-1 text-[#9A6AFF]">
//                 Seller Registration
//               </h2>
//             </div>
//           </div>
//         </div>

//         <div className="phsr-stepper-container phsr-mb-4">
//           <div className="phsr-stepper-steps">
//             {stepData.map((stepInfo, index) => {
//               const stepNumber = index + 1;
//               const isActive = step === stepNumber;
//               const isCompleted = step > stepNumber;

//               return (
//                 <div
//                   key={index}
//                   className={`phsr-stepper-step position-relative ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
//                   onClick={() => {
//                     if (isCompleted || stepNumber === 1) {
//                       setStep(stepNumber);
//                     }
//                   }}
//                   style={{ cursor: isCompleted || stepNumber === 1 ? 'pointer' : 'default' }}
//                 >
//                   {index < stepData.length - 1 && (
//                     <div className="phsr-step-connector">
//                       <div
//                         className={`phsr-connector-line ${step > stepNumber ? 'completed' : ''}`}
//                       ></div>
//                     </div>
//                   )}

//                   <div className="phsr-step-indicator">
//                     {isCompleted ? (
//                       <div className="phsr-step-checkmark">
//                         <i className="bi bi-check"></i>
//                       </div>
//                     ) : (
//                       <div className="phsr-step-number">{stepNumber}</div>
//                     )}
//                   </div>

//                   <div className="phsr-step-content">
//                     <h6 className={`phsr-step-title ${isActive ? 'text-primary' : ''} ${isCompleted ? 'text-success' : ''}`}>
//                       {stepInfo.title}
//                     </h6>
//                     <small className="phsr-step-description">
//                       {stepInfo.description}
//                     </small>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="phsr-current-step-status phsr-mt-4 text-center">
//             <span className="badge bg-primary rounded-pill px-3 py-2">
//               <i className={`bi ${stepData[step - 1].icon} me-2`}></i>
//               Step {step}: {stepData[step - 1].title}
//             </span>
//             <small className="d-block phsr-mt-1 phsr-text-muted">
//               {step === 1 && "Provide your company details"}
//               {step === 2 && "Add coordinator information and verify"}
//               {step === 3 && "Upload required compliance documents"}
//               {step === 4 && "Enter bank account details"}
//               {step === 5 && "Review all information before submission"}
//             </small>
//           </div>
//         </div>

//         <form onSubmit={next}>
//           {step === 1 && (
//             <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
//               <div className="phsr-card phsr-mb-4 shadow-sm">
//                 <div className="phsr-card-header text-center">
//                   <div className="phsr-header-icon">
//                     <i className="bi bi-building"></i>
//                   </div>
//                   <h4 className="phsr-mb-0 phsr-header-text">Seller Company Information</h4>
//                 </div>
//                 <div className="card-body phsr-p-4">
//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="sellerName" className="phsr-form-label">
//                         <i className="bi bi-building me-2"></i>Seller Name/Company Name: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="sellerName"
//                         name="sellerName"
//                         className="phsr-input"
//                         placeholder="Enter your name"
//                         required
//                         value={form.sellerName}
//                         onKeyPress={(e) => {
//                           const key = e.key;
//                           const isValidKey = /^[a-zA-Z\s'.-]$/.test(key);
//                           if (!isValidKey) {
//                             e.preventDefault();
//                           }
//                         }}
//                         onChange={(e) => {
//                           const value = e.target.value;
//                           const filteredValue = value.replace(/[^a-zA-Z\s'.-]/g, '');
//                           setForm(prev => ({
//                             ...prev,
//                             sellerName: filteredValue
//                           }));
//                         }}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="companyType" className="phsr-form-label">
//                         <i className="bi bi-diagram-3 me-2"></i>Company Type: <span className="phsr-required">*</span>
//                       </label>
//                       <select
//                         id="companyType"
//                         name="companyType"
//                         className="phsr-form-select"
//                         required
//                         value={form.companyType}
//                         onChange={handleChange}
//                       >
//                         <option value="">-- Select Company Type --</option>
//                         <option value="Drug Manufacturer">Drug Manufacturer</option>
//                         <option value="White Labelling Company">White Labelling Company</option>
//                         <option value="Distributors">Distributors</option>
//                       </select>
//                     </div>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="state" className="phsr-form-label">
//                         <i className="bi bi-geo-alt me-2"></i>State: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="state"
//                         name="state"
//                         className="phsr-input"
//                         placeholder="Enter state"
//                         required
//                         value={form.state}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'state')}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="district" className="phsr-form-label">
//                         <i className="bi bi-geo me-2"></i>District: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="district"
//                         name="district"
//                         className="phsr-input"
//                         placeholder="Enter district"
//                         required
//                         value={form.district}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'district')}
//                       />
//                     </div>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="taluka" className="phsr-form-label">
//                         <i className="bi bi-map me-2"></i>Taluka: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="taluka"
//                         name="taluka"
//                         className="phsr-input"
//                         placeholder="Enter taluka"
//                         required
//                         value={form.taluka}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'taluka')}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="city" className="phsr-form-label">
//                         <i className="bi bi-geo-fill me-2"></i>City/Town/Village: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="city"
//                         name="city"
//                         className="phsr-input"
//                         placeholder="Enter city/town/village"
//                         required
//                         value={form.city}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'city')}
//                       />
//                     </div>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="street" className="phsr-form-label">
//                         <i className="bi bi-signpost me-2"></i>Street/Road/Lane: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="street"
//                         name="street"
//                         className="phsr-input"
//                         placeholder="Enter street/road/lane"
//                         required
//                         value={form.street}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'street')}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="buildingNo" className="phsr-form-label">
//                         <i className="bi bi-house-door me-2"></i>Building/House No: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="buildingNo"
//                         name="buildingNo"
//                         className="phsr-input"
//                         placeholder="Enter building/house no"
//                         required
//                         value={form.buildingNo}
//                         onChange={handleChange}
//                       />
//                     </div>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="landmark" className="phsr-form-label">
//                         <i className="bi bi-geo me-2"></i>Landmark:
//                       </label>
//                       <input
//                         type="text"
//                         id="landmark"
//                         name="landmark"
//                         className="phsr-input"
//                         placeholder="Enter landmark (optional)"
//                         value={form.landmark}
//                         onChange={handleChange}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="pincode" className="phsr-form-label">
//                         <i className="bi bi-pin-map me-2"></i>Pin Code: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="pincode"
//                         name="pincode"
//                         className="phsr-input"
//                         placeholder="Enter 6-digit pin code"
//                         required
//                         pattern="[0-9]{6}"
//                         maxLength={6}
//                         title="Please enter exactly 6 digits"
//                         value={form.pincode}
//                         onChange={handleChange}
//                         onKeyPress={(e) => {
//                           if (!/[0-9]/.test(e.key)) {
//                             e.preventDefault();
//                           }
//                         }}
//                       />
//                     </div>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="phone" className="phsr-form-label">
//                         <i className="bi bi-telephone me-2"></i>Company Phone: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="tel"
//                         id="phone"
//                         name="phone"
//                         className="phsr-input"
//                         placeholder="Enter company phone"
//                         required
//                         pattern="[0-9]{10}"
//                         maxLength={10}
//                         title="Please enter exactly 10 digits"
//                         value={form.phone}
//                         onChange={handleChange}
//                         onKeyPress={(e) => {
//                           if (!/[0-9]/.test(e.key)) {
//                             e.preventDefault();
//                           }
//                         }}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="email" className="phsr-form-label">
//                         <i className="bi bi-envelope me-2"></i>Company Email ID: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="email"
//                         id="email"
//                         name="email"
//                         className="phsr-input"
//                         placeholder="Enter company email"
//                         required
//                         value={form.email}
//                         onChange={handleChange}
//                       />
//                     </div>
//                   </div>

//                   <div className="phsr-row">
//                     <div className="phsr-col-md-12">
//                       <label htmlFor="website" className="phsr-form-label">
//                         <i className="bi bi-globe me-2"></i>Company Website (Optional):
//                       </label>
//                       <input
//                         type="url"
//                         id="website"
//                         name="website"
//                         className="phsr-input"
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

//           {step === 2 && (
//             <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
//               <div className="phsr-card phsr-mb-4 shadow-sm">
//                 <div className="phsr-card-header text-center">
//                   <div className="phsr-header-icon">
//                     <i className="bi bi-person-badge"></i>
//                   </div>
//                   <h4 className="phsr-mb-0 phsr-header-text">Company Coordinator Details</h4>
//                   {(!emailVerified || !phoneVerified) && (
//                     <small className="phsr-verification-warning d-block phsr-mt-2">
//                       <i className="bi bi-exclamation-triangle me-1"></i>
//                       Please verify both Email and Mobile OTP to proceed
//                     </small>
//                   )}
//                 </div>
//                 <div className="card-body phsr-p-4">
//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="coordinatorName" className="phsr-form-label">
//                         <i className="bi bi-person me-2"></i>Coordinator Name: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="coordinatorName"
//                         name="coordinatorName"
//                         className="phsr-input"
//                         placeholder="Enter coordinator name"
//                         required
//                         value={form.coordinatorName}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'coordinatorName')}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="coordinatorDesignation" className="phsr-form-label">
//                         <i className="bi bi-briefcase me-2"></i>Coordinator Designation: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="coordinatorDesignation"
//                         name="coordinatorDesignation"
//                         className="phsr-input"
//                         placeholder="Enter designation"
//                         required
//                         value={form.coordinatorDesignation}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'coordinatorDesignation')}
//                       />
//                     </div>
//                   </div>

//                   <div className="phsr-row">
//                     <div className="phsr-col-md-6">
//                       <OtpVerification
//                         label="Email"
//                         value={form.coordinatorEmail}
//                         onChange={handleCoordinatorEmailChange}
//                         onVerified={() => setEmailVerified(true)}
//                         verified={emailVerified}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
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

//           {step === 3 && (
//             <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
//               <div className="phsr-card phsr-mb-4 shadow-sm">
//                 <div className="phsr-card-header text-center">
//                   <div className="phsr-header-icon">
//                     <i className="bi bi-file-earmark-lock"></i>
//                   </div>
//                   <h4 className="phsr-mb-0 phsr-header-text">Document Upload</h4>
//                 </div>
//                 <div className="phsr-card-header text-dark bg-light text-center phsr-p-3">
//                   <h3 className="phsr-mb-0 phsr-section-title">
//                     <i className="bi bi-file-earmark-text me-2"></i>GSTIN Certificate
//                   </h3>
//                 </div>
//                 <div className="card-body phsr-p-4">
//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="gstNumber" className="phsr-form-label">
//                         <i className="bi bi-hash me-2"></i>GST Number: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="gstNumber"
//                         name="gstNumber"
//                         className="phsr-input"
//                         placeholder="Enter GST number"
//                         required
//                         value={form.gstNumber}
//                         onChange={handleChange}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="gstFile" className="phsr-form-label">
//                         <i className="bi bi-upload me-2"></i>GST Certificate: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="file"
//                         id="gstFile"
//                         name="gstFile"
//                         className="phsr-file-input"
//                         accept=".pdf,.jpg,.jpeg,.png"
//                         required
//                         onChange={handleChange}
//                       />
//                       {form.gstFile && (
//                         <small className="phsr-text-success phsr-mt-1 phsr-d-block">
//                           <i className="bi bi-check-circle-fill me-1"></i>
//                           File selected: {form.gstFile.name}
//                         </small>
//                       )}
//                     </div>
//                   </div>

//                   <div className="phsr-card-header text-dark bg-light text-center phsr-mt-4 phsr-mb-3 phsr-p-3">
//                     <h3 className="phsr-mb-0 phsr-section-title">
//                       <i className="bi bi-prescription2 me-2"></i>Drug Manufacturing License
//                     </h3>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="licenseNumber" className="phsr-form-label">
//                         <i className="bi bi-hash me-2"></i>License Number: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="licenseNumber"
//                         name="licenseNumber"
//                         className="phsr-input"
//                         placeholder="Enter license number"
//                         required
//                         value={form.licenseNumber}
//                         onChange={handleChange}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="licenseFile" className="phsr-form-label">
//                         <i className="bi bi-upload me-2"></i>License File Upload: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="file"
//                         id="licenseFile"
//                         name="licenseFile"
//                         className="phsr-file-input"
//                         accept=".pdf,.jpg,.jpeg,.png"
//                         required
//                         onChange={handleChange}
//                       />
//                       {form.licenseFile && (
//                         <small className="phsr-text-success phsr-mt-1 phsr-d-block">
//                           <i className="bi bi-check-circle-fill me-1"></i>
//                           File selected: {form.licenseFile.name}
//                         </small>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {step === 4 && (
//             <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
//               <div className="phsr-card phsr-mb-4 shadow-sm">
//                 <div className="phsr-card-header text-center">
//                   <div className="phsr-header-icon">
//                     <i className="bi bi-bank"></i>
//                   </div>
//                   <h4 className="phsr-mb-0 phsr-header-text">Bank Account Details</h4>
//                   <small className="phsr-text-muted d-block phsr-mt-2">
//                     <i className="bi bi-info-circle me-1"></i>
//                     Provide accurate bank details for payment processing
//                   </small>
//                 </div>

//                 <div className="card-body phsr-p-4">
//                   <div className="phsr-card-header text-dark bg-light text-center phsr-mb-3 phsr-p-3">
//                     <h5 className="phsr-mb-0 phsr-section-title">
//                       <i className="bi bi-geo-alt me-2"></i>Bank Location Details
//                     </h5>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="bankState" className="phsr-form-label">
//                         <i className="bi bi-geo me-2"></i>State: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="bankState"
//                         name="bankState"
//                         className="phsr-input"
//                         placeholder="Enter bank state"
//                         required
//                         value={form.bankState}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'bankState')}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="bankDistrict" className="phsr-form-label">
//                         <i className="bi bi-geo me-2"></i>District: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="bankDistrict"
//                         name="bankDistrict"
//                         className="phsr-input"
//                         placeholder="Enter bank district"
//                         required
//                         value={form.bankDistrict}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'bankDistrict')}
//                       />
//                     </div>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="bankTaluka" className="phsr-form-label">
//                         <i className="bi bi-map me-2"></i>Taluka: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="bankTaluka"
//                         name="bankTaluka"
//                         className="phsr-input"
//                         placeholder="Enter bank taluka"
//                         required
//                         value={form.bankTaluka}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'bankTaluka')}
//                       />
//                     </div>
//                   </div>

//                   <div className="phsr-card-header text-dark bg-light text-center phsr-mt-4 phsr-mb-3 phsr-p-3">
//                     <h5 className="phsr-mb-0 phsr-section-title">
//                       <i className="bi bi-credit-card me-2"></i>Bank Information
//                     </h5>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="bankName" className="phsr-form-label">
//                         <i className="bi bi-bank me-2"></i>Bank Name: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="bankName"
//                         name="bankName"
//                         className="phsr-input"
//                         placeholder="Enter bank name"
//                         required
//                         value={form.bankName}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'bankName')}
//                       />
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="branch" className="phsr-form-label">
//                         <i className="bi bi-geo-alt me-2"></i>Branch: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="branch"
//                         name="branch"
//                         className="phsr-input"
//                         placeholder="Enter branch name"
//                         required
//                         value={form.branch}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'branch')}
//                       />
//                     </div>
//                   </div>

//                   <div className="phsr-row phsr-mb-3">
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="ifscCode" className="phsr-form-label">
//                         <i className="bi bi-hash me-2"></i>IFSC Code: <span className="phsr-required">*</span>
//                         <small className="phsr-text-muted ms-1">(11 characters)</small>
//                       </label>
//                       <input
//                         type="text"
//                         id="ifscCode"
//                         name="ifscCode"
//                         className="phsr-input"
//                         placeholder="e.g., SBIN0000123"
//                         maxLength={11}
//                         required
//                         value={form.ifscCode}
//                         onChange={handleChange}
//                         style={{ textTransform: "uppercase" }}
//                       />
//                       <small className="phsr-text-muted">
//                         Format: 4 letters (Bank) + 0 + 6 digits (Branch)
//                       </small>
//                     </div>
//                     <div className="phsr-col-md-6">
//                       <label htmlFor="accountNumber" className="phsr-form-label">
//                         <i className="bi bi-123 me-2"></i>Account Number: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="accountNumber"
//                         name="accountNumber"
//                         className="phsr-input"
//                         placeholder="Enter account number"
//                         required
//                         value={form.accountNumber}
//                         onChange={handleChange}
//                       />
//                       <small className="phsr-text-muted">
//                         Enter numbers only (no spaces or special characters)
//                       </small>
//                     </div>
//                   </div>

//                   <div className="phsr-row">
//                     <div className="phsr-col-md-12">
//                       <label htmlFor="accountHolderName" className="phsr-form-label">
//                         <i className="bi bi-person-vcard me-2"></i>Account Holder Name: <span className="phsr-required">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="accountHolderName"
//                         name="accountHolderName"
//                         className="phsr-input"
//                         placeholder="Enter account holder's name as per bank records"
//                         required
//                         value={form.accountHolderName}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, 'accountHolderName')}
//                       />
//                       <small className="phsr-text-muted">
//                         Name should match exactly with bank records
//                       </small>
//                     </div>
//                   </div>

//                   <div className="alert alert-info phsr-mt-4">
//                     <div className="d-flex">
//                       <i className="bi bi-shield-check me-3 fs-4"></i>
//                       <div>
//                         <h6 className="alert-heading phsr-mb-1">Security Assurance</h6>
//                         <small className="phsr-mb-0">
//                           Your bank details are encrypted and stored securely.
//                           We follow PCI-DSS compliance standards for financial data protection.
//                         </small>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {step === 5 && (
//             <div className="phsr-final-review-card">
//               <div className="text-center phsr-mb-4">
//                 <div className="phsr-review-check-icon">
//                   <i className="bi bi-shield-check"></i>
//                 </div>
//                 <h4 className="fw-bold phsr-gradient-text-sm">
//                   Final Verification Summary
//                 </h4>
//                 <small className="phsr-text-muted">Please review all details before final submission</small>
//               </div>

//               <div className="phsr-review-section">
//                 <h6 className="phsr-review-section-title">
//                   <i className="bi bi-building me-2"></i> Company Details
//                 </h6>
//                 <div className="phsr-row">
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Company Name</span>
//                     <p className={`phsr-review-field-value ${!form.sellerName ? "phsr-text-danger" : ""}`}>
//                       {form.sellerName || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Company Type</span>
//                     <p className={`phsr-review-field-value ${!form.companyType ? "phsr-text-danger" : ""}`}>
//                       {form.companyType || "Not selected"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">State</span>
//                     <p className={`phsr-review-field-value ${!form.state ? "phsr-text-danger" : ""}`}>
//                       {form.state || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">District</span>
//                     <p className={`phsr-review-field-value ${!form.district ? "phsr-text-danger" : ""}`}>
//                       {form.district || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Taluka</span>
//                     <p className={`phsr-review-field-value ${!form.taluka ? "phsr-text-danger" : ""}`}>
//                       {form.taluka || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">City/Town/Village</span>
//                     <p className={`phsr-review-field-value ${!form.city ? "phsr-text-danger" : ""}`}>
//                       {form.city || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Street/Road/Lane</span>
//                     <p className={`phsr-review-field-value ${!form.street ? "phsr-text-danger" : ""}`}>
//                       {form.street || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Building/House No</span>
//                     <p className={`phsr-review-field-value ${!form.buildingNo ? "phsr-text-danger" : ""}`}>
//                       {form.buildingNo || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Landmark</span>
//                     <p className={`phsr-review-field-value ${!form.landmark ? "phsr-text-muted" : ""}`}>
//                       {form.landmark || "N/A"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Pin Code</span>
//                     <p className={`phsr-review-field-value ${!form.pincode ? "phsr-text-danger" : ""}`}>
//                       {form.pincode || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Phone</span>
//                     <p className={`phsr-review-field-value ${!form.phone ? "phsr-text-danger" : ""}`}>
//                       {form.phone || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Email</span>
//                     <p className={`phsr-review-field-value ${!form.email ? "phsr-text-danger" : ""}`}>
//                       {form.email || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Website</span>
//                     <p className={`phsr-review-field-value ${!form.website ? "phsr-text-muted" : ""}`}>
//                       {form.website || "N/A"}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="phsr-review-section">
//                 <h6 className="phsr-review-section-title">
//                   <i className="bi bi-person-badge me-2"></i> Coordinator Details
//                 </h6>
//                 <div className="phsr-row">
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Name</span>
//                     <p className={`phsr-review-field-value ${!form.coordinatorName ? "phsr-text-danger" : ""}`}>
//                       {form.coordinatorName || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Designation</span>
//                     <p className={`phsr-review-field-value ${!form.coordinatorDesignation ? "phsr-text-danger" : ""}`}>
//                       {form.coordinatorDesignation || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Email</span>
//                     <p className={`phsr-review-field-value ${!form.coordinatorEmail ? "phsr-text-danger" : ""}`}>
//                       {form.coordinatorEmail || "Not provided"}
//                       {emailVerified && <span className="phsr-verified-badge">✔ Verified</span>}
//                       {!emailVerified && form.coordinatorEmail && <span className="phsr-text-warning"> (Not verified)</span>}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Mobile</span>
//                     <p className={`phsr-review-field-value ${!form.coordinatorMobile ? "phsr-text-danger" : ""}`}>
//                       {form.coordinatorMobile || "Not provided"}
//                       {phoneVerified && <span className="phsr-verified-badge">✔ Verified</span>}
//                       {!phoneVerified && form.coordinatorMobile && <span className="phsr-text-warning"> (Not verified)</span>}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="phsr-review-section">
//                 <h6 className="phsr-review-section-title">
//                   <i className="bi bi-file-earmark-lock me-2"></i> Compliance Documents
//                 </h6>
//                 <div className="phsr-row">
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">GST Number</span>
//                     <p className={`phsr-review-field-value ${!form.gstNumber ? "phsr-text-danger" : ""}`}>
//                       {form.gstNumber || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">GST Certificate</span>
//                     <p className={`phsr-review-field-value ${!form.gstFile ? "phsr-text-danger" : ""}`}>
//                       {form.gstFile ? (
//                         <span className="phsr-file-pill">
//                           <i className="bi bi-file-earmark-pdf me-1"></i>
//                           {form.gstFile.name}
//                         </span>
//                       ) : "Not uploaded"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Drug License No</span>
//                     <p className={`phsr-review-field-value ${!form.licenseNumber ? "phsr-text-danger" : ""}`}>
//                       {form.licenseNumber || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">License File</span>
//                     <p className={`phsr-review-field-value ${!form.licenseFile ? "phsr-text-danger" : ""}`}>
//                       {form.licenseFile ? (
//                         <span className="phsr-file-pill">
//                           <i className="bi bi-file-earmark-pdf me-1"></i>
//                           {form.licenseFile.name}
//                         </span>
//                       ) : "Not uploaded"}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="phsr-review-section">
//                 <h6 className="phsr-review-section-title">
//                   <i className="bi bi-bank me-2"></i> Bank Account Details
//                 </h6>
//                 <div className="phsr-row">
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Bank State</span>
//                     <p className={`phsr-review-field-value ${!form.bankState ? "phsr-text-danger" : ""}`}>
//                       {form.bankState || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Bank District</span>
//                     <p className={`phsr-review-field-value ${!form.bankDistrict ? "phsr-text-danger" : ""}`}>
//                       {form.bankDistrict || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Bank Taluka</span>
//                     <p className={`phsr-review-field-value ${!form.bankTaluka ? "phsr-text-danger" : ""}`}>
//                       {form.bankTaluka || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Bank Name</span>
//                     <p className={`phsr-review-field-value ${!form.bankName ? "phsr-text-danger" : ""}`}>
//                       {form.bankName || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Branch</span>
//                     <p className={`phsr-review-field-value ${!form.branch ? "phsr-text-danger" : ""}`}>
//                       {form.branch || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">IFSC Code</span>
//                     <p className={`phsr-review-field-value ${!form.ifscCode ? "phsr-text-danger" : ""}`}>
//                       {form.ifscCode || "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Account Number</span>
//                     <p className={`phsr-review-field-value ${!form.accountNumber ? "phsr-text-danger" : ""}`}>
//                       {form.accountNumber ? "****" + form.accountNumber.slice(-4) : "Not provided"}
//                     </p>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <span className="phsr-review-field-label">Account Holder Name</span>
//                     <p className={`phsr-review-field-value ${!form.accountHolderName ? "phsr-text-danger" : ""}`}>
//                       {form.accountHolderName || "Not provided"}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="phsr-validation-summary">
//                 <h6 className="phsr-mb-2">
//                   <i className="bi bi-clipboard-check me-2"></i>Validation Summary
//                 </h6>
//                 <div className="phsr-row">
//                   <div className="phsr-col-md-6">
//                     <small className="d-flex align-items-center phsr-mb-1">
//                       <i className={`bi ${form.sellerName && form.pincode ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
//                       Company Info: {form.sellerName && form.pincode ? 'Complete' : 'Incomplete'}
//                     </small>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <small className="d-flex align-items-center phsr-mb-1">
//                       <i className={`bi ${emailVerified && phoneVerified ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
//                       Verification: {emailVerified && phoneVerified ? 'Complete' : 'Pending'}
//                     </small>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <small className="d-flex align-items-center phsr-mb-1">
//                       <i className={`bi ${form.gstFile && form.licenseFile ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
//                       Documents: {form.gstFile && form.licenseFile ? 'Complete' : 'Incomplete'}
//                     </small>
//                   </div>
//                   <div className="phsr-col-md-6">
//                     <small className="d-flex align-items-center phsr-mb-1">
//                       <i className={`bi ${form.ifscCode && form.accountNumber ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
//                       Bank Details: {form.ifscCode && form.accountNumber ? 'Complete' : 'Incomplete'}
//                     </small>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           <div className="phsr-button-group">
//             {step > 1 && (
//               <button type="button" className="phsr-btn-back" onClick={back}>
//                 <i className="bi bi-arrow-left me-2"></i> Back
//               </button>
//             )}

//             <button type="submit" className="phsr-btn-next ms-auto">
//               {step < 5 ? (
//                 <>
//                   Continue <i className="bi bi-arrow-right ms-2"></i>
//                 </>
//               ) : (
//                 <>
//                   <i className="bi bi-check-circle me-2"></i> Submit Application
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }