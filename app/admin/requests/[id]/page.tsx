"use client";

import Header from "@/app/components/Header";
import { useParams, useRouter } from "next/navigation";

/* ---------- Reusable UI helpers ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#2D0066] mb-4">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
        {children}
      </div>
    </div>
  );
}

function Item({ label, value, verified = false }: any) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">
        {value}
        {verified && (
          <span className="ml-2 text-green-600 text-sm font-semibold">
            ✔ Verified
          </span>
        )}
      </p>
    </div>
  );
}

function FileItem({ label, fileUrl }: { label: string; fileUrl?: string }) {
  if (!fileUrl) {
    return (
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-400 italic">Not uploaded</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#4B0082] font-medium hover:underline"
      >
        View file
      </a>
    </div>
  );
}

function StatusItem({ label, status, highlight = false }: any) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`font-semibold ${highlight ? "text-green-700" : "text-gray-700"}`}>
        {status}
      </p>
    </div>
  );
}

export default function SellerRequestDetails() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <>
      <Header showLogout onLogout={() => router.push("/admin/login")} />

      {/* Page Background */}
      <main className="pt-20 bg-[#F7F2FB] min-h-screen px-6">
        <div className="max-w-7xl mx-auto">

          {/* BIG WHITE CONTAINER (same as Admin page) */}
          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-10 space-y-10">

            {/* Page Title */}
            <div>
              <h1 className="text-3xl font-bold text-[#2D0066]">
                Final Verification Summary
              </h1>
              <p className="text-gray-600 mt-1">
                Please review all details before final submission
              </p>
            </div>

            <Item label="Request ID" value={id} />

            <Section title="Company Details">
              <Item label="Company Name" value="test" />
              <Item label="Company Type" value="White Labelling Company" />
              <Item label="Address" value="test" />
              <Item label="Phone" value="1234567890" />
              <Item label="Email" value="test@gmail.com" />
              <Item label="Website" value="N/A" />
            </Section>

            <Section title="Coordinator Details">
              <Item label="Name" value="Test" />
              <Item label="Designation" value="Test" />
              <Item label="Email" value="test@gmail.com" verified />
              <Item label="Mobile" value="1234567890" verified />
            </Section>

            <Section title="Compliance Documents">
              <Item label="GST Number" value="test" />
              <FileItem label="GST Certificate" fileUrl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" />
              <Item label="Drug License No" value="test" />
              <FileItem label="License File" fileUrl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" />
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
            </Section>

            <Section title="Validation Summary">
              <StatusItem label="Company Info" status="Complete" />
              <StatusItem label="Verification" status="Complete" />
              <StatusItem label="Documents" status="Complete" />
              <StatusItem label="Bank Details" status="Complete" />
              <StatusItem label="Overall Status" status="Ready to Submit" highlight />
            </Section>

            {/* Admin Actions */}
            <div className="pt-6 border-t">
              <textarea
                placeholder="Add admin comments"
                className="w-full border rounded-lg p-3 mb-6"
              />

              <div className="flex gap-4">
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg">
                  Accept
                </button>
                <button className="bg-red-600 text-white px-6 py-2 rounded-lg">
                  Reject
                </button>
                <button className="bg-yellow-500 text-white px-6 py-2 rounded-lg">
                  Correction
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
