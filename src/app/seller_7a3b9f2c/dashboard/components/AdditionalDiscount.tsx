"use client";

import React, { useEffect, useState } from "react";
import { Clock, Building2, X } from "lucide-react";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useConfirmClose } from "@/src/hooks/useConfirmClose";
import ConfirmCloseDialog from "@/src/components/common/ConfirmCloseDialog";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  minimumPurchaseQuantity: string;
  maximumPurchaseQuantity: string;
  discountPercentage: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  alwaysActive: boolean;
}

interface AdditionalDiscountProps {
  initialData?: AdditionalDiscountData[];
  baseDiscountPercentage?: number;
  baseMinimumOrderQuantity?: number;
  onSave?: (slabs?: AdditionalDiscountData[]) => void;
  onClose?: () => void;
}

const toIsoDateString = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ─── TimePickerModal ──────────────────────────────────────────────────────────

const TimePickerModal = ({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (time: string) => void;
  onClose: () => void;
}) => {
  const [hours, setHours] = useState(value ? value.split(":")[0] : "12");
  const [minutes, setMinutes] = useState(value ? value.split(":")[1] : "00");
  const [period, setPeriod] = useState(() => {
    if (value) {
      const h = parseInt(value.split(":")[0]);
      return h >= 12 ? "PM" : "AM";
    }
    return "PM";
  });
  const { isConfirmOpen, requestClose, confirmClose, cancelClose } =
    useConfirmClose(onClose);

  const handleConfirm = () => {
    let hour24 = parseInt(hours);
    if (period === "PM" && hour24 !== 12) hour24 += 12;
    if (period === "AM" && hour24 === 12) hour24 = 0;
    const time24 = `${hour24.toString().padStart(2, "0")}:${minutes}`;
    onChange(time24);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={requestClose} />
      <ConfirmCloseDialog
        isOpen={isConfirmOpen}
        onConfirm={confirmClose}
        onCancel={cancelClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl border border-neutral-200 p-4 w-72">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-neutral-900">Select Time</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-neutral-600 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 mb-4">
          <select
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="text-3xl font-light text-neutral-900 bg-transparent border-0 rounded-md focus-visible:ring-2 focus-visible:ring-primary-100 focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const h = (i + 1).toString().padStart(2, "0");
              return (
                <option key={h} value={h}>
                  {h}
                </option>
              );
            })}
          </select>
          <span className="text-3xl font-light text-neutral-900">:</span>
          <select
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="text-3xl font-light text-neutral-900 bg-transparent border-0 rounded-md focus-visible:ring-2 focus-visible:ring-primary-100 focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 60 }, (_, i) => {
              const m = i.toString().padStart(2, "0");
              return (
                <option key={m} value={m}>
                  {m}
                </option>
              );
            })}
          </select>
          <div className="flex flex-col gap-1 ml-2">
            <button
              onClick={() => setPeriod("AM")}
              className={`px-3 py-1 rounded-lg border-[1.5px] text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 ${
                period === "AM"
                  ? "border-primary-900 text-primary-900"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              AM
            </button>
            <button
              onClick={() => setPeriod("PM")}
              className={`px-3 py-1 rounded-lg border-[1.5px] text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 ${
                period === "PM"
                  ? "border-primary-900 text-primary-900"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              PM
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-9 border-[1.5px] border-neutral-300 rounded-lg text-[13px] text-neutral-700 font-semibold hover:bg-neutral-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 h-9 border-[1.5px] border-primary-900 rounded-lg text-[13px] text-primary-900 font-semibold hover:bg-primary-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── AdditionalDiscount ───────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  minimumPurchaseQuantity: "",
  maximumPurchaseQuantity: "",
  discountPercentage: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  alwaysActive: false,
};

const AdditionalDiscount: React.FC<AdditionalDiscountProps> = ({
  onSave,
  initialData,
  onClose,
  baseDiscountPercentage,
  baseMinimumOrderQuantity,
}) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [slabs, setSlabs] = useState<AdditionalDiscountData[]>(
    initialData || [],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTimePicker, setShowTimePicker] = useState<
    "startTime" | "endTime" | null
  >(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formatDateDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const columns: ColumnDef<AdditionalDiscountData>[] = [
    // {
    //   id: "select",
    //   header: "",
    //   cell: () => (
    //     <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
    //   ),
    // },
    {
      accessorKey: "minimumPurchaseQuantity",
      header: "Min Qt",
    },
    {
      accessorKey: "additionalDiscountPercentage",
      header: "Discount %",
      cell: (info) => `${info.getValue()}%`,
    },
    {
      accessorKey: "effectiveStartDate",
      header: "Start date",
      cell: (info) => formatDateDDMMYYYY(info.getValue() as string),
    },
    {
      accessorKey: "effectiveEndDate",
      header: "End Date",
      cell: (info) => formatDateDDMMYYYY(info.getValue() as string),
    },
    {
      id: "actions",
      header: "Action",
      cell: () => (
        <div className="flex gap-3">
          <img
            src="/icons/EditIcon.svg"
            alt="edit"
            className="w-4 h-4 rounded-md object-cover cursor-pointer"
          />
          <img
            src="/icons/DeleteIcon.svg"
            alt="delete"
            className="w-4 h-4 rounded-md object-cover cursor-pointer"
          />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: slabs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const validateDateTime = (
    updatedForm: FormState,
    touched: Record<string, boolean>,
  ) => {
    const errors: Record<string, string> = {};

    if (updatedForm.alwaysActive) return errors;

    const { startDate, endDate, startTime, endTime } = updatedForm;

    // ✅ FIELD-LEVEL VALIDATION (only if touched)

    if (touched.startDate && !startDate) {
      errors.startDate = "Start Date is required";
    }

    if (touched.endDate && !endDate) {
      errors.endDate = "End Date is required";
    }

    if (touched.startTime && !startTime) {
      errors.startTime = "Start Time is required";
    }

    if (touched.endTime && !endTime) {
      errors.endTime = "End Time is required";
    }

    // ✅ Prevent past dates
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);

      if (sDate < today && touched.startDate) {
        errors.startDate = "Start Date cannot be in the past";
      }
    }

    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(0, 0, 0, 0);

      if (eDate < today && touched.endDate) {
        errors.endDate = "End Date cannot be in the past";
      }
    }

    // ✅ DATE COMPARISON (only if BOTH values exist)
    if (startDate && endDate) {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);

      if (sDate > eDate) {
        // Only show error if either field is touched
        if (touched.startDate) {
          errors.startDate = "Start Date must be ≤ End Date";
        }
        if (touched.endDate) {
          errors.endDate = "End Date must be ≥ Start Date";
        }
      }
    }

    // ✅ TIME COMPARISON (only if same day + both exist)
    if (startDate && endDate && startDate === endDate && startTime && endTime) {
      if (startTime >= endTime) {
        if (touched.startTime) {
          errors.startTime = "Start Time must be less than End Time";
        }
        if (touched.endTime) {
          errors.endTime = "End Time must be greater than Start Time";
        }
      }
    }

    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);

    // ✅ Step 1: update touched FIRST (important)
    const updatedTouched = {
      ...touched,
      [name]: true,
    };
    setTouched(updatedTouched);

    let newErrors = { ...errors };

    const mpq = Number(updatedForm.minimumPurchaseQuantity);
    const discount = Number(updatedForm.discountPercentage);

    if (name === "minimumPurchaseQuantity") {
      const baseMPQ = Number(baseMinimumOrderQuantity || 0);

      if (Number(value) <= baseMPQ) {
        newErrors.minimumPurchaseQuantity = `Must be greater than base quantity (${baseMPQ})`;
        setErrors(newErrors);
        return;
      }
      if (value === "") {
        newErrors.minimumPurchaseQuantity =
          "Minimum Purchase Quantity is required";
      } else if (isNaN(Number(value))) {
        newErrors.minimumPurchaseQuantity = "Enter a valid number";
      } else if (Number(value) <= 0) {
        newErrors.minimumPurchaseQuantity = "Must be greater than 0";
      } else {
        // ✅ Only run slab validation if basic validation passes
        if (slabs.length > 0) {
          const lastSlab = slabs[slabs.length - 1];

          if (Number(value) <= lastSlab.minimumPurchaseQuantity) {
            newErrors.minimumPurchaseQuantity =
              "Must be greater than previous slab";
          } else if (
            slabs.some((s) => s.minimumPurchaseQuantity === Number(value))
          ) {
            newErrors.minimumPurchaseQuantity = "This value is already entered";
          } else {
            delete newErrors.minimumPurchaseQuantity;
          }
        } else {
          delete newErrors.minimumPurchaseQuantity;
        }
      }
    }

    if (name === "discountPercentage") {
      const baseDiscount = Number(baseDiscountPercentage || 0);

      if (Number(value) <= baseDiscount) {
        newErrors.discountPercentage = `Must be greater than base discount (${baseDiscount}%)`;
        setErrors(newErrors);
        return;
      }

      if (value === "") {
        newErrors.discountPercentage = "Discount is required";
      } else if (isNaN(Number(value))) {
        newErrors.discountPercentage = "Enter a valid number";
      } else if (Number(value) <= 0) {
        newErrors.discountPercentage = "Must be greater than 0";
      } else {
        if (slabs.length > 0) {
          const lastSlab = slabs[slabs.length - 1];

          if (Number(value) <= lastSlab.additionalDiscountPercentage) {
            newErrors.discountPercentage = "Must be greater than previous slab";
          } else if (
            slabs.some((s) => s.additionalDiscountPercentage === Number(value))
          ) {
            newErrors.discountPercentage = "This value is already entered";
          } else {
            delete newErrors.discountPercentage;
          }
        } else {
          delete newErrors.discountPercentage;
        }
      }

      // ❗ STOP invalid values from entering state
      if (Number(value) <= 0) {
        setErrors(newErrors);
        return;
      }
    }

    // ✅ Clear slab-related errors
    // delete newErrors.minimumPurchaseQuantity;
    // delete newErrors.discountPercentage;

    if (slabs.length > 0) {
      const lastSlab = slabs[slabs.length - 1];

      if (name === "minimumPurchaseQuantity") {
        if (mpq <= lastSlab.minimumPurchaseQuantity) {
          newErrors.minimumPurchaseQuantity =
            "Must be greater than previous slab";
        }

        if (slabs.some((s) => s.minimumPurchaseQuantity === mpq)) {
          newErrors.minimumPurchaseQuantity = "This value is already entered";
        }
      }

      if (name === "discountPercentage") {
        if (discount <= lastSlab.additionalDiscountPercentage) {
          newErrors.discountPercentage =
            "Must be greater than previous slab discount";
        }

        if (slabs.some((s) => s.additionalDiscountPercentage === discount)) {
          newErrors.discountPercentage = "This discount already exists";
        }
      }
    }

    // 🔥 CRITICAL FIX STARTS HERE

    // ✅ Step 2: CLEAR old date-time errors (this fixes your issue)
    delete newErrors.startDate;
    delete newErrors.endDate;
    delete newErrors.startTime;
    delete newErrors.endTime;

    // ✅ Step 3: validate with UPDATED touched
    const dateErrors = validateDateTime(updatedForm, updatedTouched);

    // ✅ Step 4: apply fresh errors only
    newErrors = {
      ...newErrors,
      ...dateErrors,
    };

    // 🔥 CRITICAL FIX ENDS HERE

    setErrors(newErrors);
  };

  const handleToggle = () => {
    setForm((prev) => ({ ...prev, alwaysActive: !prev.alwaysActive }));
  };

  // const validateForm = (): boolean => {
  //   const newErrors: Record<string, string> = {};
  //   if (!form.minimumPurchaseQuantity.trim())
  //     newErrors.minimumPurchaseQuantity =
  //       "Minimum Purchase Quantity is required";
  //   if (!form.discountPercentage.trim()) {
  //     newErrors.discountPercentage = "Discount percentage is required";
  //   } else if (isNaN(Number(form.discountPercentage))) {
  //     newErrors.discountPercentage = "Please enter a valid number";
  //   } else if (Number(form.discountPercentage) > 100) {
  //     newErrors.discountPercentage = "Discount cannot exceed 100%";
  //   }
  //   if (!form.alwaysActive) {
  //     if (!form.startDate) newErrors.startDate = "Start Date is required";
  //     if (!form.startTime) newErrors.startTime = "Start Time is required";
  //     if (!form.endDate) newErrors.endDate = "End Date is required";
  //     if (!form.endTime) newErrors.endTime = "End Time is required";
  //   }
  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const mpq = Number(form.minimumPurchaseQuantity);
    const discount = Number(form.discountPercentage);
    const baseMPQ = Number(baseMinimumOrderQuantity || 0);
    const baseDiscount = Number(baseDiscountPercentage || 0);

    // ✅ MPQ validation
    if (!form.minimumPurchaseQuantity.trim()) {
      newErrors.minimumPurchaseQuantity =
        "Minimum Purchase Quantity is required";
    } else if (isNaN(mpq)) {
      newErrors.minimumPurchaseQuantity = "Enter a valid number";
    } else if (mpq <= 0) {
      newErrors.minimumPurchaseQuantity = "Must be greater than 0";
    } else if (mpq <= baseMPQ) {
      newErrors.minimumPurchaseQuantity = `Must be greater than base quantity (${baseMPQ})`;
    } else if (slabs.length > 0) {
      const lastSlab = slabs[slabs.length - 1];

      if (mpq <= lastSlab.minimumPurchaseQuantity) {
        newErrors.minimumPurchaseQuantity =
          "Must be greater than previous slab";
      } else if (slabs.some((s) => s.minimumPurchaseQuantity === mpq)) {
        newErrors.minimumPurchaseQuantity = "This value is already entered";
      }
    }

    // ✅ Discount validation
    if (!form.discountPercentage.trim()) {
      newErrors.discountPercentage = "Discount percentage is required";
    } else if (isNaN(discount)) {
      newErrors.discountPercentage = "Enter a valid number";
    } else if (discount <= 0) {
      newErrors.discountPercentage = "Must be greater than 0";
    } else if (discount > 100) {
      newErrors.discountPercentage = "Discount cannot exceed 100%";
    } else if (discount <= baseDiscount) {
      newErrors.discountPercentage = `Must be greater than base discount (${baseDiscount}%)`;
    } else if (slabs.length > 0) {
      const lastSlab = slabs[slabs.length - 1];

      if (discount <= lastSlab.additionalDiscountPercentage) {
        newErrors.discountPercentage = "Must be greater than previous slab";
      } else if (
        slabs.some((s) => s.additionalDiscountPercentage === discount)
      ) {
        newErrors.discountPercentage = "This discount already exists";
      }
    }

    // ✅ Date validation
    if (!form.alwaysActive) {
      if (!form.startDate) newErrors.startDate = "Start Date is required";
      if (!form.startTime) newErrors.startTime = "Start Time is required";
      if (!form.endDate) newErrors.endDate = "End Date is required";
      if (!form.endTime) newErrors.endTime = "End Time is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    const isValid = validateForm();

    if (!isValid) return;

    const slab: AdditionalDiscountData = {
      minimumPurchaseQuantity: Number(form.minimumPurchaseQuantity),
      additionalDiscountPercentage: Number(form.discountPercentage),
      effectiveStartDate: form.alwaysActive ? "" : form.startDate,
      effectiveStartTime: form.alwaysActive ? "" : form.startTime,
      effectiveEndDate: form.alwaysActive ? "" : form.endDate,
      effectiveEndTime: form.alwaysActive ? "" : form.endTime,
    };

    const updatedSlabs = [...slabs, slab];

    setSlabs(updatedSlabs);
    onSave?.(updatedSlabs);

    setForm(EMPTY_FORM);
    setErrors({});
  };


  useEffect(() => {
    setSlabs(initialData || []);
  }, [initialData]);

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose?.();
  };

  const formatTimeDisplay = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const h = parseInt(hours);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${period}`;
  };

  const inputClass = (errorKey: string) =>
    `w-full h-9 px-3 bg-white rounded-lg border transition-colors ${
      errors[errorKey] ? "border-red-500" : "border-neutral-300"
    } focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-100 text-[13px] text-neutral-900 placeholder-neutral-400`;

  return (
    <div className="w-full bg-white flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Title */}
        <div className="pb-3 border-b border-neutral-200">
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-bold text-neutral-900">
              Additional Discount
            </h1>
            <span className="text-xs text-neutral-500">
              (Quantity-based)
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Create a time-based discount for bulk purchases
          </p>

          <div className="flex items-center justify-between mt-3">
            <span className="text-[13px] font-semibold text-neutral-700">
              Always Active
            </span>
            <button
              onClick={handleToggle}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 ${
                form.alwaysActive ? "bg-primary-900" : "bg-neutral-300"
              }`}
              aria-label="Toggle Always Active"
            >
              <div
                className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.alwaysActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {slabs.length > 0 && (
          <div className="space-y-2">
            <div className="text-[13px] font-bold text-neutral-800">
              Use Existing Discounts
            </div>

            <div className="border rounded-xl border-neutral-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs border-collapse">
                {/* HEADER */}
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 bg-neutral-50 border-b border-neutral-200"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                {/* BODY */}
                <tbody>
                  {table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={
                        "bg-white hover:bg-neutral-50/60"
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-2 border-b border-neutral-100 text-center text-neutral-800"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs font-semibold text-neutral-500 text-center my-3">
              OR
            </div>
          </div>
        )}

        {/* Purchase Conditions */}
        <div className="space-y-2">
          <h2 className="text-[13px] font-bold text-neutral-800">
            Add New Purchase Conditions
          </h2>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
              <Building2 size={16} className="text-neutral-500" />
              Minimum Purchase Quantity
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="minimumPurchaseQuantity"
              value={form.minimumPurchaseQuantity}
              onChange={handleInputChange}
              min={1}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") {
                  e.preventDefault();
                }
              }}
              className={inputClass("minimumPurchaseQuantity")}
            />
            {errors.minimumPurchaseQuantity && (
              <p className="text-red-500 text-xs">
                {errors.minimumPurchaseQuantity}
              </p>
            )}
          </div>
        </div>

        {/* Discount Details */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Discount Details
          </h2>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
              <Building2 size={16} className="text-neutral-500" />
              Discount percentage %<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="discountPercentage"
              placeholder="Placeholder"
              value={form.discountPercentage}
              onChange={handleInputChange}
              min={1}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") {
                  e.preventDefault();
                }
              }}
              className={inputClass("discountPercentage")}
            />
            {errors.discountPercentage && (
              <p className="text-red-500 text-xs">
                {errors.discountPercentage}
              </p>
            )}
          </div>
        </div>

        {/* Validity Period */}
        {!form.alwaysActive && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Validity Period
            </h2>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={form.startDate ? new Date(form.startDate) : null}
                      onChange={(date) => {
                        const updated = {
                          ...form,
                          startDate: toIsoDateString(date),
                        };
                        setForm(updated);

                        const updatedTouched = {
                          ...touched,
                          startDate: true,
                        };
                        setTouched(updatedTouched);
                        setErrors(() => validateDateTime(updated, updatedTouched));
                      }}
                      format="dd/MM/yyyy"
                      slotProps={{
                        field: { clearable: true },
                        actionBar: { actions: ["clear"] },
                        textField: {
                          fullWidth: true,
                          placeholder: "Select date",
                          error: !!errors.startDate,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              height: "36px",
                              borderRadius: "8px",
                            },
                            "& .clearButton": {
                              opacity: "1 !important",
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                  {errors.startDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.startDate}
                    </p>
                  )}
                </div>
                <div className="flex-1 relative">
                  <Clock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none z-10"
                  />
                  <input
                    type="text"
                    readOnly
                    value={formatTimeDisplay(form.startTime)}
                    onClick={() => setShowTimePicker("startTime")}
                    placeholder="Select time"
                    className={`w-full h-9 pl-9 pr-3 bg-white rounded-lg border transition-colors ${
                      errors.startTime ? "border-red-500" : "border-neutral-300"
                    } focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-100 text-[13px] text-neutral-900 cursor-pointer`}
                  />
                  {errors.startTime && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.startTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={form.endDate ? new Date(form.endDate) : null}
                      onChange={(date) => {
                        const updated = {
                          ...form,
                          endDate: toIsoDateString(date),
                        };
                        setForm(updated);

                        const updatedTouched = {
                          ...touched,
                          endDate: true,
                        };
                        setTouched(updatedTouched);
                        setErrors(() => validateDateTime(updated, updatedTouched));
                      }}
                      format="dd/MM/yyyy"
                      slotProps={{
                        field: { clearable: true },
                        actionBar: { actions: ["clear"] },
                        textField: {
                          fullWidth: true,
                          placeholder: "Select date",
                          error: !!errors.endDate,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              height: "36px",
                              borderRadius: "8px",
                            },
                            "& .clearButton": {
                              opacity: "1 !important",
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                  {errors.endDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.endDate}
                    </p>
                  )}
                </div>
                <div className="flex-1 relative">
                  <Clock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none z-10"
                  />
                  <input
                    type="text"
                    readOnly
                    value={formatTimeDisplay(form.endTime)}
                    onClick={() => setShowTimePicker("endTime")}
                    placeholder="Select time"
                    className={`w-full h-9 pl-9 pr-3 bg-white rounded-lg border transition-colors ${
                      errors.endTime ? "border-red-500" : "border-neutral-300"
                    } focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-100 text-[13px] text-neutral-900 cursor-pointer`}
                  />
                  {errors.endTime && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.endTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-500">
              This discount will apply for orders above (MPQ to MXPQ) units from
              (Start Date &amp; Time to End Date &amp; Time)
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-neutral-50/60 border-t border-neutral-200 px-4 py-2 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <button
          onClick={handleCancel}
          className="h-9 px-5 rounded-lg border-[1.5px] border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold text-[13px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
        >
          Close
        </button>
        <button
          onClick={handleSubmit}
          className="h-9 px-6 rounded-lg border-[1.5px] border-primary-900 text-primary-900 hover:bg-primary-50 font-semibold text-[13px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
        >
          Submit
        </button>
      </div>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <TimePickerModal
          value={showTimePicker === "startTime" ? form.startTime : form.endTime}
          onChange={(time) => {
            const field = showTimePicker as string;

            const updated = { ...form, [field]: time };
            setForm(updated);

            const updatedTouched = {
              ...touched,
              [field]: true,
            };

            setTouched(updatedTouched);

            setErrors(() => {
              return validateDateTime(updated, updatedTouched);
            });
          }}
          onClose={() => setShowTimePicker(null)}
        />
      )}

    </div>
  );
};

export default AdditionalDiscount;
