"use client";

import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function PincodeLookup() {
  const [form, setForm] = useState({
    pincode: "",
    state: "",
    district: "",
    postOffice: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePincodeChange = async (value: string) => {
    const pin = value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      pincode: pin,
    }));

    setError("");

    if (pin.length !== 6) {
      setForm((prev) => ({
        ...prev,
        state: "",
        district: "",
        postOffice: "",
      }));
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`
      );

      const data = await res.json();

      if (
        data[0].Status !== "Success" ||
        !data[0].PostOffice?.length
      ) {
        throw new Error();
      }

      const po = data[0].PostOffice[0];

      setForm((prev) => ({
        ...prev,
        state: po.State,
        district: po.District,
        postOffice: po.Name,
      }));
    } catch {
      setError("Invalid PIN Code");
      setForm((prev) => ({
        ...prev,
        state: "",
        district: "",
        postOffice: "",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-header text-center bg-primary text-white rounded-top-4">
          <h4 className="mb-0">PIN Code Address Lookup</h4>
          <small>Auto-fetch State & District</small>
        </div>

        <div className="card-body p-4">
          {/* PINCODE */}
          <div className="mb-3">
            <label className="form-label">
              Pincode <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              className="form-control"
              placeholder="Enter 6 digit PIN"
              value={form.pincode}
              onChange={(e) =>
                handlePincodeChange(e.target.value)
              }
            />
            {loading && (
              <small className="text-muted">
                Fetching address details...
              </small>
            )}
            {error && (
              <small className="text-danger">{error}</small>
            )}
          </div>

          {/* POST OFFICE */}
          <div className="mb-3">
            <label className="form-label">Post Office</label>
            <input
              type="text"
              className="form-control"
              value={form.postOffice}
              disabled
            />
          </div>

          {/* DISTRICT */}
          <div className="mb-3">
            <label className="form-label">District</label>
            <input
              type="text"
              className="form-control"
              value={form.district}
              disabled
            />
          </div>

          {/* STATE */}
          <div className="mb-3">
            <label className="form-label">State</label>
            <input
              type="text"
              className="form-control"
              value={form.state}
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  );
}
