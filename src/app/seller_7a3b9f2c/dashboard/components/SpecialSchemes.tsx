import { SpecialSchemesData } from "@/src/types/product/ProductData";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import Select, { StylesConfig } from "react-select";
import { formatDate } from "../commonComponent/DateFormat";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

type OptionType = {
  value: string;
  label: string;
};

// const schemeOptions: OptionType[] = [
//   {
//     value: "buy_x_get_y_free",
//     label: "Buy X Get Y Free",
//   },
// ];

const customStyles: StylesConfig<OptionType, false> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "48px",
    width: "453px",
    borderRadius: "8px",
    borderColor: state.isFocused ? "#BF6BFF" : "#C0C1BE",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#BF6BFF",
    },
    paddingLeft: "4px",
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#EBCEFF" : "#fff",
    color: "#111827",
    cursor: "pointer",
  }),
};

export type SpecialSchemesRef = {
  submitForm: () => void;
};

type SpecialSchemesProps = {
  initialData?: SpecialSchemesData[];
  onSave?: (data: SpecialSchemesData[]) => void;
  alwaysActive: boolean;
  setAlwaysActive: React.Dispatch<React.SetStateAction<boolean>>;
  editIndex?: number | null;
};

const SpecialSchemes = forwardRef<SpecialSchemesRef, SpecialSchemesProps>(
  ({ initialData, onSave, alwaysActive, setAlwaysActive, editIndex }, ref) => {
    const [form, setForm] = useState<SpecialSchemesData>({
      schemeName: "",
      schemeType: "",
      buyQuantity: 0,
      freeQuantity: 0,
      effectiveStartDate: "",
      effectiveStartTime: "",
      effectiveEndDate: "",
      effectiveEndTime: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [tableData, setTableData] = useState<SpecialSchemesData[]>(
      initialData || [],
    );

    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    useEffect(() => {
      setTableData(initialData || []);
    }, [initialData]);

    useEffect(() => {
      if (editIndex !== undefined && editIndex !== null) {
        handleEditRow(editIndex);
      }
    }, [editIndex]);

    const columns: ColumnDef<SpecialSchemesData>[] = [
      {
        accessorKey: "schemeName",
        header: "Name",
        cell: ({ row, getValue }) => {
          const isSelected =
            row.original.displayOfferScheme ??
            row.original.isSelected !== false;
          return (
            <div className="flex items-center justify-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  setTableData((prev) =>
                    prev.map((scheme, i) =>
                      i === row.index
                        ? {
                            ...scheme,
                            displayOfferScheme: e.target.checked,
                            isSelected: e.target.checked,
                          }
                        : scheme,
                    ),
                  );
                }}
                className="w-4 h-4 rounded border-neutral-300 cursor-pointer"
              />
              <span>{String(getValue())}</span>
            </div>
          );
        },
      },
      // {
      //   accessorKey: "schemeType",
      //   header: "Type",
      // },
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
        cell: ({ row }) => (
          <div className="flex gap-1 justify-center">
            <button
              type="button"
              aria-label="Edit"
              onClick={() => handleEditRow(row.index)}
              className="p-1.5 rounded-md hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
            >
              <img src="/icons/EditIcon.svg" alt="" className="w-4 h-4" />
            </button>

            <button
              type="button"
              aria-label="Delete"
              onClick={() => handleDeleteRow(row.index)}
              className="p-1.5 rounded-md hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
            >
              <img src="/icons/DeleteIcon.svg" alt="" className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ];

    const table = useReactTable({
      data: tableData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    const parseDate = (value: string) => {
      if (!value) return null;

      const [day, month, year] = value.split("/");

      return new Date(Number(year), Number(month) - 1, Number(day));
    };

    const formatDateToDDMMYYYY = (date: Date | null) => {
      if (!date) return "";
      return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}/${date.getFullYear()}`;
    };

    const validateForm = (
      updatedForm: SpecialSchemesData = form,
      fieldName?: string,
    ) => {
      const newErrors: Record<string, string> = {};

      // Scheme Name
      if (
        (!fieldName || fieldName === "schemeName") &&
        !updatedForm.schemeName.trim()
      ) {
        newErrors.schemeName = "Scheme Name is required";
      }

      // Scheme Type
      // if (
      //   (!fieldName || fieldName === "schemeType") &&
      //   !updatedForm.schemeType.trim()
      // ) {
      //   newErrors.schemeType = "Scheme Type is required";
      // }

      // Buy Quantity
      if (!fieldName || fieldName === "buyQuantity") {
        if (!updatedForm.buyQuantity || updatedForm.buyQuantity <= 0) {
          newErrors.buyQuantity = "Buy Quantity must be greater than 0";
        } else if (
          updatedForm.freeQuantity > 0 &&
          updatedForm.buyQuantity < updatedForm.freeQuantity
        ) {
          newErrors.buyQuantity =
            "Buy Quantity cannot be less than Free Quantity";
        }
      }

      // Free Quantity
      if (!fieldName || fieldName === "freeQuantity") {
        if (!updatedForm.freeQuantity || updatedForm.freeQuantity <= 0) {
          newErrors.freeQuantity = "Free Quantity must be greater than 0";
        } else if (
          updatedForm.buyQuantity > 0 &&
          updatedForm.freeQuantity > updatedForm.buyQuantity
        ) {
          newErrors.freeQuantity = "Free Quantity cannot exceed Buy Quantity";
        }
      }

      if (!alwaysActive) {
        // Start Date
        if (!fieldName || fieldName === "effectiveStartDate") {
          if (!updatedForm.effectiveStartDate) {
            newErrors.effectiveStartDate = "Start Date is required";
          } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const startDate = parseDate(updatedForm.effectiveStartDate);

            if (startDate) {
              startDate.setHours(0, 0, 0, 0);

              if (startDate < today) {
                newErrors.effectiveStartDate =
                  "Start Date cannot be less than today";
              }
            }
          }
        }

        // Start Time
        if (
          (!fieldName || fieldName === "effectiveStartTime") &&
          !updatedForm.effectiveStartTime
        ) {
          newErrors.effectiveStartTime = "Start Time is required";
        }

        // End Date
        if (
          (!fieldName || fieldName === "effectiveEndDate") &&
          !updatedForm.effectiveEndDate
        ) {
          newErrors.effectiveEndDate = "End Date is required";
        }

        // End Time
        if (
          (!fieldName || fieldName === "effectiveEndTime") &&
          !updatedForm.effectiveEndTime
        ) {
          newErrors.effectiveEndTime = "End Time is required";
        }

        // End Date >= Start Date
        if (updatedForm.effectiveStartDate && updatedForm.effectiveEndDate) {
          const startDate = parseDate(updatedForm.effectiveStartDate);

          const endDate = parseDate(updatedForm.effectiveEndDate);

          if (startDate && endDate) {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            if (endDate < startDate) {
              newErrors.effectiveEndDate =
                "End Date must be greater than or equal to Start Date";
            }
          }
        }
      }

      return newErrors;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      const updatedForm = {
        ...form,
        [name]:
          name === "buyQuantity" || name === "freeQuantity"
            ? Number(value)
            : value,
      };

      setForm(updatedForm);

      const updatedTouched = {
        ...touched,
        [name]: true,
      };

      setTouched(updatedTouched);

      const fieldErrors = validateForm(updatedForm, name);

      setErrors((prev) => {
        const updatedErrors = { ...prev };

        delete updatedErrors[name];

        if (fieldErrors[name]) {
          updatedErrors[name] = fieldErrors[name];
        }

        return updatedErrors;
      });
    };

    const formatDateForApi = (dateStr: string | null) => {
      if (!dateStr) return "";

      if (dateStr.includes("-")) {
        return dateStr.split("T")[0];
      }

      const [day, month, year] = dateStr.split("/");
      return `${year}-${month}-${day}`;
    };

    const handleSubmit = () => {
      const isFormEmpty =
        !form.schemeName &&
        !form.buyQuantity &&
        !form.freeQuantity &&
        (!form.effectiveStartDate || alwaysActive);

      if (isFormEmpty) {
        if (onSave) onSave(tableData);
        return;
      }

      const validationErrors = validateForm();

      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) return;

      const payload = {
        ...form,
        effectiveStartDate: formatDateForApi(form.effectiveStartDate),
        effectiveEndDate: formatDateForApi(form.effectiveEndDate),
      };
      let updatedTableData: SpecialSchemesData[];

      if (editingIndex !== null) {
        updatedTableData = [...tableData];

        updatedTableData[editingIndex] = {
          ...updatedTableData[editingIndex],
          ...form,
        };

        setEditingIndex(null);
      } else {
        updatedTableData = [...tableData, form];
      }

      setTableData(updatedTableData);

      if (onSave) {
        const apiData = updatedTableData.map((item) => ({
          ...item,
          effectiveStartDate: item.effectiveStartDate
            ? formatDateForApi(item.effectiveStartDate)
            : "",
          effectiveEndDate: item.effectiveEndDate
            ? formatDateForApi(item.effectiveEndDate)
            : "",
        }));

        onSave(apiData);
      }

      setForm({
        schemeName: "",
        schemeType: "",
        buyQuantity: 0,
        freeQuantity: 0,
        effectiveStartDate: "",
        effectiveStartTime: "",
        effectiveEndDate: "",
        effectiveEndTime: "",
      });

      setErrors({});
      setTouched({});
      setEditingIndex(null);
    };

    useImperativeHandle(ref, () => ({
      submitForm: handleSubmit,
    }));

    const handleDeleteRow = (rowIndex: number) => {
      const updatedTableData = tableData.filter(
        (_, index) => index !== rowIndex,
      );

      setTableData(updatedTableData);

      if (onSave) {
        onSave(updatedTableData);
      }
    };

    const handleEditRow = (rowIndex: number) => {
      const scheme = tableData[rowIndex];

      const isAlwaysActiveRecord =
        !scheme.effectiveStartDate &&
        !scheme.effectiveStartTime &&
        !scheme.effectiveEndDate &&
        !scheme.effectiveEndTime;

      setAlwaysActive(isAlwaysActiveRecord);

      setForm({
        schemeName: scheme.schemeName || "",
        schemeType: scheme.schemeType || "",
        buyQuantity: scheme.buyQuantity || 0,
        freeQuantity: scheme.freeQuantity || 0,

        effectiveStartDate: scheme.effectiveStartDate
          ? formatDate(scheme.effectiveStartDate)
          : "",

        effectiveStartTime: scheme.effectiveStartTime || "",

        effectiveEndDate: scheme.effectiveEndDate
          ? formatDate(scheme.effectiveEndDate)
          : "",

        effectiveEndTime: scheme.effectiveEndTime || "",
      });

      setEditingIndex(rowIndex);
      setErrors({});
      setTouched({});
    };

    return (
      <>
        <div className="flex flex-col gap-3">
          {tableData.length > 0 && (
            <div>
              <div className="border rounded-xl border-neutral-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs border-collapse">
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

              <div className="flex justify-end mt-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (onSave) onSave(tableData);
                  }}
                  className="h-9 px-5 border-[1.5px] rounded-lg border-primary-900 text-primary-900 hover:bg-primary-50 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                >
                  Apply
                </button>
              </div>

              <div className="text-xs font-semibold text-neutral-500 text-center my-2">
                OR
              </div>
            </div>
          )}

          <form autoComplete="off" className="flex flex-col gap-3">
            <div className="flex flex-col">
              <div className="flex flex-col gap-1">
                <label htmlFor="" className="text-xs font-semibold text-neutral-700">
                  Scheme Name
                </label>
                <input
                  type="text"
                  name="schemeName"
                  id="schemeName"
                  value={form.schemeName}
                  onChange={handleInputChange}
                  maxLength={50}
                  className="w-full h-9 border border-neutral-300 rounded-lg px-3 text-[13px] focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-100"
                />
                {errors.schemeName && (
                  <p className="text-warning-500 text-xs mt-1">
                    {errors.schemeName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[13px] font-bold text-neutral-800">DISCOUNT DETAILS</div>
              <div className="flex gap-3">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <label htmlFor="" className="text-xs font-semibold text-neutral-700">
                    Buy Quantity
                  </label>

                  <input
                    type="text"
                    name="buyQuantity"
                    id="buyQuantity"
                    value={form.buyQuantity || ""}
                    onChange={handleInputChange}
                    className="w-full h-9 border border-neutral-300 rounded-lg px-3 text-[13px] focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-100"
                  />
                  {errors.buyQuantity && (
                    <p className="text-warning-500 text-xs mt-1">
                      {errors.buyQuantity}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <label htmlFor="" className="text-xs font-semibold text-neutral-700">
                    Free Quantity
                  </label>
                  <input
                    type="text"
                    name="freeQuantity"
                    id="freeQuantity"
                    value={form.freeQuantity || ""}
                    onChange={handleInputChange}
                    className="w-full h-9 border border-neutral-300 rounded-lg px-3 text-[13px] focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-100"
                  />

                  {errors.freeQuantity && (
                    <p className="text-warning-500 text-xs mt-1">
                      {errors.freeQuantity}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[13px] font-bold text-neutral-800">VALIDITY PERIOD</div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor=""
                  className="text-xs font-semibold text-neutral-700"
                >
                  Start Date
                </label>
                <div className="flex gap-3">
                  <div className="relative flex flex-col flex-1 min-w-0">
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={parseDate(form.effectiveStartDate || "")}
                        disabled={alwaysActive}
                        format="dd/MM/yyyy"
                        onChange={(date) => {
                          const formattedDate = formatDateToDDMMYYYY(date);

                          const updatedForm = {
                            ...form,
                            effectiveStartDate: formattedDate,
                          };

                          setForm(updatedForm);

                          setTouched((prev) => ({
                            ...prev,
                            effectiveStartDate: true,
                          }));

                          const validationErrors = validateForm(
                            updatedForm,
                            "effectiveStartDate",
                          );

                          setErrors((prev) => ({
                            ...prev,
                            effectiveStartDate:
                              validationErrors.effectiveStartDate || "",
                          }));
                        }}
                        slotProps={{
                          field: {
                            clearable: true,
                          },
                          actionBar: {
                            actions: ["clear"],
                          },
                          textField: {
                            placeholder: "dd/mm/yyyy",
                            error: !!errors.effectiveStartDate,
                            sx: {
                              width: "100%",
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

                    {errors.effectiveStartDate && (
                      <p className="text-warning-500 text-xs mt-1">
                        {errors.effectiveStartDate}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <input
                      type="time"
                      name="effectiveStartTime"
                      id="effectiveStartTime"
                      value={form.effectiveStartTime || ""}
                      onChange={handleInputChange}
                      disabled={alwaysActive}
                      className={`w-full h-9 border rounded-lg px-3 text-[13px] focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-100 ${
                        alwaysActive
                          ? "bg-neutral-100 cursor-not-allowed border-neutral-200"
                          : "border-neutral-300"
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
                  className="text-xs font-semibold text-neutral-700"
                >
                  End Date
                </label>
                <div className="flex gap-3">
                  <div className="relative flex flex-col flex-1 min-w-0">
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={parseDate(form.effectiveEndDate || "")}
                        disabled={alwaysActive}
                        format="dd/MM/yyyy"
                        onChange={(date) => {
                          const formattedDate = formatDateToDDMMYYYY(date);

                          const updatedForm = {
                            ...form,
                            effectiveEndDate: formattedDate,
                          };

                          setForm(updatedForm);

                          setTouched((prev) => ({
                            ...prev,
                            effectiveEndDate: true,
                          }));

                          const validationErrors = validateForm(
                            updatedForm,
                            "effectiveEndDate",
                          );

                          setErrors((prev) => ({
                            ...prev,
                            effectiveEndDate:
                              validationErrors.effectiveEndDate || "",
                          }));
                        }}
                        slotProps={{
                          field: {
                            clearable: true,
                          },
                          actionBar: {
                            actions: ["clear"],
                          },
                          textField: {
                            placeholder: "dd/mm/yyyy",
                            error: !!errors.effectiveEndDate,
                            sx: {
                              width: "100%",
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
                      value={form.effectiveEndTime || ""}
                      onChange={handleInputChange}
                      disabled={alwaysActive}
                      className={`w-full h-9 border rounded-lg px-3 text-[13px] focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-100 ${
                        alwaysActive
                          ? "bg-neutral-100 cursor-not-allowed border-neutral-200"
                          : "border-neutral-300"
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
          <div className="text-xs text-neutral-500">
            This discount will apply for orders above (MPQ to MXPQ) units from
            (Start Date & Time to End Date & Time)
          </div>
        </div>
      </>
    );
  },
);

export default SpecialSchemes;
