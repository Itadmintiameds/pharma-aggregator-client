"use client";

import React from "react";
import CommonModal from "./CommonModal";
import Image from "next/image";

interface Props {
  onClose: () => void;
  onViewProduct: () => void;
  onContinueEditing: () => void;
  onBackToDashboard: () => void;
}

const UpdateSuccessModal = ({
  onClose,
  onViewProduct,
  onContinueEditing, 
  onBackToDashboard,
}: Props) => {
  return (
    <CommonModal onClose={onClose} width="w-[520px]">
      <div className="flex flex-col items-center text-center gap-4">

        {/* Icon */}
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center">
  <Image
    src="/icons/updatesuccess.png"
    alt="success"
    width={80}
    height={80}
    className="object-contain"
  />
</div>

        {/* Title */}
        <h2 className="text-h4 font-bold text-neutral-900">
          Product Updated Successfully!
        </h2>

        {/* Description */}
        <p className="text-neutral-700 text-p5">
          Your product has been updated and is now live on the platform
        </p>

        {/* Primary Button */}
        <button
          onClick={onViewProduct}
          className="w-full bg-primary-900 h-12 rounded-lg text-white py-3 font-semibold mt-2"
        >
          View Product
        </button>

        {/* Secondary Buttons */}
        <div className="flex gap-4 w-full mt-2">
          <button
            onClick={onContinueEditing}
            className="w-1/2 border-2 border-neutral-200 py-3 rounded-xl font-medium text-neutral-900"
          >
            Continue Editing
          </button>

          <button
            onClick={onBackToDashboard}
            className="w-1/2 border-2 border-primary-900 text-primary-900 py-3 rounded-xl font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </CommonModal>
  );
};

export default UpdateSuccessModal;