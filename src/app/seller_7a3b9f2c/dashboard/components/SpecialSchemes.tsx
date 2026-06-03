import { SpecialSchemesData } from "@/src/types/product/ProductData";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import Select, { StylesConfig } from "react-select";
import { formatDate } from "../commonComponent/DateFormat";
import DatePicker from "@/src/app/commonComponents/DatePicker";

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
};

const SpecialSchemes = forwardRef<SpecialSchemesRef, SpecialSchemesProps>(
  ({ initialData, onSave, alwaysActive }, ref) => {
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
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    React.useEffect(() => {
      if (initialData) {
        setTableData(initialData);
      }
    }, [initialData]);

    const columns: ColumnDef<SpecialSchemesData>[] = [
      {
        accessorKey: "schemeName",
        header: "Name",
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
        cell: () => (
          <div className="flex gap-3 justify-center">
            <img
              src="/icons/EditIcon.svg"
              alt="edit"
              className="w-4 h-4"
            />
            <img
              src="/icons/DeleteIcon.svg"
              alt="delete"
              className="w-4 h-4"
            />
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

      const [day, month, year] = dateStr.split("/");

      return `${year}-${month}-${day}`;
    };

    const handleSubmit = () => {
      const validationErrors = validateForm();

      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) return;

      const payload = {
        ...form,
        effectiveStartDate: formatDateForApi(form.effectiveStartDate),
        effectiveEndDate: formatDateForApi(form.effectiveEndDate),
      };

      // table UI keeps dd/mm/yyyy
      const updatedTableData = [...tableData, form];
      setTableData(updatedTableData);

      // backend gets yyyy-mm-dd
      if (onSave) {
        onSave([...tableData, payload]);
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
    };

    useImperativeHandle(ref, () => ({
      submitForm: handleSubmit,
    }));

    return (
      <>
        <div className="flex flex-col gap-7">
          {tableData.length > 0 && (
            <div>
              <div className="border rounded-xl border-pneutral-300 overflow-hidden">
                <table className="w-full text-label-l3 border-collapse">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-label-l3 text-neutral-900 border border-pneutral-300"
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

              <div className="flex justify-end mt-3">
                <button className="w-33.25 h-10 border-[1.5px] rounded-lg border-secondary-700 text-secondary-700 text-lable-l3 font-medium">
                  Apply
                </button>
              </div>

              <div className="text-label-l4 font-semibold text-center m-3">
                OR
              </div>
            </div>
          )}

          <form autoComplete="off" className="flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="" className="text-label-l4 font-medium">
                  Scheme Name
                </label>
                <input
                  type="text"
                  name="schemeName"
                  id="schemeName"
                  value={form.schemeName}
                  onChange={handleInputChange}
                  maxLength={50}
                  className="w-113.25 h-12 border border-pneutral-300 rounded-lg p-4 focus:outline-none"
                />
                {errors.schemeName && (
                  <p className="text-warning-500 text-xs mt-1">
                    {errors.schemeName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-label-l5 font-medium">DISCOUNT DETAILS</div>
              <div className="flex gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="" className="text-label-l4 font-medium">
                    Buy Quantity
                  </label>

                  <input
                    type="text"
                    name="buyQuantity"
                    id="buyQuantity"
                    value={form.buyQuantity || ""}
                    onChange={handleInputChange}
                    className="w-[220.5px] h-12 border border-pneutral-300 rounded-lg p-4 focus:outline-none"
                  />
                  {errors.buyQuantity && (
                    <p className="text-warning-500 text-xs mt-1">
                      {errors.buyQuantity}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="" className="text-label-l4 font-medium">
                    Free Quantity
                  </label>
                  <input
                    type="text"
                    name="freeQuantity"
                    id="freeQuantity"
                    value={form.freeQuantity || ""}
                    onChange={handleInputChange}
                    className="w-[220.5px] h-12 border border-pneutral-300 rounded-lg p-4 focus:outline-none"
                  />

                  {errors.freeQuantity && (
                    <p className="text-warning-500 text-xs mt-1">
                      {errors.freeQuantity}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-label-l5 font-medium">VALIDITY PERIOD</div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor=""
                  className="text-label-l4 font-medium  text-pneutral-700"
                >
                  Start Date
                </label>
                <div className="flex gap-3">
                  <div className="relative flex flex-col">
                    <input
                      type="text"
                      name="effectiveStartDate"
                      id="effectiveStartDate"
                      readOnly
                      disabled={alwaysActive}
                      placeholder="dd/mm/yyyy"
                      value={form.effectiveStartDate || ""}
                      onClick={() =>
                        !alwaysActive && setShowStartDatePicker(true)
                      }
                      className={`w-[220.5px] h-12 border rounded-lg p-4 focus:outline-none ${
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

                          setShowStartDatePicker(false);
                        }}
                        onClose={() => setShowStartDatePicker(false)}
                      />
                    )}

                    {errors.effectiveStartDate && (
                      <p className="text-warning-500 text-xs mt-1">
                        {errors.effectiveStartDate}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <input
                      type="time"
                      name="effectiveStartTime"
                      id="effectiveStartTime"
                      value={form.effectiveStartTime || ""}
                      onChange={handleInputChange}
                      disabled={alwaysActive}
                      className={`w-[220.5px] h-12 border rounded-lg p-4 focus:outline-none ${
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
                  className="text-label-l3=4 font-medium text-pneutral-700"
                >
                  End Date
                </label>
                <div className="flex gap-3">
                  {/* <div className="flex flex-col">
                  <input
                    type="date"
                    name="effectiveEndDate"
                    id="effectiveEndDate"
                    value={form.effectiveEndDate || ""}
                    onChange={handleInputChange}
                    disabled={alwaysActive}
                    className={`w-[220.5px] h-12 border rounded-lg p-4 focus:outline-none ${
                      alwaysActive
                        ? "bg-pneutral-100 cursor-not-allowed border-pneutral-200"
                        : "border-pneutral-300"
                    }`}
                  />
                  {errors.effectiveEndDate && (
                    <p className="text-warning-500 text-xs mt-1">
                      {errors.effectiveEndDate}
                    </p>
                  )}
                </div> */}
                  <div className="relative flex flex-col">
                    <input
                      type="text"
                      name="effectiveEndDate"
                      id="effectiveEndDate"
                      readOnly
                      disabled={alwaysActive}
                      placeholder="dd/mm/yyyy"
                      value={form.effectiveEndDate || ""}
                      onClick={() =>
                        !alwaysActive && setShowEndDatePicker(true)
                      }
                      className={`w-[220.5px] h-12 border rounded-lg p-4 focus:outline-none ${
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

                  <div className="flex flex-col">
                    <input
                      type="time"
                      name="effectiveEndTime"
                      id="effectiveEndTime"
                      value={form.effectiveEndTime || ""}
                      onChange={handleInputChange}
                      disabled={alwaysActive}
                      className={`w-[220.5px] h-12 border rounded-lg p-4 focus:outline-none ${
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

export default SpecialSchemes;
