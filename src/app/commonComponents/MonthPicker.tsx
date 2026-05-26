"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  selectedMonth?: number;
  selectedYear?: number;
  onSelect: (month: number, year: number) => void;
  onClose: () => void;
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
  selectedMonth = new Date().getMonth(),
  selectedYear = new Date().getFullYear(),
  onSelect,
  onClose,
}: Props) {
  return (
    <div className="absolute z-50 mt-2 w-[320px] rounded-xl border bg-white p-5 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelect(selectedMonth, selectedYear - 1)}
          className="w-8 h-8 border-pneutral-200 rounded-lg border flex items-center justify-center"
        >
          <img src="/icons/CalendarLeft.svg" alt="search" className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-medium">{selectedYear}</h2>

        <button
          type="button"
          onClick={() => onSelect(selectedMonth, selectedYear + 1)}
           className="w-8 h-8 border-pneutral-200 rounded-lg border flex items-center justify-center"
        >
          <img src="/icons/CalendarRight.svg" alt="search" className="w-4 h-4" />
        </button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-4 gap-3">
        {months.map((month, index) => (
          <button
            key={month}
            type="button"
            onClick={() => onSelect(index, selectedYear)}
            className={`rounded-lg py-2 text-sm
              ${
                selectedMonth === index
                  ? "border border-purple-500 bg-purple-200 text-purple-900"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
          >
            {month}
          </button>
        ))}
      </div>

      <div className="mt-5 flex justify-end border-t pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-purple-700 px-4 py-2 text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
}
