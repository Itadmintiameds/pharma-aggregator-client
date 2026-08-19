"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { BuyerProduct } from "@/src/types/buyer/product";
import Input from "@/src/app/commonComponents/Input";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import Button from "@/src/app/commonComponents/Button";
import SubmissionSuccess from "../../components/SubmissionSuccess";
import { createQuoteRequest } from "@/src/services/buyer/quoteRequestService";

const UNIT_OPTIONS = [
  { value: "units", label: "Units" },
  { value: "boxes", label: "Boxes" },
  { value: "strips", label: "Strips" },
  { value: "cartons", label: "Cartons" },
];

interface FormState {
  quantity: string;
  unit: string;
  targetPrice: string;
  pincode: string;
  fullName: string;
  phone: string;
  email: string;
  message: string;
}

const INITIAL_STATE: FormState = {
  quantity: "",
  unit: "units",
  targetPrice: "",
  pincode: "",
  fullName: "",
  phone: "",
  email: "",
  message: "",
};

interface RequestPriceFormProps {
  productId: string;
  product: BuyerProduct;
}

export default function RequestPriceForm({ productId, product }: RequestPriceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.quantity || Number(form.quantity) <= 0) next.quantity = "Enter a valid quantity";
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = "Enter a valid 6-digit pincode";
    if (!form.fullName.trim()) next.fullName = "Name is required";
    if (!/^\d{10}$/.test(form.phone)) next.phone = "Enter a valid 10-digit phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await createQuoteRequest({
        productId,
        requestType: "PRICE_REQUEST",
        quantity: Number(form.quantity),
        unit: form.unit,
        targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
        pincode: form.pincode,
        contactPerson: form.fullName,
        phone: form.phone,
        email: form.email,
        message: form.message || undefined,
      });
      setReferenceId(`RPO-${created.quoteRequestId}`);
      toast.success("Price request submitted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit price request");
    } finally {
      setSubmitting(false);
    }
  };

  if (referenceId) {
    return (
      <SubmissionSuccess
        referenceId={referenceId}
        heading="Price request sent"
        message={`We've shared your requirement for ${product.productName} with our sourcing team. They'll get back to you with the best price within 24 hours.`}
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
            placeholder="e.g. 500"
          />
          <Dropdown
            label="Unit"
            options={UNIT_OPTIONS}
            value={form.unit}
            onChange={(value) => setField("unit", value)}
          />
          <Input
            label="Your Target Price (per unit)"
            type="number"
            min={0}
            value={form.targetPrice}
            onChange={(e) => setField("targetPrice", e.target.value)}
            placeholder="Optional"
          />
          <Input
            label="Delivery Pincode"
            required
            value={form.pincode}
            onChange={(e) => setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            error={errors.pincode}
            placeholder="e.g. 400001"
          />
        </div>
      </div>

      <div>
        <p className="text-p3 font-heading font-medium text-pneutral-900 mb-4">Contact details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            required
            value={form.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            error={errors.fullName}
            placeholder="Your name"
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
            required
            containerClassName="sm:col-span-2"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="flex flex-col gap-0 w-full">
        <label className="font-heading font-medium text-[16px] leading-6 text-pneutral-900">
          Message to Seller
        </label>
        <textarea
          rows={3}
          value={form.message}
          onChange={(e) => setField("message", e.target.value)}
          placeholder="Any specific requirements, e.g. batch preference, delivery timeline..."
          className="w-full border outline-none transition-all duration-200 px-4 py-3 text-base rounded-lg border-pneutral-300 text-pneutral-800 bg-white focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300 resize-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="filled"
          size="lg"
          label={submitting ? "Submitting..." : "Submit Request"}
          disabled={submitting}
        />
      </div>
    </form>
  );
}
