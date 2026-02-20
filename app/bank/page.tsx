"use client";
import React, { useState } from "react";

const IFSC_API = "https://ifsc.razorpay.com";
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function BankDetails() {
  const [form, setForm] = useState({
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
    bankName: "",
    branch: "",
    bankState: "",
    bankDistrict: ""
  });

  const [ifscError, setIfscError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleIfscChange = async (value: string) => {
    const ifsc = value.toUpperCase();
    setForm(prev => ({ ...prev, ifscCode: ifsc }));
    setIfscError("");

    // Reset auto-filled fields if IFSC incomplete
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
      if (!res.ok) throw new Error("Invalid IFSC");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Bank Details:", form);
    alert("Bank details submitted successfully!");
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "600px" }}>
      <div className="card p-4 shadow-sm">
        <h4 className="mb-4">Bank Details</h4>

        <form onSubmit={handleSubmit}>
          {/* Account Number */}
          <div className="mb-3">
            <label className="form-label">Account Number</label>
            <input
              type="text"
              name="accountNumber"
              className="form-control"
              value={form.accountNumber}
              onChange={handleChange}
              placeholder="Enter account number"
              required
            />
          </div>

          {/* Account Holder Name */}
          <div className="mb-3">
            <label className="form-label">Account Holder Name</label>
            <input
              type="text"
              name="accountHolderName"
              className="form-control"
              value={form.accountHolderName}
              onChange={handleChange}
              placeholder="As per bank records"
              required
            />
            <small className="text-muted">
              Name must exactly match bank records
            </small>
          </div>

          {/* IFSC Code */}
          <div className="mb-3">
            <label className="form-label">IFSC Code</label>
            <input
              type="text"
              name="ifscCode"
              className="form-control"
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

          {/* Bank Name */}
          <div className="mb-3">
            <label className="form-label">Bank Name</label>
            <input
              type="text"
              className="form-control"
              value={form.bankName}
              disabled
            />
          </div>

          {/* Branch */}
          <div className="mb-3">
            <label className="form-label">Branch</label>
            <input
              type="text"
              className="form-control"
              value={form.branch}
              disabled
            />
          </div>

          {/* State */}
          <div className="mb-3">
            <label className="form-label">State</label>
            <input
              type="text"
              className="form-control"
              value={form.bankState}
              disabled
            />
          </div>

          {/* District */}
          <div className="mb-3">
            <label className="form-label">District</label>
            <input
              type="text"
              className="form-control"
              value={form.bankDistrict}
              disabled
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Submit Bank Details
          </button>
        </form>
      </div>
    </div>
  );
}
