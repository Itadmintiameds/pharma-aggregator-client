"use client";
import "./Design.css";
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import OtpVerification from "./OtpVerification";

export default function Design() {
  const [step, setStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [form, setForm] = useState({
    sellerName: "",
    companyType: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    coordinatorName: "",
    coordinatorDesignation: "",
    coordinatorEmail: "",
    coordinatorMobile: "",
    gstNumber: "",
    gstFile: null as File | null,
    licenseNumber: "",
    licenseFile: null as File | null,
    // New Bank Details Fields
    state: "",
    district: "",
    taluka: "",
    bankName: "",
    branch: "",
    ifscCode: "",
    accountNumber: "",
    accountHolderName: "",
  });

  const handleChange = (e: any) => {
    const { id, value, files } = e.target;
    
    if (files && files[0]) {
      // Handle file uploads
      setForm(prev => ({ ...prev, [id]: files[0] }));
    } else {
      // Handle text inputs
      setForm(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleCoordinatorEmailChange = (value: string) => {
    setForm(prev => ({ ...prev, coordinatorEmail: value }));
  };

  const handleCoordinatorMobileChange = (value: string) => {
    setForm(prev => ({ ...prev, coordinatorMobile: value }));
  };

  const next = (e: any) => {
    e.preventDefault();
    
    // Validate current step before proceeding
    if (step === 1) {
      if (!form.sellerName || !form.companyType || !form.address || !form.phone || !form.email) {
        alert("Please fill all required company information fields.");
        return;
      }
    }
    
    if (step === 2) {
      if (!form.coordinatorName || !form.coordinatorDesignation) {
        alert("Please fill coordinator name and designation.");
        return;
      }
      
      if (!emailVerified || !phoneVerified) {
        alert("Please verify both Email and Mobile OTP before proceeding.");
        return;
      }
    }
    
    if (step === 3) {
      if (!form.gstNumber || !form.gstFile || !form.licenseNumber || !form.licenseFile) {
        alert("Please fill all document fields and upload required files.");
        return;
      }
    }
    
    if (step === 4) {
      // Validate Bank Details
      if (!form.state || !form.district || !form.taluka || !form.bankName || 
          !form.branch || !form.ifscCode || !form.accountNumber || !form.accountHolderName) {
        alert("Please fill all required bank details fields.");
        return;
      }
      
      // Validate IFSC Code format (11 characters)
      if (form.ifscCode.length !== 11) {
        alert("IFSC Code must be 11 characters long.");
        return;
      }
      
      // Validate Account Number (minimum 9 digits)
      if (form.accountNumber.length < 9 || !/^\d+$/.test(form.accountNumber)) {
        alert("Please enter a valid account number (minimum 9 digits).");
        return;
      }
    }
    
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Submit logic here
      console.log("Form submitted:", form);
      alert("Submitted Successfully!");
    }
  };

  const back = (e: any) => {
    e.preventDefault();
    if (step > 1) setStep(step - 1);
  };

  const stepData = [
    { 
      title: "Company", 
      icon: "bi-building",
      description: "Basic Information"
    },
    { 
      title: "Coordinator", 
      icon: "bi-person-badge",
      description: "Contact Details"
    },
    { 
      title: "Documents", 
      icon: "bi-file-earmark-lock",
      description: "Upload Files"
    },
    { 
      title: "Bank", 
      icon: "bi-bank",
      description: "Account Details"
    },
    { 
      title: "Review", 
      icon: "bi-shield-check",
      description: "Final Verification"
    }
  ];

  const calculateProgress = () => {
    return ((step - 1) / (stepData.length - 1)) * 100;
  };

  return (
    <div className="container my-5">
      <div className="onboarding-hero-sm mb-4">
        <div className="hero-glass-sm d-flex align-items-center justify-content-between px-4">
          {/* Original Logo */}
          <div className="brand-circle">
            <img src="./tiamedslogo.png" alt="Tiameds Logo" className="brand-logo" />
          </div>

          {/* Center Title */}
          <div className="text-center flex-grow-1">
            <h2 className="fw-bold gradient-text-sm animate-title-sm mb-1">
              Seller Registration
            </h2>
            {/* <p className="animate-subtitle-sm mb-0">
              Corporate Registration & Compliance Verification
            </p> */}
          </div>

          {/* Right Seller Icon */}
          <div className="seller-icon-circle">
            <i className="bi bi-person-badge-fill"></i>
            <div className="seller-icon-badge">
              <i className="bi bi-check-circle-fill"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Progressive Stepper */}
      <div className="stepper-container mb-5">
        {/* Step Indicators */}
        <div className="stepper-steps d-flex justify-content-between">
          {stepData.map((stepInfo, index) => {
            const stepNumber = index + 1;
            const isActive = step === stepNumber;
            const isCompleted = step > stepNumber;
            
            return (
              <div 
                key={index} 
                className={`stepper-step position-relative ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  // Allow navigation to completed steps
                  if (isCompleted || stepNumber === 1) {
                    setStep(stepNumber);
                  }
                }}
                style={{ cursor: isCompleted || stepNumber === 1 ? 'pointer' : 'default' }}
              >
                {/* Connector line - only show between steps, not before first or after last */}
                {index < stepData.length - 1 && (
                  <div className="step-connector">
                    <div 
                      className={`connector-line ${step > stepNumber ? 'completed' : ''}`}
                    ></div>
                  </div>
                )}
                
                <div className="step-indicator">
                  {isCompleted ? (
                    <div className="step-checkmark">
                      <i className="bi bi-check"></i>
                    </div>
                  ) : (
                    <div className="step-number">{stepNumber}</div>
                  )}
                </div>
                
                <div className="step-content">
                  <h6 className={`step-title ${isActive ? 'text-primary' : ''} ${isCompleted ? 'text-success' : ''}`}>
                    {stepInfo.title}
                  </h6>
                  <small className="step-description">
                    {stepInfo.description}
                  </small>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Step Status */}
        <div className="current-step-status mt-4 text-center">
          <span className="badge bg-primary rounded-pill px-3 py-2">
            <i className={`bi ${stepData[step - 1].icon} me-2`}></i>
            Step {step}: {stepData[step - 1].title}
          </span>
          <small className="d-block mt-1 text-muted">
            {step === 1 && "Provide your company details"}
            {step === 2 && "Add coordinator information and verify"}
            {step === 3 && "Upload required compliance documents"}
            {step === 4 && "Enter bank account details"}
            {step === 5 && "Review all information before submission"}
          </small>
        </div>
      </div>

      <form onSubmit={next}>
        {step === 1 && (
          <div className="card shadow-lg border-0 rounded-4 p-4">
            <div className="card mb-4 shadow-sm">
              <div className="card-header pharma-card-header text-center">
                <div className="pharma-header-icon">
                  <i className="bi bi-building"></i>
                </div>
                <h4 className="mb-0 pharma-header-text">Seller Company Information</h4>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="sellerName" className="form-label">
                      <i className="bi bi-building me-2"></i>Seller Name/Company Name: *
                    </label>
                    <input
                      type="text"
                      id="sellerName"
                      name="sellerName"
                      className="form-control pharma-input"
                      placeholder="Enter your name"
                      required
                      value={form.sellerName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="companyType" className="form-label">
                      <i className="bi bi-diagram-3 me-2"></i>Company Type: *
                    </label>
                    <select 
                      id="companyType" 
                      name="companyType" 
                      className="form-select pharma-input" 
                      required
                      value={form.companyType}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Company Type --</option>
                      <option value="Drug Manufacturer">Drug Manufacturer</option>
                      <option value="White Labelling Company">White Labelling Company</option>
                      <option value="Distributors">Distributors</option>
                      {/* <option value="Pharmaceutical Retailer">Pharmaceutical Retailer</option> */}
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="address" className="form-label">
                      <i className="bi bi-geo-alt me-2"></i>Company Address: *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      className="form-control pharma-input"
                      placeholder="Enter company address"
                      required
                      value={form.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="phone" className="form-label">
                      <i className="bi bi-telephone me-2"></i>Company Phone: *
                    </label>
                    <input 
                      type="tel"
                      id="phone"
                      name="phone"
                      className="form-control pharma-input"
                      placeholder="Enter company phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label">
                      <i className="bi bi-envelope me-2"></i>Company Email ID: *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control pharma-input"
                      placeholder="Enter company email"
                      required
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="website" className="form-label">
                      <i className="bi bi-globe me-2"></i>Company Website (Optional):
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      className="form-control pharma-input"
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

        {step === 2 && (
          <div className="card shadow-lg border-0 rounded-4 p-4">
            <div className="card mb-4 shadow-sm">
              <div className="card-header pharma-card-header text-center">
                <div className="pharma-header-icon">
                  <i className="bi bi-person-badge"></i>
                </div>
                <h4 className="mb-0 pharma-header-text">Company Coordinator Details</h4>
                {(!emailVerified || !phoneVerified) && (
                  <small className="verification-warning d-block mt-2">
                    <i className="bi bi-exclamation-triangle me-1"></i> 
                    Please verify both Email and Mobile OTP to proceed
                  </small>
                )}
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="coordinatorName" className="form-label">
                      <i className="bi bi-person me-2"></i>Coordinator Name: *
                    </label>
                    <input
                      type="text"
                      id="coordinatorName"
                      name="coordinatorName"
                      className="form-control pharma-input"
                      placeholder="Enter coordinator name"
                      required
                      value={form.coordinatorName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="coordinatorDesignation" className="form-label">
                      <i className="bi bi-briefcase me-2"></i>Coordinator Designation: *
                    </label>
                    <input
                      type="text"
                      id="coordinatorDesignation"
                      name="coordinatorDesignation"
                      className="form-control pharma-input"
                      placeholder="Enter designation"
                      required
                      value={form.coordinatorDesignation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <OtpVerification
                      label="Email"
                      value={form.coordinatorEmail}
                      onChange={handleCoordinatorEmailChange}
                      onVerified={() => setEmailVerified(true)}
                      verified={emailVerified}
                    />
                  </div>
                  <div className="col-md-6">
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

        {step === 3 && (
          <div className="card shadow-lg border-0 rounded-4 p-4">
            <div className="card mb-4 shadow-sm">
              <div className="card-header pharma-card-header text-center">
                <div className="pharma-header-icon">
                  <i className="bi bi-file-earmark-lock"></i>
                </div>
                <h4 className="mb-0 pharma-header-text">Document Upload</h4>
              </div>
              <div className="card-header text-dark bg-light text-center">
                <h3 className="mb-0 pharma-section-title">
                  <i className="bi bi-file-earmark-text me-2"></i>GSTIN Certificate
                </h3>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="gstNumber" className="form-label">
                      <i className="bi bi-hash me-2"></i>GST Number: *
                    </label>
                    <input
                      type="text"
                      id="gstNumber"
                      name="gstNumber"
                      className="form-control pharma-input"
                      placeholder="Enter GST number"
                      required
                      value={form.gstNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="gstFile" className="form-label">
                      <i className="bi bi-upload me-2"></i>GST Certificate: *
                    </label>
                    <input
                      type="file"
                      id="gstFile"
                      name="gstFile"
                      className="form-control pharma-file-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      onChange={handleChange}
                    />
                    {form.gstFile && (
                      <small className="text-success mt-1 d-block">
                        <i className="bi bi-check-circle-fill me-1"></i> 
                        File selected: {form.gstFile.name}
                      </small>
                    )}
                  </div>
                </div>
                
                <div className="card-header text-dark bg-light text-center mt-4 mb-3">
                  <h3 className="mb-0 pharma-section-title">
                    <i className="bi bi-prescription2 me-2"></i>Drug Manufacturing License
                  </h3>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="licenseNumber" className="form-label">
                      <i className="bi bi-hash me-2"></i>License Number: *
                    </label>
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      className="form-control pharma-input"
                      placeholder="Enter license number"
                      required
                      value={form.licenseNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="licenseFile" className="form-label">
                      <i className="bi bi-upload me-2"></i>License File Upload: *
                    </label>
                    <input
                      type="file"
                      id="licenseFile"
                      name="licenseFile"
                      className="form-control pharma-file-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      onChange={handleChange}
                    />
                    {form.licenseFile && (
                      <small className="text-success mt-1 d-block">
                        <i className="bi bi-check-circle-fill me-1"></i> 
                        File selected: {form.licenseFile.name}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="card shadow-lg border-0 rounded-4 p-4">
            <div className="card mb-4 shadow-sm">
              <div className="card-header pharma-card-header text-center">
                <div className="pharma-header-icon">
                  <i className="bi bi-bank"></i>
                </div>
                <h4 className="mb-0 pharma-header-text">Bank Account Details</h4>
                <small className="text-muted d-block mt-2">
                  <i className="bi bi-info-circle me-1"></i> 
                  Provide accurate bank details for payment processing
                </small>
              </div>
              
              <div className="card-body">
                {/* Location Details */}
                <div className="card-header text-dark bg-light text-center mb-3">
                  <h5 className="mb-0 pharma-section-title">
                    <i className="bi bi-geo-alt me-2"></i>Bank Location Details
                  </h5>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label htmlFor="state" className="form-label">
                      <i className="bi bi-geo me-2"></i>State: *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      className="form-control pharma-input"
                      placeholder="Enter state"
                      required
                      value={form.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="district" className="form-label">
                      <i className="bi bi-geo me-2"></i>District: *
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      className="form-control pharma-input"
                      placeholder="Enter district"
                      required
                      value={form.district}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="taluka" className="form-label">
                      <i className="bi bi-geo me-2"></i>Taluka: *
                    </label>
                    <input
                      type="text"
                      id="taluka"
                      name="taluka"
                      className="form-control pharma-input"
                      placeholder="Enter taluka"
                      required
                      value={form.taluka}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="card-header text-dark bg-light text-center mt-4 mb-3">
                  <h5 className="mb-0 pharma-section-title">
                    <i className="bi bi-credit-card me-2"></i>Bank Information
                  </h5>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="bankName" className="form-label">
                      <i className="bi bi-bank me-2"></i>Bank Name: *
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      className="form-control pharma-input"
                      placeholder="Enter bank name"
                      required
                      value={form.bankName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="branch" className="form-label">
                      <i className="bi bi-geo-alt me-2"></i>Branch: *
                    </label>
                    <input
                      type="text"
                      id="branch"
                      name="branch"
                      className="form-control pharma-input"
                      placeholder="Enter branch name"
                      required
                      value={form.branch}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="ifscCode" className="form-label">
                      <i className="bi bi-hash me-2"></i>IFSC Code: *
                      <small className="text-muted ms-1">(11 characters)</small>
                    </label>
                    <input
                      type="text"
                      id="ifscCode"
                      name="ifscCode"
                      className="form-control pharma-input"
                      placeholder="e.g., SBIN0000123"
                      maxLength={11}
                      required
                      value={form.ifscCode}
                      onChange={handleChange}
                      style={{ textTransform: "uppercase" }}
                    />
                    <small className="text-muted">
                      Format: 4 letters (Bank) + 0 + 6 digits (Branch)
                    </small>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="accountNumber" className="form-label">
                      <i className="bi bi-123 me-2"></i>Account Number: *
                    </label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      className="form-control pharma-input"
                      placeholder="Enter account number"
                      required
                      value={form.accountNumber}
                      onChange={handleChange}
                    />
                    <small className="text-muted">
                      Enter numbers only (no spaces or special characters)
                    </small>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-12">
                    <label htmlFor="accountHolderName" className="form-label">
                      <i className="bi bi-person-vcard me-2"></i>Account Holder Name: *
                    </label>
                    <input
                      type="text"
                      id="accountHolderName"
                      name="accountHolderName"
                      className="form-control pharma-input"
                      placeholder="Enter account holder's name as per bank records"
                      required
                      value={form.accountHolderName}
                      onChange={handleChange}
                    />
                    <small className="text-muted">
                      Name should match exactly with bank records
                    </small>
                  </div>
                </div>

                {/* Security Note */}
                <div className="alert alert-info mt-4">
                  <div className="d-flex">
                    <i className="bi bi-shield-check me-3 fs-4"></i>
                    <div>
                      <h6 className="alert-heading mb-1">Security Assurance</h6>
                      <small className="mb-0">
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

        {step === 5 && (
          <div className="card final-review-card border-0 rounded-4 p-4">
            <div className="text-center mb-4">
              <div className="review-check-icon">
                <i className="bi bi-shield-check"></i>
              </div>
              <h4 className="fw-bold gradient-text-sm">
                Final Verification Summary
              </h4>
              <small className="text-muted">Please review all details before final submission</small>
            </div>

            {/* Company Section */}
            <div className="review-section">
              <h6 className="section-title">
                <i className="bi bi-building me-2"></i> Company Details
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <span>Company Name</span>
                  <p className={!form.sellerName ? "text-danger" : ""}>
                    {form.sellerName || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Company Type</span>
                  <p className={!form.companyType ? "text-danger" : ""}>
                    {form.companyType || "Not selected"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Address</span>
                  <p className={!form.address ? "text-danger" : ""}>
                    {form.address || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Phone</span>
                  <p className={!form.phone ? "text-danger" : ""}>
                    {form.phone || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Email</span>
                  <p className={!form.email ? "text-danger" : ""}>
                    {form.email || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Website</span>
                  <p className={!form.website ? "text-muted" : ""}>
                    {form.website || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Coordinator Section */}
            <div className="review-section">
              <h6 className="section-title">
                <i className="bi bi-person-badge me-2"></i> Coordinator Details
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <span>Name</span>
                  <p className={!form.coordinatorName ? "text-danger" : ""}>
                    {form.coordinatorName || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Designation</span>
                  <p className={!form.coordinatorDesignation ? "text-danger" : ""}>
                    {form.coordinatorDesignation || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Email</span>
                  <p className={!form.coordinatorEmail ? "text-danger" : ""}>
                    {form.coordinatorEmail || "Not provided"} 
                    {emailVerified && <span className="verified-badge">✔ Verified</span>}
                    {!emailVerified && form.coordinatorEmail && <span className="text-warning"> (Not verified)</span>}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Mobile</span>
                  <p className={!form.coordinatorMobile ? "text-danger" : ""}>
                    {form.coordinatorMobile || "Not provided"} 
                    {phoneVerified && <span className="verified-badge">✔ Verified</span>}
                    {!phoneVerified && form.coordinatorMobile && <span className="text-warning"> (Not verified)</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="review-section">
              <h6 className="section-title">
                <i className="bi bi-file-earmark-lock me-2"></i> Compliance Documents
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <span>GST Number</span>
                  <p className={!form.gstNumber ? "text-danger" : ""}>
                    {form.gstNumber || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>GST Certificate</span>
                  <p className={!form.gstFile ? "text-danger" : ""}>
                    {form.gstFile ? (
                      <span className="file-pill">
                        <i className="bi bi-file-earmark-pdf me-1"></i>
                        {form.gstFile.name}
                      </span>
                    ) : "Not uploaded"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Drug License No</span>
                  <p className={!form.licenseNumber ? "text-danger" : ""}>
                    {form.licenseNumber || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>License File</span>
                  <p className={!form.licenseFile ? "text-danger" : ""}>
                    {form.licenseFile ? (
                      <span className="file-pill">
                        <i className="bi bi-file-earmark-pdf me-1"></i>
                        {form.licenseFile.name}
                      </span>
                    ) : "Not uploaded"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="review-section">
              <h6 className="section-title">
                <i className="bi bi-bank me-2"></i> Bank Account Details
              </h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <span>State</span>
                  <p className={!form.state ? "text-danger" : ""}>
                    {form.state || "Not provided"}
                  </p>
                </div>
                <div className="col-md-4">
                  <span>District</span>
                  <p className={!form.district ? "text-danger" : ""}>
                    {form.district || "Not provided"}
                  </p>
                </div>
                <div className="col-md-4">
                  <span>Taluka</span>
                  <p className={!form.taluka ? "text-danger" : ""}>
                    {form.taluka || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Bank Name</span>
                  <p className={!form.bankName ? "text-danger" : ""}>
                    {form.bankName || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Branch</span>
                  <p className={!form.branch ? "text-danger" : ""}>
                    {form.branch || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>IFSC Code</span>
                  <p className={!form.ifscCode ? "text-danger" : ""}>
                    {form.ifscCode || "Not provided"}
                  </p>
                </div>
                <div className="col-md-6">
                  <span>Account Number</span>
                  <p className={!form.accountNumber ? "text-danger" : ""}>
                    {form.accountNumber ? "****" + form.accountNumber.slice(-4) : "Not provided"}
                  </p>
                </div>
                <div className="col-md-12">
                  <span>Account Holder Name</span>
                  <p className={!form.accountHolderName ? "text-danger" : ""}>
                    {form.accountHolderName || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Summary */}
            <div className="validation-summary mt-4 p-3 rounded bg-light">
              <h6 className="mb-2">
                <i className="bi bi-clipboard-check me-2"></i>Validation Summary
              </h6>
              <div className="row">
                <div className="col-md-4">
                  <small className="d-flex align-items-center mb-1">
                    <i className={`bi ${form.sellerName ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2`}></i>
                    Company Info: {form.sellerName ? 'Complete' : 'Incomplete'}
                  </small>
                </div>
                <div className="col-md-4">
                  <small className="d-flex align-items-center mb-1">
                    <i className={`bi ${emailVerified && phoneVerified ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2`}></i>
                    Verification: {emailVerified && phoneVerified ? 'Complete' : 'Pending'}
                  </small>
                </div>
                <div className="col-md-4">
                  <small className="d-flex align-items-center mb-1">
                    <i className={`bi ${form.gstFile && form.licenseFile ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2`}></i>
                    Documents: {form.gstFile && form.licenseFile ? 'Complete' : 'Incomplete'}
                  </small>
                </div>
                <div className="col-md-6">
                  <small className="d-flex align-items-center mb-1">
                    <i className={`bi ${form.ifscCode && form.accountNumber ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2`}></i>
                    Bank Details: {form.ifscCode && form.accountNumber ? 'Complete' : 'Incomplete'}
                  </small>
                </div>
                <div className="col-md-6">
                  <small className="d-flex align-items-center mb-1">
                    <i className="bi bi-info-circle-fill text-info me-2"></i>
                    Overall Status: {form.sellerName && emailVerified && phoneVerified && form.gstFile && form.licenseFile && form.ifscCode && form.accountNumber ? 'Ready to Submit' : 'Needs Attention'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-between mt-4">
          {step > 1 && (
            <button type="button" className="btn btn-back" onClick={back}>
              <i className="bi bi-arrow-left me-2"></i> Back
            </button>
          )}

          <button type="submit" className="btn btn-next ms-auto">
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
  );
}