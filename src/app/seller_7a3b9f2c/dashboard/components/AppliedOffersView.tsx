import React from "react";
import { Trash2, Gift } from "lucide-react";

export interface AppliedOffersViewProps {
  additionalDiscounts: any[];
  specialSchemes: any[];
  productName?: string;
  onEditDiscount?: () => void;
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
    <div className="col-span-2 flex flex-col gap-[12px] w-full mt-4">
      {/* APPLIED ADDITIONAL DISCOUNTS */}
      {visibleDiscounts.length > 0 && (
        <div className="flex flex-col gap-[12px] w-full">
          <h3 className="font-heading font-semibold text-[18px] leading-[24px] text-pneutral-900">
            Applied Discount Slabs
          </h3>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #C0C1BE" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE", width: "150.33px" }}>Min Qty</th>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE", width: "150.33px" }}>Discount (%)</th>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE", width: "150.33px" }}>Start date</th>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE", width: "150.33px" }}>End Date</th>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE", width: "150.33px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {additionalDiscounts.map((d, index) => {
                  if ((d.displayOffer ?? d.isSelected) === false) return null;
                  return (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#F8F8F9" : "#EAEAE9" }}>
                      <td className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.02em", textAlign: "center", border: "1px solid #C0C1BE" }}>{d.minimumPurchaseQuantity}</td>
                      <td className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.02em", textAlign: "center", border: "1px solid #C0C1BE" }}>{d.additionalDiscountPercentage}%</td>
                      <td className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.02em", textAlign: "center", border: "1px solid #C0C1BE" }}>{d.effectiveStartDate ? new Date(d.effectiveStartDate).toLocaleDateString('en-GB') : "Ongoing"}</td>
                      <td className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.02em", textAlign: "center", border: "1px solid #C0C1BE" }}>{d.effectiveEndDate ? new Date(d.effectiveEndDate).toLocaleDateString('en-GB') : "Ongoing"}</td>
                      <td className="px-4 py-3" style={{ border: "1px solid #C0C1BE" }}>
                        <div className="flex justify-center items-center gap-3 relative">
                          {onEditDiscount && (
                            <img
                              src="/icons/EditIcon.svg"
                              alt="edit"
                              className="cursor-pointer relative"
                              style={{ width: "16.88px", height: "16.88px", top: "1.25px", left: "1.88px" }}
                              onClick={onEditDiscount}
                            />
                          )}
                          {onDeleteDiscount && (
                            <img
                              src="/icons/DeleteIcon.svg"
                              alt="delete"
                              className="relative cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ width: "14.93px", height: "17.52px", top: "1.24px", left: "2.54px" }}
                              onClick={() => onDeleteDiscount(index)}
                            />
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
        <div className="flex flex-col gap-[12px] w-full mt-2">
          <h3 className="font-heading font-semibold text-[18px] leading-[24px] text-pneutral-900">
            Applied Special Offers & Promotional Schemes
          </h3>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #C0C1BE" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE", width: "150px" }}>Name</th>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE" }}>Type</th>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE", width: "130px" }}>Start date</th>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE", width: "130px" }}>End Date</th>
                  <th className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: "14px", lineHeight: "20px", textAlign: "center", border: "1px solid #C0C1BE", width: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {specialSchemes.map((scheme, index) => {
                  if ((scheme.displayOfferScheme ?? scheme.isSelected) === false) return null;
                  return (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#F8F8F9" : "#EAEAE9" }}>
                      <td className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.02em", textAlign: "center", border: "1px solid #C0C1BE" }}>{scheme.schemeName || "Special Scheme"}</td>
                      <td className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.02em", textAlign: "center", border: "1px solid #C0C1BE" }}>
                        <div>Buy {scheme.buyQuantity} Get {scheme.freeQuantity} Free</div>
                        <div className="text-gray-500 text-xs">({scheme.schemeType || "Special Offer"})</div>
                      </td>
                      <td className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.02em", textAlign: "center", border: "1px solid #C0C1BE" }}>{scheme.effectiveStartDate ? new Date(scheme.effectiveStartDate).toLocaleDateString('en-GB') : "Ongoing"}</td>
                      <td className="px-4 py-3" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.02em", textAlign: "center", border: "1px solid #C0C1BE" }}>{scheme.effectiveEndDate ? new Date(scheme.effectiveEndDate).toLocaleDateString('en-GB') : "Ongoing"}</td>
                      <td className="px-4 py-3" style={{ border: "1px solid #C0C1BE" }}>
                        <div className="flex justify-center items-center gap-3 relative">
                          {onEditScheme && (
                            <img
                              src="/icons/EditIcon.svg"
                              alt="edit"
                              className="cursor-pointer relative"
                              style={{ width: "16.88px", height: "16.88px", top: "1.25px", left: "1.88px" }}
                              onClick={() => onEditScheme(index)}
                            />
                          )}
                          {!hideDeleteScheme && onDeleteScheme && (
                            <img
                              src="/icons/DeleteIcon.svg"
                              alt="delete"
                              className="relative cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ width: "14.93px", height: "17.52px", top: "1.24px", left: "2.54px" }}
                              onClick={() => onDeleteScheme(index)}
                            />
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
