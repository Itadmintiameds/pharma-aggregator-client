"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { downloadProductImage } from "@/src/utils/downloadImage";

interface ProductImageGalleryProps {
  images: string[];
  placeholderImage: string;
  /** Show at most this many images (the product form allows five). */
  max?: number;
  className?: string;
}

/**
 * Compact product image viewer: one small preview plus a row of clickable thumbnails.
 * Replaces the old five-wide grid of ~270px photos, which pushed the product details far down the page.
 */
export default function ProductImageGallery({ images, placeholderImage, max = 5, className = "" }: ProductImageGalleryProps) {
  const shown = images.slice(0, max);
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, Math.max(0, shown.length - 1));
  const current = shown[index] ?? placeholderImage;

  const onImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = placeholderImage;
  };

  return (
    <div className={`w-fit max-w-full rounded-xl border border-neutral-200 bg-white p-3 ${className}`}>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-sm font-medium text-pneutral-900">Product Images</p>
        <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[11px] font-semibold text-secondary-800">
          {shown.length}
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-[#F5F5F5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt={`Product image ${index + 1}`} className="h-full w-full object-contain" onError={onImageError} />
          {index === 0 && shown.length > 0 && (
            <span className="absolute left-2 top-2 rounded bg-primary-600 px-1.5 py-0.5 text-[11px] font-medium text-white">
              Primary
            </span>
          )}
          {shown.length > 0 && (
            <button
              type="button"
              aria-label="Download image"
              title="Download image"
              onClick={() => downloadProductImage(current, `product-image-${index + 1}.jpg`)}
              className="absolute bottom-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
            >
              <Download size={14} className="text-neutral-900" />
            </button>
          )}
        </div>

        {/* Thumbnails */}
        {shown.length > 1 && (
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-[11px] text-neutral-500">Click a thumbnail to preview it</p>
            <div role="listbox" aria-label="Product images" className="flex max-w-[460px] flex-wrap gap-2">
            {shown.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                role="option"
                aria-selected={idx === index}
                aria-label={`Show image ${idx + 1}`}
                onClick={() => setSelected(idx)}
                className={`h-[72px] w-[72px] shrink-0 cursor-pointer overflow-hidden rounded-md border bg-[#F5F5F5] transition-colors ${
                  idx === index ? "border-primary-600 ring-2 ring-primary-200" : "border-neutral-200 hover:border-primary-400"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="h-full w-full object-cover" onError={onImageError} />
              </button>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
