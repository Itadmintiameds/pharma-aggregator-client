import { AdditionalDiscountData } from "@/src/types/product/ProductData";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { FormState } from "react-hook-form";
import { formatDate } from "../commonComponent/DateFormat";
import DatePicker from "@/src/app/commonComponents/DatePicker";

type AdditionalDiscountNewProps = {
  initialData: AdditionalDiscountData[];
  baseDiscountPercentage: number;
  baseMinimumOrderQuantity: number;
  onSave: (data: AdditionalDiscountData[]) => void;
  alwaysActive: boolean;
};

type AdditionalDiscountForm = {
  minimumPurchaseQuantity: number;
  discountPercentage: number;
  effectiveStartDate: string;
  effectiveStartTime: string;
  effectiveEndDate: string;
  effectiveEndTime: string;
  alwaysActive: boolean;
};

export type AdditionalDiscountNewRef = {
  submitForm: () => void;
};

const AdditionalDiscountNew = forwardRef<
  AdditionalDiscountNewRef,
  AdditionalDiscountNewProps
>(
  (
    {
      initialData,
      baseDiscountPercentage,
      baseMinimumOrderQuantity,
      onSave,
      alwaysActive,
    }: AdditionalDiscountNewProps,
    ref,
  ) => {
    const EMPTY_FORM: AdditionalDiscountForm = {
      minimumPurchaseQuantity: 0,
      discountPercentage: 0,
      effectiveStartDate: "",
      effectiveStartTime: "",
      effectiveEndDate: "",
      effectiveEndTime: "",
      alwaysActive: false,
    };

    const [form, setForm] = useState<AdditionalDiscountForm>(EMPTY_FORM);
    const [slabs, setSlabs] = useState<AdditionalDiscountData[]>(
      initialData || [],
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const formContainerRef = React.useRef<HTMLDivElement>(null);

    const columns: ColumnDef<AdditionalDiscountData>[] = [
      {
        accessorKey: "minimumPurchaseQuantity",
        header: "Min Qt",
        cell: ({ row, getValue }) => {
          const isSelected = row.original.displayOffer ?? row.original.isSelected !== false;
          return (
            <div className="flex items-center justify-center gap-2">
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={(e) => {
                  setSlabs(prev => prev.map((slab, i) => 
                    i === row.index ? { ...slab, displayOffer: e.target.checked, isSelected: e.target.checked } : slab
                  ));
                }}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer" 
              />
              <span>{String(getValue())}</span>
            </div>
          );
        }
      },
      {
        accessorKey: "additionalDiscountPercentage",
        header: "Disc %",
        cell: (info) => `${info.getValue()}%`,
      },
      {
        accessorKey: "effectiveStartDate",
        header: "Start Date",
        cell: (info) => formatDate(info.getValue() as string),
      },
      {
        accessorKey: "effectiveEndDate",
        header: "End Date",
        cell: (info) => formatDate(info.getValue() as string),
      },
      {
        id: "actions",
        header: "Action",
        cell: () => (
          <div className="flex gap-3">
            <img
              src="/icons/EditIcon.svg"
              alt="edit"
              className="w-4 h-4 rounded-md object-cover"
            />
            <img
              src="/icons/DeleteIcon.svg"
              alt="delete"
              className="w-4 h-4 rounded-md object-cover"
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
      updatedForm: AdditionalDiscountForm,
      touched: Record<string, boolean>,
    ) => {
      const errors: Record<string, string> = {};

      if (alwaysActive) return errors;

      const {
        effectiveStartDate,
        effectiveEndDate,
        effectiveStartTime,
        effectiveEndTime,
      } = updatedForm;

      const parseDate = (value: string) => {
        if (!value) return null;

        const [day, month, year] = value.split("/");

        return new Date(Number(year), Number(month) - 1, Number(day));
      };

      if (touched.effectiveStartDate && !effectiveStartDate) {
        errors.effectiveStartDate = "Start Date is required";
      }

      if (touched.effectiveEndDate && !effectiveEndDate) {
        errors.effectiveEndDate = "End Date is required";
      }

      if (touched.effectiveStartTime && !effectiveStartTime) {
        errors.effectiveStartTime = "Start Time is required";
      }

      if (touched.effectiveEndTime && !effectiveEndTime) {
        errors.effectiveEndTime = "End Time is required";
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sDate = effectiveStartDate ? parseDate(effectiveStartDate) : null;

      const eDate = effectiveEndDate ? parseDate(effectiveEndDate) : null;

      if (sDate && sDate < today && touched.effectiveStartDate) {
        errors.effectiveStartDate = "Start Date cannot be in the past";
      }

      if (eDate && eDate < today && touched.effectiveEndDate) {
        errors.effectiveEndDate = "End Date cannot be in the past";
      }

      if (sDate && eDate && sDate > eDate) {
        if (touched.effectiveStartDate) {
          errors.effectiveStartDate = "Start Date must be ≤ End Date";
        }

        if (touched.effectiveEndDate) {
          errors.effectiveEndDate = "End Date must be ≥ Start Date";
        }
      }

      if (
        effectiveStartDate &&
        effectiveEndDate &&
        effectiveStartDate === effectiveEndDate &&
        effectiveStartTime &&
        effectiveEndTime
      ) {
        if (effectiveStartTime >= effectiveEndTime) {
          if (touched.effectiveStartTime) {
            errors.effectiveStartTime = "Start Time must be less than End Time";
          }

          if (touched.effectiveEndTime) {
            errors.effectiveEndTime =
              "End Time must be greater than Start Time";
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
              newErrors.minimumPurchaseQuantity =
                "This value is already entered";
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
              newErrors.discountPercentage =
                "Must be greater than previous slab";
            } else if (
              slabs.some(
                (s) => s.additionalDiscountPercentage === Number(value),
              )
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
      delete newErrors.effectiveStartDate;
      delete newErrors.effectiveEndDate;
      delete newErrors.effectiveStartTime;
      delete newErrors.effectiveEndTime;

      const dateErrors = validateDateTime(updatedForm, updatedTouched);

      // ✅ Step 4: apply fresh errors only
      newErrors = {
        ...newErrors,
        ...dateErrors,
      };

      setErrors(newErrors);
    };

    const validateForm = (): boolean => {
      const newErrors: Record<string, string> = {};

      const mpq = Number(form.minimumPurchaseQuantity);
      const discount = Number(form.discountPercentage);
      const baseMPQ = Number(baseMinimumOrderQuantity || 0);
      const baseDiscount = Number(baseDiscountPercentage || 0);

      // ✅ MPQ validation
      if (!form.minimumPurchaseQuantity) {
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
      if (!form.discountPercentage) {
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
      if (!alwaysActive) {
        if (!form.effectiveStartDate)
          newErrors.effectiveStartDate = "Start Date is required";
        if (!form.effectiveStartTime)
          newErrors.effectiveStartTime = "Start Time is required";
        if (!form.effectiveEndDate)
          newErrors.effectiveEndDate = "End Date is required";
        if (!form.effectiveEndTime)
          newErrors.effectiveEndTime = "End Time is required";
      }

      setErrors(newErrors);

      return Object.keys(newErrors).length === 0;
    };

    const formatDateForApi = (dateStr: string) => {
      if (!dateStr) return "";

      const [day, month, year] = dateStr.split("/");

      return `${year}-${month}-${day}`;
    };

    const handleSubmit = () => {
      const isFormEmpty = 
        !form.minimumPurchaseQuantity && 
        !form.discountPercentage && 
        (!form.effectiveStartDate || alwaysActive);

      if (isFormEmpty) {
        onSave(slabs);
        return;
      }

      const isValid = validateForm();

      if (!isValid) return;

      const slab: AdditionalDiscountData = {
        minimumPurchaseQuantity: Number(form.minimumPurchaseQuantity),
        additionalDiscountPercentage: Number(form.discountPercentage),
        effectiveStartDate: alwaysActive
          ? ""
          : formatDateForApi(form.effectiveStartDate),
        effectiveStartTime: alwaysActive ? "" : form.effectiveStartTime,
        effectiveEndDate: alwaysActive
          ? ""
          : formatDateForApi(form.effectiveEndDate),
        effectiveEndTime: alwaysActive ? "" : form.effectiveEndTime,
      };

      const updatedSlabs = [...slabs, slab];

      setSlabs(updatedSlabs);
      onSave(updatedSlabs);
      setForm(EMPTY_FORM);
      setErrors({});
    };

    useImperativeHandle(ref, () => ({
      submitForm: handleSubmit,
    }));

    useEffect(() => {
      setSlabs(initialData || []);
    }, [initialData]);

    return (
      <>
        <div
          ref={formContainerRef}
          className="flex flex-col gap-7 overflow-y-auto"
        >
          {slabs.length > 0 && (
            <div className="space-y-3">
              <div className="text-label-l5 font-medium">
                Use Existing Discounts
              </div>

              <div className="border rounded-xl border-pneutral-300 overflow-hidden">
                <table className="w-full text-label-l3 border-collapse">
                  {/* HEADER */}
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-lable-l2 font-semibold text-neutral-900 border border-pneutral-300"
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

                  <tbody>
                    {table.getRowModel().rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-pneutral-100"
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3 border border-pneutral-300 text-center"
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

              <div className="flex justify-end">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    onSave(slabs);
                  }}
                  className="w-33.25 h-10 border-[1.5px] rounded-lg border-secondary-700 text-secondary-700 text-lable-l3 font-medium"
                >
                  Apply
                </button>
              </div>

              <div className="text-label-l4 font-semibold text-center m-3">
                OR
              </div>
            </div>
          )}

          <form autoComplete="off"  className="flex flex-col gap-7">
            <div className="flex flex-col gap-4">
              <div className="text-label-l5 font-medium">
                Purchase Conditions
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="" className="text-label-l4 font-medium">
                  Minimum Purchase Quantity
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="minimumPurchaseQuantity"
                  id="minimumPurchaseQuantity"
                  value={form.minimumPurchaseQuantity || ""}
                  onChange={(e) => {
                    if (e.target.value.length <= 15) {
                      handleInputChange(e);
                    }
                  }}
                  min={1}
                  step="1"
                  onKeyDown={(e) => {
                    if (
                      e.key === "-" ||
                      e.key === "e" ||
                      e.key === "+" ||
                      e.key === "."
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full h-12 border border-pneutral-300 rounded-lg p-4 focus:outline-none"
                />
                {errors.minimumPurchaseQuantity && (
                  <p className="text-warning-500 text-xs">
                    {errors.minimumPurchaseQuantity}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-label-l5 font-medium">DISCOUNT DETAILS</div>
              <div className="flex flex-col gap-1">
                <label htmlFor="" className="text-label-l4 font-medium">
                  Discount %
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="discountPercentage"
                  id="discountPercentage"
                  value={form.discountPercentage || ""}
                  onChange={(e) => {
                    if (e.target.value.length <= 3) {
                      handleInputChange(e);
                    }
                  }}
                  min={1}
                  max={100}
                  step="1"
                  onKeyDown={(e) => {
                    if (
                      e.key === "-" ||
                      e.key === "e" ||
                      e.key === "+" ||
                      e.key === "."
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full h-12 border border-pneutral-300 rounded-lg p-4 focus:outline-none"
                />
                {errors.discountPercentage && (
                  <p className="text-warning-500 text-xs">
                    {errors.discountPercentage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-label-l5 font-medium">VALIDITY PERIOD</div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor=""
                  className="text-label-l4 font-medium text-pneutral-700"
                >
                  Start Date
                </label>
                <div className="flex w-full gap-3">
                  <div className="relative flex flex-col">
                    <input
                      type="text"
                      name="effectiveStartDate"
                      id="effectiveStartDate"
                      readOnly
                      disabled={alwaysActive}
                      placeholder="dd/mm/yyyy"
                      value={form.effectiveStartDate}
                      onClick={() => {
                        if (!alwaysActive) {
                          setShowStartDatePicker(true);

                          setTimeout(() => {
                            formContainerRef.current?.scrollBy({
                              top: 220,
                              behavior: "smooth",
                            });
                          }, 100);
                        }
                      }}
                      className={`w-full min-w-0 h-12 border rounded-lg p-4 focus:outline-none ${
                        alwaysActive
                          ? "bg-pneutral-100 cursor-not-allowed border-pneutral-200"
                          : "border-pneutral-300 cursor-pointer"
                      }`}
                    />

                    {showStartDatePicker && (
                      <DatePicker
                        selectedDate={
                          form.effectiveStartDate
                            ? new Date(
                                form.effectiveStartDate
                                  .split("/")
                                  .reverse()
                                  .join("-"),
                              )
                            : new Date()
                        }
                        onSelect={(date) => {
                          const formattedDate = `${String(
                            date.getDate(),
                          ).padStart(2, "0")}/${String(
                            date.getMonth() + 1,
                          ).padStart(2, "0")}/${date.getFullYear()}`;

                          const updatedForm = {
                            ...form,
                            effectiveStartDate: formattedDate,
                          };

                          const updatedTouched = {
                            ...touched,
                            effectiveStartDate: true,
                          };

                          setForm(updatedForm);
                          setTouched(updatedTouched);

                          const dateErrors = validateDateTime(
                            updatedForm,
                            updatedTouched,
                          );

                          setErrors((prev) => {
                            const updatedErrors = { ...prev };

                            delete updatedErrors.effectiveStartDate;
                            delete updatedErrors.effectiveEndDate;

                            return {
                              ...updatedErrors,
                              ...dateErrors,
                            };
                          });

                          setShowStartDatePicker(false);
                        }}
                        onClose={() => setShowStartDatePicker(false)}
                      />
                    )}

                    {errors.effectiveStartDate && (
                      <p className="mt-1 text-xs text-warning-500">
                        {errors.effectiveStartDate}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <input
                      type="time"
                      name="effectiveStartTime"
                      id="effectiveStartTime"
                      value={form.effectiveStartTime}
                      onChange={handleInputChange}
                      disabled={alwaysActive}
                      className={`w-full h-12 border rounded-lg p-4 focus:outline-none ${
                        alwaysActive
                          ? "bg-pneutral-100 cursor-not-allowed border-pneutral-200"
                          : "border-pneutral-300"
                      }`}
                    />
                    {errors.effectiveStartTime && (
                      <p className="text-warning-500 text-xs mt-1">
                        {errors.effectiveStartTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor=""
                  className="text-label-l4 font-medium text-pneutral-700"
                >
                  End Date
                </label>
                <div className="flex w-full gap-3">
                  <div className="relative flex flex-col">
                    <input
                      type="text"
                      name="effectiveEndDate"
                      id="effectiveEndDate"
                      readOnly
                      disabled={alwaysActive}
                      placeholder="dd/mm/yyyy"
                      value={form.effectiveEndDate}
                      onClick={() => {
                        if (!alwaysActive) {
                          setShowEndDatePicker(true);

                          setTimeout(() => {
                            formContainerRef.current?.scrollBy({
                              top: 220,
                              behavior: "smooth",
                            });
                          }, 100);
                        }
                      }}
                      className={`w-full min-w-0 h-12 border rounded-lg p-4 focus:outline-none ${
                        alwaysActive
                          ? "bg-pneutral-100 cursor-not-allowed border-pneutral-200"
                          : "border-pneutral-300 cursor-pointer"
                      }`}
                    />

                    {showEndDatePicker && (
                      <DatePicker
                        selectedDate={
                          form.effectiveEndDate
                            ? new Date(
                                form.effectiveEndDate
                                  .split("/")
                                  .reverse()
                                  .join("-"),
                              )
                            : new Date()
                        }
                        onSelect={(date) => {
                          const formattedDate = `${String(
                            date.getDate(),
                          ).padStart(2, "0")}/${String(
                            date.getMonth() + 1,
                          ).padStart(2, "0")}/${date.getFullYear()}`;

                          const updatedForm = {
                            ...form,
                            effectiveEndDate: formattedDate,
                          };

                          const updatedTouched = {
                            ...touched,
                            effectiveEndDate: true,
                          };

                          setForm(updatedForm);
                          setTouched(updatedTouched);

                          const dateErrors = validateDateTime(
                            updatedForm,
                            updatedTouched,
                          );

                          setErrors((prev) => {
                            const updatedErrors = { ...prev };

                            delete updatedErrors.effectiveStartDate;
                            delete updatedErrors.effectiveEndDate;

                            return {
                              ...updatedErrors,
                              ...dateErrors,
                            };
                          });

                          setShowEndDatePicker(false);
                        }}
                        onClose={() => setShowEndDatePicker(false)}
                      />
                    )}

                    {errors.effectiveEndDate && (
                      <p className="text-warning-500 text-xs mt-1">
                        {errors.effectiveEndDate}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <input
                      type="time"
                      name="effectiveEndTime"
                      id="effectiveEndTime"
                      value={form.effectiveEndTime}
                      onChange={handleInputChange}
                      disabled={alwaysActive}
                      className={`w-full h-12 border rounded-lg p-4 focus:outline-none ${
                        alwaysActive
                          ? "bg-pneutral-100 cursor-not-allowed border-pneutral-200"
                          : "border-pneutral-300"
                      }`}
                    />
                    {errors.effectiveEndTime && (
                      <p className="text-warning-500 text-xs mt-1">
                        {errors.effectiveEndTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="text-label-l3 font-medium text-neutral-700">
            This discount will apply for orders above (MPQ to MXPQ) units from
            (Start Date & Time to End Date & Time)
          </div>
        </div>
      </>
    );
  },
);

export default AdditionalDiscountNew;
