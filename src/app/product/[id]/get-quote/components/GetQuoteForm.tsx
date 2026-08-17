"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { BuyerProduct } from "@/src/types/buyer/product";
import Input from "@/src/app/commonComponents/Input";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import Button from "@/src/app/commonComponents/Button";
import SubmissionSuccess from "../../components/SubmissionSuccess";

const UNIT_OPTIONS = [
  { value: "units", label: "Units" },
  { value: "boxes", label: "Boxes" },
  { value: "strips", label: "Strips" },
  { value: "cartons", label: "Cartons" },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "advance", label: "100% Advance" },
  { value: "partial_advance", label: "Partial Advance" },
  { value: "credit_15", label: "Credit - 15 Days" },
  { value: "credit_30", label: "Credit - 30 Days" },
  { value: "cod", label: "Cash on Delivery" },
];

interface FormState {
  quantity: string;
  unit: string;
  deliveryLocation: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;
  requirements: string;
}

const INITIAL_STATE: FormState = {
  quantity: "",
  unit: "units",
  deliveryLocation: "",
  expectedDeliveryDate: "",
  paymentTerms: "",
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstNumber: "",
  requirements: "",
};

interface GetQuoteFormProps {
  productId: string;
  product: BuyerProduct;
}

export default function GetQuoteForm({ productId, product }: GetQuoteFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.quantity || Number(form.quantity) <= 0) next.quantity = "Enter a valid quantity";
    if (!form.deliveryLocation.trim()) next.deliveryLocation = "Delivery location is required";
    if (!form.companyName.trim()) next.companyName = "Company name is required";
    if (!form.contactPerson.trim()) next.contactPerson = "Contact person is required";
    if (!/^\d{10}$/.test(form.phone)) next.phone = "Enter a valid 10-digit phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const id = `RFQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setReferenceId(id);
    toast.success("Quote request submitted successfully");
  };

  if (referenceId) {
    return (
      <SubmissionSuccess
        referenceId={referenceId}
        heading="Quote request raised"
        message={`Your RFQ for ${product.productName} has been sent to our verified sellers. You'll receive competitive quotes within 24-48 hours — track them anytime from your buyer dashboard.`}
        onSubmitAnother={() => {
          setForm(INITIAL_STATE);
          setReferenceId(null);
        }}
        onBackToProduct={() => router.push(`/product/${productId}`)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="text-p3 font-heading font-medium text-pneutral-900 mb-4">Requirement details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Quantity Required"
            required
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
            error={errors.quantity}
            placeholder="e.g. 10000"
          />
          <Dropdown
            label="Unit"
            options={UNIT_OPTIONS}
            value={form.unit}
            onChange={(value) => setField("unit", value)}
          />
          <Input
            label="Delivery Location"
            required
            value={form.deliveryLocation}
            onChange={(e) => setField("deliveryLocation", e.target.value)}
            error={errors.deliveryLocation}
            placeholder="City / Pincode"
          />
          <Input
            label="Expected Delivery Date"
            type="date"
            value={form.expectedDeliveryDate}
            onChange={(e) => setField("expectedDeliveryDate", e.target.value)}
          />
          <Dropdown
            label="Preferred Payment Terms"
            className="sm:col-span-2"
            options={PAYMENT_TERMS_OPTIONS}
            value={form.paymentTerms}
            onChange={(value) => setField("paymentTerms", value)}
          />
        </div>
      </div>

      <div>
        <p className="text-p3 font-heading font-medium text-pneutral-900 mb-4">Business details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company Name"
            required
            value={form.companyName}
            onChange={(e) => setField("companyName", e.target.value)}
            error={errors.companyName}
            placeholder="Your business name"
          />
          <Input
            label="GST Number"
            value={form.gstNumber}
            onChange={(e) => setField("gstNumber", e.target.value.toUpperCase())}
            placeholder="Optional"
          />
          <Input
            label="Contact Person"
            required
            value={form.contactPerson}
            onChange={(e) => setField("contactPerson", e.target.value)}
            error={errors.contactPerson}
            placeholder="Name"
          />
          <Input
            label="Phone Number"
            required
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            error={errors.phone}
            placeholder="10-digit mobile number"
          />
          <Input
            label="Email"
            type="email"
            containerClassName="sm:col-span-2"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex flex-col gap-0 w-full">
        <label className="font-heading font-medium text-[16px] leading-6 text-pneutral-900">
          Additional Requirements
        </label>
        <textarea
          rows={3}
          value={form.requirements}
          onChange={(e) => setField("requirements", e.target.value)}
          placeholder="Packaging preference, certifications needed, split delivery, etc."
          className="w-full border outline-none transition-all duration-200 px-4 py-3 text-base rounded-lg border-pneutral-300 text-pneutral-800 bg-white focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300 resize-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="filled" size="lg" label="Submit RFQ" />
      </div>
    </form>
  );
}
