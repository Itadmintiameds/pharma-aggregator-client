import React from "react";
import { Trash2, Gift } from "lucide-react";

export interface AppliedOffersViewProps {
  additionalDiscounts: any[];
  specialSchemes: any[];
  productName?: string;
  onEditDiscount?: (index: number) => void;
  onEditScheme?: (index: number) => void;
  onDeleteDiscount?: (index: number) => void;
  onDeleteScheme?: (index: number) => void;
  hideDeleteScheme?: boolean;
  isEditMode?: boolean;
}

const AppliedOffersView: React.FC<AppliedOffersViewProps> = ({
  additionalDiscounts,
  specialSchemes,
  productName,
  onEditDiscount,
  onEditScheme,
  onDeleteDiscount,
  onDeleteScheme,
  hideDeleteScheme,
  isEditMode,
}) => {
  const visibleDiscounts = additionalDiscounts.filter((d: any) => (d.displayOffer ?? d.isSelected) !== false);
  const visibleSchemes = specialSchemes.filter((s: any) => (s.displayOfferScheme ?? s.isSelected) !== false);

  if (visibleDiscounts.length === 0 && visibleSchemes.length === 0) {
    return null;
  }

  return (
    <div className="col-span-2 flex flex-col gap-3 w-full mt-3">
      {/* APPLIED ADDITIONAL DISCOUNTS */}
      {visibleDiscounts.length > 0 && (
        <div className="flex flex-col gap-2 w-full">
          <h3 className="text-sm font-bold text-neutral-900">
            Applied Discount Slabs
          </h3>
          <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200" style={{ width: "150.33px" }}>Min Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200" style={{ width: "150.33px" }}>Discount (%)</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200" style={{ width: "150.33px" }}>Start date</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200" style={{ width: "150.33px" }}>End Date</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200" style={{ width: "150.33px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {additionalDiscounts.map((d, index) => {
                  if ((d.displayOffer ?? d.isSelected) === false) return null;
                  return (
                    <tr key={index} className="hover:bg-neutral-50/60">
                      <td className="px-3 py-2 text-center text-xs text-neutral-800 border-b border-neutral-100">{d.minimumPurchaseQuantity}</td>
                      <td className="px-3 py-2 text-center text-xs text-neutral-800 border-b border-neutral-100">{d.additionalDiscountPercentage}%</td>
                      <td className="px-3 py-2 text-center text-xs text-neutral-800 border-b border-neutral-100">{d.effectiveStartDate ? new Date(d.effectiveStartDate).toLocaleDateString('en-GB') : "Ongoing"}</td>
                      <td className="px-3 py-2 text-center text-xs text-neutral-800 border-b border-neutral-100">{d.effectiveEndDate ? new Date(d.effectiveEndDate).toLocaleDateString('en-GB') : "Ongoing"}</td>
                      <td className="px-3 py-1.5 border-b border-neutral-100">
                        <div className="flex justify-center items-center gap-2">
                          {onEditDiscount && (
                            <button type="button" aria-label="Edit" onClick={() => onEditDiscount(index)} className="p-1.5 rounded-md hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"><img src="/icons/EditIcon.svg" alt="" className="w-4 h-4" /></button>
                          )}
                          {onDeleteDiscount && (
                            <button type="button" aria-label="Delete" onClick={() => onDeleteDiscount(index)} className="p-1.5 rounded-md hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"><img src="/icons/DeleteIcon.svg" alt="" className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPLIED SPECIAL SCHEMES */}
      {visibleSchemes.length > 0 && (
        <div className="flex flex-col gap-2 w-full">
          <h3 className="text-sm font-bold text-neutral-900">
            Applied Special Offers & Promotional Schemes
          </h3>
          <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200" style={{ width: "150px" }}>Name</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200">Type</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200" style={{ width: "130px" }}>Start date</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200" style={{ width: "130px" }}>End Date</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border-b border-neutral-200" style={{ width: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {specialSchemes.map((scheme, index) => {
                  if ((scheme.displayOfferScheme ?? scheme.isSelected) === false) return null;
                  return (
                    <tr key={index} className="hover:bg-neutral-50/60">
                      <td className="px-3 py-2 text-center text-xs text-neutral-800 border-b border-neutral-100">{scheme.schemeName || "Special Scheme"}</td>
                      <td className="px-3 py-2 text-center text-xs text-neutral-800 border-b border-neutral-100">
                        <div>Buy {scheme.buyQuantity} Get {scheme.freeQuantity} Free</div>
                        <div className="text-neutral-500 text-[11px]">({scheme.schemeType || "Special Offer"})</div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-neutral-800 border-b border-neutral-100">{scheme.effectiveStartDate ? new Date(scheme.effectiveStartDate).toLocaleDateString('en-GB') : "Ongoing"}</td>
                      <td className="px-3 py-2 text-center text-xs text-neutral-800 border-b border-neutral-100">{scheme.effectiveEndDate ? new Date(scheme.effectiveEndDate).toLocaleDateString('en-GB') : "Ongoing"}</td>
                      <td className="px-3 py-1.5 border-b border-neutral-100">
                        <div className="flex justify-center items-center gap-2">
                          {onEditScheme && (
                            <button type="button" aria-label="Edit" onClick={() => onEditScheme(index)} className="p-1.5 rounded-md hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"><img src="/icons/EditIcon.svg" alt="" className="w-4 h-4" /></button>
                          )}
                          {!hideDeleteScheme && onDeleteScheme && (
                            <button type="button" aria-label="Delete" onClick={() => onDeleteScheme(index)} className="p-1.5 rounded-md hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"><img src="/icons/DeleteIcon.svg" alt="" className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppliedOffersView;
