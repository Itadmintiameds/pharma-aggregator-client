"use client";

import Header from "@/src/app/components/Header";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Image from "next/image";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-purple-300 rounded-xl p-4">
      <h2 className="text-2xl font-bold text-[#2D0066] mb-3">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {children}
      </div>
    </div>
  );
}

interface ItemProps {
  label: string;
  value: string;
  verified?: boolean;
}

function Item({ label, value, verified = false }: ItemProps) {
  return (
    <div>
      <p className="text-base text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-base">
        {value}
        {verified && (
          <span className="ml-2 text-green-600 text-base font-semibold">✔ Verified</span>
        )}
      </p>
    </div>
  );
}

function FileItem({ 
  label, 
  fileUrl, 
  onView,
  isViewed,
  isVerified 
}: { 
  label: string; 
  fileUrl?: string;
  onView: () => void;
  isViewed: boolean;
  isVerified: boolean | null;
}) {
  if (!fileUrl) {
    return (
      <div>
        <p className="text-base text-gray-500 mb-1">{label}</p>
        <p className="text-gray-400 italic text-base">Not uploaded</p>
      </div>
    );
  }
  
  return (
    <div>
      <p className="text-base text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="text-[#4B0082] font-medium hover:underline text-base"
        >
          {isViewed ? "Viewed" : "View file"}
        </button>
        {isViewed && (
          <>
            {isVerified === true && (
              <span className="text-green-600 text-base font-semibold flex items-center gap-1">
                ✔ Verified
              </span>
            )}
            {isVerified === false && (
              <span className="text-red-600 text-base font-semibold flex items-center gap-1">
                ✗ Not Verified
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface StatusItemProps {
  label: string;
  status: string;
  highlight?: boolean;
  error?: boolean;
}

function StatusItem({ label, status, highlight = false, error = false }: StatusItemProps) {
  return (
    <div>
      <p className="text-base text-gray-500 mb-1">{label}</p>
      <p className={`font-semibold text-base ${
        error ? "text-red-600" : highlight ? "text-green-700" : "text-gray-700"
      }`}>
        {status}
      </p>
    </div>
  );
}

interface RequestDetailsProps {
  requestId: string;
}

export default function RequestDetails({ requestId }: RequestDetailsProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<{ url: string; label: string } | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [showCommentError, setShowCommentError] = useState(false);
  
  // Track verification status for each file
  const [fileStates, setFileStates] = useState<{
    [key: string]: { viewed: boolean; verified: boolean | null };
  }>({
    gstCertificate: { viewed: false, verified: null },
    licenseFile: { viewed: false, verified: null },
    chequeFile: { viewed: false, verified: null },
  });

  // Calculate verification status for compliance documents (GST + License)
  const documentsVerified = useMemo(() => {
    const complianceDocs = [fileStates.gstCertificate, fileStates.licenseFile];
    const allVerified = complianceDocs.every((state) => state.verified === true);
    const anyRejected = complianceDocs.some((state) => state.verified === false);
    const anyPending = complianceDocs.some((state) => state.verified === null);

    if (allVerified) return { status: "Complete", error: false };
    if (anyRejected) return { status: "Rejected", error: true };
    if (anyPending) return { status: "Pending Verification", error: true };
    return { status: "Incomplete", error: true };
  }, [fileStates]);

  // Calculate verification status for bank details (Cheque)
  const bankDetailsVerified = useMemo(() => {
    const chequeState = fileStates.chequeFile;
    
    if (chequeState.verified === true) return { status: "Complete", error: false };
    if (chequeState.verified === false) return { status: "Rejected", error: true };
    if (chequeState.verified === null) return { status: "Pending Verification", error: true };
    return { status: "Incomplete", error: true };
  }, [fileStates]);

  
  // Check if accept button should be enabled
  const canAccept = useMemo(() => {
    return Object.values(fileStates).every(
      (state) => state.verified === true
    );
  }, [fileStates]);

  const handleViewFile = (fileUrl: string, label: string, fileKey: string) => {
    setCurrentFile({ url: fileUrl, label });
    setIsModalOpen(true);
    // Mark as viewed
    setFileStates(prev => ({
      ...prev,
      [fileKey]: { ...prev[fileKey], viewed: true }
    }));
  };

  const handleVerify = (verified: boolean) => {
    if (currentFile) {
      const fileKey = currentFile.label === "GST Certificate" ? "gstCertificate" : currentFile.label === "License File" ? "licenseFile" : currentFile.label === "Cancelled Cheque" ? "chequeFile" : "";
      setFileStates(prev => ({
        ...prev,
        [fileKey]: { ...prev[fileKey], verified }
      }));
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleAction = (action: string) => {
    if (!adminComment.trim()) {
      setShowCommentError(true);
      return;
    }

    if (action === "Accept" && !canAccept) {
      alert("Cannot accept: All documents must be verified first!");
      return;
    }

    setShowCommentError(false);
    // Proceed with action
    console.log(`Action: ${action}, Comment: ${adminComment}`);
    alert(`Request ${action}ed successfully!`);
  };

  

  return (
    <>
      <Header admin onLogout={() => router.push("/admin_f6c29e3d/login")} />
      <main className="pt-12 bg-[#F7F2FB] min-h-screen px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="fixed left-6 top-32 z-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-full p-3 shadow-lg transition-all duration-200"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#2D0066]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-8 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-[#2D0066]">
                Final Verification Summary
              </h1>
              <p className="text-gray-600 mt-1 text-base">
                Please review all details before final submission
              </p>
            </div>
            <Item label="Request ID" value={requestId} />
            <Section title="Company Details">
              <Item label="Company Name" value="test" />
              <Item label="Company Type" value="White Labelling Company" />
              <Item label="Address" value="test" />
              <Item label="Phone" value="1234567890" verified />
              <Item label="Email" value="test@gmail.com" verified />
              <Item label="Website" value="N/A" />
            </Section>
            <Section title="Coordinator Details">
              <Item label="Name" value="Test" />
              <Item label="Designation" value="Test" />
              <Item label="Email" value="test@gmail.com" verified />
              <Item label="Mobile" value="1234567890" verified />
            </Section>
            <Section title="Compliance Documents">
              <Item label="GST Number" value="29ABCDE1234F1Z5" />
              <FileItem 
                label="GST Certificate" 
                fileUrl="/assets/docs/gst-certificate.png" 
                onView={() => handleViewFile("/assets/docs/gst-certificate.png", "GST Certificate", "gstCertificate")}
                isViewed={fileStates.gstCertificate.viewed}
                isVerified={fileStates.gstCertificate.verified}
              />
              <Item label="Drug License No" value="21B/KA/54321" />
              <FileItem 
                label="License File" 
                fileUrl="/assets/docs/license-file.png" 
                onView={() => handleViewFile("/assets/docs/license-file.png", "License File", "licenseFile")}
                isViewed={fileStates.licenseFile.viewed}
                isVerified={fileStates.licenseFile.verified}
              />
            </Section>
            <Section title="Bank Account Details">
              <Item label="State" value="test" />
              <Item label="District" value="test" />
              <Item label="Taluka" value="test" />
              <Item label="Bank Name" value="test" />
              <Item label="Branch" value="test" />
              <Item label="IFSC Code" value="test1234567" />
              <Item label="Account Number" value="****7890" />
              <Item label="Account Holder Name" value="Test" />
              <Item label="Cancelled Cheque" value="Available"/>
              <FileItem 
                label="Cancelled Cheque" 
                fileUrl="/assets/docs/cheque.jpg" 
                onView={() => handleViewFile("/assets/docs/cheque.jpg", "Cancelled Cheque", "chequeFile")}
                isViewed={fileStates.chequeFile.viewed}
                isVerified={fileStates.chequeFile.verified}
              />

            </Section>
            <Section title="Validation Summary">
              <StatusItem label="Company Info" status="Complete" />
              <StatusItem label="Verification" status="Complete" />
              <StatusItem 
                label="Documents" 
                status={documentsVerified.status} 
                error={documentsVerified.error}
                highlight={!documentsVerified.error}
              />
              <StatusItem 
                label="Bank Details" 
                status={bankDetailsVerified.status} 
                error={bankDetailsVerified.error}
                highlight={!bankDetailsVerified.error}
              />
              <StatusItem 
                label="Overall Status" 
                status={canAccept ? "Ready to Submit" : "Pending Verification"} 
                highlight={canAccept}
                error={!canAccept}
              />
            </Section>

            {/* Admin Decision Section - Redesigned */}
            <div className="border border-purple-300 rounded-xl p-4">
              <h2 className="text-2xl font-bold text-[#2D0066] mb-3">Admin Decision</h2>
              
              {/* Warning if not all verified */}
              {!canAccept && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-amber-800 text-base">Verification Incomplete</p>
                    <p className="text-amber-700 text-sm mt-1">All documents must be verified before the request can be accepted. Please review and verify all documents.</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Comments Textarea */}
                <div>
                  <label className="block text-base text-gray-500 mb-2">
                    Comments <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => {
                      setAdminComment(e.target.value);
                      setShowCommentError(false);
                    }}
                    placeholder="Enter your comments here..."
                    className={`w-full border ${
                      showCommentError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#4B0082]'
                    } rounded-lg p-3 text-base focus:outline-none focus:ring-2 transition-all min-h-[120px] resize-none`}
                    rows={4}
                  />
                  {showCommentError && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Please add a comment before taking action</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div>
                  <p className="text-base text-gray-500 mb-3">Select Action</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => handleAction("Accept")}
                      disabled={!canAccept}
                      className={`group px-6 py-4 rounded-xl transition-all duration-300 font-semibold text-base shadow-md flex items-center justify-center gap-2 ${
                        canAccept
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Accept Request</span>
                    </button>
                    
                    <button 
                      onClick={() => handleAction("Reject")}
                      className="group bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Reject Request</span>
                    </button>
                    
                    <button 
                      onClick={() => handleAction("Correction")}
                      className="group bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 font-semibold text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Request Correction</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* File Viewer Modal */}
      {isModalOpen && currentFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#2D0066]">{currentFile.label}</h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - File Display */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="flex items-center justify-center min-h-full relative">
                <Image 
                  src={currentFile.url} 
                  alt={currentFile.label}
                  width={800}
                  height={600}
                  className="max-w-full h-auto object-contain rounded-lg shadow-lg"
                  unoptimized
                />
              </div>
            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify(true)}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-base flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Verify
              </button>
              <button
                onClick={() => handleVerify(false)}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-base flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}