"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

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

// interface AdditionalDiscountData {
//   minimumPurchaseQuantity: number;
//   additionalDiscountPercentage: number;
//   effectiveStartDate: string;
//   effectiveStartTime: string;
//   effectiveEndDate: string;
//   effectiveEndTime: string;
// }

// interface AdditionalDiscountProps {
//   onSave?: (slabs?: AdditionalDiscountData[]) => void;
// }

interface AdditionalDiscountProps {
  initialData?: AdditionalDiscountData[];
  onSave?: (slabs?: AdditionalDiscountData[]) => void;
  onClose?: () => void;
}

// ─── DatePickerModal ──────────────────────────────────────────────────────────

const DatePickerModal = ({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (value) return new Date(value);
    return null;
  });
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift(prevDate);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getYears = () => {
    const currentYear = currentMonth.getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) years.push(i);
    return years;
  };

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(formatLocalDate(date));
    onClose();
  };

  // const handleDateSelect = (date: Date) => {
  //   setSelectedDate(date);
  //   onChange(date.toISOString().split("T")[0]);
  //   onClose();
  // };

  const changeMonth = (increment: number) => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + increment,
        1,
      ),
    );
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
    setViewMode("days");
  };

  const selectYear = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setViewMode("days");
  };

  const isToday = (date: Date) =>
    date.toDateString() === new Date().toDateString();
  const isSelected = (date: Date) =>
    selectedDate != null && date.toDateString() === selectedDate.toDateString();
  const isCurrentMonth = (date: Date) =>
    date.getMonth() === currentMonth.getMonth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-96">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {viewMode === "days" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("months")}
                  className="text-base font-semibold text-gray-900 hover:bg-gray-100 px-3 py-1 rounded-lg transition"
                >
                  {months[currentMonth.getMonth()]}
                </button>
                <button
                  onClick={() => setViewMode("years")}
                  className="text-base font-semibold text-gray-900 hover:bg-gray-100 px-3 py-1 rounded-lg transition"
                >
                  {currentMonth.getFullYear()}
                </button>
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                const isCurrent = isCurrentMonth(date);
                const selected = isSelected(date);
                const today = isToday(date);
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`h-10 w-full rounded-lg text-sm font-medium transition-all
                      ${!isCurrent && "text-gray-300"}
                      ${isCurrent && !selected && !today && "text-gray-700 hover:bg-gray-100"}
                      ${today && !selected && "bg-blue-50 text-blue-600 font-semibold"}
                      ${selected && "bg-purple-600 text-white hover:bg-purple-700"}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {viewMode === "months" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setViewMode("days")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode("years")}
                className="text-base font-semibold text-gray-900 hover:bg-gray-100 px-3 py-1 rounded-lg transition"
              >
                {currentMonth.getFullYear()}
              </button>
              <div className="w-8" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => selectMonth(index)}
                  className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                    currentMonth.getMonth() === index
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          </>
        )}

        {viewMode === "years" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const newYear = currentMonth.getFullYear() - 12;
                  setCurrentMonth(
                    new Date(newYear, currentMonth.getMonth(), 1),
                  );
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode("months")}
                className="text-base font-semibold text-gray-900 hover:bg-gray-100 px-3 py-1 rounded-lg transition"
              >
                {currentMonth.getFullYear()}
              </button>
              <button
                onClick={() => {
                  const newYear = currentMonth.getFullYear() + 12;
                  setCurrentMonth(
                    new Date(newYear, currentMonth.getMonth(), 1),
                  );
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {getYears().map((year) => (
                <button
                  key={year}
                  onClick={() => selectYear(year)}
                  className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                    currentMonth.getFullYear() === year
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          {selectedDate && viewMode === "days" && (
            <button
              onClick={() => {
                if (selectedDate) {
                  onChange(selectedDate.toISOString().split("T")[0]);
                  onClose();
                }
              }}
              className="flex-1 px-4 py-2 bg-purple-600 rounded-lg text-white font-semibold hover:bg-purple-700 transition"
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Select Time</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <select
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="text-4xl font-light text-gray-900 bg-transparent border-0 focus:outline-none cursor-pointer"
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
          <span className="text-4xl font-light text-gray-900">:</span>
          <select
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="text-4xl font-light text-gray-900 bg-transparent border-0 focus:outline-none cursor-pointer"
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
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                period === "AM"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              AM
            </button>
            <button
              onClick={() => setPeriod("PM")}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                period === "PM"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              PM
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-purple-600 rounded-lg text-white font-semibold hover:bg-purple-700 transition"
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
}) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [slabs, setSlabs] = useState<AdditionalDiscountData[]>(
    initialData || [],
  );

  // const [form, setForm] = useState<FormState>(() => {
  //   if (initialData && initialData.length > 0) {
  //     const d = initialData[0];

  //     return {
  //       minimumPurchaseQuantity: String(d.minimumPurchaseQuantity),
  //       maximumPurchaseQuantity: "",
  //       discountPercentage: String(d.additionalDiscountPercentage),
  //       startDate: d.effectiveStartDate || "",
  //       startTime: d.effectiveStartTime || "",
  //       endDate: d.effectiveEndDate || "",
  //       endTime: d.effectiveEndTime || "",
  //       alwaysActive: !d.effectiveStartDate,
  //     };
  //   }

  //   return EMPTY_FORM;
  // });

  // useEffect(() => {
  //   if (initialData && initialData.length > 0) {
  //     const d = initialData[0];

  //     setForm({
  //       minimumPurchaseQuantity: String(d.minimumPurchaseQuantity),
  //       maximumPurchaseQuantity: "",
  //       discountPercentage: String(d.additionalDiscountPercentage),
  //       startDate: d.effectiveStartDate || "",
  //       startTime: d.effectiveStartTime || "",
  //       endDate: d.effectiveEndDate || "",
  //       endTime: d.effectiveEndTime || "",
  //       alwaysActive: !d.effectiveStartDate,
  //     });
  //   }
  // }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTimePicker, setShowTimePicker] = useState<
    "startTime" | "endTime" | null
  >(null);
  const [showDatePicker, setShowDatePicker] = useState<
    "startDate" | "endDate" | null
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

    // ✅ Clear slab-related errors
    delete newErrors.minimumPurchaseQuantity;
    delete newErrors.discountPercentage;

    // 🚫 Skip slab validation for first entry
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.minimumPurchaseQuantity.trim())
      newErrors.minimumPurchaseQuantity =
        "Minimum Purchase Quantity is required";
    if (!form.discountPercentage.trim()) {
      newErrors.discountPercentage = "Discount percentage is required";
    } else if (isNaN(Number(form.discountPercentage))) {
      newErrors.discountPercentage = "Please enter a valid number";
    } else if (Number(form.discountPercentage) > 100) {
      newErrors.discountPercentage = "Discount cannot exceed 100%";
    }
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
    if (!validateForm()) return;

    const slab: AdditionalDiscountData = {
      minimumPurchaseQuantity: Number(form.minimumPurchaseQuantity),
      additionalDiscountPercentage: Number(form.discountPercentage),
      effectiveStartDate: form.alwaysActive ? "" : form.startDate,
      effectiveStartTime: form.alwaysActive ? "" : form.startTime,
      effectiveEndDate: form.alwaysActive ? "" : form.endDate,
      effectiveEndTime: form.alwaysActive ? "" : form.endTime,
    };

    // ✅ CREATE updatedSlabs FIRST
    const updatedSlabs = [...slabs, slab];

    // ✅ update local state
    setSlabs(updatedSlabs);

    // ✅ send to parent
    onSave?.(updatedSlabs);

    // ✅ reset form
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

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const inputClass = (errorKey: string) =>
    `w-full h-12 px-4 py-2 bg-white rounded-xl border-2 transition-colors ${
      errors[errorKey] ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:border-purple-600 text-base font-normal text-gray-900 placeholder-gray-400`;

  return (
    <div className="w-full bg-white flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-normal text-gray-900">
              Additional Discount
            </h1>
            <span className="text-sm font-normal text-gray-500">
              (Quantity-based)
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Create a time-based discount for bulk purchases
          </p>

          <div className="flex items-center justify-between mt-4">
            <span className="text-base font-normal text-gray-900">
              Always Active
            </span>
            <button
              onClick={handleToggle}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                form.alwaysActive ? "bg-purple-600" : "bg-gray-300"
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
          <div className="space-y-3">
            <div className="text-label-l4 font-semibold">
              Use Existing Discounts
            </div>

            <div className="border rounded-xl border-neutral-300 overflow-hidden">
              <table className="w-full text-sm border-collapse">
                {/* HEADER */}
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-lable-l2 font-semibold text-neutral-900 border border-neutral-300"
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
                        index % 2 === 0 ? "bg-white" : "bg-neutral-100"
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 border border-neutral-300 text-center"
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

            <div className="text-label-l4 font-semibold text-center m-8">
              OR
            </div>
          </div>
        )}

        {/* Purchase Conditions */}
        <div className="space-y-4">
          <h2 className="text-label-l4 font-semibold text-neutral-900">
            Add New Purchase Conditions
          </h2>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building2 size={16} className="text-gray-500" />
              Minimum Purchase Quantity
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="minimumPurchaseQuantity"
              placeholder="Placeholder"
              value={form.minimumPurchaseQuantity}
              onChange={handleInputChange}
              className={inputClass("minimumPurchaseQuantity")}
            />
            {errors.minimumPurchaseQuantity && (
              <p className="text-red-500 text-xs">
                {errors.minimumPurchaseQuantity}
              </p>
            )}
          </div>

          {/* <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building2 size={16} className="text-gray-500" />
              Maximum Purchase Quantity
            </label>
            <input
              type="number"
              name="maximumPurchaseQuantity"
              placeholder="Placeholder"
              value={form.maximumPurchaseQuantity}
              onChange={handleInputChange}
              className={inputClass("maximumPurchaseQuantity")}
            />
          </div> */}
        </div>

        {/* Discount Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Discount Details
          </h2>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building2 size={16} className="text-gray-500" />
              Discount percentage %<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="discountPercentage"
              placeholder="Placeholder"
              value={form.discountPercentage}
              onChange={handleInputChange}
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
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              Validity Period
            </h2>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Calendar
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none z-10"
                  />
                  <input
                    type="text"
                    readOnly
                    value={formatDateDisplay(form.startDate)}
                    onClick={() => setShowDatePicker("startDate")}
                    placeholder="Select date"
                    className={`w-full h-12 pl-10 pr-3 bg-white rounded-xl border-2 transition-colors ${
                      errors.startDate ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:border-purple-600 text-sm text-gray-900 cursor-pointer`}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.startDate}
                    </p>
                  )}
                </div>
                <div className="flex-1 relative">
                  <Clock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10"
                  />
                  <input
                    type="text"
                    readOnly
                    value={formatTimeDisplay(form.startTime)}
                    onClick={() => setShowTimePicker("startTime")}
                    placeholder="Select time"
                    className={`w-full h-12 pl-10 pr-3 bg-white rounded-xl border-2 transition-colors ${
                      errors.startTime ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:border-purple-600 text-sm text-gray-900 cursor-pointer`}
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
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Calendar
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none z-10"
                  />
                  <input
                    type="text"
                    readOnly
                    value={formatDateDisplay(form.endDate)}
                    onClick={() => setShowDatePicker("endDate")}
                    placeholder="Select date"
                    className={`w-full h-12 pl-10 pr-3 bg-white rounded-xl border-2 transition-colors ${
                      errors.endDate ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:border-purple-600 text-sm text-gray-900 cursor-pointer`}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.endDate}
                    </p>
                  )}
                </div>
                <div className="flex-1 relative">
                  <Clock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10"
                  />
                  <input
                    type="text"
                    readOnly
                    value={formatTimeDisplay(form.endTime)}
                    onClick={() => setShowTimePicker("endTime")}
                    placeholder="Select time"
                    className={`w-full h-12 pl-10 pr-3 bg-white rounded-xl border-2 transition-colors ${
                      errors.endTime ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:border-purple-600 text-sm text-gray-900 cursor-pointer`}
                  />
                  {errors.endTime && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.endTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              This discount will apply for orders above (MPQ to MXPQ) units from
              (Start Date &amp; Time to End Date &amp; Time)
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <button
          onClick={handleCancel}
          className="w-27 h-10 rounded-lg border-2 border-[#FF3B3B] text-[#FF3B3B] font-semibold text-label-l2 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="w-33.25 h-10 bg-[#4B0082] rounded-lg text-white font-semibold text-label-l2 cursor-pointer"
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

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePickerModal
          value={showDatePicker === "startDate" ? form.startDate : form.endDate}
          onChange={(date) => {
            const field = showDatePicker as string;

            const updated = { ...form, [field]: date };
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
          onClose={() => setShowDatePicker(null)}
        />
      )}
    </div>
  );
};

export default AdditionalDiscount;
