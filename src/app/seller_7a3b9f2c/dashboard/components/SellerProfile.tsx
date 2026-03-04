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
  Save,
  Calendar,
  Hash,
  Shield,
  Users,
  Briefcase,
  Landmark,
  Home,
  Map,
  Navigation,
  MailCheck,
  Smartphone,
  FileCheck
} from "lucide-react";
import toast from "react-hot-toast";

// Mock seller data matching the registration schema
const mockSellerData = {
  // Company Details
  sellerName: "Sunrise Pharmaceuticals Pvt Ltd",
  companyType: "Manufacturer",
  sellerType: "Distributor",
  productTypes: ["Pharmaceuticals", "Healthcare Products", "Medical Devices"],
  productTypeIds: [1, 2, 3],
  
  // Address Details
  state: "Maharashtra",
  district: "Mumbai Suburban",
  taluka: "Andheri",
  city: "Mumbai",
  street: "Industrial Area",
  buildingNo: "Plot No. 123",
  landmark: "Near Andheri East Station",
  pincode: "400093",
  
  // Contact Details
  phone: "9876543210",
  email: "contact@sunrisepharma.com",
  website: "www.sunrisepharma.com",
  
  // Coordinator Details
  coordinatorName: "Rajesh Kumar",
  coordinatorDesignation: "Sales Director",
  coordinatorEmail: "rajesh.kumar@sunrisepharma.com",
  coordinatorMobile: "9876543210",
  
  // GST Details
  gstNumber: "27AAECS1234F1Z5",
  gstFile: {
    name: "gst_certificate.pdf",
    url: "/docs/gst.pdf",
    uploadedOn: "2024-01-15"
  },
  
  // Licenses per product
  licenses: {
    "Pharmaceuticals": {
      number: "FORM-25/123/2023",
      file: {
        name: "drug_license.pdf",
        url: "/docs/license1.pdf"
      },
      issueDate: "2023-01-15",
      expiryDate: "2028-01-14",
      issuingAuthority: "FDA Maharashtra",
      status: "active"
    },
    "Healthcare Products": {
      number: "FSSAI/456/2023",
      file: {
        name: "fssai_license.pdf",
        url: "/docs/fssai.pdf"
      },
      issueDate: "2023-03-20",
      expiryDate: "2024-03-19",
      issuingAuthority: "FSSAI",
      status: "expiring"
    },
    "Medical Devices": {
      number: "MD/789/2023",
      file: {
        name: "medical_device_license.pdf",
        url: "/docs/md.pdf"
      },
      issueDate: "2023-06-10",
      expiryDate: "2028-06-09",
      issuingAuthority: "CDSCO",
      status: "active"
    }
  },
  
  // Bank Details
  bankName: "State Bank of India",
  branch: "Andheri East Branch",
  ifscCode: "SBIN0001234",
  accountNumber: "12345678901",
  accountHolderName: "Sunrise Pharmaceuticals Pvt Ltd",
  bankState: "Maharashtra",
  bankDistrict: "Mumbai Suburban",
  cancelledChequeFile: {
    name: "cancelled_cheque.pdf",
    url: "/docs/cheque.pdf"
  },
  
  // Additional profile info
  profileImage: "/assets/images/TiamLogo.jpg",
  registrationDate: "2024-01-15",
  lastUpdated: "2024-03-01",
  applicationId: "SEL2024001234",
  verificationStatus: "verified"
};

type TabType = "profile" | "documents" | "bank" | "settings";

const SellerProfile = () => {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(mockSellerData.profileImage);
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

  const handleDownloadDocument = (docName: string, fileName: string) => {
    toast.success(`Downloading ${fileName}`);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-50 text-success-700 text-p2 font-medium">
            <CheckCircle size={12} /> Active
          </span>
        );
      case "expiring":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning-50 text-warning-700 text-p2 font-medium">
            <AlertCircle size={12} /> Expiring Soon
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 text-p2 font-medium">
            <XCircle size={12} /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 text-p2 font-medium">
            <AlertCircle size={12} /> Unknown
          </span>
        );
    }
  };

  const getVerificationBadge = () => {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-50 text-success-700 text-p2 font-medium">
        <CheckCircle size={12} /> Verified
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h5 font-bold text-neutral-900">Seller Profile</h2>
          <p className="text-p3 text-neutral-500">Manage your profile, documents, and business details</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-p2 text-neutral-500">
            Last updated: {formatDate(mockSellerData.lastUpdated)}
          </span>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-p3 font-medium ${
              isEditing 
                ? "bg-success-600 text-base-white hover:bg-success-700" 
                : "bg-primary-600 text-base-white hover:bg-primary-700"
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
      </div>

      {/* Application ID & Status */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-primary-600" />
          <div>
            <span className="text-p3 text-neutral-600">Application ID:</span>
            <span className="ml-2 font-mono font-medium text-neutral-900 text-p3">{mockSellerData.applicationId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getVerificationBadge()}
          <span className="text-p3 text-neutral-500">
            Registered on: {formatDate(mockSellerData.registrationDate)}
          </span>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex flex-wrap border-b border-neutral-200">
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
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-p3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
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
      <div className="bg-base-white rounded-lg border border-neutral-200 p-4 sm:p-6">
        {activeTab === "profile" && (
          <div className="space-y-8">
            {/* Profile Picture & Basic Info Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-primary-100 rounded-full overflow-hidden border-2 border-primary-200">
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
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors border-2 border-base-white">
                    <Camera size={16} className="text-base-white" />
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
                <h3 className="text-h6 font-semibold text-neutral-900">{formData.sellerName}</h3>
                <p className="text-p3 text-neutral-500 mt-1">{formData.coordinatorDesignation}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-p2 bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                    {formData.companyType}
                  </span>
                  <span className="text-p2 bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full">
                    {formData.sellerType}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Details Section */}
            <div className="border-t border-neutral-100 pt-6">
              <h4 className="text-p3 font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-primary-600" />
                Company Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoCard
                  label="Company Name"
                  value={formData.sellerName}
                  icon={Building2}
                  editable={isEditing}
                />
                <InfoCard
                  label="Company Type"
                  value={formData.companyType}
                  icon={Briefcase}
                  editable={isEditing}
                />
                <InfoCard
                  label="Seller Type"
                  value={formData.sellerType}
                  icon={Users}
                  editable={isEditing}
                />
                <InfoCard
                  label="GST Number"
                  value={formData.gstNumber}
                  icon={Hash}
                  editable={isEditing}
                />
                <InfoCard
                  label="Website"
                  value={formData.website}
                  icon={Globe}
                  editable={isEditing}
                />
                <InfoCard
                  label="Application ID"
                  value={formData.applicationId}
                  icon={FileCheck}
                  editable={false}
                />
              </div>
            </div>

            {/* Product Types Section */}
            <div className="border-t border-neutral-100 pt-6">
              <h4 className="text-p3 font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <Award size={18} className="text-primary-600" />
                Product Categories
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.productTypes.map((product, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-p3 font-medium border border-primary-200"
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t border-neutral-100 pt-6">
              <h4 className="text-p3 font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-primary-600" />
                Business Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoCard label="State" value={formData.state} icon={Map} editable={isEditing} />
                <InfoCard label="District" value={formData.district} icon={MapPin} editable={isEditing} />
                <InfoCard label="Taluka" value={formData.taluka} icon={Navigation} editable={isEditing} />
                <InfoCard label="City/Town" value={formData.city} icon={Building2} editable={isEditing} />
                <InfoCard label="Street/Road" value={formData.street} icon={Map} editable={isEditing} />
                <InfoCard label="Building No." value={formData.buildingNo} icon={Home} editable={isEditing} />
                <InfoCard label="Landmark" value={formData.landmark || "—"} icon={MapPin} editable={isEditing} />
                <InfoCard label="Pin Code" value={formData.pincode} icon={Hash} editable={isEditing} />
              </div>
            </div>

            {/* Contact Details */}
            <div className="border-t border-neutral-100 pt-6">
              <h4 className="text-p3 font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <Mail size={18} className="text-primary-600" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="Company Phone" value={formData.phone} icon={Phone} editable={isEditing} />
                <InfoCard label="Company Email" value={formData.email} icon={Mail} editable={isEditing} />
              </div>
            </div>

            {/* Coordinator Details */}
            <div className="border-t border-neutral-100 pt-6">
              <h4 className="text-p3 font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <User size={18} className="text-primary-600" />
                Coordinator Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="Name" value={formData.coordinatorName} icon={User} editable={isEditing} />
                <InfoCard label="Designation" value={formData.coordinatorDesignation} icon={Award} editable={isEditing} />
                <InfoCard 
                  label="Email" 
                  value={formData.coordinatorEmail} 
                  icon={MailCheck} 
                  editable={isEditing}
                  verified={true}
                />
                <InfoCard 
                  label="Mobile" 
                  value={formData.coordinatorMobile} 
                  icon={Smartphone} 
                  editable={isEditing}
                  verified={true}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            {/* GST Certificate */}
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <h4 className="text-p3 font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-primary-600" />
                GST Certificate
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="GST Number" value={formData.gstNumber} icon={Hash} editable={false} />
                <DocumentCard
                  label="GST Certificate"
                  fileName={formData.gstFile.name}
                  fileUrl={formData.gstFile.url}
                  uploadedOn={formData.gstFile.uploadedOn}
                  onDownload={() => handleDownloadDocument("GST", formData.gstFile.name)}
                />
              </div>
            </div>

            {/* Product Licenses */}
            {Object.entries(formData.licenses).map(([product, license]) => (
              <div key={product} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-p3 font-semibold text-neutral-700 flex items-center gap-2">
                    <Award size={18} className="text-primary-600" />
                    {product} License
                  </h4>
                  {getStatusBadge(license.status)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoCard label="License Number" value={license.number} icon={Hash} editable={false} />
                  <InfoCard label="Issuing Authority" value={license.issuingAuthority} icon={Building2} editable={false} />
                  <InfoCard label="Issue Date" value={formatDate(license.issueDate)} icon={Calendar} editable={false} />
                  <InfoCard label="Expiry Date" value={formatDate(license.expiryDate)} icon={Calendar} editable={false} />
                  <div className="lg:col-span-2">
                    <DocumentCard
                      label="License Document"
                      fileName={license.file.name}
                      fileUrl={license.file.url}
                      onDownload={() => handleDownloadDocument(product, license.file.name)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "bank" && (
          <div className="space-y-6">
            {/* Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label="Bank Name" value={formData.bankName} icon={Landmark} editable={isEditing} />
              <InfoCard label="Branch" value={formData.branch} icon={Building2} editable={isEditing} />
              <InfoCard label="IFSC Code" value={formData.ifscCode} icon={Hash} editable={isEditing} />
              <InfoCard label="Account Number" value={`****${formData.accountNumber.slice(-4)}`} icon={CreditCard} editable={isEditing} />
              <InfoCard label="Account Holder" value={formData.accountHolderName} icon={User} editable={isEditing} />
              <InfoCard label="Bank State" value={formData.bankState} icon={Map} editable={false} />
              <InfoCard label="Bank District" value={formData.bankDistrict} icon={MapPin} editable={false} />
              <div className="md:col-span-2">
                <DocumentCard
                  label="Cancelled Cheque"
                  fileName={formData.cancelledChequeFile.name}
                  fileUrl={formData.cancelledChequeFile.url}
                  onDownload={() => handleDownloadDocument("Bank", formData.cancelledChequeFile.name)}
                />
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-200 mt-6">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-primary-600 mt-0.5" />
                <div>
                  <p className="text-p3 font-medium text-primary-900">Security Assurance</p>
                  <p className="text-p2 text-primary-700 mt-1">
                    Your bank details are encrypted and stored securely. All payments will be processed to this account.
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
              <SettingToggle
                title="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                defaultChecked={false}
              />
              <SettingToggle
                title="Email Notifications"
                description="Receive updates about orders and products"
                defaultChecked={true}
              />
              <SettingToggle
                title="SMS Alerts"
                description="Get important alerts on your mobile"
                defaultChecked={false}
              />
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <h4 className="text-p3 font-semibold text-neutral-700 mb-3">Danger Zone</h4>
              <button className="px-4 py-2 bg-warning-50 text-warning-700 rounded-lg hover:bg-warning-100 transition-colors text-p3">
                Deactivate Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for info cards
const InfoCard = ({ label, value, icon: Icon, editable, verified }: any) => (
  <div className="bg-base-white rounded-lg border border-neutral-200 p-3 hover:shadow-sm transition">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-1 text-p2 text-neutral-500 mb-1">
          {Icon && <Icon size={12} />}
          <span>{label}</span>
        </div>
        <div className="text-p3 font-medium text-neutral-900 break-all">
          {value || "—"}
        </div>
      </div>
      {verified && (
        <CheckCircle size={14} className="text-success-600 ml-2 mt-1" />
      )}
    </div>
  </div>
);

// Helper component for document cards
const DocumentCard = ({ label, fileName, fileUrl, uploadedOn, onDownload }: any) => (
  <div className="bg-base-white rounded-lg border border-neutral-200 p-3">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-1 text-p2 text-neutral-500 mb-1">
          <FileText size={12} />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-p3 font-medium text-neutral-900 truncate max-w-[200px]">
            {fileName}
          </span>
          {uploadedOn && (
            <span className="text-p2 text-neutral-400">
              Uploaded: {uploadedOn}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onDownload}
        className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
        title="Download"
      >
        <Download size={16} className="text-neutral-600" />
      </button>
    </div>
  </div>
);

// Helper component for settings toggle
const SettingToggle = ({ title, description, defaultChecked }: any) => (
  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition">
    <div>
      <p className="text-p3 font-medium text-neutral-900">{title}</p>
      <p className="text-p2 text-neutral-500 mt-1">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-base-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-base-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
  </div>
);

export default SellerProfile;















// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import React, { useState } from "react";
// import Image from "next/image";
// import { 
//   User, 
//   Building2, 
//   Mail, 
//   Phone, 
//   MapPin, 
//   Globe, 
//   FileText, 
//   CreditCard,
//   Award,
//   Settings,
//   Edit2,
//   Camera,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Download,
//   Upload,
//   Save,
//   Calendar,
//   Hash,
//   Shield,
//   Users,
//   Briefcase,
//   Landmark,
//   Home,
//   Map,
//   Navigation,
//   MailCheck,
//   Smartphone,
//   FileCheck,
//   FileWarning,
//   Banknote,
//   Copy,
//   ExternalLink
// } from "lucide-react";
// import toast from "react-hot-toast";

// // Mock seller data matching the registration schema
// const mockSellerData = {
//   // Company Details
//   sellerName: "Sunrise Pharmaceuticals Pvt Ltd",
//   companyType: "Manufacturer",
//   sellerType: "Distributor",
//   productTypes: ["Pharmaceuticals", "Healthcare Products", "Medical Devices"],
//   productTypeIds: [1, 2, 3],
  
//   // Address Details
//   state: "Maharashtra",
//   district: "Mumbai Suburban",
//   taluka: "Andheri",
//   city: "Mumbai",
//   street: "Industrial Area",
//   buildingNo: "Plot No. 123",
//   landmark: "Near Andheri East Station",
//   pincode: "400093",
  
//   // Contact Details
//   phone: "9876543210",
//   email: "contact@sunrisepharma.com",
//   website: "www.sunrisepharma.com",
  
//   // Coordinator Details
//   coordinatorName: "Rajesh Kumar",
//   coordinatorDesignation: "Sales Director",
//   coordinatorEmail: "rajesh.kumar@sunrisepharma.com",
//   coordinatorMobile: "9876543210",
  
//   // GST Details
//   gstNumber: "27AAECS1234F1Z5",
//   gstFile: {
//     name: "gst_certificate.pdf",
//     url: "/docs/gst.pdf",
//     uploadedOn: "2024-01-15"
//   },
  
//   // Licenses per product
//   licenses: {
//     "Pharmaceuticals": {
//       number: "FORM-25/123/2023",
//       file: {
//         name: "drug_license.pdf",
//         url: "/docs/license1.pdf"
//       },
//       issueDate: "2023-01-15",
//       expiryDate: "2028-01-14",
//       issuingAuthority: "FDA Maharashtra",
//       status: "active"
//     },
//     "Healthcare Products": {
//       number: "FSSAI/456/2023",
//       file: {
//         name: "fssai_license.pdf",
//         url: "/docs/fssai.pdf"
//       },
//       issueDate: "2023-03-20",
//       expiryDate: "2024-03-19",
//       issuingAuthority: "FSSAI",
//       status: "expiring"
//     },
//     "Medical Devices": {
//       number: "MD/789/2023",
//       file: {
//         name: "medical_device_license.pdf",
//         url: "/docs/md.pdf"
//       },
//       issueDate: "2023-06-10",
//       expiryDate: "2028-06-09",
//       issuingAuthority: "CDSCO",
//       status: "active"
//     }
//   },
  
//   // Bank Details
//   bankName: "State Bank of India",
//   branch: "Andheri East Branch",
//   ifscCode: "SBIN0001234",
//   accountNumber: "12345678901",
//   accountHolderName: "Sunrise Pharmaceuticals Pvt Ltd",
//   bankState: "Maharashtra",
//   bankDistrict: "Mumbai Suburban",
//   cancelledChequeFile: {
//     name: "cancelled_cheque.pdf",
//     url: "/docs/cheque.pdf"
//   },
  
//   // Additional profile info
//   profileImage: "/avatars/seller.jpg",
//   registrationDate: "2024-01-15",
//   lastUpdated: "2024-03-01",
//   applicationId: "SEL2024001234",
//   verificationStatus: "verified"
// };

// type TabType = "profile" | "documents" | "bank" | "settings";

// const SellerProfile = () => {
//   const [activeTab, setActiveTab] = useState<TabType>("profile");
//   const [isEditing, setIsEditing] = useState(false);
//   const [profileImage, setProfileImage] = useState(mockSellerData.profileImage);
//   const [formData, setFormData] = useState(mockSellerData);

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setProfileImage(e.target?.result as string);
//         toast.success("Profile picture updated");
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSave = () => {
//     setIsEditing(false);
//     toast.success("Profile updated successfully");
//   };

//   const handleDownloadDocument = (docName: string, fileName: string) => {
//     toast.success(`Downloading ${fileName}`);
//   };

//   const getStatusBadge = (status: string) => {
//     switch(status) {
//       case "active":
//         return (
//           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
//             <CheckCircle size={12} /> Active
//           </span>
//         );
//       case "expiring":
//         return (
//           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">
//             <AlertCircle size={12} /> Expiring Soon
//           </span>
//         );
//       case "expired":
//         return (
//           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
//             <XCircle size={12} /> Expired
//           </span>
//         );
//       default:
//         return (
//           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
//             <AlertCircle size={12} /> Unknown
//           </span>
//         );
//     }
//   };

//   const getVerificationBadge = () => {
//     return (
//       <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
//         <CheckCircle size={12} /> Verified
//       </span>
//     );
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric'
//     });
//   };

//   const copyToClipboard = (text: string, label: string) => {
//     navigator.clipboard.writeText(text);
//     toast.success(`${label} copied to clipboard`);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Seller Profile</h2>
//           <p className="text-sm text-gray-500">Manage your profile, documents, and business details</p>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="text-xs text-gray-500">
//             Last updated: {formatDate(mockSellerData.lastUpdated)}
//           </span>
//           <button
//             onClick={() => isEditing ? handleSave() : setIsEditing(true)}
//             className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
//               isEditing 
//                 ? "bg-green-600 text-white hover:bg-green-700" 
//                 : "bg-blue-600 text-white hover:bg-blue-700"
//             }`}
//           >
//             {isEditing ? (
//               <>
//                 <Save size={18} />
//                 Save Changes
//               </>
//             ) : (
//               <>
//                 <Edit2 size={18} />
//                 Edit Profile
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Application ID & Status */}
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
//         <div className="flex items-center gap-3">
//           <FileText size={20} className="text-blue-600" />
//           <div>
//             <span className="text-sm text-gray-600">Application ID:</span>
//             <span className="ml-2 font-mono font-medium text-gray-900">{mockSellerData.applicationId}</span>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           {getVerificationBadge()}
//           <span className="text-sm text-gray-500">
//             Registered on: {formatDate(mockSellerData.registrationDate)}
//           </span>
//         </div>
//       </div>

//       {/* Profile Tabs */}
//       <div className="flex flex-wrap border-b border-gray-200">
//         {[
//           { id: "profile", label: "Profile Information", icon: User },
//           { id: "documents", label: "Documents & Licenses", icon: FileText },
//           { id: "bank", label: "Bank Details", icon: CreditCard },
//           { id: "settings", label: "Settings", icon: Settings },
//         ].map((tab) => {
//           const Icon = tab.icon;
//           return (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id as TabType)}
//               className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
//                 activeTab === tab.id
//                   ? "border-blue-600 text-blue-600"
//                   : "border-transparent text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               <Icon size={18} />
//               {tab.label}
//             </button>
//           );
//         })}
//       </div>

//       {/* Tab Content */}
//       <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
//         {activeTab === "profile" && (
//           <div className="space-y-8">
//             {/* Profile Picture & Basic Info Section */}
//             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
//               <div className="relative">
//                 <div className="w-24 h-24 bg-blue-100 rounded-full overflow-hidden border-2 border-blue-200">
//                   {profileImage ? (
//                     <Image
//                       src={profileImage}
//                       alt="Profile"
//                       width={96}
//                       height={96}
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center bg-blue-200">
//                       <User size={40} className="text-blue-700" />
//                     </div>
//                   )}
//                 </div>
//                 {isEditing && (
//                   <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors border-2 border-white">
//                     <Camera size={16} className="text-white" />
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageUpload}
//                       className="hidden"
//                     />
//                   </label>
//                 )}
//               </div>
//               <div>
//                 <h3 className="text-xl font-semibold text-gray-900">{formData.sellerName}</h3>
//                 <p className="text-sm text-gray-500 mt-1">{formData.coordinatorDesignation}</p>
//                 <div className="flex items-center gap-2 mt-2">
//                   <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
//                     {formData.companyType}
//                   </span>
//                   <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
//                     {formData.sellerType}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Company Details Section */}
//             <div className="border-t border-gray-100 pt-6">
//               <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 <Building2 size={18} className="text-blue-600" />
//                 Company Details
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <InfoCard
//                   label="Company Name"
//                   value={formData.sellerName}
//                   icon={Building2}
//                   editable={isEditing}
//                 />
//                 <InfoCard
//                   label="Company Type"
//                   value={formData.companyType}
//                   icon={Briefcase}
//                   editable={isEditing}
//                 />
//                 <InfoCard
//                   label="Seller Type"
//                   value={formData.sellerType}
//                   icon={Users}
//                   editable={isEditing}
//                 />
//                 <InfoCard
//                   label="GST Number"
//                   value={formData.gstNumber}
//                   icon={Hash}
//                   editable={isEditing}
//                 />
//                 <InfoCard
//                   label="Website"
//                   value={formData.website}
//                   icon={Globe}
//                   editable={isEditing}
//                 />
//                 <InfoCard
//                   label="Application ID"
//                   value={formData.applicationId}
//                   icon={FileCheck}
//                   editable={false}
//                 />
//               </div>
//             </div>

//             {/* Product Types Section */}
//             <div className="border-t border-gray-100 pt-6">
//               <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 <Award size={18} className="text-blue-600" />
//                 Product Categories
//               </h4>
//               <div className="flex flex-wrap gap-2">
//                 {formData.productTypes.map((product, index) => (
//                   <span
//                     key={index}
//                     className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
//                   >
//                     {product}
//                   </span>
//                 ))}
//               </div>
//             </div>

//             {/* Address Section */}
//             <div className="border-t border-gray-100 pt-6">
//               <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 <MapPin size={18} className="text-blue-600" />
//                 Business Address
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <InfoCard label="State" value={formData.state} icon={Map} editable={isEditing} />
//                 <InfoCard label="District" value={formData.district} icon={MapPin} editable={isEditing} />
//                 <InfoCard label="Taluka" value={formData.taluka} icon={Navigation} editable={isEditing} />
//                 <InfoCard label="City/Town" value={formData.city} icon={Building2} editable={isEditing} />
//                 <InfoCard label="Street/Road" value={formData.street} icon={Map} editable={isEditing} />
//                 <InfoCard label="Building No." value={formData.buildingNo} icon={Home} editable={isEditing} />
//                 <InfoCard label="Landmark" value={formData.landmark} icon={MapPin} editable={isEditing} />
//                 <InfoCard label="Pin Code" value={formData.pincode} icon={Hash} editable={isEditing} />
//               </div>
//             </div>

//             {/* Contact Details */}
//             <div className="border-t border-gray-100 pt-6">
//               <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 <Mail size={18} className="text-blue-600" />
//                 Contact Information
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <InfoCard label="Company Phone" value={formData.phone} icon={Phone} editable={isEditing} />
//                 <InfoCard label="Company Email" value={formData.email} icon={Mail} editable={isEditing} />
//               </div>
//             </div>

//             {/* Coordinator Details */}
//             <div className="border-t border-gray-100 pt-6">
//               <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 <User size={18} className="text-blue-600" />
//                 Coordinator Details
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <InfoCard label="Name" value={formData.coordinatorName} icon={User} editable={isEditing} />
//                 <InfoCard label="Designation" value={formData.coordinatorDesignation} icon={Award} editable={isEditing} />
//                 <InfoCard 
//                   label="Email" 
//                   value={formData.coordinatorEmail} 
//                   icon={MailCheck} 
//                   editable={isEditing}
//                   verified={true}
//                 />
//                 <InfoCard 
//                   label="Mobile" 
//                   value={formData.coordinatorMobile} 
//                   icon={Smartphone} 
//                   editable={isEditing}
//                   verified={true}
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {activeTab === "documents" && (
//           <div className="space-y-6">
//             {/* GST Certificate */}
//             <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//               <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 <FileText size={18} className="text-blue-600" />
//                 GST Certificate
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <InfoCard label="GST Number" value={formData.gstNumber} icon={Hash} editable={false} />
//                 <DocumentCard
//                   label="GST Certificate"
//                   fileName={formData.gstFile.name}
//                   fileUrl={formData.gstFile.url}
//                   uploadedOn={formData.gstFile.uploadedOn}
//                   onDownload={() => handleDownloadDocument("GST", formData.gstFile.name)}
//                 />
//               </div>
//             </div>

//             {/* Product Licenses */}
//             {Object.entries(formData.licenses).map(([product, license]) => (
//               <div key={product} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//                 <div className="flex items-center justify-between mb-4">
//                   <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//                     <Award size={18} className="text-blue-600" />
//                     {product} License
//                   </h4>
//                   {getStatusBadge(license.status)}
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   <InfoCard label="License Number" value={license.number} icon={Hash} editable={false} />
//                   <InfoCard label="Issuing Authority" value={license.issuingAuthority} icon={Building2} editable={false} />
//                   <InfoCard label="Issue Date" value={formatDate(license.issueDate)} icon={Calendar} editable={false} />
//                   <InfoCard label="Expiry Date" value={formatDate(license.expiryDate)} icon={Calendar} editable={false} />
//                   <div className="lg:col-span-2">
//                     <DocumentCard
//                       label="License Document"
//                       fileName={license.file.name}
//                       fileUrl={license.file.url}
//                       onDownload={() => handleDownloadDocument(product, license.file.name)}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {activeTab === "bank" && (
//           <div className="space-y-6">
//             {/* Bank Details */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <InfoCard label="Bank Name" value={formData.bankName} icon={Landmark} editable={isEditing} />
//               <InfoCard label="Branch" value={formData.branch} icon={Building2} editable={isEditing} />
//               <InfoCard label="IFSC Code" value={formData.ifscCode} icon={Hash} editable={isEditing} />
//               <InfoCard label="Account Number" value={`****${formData.accountNumber.slice(-4)}`} icon={CreditCard} editable={isEditing} />
//               <InfoCard label="Account Holder" value={formData.accountHolderName} icon={User} editable={isEditing} />
//               <InfoCard label="Bank State" value={formData.bankState} icon={Map} editable={false} />
//               <InfoCard label="Bank District" value={formData.bankDistrict} icon={MapPin} editable={false} />
//               <div className="md:col-span-2">
//                 <DocumentCard
//                   label="Cancelled Cheque"
//                   fileName={formData.cancelledChequeFile.name}
//                   fileUrl={formData.cancelledChequeFile.url}
//                   onDownload={() => handleDownloadDocument("Bank", formData.cancelledChequeFile.name)}
//                 />
//               </div>
//             </div>

//             {/* Security Notice */}
//             <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
//               <div className="flex items-start gap-3">
//                 <Shield size={20} className="text-blue-600 mt-0.5" />
//                 <div>
//                   <p className="text-sm font-medium text-blue-900">Security Assurance</p>
//                   <p className="text-xs text-blue-700 mt-1">
//                     Your bank details are encrypted and stored securely. All payments will be processed to this account.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {activeTab === "settings" && (
//           <div className="space-y-6">
//             <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
            
//             <div className="space-y-4">
//               <SettingToggle
//                 title="Two-Factor Authentication"
//                 description="Add an extra layer of security to your account"
//                 defaultChecked={false}
//               />
//               <SettingToggle
//                 title="Email Notifications"
//                 description="Receive updates about orders and products"
//                 defaultChecked={true}
//               />
//               <SettingToggle
//                 title="SMS Alerts"
//                 description="Get important alerts on your mobile"
//                 defaultChecked={false}
//               />
//             </div>

//             <div className="pt-4 border-t border-gray-200">
//               <h4 className="text-sm font-semibold text-gray-700 mb-3">Danger Zone</h4>
//               <button className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm">
//                 Deactivate Account
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // Helper component for info cards
// const InfoCard = ({ label, value, icon: Icon, editable, verified }: any) => (
//   <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition">
//     <div className="flex items-start justify-between">
//       <div className="flex-1">
//         <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
//           {Icon && <Icon size={12} />}
//           <span>{label}</span>
//         </div>
//         <div className="text-sm font-medium text-gray-900 break-all">
//           {value || "—"}
//         </div>
//       </div>
//       {verified && (
//         <CheckCircle size={14} className="text-green-500 ml-2 mt-1" />
//       )}
//     </div>
//   </div>
// );

// // Helper component for document cards
// const DocumentCard = ({ label, fileName, fileUrl, uploadedOn, onDownload }: any) => (
//   <div className="bg-white rounded-lg border border-gray-200 p-3">
//     <div className="flex items-start justify-between">
//       <div className="flex-1">
//         <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
//           <FileText size={12} />
//           <span>{label}</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
//             {fileName}
//           </span>
//           {uploadedOn && (
//             <span className="text-xs text-gray-400">
//               Uploaded: {uploadedOn}
//             </span>
//           )}
//         </div>
//       </div>
//       <button
//         onClick={onDownload}
//         className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
//         title="Download"
//       >
//         <Download size={16} className="text-gray-600" />
//       </button>
//     </div>
//   </div>
// );

// // Helper component for settings toggle
// const SettingToggle = ({ title, description, defaultChecked }: any) => (
//   <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
//     <div>
//       <p className="text-sm font-medium text-gray-900">{title}</p>
//       <p className="text-xs text-gray-500 mt-1">{description}</p>
//     </div>
//     <label className="relative inline-flex items-center cursor-pointer">
//       <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
//       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//     </label>
//   </div>
// );

// export default SellerProfile;

