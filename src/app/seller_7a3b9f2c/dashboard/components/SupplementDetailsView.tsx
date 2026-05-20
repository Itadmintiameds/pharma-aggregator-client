import React, { useState } from "react";
import { PiSealCheckLight } from "react-icons/pi";
import { FileText, ExternalLink, Edit2, X } from "lucide-react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

export interface CertificateDocument {
  certificationId: number;
  certificateUrl: string;
  certificationName?: string;
  label?: string;
  productCertificateDocumentId?: number;
}

interface SupplementDetailsViewProps {
  productName?: string | null;
  productDescription?: string | null;
  warningsPrecautions?: string | null;
  displayImages?: string[];
  suppAttr?: any | null;
  storageConditionName?: string | null;
  brochureUrl?: string | null;
  placeholderImage?: string;
  manufacturerName?: string | null;
  onEdit?: () => void;
  onClose?: () => void;
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

const isValidUrl = (url?: string | null) => {
  if (!url) return false;
  const t = url.trim().toUpperCase();
  return !["", "PENDING", "NOT_UPLOADED"].includes(t);
};

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */

const FieldRow = ({
  label,
  value,
  required = true,
  multiline = false,
  valueNode,
}: {
  label: string;
  value?: string | number | null;
  required?: boolean;
  multiline?: boolean;
  valueNode?: React.ReactNode;
}) => (
  <div className={`grid grid-cols-2 gap-4 px-4 py-3 border-b border-pneutral-200 ${multiline ? "items-start" : "items-center"}`}>
    <div className="flex items-start gap-1 flex-1 min-w-0">
      <span className="text-pneutral-500 text-base font-heading font-medium leading-6 break-words">{label}</span>
      {required && <span className="text-warning-500 text-base font-heading font-medium leading-6 shrink-0">*</span>}
    </div>
    {valueNode ? (
      <div className="flex-1 flex justify-end">{valueNode}</div>
    ) : (
      <p className="text-pneutral-800 text-base font-body font-normal leading-6 break-words text-right flex-1">
        {value ?? "—"}
      </p>
    )}
  </div>
);

const RadioDisplay = ({ value }: { value?: string | null }) => {
  if (!value) return <p className="text-pneutral-800 text-base font-body font-normal leading-6 break-words text-right flex-1">—</p>;
  return (
    <div className="flex items-center gap-2 justify-start flex-1">
      <div className="w-[18px] h-[18px] rounded-full border-2 border-primary-900 flex items-center justify-center shrink-0">
        <div className="w-[10px] h-[10px] rounded-full bg-primary-900" />
      </div>
      <span className="text-pneutral-800 text-base font-body font-normal leading-6 break-words text-left flex-1">{value}</span>
    </div>
  );
};

const FullWidthBlock = ({
  label,
  value,
  required = true,
}: {
  label: string;
  value?: string | null;
  required?: boolean;
}) => (
  <div className="px-4 py-3 border-b border-pneutral-200 flex flex-col gap-3">
    <div className="flex items-center gap-1">
      <span className="text-pneutral-500 text-base font-heading font-medium leading-6 break-words">{label}</span>
      {required && <span className="text-warning-500 text-base font-heading font-medium leading-6 shrink-0">*</span>}
    </div>
    <p className="text-pneutral-800 text-base font-body font-normal leading-6 break-words whitespace-pre-wrap">
      {value ?? "—"}
    </p>
  </div>
);

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */

export default function SupplementDetailsView({
  productName,
  productDescription,
  warningsPrecautions,
  displayImages = [],
  suppAttr,
  storageConditionName,
  placeholderImage = "/assets/images/SellerMed.jpg",
  manufacturerName,
  brochureUrl,
  onEdit,
  onClose,
}: SupplementDetailsViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);

  if (!suppAttr) return null;

  const displayNetQty = suppAttr.netQuantityValue != null && suppAttr.netQuantityValue !== "" && (suppAttr.netQuantityUnitName || suppAttr.netQuantityUnitSymbol || suppAttr.netQuantityUnit)
    ? `${suppAttr.netQuantityValue} ${suppAttr.netQuantityUnitName || suppAttr.netQuantityUnitSymbol || suppAttr.netQuantityUnit}`
    : suppAttr.netQuantity || "—";

  const displayServingSize = suppAttr.servingSize != null && suppAttr.servingSize !== ""
    ? (suppAttr.servingSizeUnitName || suppAttr.servingSizeUnitSymbol || suppAttr.servingSizeUnit)
      ? `${suppAttr.servingSize} ${suppAttr.servingSizeUnitName || suppAttr.servingSizeUnitSymbol || suppAttr.servingSizeUnit}`
      : String(suppAttr.servingSize)
    : "—";

  const imagesToShow = displayImages.length > 0 ? displayImages : [placeholderImage];

  /* ── Resolve cert docs ── */
  const certDocs: CertificateDocument[] = (suppAttr.certificateDocuments ?? []).filter((c: any) => isValidUrl(c.certificateUrl));

  /* ── Resolve Brochure ── */
  const resolvedBrochureUrl = isValidUrl(brochureUrl)
    ? brochureUrl
    : isValidUrl(suppAttr?.brochurePath)
      ? suppAttr.brochurePath
      : null;

  return (
    <div className="bg-base-white min-h-screen font-heading">

      {/* ── Page Header ── */}
      {(onEdit || onClose) && (
        <div className="flex items-center justify-start gap-3 pt-5 pb-4 border-b border-pneutral-100 mb-6">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-2 px-5 py-2 bg-primary-900 text-base-white border-none rounded-lg text-sm font-heading font-semibold leading-5 cursor-pointer"
            >
              <Edit2 size={14} /> Edit
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2 bg-base-white text-warning-500 border-[1.5px] border-warning-500 rounded-lg text-sm font-heading font-semibold leading-5 cursor-pointer"
            >
              <X size={14} /> Close
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">

        {/* ── Section header ── */}
        <div className="py-2 border-b border-pneutral-200">
          <h2 className="text-pneutral-900 text-[28px] font-heading font-medium leading-9">
            Product Details
          </h2>
        </div>

        {/* ── Product Images ── */}
        <div className="flex flex-col gap-4">
          <p className="text-pneutral-900 text-[18px] font-body font-semibold leading-6">
            Product Images
          </p>
          <div className="p-3 bg-secondary-50 rounded-xl outline outline-1 outline-secondary-300 -outline-offset-1 flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-4">
              {imagesToShow.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative h-[276px] overflow-hidden rounded-xl cursor-pointer shadow-md${
                    idx === selectedImageIndex ? " outline outline-2 outline-secondary-500 -outline-offset-1" : ""
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Product image ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={img.startsWith("http")}
                    onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }}
                  />
                  {idx === 0 && (
                    <div className="absolute left-[10px] top-[10px] px-2 py-1 bg-secondary-500 rounded-[4px]">
                      <span className="text-white text-xs font-body font-semibold leading-[18px]">Primary</span>
                    </div>
                  )}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 4 - imagesToShow.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-[276px] rounded-xl bg-pneutral-50 shadow-sm" />
              ))}
            </div>
          </div>
        </div>

        {/* ── Two-column details ── */}
        <div className="flex gap-9 items-start">

          {/* LEFT COLUMN: BASIC & COMPOSITION */}
          <div className="flex-1 flex flex-col">
            <FieldRow label="Product Name" value={productName} multiline />
            <FieldRow label="Therapeutic Category" value={suppAttr.therapeuticCategoryName} />
            <FieldRow label="Therapeutic Subcategory" value={suppAttr.therapeuticSubCategoryName} />
            <FieldRow label="Brand Name" value={suppAttr.brandName} />
            <FieldRow label="Variant Name" value={suppAttr.variantName} required={false} />
            <FieldRow label="Dosage Form" value={suppAttr.dosageFormName} />
            <FieldRow label="Net Quantity" value={displayNetQty} />
            <FieldRow label="Serving Size" value={displayServingSize} />
            <FieldRow label="Strength / Composition" value={suppAttr.strength} />
            <FieldRow label="Active Ingredients" value={suppAttr.activeIngredients} multiline />
            <FieldRow label="Other Ingredients" value={suppAttr.otherIngredients} multiline />
            <FieldRow label="Intended Use / Health Benefit" value={suppAttr.intendedUse} multiline />

            {/* Nutritional Info Thumbnail */}
            <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-pneutral-200 items-start">
              <div className="flex items-start gap-1 flex-1 min-w-0">
                <span className="text-pneutral-500 text-base font-heading font-medium leading-6 break-words">Nutritional Information</span>
                <span className="text-warning-500 text-base font-heading font-medium leading-6 shrink-0">*</span>
              </div>
              <div className="flex-1 flex justify-end">
                {suppAttr.nutritionalInformationImageUrl ? (
                  <a href={suppAttr.nutritionalInformationImageUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={suppAttr.nutritionalInformationImageUrl}
                      alt="Nutritional Information"
                      className="w-20 h-20 object-cover rounded-lg border border-pneutral-200"
                    />
                  </a>
                ) : (
                  <p className="text-pneutral-800 text-base font-body font-normal leading-6 break-words text-right flex-1">
                    {suppAttr.nutritionalInformation ?? "—"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ATTRIBUTES & COMPLIANCE */}
          <div className="flex-1 flex flex-col">
            <FieldRow
              label="Age Group"
              value={
                suppAttr.ageGroupMastersDto && suppAttr.ageGroupMastersDto.length > 0
                  ? suppAttr.ageGroupMastersDto.map((ag: { ageGroupId: number; ageGroup: string }) => ag.ageGroup).join(", ")
                  : suppAttr.ageGroupName || "—"
              }
            />
            <FieldRow label="Gender" value={suppAttr.gender} />

            {/* Veg / Non-Veg Indicator */}
            <div className="px-4 py-3 border-b border-pneutral-200 flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <span className="text-pneutral-500 text-base font-heading font-medium leading-6 break-words">Veg / Non-Veg Indicator</span>
                <span className="text-warning-500 text-base font-heading font-medium leading-6 shrink-0">*</span>
              </div>
              <RadioDisplay value={suppAttr.vegOrNonVegIndicator} />
            </div>

            <FieldRow label="Allergen Information" value={suppAttr.allergenInformation || suppAttr.allergenInfo} multiline />
            <FieldRow label="Flavour" value={suppAttr.flavourName || suppAttr.flavour} />

            <FieldRow label="Storage Condition" value={storageConditionName} multiline />
            <FieldRow label="Manufacturer Name" value={manufacturerName} />

            {/* ── Uploaded Product Brochure ── */}
            <div className="px-4 pt-3 pb-2 border-b border-pneutral-200 flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <span className="text-pneutral-500 text-base font-heading font-medium leading-6 break-words">Uploaded Product Brochure</span>
                <span className="text-warning-500 text-base font-heading font-medium leading-6 shrink-0">*</span>
              </div>
              {resolvedBrochureUrl ? (
                <a
                  href={resolvedBrochureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-pneutral-50 rounded-lg no-underline"
                >
                  <FileText size={24} color="var(--pneutral-800)" />
                  <span className="text-pneutral-800 text-base font-body font-normal leading-[22px]">
                    {resolvedBrochureUrl.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-pneutral-50 rounded-lg">
                  <FileText size={24} color="var(--pneutral-800)" />
                  <span className="text-pneutral-500 text-base font-body font-normal leading-[22px]">No brochure uploaded</span>
                </div>
              )}
            </div>

            <FieldRow label="Country of Origin" value={suppAttr.countryName} />

            {/* Certifications Seals */}
            {certDocs.length > 0 && (
              <div className="px-4 py-3 border-b border-pneutral-200 flex flex-col gap-2">
                <div className="flex items-start gap-1">
                  <span className="text-pneutral-500 text-base font-heading font-medium leading-6 break-words">Certifications / Compliance</span>
                  <span className="text-warning-500 text-base font-heading font-medium leading-6 shrink-0">*</span>
                </div>
                <div className="flex flex-wrap gap-2 content-start">
                  {certDocs.map((cert) => (
                    <button
                      key={cert.certificationId}
                      type="button"
                      onClick={() => { setActiveCertDoc(cert); setShowCertModal(true); }}
                      className="flex items-center gap-2 px-2 py-1 bg-success-50 border-none rounded-lg cursor-pointer font-body text-base font-medium leading-6 text-success-900"
                    >
                      <PiSealCheckLight size={16} />
                      {cert.certificationName ?? cert.label ?? `Cert ${cert.certificationId}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <FieldRow label="Product Claims" value={suppAttr.productClaims} multiline />
          </div>
        </div>

        {/* ── DESCRIPTION & WARNINGS ── */}
        <div className="flex flex-col">
          <FullWidthBlock label="Product Description" value={productDescription} />
          <FullWidthBlock label="Warnings & Precautions" value={warningsPrecautions} />
        </div>
      </div>

      {/* ── Certificate Modal ── */}
      {showCertModal && activeCertDoc !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
          onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }}
        >
          <div
            className="bg-base-white rounded-2xl shadow-2xl w-full max-w-[672px] mx-4 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-pneutral-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-success-50 rounded-lg flex items-center justify-center">
                  <PiSealCheckLight size={20} color="var(--success-900)" />
                </div>
                <div>
                  <p className="text-pneutral-900 text-base font-heading font-semibold leading-[22px]">
                    {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
                  </p>
                  <p className="text-pneutral-500 text-xs font-body font-normal leading-[18px]">Certification Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeCertDoc.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-[6px] text-success-900 text-sm font-heading font-semibold leading-5 no-underline px-3 py-[6px] rounded-lg"
                >
                  <ExternalLink size={14} /> Open
                </a>
                <button
                  type="button"
                  onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }}
                  className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer text-pneutral-500 text-xl flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto bg-pneutral-50 p-4 flex items-center justify-center min-h-[400px]">
              {isImageUrl(activeCertDoc.certificateUrl) ? (
                <img
                  src={activeCertDoc.certificateUrl}
                  alt={activeCertDoc.certificationName ?? "Certificate"}
                  className="max-w-full max-h-[600px] object-contain rounded-lg"
                />
              ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
                <iframe
                  src={activeCertDoc.certificateUrl}
                  title="Certificate PDF"
                  className="w-full border-none rounded-lg h-[560px]"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 bg-success-50 rounded-2xl flex items-center justify-center">
                    <FileText size={32} color="var(--success-900)" />
                  </div>
                  <div className="text-center">
                    <p className="text-pneutral-900 text-base font-heading font-semibold leading-[22px] mb-2">
                      {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
                    </p>
                    <p className="text-pneutral-500 text-sm font-body font-normal leading-5 mb-4">
                      This file cannot be previewed in the browser.
                    </p>
                    <a
                      href={activeCertDoc.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-success-700 text-white text-sm font-heading font-semibold leading-5 px-5 py-[10px] rounded-lg no-underline"
                    >
                      <ExternalLink size={14} /> Open / Download
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {certDocs.length > 1 && (
              <div className="border-t border-pneutral-200 px-6 py-3 flex items-center gap-2 overflow-x-auto">
                <span className="text-pneutral-500 text-xs font-body font-normal leading-[18px] shrink-0">Other certs:</span>
                {certDocs
                  .filter((c) => c.certificationId !== activeCertDoc.certificationId)
                  .map((cert) => (
                    <button
                      key={cert.certificationId}
                      type="button"
                      onClick={() => setActiveCertDoc(cert)}
                      className="shrink-0 flex items-center gap-[6px] text-success-900 bg-success-50 text-xs font-body font-medium leading-[18px] px-3 py-[6px] rounded-full border-none cursor-pointer"
                    >
                      <PiSealCheckLight size={12} />
                      {cert.certificationName ?? cert.label ?? `Cert ${cert.certificationId}`}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
