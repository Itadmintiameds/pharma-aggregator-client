"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type MonthPickerProps = {
  value?: number;
  year?: number;
  onChange?: (month: number, year: number) => void;
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function MonthPicker({
  value = new Date().getMonth(),
  year = new Date().getFullYear(),
  onChange,
}: MonthPickerProps) {
  const [selectedMonth, setSelectedMonth] = useState(value);
  const [selectedYear, setSelectedYear] = useState(year);

  const handleMonthClick = (index: number) => {
    setSelectedMonth(index);
    onChange?.(index, selectedYear);
  };

  const prevYear = () => {
    setSelectedYear((prev) => prev - 1);
  };

  const nextYear = () => {
    setSelectedYear((prev) => prev + 1);
  };

  return (
    <div className="w-[320px] rounded-xl bg-white shadow-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevYear}
          className="h-10 w-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
        >
          <ChevronLeft size={18} />
        </button>

        <h2 className="text-lg font-medium text-gray-800">
          {selectedYear}
        </h2>

        <button
          onClick={nextYear}
          className="h-10 w-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-4 gap-3">
        {months.map((month, index) => (
          <button
            key={month}
            onClick={() => handleMonthClick(index)}
            className={`rounded-lg py-2 text-sm font-medium transition
              ${
                selectedMonth === index
                  ? "bg-violet-200 text-violet-900 border border-violet-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {month}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 border-t pt-4 flex justify-end gap-3">
        <button className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100">
          Cancel
        </button>

        <button
          className="rounded-lg bg-purple-700 text-white px-4 py-2 hover:bg-purple-800"
          onClick={() => onChange?.(selectedMonth, selectedYear)}
        >
          Done
        </button>
      </div>
    </div>
  );
}