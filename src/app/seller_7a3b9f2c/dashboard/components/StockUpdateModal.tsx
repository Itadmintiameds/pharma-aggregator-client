"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  PackageOpen,
} from "lucide-react";
import {
  addStock,
  getAvailableBatches,
  type BatchAvailability,
  type StockLedgerResponse,
  type SpecialDiscountPayload,
} from "@/src/services/product/StockService";
import { validateBatchNumber } from "@/src/services/product/PricingService";
import {
  getPackTypesByCategory,
  getPackTypeUnits,
} from "@/src/services/product/PackTypeService";
import { useConfirmClose } from "@/src/hooks/useConfirmClose";
import ConfirmCloseDialog from "@/src/components/common/ConfirmCloseDialog";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface SelectOption {
  value: string;
  label: string;
}

// One row of the repeatable "special discount" list on a new batch — each row becomes its
// own AdditionalDiscount record server-side (see StockService.SpecialDiscountPayload).
interface SpecialDiscountRow {
  minimumPurchaseQuantity: string;
  percentage: string;
  displayOffer: boolean;
}

const emptySpecialDiscountRow = (): SpecialDiscountRow => ({
  minimumPurchaseQuantity: "",
  percentage: "",
  displayOffer: true,
});

interface StockUpdateModalProps {
  open: boolean;
  onClose: () => void;
  productName?: string | null;
  productId?: string | null;
  packagingId?: string;
  categoryId?: number | null;
  onSuccess?: (result: StockLedgerResponse) => void;
}

type UpdateType = "existing" | "new";

interface SuccessResult {
  batchNumber: string;
  previousStock: number;
  addedStock: number;
  updatedStock: number;
}

const STEPS = [
  { n: 1, label: "Select Update Type" },
  { n: 2, label: "Update Details" },
  { n: 3, label: "Review & Confirm" },
];

const PURPLE = "var(--Colors-Brand-Primary-800, #6C12A9)";
const BORDER = "#D5D5D4";
const TEXT_DARK = "#1E1E1D";
const TEXT_GRAY = "#5A5B58";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoToDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function dateToIso(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Whole months between manufacturing and expiry dates (e.g. 15 Jan → 15 Jul = 6 months).
function monthsBetween(mfgIso: string, expIso: string): string {
  const mfg = isoToDate(mfgIso);
  const exp = isoToDate(expIso);
  if (!mfg || !exp || exp <= mfg) return "";
  let months =
    (exp.getFullYear() - mfg.getFullYear()) * 12 +
    (exp.getMonth() - mfg.getMonth());
  if (exp.getDate() < mfg.getDate()) months -= 1;
  return months > 0 ? String(months) : "";
}

function getBatchStatus(expiryDate?: string | null) {
  if (!expiryDate)
    return { label: "Active", bg: "#DCFCE7", color: "#15803D" };
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime()))
    return { label: "Active", bg: "#DCFCE7", color: "#15803D" };
  const monthsLeft =
    (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsLeft < 0) return { label: "Expired", bg: "#FEE2E2", color: "#B91C1C" };
  if (monthsLeft <= 6)
    return { label: "Near Expiry", bg: "#FEF3C7", color: "#92400E" };
  return { label: "Active", bg: "#DCFCE7", color: "#15803D" };
}

function extractErrorMessage(err: unknown): string {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    "Something went wrong. Please try again."
  );
}

export default function StockUpdateModal({
  open,
  onClose,
  productName,
  productId,
  packagingId,
  categoryId,
  onSuccess,
}: StockUpdateModalProps) {
  const [step, setStep] = useState(1);
  const [updateType, setUpdateType] = useState<UpdateType>("existing");

  const [batches, setBatches] = useState<BatchAvailability[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);

  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number | null>(
    null
  );
  const [addQuantity, setAddQuantity] = useState("");
  // Entry date / remarks (for the "restock an existing batch" flow) are collected for UX
  // parity with the design but the /stock/add API doesn't accept either for a restock —
  // dateOfStockEntry is a batch-creation-time attribute (see newBatch.dateOfStockEntry
  // below for the "create new batch" flow), and there's no remarks column — kept local-only.
  const [dateOfStockEntry, setDateOfStockEntry] = useState(todayIso());
  const [remarks, setRemarks] = useState("");

  const [newBatch, setNewBatch] = useState({
    batchLotNumber: "",
    manufacturingDate: "",
    expiryDate: "",
    quantity: "",
    mrp: "",
    sellingPrice: "",
    // Optional — discount %, shelf life, and stock-entry date. Special discounts (there can
    // be several) are tracked separately in the specialDiscounts state below.
    discountPercentage: "",
    shelfLifeMonths: "",
    dateOfStockEntry: todayIso(),
    // A brand-new batch always creates its own packaging/pack-size variant
    // alongside it (the /stock/add API accepts packagingDetails for this).
    packId: "",
    packTypeUnitId: "",
    unitPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
  });
  const [specialDiscounts, setSpecialDiscounts] = useState<SpecialDiscountRow[]>([]);
  // The sidebar edits a draft copy — nothing is committed to specialDiscounts (and thus the
  // submit payload) until "Save" is clicked; "Cancel"/closing the sidebar discards the draft.
  const [specialOffersOpen, setSpecialOffersOpen] = useState(false);
  const [draftSpecialDiscounts, setDraftSpecialDiscounts] = useState<
    SpecialDiscountRow[]
  >([]);
  const [batchNumberError, setBatchNumberError] = useState<string | null>(
    null
  );
  const [checkingBatchNumber, setCheckingBatchNumber] = useState(false);

  const [packTypeOptions, setPackTypeOptions] = useState<SelectOption[]>([]);
  const [packTypeUnitOptions, setPackTypeUnitOptions] = useState<
    SelectOption[]
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SuccessResult | null>(null);
  const [showCreateBatchConfirm, setShowCreateBatchConfirm] = useState(false);

  const reset = () => {
    setStep(1);
    setUpdateType("existing");
    setBatches([]);
    setBatchesLoading(false);
    setBatchesError(null);
    setSelectedBatchIndex(null);
    setAddQuantity("");
    setDateOfStockEntry(todayIso());
    setRemarks("");
    setNewBatch({
      batchLotNumber: "",
      manufacturingDate: "",
      expiryDate: "",
      quantity: "",
      mrp: "",
      sellingPrice: "",
      discountPercentage: "",
      shelfLifeMonths: "",
      dateOfStockEntry: todayIso(),
      packId: "",
      packTypeUnitId: "",
      unitPerPack: "",
      numberOfPacks: "",
      packSize: "",
      minimumOrderQuantity: "",
      maximumOrderQuantity: "",
    });
    setSpecialDiscounts([]);
    setSpecialOffersOpen(false);
    setDraftSpecialDiscounts([]);
    setBatchNumberError(null);
    setCheckingBatchNumber(false);
    setSubmitting(false);
    setSubmitError(null);
    setResult(null);
    setShowCreateBatchConfirm(false);
  };

  useEffect(() => {
    if (!open) return;
    reset();
    if (!productId) return;
    setBatchesLoading(true);
    getAvailableBatches(productId, packagingId)
      .then((list) => {
        setBatches(list);
        // No existing batches to add stock to — force the "create new batch" flow.
        if (list.length === 0) setUpdateType("new");
      })
      .catch((err) => setBatchesError(extractErrorMessage(err)))
      .finally(() => setBatchesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId, packagingId]);

  useEffect(() => {
    if (!open || categoryId == null) return;
    getPackTypesByCategory(categoryId)
      .then((list: any[]) =>
        setPackTypeOptions(
          (list ?? []).map((p) => ({
            value: String(p.packId ?? p.id),
            label: p.packType ?? p.packTypeName ?? p.name ?? `Pack ${p.packId}`,
          }))
        )
      )
      .catch((err) => console.error("Error fetching pack types:", err));
    getPackTypeUnits()
      .then((list: any[]) =>
        setPackTypeUnitOptions(
          (list ?? []).map((u) => ({
            value: String(u.packTypeUnitId),
            label: u.packTypeUnitName,
          }))
        )
      )
      .catch((err) => console.error("Error fetching pack type units:", err));
  }, [open, categoryId]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const { isConfirmOpen, requestClose, confirmClose, cancelClose } =
    useConfirmClose(handleClose);

  if (!open) return null;

  const selectedBatch =
    selectedBatchIndex != null ? batches[selectedBatchIndex] : null;

  const checkBatchNumber = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || categoryId == null) {
      setBatchNumberError(null);
      return;
    }
    try {
      setCheckingBatchNumber(true);
      const response = await validateBatchNumber(trimmed, categoryId);
      setBatchNumberError(
        response?.exists ? "This batch ID already exists" : null
      );
    } catch (err) {
      console.error("Batch validation failed:", err);
    } finally {
      setCheckingBatchNumber(false);
    }
  };

  const handleNewBatchLotNumberChange = (value: string) => {
    setNewBatch((v) => ({ ...v, batchLotNumber: value }));
    if (!value.trim()) {
      setBatchNumberError(null);
      return;
    }
    checkBatchNumber(value);
  };

  // packSize is derived (unitPerPack × numberOfPacks), same as the product forms.
  const handleUnitPerPackOrCountChange = (
    field: "unitPerPack" | "numberOfPacks",
    value: string
  ) => {
    setNewBatch((v) => {
      const next = { ...v, [field]: value };
      const unitPerPack = Number(next.unitPerPack) || 0;
      const numberOfPacks = Number(next.numberOfPacks) || 0;
      next.packSize = unitPerPack && numberOfPacks
        ? String(unitPerPack * numberOfPacks)
        : "";
      return next;
    });
  };

  const openSpecialOffers = () => {
    setDraftSpecialDiscounts(
      specialDiscounts.length > 0
        ? specialDiscounts
        : [emptySpecialDiscountRow()]
    );
    setSpecialOffersOpen(true);
  };

  const cancelSpecialOffers = () => {
    setSpecialOffersOpen(false);
    setDraftSpecialDiscounts([]);
  };

  const saveSpecialOffers = () => {
    setSpecialDiscounts(
      draftSpecialDiscounts.filter((row) => row.percentage.trim() !== "")
    );
    setSpecialOffersOpen(false);
  };

  const addDraftSpecialDiscountRow = () =>
    setDraftSpecialDiscounts((rows) => [...rows, emptySpecialDiscountRow()]);

  const removeDraftSpecialDiscountRow = (index: number) =>
    setDraftSpecialDiscounts((rows) => rows.filter((_, i) => i !== index));

  const updateDraftSpecialDiscountRow = (
    index: number,
    patch: Partial<SpecialDiscountRow>
  ) =>
    setDraftSpecialDiscounts((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );

  const isDraftSpecialDiscountsValid = draftSpecialDiscounts.every(
    (row) =>
      row.percentage.trim() !== "" &&
      Number(row.percentage) >= 0 &&
      Number(row.percentage) <= 100 &&
      Number(row.minimumPurchaseQuantity) > 0
  );

  const isSpecialDiscountsValid = specialDiscounts.every(
    (row) =>
      row.percentage.trim() !== "" &&
      Number(row.percentage) >= 0 &&
      Number(row.percentage) <= 100 &&
      Number(row.minimumPurchaseQuantity) > 0
  );

  const isStep2Valid =
    updateType === "existing"
      ? selectedBatchIndex != null
      : newBatch.batchLotNumber.trim() !== "" &&
        !batchNumberError &&
        !checkingBatchNumber &&
        newBatch.manufacturingDate !== "" &&
        newBatch.expiryDate !== "" &&
        newBatch.manufacturingDate <= newBatch.expiryDate &&
        Number(newBatch.quantity) > 0 &&
        !isNaN(Number(newBatch.quantity)) &&
        Number(newBatch.mrp) > 0 &&
        !isNaN(Number(newBatch.mrp)) &&
        Number(newBatch.sellingPrice) > 0 &&
        !isNaN(Number(newBatch.sellingPrice)) &&
        newBatch.packId !== "" &&
        newBatch.packTypeUnitId !== "" &&
        Number(newBatch.unitPerPack) > 0 &&
        Number(newBatch.numberOfPacks) > 0 &&
        Number(newBatch.minimumOrderQuantity) > 0 &&
        Number(newBatch.minimumOrderQuantity) <= Number(newBatch.quantity) &&
        Number(newBatch.maximumOrderQuantity) >=
          Number(newBatch.minimumOrderQuantity) &&
        Number(newBatch.maximumOrderQuantity) <= Number(newBatch.quantity) &&
        (newBatch.discountPercentage.trim() === "" ||
          (Number(newBatch.discountPercentage) >= 0 &&
            Number(newBatch.discountPercentage) <= 100)) &&
        isSpecialDiscountsValid &&
        (newBatch.shelfLifeMonths.trim() === "" ||
          Number(newBatch.shelfLifeMonths) > 0);

  const isStep3Valid =
    updateType === "existing"
      ? addQuantity.trim() !== "" &&
        !isNaN(Number(addQuantity)) &&
        Number(addQuantity) !== 0 &&
        (selectedBatch?.stockQuantity ?? 0) + Number(addQuantity) >= 0
      : true;

  const canGoNext =
    step === 1
      ? !batchesLoading
      : step === 2
      ? isStep2Valid
      : isStep3Valid;

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    if (updateType === "new") {
      setShowCreateBatchConfirm(true);
      return;
    }
    handleConfirm();
  };

  const confirmCreateBatch = () => {
    setShowCreateBatchConfirm(false);
    handleConfirm();
  };

  const handleConfirm = async () => {
    if (!productId) {
      setSubmitError("Missing product ID — cannot update stock.");
      return;
    }

    setSubmitError(null);

    const payload =
      updateType === "existing"
        ? {
            productId,
            packagingId: selectedBatch?.packagingId ?? packagingId,
            batchLotNumber: selectedBatch?.batchLotNumber ?? "",
            manufacturingDate: selectedBatch?.manufacturingDate ?? "",
            expiryDate: selectedBatch?.expiryDate ?? "",
            quantity: Number(addQuantity),
            referenceType: "MANUAL_STOCK_UPDATE",
          }
        : {
            productId,
            // A new batch always creates its own packaging variant, so packagingId is
            // intentionally omitted here — packagingDetails takes precedence server-side.
            packagingDetails: {
              packId: Number(newBatch.packId),
              packTypeUnitId: Number(newBatch.packTypeUnitId),
              unitPerPack: Number(newBatch.unitPerPack),
              numberOfPacks: Number(newBatch.numberOfPacks),
              packSize: Number(newBatch.packSize),
              minimumOrderQuantity: Number(newBatch.minimumOrderQuantity),
              maximumOrderQuantity: Number(newBatch.maximumOrderQuantity),
            },
            batchLotNumber: newBatch.batchLotNumber.trim(),
            manufacturingDate: `${newBatch.manufacturingDate}T00:00:00`,
            expiryDate: `${newBatch.expiryDate}T00:00:00`,
            quantity: Number(newBatch.quantity),
            mrp: Number(newBatch.mrp),
            sellingPrice: Number(newBatch.sellingPrice),
            discountPercentage: newBatch.discountPercentage.trim()
              ? Number(newBatch.discountPercentage)
              : undefined,
            specialDiscounts:
              specialDiscounts.length > 0
                ? specialDiscounts.map(
                    (row): SpecialDiscountPayload => ({
                      minimumPurchaseQuantity: Number(
                        row.minimumPurchaseQuantity
                      ),
                      additionalDiscountPercentage: Number(row.percentage),
                      displayOffer: row.displayOffer,
                    })
                  )
                : undefined,
            shelfLifeMonths: newBatch.shelfLifeMonths.trim()
              ? Number(newBatch.shelfLifeMonths)
              : undefined,
            dateOfStockEntry: newBatch.dateOfStockEntry || undefined,
            referenceType: "MANUAL_STOCK_UPDATE",
          };

    try {
      setSubmitting(true);
      const response = await addStock(payload);
      setResult({
        batchNumber: response.batchLotNumber,
        previousStock: response.balanceAfter - response.quantity,
        addedStock: response.quantity,
        updatedStock: response.balanceAfter,
      });
      onSuccess?.(response);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const previewCurrent = selectedBatch?.stockQuantity ?? 0;
  const previewAdded = Number(addQuantity) || 0;
  const previewUpdated = previewCurrent + previewAdded;
  const previewIsDecrease = previewAdded < 0;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(28, 25, 23, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <ConfirmCloseDialog
        isOpen={isConfirmOpen}
        onConfirm={confirmClose}
        onCancel={cancelClose}
      />
      <ConfirmCloseDialog
        isOpen={showCreateBatchConfirm}
        onConfirm={confirmCreateBatch}
        onCancel={() => setShowCreateBatchConfirm(false)}
        title="Create New Batch?"
        message="Are you sure you want to create this batch?"
      />
      <div
        style={{
          width: "100%",
          maxWidth: result ? 460 : 640,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "white",
          borderRadius: 16,
          boxShadow:
            "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
          fontFamily: "'Noto Sans', sans-serif",
        }}
      >
        {result ? (
          <SuccessView
            productName={productName}
            result={result}
            onViewInventory={onClose}
            onClose={onClose}
          />
        ) : (
          <>
            {/* ── HEADER ── */}
            <div
              style={{
                padding: "24px 24px 16px",
                borderBottom: `1px solid ${BORDER}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 600,
                    color: TEXT_DARK,
                    fontFamily: "'Work Sans', sans-serif",
                  }}
                >
                  Stock Update
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: TEXT_GRAY }}>
                  Product: {productName || "—"}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: TEXT_GRAY }}>
                  Product ID: {productId || "—"}
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: TEXT_GRAY,
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* ── STEPPER ── */}
            <div style={{ padding: "20px 24px 0" }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                {STEPS.map((s, idx) => {
                  const isDone = s.n < step;
                  const isActive = s.n === step;
                  return (
                    <React.Fragment key={s.n}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 90,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            fontWeight: 600,
                            fontFamily: "'Work Sans', sans-serif",
                            background: isDone || isActive ? PURPLE : "white",
                            color: isDone || isActive ? "white" : "#9C9C9A",
                            border:
                              isDone || isActive ? "none" : `2px solid ${BORDER}`,
                          }}
                        >
                          {isDone ? <Check size={16} /> : s.n}
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? PURPLE : "#9C9C9A",
                            textAlign: "center",
                            fontFamily: "'Work Sans', sans-serif",
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            marginTop: 15,
                            background: s.n < step ? PURPLE : BORDER,
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* ── CONTENT ── */}
            <div style={{ padding: "24px", minHeight: 200 }}>
              {step === 1 && (
                <div>
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: 15,
                      fontWeight: 500,
                      color: TEXT_DARK,
                    }}
                  >
                    Select the type of stock update you want to perform
                  </p>
                  {batchesLoading ? (
                    // Cards aren't rendered at all until we know the batch count, so there's
                    // no dim → enable / auto-select flicker once loading finishes — the final
                    // correct state is what first appears.
                    <div
                      style={{
                        border: `1px dashed ${BORDER}`,
                        borderRadius: 10,
                        padding: 20,
                        textAlign: "center",
                        color: TEXT_GRAY,
                        fontSize: 13,
                      }}
                    >
                      Checking available batches…
                    </div>
                  ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    {(
                      [
                        {
                          type: "existing" as UpdateType,
                          icon: PackagePlus,
                          title: "Add Stock to Existing Batch",
                          desc: "Increase stock quantity for an existing batch.",
                        },
                        {
                          type: "new" as UpdateType,
                          icon: PackageOpen,
                          title: "Create New Batch",
                          desc: "Add a new batch with details and stock.",
                        },
                      ] as const
                    ).map((card) => {
                      const selected = updateType === card.type;
                      const Icon = card.icon;
                      // Nothing to add stock to — force "create new batch" instead.
                      const disabled =
                        card.type === "existing" && batches.length === 0;
                      return (
                        <div
                          key={card.type}
                          onClick={() => {
                            if (disabled) return;
                            setUpdateType(card.type);
                          }}
                          style={{
                            position: "relative",
                            cursor: disabled ? "not-allowed" : "pointer",
                            borderRadius: 12,
                            border: `1.5px solid ${selected ? PURPLE : BORDER}`,
                            background: disabled
                              ? "#FAFAF9"
                              : selected
                              ? "#FAF5FF"
                              : "white",
                            padding: "24px 16px 20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            gap: 8,
                            opacity: disabled ? 0.55 : 1,
                            transition: "border-color 0.15s, background 0.15s",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: 14,
                              left: 14,
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              border: `2px solid ${selected ? PURPLE : "#B8B8B6"}`,
                              background: selected ? PURPLE : "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {selected && (
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "white",
                                }}
                              />
                            )}
                          </span>
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: "50%",
                              background: "#F3E8FF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: PURPLE,
                              marginBottom: 4,
                            }}
                          >
                            <Icon size={26} />
                          </div>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: TEXT_DARK,
                              fontFamily: "'Work Sans', sans-serif",
                            }}
                          >
                            {card.title}
                          </span>
                          <span style={{ fontSize: 12.5, color: TEXT_GRAY }}>
                            {disabled
                              ? "No existing batches available for this product."
                              : card.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}

              {step === 2 && updateType === "existing" && (
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 600,
                      color: TEXT_DARK,
                      fontFamily: "'Work Sans', sans-serif",
                    }}
                  >
                    Select Existing Batch
                  </p>
                  <p style={{ margin: "4px 0 16px", fontSize: 13, color: TEXT_GRAY }}>
                    Choose the batch you want to add stock to.
                  </p>
                  {batchesLoading ? (
                    <div
                      style={{
                        border: `1px dashed ${BORDER}`,
                        borderRadius: 10,
                        padding: 20,
                        textAlign: "center",
                        color: TEXT_GRAY,
                        fontSize: 13,
                      }}
                    >
                      Loading batches…
                    </div>
                  ) : batchesError ? (
                    <div
                      style={{
                        border: "1px solid #FCA5A5",
                        background: "#FEF2F2",
                        borderRadius: 10,
                        padding: 20,
                        textAlign: "center",
                        color: "#B91C1C",
                        fontSize: 13,
                      }}
                    >
                      {batchesError}
                    </div>
                  ) : batches.length === 0 ? (
                    <div
                      style={{
                        border: `1px dashed ${BORDER}`,
                        borderRadius: 10,
                        padding: 20,
                        textAlign: "center",
                        color: TEXT_GRAY,
                        fontSize: 13,
                      }}
                    >
                      No existing batches found for this product.
                    </div>
                  ) : (
                    <div
                      style={{
                        border: `1px solid ${BORDER}`,
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "36px 1.2fr 1fr 1fr 1fr 1fr 1fr",
                          background: "#FAFAF9",
                          padding: "10px 14px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: TEXT_GRAY,
                          fontFamily: "'Work Sans', sans-serif",
                        }}
                      >
                        <span />
                        <span>Batch Number</span>
                        <span>Mfg. Date</span>
                        <span>Expiry Date</span>
                        <span>Available Stock</span>
                        <span>Discount %</span>
                        <span>Status</span>
                      </div>
                      <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        {batches.map((b, i) => {
                          const selected = selectedBatchIndex === i;
                          const status = getBatchStatus(b.expiryDate);
                          return (
                            <div
                              key={b.pricingId ?? i}
                              onClick={() => setSelectedBatchIndex(i)}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "36px 1.2fr 1fr 1fr 1fr 1fr 1fr",
                                alignItems: "center",
                                padding: "12px 14px",
                                borderTop: `1px solid ${BORDER}`,
                                background: selected ? "#FAF5FF" : "white",
                                cursor: "pointer",
                                fontSize: 13,
                                color: TEXT_DARK,
                              }}
                            >
                              <span
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  border: `2px solid ${
                                    selected ? PURPLE : "#B8B8B6"
                                  }`,
                                  background: selected ? PURPLE : "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {selected && (
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: "white",
                                    }}
                                  />
                                )}
                              </span>
                              <span style={{ fontWeight: 600 }}>
                                {b.batchLotNumber || "—"}
                              </span>
                              <span style={{ color: TEXT_GRAY }}>
                                {formatDate(b.manufacturingDate)}
                              </span>
                              <span style={{ color: TEXT_GRAY }}>
                                {formatDate(b.expiryDate)}
                              </span>
                              <span>
                                {(b.stockQuantity ?? 0).toLocaleString()}
                              </span>
                              <span style={{ color: TEXT_GRAY }}>
                                {b.discountPercentage != null
                                  ? `${b.discountPercentage}%`
                                  : "—"}
                              </span>
                              <span>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 10px",
                                    borderRadius: 999,
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    background: status.bg,
                                    color: status.color,
                                  }}
                                >
                                  {status.label}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && updateType === "new" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 15,
                      fontWeight: 600,
                      color: TEXT_DARK,
                      fontFamily: "'Work Sans', sans-serif",
                    }}
                  >
                    Packaging / Variant Details
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: TEXT_GRAY }}>
                    A new batch creates its own pack-size variant.
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <Field label="Pack Type *">
                      <select
                        value={newBatch.packId}
                        onChange={(e) =>
                          setNewBatch((v) => ({ ...v, packId: e.target.value }))
                        }
                        style={inputStyle}
                      >
                        <option value="">Select pack type</option>
                        {packTypeOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Pack Type Unit *">
                      <select
                        value={newBatch.packTypeUnitId}
                        onChange={(e) =>
                          setNewBatch((v) => ({
                            ...v,
                            packTypeUnitId: e.target.value,
                          }))
                        }
                        style={inputStyle}
                      >
                        <option value="">Select unit</option>
                        {packTypeUnitOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Number of Units per Pack Type *">
                      <input
                        type="number"
                        min={1}
                        value={newBatch.unitPerPack}
                        onChange={(e) =>
                          handleUnitPerPackOrCountChange(
                            "unitPerPack",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 15"
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Number of Packs *">
                      <input
                        type="number"
                        min={1}
                        value={newBatch.numberOfPacks}
                        onChange={(e) =>
                          handleUnitPerPackOrCountChange(
                            "numberOfPacks",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 100"
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Pack Size (Number of Units per Pack Type X Number of Packs)">
                      <input
                        type="number"
                        value={newBatch.packSize}
                        readOnly
                        placeholder="Number of Units per Pack Type × Number of Packs"
                        style={{ ...inputStyle, background: "#F5F5F5", color: TEXT_GRAY }}
                      />
                    </Field>
                    <Field label="Minimum Order Quantity (MOQ) (in terms of Pack Size) *">
                      <input
                        type="number"
                        min={1}
                        value={newBatch.minimumOrderQuantity}
                        onChange={(e) =>
                          setNewBatch((v) => ({
                            ...v,
                            minimumOrderQuantity: e.target.value,
                          }))
                        }
                        placeholder="e.g. 5"
                        style={inputStyle}
                      />
                      {newBatch.quantity.trim() !== "" &&
                        newBatch.minimumOrderQuantity.trim() !== "" &&
                        Number(newBatch.minimumOrderQuantity) >
                          Number(newBatch.quantity) && (
                          <p
                            style={{
                              margin: "6px 0 0",
                              fontSize: 12,
                              color: "#B91C1C",
                            }}
                          >
                            Minimum order quantity cannot exceed the batch
                            quantity ({newBatch.quantity}).
                          </p>
                        )}
                    </Field>
                    <Field label="Maximum Order Quantity (in terms of Pack Size) *">
                      <input
                        type="number"
                        min={1}
                        value={newBatch.maximumOrderQuantity}
                        onChange={(e) =>
                          setNewBatch((v) => ({
                            ...v,
                            maximumOrderQuantity: e.target.value,
                          }))
                        }
                        placeholder="e.g. 500"
                        style={inputStyle}
                      />
                      {newBatch.quantity.trim() !== "" &&
                        newBatch.maximumOrderQuantity.trim() !== "" &&
                        Number(newBatch.maximumOrderQuantity) >
                          Number(newBatch.quantity) && (
                          <p
                            style={{
                              margin: "6px 0 0",
                              fontSize: 12,
                              color: "#B91C1C",
                            }}
                          >
                            Maximum order quantity cannot exceed the batch
                            quantity ({newBatch.quantity}).
                          </p>
                        )}
                      {newBatch.minimumOrderQuantity.trim() !== "" &&
                        newBatch.maximumOrderQuantity.trim() !== "" &&
                        Number(newBatch.maximumOrderQuantity) <
                          Number(newBatch.minimumOrderQuantity) && (
                          <p
                            style={{
                              margin: "6px 0 0",
                              fontSize: 12,
                              color: "#B91C1C",
                            }}
                          >
                            Maximum order quantity must be greater than or
                            equal to the minimum order quantity (
                            {newBatch.minimumOrderQuantity}).
                          </p>
                        )}
                    </Field>
                  </div>
                </div>

                <div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 15,
                      fontWeight: 600,
                      color: TEXT_DARK,
                      fontFamily: "'Work Sans', sans-serif",
                    }}
                  >
                    Batch, Stock Entry, Pricing & Tax Details
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: TEXT_GRAY }}>
                    Batch identification, dates, stock, discount, and pricing for this batch.
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                  <Field label="Batch Number *">
                    <input
                      type="text"
                      value={newBatch.batchLotNumber}
                      onChange={(e) =>
                        handleNewBatchLotNumberChange(e.target.value)
                      }
                      placeholder="e.g. BATCH-2026-01"
                      style={{
                        ...inputStyle,
                        border: `1px solid ${
                          batchNumberError ? "#FCA5A5" : BORDER
                        }`,
                      }}
                    />
                    {checkingBatchNumber ? (
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: TEXT_GRAY }}>
                        Checking batch ID…
                      </p>
                    ) : batchNumberError ? (
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 12,
                          color: "#B91C1C",
                        }}
                      >
                        {batchNumberError}
                      </p>
                    ) : null}
                  </Field>
                  <Field label="Manufacturing Date *">
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={isoToDate(newBatch.manufacturingDate)}
                        onChange={(date) =>
                          setNewBatch((v) => {
                            const manufacturingDate = dateToIso(date);
                            return {
                              ...v,
                              manufacturingDate,
                              shelfLifeMonths: monthsBetween(
                                manufacturingDate,
                                v.expiryDate
                              ),
                            };
                          })
                        }
                        format="dd/MM/yyyy"
                        maxDate={isoToDate(newBatch.expiryDate) ?? undefined}
                        slotProps={{
                          field: { clearable: true },
                          actionBar: { actions: ["clear"] },
                          textField: { fullWidth: true, sx: datePickerSx },
                        }}
                      />
                    </LocalizationProvider>
                  </Field>
                  <Field label="Expiry Date *">
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={isoToDate(newBatch.expiryDate)}
                        onChange={(date) =>
                          setNewBatch((v) => {
                            const expiryDate = dateToIso(date);
                            return {
                              ...v,
                              expiryDate,
                              shelfLifeMonths: monthsBetween(
                                v.manufacturingDate,
                                expiryDate
                              ),
                            };
                          })
                        }
                        format="dd/MM/yyyy"
                        minDate={isoToDate(newBatch.manufacturingDate) ?? undefined}
                        slotProps={{
                          field: { clearable: true },
                          actionBar: { actions: ["clear"] },
                          textField: { fullWidth: true, sx: datePickerSx },
                        }}
                      />
                    </LocalizationProvider>
                  </Field>
                  <Field label="Shelf Life (Months, auto-calculated) *">
                    <input
                      type="number"
                      value={newBatch.shelfLifeMonths}
                      readOnly
                      placeholder="Manufacturing Date → Expiry Date"
                      style={{ ...inputStyle, background: "#F5F5F5", color: TEXT_GRAY }}
                    />
                  </Field>
                  <Field label="Stock Quantity (in terms of Pack Size) *">
                    <input
                      type="number"
                      min={1}
                      value={newBatch.quantity}
                      onChange={(e) =>
                        setNewBatch((v) => ({ ...v, quantity: e.target.value }))
                      }
                      placeholder="Enter quantity"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Date of Stock Entry *">
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={isoToDate(newBatch.dateOfStockEntry)}
                        onChange={(date) =>
                          setNewBatch((v) => ({
                            ...v,
                            dateOfStockEntry: dateToIso(date),
                          }))
                        }
                        format="dd/MM/yyyy"
                        slotProps={{
                          field: { clearable: true },
                          actionBar: { actions: ["clear"] },
                          textField: { fullWidth: true, sx: datePickerSx },
                        }}
                      />
                    </LocalizationProvider>
                  </Field>
                  <Field label="Discount Percentage (per Pack Size)">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={newBatch.discountPercentage}
                      onChange={(e) =>
                        setNewBatch((v) => ({
                          ...v,
                          discountPercentage: e.target.value,
                        }))
                      }
                      placeholder="e.g. 10"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="MRP (₹) *">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newBatch.mrp}
                      onChange={(e) =>
                        setNewBatch((v) => ({ ...v, mrp: e.target.value }))
                      }
                      placeholder="Enter MRP"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Selling Price (₹) *">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newBatch.sellingPrice}
                      onChange={(e) =>
                        setNewBatch((v) => ({
                          ...v,
                          sellingPrice: e.target.value,
                        }))
                      }
                      placeholder="Enter selling price"
                      style={inputStyle}
                    />
                  </Field>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={openSpecialOffers}
                      className="w-full h-11 bg-transparent border-[2.5px] border-[#7D32FC] text-[#9659FD] font-heading font-medium text-[14px] leading-5 rounded-lg flex items-center justify-center gap-2.5 cursor-pointer hover:bg-purple-50 transition-all duration-200"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0"
                      >
                        <path
                          d="M7 1v12M1 7h12"
                          stroke="#9659FD"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span>
                        {specialDiscounts.length > 0
                          ? `${specialDiscounts.length} Special Offer${
                              specialDiscounts.length > 1 ? "s" : ""
                            } Added — Edit`
                          : "Add Special Offers"}
                      </span>
                    </button>
                  </div>
                  </div>
                </div>

                </div>
              )}

              {step === 3 && updateType === "existing" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "200px 1fr",
                    gap: 24,
                  }}
                >
                  <div
                    style={{
                      background: "#FAFAF9",
                      border: `1px solid ${BORDER}`,
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      alignSelf: "start",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: TEXT_DARK,
                        fontFamily: "'Work Sans', sans-serif",
                      }}
                    >
                      Batch Information
                    </p>
                    <InfoPair label="Batch Number" value={selectedBatch?.batchLotNumber || "—"} />
                    <InfoPair
                      label="Manufacturing Date"
                      value={formatDate(selectedBatch?.manufacturingDate)}
                    />
                    <InfoPair
                      label="Expiry Date"
                      value={formatDate(selectedBatch?.expiryDate)}
                    />
                    <InfoPair
                      label="Current Stock Quantity"
                      value={`${(selectedBatch?.stockQuantity ?? 0).toLocaleString()} Packs`}
                    />
                    <InfoPair
                      label="Discount %"
                      value={
                        selectedBatch?.discountPercentage != null
                          ? `${selectedBatch.discountPercentage}%`
                          : "—"
                      }
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 600,
                        color: TEXT_DARK,
                        fontFamily: "'Work Sans', sans-serif",
                      }}
                    >
                      Add Stock Details
                    </p>
                    <Field label="Stock Adjustment Quantity *">
                      <div style={{ display: "flex" }}>
                        <input
                          type="number"
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(e.target.value)}
                          placeholder="e.g. 50 to add, -20 to remove"
                          style={{
                            ...inputStyle,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderRight: "none",
                          }}
                        />
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0 14px",
                            border: `1px solid ${BORDER}`,
                            borderTopRightRadius: 8,
                            borderBottomRightRadius: 8,
                            background: "#F5F5F5",
                            fontSize: 13,
                            color: TEXT_GRAY,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Pack(s)
                        </span>
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: TEXT_GRAY }}>
                        Enter a positive number to add stock, or a negative number to
                        deduct stock from this batch.
                      </p>
                    </Field>
                    <Field label="Date of Stock Entry">
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={isoToDate(dateOfStockEntry)}
                          onChange={(date) => setDateOfStockEntry(dateToIso(date))}
                          format="dd/MM/yyyy"
                          slotProps={{
                            field: { clearable: true },
                            actionBar: { actions: ["clear"] },
                            textField: { fullWidth: true, sx: datePickerSx },
                          }}
                        />
                      </LocalizationProvider>
                    </Field>
                    <Field label="Remarks (Optional)">
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter remarks (optional)"
                        rows={2}
                        style={{ ...inputStyle, height: "auto", padding: 10, resize: "vertical" }}
                      />
                    </Field>

                    <div
                      style={{
                        background: previewIsDecrease ? "#FEF2F2" : "#F0FDF4",
                        border: `1px solid ${previewIsDecrease ? "#FCA5A5" : "#86EFAC"}`,
                        borderRadius: 10,
                        padding: 14,
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: previewIsDecrease ? "#B91C1C" : "#15803D",
                        }}
                      >
                        Updated Stock Quantity
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <SumBlock value={previewCurrent} label="Current Stock" />
                        <span style={{ fontSize: 18, color: previewIsDecrease ? "#B91C1C" : "#15803D" }}>
                          {previewIsDecrease ? "−" : "+"}
                        </span>
                        <SumBlock value={Math.abs(previewAdded)} label={previewIsDecrease ? "Removed Stock" : "Added Stock"} />
                        <span style={{ fontSize: 18, color: previewIsDecrease ? "#B91C1C" : "#15803D" }}>=</span>
                        <SumBlock
                          value={previewUpdated}
                          label="Updated Stock"
                          bold
                          suffix="Packs"
                        />
                      </div>
                      {previewUpdated < 0 && (
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#B91C1C" }}>
                          Updated stock cannot go below 0.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && updateType === "new" && (
                <div>
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: 15,
                      fontWeight: 500,
                      color: TEXT_DARK,
                    }}
                  >
                    Review the details before confirming
                  </p>
                  <div
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <ReviewRow label="Update type" value="Create New Batch" />
                    <ReviewRow
                      label="Batch / Lot number"
                      value={newBatch.batchLotNumber || "—"}
                    />
                    <ReviewRow label="Quantity" value={newBatch.quantity || "0"} />
                    <ReviewRow
                      label="MRP"
                      value={newBatch.mrp ? `₹${newBatch.mrp}` : "—"}
                    />
                    <ReviewRow
                      label="Selling price"
                      value={newBatch.sellingPrice ? `₹${newBatch.sellingPrice}` : "—"}
                    />
                    <ReviewRow
                      label="Manufacturing date"
                      value={formatDate(newBatch.manufacturingDate)}
                    />
                    <ReviewRow
                      label="Expiry date"
                      value={formatDate(newBatch.expiryDate)}
                    />
                    <ReviewRow
                      label="Discount"
                      value={
                        newBatch.discountPercentage
                          ? `${newBatch.discountPercentage}%`
                          : "—"
                      }
                    />
                    <ReviewRow
                      label="Special discounts"
                      value={
                        specialDiscounts.length > 0
                          ? specialDiscounts
                              .map(
                                (row) =>
                                  `${row.percentage || "0"}% (min qty: ${
                                    row.minimumPurchaseQuantity || "—"
                                  }, ${row.displayOffer ? "shown" : "hidden"})`
                              )
                              .join("; ")
                          : "—"
                      }
                    />
                    <ReviewRow
                      label="Shelf life"
                      value={
                        newBatch.shelfLifeMonths
                          ? `${newBatch.shelfLifeMonths} months`
                          : "—"
                      }
                    />
                    <ReviewRow
                      label="Date of stock entry"
                      value={formatDate(newBatch.dateOfStockEntry)}
                    />
                  </div>

                  <p
                    style={{
                      margin: "16px 0 8px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: TEXT_DARK,
                      fontFamily: "'Work Sans', sans-serif",
                    }}
                  >
                    New packaging / variant
                  </p>
                  <div
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <ReviewRow
                      label="Pack type"
                      value={
                        packTypeOptions.find((o) => o.value === newBatch.packId)
                          ?.label || "—"
                      }
                    />
                    <ReviewRow
                      label="Pack type unit"
                      value={
                        packTypeUnitOptions.find(
                          (o) => o.value === newBatch.packTypeUnitId
                        )?.label || "—"
                      }
                    />
                    <ReviewRow
                      label="Unit per pack"
                      value={newBatch.unitPerPack || "—"}
                    />
                    <ReviewRow
                      label="Number of packs"
                      value={newBatch.numberOfPacks || "—"}
                    />
                    <ReviewRow
                      label="Pack size"
                      value={newBatch.packSize || "—"}
                    />
                    <ReviewRow
                      label="Min / Max order quantity"
                      value={`${newBatch.minimumOrderQuantity || "—"} / ${
                        newBatch.maximumOrderQuantity || "—"
                      }`}
                    />
                  </div>
                </div>
              )}

              {submitError && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#B91C1C",
                    fontSize: 13,
                  }}
                >
                  {submitError}
                </div>
              )}
            </div>

            {/* ── FOOTER ── */}
            <div
              style={{
                borderTop: `1px solid ${BORDER}`,
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  disabled={submitting}
                  style={{
                    height: 44,
                    padding: "0 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: TEXT_GRAY,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "'Work Sans', sans-serif",
                  }}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  style={{
                    height: 44,
                    padding: "0 20px",
                    borderRadius: 8,
                    border: `1px solid ${BORDER}`,
                    background: "white",
                    color: TEXT_DARK,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "'Work Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {step === 3 && (
                  <button
                    onClick={handleClose}
                    disabled={submitting}
                    style={{
                      height: 44,
                      padding: "0 20px",
                      borderRadius: 8,
                      border: `1px solid ${BORDER}`,
                      background: "white",
                      color: TEXT_DARK,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: submitting ? "not-allowed" : "pointer",
                      fontFamily: "'Work Sans', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!canGoNext || submitting}
                  style={{
                    height: 44,
                    padding: "0 20px",
                    borderRadius: 8,
                    border: "none",
                    background: PURPLE,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: !canGoNext || submitting ? "not-allowed" : "pointer",
                    opacity: !canGoNext || submitting ? 0.55 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "'Work Sans', sans-serif",
                  }}
                >
                  {step === 3
                    ? submitting
                      ? "Updating…"
                      : "Update Stock"
                    : "Next"}
                  {step < 3 && <ChevronRight size={16} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {specialOffersOpen && (
        <SpecialOffersDrawer
          rows={draftSpecialDiscounts}
          isValid={isDraftSpecialDiscountsValid}
          onAddRow={addDraftSpecialDiscountRow}
          onRemoveRow={removeDraftSpecialDiscountRow}
          onUpdateRow={updateDraftSpecialDiscountRow}
          onCancel={cancelSpecialOffers}
          onSave={saveSpecialOffers}
        />
      )}
    </div>
  );
}

const datePickerSx = {
  "& .MuiOutlinedInput-root": {
    height: 44,
    borderRadius: "8px",
    fontFamily: "'Noto Sans', sans-serif",
    fontSize: 14,
  },
  "& .clearButton": {
    opacity: "1 !important",
  },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  padding: "0 12px",
  fontSize: 14,
  color: TEXT_DARK,
  boxSizing: "border-box",
  fontFamily: "'Noto Sans', sans-serif",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const isRequired = label.trim().endsWith("*");
  const labelText = isRequired ? label.trim().slice(0, -1).trim() : label;
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          color: TEXT_DARK,
          marginBottom: 6,
        }}
      >
        {labelText}
        {isRequired && <span style={{ color: "#DC2626" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function SpecialOffersDrawer({
  rows,
  isValid,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onCancel,
  onSave,
}: {
  rows: SpecialDiscountRow[];
  isValid: boolean;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateRow: (index: number, patch: Partial<SpecialDiscountRow>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { isConfirmOpen, requestClose, confirmClose, cancelClose } =
    useConfirmClose(onCancel);

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(28, 25, 23, 0.45)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <ConfirmCloseDialog
        isOpen={isConfirmOpen}
        onConfirm={confirmClose}
        onCancel={cancelClose}
      />
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          height: "100%",
          background: "white",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Noto Sans', sans-serif",
          animation: "stockmodal-slide-in-right 0.2s ease-out",
        }}
      >
        <style>{`
          @keyframes stockmodal-slide-in-right {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* ── HEADER ── */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: TEXT_DARK,
                fontFamily: "'Work Sans', sans-serif",
              }}
            >
              Special Offers
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: TEXT_GRAY }}>
              Separate promotional discounts, distinct from the regular
              Discount % — each applied once its own minimum quantity is
              purchased.
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: TEXT_GRAY,
              padding: 4,
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {rows.map((row, index) => (
            <div
              key={index}
              style={{
                border: `1px solid ${BORDER}`,
                background: "#FAFAF9",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: TEXT_GRAY,
                    fontFamily: "'Work Sans', sans-serif",
                  }}
                >
                  Offer {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveRow(index)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: TEXT_GRAY,
                    padding: 4,
                  }}
                  aria-label={`Remove special offer ${index + 1}`}
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="Minimum Purchase Quantity">
                  <input
                    type="number"
                    min={1}
                    value={row.minimumPurchaseQuantity}
                    onChange={(e) =>
                      onUpdateRow(index, {
                        minimumPurchaseQuantity: e.target.value,
                      })
                    }
                    placeholder="e.g. 5"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Special Discount %">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={row.percentage}
                    onChange={(e) =>
                      onUpdateRow(index, { percentage: e.target.value })
                    }
                    placeholder="e.g. 5"
                    style={inputStyle}
                  />
                </Field>
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  fontSize: 13,
                  color: TEXT_DARK,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={row.displayOffer}
                  onChange={(e) =>
                    onUpdateRow(index, { displayOffer: e.target.checked })
                  }
                />
                Display this offer to buyers
              </label>
            </div>
          ))}

          <button
            type="button"
            onClick={onAddRow}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: PURPLE,
              fontSize: 13,
              fontWeight: 600,
              padding: 0,
              fontFamily: "'Work Sans', sans-serif",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 1v12M1 7h12"
                stroke={PURPLE}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            Add another offer
          </button>
        </div>

        {/* ── FOOTER ── */}
        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: `1px solid ${BORDER}`,
              background: "white",
              color: TEXT_DARK,
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Work Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!isValid}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 8,
              border: "none",
              background: PURPLE,
              color: "white",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: isValid ? "pointer" : "not-allowed",
              opacity: isValid ? 1 : 0.55,
              fontFamily: "'Work Sans', sans-serif",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: TEXT_GRAY }}>{label}</div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: TEXT_DARK,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SumBlock({
  value,
  label,
  bold,
  suffix,
}: {
  value: number;
  label: string;
  bold?: boolean;
  suffix?: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: bold ? 20 : 18,
          fontWeight: bold ? 700 : 600,
          color: bold ? "#15803D" : TEXT_DARK,
          fontFamily: "'Work Sans', sans-serif",
        }}
      >
        {value.toLocaleString()}
        {suffix ? (
          <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 4 }}>
            {suffix}
          </span>
        ) : null}
      </div>
      <div style={{ fontSize: 11, color: TEXT_GRAY }}>{label}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 13, color: TEXT_GRAY }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: TEXT_DARK,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const CONFETTI = [
  { top: "6%", left: "12%", color: "#A855F7", rotate: "18deg" },
  { top: "10%", left: "82%", color: "#22C55E", rotate: "-15deg" },
  { top: "70%", left: "8%", color: "#3B82F6", rotate: "30deg" },
  { top: "76%", left: "88%", color: "#FBBF24", rotate: "-25deg" },
  { top: "40%", left: "4%", color: "#FBBF24", rotate: "10deg" },
  { top: "36%", left: "94%", color: "#A855F7", rotate: "-10deg" },
];

function SuccessView({
  productName,
  result,
  onViewInventory,
  onClose,
}: {
  productName?: string | null;
  result: SuccessResult;
  onViewInventory: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ padding: "40px 32px 32px", position: "relative" }}>
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            width: 8,
            height: 8,
            borderRadius: 2,
            background: c.color,
            transform: `rotate(${c.rotate})`,
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={28} color="white" strokeWidth={3} />
          </div>
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 700,
            color: "#15803D",
            fontFamily: "'Work Sans', sans-serif",
          }}
        >
          Stock Updated Successfully!
        </h2>

        <div
          style={{
            width: "100%",
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            overflow: "hidden",
            textAlign: "left",
          }}
        >
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <ReviewRow label="Product Name" value={productName || "—"} />
            <ReviewRow label="Batch Number" value={result.batchNumber || "—"} />
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}` }} />
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <ReviewRow
              label="Previous Stock"
              value={`${result.previousStock.toLocaleString()} Packs`}
            />
            <ReviewRow
              label={result.addedStock < 0 ? "Removed Stock" : "Added Stock"}
              value={`${Math.abs(result.addedStock).toLocaleString()} Packs`}
            />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13, color: TEXT_GRAY }}>Updated Stock</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>
                {result.updatedStock.toLocaleString()} Packs
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <button
            onClick={onViewInventory}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 8,
              border: `1.5px solid ${PURPLE}`,
              background: "white",
              color: PURPLE,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Work Sans', sans-serif",
            }}
          >
            View Inventory
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 8,
              border: "none",
              background: PURPLE,
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Work Sans', sans-serif",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
