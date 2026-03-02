/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  FileText, 
  CreditCard,
  Award,
  Settings,
  Edit2,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  Save,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";

// Mock seller data
const mockSellerData = {
  personalInfo: {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@company.com",
    phone: "+91 98765 43210",
    alternatePhone: "+91 98765 43211",
    designation: "Sales Director",
    profileImage: "/avatars/seller.jpg",
  },
  companyInfo: {
    companyName: "Sunrise Pharmaceuticals Pvt Ltd",
    companyType: "Manufacturer",
    registrationNumber: "U24230MH2010PTC123456",
    gstNumber: "27AAECS1234F1Z5",
    panNumber: "AAECS1234F",
    cinNumber: "U24230MH2010PTC123456",
    yearOfEstablishment: "2010",
    website: "www.sunrisepharma.com",
    employeeCount: "201-500",
    annualTurnover: "₹50-100 Cr",
  },
  businessAddress: {
    addressLine1: "Plot No. 123, Industrial Area",
    addressLine2: "Phase II, Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400093",
    country: "India",
  },
  licenses: [
    {
      type: "Drug Manufacturing Licence",
      number: "Form 25/123/2023",
      issuedBy: "FDA Maharashtra",
      issueDate: "2023-01-15",
      expiryDate: "2028-01-14",
      status: "active",
      document: "/docs/license1.pdf",
    },
    {
      type: "GST Registration",
      number: "27AAECS1234F1Z5",
      issuedBy: "GST Department",
      issueDate: "2022-06-10",
      expiryDate: "2027-06-09",
      status: "active",
      document: "/docs/gst.pdf",
    },
    {
      type: "FSSAI License",
      number: "FSSAI/123/2023",
      issuedBy: "FSSAI",
      issueDate: "2023-03-20",
      expiryDate: "2024-03-19",
      status: "expiring",
      document: "/docs/fssai.pdf",
    },
    {
      type: "Trade License",
      number: "TL/456/2022",
      issuedBy: "MCGM",
      issueDate: "2022-04-01",
      expiryDate: "2025-03-31",
      status: "active",
      document: "/docs/trade.pdf",
    },
  ],
  bankDetails: {
    accountHolderName: "Sunrise Pharmaceuticals Pvt Ltd",
    accountNumber: "12345678901",
    confirmAccountNumber: "12345678901",
    ifscCode: "SBIN0001234",
    bankName: "State Bank of India",
    branchName: "Andheri East Branch",
    accountType: "Current",
    upiId: "sunrisepharma@okhdfcbank",
  },
  businessCategories: [
    "Pharmaceuticals",
    "Healthcare Products",
    "Medical Devices",
  ],
  keyContacts: [
    {
      name: "Priya Singh",
      designation: "Procurement Manager",
      email: "priya.singh@company.com",
      phone: "+91 98765 43212",
      primary: true,
    },
    {
      name: "Amit Shah",
      designation: "Accounts Manager",
      email: "amit.shah@company.com",
      phone: "+91 98765 43213",
      primary: false,
    },
  ],
};

type TabType = "profile" | "documents" | "bank" | "settings";

const SellerProfile = () => {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(mockSellerData.personalInfo.profileImage);
  const [formData, setFormData] = useState(mockSellerData);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        toast.success("Profile picture updated");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Profile updated successfully");
  };

  const handleDownloadDocument = (docName: string) => {
    toast.success(`Downloading ${docName}`);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-50 text-success-700 text-xs font-medium"><CheckCircle size={12} /> Active</span>;
      case "expiring":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning-50 text-warning-700 text-xs font-medium"><AlertCircle size={12} /> Expiring Soon</span>;
      case "expired":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium"><XCircle size={12} /> Expired</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h5 font-bold text-neutral-900">Seller Profile</h2>
          <p className="text-p3 text-neutral-500">Manage your profile, documents, and business details</p>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            isEditing 
              ? "bg-success-600 text-white hover:bg-success-700" 
              : "bg-primary-900 text-white hover:bg-primary-800"
          }`}
        >
          {isEditing ? (
            <>
              <Save size={18} />
              Save Changes
            </>
          ) : (
            <>
              <Edit2 size={18} />
              Edit Profile
            </>
          )}
        </button>
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-neutral-200">
        {[
          { id: "profile", label: "Profile Information", icon: User },
          { id: "documents", label: "Documents & Licenses", icon: FileText },
          { id: "bank", label: "Bank Details", icon: CreditCard },
          { id: "settings", label: "Settings", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-900 text-primary-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-primary-100 rounded-full overflow-hidden">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-200">
                      <User size={40} className="text-primary-700" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-800 transition-colors">
                    <Camera size={16} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div>
                <h3 className="text-h6 font-semibold text-neutral-900">{formData.personalInfo.name}</h3>
                <p className="text-sm text-neutral-500">{formData.personalInfo.designation}</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <h4 className="col-span-2 text-sm font-semibold text-neutral-700">Personal Information</h4>
              <InputField
                label="Full Name"
                value={formData.personalInfo.name}
                icon={<User size={16} />}
                editable={isEditing}
              />
              <InputField
                label="Designation"
                value={formData.personalInfo.designation}
                icon={<Award size={16} />}
                editable={isEditing}
              />
              <InputField
                label="Email Address"
                value={formData.personalInfo.email}
                icon={<Mail size={16} />}
                editable={isEditing}
                type="email"
              />
              <InputField
                label="Phone Number"
                value={formData.personalInfo.phone}
                icon={<Phone size={16} />}
                editable={isEditing}
              />
              <InputField
                label="Alternate Phone"
                value={formData.personalInfo.alternatePhone}
                icon={<Phone size={16} />}
                editable={isEditing}
              />
            </div>

            {/* Company Information */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
              <h4 className="col-span-2 text-sm font-semibold text-neutral-700">Company Information</h4>
              <InputField
                label="Company Name"
                value={formData.companyInfo.companyName}
                icon={<Building2 size={16} />}
                editable={isEditing}
              />
              <InputField
                label="Company Type"
                value={formData.companyInfo.companyType}
                icon={<Building2 size={16} />}
                editable={isEditing}
              />
              <InputField
                label="Registration Number"
                value={formData.companyInfo.registrationNumber}
                icon={<FileText size={16} />}
                editable={isEditing}
              />
              <InputField
                label="GST Number"
                value={formData.companyInfo.gstNumber}
                icon={<FileText size={16} />}
                editable={isEditing}
              />
              <InputField
                label="PAN Number"
                value={formData.companyInfo.panNumber}
                icon={<FileText size={16} />}
                editable={isEditing}
              />
              <InputField
                label="CIN Number"
                value={formData.companyInfo.cinNumber}
                icon={<FileText size={16} />}
                editable={isEditing}
              />
              <InputField
                label="Year of Establishment"
                value={formData.companyInfo.yearOfEstablishment}
                icon={<Calendar size={16} />}
                editable={isEditing}
              />
              <InputField
                label="Website"
                value={formData.companyInfo.website}
                icon={<Globe size={16} />}
                editable={isEditing}
              />
              <InputField
                label="Employee Count"
                value={formData.companyInfo.employeeCount}
                editable={isEditing}
              />
              <InputField
                label="Annual Turnover"
                value={formData.companyInfo.annualTurnover}
                editable={isEditing}
              />
            </div>

            {/* Business Address */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
              <h4 className="col-span-2 text-sm font-semibold text-neutral-700">Business Address</h4>
              <InputField
                label="Address Line 1"
                value={formData.businessAddress.addressLine1}
                icon={<MapPin size={16} />}
                editable={isEditing}
                className="col-span-2"
              />
              <InputField
                label="Address Line 2"
                value={formData.businessAddress.addressLine2}
                icon={<MapPin size={16} />}
                editable={isEditing}
                className="col-span-2"
              />
              <InputField
                label="City"
                value={formData.businessAddress.city}
                editable={isEditing}
              />
              <InputField
                label="State"
                value={formData.businessAddress.state}
                editable={isEditing}
              />
              <InputField
                label="Pincode"
                value={formData.businessAddress.pincode}
                editable={isEditing}
              />
              <InputField
                label="Country"
                value={formData.businessAddress.country}
                editable={isEditing}
              />
            </div>

            {/* Key Contacts */}
            <div className="pt-4 border-t border-neutral-100">
              <h4 className="text-sm font-semibold text-neutral-700 mb-4">Key Contacts</h4>
              <div className="space-y-3">
                {formData.keyContacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900">{contact.name}</p>
                        {contact.primary && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">Primary</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">{contact.designation}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-neutral-600">{contact.email}</span>
                        <span className="text-xs text-neutral-600">{contact.phone}</span>
                      </div>
                    </div>
                    {isEditing && (
                      <button className="text-primary-600 hover:text-primary-700">
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <h3 className="text-h6 font-semibold text-neutral-900">Licenses & Certifications</h3>
            <div className="space-y-4">
              {formData.licenses.map((license, idx) => (
                <div key={idx} className="border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary-50 rounded-lg">
                        <FileText size={20} className="text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-neutral-900">{license.type}</h4>
                          {getStatusBadge(license.status)}
                        </div>
                        <p className="text-xs text-neutral-500">License No: {license.number}</p>
                        <p className="text-xs text-neutral-500">Issued by: {license.issuedBy}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-neutral-600">Issue: {new Date(license.issueDate).toLocaleDateString()}</span>
                          <span className="text-xs text-neutral-600">Expiry: {new Date(license.expiryDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(license.type)}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <Download size={18} className="text-neutral-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {isEditing && (
              <button className="w-full mt-4 p-3 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-500 hover:text-primary-600 hover:border-primary-300 transition-colors">
                <Upload size={20} className="mx-auto mb-1" />
                <span className="text-sm">Upload New Document</span>
              </button>
            )}
          </div>
        )}

        {activeTab === "bank" && (
          <div className="space-y-6">
            <h3 className="text-h6 font-semibold text-neutral-900">Bank Account Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Account Holder Name"
                value={formData.bankDetails.accountHolderName}
                editable={isEditing}
                className="col-span-2"
              />
              <InputField
                label="Account Number"
                value={formData.bankDetails.accountNumber}
                editable={isEditing}
                type={isEditing ? "text" : "password"}
              />
              <InputField
                label="Confirm Account Number"
                value={formData.bankDetails.confirmAccountNumber}
                editable={isEditing}
                type={isEditing ? "text" : "password"}
              />
              <InputField
                label="IFSC Code"
                value={formData.bankDetails.ifscCode}
                editable={isEditing}
              />
              <InputField
                label="Bank Name"
                value={formData.bankDetails.bankName}
                editable={isEditing}
              />
              <InputField
                label="Branch Name"
                value={formData.bankDetails.branchName}
                editable={isEditing}
              />
              <InputField
                label="Account Type"
                value={formData.bankDetails.accountType}
                editable={isEditing}
              />
              <InputField
                label="UPI ID"
                value={formData.bankDetails.upiId}
                editable={isEditing}
                className="col-span-2"
              />
            </div>

            <div className="bg-primary-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-primary-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary-900">Important Information</p>
                  <p className="text-xs text-primary-700 mt-1">
                    All payments will be processed to this bank account. Please ensure the details are accurate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h3 className="text-h6 font-semibold text-neutral-900">Account Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-900">Two-Factor Authentication</p>
                  <p className="text-xs text-neutral-500">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-900">Email Notifications</p>
                  <p className="text-xs text-neutral-500">Receive updates about orders and products</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-900">SMS Alerts</p>
                  <p className="text-xs text-neutral-500">Get important alerts on your mobile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <h4 className="text-sm font-semibold text-neutral-700 mb-3">Danger Zone</h4>
              <button className="px-4 py-2 bg-warning-50 text-warning-700 rounded-lg hover:bg-warning-100 transition-colors text-sm">
                Deactivate Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for input fields
const InputField = ({ label, value, icon, editable, type = "text", className = "" }: any) => (
  <div className={className}>
    <label className="block text-xs text-neutral-500 mb-1">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          {icon}
        </div>
      )}
      {editable ? (
        <input
          type={type}
          defaultValue={value}
          className={`w-full h-10 ${icon ? 'pl-10' : 'pl-3'} pr-3 rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600`}
        />
      ) : (
        <div className={`w-full h-10 ${icon ? 'pl-10' : 'pl-3'} pr-3 flex items-center bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-700 text-sm`}>
          {value}
        </div>
      )}
    </div>
  </div>
);

export default SellerProfile;