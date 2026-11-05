"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  SpecialOffersDrawer,
  emptySpecialDiscountRow,
  isOfferRowValid,
  offerRowsToPayload,
  type OfferRules,
  type SpecialDiscountRow,
} from "./StockUpdateModal";
import { replaceBatchOffers } from "@/src/services/product/StockService";

// The fields of a saved offer this drawer needs. Matches what product-service returns
// (additionalDiscounts on a batch); everything is optional because older rows may lack some.
export interface SavedBatchOffer {
  minimumPurchaseQuantity?: number;
  additionalDiscountPercentage?: number;
  displayOffer?: boolean | null;
  effectiveStartDate?: string | null;
  effectiveStartTime?: string | null;
  effectiveEndDate?: string | null;
  effectiveEndTime?: string | null;
}

interface BatchOffersDrawerProps {
  productId: string;
  pricingId: string;
  offers: SavedBatchOffer[];
  // The batch's regular discount and minimum order quantity, which an offer must beat / exceed.
  rules?: OfferRules;
  onClose: () => void;
  // Called after a successful save so the page can reload the product.
  onSaved: () => void;
}

// A saved offer as an editable row. An offer that has dates but no times (e.g. from a bulk import) means
// "from the start of the first day through the end of the last day", so those times are pre-filled.
const toRow = (o: SavedBatchOffer): SpecialDiscountRow => {
  const hasWindow = !!(o.effectiveStartDate || o.effectiveEndDate);
  return {
    minimumPurchaseQuantity: o.minimumPurchaseQuantity != null ? String(o.minimumPurchaseQuantity) : "",
    percentage: o.additionalDiscountPercentage != null ? String(o.additionalDiscountPercentage) : "",
    displayOffer: o.displayOffer !== false,
    alwaysActive: !hasWindow,
    startDate: o.effectiveStartDate ?? "",
    startTime: o.effectiveStartTime ? o.effectiveStartTime.slice(0, 5) : o.effectiveStartDate ? "00:00" : "",
    endDate: o.effectiveEndDate ?? "",
    endTime: o.effectiveEndTime ? o.effectiveEndTime.slice(0, 5) : o.effectiveEndDate ? "23:59" : "",
    fromServer: true,
  };
};

const errorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    return data?.data?.message || data?.message || "Could not save the offers. Please try again.";
  }
  return error instanceof Error ? error.message : "Could not save the offers. Please try again.";
};

/**
 * Add, edit, time-limit or remove the quantity offers of one batch, straight from the product page
 * (no stock change needed). Saving replaces the batch's whole offer list.
 */
export default function BatchOffersDrawer({ productId, pricingId, offers, rules, onClose, onSaved }: BatchOffersDrawerProps) {
  const [rows, setRows] = useState<SpecialDiscountRow[]>(() =>
    offers.length > 0 ? offers.map(toRow) : [emptySpecialDiscountRow()]
  );
  const saving = useRef(false);

  const handleSave = async () => {
    if (saving.current) return;
    // A row left completely blank is just an unused form; anything else must be valid.
    const filled = rows.filter((row) => row.percentage.trim() !== "" || row.minimumPurchaseQuantity.trim() !== "");
    if (!filled.every((row) => isOfferRowValid(row, rules))) {
      toast.error("Fix the highlighted offer details before saving.");
      return;
    }

    saving.current = true;
    try {
      await replaceBatchOffers(productId, pricingId, offerRowsToPayload(filled));
      toast.success(filled.length > 0 ? "Special offers saved." : "Special offers removed.");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      saving.current = false;
    }
  };

  const filledRows = rows.filter((row) => row.percentage.trim() !== "" || row.minimumPurchaseQuantity.trim() !== "");

  return (
    <SpecialOffersDrawer
      rows={rows}
      isValid={filledRows.every((row) => isOfferRowValid(row, rules))}
      rules={rules}
      onAddRow={() => setRows((r) => [...r, emptySpecialDiscountRow()])}
      onRemoveRow={(index) => setRows((r) => r.filter((_, i) => i !== index))}
      onUpdateRow={(index, patch) =>
        setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)))
      }
      onCancel={onClose}
      onSave={handleSave}
    />
  );
}
