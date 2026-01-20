"use client";
import "./Design.css";
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import OtpVerification from "./OtpVerification";
import Header from "../components/Header";


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
      setForm(prev => ({ ...prev, [id]: files[0] }));
    } else {
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
      if (!form.state || !form.district || !form.taluka || !form.bankName || 
          !form.branch || !form.ifscCode || !form.accountNumber || !form.accountHolderName) {
        alert("Please fill all required bank details fields.");
        return;
      }
      
      if (form.ifscCode.length !== 11) {
        alert("IFSC Code must be 11 characters long.");
        return;
      }
      
      if (form.accountNumber.length < 9 || !/^\d+$/.test(form.accountNumber)) {
        alert("Please enter a valid account number (minimum 9 digits).");
        return;
      }
    }
    
    if (step < 5) {
      setStep(step + 1);
    } else {
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

  return (
    <div className="phsr-root">
      <Header/>
      <div className="phsr-container my-5">
        <div className="phsr-onboarding-hero-sm phsr-mb-4">
          <div className="phsr-hero-glass-sm d-flex align-items-center justify-content-between px-4">
            <div className="phsr-brand-circle">
              <img src="./tiamedslogo.png" alt="Tiameds Logo" className="phsr-brand-logo" />
            </div>

            <div className="text-center flex-grow-1">
              <h2 className="fw-bold phsr-gradient-text-sm mb-1">
                Seller Registration
              </h2>
            </div>

            <div className="phsr-seller-icon-circle">
              <i className="bi bi-person-badge-fill"></i>
              <div className="phsr-seller-icon-badge">
                <i className="bi bi-check-circle-fill"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Progressive Stepper */}
        <div className="phsr-stepper-container phsr-mb-4">
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
                  style={{ cursor: isCompleted || stepNumber === 1 ? 'pointer' : 'default' }}
                >
                  {index < stepData.length - 1 && (
                    <div className="phsr-step-connector">
                      <div 
                        className={`phsr-connector-line ${step > stepNumber ? 'completed' : ''}`}
                      ></div>
                    </div>
                  )}
                  
                  <div className="phsr-step-indicator">
                    {isCompleted ? (
                      <div className="phsr-step-checkmark">
                        <i className="bi bi-check"></i>
                      </div>
                    ) : (
                      <div className="phsr-step-number">{stepNumber}</div>
                    )}
                  </div>
                  
                  <div className="phsr-step-content">
                    <h6 className={`phsr-step-title ${isActive ? 'text-primary' : ''} ${isCompleted ? 'text-success' : ''}`}>
                      {stepInfo.title}
                    </h6>
                    <small className="phsr-step-description">
                      {stepInfo.description}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="phsr-current-step-status phsr-mt-4 text-center">
            <span className="badge bg-primary rounded-pill px-3 py-2">
              <i className={`bi ${stepData[step - 1].icon} me-2`}></i>
              Step {step}: {stepData[step - 1].title}
            </span>
            <small className="d-block phsr-mt-1 phsr-text-muted">
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
            <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
              <div className="phsr-card phsr-mb-4 shadow-sm">
                <div className="phsr-card-header text-center">
                  <div className="phsr-header-icon">
                    <i className="bi bi-building"></i>
                  </div>
                  <h4 className="phsr-mb-0 phsr-header-text">Seller Company Information</h4>
                </div>
                <div className="card-body phsr-p-4">
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="sellerName" className="phsr-form-label">
                        <i className="bi bi-building me-2"></i>Seller Name/Company Name: *
                      </label>
                      <input
                        type="text"
                        id="sellerName"
                        name="sellerName"
                        className="phsr-input"
                        placeholder="Enter your name"
                        required
                        value={form.sellerName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="companyType" className="phsr-form-label">
                        <i className="bi bi-diagram-3 me-2"></i>Company Type: *
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
                        <option value="Drug Manufacturer">Drug Manufacturer</option>
                        <option value="White Labelling Company">White Labelling Company</option>
                        <option value="Distributors">Distributors</option>
                      </select>
                    </div>
                  </div>

                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="address" className="phsr-form-label">
                        <i className="bi bi-geo-alt me-2"></i>Company Address: *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        className="phsr-input"
                        placeholder="Enter company address"
                        required
                        value={form.address}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="phone" className="phsr-form-label">
                        <i className="bi bi-telephone me-2"></i>Company Phone: *
                      </label>
                      <input 
                        type="tel"
                        id="phone"
                        name="phone"
                        className="phsr-input"
                        placeholder="Enter company phone"
                        required
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="email" className="phsr-form-label">
                        <i className="bi bi-envelope me-2"></i>Company Email ID: *
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
                    <div className="phsr-col-md-6">
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

          {step === 2 && (
            <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
              <div className="phsr-card phsr-mb-4 shadow-sm">
                <div className="phsr-card-header text-center">
                  <div className="phsr-header-icon">
                    <i className="bi bi-person-badge"></i>
                  </div>
                  <h4 className="phsr-mb-0 phsr-header-text">Company Coordinator Details</h4>
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
                        <i className="bi bi-person me-2"></i>Coordinator Name: *
                      </label>
                      <input
                        type="text"
                        id="coordinatorName"
                        name="coordinatorName"
                        className="phsr-input"
                        placeholder="Enter coordinator name"
                        required
                        value={form.coordinatorName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="coordinatorDesignation" className="phsr-form-label">
                        <i className="bi bi-briefcase me-2"></i>Coordinator Designation: *
                      </label>
                      <input
                        type="text"
                        id="coordinatorDesignation"
                        name="coordinatorDesignation"
                        className="phsr-input"
                        placeholder="Enter designation"
                        required
                        value={form.coordinatorDesignation}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="phsr-row phsr-mb-3">
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

          {step === 3 && (
            <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
              <div className="phsr-card phsr-mb-4 shadow-sm">
                <div className="phsr-card-header text-center">
                  <div className="phsr-header-icon">
                    <i className="bi bi-file-earmark-lock"></i>
                  </div>
                  <h4 className="phsr-mb-0 phsr-header-text">Document Upload</h4>
                </div>
                <div className="phsr-card-header text-dark bg-light text-center phsr-p-3">
                  <h3 className="phsr-mb-0 phsr-section-title">
                    <i className="bi bi-file-earmark-text me-2"></i>GSTIN Certificate
                  </h3>
                </div>
                <div className="card-body phsr-p-4">
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="gstNumber" className="phsr-form-label">
                        <i className="bi bi-hash me-2"></i>GST Number: *
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
                        <i className="bi bi-upload me-2"></i>GST Certificate: *
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
                  
                  <div className="phsr-card-header text-dark bg-light text-center phsr-mt-4 phsr-mb-3 phsr-p-3">
                    <h3 className="phsr-mb-0 phsr-section-title">
                      <i className="bi bi-prescription2 me-2"></i>Drug Manufacturing License
                    </h3>
                  </div>
                  
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="licenseNumber" className="phsr-form-label">
                        <i className="bi bi-hash me-2"></i>License Number: *
                      </label>
                      <input
                        type="text"
                        id="licenseNumber"
                        name="licenseNumber"
                        className="phsr-input"
                        placeholder="Enter license number"
                        required
                        value={form.licenseNumber}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="licenseFile" className="phsr-form-label">
                        <i className="bi bi-upload me-2"></i>License File Upload: *
                      </label>
                      <input
                        type="file"
                        id="licenseFile"
                        name="licenseFile"
                        className="phsr-file-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                        onChange={handleChange}
                      />
                      {form.licenseFile && (
                        <small className="phsr-text-success phsr-mt-1 phsr-d-block">
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
            <div className="phsr-card shadow-lg border-0 rounded-4 phsr-p-4">
              <div className="phsr-card phsr-mb-4 shadow-sm">
                <div className="phsr-card-header text-center">
                  <div className="phsr-header-icon">
                    <i className="bi bi-bank"></i>
                  </div>
                  <h4 className="phsr-mb-0 phsr-header-text">Bank Account Details</h4>
                  <small className="phsr-text-muted d-block phsr-mt-2">
                    <i className="bi bi-info-circle me-1"></i> 
                    Provide accurate bank details for payment processing
                  </small>
                </div>
                
                <div className="card-body phsr-p-4">
                  <div className="phsr-card-header text-dark bg-light text-center phsr-mb-3 phsr-p-3">
                    <h5 className="phsr-mb-0 phsr-section-title">
                      <i className="bi bi-geo-alt me-2"></i>Bank Location Details
                    </h5>
                  </div>
                  
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-4">
                      <label htmlFor="state" className="phsr-form-label">
                        <i className="bi bi-geo me-2"></i>State: *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        className="phsr-input"
                        placeholder="Enter state"
                        required
                        value={form.state}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="phsr-col-md-4">
                      <label htmlFor="district" className="phsr-form-label">
                        <i className="bi bi-geo me-2"></i>District: *
                      </label>
                      <input
                        type="text"
                        id="district"
                        name="district"
                        className="phsr-input"
                        placeholder="Enter district"
                        required
                        value={form.district}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="phsr-col-md-4">
                      <label htmlFor="taluka" className="phsr-form-label">
                        <i className="bi bi-geo me-2"></i>Taluka: *
                      </label>
                      <input
                        type="text"
                        id="taluka"
                        name="taluka"
                        className="phsr-input"
                        placeholder="Enter taluka"
                        required
                        value={form.taluka}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="phsr-card-header text-dark bg-light text-center phsr-mt-4 phsr-mb-3 phsr-p-3">
                    <h5 className="phsr-mb-0 phsr-section-title">
                      <i className="bi bi-credit-card me-2"></i>Bank Information
                    </h5>
                  </div>
                  
                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="bankName" className="phsr-form-label">
                        <i className="bi bi-bank me-2"></i>Bank Name: *
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        className="phsr-input"
                        placeholder="Enter bank name"
                        required
                        value={form.bankName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="branch" className="phsr-form-label">
                        <i className="bi bi-geo-alt me-2"></i>Branch: *
                      </label>
                      <input
                        type="text"
                        id="branch"
                        name="branch"
                        className="phsr-input"
                        placeholder="Enter branch name"
                        required
                        value={form.branch}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-6">
                      <label htmlFor="ifscCode" className="phsr-form-label">
                        <i className="bi bi-hash me-2"></i>IFSC Code: *
                        <small className="phsr-text-muted ms-1">(11 characters)</small>
                      </label>
                      <input
                        type="text"
                        id="ifscCode"
                        name="ifscCode"
                        className="phsr-input"
                        placeholder="e.g., SBIN0000123"
                        maxLength={11}
                        required
                        value={form.ifscCode}
                        onChange={handleChange}
                        style={{ textTransform: "uppercase" }}
                      />
                      <small className="phsr-text-muted">
                        Format: 4 letters (Bank) + 0 + 6 digits (Branch)
                      </small>
                    </div>
                    <div className="phsr-col-md-6">
                      <label htmlFor="accountNumber" className="phsr-form-label">
                        <i className="bi bi-123 me-2"></i>Account Number: *
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        name="accountNumber"
                        className="phsr-input"
                        placeholder="Enter account number"
                        required
                        value={form.accountNumber}
                        onChange={handleChange}
                      />
                      <small className="phsr-text-muted">
                        Enter numbers only (no spaces or special characters)
                      </small>
                    </div>
                  </div>

                  <div className="phsr-row phsr-mb-3">
                    <div className="phsr-col-md-12">
                      <label htmlFor="accountHolderName" className="phsr-form-label">
                        <i className="bi bi-person-vcard me-2"></i>Account Holder Name: *
                      </label>
                      <input
                        type="text"
                        id="accountHolderName"
                        name="accountHolderName"
                        className="phsr-input"
                        placeholder="Enter account holder's name as per bank records"
                        required
                        value={form.accountHolderName}
                        onChange={handleChange}
                      />
                      <small className="phsr-text-muted">
                        Name should match exactly with bank records
                      </small>
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
                    <span className="phsr-review-field-label">Address</span>
                    <p className={`phsr-review-field-value ${!form.address ? "phsr-text-danger" : ""}`}>
                      {form.address || "Not provided"}
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

              {/* Documents Section */}
              <div className="phsr-review-section">
                <h6 className="phsr-review-section-title">
                  <i className="bi bi-file-earmark-lock me-2"></i> Compliance Documents
                </h6>
                <div className="phsr-row">
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
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">Drug License No</span>
                    <p className={`phsr-review-field-value ${!form.licenseNumber ? "phsr-text-danger" : ""}`}>
                      {form.licenseNumber || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-6">
                    <span className="phsr-review-field-label">License File</span>
                    <p className={`phsr-review-field-value ${!form.licenseFile ? "phsr-text-danger" : ""}`}>
                      {form.licenseFile ? (
                        <span className="phsr-file-pill">
                          <i className="bi bi-file-earmark-pdf me-1"></i>
                          {form.licenseFile.name}
                        </span>
                      ) : "Not uploaded"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="phsr-review-section">
                <h6 className="phsr-review-section-title">
                  <i className="bi bi-bank me-2"></i> Bank Account Details
                </h6>
                <div className="phsr-row">
                  <div className="phsr-col-md-4">
                    <span className="phsr-review-field-label">State</span>
                    <p className={`phsr-review-field-value ${!form.state ? "phsr-text-danger" : ""}`}>
                      {form.state || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-4">
                    <span className="phsr-review-field-label">District</span>
                    <p className={`phsr-review-field-value ${!form.district ? "phsr-text-danger" : ""}`}>
                      {form.district || "Not provided"}
                    </p>
                  </div>
                  <div className="phsr-col-md-4">
                    <span className="phsr-review-field-label">Taluka</span>
                    <p className={`phsr-review-field-value ${!form.taluka ? "phsr-text-danger" : ""}`}>
                      {form.taluka || "Not provided"}
                    </p>
                  </div>
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
                  <div className="phsr-col-md-12">
                    <span className="phsr-review-field-label">Account Holder Name</span>
                    <p className={`phsr-review-field-value ${!form.accountHolderName ? "phsr-text-danger" : ""}`}>
                      {form.accountHolderName || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Validation Summary */}
              <div className="phsr-validation-summary">
                <h6 className="phsr-mb-2">
                  <i className="bi bi-clipboard-check me-2"></i>Validation Summary
                </h6>
                <div className="phsr-row">
                  <div className="phsr-col-md-4">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className={`bi ${form.sellerName ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
                      Company Info: {form.sellerName ? 'Complete' : 'Incomplete'}
                    </small>
                  </div>
                  <div className="phsr-col-md-4">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className={`bi ${emailVerified && phoneVerified ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
                      Verification: {emailVerified && phoneVerified ? 'Complete' : 'Pending'}
                    </small>
                  </div>
                  <div className="phsr-col-md-4">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className={`bi ${form.gstFile && form.licenseFile ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
                      Documents: {form.gstFile && form.licenseFile ? 'Complete' : 'Incomplete'}
                    </small>
                  </div>
                  <div className="phsr-col-md-6">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className={`bi ${form.ifscCode && form.accountNumber ? 'bi-check-circle-fill phsr-text-success' : 'bi-x-circle-fill phsr-text-danger'} me-2`}></i>
                      Bank Details: {form.ifscCode && form.accountNumber ? 'Complete' : 'Incomplete'}
                    </small>
                  </div>
                  <div className="phsr-col-md-6">
                    <small className="d-flex align-items-center phsr-mb-1">
                      <i className="bi bi-info-circle-fill phsr-text-info me-2"></i>
                      Overall Status: {form.sellerName && emailVerified && phoneVerified && form.gstFile && form.licenseFile && form.ifscCode && form.accountNumber ? 'Ready to Submit' : 'Needs Attention'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}

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