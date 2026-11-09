"use client";

import React from "react";

type ProductImageUploadProps = {
  title?: string;
  required?: boolean;
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  existingImages?: string[];
  setExistingImages?: React.Dispatch<React.SetStateAction<string[]>>;
  error?: string;
  setErrors?: React.Dispatch<React.SetStateAction<any>>;
  isReadOnly?: boolean;
  mode?: "create" | "edit" | "view";
  maxFiles?: number;
  inputId?: string;
};

export default function ProductImageUpload({
  title = "Product Photos",
  required = false,
  images,
  setImages,
  existingImages = [],
  setExistingImages,
  error,
  setErrors,
  isReadOnly = false,
  mode = "create",
  maxFiles = 5,
  inputId = "fileInput",
}: ProductImageUploadProps) {
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    const oversizedFiles = selectedFiles.filter((f) => f.size > MAX_FILE_SIZE);
    const newFiles = selectedFiles.filter((f) => f.size <= MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      setErrors?.((prev: any) => ({
        ...prev,
        images: `${oversizedFiles.map((f) => f.name).join(", ")} exceed${oversizedFiles.length === 1 ? "s" : ""} the 2 MB size limit`,
      }));
    }

    if (newFiles.length === 0) {
      e.target.value = "";
      return;
    }

    const totalFiles = images.length + existingImages.length + newFiles.length;

    if (totalFiles > maxFiles) {
      setErrors?.((prev: any) => ({
        ...prev,
        images: `Maximum ${maxFiles} images are allowed`,
      }));

      const remainingSlots = maxFiles - (images.length + existingImages.length);

      const allowedFiles = newFiles.slice(0, remainingSlots);

      if (allowedFiles.length > 0) {
        setImages((prev) => [...prev, ...allowedFiles]);
      }

      return;
    }

    if (oversizedFiles.length === 0) {
      setErrors?.((prev: any) => ({
        ...prev,
        images: "",
      }));
    }

    setImages((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  return (
    <div className="relative border border-neutral-200 rounded-xl p-6 mt-6 bg-white">
      <div className="text-pneutral-800 text-h6 font-medium font-heading">
        {title}
        {required && (
          <span className="text-warning-500 text-h6 font-medium ml-2">*</span>
        )}
      </div>

      <div
        className="w-full h-40 bg-pneutral-50 flex items-center justify-center rounded-lg cursor-pointer"
        onClick={() => {
          if (!isReadOnly || mode === "edit") {
            document.getElementById(inputId)?.click();
          }
        }}
      >
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          disabled={isReadOnly && mode !== "edit"}
          onChange={handleFileChange}
        />

        <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg">
          <div className="w-285 h-34.5 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center justify-center">
              <img
                src="/icons/FolderIcon.svg"
                alt="upload"
                className="w-10 h-10 rounded-md object-cover"
              />

              <div className="text-label-l3 font-normal text-pneutral-900 mt-4">
                Choose a file or drag & drop it here
              </div>

              <div className="text-label-l2 font-normal text-pneutral-400 mt-1">
                or click to browse JPEG, PNG, and Pdf
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

      <div className="flex gap-4">
        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {existingImages.map((img, index) => (
              <div key={index} className="relative w-24 h-24 flex-shrink-0">
                <img
                  src={img}
                  alt="preview"
                  className="w-full h-full object-cover rounded-md border border-[#D5D5D4]"
                />

                {(!isReadOnly || mode === "edit") && (
                  <button
                    type="button"
                    onClick={() =>
                      setExistingImages?.(
                        existingImages.filter((_, i) => i !== index),
                      )
                    }
                    className="absolute top-1 right-1 text-[#1E1E1D] cursor-pointer text-xs px-1 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {images.map((file, index) => (
              <div key={index} className="relative w-24 h-24 flex-shrink-0">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-full h-full object-cover rounded-md border border-[#D5D5D4]"
                />

                {(!isReadOnly || mode === "edit") && (
                  <button
                    type="button"
                    onClick={() =>
                      setImages(images.filter((_, i) => i !== index))
                    }
                    className="absolute top-1 right-1 w-5 h-5 bg-[#1E1E1D] text-white rounded-full flex items-center justify-center cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
