"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  selectedMonth?: number;
  selectedYear?: number;
  onSelect: (month: number, year: number) => void;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
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
  minDate,
  maxDate,
}: Props) {
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);

  const pickerRef = useRef<HTMLDivElement>(null);

  const isMonthDisabled = (monthIndex: number) => {
    const date = new Date(tempYear, monthIndex, 1);

    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    return false;
  };

  const handleDone = () => {
    onSelect(tempMonth, tempYear);
    onClose();
  };

  // close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute z-50 mt-2 w-71 h-61 rounded-lg border border-pneutral-100 bg-white p-3 shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setTempYear((prev) => prev - 1)}
          className="w-8 h-8 border-pneutral-200 rounded-lg border flex items-center justify-center"
        >
          <img src="/icons/CalendarLeft.svg" className="w-4 h-4" />
        </button>

        <h2 className="text-p3 font-medium text-pneutral-900">{tempYear}</h2>

        <button
          type="button"
          onClick={() => setTempYear((prev) => prev + 1)}
          className="w-8 h-8 border-pneutral-200 rounded-lg border flex items-center justify-center"
        >
          <img src="/icons/CalendarRight.svg" className="w-4 h-4" />
        </button>
      </div>

      {/* <div className="grid grid-cols-4 gap-3">
        {months.map((month, index) => (
          <button
            key={month}
            type="button"
            onClick={() => setTempMonth(index)}
            className={`rounded-lg py-2 text-p3 text-pneutral-900 ${
              tempMonth === index
                ? "border border-primary-900 bg-secondary-300"
                : "bg-pneutral-50"
            }`}
          >
            {month}
          </button>
        ))}
      </div> */}

      <div className="grid grid-cols-4 gap-3">
        {months.map((month, index) => {
          const disabled = isMonthDisabled(index);

          return (
            <button
              key={month}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  setTempMonth(index);
                }
              }}
              className={`rounded-lg py-2 text-p3 ${
                disabled
                  ? "bg-pneutral-50 text-pneutral-400 cursor-not-allowed opacity-50"
                  : tempMonth === index
                    ? "border border-primary-900 bg-secondary-300 text-pneutral-900"
                    : "bg-pneutral-50 text-pneutral-900"
              }`}
            >
              {month}
            </button>
          );
        })}
      </div>

      <div className="mt-2 py-2 flex justify-end border-t border-pneutral-200 gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="w-15.25 h-8 rounded-lg border border-pneutral-200"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDone}
          className="w-13 h-8 rounded-lg bg-primary-900 text-white shadow-[inset_0px_-2px_2px_0px_#3030301A,inset_0px_12px_12px_0px_#FFFFFF1F]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

