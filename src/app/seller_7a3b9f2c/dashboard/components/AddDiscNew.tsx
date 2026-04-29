import React, { useState } from "react";

const AddDiscNew = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-h6 font-normal">Additional Discount</span>
          <span className="text-label-l2 font-normal">(Quantity-based)</span>
        </div>
        <div className="text-label-l2 font-normal">
          Create a time-based discount for bulk purchases
        </div>
        <div className="mt-0.5 border-b border-[#E5E7EB]"></div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-3">
        <span className="text-label-l3 font-normal">Always Active</span>

        <span>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-300 ${
              enabled ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                enabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="text-label-l4 font-semibold">Purchase Conditions</div>
        <div>
          <label htmlFor="minimumPurchaseQuantity" className="text-label-l3 font-semibold text-[#5A5B58]">Minimum Purchase Quantity</label>
          {/* <input type="text" name="minimumPurchaseQuantity" className="w-113.25 h-13 border"/> */}
        </div>
      </div>
    </>
  );
};

export default AddDiscNew;
